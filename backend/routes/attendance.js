const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const contract = require("../contract");
const checkRole = require("../middleware/checkRole");
const { db } = require("../firebase");

const attendancePath = path.join(__dirname, "../data/attendance.json");
const sessionPath = path.join(__dirname, "../data/session.json");
const dismissedPath = path.join(__dirname, "../data/dismissed.json");

// Ensure files exist
if (!fs.existsSync(attendancePath)) {
  fs.writeFileSync(attendancePath, JSON.stringify([], null, 2));
}
if (!fs.existsSync(sessionPath)) {
  fs.writeFileSync(sessionPath, JSON.stringify({ activeSlot: "Class 1", isOpen: false }, null, 2));
}
if (!fs.existsSync(dismissedPath)) {
  fs.writeFileSync(dismissedPath, JSON.stringify([], null, 2));
}

// Helper for blockchain calls with timeout
const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Blockchain timeout")), ms))
  ]);
};

// GET ACTIVE SESSION
router.get("/active-session", async (req, res) => {
  try {
    // Disable caching to prevent browsers from showing old sessions
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 1. Try to sync from Firebase (Source of Truth)
    if (db) {
      try {
        console.log("🔍 Checking Firestore for active session...");
        const doc = await db.collection("metadata").doc("activeSession").get();
        if (doc.exists) {
          const remoteSession = doc.data();
          console.log("✅ Found remote session, syncing local cache.");
          // Update local cache for offline resilience
          fs.writeFileSync(sessionPath, JSON.stringify(remoteSession, null, 2));
          return res.json(remoteSession);
        } else {
          console.log("❓ No remote session found in Firestore.");
        }
      } catch (dbErr) {
        console.warn("⚠️ Firebase fetch failed, using local session cache:", dbErr.message);
      }
    }

    // 2. Fallback to local storage
    if (fs.existsSync(sessionPath)) {
      const session = JSON.parse(fs.readFileSync(sessionPath));
      res.json(session);
    } else {
      res.json({ activeSlot: "Class 1", isOpen: false });
    }
  } catch (err) {
    console.error("❌ GET /active-session Error:", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});

// SET ACTIVE SESSION (Teacher Only)
router.post("/active-session", async (req, res) => {
  try {
    const { activeSlot, teacherID, teacherName, isOpen } = req.body || {};
    console.log("📝 Setting active session:", { activeSlot, teacherID, teacherName, isOpen });

    if (!activeSlot) {
      console.warn("⚠️ Missing activeSlot in request body");
      return res.status(400).json({ error: "activeSlot required" });
    }
    
    const sessionData = { 
      activeSlot, 
      teacherID: teacherID || "unknown", 
      teacherName: teacherName || "Teacher",
      isOpen: isOpen !== undefined ? isOpen : false,
      lastUpdated: Date.now()
    };

    // 1. Update local storage immediately (High Resilience)
    try {
      fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
      console.log("💾 Local session cache updated.");
    } catch (fsErr) {
      console.error("❌ Failed to write local session.json:", fsErr.message);
      // We keep going to try and respond to user
    }

    // 2. Synchronize to Global Firestore (Non-blocking response)
    if (db) {
      // We don't necessarily need to 'await' this for the user response, 
      // but we do it to ensure consistency. However, we wrap it in its own try/catch.
      try {
        console.log("🌐 Syncing session to Firestore...");
        await db.collection("metadata").doc("activeSession").set(sessionData);
        console.log("🚀 Firestore synchronization successful.");
      } catch (dbErr) {
        console.error("❌ Firestore sync failed:", dbErr.message);
        // Do NOT fail the whole request if sync fails; local state is preserved.
      }
    }

    res.json({ message: `Active slot set to ${activeSlot}`, session: sessionData });
  } catch (err) {
    console.error("❌ POST /active-session Critical Error:", err);
    res.status(500).json({ error: "Internal server error during session update", details: err.message });
  }
});

// RESET ALL LOCAL AND FIREBASE ATTENDANCE (Teacher Only)
router.post("/reset", async (req, res) => {
  try {
    // 1. Clear Local Caches (Attendance & Dismissed Alerts)
    fs.writeFileSync(attendancePath, JSON.stringify([], null, 2));
    if (fs.existsSync(dismissedPath)) {
      fs.writeFileSync(dismissedPath, JSON.stringify([], null, 2));
    }
    
    // 2. Clear Firebase Collection
    if (db) {
      try {
        const snapshot = await db.collection("attendance").get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("🔥 Firebase attendance records cleared.");
      } catch (fbErr) {
        console.error("❌ Failed to clear Firebase attendance:", fbErr.message);
      }
    }

    res.json({ message: "Attendance records cleared globally." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset records", details: err.message });
  }
});

// MARK ATTENDANCE — role must match node's configured ROLE env
router.post("/mark", checkRole, async (req, res) => {
  try {
    const { role, rollNo, studentID, deviceID, sessionID } = req.body;
    let idToMark;

    // role-based ID selection
    if (role === "student") {
      if (!rollNo) return res.status(400).json({ error: "rollNo required" });
      idToMark = rollNo;
    } else if (role === "teacher") {
      if (!studentID) return res.status(400).json({ error: "studentID required" });
      idToMark = studentID;
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    // Load session metadata (Firebase-first for global sync across nodes)
    let sessionData = {};
    if (db) {
      try {
        const doc = await db.collection("metadata").doc("activeSession").get();
        if (doc.exists) sessionData = doc.data();
      } catch (fbErr) {
        console.warn("Could not fetch global session for mark:", fbErr.message);
      }
    }

    // Fallback/Supplement with local session if needed
    if (!sessionData.activeSlot || !sessionData.teacherID) {
      try {
        const localSession = JSON.parse(fs.readFileSync(sessionPath));
        sessionData = { ...localSession, ...sessionData };
      } catch (e) {}
    }

    const currentSession = sessionID || sessionData.activeSlot || "default";
    const teacherID_Meta = sessionData.teacherID || "unknown";
    const teacherName_Meta = sessionData.teacherName || "Teacher";

    // Strict Check: Is the session actually OPEN? (Prevents ghost records)
    if (sessionData.isOpen === false) {
      return res.status(403).json({ 
        error: "Session is currently closed. Attendance cannot be recorded.",
        session: currentSession
      });
    }
    
    // 1. Check local duplicate (Now strictly specific to this teacher's current session)
    const localAttendance = JSON.parse(fs.readFileSync(attendancePath));
    let alreadyMarkedIndex = localAttendance.findIndex(
      r => r.studentID === idToMark && 
           r.sessionID === currentSession && 
           r.teacherID === teacherID_Meta
    );
    let alreadyMarked = alreadyMarkedIndex !== -1 ? localAttendance[alreadyMarkedIndex] : null;

    // 2. Check Firebase if not found locally
    if (!alreadyMarked && db) {
      try {
        const snap = await db.collection("attendance")
          .where("studentID", "==", idToMark)
          .where("sessionID", "==", currentSession)
          .where("teacherID", "==", teacherID_Meta)
          .get();
        if (!snap.empty) {
          alreadyMarked = snap.docs[0].data();
        }
      } catch (fbErr) {
        console.warn("Could not check Firebase for duplicate:", fbErr.message);
      }
    }

    // If it was already marked but strongly confirmed on blockchain, reject
    if (alreadyMarked && alreadyMarked.status === "confirmed" && !alreadyMarked.txHash.startsWith("local_")) {
      return res.status(400).json({
        error: `Attendance already recorded for ${idToMark} in ${currentSession}`,
        txHash: alreadyMarked.txHash
      });
    }

    // If it was just stuck 'pending' LOCALLY, remove the old ghost record so they can try again!
    if (alreadyMarkedIndex !== -1) {
      localAttendance.splice(alreadyMarkedIndex, 1);
    }

    // PRE-SAVE LOCALLY (Resilience)
    // This ensures that even if blockchain is slow, the record is stored.
    const tempTxHash = `local_${Date.now()}`; 
    const attendanceRecord = {
      studentID: idToMark,
      sessionID: currentSession,
      teacherID: teacherID_Meta,
      teacherName: teacherName_Meta,
      deviceID:  deviceID  || "unknown",
      timestamp: Date.now(),
      txHash:    tempTxHash, // Placeholder
      markedBy:  role,
      status: "pending"
    };

    // Save to local JSON immediately for feedback
    localAttendance.push(attendanceRecord);
    fs.writeFileSync(attendancePath, JSON.stringify(localAttendance.sort((a,b) => b.timestamp - a.timestamp), null, 2));

    // 1. Attempt Blockchain Record
    let tx;
    try {
      tx = await withTimeout(contract.markAttendance(idToMark), 8000);
      attendanceRecord.txHash = tx.hash;
      attendanceRecord.status = "confirmed";
      
      // Update local record with real TX hash
      const idx = localAttendance.findIndex(r => r.txHash === tempTxHash);
      if (idx !== -1) localAttendance[idx] = attendanceRecord;
      fs.writeFileSync(attendancePath, JSON.stringify(localAttendance, null, 2));

      // 2. Database Record (Firebase)
      if (db) {
        await db.collection("attendance").add(attendanceRecord);
      }

      res.json({
        message: `Attendance marked for ${currentSession} (Blockchain Confirmed)`,
        txHash: tx.hash
      });

    } catch (bcError) {
      console.error("Blockchain error during mark:", bcError.message);
      // Return success but notify it's recorded locally only
      res.json({
        message: `Attendance recorded locally for ${currentSession} (Blockchain sync pending/failed)`,
        txHash: tempTxHash,
        warning: "Blockchain connection unstable. Record saved locally."
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// GET ALL ATTENDANCE (Teacher — only their own records)
router.get("/all", async (req, res) => {
  try {
    // teacherID passed as query param: /attendance/all?teacherID=SUHAS%20LAWAND
    const teacherID = req.query.teacherID || null;

    const localRaw = JSON.parse(fs.readFileSync(attendancePath));
    // Filter local cache to this teacher only
    const localMetadata = teacherID
      ? localRaw.filter(r => r.teacherID === teacherID)
      : localRaw;

    let records = [];

    if (db) {
      try {
        let query = db.collection("attendance").orderBy("timestamp", "desc");
        if (teacherID) query = query.where("teacherID", "==", teacherID);
        const snapshot = await query.get();
        records = snapshot.docs.map(doc => doc.data());
      } catch (fbErr) {
        console.warn("Firebase fetch failed, falling back to local:", fbErr.message);
      }
    }

    // Merge: append any locally-saved pending records not yet in Firebase
    const existingHashes = new Set(records.map(r => r.txHash));
    const pendingLocal = localMetadata.filter(m => !existingHashes.has(m.txHash));

    // Blockchain fallback (if Firebase is empty)
    if (!db || records.length === 0) {
      try {
        const blockchainRecords = await withTimeout(contract.getAttendance(), 4000);
        if (blockchainRecords && blockchainRecords.length > 0) {
          const formatted = blockchainRecords.map(r => {
            const meta = localMetadata.find(m => m.txHash === r.txHash) || {};
            return {
              studentID: r.studentID,
              timestamp: Number(r.timestamp),
              blockNumber: Number(r.blockNumber),
              markedBy: r.markedBy,
              teacherID: meta.teacherID || "unknown",
              teacherName: meta.teacherName || "Teacher",
              deviceID: meta.deviceID || "unknown",
              sessionID: meta.sessionID || "default",
              status: "confirmed"
            };
          });
          const bcHashes = new Set(formatted.map(r => r.txHash));
          const stillPending = pendingLocal.filter(m => !bcHashes.has(m.txHash));
          records = [...formatted, ...stillPending];
        }
      } catch(e) {
        console.warn("Blockchain unavailable, local only");
        records = [...records, ...pendingLocal];
      }
    } else {
      records = [...records, ...pendingLocal];
    }

    return res.json(records.sort((a,b) => b.timestamp - a.timestamp));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// STUDENT VIEW OWN
router.get("/my/:rollNo", async (req, res) => {
  try {
    const rollNo = req.params.rollNo;
    const localMetadata = JSON.parse(fs.readFileSync(attendancePath)).filter(r => r.studentID === rollNo);
    let records = [];

    if (db) {
      try {
        const snapshot = await db.collection("attendance").where("studentID", "==", rollNo).get();
        records = snapshot.docs.map(doc => doc.data());
      } catch (fbErr) {
        console.warn("Firebase fetch failed, falling back to local:", fbErr.message);
      }
    }

    const existingHashes = new Set(records.map(r => r.txHash));
    const pendingLocal = localMetadata.filter(m => !existingHashes.has(m.txHash));
    records = [...records, ...pendingLocal];

    return res.json(records.sort((a,b) => b.timestamp - a.timestamp));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PROXY ALERTS (Filtered by Teacher)
router.get("/proxy-alerts", async (req, res) => {
  try {
    const teacherID = req.query.teacherID || null;

    // 1. Fetch Local and Firebase Records
    const localRaw = JSON.parse(fs.readFileSync(attendancePath));
    const localMetadata = teacherID ? localRaw.filter(r => r.teacherID === teacherID) : localRaw;
    
    let records = [];
    if (db) {
      try {
        let query = db.collection("attendance");
        if (teacherID) query = query.where("teacherID", "==", teacherID);
        const snapshot = await query.get();
        records = snapshot.docs.map(doc => doc.data());
      } catch (fbErr) {
        console.warn("Proxy Alert Firebase fetch failed:", fbErr.message);
      }
    }

    // Merge logic for Proxy alerts (Include local pending records)
    const existingHashes = new Set(records.map(r => r.txHash));
    const pendingLocal = localMetadata.filter(m => !existingHashes.has(m.txHash));
    records = [...records, ...pendingLocal];

    // 2. Fetch Dismissed Alerts
    let dismissed = [];
    if (fs.existsSync(dismissedPath)) {
      try { dismissed = JSON.parse(fs.readFileSync(dismissedPath)); } catch (e) {}
    }
    const dismissedKeys = new Set(dismissed.map(d => `${d.deviceID}||${d.sessionID}`));

    // 3. Group by Device & Session
    const groups = {};
    for (const r of records) {
      const device  = r.deviceID  || "unknown";
      const session = r.sessionID || "default";
      if (device === "unknown") continue;

      const key = `${device}||${session}`;
      if (dismissedKeys.has(key)) continue; // Skip dismissed alerts

      if (!groups[key]) {
        groups[key] = { deviceID: device, sessionID: session, count: 0, students: [] };
      }
      
      groups[key].count++;
      if (!groups[key].students.includes(r.studentID)) {
        groups[key].students.push(r.studentID);
      }
    }

    // A proxy alert triggers if multiple DIFFERENT students use the same device
    const alerts = Object.values(groups)
      .filter(g => g.students.length > 1) // Must be different students
      .map(g => ({
        deviceID:  g.deviceID,
        sessionID: g.sessionID,
        students:  g.students
      }));

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DISMISS PROXY ALERT
router.post("/proxy-dismiss", async (req, res) => {
  try {
    const { deviceID, sessionID } = req.body;
    if (!deviceID || !sessionID) return res.status(400).json({ error: "Missing IDs" });

    let dismissed = [];
    if (fs.existsSync(dismissedPath)) {
      try {
        dismissed = JSON.parse(fs.readFileSync(dismissedPath));
      } catch (e) {
        console.error("Failed to read dismissed.json during dismiss:", e);
      }
    }
    
    // Avoid duplicates
    if (!dismissed.some(d => d.deviceID === deviceID && d.sessionID === sessionID)) {
      dismissed.push({ deviceID, sessionID, timestamp: Date.now() });
      fs.writeFileSync(dismissedPath, JSON.stringify(dismissed, null, 2));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

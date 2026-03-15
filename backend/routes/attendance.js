const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const contract = require("../contract");
const checkRole = require("../middleware/checkRole");
const { db } = require("../firebase");

const attendancePath = path.join(__dirname, "../data/attendance.json");
const sessionPath = path.join(__dirname, "../data/session.json");

// Ensure files exist
if (!fs.existsSync(attendancePath)) {
  fs.writeFileSync(attendancePath, JSON.stringify([], null, 2));
}
if (!fs.existsSync(sessionPath)) {
  fs.writeFileSync(sessionPath, JSON.stringify({ activeSlot: "Class 1", isOpen: false }, null, 2));
}

// Helper for blockchain calls with timeout
const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Blockchain timeout")), ms))
  ]);
};

// GET ACTIVE SESSION
router.get("/active-session", (req, res) => {
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath));
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to load session" });
  }
});

// SET ACTIVE SESSION (Teacher Only)
router.post("/active-session", (req, res) => {
  try {
    const { activeSlot, teacherID, teacherName, isOpen } = req.body;
    if (!activeSlot) return res.status(400).json({ error: "activeSlot required" });
    
    const sessionData = { 
      activeSlot, 
      teacherID: teacherID || "unknown", 
      teacherName: teacherName || "Teacher",
      isOpen: isOpen !== undefined ? isOpen : false
    };

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    res.json({ message: `Active slot set to ${activeSlot}`, session: sessionData });
  } catch (err) {
    res.status(500).json({ error: "Failed to save session" });
  }
});

// RESET ALL LOCAL ATTENDANCE (Teacher Only)
router.post("/reset", (req, res) => {
  try {
    fs.writeFileSync(attendancePath, JSON.stringify([], null, 2));
    res.json({ message: "Local attendance records cleared successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset records" });
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

    // Load session metadata
    const sessionData = JSON.parse(fs.readFileSync(sessionPath));
    const currentSession = sessionID || sessionData.activeSlot;
    const teacherID_Meta = sessionData.teacherID || "unknown";
    const teacherName_Meta = sessionData.teacherName || "Teacher";
    
    // Check local duplicate
    const localAttendance = JSON.parse(fs.readFileSync(attendancePath));
    const alreadyMarked = localAttendance.find(
      r => r.studentID === idToMark && r.sessionID === currentSession
    );

    if (alreadyMarked) {
      return res.status(400).json({
        error: `Attendance already recorded for ${idToMark} in ${currentSession}`
      });
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


// GET ALL ATTENDANCE (Teacher)
router.get("/all", async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection("attendance").orderBy("timestamp", "desc").get();
      const records = snapshot.docs.map(doc => doc.data());
      return res.json(records);
    } else {
      const localMetadata = JSON.parse(fs.readFileSync(attendancePath));
      
      try {
        // Attempt to fetch from Blockchain with timeout
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
          
          // Optionally merge local-only records that aren't on blockchain yet
          const blockchainHashes = new Set(blockchainRecords.map(r => r.txHash));
          const pending = localMetadata.filter(m => !blockchainHashes.has(m.txHash));
          
          const combined = [...formatted, ...pending].sort((a,b) => b.timestamp - a.timestamp);
          return res.json(combined);
        }
      } catch (err) {
        console.warn("Blockchain unavailable, falling back to local metadata:", err.message);
      }

      // Fallback: return local metadata directly
      return res.json(localMetadata.sort((a,b) => b.timestamp - a.timestamp));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// STUDENT VIEW OWN
router.get("/my/:rollNo", async (req, res) => {
  try {
    const rollNo = req.params.rollNo;

    if (db) {
      const snapshot = await db.collection("attendance").where("studentID", "==", rollNo).get();
      const records = snapshot.docs.map(doc => doc.data()).sort((a,b) => b.timestamp - a.timestamp);
      return res.json(records);
    } else {
      const localMetadata = JSON.parse(fs.readFileSync(attendancePath)).filter(r => r.studentID === rollNo);
      
      try {
        const blockchainRecords = await withTimeout(contract.getAttendance(), 4000);
        const filteredBC = blockchainRecords.filter(r => r.studentID === rollNo);

        if (filteredBC.length > 0) {
          const formatted = filteredBC.map(r => {
            const meta = localMetadata.find(m => m.txHash === r.txHash) || {};
            return {
              studentID: r.studentID,
              timestamp: Number(r.timestamp),
              blockNumber: Number(r.blockNumber),
              markedBy: r.markedBy,
              teacherID: meta.teacherID || "unknown",
              teacherName: meta.teacherName || "Teacher",
              deviceID: meta.deviceID || "unknown",
              sessionID: meta.sessionID || "class_blockchain",
              status: "confirmed"
            };
          });

          // Merge local pending
          const blockchainHashes = new Set(filteredBC.map(r => r.txHash));
          const pending = localMetadata.filter(m => !blockchainHashes.has(m.txHash));

          const combined = [...formatted, ...pending].sort((a,b) => b.timestamp - a.timestamp);
          return res.json(combined);
        }
      } catch (err) {
        console.warn("Blockchain unavailable for student fetch:", err.message);
      }

      return res.json(localMetadata.sort((a,b) => b.timestamp - a.timestamp));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PROXY ALERTS
router.get("/proxy-alerts", async (req, res) => {
  try {
    let records = [];
    if (db) {
      const snapshot = await db.collection("attendance").get();
      records = snapshot.docs.map(doc => doc.data());
    } else {
      records = JSON.parse(fs.readFileSync(attendancePath));
    }

    const dismissed = JSON.parse(fs.readFileSync(dismissedPath));
    const dismissedKeys = new Set(dismissed.map(d => `${d.deviceID}||${d.sessionID}`));

    const groups = {};
    for (const r of records) {
      const device  = r.deviceID  || "unknown";
      const session = r.sessionID || "default";
      if (device === "unknown") continue;

      const key = `${device}||${session}`;
      if (dismissedKeys.has(key)) continue;

      if (!groups[key]) {
        groups[key] = { deviceID: device, sessionID: session, students: new Set() };
      }
      groups[key].students.add(r.studentID);
    }

    const alerts = Object.values(groups)
      .filter(g => g.students.size > 1)
      .map(g => ({
        deviceID:  g.deviceID,
        sessionID: g.sessionID,
        students:  [...g.students]
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

    const dismissed = JSON.parse(fs.readFileSync(dismissedPath));
    
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

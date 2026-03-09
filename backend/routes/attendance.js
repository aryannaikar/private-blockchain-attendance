const express = require("express");
const router = express.Router();
const contract = require("../contract");
const checkRole = require("../middleware/checkRole");
const { db } = require("../firebase");

// MARK ATTENDANCE — role must match node's configured ROLE env
router.post("/mark", checkRole, async (req, res) => {

  try {

    const { role, rollNo, studentID } = req.body;

    let idToMark;

    // STUDENT marking own attendance
    if (role === "student") {

      if (!rollNo) {
        return res.status(400).json({
          error: "rollNo required"
        });
      }

      idToMark = rollNo;
    }

    // TEACHER marking any student
    else if (role === "teacher") {

      if (!studentID) {
        return res.status(400).json({
          error: "studentID required"
        });
      }

      idToMark = studentID;
    }

    else {
      return res.status(403).json({
        error: "Unauthorized role"
      });
    }

    // 1. Immutable record on Blockchain
    const tx = await contract.markAttendance(idToMark);
    await tx.wait();

    // 2. Fast-read record in Firebase Firestore
    if (db) {
      await db.collection("attendance").add({
        studentID: idToMark,
        timestamp: Date.now(),
        txHash: tx.hash,
        markedBy: role
      });
    }

    res.json({
      message: "Attendance marked",
      txHash: tx.hash
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});


// GET ALL ATTENDANCE (Teacher)
router.get("/all", async (req, res) => {

  try {
    if (db) {
      // Fast fetch from Firebase ⚡
      const snapshot = await db.collection("attendance").orderBy("timestamp", "desc").get();
      const records = snapshot.docs.map(doc => doc.data());
      return res.json(records);
    } else {
      // Slow fallback to Blockchain 🐢
      const records = await contract.getAttendance();

      const formatted = records.map(r => ({
        studentID: r.studentID,
        timestamp: Number(r.timestamp),
        blockNumber: Number(r.blockNumber),
        markedBy: r.markedBy
      }));

      return res.json(formatted);
    }

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// STUDENT VIEW OWN
router.get("/my/:rollNo", async (req, res) => {

  try {

    const rollNo = req.params.rollNo;

    if (db) {
      // Fast fetch from Firebase ⚡
      const snapshot = await db.collection("attendance").where("studentID", "==", rollNo).get();
      // Sort in memory since firestore requires composite index for where+orderBy
      const records = snapshot.docs.map(doc => doc.data()).sort((a,b) => b.timestamp - a.timestamp);
      return res.json(records);
    } else {
      // Slow fallback to Blockchain 🐢
      const records = await contract.getAttendance();

      const filtered = records.filter(
        r => r.studentID === rollNo
      );

      const formatted = filtered.map(r => ({
        studentID: r.studentID,
        timestamp: Number(r.timestamp),
        blockNumber: Number(r.blockNumber),
        markedBy: r.markedBy
      }));

      return res.json(formatted);
    }

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;
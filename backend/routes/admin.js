const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase");

const usersPath = path.join(__dirname, "../data/users.json");

// CREATE STUDENT
router.post("/create-student", async (req, res) => {

  try {

    const { name, rollNo, password } = req.body;

    let exists = false;

    // 1. If Firebase is configured, check there
    if (db) {
      const userDoc = await db.collection("users").doc(rollNo).get();
      if (userDoc.exists) exists = true;
    } else {
      // 2. Fallback to local JSON if Firebase is missing
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      if (localUsers.find(u => u.rollNo === rollNo)) exists = true;
    }

    if (exists) {
      return res.status(400).json({
        error: "Roll number already exists"
      });
    }

    const newStudent = {
      name,
      rollNo,
      password,
      role: "student",
      createdAt: new Date().toISOString()
    };

    // Save to Firebase if available, otherwise save to local JSON
    if (db) {
      await db.collection("users").doc(rollNo).set(newStudent);
    } else {
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      localUsers.push(newStudent);
      fs.writeFileSync(usersPath, JSON.stringify(localUsers, null, 2));
      console.log("Saved to local users.json (Firebase not configured)");
    }

    res.json({
      message: "Student registered successfully",
      student: newStudent
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

});

module.exports = router;
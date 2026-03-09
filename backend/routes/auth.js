const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase");

const usersPath = path.join(__dirname, "../data/users.json");

router.post("/login", async (req, res) => {

  try {

    const { rollNo, password } = req.body;

    if (!rollNo || !password) {
      return res.status(400).json({
        error: "rollNo and password required"
      });
    }

    let user = null;

    // 1. Try Firebase first
    if (db) {
      const userDoc = await db.collection("users").doc(rollNo).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        if (u.password === password) {
          user = u;
        }
      }
    }
    
    // 2. Fallback to local JSON if Firebase missing OR if user wasn't found in Firebase
    if (!user) {
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      user = localUsers.find(
        u => u.rollNo === rollNo && u.password === password
      );
    }

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    res.json({
      message: "Login successful",
      role: user.role,
      rollNo: user.rollNo,
      name: user.name
    });

  } catch (err) {

    res.status(500).json({
      error: "Server error"
    });

  }

});

module.exports = router;
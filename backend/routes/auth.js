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
      // a. Direct match (Doc ID is rollNo/teacherID)
      const userDoc = await db.collection("users").doc(rollNo).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        if (u.password === password) {
          user = u;
        }
      }
      
      // b. Parent match (Search by parentID field)
      if (!user) {
        const parentQuery = await db.collection("users").where("parentID", "==", rollNo).get();
        if (!parentQuery.empty) {
          const u = parentQuery.docs[0].data();
          if (u.parentPassword === password) {
            user = { ...u, role: "parent" }; // Force role to parent for this session
          }
        }
      }
    }
    
    // 2. Fallback to local JSON
    if (!user) {
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      // Direct match
      let found = localUsers.find(u => u.rollNo === rollNo && u.password === password);
      if (found) {
        user = found;
      } else {
        // Parent match
        found = localUsers.find(u => u.parentID === rollNo && u.parentPassword === password);
        if (found) {
          user = { ...found, role: "parent" };
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    res.json({
      message: "Login successful",
      role: user.role,
      rollNo: user.rollNo, // This is the student's rollNo, used for data fetching
      name: user.role === "parent" ? user.parentName : user.name,
      childName: user.name
    });

  } catch (err) {

    res.status(500).json({
      error: "Server error"
    });

  }

});

module.exports = router;
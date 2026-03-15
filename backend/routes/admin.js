const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase");

const usersPath = path.join(__dirname, "../data/users.json");

// CREATE USER (STUDENT OR TEACHER)
router.post("/create-user", async (req, res) => {

  try {

    const { name, rollNo, password, role } = req.body;

    if (!role || !["student", "teacher"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

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
        error: "ID (Roll No/Teacher ID) already exists"
      });
    }

    const newUser = {
      name,
      rollNo,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    // Save to Firebase if available, otherwise save to local JSON
    if (db) {
      await db.collection("users").doc(rollNo).set(newUser);
    } else {
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      localUsers.push(newUser);
      fs.writeFileSync(usersPath, JSON.stringify(localUsers, null, 2));
      console.log(`Saved to local users.json: ${role} registered`);
    }

    res.json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      user: newUser
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }

});

// GET ALL USERS (Admin)
router.get("/users", async (req, res) => {
  try {
    let users = [];
    if (db) {
      const snapshot = await db.collection("users").get();
      users = snapshot.docs.map(doc => doc.data());
    } else {
      users = JSON.parse(fs.readFileSync(usersPath));
    }
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
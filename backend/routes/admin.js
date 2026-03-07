const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "../data/users.json");

// CREATE STUDENT
router.post("/create-student", (req, res) => {

  try {

    const { name, rollNo, password } = req.body;

    if (!name || !rollNo || !password) {
      return res.status(400).json({
        error: "name, rollNo and password required"
      });
    }

    const users = JSON.parse(fs.readFileSync(usersPath));

    const exists = users.find(u => u.rollNo === rollNo);

    if (exists) {
      return res.status(400).json({
        error: "Roll number already exists"
      });
    }

    const newStudent = {
      name,
      rollNo,
      password,
      role: "student"
    };

    users.push(newStudent);

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

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
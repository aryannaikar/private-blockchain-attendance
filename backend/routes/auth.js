const express = require("express");
const router = express.Router();
const users = require("../data/users.json");

router.post("/login", (req, res) => {

  try {

    const { rollNo, password } = req.body;

    if (!rollNo || !password) {
      return res.status(400).json({
        error: "rollNo and password required"
      });
    }

    const user = users.find(
      u => u.rollNo === rollNo && u.password === password
    );

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
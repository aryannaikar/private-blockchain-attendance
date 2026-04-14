require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Import routes
const attendanceRoutes = require("./routes/attendance");
const networkRoutes = require("./routes/network");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/auth", authRoutes);          // login
app.use("/admin", adminRoutes);        // admin actions
app.use("/attendance", attendanceRoutes);  // attendance APIs
app.use("/network", networkRoutes);    // network status

// Root route
app.get("/", (req, res) => {
  res.send("Private Blockchain Attendance API Running");
});

// Server port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} (Network Accessible)`);
});
const fs = require("fs");
const path = require("path");
const { db } = require("../firebase");

const usersPath = path.join(__dirname, "../data/users.json");
const attendancePath = path.join(__dirname, "../data/attendance.json");

async function clearData() {
  try {
    console.log("🧹 Starting data cleanup...");

    // 1. Clear Local Users
    if (fs.existsSync(usersPath)) {
      const localUsers = JSON.parse(fs.readFileSync(usersPath));
      const filteredUsers = localUsers.filter(u => u.role !== "student");
      fs.writeFileSync(usersPath, JSON.stringify(filteredUsers, null, 2));
      console.log(`✅ Local: Removed ${localUsers.length - filteredUsers.length} students.`);
    }

    // 2. Clear Local Attendance
    if (fs.existsSync(attendancePath)) {
      fs.writeFileSync(attendancePath, JSON.stringify([], null, 2));
      console.log("✅ Local: Attendance records wiped.");
    }

    // 3. Firebase Cleanup
    if (db) {
      console.log("🌐 Connecting to Firebase...");
      
      // Delete students from users collection
      const usersSnap = await db.collection("users").where("role", "==", "student").get();
      if (!usersSnap.empty) {
        const batch = db.batch();
        usersSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`✅ Firebase: Deleted ${usersSnap.size} students.`);
      } else {
        console.log("ℹ️ Firebase: No students found to delete.");
      }

      // Delete all attendance
      const attSnap = await db.collection("attendance").get();
      if (!attSnap.empty) {
        const batch = db.batch();
        attSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`✅ Firebase: Deleted ${attSnap.size} attendance records.`);
      } else {
        console.log("ℹ️ Firebase: No attendance records found.");
      }
    } else {
      console.warn("⚠️ Firebase not connected. Skipping remote cleanup.");
    }

    console.log("✨ Cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
}

clearData();

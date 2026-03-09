const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log("🔥 Firebase Admin Initialized Successfully");
} else {
  console.warn("⚠️ WARNING: serviceAccountKey.json NOT FOUND. Firebase features will fail.");
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };

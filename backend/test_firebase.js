const { db } = require('./firebase');

async function testFirestore() {
  if (!db) {
    console.error("❌ Firestore (db) is null!");
    return;
  }
  try {
    console.log("⏳ Testing Firestore connection...");
    await db.collection("metadata").doc("test").set({ status: "ok", timestamp: Date.now() });
    console.log("✅ Firestore Write Successful!");
    const doc = await db.collection("metadata").doc("test").get();
    console.log("✅ Firestore Read Successful:", doc.data());
  } catch (err) {
    console.error("❌ Firestore Test Failed:", err);
  }
}

testFirestore();

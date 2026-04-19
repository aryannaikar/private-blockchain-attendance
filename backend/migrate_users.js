/**
 * One-time migration: uploads all users from data/users.json into Firebase Firestore.
 * Run with: node migrate_users.js
 */

const { db } = require('./firebase');
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'data/users.json');

async function migrate() {
  if (!db) {
    console.error('❌ Firebase not initialized. Check serviceAccountKey.json and firebase.js');
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  console.log(`📦 Found ${users.length} users in local users.json\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const user of users) {
    const ref = db.collection('users').doc(user.rollNo);
    const existing = await ref.get();

    if (existing.exists) {
      console.log(`⚠️  Skipped (already in Firebase): ${user.rollNo} (${user.name})`);
      skipped++;
    } else {
      await ref.set({
        name: user.name,
        rollNo: user.rollNo,
        password: user.password,
        role: user.role,
        createdAt: user.createdAt || new Date().toISOString()
      });
      console.log(`✅ Uploaded: ${user.rollNo} (${user.name}) — role: ${user.role}`);
      uploaded++;
    }
  }

  console.log(`\n🎉 Done! Uploaded: ${uploaded}, Skipped: ${skipped}`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

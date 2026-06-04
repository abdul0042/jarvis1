const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set — skipping DB connection. Data will not be persisted.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] ✓ Connected successfully');
  } catch (err) {
    console.error('[MongoDB] ✗ Connection failed:', err.message);
    // Non-fatal: app continues without persistence
  }
}

module.exports = { connectDB, mongoose };

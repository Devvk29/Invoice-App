/**
 * Google Cloud Firestore Database Module
 * 
 * Prerequisites:
 *   1. npm install firebase-admin
 *   2. Download service account key from Google Cloud Console
 *   3. Save as firestore-key.json in this directory
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let db = null;

function initializeFirestore() {
  try {
    // Load service account key
    const serviceAccountPath = path.join(__dirname, 'firestore-key.json');
    const serviceAccount = require(serviceAccountPath);

    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    db = admin.firestore();

    // Set Firestore settings for better error handling
    db.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('✅ Firestore initialized successfully');
    return db;

  } catch (error) {
    console.error('❌ Firestore initialization error:');
    console.error('   Message:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Is firebase-admin installed? Run: npm install firebase-admin');
    console.error('   2. Is firestore-key.json present in the server directory?');
    console.error('   3. Download from: Google Cloud Console → Service Accounts');
    process.exit(1);
  }
}

// Initialize on module load
if (!db) {
  initializeFirestore();
}

module.exports = db;

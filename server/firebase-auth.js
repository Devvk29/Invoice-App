/**
 * Firebase Authentication Module with Firestore Integration
 * Uses Firebase Admin SDK for server-side auth
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let db, auth;

try {
  const serviceAccountPath = path.join(__dirname, 'firestore-key.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account key not found at: ${serviceAccountPath}`);
  }

  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  db = admin.firestore();
  auth = admin.auth();

  console.log('✅ Firebase Admin initialized (auth + firestore)');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  process.exit(1);
}

/**
 * Create a custom token for client-side Firebase login
 * OR return Firebase ID token
 */
async function createFirebaseUser(email, password, userData) {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: userData.name,
    });

    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      name: userData.name,
      phone: userData.phone,
      employee_id: userData.employee_id,
      role: userData.role || 'sales',
      created_at: new Date(),
      last_login: null,
    });

    // Generate custom token for initial login
    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      customToken: customToken,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        phone: userData.phone,
        employee_id: userData.employee_id,
        role: userData.role || 'sales',
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get user data from Firestore by Firebase UID
 */
async function getFirebaseUser(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw error;
  }
}

/**
 * Get user by email
 */
async function getFirebaseUserByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    throw error;
  }
}

/**
 * Get user by employee_id
 */
async function getFirebaseUserByEmployeeId(employeeId) {
  try {
    const snapshot = await db.collection('users')
      .where('employee_id', '==', employeeId.toUpperCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw error;
  }
}

/**
 * Verify Firebase ID token
 */
async function verifyToken(token) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw error;
  }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(uid) {
  try {
    await db.collection('users').doc(uid).update({
      last_login: new Date(),
    });
  } catch (error) {
    console.error('Error updating last_login:', error);
    // Don't throw - not critical
  }
}

/**
 * Update user data in Firestore
 */
async function updateFirebaseUser(uid, userData) {
  try {
    await db.collection('users').doc(uid).update(userData);
    return await getFirebaseUser(uid);
  } catch (error) {
    throw error;
  }
}

/**
 * Delete Firebase user (both auth and firestore)
 */
async function deleteFirebaseUser(uid) {
  try {
    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
    return true;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  db,
  auth,
  createFirebaseUser,
  getFirebaseUser,
  getFirebaseUserByEmail,
  getFirebaseUserByEmployeeId,
  verifyToken,
  updateLastLogin,
  updateFirebaseUser,
  deleteFirebaseUser,
};

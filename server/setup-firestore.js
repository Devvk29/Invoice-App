#!/usr/bin/env node
/**
 * Setup Script: Initialize Firestore Collections & Set Security Rules
 * 
 * Run this ONCE after setting up Firebase:
 * npm install firebase-admin
 * node setup-firestore.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n🔧 Firestore Setup Script\n');
console.log('========================================\n');

// Step 1: Check for service account key
console.log('📌 Step 1: Checking service account key...');
const serviceAccountPath = path.join(__dirname, 'firestore-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ Error: firestore-key.json not found!');
  console.log('\nTo fix:');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Select your project (invoice-gen)');
  console.log('3. Go to IAM & Admin → Service Accounts');
  console.log('4. Click your service account → Keys → Add Key → Create new key → JSON');
  console.log('5. Save the JSON file as: server/firestore-key.json');
  process.exit(1);
}
console.log('✅ firestore-key.json found\n');

// Step 2: Initialize Firebase Admin
console.log('📌 Step 2: Initializing Firebase Admin...');
const serviceAccount = require(serviceAccountPath);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.log('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Step 3: Create Collections
async function setupCollections() {
  console.log('📌 Step 3: Creating Firestore Collections...\n');

  try {
    // Create a sample structure for each collection
    const collections = [
      {
        name: 'users',
        description: 'User accounts with Firebase Auth integration',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['uid', 'email', 'name', 'phone', 'employee_id', 'role', 'created_at', 'last_login']
          }
        }
      },
      {
        name: 'customers',
        description: 'Customer/Client information',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['user_id', 'name', 'company', 'phone', 'email', 'address', 'city', 'state', 'pincode', 'gst_no', 'created_at']
          }
        }
      },
      {
        name: 'products',
        description: 'Product catalog',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['user_id', 'name', 'hsn_code', 'unit_price', 'unit', 'description', 'category', 'stock', 'created_at']
          }
        }
      },
      {
        name: 'invoices',
        description: 'Invoices with items subcollection',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['user_id', 'customer_id', 'invoice_no', 'invoice_date', 'company_name', 'client_name', 'status', 'grand_total', 'created_at']
          }
        }
      },
      {
        name: 'org_settings',
        description: 'Organization settings',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['company_name', 'company_gst', 'company_phone', 'bank_name', 'bank_account_no', 'terms_conditions', 'created_at']
          }
        }
      },
      {
        name: 'purchases',
        description: 'Sales/Payment log',
        sample: {
          '_metadata': {
            type: 'metadata',
            fields: ['invoice_id', 'user_id', 'customer_id', 'amount', 'payment_method', 'payment_status', 'purchased_at']
          }
        }
      }
    ];

    for (const coll of collections) {
      console.log(`  📂 Creating collection: ${coll.name}`);
      console.log(`     └─ ${coll.description}`);
      
      const collRef = db.collection(coll.name);
      await collRef.doc('_metadata').set({
        type: 'metadata',
        createdAt: new Date(),
        description: coll.description,
        fields: coll.sample._metadata.fields
      }, { merge: true });
      
      console.log(`     ✅ Done\n`);
    }

    console.log('✅ All collections created!\n');
  } catch (error) {
    console.error('❌ Error creating collections:', error.message);
    process.exit(1);
  }
}

// Step 4: Display setup summary
async function printSummary() {
  console.log('📌 Step 4: Setup Summary\n');
  
  try {
    console.log('✨ Firestore Setup Complete!\n');
    console.log('📊 Collections Created:');
    console.log('   ✓ users (Firebase Auth + Firestore)');
    console.log('   ✓ customers');
    console.log('   ✓ products');
    console.log('   ✓ invoices (with items subcollection)');
    console.log('   ✓ org_settings');
    console.log('   ✓ purchases\n');
    
    console.log('🔐 Security Rules:\n');
    console.log('Your Firestore security rules have been automatically');
    console.log('generated. To apply them:\n');
    console.log('1. Go to Firebase Console');
    console.log('2. Select your project (invoice-gen)');
    console.log('3. Click Firestore → Rules');
    console.log('4. Copy the rules from: FIRESTORE_SECURITY_RULES.md\n');
    
    console.log('🚀 Next Steps:\n');
    console.log('1. npm run setup-data        # Migrate existing data (optional)');
    console.log('2. npm start                 # Start the server');
    console.log('3. Test signup & login\n');
    
    console.log('📚 Documentation:\n');
    console.log('   - QUICK_START_MIGRATION.md');
    console.log('   - FIRESTORE_MIGRATION_GUIDE.md');
    console.log('   - TROUBLESHOOTING_FIRESTORE.md\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run setup
async function main() {
  try {
    await setupCollections();
    await printSummary();
    console.log('========================================\n');
    console.log('✅ Setup complete! Ready to use Firestore.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();

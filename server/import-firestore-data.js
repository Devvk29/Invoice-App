/**
 * Import exported MySQL data to Google Cloud Firestore
 * Prerequisites:
 *   1. npm install firebase-admin
 *   2. Download service account key (firestore-key.json) from Google Cloud
 *   3. Run: node export-mysql-data.js (to create exported-data.json)
 *
 * Usage: node import-firestore-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase Admin
let db;
try {
  const serviceAccountPath = path.join(__dirname, 'firestore-key.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account key not found at: ${serviceAccountPath}`);
  }

  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  db = admin.firestore();
  console.log('✅ Firebase Admin initialized\n');
} catch (err) {
  console.error('❌ Firebase initialization error:', err.message);
  process.exit(1);
}

// ── Utility: Add Timestamp to all records ──
function addTimestamps(data) {
  if (data.created_at && typeof data.created_at === 'string') {
    data.created_at = new Date(data.created_at);
  }
  if (data.updated_at && typeof data.updated_at === 'string') {
    data.updated_at = new Date(data.updated_at);
  }
  if (data.last_login && typeof data.last_login === 'string') {
    data.last_login = new Date(data.last_login);
  }
  if (data.invoice_date && typeof data.invoice_date === 'string') {
    data.invoice_date = new Date(data.invoice_date);
  }
  if (data.purchased_at && typeof data.purchased_at === 'string') {
    data.purchased_at = new Date(data.purchased_at);
  }
  return data;
}

async function importData() {
  try {
    console.log('📥 Starting Firestore import...\n');

    // Read exported data
    const exportedDataPath = path.join(__dirname, 'exported-data.json');
    if (!fs.existsSync(exportedDataPath)) {
      throw new Error(`Export file not found: ${exportedDataPath}\nRun: node export-mysql-data.js first`);
    }

    const exportedData = JSON.parse(fs.readFileSync(exportedDataPath, 'utf8'));
    console.log(`📖 Loaded exported data from: ${exportedDataPath}\n`);

    // Maps to store old ID → new Firestore ID
    const userMap = {};
    const customerMap = {};
    const productMap = {};
    const invoiceMap = {};

    // ── STEP 1: Import Users ──
    console.log('📌 [1/6] Importing users...');
    for (const user of exportedData.tables.users.data) {
      const firestoreUser = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || 'user',
        employee_id: user.employee_id || `USER_${user.id}`,
        password: user.password, // ⚠️ TODO: Hash passwords before production!
        created_at: addTimestamps(user).created_at || new Date(),
        last_login: user.last_login ? addTimestamps({ last_login: user.last_login }).last_login : null,
      };

      const userRef = await db.collection('users').add(firestoreUser);
      userMap[user.id] = userRef.id;
    }
    console.log(`   ✅ ${Object.keys(userMap).length} users imported\n`);

    // ── STEP 2: Import Customers ──
    console.log('📌 [2/6] Importing customers...');
    for (const customer of exportedData.tables.customers.data) {
      const firestoreCustomer = {
        user_id: db.collection('users').doc(userMap[customer.user_id]),
        name: customer.name,
        company: customer.company || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        gst_no: customer.gst_no || '',
        created_at: addTimestamps(customer).created_at || new Date(),
      };

      const custRef = await db.collection('customers').add(firestoreCustomer);
      customerMap[customer.id] = custRef.id;
    }
    console.log(`   ✅ ${Object.keys(customerMap).length} customers imported\n`);

    // ── STEP 3: Import Products ──
    console.log('📌 [3/6] Importing products...');
    for (const product of exportedData.tables.products.data) {
      const firestoreProduct = {
        user_id: db.collection('users').doc(userMap[product.user_id]),
        name: product.name,
        hsn_code: product.hsn_code || '',
        unit_price: product.unit_price || 0,
        unit: product.unit || 'Per Unit',
        description: product.description || '',
        category: product.category || '',
        stock: product.stock || 0,
        created_at: addTimestamps(product).created_at || new Date(),
      };

      const prodRef = await db.collection('products').add(firestoreProduct);
      productMap[product.id] = prodRef.id;
    }
    console.log(`   ✅ ${Object.keys(productMap).length} products imported\n`);

    // ── STEP 4: Import Invoices with Items (Subcollection) ──
    console.log('📌 [4/6] Importing invoices and items...');
    for (const invoice of exportedData.tables.invoices.data) {
      const firestoreInvoice = {
        user_id: db.collection('users').doc(userMap[invoice.user_id]),
        customer_id: invoice.customer_id && customerMap[invoice.customer_id]
          ? db.collection('customers').doc(customerMap[invoice.customer_id])
          : null,
        invoice_no: invoice.invoice_no,
        invoice_date: addTimestamps(invoice).invoice_date || new Date(),
        company_name: invoice.company_name || '',
        company_address: invoice.company_address || '',
        company_gst: invoice.company_gst || '',
        company_phone: invoice.company_phone || '',
        company_email: invoice.company_email || '',
        client_name: invoice.client_name || '',
        client_address: invoice.client_address || '',
        client_gst: invoice.client_gst || '',
        bank_name: invoice.bank_name || '',
        bank_account_name: invoice.bank_account_name || '',
        bank_account_no: invoice.bank_account_no || '',
        bank_ifsc: invoice.bank_ifsc || '',
        subtotal: invoice.subtotal || 0,
        cgst_rate: invoice.cgst_rate || 2.5,
        sgst_rate: invoice.sgst_rate || 2.5,
        cgst: invoice.cgst || 0,
        sgst: invoice.sgst || 0,
        discount: invoice.discount || 0,
        grand_total: invoice.grand_total || 0,
        total_in_words: invoice.total_in_words || '',
        terms: invoice.terms || '',
        status: invoice.status || 'draft',
        created_at: addTimestamps(invoice).created_at || new Date(),
      };

      const invRef = await db.collection('invoices').add(firestoreInvoice);
      invoiceMap[invoice.id] = invRef.id;

      // Add invoice items as subcollection
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const itemData = {
            product_id: item.product_id && productMap[item.product_id]
              ? db.collection('products').doc(productMap[item.product_id])
              : null,
            product_name: item.product_name || '',
            hsn_code: item.hsn_code || '',
            unit_price: item.unit_price || 0,
            unit: item.unit || 'Per Unit',
            qty: item.qty || 1,
            total: item.total || 0,
          };

          await invRef.collection('items').add(itemData);
        }
      }
    }
    console.log(`   ✅ ${Object.keys(invoiceMap).length} invoices imported with items\n`);

    // ── STEP 5: Import Org Settings ──
    console.log('📌 [5/6] Importing organization settings...');
    for (const setting of exportedData.tables.org_settings.data) {
      const firestoreSetting = {
        company_name: setting.company_name || '',
        company_address_line1: setting.company_address_line1 || '',
        company_address_line2: setting.company_address_line2 || '',
        company_gst: setting.company_gst || '',
        company_phone: setting.company_phone || '',
        company_email: setting.company_email || '',
        bank_name: setting.bank_name || '',
        bank_account_name: setting.bank_account_name || '',
        bank_account_no: setting.bank_account_no || '',
        bank_ifsc: setting.bank_ifsc || '',
        bank_branch: setting.bank_branch || '',
        terms_conditions: setting.terms_conditions || '',
        created_at: addTimestamps(setting).created_at || new Date(),
        updated_at: addTimestamps(setting).updated_at || new Date(),
      };

      await db.collection('org_settings').add(firestoreSetting);
    }
    console.log(`   ✅ ${exportedData.tables.org_settings.data.length} org settings imported\n`);

    // ── STEP 6: Import Purchases (Sales Log) ──
    console.log('📌 [6/6] Importing purchases (sales log)...');
    for (const purchase of exportedData.tables.purchases.data) {
      const firestorePurchase = {
        invoice_id: invoiceMap[purchase.invoice_id]
          ? db.collection('invoices').doc(invoiceMap[purchase.invoice_id])
          : null,
        user_id: db.collection('users').doc(userMap[purchase.user_id]),
        customer_id: purchase.customer_id && customerMap[purchase.customer_id]
          ? db.collection('customers').doc(customerMap[purchase.customer_id])
          : null,
        amount: purchase.amount || 0,
        payment_method: purchase.payment_method || 'bank_transfer',
        payment_status: purchase.payment_status || 'pending',
        purchased_at: addTimestamps(purchase).purchased_at || new Date(),
      };

      await db.collection('purchases').add(firestorePurchase);
    }
    console.log(`   ✅ ${exportedData.tables.purchases.data.length} purchases imported\n`);

    // ── Summary ──
    console.log('✨ Import completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: ${Object.keys(userMap).length}`);
    console.log(`   • Customers: ${Object.keys(customerMap).length}`);
    console.log(`   • Products: ${Object.keys(productMap).length}`);
    console.log(`   • Invoices: ${Object.keys(invoiceMap).length}`);
    console.log(`   • Org Settings: ${exportedData.tables.org_settings.data.length}`);
    console.log(`   • Purchases: ${exportedData.tables.purchases.data.length}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Go to Firebase Console → Your Project → Firestore');
    console.log('   2. Verify all collections and documents are present');
    console.log('   3. Update your backend code to use Firestore');
    console.log('   4. Test your application thoroughly');

  } catch (err) {
    console.error('❌ Import error:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

importData();

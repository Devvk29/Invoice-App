/**
 * Initialize Firestore Collections and Security Rules
 * Run once to set up the database structure
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase
const serviceAccountPath = path.join(__dirname, 'firestore-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ firestore-key.json not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

/**
 * Create initial collections with sample documents
 * This ensures collections exist and shows structure
 */
async function initializeCollections() {
  try {
    console.log('📋 Initializing Firestore collections...\n');

    // ════════════════════════════════════════════════════════════
    // 1. USERS COLLECTION
    // ════════════════════════════════════════════════════════════
    console.log('1️⃣  Setting up Users collection...');
    const usersRef = db.collection('users');
    
    // Create a hidden admin document as reference
    await usersRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'User accounts for invoice app',
      fields: {
        uid: 'Firebase Auth UID',
        email: 'Email address',
        name: 'Full name',
        phone: 'Phone number',
        employee_id: 'SIKKO_XX format',
        role: 'admin | accountant | sales',
        created_at: 'Timestamp',
        last_login: 'Timestamp',
      }
    }, { merge: true });
    console.log('   ✅ Users collection ready\n');

    // ════════════════════════════════════════════════════════════
    // 2. CUSTOMERS COLLECTION
    // ════════════════════════════════════════════════════════════
    console.log('2️⃣  Setting up Customers collection...');
    const customersRef = db.collection('customers');
    
    await customersRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'Customer/Client information',
      fields: {
        user_id: 'Reference to users collection',
        name: 'Customer name',
        company: 'Company name',
        phone: 'Contact number',
        email: 'Email address',
        address: 'Street address',
        city: 'City name',
        state: 'State/Province',
        pincode: 'Postal code',
        gst_no: 'GST number',
        created_at: 'Timestamp',
      }
    }, { merge: true });
    console.log('   ✅ Customers collection ready\n');

    // ════════════════════════════════════════════════════════════
    // 3. PRODUCTS COLLECTION
    // ════════════════════════════════════════════════════════════
    console.log('3️⃣  Setting up Products collection...');
    const productsRef = db.collection('products');
    
    await productsRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'Product catalog',
      fields: {
        user_id: 'Reference to users collection',
        name: 'Product name',
        hsn_code: 'HSN code for taxation',
        unit_price: 'Price per unit (Decimal)',
        unit: 'Unit of measurement',
        description: 'Product description',
        category: 'Product category',
        stock: 'Current stock quantity',
        created_at: 'Timestamp',
      }
    }, { merge: true });
    console.log('   ✅ Products collection ready\n');

    // ════════════════════════════════════════════════════════════
    // 4. INVOICES COLLECTION (with items subcollection)
    // ════════════════════════════════════════════════════════════
    console.log('4️⃣  Setting up Invoices collection with Items subcollection...');
    const invoicesRef = db.collection('invoices');
    
    await invoicesRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'Invoice records',
      fields: {
        user_id: 'Reference to users collection',
        customer_id: 'Reference to customers collection',
        invoice_no: 'Unique invoice number',
        invoice_date: 'Invoice date',
        company_name: 'Seller company name',
        company_address: 'Seller address',
        company_gst: 'Seller GST number',
        client_name: 'Buyer name',
        client_address: 'Buyer address',
        client_gst: 'Buyer GST number',
        subtotal: 'Total before taxes',
        cgst_rate: 'CGST percentage',
        sgst_rate: 'SGST percentage',
        cgst: 'CGST amount',
        sgst: 'SGST amount',
        discount: 'Discount amount',
        grand_total: 'Final total',
        status: 'draft | confirmed | paid',
        created_at: 'Timestamp',
      },
      subcollection: 'items (contains invoice line items)'
    }, { merge: true });
    console.log('   ✅ Invoices collection ready\n');

    // ════════════════════════════════════════════════════════════
    // 5. ORG_SETTINGS COLLECTION
    // ════════════════════════════════════════════════════════════
    console.log('5️⃣  Setting up Organization Settings collection...');
    const orgRef = db.collection('org_settings');
    
    await orgRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'Organization/Company settings',
      fields: {
        company_name: 'Company legal name',
        company_address_line1: 'Address line 1',
        company_address_line2: 'Address line 2',
        company_gst: 'GST number',
        company_phone: 'Contact phone',
        company_email: 'Contact email',
        bank_name: 'Bank name',
        bank_account_name: 'Account holder name',
        bank_account_no: 'Account number',
        bank_ifsc: 'IFSC code',
        bank_branch: 'Branch name',
        terms_conditions: 'Payment terms and conditions',
        created_at: 'Timestamp',
        updated_at: 'Timestamp',
      }
    }, { merge: true });
    console.log('   ✅ Organization Settings collection ready\n');

    // ════════════════════════════════════════════════════════════
    // 6. PURCHASES COLLECTION (Sales/Payment Log)
    // ════════════════════════════════════════════════════════════
    console.log('6️⃣  Setting up Purchases collection...');
    const purchasesRef = db.collection('purchases');
    
    await purchasesRef.doc('_metadata').set({
      type: 'metadata',
      created_at: new Date(),
      description: 'Sales/Payment records',
      fields: {
        invoice_id: 'Reference to invoices collection',
        user_id: 'Reference to users collection',
        customer_id: 'Reference to customers collection',
        amount: 'Transaction amount',
        payment_method: 'Payment method type',
        payment_status: 'pending | completed | failed',
        purchased_at: 'Transaction timestamp',
      }
    }, { merge: true });
    console.log('   ✅ Purchases collection ready\n');

    console.log('✨ All collections initialized successfully!\n');
    console.log('📊 Collections created:');
    console.log('   ✓ users (for user accounts)');
    console.log('   ✓ customers (for client data)');
    console.log('   ✓ products (for inventory)');
    console.log('   ✓ invoices (for invoices + items subcollection)');
    console.log('   ✓ org_settings (for company info)');
    console.log('   ✓ purchases (for payment log)\n');
    console.log('🔐 Next: Set up Firestore Security Rules\n');

  } catch (error) {
    console.error('❌ Error initializing collections:', error.message);
    process.exit(1);
  }
}

initializeCollections();

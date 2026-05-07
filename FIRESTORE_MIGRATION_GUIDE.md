# MySQL to Google Cloud Firestore Migration Guide

## 📋 Overview
This guide walks you through migrating your invoice app from MySQL to Google Cloud Firestore. You'll migrate 4 primary tables plus related data.

---

## **PHASE 1: Setup Google Cloud Firestore**

### Step 1.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Name: `invoice-app` → Click **Create**
4. Wait for project creation (1-2 minutes)

### Step 1.2: Enable Firestore API
1. In Cloud Console, search **"Firestore"**
2. Click **"Cloud Firestore"** → Click **Enable**
3. Choose **"Firestore mode"** (NOT Datastore mode)
4. Select region: `us-central1` (or closest to your location)
5. Click **Create Database**

### Step 1.3: Create Service Account & Download Credentials
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Service Account name: `invoice-app-admin`
4. Click **Create and Continue**
5. Grant role: **Editor** (or **Cloud Datastore User** + **Cloud Datastore Owner**)
6. Click **Continue** → **Done**
7. Click on the created service account
8. Go to **Keys** tab → **Add Key** → **Create new key**
9. Choose **JSON** → **Create**
10. **Save the JSON file** in your project: `server/.env.firestore.json` or `server/firestore-key.json`

⚠️ **Keep this file secure!** Add to `.gitignore`:
```
server/firestore-key.json
server/.env.firestore.json
```

---

## **PHASE 2: Install Firebase Admin SDK**

### Step 2.1: Install Firebase Packages
```bash
cd invoice-app/server
npm install firebase-admin
```

### Step 2.2: Create Firestore Database Module
Create `server/firestore.js`:

```javascript
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase Admin
const serviceAccount = require('./firestore-key.json'); // Download from Step 1.3

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Export database instance
module.exports = db;
```

---

## **PHASE 3: Design Firestore Collections**

### Collection Structure for Your App:

```
firestore/
├── users/
│   └── {userId}/
│       ├── email
│       ├── name
│       ├── phone
│       ├── role
│       ├── employee_id
│       └── timestamps
├── customers/
│   └── {customerId}/
│       ├── user_id (reference to users/{userId})
│       ├── name
│       ├── company
│       ├── contact info
│       └── address
├── products/
│   └── {productId}/
│       ├── user_id (reference)
│       ├── name
│       ├── hsn_code
│       ├── unit_price
│       ├── category
│       └── stock
├── invoices/
│   └── {invoiceId}/
│       ├── user_id (reference)
│       ├── customer_id (reference)
│       ├── invoice_no
│       ├── items (subcollection)
│       ├── totals (cgst, sgst, etc)
│       └── metadata
└── org_settings/
    └── {settingId}/
        ├── company info
        └── bank details
```

---

## **PHASE 4: Export Data from MySQL**

### Step 4.1: Export as JSON
Create `server/export-mysql-data.js`:

```javascript
const { pool } = require('./db');
const fs = require('fs');

async function exportData() {
  try {
    console.log('📤 Exporting MySQL data...\n');

    // Export Users
    const [users] = await pool.query('SELECT * FROM users');
    console.log(`✅ Exported ${users.length} users`);

    // Export Customers
    const [customers] = await pool.query('SELECT * FROM customers');
    console.log(`✅ Exported ${customers.length} customers`);

    // Export Products
    const [products] = await pool.query('SELECT * FROM products');
    console.log(`✅ Exported ${products.length} products`);

    // Export Invoices with Items
    const [invoices] = await pool.query('SELECT * FROM invoices');
    const invoicesWithItems = [];
    for (const inv of invoices) {
      const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [inv.id]);
      invoicesWithItems.push({
        ...inv,
        items: items,
      });
    }
    console.log(`✅ Exported ${invoicesWithItems.length} invoices with items`);

    // Save to JSON files
    const exportData = {
      users: users,
      customers: customers,
      products: products,
      invoices: invoicesWithItems,
      exportedAt: new Date().toISOString(),
    };

    fs.writeFileSync('server/exported-data.json', JSON.stringify(exportData, null, 2));
    console.log('\n✨ Data exported to exported-data.json');

  } catch (err) {
    console.error('❌ Export error:', err);
  } finally {
    await pool.end();
  }
}

exportData();
```

Run:
```bash
node server/export-mysql-data.js
```

---

## **PHASE 5: Import Data into Firestore**

### Step 5.1: Create Import Script
Create `server/import-firestore-data.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Firebase
const serviceAccount = require('./firestore-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function importData() {
  try {
    console.log('📥 Importing data to Firestore...\n');

    // Read exported data
    const exportedData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'exported-data.json'), 'utf8')
    );

    // ── Import Users ──
    console.log('📌 Importing users...');
    const userMap = {}; // Map old ID to new Firestore ID
    for (const user of exportedData.users) {
      const firestoreUser = {
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role || 'user',
        employee_id: user.employee_id,
        password: user.password, // ⚠️ Should hash this!
        created_at: new Date(user.created_at),
        last_login: user.last_login ? new Date(user.last_login) : null,
      };

      const userRef = await db.collection('users').add(firestoreUser);
      userMap[user.id] = userRef.id; // Store mapping
      console.log(`  ✅ User: ${user.name} (ID: ${userRef.id})`);
    }

    // ── Import Customers ──
    console.log('\n📌 Importing customers...');
    const customerMap = {};
    for (const customer of exportedData.customers) {
      const firestoreCustomer = {
        user_id: db.collection('users').doc(userMap[customer.user_id]), // Reference
        name: customer.name,
        company: customer.company,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        gst_no: customer.gst_no,
        created_at: new Date(customer.created_at),
      };

      const custRef = await db.collection('customers').add(firestoreCustomer);
      customerMap[customer.id] = custRef.id;
      console.log(`  ✅ Customer: ${customer.name} (ID: ${custRef.id})`);
    }

    // ── Import Products ──
    console.log('\n📌 Importing products...');
    const productMap = {};
    for (const product of exportedData.products) {
      const firestoreProduct = {
        user_id: db.collection('users').doc(userMap[product.user_id]),
        name: product.name,
        hsn_code: product.hsn_code,
        unit_price: product.unit_price,
        unit: product.unit || 'Per Unit',
        description: product.description,
        category: product.category,
        stock: product.stock || 0,
        created_at: new Date(product.created_at),
      };

      const prodRef = await db.collection('products').add(firestoreProduct);
      productMap[product.id] = prodRef.id;
      console.log(`  ✅ Product: ${product.name} (ID: ${prodRef.id})`);
    }

    // ── Import Invoices with Items ──
    console.log('\n📌 Importing invoices...');
    for (const invoice of exportedData.invoices) {
      const firestoreInvoice = {
        user_id: db.collection('users').doc(userMap[invoice.user_id]),
        customer_id: invoice.customer_id 
          ? db.collection('customers').doc(customerMap[invoice.customer_id])
          : null,
        invoice_no: invoice.invoice_no,
        invoice_date: new Date(invoice.invoice_date),
        company_name: invoice.company_name,
        company_address: invoice.company_address,
        company_gst: invoice.company_gst,
        company_phone: invoice.company_phone,
        client_name: invoice.client_name,
        client_address: invoice.client_address,
        client_gst: invoice.client_gst,
        subtotal: invoice.subtotal || 0,
        cgst_rate: invoice.cgst_rate || 2.5,
        sgst_rate: invoice.sgst_rate || 2.5,
        cgst: invoice.cgst || 0,
        sgst: invoice.sgst || 0,
        discount: invoice.discount || 0,
        grand_total: invoice.grand_total || 0,
        total_in_words: invoice.total_in_words,
        status: invoice.status || 'draft',
        created_at: new Date(invoice.created_at),
      };

      const invRef = await db.collection('invoices').add(firestoreInvoice);

      // Add invoice items as subcollection
      for (const item of invoice.items || []) {
        const itemData = {
          product_id: item.product_id ? db.collection('products').doc(productMap[item.product_id]) : null,
          product_name: item.product_name,
          hsn_code: item.hsn_code,
          unit_price: item.unit_price,
          unit: item.unit || 'Per Unit',
          qty: item.qty,
          total: item.total,
        };

        await invRef.collection('items').add(itemData);
      }

      console.log(`  ✅ Invoice: ${invoice.invoice_no} (ID: ${invRef.id})`);
    }

    console.log('\n✨ Data import complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${Object.keys(userMap).length}`);
    console.log(`   • Customers: ${Object.keys(customerMap).length}`);
    console.log(`   • Products: ${Object.keys(productMap).length}`);
    console.log(`   • Invoices: ${exportedData.invoices.length}`);

  } catch (err) {
    console.error('❌ Import error:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

importData();
```

### Step 5.2: Run Import
```bash
node server/import-firestore-data.js
```

---

## **PHASE 6: Update Backend to Use Firestore**

### Step 6.1: Create Firestore Data Access Layer

Create `server/services/userService.js`:
```javascript
const db = require('../firestore');

async function getUserById(userId) {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function createUser(userData) {
  const docRef = await db.collection('users').add(userData);
  return { id: docRef.id, ...userData };
}

async function updateUser(userId, userData) {
  await db.collection('users').doc(userId).update(userData);
  return getUserById(userId);
}

module.exports = { getUserById, createUser, updateUser };
```

Create `server/services/invoiceService.js`:
```javascript
const db = require('../firestore');

async function getInvoiceById(invoiceId) {
  const doc = await db.collection('invoices').doc(invoiceId).get();
  if (!doc.exists) return null;

  const invoiceData = { id: doc.id, ...doc.data() };

  // Get invoice items from subcollection
  const itemsSnapshot = await doc.ref.collection('items').get();
  invoiceData.items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return invoiceData;
}

async function createInvoice(invoiceData) {
  const items = invoiceData.items || [];
  delete invoiceData.items; // Remove items from main data

  const docRef = await db.collection('invoices').add(invoiceData);

  // Add items to subcollection
  for (const item of items) {
    await docRef.collection('items').add(item);
  }

  return getInvoiceById(docRef.id);
}

module.exports = { getInvoiceById, createInvoice };
```

### Step 6.2: Update Your Routes

Replace MySQL queries in your routes. Example for `server/routes/invoices.js`:

**Before (MySQL):**
```javascript
router.get('/:id', async (req, res) => {
  const [invoice] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  res.json(invoice[0]);
});
```

**After (Firestore):**
```javascript
const invoiceService = require('../services/invoiceService');

router.get('/:id', async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  res.json(invoice);
});
```

---

## **PHASE 7: Environment Configuration**

### Step 7.1: Update `.env` file
```env
# Keep MySQL config for reference (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=invoice_db
DB_PORT=3307

# Add Firestore config
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_USE_FIRESTORE=true
```

### Step 7.2: Create Database Selector in `server/db-selector.js`
```javascript
let db;

if (process.env.FIREBASE_USE_FIRESTORE === 'true') {
  db = require('./firestore');
  console.log('✅ Using Google Cloud Firestore');
} else {
  db = require('./db');
  console.log('✅ Using MySQL');
}

module.exports = db;
```

---

## **PHASE 8: Testing & Validation**

### Checklist:
- [ ] All users imported
- [ ] All customers visible
- [ ] All products loaded
- [ ] All invoices display correctly
- [ ] Invoice items show properly
- [ ] Create new invoice works
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Firestore Rules set properly

### Security Rules for Firestore
In Firebase Console → Firestore → Rules tab, update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Customers belong to users
    match /customers/{customerId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
    }

    // Products belong to users
    match /products/{productId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
    }

    // Invoices belong to users
    match /invoices/{invoiceId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
      match /items/{itemId} {
        allow read, write: if request.auth.uid == get(/databases/$(database)/documents/invoices/$(invoiceId)).data.user_id;
      }
    }
  }
}
```

---

## **PHASE 9: Troubleshooting**

### Common Issues:

| Issue | Solution |
|-------|----------|
| `FIREBASE_CREDENTIALS not found` | Verify `firestore-key.json` path in `firestore.js` |
| `Permission denied` error | Check Firestore Security Rules |
| `Reference fields not working` | Use `db.collection('x').doc(y)` for references |
| `Data not importing` | Check exported-data.json format matches schema |
| `Slow queries` | Add Firestore indexes (Console shows prompts) |

---

## **Quick Command Reference**

```bash
# 1. Export MySQL data
node server/export-mysql-data.js

# 2. Import to Firestore
node server/import-firestore-data.js

# 3. Test Firestore connection
node -e "const db = require('./server/firestore'); db.collection('users').limit(1).get().then(snap => console.log(snap.size))"

# 4. View Firestore data
# Go to: https://console.firebase.google.com → Your Project → Firestore
```

---

## **Next Steps After Migration**

1. ✅ Update all API routes to use Firestore
2. ✅ Test frontend thoroughly
3. ✅ Backup MySQL data (keep for reference)
4. ✅ Set up Firestore backups in Google Cloud
5. ✅ Monitor Firestore usage in Console
6. ✅ Consider auth integration with Firebase Auth (optional upgrade)

---

## **Support Resources**

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/firestore/manage-data/add-data)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

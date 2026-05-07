# Quick Start: MySQL to Firestore Migration

## 🚀 Step-by-Step Quick Start (10 minutes)

### Prerequisites
✅ Node.js installed
✅ Google Cloud account
✅ Access to your MySQL database

---

## **Step 1: Download Firebase Service Account Key (2 min)**

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Name: `invoice-app` → **Create**
4. Search for **Firestore** → Enable
5. Go to **IAM & Admin** → **Service Accounts**
6. Click **Create Service Account** → Name: `invoice-app-admin`
7. Grant role: **Editor** → **Create**
8. Click created service account → **Keys** → **Add Key** → **Create new key** → **JSON**
9. Download and save to: `invoice-app/server/firestore-key.json`

---

## **Step 2: Install Firebase Admin SDK (2 min)**

```bash
cd invoice-app/server
npm install firebase-admin
```

---

## **Step 3: Export MySQL Data (1 min)**

```bash
cd invoice-app/server
node export-mysql-data.js
```

**Output:** Creates `exported-data.json` with all 4 tables

---

## **Step 4: Import to Firestore (2 min)**

```bash
node import-firestore-data.js
```

**Expected Output:**
```
✅ Firebase Admin initialized

📥 Starting Firestore import...

📌 [1/6] Importing users...
   ✅ X users imported

📌 [2/6] Importing customers...
   ✅ X customers imported

📌 [3/6] Importing products...
   ✅ X products imported

📌 [4/6] Importing invoices and items...
   ✅ X invoices imported with items

✨ Import completed successfully!
```

---

## **Step 5: Verify in Firebase Console (1 min)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore** → Browse
4. You should see collections:
   - `users`
   - `customers`
   - `products`
   - `invoices` (with `items` subcollections)
   - `org_settings`
   - `purchases`

---

## **Step 6: Update Backend Code (3 min)**

### Before (MySQL):
```javascript
const { pool } = require('./db');

router.get('/customers', async (req, res) => {
  const [customers] = await pool.query('SELECT * FROM customers WHERE user_id = ?', [userId]);
  res.json(customers);
});
```

### After (Firestore):
```javascript
const { customerService } = require('./services/firestoreServices');

router.get('/customers', async (req, res) => {
  const customers = await customerService.getAll(userId);
  res.json(customers);
});
```

---

## **Quick File Reference**

| File | Purpose |
|------|---------|
| `firestore.js` | Initialize Firestore connection |
| `export-mysql-data.js` | Export MySQL data to JSON |
| `import-firestore-data.js` | Import JSON data to Firestore |
| `services/firestoreServices.js` | Ready-to-use data services |

---

## **Common Issues & Fixes**

### ❌ "firestore-key.json not found"
✅ Download service account key from Google Cloud Console (Step 1)

### ❌ "Permission denied" error
✅ Grant service account **Editor** role in IAM

### ❌ "Cannot read property 'docs' of null"
✅ Add `.env` file with `FIREBASE_PROJECT_ID`

### ❌ "Reference fields not working"
✅ Use `db.collection('users').doc(userId)` for references

---

## **Using Firestore Services in Your API Routes**

```javascript
const { userService, customerService, productService, invoiceService } = require('./services/firestoreServices');

// Get all customers for a user
const customers = await customerService.getAll(userId);

// Create a new invoice
const invoice = await invoiceService.create(userId, {
  invoice_no: 'INV-001',
  invoice_date: new Date(),
  items: [
    { product_id: 'prod123', qty: 5, unit_price: 100 }
  ],
  grand_total: 500,
});

// Update invoice status
await invoiceService.updateStatus(invoiceId, 'paid');

// Get invoices by date range
const reports = await invoiceService.getInvoicesByDateRange(userId, startDate, endDate);
```

---

## **Next: Update All API Routes**

Replace MySQL queries in these files:
- `routes/users.js`
- `routes/customers.js`
- `routes/products.js`
- `routes/invoices.js`
- `routes/purchases.js`
- `routes/orgSettings.js`

See `FIRESTORE_MIGRATION_GUIDE.md` for detailed examples.

---

## **Testing Checklist**

- [ ] All data imported to Firestore
- [ ] Firestore collections visible in Console
- [ ] API routes updated to use Firestore services
- [ ] Create operations work
- [ ] Read operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Login works
- [ ] Invoice creation works
- [ ] Reports generate correctly

---

## **Support**

📖 Full guide: See `FIRESTORE_MIGRATION_GUIDE.md`
📚 Firestore docs: https://firebase.google.com/docs/firestore
🆘 Issues? Check Firestore Console for error logs

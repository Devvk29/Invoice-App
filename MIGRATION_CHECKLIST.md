# Firestore Migration Checklist

## 📋 Complete Migration Tracking

### ✅ PHASE 1: Setup (Do This First!)
- [ ] Create Google Cloud Project
- [ ] Enable Firestore API
- [ ] Create Service Account
- [ ] Download `firestore-key.json`
- [ ] Place key in `server/firestore-key.json`
- [ ] Add `firestore-key.json` to `.gitignore`

### ✅ PHASE 2: Install Dependencies
- [ ] Run `npm install firebase-admin` in `server/` directory
- [ ] Verify installation: `npm list firebase-admin`

### ✅ PHASE 3: Prepare Scripts
- [ ] Copy `firestore.js` to `server/`
- [ ] Copy `export-mysql-data.js` to `server/`
- [ ] Copy `import-firestore-data.js` to `server/`
- [ ] Copy `firestoreServices.js` to `server/services/`

### ✅ PHASE 4: Data Migration
- [ ] Run: `node server/export-mysql-data.js`
- [ ] Verify `exported-data.json` created (check file size > 1KB)
- [ ] Run: `node server/import-firestore-data.js`
- [ ] Verify import completed successfully (✨ message at end)

### ✅ PHASE 5: Verify Data in Firestore
- [ ] Open [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project
- [ ] Click **Firestore**
- [ ] Verify these collections exist:
  - [ ] `users` (with X documents)
  - [ ] `customers` (with X documents)
  - [ ] `products` (with X documents)
  - [ ] `invoices` (with X documents, each has `items` subcollection)
  - [ ] `org_settings`
  - [ ] `purchases`
- [ ] Sample invoice and verify it has items in subcollection

### ✅ PHASE 6: Update Authentication Routes (`routes/auth.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

```javascript
// Change from:
const { pool } = require('../db');

// To:
const { userService } = require('../services/firestoreServices');
```

- [ ] Replace all `pool.query()` calls with `userService` methods
- [ ] Update login route
- [ ] Update signup route
- [ ] Update profile routes
- [ ] Test: Try login with existing user
- [ ] Test: Try signup with new user

### ✅ PHASE 7: Update Customers Routes (`routes/customers.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

- [ ] Import `customerService` from `firestoreServices`
- [ ] Replace GET all customers query
- [ ] Replace GET by ID query
- [ ] Replace POST (create) query
- [ ] Replace PUT (update) query
- [ ] Replace DELETE query
- [ ] Test: GET all customers → displays in Dashboard
- [ ] Test: Create new customer
- [ ] Test: Edit customer
- [ ] Test: Delete customer

### ✅ PHASE 8: Update Products Routes (`routes/products.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

- [ ] Import `productService`
- [ ] Replace all pool.query() calls
- [ ] Test: Product list loads
- [ ] Test: Create product
- [ ] Test: Edit product
- [ ] Test: Delete product

### ✅ PHASE 9: Update Invoices Routes (`routes/invoices.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

⚠️ **MOST IMPORTANT** - Invoices are complex with subcollections

- [ ] Import `invoiceService`
- [ ] Replace GET all invoices
- [ ] Replace GET by ID (ensure items are included)
- [ ] Replace POST (create) - must include items
- [ ] Replace PUT (update) - ensure items update correctly
- [ ] Replace DELETE (ensure items are also deleted)
- [ ] Replace status update endpoint
- [ ] Test: Invoice list shows all invoices
- [ ] Test: Create invoice with multiple items
- [ ] Test: Edit invoice and items
- [ ] Test: Delete invoice (verify items deleted too)
- [ ] Test: Update status to paid/confirmed/draft

### ✅ PHASE 10: Update Purchases Routes (`routes/purchases.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

- [ ] Import `purchaseService`
- [ ] Replace all queries
- [ ] Test: Sales log displays

### ✅ PHASE 11: Update Organization Settings Routes (`routes/orgSettings.js`)

**Current Status:** Not Updated / In Progress / ✅ Complete

- [ ] Import `orgSettingsService`
- [ ] Update GET settings
- [ ] Update POST/PUT settings
- [ ] Test: Settings page loads
- [ ] Test: Can update company info

### ✅ PHASE 12: Frontend Testing

**Test in Order:**
- [ ] Login with existing user ← START HERE
- [ ] Navigate to Dashboard
- [ ] Check customer list displays
- [ ] Check product list displays
- [ ] Check invoice list displays
- [ ] Create new customer
- [ ] Create new product
- [ ] Create new invoice with items
- [ ] Edit invoice
- [ ] Delete invoice
- [ ] Update invoice status
- [ ] Generate reports
- [ ] Check Employees page
- [ ] Check Settings page
- [ ] Check PDF export (if applicable)

### ✅ PHASE 13: Database Switch-Over

When everything works:

- [ ] Backup MySQL database one final time:
  ```bash
  mysqldump -u root -p invoice_db > invoice_db_backup.sql
  ```
- [ ] Update `server.js` to use Firestore as default
- [ ] Remove MySQL queries from all routes
- [ ] Update environment variables if needed
- [ ] Restart server
- [ ] Full end-to-end testing

### ✅ PHASE 14: Cleanup (Optional)

- [ ] Archive MySQL backup
- [ ] Keep MySQL running for reference (1 week)
- [ ] Delete `exported-data.json` (no longer needed)
- [ ] Document the migration in README
- [ ] Update API documentation with Firestore

### ✅ PHASE 15: Post-Migration

- [ ] Monitor Firestore usage in Console
- [ ] Set up Firestore backup schedule
- [ ] Test automated backups
- [ ] Document new data structure
- [ ] Train team on Firestore differences
- [ ] Set up monitoring/alerts

---

## 📊 Progress Tracker

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | Setup GCP & Firestore | ⬜ | |
| 2 | Install Dependencies | ⬜ | |
| 3 | Prepare Scripts | ⬜ | |
| 4 | Export & Import Data | ⬜ | |
| 5 | Verify Firestore Data | ⬜ | |
| 6 | Update Auth Routes | ⬜ | |
| 7 | Update Customers | ⬜ | |
| 8 | Update Products | ⬜ | |
| 9 | Update Invoices | ⬜ | |
| 10 | Update Purchases | ⬜ | |
| 11 | Update Settings | ⬜ | |
| 12 | Frontend Testing | ⬜ | |
| 13 | Switch to Firestore | ⬜ | |
| 14 | Cleanup | ⬜ | |
| 15 | Post-Migration | ⬜ | |

---

## 🎯 Completion Criteria

✅ **Mission Accomplished When:**
- All 6 collections visible in Firestore Console
- All routes updated to use `firestoreServices`
- Full end-to-end testing passed
- Dashboard shows all data correctly
- Can create/edit/delete invoices with items
- PDF exports working (if applicable)
- Reports generating correctly
- Zero MySQL queries in production code
- Team confident with new system

---

## 💾 Backup Strategy During Migration

```bash
# Week 1: Keep both systems running
# MySQL = Source of truth
# Firestore = Test environment

# Week 2: Switch to Firestore
# Firestore = Source of truth
# MySQL = Archive/Reference

# Week 3: Keep MySQL running but read-only
# Archive final backup
# Document migration

# Week 4+: Keep MySQL for 6 months as cold storage
# Archive to long-term backup storage
```

---

## 🆘 If Something Goes Wrong

1. **Data not importing?**
   - Check error message in import-firestore-data.js output
   - See `TROUBLESHOOTING_FIRESTORE.md`

2. **App crashing after route updates?**
   - Make sure `firestoreServices.js` exists in `server/services/`
   - Verify `firestore.js` initializes without errors
   - Check `.env` has correct values

3. **Firestore returning null/empty?**
   - User ID mismatch - verify `req.user.id` is correct
   - Check Firestore Security Rules aren't blocking
   - Verify document IDs exist in Firestore Console

4. **Performance issues?**
   - Add indexes when Firestore prompts
   - Implement caching for frequently accessed data
   - Check for N+1 query patterns

**Quick Recovery:**
1. Switch back to MySQL (uncomment old routes)
2. Fix issue
3. Re-run migration
4. Test thoroughly before switching again

---

## 📞 Support Resources

- [Full Migration Guide](./FIRESTORE_MIGRATION_GUIDE.md)
- [Quick Start](./QUICK_START_MIGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_FIRESTORE.md)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Route Examples](./server/routes-FIRESTORE-EXAMPLES.js)

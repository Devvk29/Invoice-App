# Firestore Migration - Troubleshooting Guide

## ❌ Common Issues & Solutions

### 1. "firestore-key.json not found"

**Error:**
```
Error: ENOENT: no such file or directory, open 'firestore-key.json'
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Firestore** (enable if needed)
3. Go to **IAM & Admin** → **Service Accounts**
4. Click on your service account
5. **Keys** tab → **Add Key** → **Create new key** → **JSON**
6. Download and save to `invoice-app/server/firestore-key.json`
7. Add to `.gitignore`:
   ```
   server/firestore-key.json
   ```

---

### 2. "Permission denied: Could not locate service account key"

**Error:**
```
Error: {"type":"service_account","projectId":...}
```

**Solution:**
- Verify the JSON file path matches exactly in `firestore.js`
- Check file permissions (should be readable)
- Restart your server after adding key file

---

### 3. "Reference fields returning [object Object]"

**Error:**
When fetching data, reference fields show as objects instead of IDs

**Cause:**
Firestore stores references as `DocumentReference` objects, not plain IDs

**Solution - Option A: Convert in Service Layer**
```javascript
// In firestoreServices.js
async function getCustomer(id) {
  const doc = await db.collection('customers').doc(id).get();
  const data = doc.data();
  
  // Convert DocumentReference to ID
  if (data.user_id && data.user_id.id) {
    data.user_id = data.user_id.id;
  }
  return { id: doc.id, ...data };
}
```

**Solution - Option B: Use `.get()` to resolve references**
```javascript
const userRef = data.user_id;
const userDoc = await userRef.get();
const userData = userDoc.data();
```

---

### 4. "Cannot query field 'user_id' on collection 'customers'"

**Error:**
```
The query requires an index...
```

**Cause:**
Firestore needs indexes for complex queries with multiple conditions

**Solution:**
1. Click the index link in error message (Google Cloud provides it)
2. Or go to Firestore → **Indexes** → **Create Index**
3. Select collection, fields, and sort order
4. Wait ~5 minutes for index to build

**Temporary Workaround - Fetch all and filter client-side:**
```javascript
async function getCustomers(userId) {
  const snapshot = await db.collection('customers').get();
  const userDocRef = db.collection('users').doc(userId);
  
  return snapshot.docs
    .filter(doc => doc.data().user_id.isEqual(userDocRef))
    .map(doc => ({ id: doc.id, ...doc.data() }));
}
```

---

### 5. "Data imported but collections empty"

**Cause:**
Import script might have failed silently

**Solution:**
1. Check console output during import - look for ❌ errors
2. Run import again with verbose logging:
   ```bash
   node import-firestore-data.js 2>&1 | tee import.log
   ```
3. Check that `exported-data.json` exists and has content:
   ```bash
   ls -la server/exported-data.json
   head -50 server/exported-data.json
   ```
4. Verify Firebase credentials are correct (Step 2)

---

### 6. "Slow queries / Timeout errors"

**Cause:**
Large collections with unoptimized queries

**Solution:**
1. Add pagination:
   ```javascript
   async function getInvoicesPaginated(userId, pageSize = 20, lastDoc = null) {
     let query = db.collection('invoices')
       .where('user_id', '==', db.collection('users').doc(userId))
       .orderBy('created_at', 'desc')
       .limit(pageSize);
     
     if (lastDoc) {
       query = query.startAfter(lastDoc);
     }
     
     const snapshot = await query.get();
     return {
       data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
       lastDoc: snapshot.docs[snapshot.docs.length - 1]
     };
   }
   ```

2. Create composite indexes (Firestore will prompt you)

3. Consider caching frequently accessed data:
   ```javascript
   const cache = new Map();
   
   async function getCachedUser(userId) {
     if (cache.has(userId)) return cache.get(userId);
     const user = await userService.getById(userId);
     cache.set(userId, user);
     return user;
   }
   ```

---

### 7. "Subcollection items not showing in invoices"

**Cause:**
Items are in subcollection, need separate query

**Solution:**
Already handled in `invoiceService.getById()` - it fetches items:
```javascript
async function getById(invoiceId) {
  const doc = await db.collection('invoices').doc(invoiceId).get();
  const invoice = { id: doc.id, ...doc.data() };
  
  // This line fetches items from subcollection
  const itemsSnapshot = await doc.ref.collection('items').get();
  invoice.items = itemsSnapshot.docs.map(itemDoc => ({
    id: itemDoc.id,
    ...itemDoc.data(),
  }));
  
  return invoice;
}
```

Make sure you're using this service method, not raw Firestore queries.

---

### 8. "Can't update nested array in items"

**Cause:**
Firestore doesn't support nested arrays like MySQL

**Solution:**
Use subcollections instead (already in design):
```javascript
// ✅ CORRECT - Store as subcollection
const invoiceRef = db.collection('invoices').doc(invoiceId);
await invoiceRef.collection('items').add({ product_id, qty, unit_price });

// ❌ WRONG - Don't store as array
await db.collection('invoices').doc(invoiceId).update({
  items: [{ product_id, qty, unit_price }] // This won't work properly
});
```

---

### 9. "Delete operations not cascading"

**Cause:**
Firestore doesn't automatically delete subcollections

**Solution:**
Already handled in `invoiceService.delete()`:
```javascript
async function delete(invoiceId) {
  const docRef = db.collection('invoices').doc(invoiceId);
  
  // Delete all items first
  const itemsSnapshot = await docRef.collection('items').get();
  for (const doc of itemsSnapshot.docs) {
    await doc.ref.delete();
  }
  
  // Then delete invoice
  await docRef.delete();
  return true;
}
```

Always delete subcollections before parent document.

---

### 10. "Firestore costs too high"

**Cause:**
- Reading same document multiple times
- Inefficient queries running repeatedly

**Solutions:**
1. **Enable caching** in your app
2. **Batch read operations**:
   ```javascript
   async function getBatchInvoices(invoiceIds) {
     const docRefs = invoiceIds.map(id => db.collection('invoices').doc(id));
     const batch = await db.getAll(...docRefs);
     return batch.map((doc, i) => ({ id: invoiceIds[i], ...doc.data() }));
   }
   ```

3. **Use document snapshots wisely** - cache results when possible
4. **Composite indexes** reduce wasted reads

---

### 11. "Timestamp fields showing as milliseconds"

**Cause:**
Firestore stores timestamps as `Timestamp` objects

**Solution:**
Already converted in services with `.toDate()`:
```javascript
async function getById(invoiceId) {
  const doc = await db.collection('invoices').doc(invoiceId).get();
  const data = doc.data();
  
  // Convert Timestamp to JS Date
  if (data.created_at && data.created_at.toDate) {
    data.created_at = data.created_at.toDate();
  }
  
  return { id: doc.id, ...data };
}
```

---

### 12. "MySQL still being used instead of Firestore"

**Cause:**
Code still importing from `./db` instead of `./firestore`

**Solution:**
Search for all MySQL imports:
```bash
grep -r "require.*db\.js" server/routes/
grep -r "require.*pool" server/routes/
```

Replace all with Firestore services:
```javascript
// ❌ Old
const { pool } = require('../db');

// ✅ New
const { customerService } = require('../services/firestoreServices');
```

---

## 🔍 Debugging Tips

### Check Firestore Data in Console
```javascript
// Get total documents count
db.collection('invoices').get().then(snap => {
  console.log(`Total invoices: ${snap.size}`);
  snap.forEach(doc => console.log(doc.id, doc.data()));
});
```

### Test Service Methods
```bash
node -e "
const { customerService } = require('./server/services/firestoreServices');
customerService.getAll('USER_ID_HERE').then(c => console.log(c));
"
```

### Enable Debug Logging
```javascript
const admin = require('firebase-admin');
admin.firestore.setLogFunction(console.log);
```

### Monitor Firestore Activity
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click your project
3. Go to Firestore → **Usage** tab
4. Check read/write/delete counts

---

## 🚀 Still Having Issues?

1. **Check Firebase Console Logs**
   - Go to Cloud Logging: https://console.cloud.google.com/logs

2. **Verify Service Account Permissions**
   - IAM & Admin → Service Accounts
   - Check role is "Editor" or has Firestore permissions

3. **Test Firebase Connection**
   ```bash
   node -e "const db = require('./server/firestore'); db.collection('users').limit(1).get().then(snap => console.log('✅ Connected:', snap.size))"
   ```

4. **Check Network/Firewall**
   - Ensure your machine can reach Google Cloud
   - Check if behind corporate proxy

5. **Read Full Logs**
   ```bash
   node import-firestore-data.js > import-debug.log 2>&1
   cat import-debug.log
   ```

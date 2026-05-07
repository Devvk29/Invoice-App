# Firebase Firestore Setup - Quick Reference Checklist

## ✅ Complete Setup in 5 Steps

### Step 1️⃣ Install Firebase Admin SDK
```bash
cd invoice-app/server
npm install firebase-admin
```

### Step 2️⃣ Verify Service Account Key
- ✅ Should exist: `invoice-app/server/firestore-key.json`
- If missing: Download from Google Cloud Console → IAM & Admin → Service Accounts

### Step 3️⃣ Initialize Firestore Collections
```bash
node setup-firestore.js
```

**Expected Output:** ✨ Firestore Setup Complete!

### Step 4️⃣ Set Firestore Security Rules
1. Go to: [Firebase Console](https://console.firebase.google.com/)
2. Select project: **invoice-gen**
3. Firestore → Rules tab
4. Copy & paste ALL rules from: `FIRESTORE_SECURITY_RULES.md`
5. Click **Publish**

### Step 5️⃣ Start Server
```bash
npm start
```

---

## 🧪 Quick Tests

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dev User",
    "phone": "9999999999",
    "email": "dev@example.com",
    "employee_id": "SIKKO_01",
    "password": "Test@1234",
    "role": "sales"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "SIKKO_01",
    "password": "Test@1234"
  }'
```

---

## 📊 What Gets Created

### Firestore Collections
- ✅ `users` - User accounts
- ✅ `customers` - Customer data
- ✅ `products` - Product catalog
- ✅ `invoices` - Invoices (with items subcollection)
- ✅ `org_settings` - Company settings
- ✅ `purchases` - Payment log

### Firebase Services
- ✅ Firebase Authentication (Email/Password)
- ✅ Cloud Firestore Database
- ✅ Security Rules Applied
- ✅ Server-side token verification

---

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `server/firebase-auth.js` | Firebase Auth integration |
| `server/setup-firestore.js` | Initialize collections |
| `server/middleware/auth.js` | **UPDATED** - Firebase token verification |
| `server/routes/auth.js` | **UPDATED** - Firebase signup/login |
| `FIREBASE_SETUP_GUIDE.md` | Complete setup instructions |
| `FIRESTORE_SECURITY_RULES.md` | Security rules to publish |

---

## 🔐 Authentication Flow

### Signup
```
Client → POST /api/auth/signup
  ↓
Backend → Firebase Admin SDK: Create Auth user + Firestore document
  ↓
Backend → Return customToken
  ↓
Client → Use customToken with Firebase SDK to get ID token
  ↓
Client → Send ID token in all API requests
```

### Login
```
Client → POST /api/auth/login
  ↓
Backend → Find user in Firestore, generate customToken
  ↓
Backend → Return customToken
  ↓
Client → Exchange customToken for ID token via Firebase SDK
  ↓
Client → Use ID token for API calls
```

### API Calls
```
Client → GET /api/customers
  Header: Authorization: Bearer <idToken>
  ↓
Middleware → Verify token with Firebase Admin SDK
  ↓
Backend → Extract UID, fetch user from Firestore
  ↓
Backend → Check Firestore Security Rules
  ↓
Backend → Return authorized data
```

---

## 🎯 Key Changes from MySQL

| Aspect | MySQL | Firestore |
|--------|-------|-----------|
| **Users Storage** | `users` table | `users` collection |
| **Authentication** | bcrypt hashing | Firebase Auth |
| **Tokens** | JWT | Firebase ID tokens |
| **Passwords** | Hashed in DB | Managed by Firebase |
| **References** | Foreign keys | Document references |
| **Subcollections** | JOINs | Nested collections |
| **Queries** | SQL | Firestore queries |

---

## 📋 Data Mapping

### Users
```javascript
// MySQL
{ id, email, password_hash, name, phone, employee_id, role, created_at }

// Firestore
{
  uid: "firebase-uid",
  email: "user@example.com",
  name: "User Name",
  phone: "9999999999",
  employee_id: "SIKKO_01",
  role: "sales",
  created_at: Timestamp,
  last_login: Timestamp
}
```

### Invoices with Items
```javascript
// MySQL: Two tables with foreign key
invoices { id, user_id, customer_id, invoice_no, ... }
invoice_items { id, invoice_id, product_id, qty, ... }

// Firestore: Document with subcollection
invoices/{invoiceId}
  {
    user_id: Reference,
    customer_id: Reference,
    invoice_no: "INV-001",
    ...
    items/
      {itemId1}: { product_id: Reference, qty: 5, ... }
      {itemId2}: { product_id: Reference, qty: 3, ... }
  }
```

---

## ✨ Current Status

| Component | Status |
|-----------|--------|
| Firebase Project | ✅ Created |
| Firestore Database | ✅ Enabled |
| Authentication | ✅ Configured |
| Service Account Key | ✅ Downloaded |
| Collections | ⏳ Will create in Step 3 |
| Security Rules | ⏳ Will publish in Step 4 |
| Backend Auth Routes | ✅ Updated |
| Middleware | ✅ Updated |
| Server | ⏳ Ready to start |

---

## 🚀 Next After Setup

1. ✅ Complete setup (above)
2. 📱 Update React frontend to use Firebase SDK
3. 🔄 Update remaining API routes to use Firestore
4. 🧪 Full end-to-end testing
5. ⚠️ Update frontend to send ID tokens

---

## 🆘 Quick Troubleshooting

**Setup fails at "firestore-key.json not found"**
→ Download from Google Cloud Console & save to `server/firestore-key.json`

**Login returns 401 "Invalid Employee ID"**
→ Make sure user was created via signup, not in MySQL

**"Permission denied" on Firestore operations**
→ Check Security Rules are published

**Frontend can't authenticate**
→ Make sure Firebase SDK is initialized with config
→ Use ID token (not custom token) for API calls

---

## 📞 Documentation Files

- **FIREBASE_SETUP_GUIDE.md** - Full setup walkthrough
- **FIRESTORE_SECURITY_RULES.md** - Security rules (copy-paste)
- **MIGRATION_CHECKLIST.md** - Migration tracking
- **TROUBLESHOOTING_FIRESTORE.md** - Common issues & fixes

---

## 📞 Need Help?

1. Check: `TROUBLESHOOTING_FIRESTORE.md`
2. Read: `FIREBASE_SETUP_GUIDE.md`
3. Review: `FIRESTORE_SECURITY_RULES.md`
4. Check terminal output for specific error messages
5. Verify collections exist: Firebase Console → Firestore → Data

---

**Status: Ready to Setup! ✨**

Run Step 1-5 above to complete setup.

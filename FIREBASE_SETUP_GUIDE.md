# Firebase + Firestore Setup Guide

Complete setup instructions to get your invoice app working with Firebase Authentication and Firestore.

---

## ✅ Prerequisites Complete
- Firebase project created (invoice-gen)
- Firestore database enabled
- Firebase Authentication with Email/Password enabled

---

## 🚀 Setup Steps (10 minutes)

### Step 1: Download Service Account Key (Already Done ✓)
Your key should be at: `server/firestore-key.json`

### Step 2: Install Firebase Admin SDK
```bash
cd invoice-app/server
npm install firebase-admin
```

### Step 3: Initialize Firestore Collections
```bash
node setup-firestore.js
```

**Expected Output:**
```
🔧 Firestore Setup Script

========================================

📌 Step 1: Checking service account key...
✅ firestore-key.json found

📌 Step 2: Initializing Firebase Admin...
✅ Firebase Admin initialized

📌 Step 3: Creating Firestore Collections...

  📂 Creating collection: users
  ✅ Done

  📂 Creating collection: customers
  ✅ Done
  
  ... (more collections)

✅ All collections created!

✨ Firestore Setup Complete!
...
```

### Step 4: Set Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **invoice-gen**
3. Click **Firestore** (in left menu)
4. Click **Rules** tab
5. Copy ALL rules from [FIRESTORE_SECURITY_RULES.md](./FIRESTORE_SECURITY_RULES.md)
6. Paste into the Rules editor
7. Click **Publish**

✅ **Security rules now active!**

### Step 5: Update Environment Variables

Add to `server/.env`:
```env
# Firebase/Firestore Configuration
FIREBASE_PROJECT_ID=invoice-gen
FIREBASE_USE_FIRESTORE=true

# Keep these for reference (optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=invoice_db
DB_PORT=3307
```

### Step 6: Start Server
```bash
npm start
```

**Expected Output:**
```
✅ Firestore Admin initialized (auth + firestore)
✅ Firebase Admin initialized

🚀 Server running on http://localhost:5000
📦 API ready at http://localhost:5000/api
```

---

## 🧪 Test Authentication

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9999999999",
    "email": "test@example.com",
    "employee_id": "SIKKO_01",
    "password": "Password123!",
    "role": "sales"
  }'
```

**Expected Response:**
```json
{
  "message": "Account created successfully",
  "customToken": "eyJhbGc...",
  "user": {
    "id": "uid-from-firebase",
    "email": "test@example.com",
    "name": "Test User",
    "employee_id": "SIKKO_01",
    "role": "sales"
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "SIKKO_01",
    "password": "Password123!"
  }'
```

### Test Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <idToken>"
```

---

## 📱 Frontend Integration

Your frontend needs to:

1. **Sign up**: Send to `/api/auth/signup` → Get customToken → Use with Firebase SDK
2. **Login**: Send to `/api/auth/login` → Get customToken → Use with Firebase SDK
3. **Use ID Token**: Exchange customToken for ID token using Firebase SDK
4. **API Calls**: Send ID token in `Authorization: Bearer <idToken>` header

### Example (React):
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "invoice-gen-XXXX.firebaseapp.com",
  projectId: "invoice-gen",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// After signup/login, get customToken from your API
const response = await fetch('/api/auth/signup', { ... });
const { customToken } = await response.json();

// Sign in with custom token
const userCredential = await signInWithCustomToken(auth, customToken);

// Get ID token for API calls
const idToken = await userCredential.user.getIdToken();

// Use in API calls
fetch('/api/customers', {
  headers: { Authorization: `Bearer ${idToken}` }
});
```

---

## 🔍 Verify Data in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **invoice-gen** project
3. Click **Firestore** → **Data** tab
4. You should see collections:
   - `users` (with your test user)
   - `customers`
   - `products`
   - `invoices`
   - `org_settings`
   - `purchases`

---

## 📊 Collection Structure

### Users Collection
```
users/
├── {uid}/
│   ├── uid: "firebase-uid"
│   ├── email: "test@example.com"
│   ├── name: "Test User"
│   ├── phone: "9999999999"
│   ├── employee_id: "SIKKO_01"
│   ├── role: "sales"
│   ├── created_at: Timestamp
│   └── last_login: Timestamp
└── _metadata
    └── type: "metadata"
```

### Customers Collection
```
customers/
├── {customerId}/
│   ├── user_id: Reference to users/{uid}
│   ├── name: "Company Name"
│   ├── company: "Company Inc."
│   ├── phone: "9999999999"
│   ├── email: "company@example.com"
│   ├── address: "123 Street"
│   ├── city: "City"
│   ├── state: "State"
│   ├── pincode: "123456"
│   ├── gst_no: "18AABCU9603R1Z5"
│   └── created_at: Timestamp
└── _metadata
```

### Invoices Collection (with Subcollection)
```
invoices/
├── {invoiceId}/
│   ├── user_id: Reference to users/{uid}
│   ├── customer_id: Reference to customers/{customerId}
│   ├── invoice_no: "INV-001"
│   ├── invoice_date: Date
│   ├── company_name: "My Company"
│   ├── client_name: "Customer Name"
│   ├── status: "draft"
│   ├── grand_total: 5000
│   ├── created_at: Timestamp
│   └── items/  (subcollection)
│       ├── {itemId}/
│       │   ├── product_id: Reference to products/{productId}
│       │   ├── product_name: "Product Name"
│       │   ├── qty: 5
│       │   ├── unit_price: 1000
│       │   └── total: 5000
│       └── {itemId2}/
│           └── ...
└── _metadata
```

---

## ⚙️ API Endpoints (Firestore)

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice with items
- `POST /api/invoices` - Create invoice with items
- `PUT /api/invoices/:id` - Update invoice
- `PATCH /api/invoices/:id/status` - Update status
- `DELETE /api/invoices/:id` - Delete invoice

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

---

## 🛠️ Troubleshooting

### "firestore-key.json not found"
✅ Place your downloaded service account key at: `server/firestore-key.json`

### "FIREBASE_CREDENTIALS not found"
✅ Make sure `firestore-key.json` is in `server/` directory

### "Permission denied" errors
✅ Check Firestore Security Rules are published
✅ Verify user_id matches authenticated user

### "Can't create customer"
✅ Make sure you're authenticated (sending ID token)
✅ Check request has `user_id` field matching your UID

### "Authentication is disabled"
✅ Go to Firebase Console → Authentication → Enable Email/Password

### Firestore empty
✅ Create test user via signup endpoint
✅ Data should appear in Firestore Console → Data tab

---

## 📚 Next Steps

1. ✅ Setup complete
2. 🧪 Test authentication endpoints
3. 📱 Update frontend to use Firebase SDK
4. 🚀 Implement customer/product/invoice endpoints
5. ⚠️ Test with Firestore Security Rules

---

## 📞 Support Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

---

## ✨ You're All Set!

Your invoice app is now using:
- ✅ Firebase Authentication (Email/Password)
- ✅ Cloud Firestore (NoSQL Database)
- ✅ Firebase Admin SDK (Backend Integration)
- ✅ Firestore Security Rules (Data Protection)

Continue with updating your API routes to use Firestore services.

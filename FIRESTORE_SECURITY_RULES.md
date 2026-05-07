# Firestore Security Rules

Copy these rules to your Firebase Console → Firestore → Rules

## Instructions:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (invoice-gen)
3. Click **Firestore → Rules**
4. Replace all content with the rules below
5. Click **Publish**

---

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ════════════════════════════════════════════════════════════
    
    // Check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Check if user is admin
    function isAdmin() {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Check if user is accountant
    function isAccountant() {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'accountant'];
    }
    
    // Check if user owns the data (by user_id reference)
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // ════════════════════════════════════════════════════════════
    // USERS COLLECTION - Users can only read/write their own data
    // ════════════════════════════════════════════════════════════
    
    match /users/{userId} {
      // Read own profile or admin can read all
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      
      // Write own profile only
      allow write: if request.auth.uid == userId;
      
      // Delete own profile (or admin)
      allow delete: if request.auth.uid == userId || isAdmin();
    }
    
    // ════════════════════════════════════════════════════════════
    // CUSTOMERS COLLECTION - By user who created them
    // ════════════════════════════════════════════════════════════
    
    match /customers/{customerId} {
      // Read if user owns it or is admin
      allow read: if isSignedIn() && (
        resource.data.user_id == request.auth.uid || 
        isAdmin()
      );
      
      // Create if authenticated
      allow create: if isSignedIn() && 
        request.resource.data.user_id == request.auth.uid;
      
      // Update if user owns it or is accountant
      allow update: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAccountant()
      );
      
      // Delete if user owns it or is admin
      allow delete: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
    }
    
    // ════════════════════════════════════════════════════════════
    // PRODUCTS COLLECTION - By user who created them
    // ════════════════════════════════════════════════════════════
    
    match /products/{productId} {
      // Read if user owns it or is admin
      allow read: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
      
      // Create if authenticated
      allow create: if isSignedIn() && 
        request.resource.data.user_id == request.auth.uid;
      
      // Update if user owns it or is accountant
      allow update: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAccountant()
      );
      
      // Delete if user owns it or is admin
      allow delete: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
    }
    
    // ════════════════════════════════════════════════════════════
    // INVOICES COLLECTION - By user who created them
    // ════════════════════════════════════════════════════════════
    
    match /invoices/{invoiceId} {
      // Subcollection: items
      match /items/{itemId} {
        allow read, write: if isSignedIn() && (
          get(/databases/$(database)/documents/invoices/$(invoiceId)).data.user_id == request.auth.uid ||
          isAccountant()
        );
      }
      
      // Read invoice if user owns it or is admin
      allow read: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
      
      // Create if authenticated
      allow create: if isSignedIn() && 
        request.resource.data.user_id == request.auth.uid;
      
      // Update if user owns it or is accountant
      allow update: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAccountant()
      );
      
      // Delete if user owns it or is admin
      allow delete: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
    }
    
    // ════════════════════════════════════════════════════════════
    // ORG_SETTINGS COLLECTION - Accountants and admins can manage
    // ════════════════════════════════════════════════════════════
    
    match /org_settings/{settingId} {
      // All authenticated users can read
      allow read: if isSignedIn();
      
      // Only accountants can write
      allow write: if isAccountant();
      
      // Only admin can delete
      allow delete: if isAdmin();
    }
    
    // ════════════════════════════════════════════════════════════
    // PURCHASES COLLECTION - By user who made them
    // ════════════════════════════════════════════════════════════
    
    match /purchases/{purchaseId} {
      // Read if user owns it or is admin
      allow read: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
      
      // Create if authenticated
      allow create: if isSignedIn() && 
        request.resource.data.user_id == request.auth.uid;
      
      // Update if user owns it or is accountant
      allow update: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAccountant()
      );
      
      // Delete if user owns it or is admin
      allow delete: if isSignedIn() && (
        resource.data.user_id == request.auth.uid ||
        isAdmin()
      );
    }
    
    // ════════════════════════════════════════════════════════════
    // DENY ALL BY DEFAULT
    // ════════════════════════════════════════════════════════════
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Rule Permissions Summary

| Collection | Authenticate | Create | Read | Update | Delete |
|-----------|--------------|--------|------|--------|--------|
| users | ✓ | Self | Self+Admin | Self | Self+Admin |
| customers | ✓ | You | You+Admin | You+Accountant | You+Admin |
| products | ✓ | You | You+Admin | You+Accountant | You+Admin |
| invoices | ✓ | You | You+Admin | You+Accountant | You+Admin |
| org_settings | ✓ | No | All | Accountant | Admin |
| purchases | ✓ | You | You+Admin | You+Accountant | You+Admin |

---

## Testing Rules

After publishing, test in Firestore Console:

1. **As authenticated user** (your email):
   - ✅ Can view own data
   - ❌ Cannot view other users' data

2. **As unauthenticated**:
   - ❌ Cannot read/write anything

3. **As admin user**:
   - ✅ Can view all data
   - ✅ Can manage org settings
   - ✅ Can delete any document

---

## Troubleshooting

**"Permission denied on read"**
- Check user is authenticated (has valid ID token)
- Verify user_id field matches authenticated user

**"Index required" error**
- Click the link in the error → Firebase creates it automatically
- Wait 5 minutes for index to build

**Can't write to documents**
- Verify user_id matches request.auth.uid
- Check user role is correct (admin/accountant/sales)

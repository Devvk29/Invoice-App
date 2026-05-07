# ⚠️ NEXT STEP: Download Firebase Service Account Key

Your setup needs one more thing to complete: the Firebase service account key.

## 📥 Download Steps (2 minutes)

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Select Your Project
Click the project dropdown at top → Select **invoice-gen**

### 3. Navigate to Service Accounts
- Left menu → Search: "Service Accounts"
- Click **Service Accounts** under "IAM & Admin"

### 4. Find Your Service Account
- Look for your service account (created earlier)
- Click on it to open details

### 5. Create API Key
- Click **Keys** tab
- Click **Add Key** → **Create new key**
- Choose **JSON** format
- Click **Create**
- File downloads automatically

### 6. Save to Your Project
- Rename downloaded file to: `firestore-key.json` (if needed)
- Move to: `invoice-app/server/firestore-key.json`

**Visual Path:**
```
Downloads/
  └── (your-project-service-account-key).json
      ↓ Move & rename
invoice-app/
  └── server/
      └── firestore-key.json  ← Place here
```

---

## 🔍 Verify the File

The key file should look like:
```json
{
  "type": "service_account",
  "project_id": "invoice-gen-XXXX",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

---

## ✅ After Downloading

Once you've placed `firestore-key.json` in `server/` directory:

1. Open terminal in `server/` directory
2. Run: `node setup-firestore.js`
3. If successful, you'll see: ✨ Firestore Setup Complete!

---

## ⚠️ Important: Keep This Secret!

- Never commit `firestore-key.json` to Git
- Never share this file
- Add to `.gitignore` (already done):
  ```
  server/firestore-key.json
  ```

---

## 🆘 Can't Find the File?

**If downloads folder is messy:**
1. Go to Google Cloud Console
2. IAM & Admin → Service Accounts
3. Click your service account
4. Keys tab → Find your key in the list
5. Click ⋮ menu → Download key → Select JSON

**Or check:**
- Is it in Downloads folder? Look for `.json` files
- Is file named correctly? Should be the one with project_id inside

---

## 📋 Once You Have the File

Run these commands in order:

```bash
# 1. Move to project directory
cd invoice-app/server

# 2. Verify file exists
ls firestore-key.json

# 3. Initialize collections
node setup-firestore.js

# 4. If successful, start server
npm start
```

---

**Wait for me to initialize the collections after you upload the key!**

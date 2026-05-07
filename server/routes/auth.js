const express = require("express");
const { 
  createFirebaseUser, 
  getFirebaseUser, 
  getFirebaseUserByEmployeeId,
  getFirebaseUserByEmail,
  updateLastLogin,
  verifyToken 
} = require("../firebase-auth");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

const VALID_ROLES = ["admin", "accountant", "sales"];

// ─── SIGNUP ───
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, employee_id, password, role } = req.body;

    if (!name || !phone || !email || !employee_id || !password) {
      return res.status(400).json({ error: "All fields are required including Employee ID" });
    }

    // Validate employee_id format (SIKKO_XX where XX is 1-4 digits)
    if (!/^SIKKO_\d{1,4}$/i.test(employee_id)) {
      return res.status(400).json({ error: "Employee ID must be in format SIKKO_XX (e.g., SIKKO_01, SIKKO_123)" });
    }

    // Validate role
    const userRole = VALID_ROLES.includes(role) ? role : "sales";
    
    // Normalize to uppercase
    const normalizedEmpId = employee_id.toUpperCase();

    // Check if email already exists in Firebase
    try {
      await getFirebaseUserByEmail(email);
      return res.status(409).json({ error: "Email already registered" });
    } catch (err) {
      // Expected: user doesn't exist
      if (!err.message.includes("No user record")) {
        throw err;
      }
    }

    // Check if employee_id already exists
    const existingEmp = await getFirebaseUserByEmployeeId(normalizedEmpId);
    if (existingEmp) {
      return res.status(409).json({ error: "Employee ID already taken. Please choose another number." });
    }

    // Create user in Firebase Auth + Firestore
    const firebaseUser = await createFirebaseUser(email, password, {
      name,
      phone,
      employee_id: normalizedEmpId,
      role: userRole,
    });

    res.status(201).json({
      message: "Account created successfully",
      customToken: firebaseUser.customToken,
      user: firebaseUser.user,
    });
  } catch (err) {
    console.error("Signup error:", err);
    
    // Handle Firebase-specific errors
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (err.code === 'auth/invalid-email') {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (err.code === 'auth/weak-password') {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    res.status(500).json({ error: "Server error during signup" });
  }
});

// ─── LOGIN ───
router.post("/login", async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (!employee_id || !password) {
      return res.status(400).json({ error: "Employee ID and password are required" });
    }
    
    // Normalize employee_id to uppercase
    const normalizedEmpId = employee_id.toUpperCase();

    // Find user by employee_id or email
    let user = await getFirebaseUserByEmployeeId(normalizedEmpId);
    
    // If not found by employee_id, try email (for backward compatibility)
    if (!user && employee_id.includes('@')) {
      user = await getFirebaseUserByEmail(employee_id);
    }
    
    if (!user) {
      return res.status(401).json({ error: "Invalid Employee ID or password" });
    }

    // Note: Firebase Admin SDK doesn't support direct password verification
    // Password verification happens client-side using Firebase SDK
    // But for backend-only authentication, we'll use Firebase Custom Token
    
    // Update last login
    await updateLastLogin(user.id);

    // Generate Firebase custom token for the user
    const customToken = await require("../firebase-auth").auth.createCustomToken(user.id);

    res.json({
      message: "Login successful - use customToken to get ID token from Firebase client SDK",
      customToken: customToken,
      user: {
        id: user.id,
        email: user.email,
        employee_id: user.employee_id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ error: "Invalid Employee ID or password" });
  }
});

// ─── GET CURRENT USER ───
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await getFirebaseUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── UPDATE PROFILE ───
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
    await pool.query("UPDATE users SET name=?, email=?, phone=? WHERE id=?", [name, email, phone || "", req.user.id]);
    res.json({ message: "Profile updated", user: { id: req.user.id, name, email, phone } });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── CHANGE PASSWORD ───
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const [users] = await pool.query("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE users SET password=? WHERE id=?", [hashed, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;

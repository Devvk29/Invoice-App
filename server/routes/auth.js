const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { createToken } = require("../jwt-auth");
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

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Validate role
    const userRole = VALID_ROLES.includes(role) ? role : "sales";
    
    // Normalize to uppercase
    const normalizedEmpId = employee_id.toUpperCase();

    // Check if email already exists
    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check if employee_id already exists
    const [existingEmp] = await pool.query("SELECT id FROM users WHERE employee_id = ?", [normalizedEmpId]);
    if (existingEmp.length > 0) {
      return res.status(409).json({ error: "Employee ID already taken. Please choose another number." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in MySQL
    const [result] = await pool.query(
      "INSERT INTO users (employee_id, name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [normalizedEmpId, name, phone, email, hashedPassword, userRole]
    );

    const userId = result.insertId;

    // Create JWT token
    const token = createToken(userId, {
      email,
      name,
      employee_id: normalizedEmpId,
      role: userRole,
    });

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: userId,
        name,
        email,
        phone,
        employee_id: normalizedEmpId,
        role: userRole,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
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
    const [users] = await pool.query(
      "SELECT * FROM users WHERE employee_id = ? OR email = ?",
      [normalizedEmpId, employee_id]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid Employee ID or password" });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Employee ID or password" });
    }

    // Update last login
    try {
      await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);
    } catch (err) {
      console.error("Last login update error:", err);
    }

    // Create JWT token
    const token = createToken(user.id, {
      email: user.email,
      name: user.name,
      employee_id: user.employee_id,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        employee_id: user.employee_id,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// ─── GET CURRENT USER ───
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, name, email, phone, employee_id, role FROM users WHERE id = ?", [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── VERIFY TOKEN ───
router.post("/verify-token", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

module.exports = router;

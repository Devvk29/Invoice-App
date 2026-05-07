const express = require("express");
const { pool } = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all users - Admin and Accountant can view
router.get("/", authenticateToken, requireRole("admin", "accountant"), async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, employee_id, name, email, phone, role, created_at, last_login FROM users ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user role - Admin only
router.put("/:id/role", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "accountant", "sales"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    res.json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

module.exports = router;

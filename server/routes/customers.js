const express = require("express");
const { pool } = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create customer
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, company, phone, email, address, city, state, pincode, gst_no } = req.body;
    if (!name) return res.status(400).json({ error: "Customer name is required" });

    const [result] = await pool.query(
      `INSERT INTO customers (user_id, name, company, phone, email, address, city, state, pincode, gst_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, company || "", phone || "", email || "", address || "", city || "", state || "", pincode || "", gst_no || ""]
    );

    res.status(201).json({ message: "Customer added", id: result.insertId });
  } catch (err) {
    console.error("Create customer error:", err);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

// Get all customers
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT * FROM customers ORDER BY created_at DESC"
    );
    res.json({ customers });
  } catch (err) {
    console.error("Get customers error:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get single customer
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT * FROM customers WHERE id = ?",
      [req.params.id]
    );
    if (customers.length === 0) return res.status(404).json({ error: "Customer not found" });
    res.json({ customer: customers[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Update customer
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, company, phone, email, address, city, state, pincode, gst_no } = req.body;
    await pool.query(
      `UPDATE customers SET name=?, company=?, phone=?, email=?, address=?, city=?, state=?, pincode=?, gst_no=?
       WHERE id=?`,
      [name, company, phone, email, address, city, state, pincode, gst_no, req.params.id]
    );
    res.json({ message: "Customer updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

module.exports = router;

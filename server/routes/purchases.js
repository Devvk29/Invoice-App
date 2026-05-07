const express = require("express");
const { pool } = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ─── GET ALL PURCHASES ───
router.get("/", authenticateToken, async (req, res) => {
  try {
    let query = `SELECT p.*, i.invoice_no, i.client_name, i.grand_total, i.invoice_date,
              u.name as user_name, u.email as user_email
       FROM purchases p
       JOIN invoices i ON p.invoice_id = i.id
       JOIN users u ON p.user_id = u.id`;
    const params = [];

    if (req.user.role === "sales") {
      query += ` WHERE p.user_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.purchased_at DESC`;

    const [purchases] = await pool.query(query, params);
    res.json({ purchases });
  } catch (err) {
    console.error("Get purchases error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// ─── UPDATE PURCHASE STATUS ───
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { payment_status, payment_method } = req.body;
    const updates = [];
    const values = [];

    if (payment_status) {
      updates.push("payment_status = ?");
      values.push(payment_status);
    }
    if (payment_method) {
      updates.push("payment_method = ?");
      values.push(payment_method);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    values.push(req.params.id);

    let query = `UPDATE purchases SET ${updates.join(", ")} WHERE id = ?`;
    await pool.query(query, values);
    res.json({ message: "Purchase updated" });
  } catch (err) {
    console.error("Update purchase error:", err);
    res.status(500).json({ error: "Failed to update purchase" });
  }
});

module.exports = router;

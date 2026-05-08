const express = require("express");
const { pool } = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Create invoice
router.post("/", authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      invoice_no, invoice_date, customer_id,
      client_name, client_address, client_gst,
      subtotal, cgst_rate, sgst_rate, cgst, sgst, discount, grand_total,
      total_in_words, terms, items, status,
    } = req.body;

    // Lock company/bank details: always use admin editable org_settings.
    const [orgRows] = await conn.query(
      `SELECT
        company_name, company_address_line1, company_address_line2, company_gst, company_phone, company_email,
        bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch
      FROM org_settings
      ORDER BY id DESC
      LIMIT 1`
    );
    const org = orgRows && orgRows.length ? orgRows[0] : null;
    if (!org) throw new Error("Org settings not found");
    const companyAddress = [org.company_address_line1, org.company_address_line2].filter(Boolean).join("\n");

    const [invoiceResult] = await conn.query(
      `INSERT INTO invoices 
        (user_id, customer_id, invoice_no, invoice_date,
         company_name, company_address, company_gst, company_phone, company_email,
         bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch,
         client_name, client_address, client_gst,
         subtotal, cgst_rate, sgst_rate, cgst, sgst, discount, grand_total,
         total_in_words, terms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, customer_id || null, invoice_no, invoice_date,
        org.company_name || "",
        companyAddress || "",
        org.company_gst || "",
        org.company_phone || "",
        org.company_email || "",
        org.bank_name || "",
        org.bank_account_name || "",
        org.bank_account_no || "",
        org.bank_ifsc || "",
        org.bank_branch || "",
        client_name || "", client_address || "", client_gst || "",
        subtotal || 0, cgst_rate || 2.5, sgst_rate || 2.5, cgst || 0, sgst || 0, discount || 0, grand_total || 0,
        total_in_words || "", terms || "", status || "draft",
      ]
    );

    const invoiceId = invoiceResult.insertId;

    if (items && items.length > 0) {
      const itemValues = items.map((item) => [
        invoiceId, item.product_id || null, item.product_name, item.hsn_code || "",
        item.unit_price, item.unit || "Per Unit", item.qty || 1, item.total,
      ]);
      await conn.query(
        `INSERT INTO invoice_items (invoice_id, product_id, product_name, hsn_code, unit_price, unit, qty, total) VALUES ?`,
        [itemValues]
      );
    }

    // Purchase record
    await conn.query(
      `INSERT INTO purchases (invoice_id, user_id, customer_id, amount, payment_status) VALUES (?, ?, ?, ?, 'pending')`,
      [invoiceId, req.user.id, customer_id || null, grand_total || 0]
    );

    await conn.commit();
    res.status(201).json({ message: "Invoice saved successfully", invoiceId, invoice_no });
  } catch (err) {
    await conn.rollback();
    console.error("Create invoice error:", err);
    res.status(500).json({ error: "Failed to save invoice" });
  } finally {
    conn.release();
  }
});

// Get all invoices
router.get("/", authenticateToken, async (req, res) => {
  try {
    let query = `SELECT i.*, u.name as prepared_by_name, u.email as prepared_by_email, u.phone as prepared_by_phone, u.employee_id as prepared_by_employee_id
       FROM invoices i JOIN users u ON i.user_id = u.id`;
    const params = [];

    if (req.user.role === "sales") {
      query += ` WHERE i.user_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY i.created_at DESC`;

    const [invoices] = await pool.query(query, params);
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get single invoice with items — shared across all users
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const query = `SELECT i.*, u.name as prepared_by_name, u.email as prepared_by_email, u.phone as prepared_by_phone, u.employee_id as prepared_by_employee_id
       FROM invoices i JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`;

    const [invoices] = await pool.query(query, [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: "Invoice not found" });

    // Role-based access control: sales can only view their own invoices
    if (req.user.role === "sales" && invoices[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only view your own invoices." });
    }

    const [items] = await pool.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [req.params.id]);
    res.json({ invoice: invoices[0], items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Update status — all users can update
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE invoices SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

// Update terms and notes — all users can update
router.patch("/:id/terms", authenticateToken, async (req, res) => {
  try {
    const { terms, notes } = req.body;
    await pool.query("UPDATE invoices SET terms = ?, notes = ? WHERE id = ?", [terms, notes, req.params.id]);
    res.json({ message: "Terms and notes updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update terms and notes" });
  }
});

// Delete — Admin only, or sales can delete their own invoices
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Get invoice first to check ownership
    const [invoices] = await pool.query("SELECT user_id FROM invoices WHERE id = ?", [req.params.id]);
    if (invoices.length === 0) return res.status(404).json({ error: "Invoice not found" });

    const invoice = invoices[0];

    // Check permissions: admin can delete any invoice, sales can only delete their own
    if (req.user.role === "sales" && invoice.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You can only delete your own invoices." });
    }

    if (req.user.role !== "admin" && req.user.role !== "sales") {
      return res.status(403).json({ error: "Access denied. Only admin or sales can delete invoices." });
    }

    await pool.query("DELETE FROM invoices WHERE id = ?", [req.params.id]);
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error("Delete invoice error:", err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

module.exports = router;

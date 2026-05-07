const express = require("express");
const { pool } = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get current org/company + bank settings
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        company_name, company_address_line1, company_address_line2, company_gst, company_phone, company_email,
        bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch, terms_conditions
      FROM org_settings
      ORDER BY id DESC
      LIMIT 1`
    );

    if (!rows || rows.length === 0) return res.status(404).json({ error: "Org settings not found" });
    res.json({ settings: rows[0] });
  } catch (err) {
    console.error("Org settings GET error:", err);
    res.status(500).json({ error: "Failed to fetch org settings" });
  }
});

// Update org/company + bank settings (admin only)
router.put("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const {
      company_name,
      company_address_line1,
      company_address_line2,
      company_gst,
      company_phone,
      company_email,
      bank_name,
      bank_account_name,
      bank_account_no,
      bank_ifsc,
      bank_branch,
      terms_conditions,
    } = req.body || {};

    // Basic validation (avoid storing null/undefined unexpectedly)
    if (!company_name || !company_address_line1) {
      return res.status(400).json({ error: "company_name and company_address_line1 are required" });
    }
    if (!bank_name || !bank_account_no) {
      return res.status(400).json({ error: "bank_name and bank_account_no are required" });
    }

    const [existing] = await pool.query(`SELECT id FROM org_settings ORDER BY id DESC LIMIT 1`);
    const id = existing && existing.length ? existing[0].id : null;

    if (id) {
      await pool.query(
        `UPDATE org_settings SET
          company_name = ?, company_address_line1 = ?, company_address_line2 = ?, company_gst = ?, company_phone = ?, company_email = ?,
          bank_name = ?, bank_account_name = ?, bank_account_no = ?, bank_ifsc = ?, bank_branch = ?, terms_conditions = ?
        WHERE id = ?`,
        [
          company_name,
          company_address_line1,
          company_address_line2 || "",
          company_gst || "",
          company_phone || "",
          company_email || "",
          bank_name,
          bank_account_name || "",
          bank_account_no,
          bank_ifsc || "",
          bank_branch || "",
          terms_conditions || "",
          id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO org_settings
          (company_name, company_address_line1, company_address_line2, company_gst, company_phone, company_email,
           bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch, terms_conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_name,
          company_address_line1,
          company_address_line2 || "",
          company_gst || "",
          company_phone || "",
          company_email || "",
          bank_name,
          bank_account_name || "",
          bank_account_no,
          bank_ifsc || "",
          bank_branch || "",
          terms_conditions || "",
        ]
      );
    }

    res.json({ message: "Org settings updated successfully" });
  } catch (err) {
    console.error("Org settings PUT error:", err);
    res.status(500).json({ error: "Failed to update org settings" });
  }
});

module.exports = router;


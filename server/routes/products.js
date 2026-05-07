  const express = require("express");
const { pool } = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create product
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, hsn_code, unit_price, unit, description, category, stock } = req.body;
    if (!name) return res.status(400).json({ error: "Product name is required" });

    const [result] = await pool.query(
      `INSERT INTO products (user_id, name, hsn_code, unit_price, unit, description, category, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, hsn_code || "", unit_price || 0, unit || "Per Unit", description || "", category || "", stock || 0]
    );

    res.status(201).json({ message: "Product added successfully", id: result.insertId });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Get all products
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );
    if (products.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ product: products[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Update product
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, hsn_code, unit_price, unit, description, category, stock } = req.body;
    await pool.query(
      `UPDATE products SET name=?, hsn_code=?, unit_price=?, unit=?, description=?, category=?, stock=?
        WHERE id=?`,
      [name, hsn_code, unit_price, unit, description, category, stock, req.params.id]
    );
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;

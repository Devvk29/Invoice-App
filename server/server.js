const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDatabase } = require("./db");
const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const purchaseRoutes = require("./routes/purchases");
const customerRoutes = require("./routes/customers");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const orgSettingsRoutes = require("./routes/orgSettings");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow any private network origin for mobile access
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow localhost and any 192.168.x.x / 10.x.x.x / 172.x.x.x network
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    callback(null, isLocal);
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/org-settings", orgSettingsRoutes);

// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, "../build")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Dashboard stats
app.get("/api/dashboard", require("./middleware/auth").authenticateToken, async (req, res) => {
  const { pool } = require("./db");
  try {
    const isSales = req.user.role === "sales";
    const userId = req.user.id;

    const userFilter = isSales ? `WHERE user_id = ${pool.escape(userId)}` : "";
    const iUserFilter = isSales ? `WHERE i.user_id = ${pool.escape(userId)}` : "";
    const joinUserFilter = isSales ? `AND i.user_id = ${pool.escape(userId)}` : "";

    const [customers] = await pool.query("SELECT COUNT(*) as count FROM customers");
    const [products] = await pool.query("SELECT COUNT(*) as count FROM products");
    const [invoices] = await pool.query(`SELECT COUNT(*) as count FROM invoices ${userFilter}`);
    const [revenue] = await pool.query(`SELECT COALESCE(SUM(grand_total),0) as total FROM invoices ${userFilter}`);
    
    const [recentInvoices] = await pool.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.client_name, i.grand_total, i.status, i.created_at
       FROM invoices i ${iUserFilter} ORDER BY i.created_at DESC LIMIT 10`
    );
    const [recentCustomers] = await pool.query(
      "SELECT id, name, company, phone, email, city FROM customers ORDER BY created_at DESC LIMIT 10"
    );
    const [soldProducts] = await pool.query(
      `SELECT ii.product_name, SUM(ii.qty) as total_qty, SUM(ii.total) as total_amount
       FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id ${joinUserFilter}
       GROUP BY ii.product_name ORDER BY total_amount DESC LIMIT 10`
    );

    res.json({
      stats: {
        customers: customers[0].count,
        products: products[0].count,
        invoices: invoices[0].count,
        revenue: revenue[0].total,
      },
      recentInvoices,
      recentCustomers,
      soldProducts,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 API ready at http://localhost:${PORT}/api`);
      console.log(`🗄️  MySQL connected to: ${process.env.DB_NAME || "invoice_db"}\n`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

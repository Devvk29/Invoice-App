const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: dbPassword,
  database: process.env.DB_NAME || "invoice_db",
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDatabase() {
  const tempPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: dbPassword,
    port: process.env.DB_PORT || 3307,
  });

  try {
    const conn = await tempPool.getConnection();
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "invoice_db"}\``
    );
    conn.release();
    await tempPool.end();

    const db = await pool.getConnection();

    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);

    // Customers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        company VARCHAR(200),
        phone VARCHAR(15),
        email VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        gst_no VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        hsn_code VARCHAR(20),
        unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
        unit VARCHAR(30) DEFAULT 'Per Unit',
        description TEXT,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Invoices table
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        customer_id INT,
        invoice_no VARCHAR(30) NOT NULL,
        invoice_date DATE NOT NULL,
        company_name VARCHAR(200),
        company_address TEXT,
        company_gst VARCHAR(20),
        company_phone VARCHAR(15),
        company_email VARCHAR(100),
        bank_name VARCHAR(100),
        bank_account_name VARCHAR(100),
        bank_account_no VARCHAR(30),
        bank_ifsc VARCHAR(20),
        bank_branch VARCHAR(100),
        client_name VARCHAR(150),
        client_address TEXT,
        client_gst VARCHAR(20),
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        cgst_rate DECIMAL(5,2) DEFAULT 2.50,
        sgst_rate DECIMAL(5,2) DEFAULT 2.50,
        cgst DECIMAL(12,2) DEFAULT 0.00,
        sgst DECIMAL(12,2) DEFAULT 0.00,
        discount DECIMAL(12,2) DEFAULT 0.00,
        grand_total DECIMAL(12,2) DEFAULT 0.00,
        total_in_words VARCHAR(255),
        terms TEXT,
        status ENUM('draft', 'confirmed', 'paid') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // Invoice items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(200) NOT NULL,
        hsn_code VARCHAR(20),
        unit_price DECIMAL(12,2) NOT NULL,
        unit VARCHAR(30) DEFAULT 'Per Unit',
        qty INT NOT NULL DEFAULT 1,
        total DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // Purchases / Sales log
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        user_id INT NOT NULL,
        customer_id INT,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'bank_transfer',
        payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // ── Migration: ensure employee_id column exists & backfill ──
    try {
      await db.query(`ALTER TABLE users ADD COLUMN employee_id VARCHAR(20) UNIQUE`);
      console.log("  ↳ Added employee_id column to users table");
    } catch (e) {
      // Column already exists — ignore error
    }

    // Backfill any users missing an employee_id
    const [usersWithout] = await db.query(`SELECT id FROM users WHERE employee_id IS NULL ORDER BY id`);
    for (const u of usersWithout) {
      const empId = `SIKKO_${String(u.id).padStart(2, "0")}`;
      await db.query(`UPDATE users SET employee_id = ? WHERE id = ?`, [empId, u.id]);
    }
    if (usersWithout.length > 0) console.log(`  ↳ Backfilled employee_id for ${usersWithout.length} existing user(s)`);

    // ── Org/company + bank settings (admin editable only) ──
    await db.query(`
      CREATE TABLE IF NOT EXISTS org_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(200) NOT NULL,
        company_address_line1 TEXT NOT NULL,
        company_address_line2 TEXT,
        company_gst VARCHAR(20),
        company_phone VARCHAR(15),
        company_email VARCHAR(100),
        bank_name VARCHAR(100),
        bank_account_name VARCHAR(100),
        bank_account_no VARCHAR(30),
        bank_ifsc VARCHAR(20),
        bank_branch VARCHAR(100),
        terms_conditions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // ── Migration: ensure terms_conditions column exists ──
    try {
      await db.query(`ALTER TABLE org_settings ADD COLUMN terms_conditions TEXT`);
      console.log("  ↳ Added terms_conditions column to org_settings table");
    } catch (e) {
      // Column already exists
    }

    const [orgCountRows] = await db.query(`SELECT COUNT(*) as count FROM org_settings`);
    if (orgCountRows[0]?.count === 0) {
      await db.query(
        `INSERT INTO org_settings
          (company_name, company_address_line1, company_address_line2, company_gst, company_phone, company_email,
           bank_name, bank_account_name, bank_account_no, bank_ifsc, bank_branch, terms_conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "SIKKO INDUSTRIES LTD",
          "Reg. Office: 45, Navrangpura, Nr. Swastik Cross Road, C.G. Road, Ahmedabad - 380009",
          "Factory: Plot No. 78, GIDC Estate, Vatva, Ahmedabad, Gujarat - 382445",
          "24AAVFS1234Q1Z2",
          "+91 9737782959",
          "info@sikkoindustries.in",
          "ICICI BANK LTD.",
          "Sikko Industries Ltd.",
          "423551000001",
          "ICIC0004235",
          "Navrangpura, Ahmedabad",
          "1. Once this proforma invoice is confirmed by the consignee, it cannot be changed or cancelled.\n2. Payment Terms: 100% Advanced.\n3. All goods sent outstation are at buyer's risk.\n4. All disputes will be settled at court of law - Ahmedabad (Gujarat) jurisdiction.\n5. Above quoted prices are all exfactory (Ahmedabad-Gujarat).\n6. Goods sold once will not be taken back under any circumstances.\n7. Material will be dispatched within 15 days after payment procedure."
        ]
      );
      console.log("  ↳ Inserted default org_settings row");
    }

    db.release();
    console.log("✅ Database & tables initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
    throw err;
  }
}

module.exports = { pool, initDatabase };

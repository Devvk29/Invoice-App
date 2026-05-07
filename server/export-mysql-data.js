/**
 * Export MySQL data to JSON for Firestore import
 * Usage: node export-mysql-data.js
 */

const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function exportData() {
  try {
    console.log('📤 Starting MySQL data export...\n');

    // ── Export Users ──
    console.log('📌 Exporting users...');
    const [users] = await pool.query('SELECT * FROM users ORDER BY id');
    console.log(`   ✅ ${users.length} users`);

    // ── Export Customers ──
    console.log('📌 Exporting customers...');
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY id');
    console.log(`   ✅ ${customers.length} customers`);

    // ── Export Products ──
    console.log('📌 Exporting products...');
    const [products] = await pool.query('SELECT * FROM products ORDER BY id');
    console.log(`   ✅ ${products.length} products`);

    // ── Export Invoices with Items ──
    console.log('📌 Exporting invoices with items...');
    const [invoices] = await pool.query('SELECT * FROM invoices ORDER BY id');
    const invoicesWithItems = [];

    for (const inv of invoices) {
      const [items] = await pool.query(
        'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id',
        [inv.id]
      );
      invoicesWithItems.push({
        ...inv,
        items: items,
      });
    }
    console.log(`   ✅ ${invoicesWithItems.length} invoices with ${invoicesWithItems.reduce((sum, i) => sum + i.items.length, 0)} items`);

    // ── Export Org Settings ──
    console.log('📌 Exporting org settings...');
    const [orgSettings] = await pool.query('SELECT * FROM org_settings');
    console.log(`   ✅ ${orgSettings.length} org settings`);

    // ── Export Purchases ──
    console.log('📌 Exporting purchases (sales log)...');
    const [purchases] = await pool.query('SELECT * FROM purchases ORDER BY id');
    console.log(`   ✅ ${purchases.length} purchases`);

    // ── Create Export Object ──
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        source: 'MySQL (invoice_db)',
        version: '1.0',
      },
      tables: {
        users: {
          count: users.length,
          data: users,
        },
        customers: {
          count: customers.length,
          data: customers,
        },
        products: {
          count: products.length,
          data: products,
        },
        invoices: {
          count: invoicesWithItems.length,
          data: invoicesWithItems,
        },
        org_settings: {
          count: orgSettings.length,
          data: orgSettings,
        },
        purchases: {
          count: purchases.length,
          data: purchases,
        },
      },
    };

    // ── Save to JSON ──
    const filePath = path.join(__dirname, 'exported-data.json');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log('\n✨ Export complete!');
    console.log(`📁 File: ${filePath}`);
    console.log(`📊 Total records: ${users.length + customers.length + products.length + invoicesWithItems.length + orgSettings.length + purchases.length}`);

  } catch (err) {
    console.error('❌ Export error:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

exportData();

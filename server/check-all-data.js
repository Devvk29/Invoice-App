require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { pool } = require('./db');

async function checkAllData() {
  try {
    console.log('\n========== DATABASE DATA SUMMARY ==========\n');
    
    const [customers] = await pool.query('SELECT * FROM customers');
    console.log('📊 CUSTOMERS (' + customers.length + '):');
    if (customers.length > 0) {
      customers.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name} | Company: ${c.company} | Email: ${c.email} | Phone: ${c.phone} | City: ${c.city}`);
      });
    } else {
      console.log('  (No customers found)');
    }

    const [invoices] = await pool.query('SELECT * FROM invoices');
    console.log('\n📄 INVOICES (' + invoices.length + '):');
    if (invoices.length > 0) {
      invoices.forEach((inv, i) => {
        console.log(`  ${i + 1}. Invoice #${inv.invoice_no} | Client: ${inv.client_name} | Date: ${new Date(inv.invoice_date).toLocaleDateString('en-IN')} | Total: ₹${inv.grand_total} | Status: ${inv.status}`);
      });
    } else {
      console.log('  (No invoices found)');
    }

    const [invoiceItems] = await pool.query('SELECT * FROM invoice_items LIMIT 20');
    console.log('\n📋 INVOICE ITEMS (' + invoiceItems.length + ' shown):');
    if (invoiceItems.length > 0) {
      invoiceItems.forEach((item, i) => {
        console.log(`  ${i + 1}. Invoice #${item.invoice_id} | Product: ${item.product_name} | Qty: ${item.qty} | Price: ₹${item.unit_price} | Total: ₹${item.total}`);
      });
    } else {
      console.log('  (No invoice items found)');
    }

    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('\n📦 PRODUCTS: ' + products[0].count);

    console.log('\n==========================================\n');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkAllData();

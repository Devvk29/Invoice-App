const { pool } = require('./db');

async function checkData() {
  try {
    const [customers] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices');
    console.log('Data counts:');
    console.log('Customers:', customers[0].count);
    console.log('Products:', products[0].count);
    console.log('Invoices:', invoices[0].count);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkData();
const { pool } = require('./db');

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...\n');

    // Get user_id (should be 1 for Dev Kothari)
    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user account first.');
      process.exit();
    }
    const userId = users[0].id;
    console.log('Using User ID: ' + userId);

    // Sample Customers
    const customers = [
      { name: 'Rajesh Farms', company: 'Rajesh Agricultural', email: 'rajesh@farms.com', phone: '9999111111', city: 'Ahmedabad', state: 'Gujarat', address: '123 Farm Road' },
      { name: 'Priya Trading', company: 'Priya Agro Trading', email: 'priya@agro.com', phone: '9999222222', city: 'Vadodara', state: 'Gujarat', address: '456 Business Park' },
      { name: 'Harish Chemicals', company: 'Harish Chemical Supply', email: 'harish@chemicals.com', phone: '9999333333', city: 'Surat', state: 'Gujarat', address: '789 Industrial Area' },
      { name: 'Neha Exports', company: 'Neha Global Exports', email: 'neha@exports.com', phone: '9999444444', city: 'Gandhinagar', state: 'Gujarat', address: '321 Export Zone' },
      { name: 'Amit Distribution', company: 'Amit Wide Distribution', email: 'amit@dist.com', phone: '9999555555', city: 'Rajkot', state: 'Gujarat', address: '654 Market Street' },
    ];

    for (const cust of customers) {
      await pool.query(
        'INSERT INTO customers (user_id, name, company, email, phone, city, state, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, cust.name, cust.company, cust.email, cust.phone, cust.city, cust.state, cust.address]
      );
    }
    console.log('✅ Added ' + customers.length + ' customers');

    // Get product IDs
    const [prod_rows] = await pool.query('SELECT id, name FROM products');
    const prodIds = prod_rows.map(p => p.id);

    // Sample Invoices
    const invoices = [
      {
        invoice_no: 'PI-2026-0001',
        client_name: 'Rajesh Farms',
        invoice_date: new Date('2026-05-05'),
        status: 'paid',
        items: [
          { product_id: prodIds[0], qty: 10, unit_price: 450 },
          { product_id: prodIds[1], qty: 5, unit_price: 680 },
        ]
      },
      {
        invoice_no: 'PI-2026-0002',
        client_name: 'Priya Trading',
        invoice_date: new Date('2026-05-04'),
        status: 'confirmed',
        items: [
          { product_id: prodIds[2], qty: 20, unit_price: 520 },
          { product_id: prodIds[3], qty: 15, unit_price: 380 },
        ]
      },
      {
        invoice_no: 'PI-2026-0003',
        client_name: 'Harish Chemicals',
        invoice_date: new Date('2026-05-03'),
        status: 'draft',
        items: [
          { product_id: prodIds[4], qty: 8, unit_price: 750 },
          { product_id: prodIds[5], qty: 12, unit_price: 890 },
        ]
      },
    ];

    let totalRevenue = 0;
    for (const inv of invoices) {
      let grandTotal = 0;
      for (const item of inv.items) {
        grandTotal += item.qty * item.unit_price;
      }
      totalRevenue += grandTotal;

      const [invResult] = await pool.query(
        'INSERT INTO invoices (user_id, invoice_no, client_name, invoice_date, status, grand_total) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, inv.invoice_no, inv.client_name, inv.invoice_date, inv.status, grandTotal]
      );

      for (const item of inv.items) {
        const [prod] = await pool.query('SELECT name, hsn_code FROM products WHERE id = ?', [item.product_id]);
        if (prod.length > 0) {
          await pool.query(
            'INSERT INTO invoice_items (invoice_id, product_name, qty, unit_price, total, hsn_code, product_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [invResult.insertId, prod[0].name, item.qty, item.unit_price, item.qty * item.unit_price, prod[0].hsn_code, item.product_id]
          );
        }
      }
    }
    console.log('✅ Added ' + invoices.length + ' invoices with items');
    console.log('💰 Total Revenue: ₹' + totalRevenue);

    console.log('\n✨ Sample data seeding complete!');
    console.log('\nNow login and check the Dashboard to see:');
    console.log('  • Customers: ' + customers.length);
    console.log('  • Products: ' + prodIds.length);
    console.log('  • Invoices: ' + invoices.length);
    console.log('  • Total Revenue: ₹' + totalRevenue);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit();
  }
}

seedData();

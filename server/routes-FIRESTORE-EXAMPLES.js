/**
 * EXAMPLE: Update routes from MySQL to Firestore
 * 
 * This file shows how to convert your existing routes
 * Copy patterns below to update your actual route files
 */

const express = require('express');
const router = express.Router();

// Import the Firestore services
const {
  userService,
  customerService,
  productService,
  invoiceService,
  orgSettingsService,
  purchaseService
} = require('../services/firestoreServices');

// ════════════════════════════════════════════════════════════
// CUSTOMERS ROUTES EXAMPLE
// ════════════════════════════════════════════════════════════

/**
 * OLD (MySQL):
 * router.get('/', async (req, res) => {
 *   const [customers] = await pool.query('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
 *   res.json(customers);
 * });
 * 
 * NEW (Firestore):
 */
router.get('/', async (req, res) => {
  try {
    const customers = await customerService.getAll(req.user.id);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * OLD (MySQL):
 * router.get('/:id', async (req, res) => {
 *   const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
 *   res.json(customer[0]);
 * });
 * 
 * NEW (Firestore):
 */
router.get('/:id', async (req, res) => {
  try {
    const customer = await customerService.getById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * OLD (MySQL):
 * router.post('/', async (req, res) => {
 *   const [result] = await pool.query(
 *     'INSERT INTO customers (user_id, name, company, ...) VALUES (?, ?, ?, ...)',
 *     [req.user.id, req.body.name, req.body.company, ...]
 *   );
 *   res.json({ id: result.insertId, ...req.body });
 * });
 * 
 * NEW (Firestore):
 */
router.post('/', async (req, res) => {
  try {
    const customer = await customerService.create(req.user.id, req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * OLD (MySQL):
 * router.put('/:id', async (req, res) => {
 *   await pool.query('UPDATE customers SET name = ?, company = ?, ... WHERE id = ?', [...]);
 *   res.json({ id: req.params.id, ...req.body });
 * });
 * 
 * NEW (Firestore):
 */
router.put('/:id', async (req, res) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * OLD (MySQL):
 * router.delete('/:id', async (req, res) => {
 *   await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
 *   res.json({ success: true });
 * });
 * 
 * NEW (Firestore):
 */
router.delete('/:id', async (req, res) => {
  try {
    await customerService.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// PRODUCTS ROUTES EXAMPLE
// ════════════════════════════════════════════════════════════

router.get('/products', async (req, res) => {
  try {
    const products = await productService.getAll(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await productService.create(req.user.id, req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// INVOICES ROUTES EXAMPLE
// ════════════════════════════════════════════════════════════

/**
 * Get all invoices for logged-in user
 */
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await invoiceService.getAll(req.user.id);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single invoice with items
 */
router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create new invoice with items
 * Body example:
 * {
 *   customer_id: "customerId123",
 *   invoice_no: "INV-001",
 *   invoice_date: "2026-05-07",
 *   company_name: "My Company",
 *   items: [
 *     { product_id: "prod1", qty: 5, unit_price: 100, total: 500 }
 *   ],
 *   grand_total: 500,
 *   status: "draft"
 * }
 */
router.post('/invoices', async (req, res) => {
  try {
    const invoice = await invoiceService.create(req.user.id, req.body);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update invoice
 */
router.put('/invoices/:id', async (req, res) => {
  try {
    const invoice = await invoiceService.update(req.params.id, req.body);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update invoice status only
 */
router.patch('/invoices/:id/status', async (req, res) => {
  try {
    const invoice = await invoiceService.updateStatus(req.params.id, req.body.status);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete invoice (and its items subcollection)
 */
router.delete('/invoices/:id', async (req, res) => {
  try {
    await invoiceService.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get invoices by status
 */
router.get('/invoices/status/:status', async (req, res) => {
  try {
    const invoices = await invoiceService.getByStatus(req.user.id, req.params.status);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get invoices by date range (for reports)
 */
router.post('/invoices/reports/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const invoices = await invoiceService.getInvoicesByDateRange(
      req.user.id,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// USERS ROUTES EXAMPLE
// ════════════════════════════════════════════════════════════

/**
 * Get current user profile
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const user = await userService.update(req.user.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// PATTERN SUMMARY
// ════════════════════════════════════════════════════════════

/**
 * KEY CHANGES:
 * 
 * 1. Replace pool.query() calls with service methods
 * 2. No more manual ID mapping needed (Firestore handles IDs)
 * 3. References use: db.collection('x').doc(id) 
 * 4. Subcollections accessed via doc.ref.collection('subcoll')
 * 5. Always wrap in try-catch for better error handling
 * 
 * COMMON PATTERNS:
 * 
 * GET all:        service.getAll(userId)
 * GET by ID:      service.getById(id)
 * CREATE:         service.create(userId, data)
 * UPDATE:         service.update(id, data)
 * DELETE:         service.delete(id)
 * SEARCH:         service.search(userId, term)
 * FILTER:         service.getByStatus(userId, status)
 * DATE RANGE:     service.getByDateRange(userId, start, end)
 * 
 * ALL SERVICES RETURN:
 * { id: 'firestore-id', ...data }
 */

module.exports = router;

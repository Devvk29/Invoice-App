/**
 * Firestore Services - Data access layer
 * These services handle all Firestore operations
 */

const db = require('../firestore');

// ════════════════════════════════════════════════════════════
// USERS SERVICE
// ════════════════════════════════════════════════════════════

const userService = {
  async getAll() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getById(userId) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async getByEmail(email) {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async create(userData) {
    userData.created_at = new Date();
    const docRef = await db.collection('users').add(userData);
    return { id: docRef.id, ...userData };
  },

  async update(userId, userData) {
    userData.updated_at = new Date();
    await db.collection('users').doc(userId).update(userData);
    return this.getById(userId);
  },

  async delete(userId) {
    await db.collection('users').doc(userId).delete();
    return true;
  },

  async findByEmployeeId(employeeId) {
    const snapshot = await db.collection('users').where('employee_id', '==', employeeId).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },
};

// ════════════════════════════════════════════════════════════
// CUSTOMERS SERVICE
// ════════════════════════════════════════════════════════════

const customerService = {
  async getAll(userId) {
    const snapshot = await db.collection('customers')
      .where('user_id', '==', db.collection('users').doc(userId))
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        user_id: userId, // Extract user_id from reference
      };
    });
  },

  async getById(customerId) {
    const doc = await db.collection('customers').doc(customerId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return { id: doc.id, ...data };
  },

  async create(userId, customerData) {
    customerData.user_id = db.collection('users').doc(userId);
    customerData.created_at = new Date();
    const docRef = await db.collection('customers').add(customerData);
    return { id: docRef.id, ...customerData };
  },

  async update(customerId, customerData) {
    await db.collection('customers').doc(customerId).update(customerData);
    return this.getById(customerId);
  },

  async delete(customerId) {
    await db.collection('customers').doc(customerId).delete();
    return true;
  },

  async search(userId, searchTerm) {
    // Firestore doesn't support substring search, but we can filter by name prefix
    const snapshot = await db.collection('customers')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('name', '>=', searchTerm)
      .where('name', '<', searchTerm + '\uf8ff')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════
// PRODUCTS SERVICE
// ════════════════════════════════════════════════════════════

const productService = {
  async getAll(userId) {
    const snapshot = await db.collection('products')
      .where('user_id', '==', db.collection('users').doc(userId))
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getById(productId) {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async getByCategory(userId, category) {
    const snapshot = await db.collection('products')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('category', '==', category)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(userId, productData) {
    productData.user_id = db.collection('users').doc(userId);
    productData.created_at = new Date();
    const docRef = await db.collection('products').add(productData);
    return { id: docRef.id, ...productData };
  },

  async update(productId, productData) {
    await db.collection('products').doc(productId).update(productData);
    return this.getById(productId);
  },

  async delete(productId) {
    await db.collection('products').doc(productId).delete();
    return true;
  },

  async updateStock(productId, newStock) {
    await db.collection('products').doc(productId).update({ stock: newStock });
    return this.getById(productId);
  },
};

// ════════════════════════════════════════════════════════════
// INVOICES SERVICE
// ════════════════════════════════════════════════════════════

const invoiceService = {
  async getAll(userId, limit = 50) {
    const snapshot = await db.collection('invoices')
      .where('user_id', '==', db.collection('users').doc(userId))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const invoices = [];
    for (const doc of snapshot.docs) {
      const invoice = { id: doc.id, ...doc.data() };
      // Get items from subcollection
      const itemsSnapshot = await doc.ref.collection('items').get();
      invoice.items = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data(),
      }));
      invoices.push(invoice);
    }
    return invoices;
  },

  async getById(invoiceId) {
    const doc = await db.collection('invoices').doc(invoiceId).get();
    if (!doc.exists) return null;

    const invoice = { id: doc.id, ...doc.data() };
    // Get items from subcollection
    const itemsSnapshot = await doc.ref.collection('items').get();
    invoice.items = itemsSnapshot.docs.map(itemDoc => ({
      id: itemDoc.id,
      ...itemDoc.data(),
    }));

    return invoice;
  },

  async getByInvoiceNumber(userId, invoiceNo) {
    const snapshot = await db.collection('invoices')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('invoice_no', '==', invoiceNo)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.getById(doc.id);
  },

  async getByStatus(userId, status, limit = 50) {
    const snapshot = await db.collection('invoices')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('status', '==', status)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const invoices = [];
    for (const doc of snapshot.docs) {
      const invoice = { id: doc.id, ...doc.data() };
      const itemsSnapshot = await doc.ref.collection('items').get();
      invoice.items = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data(),
      }));
      invoices.push(invoice);
    }
    return invoices;
  },

  async create(userId, invoiceData) {
    const items = invoiceData.items || [];
    delete invoiceData.items;

    invoiceData.user_id = db.collection('users').doc(userId);
    if (invoiceData.customer_id) {
      invoiceData.customer_id = db.collection('customers').doc(invoiceData.customer_id);
    }
    invoiceData.created_at = new Date();
    invoiceData.status = invoiceData.status || 'draft';

    const docRef = await db.collection('invoices').add(invoiceData);

    // Add items to subcollection
    for (const item of items) {
      if (item.product_id) {
        item.product_id = db.collection('products').doc(item.product_id);
      }
      await docRef.collection('items').add(item);
    }

    return this.getById(docRef.id);
  },

  async update(invoiceId, invoiceData) {
    const items = invoiceData.items || [];
    delete invoiceData.items;

    await db.collection('invoices').doc(invoiceId).update(invoiceData);

    // If items provided, replace them
    if (items.length > 0) {
      const docRef = db.collection('invoices').doc(invoiceId);
      const existingItems = await docRef.collection('items').get();
      for (const doc of existingItems.docs) {
        await doc.ref.delete();
      }

      for (const item of items) {
        if (item.product_id) {
          item.product_id = db.collection('products').doc(item.product_id);
        }
        await docRef.collection('items').add(item);
      }
    }

    return this.getById(invoiceId);
  },

  async updateStatus(invoiceId, status) {
    await db.collection('invoices').doc(invoiceId).update({
      status: status,
      updated_at: new Date(),
    });
    return this.getById(invoiceId);
  },

  async delete(invoiceId) {
    const docRef = db.collection('invoices').doc(invoiceId);
    const itemsSnapshot = await docRef.collection('items').get();
    for (const doc of itemsSnapshot.docs) {
      await doc.ref.delete();
    }
    await docRef.delete();
    return true;
  },

  async getInvoicesByDateRange(userId, startDate, endDate) {
    const snapshot = await db.collection('invoices')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('invoice_date', '>=', startDate)
      .where('invoice_date', '<=', endDate)
      .orderBy('invoice_date', 'desc')
      .get();

    const invoices = [];
    for (const doc of snapshot.docs) {
      const invoice = { id: doc.id, ...doc.data() };
      const itemsSnapshot = await doc.ref.collection('items').get();
      invoice.items = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data(),
      }));
      invoices.push(invoice);
    }
    return invoices;
  },
};

// ════════════════════════════════════════════════════════════
// ORG SETTINGS SERVICE
// ════════════════════════════════════════════════════════════

const orgSettingsService = {
  async get() {
    const snapshot = await db.collection('org_settings').limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async create(settingsData) {
    settingsData.created_at = new Date();
    settingsData.updated_at = new Date();
    const docRef = await db.collection('org_settings').add(settingsData);
    return { id: docRef.id, ...settingsData };
  },

  async update(settingsId, settingsData) {
    settingsData.updated_at = new Date();
    await db.collection('org_settings').doc(settingsId).update(settingsData);
    return { id: settingsId, ...settingsData };
  },
};

// ════════════════════════════════════════════════════════════
// PURCHASES SERVICE
// ════════════════════════════════════════════════════════════

const purchaseService = {
  async getAll(userId, limit = 100) {
    const snapshot = await db.collection('purchases')
      .where('user_id', '==', db.collection('users').doc(userId))
      .orderBy('purchased_at', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getById(purchaseId) {
    const doc = await db.collection('purchases').doc(purchaseId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async create(userId, purchaseData) {
    purchaseData.user_id = db.collection('users').doc(userId);
    purchaseData.purchased_at = new Date();
    const docRef = await db.collection('purchases').add(purchaseData);
    return { id: docRef.id, ...purchaseData };
  },

  async updateStatus(purchaseId, paymentStatus) {
    await db.collection('purchases').doc(purchaseId).update({
      payment_status: paymentStatus,
    });
    return this.getById(purchaseId);
  },

  async getSalesReport(userId, startDate, endDate) {
    const snapshot = await db.collection('purchases')
      .where('user_id', '==', db.collection('users').doc(userId))
      .where('purchased_at', '>=', startDate)
      .where('purchased_at', '<=', endDate)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════
// EXPORT SERVICES
// ════════════════════════════════════════════════════════════

module.exports = {
  userService,
  customerService,
  productService,
  invoiceService,
  orgSettingsService,
  purchaseService,
};

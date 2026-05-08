const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'sikko_invoice_app_super_secret_key_2026';

/**
 * Create JWT token for user
 */
const createToken = (userId, userData) => {
  return jwt.sign(
    {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'sales',
      employee_id: userData.employee_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired token: ' + err.message);
  }
};

module.exports = {
  createToken,
  verifyToken,
};

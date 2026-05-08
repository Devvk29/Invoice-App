const { verifyToken } = require("../jwt-auth");
require("dotenv").config();

/**
 * Authenticate using JWT Token
 * Token should be in Authorization header: Bearer <token>
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify JWT token
    const decodedToken = verifyToken(token);

    // Attach user to request
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      name: decodedToken.name,
      phone: decodedToken.phone,
      employee_id: decodedToken.employee_id,
      role: decodedToken.role || 'sales',
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

/**
 * Middleware: require specific roles
 * Usage: router.get('/admin-only', requireRole('admin'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied. Insufficient permissions.",
        required: roles,
        current: req.user?.role
      });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };

const { verifyToken, getFirebaseUser } = require("../firebase-auth");
require("dotenv").config();

/**
 * Authenticate using Firebase ID Token
 * Token should be in Authorization header: Bearer <idToken>
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await verifyToken(token);
    const uid = decodedToken.uid;

    // Fetch user data from Firestore (to get role and other info)
    const user = await getFirebaseUser(uid);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    // Attach user to request
    req.user = {
      id: uid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      employee_id: user.employee_id,
      role: user.role || 'sales',
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

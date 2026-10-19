const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'revora_default_secret_key_12345';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Session expired or invalid token. Please sign in again.' });
    }

    const user = db.prepare('SELECT id, name, email, roles, phone, city, address FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    try {
      user.roles = JSON.parse(user.roles || '["customer"]');
    } catch (e) {
      user.roles = ['customer'];
    }

    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      const user = db.prepare('SELECT id, name, email, roles, phone, city FROM users WHERE id = ?').get(decoded.id);
      if (user) {
        try {
          user.roles = JSON.parse(user.roles || '["customer"]');
        } catch (e) {
          user.roles = ['customer'];
        }
        req.user = user;
      }
    }
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRoles = req.user.roles || [];
    // admin has access to everything
    if (userRoles.includes('admin')) {
      return next();
    }

    const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  JWT_SECRET
};

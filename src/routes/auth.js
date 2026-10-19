const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('../utils/uuid');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, roles, address, city, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const userId = 'usr_' + uuidv4().substring(0, 8);
    const passwordHash = bcrypt.hashSync(password, 10);
    
    // Default roles to ['customer'] if none provided
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : ['customer'];

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, roles, address, city, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      passwordHash,
      JSON.stringify(userRoles),
      address || '',
      city || 'Bhimavaram',
      pincode || '534201'
    );

    const token = jwt.sign({ id: userId, email: email.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to REVORA.',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || '',
        roles: userRoles,
        city: city || 'Bhimavaram'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let roles = ['customer'];
    try {
      roles = JSON.parse(user.roles || '["customer"]');
    } catch (e) {}

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Sign in successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles,
        city: user.city,
        address: user.address,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during sign in.' });
  }
});

// Get current profile
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Update profile
router.put('/me', authenticateToken, (req, res) => {
  try {
    const { name, phone, address, city, pincode, roles } = req.body;
    const userId = req.user.id;

    let rolesJson = JSON.stringify(req.user.roles);
    if (Array.isArray(roles) && roles.length > 0) {
      rolesJson = JSON.stringify(roles);
    }

    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          pincode = COALESCE(?, pincode),
          roles = COALESCE(?, roles),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, address, city, pincode, rolesJson, userId);

    const updatedUser = db.prepare('SELECT id, name, email, phone, roles, city, address, pincode FROM users WHERE id = ?').get(userId);
    try {
      updatedUser.roles = JSON.parse(updatedUser.roles);
    } catch (e) {}

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;

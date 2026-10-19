const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get categories grouped by section or filtered by section query
router.get('/', (req, res) => {
  try {
    const { section } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    if (section) {
      query += ' WHERE section = ?';
      params.push(section);
    }

    query += ' ORDER BY name ASC';
    const categories = db.prepare(query).all(...params);

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to load categories.' });
  }
});

module.exports = router;

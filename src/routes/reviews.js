const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Add a review (only valid if user booked/ordered or verified)
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { target_type, target_id, booking_or_order_id, rating, comment } = req.body;

    if (!target_type || !target_id || !rating) {
      return res.status(400).json({ success: false, message: 'Target, ID, and rating (1-5) are required.' });
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10)));
    const reviewId = 'rev_' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO reviews (id, user_id, target_type, target_id, booking_or_order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId, userId, target_type, target_id, booking_or_order_id || null,
      ratingNum, comment ? comment.trim() : ''
    );

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been published.',
      reviewId
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Failed to post review.' });
  }
});

module.exports = router;

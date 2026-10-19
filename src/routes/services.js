const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// List service providers with filter by category, search, city, and verified status
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, city, verified } = req.query;

    let query = `
      SELECT sp.*, u.name as provider_name, u.email as provider_email, u.phone as provider_phone,
             u.avatar as provider_avatar, u.city as provider_city,
             c.name as category_name, c.slug as category_slug
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      JOIN categories c ON sp.category_id = c.id
      WHERE sp.is_available = 1
    `;
    const params = [];

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (city) {
      query += ` AND LOWER(u.city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }

    if (search) {
      query += ` AND (LOWER(sp.profession_title) LIKE LOWER(?) OR LOWER(sp.bio) LIKE LOWER(?) OR LOWER(u.name) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (verified === 'true' || verified === '1') {
      query += ` AND sp.is_verified = 1`;
    }

    query += ` ORDER BY sp.is_verified DESC, sp.experience_years DESC`;

    const rows = db.prepare(query).all(...params);

    const formatted = rows.map(item => {
      let skills = [];
      try { skills = JSON.parse(item.skills || '[]'); } catch (e) {}

      // Average rating calculation from verified reviews
      const ratingData = db.prepare(`
        SELECT COUNT(*) as review_count, AVG(rating) as avg_rating
        FROM reviews
        WHERE target_type = 'service_provider' AND target_id = ?
      `).get(item.id);

      return {
        ...item,
        skills,
        avg_rating: ratingData.avg_rating ? Number(ratingData.avg_rating.toFixed(1)) : 5.0,
        review_count: ratingData.review_count || 0,
        provider_phone: req.user ? item.provider_phone : (item.provider_phone ? item.provider_phone.slice(0, 7) + 'XXXX' : '')
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      providers: formatted
    });
  } catch (error) {
    console.error('Error fetching service providers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve service providers.' });
  }
});

// Single provider profile detail
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const provider = db.prepare(`
      SELECT sp.*, u.name as provider_name, u.email as provider_email, u.phone as provider_phone,
             u.avatar as provider_avatar, u.city as provider_city, u.address as provider_address,
             c.name as category_name, c.slug as category_slug
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      JOIN categories c ON sp.category_id = c.id
      WHERE sp.id = ?
    `).get(req.params.id);

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found.' });
    }

    let skills = [];
    try { skills = JSON.parse(provider.skills || '[]'); } catch (e) {}

    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'service_provider' AND r.target_id = ?
      ORDER BY r.created_at DESC
    `).all(provider.id);

    res.json({
      success: true,
      provider: {
        ...provider,
        skills,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching provider detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch provider.' });
  }
});

// Register or update service provider profile
router.post('/profile', authenticateToken, (req, res) => {
  try {
    const { category_id, profession_title, experience_years, hourly_rate, visiting_charge, service_areas, skills, bio } = req.body;
    const userId = req.user.id;

    if (!category_id || !profession_title) {
      return res.status(400).json({ success: false, message: 'Category and profession title are required.' });
    }

    // Ensure user has service_provider in their roles
    if (!req.user.roles.includes('service_provider')) {
      const updatedRoles = [...req.user.roles, 'service_provider'];
      db.prepare('UPDATE users SET roles = ? WHERE id = ?').run(JSON.stringify(updatedRoles), userId);
    }

    const existing = db.prepare('SELECT id FROM service_providers WHERE user_id = ?').get(userId);
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);

    if (existing) {
      db.prepare(`
        UPDATE service_providers
        SET category_id = ?,
            profession_title = ?,
            experience_years = ?,
            hourly_rate = ?,
            visiting_charge = ?,
            service_areas = ?,
            skills = ?,
            bio = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        category_id, profession_title.trim(), Number(experience_years) || 1,
        hourly_rate ? Number(hourly_rate) : null,
        visiting_charge ? Number(visiting_charge) : 200,
        service_areas || 'Bhimavaram',
        skillsJson, bio || '', existing.id
      );

      return res.json({ success: true, message: 'Service provider profile updated!', providerId: existing.id });
    } else {
      const providerId = 'sp_' + uuidv4().substring(0, 8);
      db.prepare(`
        INSERT INTO service_providers (
          id, user_id, category_id, profession_title, experience_years, hourly_rate,
          visiting_charge, service_areas, skills, bio, is_available, is_verified, is_demo
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 1, 1, 0
        )
      `).run(
        providerId, userId, category_id, profession_title.trim(), Number(experience_years) || 1,
        hourly_rate ? Number(hourly_rate) : null,
        visiting_charge ? Number(visiting_charge) : 200,
        service_areas || 'Bhimavaram',
        skillsJson, bio || ''
      );

      return res.status(201).json({ success: true, message: 'Service provider profile registered successfully!', providerId });
    }
  } catch (error) {
    console.error('Error saving provider profile:', error);
    res.status(500).json({ success: false, message: 'Failed to save provider profile.' });
  }
});

// Book a service provider
router.post('/:id/book', authenticateToken, (req, res) => {
  try {
    const providerId = req.params.id;
    const customerId = req.user.id;
    const { scheduled_date, scheduled_time_slot, service_address, city, phone, problem_description } = req.body;

    if (!scheduled_date || !scheduled_time_slot || !service_address || !phone || !problem_description) {
      return res.status(400).json({ success: false, message: 'Date, time slot, address, contact phone, and problem description are required.' });
    }

    const provider = db.prepare('SELECT * FROM service_providers WHERE id = ?').get(providerId);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found.' });
    }

    if (provider.user_id === customerId) {
      return res.status(400).json({ success: false, message: 'You cannot book a service with your own provider profile.' });
    }

    const bookingId = 'sb_' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO service_bookings (
        id, customer_id, provider_id, scheduled_date, scheduled_time_slot,
        service_address, city, phone, problem_description, estimated_cost,
        status, payment_status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        'pending', 'pending'
      )
    `).run(
      bookingId, customerId, providerId, scheduled_date, scheduled_time_slot,
      service_address.trim(), city || 'Bhimavaram', phone.trim(), problem_description.trim(),
      provider.visiting_charge || 200
    );

    // Notify the service provider
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'booking', '/dashboard.html?tab=provider-jobs')
    `).run(
      'notif_' + uuidv4().substring(0, 8),
      provider.user_id,
      'New Home Service Booking Request',
      `${req.user.name} requested service for ${scheduled_date} (${scheduled_time_slot}) in ${city || 'Bhimavaram'}.`
    );

    res.status(201).json({
      success: true,
      message: 'Service booking request placed! The specialist will contact you to confirm.',
      bookingId
    });
  } catch (error) {
    console.error('Error creating service booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create service booking.' });
  }
});

// Update service booking status (Provider or Admin or Customer cancellation)
router.patch('/bookings/:bookingId/status', authenticateToken, (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body; // 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'

    if (!['accepted', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }

    const booking = db.prepare(`
      SELECT b.*, sp.user_id as provider_user_id
      FROM service_bookings b
      JOIN service_providers sp ON b.provider_id = sp.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isProvider = booking.provider_user_id === req.user.id;
    const isCustomer = booking.customer_id === req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    if (!isProvider && !isCustomer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (['accepted', 'rejected'].includes(status) && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the provider can accept or reject this job.' });
    }

    db.prepare('UPDATE service_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, bookingId);

    // Notify customer
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'booking', '/dashboard.html?tab=service-bookings')
    `).run(
      'notif_' + uuidv4().substring(0, 8),
      booking.customer_id,
      `Service Job ${status.toUpperCase()}`,
      `Your service appointment #${bookingId} has been ${status}.`
    );

    res.json({ success: true, message: `Booking marked as ${status}.` });
  } catch (error) {
    console.error('Error updating service booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update service booking.' });
  }
});

module.exports = router;

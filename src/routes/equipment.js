const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const db = require('../db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// List equipment / general resources with search, filter, and pagination
router.get('/', optionalAuth, (req, res) => {
  try {
    const { section, category, search, city, min_price, max_price, available, sort } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.slug as category_slug, u.name as owner_name, u.phone as owner_phone
      FROM equipment_listings e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.owner_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (section) {
      query += ` AND e.section = ?`;
      params.push(section);
    }

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (city) {
      query += ` AND LOWER(e.city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }

    if (search) {
      query += ` AND (LOWER(e.title) LIKE LOWER(?) OR LOWER(e.description) LIKE LOWER(?) OR LOWER(e.brand) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (min_price) {
      query += ` AND e.price_per_day >= ?`;
      params.push(Number(min_price));
    }

    if (max_price) {
      query += ` AND e.price_per_day <= ?`;
      params.push(Number(max_price));
    }

    if (available === 'true' || available === '1') {
      query += ` AND e.is_available = 1`;
    }

    // Sort options
    if (sort === 'price_asc') {
      query += ` ORDER BY e.price_per_day ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY e.price_per_day DESC`;
    } else {
      query += ` ORDER BY e.created_at DESC`;
    }

    const rows = db.prepare(query).all(...params);

    // Format parsed JSON fields
    const formatted = rows.map(item => {
      let images = [];
      let specs = {};
      try { images = JSON.parse(item.images || '[]'); } catch (e) {}
      try { specs = JSON.parse(item.specifications || '{}'); } catch (e) {}

      return {
        ...item,
        images,
        specifications: specs,
        // protect phone number partially if not requested by authenticated user
        owner_phone: req.user ? item.owner_phone : (item.owner_phone ? item.owner_phone.slice(0, 7) + 'XXXX' : '')
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      listings: formatted
    });
  } catch (error) {
    console.error('Error fetching equipment listings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve listings.' });
  }
});

// Get single equipment detail by ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const item = db.prepare(`
      SELECT e.*, c.name as category_name, c.slug as category_slug, u.name as owner_name, u.phone as owner_phone, u.avatar as owner_avatar
      FROM equipment_listings e
      JOIN categories c ON e.category_id = c.id
      JOIN users u ON e.owner_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment listing not found.' });
    }

    let images = [];
    let specs = {};
    try { images = JSON.parse(item.images || '[]'); } catch (e) {}
    try { specs = JSON.parse(item.specifications || '{}'); } catch (e) {}

    // Get approved bookings to show blocked dates
    const existingBookings = db.prepare(`
      SELECT start_date, end_date, status
      FROM equipment_bookings
      WHERE equipment_id = ? AND status IN ('approved', 'in_progress')
    `).all(item.id);

    // Get reviews for this equipment
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'equipment' AND r.target_id = ?
      ORDER BY r.created_at DESC
    `).all(item.id);

    res.json({
      success: true,
      equipment: {
        ...item,
        images,
        specifications: specs,
        booked_intervals: existingBookings,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching equipment detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equipment details.' });
  }
});

// Create new equipment listing
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      category_id, section, title, description, brand, model,
      year_of_make, condition, pricing_type, price_per_day, price_per_hour,
      security_deposit, location, city, pincode, images, specifications
    } = req.body;

    if (!title || !description || !category_id || !price_per_day) {
      return res.status(400).json({ success: false, message: 'Title, description, category, and price per day are required.' });
    }

    if (Number(price_per_day) <= 0) {
      return res.status(400).json({ success: false, message: 'Price per day must be greater than zero.' });
    }

    const listingId = 'eq_' + uuidv4().substring(0, 8);
    const validSection = section === 'resource_sharing' ? 'resource_sharing' : 'farm_equipment';

    const imagesJson = Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : JSON.stringify([
      validSection === 'farm_equipment' 
        ? 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
    ]);

    const specsJson = typeof specifications === 'object' ? JSON.stringify(specifications) : JSON.stringify({});

    db.prepare(`
      INSERT INTO equipment_listings (
        id, owner_id, category_id, section, title, description, brand, model,
        year_of_make, condition, pricing_type, price_per_day, price_per_hour,
        security_deposit, location, city, pincode, images, specifications, is_available, is_demo
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 1, 0
      )
    `).run(
      listingId, req.user.id, category_id, validSection, title.trim(), description.trim(), brand || '', model || '',
      year_of_make ? Number(year_of_make) : null, condition || 'Good', pricing_type || 'daily',
      Number(price_per_day), price_per_hour ? Number(price_per_hour) : null,
      security_deposit ? Number(security_deposit) : 0, location || 'Bhimavaram',
      city || 'Bhimavaram', pincode || '534201', imagesJson, specsJson
    );

    res.status(201).json({
      success: true,
      message: 'Listing published successfully!',
      listingId
    });
  } catch (error) {
    console.error('Error creating equipment listing:', error);
    res.status(500).json({ success: false, message: 'Failed to create equipment listing.' });
  }
});

// Update an equipment listing
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM equipment_listings WHERE id = ?').get(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.owner_id !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this listing.' });
    }

    const {
      title, description, price_per_day, price_per_hour, security_deposit,
      location, city, is_available
    } = req.body;

    db.prepare(`
      UPDATE equipment_listings
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          price_per_day = COALESCE(?, price_per_day),
          price_per_hour = COALESCE(?, price_per_hour),
          security_deposit = COALESCE(?, security_deposit),
          location = COALESCE(?, location),
          city = COALESCE(?, city),
          is_available = COALESCE(?, is_available),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, price_per_day ? Number(price_per_day) : null,
      price_per_hour ? Number(price_per_hour) : null,
      security_deposit !== undefined ? Number(security_deposit) : null,
      location, city, is_available !== undefined ? Number(is_available) : null,
      req.params.id
    );

    res.json({ success: true, message: 'Listing updated successfully.' });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ success: false, message: 'Failed to update listing.' });
  }
});

// Delete an equipment listing
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM equipment_listings WHERE id = ?').get(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.owner_id !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this listing.' });
    }

    db.prepare('DELETE FROM equipment_listings WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete listing.' });
  }
});

// --- RENTAL BOOKING WORKFLOW ---

// Create rental request with strict conflict prevention
router.post('/:id/book', authenticateToken, (req, res) => {
  try {
    const equipmentId = req.params.id;
    const renterId = req.user.id;
    const { start_date, end_date, notes } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Both start date and end date are required.' });
    }

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date format.' });
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
    }

    const equipment = db.prepare('SELECT * FROM equipment_listings WHERE id = ?').get(equipmentId);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    if (!equipment.is_available) {
      return res.status(400).json({ success: false, message: 'This equipment is currently marked as unavailable by the owner.' });
    }

    if (equipment.owner_id === renterId) {
      return res.status(400).json({ success: false, message: 'You cannot book your own equipment listing.' });
    }

    // CRITICAL BACKEND ENFORCEMENT: Check for overlapping approved/in-progress bookings
    const conflict = db.prepare(`
      SELECT id, start_date, end_date FROM equipment_bookings
      WHERE equipment_id = ?
        AND status IN ('approved', 'in_progress')
        AND NOT (end_date < ? OR start_date > ?)
    `).get(equipmentId, start_date, end_date);

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: The equipment is already booked from ${conflict.start_date} to ${conflict.end_date}. Please choose different dates.`
      });
    }

    // Calculate duration in days (minimum 1 day)
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const totalAmount = durationDays * equipment.price_per_day;
    const securityDeposit = equipment.security_deposit || 0;

    const bookingId = 'bk_' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO equipment_bookings (
        id, equipment_id, renter_id, start_date, end_date, total_duration_days,
        total_amount, security_deposit, status, payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'demo_paid', ?)
    `).run(
      bookingId, equipmentId, renterId, start_date, end_date, durationDays,
      totalAmount, securityDeposit, notes || ''
    );

    // Notify the equipment owner
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'booking', '/dashboard.html?tab=equipment')
    `).run(
      'notif_' + uuidv4().substring(0, 8),
      equipment.owner_id,
      'New Rental Booking Request',
      `${req.user.name} requested to rent "${equipment.title}" for ${durationDays} day(s) (${start_date} to ${end_date}).`
    );

    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully! Awaiting owner confirmation.',
      booking: {
        id: bookingId,
        start_date,
        end_date,
        durationDays,
        totalAmount,
        securityDeposit,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error submitting booking request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rental request.' });
  }
});

// Owner Action: Approve or Reject Rental Request
router.patch('/bookings/:bookingId/status', authenticateToken, (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body; // 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'

    if (!['approved', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }

    const booking = db.prepare(`
      SELECT b.*, e.owner_id, e.title as equipment_title
      FROM equipment_bookings b
      JOIN equipment_listings e ON b.equipment_id = e.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isOwner = booking.owner_id === req.user.id;
    const isRenter = booking.renter_id === req.user.id;
    const isAdmin = req.user.roles.includes('admin');

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this booking.' });
    }

    // Only renter or owner can cancel
    if (status === 'cancelled' && !isRenter && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only renter or owner can cancel the booking.' });
    }

    // Only owner can approve or reject
    if (['approved', 'rejected'].includes(status) && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the equipment owner can approve or reject this booking.' });
    }

    // If approving, re-check overlap to prevent race conditions
    if (status === 'approved') {
      const conflict = db.prepare(`
        SELECT id FROM equipment_bookings
        WHERE equipment_id = ?
          AND id != ?
          AND status IN ('approved', 'in_progress')
          AND NOT (end_date < ? OR start_date > ?)
      `).get(booking.equipment_id, bookingId, booking.start_date, booking.end_date);

      if (conflict) {
        return res.status(409).json({ success: false, message: 'Cannot approve: another overlapping booking is already active.' });
      }
    }

    db.prepare('UPDATE equipment_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, bookingId);

    // Notify renter
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'booking', '/dashboard.html?tab=rentals')
    `).run(
      'notif_' + uuidv4().substring(0, 8),
      booking.renter_id,
      `Booking ${status.toUpperCase()}`,
      `Your rental request for "${booking.equipment_title}" has been ${status}.`
    );

    res.json({
      success: true,
      message: `Booking has been ${status} successfully.`,
      status
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

module.exports = router;

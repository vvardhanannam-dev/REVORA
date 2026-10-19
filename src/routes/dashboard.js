const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Aggregated Dashboard Data
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];

    // Customer: bookings & orders
    const myRentals = db.prepare(`
      SELECT b.*, e.title as equipment_title, e.images as equipment_images, e.section, u.name as owner_name, u.phone as owner_phone
      FROM equipment_bookings b
      JOIN equipment_listings e ON b.equipment_id = e.id
      JOIN users u ON e.owner_id = u.id
      WHERE b.renter_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);

    const myOrders = db.prepare(`
      SELECT o.*,
             (SELECT COUNT(*) FROM produce_order_items WHERE order_id = o.id) as item_count
      FROM produce_orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `).all(userId);

    const myServiceBookings = db.prepare(`
      SELECT sb.*, sp.profession_title, u.name as provider_name, u.phone as provider_phone
      FROM service_bookings sb
      JOIN service_providers sp ON sb.provider_id = sp.id
      JOIN users u ON sp.user_id = u.id
      WHERE sb.customer_id = ?
      ORDER BY sb.created_at DESC
    `).all(userId);

    // Farmer: My Products & Incoming produce orders
    let myProducts = [];
    let incomingProduceOrders = [];
    if (roles.includes('farmer') || roles.includes('admin')) {
      myProducts = db.prepare(`
        SELECT p.*, c.name as category_name
        FROM marketplace_products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.farmer_id = ?
        ORDER BY p.created_at DESC
      `).all(userId);

      incomingProduceOrders = db.prepare(`
        SELECT o.id as order_id, o.customer_id, o.delivery_address, o.customer_phone,
               o.payment_method, o.order_status, o.created_at,
               poi.quantity, poi.unit_price, poi.subtotal,
               p.title as product_title, p.unit,
               u.name as customer_name
        FROM produce_order_items poi
        JOIN produce_orders o ON poi.order_id = o.id
        JOIN marketplace_products p ON poi.product_id = p.id
        JOIN users u ON o.customer_id = u.id
        WHERE poi.farmer_id = ?
        ORDER BY o.created_at DESC
      `).all(userId);
    }

    // Equipment Owner: My Listings & Incoming rental requests
    let myListings = [];
    let incomingRentalRequests = [];
    if (roles.includes('equipment_owner') || roles.includes('farmer') || roles.includes('admin')) {
      myListings = db.prepare(`
        SELECT e.*, c.name as category_name
        FROM equipment_listings e
        JOIN categories c ON e.category_id = c.id
        WHERE e.owner_id = ?
        ORDER BY e.created_at DESC
      `).all(userId);

      incomingRentalRequests = db.prepare(`
        SELECT b.*, e.title as equipment_title, u.name as renter_name, u.phone as renter_phone, u.city as renter_city
        FROM equipment_bookings b
        JOIN equipment_listings e ON b.equipment_id = e.id
        JOIN users u ON b.renter_id = u.id
        WHERE e.owner_id = ?
        ORDER BY b.created_at DESC
      `).all(userId);
    }

    // Service Provider: Provider Jobs
    let providerProfile = null;
    let incomingServiceJobs = [];
    if (roles.includes('service_provider') || roles.includes('admin')) {
      providerProfile = db.prepare('SELECT * FROM service_providers WHERE user_id = ?').get(userId);
      if (providerProfile) {
        incomingServiceJobs = db.prepare(`
          SELECT sb.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
          FROM service_bookings sb
          JOIN users u ON sb.customer_id = u.id
          WHERE sb.provider_id = ?
          ORDER BY sb.created_at DESC
        `).all(providerProfile.id);
      }
    }

    // Admin Dashboard stats
    let adminStats = null;
    if (roles.includes('admin')) {
      adminStats = {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        totalEquipment: db.prepare('SELECT COUNT(*) as count FROM equipment_listings WHERE section = "farm_equipment"').get().count,
        totalResources: db.prepare('SELECT COUNT(*) as count FROM equipment_listings WHERE section = "resource_sharing"').get().count,
        totalProducts: db.prepare('SELECT COUNT(*) as count FROM marketplace_products').get().count,
        totalProviders: db.prepare('SELECT COUNT(*) as count FROM service_providers').get().count,
        totalOrders: db.prepare('SELECT COUNT(*) as count FROM produce_orders').get().count,
        totalEquipmentBookings: db.prepare('SELECT COUNT(*) as count FROM equipment_bookings').get().count,
        totalServiceBookings: db.prepare('SELECT COUNT(*) as count FROM service_bookings').get().count,
        allUsers: db.prepare('SELECT id, name, email, phone, roles, city, created_at FROM users ORDER BY created_at DESC LIMIT 20').all()
      };
    }

    res.json({
      success: true,
      summary: {
        rentals: myRentals,
        orders: myOrders,
        serviceBookings: myServiceBookings,
        products: myProducts,
        incomingProduceOrders,
        listings: myListings,
        incomingRentalRequests,
        providerProfile,
        incomingServiceJobs,
        adminStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard summary.' });
  }
});

module.exports = router;

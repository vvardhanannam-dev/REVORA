const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const db = require('../db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// List produce products with category, search, and sorting
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, city, method, sort } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as farmer_name, u.phone as farmer_phone
      FROM marketplace_products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.farmer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (search) {
      query += ` AND (LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (city) {
      query += ` AND LOWER(p.city) LIKE LOWER(?)`;
      params.push(`%${city}%`);
    }

    if (method) {
      query += ` AND p.farming_method = ?`;
      params.push(method);
    }

    if (sort === 'price_asc') {
      query += ` ORDER BY p.price_per_unit ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY p.price_per_unit DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    const rows = db.prepare(query).all(...params);

    const formatted = rows.map(item => {
      let images = [];
      try { images = JSON.parse(item.images || '[]'); } catch (e) {}
      return {
        ...item,
        images,
        farmer_phone: req.user ? item.farmer_phone : (item.farmer_phone ? item.farmer_phone.slice(0, 7) + 'XXXX' : '')
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      products: formatted
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve marketplace products.' });
  }
});

// Single product detail
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, u.name as farmer_name, u.phone as farmer_phone, u.avatar as farmer_avatar
      FROM marketplace_products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.farmer_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let images = [];
    try { images = JSON.parse(product.images || '[]'); } catch (e) {}

    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'product' AND r.target_id = ?
      ORDER BY r.created_at DESC
    `).all(product.id);

    res.json({
      success: true,
      product: {
        ...product,
        images,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    res.status(500).json({ success: false, message: 'Failed to load product.' });
  }
});

// Create produce listing (Farmers & Admins)
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      category_id, title, description, unit, price_per_unit,
      available_stock, minimum_order_qty, harvest_date,
      farming_method, location, city, images
    } = req.body;

    if (!title || !description || !category_id || !price_per_unit || !available_stock) {
      return res.status(400).json({ success: false, message: 'Title, description, category, price, and stock are required.' });
    }

    if (Number(price_per_unit) <= 0 || Number(available_stock) < 0) {
      return res.status(400).json({ success: false, message: 'Price and stock values must be positive numbers.' });
    }

    const prodId = 'prod_' + uuidv4().substring(0, 8);
    const imagesJson = Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : JSON.stringify([
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'
    ]);

    db.prepare(`
      INSERT INTO marketplace_products (
        id, farmer_id, category_id, title, description, unit,
        price_per_unit, available_stock, minimum_order_qty, harvest_date,
        farming_method, location, city, images, is_demo
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, 0
      )
    `).run(
      prodId, req.user.id, category_id, title.trim(), description.trim(), unit || 'kg',
      Number(price_per_unit), Number(available_stock), Number(minimum_order_qty) || 1,
      harvest_date || null, farming_method || 'Natural / Traditional',
      location || 'Bhimavaram Rural', city || 'Bhimavaram', imagesJson
    );

    res.status(201).json({
      success: true,
      message: 'Produce listed successfully on REVORA Marketplace!',
      productId: prodId
    });
  } catch (error) {
    console.error('Error creating produce listing:', error);
    res.status(500).json({ success: false, message: 'Failed to create product listing.' });
  }
});

// Update produce listing
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM marketplace_products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.farmer_id !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this product.' });
    }

    const {
      title, description, price_per_unit, available_stock,
      minimum_order_qty, harvest_date, farming_method, location, city
    } = req.body;

    db.prepare(`
      UPDATE marketplace_products
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          price_per_unit = COALESCE(?, price_per_unit),
          available_stock = COALESCE(?, available_stock),
          minimum_order_qty = COALESCE(?, minimum_order_qty),
          harvest_date = COALESCE(?, harvest_date),
          farming_method = COALESCE(?, farming_method),
          location = COALESCE(?, location),
          city = COALESCE(?, city),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, description, price_per_unit ? Number(price_per_unit) : null,
      available_stock !== undefined ? Number(available_stock) : null,
      minimum_order_qty ? Number(minimum_order_qty) : null,
      harvest_date, farming_method, location, city,
      req.params.id
    );

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// Delete produce listing
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM marketplace_products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (product.farmer_id !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this product.' });
    }

    db.prepare('DELETE FROM marketplace_products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product removed from marketplace.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// --- SHOPPING CART CHECKOUT WITH ACID TRANSACTION ---
router.post('/orders', authenticateToken, (req, res) => {
  const customerId = req.user.id;
  const { items, delivery_address, delivery_city, delivery_pincode, customer_phone, order_notes, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
  }

  if (!delivery_address || !customer_phone) {
    return res.status(400).json({ success: false, message: 'Delivery address and contact phone are required.' });
  }

  // Execute checkout inside a strict SQLite transaction
  const executeOrderTransaction = db.transaction(() => {
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM marketplace_products WHERE id = ?').get(item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} no longer exists.`);
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        throw new Error(`Invalid quantity for ${product.title}.`);
      }

      if (product.available_stock < qty) {
        throw new Error(`Insufficient stock for "${product.title}". Requested: ${qty} ${product.unit}, Available: ${product.available_stock} ${product.unit}.`);
      }

      const subtotal = qty * product.price_per_unit;
      calculatedTotal += subtotal;

      validatedItems.push({
        product,
        quantity: qty,
        unit_price: product.price_per_unit,
        subtotal
      });

      // Deduct stock immediately
      db.prepare(`
        UPDATE marketplace_products
        SET available_stock = available_stock - ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(qty, product.id);
    }

    const orderId = 'ord_' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO produce_orders (
        id, customer_id, total_amount, delivery_address, delivery_city,
        delivery_pincode, customer_phone, payment_method, payment_status,
        order_status, order_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo_paid', 'confirmed', ?)
    `).run(
      orderId, customerId, calculatedTotal, delivery_address.trim(), delivery_city || 'Bhimavaram',
      delivery_pincode || '534201', customer_phone.trim(), payment_method || 'demo_cod',
      order_notes || ''
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO produce_order_items (
        id, order_id, product_id, farmer_id, quantity, unit_price, subtotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vItem of validatedItems) {
      insertOrderItem.run(
        'item_' + uuidv4().substring(0, 8),
        orderId,
        vItem.product.id,
        vItem.product.farmer_id,
        vItem.quantity,
        vItem.unit_price,
        vItem.subtotal
      );

      // Send notification to farmer
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'order', '/dashboard.html?tab=farmer-orders')
      `).run(
        'notif_' + uuidv4().substring(0, 8),
        vItem.product.farmer_id,
        'New Produce Order Received',
        `Received order #${orderId} for ${vItem.quantity} ${vItem.product.unit} of "${vItem.product.title}".`
      );
    }

    return { orderId, totalAmount: calculatedTotal, itemCount: validatedItems.length };
  });

  try {
    const result = executeOrderTransaction();
    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Farmer has been notified.',
      order: result
    });
  } catch (err) {
    console.error('Order transaction failed:', err);
    res.status(400).json({ success: false, message: err.message || 'Checkout failed due to stock availability change.' });
  }
});

// Update order status (Farmer or Admin)
router.patch('/orders/:orderId/status', authenticateToken, (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'

    if (!['confirmed', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = db.prepare('SELECT * FROM produce_orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check if current user is the customer or one of the farmers in this order
    const isCustomer = order.customer_id === req.user.id;
    const orderItems = db.prepare('SELECT farmer_id FROM produce_order_items WHERE order_id = ?').all(orderId);
    const isFarmer = orderItems.some(i => i.farmer_id === req.user.id);
    const isAdmin = req.user.roles.includes('admin');

    if (!isCustomer && !isFarmer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this order.' });
    }

    db.prepare('UPDATE produce_orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, orderId);

    // Notify customer
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'order', '/dashboard.html?tab=orders')
    `).run(
      'notif_' + uuidv4().substring(0, 8),
      order.customer_id,
      `Order Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
      `Your order #${orderId} status has been updated to "${status.replace(/_/g, ' ')}".`
    );

    res.json({ success: true, message: `Order marked as ${status}.` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;

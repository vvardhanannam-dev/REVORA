const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;
if (process.env.VERCEL) {
  // On Vercel, /tmp is the only writable directory
  const tmpDir = '/tmp';
  dbPath = path.join(tmpDir, 'revora.db');
  const sourceDb = path.join(__dirname, '../../data/revora.db');
  if (fs.existsSync(sourceDb) && !fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(sourceDb, dbPath);
    } catch (e) {
      console.warn('Could not copy sqlite db to /tmp:', e.message);
    }
  }
} else {
  const dbDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'revora.db');
}

const db = new Database(dbPath);

// Enable foreign keys and WAL mode (WAL for local disk)
if (!process.env.VERCEL) {
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {}
}
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      roles TEXT NOT NULL DEFAULT '["customer"]', -- JSON array: customer, farmer, equipment_owner, service_provider, admin
      avatar TEXT,
      address TEXT,
      city TEXT DEFAULT 'Bhimavaram',
      state TEXT DEFAULT 'Andhra Pradesh',
      pincode TEXT DEFAULT '534201',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL, -- 'farm_equipment', 'marketplace', 'resource_sharing', 'home_services'
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT
    );

    -- Farm Equipment & General Resources listings
    CREATE TABLE IF NOT EXISTS equipment_listings (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      section TEXT NOT NULL, -- 'farm_equipment' or 'resource_sharing'
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      year_of_make INTEGER,
      condition TEXT DEFAULT 'Good', -- 'Excellent', 'Good', 'Fair'
      pricing_type TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
      price_per_day REAL,
      price_per_hour REAL,
      security_deposit REAL DEFAULT 0,
      location TEXT NOT NULL,
      city TEXT DEFAULT 'Bhimavaram',
      pincode TEXT DEFAULT '534201',
      images TEXT NOT NULL DEFAULT '[]', -- JSON array of image URLs
      specifications TEXT, -- JSON object
      is_available INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Equipment Rental Bookings
    CREATE TABLE IF NOT EXISTS equipment_bookings (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      renter_id TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_duration_days INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      security_deposit REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'
      payment_status TEXT DEFAULT 'demo_paid', -- 'pending', 'demo_paid', 'refunded'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment_listings(id) ON DELETE CASCADE,
      FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Farm-to-Consumer Produce / Marketplace Products
    CREATE TABLE IF NOT EXISTS marketplace_products (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'gram', 'quintal', 'dozen', 'box'
      price_per_unit REAL NOT NULL,
      available_stock REAL NOT NULL,
      minimum_order_qty REAL DEFAULT 1,
      harvest_date DATE,
      farming_method TEXT DEFAULT 'Natural / Traditional', -- 'Organic', 'Natural / Traditional', 'Hydroponic'
      location TEXT NOT NULL,
      city TEXT DEFAULT 'Bhimavaram',
      images TEXT NOT NULL DEFAULT '[]', -- JSON array
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Produce Orders
    CREATE TABLE IF NOT EXISTS produce_orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_city TEXT DEFAULT 'Bhimavaram',
      delivery_pincode TEXT DEFAULT '534201',
      customer_phone TEXT NOT NULL,
      payment_method TEXT DEFAULT 'demo_cod', -- 'demo_cod', 'demo_online'
      payment_status TEXT DEFAULT 'demo_paid',
      order_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'
      order_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Produce Order Items
    CREATE TABLE IF NOT EXISTS produce_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES produce_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES marketplace_products(id)
    );

    -- Local Home Service Providers
    CREATE TABLE IF NOT EXISTS service_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL,
      profession_title TEXT NOT NULL,
      experience_years INTEGER DEFAULT 3,
      hourly_rate REAL,
      visiting_charge REAL DEFAULT 200,
      service_areas TEXT DEFAULT 'Bhimavaram and 15km radius',
      skills TEXT DEFAULT '[]', -- JSON array
      bio TEXT,
      is_available INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 1,
      is_demo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Home Service Bookings
    CREATE TABLE IF NOT EXISTS service_bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      scheduled_date DATE NOT NULL,
      scheduled_time_slot TEXT NOT NULL, -- e.g. "10:00 AM - 12:00 PM"
      service_address TEXT NOT NULL,
      city TEXT DEFAULT 'Bhimavaram',
      phone TEXT NOT NULL,
      problem_description TEXT NOT NULL,
      estimated_cost REAL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
    );

    -- Reviews & Ratings (Ground truth: linked to completed bookings/orders)
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL, -- 'equipment', 'product', 'service_provider'
      target_id TEXT NOT NULL,
      booking_or_order_id TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'order', 'booking'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

initSchema();

// Auto-seed if database is newly initialized
try {
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCheck || userCheck.count === 0) {
    const { seedData } = require('./seed');
    seedData();
  }
} catch (e) {
  // Continue if table locked or in migration
}

module.exports = db;

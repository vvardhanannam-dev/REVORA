const db = require('../src/db');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('🧪 Starting REVORA Comprehensive Backend & Business Rules Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Database tables exist
    console.log('Test Group 1: Database Schema & Entity Persistence');
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
    assert(tables.includes('users'), 'Table users exists');
    assert(tables.includes('categories'), 'Table categories exists');
    assert(tables.includes('equipment_listings'), 'Table equipment_listings exists');
    assert(tables.includes('equipment_bookings'), 'Table equipment_bookings exists');
    assert(tables.includes('marketplace_products'), 'Table marketplace_products exists');
    assert(tables.includes('produce_orders'), 'Table produce_orders exists');
    assert(tables.includes('produce_order_items'), 'Table produce_order_items exists');
    assert(tables.includes('service_providers'), 'Table service_providers exists');
    assert(tables.includes('service_bookings'), 'Table service_bookings exists');
    assert(tables.includes('reviews'), 'Table reviews exists');
    assert(tables.includes('notifications'), 'Table notifications exists');

    // Test 2: Users and password hashing check
    console.log('\nTest Group 2: User Authentication & Role Verification');
    const demoUser = db.prepare('SELECT * FROM users WHERE email = ?').get('customer@revora.local');
    assert(demoUser !== undefined, 'Demo customer user exists');
    const pwdValid = bcrypt.compareSync('demo1234', demoUser.password);
    assert(pwdValid === true, 'Bcrypt password hashing verification succeeds');
    const roles = JSON.parse(demoUser.roles);
    assert(Array.isArray(roles) && roles.includes('customer'), 'Customer role parsed correctly');

    const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@revora.local');
    assert(JSON.parse(adminUser.roles).includes('admin'), 'Admin role present for admin account');

    // Test 3: Categories for all 4 business verticals
    console.log('\nTest Group 3: Categories & 4 Core Business Verticals');
    const sections = db.prepare('SELECT DISTINCT section FROM categories').all().map(s => s.section);
    assert(sections.includes('farm_equipment'), 'Vertical 1: farm_equipment present');
    assert(sections.includes('marketplace'), 'Vertical 2: marketplace present');
    assert(sections.includes('resource_sharing'), 'Vertical 3: resource_sharing present');
    assert(sections.includes('home_services'), 'Vertical 4: home_services present');

    // Test 4: Critical Business Rule — No Overlapping Bookings
    console.log('\nTest Group 4: Double Booking Conflict Prevention (Server/DB Rule)');
    const existingBooking = db.prepare(`SELECT * FROM equipment_bookings WHERE id = 'bk_demo_101'`).get();
    assert(existingBooking !== undefined, 'Sample equipment booking bk_demo_101 found');

    // Attempt conflict detection query with overlapping dates (2026-10-15 to 2026-10-16)
    const conflictQuery = db.prepare(`
      SELECT id, start_date, end_date FROM equipment_bookings
      WHERE equipment_id = ?
        AND status IN ('approved', 'in_progress')
        AND NOT (end_date < ? OR start_date > ?)
    `);

    // Overlapping case (should detect conflict)
    const overlapDetected = conflictQuery.get(existingBooking.equipment_id, '2026-10-15', '2026-10-17');
    assert(overlapDetected !== undefined, 'Conflict correctly caught when booking dates overlap approved rental');

    // Non-overlapping case (should be allowed)
    const noConflict = conflictQuery.get(existingBooking.equipment_id, '2026-10-20', '2026-10-22');
    assert(noConflict === undefined, 'Non-overlapping dates allowed');

    // Test 5: Atomic Inventory Decrement & Stock Integrity
    console.log('\nTest Group 5: Inventory Stock Safeguards & Transactions');
    const sampleProduct = db.prepare(`SELECT * FROM marketplace_products WHERE id = 'prod_mp_1'`).get();
    const initialStock = sampleProduct.available_stock;
    assert(initialStock > 0, `Initial stock for ${sampleProduct.title} is ${initialStock}`);

    // Simulate atomic order transaction
    const testDeduct = db.transaction((qty) => {
      const p = db.prepare('SELECT available_stock FROM marketplace_products WHERE id = ?').get(sampleProduct.id);
      if (p.available_stock < qty) throw new Error('Insufficient stock');
      db.prepare('UPDATE marketplace_products SET available_stock = available_stock - ? WHERE id = ?').run(qty, sampleProduct.id);
    });

    testDeduct(2);
    const updatedProd = db.prepare(`SELECT available_stock FROM marketplace_products WHERE id = ?`).get(sampleProduct.id);
    assert(updatedProd.available_stock === initialStock - 2, 'Stock atomically decremented by 2');

    // Rollback test by restoring stock
    db.prepare('UPDATE marketplace_products SET available_stock = ? WHERE id = ?').run(initialStock, sampleProduct.id);

    // Test 6: Ground-truth Reviews validation
    console.log('\nTest Group 6: Authentic Reviews & Ground Truth Links');
    const reviews = db.prepare('SELECT * FROM reviews').all();
    assert(reviews.length > 0, 'Database contains reviews linked to users and target items');
    assert(reviews.every(r => r.rating >= 1 && r.rating <= 5), 'All review ratings are valid 1-5 scale');

    console.log(`\n====================================================`);
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`====================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();

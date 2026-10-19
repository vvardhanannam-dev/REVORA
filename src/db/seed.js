let defaultDb;
try {
  defaultDb = require('./index');
} catch (e) {}

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('../utils/uuid');

function seedData(targetDb) {
  const db = targetDb || defaultDb || require('./index');
  if (!db || typeof db.exec !== 'function') {
    console.warn('Notice: Cannot seed database, db instance not available');
    return;
  }
  console.log('🌱 Starting REVORA sample and demonstration data seed...');

  // Clear existing demonstration data if needed
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM reviews;
    DELETE FROM service_bookings;
    DELETE FROM service_providers;
    DELETE FROM produce_order_items;
    DELETE FROM produce_orders;
    DELETE FROM marketplace_products;
    DELETE FROM equipment_bookings;
    DELETE FROM equipment_listings;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  const passwordHash = bcrypt.hashSync('demo1234', 10);

  // 1. Seed Users (Demo Accounts for Customer, Farmer, Equipment Owner, Service Providers, and Admin)
  const users = [
    {
      id: 'usr_admin_1',
      name: 'Ravi Teja Varma (Admin)',
      email: 'admin@revora.local',
      phone: '+91 98480 11223',
      password: passwordHash,
      roles: JSON.stringify(['admin', 'customer']),
      address: 'Near Someswara Temple, Gandhi Nagar',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_farmer_1',
      name: 'Subba Rao Vegesna (Farmer)',
      email: 'farmer@revora.local',
      phone: '+91 94401 23456',
      password: passwordHash,
      roles: JSON.stringify(['farmer', 'equipment_owner', 'customer']),
      address: 'Lankalakoderu Road, Near Canal Bridge',
      city: 'Bhimavaram Rural',
      state: 'Andhra Pradesh',
      pincode: '534202',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_owner_1',
      name: 'Kalyan Chakravarthi (Equipment Owner)',
      email: 'owner@revora.local',
      phone: '+91 98852 33445',
      password: passwordHash,
      roles: JSON.stringify(['equipment_owner', 'customer']),
      address: 'Undi Road, By-Pass Junction',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534204',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_service_1',
      name: 'Prasad Namburi',
      email: 'prasad.electric@revora.local',
      phone: '+91 99590 88776',
      password: passwordHash,
      roles: JSON.stringify(['service_provider', 'customer']),
      address: 'J.P. Road, Near Bus Stand',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_service_2',
      name: 'Ramana Murthy',
      email: 'ramana.plumber@revora.local',
      phone: '+91 91772 44556',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Palakollu Road, Main Circle',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://content.jdmagicbox.com/v2/comp/durg/m1/9999px788.x788.240924214733.w8m1/catalogue/raju-plumber-durg-plumbers-51ab03f0pl.jpg'
    },
    {
      id: 'usr_service_3',
      name: 'Narayana Achari',
      email: 'narayana.carpenter@revora.local',
      phone: '+91 98492 55667',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Wood Market Street, Someswara Temple',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://images.finehomebuilding.com/app/uploads/2016/04/09192719/MC-logo684x497.jpg'
    },
    {
      id: 'usr_service_4',
      name: 'Satish Painter',
      email: 'satish.paint@revora.local',
      phone: '+91 94901 66778',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Bhimavaram 2-Town, Balusumoodi',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534202',
      avatar: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'usr_service_5',
      name: 'Suresh Kumar',
      email: 'suresh.ac@revora.local',
      phone: '+91 99887 77889',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Subhash Road, Gandhi Nagar',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_service_6',
      name: 'Srinivas Clean Team',
      email: 'srinivas.clean@revora.local',
      phone: '+91 98661 11224',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Canal Bund Road, Ward 5',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://content3.jdmagicbox.com/v2/comp/tumkur/e3/9999px816.x816.220830111151.j7e3/catalogue/s-a-p-r-home-deep-cleaning-service-and-water-tank-cleaning-settihalli-tumkur-tumkur-water-tank-cleaning-services-z6blhlx6qs.jpg'
    },
    {
      id: 'usr_service_7',
      name: 'Kiran Pest Solutions',
      email: 'kiran.pest@revora.local',
      phone: '+91 93945 22334',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Near Old Bus Stand',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://5.imimg.com/data5/SELLER/Default/2026/7/624125951/VZ/SG/XT/222435075/eco-friendly-pest-control-service-500x500.jpg'
    },
    {
      id: 'usr_service_8',
      name: 'Apparao Green Works',
      email: 'apparao.gardener@revora.local',
      phone: '+91 97011 33445',
      password: passwordHash,
      roles: JSON.stringify(['service_provider']),
      address: 'Lankalakoderu Road, Near Plant Nursery',
      city: 'Bhimavaram Rural',
      state: 'Andhra Pradesh',
      pincode: '534202',
      avatar: 'https://gardenist.in/images/tree-pruning.webp'
    },
    {
      id: 'usr_customer_1',
      name: 'Lakshmi Prasanna (Community Member)',
      email: 'customer@revora.local',
      phone: '+91 96521 99887',
      password: passwordHash,
      roles: JSON.stringify(['customer']),
      address: 'Sriram Puram, 3rd Lane',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      pincode: '534201',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, phone, password, roles, address, city, state, pincode, avatar)
    VALUES (@id, @name, @email, @phone, @password, @roles, @address, @city, @state, @pincode, @avatar)
  `);

  for (const user of users) {
    insertUser.run(user);
  }

  // 2. Categories for the four domains
  const categories = [
    // Farm Equipment
    { id: 'cat_fe_tractors', section: 'farm_equipment', name: 'Tractors & Attachments', slug: 'tractors-attachments', icon: 'bi-truck', description: 'Agricultural tractors, rotavators, and plows' },
    { id: 'cat_fe_harvesters', section: 'farm_equipment', name: 'Harvesters & Threshers', slug: 'harvesters-threshers', icon: 'bi-gear-wide-connected', description: 'Paddy combined harvesters and grain threshers' },
    { id: 'cat_fe_tillers', section: 'farm_equipment', name: 'Power Tillers & Weeders', slug: 'power-tillers-weeders', icon: 'bi-wrench-adjustable', description: 'Rotary weeders, mini tillers and cultivators' },
    { id: 'cat_fe_sprayers', section: 'farm_equipment', name: 'Sprayers & Dusters', slug: 'sprayers-dusters', icon: 'bi-droplet-half', description: 'Battery & fuel sprayers, drone spraying gear' },
    { id: 'cat_fe_seeders', section: 'farm_equipment', name: 'Seed Drills & Planters', slug: 'seed-drills-planters', icon: 'bi-grid-3x3', description: 'Precision seeders and paddy transplanting equipment' },
    { id: 'cat_fe_irrigation', section: 'farm_equipment', name: 'Irrigation & High Flow Pumps', slug: 'irrigation-pumps', icon: 'bi-droplet', description: 'Diesel & electric water pumps for farm irrigation' },
    { id: 'cat_fe_trailers', section: 'farm_equipment', name: 'Trailers & Haulage', slug: 'trailers-haulage', icon: 'bi-box-seam', description: 'Tractor tipping trailers and transport carts' },

    // Marketplace (Farm-to-Consumer Produce)
    { id: 'cat_mp_vegetables', section: 'marketplace', name: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: 'bi-basket', description: 'Locally grown green leafy vegetables, tomatoes, and gourds' },
    { id: 'cat_mp_fruits', section: 'marketplace', name: 'Seasonal Fruits', slug: 'seasonal-fruits', icon: 'bi-apple', description: 'Mangoes, bananas, papayas, and citrus fresh from West Godavari farms' },
    { id: 'cat_mp_grains', section: 'marketplace', name: 'Rice & Paddy Grains', slug: 'rice-paddy-grains', icon: 'bi-flower1', description: 'Traditional BPT 5204 Sona Masoori, brown rice, and pulses' },
    { id: 'cat_mp_dairy', section: 'marketplace', name: 'Dairy & Farm Products', slug: 'dairy-farm-products', icon: 'bi-cup-straw', description: 'Pure ghee, natural raw honey, and farm fresh eggs' },

    // Resource Sharing (General Equipment)
    { id: 'cat_rs_power', section: 'resource_sharing', name: 'Power Tools & Drills', slug: 'power-tools-drills', icon: 'bi-tools', description: 'Hammer drills, impact drivers, angle grinders' },
    { id: 'cat_rs_ladders', section: 'resource_sharing', name: 'Ladders & Scaffolds', slug: 'ladders-scaffolds', icon: 'bi-ladder', description: 'Aluminum folding ladders, step stools, access platforms' },
    { id: 'cat_rs_garden', section: 'resource_sharing', name: 'Gardening & Landscaping', slug: 'gardening-landscaping', icon: 'bi-tree', description: 'Lawn mowers, hedge trimmers, high-pressure washers' },
    { id: 'cat_rs_construction', section: 'resource_sharing', name: 'Construction & Utility Tools', slug: 'construction-utility-tools', icon: 'bi-hammer', description: 'Concrete mixers, generators, canopies, and water storage' },

    // Home Services
    { id: 'cat_hs_electrician', section: 'home_services', name: 'Electrical Work', slug: 'electrical-work', icon: 'bi-lightning-charge', description: 'Wiring, fan installation, switchboard repair, inverter setup' },
    { id: 'cat_hs_plumber', section: 'home_services', name: 'Plumbing Services', slug: 'plumbing-services', icon: 'bi-water', description: 'Leak repairs, pipe fitting, sanitary fixture installations' },
    { id: 'cat_hs_carpenter', section: 'home_services', name: 'Carpentry & Furniture', slug: 'carpentry-furniture', icon: 'bi-door-open', description: 'Door repairs, woodwork, custom shelving, hinge replacement' },
    { id: 'cat_hs_appliance', section: 'home_services', name: 'Appliance Repair', slug: 'appliance-repair', icon: 'bi-tv', description: 'Air conditioner servicing, washing machines, refrigerators' },
    { id: 'cat_hs_painting', section: 'home_services', name: 'Painting & Waterproofing', slug: 'painting-waterproofing', icon: 'bi-brush', description: 'Interior/exterior painting and terrace waterproofing' },
    { id: 'cat_hs_cleaning', section: 'home_services', name: 'Deep Cleaning & Sanitization', slug: 'cleaning-sanitization', icon: 'bi-droplet', description: 'Sump tank cleaning, floor scrubbing and pressure washing' },
    { id: 'cat_hs_pest', section: 'home_services', name: 'Pest & Termite Control', slug: 'pest-control', icon: 'bi-shield-check', description: 'Odorless termite control and field pest eradication' },
    { id: 'cat_hs_gardening', section: 'home_services', name: 'Gardener & Tree Pruning', slug: 'gardening-services', icon: 'bi-tree', description: 'Lawn trimming, hedge shaping and farm landscaping' }
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (id, section, name, slug, icon, description)
    VALUES (@id, @section, @name, @slug, @icon, @description)
  `);

  for (const cat of categories) {
    insertCat.run(cat);
  }

  // 3. Farm Equipment Listings (8 items matching Homepage imagery & specifications)
  const equipment = [
    {
      id: 'eq_fe_1',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_fe_tractors',
      section: 'farm_equipment',
      title: 'Mahindra 575 DI Tractor with Rotavator (45 HP)',
      description: 'Reliable 45 HP diesel tractor equipped with 6-feet rotavator, suitable for wet and dry land cultivation in Bhimavaram delta fields. Clean maintenance and includes experienced driver option.',
      brand: 'Mahindra',
      model: '575 DI XP Plus',
      year_of_make: 2022,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 1800,
      price_per_hour: 350,
      security_deposit: 2000,
      location: 'Gollalakoderu Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534202',
      images: JSON.stringify([
        'https://5.imimg.com/data5/SELLER/Default/2022/9/OV/PE/OZ/10964752/mahindra-575-di-xp-plus-tractor.jpg',
        '/assets/images/equipment/mahindra_575_tractor.jpg'
      ]),
      specifications: JSON.stringify({ HP: '45 HP', Fuel: 'Diesel', Implements: 'Rotavator + Cultivator', 'Driver Provided': 'Yes, on request' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_2',
      owner_id: 'usr_owner_1',
      category_id: 'cat_fe_seeders',
      section: 'farm_equipment',
      title: 'Multi-Crop Seed Drill Planter (11 Tynes)',
      description: 'Zero-till precision seed and fertilizer drill. Ensures uniform seed depth and row spacing for paddy, pulses, and maize.',
      brand: 'Fieldking',
      model: 'FK-SD-11',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 1200,
      price_per_hour: 200,
      security_deposit: 1200,
      location: 'Undi Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534204',
      images: JSON.stringify([
        'https://img.agriexpo.online/images_ag/photo-g/176277-16755156.webp',
        '/assets/images/equipment/precision_seed_drill.webp'
      ]),
      specifications: JSON.stringify({ Tynes: '11 rows', Compatibility: '35-50 HP tractors', Capacity: '100 kg seed box' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_3',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_fe_tillers',
      section: 'farm_equipment',
      title: 'VST Shakti 130 DI Power Tiller (13 HP)',
      description: 'Heavy duty multi-utility power tiller with rotary blades, puddle wheels, and trailer hitch. Easy maneuvering for smaller paddy parcels and vegetable patches.',
      brand: 'VST Shakti',
      model: '130 DI',
      year_of_make: 2022,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 950,
      price_per_hour: 180,
      security_deposit: 1000,
      location: 'Lankalakoderu, Bhimavaram Rural',
      city: 'Bhimavaram Rural',
      pincode: '534202',
      images: JSON.stringify([
        'https://cpimg.tistatic.com/06663819/b/4/VST-Shakti-130-di-Power-Tiller.jpg',
        '/assets/images/equipment/vst_shakti_power_tiller.jpg'
      ]),
      specifications: JSON.stringify({ HP: '13 HP', Weight: '480 kg', Operation: 'Hand clutch controlled' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_4',
      owner_id: 'usr_owner_1',
      category_id: 'cat_fe_sprayers',
      section: 'farm_equipment',
      title: 'Neptune 16L Battery Knapsack Sprayer Set (Pair)',
      description: 'Pair of dual-battery operated knapsack sprayers with brass telescopic lances. High pressure nozzle for foliar fertilizer and organic neem spray.',
      brand: 'Neptune',
      model: 'BS-16D',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 350,
      price_per_hour: 120,
      security_deposit: 400,
      location: 'J.P. Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534201',
      images: JSON.stringify([
        'https://gojd.co.in/cdn/shop/files/neptune.jpg?v=1758694057',
        '/assets/images/equipment/neptune_battery_sprayer.jpg'
      ]),
      specifications: JSON.stringify({ Capacity: '16 Litres each', Battery: '12V 12Ah', Runtime: '6-8 hours' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_5',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_fe_irrigation',
      section: 'farm_equipment',
      title: 'Diesel High Flow Water Pump (5 HP)',
      description: 'Fast priming 5 HP diesel water pump with 3-inch delivery hose. Perfect for canal lifting, borewell backup, and field dewatering.',
      brand: 'Kirloskar',
      model: 'Mega Flow 5HP',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 500,
      price_per_hour: 100,
      security_deposit: 800,
      location: 'Canal Road, Bhimavaram Rural',
      city: 'Bhimavaram Rural',
      pincode: '534202',
      images: JSON.stringify([
        'https://m.media-amazon.com/images/I/51nUsZTTWML._AC_UF1000,1000_QL80_.jpg',
        '/assets/images/equipment/diesel_water_pump.jpg'
      ]),
      specifications: JSON.stringify({ Power: '5 HP Diesel', Delivery: '3 Inch', Discharge: '1200 LPM' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_6',
      owner_id: 'usr_owner_1',
      category_id: 'cat_fe_harvesters',
      section: 'farm_equipment',
      title: 'Kubota DC-68G Paddy Combined Harvester',
      description: 'Rubber-crawler paddy harvester ideal for wet delta soils. Minimizes grain loss and delivers clean harvest. Fast turnaround per acre.',
      brand: 'Kubota',
      model: 'DC-68G',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 4800,
      price_per_hour: 850,
      security_deposit: 5000,
      location: 'Undi Road Bypass, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534204',
      images: JSON.stringify([
        'https://www.kubota.com/products/farm-m/images/img_lineup_04.jpg',
        '/assets/images/equipment/kubota_paddy_harvester.jpg'
      ]),
      specifications: JSON.stringify({ 'Cut Width': '2.0 meters', Track: 'Rubber Crawler', GrainTank: '1200 Litres' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_7',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_fe_trailers',
      section: 'farm_equipment',
      title: 'Tractor Tipping Trailer (3 Ton Capacity)',
      description: 'Heavy duty hydraulic tipping trolley suitable for grain haulage, manure transport, and fertilizer distribution from godowns.',
      brand: 'Shaktiman',
      model: 'Hydraulic 3T',
      year_of_make: 2022,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 750,
      price_per_hour: 150,
      security_deposit: 1500,
      location: 'Somavaram Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534202',
      images: JSON.stringify([
        'https://5.imimg.com/data5/SELLER/Default/2025/12/569468769/NH/KS/OH/5953400/3-ton-tractor-trailer-500x500.png',
        '/assets/images/equipment/tractor_tipping_trailer.png'
      ]),
      specifications: JSON.stringify({ Capacity: '3 Metric Tons', Tipping: 'Hydraulic Ram', Tyres: 'Dual Axle Heavy Duty' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_fe_8',
      owner_id: 'usr_owner_1',
      category_id: 'cat_fe_tractors',
      section: 'farm_equipment',
      title: 'Rotary Tiller Rotavator (6 Feet Heavy Duty)',
      description: 'High-speed rotary tiller implement for dry and wet puddling. Features Boron steel blades for thorough soil pulverization.',
      brand: 'Maschio Gaspardo',
      model: 'Rotavator 6FT',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 1100,
      price_per_hour: 220,
      security_deposit: 1500,
      location: 'Palakollu Bypass, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534204',
      images: JSON.stringify([
        'https://cpimg.tistatic.com/12909262/b/4/45-hp-heavy-duty-rotavator-6-feet-42-blade.jpeg',
        '/assets/images/equipment/heavy_duty_rotavator.jpeg'
      ]),
      specifications: JSON.stringify({ Width: '6 Feet (1.8m)', Blades: '48 L-Type Boron Steel', Weight: '430 kg' }),
      is_available: 1,
      is_demo: 1
    }
  ];

  const insertEquipment = db.prepare(`
    INSERT INTO equipment_listings (
      id, owner_id, category_id, section, title, description, brand, model,
      year_of_make, condition, pricing_type, price_per_day, price_per_hour,
      security_deposit, location, city, pincode, images, specifications, is_available, is_demo
    ) VALUES (
      @id, @owner_id, @category_id, @section, @title, @description, @brand, @model,
      @year_of_make, @condition, @pricing_type, @price_per_day, @price_per_hour,
      @security_deposit, @location, @city, @pincode, @images, @specifications, @is_available, @is_demo
    )
  `);

  for (const eq of equipment) {
    insertEquipment.run(eq);
  }

  // 4. Resource Sharing (8 General Tools & Community Items matching Homepage)
  const resources = [
    {
      id: 'eq_rs_1',
      owner_id: 'usr_owner_1',
      category_id: 'cat_rs_power',
      section: 'resource_sharing',
      title: '5 kVA Silent Diesel Generator',
      description: 'Reliable silent diesel generator for events, field pump backup, and emergency power support. Includes automatic voltage regulation.',
      brand: 'Kirloskar Green',
      model: 'KG1-5KVA',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'hourly',
      price_per_day: 1800,
      price_per_hour: 350,
      security_deposit: 3000,
      location: 'Gandhi Nagar, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534201',
      images: JSON.stringify([
        'https://images.jdmagicbox.com/quickquotes/images_main/harvest-diesel-generator-5-kva-2217101310-o1h2ihpy.jpg',
        '/assets/images/resources/generator_5kva.jpg'
      ]),
      specifications: JSON.stringify({ Output: '5 kVA / 4 kW', Fuel: 'Diesel', SoundLevel: 'Below 65 dB' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_2',
      owner_id: 'usr_owner_1',
      category_id: 'cat_rs_construction',
      section: 'resource_sharing',
      title: 'Weatherproof Tents & Canopies (Event Set)',
      description: 'Sturdy waterproof event canopies and shamiana structures for village gatherings, agricultural exhibitions, and celebrations.',
      brand: 'ProCanopy',
      model: 'HeavyDuty 20x20',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 600,
      price_per_hour: 100,
      security_deposit: 1500,
      location: 'Srirampuram, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534201',
      images: JSON.stringify([
        'https://i5.walmartimages.com/seo/Automatic-Quick-Open-Tent-with-Canopy-Portable-Outdoor-Rain-Sun-Proof-Tent-for-Family-Travel-self-drive-camping-3-4-4-6-People_a65588ef-06e9-4365-8038-17d9b41b466c.8626457b357905b5ec21aca83e2f22c9.png',
        '/assets/images/resources/weatherproof_tents.png'
      ]),
      specifications: JSON.stringify({ Size: '20 x 20 Feet', Material: 'Heavy PVC Coated Canvas', Framework: 'Galvanized Steel' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_3',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_rs_construction',
      section: 'resource_sharing',
      title: 'Stackable Event Chairs & Tables (Set of 50)',
      description: 'Clean, durable plastic banquet chairs and folding banquet tables. Ideal for family functions, farm meetings, and poojas.',
      brand: 'Nilkamal',
      model: 'Commercial Series',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 450,
      price_per_hour: 80,
      security_deposit: 1000,
      location: 'Lankalakoderu Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534202',
      images: JSON.stringify([
        'https://cdn-ilalmnl.nitrocdn.com/IyXyLnYOAWdljrWUxZEqUJofXyjhLHZn/assets/images/optimized/rev-dc95a63/rentforevent.in/wp-content/uploads/2024/06/Rent-Luxurious-Banquet-Chairs-for-Events-in-Bangalore.jpg',
        '/assets/images/resources/event_chairs.jpg'
      ]),
      specifications: JSON.stringify({ Quantity: '50 Chairs + 5 Long Tables', LoadLimit: '150 kg per chair' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_4',
      owner_id: 'usr_owner_1',
      category_id: 'cat_rs_construction',
      section: 'resource_sharing',
      title: 'Heavy Duty Concrete Mixer Machine (1 Bag)',
      description: 'Portable petrol/electric powered drum concrete mixer with easy tilting wheel. Essential for farm canal linings, house floors, and sheds.',
      brand: 'Safari',
      model: 'Drum Mixer 10/7',
      year_of_make: 2022,
      condition: 'Good',
      pricing_type: 'daily',
      price_per_day: 750,
      price_per_hour: 150,
      security_deposit: 2000,
      location: 'Undi Road Bypass, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534204',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
      ]),
      specifications: JSON.stringify({ BatchCapacity: '1 Cement Bag (200 Litres)', Motor: '3 HP Single Phase / Petrol Engine' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_5',
      owner_id: 'usr_owner_1',
      category_id: 'cat_rs_power',
      section: 'resource_sharing',
      title: 'Bosch Professional 800W Rotary Hammer Drill with Bits',
      description: 'Heavy duty concrete and masonry hammer drill with SDS-plus chuck. Includes set of 6 wall drill bits and chisel for home renovation and tile removal.',
      brand: 'Bosch',
      model: 'GBH 2-26 DRE',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 350,
      price_per_hour: 70,
      security_deposit: 1500,
      location: 'Srirampuram, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534201',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
      ]),
      specifications: JSON.stringify({ Power: '800W', Impact: '2.7 Joules', 'Drilling Dia': 'Up to 26mm in concrete' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_6',
      owner_id: 'usr_owner_1',
      category_id: 'cat_rs_ladders',
      section: 'resource_sharing',
      title: 'Heavy Duty 14-Feet Multipurpose Telescopic Aluminum Ladder',
      description: 'Ultra-sturdy foldable aluminum ladder configurable as step ladder, straight extension ladder, or scaffold support. Rubberized non-slip feet.',
      brand: 'Plantex',
      model: 'Multi-fold Pro 14ft',
      year_of_make: 2022,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 200,
      price_per_hour: 40,
      security_deposit: 800,
      location: 'Gandhi Nagar, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534201',
      images: JSON.stringify([
        'https://m.media-amazon.com/images/I/71Vo6heDpQL._AC_UF894,1000_QL80_.jpg',
        '/assets/images/resources/telescopic_ladder.jpg'
      ]),
      specifications: JSON.stringify({ MaxHeight: '14 Feet', LoadCapacity: '150 kg', Material: 'Aerospace Grade Aluminum' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_7',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_rs_garden',
      section: 'resource_sharing',
      title: 'Insulated Produce Cooler Box (70L Commercial)',
      description: 'Commercial-grade thermal insulated produce cooler box for preserving vegetables, dairy, milk, and perishable harvests from farm to market.',
      brand: 'Global Star',
      model: 'IceBox 70L',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 150,
      price_per_hour: 30,
      security_deposit: 500,
      location: 'Lankalakoderu Road, Bhimavaram',
      city: 'Bhimavaram',
      pincode: '534202',
      images: JSON.stringify([
        'https://5.imimg.com/data5/ANDROID/Default/2023/2/VV/XV/IP/3837944/product-jpeg-500x500.jpg',
        '/assets/images/resources/produce_cooler_box.jpg'
      ]),
      specifications: JSON.stringify({ Capacity: '70 Litres', Material: 'Food Grade Polyurethane', Retention: 'Up to 48 Hours Cold' }),
      is_available: 1,
      is_demo: 1
    },
    {
      id: 'eq_rs_8',
      owner_id: 'usr_farmer_1',
      category_id: 'cat_rs_construction',
      section: 'resource_sharing',
      title: '1000L Portable Water Storage Tank on Skid',
      description: 'Food-grade UV stabilized polyethylene 1000 litre water storage container with brass ball valve outlet. Used for temporary water storage and field irrigation backup.',
      brand: 'Sintex',
      model: 'Pure 1000L Skid',
      year_of_make: 2023,
      condition: 'Excellent',
      pricing_type: 'daily',
      price_per_day: 200,
      price_per_hour: 50,
      security_deposit: 600,
      location: 'Canal Junction, Bhimavaram Rural',
      city: 'Bhimavaram Rural',
      pincode: '534202',
      images: JSON.stringify([
        'https://image.made-in-china.com/2f0j00mnwiZWCIkaYh/1000-Liter-Plastic-Water-Container-1000L-IBC-Water-Tank.jpg',
        '/assets/images/resources/water_storage_tank.jpg'
      ]),
      specifications: JSON.stringify({ Volume: '1000 Litres', Material: 'UV Virgin HDPE', Valve: '1.5 Inch Brass Quick Turn' }),
      is_available: 1,
      is_demo: 1
    }
  ];

  for (const res of resources) {
    insertEquipment.run(res);
  }

  // 5. Farm-to-Consumer Marketplace Products (8 items matching Homepage)
  const products = [
    {
      id: 'prod_mp_1',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_grains',
      title: 'Aged BPT 5204 Sona Masoori Rice (Single Polish)',
      description: 'Delicately aged Sona Masoori rice harvested from Godavari delta canal-irrigated farms. Lightweight, aromatic, non-sticky and easy to digest. Directly from farmer milling.',
      unit: 'kg',
      price_per_unit: 62.00,
      available_stock: 450,
      minimum_order_qty: 5,
      harvest_date: '2026-03-15',
      farming_method: 'Natural / Traditional',
      location: 'Vegesna Farms, Lankalakoderu',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_2',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_fruits',
      title: 'Naturally Ripened Banganapalli Sweet Mangoes (Per Dozen)',
      description: 'Carbide-free, tree-ripened authentic Andhra Banganapalli mangoes. Sweet, fibrous pulp with golden yellow skin. Harvested directly from our orchard in Godavari basin.',
      unit: 'dozen',
      price_per_unit: 380.00,
      available_stock: 40,
      minimum_order_qty: 1,
      harvest_date: '2026-05-10',
      farming_method: 'Organic',
      location: 'Vegesna Orchards, Bhimavaram',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_3',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_vegetables',
      title: 'Farm Fresh Organic Country Tomatoes (Natu Tamata)',
      description: 'Crisp, tangy farm-fresh local variety country tomatoes picked in early morning. Free from chemical spray and waxes. Excellent for dal, curries, and rasam.',
      unit: 'kg',
      price_per_unit: 28.00,
      available_stock: 85,
      minimum_order_qty: 2,
      harvest_date: '2026-10-10',
      farming_method: 'Natural / Traditional',
      location: 'Canal Road Fields, Bhimavaram Rural',
      city: 'Bhimavaram Rural',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_4',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_dairy',
      title: 'Pure Traditional A2 Desi Cow Ghee (Bilona Churned)',
      description: 'Handcrafted bilona churned cultured butter ghee from grass-fed indigenous cows. Rich golden granular texture, divine aroma, and high nutritional value.',
      unit: 'box',
      price_per_unit: 750.00,
      available_stock: 25,
      minimum_order_qty: 1,
      harvest_date: '2026-10-01',
      farming_method: 'Organic',
      location: 'Vegesna Dairy Farm, Bhimavaram',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_5',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_vegetables',
      title: 'Farm Fresh Organic Carrots with Green Tops',
      description: 'Sweet, crisp, freshly harvested orange carrots straight from delta loamy soil. Unpolished and rich in beta-carotene.',
      unit: 'kg',
      price_per_unit: 45.00,
      available_stock: 60,
      minimum_order_qty: 1,
      harvest_date: '2026-10-12',
      farming_method: 'Natural / Traditional',
      location: 'Canal Road Fields, Bhimavaram Rural',
      city: 'Bhimavaram Rural',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_6',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_vegetables',
      title: 'Fresh Hot Country Green Chillies (Pachi Mirapa)',
      description: 'Spicy, freshly hand-picked country green chillies grown naturally. Distinct Godavari flavor and pungency.',
      unit: 'kg',
      price_per_unit: 50.00,
      available_stock: 35,
      minimum_order_qty: 0.5,
      harvest_date: '2026-10-11',
      farming_method: 'Natural / Traditional',
      location: 'Vegesna Farms, Lankalakoderu',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_7',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_fruits',
      title: 'Godavari Karpura Chekkara Keli Bananas (Dozen)',
      description: 'Extremely sweet, naturally ripened local Karpura variety bananas. Zero chemical ripening agents.',
      unit: 'dozen',
      price_per_unit: 65.00,
      available_stock: 50,
      minimum_order_qty: 1,
      harvest_date: '2026-10-11',
      farming_method: 'Organic',
      location: 'Vegesna Orchards, Bhimavaram',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    },
    {
      id: 'prod_mp_8',
      farmer_id: 'usr_farmer_1',
      category_id: 'cat_mp_grains',
      title: 'Godavari Delta Black Gram (Minumulu / Urad Dal)',
      description: 'Premium quality high-protein whole black gram (urad dal) harvested from Krishna-Godavari delta lands.',
      unit: 'kg',
      price_per_unit: 110.00,
      available_stock: 120,
      minimum_order_qty: 1,
      harvest_date: '2026-09-20',
      farming_method: 'Natural / Traditional',
      location: 'Vegesna Farms, Lankalakoderu',
      city: 'Bhimavaram',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
      ]),
      is_demo: 1
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO marketplace_products (
      id, farmer_id, category_id, title, description, unit, price_per_unit,
      available_stock, minimum_order_qty, harvest_date, farming_method,
      location, city, images, is_demo
    ) VALUES (
      @id, @farmer_id, @category_id, @title, @description, @unit, @price_per_unit,
      @available_stock, @minimum_order_qty, @harvest_date, @farming_method,
      @location, @city, @images, @is_demo
    )
  `);

  for (const prod of products) {
    insertProduct.run(prod);
  }

  // 6. Local Home Service Providers (8 specialists matching Homepage)
  const providers = [
    {
      id: 'sp_1',
      user_id: 'usr_service_1',
      category_id: 'cat_hs_electrician',
      profession_title: 'Licensed Senior Electrician & Solar Wireman',
      experience_years: 12,
      hourly_rate: 250,
      visiting_charge: 199,
      service_areas: 'Bhimavaram, Palakollu, Undi, Veeravasaram',
      skills: JSON.stringify(['Inverter Wiring', 'Ceiling Fan Installation', 'MCB Distribution Box', 'LED Lighting', 'Submersible Pump Starters']),
      bio: 'Government licensed wireman with over a decade of hands-on expertise in domestic wiring, agricultural motor pump starters, and emergency power failure fixes.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_2',
      user_id: 'usr_service_2',
      category_id: 'cat_hs_plumber',
      profession_title: 'Experienced Master Plumber & Sanitary Expert',
      experience_years: 10,
      hourly_rate: 220,
      visiting_charge: 189,
      service_areas: 'Bhimavaram Town, Gandhi Nagar, Somavaram',
      skills: JSON.stringify(['Pipe Leakage Fixes', 'Sanitary Fittings', 'Overhead Tank Connection', 'Borewell Motor Repair', 'CPVC Jointing']),
      bio: 'Reliable plumber handling kitchen piping, bathroom plumbing renovation, water tank auto-cut switches, and high pressure leakage repairs.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_3',
      user_id: 'usr_service_3',
      category_id: 'cat_hs_carpenter',
      profession_title: 'Master Carpenter & Woodwork Specialist',
      experience_years: 14,
      hourly_rate: 280,
      visiting_charge: 249,
      service_areas: 'Bhimavaram, Undi, Palakollu, Tanuku',
      skills: JSON.stringify(['Door & Window Hinges', 'Custom Shelving', 'Modular Kitchen Repair', 'Teakwood Furniture Restoration', 'Lock Fitting']),
      bio: 'Expert artisan carpenter specializing in traditional Godavari teakwood furniture, modern plywood modular repairs, and custom home fittings.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_4',
      user_id: 'usr_service_4',
      category_id: 'cat_hs_painting',
      profession_title: 'Wall Painter & Terrace Waterproofing Expert',
      experience_years: 9,
      hourly_rate: 260,
      visiting_charge: 299,
      service_areas: 'Bhimavaram Town, Srirampuram, Rural Mandals',
      skills: JSON.stringify(['Interior Wall Putty', 'Exterior Weathercoat', 'Terrace Waterproof Coating', 'Texture Designs', 'Wood Polishing']),
      bio: 'Professional painting contractor offering long-lasting moisture protection, premium sheen coats, and anti-fungal treatments for coastal weather.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_5',
      user_id: 'usr_service_5',
      category_id: 'cat_hs_appliance',
      profession_title: 'AC Specialist & Home Appliance Repair',
      experience_years: 8,
      hourly_rate: 320,
      visiting_charge: 399,
      service_areas: 'Bhimavaram Town, Balusumoodi, J.P. Road',
      skills: JSON.stringify(['Split AC Gas Charging', 'Jet Pump AC Foam Wash', 'Refrigerator Compressor Fixes', 'Automatic Washing Machine Repair']),
      bio: 'Certified HVAC & refrigeration technician offering prompt diagnostic visits, genuine parts replacement, and seasonal cooling warranties.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_6',
      user_id: 'usr_service_6',
      category_id: 'cat_hs_cleaning',
      profession_title: 'Deep Home & Sump Tank Cleaning Specialists',
      experience_years: 6,
      hourly_rate: 250,
      visiting_charge: 299,
      service_areas: 'Bhimavaram, Palakollu, Undi, Narasapuram',
      skills: JSON.stringify(['High Pressure Sump Wash', 'Overhead Tank UV Sanitization', 'Floor Scrubbing', 'Kitchen Degreasing', 'Post-Construction Cleanup']),
      bio: 'Trained hygienic cleaning squad equipped with industrial vacuum cleaners and high-pressure jet washers for spotless water tanks and homes.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_7',
      user_id: 'usr_service_7',
      category_id: 'cat_hs_pest',
      profession_title: 'Eco Pest & Termite Control Professional',
      experience_years: 7,
      hourly_rate: 300,
      visiting_charge: 349,
      service_areas: 'Bhimavaram Town & Surrounding Godavari Villages',
      skills: JSON.stringify(['Odorless Cockroach Gel', 'Drill-and-Fill Termite Barrier', 'Mosquito Fogging', 'Field Rodent Control', 'Wood Borer Spray']),
      bio: 'Certified pest eradication technician utilizing government approved, child and pet-safe botanical compounds with multi-year warranty guarantees.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    },
    {
      id: 'sp_8',
      user_id: 'usr_service_8',
      category_id: 'cat_hs_gardening',
      profession_title: 'Gardener & Farm Landscaping Specialist',
      experience_years: 11,
      hourly_rate: 200,
      visiting_charge: 199,
      service_areas: 'Bhimavaram, Lankalakoderu, Somavaram',
      skills: JSON.stringify(['Lawn Mowing & Aeration', 'Fruit Tree Pruning', 'Organic Vermicompost Treatment', 'Hedge Trimming', 'Terrace Garden Setup']),
      bio: 'Seasoned horticulturalist passionate about native plants, organic soil nourishment, coconut tree pruning, and verdant backyard landscapes.',
      is_available: 1,
      is_verified: 1,
      is_demo: 1
    }
  ];

  const insertProvider = db.prepare(`
    INSERT INTO service_providers (
      id, user_id, category_id, profession_title, experience_years, hourly_rate,
      visiting_charge, service_areas, skills, bio, is_available, is_verified, is_demo
    ) VALUES (
      @id, @user_id, @category_id, @profession_title, @experience_years, @hourly_rate,
      @visiting_charge, @service_areas, @skills, @bio, @is_available, @is_verified, @is_demo
    )
  `);

  for (const prov of providers) {
    insertProvider.run(prov);
  }

  // 7. Seed Sample Bookings & Orders for demonstrations
  const sampleBooking = {
    id: 'bk_demo_101',
    equipment_id: 'eq_fe_1',
    renter_id: 'usr_customer_1',
    start_date: '2026-10-15',
    end_date: '2026-10-16',
    total_duration_days: 2,
    total_amount: 3600,
    security_deposit: 2000,
    status: 'approved',
    payment_status: 'demo_paid',
    notes: 'Required for paddy field leveling near Gollalakoderu.'
  };

  db.prepare(`
    INSERT INTO equipment_bookings (
      id, equipment_id, renter_id, start_date, end_date, total_duration_days,
      total_amount, security_deposit, status, payment_status, notes
    ) VALUES (
      @id, @equipment_id, @renter_id, @start_date, @end_date, @total_duration_days,
      @total_amount, @security_deposit, @status, @payment_status, @notes
    )
  `).run(sampleBooking);

  // 8. Sample Produce Order
  const orderId = 'ord_demo_201';
  db.prepare(`
    INSERT INTO produce_orders (
      id, customer_id, total_amount, delivery_address, delivery_city,
      delivery_pincode, customer_phone, payment_method, payment_status, order_status, order_notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    orderId,
    'usr_customer_1',
    490.00,
    'Flat 202, Sri Nilayam, Gandhi Nagar',
    'Bhimavaram',
    '534201',
    '+91 96521 99887',
    'demo_cod',
    'demo_paid',
    'confirmed',
    'Please deliver before 11:00 AM if possible'
  );

  db.prepare(`
    INSERT INTO produce_order_items (
      id, order_id, product_id, farmer_id, quantity, unit_price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('item_demo_1', orderId, 'prod_mp_1', 'usr_farmer_1', 5, 62.00, 310.00);

  db.prepare(`
    INSERT INTO produce_order_items (
      id, order_id, product_id, farmer_id, quantity, unit_price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('item_demo_2', orderId, 'prod_mp_3', 'usr_farmer_1', 6.4, 28.00, 180.00);

  // 9. Sample Service Booking
  db.prepare(`
    INSERT INTO service_bookings (
      id, customer_id, provider_id, scheduled_date, scheduled_time_slot,
      service_address, city, phone, problem_description, estimated_cost, status, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sb_demo_301',
    'usr_customer_1',
    'sp_1',
    '2026-10-14',
    '10:00 AM - 12:00 PM',
    'Door 4-12, Gandhi Nagar Main Road, Bhimavaram',
    'Bhimavaram',
    '+91 96521 99887',
    'Main MCB tripping repeatedly when water pump is switched on.',
    350.00,
    'accepted',
    'pending'
  );

  // 10. Reviews linked to actual bookings
  db.prepare(`
    INSERT INTO reviews (id, user_id, target_type, target_id, booking_or_order_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_demo_1',
    'usr_customer_1',
    'equipment',
    'eq_fe_1',
    'bk_demo_101',
    5,
    'Tractor was in top condition and delivered right to our field on schedule. Saved us 2 days of manual labor!'
  );

  db.prepare(`
    INSERT INTO reviews (id, user_id, target_type, target_id, booking_or_order_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_demo_2',
    'usr_customer_1',
    'service_provider',
    'sp_1',
    'sb_demo_301',
    5,
    'Very punctual and knowledgeable. Fixed the starter wiring and tested the voltage carefully.'
  );

  // 11. Initial Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'notif_1',
    'usr_farmer_1',
    'New Equipment Booking Request',
    'Lakshmi Prasanna requested to rent Mahindra 575 DI Tractor for Oct 15-16.',
    'booking',
    '/dashboard.html?tab=equipment'
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'notif_2',
    'usr_customer_1',
    'Produce Order Confirmed',
    'Your order for Sona Masoori Rice & Country Tomatoes has been confirmed by Subba Rao Vegesna.',
    'order',
    '/dashboard.html?tab=orders'
  );

  console.log('✅ REVORA database seeded successfully with realistic demo records.');
}

if (require.main === module) {
  try {
    seedData();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

module.exports = { seedData };

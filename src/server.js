require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const marketplaceRoutes = require('./routes/marketplace');
const servicesRoutes = require('./routes/services');
const categoriesRoutes = require('./routes/categories');
const reviewsRoutes = require('./routes/reviews');
const notificationsRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { ensureDbReady } = require('./db');

// Ensure database is ready before processing API requests
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    console.error('Database readiness error:', err);
    res.status(500).json({ success: false, message: 'Database initialization failed.' });
  }
});

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, '../public')));

// API Routes (mounted with /api and without in case serverless gateway strips /api)
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/equipment`, equipmentRoutes);
  app.use(`${prefix}/marketplace`, marketplaceRoutes);
  app.use(`${prefix}/services`, servicesRoutes);
  app.use(`${prefix}/categories`, categoriesRoutes);
  app.use(`${prefix}/reviews`, reviewsRoutes);
  app.use(`${prefix}/notifications`, notificationsRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/upload`, uploadRoutes);
  app.get(`${prefix}/health`, (req, res) => {
    res.json({
      status: 'healthy',
      application: 'REVORA',
      tagline: 'Connect Resources. Create Opportunities.',
      timestamp: new Date().toISOString()
    });
  });
};

registerRoutes('/api');
registerRoutes('');

// Fallback for HTML5 Single-Page / Multi-Page routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server if run directly from command line (local node src/server.js or nodemon)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 REVORA Server running at http://localhost:${PORT}`);
    console.log(`🌱 Tagline: Connect Resources. Create Opportunities.`);
    console.log(`📍 Primary Market: Bhimavaram, Andhra Pradesh & India`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another running process.`);
      console.error(`💡 Solution: Close any existing terminal running node/nodemon, or kill the process using port ${PORT}.\n`);
    } else {
      console.error('Server error:', err);
    }
  });
}

module.exports = app;

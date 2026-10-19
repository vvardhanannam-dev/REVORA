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

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    application: 'REVORA',
    tagline: 'Connect Resources. Create Opportunities.',
    timestamp: new Date().toISOString()
  });
});

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

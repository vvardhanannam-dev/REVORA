const { ensureDbReady } = require('../src/db');
const app = require('../src/server');

module.exports = async (req, res) => {
  try {
    await ensureDbReady();
    return app(req, res);
  } catch (err) {
    console.error('Serverless error in api/index:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVERLESS_INVOCATION_ERROR',
      message: err.message,
      stack: err.stack
    });
  }
};

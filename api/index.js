const app = require('../src/server');
const { ensureDbReady } = require('../src/db');

module.exports = async (req, res) => {
  try {
    await ensureDbReady();
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    console.error('Serverless error in api/index:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'SERVERLESS_INVOCATION_ERROR',
        message: err.message,
        stack: err.stack
      }));
    }
  }
};

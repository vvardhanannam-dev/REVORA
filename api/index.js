let app;
let ensureDbReady;
let loadError = null;

try {
  app = require('../src/server');
  ensureDbReady = require('../src/db').ensureDbReady;
} catch (err) {
  loadError = err;
  console.error('Fatal import error in api/index.js:', err);
}

module.exports = async (req, res) => {
  if (loadError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'MODULE_LOAD_ERROR',
      message: loadError.message,
      stack: loadError.stack
    }));
  }

  try {
    if (ensureDbReady) {
      await ensureDbReady();
    }
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
    console.error('Serverless execution error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'SERVERLESS_EXECUTION_ERROR',
        message: err.message,
        stack: err.stack
      }));
    }
  }
};

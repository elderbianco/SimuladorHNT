const express = require('express');
const router = express.Router();
const DatabaseController = require('../controllers/DatabaseController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Database Routes
 * Base path: /api (mantendo compatibilidade com frontend)
 */

// POST /api/save-db
router.post('/save-db', authenticateToken, DatabaseController.saveDatabase.bind(DatabaseController));

// GET /api/load-db
router.get('/load-db', DatabaseController.loadDatabase.bind(DatabaseController));

// GET /api/cache/stats
router.get('/cache/stats', DatabaseController.getCacheStats.bind(DatabaseController));

// GET /api/updates (SSE)
router.get('/updates', DatabaseController.getUpdates.bind(DatabaseController));

module.exports = router;

const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/BackupController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Backup Routes
 * Base path: /api/backups
 */

// GET /api/backups
router.get('/', BackupController.listBackups.bind(BackupController));

// POST /api/backups/restore
router.post('/restore', authenticateToken, BackupController.restoreBackup.bind(BackupController));

module.exports = router;

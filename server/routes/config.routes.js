const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/ConfigController');

// GET /api/admin/config
router.get('/admin/config', ConfigController.getConfig);

// POST /api/admin/config
router.post('/admin/config', ConfigController.saveConfig);

module.exports = router;

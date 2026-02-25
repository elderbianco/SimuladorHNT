const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/ConfigController');

// GET /api/admin/config/:key?
router.get('/admin/config/:key?', ConfigController.getConfig);

// POST /api/admin/config/:key?
router.post('/admin/config/:key?', ConfigController.saveConfig);

module.exports = router;

const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/ConfigController');

// Express 5: parâmetro opcional separado em duas rotas explícitas
router.get('/admin/config', ConfigController.getConfig);
router.get('/admin/config/:key', ConfigController.getConfig);

router.post('/admin/config', ConfigController.saveConfig);
router.post('/admin/config/:key', ConfigController.saveConfig);

module.exports = router;

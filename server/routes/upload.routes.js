const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/UploadController');

// Rota POST para receber a imagem/bordado do simulador
router.post('/upload-image', UploadController.uploadFile.bind(UploadController));

module.exports = router;

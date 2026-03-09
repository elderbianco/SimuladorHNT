const express = require('express');
const router = express.Router();

/**
 * API Routes Aggregator
 * Monta todas as rotas da API em /api
 */

// Importar rotas
const authRoutes = require('./auth.routes');
const orderRoutes = require('./orders.routes');
const databaseRoutes = require('./database.routes');
const backupRoutes = require('./backups.routes');
const configRoutes = require('./config.routes');
const uploadRoutes = require('./upload.routes'); // NOVA ROTA DE UPLOADS

// Montar rotas
router.use('/auth', authRoutes);
router.use('/', orderRoutes);        // Mantém compatibilidade (/api/save-pedido, etc)
router.use('/', databaseRoutes);     // Mantém compatibilidade (/api/save-db, etc)
router.use('/', configRoutes);       // Nova rota de config
router.use('/backups', backupRoutes);
router.use('/', uploadRoutes); // REGISTRO DA ROTA DE UPLOADS

module.exports = router;

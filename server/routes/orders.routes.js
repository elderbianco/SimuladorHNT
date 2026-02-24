const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Order Routes
 * Base path: /api (mantendo compatibilidade com frontend)
 */

// POST /api/save-pedido
router.post('/save-pedido', OrderController.savePedido.bind(OrderController));

// DELETE /api/delete-pdf/:id
router.delete('/delete-pdf/:id', authenticateToken, OrderController.deletePdf.bind(OrderController));

// GET /api/next-order-id
router.get('/next-order-id', authenticateToken, OrderController.getNextOrderId.bind(OrderController));

module.exports = router;

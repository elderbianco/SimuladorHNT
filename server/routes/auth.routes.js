const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// POST /api/auth/login
router.post('/login', AuthController.login.bind(AuthController));

module.exports = router;

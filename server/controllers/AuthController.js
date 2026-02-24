const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

/**
 * AuthController
 * Gerencia autenticação e geração de tokens JWT
 */
class AuthController {
    /**
     * POST /api/auth/login
     * Autentica usuário e retorna token JWT
     */
    async login(req, res) {
        const { username, password } = req.body;

        // Validação de credenciais
        if (username === authConfig.adminCredentials.username &&
            password === authConfig.adminCredentials.password) {

            // Gera token JWT
            const token = jwt.sign(
                { username, role: 'admin' },
                authConfig.jwtSecret,
                { expiresIn: authConfig.jwtExpiresIn }
            );

            console.log(`✅ Login bem-sucedido: ${username}`);

            return res.json({
                success: true,
                token,
                expiresIn: authConfig.jwtExpiresIn,
                message: 'Login realizado com sucesso'
            });
        }

        console.warn(`⚠️ Tentativa de login falhou: ${username || 'unknown'}`);
        res.status(401).json({
            error: 'Credenciais inválidas',
            message: 'Usuário ou senha incorretos'
        });
    }
}

module.exports = new AuthController();

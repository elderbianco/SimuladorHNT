const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware de Autenticação JWT
 * Verifica se o token fornecido no header Authorization é válido
 * 
 * Uso:
 * app.post('/api/endpoint-protegido', authenticateToken, (req, res) => { ... });
 */
function authenticateToken(req, res, next) {
    // Extrai token do header Authorization: "Bearer TOKEN"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn('⚠️ Acesso negado: Token não fornecido');
        return res.status(401).json({ 
            error: 'Acesso negado. Token não fornecido.',
            message: 'Por favor, faça login para acessar este recurso.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.warn('⚠️ Token inválido ou expirado');
            return res.status(403).json({ 
                error: 'Token inválido ou expirado.',
                message: 'Por favor, faça login novamente.'
            });
        }

        // Token válido - adiciona informações do usuário à requisição
        req.user = user;
        console.log(`✅ Acesso autorizado: ${user.username}`);
        next();
    });
}

module.exports = { authenticateToken };

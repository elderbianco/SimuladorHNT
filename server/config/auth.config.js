require('dotenv').config();

/**
 * Configurações de Autenticação
 * Centraliza todas as configurações relacionadas à autenticação JWT
 */
module.exports = {
    // Chave secreta para assinar tokens JWT
    jwtSecret: process.env.JWT_SECRET || 'default_secret_CHANGE_THIS_IN_PRODUCTION',

    // Tempo de expiração do token
    jwtExpiresIn: '24h', // Token expira em 24 horas

    // Credenciais do administrador
    adminCredentials: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    }
};

const rateLimit = require('express-rate-limit');

// Limiter Geral: Protege contra DDoS simples e abuso geral
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP por janela
    message: { error: 'Muitas requisições deste IP, por favor tente novamente mais tarde.' },
    headers: true, // Envia headers X-RateLimit-*
});

// Limiter de Auth: Protege endpoints de login/registro contra força bruta
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Limite de 10 tentativas falhas/sucesso de login por hora
    message: { error: 'Muitas tentativas de login, por favor tente novamente em 1 hora.' },
    headers: true,
});

// Limiter de Admin: Protege endpoints sensíveis de administração
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Limite moderado
    message: { error: 'Taxa limite de administração excedida.' }
});

module.exports = {
    generalLimiter,
    authLimiter,
    adminLimiter
};

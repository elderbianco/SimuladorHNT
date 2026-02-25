const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Módulos
const DBCache = require('./js/modules/common/db-cache');

// Rotas
const apiRoutes = require('./server/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS com Whitelist Estrita
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 [CORS] Tentativa de acesso bloqueada da origem: ${origin}`);
            callback(new Error('Acesso bloqueado pelas políticas de CORS'));
        }
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' })); // Limite rigoroso de 2MB para payloads JSON

// Middleware (Rate Limiting)
const { generalLimiter, authLimiter } = require('./server/middleware/rateLimiter');
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter); // Stricter for login

// API Routes
app.use('/api', apiRoutes);

// Serve static files (DEPOIS das rotas da API)
app.use(express.static(path.join(__dirname)));

// Inicializar cache
DBCache.init(path.join(__dirname, 'assets', 'BancoDados', 'BancoDados_Mestre.xlsx'));

// Middleware Global de Tratamento e Log de Erros (Try/Catch fall-through)
app.use((err, req, res, next) => {
    console.error(`🔥 [ERRO GLOBAL] ${req.method} ${req.originalUrl}`);
    console.error(`=> Mensagem: ${err.message}`);
    console.error(`=> Stack Trace:\n${err.stack}`);

    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Erro interno no servidor' : err.message
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Hanuthai rodando em http://localhost:${PORT}`);
    console.log(`📂 Pedidos serão salvos em: assets/BancoDados/PedidosPDF`);
    console.log(`📊 Banco de Dados Excel: assets/BancoDados/BancoDados_Mestre.xlsx`);
    console.log(`📦 Cache de banco de dados ativado`);
    console.log(`✨ Arquitetura MVC ativa`);
});

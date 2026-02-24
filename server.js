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

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Hanuthai rodando em http://localhost:${PORT}`);
    console.log(`📂 Pedidos serão salvos em: assets/BancoDados/PedidosPDF`);
    console.log(`📊 Banco de Dados Excel: assets/BancoDados/BancoDados_Mestre.xlsx`);
    console.log(`📦 Cache de banco de dados ativado`);
    console.log(`✨ Arquitetura MVC ativa`);
});

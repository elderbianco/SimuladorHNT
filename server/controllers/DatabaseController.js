const XLSX = require('xlsx');
const path = require('path');
const BackupManager = require('../../js/modules/common/backup-manager');
const DataValidator = require('../../js/modules/common/data-validator');
const DBCache = require('../../js/modules/common/db-cache');

// Priority Columns (Expanded Schema - 107 Columns)
const priorityCols = [
    // 1. IDENTIFICAÇÃO
    "ID_PEDIDO", "ID_SIMULACAO", "TIPO_PRODUTO", "DATA_CRIACAO", "DATA_ATUALIZACAO",
    "DATA_PEDIDO", "STATUS_PEDIDO", "NUMERO_ITEM",

    // 2. DADOS DO CLIENTE
    "NOME_CLIENTE", "EMAIL_CLIENTE", "TELEFONE_CLIENTE", "CPF_CNPJ_CLIENTE",
    "ENDERECO_ENTREGA", "CIDADE_ENTREGA", "ESTADO_ENTREGA", "CEP_ENTREGA",

    // 3. CONFIGURAÇÃO DO PRODUTO
    "TAMANHO", "QUANTIDADE", "COR_BASE", "COR_SECUNDARIA", "COR_TERCIARIA",
    "ESTAMPA_PRINCIPAL", "ESTAMPA_SECUNDARIA", "TECIDO_TIPO", "TECIDO_GRAMATURA",

    // 4. PERSONALIZAÇÃO DE TEXTO
    "Texto_Frente_Conteudo", "Texto_Frente_Fonte", "Texto_Frente_Cor", "Texto_Frente_Tamanho", "Texto_Frente_Posicao_X", "Texto_Frente_Posicao_Y", "Texto_Frente_Rotacao",
    "Texto_Costas_Conteudo", "Texto_Costas_Fonte", "Texto_Costas_Cor", "Texto_Costas_Tamanho", "Texto_Costas_Posicao_X", "Texto_Costas_Posicao_Y", "Texto_Costas_Rotacao",
    "Texto_Lateral_Esq_Conteudo", "Texto_Lateral_Esq_Fonte", "Texto_Lateral_Esq_Cor", "Texto_Lateral_Esq_Tamanho", "Texto_Lateral_Esq_Posicao_X", "Texto_Lateral_Esq_Posicao_Y", "Texto_Lateral_Esq_Rotacao",
    "Texto_Lateral_Dir_Conteudo", "Texto_Lateral_Dir_Fonte", "Texto_Lateral_Dir_Cor", "Texto_Lateral_Dir_Tamanho", "Texto_Lateral_Dir_Posicao_X", "Texto_Lateral_Dir_Posicao_Y", "Texto_Lateral_Dir_Rotacao",

    // 5. LOGOS E IMAGENS
    "Logo_Frente_Arquivo", "Logo_Frente_Posicao_X", "Logo_Frente_Posicao_Y", "Logo_Frente_Escala", "Logo_Frente_Rotacao",
    "Logo_Costas_Arquivo", "Logo_Costas_Posicao_X", "Logo_Costas_Posicao_Y", "Logo_Costas_Escala", "Logo_Costas_Rotacao",
    "Logo_Lateral_Dir_Arquivo", "Logo_Lateral_Dir_Posicao_X", "Logo_Lateral_Dir_Posicao_Y", "Logo_Lateral_Dir_Escala", "Logo_Lateral_Dir_Rotacao",
    "Logo_Lateral_Esq_Arquivo", "Logo_Lateral_Esq_Posicao_X", "Logo_Lateral_Esq_Posicao_Y", "Logo_Lateral_Esq_Escala", "Logo_Lateral_Esq_Rotacao",

    "Logo_Perna_Dir_Meio_Arquivo", "Logo_Perna_Dir_Meio_Posicao_X", "Logo_Perna_Dir_Meio_Posicao_Y", "Logo_Perna_Dir_Meio_Escala", "Logo_Perna_Dir_Meio_Rotacao",
    "Logo_Perna_Esq_Meio_Arquivo", "Logo_Perna_Esq_Meio_Posicao_X", "Logo_Perna_Esq_Meio_Posicao_Y", "Logo_Perna_Esq_Meio_Escala", "Logo_Perna_Esq_Meio_Rotacao",

    // 6. EXTRAS E ACESSÓRIOS
    "EXTRAS_SELECIONADOS", "ACESSORIOS_INCLUSOS", "PERSONALIZACAO_ESPECIAL",

    // 7. BORDADOS E DETALHES
    "BORDADO_TIPO", "BORDADO_COR", "BORDADO_POSICAO", "BORDADO_TEXTO",

    // 8. FINANCEIRO
    "PRECO_UNITARIO", "PRECO_BASE_ATACADO", "CUSTO_PERSONALIZACAO", "CUSTO_EXTRAS",
    "VALOR_DESCONTOS", "PRECO_TOTAL", "MARGEM_LUCRO_PCT", "MARGEM_LUCRO_VALOR", "PRECO_FINAL",

    // 9. PRODUÇÃO
    "CUSTO_PRODUCAO_UNITARIO", "CUSTO_PRODUCAO_TOTAL", "STATUS_PRODUCAO",
    "DATA_INICIO_PRODUCAO", "DATA_FIM_PRODUCAO",
    "PREVISAO_ENTREGA_MIN", "PREVISAO_ENTREGA_MAX", "OBSERVACOES_PRODUCAO",

    // 10. SYSTEM (Hidden)
    "DADOS_TECNICOS_JSON"
];

/**
 * DatabaseController
 * Gerencia banco de dados Excel/JSON
 */
class DatabaseController {
    /**
     * POST /api/save-db
     * Salva dados no banco de dados Excel
     */
    async saveDatabase(req, res) {
        try {
            const newData = req.body;
            if (!Array.isArray(newData)) {
                return res.status(400).json({ error: "Data must be an array" });
            }

            // Validação de dados
            console.log('🔍 Validando dados...');
            const validation = DataValidator.validateBatch(newData);

            if (!validation.valid) {
                console.error('❌ Validação falhou:', validation.summary);
                return res.status(400).json({
                    error: 'Dados inválidos',
                    validation: {
                        invalidCount: validation.invalidCount,
                        errors: validation.invalidOrders.map(o => ({
                            id: o.id,
                            errors: o.errors
                        }))
                    }
                });
            }

            if (validation.ordersWithWarnings.length > 0) {
                console.warn(`⚠️ ${validation.ordersWithWarnings.length} pedido(s) com avisos`);
            }

            console.log(`✅ Validação passou: ${validation.validOrders}/${validation.totalOrders} pedidos válidos`);

            // Backup automático
            console.log('💾 Criando backup antes de salvar...');
            try {
                await BackupManager.createBackup();
            } catch (backupError) {
                console.warn('⚠️ Erro ao criar backup (continuando):', backupError.message);
            }

            const wb = XLSX.utils.book_new();

            // 1. Central Tab
            const wsCentral = XLSX.utils.json_to_sheet(newData, { header: priorityCols });
            XLSX.utils.book_append_sheet(wb, wsCentral, "CENTRAL_PEDIDOS");

            // 2. Product Tabs
            const productMap = {
                'SHORTS': 'SHORTS', 'TOP': 'TOP', 'LEGGING': 'LEGGING',
                'SHORTS_SAIA': 'SHORTS_SAIA', 'MOLETOM': 'MOLETOM'
            };

            const presentTypes = [...new Set(newData.map(d => d.TIPO_PRODUTO))];
            const allTypes = [...new Set([...Object.keys(productMap), ...presentTypes])];

            allTypes.forEach(pType => {
                const filtered = newData.filter(d => (d.TIPO_PRODUTO || "").toUpperCase() === pType.toUpperCase());
                let sheetName = (productMap[pType] || pType).replace(/[\\/?*[\]]/g, "").substring(0, 31);
                const wsProd = XLSX.utils.json_to_sheet(filtered, { header: priorityCols });
                XLSX.utils.book_append_sheet(wb, wsProd, sheetName);
            });

            const dbPath = path.join(process.cwd(), 'assets', 'BancoDados', 'BancoDados_Mestre.xlsx');
            XLSX.writeFile(wb, dbPath);

            console.log(`✅ Banco de Dados Excel atualizado! (${newData.length} registros)`);

            // Invalidar cache
            DBCache.invalidate();

            res.json({
                success: true,
                count: newData.length,
                validation: {
                    warnings: validation.ordersWithWarnings.length
                }
            });

        } catch (e) {
            console.error("❌ Erro ao salvar banco:", e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * GET /api/load-db
     * Carrega dados do banco de dados Excel
     */
    async loadDatabase(req, res) {
        try {
            const data = await DBCache.getData();
            res.json(data);
        } catch (e) {
            console.error("❌ Erro ao carregar banco:", e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * GET /api/cache/stats
     * Retorna estatísticas do cache
     */
    async getCacheStats(req, res) {
        try {
            const stats = DBCache.getStats();
            res.json(stats);
        } catch (e) {
            console.error("❌ Erro ao obter stats:", e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * GET /api/updates
     * SSE para atualizações em tempo real
     */
    async getUpdates(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendUpdate = () => {
            const stats = DBCache.getStats();
            res.write(`data: ${JSON.stringify(stats)}\n\n`);
        };

        sendUpdate();
        const interval = setInterval(sendUpdate, 5000);

        req.on('close', () => {
            clearInterval(interval);
            res.end();
        });
    }
}

module.exports = new DatabaseController();

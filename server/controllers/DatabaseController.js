const path = require('path');
const supabase = require('../utils/supabase');
const BackupManager = require('../../js/modules/common/backup-manager');
const DataValidator = require('../../js/modules/common/data-validator');
const DBCache = require('../../js/modules/common/db-cache');

// Priority Columns mapeados no array DB original
const priorityCols = [
    "ID_PEDIDO", "ID_SIMULACAO", "TIPO_PRODUTO", "DATA_CRIACAO", "DATA_ATUALIZACAO",
    "DATA_PEDIDO", "STATUS_PEDIDO", "NUMERO_ITEM", "NOME_CLIENTE", "EMAIL_CLIENTE",
    "Texto_Lateral_Esq_Conteudo", "Texto_Lateral_Esq_Fonte", "Texto_Lateral_Esq_Cor",
    "Texto_Lateral_Esq_Tamanho", "Texto_Lateral_Esq_Posicao_X", "Texto_Lateral_Esq_Posicao_Y",
    "Texto_Lateral_Esq_Rotacao", "Texto_Lateral_Dir_Conteudo", "Texto_Lateral_Dir_Fonte",
    "Texto_Lateral_Dir_Cor", "Texto_Lateral_Dir_Tamanho", "Texto_Lateral_Dir_Posicao_X",
    "Texto_Lateral_Dir_Posicao_Y", "Texto_Lateral_Dir_Rotacao", "Logo_Frente_Arquivo",
    "Logo_Frente_Posicao_X", "Logo_Frente_Posicao_Y", "Logo_Frente_Escala",
    "Logo_Frente_Rotacao", "Logo_Costas_Arquivo", "Logo_Costas_Posicao_X",
    "Logo_Costas_Posicao_Y", "Logo_Costas_Escala", "Logo_Costas_Rotacao",
    "Logo_Lateral_Dir_Arquivo", "Logo_Lateral_Dir_Posicao_X", "Logo_Lateral_Dir_Posicao_Y",
    "Logo_Lateral_Dir_Escala", "Logo_Lateral_Dir_Rotacao", "Logo_Lateral_Esq_Arquivo",
    "Logo_Lateral_Esq_Posicao_X", "Logo_Lateral_Esq_Posicao_Y", "Logo_Lateral_Esq_Escala",
    "Logo_Lateral_Esq_Rotacao", "Logo_Perna_Dir_Meio_Arquivo", "Logo_Perna_Dir_Meio_Posicao_X",
    "Logo_Perna_Dir_Meio_Posicao_Y", "Logo_Perna_Dir_Meio_Escala", "Logo_Perna_Dir_Meio_Rotacao",
    "Logo_Perna_Esq_Meio_Arquivo", "Logo_Perna_Esq_Meio_Posicao_X", "Logo_Perna_Esq_Meio_Posicao_Y",
    "Logo_Perna_Esq_Meio_Escala", "Logo_Perna_Esq_Meio_Rotacao", "EXTRAS_SELECIONADOS",
    "ACESSORIOS_INCLUSOS", "PERSONALIZACAO_ESPECIAL", "BORDADO_TIPO", "BORDADO_COR",
    "BORDADO_POSICAO", "BORDADO_TEXTO", "PRECO_UNITARIO", "PRECO_BASE_ATACADO",
    "CUSTO_PERSONALIZACAO", "CUSTO_EXTRAS", "VALOR_DESCONTOS", "PRECO_TOTAL",
    "MARGEM_LUCRO_PCT", "MARGEM_LUCRO_VALOR", "PRECO_FINAL", "CUSTO_PRODUCAO_UNITARIO",
    "CUSTO_PRODUCAO_TOTAL", "STATUS_PRODUCAO", "DATA_INICIO_PRODUCAO", "DATA_FIM_PRODUCAO",
    "PREVISAO_ENTREGA_MIN", "PREVISAO_ENTREGA_MAX", "OBSERVACOES_PRODUCAO", "json_tec"
];

class DatabaseController {
    /**
     * POST /api/save-db
     * Upsert records in Supabase 'peds' table
     */
    async saveDatabase(req, res) {
        try {
            const newData = req.body;
            if (!Array.isArray(newData)) {
                return res.status(400).json({ error: "Data must be an array" });
            }

            console.log('🔍 Validating data...');
            const validation = DataValidator.validateBatch(newData);

            if (!validation.valid) {
                console.error('❌ Validation failed:', validation.summary);
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

            console.log(`✅ Supabase Saving: ${validation.validOrders} orders`);

            // Clean up and format records to ensure they match Supabase expected keys exactly
            const payload = newData.map(item => {
                let formatted = {};
                priorityCols.forEach(col => {
                    formatted[col] = item[col] !== undefined ? item[col] : null;
                });

                // Explicitly cast JSON correctly to avoid PG type casting errors
                if (formatted.json_tec && typeof formatted.json_tec === 'string') {
                    try { formatted.json_tec = JSON.parse(formatted.json_tec); } catch (e) { }
                }

                // Ensure ID_PEDIDO is never null since it's UNIQUE NOT NULL
                if (!formatted.ID_PEDIDO && formatted.ID_SIMULACAO) {
                    formatted.ID_PEDIDO = formatted.ID_SIMULACAO;
                }

                return formatted;
            });

            // Upsert na tabela 'peds' no Supabase usando 'ID_PEDIDO'
            const { data, error } = await supabase
                .from('pedidos')
                .upsert(payload, { onConflict: 'ID_PEDIDO' })
                .select();

            if (error) {
                console.error('❌ Supabase Upsert Error:', error);
                throw error;
            }

            console.log(`✅ Banco de Dados Supabase atualizado! (${payload.length} registros)`);
            DBCache.invalidate();

            res.json({
                success: true,
                count: payload.length,
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
     * Fetches all records from Supabase 'pedidos' table
     */
    async loadDatabase(req, res) {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('criado_em', { ascending: false });

            if (error) throw error;
            res.json(data || []);
        } catch (e) {
            console.error("❌ Erro ao carregar banco do Supabase:", e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * GET /api/cache/stats
     * Used by SSE connection / Dashboard stat counting
     */
    async getCacheStats(req, res) {
        try {
            // Count rows from Supabase directly
            const { count, error } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            res.json({
                total: count || 0,
                lastUpdate: new Date().toISOString()
            });
        } catch (e) {
            console.error("❌ Erro ao obter stats Supabase:", e);
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

        const sendUpdate = async () => {
            const { count } = await supabase.from('peds').select('*', { count: 'exact', head: true });
            res.write(`data: ${JSON.stringify({ total: count || 0, lastUpdate: new Date().toISOString() })}\n\n`);
        };

        sendUpdate();
        const interval = setInterval(sendUpdate, 15000); // 15s to be polite with Supabase instances

        req.on('close', () => {
            clearInterval(interval);
            res.end();
        });
    }
}

module.exports = new DatabaseController();

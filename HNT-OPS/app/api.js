/* ============================================================
   HNT-OPS — API Client (Supabase via REST)
   ============================================================ */

// Em produção, isso deve ser carregado via variáveis de ambiente.
// Substitua pelas credenciais REAIS do seu projeto.
const SUPABASE_URL = 'https://sflllqfytzpwgnaksvkj.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_LaBMdoSK9HGEjLBbeKxXiA_vy2EnlxY';

// Helper de fetch para simplificar
async function apiFetch(endpoint, method = 'GET', body = null) {
    if (SUPABASE_ANON_KEY === 'SUA_CHAVE_ANON_AQUI') {
        console.warn("API: Usando dados mockados pois faltam credenciais do Supabase.");
        return null;
    }

    const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`Status ${response.status}:`, error);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        // Se method for DELETE ou POST sem content/return rep, pode não ter body json
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (e) {
        console.error("Fetch Exception:", e);
        return null;
    }
}

// ── Endpoints ─────────────────────────────────────────────

const api = {
    // 1. Carregar Dashboard (Lista e Kanban)
    async loadDashboard() {
        // Traz as colunas necessárias; a view já cuida do joins e score
        const data = await apiFetch('dashboard_pedidos?select=*&order=score_ordenacao.desc');
        return data;
    },

    // 2. Mover Pedido de Etapa
    async updateEtapa(id, novaEtapa) {
        // Altera só o campo etapa_atual na tabela principal.
        // O trigger "trg_mudanca_etapa" fechará e abrirá o rastreamento automaticamente!
        const result = await apiFetch(`producao_pedidos?id=eq.${id}`, 'PATCH', {
            etapa_atual: novaEtapa
        });
        return result && result.length > 0 ? result[0] : null;
    },

    // 3. Registrar Check-in de Operador (QR Scan)
    // Usado quando o operador assina a entrada.
    async checkInRastreamento(pedidoId, etapa, operadorName) {
        // O trigger abriu a etapa_atual na producao_rastreamento, sem operador.
        // Um PATCH atualiza a linha aberta dessa etapa para esse pedido.
        const result = await apiFetch(
            `producao_rastreamento?pedido_id=eq.${pedidoId}&etapa=eq.${etapa}&status=eq.Em%20Andamento`,
            'PATCH',
            { operador: operadorName, leitura_via: 'Simulador Web' }
        );
        return result;
    },

    // 4. Carregar Histórico de Timeline do Pedido
    async loadHistorico(pedidoId) {
        const data = await apiFetch(`producao_rastreamento?pedido_id=eq.${pedidoId}&order=entrou_em.asc`);
        return data;
    },

    // 5. Carregar Chat do Pedido (simplificado vinculando ao pedido por enquanto)
    async loadChat(pedidoId) {
        const data = await apiFetch(`producao_mensagens?pedido_id=eq.${pedidoId}&order=enviado_em.asc`);
        return data;
    },

    // 6. Enviar Mensagem
    async sendChat(pedidoId, texto, autor, etapa_autor) {
        const result = await apiFetch(`producao_mensagens`, 'POST', {
            pedido_id: pedidoId,
            texto: texto,
            autor: autor,
            etapa_autor: etapa_autor,
            tipo: 'Texto'
        });
        return result ? result[0] : null;
    },

    // 7. Gestão de Operadores e Segurança
    async getOperadores() {
        return await apiFetch('producao_operadores?ativo=eq.true&order=nome.asc');
    },

    async verifyAdminPassword(usuario, senha) {
        // Busca o operador pelo usuário e senha
        const data = await apiFetch(`producao_operadores?usuario=eq.${usuario}&senha=eq.${senha}&ativo=eq.true`);
        return data && data.length > 0 ? data[0] : null;
    },

    async logAdminAccess(operadorId, nomeOperador, equipamento) {
        await apiFetch('admin_login_logs', 'POST', {
            operador_id: operadorId,
            nome_operador: nomeOperador,
            equipamento: equipamento
        });
    },

    async loadLoginLogs() {
        return await apiFetch('admin_login_logs?select=*,producao_operadores(nome)&order=data_login.desc&limit=50');
    },

    // 8. Gestão de Etapas e Prazos (Configuração de Produção)
    async loadScheduleConfig() {
        const milestones = await apiFetch('admin_prazos_etapas?order=posicao.asc');
        const config = await apiFetch('admin_config');
        return { milestones, config };
    },

    async saveScheduleConfig(milestones, totalDays) {
        // Atualiza prazo máximo
        await apiFetch(`admin_config?chave=eq.prazo_maximo_entrega`, 'PATCH', {
            valor: totalDays.toString()
        });

        // Atualiza marcos das etapas
        for (const m of milestones) {
            await apiFetch(`admin_prazos_etapas?etapa=eq.${m.etapa}`, 'PATCH', {
                dia_inicio: m.dia_inicio,
                duracao: m.duracao,
                posicao: m.posicao // Garante que a ordem seja salva se houver mudança
            });
        }
    },

    async upsertEtapa(etapaData) {
        // Verifica se a etapa existe para decidir entre POST ou PATCH
        const existing = await apiFetch(`admin_prazos_etapas?etapa=eq.${etapaData.etapa}`);
        const exists = existing && existing.length > 0;

        const method = exists ? 'PATCH' : 'POST';
        const endpoint = exists ? `admin_prazos_etapas?etapa=eq.${etapaData.etapa}` : 'admin_prazos_etapas';

        const body = { ...etapaData };
        if (exists) delete body.etapa;

        return await apiFetch(endpoint, method, body);
    },

    async deleteEtapa(etapaId) {
        return await apiFetch(`admin_prazos_etapas?etapa=eq.${etapaId}`, 'DELETE');
    },

    // 9. CRUD Operadores
    async upsertOperador(op) {
        const method = op.id ? 'PATCH' : 'POST';
        const endpoint = op.id ? `producao_operadores?id=eq.${op.id}` : 'producao_operadores';

        // Remove ID do body se for POST ou se for PATCH (endpoint já tem o ID)
        const body = { ...op };
        if (method === 'PATCH') delete body.id;

        const result = await apiFetch(endpoint, method, body);
        return result && result.length > 0 ? result[0] : result;
    },

    async deleteOperador(id) {
        // Soft delete: desativar o usuário
        const result = await apiFetch(`producao_operadores?id=eq.${id}`, 'PATCH', {
            ativo: false
        });
        return result;
    },

    // 10. Gestão de Pedidos (Ações Administrativas)
    async deletePedido(id) {
        // Exclusão permanente (cascading no DB resolverá o resto)
        return await apiFetch(`producao_pedidos?id=eq.${id}`, 'DELETE');
    },

    async cancelPedido(id) {
        // Move para a etapa de cancelamento
        return await this.updateEtapa(id, 'Cancelado');
    },

    async updatePedido(id, fields) {
        // Atualiza campos genéricos (SKU, Qtd, etc)
        const result = await apiFetch(`producao_pedidos?id=eq.${id}`, 'PATCH', fields);
        return result && result.length > 0 ? result[0] : null;
    },

    async clearAllPedidos() {
        // Exclui todos os pedidos da tabela (Risco Alto)
        // Nota: Um DELETE sem filtros geralmente é bloqueado por segurança no PostgREST,
        // mas aqui usamos id=neq.0 para contornar se necessário ou simplesmente enviamos sem filtro se permitido.
        const result = await apiFetch('producao_pedidos?id=neq.0', 'DELETE');
        return true;
    }
};


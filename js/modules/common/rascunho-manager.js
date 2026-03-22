/**
 * RascunhoManager — Gerenciador de Rascunhos de Pedido
 *
 * Fluxo:
 *   Simulador → salvar() → rascunhos_pedidos (status: 'rascunho')
 *   Carrinho  → listar() → lê tudo do Supabase
 *   Pagamento → confirmar() → migra para pedidos + producao_pedidos
 *
 * ATENÇÃO: Não modifica pdf-generator-v2.js (PDF está finalizado em v14.45)
 */

const RascunhoManager = (() => {

    const SUPABASE_URL = window.SUPABASE_URL || 'https://sflllqfytzpwgnaksvkj.supabase.co';
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    const TABLE = 'rascunhos_pedidos';

    // Gera um session_id persistente por browser (fingerprint leve)
    function getSessionId() {
        let sid = sessionStorage.getItem('hnt_session_id');
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem('hnt_session_id', sid);
        }
        return sid;
    }

    // Headers padrão para as chamadas REST
    function headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
        };
    }

    // Serializa a grade de tamanhos em texto legível
    function serializeGrade(sizes) {
        if (!sizes) return '';
        return Object.entries(sizes)
            .filter(([, qty]) => parseInt(qty) > 0)
            .map(([size, qty]) => `${size}:${qty}`)
            .join(' | ');
    }

    // Extrai logos (com src base64 ou URL) do estado do simulador
    function extractLogos(state) {
        const logos = {};
        if (!state.elements) return logos;
        Object.entries(state.elements).forEach(([zoneId, elements]) => {
            if (elements && elements.length > 0) {
                // Pega o primeiro elemento da zona (imagem principal)
                const el = elements[0];
                logos[zoneId] = {
                    src: el.src || el.url || null, // preserva base64 ou URL
                    x: el.x || 0,
                    y: el.y || 0,
                    scale: el.scale || 1,
                    rotation: el.rotation || 0,
                    originalName: el.originalName || el.name || zoneId
                };
            }
        });
        return logos;
    }

    // Extrai textos ativos do estado do simulador
    function extractTextos(state) {
        const textos = {};
        if (!state.texts) return textos;
        Object.entries(state.texts).forEach(([zoneId, t]) => {
            if (t && t.enabled && t.content) {
                textos[zoneId] = {
                    content: t.content,
                    fontFamily: t.fontFamily || 'Arial',
                    color: t.color || '#000000',
                    fontSize: t.fontSize || 24,
                    x: t.x || 0,
                    y: t.y || 0,
                    rotation: t.rotation || 0
                };
            }
        });
        return textos;
    }

    // Extrai extras ativos (legging, laço, cordão, etc.)
    function extractExtras(state) {
        const extras = [];
        if (!state.extras) return extras;
        const labels = {
            calca_legging: 'Legging Interna',
            laco: 'Laço',
            cordao: 'Cordão',
            zipperUpgrade: 'Zíper',
            pocketUpgrade: 'Bolso Canguru',
            logoPunho: 'Logo no Punho'
        };
        Object.entries(state.extras).forEach(([key, val]) => {
            if (val && (val === true || val.enabled === true)) {
                extras.push(labels[key] || key);
            }
        });
        // Compatibilidade com config direto
        if (state.config?.zipperUpgrade) extras.push('Zíper');
        if (state.config?.pocketUpgrade) extras.push('Bolso Canguru');
        return [...new Set(extras)]; // deduplicar
    }

    // Monta o payload completo para inserir/atualizar no Supabase
    function buildPayload(state, pricing, config, pdfUrl) {
        const totalQty = Object.values(state.sizes || {})
            .reduce((sum, v) => sum + (parseInt(v) || 0), 0);

        return {
            rascunho_id: state.simulationId || state.orderNumber || `RAS-${Date.now()}`,
            session_id: getSessionId(),
            status: 'no_carrinho',

            // Cliente
            cliente_nome: state.clientName || state.nome || null,
            cliente_telefone: state.phone || null,
            cliente_email: state.email || null,

            // Produto
            tipo_produto: config?.product || state.productInitial || 'Produto',
            produto_sku: state.simulationId || state.orderNumber || null,

            // Cores
            cor_base: state.color || null,
            cor_secundaria: state.colorSecondary || null,
            cor_terciaria: state.colorTertiary || null,
            cor_cordao: state.colorCordao || null,
            cor_laco: state.colorLaco || null,

            // Grade
            grade_tamanhos: serializeGrade(state.sizes),
            quantidade_total: totalQty,

            // Personalizações completas
            extras_ativos: extractExtras(state),
            logos: extractLogos(state),
            textos: extractTextos(state),
            observacoes: state.observations || null,

            // Bordado
            bordado_tipo: state.bordado?.tipo || null,
            bordado_cor: state.bordado?.cor || null,
            bordado_posicao: state.bordado?.posicao || null,
            bordado_texto: state.bordado?.texto || null,

            // Valores
            preco_base: pricing?.basePrice || pricing?.base || 0,
            custo_personalizacao: pricing?.customizationCost || pricing?.logos || 0,
            custo_extras: pricing?.extrasCost || pricing?.extras || 0,
            desconto_volume: pricing?.discount || pricing?.volumeDiscount || 0,
            preco_total: pricing?.total || 0,
            preco_unitario: pricing?.unitPrice || (totalQty > 0 ? (pricing?.total || 0) / totalQty : 0),

            // PDF
            pdf_url: pdfUrl || null,

            // Dump técnico completo (para recuperação total)
            dados_completos: {
                state: { ...state },
                pricing: { ...pricing },
                config: { ...config }
            },

            atualizado_em: new Date().toISOString()
        };
    }

    // ─── API PÚBLICA ────────────────────────────────────────────────────────────

    /**
     * Salva ou atualiza o rascunho no Supabase.
     * Upsert por rascunho_id.
     */
    async function salvar(state, pricing, config, pdfUrl = null) {
        try {
            const payload = buildPayload(state, pricing, config, pdfUrl);
            console.log('💾 RascunhoManager: Salvando rascunho:', payload.rascunho_id);

            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?rascunho_id=eq.${encodeURIComponent(payload.rascunho_id)}&on_conflict=rascunho_id`,
                {
                    method: 'POST',
                    headers: { ...headers(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
                    body: JSON.stringify(payload)
                }
            );

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Supabase error ${res.status}: ${err}`);
            }

            const data = await res.json();
            console.log('✅ RascunhoManager: Rascunho salvo com sucesso', data[0]?.id);
            return { success: true, id: data[0]?.id, rascunho_id: payload.rascunho_id };

        } catch (err) {
            console.error('❌ RascunhoManager.salvar() falhou:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Lista todos os rascunhos ativos da sessão atual (ou do usuário logado).
     * Usado pelo carrinho para exibir os itens.
     */
    async function listar() {
        try {
            const sessionId = getSessionId();
            const url = `${SUPABASE_URL}/rest/v1/${TABLE}?` +
                `status=in.(no_carrinho,rascunho,aguardando_pagamento)` +
                `&session_id=eq.${encodeURIComponent(sessionId)}` +
                `&order=criado_em.desc`;

            const res = await fetch(url, { method: 'GET', headers: headers() });
            if (!res.ok) throw new Error(`Supabase error ${res.status}`);

            const data = await res.json();
            console.log(`📋 RascunhoManager: ${data.length} rascunho(s) encontrado(s)`);
            return { success: true, data };

        } catch (err) {
            console.error('❌ RascunhoManager.listar() falhou:', err);
            return { success: false, data: [], error: err.message };
        }
    }

    /**
     * Remove um rascunho específico por rascunho_id.
     */
    async function remover(rascunhoId) {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?rascunho_id=eq.${encodeURIComponent(rascunhoId)}`,
                { method: 'DELETE', headers: headers() }
            );
            if (!res.ok) throw new Error(`Supabase error ${res.status}`);
            return { success: true };
        } catch (err) {
            console.error('❌ RascunhoManager.remover() falhou:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Marca um rascunho como "aguardando pagamento".
     */
    async function aguardarPagamento(rascunhoId) {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?rascunho_id=eq.${encodeURIComponent(rascunhoId)}`,
                {
                    method: 'PATCH',
                    headers: headers(),
                    body: JSON.stringify({ status: 'aguardando_pagamento', atualizado_em: new Date().toISOString() })
                }
            );
            if (!res.ok) throw new Error(`Supabase error ${res.status}`);
            return { success: true };
        } catch (err) {
            console.error('❌ RascunhoManager.aguardarPagamento() falhou:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * [MODO TESTE] Confirma o pagamento de todos os rascunhos da sessão.
     * Em produção: seria chamado por webhook do gateway.
     *
     * Migra os dados para a tabela `pedidos` e, se sucesso,
     * atualiza o status para 'pago' na tabela de rascunhos.
     */
    async function confirmarPagamentoTeste(rascunhoIds) {
        const ids = Array.isArray(rascunhoIds) ? rascunhoIds : [rascunhoIds];
        const resultados = [];

        for (const rascunhoId of ids) {
            try {
                // 1. Busca o rascunho completo
                const getRes = await fetch(
                    `${SUPABASE_URL}/rest/v1/${TABLE}?rascunho_id=eq.${encodeURIComponent(rascunhoId)}&limit=1`,
                    { method: 'GET', headers: headers() }
                );
                const [rascunho] = await getRes.json();
                if (!rascunho) throw new Error('Rascunho não encontrado: ' + rascunhoId);

                // 2. Monta payload para a tabela `pedidos`
                const dadosTec = rascunho.dados_completos || {};
                const pedidoPayload = {
                    ID_PEDIDO: rascunho.produto_sku || rascunho.rascunho_id,
                    ID_SIMULACAO: rascunho.rascunho_id,
                    TIPO_PRODUTO: rascunho.tipo_produto,
                    STATUS_PEDIDO: 'Confirmado',
                    NOME_CLIENTE: rascunho.cliente_nome || 'Cliente',
                    TELEFONE_CLIENTE: rascunho.cliente_telefone || '',
                    EMAIL_CLIENTE: rascunho.cliente_email || '',
                    COR_BASE: rascunho.cor_base || '',
                    COR_SECUNDARIA: rascunho.cor_secundaria || '',
                    TAMANHO: rascunho.grade_tamanhos || '',
                    QUANTIDADE: rascunho.quantidade_total || 0,
                    PRECO_TOTAL: rascunho.preco_total || 0,
                    PRECO_UNITARIO: rascunho.preco_unitario || 0,
                    CUSTO_PERSONALIZACAO: rascunho.custo_personalizacao || 0,
                    CUSTO_EXTRAS: rascunho.custo_extras || 0,
                    VALOR_DESCONTOS: rascunho.desconto_volume || 0,
                    OBSERVACOES_PRODUCAO: rascunho.observacoes || '',
                    EXTRAS_SELECIONADOS: JSON.stringify(rascunho.extras_ativos || []),
                    pdf_url: rascunho.pdf_url || null,
                    json_tec: rascunho.dados_completos || {},
                    DATA_PEDIDO: new Date().toISOString()
                };

                // 3. Insere na tabela pedidos
                const insertRes = await fetch(
                    `${SUPABASE_URL}/rest/v1/pedidos`,
                    {
                        method: 'POST',
                        headers: { ...headers(), 'Prefer': 'return=representation' },
                        body: JSON.stringify(pedidoPayload)
                    }
                );
                if (!insertRes.ok) {
                    const e = await insertRes.text();
                    throw new Error(`Erro ao inserir em pedidos: ${e}`);
                }
                const [pedidoCriado] = await insertRes.json();

                // 4. Marca o rascunho como 'pago' e referencia o pedido final
                await fetch(
                    `${SUPABASE_URL}/rest/v1/${TABLE}?rascunho_id=eq.${encodeURIComponent(rascunhoId)}`,
                    {
                        method: 'PATCH',
                        headers: headers(),
                        body: JSON.stringify({
                            status: 'pago',
                            pagamento_simulado: true,
                            confirmado_em: new Date().toISOString(),
                            pedido_final_id: pedidoCriado?.id || null,
                            atualizado_em: new Date().toISOString()
                        })
                    }
                );

                console.log(`✅ Pagamento confirmado: ${rascunhoId} → pedido ${pedidoCriado?.id}`);
                resultados.push({ rascunho_id: rascunhoId, success: true, pedido_id: pedidoCriado?.id });

            } catch (err) {
                console.error(`❌ Falha ao confirmar ${rascunhoId}:`, err);
                resultados.push({ rascunho_id: rascunhoId, success: false, error: err.message });
            }
        }

        return resultados;
    }

    /**
     * Converte um rascunho do Supabase para o formato esperado pelo localStorage
     * (compatível com cart-controller.js e cart-ui.js existentes).
     */
    function rascunhoParaCarrinhoFormat(rascunho) {
        const dc = rascunho.dados_completos || {};
        const state = dc.state || {};
        const pricing = dc.pricing || {};
        const config = dc.config || {};

        // Reconstrói o objeto no formato que o cart-ui.js espera
        return {
            // Identificação
            simulationId: rascunho.rascunho_id,
            orderNumber: rascunho.produto_sku || rascunho.rascunho_id,
            _rascunho_db_id: rascunho.id,          // ID real no Supabase
            _source: 'supabase_rascunho',

            // Produto
            productInitial: rascunho.tipo_produto,
            tipoRoduto: rascunho.tipo_produto,

            // Cliente
            phone: rascunho.cliente_telefone || state.phone || '',
            clientName: rascunho.cliente_nome || state.clientName || '',
            email: rascunho.cliente_email || state.email || '',

            // Cores
            color: rascunho.cor_base || state.color || '',
            colorSecondary: rascunho.cor_secundaria || state.colorSecondary || '',
            colorTertiary: rascunho.cor_terciaria || state.colorTertiary || '',

            // Tamanhos (reconstruído do texto serializado)
            sizes: state.sizes || _parseSizes(rascunho.grade_tamanhos),

            // Personalizações
            elements: state.elements || _rebuildElements(rascunho.logos),
            texts: state.texts || _rebuildTextos(rascunho.textos),
            extras: state.extras || _rebuildExtras(rascunho.extras_ativos),

            // Observações
            observations: rascunho.observacoes || state.observations || '',

            // Pricing
            pricing: pricing,

            // PDF
            pdfUrl: rascunho.pdf_url || null,

            // Status e auditoria
            status: rascunho.status,
            criado_em: rascunho.criado_em,
        };
    }

    // Helpers internos de reconstrução
    function _parseSizes(gradeStr) {
        if (!gradeStr) return {};
        const sizes = {};
        gradeStr.split('|').forEach(part => {
            const [size, qty] = part.trim().split(':');
            if (size && qty) sizes[size.trim()] = parseInt(qty.trim()) || 0;
        });
        return sizes;
    }

    function _rebuildElements(logos) {
        if (!logos || typeof logos !== 'object') return {};
        const elements = {};
        Object.entries(logos).forEach(([zoneId, logo]) => {
            if (logo?.src) {
                elements[zoneId] = [{ src: logo.src, x: logo.x || 0, y: logo.y || 0, scale: logo.scale || 1, rotation: logo.rotation || 0 }];
            }
        });
        return elements;
    }

    function _rebuildTextos(textos) {
        if (!textos || typeof textos !== 'object') return {};
        const texts = {};
        Object.entries(textos).forEach(([zoneId, t]) => {
            texts[zoneId] = { enabled: true, ...t };
        });
        return texts;
    }

    function _rebuildExtras(extrasArr) {
        if (!Array.isArray(extrasArr)) return {};
        const extras = {};
        const reverseMap = {
            'Legging Interna': 'calca_legging',
            'Laço': 'laco',
            'Cordão': 'cordao',
            'Zíper': 'zipperUpgrade',
            'Bolso Canguru': 'pocketUpgrade'
        };
        extrasArr.forEach(label => {
            const key = reverseMap[label];
            if (key) extras[key] = { enabled: true };
        });
        return extras;
    }

    // Expõe a API pública
    return {
        salvar,
        listar,
        remover,
        aguardarPagamento,
        confirmarPagamentoTeste,
        rascunhoParaCarrinhoFormat,
        getSessionId
    };

})();

// Disponível globalmente
window.RascunhoManager = RascunhoManager;
console.log('✅ RascunhoManager carregado — v14.45');

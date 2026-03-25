/**
 * DBAdapter - Adaptador de Banco de Dados e Sincronização Global
 * 
 * Responsável por:
 * 1. Persistência de dados do cliente (Telefone, Termos) entre simuladores.
 * 2. Validação de pedidos antes de salvar.
 * 3. Formatação de objetos de pedido para o "Banco de Dados" (Excel/localStorage).
 */

const DBAdapter = {

    /**
     * Gerenciamento de Dados do Cliente (Global)
     */
    CustomerData: {
        STORAGE_KEY: 'hnt_global_client_data',

        save: function (phone, terms) {
            const data = {
                phone: phone || '',
                terms: terms || false,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

            // Dispara eventos de storage para sincronizar abas abertas
            // Nota: localStorage dispara evento 'storage' automaticamente em OUTRAS abas,
            // mas não na atual. Se precisarmos de sync na mesma aba (iframe?), ok.
        },

        load: function () {
            try {
                const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
                return {
                    phone: data.phone || '',
                    terms: data.terms || false
                };
            } catch (e) {
                console.error('Error loading global customer data:', e);
                return { phone: '', terms: false };
            }
        }
    },

    /**
     * Validação de Pedido
     * @param {Object} state - Estado atual do simulador
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateOrder: function (state) {
        const errors = [];

        // 1. Validar Tamanhos (Pelo menos 1 peça)
        let totalQty = 0;
        if (state.sizes) {
            Object.values(state.sizes).forEach(v => totalQty += (parseInt(v) || 0));
        }
        if (totalQty <= 0) {
            errors.push('Selecione pelo menos 1 tamanho para prosseguir.');
        }

        // 2. Validar Telefone
        if (!state.phone || state.phone.trim().length < 10) {
            errors.push('Por favor, informe um Telefone válido com DDD.');
        }

        // 3. Validar Termos
        if (!state.termsAccepted) {
            errors.push('Você precisa aceitar os Termos e Condições para prosseguir.');
        }

        // 4. Validar Textos Ativos sem Conteúdo
        if (state.texts) {
            const emptyTexts = [];
            Object.keys(state.texts).forEach(key => {
                const t = state.texts[key];
                if (t.enabled && (!t.content || t.content.trim() === '')) {
                    // Tenta achar nome amigável
                    let name = key;
                    if (typeof CONFIG !== 'undefined' && CONFIG.textZones) {
                        const z = CONFIG.textZones.find(tz => tz.id === key);
                        if (z) name = z.name;
                    }
                    emptyTexts.push(name);
                }
            });
            if (emptyTexts.length > 0) {
                errors.push(`Há textos ativados sem conteúdo: ${emptyTexts.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Formata o estado para o formato de banco de dados (Tabela)
     */
    formatForDatabase: function (state, pricing, config, pdfUrl = null) {
        // Formatar Grade
        const sizesArr = [];
        if (state.sizes) {
            Object.entries(state.sizes).forEach(([k, v]) => {
                if (v > 0) sizesArr.push(`${k}:${v}`);
            });
        }
        const gradeStr = sizesArr.join(' | ');

        // Formatar Personalizações (Resumo)
        const customDetails = [];

        // Logos/Imagens
        if (state.elements) {
            Object.keys(state.elements).forEach(zoneId => {
                if (state.elements[zoneId] && state.elements[zoneId].length > 0) {
                    customDetails.push(`Logo ${zoneId}: SIM`);
                }
            });
        }

        // Textos
        if (state.texts) {
            Object.entries(state.texts).forEach(([zoneId, t]) => {
                if (t.enabled && t.content) {
                    customDetails.push(`Texto ${zoneId}: "${t.content}" (${t.fontFamily}, ${t.color})`);
                }
            });
        }

        // Extras (Moletom)
        if (state.config.zipperUpgrade) customDetails.push('Zíper: SIM');
        if (state.config.pocketUpgrade) customDetails.push('Bolso Canguru: SIM');
        if (state.logoPunho && state.logoPunho.enabled) customDetails.push('Logo Punho: SIM');

        // Total Peças
        let totalQty = 0;
        if (state.sizes) Object.values(state.sizes).forEach(v => totalQty += (parseInt(v) || 0));

        // Data Atual
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

        return {
            order_id: state.orderNumber || state.simulationId || 'N/A',
            client_name: 'Cliente (Simulador)', // Placeholder
            client_phone: state.phone || '',
            product_type: (state && state.productInitial) || (config && config.product) || 'Produto',
            color: state.color || 'N/A',
            grade: gradeStr,
            quantity: totalQty,
            custom_details: customDetails.join('; '),
            observations: state.observations || '',
            total_price: pricing.total || 0,
            status: 'Simulação',
            pdfUrl: pdfUrl, // Adicionado link do PDF
            DATA_CRIACAO: now.toISOString(),
            DATA_ATUALIZACAO: now.toISOString(),
            DADOS_TECNICOS_JSON: JSON.stringify({
                ...state,
                config: config, // Salva os preços e definições vigentes no momento do pedido
                pricing: pricing // Preserva a matemática completa (breakdown, descontos, taxas)
            })
        };
    }
};

// Auto-Load Global Data on Init (if possible)
// But wait, scripts load before DOM ready mostly.
// We let the modules call DBAdapter.CustomerData.load() manually.

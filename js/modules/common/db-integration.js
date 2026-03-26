/**
 * Módulo de Integração com Banco de Dados e Produção - v14.61_FINAL
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

    validateOrder(state) {
        const errors = [];
        const sizes = state.sizes || {};
        const totalQty = Object.values(sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);
        if (totalQty <= 0) errors.push("A quantidade total de peças não pode ser zero.");
        if (!state.phone || state.phone.length < 10) errors.push("Telefone de contato inválido.");
        const termsAccepted = state.termsAccepted || (window.state && window.state.termsAccepted);
        if (!termsAccepted) errors.push("Aceite os termos para prosseguir.");
        return { valid: errors.length === 0, errors };
    },

    detectProductType(state, isInternal = true) {
        const initial = (state && state.productInitial) ? state.productInitial : "";
        if (initial === 'ML') return isInternal ? 'moletom' : 'Moletom';
        if (initial === 'TP') return isInternal ? 'top' : 'Top';
        if (initial === 'LG') return isInternal ? 'legging' : 'Calça Legging';
        if (initial === 'SL') return isInternal ? 'shorts-legging' : 'Shorts Legging';
        if (initial === 'SH') return isInternal ? 'shorts' : 'Fight Shorts';
        return isInternal ? 'outro' : 'Produto Customizado';
    },

    formatForDatabase(state, pricing, config, pdfUrl = null) {
        console.log("🛠️ [DBAdapter] v14.61 Formatting...", { simulator: this.detectProductType(state, true) });

        const sizes = state.sizes || {};
        const totalQty = Object.values(sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);

        const typeMap = {
            'SH': 'shorts_fight',
            'TP': 'top',
            'LG': 'legging',
            'CL': 'calca_legging',
            'ML': 'moletom',
            'SL': 'shorts_legging'
        };
        const initial = (state && state.productInitial) || 'SH';
        const simType = typeMap[initial] || this.detectProductType(state, true);

        const record = {
            order_id: state.simulationId || state.orderNumber || 'N/A',
            order_number: state.orderNumber || '---',
            client_name: 'Cliente (Simulador)',
            client_phone: state.phone || '',
            product_type: this.detectProductType(state, false),
            color: state.color || 'N/A',
            grade: Object.entries(sizes).filter(([k, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' | '),
            quantity: totalQty,
            custom_details: "",
            observations: state.observations || '',
            total_price: pricing.total || 0,
            status: 'Simulação',
            pdfUrl: pdfUrl,
            DATA_CRIACAO: new Date().toISOString(),
            DADOS_TECNICOS_JSON: "",
            item: {
                simulator_type: simType,
                model_name: this.detectProductType(state, false),
                config: state.config || config || {},
                specs: {
                    sizes: { ...sizes },
                    parts: {},
                    extras: {
                        zipper: state.zipper || {},
                        pocket: state.pocket || {},
                        logoPunho: state.logoPunho || {}
                    },
                    elements: state.elements || {},
                    texts: state.texts || {},
                    uploads: state.uploads || {},
                    observations: state.observations || ""
                },
                pricing: {
                    unit_price: totalQty > 0 ? (pricing.total / totalQty) : 0,
                    total_price: pricing.total || 0,
                    breakdown: {
                        base: (state.config?.basePrice || 149.90),
                        discounts: pricing.discountValue || 0,
                        dev_fees: pricing.devFees || 0
                    }
                },
                qty_total: totalQty
            }
        };

        const productData = config || state.config || (typeof CONFIG !== 'undefined' ? CONFIG : null);

        if (productData) {
            // --- POPULATE SPECS ---
            if (productData.parts && state.parts) {
                productData.parts.forEach(p => {
                    const colorId = state.parts[p.id];
                    const colorObj = productData.colors ? productData.colors.find(c => c.id === colorId) : null;
                    record.item.specs.parts[p.name] = {
                        id: p.id,
                        value: colorObj ? colorObj.name : colorId,
                        hex: colorObj ? colorObj.hex : '#000'
                    };
                });
            } else if (state.color) {
                const colorObj = productData.colors ? productData.colors.find(c => c.id === state.color) : null;
                record.item.specs.parts["Cor Principal"] = {
                    id: "base",
                    value: colorObj ? colorObj.name : state.color,
                    hex: colorObj ? colorObj.hex : '#fff'
                };
            }
        }

        record.DADOS_TECNICOS_JSON = JSON.stringify(record.item);
        return record;
    }
};

window.DBAdapter = DBAdapter;

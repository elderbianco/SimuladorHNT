/**
 * Módulo de Integração com Banco de Dados e Produção
 * Centraliza a formatação de dados para garantir consistência entre Carrinho, Histórico e APIs Externas.
 */

const DBAdapter = {
    /**
     * Valida se o estado do pedido está completo para exportação
     * @param {Object} state - Estado atual do simulador
     * @returns {Object} - { valid: boolean, errors: string[] }
     */
    validateOrder(state) {
        const errors = [];
        const sizes = state.sizes || {};
        const totalQty = Object.values(sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);

        if (totalQty <= 0) {
            errors.push("A quantidade total de peças não pode ser zero.");
        }

        if (!state.phone || state.phone.length < 13) {
            errors.push("Telefone de contato inválido ou ausente.");
        }

        const termsAccepted = state.termsAccepted || (window.state && window.state.termsAccepted);
        if (!termsAccepted) {
            errors.push("Você precisa ler e aceitar os termos de responsabilidade e condições do FAQ para prosseguir.");
        }

        // Validação de Textos ou Imagens Vazios (Prevenção de Erros/Cobrança)
        let hasEmptyItems = false;

        if (state.texts) {
            Object.values(state.texts).forEach(txt => {
                if (txt.enabled && (!txt.content || txt.content.trim() === '')) {
                    hasEmptyItems = true;
                }
            });
        }

        // Verifica uploads que possam estar "habilitados" logicamente sem arquivo (preparação para fluxos futuros ou checkboxes independentes)
        if (state.uploads) {
            Object.values(state.uploads).forEach(up => {
                if (up.enabled && !up.src) {
                    hasEmptyItems = true;
                }
            });
        }

        if (hasEmptyItems) {
            errors.push("⚠️ Atenção: Detectamos campos de TEXTO ou IMAGEM habilitados, mas sem conteúdo/arquivo inserido.\n\nPor favor, verifique sua personalização. Itens vazios podem gerar cobranças incorretas ou falhas na produção.");
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Gera o objeto de registro para o banco de dados (localStorage / API)
     * Padroniza a estrutura independente do produto (Shorts, Top, etc)
     * @param {Object} state - Estado do simulador
     * @param {Object} pricing - Objeto retornado pelo módulo de precificação
     * @param {Object} productData - Metadados do produto (DATA ou CONFIG)
     */
    formatForDatabase(state, pricing, productData, pdfUrl = null) {
        const now = new Date();
        const sizes = state.sizes || {};
        const totalQty = Object.values(sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);

        // NEW PROTOCOL STRUCTURE
        const record = {
            // Meta-dados do registro (para controle do Cart)
            order_id: state.orderNumber || state.simulationId || `SIM_${Date.now()}`,
            created_at: now.toISOString(), // ISO format is safer for DB
            status: "saved_locally", // draft, saved_locally, submitted
            pdfUrl: pdfUrl, // Armazena link do PDF para o Cart

            // --- FLATTENED DATA FOR DB COMPATIBILITY ---
            total_price: pricing.total || 0,
            quantity: totalQty,
            product_type: this.detectProductType(state, true),
            client_name: state.client_info?.name || "Cliente",
            client_phone: state.phone || "",
            // -------------------------------------------

            // Critical for Restoration System
            DADOS_TECNICOS_JSON: JSON.stringify(state),

            // Dados do Cliente (Simulador capta apenas básico ou nada, o Cart pode enriquecer)
            client_info: {
                name: "Cliente", // Placeholder
                phone: state.phone || "",
                email: ""
            },

            // Item detalhado (Unificando estrutura)
            item: {
                simulator_type: this.detectProductType(state, true), // Internal Key (shorts, top, etc)
                model_name: this.detectProductType(state, false),    // Human Readable
                preview_image: "", // To be filled by Simulator before saving if possible
                pdf_path: pdfUrl || "", // Path to generated PDF in assets/BancoDados/PedidosPDF/

                // Especificações Técnicas
                specs: {
                    sizes: { ...sizes },
                    parts: {},     // Cores de zonas
                    extras: {},    // Laces, details
                    texts: [],     // Text contents
                    uploads: [],   // Custom images
                    observations: state.observations || "" // New field
                },

                // Financeiro do Item
                pricing: {
                    unit_price: totalQty > 0 ? (pricing.total / totalQty) : 0,
                    total_price: pricing.total || 0,
                    currency: "BRL",
                    breakdown: {
                        base: state.config?.basePrice || (totalQty > 0 ? (pricing.total / totalQty) : 0),
                        discounts: pricing.discountValue || 0,
                        dev_fees: pricing.devFees || (pricing.devFeesCount ? (state.config?.devFee || 0) : 0),
                        addons: pricing.addons || 0,
                        details: pricing.details || [] // New: store detailed items if available
                    }
                },

                qty_total: totalQty
            },

            // Shorts-specific data (for complete restoration)
            shorts_specific: {
                limits: state.limits || { right: false, left: false },
                embFiles: state.embFiles || [],
                zoom: state.zoom || 1.0,
                simNumber: state.simNumber || '',
                productInitial: state.productInitial || ''
            }
        };

        // --- POPULATE SPECS ---

        // 1. Process Parts/Colors
        if (productData.parts && state.parts) {
            // Shorts (Multi-part)
            productData.parts.forEach(p => {
                const colorId = state.parts[p.id];
                const colorObj = productData.colors.find(c => c.id === colorId);
                record.item.specs.parts[p.name] = {
                    id: p.id,
                    value: colorObj ? colorObj.name : colorId,
                    hex: colorObj ? colorObj.hex : '#000'
                };
            });
        } else if (state.color) {
            // Simple Products (Single color)
            const colorObj = productData.colors.find(c => c.id === state.color);
            record.item.specs.parts["Cor Principal"] = {
                id: "main_color",
                value: colorObj ? colorObj.name : state.color,
                hex: colorObj ? colorObj.hex : '#000'
            };
        }

        // 2. Process Extras
        if (productData.extras) {
            productData.extras.forEach(e => {
                const ext = state.extras[e.id];
                if (ext && ext.enabled) {
                    const colorObj = productData.colors.find(c => c.id === ext.color);
                    record.item.specs.extras[e.name] = {
                        id: e.id,
                        active: true,
                        value: colorObj ? colorObj.name : ext.color,
                        price: (state.config.extraPrices && state.config.extraPrices[e.id] !== undefined)
                            ? state.config.extraPrices[e.id]
                            : e.price
                    };
                }
            });
        }

        // 3. Process Texts
        const textZones = productData.textZones || [];
        textZones.forEach(t => {
            const txt = state.texts[t.id];
            if (txt && txt.enabled && txt.content) {
                const colorName = productData.colors.find(c => c.hex === txt.color)?.name || txt.color;
                let textPrice = 0;
                const zid = t.id.toLowerCase();
                if (zid.includes('lat')) textPrice = state.config?.textLatPrice || 0;
                else if (zid.includes('leg') || zid.includes('perna')) textPrice = state.config?.textLegPrice || state.config?.textPrice || 0;
                else textPrice = state.config?.textPrice || 0;

                record.item.specs.texts.push({
                    zone_label: t.name,
                    zone_id: t.id,
                    content: txt.content,
                    font_family: txt.fontFamily,
                    color_name: colorName,
                    color_hex: txt.color,
                    unit_price: textPrice,
                    unlocked: txt.unlocked || false,
                    scale: txt.scale || 1.0,
                    x: txt.x || t.cssLeft,
                    y: txt.y || t.cssTop,
                    maxLines: txt.maxLines || 1
                });
            }
        });

        // 4. Process Uploads
        if (productData.uploadZones) {
            // Fixed Zones (Shorts)
            productData.uploadZones.forEach(u => {
                const up = state.uploads[u.id];
                if (up && (up.src || up.filename)) {
                    let logoPrice = 0;
                    const zid = u.id.toLowerCase();
                    const zp = state.config?.zonePrices || {};
                    if (zp[u.id] !== undefined) logoPrice = zp[u.id];
                    else if (zid.includes('lat')) logoPrice = state.config?.logoLatPrice || 0;
                    else if (zid.includes('leg') || zid.includes('perna')) logoPrice = state.config?.legZoneAddonPrice || state.config?.logoLegPrice || 0;
                    else if (zid.includes('center') || zid.includes('centro')) logoPrice = state.config?.logoCenterPrice || 0;

                    record.item.specs.uploads.push({
                        zone_label: u.name,
                        zone_id: u.id,
                        file_name: up.filename || "Imagem",
                        file_url: up.supabaseUrl || up.src || "",
                        is_custom: up.isCustom || false,
                        unit_price: logoPrice,
                        unlocked: up.unlocked || false,
                        scale: up.scale || 1.0,
                        rotation: up.rotation || 0,
                        x: up.x || u.cssLeft,
                        y: up.y || u.cssTop,
                        formatted_filename: up.formattedFilename || ""
                    });
                }
            });
        } else if (state.elements) {
            // Drag-drop Zones (Top, Legging, Moletom)
            Object.keys(state.elements).forEach(zoneId => {
                const els = state.elements[zoneId];
                if (Array.isArray(els)) {
                    els.forEach((el, idx) => {
                        try {
                            // el may be a DOM element or a plain object (serialized state)
                            let src = '';
                            let filename = `Item_${idx + 1}`;
                            let isCustom = false;

                            if (el && typeof el.querySelector === 'function') {
                                // Live DOM element
                                const imgTag = el.querySelector('img');
                                src = imgTag ? imgTag.src : '';
                                filename = el.dataset?.filename || filename;
                                isCustom = el.dataset?.isCustom === 'true';
                            } else if (el && typeof el === 'object') {
                                // Serialized/plain object fallback
                                src = el.src || el.supabaseUrl || '';
                                filename = el.filename || filename;
                                isCustom = el.isCustom || false;
                            }

                            record.item.specs.uploads.push({
                                zone_label: (typeof window !== 'undefined' && typeof window.resolveZoneLabel === 'function') ? window.resolveZoneLabel(zoneId) : (typeof resolveZoneLabel === 'function' ? resolveZoneLabel(zoneId) : zoneId),
                                zone_id: zoneId,
                                file_name: filename,
                                file_url: src,
                                is_custom: isCustom
                            });
                        } catch (elErr) {
                            console.warn(`formatForDatabase: erro ao processar elemento na zona ${zoneId}:`, elErr);
                        }
                    });
                }
            });
        }

        return record;
    },

    detectProductType(state, returnKey) {
        // Simple heuristic based on CONFIG structure or specific state keys
        if (state.config && state.config.product) {
            if (returnKey) {
                const safe = state.config.product.toLowerCase().replace(/calça\s*/g, '').trim();
                return safe === 'legging' ? 'legging' : state.config.product.toLowerCase().replace(/\s+/g, '_');
            }
            return state.config.product;
        }
        // Fallback checks
        if (document.title.includes("Shorts Legging")) return returnKey ? "shorts_legging" : "Shorts Legging";
        if (document.title.includes("Legging") && !document.title.includes("Shorts")) return returnKey ? "legging" : "Calça Legging";
        if (document.title.includes("Top")) return returnKey ? "top" : "Top";

        return returnKey ? "custom" : "Produto Personalizado";
    },

    /**
     * Gerencia dados globais do cliente (Sincronização entre simuladores)
     */
    CustomerData: {
        keys: {
            phone: 'hnt_global_client_phone',
            terms: 'hnt_global_client_terms'
        },

        save(phone, terms) {
            if (phone !== undefined) localStorage.setItem(this.keys.phone, phone);
            if (terms !== undefined) localStorage.setItem(this.keys.terms, terms ? 'true' : 'false');
        },

        load() {
            return {
                phone: localStorage.getItem(this.keys.phone) || "",
                terms: localStorage.getItem(this.keys.terms) === 'true'
            };
        },

        clear() {
            localStorage.removeItem(this.keys.phone);
            localStorage.removeItem(this.keys.terms);
        }
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DBAdapter = DBAdapter;
}

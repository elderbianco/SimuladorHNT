/**
 * Módulo de Lógica - Moletom
 */

/**
 * Gera o nome de arquivo formatado para produção
 * Padrão: [ID_PEDIDO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
/**
 * Gera o próximo número sequencial de SIMULAÇÃO (ex: 066850)
 */
function generateNextSequenceNumber() {
    let last = parseInt(localStorage.getItem('hnt_sequence_id') || '66849');
    let next = last + 1;
    localStorage.setItem('hnt_sequence_id', next);
    return String(next).padStart(6, '0');
}

/**
 * Gera o próximo número de PEDIDO - PADRÃO NUMÉRICO (ex: 010008)
 */
function generateNextOrderNumber() {
    // 1. Verificar configuração do Admin para número inicial
    const orderConfig = JSON.parse(localStorage.getItem('hnt_order_config') || '{"nextNumber":1000}');
    const startFrom = (parseInt(orderConfig.nextNumber) || 1000) - 1;

    let last = parseInt(localStorage.getItem('hnt_order_seq_id') || '0');

    // Se o número do admin for maior que o sequencial atual, utiliza o do admin
    if (startFrom > last) {
        last = startFrom;
    }

    let next = last + 1;
    localStorage.setItem('hnt_order_seq_id', next);

    // Padrão: estritamente numérico com 6 dígitos
    return String(next).padStart(6, '0');
}

/**
 * Gera o nome de arquivo formatado para produção
 * Padrão: [ID_PEDIDO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    // 1. Sigla Produto
    const productSigla = 'ML'; // Moletom

    // 2. Garantir IDs
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = generateNextOrderNumber();
    }

    // 3. Composite ID (XXXXXX-ML-XXXXXX)
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;

    let compositeId = `${cleanOrderId}-${cleanSimId}`;

    // 2. Sigla Local (Mapeamento)
    const zoneMap = {
        'frente_centro': 'FRENTE',
        'costas_centro': 'COSTAS'
    };
    const zoneSigla = zoneMap[zoneId] || zoneId.toUpperCase();

    // ... rest of function ...
    // Note: I will need to rewrite the rest to match lines 28-36ish if I cut off there, or just provide full body.
    // Providing Full Body for safety:

    // 4. Source Tag
    const sourceTag = source === 'ACERVO' ? 'ACERVO' : 'EXT';

    // 5. Type Tag (IMG vs EMB)
    const ext = originalName.split('.').pop().toLowerCase();
    const typeTag = ['emb', 'dst', 'pes', 'exp'].includes(ext) ? 'EMB' : 'IMG';

    // 6. Sanitizar
    const sanitized = originalName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9.\-_]/g, "");

    return `${compositeId}_${productSigla}_${zoneSigla}_${sourceTag}_${typeTag}_${sanitized}`;
}

function loadAdminConfig() {
    let prices = JSON.parse(localStorage.getItem('hnt_moletom_config') || '{}');
    const globalConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    // ✅ AUTO-INIT: Se basePrice for 0 ou undefined (dados corrompidos), re-inicializar com defaults reais
    if (!prices.basePrice || prices.basePrice === 0) {
        prices = {
            basePrice: 189.90,
            sizeModPrice: 0,   // Admin padrão = 0
            devFee: 0,         // Admin padrão = 0
            logoFrontPrice: 29.90,
            textFrontPrice: 19.90,
            logoBackPrice: 29.90,
            textBackPrice: 19.90,
            logoSleevePrice: 14.90,
            textSleevePrice: 9.90,
            logoHoodPrice: 14.90,
            textHoodPrice: 9.90,
            price10: 170.90,
            price20: 151.90,
            price30: 132.90,
            artWaiver: true
        };
        localStorage.setItem('hnt_moletom_config', JSON.stringify(prices));
        console.log('✅ Moletom: preços padrão auto-inicializados (localStorage estava zerado).');
    }

    // Calculate Global Discount % from Shorts Config (Reference)
    // We now use specific tier prices if available, so these legacy discounts are just fallbacks or 0.
    const d20 = 0;
    const d40 = 0;

    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    state.config = {
        basePrice: (getVal(prices.basePrice, 189.90) || 189.90), // Force fallback if 0
        product: 'Moletom',
        sizeModPrice: getVal(prices.sizeModPrice, 0),
        devFee: getVal(prices.devFee, 0),

        // Correct Zones Matching Admin
        logoFrontPrice: getVal(prices.logoFrontPrice, 29.90),
        textFrontPrice: getVal(prices.textFrontPrice, 19.90),
        logoBackPrice: getVal(prices.logoBackPrice, 29.90),
        textBackPrice: getVal(prices.textBackPrice, 19.90),
        logoSleevePrice: getVal(prices.logoSleevePrice, 14.90),
        textSleevePrice: getVal(prices.textSleevePrice, 9.90),
        logoHoodPrice: getVal(prices.logoHoodPrice, 14.90),
        textHoodPrice: getVal(prices.textHoodPrice, 9.90),

        // Extras (Usar getAdminVal para permitir fallback no pricing.js se necessário)
        zipperUpgrade: getAdminVal(prices.zipperUpgrade),
        pocketUpgrade: getAdminVal(prices.pocketUpgrade),

        // Wholesale Tiers
        price10: getVal(prices.price10, 170.90),
        price20: getVal(prices.price20, 151.90),
        price30: getVal(prices.price30, 132.90),
        // Legacy
        discount20: d20,
        discount40: d40,
        artWaiver: globalConfig.artWaiver !== undefined ? globalConfig.artWaiver : (prices.artWaiver !== undefined ? prices.artWaiver : true),
        partColors: JSON.parse(localStorage.getItem('hnt_moletom_part_colors') || '{}'),
        activeFonts: JSON.parse(localStorage.getItem('hnt_active_fonts') || '[]'),
        textColors: JSON.parse(localStorage.getItem('hnt_text_colors') || '[]')
    };

    // Atualizar Preços de Tamanho Dinamicamente
    if (typeof CONFIG !== 'undefined' && CONFIG.sizes) {
        CONFIG.sizes.forEach(s => {
            if (['GG', 'EXG', 'EXGG', 'G1', 'G2', 'G3'].includes(s.label)) {
                s.priceMod = state.config.sizeModPrice;
            }
        });
    }

    const disabled = state.config.partColors['main'] || [];
    state.availableColors = CONFIG.colors.filter(c => !disabled.includes(c.id));

    if (state.availableColors.length === 0) state.availableColors = CONFIG.colors;

    const defaultFont = getDefaultFont();
    CONFIG.textZones.forEach(z => {
        if (!state.texts[z.id]) {
            state.texts[z.id] = { enabled: false, content: "", fontFamily: defaultFont, color: "#000000", scale: 1.0, maxLines: 1 };
        }
    });
    updateCartCount();
}

function getDefaultFont() {
    let all = (typeof SHARED_FONTS !== 'undefined') ? SHARED_FONTS : [];
    return all.length > 0 ? all[0].id : 'Outfit';
}

function getZoneBoundaries(element) {
    let zone = null;
    let pid = null;
    for (const zid in state.elements) {
        if (state.elements[zid].includes(element)) { zone = CONFIG.zones[zid]; pid = zid; break; }
    }
    const zattr = element.dataset.zone || element.dataset.parentZone;
    if (!zone && zattr) {
        if (CONFIG.zones[zattr]) { zone = CONFIG.zones[zattr]; pid = zattr; }
        else {
            const tz = CONFIG.textZones.find(t => t.id === zattr);
            if (tz) { zone = CONFIG.zones[tz.parentZone]; pid = tz.parentZone; }
        }
    }
    if (!zone) return null;
    const wrp = document.querySelector('.simulator-wrapper');
    const sc = parseFloat(element.style.transform.match(/scale\(([0-9.]+)\)/)?.[1] || 1.0);
    const halfW = (element.offsetWidth * sc / wrp.offsetWidth * 100) / 2;
    const halfH = (element.offsetHeight * sc / wrp.offsetHeight * 100) / 2;
    const zH = zone.height || (zone.width * 1.5);
    // 🎯 EXPANSÃO CONTROLADA (Replicada do Top/Shorts/Legging)
    const wrpWidth = wrp ? wrp.offsetWidth : 1; // Fallback
    const wrpHeight = wrp ? wrp.offsetHeight : 1;

    // Obter dimensões do Elemento em PX vs % e comparar com PX vs % da Zona
    const elementWidthPct = (element.offsetWidth * sc / wrpWidth * 100);
    const elementHeightPct = (element.offsetHeight * sc / wrpHeight * 100);

    const zoneHeightPct = zone.height || (zone.width * 1.5);

    // Check Zooming State
    const isZooming = (elementWidthPct > zone.width + 0.1) || (elementHeightPct > zoneHeightPct + 0.1);
    const expansionFactor = isZooming ? 1.60 : 1.0;

    // Expand Boundaries
    const expandedZoneW = zone.width * expansionFactor;
    const expandedZoneH = zoneHeightPct * expansionFactor;

    const hEW = expandedZoneW / 2;
    const hEH = expandedZoneH / 2;

    let minX = zone.x - hEW + halfW;
    let maxX = zone.x + hEW - halfW;
    let minY = zone.y - hEH + halfH;
    let maxY = zone.y + hEH - halfH;

    // STRICT LOCK: If Element > Zone, Allow Move if Zooming
    if (minX > maxX) {
        if (isZooming) { const temp = minX; minX = maxX; maxX = temp; }
        else { minX = zone.x; maxX = zone.x; }
    }
    if (minY > maxY) {
        if (isZooming) { const temp = minY; minY = maxY; maxY = temp; }
        else { minY = zone.y; maxY = zone.y; }
    }

    return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY,
        parentZoneId: pid
    };
}

function updateCartCount() {
    const h = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    document.querySelectorAll('.cart-badge').forEach(b => {
    });
}

// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_moletom_config' || e.key === 'hnt_moletom_part_colors' || e.key === 'hnt_text_colors' || e.key === 'hnt_active_fonts') {
        console.log('🔄 Sincronizando configurações com Admin...');
        loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
    }
});
// --- CACHE SYSTEM ---
window.dataCache = {
    textZonesById: new Map(),
    uploadZonesById: new Map()
};

function initDataCache() {
    console.log('Initializing Data Cache (Moletom)...');
    const source = (typeof CONFIG !== 'undefined') ? CONFIG : null;
    if (!source) return;

    if (source.textZones) {
        window.dataCache.textZonesById.clear();
        source.textZones.forEach(z => window.dataCache.textZonesById.set(z.id, z));
    }
    if (source.zones) {
        window.dataCache.uploadZonesById.clear();
        const zonesIter = Array.isArray(source.zones) ? source.zones : Object.values(source.zones);
        zonesIter.forEach(z => window.dataCache.uploadZonesById.set(z.id, z));
    }
}

/**
 * RESTORATION SYSTEM
 * Checks for a restoration buffer from Admin Panel and hydrating state
 */
window.checkForRestoration = function () {
    console.log("♻️ Checking for restoration buffer (Moletom)...");
    try {
        const buffer = localStorage.getItem('hnt_restore_buffer');
        if (!buffer) return false;

        const data = JSON.parse(buffer);
        console.log("♻️ Buffer found for Order:", data.orderId);

        Object.assign(state, data.state);

        // Ensure all text zones are properly initialized
        const defaultFont = getDefaultFont();
        CONFIG.textZones.forEach(z => {
            if (!state.texts[z.id]) {
                state.texts[z.id] = {
                    enabled: false,
                    content: "",
                    fontFamily: defaultFont,
                    color: "#000000",
                    scale: 1.0,
                    maxLines: 1
                };
            } else {
                // Ensure all required properties exist
                if (state.texts[z.id].enabled === undefined) state.texts[z.id].enabled = false;
                if (!state.texts[z.id].content) state.texts[z.id].content = "";
                if (!state.texts[z.id].fontFamily) state.texts[z.id].fontFamily = defaultFont;
                if (!state.texts[z.id].color) state.texts[z.id].color = "#000000";
                if (state.texts[z.id].scale === undefined) state.texts[z.id].scale = 1.0;
                if (state.texts[z.id].maxLines === undefined) state.texts[z.id].maxLines = 1;
            }
        });

        // Clear buffer
        localStorage.removeItem('hnt_restore_buffer');

        // Trigger UI Updates
        if (typeof renderControls === 'function') renderControls();
        if (typeof renderFixedTexts === 'function') renderFixedTexts();
        if (typeof updatePrice === 'function') updatePrice();

        // Force re-render visuals
        if (typeof updateVisuals === 'function') updateVisuals();

        setTimeout(() => {
            alert(`♻️ Pedido ${data.orderId} restaurado com sucesso!`);
        }, 500);

        return true;

    } catch (e) {
        console.error("❌ Critical Error restoring order:", e);
        alert("Erro ao restaurar pedido. Consulte o console.");
        return false;
    }
};

/**
 * Salva o pedido atual no histórico (Carrinho)
 */
async function saveOrderToHistory(silent = false, pdfUrlOverride = null) {
    // 1. Validação via Adapter
    const validation = DBAdapter.validateOrder(state);
    if (!validation.valid) {
        if (!silent) {
            alert('⚠️ ' + validation.errors.join('\n'));
        }
        return false;
    }

    // 2. Cálculo do ID Final (Sequencial) - Necessário ANTES do PDF
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    let sigla = 'ML';
    let typeCount = 0;
    const currentOrderNum = state.orderNumber;

    history.forEach(h => {
        if (h.DADOS_TECNICOS_JSON) {
            try {
                const hState = JSON.parse(h.DADOS_TECNICOS_JSON);
                if ((hState.orderNumber === currentOrderNum) && h.order_id && h.order_id.includes(`-${sigla}-`)) {
                    typeCount++;
                }
            } catch (e) { }
        }
    });

    const sequenceSuffix = String(typeCount + 1).padStart(2, '0');
    let finalId = `${state.simulationId}-${sequenceSuffix}`;

    // Verificação de Edição: Manter ID original se existir
    if (state._editingIndex !== undefined && state._editingIndex !== null) {
        if (state._editingOrderId) finalId = state._editingOrderId;
    }

    // 3. Geração de PDF Automática com ID Final
    let pdfUrl = pdfUrlOverride;
    try {
        if (!pdfUrl && typeof PDFGenerator !== 'undefined') {
            pdfUrl = await PDFGenerator.generateAndSaveForCart(finalId);
        }
    } catch (e) {
        console.error('❌ Erro ao gerar PDF para carrinho:', e);
    }

    // 4. Formatação via Adapter e Persistência
    const pricing = calculateFullPrice();
    const newRow = DBAdapter.formatForDatabase(state, pricing, CONFIG, pdfUrl);
    newRow.order_id = finalId; // Sincroniza ID final

    // --- LOCAL FIRST SAVE ---
    if (state._editingIndex !== undefined && state._editingIndex !== null) {
        console.log(`✏️ Atualizando item existente no índice: ${state._editingIndex}`);
        history[state._editingIndex] = newRow;
        delete state._editingIndex;
        delete state._editingOrderId;
    } else {
        history.push(newRow);
    }

    localStorage.setItem('hnt_all_orders_db', JSON.stringify(history));
    console.log('✅ Salvo localmente com sucesso!');

    // --- SUPABASE SYNC (ASYNC/NON-BLOCKING) ---
    if (typeof SupabaseAdapter !== 'undefined') {
        console.log('🚀 Iniciando sincronização em segundo plano com Supabase (Moletom)...');
        SupabaseAdapter.savePedido(newRow, state)
            .then(() => console.log('✅ Sincronizado com Supabase.'))
            .catch(err => console.error('⚠️ Falha na sincronização Supabase (Item salvo localmente):', err));
    }

    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.addOrder(newRow);
    }

    return true;
}

// ... existing code ...
function resetSimulatorData() {
    console.log("🧹 Resetando dados do simulador (Moletom)...");

    // 1. Limpar Objetos do Estado
    state.sizes = {};
    state.observations = "";

    // 2. Limpar Textos
    const defaultFont = getDefaultFont();
    CONFIG.textZones.forEach(z => {
        state.texts[z.id] = {
            enabled: false,
            content: "",
            fontFamily: defaultFont,
            color: "#000000",
            scale: 1.0,
            maxLines: 1
        };
    });

    // 3. Limpar Elementos Dinâmicos
    Object.keys(state.elements).forEach(zoneId => {
        if (state.elements[zoneId]) {
            state.elements[zoneId].forEach(el => el.remove());
            state.elements[zoneId] = [];
        }
    });

    // 4. Gerar novos IDs
    state.simNumber = generateNextSequenceNumber();
    state.simulationId = `HNT-ML-${state.simNumber}`;
    state.orderNumber = generateNextOrderNumber();

    // 5. Persistir estado limpo
    saveState();

    // 6. Sincronizar UI
    if (typeof renderControls === 'function') renderControls();
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof renderFixedTexts === 'function') renderFixedTexts();
    if (typeof updatePrice === 'function') {
        const pricing = calculateFullPrice();
        updatePrice(pricing);
    }
    if (typeof updateCartCount === 'function') updateCartCount();

    console.log("✅ Simulador Moletom resetado com sucesso.");
}

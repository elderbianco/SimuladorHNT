/**
 * Módulo de Lógica de Negócio - Shorts Legging
 */

/**
 * Determina automaticamente a cor do logo HNT com base na cor de fundo
 */
function getAutoHntLogoColor(baseColor) {
    const darkColors = ['preto', 'vermelho', 'roxo', 'marsala', 'azulescuro', 'verdebandeira', 'verdemusgo', 'chumbo', 'azul_marinho'];
    return darkColors.includes(baseColor) ? 'branco' : 'preto';
}

/**
 * Gera o nome de arquivo formatado para produção
 * Padrão: [ID_PEDIDO]-[ID_SIMULACAO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    // 1. Sigla Produto
    const productSigla = 'SL'; // Shorts Legging

    // 2. Garantir IDs
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = `HNT-PD-${generateNextOrderNumber()}`;
    }

    // 3. Composite ID
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;
    if (!cleanOrderId.startsWith('HNT-')) cleanOrderId = `HNT-${cleanOrderId}`;
    if (!cleanOrderId.includes('PD') && /HNT-\d+/.test(cleanOrderId)) cleanOrderId = cleanOrderId.replace('HNT-', 'HNT-PD-');

    let compositeId = `${cleanOrderId}-${cleanSimId}`;

    // 4. Sigla Local (Mapeamento)
    const zoneMap = {
        'lateral_direita': 'LAT_DIR',
        'lateral_esquerda': 'LAT_ESQ',
        'perna_direita': 'PERNA_DIR',
        'perna_esquerda': 'PERNA_ESQ',
        'frente_direita': 'FRENTE_DIR',
        'frente_esquerda': 'FRENTE_ESQ',
        'costas_direita': 'COSTAS_DIR',
        'costas_esquerda': 'COSTAS_ESQ'
    };
    const zoneSigla = zoneMap[zoneId] || zoneId.toUpperCase();

    // 5. Source Tag
    const sourceTag = source === 'ACERVO' ? 'ACERVO' : 'EXT';

    // 6. Type Tag (IMG vs EMB)
    const ext = originalName.split('.').pop().toLowerCase();
    const typeTag = ['emb', 'dst', 'pes', 'exp'].includes(ext) ? 'EMB' : 'IMG';

    // 7. Sanitizar
    const sanitized = originalName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9.\-_]/g, "");

    return `${compositeId}_${productSigla}_${zoneSigla}_${sourceTag}_${typeTag}_${sanitized}`;
}

/**
 * Carrega configurações do administrador
 */
function loadAdminConfig() {
    const prices = JSON.parse(localStorage.getItem('hnt_shorts_legging_config') || '{}');
    const globalConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    // Calculate Global Discount % from Shorts Config (Reference)
    // We now use specific tier prices if available, so these legacy discounts are just fallbacks or 0.
    const d20 = 0;
    const d40 = 0;

    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    state.config = {
        // Enforce fallback if basePrice comes as 0 from Admin (which implies unconfigured/error for base price)
        basePrice: (getVal(prices.basePrice, 89.90) || 89.90),

        product: 'Shorts Legging',
        sizeModPrice: getVal(prices.sizeModPrice, 10.00), // Default to 10.00 to match others
        devFee: getVal(prices.devFee, 30.00), // Standard fee

        logoLatPrice: getVal(prices.logoLatPrice, 29.90),
        textLatPrice: getVal(prices.textLatPrice, 9.90),
        logoLegPrice: getVal(prices.logoLegPrice, 14.90),
        textLegPrice: getVal(prices.textLegPrice, 9.90), // Fixed from 0 to 9.90

        // Wholesale Tiers
        price10: getVal(prices.price10, 80.90),
        price20: getVal(prices.price20, 71.90),
        price30: getVal(prices.price30, 62.90),

        // Legacy
        discount20: d20,
        discount40: d40,
        artWaiver: prices.artWaiver !== undefined ? prices.artWaiver : (globalConfig.artWaiver !== undefined ? globalConfig.artWaiver : (CONFIG.artWaiver !== undefined ? CONFIG.artWaiver : true)),
        partColors: JSON.parse(localStorage.getItem('hnt_shorts_legging_part_colors') || '{}'),
        activeFonts: JSON.parse(localStorage.getItem('hnt_active_fonts') || '[]'),
        textColors: JSON.parse(localStorage.getItem('hnt_text_colors') || '[]')
    };

    // Atualizar Preços de Tamanho Dinamicamente
    const targets = [];
    if (typeof CONFIG !== 'undefined' && CONFIG.sizes) targets.push(CONFIG.sizes);
    if (typeof DATA !== 'undefined' && DATA.sizes) targets.push(DATA.sizes);

    targets.forEach(sizeArray => {
        sizeArray.forEach(s => {
            if (['GG', 'EXG', 'EXGG', 'G1', 'G2', 'G3'].includes(s.label)) {
                s.priceMod = getVal(state.config.sizeModPrice, 10.00);
            }
        });
    });

    // Filtra cores disponíveis
    const disabled = (state.config.partColors && state.config.partColors['main']) ? state.config.partColors['main'] : [];
    state.availableColors = CONFIG.colors.filter(c => !disabled.includes(c.id));
    if (state.availableColors.length === 0) state.availableColors = CONFIG.colors;

    // Inicializa textos com fonte padrão (SOMENTE se não existirem)
    const defaultFontFamily = getDefaultFont();

    CONFIG.textZones.forEach(z => {
        if (!state.texts[z.id]) {
            state.texts[z.id] = {
                enabled: false,
                content: "",
                fontFamily: defaultFontFamily,
                color: "#000000",
                scale: 1.0,
                maxLines: 1
            };
        } else {
            // Garante que propriedades básicas existem mesmo em objetos parciais carregados
            if (state.texts[z.id].enabled === undefined) state.texts[z.id].enabled = false;
            if (state.texts[z.id].content === undefined) state.texts[z.id].content = "";
            if (!state.texts[z.id].fontFamily) state.texts[z.id].fontFamily = defaultFontFamily;
            if (!state.texts[z.id].color) state.texts[z.id].color = "#000000";
            if (state.texts[z.id].scale === undefined) state.texts[z.id].scale = 1.0;
        }
    });

    updateCartCount();
}

/**
 * Obtém a fonte padrão baseada nas preferências
 */
function getDefaultFont() {
    const preferredIds = JSON.parse(localStorage.getItem('hnt_preferred_fonts') || '[]');
    if (preferredIds.length > 0) return preferredIds[0];

    let allFonts = [];
    if (typeof SHARED_FONTS !== 'undefined') allFonts = [...SHARED_FONTS];
    const customFontsData = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    customFontsData.forEach(font => {
        if (!allFonts.find(f => f.id === font.id)) allFonts.push(font);
    });

    if (state.config.activeFonts && state.config.activeFonts.length > 0) {
        allFonts = allFonts.filter(f => state.config.activeFonts.includes(f.id));
    }

    if (allFonts.length > 0) {
        allFonts.sort((a, b) => a.name.localeCompare(b.name));
        return allFonts[0].id;
    }
    return 'Outfit';
}

/**
 * Obtém os limites de uma zona para clipping de arrasto
 */
function getZoneBoundaries(element) {
    let zone = null;
    let parentZoneId = null;

    // Verifica se é uma IMAGEM
    for (const zoneId in state.elements) {
        if (state.elements[zoneId].includes(element)) {
            zone = CONFIG.zones[zoneId];
            parentZoneId = zoneId;
            break;
        }
    }

    // Verifica se é um TEXTO
    if (!zone) {
        const textZoneId = element.dataset.zone;
        const textZone = CONFIG.textZones.find(tz => tz.id === textZoneId);
        if (textZone) {
            zone = CONFIG.zones[textZone.parentZone];
            parentZoneId = textZone.parentZone;
        }
    }

    if (!zone) return null;

    const viewport = document.querySelector('.simulator-viewport');
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const boundaries = {
        left: (zone.x - zone.width / 2) * vw / 100,
        top: (zone.y - zone.height / 2) * vh / 100,
        right: (zone.x + zone.width / 2) * vw / 100,
        bottom: (zone.y + zone.height / 2) * vh / 100,
        width: zone.width * vw / 100,
        height: zone.height * vh / 100,
        parentZoneId: parentZoneId
    };

    // 🎯 EXPANSÃO CONTROLADA (Replicada do Top/Shorts)
    const containerW = boundaries.width;
    const containerH = boundaries.height;

    // Obter Scale do elemento
    const transform = element.style.transform || '';
    const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

    const elWidth = element.offsetWidth * scale;
    const elHeight = element.offsetHeight * scale;

    // Se a imagem for maior que a zona (com margem de erro)
    const isZooming = (elWidth > containerW + 1) || (elHeight > containerH + 1);
    const expansionFactor = isZooming ? 1.60 : 1.0;

    // Expandir Boundaries
    const centerX = (boundaries.left + boundaries.right) / 2;
    const centerY = (boundaries.top + boundaries.bottom) / 2;

    const newHalfW = (containerW * expansionFactor) / 2;
    const newHalfH = (containerH * expansionFactor) / 2;

    boundaries.left = centerX - newHalfW;
    boundaries.right = centerX + newHalfW;
    boundaries.top = centerY - newHalfH;
    boundaries.bottom = centerY + newHalfH;

    // Converter para minX/maxX PERCENTUAIS para compatibilidade com interactions.js
    return {
        minX: (boundaries.left / vw) * 100,
        maxX: (boundaries.right / vw) * 100,
        minY: (boundaries.top / vh) * 100,
        maxY: (boundaries.bottom / vh) * 100,
        parentZoneId: parentZoneId
    };
}

/**
 * Atualiza contador do carrinho
 */
function updateCartCount() {
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    const count = history.length;
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.innerText = count;
        b.style.display = count > 0 ? 'flex' : 'none';
    });
}

/**
 * Salva o pedido atual no histórico (Carrinho)
 */
function saveOrderToHistory(silent = false, pdfUrl = null) {
    // 1. Validação via Adapter
    const validation = DBAdapter.validateOrder(state);
    if (!validation.valid) {
        if (!silent) {
            alert('⚠️ ' + validation.errors.join('\n'));
            if (validation.errors.some(e => e.includes('Telefone'))) document.getElementById('phone-input')?.focus();
        }
        return false;
    }

    // 2. Formatação via Adapter
    const pricing = calculateFullPrice();
    const newRow = DBAdapter.formatForDatabase(state, pricing, CONFIG, pdfUrl);

    // 3. Persistência
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');

    // --- SEQUENCING LOGIC (New) ---
    let sigla = 'SL';
    if (newRow.order_id && newRow.order_id.includes('-SL-')) sigla = 'SL';

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
    newRow.order_id = `${newRow.order_id}-${sequenceSuffix}`;
    // -----------------------------

    // CRITICAL: Limpeza preventiva antes de adicionar
    if (history.length > 20) {
        console.warn(`🧹 Limpeza preventiva: ${history.length} registros`);
        const sorted = history.sort((a, b) => {
            const dateA = new Date(a.DATA_ATUALIZACAO || a.DATA_CRIACAO || 0);
            const dateB = new Date(b.DATA_ATUALIZACAO || b.DATA_CRIACAO || 0);
            return dateB - dateA;
        });
        history.splice(0, history.length, ...sorted.slice(0, 20));
        console.log(`✅ Mantidos ${history.length} pedidos`);
    }

    // Verificação de Edição: Sobrescrever em vez de adicionar
    if (state._editingIndex !== undefined && state._editingIndex !== null) {
        console.log(`✏️ Atualizando item existente no índice: ${state._editingIndex}`);

        if (state._editingOrderId) {
            newRow.order_id = state._editingOrderId;
            newRow.ID_SIMULACAO = state._editingOrderId;
            newRow.ID_PEDIDO = state._editingOrderId;
        }

        history[state._editingIndex] = newRow;

        delete state._editingIndex;
        delete state._editingOrderId;
    } else {
        history.push(newRow); // O Adapter já retorna o objeto no formato final
    }

    try {
        localStorage.setItem('hnt_all_orders_db', JSON.stringify(history));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error('❌ Quota excedida mesmo após limpeza! Removendo mais registros...');
            const minimal = history.slice(-10); // Apenas os 10 mais recentes
            localStorage.setItem('hnt_all_orders_db', JSON.stringify(minimal));
        } else {
            throw e;
        }
    }

    // 4. Banco de Dados Linear (Excel)
    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.addOrder(newRow);
    }

    return true;
}

/**
 * Reseta os dados do simulador para o estado inicial (Limpeza)
 */
function resetSimulatorData() {
    console.log("🧹 Resetando dados do simulador...");

    // 1. Limpar Arrays e Objetos do Estado
    state.sizes = {};
    state.observations = "";

    // 2. Limpar Textos
    CONFIG.textZones.forEach(z => {
        state.texts[z.id] = {
            enabled: false,
            content: "",
            fontFamily: getDefaultFont(),
            color: "#000000",
            scale: 1.0,
            maxLines: 1
        };
    });

    // 3. Limpar Uploads/Imagens
    const zones = Object.keys(state.elements);
    zones.forEach(zoneId => {
        // Remover elementos DOM
        if (state.elements[zoneId]) {
            state.elements[zoneId].forEach(el => el.remove());
            state.elements[zoneId] = [];
        }

        // Limpar dados de upload
        if (state.uploads && state.uploads[zoneId]) {
            state.uploads[zoneId] = {
                src: null,
                filename: null,
                unlocked: state.uploads[zoneId].unlocked // Mantém estado de desbloqueio
            };
        }
    });

    // 4. Gerar novos IDs para a próxima simulação
    state.simNumber = generateUUID();
    state.simulationId = getFormattedId();

    // 5. Persistir estado limpo
    saveState();

    // 6. Sincronizar UI
    if (typeof renderControls === 'function') renderControls();
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updatePrice === 'function') {
        const pricing = calculateFullPrice();
        updatePrice(pricing);
    }
    if (typeof updateCartCount === 'function') updateCartCount();

    console.log("✅ Simulador resetado com sucesso.");
}

// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_shorts_legging_config' || e.key === 'hnt_shorts_legging_part_colors') {
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
    console.log('Initializing Data Cache (Shorts-Legging)...');
    const source = (typeof CONFIG !== 'undefined') ? CONFIG : null;
    if (!source) return;

    if (source.textZones) {
        window.dataCache.textZonesById.clear();
        source.textZones.forEach(z => window.dataCache.textZonesById.set(z.id, z));
    }
    // Shorts-Legging likely uses CONFIG.zones (Object) or generic structure
    if (source.zones) {
        window.dataCache.uploadZonesById.clear();
        // If zones is Object, use values
        const zonesIter = Array.isArray(source.zones) ? source.zones : Object.values(source.zones);
        zonesIter.forEach(z => window.dataCache.uploadZonesById.set(z.id, z));
    }
}

/**
 * RESTORATION SYSTEM
 * Checks for a restoration buffer from Admin Panel and hydrating state
 */
window.checkForRestoration = function () {
    console.log("♻️ Checking for restoration buffer (Shorts-Legging)...");
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

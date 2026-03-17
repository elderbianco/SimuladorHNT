/**
 * Módulo de Lógica de Negócio - Legging
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
    return window.OrderNumbers ? window.OrderNumbers.peekNextOrderNumber() : "000000";
}

/**
 * Gera o nome de arquivo formatado para produção
 * Padrão: [ID_PEDIDO]-[ID_SIMULACAO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    // 1. Sigla Produto
    const productSigla = 'LG'; // Legging

    // 2. Garantir IDs
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = generateNextOrderNumber();
    }

    // 3. Composite ID (XXXXXX-LG-XXXXXX)
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;

    let compositeId = `${cleanOrderId}-${cleanSimId}`;

    // 4. Sigla Local (Mapeamento)
    const zoneMap = {
        'lateral_direita': 'LAT_DIR',
        'lateral_esquerda': 'LAT_ESQ',
        'perna_esquerda': 'PERNA_ESQ'
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
 * Determina automaticamente a cor do logo HNT com base na cor de fundo
 * Padrão: [branco/preto]
 */
function getAutoHntLogoColor(baseColor) {
    const darkColors = ['preto', 'vermelho', 'roxo', 'marsala', 'azulescuro', 'verdebandeira', 'verdemusgo', 'chumbo', 'azul_marinho'];
    return darkColors.includes(baseColor) ? 'branco' : 'preto';
}

/**
 * Busca configurações do servidor (fallback para modo anônimo)
 */
async function fetchConfigFromServer() {
    try {
        console.log("☁️ Buscando configurações do servidor...");
        const res = await fetch('/api/admin/config');

        if (!res.ok) {
            console.warn(`⚠️ Servidor retornou ${res.status} para /api/admin/config`);
            return false;
        }

        const serverConfig = await res.json();
        if (serverConfig && Object.keys(serverConfig).length > 0) {
            console.log("☁️ Configuração recebida do servidor:", serverConfig);
            localStorage.setItem('hnt_pricing_config', JSON.stringify(serverConfig));
            loadAdminConfig(); // Reload configs

            // Update UI if functions are available
            if (typeof renderControls === 'function') renderControls();
            if (typeof updatePrice === 'function') updatePrice();

            return true;
        }
    } catch (e) {
        console.warn("⚠️ Falha ao buscar config do servidor (usando local):", e);
    }
    return false;
}

/**
 * Carrega configurações do administrador
 */
function loadAdminConfig() {
    const prices = JSON.parse(localStorage.getItem('hnt_legging_config') || '{}');
    const globalConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    // 1. Resolve Base Price (Legging Specific > Default)
    // Force fallback if 0 — valores alinhados com resetLeggingToTable (Jan/2026)
    const base = (getVal(prices.basePrice, 139.90) || 139.90);

    // 2. Resolve Wholesale Prices
    const p10 = getVal(prices.price10, 125.90);
    const p20 = getVal(prices.price20, 111.90);
    const p30 = getVal(prices.price30, 97.90);

    // 3. Calculate Discounts Dynamically
    let d20 = 0;
    let d40 = 0;

    if (p10 > 0 && p10 < base) {
        d20 = ((base - p10) / base) * 100;
    }
    if (p20 > 0 && p20 < base) {
        d40 = ((base - p20) / base) * 100;
    }

    state.config = {
        basePrice: base,
        product: 'Legging',
        sizeModPrice: getVal(prices.sizeModPrice, 0), // Admin padrão = 0
        devFee: getVal(prices.devFee, 0),
        // ✅ CORRIGIDO: Ler preços de zonas do config da Legging (hnt_legging_config), NÃO do Fight Shorts
        logoLatPrice: getVal(prices.logoLatPrice, 29.90),
        textLatPrice: getVal(prices.textLatPrice, 9.90),
        logoLegPrice: getVal(prices.logoLegPrice, 14.90),
        textLegPrice: getVal(prices.textLegPrice, 0),
        // Wholesale Tiers
        price10: p10,
        price20: p20,
        price30: p30,
        // Legacy
        discount20: d20,
        discount40: d40,
        artWaiver: prices.artWaiver !== undefined ? prices.artWaiver : (globalConfig.artWaiver !== undefined ? globalConfig.artWaiver : (CONFIG.artWaiver !== undefined ? CONFIG.artWaiver : true)),
        partColors: JSON.parse(localStorage.getItem('hnt_legging_part_colors') || '{}'),
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
                s.priceMod = state.config.sizeModPrice;
            }
        });
    });

    // Filtra cores disponíveis
    const disabled = state.config.partColors['main'] || [];
    state.availableColors = CONFIG.colors.filter(c => !disabled.includes(c.id));
    if (state.availableColors.length === 0) state.availableColors = CONFIG.colors;

    // Inicializa textos com fonte padrão (lazy init if needed)
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

    // Check if it's an IMAGE (in state.elements)
    for (const zoneId in state.elements) {
        if (state.elements[zoneId].includes(element)) {
            zone = CONFIG.zones[zoneId];
            parentZoneId = zoneId;
            break;
        }
    }

    // Check if it's a TEXT (has data-parent-zone attribute ou data-zone)
    const zoneId = element.dataset.zone || element.dataset.parentZone;
    if (!zone && zoneId) {
        // Se for zone id direto (ex: lateral_direita)
        if (CONFIG.zones[zoneId]) {
            zone = CONFIG.zones[zoneId];
            parentZoneId = zoneId;
        } else {
            // Se for text_...
            const textZone = CONFIG.textZones.find(tz => tz.id === zoneId);
            if (textZone) {
                zone = CONFIG.zones[textZone.parentZone];
                parentZoneId = textZone.parentZone;
            }
        }
    }

    if (!zone) return null;

    const wrapper = document.querySelector('.simulator-wrapper');
    const transform = element.style.transform || '';
    const scaleMatch = transform.match(/scale\(([0-9.]+)\)/);
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

    let elementWidth = 0;
    let elementHeightPercent = 0;

    if (wrapper) {
        const wrapperWidth = wrapper.offsetWidth;
        const wrapperHeight = wrapper.offsetHeight;
        const widthPx = element.offsetWidth * scale;
        elementWidth = (widthPx / wrapperWidth) * 100;
        const heightPx = element.offsetHeight * scale;
        elementHeightPercent = (heightPx / wrapperHeight) * 100;
    } else {
        elementWidth = (parseFloat(element.style.width) || zone.width) * scale;
    }

    const halfElementWidth = elementWidth / 2;
    const halfElementHeight = elementHeightPercent / 2;
    const zoneHeight = zone.height || (zone.width * 1.5);
    const halfZoneWidth = zone.width / 2;
    const halfZoneHeight = zoneHeight / 2;

    // 🎯 EXPANSÃO CONTROLADA (Replicada do Top/Shorts/Legging)
    const containerW = zone.width * (wrapper ? (wrapper.offsetWidth / 100) : 1); // convert % back to px if needed? Or just work in %?
    // Wait, getZoneBoundaries here returns mixed PX/Compatible object.
    // The original code calculated minX/maxX in PERCENTAGES directly?
    // Let's re-read the original calculation:
    // elementWidth = (widthPx / wrapperWidth) * 100; (Percentage)
    // minX = zone.x - halfZoneWidth + halfElementWidth; (Percentage)

    // So logic.js in Legging works in PERCENTAGES!
    // Unlike Shorts-Legging which worked in PIXELS (before my fix).
    // Legging logic is cleaner.

    // Expansion Logic:
    const isZooming = (elementWidth > zone.width + 0.1) || (elementHeightPercent > (zone.height || zone.width * 1.5) + 0.1);
    const expansionFactor = isZooming ? 1.60 : 1.0;

    const expandedZoneW = zone.width * expansionFactor;
    const expandedZoneH = (zone.height || (zone.width * 1.5)) * expansionFactor;

    const halfExpandedZoneW = expandedZoneW / 2;
    const halfExpandedZoneH = expandedZoneH / 2;

    minX = zone.x - halfExpandedZoneW + halfElementWidth;
    maxX = zone.x + halfExpandedZoneW - halfElementWidth;
    minY = zone.y - halfExpandedZoneH + halfElementHeight;
    maxY = zone.y + halfExpandedZoneH - halfElementHeight;

    if (minX > maxX) {
        if (isZooming) { const temp = minX; minX = maxX; maxX = temp; }
        else { minX = zone.x; maxX = zone.x; }
    }
    if (minY > maxY) {
        if (isZooming) { const temp = minY; minY = maxY; maxY = temp; }
        else { minY = zone.y; maxY = zone.y; }
    }

    return { minX, maxX, minY, maxY, parentZoneId };
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
async function saveOrderToHistory(silent = false, pdfUrlOverride = null) {
    // 1. Validação via Adapter
    const validation = DBAdapter.validateOrder(state);
    if (!validation.valid) {
        if (!silent) {
            alert('⚠️ ' + validation.errors.join('\n'));
            if (validation.errors.some(e => e.includes('Telefone'))) document.getElementById('phone-input')?.focus();
        }
        return false;
    }

    // 2. Cálculo do ID Final (Sequencial) - Necessário ANTES do PDF
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    let sigla = 'LG';
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
        console.log('🚀 Iniciando sincronização em segundo plano com Supabase (Legging)...');
        SupabaseAdapter.savePedido(newRow, state)
            .then(() => console.log('✅ Sincronizado com Supabase.'))
            .catch(err => console.error('⚠️ Falha na sincronização Supabase (Item salvo localmente):', err));
    }

    // 6. Banco de Dados Linear (Excel)
    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.addOrder(newRow);
    }

    return true;
}


// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_legging_config' || e.key === 'hnt_legging_part_colors') {
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
    console.log('Initializing Data Cache (Legging)...');
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
    console.log("♻️ Checking for restoration buffer (Legging)...");
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

        // Force re-render visuals (Legging logic should be similar to Top)
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
 * Reseta os dados do simulador para o estado inicial (Limpeza)
 */
function resetSimulatorData() {
    console.log("🧹 Resetando dados do simulador (Legging)...");

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
    state.simulationId = `HNT-LG-${state.simNumber}`;
    // state.orderNumber = state.orderNumber; // MANTÉM o número do pedido atual
    if (!state.orderNumber) state.orderNumber = generateNextOrderNumber();

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

    console.log("✅ Simulador Legging resetado com sucesso.");
}

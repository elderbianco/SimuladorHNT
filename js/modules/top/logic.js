/**
 * Módulo de Lógica - Top
 */

function getAutoHntBarraColor(baseColor) {
    const darks = ['preto', 'vermelho', 'roxo', 'marsala', 'azulescuro', 'verdebandeira', 'verdemusgo', 'chumbo', 'azul_marinho'];
    return darks.includes(baseColor) ? 'branco' : 'preto';
}

function checkAndToggleHntLogo(zoneId, isEnabled) {
    if (zoneId === 'text_frente') {
        if (isEnabled && state.logoHntFront) {
            state.logoHntFront = false;
            // Force UI update for toggles
            const toggle = document.querySelector('input[onchange*="logoHntFront"]');
            if (toggle) toggle.checked = false;
        }
    } else if (zoneId === 'text_costas') {
        if (isEnabled && state.logoHntBack) {
            state.logoHntBack = false;
            // Force UI update for toggles
            const toggle = document.querySelector('input[onchange*="logoHntBack"]');
            if (toggle) toggle.checked = false;
        }
    }

    if (typeof updateHntBarraLayer === 'function') updateHntBarraLayer();
    if (typeof updatePrice === 'function') updatePrice();
    if (typeof saveState === 'function') saveState();
}

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
 * Padrão: [ID_PEDIDO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    // 1. Sigla Produto
    const productSigla = 'TP'; // Top

    // 2. Garantir IDs
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = generateNextOrderNumber();
    }

    // 3. Composite ID (XXXXXX-TP-XXXXXX)
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;

    let compositeId = `${cleanOrderId}-${cleanSimId}`;

    // 2. Sigla Local (Mapeamento)
    const zoneMap = {
        'frente_centro': 'FRENTE',
        'costas_centro': 'COSTAS'
    };
    const zoneSigla = zoneMap[zoneId] || zoneId.toUpperCase();

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
    const prices = JSON.parse(localStorage.getItem('hnt_top_config') || '{}');
    const globalConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');
    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    // 1. Resolve Base Price (Top Specific > Default) — alinhado com resetTopToTable (Jan/2026)
    const base = getVal(prices.basePrice, 89.90);

    // 2. Resolve Wholesale Prices (Top Specific)
    const p10 = getVal(prices.price10, 80.90);
    const p20 = getVal(prices.price20, 71.90);
    const p30 = getVal(prices.price30, 62.90);

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
        basePrice: (getVal(prices.basePrice, 89.90) || 89.90), // Force fallback if 0 — admin Jan/2026
        product: 'Top',
        sizeModPrice: getVal(prices.sizeModPrice, 0), // Admin padrão = 0
        devFee: getVal(prices.devFee, 0), // Admin padrão = 0
        logoFrontPrice: getVal(prices.logoFrontPrice, 14.90),
        logoBackPrice: getVal(prices.logoBackPrice, 0),
        textFrontPrice: getVal(prices.textFrontPrice, 9.90),
        textBackPrice: getVal(prices.textBackPrice, 0),

        // HNT Logos
        logoHntFrontPrice: getVal(prices.logoHntFrontPrice, 0),
        logoHntBackPrice: getVal(prices.logoHntBackPrice, 0),

        // Wholesale Tiers
        price10: p10,
        price20: p20,
        price30: p30,
        // Legacy Fallbacks for UI compatibility
        logoCenterPrice: getVal(prices.logoFrontPrice, 14.90),
        textPrice: getVal(prices.textFrontPrice, 9.90),
        discount20: d20,
        discount40: d40,
        artWaiver: prices.artWaiver !== undefined ? prices.artWaiver : (globalConfig.artWaiver !== undefined ? globalConfig.artWaiver : (CONFIG.artWaiver !== undefined ? CONFIG.artWaiver : true)),
        partColors: JSON.parse(localStorage.getItem('hnt_top_part_colors') || '{}'),
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

    const defaultFontFamily = getDefaultFont();
    CONFIG.textZones.forEach(z => {
        if (!state.texts[z.id]) {
            state.texts[z.id] = {
                enabled: false, content: "", fontFamily: defaultFontFamily,
                color: "#000000", scale: 1.0, maxLines: 1
            };
        }
    });
    updateCartCount();
}

/**
 * Busca configurações globais e específicas do Supabase (Background)
 */
async function fetchConfigFromServer() {
    if (typeof SupabaseAdapter === 'undefined') return false;

    try {
        console.log("☁️ Buscando configurações do Supabase (Top)...");

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 2000));

        const configPromise = SupabaseAdapter.getAdminConfigs([
            'hnt_pricing_config',
            'hnt_top_config',
            'production_days'
        ]);

        const configs = await Promise.race([configPromise, timeoutPromise]);

        if (configs && Object.keys(configs).length > 0) {
            console.log("☁️ Configurações (Top) recebidas:", configs);

            if (configs.hnt_pricing_config) {
                localStorage.setItem('hnt_pricing_config', JSON.stringify(configs.hnt_pricing_config));
            }
            if (configs.hnt_top_config) {
                localStorage.setItem('hnt_top_config', JSON.stringify(configs.hnt_top_config));
            }
            if (configs.production_days) {
                localStorage.setItem('hnt_production_config', JSON.stringify(configs.production_days));
            }

            loadAdminConfig();
            if (typeof renderControls === 'function') renderControls();
            if (typeof updatePrice === 'function') updatePrice();

            return true;
        }
    } catch (e) {
        console.warn("⚠️ Usando cache local (falha ou timeout no servidor Top):", e.message);
    }
    return false;
}

// Auto-Sync with Admin Panel (INSTANT UPDATE)
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_top_config' || e.key === 'hnt_top_part_colors') {
        console.log('🔄 Sincronizando configurações com Admin (Top)...');
        loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
    }
});

function getDefaultFont() {
    const preferredIds = JSON.parse(localStorage.getItem('hnt_preferred_fonts') || '[]');
    if (preferredIds.length > 0) return preferredIds[0];
    let allFonts = [];
    if (typeof SHARED_FONTS !== 'undefined') allFonts = [...SHARED_FONTS];
    if (allFonts.length > 0) return allFonts[0].id;
    return 'Outfit';
}

function getZoneBoundaries(element) {
    let zone = null;
    let parentZoneId = null;

    for (const zid in state.elements) {
        if (state.elements[zid].includes(element)) {
            zone = CONFIG.zones[zid];
            parentZoneId = zid;
            break;
        }
    }

    const zidAttr = element.dataset.zone || element.dataset.parentZone;
    if (!zone && zidAttr) {
        if (CONFIG.zones[zidAttr]) { zone = CONFIG.zones[zidAttr]; parentZoneId = zidAttr; }
        else {
            const tz = CONFIG.textZones.find(t => t.id === zidAttr);
            if (tz) { zone = CONFIG.zones[tz.parentZone]; parentZoneId = tz.parentZone; }
        }
    }

    if (!zone) return null;

    const wrapper = document.querySelector('.simulator-wrapper');
    const zoom = currentZoom || 1;
    const scale = parseFloat(element.style.transform.match(/scale\(([0-9.]+)\)/)?.[1] || 1.0);

    let elWPct = (element.offsetWidth * scale / wrapper.offsetWidth) * 100;
    let elHPct = (element.offsetHeight * scale / wrapper.offsetHeight) * 100;

    const halfW = elWPct / 2;
    const halfH = elHPct / 2;
    const zH = zone.height || (zone.width * 1.5);

    // 🎯 LIBERDADE DE MOVIMENTO: Se estiver com zoom (>1.0), aumentar drasticamente o limite para não "prender"
    const isZooming = (scale > 1.05); // Pequena margem para evitar ruído
    const expansionFactor = isZooming ? 5.0 : 1.1; // 5x a zona se estiver com zoom

    // Atualizar limites com fator de expansão
    const expandedWidth = zone.width * expansionFactor;
    const expandedHeight = zH * expansionFactor;

    let minX = zone.x - (expandedWidth / 2) + halfW;
    let maxX = zone.x + (expandedWidth / 2) - halfW;
    let minY = zone.y - (expandedHeight / 2) + halfH;
    let maxY = zone.y + (expandedHeight / 2) - halfH;

    // 🎯 PREVENÇÃO DE SALTOS: Se o elemento for maior que a zona expandida, 
    // invertemos os limites de forma contínua para permitir movimento sem travas.
    if (minX > maxX) {
        const center = zone.x;
        const radius = Math.abs((expandedWidth / 2) - halfW);
        minX = center - radius;
        maxX = center + radius;
    }
    if (minY > maxY) {
        const center = zone.y;
        const radius = Math.abs((expandedHeight / 2) - halfH);
        minY = center - radius;
        maxY = center + radius;
    }

    return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY,
        parentZoneId
    };
}

function updateCartCount() {
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.innerText = history.length;
        b.style.display = history.length > 0 ? 'flex' : 'none';
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
    let sigla = 'TP'; // Default for Top
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
        console.log('🚀 Iniciando sincronização em segundo plano com Supabase (Top)...');
        SupabaseAdapter.savePedido(newRow, state)
            .then(() => console.log('✅ Sincronizado com Supabase.'))
            .catch(err => console.error('⚠️ Falha na sincronização Supabase (Item salvo localmente):', err));
    }

    // --- RASCUNHO MANAGER: Salva dados completos no Supabase (NON-BLOCKING) ---
    if (typeof RascunhoManager !== 'undefined') {
        const pricingFull = calculateFullPrice();
        const stateParaSalvar = { ...state, simulationId: finalId, orderNumber: currentOrderNum };
        RascunhoManager.salvar(stateParaSalvar, pricingFull, CONFIG, pdfUrl)
            .then(res => {
                if (res.success) console.log('✅ Rascunho (Top) salvo no Supabase:', res.rascunho_id);
                else console.warn('⚠️ Rascunho (Top) não salvo no Supabase:', res.error);
            })
            .catch(err => console.error('⚠️ RascunhoManager.salvar() erro (Top):', err));
    }

    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.addOrder(newRow);
    }

    return true;
}

// --- CACHE SYSTEM ---
window.dataCache = {
    textZonesById: new Map(),
    uploadZonesById: new Map()
};

function initDataCache() {
    console.log('Initializing Data Cache (Top)...');
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
    console.log("♻️ Checking for restoration buffer (Top)...");
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
 * Handler para Upload de Imagem (Fixing missing link)
 */
function handleImageUpload(e, zoneId) {
    const file = (e.target && e.target.files) ? e.target.files[0] : (e.files ? e.files[0] : e);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        if (typeof addImage === 'function') {
            addImage(zoneId, base64, file.name, true);
        }

        // --- SUPABASE SYNC ---
        await uploadFileToServer(file, base64, zoneId);
        // ---------------------

        // Ativa limites visuais automaticamente
        state.zoneLimits[zoneId] = true;
        if (typeof updateLimits === 'function') updateLimits();
    };
    reader.readAsDataURL(file);
}

/**
 * Envia o arquivo para o servidor via Supabase
 */
async function uploadFileToServer(file, base64, zoneId) {
    if (typeof SupabaseAdapter === 'undefined') return;

    try {
        const fileName = (typeof generateFormattedFilename === 'function') ? generateFormattedFilename(zoneId, file.name, 'EXT') : file.name;
        const publicUrl = await SupabaseAdapter.uploadFile('client_uploads', fileName, base64, file.type);

        if (publicUrl) {
            console.log('✅ Upload para Supabase (Top) concluído:', publicUrl);
            if (!state.uploads) state.uploads = {};
            if (!state.uploads[zoneId]) state.uploads[zoneId] = {};
            state.uploads[zoneId].supabaseUrl = publicUrl;
            state.uploads[zoneId].src = publicUrl;
            state.uploads[zoneId].filename = fileName;
        }
    } catch (e) {
        console.error('❌ Erro no upload para Supabase (Top):', e);
    }
}

/**
 * Reseta os dados do simulador para o estado inicial (Limpeza)
 */
function resetSimulatorData() {
    console.log("🧹 Resetando dados do simulador (Top)...");

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

    // 3. Limpar Elementos Dinâmicos (Top usa Elements array)
    Object.keys(state.elements).forEach(zoneId => {
        if (state.elements[zoneId]) {
            state.elements[zoneId].forEach(el => el.remove());
            state.elements[zoneId] = [];
        }
    });

    // 4. Gerar novos IDs
    state.simNumber = generateNextSequenceNumber();
    state.simulationId = `HNT-TP-${state.simNumber}`;
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

    console.log("✅ Simulador Top resetado com sucesso.");
}

/**
 * Adiciona uma imagem a uma zona específica
 */
function addImage(zoneId, src, filename = "Imagem Enviada", isCustom = true) {
    const zone = CONFIG.zones[zoneId];
    if (!zone) return;

    // Remove elementos anteriores da zona
    removeZoneElements(zoneId);

    const formattedName = (typeof generateFormattedFilename === 'function')
        ? generateFormattedFilename(zoneId, filename, isCustom ? 'EXT' : 'ACERVO')
        : filename;

    // Sync to uploads state
    if (!state.uploads) state.uploads = {};
    state.uploads[zoneId] = {
        src: src,
        filename: filename,
        isCustom: isCustom,
        scale: (state.uploads[zoneId] && state.uploads[zoneId].scale) ? state.uploads[zoneId].scale : 1.0
    };

    createImageElement(zoneId, src, isCustom, filename, formattedName);
}

/**
 * Cria o elemento DOM da imagem e registra no estado
 */
function createImageElement(zoneId, src, isCustom, filename = '', formattedFilename = '') {
    const wrapper = document.querySelector('.simulator-wrapper');
    const zone = CONFIG.zones[zoneId];
    if (!wrapper || !zone) return;

    const div = document.createElement('div');
    div.className = 'custom-element draggable';
    div.style.position = 'absolute';
    div.style.left = zone.x + '%';
    div.style.top = zone.y + '%';
    div.style.width = zone.width + '%';

    // Get current scale from state if it exists
    const currentScale = (state.uploads && state.uploads[zoneId] && state.uploads[zoneId].scale) ? state.uploads[zoneId].scale : 1.0;

    div.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
    div.dataset.scale = currentScale;
    div.style.zIndex = '1500';
    div.dataset.type = 'image';
    div.dataset.zone = zoneId;
    div.dataset.isCustom = isCustom;
    div.dataset.filename = filename || (isCustom ? 'upload_usuario' : 'imagem_acervo');
    if (formattedFilename) div.dataset.formattedFilename = formattedFilename;

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.display = 'block';

    div.appendChild(img);
    wrapper.appendChild(div);

    if (!state.elements[zoneId]) state.elements[zoneId] = [];
    state.elements[zoneId].push(div);

    // Ativa limites visuais automaticamente
    state.zoneLimits[zoneId] = true;
    if (typeof updateLimits === 'function') updateLimits();

    if (typeof updatePrice === 'function') updatePrice();
    if (typeof renderControls === 'function') renderControls();
    saveState();
}

/**
 * Remove todos os elementos de uma zona
 */
function removeZoneElements(zoneId) {
    if (state.elements[zoneId]) {
        state.elements[zoneId].forEach(el => el.remove());
        state.elements[zoneId] = [];
    }

    if (checkZoneEmpty(zoneId)) {
        state.zoneLimits[zoneId] = false;
        if (typeof updateLimits === 'function') updateLimits();
    }

    if (typeof updatePrice === 'function') updatePrice();
    if (typeof renderControls === 'function') renderControls();
    saveState();
}

/**
 * Verifica se uma zona está vazia
 */
function checkZoneEmpty(zoneId) {
    const hasImage = state.elements[zoneId] && state.elements[zoneId].length > 0;
    const textZone = CONFIG.textZones.find(tz => tz.parentZone === zoneId);
    const hasText = textZone && state.texts[textZone.id] && state.texts[textZone.id].enabled;
    return !hasImage && !hasText;
}

/**
 * Bridge for Gallery: Adds an image from a URL/Base64 string to a zone
 * @param {string} zoneId - The target upload zone ID
 * @param {string} src - The image source (URL or Base64)
 */
function addImageToZone(zoneId, src) {
    addImage(zoneId, src, "Imagem do Acervo", false);
}

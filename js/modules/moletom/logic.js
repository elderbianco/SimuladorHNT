/**
 * Módulo de Lógica - Moletom
 */

function generateNextSequenceNumber() {
    let last = parseInt(localStorage.getItem('hnt_sequence_id') || '66849');
    let next = last + 1;
    localStorage.setItem('hnt_sequence_id', next);
    return String(next).padStart(6, '0');
}

function generateNextOrderNumber() {
    return window.OrderNumbers ? window.OrderNumbers.peekNextOrderNumber() : "000000";
}

function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    const productSigla = 'ML';
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = generateNextOrderNumber();
    }
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;
    let compositeId = `${cleanOrderId}-${cleanSimId}`;
    const zoneMap = { 'frente_centro': 'FRENTE', 'costas_centro': 'COSTAS' };
    const zoneSigla = zoneMap[zoneId] || zoneId.toUpperCase();
    const sourceTag = source === 'ACERVO' ? 'ACERVO' : 'EXT';
    const ext = originalName.split('.').pop().toLowerCase();
    const typeTag = ['emb', 'dst', 'pes', 'exp'].includes(ext) ? 'EMB' : 'IMG';
    const sanitized = originalName.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, "");
    return `${compositeId}_${productSigla}_${zoneSigla}_${sourceTag}_${typeTag}_${sanitized}`;
}

function loadAdminConfig() {
    let prices = JSON.parse(localStorage.getItem('hnt_moletom_config') || '{}');
    const globalConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    if (!prices.basePrice || prices.basePrice === 0) {
        prices = {
            basePrice: 189.90,
            sizeModPrice: 0,
            devFee: 0,
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
    }

    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    state.config = {
        basePrice: (getVal(prices.basePrice, 189.90) || 189.90),
        product: 'Moletom',
        sizeModPrice: getVal(prices.sizeModPrice, 0),
        devFee: getVal(prices.devFee, 0),
        logoFrontPrice: getVal(prices.logoFrontPrice, 29.90),
        textFrontPrice: getVal(prices.textFrontPrice, 19.90),
        logoBackPrice: getVal(prices.logoBackPrice, 29.90),
        textBackPrice: getVal(prices.textBackPrice, 19.90),
        logoSleevePrice: getVal(prices.logoSleevePrice, 14.90),
        textSleevePrice: getVal(prices.textSleevePrice, 9.90),
        logoHoodPrice: getVal(prices.logoHoodPrice, 14.90),
        textHoodPrice: getVal(prices.textHoodPrice, 9.90),
        zipperUpgrade: getAdminVal(prices.zipperUpgrade),
        pocketUpgrade: getAdminVal(prices.pocketUpgrade),
        price10: getVal(prices.price10, 170.90),
        price20: getVal(prices.price20, 151.90),
        price30: getVal(prices.price30, 132.90),
        artWaiver: globalConfig.artWaiver !== undefined ? globalConfig.artWaiver : (prices.artWaiver !== undefined ? prices.artWaiver : true),
        partColors: JSON.parse(localStorage.getItem('hnt_moletom_part_colors') || '{}'),
        activeFonts: JSON.parse(localStorage.getItem('hnt_active_fonts') || '[]'),
        textColors: JSON.parse(localStorage.getItem('hnt_text_colors') || '[]')
    };

    if (typeof CONFIG !== 'undefined' && CONFIG.sizes) {
        CONFIG.sizes.forEach(s => {
            if (['GG', 'EXG', 'EXGG', 'G1', 'G2', 'G3'].includes(s.label)) {
                s.priceMod = state.config.sizeModPrice;
            }
        });
    }

    const partColors = state.config.partColors || {};
    const disabled = partColors['main'] || [];
    state.availableColors = (CONFIG?.colors || []).filter(c => !disabled.includes(c.id));
    if (state.availableColors.length === 0) state.availableColors = (CONFIG?.colors || []);

    const defaultFont = getDefaultFont();
    if (typeof CONFIG !== 'undefined' && CONFIG.textZones) {
        CONFIG.textZones.forEach(z => {
            if (!state.texts[z.id]) {
                state.texts[z.id] = { enabled: false, content: "", fontFamily: defaultFont, color: "#000000", scale: 1.0, maxLines: 1 };
            }
        });
    }
    updateCartCount();
}

async function fetchConfigFromServer() {
    if (typeof SupabaseAdapter === 'undefined') return false;
    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 2000));
        const configPromise = SupabaseAdapter.getAdminConfigs(['hnt_pricing_config', 'hnt_moletom_config', 'production_days']);
        const configs = await Promise.race([configPromise, timeoutPromise]);
        if (configs && Object.keys(configs).length > 0) {
            if (configs.hnt_pricing_config) localStorage.setItem('hnt_pricing_config', JSON.stringify(configs.hnt_pricing_config));
            if (configs.hnt_moletom_config) localStorage.setItem('hnt_moletom_config', JSON.stringify(configs.hnt_moletom_config));
            if (configs.production_days) localStorage.setItem('hnt_production_config', JSON.stringify(configs.production_days));
            loadAdminConfig();
            if (typeof renderControls === 'function') renderControls();
            if (typeof updatePrice === 'function') updatePrice();
            return true;
        }
    } catch (e) { console.warn("⚠️ Usando cache local (falha ou timeout no servidor Moletom):", e.message); }
    return false;
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
    const wrpWidth = wrp ? wrp.offsetWidth : 1;
    const wrpHeight = wrp ? wrp.offsetHeight : 1;
    const expansionFactor = (sc > 1.05) ? 5.0 : 1.1;
    const expandedZoneW = zone.width * expansionFactor;
    const expandedZoneH = zH * expansionFactor;
    const hEW = expandedZoneW / 2;
    const hEH = expandedZoneH / 2;
    let minX = zone.x - hEW + halfW, maxX = zone.x + hEW - halfW;
    let minY = zone.y - hEH + halfH, maxY = zone.y + hEH - halfH;
    if (minX > maxX) { const center = zone.x, radius = Math.abs(hEW - halfW); minX = center - radius; maxX = center + radius; }
    if (minY > maxY) { const center = zone.y, radius = Math.abs(hEH - halfH); minY = center - radius; maxY = center + radius; }
    return { minX, maxX, minY, maxY, parentZoneId: pid };
}

function initDataCache() {
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

window.checkForRestoration = function () {
    try {
        const buffer = localStorage.getItem('hnt_restore_buffer');
        if (!buffer) return false;
        const data = JSON.parse(buffer);
        Object.assign(state, data.state);
        const defaultFont = getDefaultFont();
        CONFIG.textZones.forEach(z => {
            if (!state.texts[z.id]) {
                state.texts[z.id] = { enabled: false, content: "", fontFamily: defaultFont, color: "#000000", scale: 1.0, maxLines: 1 };
            }
        });
        localStorage.removeItem('hnt_restore_buffer');
        if (typeof renderControls === 'function') renderControls();
        if (typeof renderFixedTexts === 'function') renderFixedTexts();
        if (typeof updatePrice === 'function') updatePrice();
        if (typeof updateVisuals === 'function') updateVisuals();
        setTimeout(() => alert(`♻️ Pedido ${data.orderId} restaurado com sucesso!`), 500);
        return true;
    } catch (e) { console.error("❌ Error restoring order:", e); return false; }
};

async function saveOrderToHistory(silent = false, pdfUrlOverride = null) {
    const validation = DBAdapter.validateOrder(state);
    if (!validation.valid) { if (!silent) alert('⚠️ ' + validation.errors.join('\n')); return false; }
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    let sigla = 'ML', typeCount = 0;
    const currentOrderNum = state.orderNumber;
    history.forEach(h => { if (h.DADOS_TECNICOS_JSON) { try { const hState = JSON.parse(h.DADOS_TECNICOS_JSON); if ((hState.orderNumber === currentOrderNum) && h.order_id && h.order_id.includes(`-${sigla}-`)) typeCount++; } catch (e) { } } });
    const sequenceSuffix = String(typeCount + 1).padStart(2, '0');
    let finalId = `${state.simulationId}-${sequenceSuffix}`;
    if (state._editingIndex !== undefined && state._editingIndex !== null) if (state._editingOrderId) finalId = state._editingOrderId;
    let pdfUrl = pdfUrlOverride;
    try { if (!pdfUrl && typeof PDFGenerator !== 'undefined') pdfUrl = await PDFGenerator.generateAndSaveForCart(finalId); } catch (e) { console.error('❌ Error generating PDF:', e); }
    const pricing = calculateFullPrice();
    const newRow = DBAdapter.formatForDatabase(state, pricing, CONFIG, pdfUrl);
    newRow.order_id = finalId;
    if (state._editingIndex !== undefined && state._editingIndex !== null) { history[state._editingIndex] = newRow; delete state._editingIndex; delete state._editingOrderId; }
    else history.push(newRow);
    localStorage.setItem('hnt_all_orders_db', JSON.stringify(history));
    if (typeof SupabaseAdapter !== 'undefined') SupabaseAdapter.savePedido(newRow, state);
    if (typeof RascunhoManager !== 'undefined') RascunhoManager.salvar({ ...state, simulationId: finalId, orderNumber: currentOrderNum }, pricing, CONFIG, pdfUrl);
    if (typeof DatabaseManager !== 'undefined') DatabaseManager.addOrder(newRow);
    return true;
}

function resetSimulatorData() {
    state.sizes = {}; state.observations = "";
    const defaultFont = getDefaultFont();
    CONFIG.textZones.forEach(z => { state.texts[z.id] = { enabled: false, content: "", fontFamily: defaultFont, color: "#000000", scale: 1.0, maxLines: 1 }; });
    Object.keys(state.elements).forEach(zoneId => { if (state.elements[zoneId]) { state.elements[zoneId].forEach(el => el.remove()); state.elements[zoneId] = []; } });
    state.simNumber = generateNextSequenceNumber();
    state.simulationId = `HNT-ML-${state.simNumber}`;
    if (!state.orderNumber) state.orderNumber = generateNextOrderNumber();
    saveState();
    if (typeof renderControls === 'function') renderControls();
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof renderFixedTexts === 'function') renderFixedTexts();
    if (typeof updatePrice === 'function') updatePrice(calculateFullPrice());
    if (typeof updateCartCount === 'function') updateCartCount();
}

function updateCartCount() {
    const count = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]').length;
    document.querySelectorAll('.cart-badge').forEach(b => { b.innerText = count; b.style.display = count > 0 ? 'flex' : 'none'; });
}

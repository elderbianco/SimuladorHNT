/**
 * Módulo de Lógica de Negócio e Processamento - Shorts
 */

/**
 * Carrega a configuração do Administrador do LocalStorage
 */
function loadAdminConfig() {
    const savedConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    const getVal = (val, def) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : def;
    const getAdminVal = (val) => (val !== undefined && val !== null && val !== "") ? parseFloat(val) : undefined;

    // Calculate Dynamic Discounts based on Admin Prices
    const base = (getVal(savedConfig.basePrice, 149.90) || 149.90);
    const p10 = getVal(savedConfig.price10, 0);
    const p20 = getVal(savedConfig.price20, 0);
    const p30 = getVal(savedConfig.price30, 0);

    // Calculate percentages: ((Base - Tier) / Base) * 100
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
        product: 'Shorts Fight',
        sizeModPrice: getVal(savedConfig.sizeModPrice, 0),
        devFee: getVal(savedConfig.devFee, 0),

        // Mapeamento correto dos preços granulares do Admin (com padrões de negócio)
        logoCenterPrice: getVal(savedConfig.logoCenterPrice, 29.90),
        textPrice: getVal(savedConfig.textCenterPrice, 19.90),

        logoLatPrice: getVal(savedConfig.logoLatPrice, 0),
        textLatPrice: getVal(savedConfig.textLatPrice, 9.90),

        legZoneAddonPrice: getVal(savedConfig.legRightMidPrice, 14.90),

        discount20: d20,
        discount40: d40,

        // Wholesale Tiers
        price10: p10,
        price20: p20,
        price30: p30,

        artWaiver: savedConfig.artWaiver !== undefined ? savedConfig.artWaiver : true,
        production: JSON.parse(localStorage.getItem('hnt_production_config') || '{"minDays":15, "maxDays":25, "holidays":[]}'),
        customInfo: JSON.parse(localStorage.getItem('hnt_custom_info') || '[]')
    };

    // Atualizar Preços de Tamanho Dinamicamente (FIX: Adicionado para Shorts Fight)
    // Shorts usa DATA.sizes em pricing.js, então precisamos atualizar ambos
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

    // Preços de Zonas Específicos (para pricing.js)
    state.config.zonePrices = {
        'logo_centro': state.config.logoCenterPrice,
        'logo_lat_dir': state.config.logoLatPrice,
        'logo_lat_esq': state.config.logoLatPrice,
        // Pernas (buscando do admin com fallback)
        'leg_right_mid_ie': getVal(savedConfig.legRightMidPrice, 14.90),
        'leg_right_mid_ii': getVal(savedConfig.legRightMidPrice, 14.90),
        'leg_right_bottom_ie': getVal(savedConfig.legRightBottomPrice, 14.90),
        'leg_right_bottom_ii': getVal(savedConfig.legRightBottomPrice, 14.90),
        'leg_left_mid': getVal(savedConfig.legLeftPrice, 14.90)
    };

    // Preços de Extras (Usar getAdminVal para permitir fallback no pricing.js)
    state.config.extraPrices = {
        'calca_legging': getAdminVal(savedConfig.extraLeggingPrice),
        'laco': getAdminVal(savedConfig.extraLacoPrice),
        'cordao': getAdminVal(savedConfig.extraCordaoPrice)
    };

    const hidden = JSON.parse(localStorage.getItem('hnt_disabled_colors') || '[]');
    state.availableColors = DATA.colors.filter(c => !hidden.includes(c.id));
    if (state.availableColors.length === 0) state.availableColors = DATA.colors;
}

/**
 * Busca a configuração do servidor (Para modo anônimo/incognito)
 */
async function fetchConfigFromServer() {
    try {
        console.log("☁️ Buscando configurações do servidor...");
        const res = await fetch('/api/admin/config');
        if (!res.ok) throw new Error('API config error');

        const serverConfig = await res.json();
        if (serverConfig && Object.keys(serverConfig).length > 0) {
            console.log("☁️ Configuração recebida do servidor:", serverConfig);

            // Salvar no localStorage para persistência local
            localStorage.setItem('hnt_pricing_config', JSON.stringify(serverConfig));

            // Recarregar configs
            loadAdminConfig();

            // Atualizar UI e Preços
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
 * Inicializa valores padrão baseados no banco de dados DATA
 */
function initDefaults() {
    const defaultState = {
        sizes: { "M": 1 },
        parts: {},
        extras: {},
        uploads: {},
        texts: {},
        zoom: 1.4,
        limits: {}
    };

    const defaultColors = {
        "centro": "preto",
        "lateral_esq": "vermelho", // Lateral (usa a mesma lógica para esq/dir visualmente)
        "filete": "dourado",
        "logo_hnt": "dourado",
        "fundo_hnt": "preto"
    };

    DATA.parts.forEach(p => {
        defaultState.parts[p.id] = defaultColors[p.id] || "preto";
    });
    DATA.extras.forEach(e => defaultState.extras[e.id] = { enabled: false, color: e.restrictedColors ? e.restrictedColors[0] : "preto" });
    DATA.uploadZones.forEach(u => defaultState.uploads[u.id] = { src: null, scale: 1, rotation: u.defaultRotation || 0, x: u.cssLeft, y: u.cssTop, filename: "", isCustom: false, unlocked: true });
    DATA.textZones.forEach(t => defaultState.texts[t.id] = {
        enabled: false, content: "", fontFamily: 'Outfit', color: "#FF0000", scale: 1.0, maxLines: 1, x: t.cssLeft, y: t.cssTop, unlocked: true
    });

    Object.assign(state, defaultState);
}

/**
 * Gera o nome de arquivo formatado para produção
 * Padrão: [ID_PEDIDO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[NOME_ORIGINAL]
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
 * Padrão: [ID_PEDIDO]-[ID_SIMULACAO]_[SIGLA_PRODUTO]_[SIGLA_LOCAL]_[ORIGEM]_[NOME_ORIGINAL]
 */
function generateFormattedFilename(zoneId, originalName, source = 'EXT') {
    // 1. Sigla Produto
    const productSigla = 'SH'; // Shorts Fight

    // 2. Garantir IDs
    if (!state.simulationId) {
        state.simulationId = `HNT-${productSigla}-${generateNextSequenceNumber()}`;
    }
    if (!state.orderNumber) {
        state.orderNumber = generateNextOrderNumber();
    }

    // 3. Composite ID (XXXXXX-SH-XXXXXX)
    let cleanSimId = state.simulationId.replace(/^HNT-/, '');
    let cleanOrderId = state.orderNumber;

    let compositeId = `${cleanOrderId}-${cleanSimId}`;
    // 4. Sigla Local (Mapeamento Estrito)
    const zoneMap = {
        'logo_centro': 'FRENTE',
        'logo_lat_dir': 'LAT_DIR',
        'logo_lat_esq': 'LAT_ESQ',
        'leg_right_mid_ie': 'PERNA_DIR_CENTRO',
        'leg_right_mid_ii': 'PERNA_DIR_CENTRO', // Assuming II is same visual center
        'leg_right_bottom_ie': 'PERNA_DIR_INF',
        'leg_right_bottom_ii': 'PERNA_DIR_INF',
        'leg_left_mid': 'PERNA_ESQ'
    };
    const zoneSigla = zoneMap[zoneId] || zoneId.toUpperCase();

    // 4. Source Tag
    const sourceTag = source === 'ACERVO' ? 'ACERVO' : 'EXT';

    // 5. Type Tag (IMG vs EMB)
    const ext = originalName.split('.').pop().toLowerCase();
    const typeTag = ['emb', 'dst', 'pes', 'exp'].includes(ext) ? 'EMB' : 'IMG';

    // 6. Nome do Arquivo Sanitizado
    const sanitized = originalName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, '_') // Espaços -> _
        .replace(/[^a-zA-Z0-9.\-_]/g, ""); // Remove especiais mantendo . - _

    return `${compositeId}_${productSigla}_${zoneSigla}_${sourceTag}_${typeTag}_${sanitized}`;
}

/**
 * Processa o upload de uma imagem do usuário
 */
/**
 * Envia o arquivo para o servidor salvar na pasta correta
 */
async function uploadFileToServer(file, base64) {
    if (typeof SupabaseAdapter === 'undefined') return;

    try {
        const fileName = generateFormattedFilename(state.pendingUploadZone || 'unknown', file.name, 'EXT');

        const publicUrl = await SupabaseAdapter.uploadFile('client_uploads', fileName, base64, file.type);

        if (publicUrl) {
            console.log('✅ Upload para Supabase concluído:', publicUrl);
            if (state.pendingUploadZone && state.uploads[state.pendingUploadZone]) {
                state.uploads[state.pendingUploadZone].supabaseUrl = publicUrl;
            }
        }
    } catch (e) {
        console.error('❌ Erro no upload para Supabase:', e);
    }
}

/**
 * Processa o upload de uma imagem do usuário
 */
async function handleZoneUpload(zoneId, file) {
    if (!file) return;
    state.pendingUploadZone = zoneId; // Ensure pending zone is set for naming

    if (typeof showLoadingFeedback === 'function') showLoadingFeedback("Processando imagem...");

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const base64 = e.target.result;

            // --- SERVER UPLOAD ---
            uploadFileToServer(file, base64);
            // ---------------------

            let contentSignature = null;
            if (typeof EmbManager !== 'undefined') {
                contentSignature = EmbManager.generateHash(file, base64);
            } else {
                const head = base64.substring(0, 50);
                const tail = base64.substring(base64.length - 50);
                contentSignature = `sz:${file.size}_h:${head.length}_t:${tail.length}`; // Fallback simplificado
            }

            if (!state.uploads[zoneId]) state.uploads[zoneId] = {};

            // Generate Production Filename
            const finalName = generateFormattedFilename(zoneId, file.name, 'EXT');

            state.uploads[zoneId].src = base64;
            state.uploads[zoneId].filename = file.name; // Keep display name for UI
            state.uploads[zoneId].formattedFilename = finalName; // Store production name
            state.uploads[zoneId].fileHash = contentSignature;
            state.uploads[zoneId].scale = 1.0;
            state.uploads[zoneId].rotation = 0;
            state.uploads[zoneId].x = '50%';
            state.uploads[zoneId].y = '50%';
            state.uploads[zoneId].isCustom = true;
            if (typeof toggleLimit === 'function') toggleLimit(zoneId, true);
            if (typeof checkRightLegNotifications === 'function') checkRightLegNotifications(); // Check for mode changes
            if (typeof scheduleRender === 'function') scheduleRender(true);
            if (typeof showSuccessFeedback === 'function') showSuccessFeedback("Imagem carregada!");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Verifica se uma zona (Upload ou Texto) está sendo usada
 */
function checkZoneUsage(zoneId) {
    // 1. Check Image
    const up = state.uploads[zoneId];
    if (up && (up.src || up.filename)) return true;

    // 2. Check Associated Text
    let txtId = zoneId.replace('logo_', 'text_');

    // Fix for Leg Zones: Remove suffixes (_ie, _ii) because texts are generic (text_leg_right_mid)
    if (!zoneId.startsWith('logo_')) {
        let cleanId = zoneId.replace('_ie', '').replace('_ii', '');
        txtId = 'text_' + cleanId;
    }

    const txt = state.texts[txtId];
    if (txt && txt.enabled) return true;

    return false;
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

    // 2. Identificação: SKU (Item) e Pedido (Grupo)
    const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
    let sigla = state.productInitial || 'SH';
    let typeCount = 0;
    const currentOrderNum = state.orderNumber;

    // Conta quantos itens já existem NESTE pedido específico para gerar o sufixo
    history.forEach(h => {
        if (h.order_id === currentOrderNum) {
            typeCount++;
        }
    });

    const sequenceSuffix = String(typeCount + 1).padStart(2, '0');
    // simulationId já é o SKU (YY-HASH) vindo do state.js refatorado
    const itemFullId = `${state.simulationId}-${sequenceSuffix}`;

    // 3. Geração de PDF Automática com ID do Item (para QR de Conferência)
    let pdfUrl = pdfUrlOverride;
    try {
        if (!pdfUrl && typeof PDFGenerator !== 'undefined') {
            pdfUrl = await PDFGenerator.generateAndSaveForCart(itemFullId);
        }
    } catch (e) {
        console.error('❌ Erro ao gerar PDF para carrinho:', e);
    }

    // 4. Formatação via Adapter e Persistência
    const pricing = calculateFullPrice();
    const newRow = DBAdapter.formatForDatabase(state, pricing, CONFIG, pdfUrl);

    // IMPORTANTE:
    // newRow.order_id agora é o número puro (ex: 5001) vindo do state.orderNumber
    // newRow.ID_SIMULACAO (dentro do DADOS_TECNICOS_JSON) será o SKU completo

    // Atualizamos o simulationId no estado para salvar com o sufixo correto
    const savedState = JSON.parse(newRow.DADOS_TECNICOS_JSON);
    savedState.simulationId = itemFullId;
    newRow.DADOS_TECNICOS_JSON = JSON.stringify(savedState);

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
        console.log('🚀 Iniciando sincronização em segundo plano com Supabase...');
        SupabaseAdapter.savePedido(newRow, state)
            .then(() => console.log('✅ Sincronizado com Supabase.'))
            .catch(err => console.error('⚠️ Falha na sincronização Supabase (Item salvo localmente):', err));
    }

    // 4. Banco de Dados Linear (Excel)
    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.addOrder(newRow);
    }

    return true;
}


/**
 * Atualiza o contador do carrinho no cabeçalho
 */
function updateCartCount() {
    const count = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]').length;
    document.querySelectorAll('.cart-badge').forEach(b => {
        b.innerText = count;
        b.style.display = count > 0 ? 'flex' : 'none';
    });
}

// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_pricing_config' || e.key === 'hnt_disabled_colors') {
        console.log('🔄 Sincronizando configurações com Admin...');
        loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
        if (typeof updateHntBarraLayer === 'function') updateHntBarraLayer();
    }
});

/**
 * Reseta os dados do simulador para o estado inicial (Limpeza)
 */
function resetSimulatorData() {
    console.log("🧹 Resetando dados do simulador...");

    // 1. Limpar Arrays e Objetos do Estado
    state.sizes = { "M": 1 }; // Default
    state.observations = "";

    // 2. Limpar Textos
    DATA.textZones.forEach(t => {
        state.texts[t.id] = {
            enabled: false,
            content: "",
            fontFamily: 'Outfit',
            color: "#FF0000",
            scale: 1.0,
            maxLines: 1,
            x: t.cssLeft,
            y: t.cssTop,
            unlocked: true
        };
    });

    // 3. Limpar Uploads/Imagens
    DATA.uploadZones.forEach(u => {
        state.uploads[u.id] = {
            src: null,
            scale: 1.0,
            rotation: u.defaultRotation || 0,
            x: u.cssLeft,
            y: u.cssTop,
            filename: "",
            isCustom: false,
            unlocked: true
        };
    });

    // 4. Gerar novos IDs para a próxima simulação
    state.simNumber = generateNextSequenceNumber();
    state.simulationId = `HNT-SH-${state.simNumber}`;
    state.orderNumber = generateNextOrderNumber();

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
// Cache System removed here as it is handled by visuals.js

/**
 * RESTORATION SYSTEM
 * Checks for a restoration buffer from Admin Panel and hydrating state
 */
window.checkForRestoration = function () {
    console.log("♻️ Checking for restoration buffer...");
    try {
        const buffer = localStorage.getItem('hnt_restore_buffer');
        if (!buffer) return false;

        const data = JSON.parse(buffer);
        console.log("♻️ Buffer found for Order:", data.orderId);

        // Validation: Check if we are in the right simulator
        // Shorts Logic handles Shorts and Fight Shorts usually.
        // If product type mismatch, we might want to warn, but let's trust the Redirect from Admin.

        // Restore State (Deep Merge or Assign)
        // Since state is flat-ish (except objects), Object.assign is mostly fine, 
        // but we need to ensure nested objects like 'uploads', 'texts', 'parts' are replaced not mixed oddly.
        // Actually, replacing them entirely is what we want.
        Object.assign(state, data.state);

        // MIGRATION: Restore compatibility for renamed 'legging' -> 'calca_legging'
        if (state.extras && state.extras['legging']) {
            state.extras['calca_legging'] = JSON.parse(JSON.stringify(state.extras['legging']));
            delete state.extras['legging'];
        }

        // Ensure all text zones are properly initialized
        DATA.textZones.forEach(t => {
            if (!state.texts[t.id]) {
                state.texts[t.id] = {
                    enabled: false,
                    content: "",
                    fontFamily: 'Outfit',
                    color: "#FF0000",
                    scale: 1.0,
                    maxLines: 1,
                    x: t.cssLeft,
                    y: t.cssTop,
                    unlocked: false
                };
            } else {
                // Ensure all required properties exist
                if (state.texts[t.id].enabled === undefined) state.texts[t.id].enabled = false;
                if (!state.texts[t.id].content) state.texts[t.id].content = "";
                if (!state.texts[t.id].fontFamily) state.texts[t.id].fontFamily = 'Outfit';
                if (!state.texts[t.id].color) state.texts[t.id].color = "#FF0000";
                if (state.texts[t.id].scale === undefined) state.texts[t.id].scale = 1.0;
                if (state.texts[t.id].maxLines === undefined) state.texts[t.id].maxLines = 1;
                if (state.texts[t.id].unlocked === undefined) state.texts[t.id].unlocked = false;
            }
        });

        // Restore Shorts-specific fields
        if (data.state.shorts_specific) {
            state.limits = data.state.shorts_specific.limits || { right: false, left: false };
            state.embFiles = data.state.shorts_specific.embFiles || [];
            state.zoom = data.state.shorts_specific.zoom || 1.0;
            currentZoom = state.zoom;
            if (data.state.shorts_specific.simNumber) state.simNumber = data.state.shorts_specific.simNumber;
            if (data.state.shorts_specific.productInitial) state.productInitial = data.state.shorts_specific.productInitial;
        }

        // Ensure all upload zones are properly initialized
        DATA.uploadZones.forEach(u => {
            if (!state.uploads[u.id]) {
                state.uploads[u.id] = {
                    src: null,
                    scale: 1.0,
                    rotation: u.defaultRotation || 0,
                    x: u.cssLeft,
                    y: u.cssTop,
                    filename: "",
                    isCustom: false,
                    unlocked: false
                };
            } else {
                // Ensure all required properties exist
                if (state.uploads[u.id].scale === undefined) state.uploads[u.id].scale = 1.0;
                if (state.uploads[u.id].rotation === undefined) state.uploads[u.id].rotation = u.defaultRotation || 0;
                if (!state.uploads[u.id].x) state.uploads[u.id].x = u.cssLeft;
                if (!state.uploads[u.id].y) state.uploads[u.id].y = u.cssTop;
                if (state.uploads[u.id].unlocked === undefined) state.uploads[u.id].unlocked = false;
                if (state.uploads[u.id].isCustom === undefined) state.uploads[u.id].isCustom = false;
            }
        });

        // Clear buffer to prevent loops
        localStorage.removeItem('hnt_restore_buffer');

        // Trigger UI Updates
        if (typeof updateLimits === 'function') updateLimits();
        if (typeof updatePrice === 'function') updatePrice();

        // Force re-render of everything (visuals, controls)
        if (typeof scheduleRender === 'function') scheduleRender(true);
        if (typeof renderControls === 'function') renderControls();

        // Show feedback
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

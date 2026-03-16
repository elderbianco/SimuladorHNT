/**
 * Módulo de Estado e Persistência - Shorts
 */

function generateUUID() {
    // Generate a random 6-digit number for the simfunction generateUUID() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const simNum = (array[0] % 100000).toString().padStart(6, '0');
    return simNum;
}

// Estado Global da Simulação
const state = {
    simulationId: '', // Will be built dynamically
    simNumber: generateUUID(),
    orderNumber: '',
    productInitial: 'SH', // Shorts Fight
    sizes: { "M": 1 },
    parts: {},
    extras: {},
    uploads: {},
    texts: {},
    zoom: 1.0,
    availableColors: [],
    pendingUploadZone: null,
    config: {},
    observations: "",
    phone: "",
    termsAccepted: false,
    limits: { right: false, left: false },
    isLocked: false,
    embFiles: [] // Array de {filename, size, zones: []}
};

// Helper function to get the full formatted ID (SKU)
function getFormattedId() {
    if (typeof SKUGenerator !== 'undefined') {
        return SKUGenerator.generateSKU(state);
    }
    // Fallback se o gerador falhar
    const orderPart = state.orderNumber || 'HNT';
    return `${orderPart}-${state.productInitial}-${state.simNumber}`;
}
state.simulationId = getFormattedId();

// Variáveis de Controle de UI (Transientes)
let dragItem = null;
let dragOffset = { x: 0, y: 0 };
let currentWrapperRect = null;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let currentZoom = 1.45; // Valor ajustado para evitar corte nas laterais
let currentGalleryCategory = null;
let eventsInitialized = false;

/**
 * Persistência: Salvar Estado
 */
/**
 * Persistência: Salvar Estado
 */
function saveState() {
    const data = {
        simulationId: state.simulationId,
        simNumber: state.simNumber,
        orderNumber: state.orderNumber,
        sizes: state.sizes,
        parts: state.parts,
        extras: state.extras,
        uploads: state.uploads,
        texts: state.texts,
        zoom: state.zoom,
        limits: state.limits,
        observations: state.observations,
        phone: state.phone,
        termsAccepted: state.termsAccepted,
        embFiles: state.embFiles
    };
    try {
        localStorage.setItem('hnt_shorts_state', JSON.stringify(data));
        // SINCRONIZAÇÃO GLOBAL
        if (state.orderNumber) localStorage.setItem('hnt_global_order', state.orderNumber);

        if (typeof DBAdapter !== 'undefined') {
            DBAdapter.CustomerData.save(state.phone, state.termsAccepted);
        }
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

/**
 * Persistência: Carregar Estado
 */
function loadState() {
    const saved = localStorage.getItem('hnt_shorts_state');
    const globalOrder = localStorage.getItem('hnt_global_order');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.simNumber) state.simNumber = data.simNumber;
            if (data.orderNumber) state.orderNumber = data.orderNumber;

            if (data.sizes) state.sizes = data.sizes;
            if (data.parts) state.parts = { ...state.parts, ...data.parts };
            if (data.extras) state.extras = { ...state.extras, ...data.extras };
            if (data.uploads) state.uploads = { ...state.uploads, ...data.uploads };
            if (data.texts) state.texts = { ...state.texts, ...data.texts };

            const z = parseFloat(data.zoom);
            if (!isNaN(z) && z > 0.1 && z < 6) {
                state.zoom = z;
                currentZoom = z;
            }

            if (data.limits) state.limits = data.limits;
            if (data.observations) state.observations = data.observations;
            if (data.phone) state.phone = data.phone;
            if (data.termsAccepted !== undefined) state.termsAccepted = data.termsAccepted;
            if (data.embFiles) state.embFiles = data.embFiles;

            console.log('State restored from memory');
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }

    // OVERRIDE WITH GLOBAL ORDER IF EXISTS
    if (globalOrder) {
        state.orderNumber = globalOrder;
    }

    // Refresh simulationId after loading components and potentially overriding order
    state.simulationId = getFormattedId();

    // SOBREPOR COM DADOS GLOBAIS (SINCRONIA)
    if (typeof DBAdapter !== 'undefined') {
        const global = DBAdapter.CustomerData.load();
        if (global.phone) state.phone = global.phone;
        if (global.terms !== undefined) state.termsAccepted = global.terms;
    }
}

/**
 * Persistência: Limpar Tudo
 */
function clearState() {
    if (confirm("Tem certeza que deseja apagar tudo e recomeçar?")) {
        localStorage.removeItem('hnt_shorts_state');
        localStorage.removeItem('hnt_simulation_state');
        // Do not clear global order necessarily? Or maybe yes?
        // Usually, clearing ONE simulator shouldn't necessarily wipe the global order for others unless explicitly requested.
        // But for consistency let's leave it.
        window.location.reload();
    }
}


// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_pricing_config' || e.key === 'hnt_text_colors' || e.key === 'hnt_disabled_colors') {
        console.log('🔄 Sincronizando configurações com Admin...');
        if (typeof loadAdminConfig === 'function') loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
    }
    // SINCRONIZAÇÃO GLOBAL DE CLIENTE
    if (e.key === 'hnt_global_client_phone' || e.key === 'hnt_global_client_terms') {
        const global = DBAdapter.CustomerData.load();
        state.phone = global.phone;
        state.termsAccepted = global.terms;
        if (typeof renderControls === 'function') renderControls();
    }
    // GLOBAL ORDER SYNC
    if (e.key === 'hnt_global_order') {
        const newOrder = e.newValue;
        if (newOrder && newOrder !== state.orderNumber) {
            state.orderNumber = newOrder;
            state.simulationId = getFormattedId(); // Update ID too
            if (typeof renderControls === 'function') renderControls();
        }
    }
});


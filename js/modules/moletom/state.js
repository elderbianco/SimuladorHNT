/**
 * Módulo de Estado e Persistência - Moletom
 */

function generateUUID() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 100000).toString().padStart(6, '0');
}

// CONFIG, LIMIT_IMAGES, and COLOR_LIMIT_MAP are now loaded from moletom-data.js (global CONFIG)

// Helper function to get the full formatted ID
function getFormattedId() {
    if (typeof SKUGenerator !== 'undefined') {
        return SKUGenerator.generateSKU(state);
    }
    // Fallback
    const orderPart = state.orderNumber || 'HNT';
    return `${orderPart}-${state.productInitial}-${state.simNumber}`;
}

// Initial state on window
window.state = {
    simulationId: '',
    simNumber: generateUUID(),
    orderNumber: '',
    productInitial: 'ML', // Moletom
    color: 'branco',
    elements: {},
    sizes: {},
    zoom: 1.0,
    dragOffset: { x: 0, y: 0 },
    draggedElement: null,
    config: (typeof CONFIG !== 'undefined' ? CONFIG : {}),
    availableColors: [],
    texts: {},
    zoneLimits: {},
    logoPunho: { enabled: true, color: 'preto' }, // New Feature State
    observations: "",
    phone: "",
    termsAccepted: false,
    isLocked: false
};

// Global reference using both window and globalThis for maximum reliability
globalThis.state = window.state;
var state = window.state;
state.simulationId = getFormattedId();

// Initialize Elements from CONFIG
if (typeof CONFIG !== 'undefined' && CONFIG.zones) {
    Object.keys(CONFIG.zones).forEach(zid => {
        state.elements[zid] = [];
    });
}

// Initialize text zones
CONFIG.textZones.forEach(z => {
    state.texts[z.id] = {
        enabled: false,
        content: '',
        fontFamily: 'Anton',
        color: '#FFFFFF',
        maxLines: 1,
        scale: 1.0
    };
});


let dragItem = null;
let dragOffset = { x: 0, y: 0 };
let currentWrapperRect = null;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let currentZoom = 1.8;
let currentGalleryCategory = null;

function saveState() {
    localStorage.setItem('hnt_moletom_state', JSON.stringify({
        simulationId: state.simulationId,
        simNumber: state.simNumber,
        orderNumber: state.orderNumber,
        color: state.color,
        sizes: state.sizes,
        texts: state.texts,
        zoneLimits: state.zoneLimits,
        logoPunho: state.logoPunho,
        observations: state.observations,
        phone: state.phone,
        termsAccepted: state.termsAccepted,
        zoom: currentZoom
    }));
    // GLOBAL SYNC ORDER
    if (state.orderNumber) localStorage.setItem('hnt_global_order', state.orderNumber);

    // SINCRONIZAÇÃO GLOBAL
    if (typeof DBAdapter !== 'undefined') {
        DBAdapter.CustomerData.save(state.phone, state.termsAccepted);
    }
}

function loadState() {
    const saved = localStorage.getItem('hnt_moletom_state');
    const globalOrder = localStorage.getItem('hnt_global_order');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(state, data);
            state.simulationId = getFormattedId();
            if (data.zoom) currentZoom = data.zoom;

            // SAFETY: Ensure all text zones exist in state (in case of old save)
            if (typeof CONFIG !== 'undefined' && CONFIG.textZones) {
                if (!state.texts) state.texts = {};
                CONFIG.textZones.forEach(z => {
                    if (!state.texts[z.id]) {
                        state.texts[z.id] = {
                            enabled: false,
                            content: '',
                            fontFamily: 'Anton',
                            color: '#FFFFFF',
                            maxLines: 1,
                            scale: 1.0
                        };
                    }
                });
            }
        } catch (e) { console.error('Error loading state:', e); }
    }

    // OVERRIDE WITH GLOBAL ORDER
    if (globalOrder) {
        state.orderNumber = globalOrder;
        state.simulationId = getFormattedId();
    }

    // SOBREPOR COM DADOS GLOBAIS (SINCRONIA)
    if (typeof DBAdapter !== 'undefined') {
        const global = DBAdapter.CustomerData.load();
        if (global.phone) state.phone = global.phone;
        if (global.terms !== undefined) state.termsAccepted = global.terms;
    }
}

function clearState() {
    if (confirm("Deseja zerar a simulação?")) {
        localStorage.removeItem('hnt_moletom_state');
        window.location.reload();
    }
}

// Auto-init config (Handled by logic.js)
// loadAdminConfig() removed here to avoid duplication with logic.js

// Auto-Sync with Admin Panel (Shared with logic.js if necessary)
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_moletom_config' || e.key === 'hnt_moletom_part_colors' || e.key === 'hnt_text_colors' || e.key === 'hnt_active_fonts') {
        console.log('🔄 Sincronizando configurações com Admin (State)...');
        if (typeof loadAdminConfig === 'function') loadAdminConfig();
        if (typeof updatePrice === 'function') updatePrice();
        if (typeof renderControls === 'function') renderControls();
    }
    // SINCRONIZAÇÃO GLOBAL DE CLIENTE
    if (e.key === 'hnt_global_client_phone' || e.key === 'hnt_global_client_terms') {
        if (typeof DBAdapter !== 'undefined') {
            const global = DBAdapter.CustomerData.load();
            state.phone = global.phone;
            state.termsAccepted = global.terms;
            if (typeof renderControls === 'function') renderControls();
        }
    }
    // GLOBAL ORDER SYNC
    if (e.key === 'hnt_global_order') {
        const newOrder = e.newValue;
        if (newOrder && newOrder !== state.orderNumber) {
            state.orderNumber = newOrder;
            state.simulationId = getFormattedId();
            if (typeof renderControls === 'function') renderControls();
        }
    }
});

// Initialized by simulator.js or IndexMoletom.html scripts order.

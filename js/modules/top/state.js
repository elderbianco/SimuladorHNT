/**
 * Módulo de Estado e Persistência - Top
 */

function generateUUID() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 100000).toString().padStart(6, '0');
}

const CONFIG = {
    product: 'Top',
    basePrice: 0,
    legZoneAddonPrice: 0, // Legacy
    logoLegPrice: 0,
    logoCenterPrice: 0,
    textPrice: 0,
    sizeModPrice: 0,
    devFee: 0,
    discount20: 0,
    discount40: 0,
    artWaiver: true,

    colors: [
        { id: 'preto', name: 'Preto', file: 'TpPrPreto.png', hex: '#000000' },
        { id: 'branco', name: 'Branco', file: 'TpPrBranco.png', hex: '#FFFFFF' },
        { id: 'vermelho', name: 'Vermelho', file: 'TpPrVermelho.png', hex: '#FF0000' },
        { id: 'rosa_pink', name: 'Rosa Pink', file: 'TpPrRosaPink.png', hex: '#FF007F' }
    ],
    zones: {
        frente_centro: {
            id: 'frente_centro',
            x: 25.66, y: 54.26, width: 21.17, height: 12,
            name: 'Frente'
        },
        costas_centro: {
            id: 'costas_centro',
            x: 74.24, y: 45.39, width: 17.5, height: 18,
            name: 'Costas'
        }
    },
    sizes: [
        { label: "PP", priceMod: 0 },
        { label: "P", priceMod: 0 }, { label: "M", priceMod: 0 }, { label: "G", priceMod: 0 },
        { label: "GG", priceMod: 5.00 }, { label: "EXG", priceMod: 5.00 }, { label: "EXGG", priceMod: 5.00 }
    ],
    textZones: [
        { id: 'text_frente', name: 'Texto Frente', parentZone: 'frente_centro', x: 25.66, y: 54.26 },
        { id: 'text_costas', name: 'Texto Costas', parentZone: 'costas_centro', x: 74.24, y: 45.39 }
    ]
};

const HNT_LOGO_COLORS = [
    { id: 'preto', name: 'Preto', hex: '#000000' },
    { id: 'branco', name: 'Branco', hex: '#FFFFFF' },
    { id: 'vermelho', name: 'Vermelho', hex: '#FF0000' },
    { id: 'azul_escuro', name: 'Azul Escuro', hex: '#000080' },
    { id: 'azul_claro', name: 'Azul Claro', hex: '#00BFFF' },
    { id: 'amarelo', name: 'Amarelo', hex: '#FFFF00' },
    { id: 'verde_musgo', name: 'Verde Musgo', hex: '#4B5320' },
    { id: 'verde_limao', name: 'Verde Limão', hex: '#32CD32' },
    { id: 'verde_bandeira', name: 'Verde Bandeira', hex: '#006B3F' },
    { id: 'rosa_pink', name: 'Rosa Pink', hex: '#FF007F' },
    { id: 'rosa_bebe', name: 'Rosa Bebê', hex: '#FFC0CB' },
    { id: 'dourado', name: 'Dourado', hex: '#D4AF37' },
    { id: 'prata', name: 'Prata', hex: '#C0C0C0' },
    { id: 'roxo', name: 'Roxo', hex: '#800080' },
    { id: 'marsala', name: 'Marsala', hex: '#955251' }
];

const LOGO_COLORS = [
    { id: 'preto', name: 'Preto', hex: '#000000', fileFrente: 'TpLfFrPreto.png', fileCostas: 'TpLfCsPreto.png' },
    { id: 'branco', name: 'Branco', hex: '#FFFFFF', fileFrente: 'TpLfFrBranco.png', fileCostas: 'TpLfCsBranco.png' },
    { id: 'vermelho', name: 'Vermelho', hex: '#FF0000', fileFrente: 'TpLfFrVermelho.png', fileCostas: 'TpLfCsVermelho.png' },
    { id: 'azul_escuro', name: 'Azul Escuro', hex: '#000080', fileFrente: 'TpLfFrAzulEscuro.png', fileCostas: 'TpLfCsAzulEscuro.png' },
    { id: 'azul_claro', name: 'Azul Claro', hex: '#00BFFF', fileFrente: 'TpLfFrAzulClaro.png', fileCostas: 'TpLfCsAzulClaro.png' },
    { id: 'amarelo', name: 'Amarelo', hex: '#FFFF00', fileFrente: 'TpLfFrAmarelo.png', fileCostas: 'TpLfCsAmarelo.png' },
    { id: 'verde_musgo', name: 'Verde Musgo', hex: '#4B5320', fileFrente: 'TpLfFrVerdeMusgo.png', fileCostas: 'TpLfCsVerdeMusgo.png' },
    { id: 'verde_limao', name: 'Verde Limão', hex: '#32CD32', fileFrente: 'TpLfFrVerdeLimao.png', fileCostas: 'TpLfCsVerdeLimao.png' },
    { id: 'verde_bandeira', name: 'Verde Bandeira', hex: '#006B3F', fileFrente: 'TpLfFrVerdeBandeira.png', fileCostas: 'TpLfCsVerdeBandeira.png' },
    { id: 'rosa_pink', name: 'Rosa Pink', hex: '#FF007F', fileFrente: 'TpLfFrRosaPink.png', fileCostas: 'TpLfCsRosaPink.png' },
    { id: 'rosa_bebe', name: 'Rosa Bebê', hex: '#FFC0CB', fileFrente: 'TpLfFrRosaBebe.png', fileCostas: 'TpLfCsRosaBebe.png' },
    { id: 'dourado', name: 'Dourado', hex: '#D4AF37', fileFrente: 'TpLfFrDourado.png', fileCostas: 'TpLfCsDourado.png' },
    { id: 'prata', name: 'Prata', hex: '#C0C0C0', fileFrente: 'TpLfFrCinza.png', fileCostas: 'TpLfCsCinza.png' },
    { id: 'roxo', name: 'Roxo', hex: '#800080', fileFrente: 'TpLfFrRoxo.png', fileCostas: 'TpLfCsRoxo.png' },
    { id: 'marsala', name: 'Marsala', hex: '#955251', fileFrente: 'TpLfFrMarsala.png', fileCostas: 'TpLfCsMarsala.png' }
];

const LIMIT_IMAGES = {
    dark: { frente_centro: 'TpLimBrFrente.png', costas_centro: 'TpLimBrCostas.png' },
    light: { frente_centro: 'TpLimPrFrente.png', costas_centro: 'TpLimPrCostas.png' }
};

const COLOR_LIMIT_MAP = {
    'branco': 'light', 'rosa': 'light',
    'preto': 'dark', 'vermelho': 'dark'
};

// Helper function to get the full formatted ID
function getFormattedId() {
    const orderPart = state.orderNumber || 'HNT';
    return `${orderPart}-${state.productInitial}-${state.simNumber}`;
}

const state = {
    simulationId: '',
    simNumber: generateUUID(),
    orderNumber: '',
    productInitial: 'TP', // Top
    color: 'branco',
    elements: { frente_centro: [], costas_centro: [] },
    sizes: {},
    zoom: 1.0,
    dragOffset: { x: 0, y: 0 },
    draggedElement: null,
    config: {},
    availableColors: [],
    texts: {},
    zoneLimits: {},
    logoColor: {
        frente_centro: null,
        costas_centro: null
    },
    hntBarraColor: 'preto',
    hntLogoColor: 'preto',
    logoFrenteColor: 'Preto',
    logoCostasColor: 'Preto',
    observations: "",
    phone: "",
    termsAccepted: false,
    isLocked: false
};

state.simulationId = getFormattedId();

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
let currentZoom = 1.45;
let currentGalleryCategory = null;

function saveState() {
    localStorage.setItem('hnt_top_state', JSON.stringify({
        simulationId: state.simulationId,
        simNumber: state.simNumber,
        orderNumber: state.orderNumber,
        color: state.color,
        sizes: state.sizes,
        texts: state.texts,
        zoneLimits: state.zoneLimits,
        hntLogoColor: state.hntLogoColor, // Is this legacy? state definition uses logoColor{zones}, but this seems to exist too.
        logoFrenteColor: state.logoFrenteColor,
        logoCostasColor: state.logoCostasColor,
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
    const saved = localStorage.getItem('hnt_top_state');
    const globalOrder = localStorage.getItem('hnt_global_order');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(state, data);
            state.simulationId = getFormattedId();
            if (data.zoom) currentZoom = data.zoom;
        } catch (e) { console.error('Error loading top state:', e); }
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
    if (confirm("Recomeçar simulação?")) {
        localStorage.removeItem('hnt_top_state');
        window.location.reload();
    }
}

// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_top_config' || e.key === 'hnt_top_part_colors' || e.key === 'hnt_text_colors' || e.key === 'hnt_active_fonts') {
        console.log('🔄 Sincronizando configurações com Admin...');
        loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
        if (typeof updateHntBarraLayer === 'function') updateHntBarraLayer();
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

// Auto-init config load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminConfig);
} else {
    loadAdminConfig();
}

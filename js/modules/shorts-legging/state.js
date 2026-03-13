/**
 * Módulo de Estado e Persistência - Shorts Legging
 */

function generateUUID() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 100000).toString().padStart(6, '0');
}

// Configuração Específica
const CONFIG = {
    product: 'ShortsLegging',
    basePrice: 0,
    legZoneAddonPrice: 0,
    logoLegPrice: 0,
    logoCenterPrice: 0,
    textPrice: 0,
    sizeModPrice: 0,
    devFee: 0,
    discount20: 0,
    discount40: 0,
    artWaiver: true,

    colors: [
        { id: 'preto', name: 'Preto', file: 'SLgPrPreto.png', hex: '#000000' },
        { id: 'branco', name: 'Branco', file: 'SLgPrBranco.png', hex: '#FFFFFF' },
        { id: 'vermelho', name: 'Vermelho', file: 'SLgPrVermelho.png', hex: '#FF0000' },
        { id: 'rosa_pink', name: 'Rosa Pink', file: 'SLgPrRosaPink.png', hex: '#FF00CC' }
    ],
    zones: {
        lateral_direita: { id: 'lateral_direita', x: 23.62, y: 50.64, width: 7, height: 8, name: 'Lateral Dir.' },
        lateral_esquerda: { id: 'lateral_esquerda', x: 75.62, y: 50.68, width: 6.83, height: 8, name: 'Lateral Esq.' },
        perna_esquerda: { id: 'perna_esquerda', x: 56.95, y: 56.47, width: 5.83, height: 5, name: 'Perna Esq.' }
    },
    sizes: [
        { label: "6", priceMod: 0 }, { label: "8", priceMod: 0 }, { label: "10", priceMod: 0 },
        { label: "12", priceMod: 0 }, { label: "14", priceMod: 0 }, { label: "PP", priceMod: 0 },
        { label: "P", priceMod: 0 }, { label: "M", priceMod: 0 }, { label: "G", priceMod: 0 },
        { label: "GG", priceMod: 10.00 }, { label: "EXG", priceMod: 10.00 }, { label: "EXGG", priceMod: 10.00 }
    ],
    textZones: [
        { id: 'text_lat_dir', name: 'Texto Lat. Dir.', parentZone: 'lateral_direita', x: 23.62, y: 50.64 },
        { id: 'text_lat_esq', name: 'Texto Lat. Esq.', parentZone: 'lateral_esquerda', x: 75.62, y: 50.68 },
        { id: 'text_perna', name: 'Texto Perna Esq.', parentZone: 'perna_esquerda', x: 56.95, y: 56.47 }
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

const LIMIT_IMAGES = {
    dark: {
        lateral_direita: 'SLgLimBrLateralDireito.png',
        lateral_esquerda: 'SLgLimBrLateralEsquerdo.png',
        perna_direita: 'SLgLimBrPerna.png'
    },
    light: {
        lateral_direita: 'SLgLimPrLateralDireito.png',
        lateral_esquerda: 'SLgLimPrLateralEsquerdo.png',
        perna_direita: 'SLgLimPrPerna.png'
    }
};

const COLOR_LIMIT_MAP = {
    'branco': 'light',
    'rosa': 'light',
    'preto': 'dark',
    'vermelho': 'dark'
};

// Helper function to get the full formatted ID
function getFormattedId() {
    const orderPart = state.orderNumber || 'HNT';
    return `${orderPart}-${state.productInitial}-${state.simNumber}`;
}

// Estado Global
window.state = {
    simulationId: '',
    simNumber: generateUUID(),
    orderNumber: '',
    productInitial: 'SL', // Shorts Legging
    color: 'branco',
    elements: {
        lateral_direita: [],
        lateral_esquerda: [],
        perna_esquerda: []
    },
    uploads: {
        lateral_direita: { src: null, filename: null, isCustom: false, unlocked: true },
        lateral_esquerda: { src: null, filename: null, isCustom: false, unlocked: true },
        perna_esquerda: { src: null, filename: null, isCustom: false, unlocked: true }
    },
    sizes: {},
    zoom: 1.0,
    dragOffset: { x: 0, y: 0 },
    draggedElement: null,
    currentTextZone: null,
    config: {},
    availableColors: [],
    texts: {},
    zoneLimits: {},
    hntLogoColor: 'preto',
    observations: "",
    phone: "",
    termsAccepted: false,
    isLocked: false
};

globalThis.state = window.state;
var state = window.state;
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

// Variáveis de Controle de UI (Transientes)
let dragItem = null;
let dragOffset = { x: 0, y: 0 };
let currentWrapperRect = null;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let currentZoom = 1.45;
let currentGalleryCategory = null;
let eventsInitialized = false;

/**
 * Persistência: Salvar Estado
 */
function saveState() {
    // Para Shorts Legging, salvamos apenas os dados essenciais
    // Note: state.elements contém elementos DOM, que não podem ser serializados.
    // Em uma implementação futura, deveríamos salvar os URLs/Posições se quisermos restaurar imagens.
    const data = {
        simulationId: state.simulationId,
        simNumber: state.simNumber,
        orderNumber: state.orderNumber,
        color: state.color,
        sizes: state.sizes,
        zoom: state.zoom,
        texts: state.texts,
        zoneLimits: state.zoneLimits,
        hntLogoColor: state.hntLogoColor,
        observations: state.observations,
        phone: state.phone,
        termsAccepted: state.termsAccepted
    };
    try {
        localStorage.setItem('hnt_shorts_legging_state', JSON.stringify(data));

        // GLOBAL SYNC ORDER
        if (state.orderNumber) localStorage.setItem('hnt_global_order', state.orderNumber);

        // SINCRONIZAÇÃO GLOBAL
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
    const saved = localStorage.getItem('hnt_shorts_legging_state');
    const globalOrder = localStorage.getItem('hnt_global_order');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.simNumber) state.simNumber = data.simNumber;
            if (data.orderNumber) state.orderNumber = data.orderNumber;
            state.simulationId = getFormattedId();

            if (data.color) state.color = data.color;
            if (data.sizes) state.sizes = data.sizes;
            if (data.texts) state.texts = data.texts;
            if (data.zoneLimits) state.zoneLimits = data.zoneLimits;
            if (data.hntLogoColor) state.hntLogoColor = data.hntLogoColor;
            if (data.observations) state.observations = data.observations;
            if (data.phone) state.phone = data.phone;
            if (data.termsAccepted !== undefined) state.termsAccepted = data.termsAccepted;

            // SOBREPOR COM DADOS GLOBAIS (SINCRONIA)
            if (typeof DBAdapter !== 'undefined') {
                const global = DBAdapter.CustomerData.load();
                if (global.phone) state.phone = global.phone;
                if (global.terms !== undefined) state.termsAccepted = global.terms;
            }

            const z = parseFloat(data.zoom);
            if (!isNaN(z) && z > 0.1 && z < 6) {
                state.zoom = z;
                currentZoom = z;
            }

            console.log('Shorts Legging State restored');
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }

    // OVERRIDE WITH GLOBAL ORDER
    if (globalOrder) {
        state.orderNumber = globalOrder;
        state.simulationId = getFormattedId();
    }
}

/**
 * Persistência: Limpar Tudo
 */
function clearState() {
    if (confirm("Tem certeza que deseja apagar tudo e recomeçar?")) {
        localStorage.removeItem('hnt_shorts_legging_state');
        window.location.reload();
    }
}

// ... existing code ...

// Auto-Sync with Admin Panel
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_text_colors') {
        console.log('🔄 Sincronizando cores de texto com Admin...');
        loadAdminConfig();
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

// Auto-init config load
// NOTA: loadAdminConfig() é definido em logic.js, que é carregado DEPOIS deste arquivo.
// A inicialização será feita automaticamente pelo logic.js
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', loadAdminConfig);
// } else {
//     loadAdminConfig();
// }

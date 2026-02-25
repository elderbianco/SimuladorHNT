/**
 * Módulo de Estado e Persistência - Legging
 */

function generateUUID() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 100000).toString().padStart(6, '0');
}

// Configuração Específica
const CONFIG = {
    product: 'Calça Legging',
    basePrice: 0,
    legZoneAddonPrice: 0,
    logoLegPrice: 0,
    logoLatPrice: 0,
    textLatPrice: 0,
    textPrice: 0,
    sizeModPrice: 0,
    devFee: 0,
    discount20: 0,
    discount40: 0,
    artWaiver: true,

    colors: [
        { id: 'preto', name: 'Preto', file: 'LgPrPreto.png', hex: '#000000' },
        { id: 'branco', name: 'Branco', file: 'LgPrBranco.png', hex: '#FFFFFF' },
        { id: 'vermelho', name: 'Vermelho', file: 'LgPrVermelho.png', hex: '#FF0000' },
        { id: 'rosa_pink', name: 'Rosa Pink', file: 'LgPrRosaPink.png', hex: '#FF00CC' }
    ],
    zones: {
        lateral_direita: { id: 'lateral_direita', x: 29.03, y: 33.6, width: 7, height: 8, name: 'Lateral Direita' },
        lateral_esquerda: { id: 'lateral_esquerda', x: 70.82, y: 33.64, width: 6.67, height: 8, name: 'Lateral Esquerda' },
        perna_esquerda: { id: 'perna_esquerda', x: 55.07, y: 35.89, width: 5.33, height: 6, name: 'Perna Esquerda' }
    },
    sizes: [
        { label: "PP", priceMod: 0 },
        { label: "P", priceMod: 0 }, { label: "M", priceMod: 0 }, { label: "G", priceMod: 0 },
        { label: "GG", priceMod: 10.00 }, { label: "EXG", priceMod: 10.00 }, { label: "EXGG", priceMod: 10.00 }
    ],
    textZones: [
        { id: 'text_lateral_direita', name: 'Texto Lateral Direita', parentZone: 'lateral_direita', x: 29.03, y: 33.6 },
        { id: 'text_lateral_esquerda', name: 'Texto Lateral Esquerda', parentZone: 'lateral_esquerda', x: 70.82, y: 33.64 },
        { id: 'text_perna_esquerda', name: 'Texto Perna Esquerda', parentZone: 'perna_esquerda', x: 55.07, y: 35.89 }
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
        lateral_direita: 'LgLimBrLateralDireita.png',
        lateral_esquerda: 'LgLimBrLateralEsquerda.png',
        perna_esquerda: 'LgLimBrPerna.png'
    },
    light: {
        lateral_direita: 'LgLimPrLateralDireita.png',
        lateral_esquerda: 'LgLimPrLateralEsquerdo.png',
        perna_esquerda: 'LgLimPrPerna.png'
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
const state = {
    simulationId: '',
    simNumber: generateUUID(),
    orderNumber: '',
    productInitial: 'LG', // Legging
    color: 'branco',
    elements: {
        lateral_direita: [],
        lateral_esquerda: [],
        perna_direita: [],
        perna_esquerda: []
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
    termsAccepted: false
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
        localStorage.setItem('hnt_legging_state', JSON.stringify(data));

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
    const saved = localStorage.getItem('hnt_legging_state');
    const globalOrder = localStorage.getItem('hnt_global_order');

    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.simNumber) state.simNumber = data.simNumber;
            if (data.orderNumber) state.orderNumber = data.orderNumber;
            state.simulationId = getFormattedId(); // Init ID based on loaded

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
            if (!isNaN(z)) {
                state.zoom = z;
                currentZoom = z;
            }

            console.log('Legging State restored');
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
        localStorage.removeItem('hnt_legging_state');
        window.location.reload();
    }
}
/**
 * Carrega configurações do Admin (Global + Específico)
 */
function loadAdminConfig() {
    try {
        // 1. Configurações Globais
        const activeFonts = JSON.parse(localStorage.getItem('hnt_active_fonts') || '[]');
        const textColors = JSON.parse(localStorage.getItem('hnt_text_colors') || '[]');

        state.config.activeFonts = activeFonts;
        state.config.textColors = textColors;

        // 2. Configurações Específicas
        const specificConfig = JSON.parse(localStorage.getItem('hnt_legging_config') || '{}');
        Object.assign(state.config, specificConfig);

        // 3. Cores Desabilitadas
        const disabledParts = JSON.parse(localStorage.getItem('hnt_legging_part_colors') || '{}');
        const mainDisabled = disabledParts['main'] || [];

        // Filtra cores disponíveis
        state.availableColors = CONFIG.colors.filter(c => !mainDisabled.includes(c.id));

        console.log('Legging Config Loaded:', state.config);
    } catch (e) {
        console.error('Error loading admin config:', e);
        state.availableColors = [...CONFIG.colors];
    }
}

// Auto-init config load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminConfig);
} else {
    loadAdminConfig();
}

// Sync listener
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_legging_config' || e.key === 'hnt_legging_part_colors' || e.key === 'hnt_text_colors') {
        loadAdminConfig();
        if (typeof renderControls === 'function') renderControls();
        if (typeof updatePrice === 'function') updatePrice();
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

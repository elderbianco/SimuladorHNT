/**
 * Constantes Centralizadas do Sistema
 * Centraliza todas as "strings mágicas" para facilitar manutenção
 */

// ============================================
// LOCALSTORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
    // Configurações de Preços
    PRICING_CONFIG: 'hnt_pricing_config',           // Shorts Fight
    LEGGING_CONFIG: 'hnt_legging_config',           // Calça Legging
    TOP_CONFIG: 'hnt_top_config',                   // Top
    MOLETOM_CONFIG: 'hnt_moletom_config',           // Moletom
    SHORTS_LEGGING_CONFIG: 'hnt_shorts_legging_config', // Shorts Legging

    // Configurações Globais
    PRODUCTION_CONFIG: 'hnt_production_config',
    CUSTOM_INFO: 'hnt_custom_info',
    TEXT_COLORS: 'hnt_text_colors',

    // Cores
    DISABLED_COLORS: 'hnt_disabled_colors',
    PART_COLORS: 'hnt_part_colors',
    LEGGING_PART_COLORS: 'hnt_legging_part_colors',
    TOP_PART_COLORS: 'hnt_top_part_colors',
    MOLETOM_PART_COLORS: 'hnt_moletom_part_colors',

    // Estados dos Simuladores
    SHORTS_STATE: 'hnt_shorts_state',
    LEGGING_STATE: 'hnt_legging_state',
    TOP_STATE: 'hnt_top_state',
    MOLETOM_STATE: 'hnt_moletom_state',
    SHORTS_LEGGING_STATE: 'hnt_shorts_legging_state',

    // Banco de Dados
    ALL_ORDERS_DB: 'hnt_all_orders_db',
    SEQUENCE_ID: 'hnt_sequence_id',
    ORDER_SEQ_ID: 'hnt_order_seq_id',

    // Cliente
    GLOBAL_CLIENT_PHONE: 'hnt_global_client_phone',
    GLOBAL_CLIENT_TERMS: 'hnt_global_client_terms',
    GLOBAL_ORDER: 'hnt_global_order',

    // Sistema
    RESTORE_BUFFER: 'hnt_restore_buffer',
    ADMIN_AUTH: 'hnt_admin_auth'
};

// ============================================
// TIPOS DE PRODUTOS
// ============================================

export const PRODUCTS = {
    SHORTS: 'shorts',
    SHORTS_LEGGING: 'shorts-legging',
    LEGGING: 'legging',
    TOP: 'top',
    MOLETOM: 'moletom'
};

export const PRODUCT_NAMES = {
    [PRODUCTS.SHORTS]: 'Shorts Fight',
    [PRODUCTS.SHORTS_LEGGING]: 'Shorts Legging',
    [PRODUCTS.LEGGING]: 'Calça Legging',
    [PRODUCTS.TOP]: 'Top',
    [PRODUCTS.MOLETOM]: 'Moletom'
};

export const PRODUCT_SIGLAS = {
    [PRODUCTS.SHORTS]: 'SH',
    [PRODUCTS.SHORTS_LEGGING]: 'SL',
    [PRODUCTS.LEGGING]: 'LG',
    [PRODUCTS.TOP]: 'TP',
    [PRODUCTS.MOLETOM]: 'ML'
};

// ============================================
// CONFIGURAÇÕES PADRÃO
// ============================================

export const DEFAULT_PRICES = {
    SHORTS: {
        basePrice: 149.90,
        sizeModPrice: 0,
        devFee: 0,
        logoCenterPrice: 29.90,
        textCenterPrice: 19.90,
        logoLatPrice: 14.90,
        textLatPrice: 9.90,
        legRightMidPrice: 14.90,
        legRightBottomPrice: 14.90,
        legLeftPrice: 14.90,
        extraLeggingPrice: 38.90,
        extraLacoPrice: 14.90,
        extraCordaoPrice: 14.90,
        price10: 134.90,
        price20: 119.90,
        price30: 104.90,
        artWaiver: true
    },

    LEGGING: {
        basePrice: 139.90,
        sizeModPrice: 0,
        devFee: 0,
        logoLatPrice: 29.90,
        textLatPrice: 9.90,
        logoLegPrice: 14.90,
        textLegPrice: 0,
        price10: 125.90,
        price20: 111.90,
        price30: 97.90,
        artWaiver: true
    },

    TOP: {
        basePrice: 89.90,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 14.90,
        textFrontPrice: 9.90,
        logoBackPrice: 0,
        textBackPrice: 0,
        logoHntFrontPrice: 0,
        logoHntBackPrice: 0,
        price10: 80.90,
        price20: 71.90,
        price30: 62.90,
        artWaiver: true
    },

    MOLETOM: {
        basePrice: 189.90,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 29.90,
        textFrontPrice: 19.90,
        logoBackPrice: 29.90,
        textBackPrice: 19.90,
        logoHoodPrice: 14.90,
        textHoodPrice: 9.90,
        logoSleevePrice: 14.90,
        textSleevePrice: 9.90,
        zipperUpgrade: 29.90,
        pocketUpgrade: 19.90,
        price10: 170.90,
        price20: 151.90,
        price30: 132.90,
        artWaiver: true
    }
};

// ============================================
// ENDPOINTS DA API
// ============================================

export const API_ENDPOINTS = {
    SAVE_PEDIDO: '/api/save-pedido',
    DELETE_PDF: '/api/delete-pdf',
    NEXT_ORDER_ID: '/api/next-order-id',
    UPLOAD_IMAGE: '/api/upload-image',
    DATABASE_SSE: '/api/database-updates'
};

// ============================================
// MIME TYPES PERMITIDOS
// ============================================

export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf'
];

// ============================================
// LIMITES E VALIDAÇÕES
// ============================================

export const LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_EMB_FILE_SIZE: 2 * 1024 * 1024, // 2MB
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 15
};

// ============================================
// MENSAGENS DE ERRO PADRÃO
// ============================================

export const ERROR_MESSAGES = {
    MISSING_DATA: 'Dados obrigatórios não fornecidos',
    INVALID_MIME_TYPE: 'Tipo de arquivo não permitido',
    FILE_TOO_LARGE: 'Arquivo excede o tamanho máximo permitido',
    PHONE_REQUIRED: 'Telefone é obrigatório',
    TERMS_REQUIRED: 'Você precisa aceitar os Termos e Condições',
    INVALID_PRICE: 'Preço inválido',
    SAVE_ERROR: 'Erro ao salvar configurações'
};

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Helper para acessar localStorage de forma segura
 */
export const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error reading ${key} from localStorage:`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key} to localStorage:`, e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removing ${key} from localStorage:`, e);
            return false;
        }
    }
};

console.log('✅ Constants module loaded');

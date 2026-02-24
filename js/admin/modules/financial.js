/**
 * Financial Management Module - COMPLETE VERSION
 * Handles production costs for ALL admin pricing fields
 */

const COSTS_STORAGE_KEY = 'hnt_production_costs';

// Complete default cost structure matching ALL admin fields
const DEFAULT_COSTS = {
    shorts: {
        basePrice: 0,
        sizeModPrice: 0,
        devFee: 0,
        logoCenterPrice: 0,
        textCenterPrice: 0,
        logoLatPrice: 0,
        textLatPrice: 0,
        legRightMidPrice: 0,
        legRightBottomPrice: 0,
        legLeftPrice: 0,
        extraLeggingPrice: 0,
        extraLacoPrice: 0,
        extraCordaoPrice: 0,
        price10: 0,
        price20: 0,
        price30: 0
    },
    legging: {
        basePrice: 0,
        sizeModPrice: 0,
        devFee: 0,
        logoLatPrice: 0,
        textLatPrice: 0,
        logoLegPrice: 0,
        textLegPrice: 0,
        price10: 0,
        price20: 0,
        price30: 0
    },
    shortsLegging: {
        basePrice: 0,
        sizeModPrice: 0,
        devFee: 0,
        logoLatPrice: 0,
        textLatPrice: 0,
        logoLegPrice: 0,
        textLegPrice: 0,
        price10: 0,
        price20: 0,
        price30: 0
    },
    top: {
        basePrice: 0,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 0,
        textFrontPrice: 0,
        logoBackPrice: 0,
        textBackPrice: 0,
        logoHntFrontPrice: 0,
        logoHntBackPrice: 0,
        price10: 0,
        price20: 0,
        price30: 0
    },
    moletom: {
        basePrice: 0,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 0,
        textFrontPrice: 0,
        logoBackPrice: 0,
        textBackPrice: 0,
        price10: 0,
        price20: 0,
        price30: 0
    },
    taxes: {
        percentual: 0,
        fixedCosts: {
            embalagens: 0,
            etiquetas: 0,
            maoDeObra: 0,
            frete: 0,
            outros: 0
        }
    }
};

// Field labels in Portuguese
const FIELD_LABELS = {
    basePrice: 'Preço Base',
    sizeModPrice: 'Modificador de Tamanho',
    devFee: 'Taxa de Desenvolvimento',
    logoCenterPrice: 'Logo Centro',
    textCenterPrice: 'Texto Centro',
    logoLatPrice: 'Logo Lateral',
    textLatPrice: 'Texto Lateral',
    legRightMidPrice: 'Perna Direita (Meio)',
    legRightBottomPrice: 'Perna Direita (Baixo)',
    legLeftPrice: 'Perna Esquerda',
    extraLeggingPrice: 'Extra Legging',
    extraLacoPrice: 'Extra Laço',
    extraCordaoPrice: 'Extra Cordão',
    logoLegPrice: 'Logo Perna',
    textLegPrice: 'Texto Perna',
    logoFrontPrice: 'Logo Frente',
    textFrontPrice: 'Texto Frente',
    logoBackPrice: 'Logo Costas',
    textBackPrice: 'Texto Costas',
    logoHntFrontPrice: 'Logo HNT Frente',
    logoHntBackPrice: 'Logo HNT Costas',
    price10: 'Preço 10+ unidades',
    price20: 'Preço 20+ unidades',
    price30: 'Preço 30+ unidades'
};

/**
 * Load production costs from localStorage
 */
function loadProductionCosts() {
    const stored = localStorage.getItem(COSTS_STORAGE_KEY);
    if (stored) {
        try {
            const costs = JSON.parse(stored);
            // Merge with defaults to ensure all fields exist
            return {
                shorts: { ...DEFAULT_COSTS.shorts, ...(costs.shorts || {}) },
                legging: { ...DEFAULT_COSTS.legging, ...(costs.legging || {}) },
                shortsLegging: { ...DEFAULT_COSTS.shortsLegging, ...(costs.shortsLegging || {}) },
                top: { ...DEFAULT_COSTS.top, ...(costs.top || {}) },
                moletom: { ...DEFAULT_COSTS.moletom, ...(costs.moletom || {}) },
                taxes: {
                    percentual: costs.taxes?.percentual || 0,
                    fixedCosts: { ...DEFAULT_COSTS.taxes.fixedCosts, ...(costs.taxes?.fixedCosts || {}) }
                }
            };
        } catch (e) {
            console.error('Error parsing production costs:', e);
            return JSON.parse(JSON.stringify(DEFAULT_COSTS));
        }
    }
    return JSON.parse(JSON.stringify(DEFAULT_COSTS));
}

/**
 * Save production costs to localStorage
 */
function saveProductionCosts(costs) {
    try {
        localStorage.setItem(COSTS_STORAGE_KEY, JSON.stringify(costs));
        return true;
    } catch (e) {
        console.error('Error saving production costs:', e);
        return false;
    }
}

/**
 * Sync ALL pricing values from admin localStorage
 */
function syncPricingFromAdmin() {
    const shortsConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');
    const leggingConfig = JSON.parse(localStorage.getItem('hnt_legging_config') || '{}');
    const shortsLeggingConfig = JSON.parse(localStorage.getItem('hnt_shorts_legging_config') || '{}');
    const topConfig = JSON.parse(localStorage.getItem('hnt_top_config') || '{}');
    const moletomConfig = JSON.parse(localStorage.getItem('hnt_moletom_config') || '{}');

    return {
        shorts: {
            basePrice: shortsConfig.basePrice || 149.90,
            sizeModPrice: shortsConfig.sizeModPrice || 0,
            devFee: shortsConfig.devFee || 0,
            logoCenterPrice: shortsConfig.logoCenterPrice || 29.90,
            textCenterPrice: shortsConfig.textCenterPrice || 19.90,
            logoLatPrice: shortsConfig.logoLatPrice || 14.90,
            textLatPrice: shortsConfig.textLatPrice || 9.90,
            legRightMidPrice: shortsConfig.legRightMidPrice || 14.90,
            legRightBottomPrice: shortsConfig.legRightBottomPrice || 14.90,
            legLeftPrice: shortsConfig.legLeftPrice || 14.90,
            extraLeggingPrice: shortsConfig.extraLeggingPrice || 38.90,
            extraLacoPrice: shortsConfig.extraLacoPrice || 14.90,
            extraCordaoPrice: shortsConfig.extraCordaoPrice || 14.90,
            price10: shortsConfig.price10 || 134.90,
            price20: shortsConfig.price20 || 119.90,
            price30: shortsConfig.price30 || 104.90
        },
        legging: {
            basePrice: leggingConfig.basePrice || 139.90,
            sizeModPrice: leggingConfig.sizeModPrice || 0,
            devFee: leggingConfig.devFee || 0,
            logoLatPrice: leggingConfig.logoLatPrice || 29.90,
            textLatPrice: leggingConfig.textLatPrice || 9.90,
            logoLegPrice: leggingConfig.logoLegPrice || 14.90,
            textLegPrice: leggingConfig.textLegPrice || 0,
            price10: leggingConfig.price10 || 125.90,
            price20: leggingConfig.price20 || 111.90,
            price30: leggingConfig.price30 || 97.90
        },
        shortsLegging: {
            basePrice: shortsLeggingConfig.basePrice || 89.90,
            sizeModPrice: shortsLeggingConfig.sizeModPrice || 0,
            devFee: shortsLeggingConfig.devFee || 0,
            logoLatPrice: shortsLeggingConfig.logoLatPrice || 29.90,
            textLatPrice: shortsLeggingConfig.textLatPrice || 9.90,
            logoLegPrice: shortsLeggingConfig.logoLegPrice || 14.90,
            textLegPrice: shortsLeggingConfig.textLegPrice || 9.90,
            price10: shortsLeggingConfig.price10 || 80.90,
            price20: shortsLeggingConfig.price20 || 71.90,
            price30: shortsLeggingConfig.price30 || 62.90
        },
        top: {
            basePrice: topConfig.basePrice || 89.90,
            sizeModPrice: topConfig.sizeModPrice || 0,
            devFee: topConfig.devFee || 0,
            logoFrontPrice: topConfig.logoFrontPrice || 14.90,
            textFrontPrice: topConfig.textFrontPrice || 9.90,
            logoBackPrice: topConfig.logoBackPrice || 0,
            textBackPrice: topConfig.textBackPrice || 0,
            logoHntFrontPrice: topConfig.logoHntFrontPrice || 0,
            logoHntBackPrice: topConfig.logoHntBackPrice || 0,
            price10: topConfig.price10 || 80.90,
            price20: topConfig.price20 || 71.90,
            price30: topConfig.price30 || 62.90
        },
        moletom: {
            basePrice: moletomConfig.basePrice || 0,
            sizeModPrice: moletomConfig.sizeModPrice || 0,
            devFee: moletomConfig.devFee || 0,
            logoFrontPrice: moletomConfig.logoFrontPrice || 0,
            textFrontPrice: moletomConfig.textFrontPrice || 0,
            logoBackPrice: moletomConfig.logoBackPrice || 0,
            textBackPrice: moletomConfig.textBackPrice || 0,
            price10: moletomConfig.price10 || 0,
            price20: moletomConfig.price20 || 0,
            price30: moletomConfig.price30 || 0
        }
    };
}

/**
 * Calculate margin for a single item
 */
function calculateItemMargin(salePrice, costPrice) {
    const margin = salePrice - costPrice;
    const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;
    return {
        margin: margin,
        marginPercent: marginPercent,
        isPositive: margin >= 0
    };
}

/**
 * Format currency for display
 */
function formatCurrency(value) {
    const n = parseFloat(value || 0);
    return `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;
}

/**
 * Format percentage for display
 */
function formatPercent(value) {
    return `${parseFloat(value || 0).toFixed(2)}%`;
}

/**
 * Get field label in Portuguese
 */
function getFieldLabel(field) {
    return FIELD_LABELS[field] || field;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.FinancialManager = {
        loadProductionCosts,
        saveProductionCosts,
        syncPricingFromAdmin,
        calculateItemMargin,
        formatCurrency,
        formatPercent,
        getFieldLabel,
        DEFAULT_COSTS
    };
}

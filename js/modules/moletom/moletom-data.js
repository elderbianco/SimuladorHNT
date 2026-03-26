/**
 * Hanuthai Simulator - Moletom Data
 * Reconstructed based on logic.js requirements
 */

const DATA = {
    basePrice: 189.90, // From logic.js fallback

    sizes: [
        { label: "PP", priceMod: 0 },
        { label: "P", priceMod: 0 },
        { label: "M", priceMod: 0 },
        { label: "G", priceMod: 0 },
        { label: "GG", priceMod: 10.00 },
        { label: "EXG", priceMod: 10.00 },
        { label: "EXGG", priceMod: 10.00 },
        { label: "G1", priceMod: 10.00 },
        { label: "G2", priceMod: 10.00 },
        { label: "G3", priceMod: 10.00 }
    ],

    colors: [
        { id: "preto", name: "Preto", hex: "#000000", file: "MoPrPreto.png" },
        { id: "branco", name: "Branco", hex: "#FFFFFF", file: "MoPrBranco.png" }
    ],

    fonts: [
        { id: "Outfit", name: "Outfit" },
        { id: "Anton", name: "Anton" },
        { id: "Roboto", name: "Roboto" },
        { id: "Montserrat", name: "Montserrat" },
        { id: "Playfair Display", name: "Playfair Display" }
    ],


    // Zones as Object for Direct Lookup in ui-render.js
    zones: {
        "frente_centro": {
            id: "frente_centro",
            name: "Frente Centro",
            x: 30.95, y: 46.93, width: 11.83, height: 15,
            category: "Personalizacao",
            priceVariable: "logoFrontPrice"
        },
        "costas_centro": {
            id: "costas_centro",
            name: "Costas Centro",
            x: 68.32, y: 52.1, width: 14.67, height: 21,
            category: "Personalizacao",
            priceVariable: "logoBackPrice"
        }
    },

    textZones: [
        {
            id: "text_frente",
            parentZone: "frente_centro",
            name: "Texto Frente",
            category: "Personalizacao",
            priceVariable: "textFrontPrice",
            x: 30.95, y: 46.93
        },
        {
            id: "text_costas",
            parentZone: "costas_centro",
            name: "Texto Costas",
            category: "Personalizacao",
            priceVariable: "textBackPrice",
            x: 68.32, y: 52.1
        }
    ]
};

// Expose to window
window.CONFIG = DATA;
window.DATA = DATA;
window.DATA.categories = [
    { id: 'Geral', name: 'Geral' },
    { id: 'Personalizacao', name: 'Personalização' }
];

window.LIMIT_IMAGES = {
    dark: { frente_centro: 'MoLimBrFrente.png', costas_centro: 'MoLimBrCostas.png' },
    light: { frente_centro: 'MoLimPrFrente.png', costas_centro: 'MoLimPrCostas.png' }
};

window.COLOR_LIMIT_MAP = {
    'branco': 'light',
    'preto': 'dark',
    'cinza_mescla': 'light'
};

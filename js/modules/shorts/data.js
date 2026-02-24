/**
 * Hanuthai Simulator - Data & Configuration v8
 */

const DATA = {
    // defaults (overridden by localStorage in Logic)
    basePrice: 149.90,

    sizes: [
        { label: "6", priceMod: 0 }, { label: "8", priceMod: 0 }, { label: "10", priceMod: 0 },
        { label: "12", priceMod: 0 }, { label: "14", priceMod: 0 }, { label: "PP", priceMod: 0 },
        { label: "P", priceMod: 0 }, { label: "M", priceMod: 0 }, { label: "G", priceMod: 0 },
        { label: "GG", priceMod: 10.00 }, { label: "EXG", priceMod: 10.00 }, { label: "EXGG", priceMod: 10.00 }
    ],
    colors: [
        { id: "preto", name: "Preto", hex: "#000000", isDark: true },
        { id: "branco", name: "Branco", hex: "#FFFFFF", isDark: false },
        { id: "vermelho", name: "Vermelho", hex: "#FF0000", isDark: true },
        { id: "azul_escuro", name: "Azul Escuro", hex: "#000080", isDark: true },
        { id: "azul_claro", name: "Azul Claro", hex: "#00BFFF", isDark: false },
        { id: "amarelo", name: "Amarelo", hex: "#FFFF00", isDark: false },
        { id: "verde_musgo", name: "Verde Musgo", hex: "#4B5320", isDark: true },
        { id: "verde_limao", name: "Verde Limão", hex: "#32CD32", isDark: false },
        { id: "verde_bandeira", name: "Verde Bandeira", hex: "#006B3F", isDark: true },
        { id: "rosa_pink", name: "Rosa Pink", hex: "#FF007F", isDark: true },
        { id: "rosa_bebe", name: "Rosa Bebê", hex: "#FFC0CB", isDark: false },
        { id: "dourado", name: "Dourado", hex: "#D4AF37", isDark: false },
        { id: "prata", name: "Prata", hex: "#C0C0C0", isDark: false },
        { id: "roxo", name: "Roxo", hex: "#800080", isDark: true },
        { id: "marsala", name: "Marsala", hex: "#955251", isDark: true }
    ],
    fonts: [
        { id: "Mountain King", name: "Mountain King" },
        { id: "Sweet Pea", name: "Sweet Pea" },
        { id: "Advent Pro", name: "Advent Pro" },
        { id: "Adventure", name: "Adventure" },
        { id: "Algerian", name: "Algerian" },
        { id: "Army", name: "Army" },
        { id: "Army Condensed", name: "Army Condensed" },
        { id: "Azonix", name: "Azonix" },
        { id: "Badboys", name: "Badboys" },
        { id: "Berkahi Blackletter", name: "Berkahi Blackletter" },
        { id: "Broken Knight", name: "Broken Knight" },
        { id: "Campana Script", name: "Campana Script" },
        { id: "Chido123", name: "Chido123" },
        { id: "Cloister Black", name: "Cloister Black" },
        { id: "Dagose", name: "Dagose" },
        { id: "Dash Horizon", name: "Dash Horizon" },
        { id: "DeVinne Txt BT", name: "DeVinne Txt" },
        { id: "Eating", name: "Eating" },
        { id: "Enchantment", name: "Enchantment" },
        { id: "Esporte", name: "Esporte" },
        { id: "Hansel", name: "Hansel" },
        { id: "Harry P", name: "Harry P" },
        { id: "Iceland Winterstorm", name: "Iceland Winterstorm" },
        { id: "Impact", name: "Impact" },
        { id: "LemonY-Outline", name: "LemonY-Outline" },
        { id: "Mechaside", name: "Mechaside" },
        { id: "Merienda", name: "Merienda" },
        { id: "Metrim", name: "Metrim" },
        { id: "Old London", name: "Old London" },
        { id: "Oldsport01college", name: "Oldsport01college" },
        { id: "OliviaAntiqueBlack", name: "OliviaAntiqueBlack" },
        { id: "Playwrite Magyarorszag", name: "Playwrite Magyarorszag" },
        { id: "Sharps GF", name: "Sharps GF" },
        { id: "Stencil Block", name: "Stencil Block" },
        { id: "Tahoma", name: "Tahoma" },
        { id: "Wilson_Wells", name: "Wilson_Wells" }
    ],

    categories: [
        // Limites de movimento conforme especificação do usuário
        { id: "Centro", name: "Centro Frente", xMin: 37.9, xMax: 61.0, yMin: 45, yMax: 45 }, // Y fixo em 45%
        { id: "Laterais", name: "Laterais", xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
        { id: "Pernas", name: "Pernas (Frente)", xMin: 40.0, xMax: 60.0, yMin: 44.2, yMax: 63.4 }, // Área geral das pernas
        { id: "Acabamento", name: "Acabamentos", xMin: 0, xMax: 100, yMin: 0, yMax: 100 }
    ],

    parts: [
        { id: "centro", name: "Cor Centro Frente", zIndex: 10, folder: "Shorts/Centro", category: "Centro", siglaSub: "Me" },
        { id: "lateral_esq", name: "Cor Lateral", zIndex: 20, folder: "Shorts/Laterais", category: "Laterais", siglaSub: "Lt" },
        { id: "filete", name: "Filetes", zIndex: 30, folder: "Shorts/Filete", category: "Acabamento", siglaSub: "Ft" },
        { id: "logo_hnt", name: "Logo Hanuthai", zIndex: 25, folder: "Shorts/HNTCósPerna", category: "Acabamento", siglaSub: "Hn" },
        { id: "fundo_hnt", name: "Fundo Logo HNT Cós", zIndex: 15, folder: "Shorts/FundoHNT", category: "Acabamento", restrictedColors: ["preto", "branco"], siglaSub: "Fu" }
    ],

    extras: [
        {
            id: "calca_legging", name: "Legging Interna", zIndex: 5, folder: "Shorts/LegInterna", siglaSub: "Li",
            price: 38.90, desc: "Compressão interna.",
            restrictedColors: ["preto", "branco"], category: "Acabamento"
        },
        {
            id: "laco", name: "Laço", zIndex: 35, folder: "Shorts/Laco", siglaSub: "Lc",
            price: 14.90, desc: "Detalhe lateral em cetim.", category: "Laterais"
        },
        {
            id: "cordao", name: "Cordão Interno", zIndex: 36, folder: "Shorts/Cordao", siglaSub: "Co",
            price: 14.90, desc: "Cordão de ajuste extra.", category: "Acabamento",
            restrictedColors: ["preto", "branco"]
        }
    ],

    uploadZones: [
        // ✅ DADOS CALIBRADOS ATUALIZADOS (SWAPPED SIDES: Dir=Right, Esq=Left)
        { id: "logo_centro", name: "Frente Centro", sigla: "CENTRO", zIndex: 40, cssLeft: "50.5%", cssTop: "49.5%", width: "23.2%", height: 10.07, category: "Centro", xMin: 38.9, xMax: 62.14, yMin: 44.38, yMax: 54.58 },
        // LAT_DIR now uses screen-left coordinates (Anatomical Right)
        { id: "logo_lat_dir", name: "Lateral Direita", sigla: "LAT_DIR", zIndex: 42, cssLeft: "14.46%", cssTop: "49.61%", width: "8.18%", height: 14.91, category: "Laterais", defaultRotation: -0.5, xMin: 10.27, xMax: 18.64, yMin: 43.23, yMax: 56.01 },
        // LAT_ESQ now uses screen-right coordinates (Anatomical Left)
        { id: "logo_lat_esq", name: "Lateral Esquerda", sigla: "LAT_ESQ", zIndex: 42, cssLeft: "85.84%", cssTop: "49.66%", width: "8.29%", height: 15.12, category: "Laterais", defaultRotation: 0.3, xMin: 81.64, xMax: 90.003, yMin: 43.32, yMax: 56.03 },

        // Zonas de Perna
        {
            id: "leg_right_mid_ie",
            name: "Perna Dir. Centro (Padrão IE)",
            sigla: "PERNA_DIR_CENTRO_IE",
            zIndex: 43,
            cssLeft: "42.8%",
            cssTop: "49.45%",
            width: "9.71%",
            height: 11.0,
            category: "Pernas",
            requiresUnlock: true,
            defaultRotation: 10.1,
            xMin: 37.29,
            xMax: 48.27,
            yMin: 43.76,
            yMax: 55.28,
            calibrationVariants: {
                'IE': { cssLeft: "42.8%", cssTop: "49.45%", width: "9.71%", height: 11.0 },
                'II': { cssLeft: "42.92%", cssTop: "48.55%", width: "9.81%", height: 8.6 }
            }
        },
        {
            id: "leg_right_mid_ii",
            name: "Perna Dir. Centro (Reduzido II)",
            sigla: "PERNA_DIR_CENTRO_II",
            zIndex: 43,
            cssLeft: "42.92%",
            cssTop: "48.55%",
            width: "9.81%",
            height: 8.6,
            category: "Pernas",
            requiresUnlock: true,
            defaultRotation: 10.2,
            xMin: 36.5,
            xMax: 49.5,
            yMin: 42.5,
            yMax: 55.5,
            calibrationVariants: {
                'IE': { cssLeft: "42.8%", cssTop: "49.45%", width: "9.71%", height: 11.0 },
                'II': { cssLeft: "42.92%", cssTop: "48.55%", width: "9.81%", height: 8.6 }
            }
        },
        {
            id: "leg_right_bottom_ie",
            name: "Perna Dir. Inferior (Padrão IE)",
            sigla: "PERNA_DIR_INF_IE",
            zIndex: 43,
            cssLeft: "38.32%",
            cssTop: "57.8%",
            width: "10.3%",
            height: 7.7,
            category: "Pernas",
            requiresUnlock: true,
            defaultRotation: 18.4,
            xMin: 32.71,
            xMax: 43.71,
            yMin: 53.95,
            yMax: 61.65,
            calibrationVariants: {
                'IE': { cssLeft: "38.32%", cssTop: "57.8%", width: "10.3%", height: 7.7 },
                'II': { cssLeft: "38.32%", cssTop: "57.8%", width: "11.8%", height: 7.7 }
            }
        },
        {
            id: "leg_right_bottom_ii",
            name: "Perna Dir. Inferior (Reduzido II)",
            sigla: "PERNA_DIR_INF_II",
            zIndex: 43,
            cssLeft: "38.32%",
            cssTop: "57.8%",
            width: "11.8%",
            height: 7.7,
            category: "Pernas",
            requiresUnlock: true,
            defaultRotation: 18.2,
            xMin: 31.5,
            xMax: 45.5,
            yMin: 53.95,
            yMax: 61.65,
            calibrationVariants: {
                'IE': { cssLeft: "38.32%", cssTop: "57.8%", width: "10.3%", height: 7.7 },
                'II': { cssLeft: "38.32%", cssTop: "57.8%", width: "11.8%", height: 7.7 }
            }
        },
        { id: "leg_left_mid", name: "Perna Esquerda", sigla: "PERNA_ESQ", zIndex: 43, cssLeft: "58.17%", cssTop: "49.1%", width: "9.73%", height: 11.5, category: "Pernas", requiresUnlock: true, defaultRotation: -9.8, xMin: 52.91, xMax: 63.83, yMin: 43.7, yMax: 55.27 }
    ],

    textZones: [
        // ✅ DADOS CALIBRADOS ATUALIZADOS (SWAPPED)
        { id: "text_centro", name: "Texto Frente", cssLeft: "50.58%", cssTop: "49.44%", width: "22.95%", height: 9.98, category: "Centro", xMin: 38.96, xMax: 62.1, yMin: 44.43, yMax: 54.45 },
        // LAT_DIR uses screen-left values (Anatomical Right)
        { id: "text_lat_dir", name: "Texto Lat. Direita", cssLeft: "14.38%", cssTop: "49.55%", width: "8.36%", height: 15.08, category: "Laterais", defaultRotation: -0.4, xMin: 10.2, xMax: 18.562, yMin: 43.25, yMax: 55.86 },
        // LAT_ESQ uses screen-right values (Anatomical Left)
        { id: "text_lat_esq", name: "Texto Lat. Esquerda", cssLeft: "85.82%", cssTop: "49.67%", width: "8.36%", height: 15.13, category: "Laterais", defaultRotation: 0.8, xMin: 81.64, xMax: 90.003, yMin: 43.32, yMax: 55.97 },

        { id: "text_leg_right_mid", name: "Texto Perna Dir. Centro", cssLeft: "42.79%", cssTop: "49.48%", width: "9.28%", height: 13.65, category: "Pernas", requiresUnlock: true, defaultRotation: 9.6, xMin: 37.27, xMax: 48.24, yMin: 43.02, yMax: 56.44 },
        {
            id: "text_leg_right_bottom",
            name: "Texto Perna Dir. Inf.",
            cssLeft: "38.29%",
            cssTop: "57.8%",
            width: "14.0%",
            height: 7.7,
            category: "Pernas",
            requiresUnlock: true,
            defaultRotation: 18,
            xMin: 32.78,
            xMax: 43.71,
            yMin: 53.95,
            yMax: 61.65,
            calibrationVariants: {
                'IE': { cssLeft: "38.29%", cssTop: "57.8%", width: "14.0%", height: 7.7 },
                'II': { cssLeft: "38.32%", cssTop: "57.8%", width: "14.5%", height: 7.7 }
            }
        },
        { id: "text_leg_left_mid", name: "Texto Perna Esq.", cssLeft: "58.17%", cssTop: "49.1%", width: "9.73%", height: 11.5, category: "Pernas", requiresUnlock: true, defaultRotation: -9, xMin: 52.91, xMax: 63.841, yMin: 43.81, yMax: 55.21 }
    ],

    gallery: (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY : []
};

// INITIALIZATION: Load LocalStorage overrides for Gallery
(function loadLocalGallery() {
    try {
        const storedGallery = localStorage.getItem('hnt_gallery_custom');
        if (storedGallery) {
            const customItems = JSON.parse(storedGallery);
            // Append custom items to the static gallery
            DATA.gallery = [...DATA.gallery, ...customItems];
        }

        // Also check if any default items were "deleted" (hidden) via Admin
        const deletedItems = localStorage.getItem('hnt_gallery_deleted');
        if (deletedItems) {
            const blockedSrcs = JSON.parse(deletedItems);
            DATA.gallery = DATA.gallery.filter(item => !blockedSrcs.includes(item.src));
        }
    } catch (e) {
        console.error("Erro ao carregar galeria personalizada:", e);
    }
})();


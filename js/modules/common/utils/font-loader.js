
/**
 * Hanuthai Simulator - Dynamic Font Loader
 * Automatically generates @font-face rules for fonts defined in shorts-data.js
 */


// Use setTimeout to defer execution until after the main thread is free (UI Painted)
setTimeout(function loadDynamicFonts() {
    console.log("Initializing Dynamic Font Loader (Deferred)...");

    const systemFonts = (typeof DATA !== 'undefined' && DATA.fonts) ? DATA.fonts : [];
    const styleId = 'dynamic-fonts-style';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    let cssRules = "/* DYNAMICALLY LOADED FONTS */\n";

    // Load System Fonts
    let fonts = [...systemFonts];

    // Load Shared Fonts Database if available
    if (typeof SHARED_FONTS !== 'undefined') {
        SHARED_FONTS.forEach(f => {
            if (!fonts.find(existing => existing.id === f.id)) {
                fonts.push(f);
            }
        });
    }

    // Load Custom Registered Fonts (Base64)
    const customFontsData = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    customFontsData.forEach(font => {
        if (!fonts.find(f => f.id === font.id)) {
            fonts.push(font);
        }
    });

    // Chunk the CSS generation to avoid blocking even inside the timeout
    const generateRules = () => {
        fonts.forEach(font => {
            const cleanId = font.id.replace(/\s+/g, ''); // "AbrilFatface"

            // Local fonts are in 'assets/Fontes/' relative to the HTML page
            let src = `url('assets/Fontes/${font.id}.ttf') format('truetype'),
                     url('assets/Fontes/${font.id}.otf') format('opentype'),
                     url('assets/Fontes/${cleanId}.ttf') format('truetype'),
                     url('assets/Fontes/${cleanId}.otf') format('opentype')`;

            if (font.src) src = `url('${font.src}')`;

            cssRules += `
            @font-face {
                font-family: '${font.id}';
                src: ${src};
                font-display: swap;
            }\n`;
        });

        styleEl.textContent = cssRules;
        console.log(`Generated @font-face rules for ${fonts.length} fonts.`);
    };

    // Simple execution for now, can be chunked if list grows > 500
    generateRules();

}, 1000); // Wait 1 second after script load to start font processing

/**
 * Módulo Visual e Camadas - Legging
 */

function setColor(colorId) {
    state.color = colorId;
    const color = CONFIG.colors.find(c => c.id === colorId);
    if (color) {
        const productImg = document.getElementById('product-image');
        if (productImg) productImg.src = `assets/Legging/Principal/${color.file}`;
    }

    state.hntLogoColor = getAutoHntLogoColor(colorId);
    updateHntLayer();
    updateLimits();

    if (typeof renderControls === 'function') renderControls();
    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

function updateHntLayer() {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    let hntLayer = document.getElementById('hnt-logo-layer');
    if (state.hntLogoColor) {
        if (!hntLayer) {
            hntLayer = document.createElement('img');
            hntLayer.id = 'hnt-logo-layer';
            hntLayer.className = 'layer static-layer';
            hntLayer.style.zIndex = '35';
            hntLayer.style.pointerEvents = 'none';
            hntLayer.style.position = 'absolute';
            hntLayer.style.top = '0'; hntLayer.style.left = '0';
            hntLayer.style.width = '100%'; hntLayer.style.height = '100%';
            wrap.appendChild(hntLayer);
        }

        // Dynamic filename: Capitalized color name (e.g., 'Rosapink.png')
        let colorName = state.hntLogoColor.charAt(0).toUpperCase() + state.hntLogoColor.slice(1).toLowerCase();
        colorName = colorName.replace(/[ _]/g, '');
        // Exceptions for Compound Names
        if (colorName.toLowerCase() === 'rosapink') colorName = 'RosaPink';
        if (colorName.toLowerCase() === 'verdemusgo') colorName = 'VerdeMusgo';
        if (colorName.toLowerCase() === 'verdelimao') colorName = 'VerdeLimao';
        if (colorName.toLowerCase() === 'verdebandeira') colorName = 'VerdeBandeira';
        if (colorName.toLowerCase() === 'azulescuro') colorName = 'AzulEscuro';
        if (colorName.toLowerCase() === 'azulclaro') colorName = 'AzulClaro';
        if (colorName.toLowerCase() === 'rosabebe') colorName = 'RosaBebe';

        hntLayer.src = `assets/Legging/HntLegging/${colorName}.png`;
        hntLayer.style.display = 'block';
    } else if (hntLayer) {
        hntLayer.style.display = 'none';
    }
}

function updateLimits() {
    const layer = document.getElementById('limits-layer');
    if (!layer) return;

    layer.innerHTML = '';
    layer.style.display = 'block';

    const limitType = COLOR_LIMIT_MAP[state.color] || 'dark';
    const limitImages = LIMIT_IMAGES[limitType];

    Object.keys(CONFIG.zones).forEach(zid => {
        if (state.zoneLimits[zid] && limitImages[zid]) {
            const img = document.createElement('img');
            img.src = `assets/Legging/Limites/${limitImages[zid]}`;
            img.className = 'layer static-layer';
            img.style.zIndex = '1000';
            img.style.pointerEvents = 'none';
            img.style.position = 'absolute';
            img.style.top = '0'; img.style.left = '0';
            img.style.width = '100%'; img.style.height = '100%';
            layer.appendChild(img);
        }
    });
}

function applyZoomAndPan() {
    const container = document.getElementById('zoom-container');
    if (container) {
        container.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
    }
}

function renderFixedTexts() {
    const wrap = document.getElementById('customization-layer') || document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    wrap.querySelectorAll('.fixed-text-layer').forEach(el => el.remove());

    CONFIG.textZones.forEach(z => {
        const t = state.texts[z.id];
        // Defensive check: ensure text state exists and has required properties
        if (t && t.enabled && t.content) {
            const div = document.createElement('div');
            div.className = 'custom-element draggable fixed-text-layer';
            div.dataset.zone = z.id;
            div.dataset.type = 'text';
            // Posição: usa o estado fixo ou a zona padrão
            const x = t.x !== undefined ? t.x : z.x;
            const y = t.y !== undefined ? t.y : z.y;
            div.style.left = `${x}%`;
            div.style.top = `${y}%`;
            div.style.transform = `translate(-50%, -50%) scale(${t.scale})`;
            div.style.zIndex = 2000;

            const span = document.createElement('span');
            span.innerText = t.content.replace(/\//g, '\n');
            span.style.whiteSpace = 'pre-wrap';
            span.style.fontFamily = `'${t.fontFamily || 'Outfit'}'`;
            span.style.color = t.color;
            span.style.fontSize = '2rem';
            span.style.textAlign = 'center';
            span.style.lineHeight = '1.2';
            span.style.display = 'block';

            div.appendChild(span);
            wrap.appendChild(div);
        }
    });
    if (typeof updatePrice === 'function') updatePrice();
}

function initLayers() {
    updateHntLayer();
    updateLimits();
}

/**
 * Módulo Visual - Moletom
 */

function setColor(colorId) {
    state.color = colorId;
    const color = CONFIG.colors.find(c => c.id === colorId);
    if (color) {
        const img = document.getElementById('product-image');
        if (img) img.src = `assets/Moletom/Principal/${color.file}`;
    }

    // Strict Contrast Enforcement
    const type = (typeof COLOR_LIMIT_MAP !== 'undefined' && COLOR_LIMIT_MAP[state.color]) ? COLOR_LIMIT_MAP[state.color] : 'dark';
    const required = type === 'light' ? 'preto' : 'branco';
    if (state.logoPunho.enabled && state.logoPunho.color !== required) {
        state.logoPunho.color = required;
    }

    updateLimits();
    updateLogoPunho();
    if (typeof renderControls === 'function') renderControls();
    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

function updateLogoPunho() {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    let logoImg = document.getElementById('logo-punho-layer');

    // Create if not exists
    if (!logoImg) {
        logoImg = document.createElement('img');
        logoImg.id = 'logo-punho-layer';
        logoImg.className = 'layer static-layer';
        logoImg.style.zIndex = '50'; // High z-index to stay above base
        logoImg.style.position = 'absolute';
        logoImg.style.top = '0';
        logoImg.style.left = '0';
        logoImg.style.width = '100%';
        logoImg.style.height = '100%';
        logoImg.style.pointerEvents = 'none'; // Click-through
        wrap.appendChild(logoImg);
    }

    if (!state.logoPunho || !state.logoPunho.enabled) {
        logoImg.style.display = 'none';
        return;
    }

    logoImg.style.display = 'block';

    // Strict Color (no auto)
    // Fallback to 'preto' if something invalid like 'auto' slips through, 
    // though setColor/renderControls should catch it.
    let targetColor = state.logoPunho.color;
    if (targetColor !== 'preto' && targetColor !== 'branco') targetColor = 'preto';

    logoImg.src = `assets/Moletom/HntMoletom/${targetColor}.png`;
}


function updateLimits() {
    const layer = document.getElementById('limits-layer');
    if (!layer) return;

    layer.innerHTML = '';
    layer.style.display = 'block';

    const type = COLOR_LIMIT_MAP[state.color] || 'dark';
    const imgs = LIMIT_IMAGES[type];

    Object.keys(CONFIG.zones).forEach(zid => {
        if (state.zoneLimits[zid] && imgs[zid]) {
            const img = document.createElement('img');
            img.src = `assets/Moletom/Limites/${imgs[zid]}`;
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.pointerEvents = 'none';
            layer.appendChild(img);
        }
    });
}

function applyZoomAndPan() {
    const cont = document.getElementById('zoom-container');
    if (cont) cont.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
}

function renderFixedTexts() {
    const wrap = document.getElementById('customization-layer'); if (!wrap) return;
    wrap.querySelectorAll('.fixed-text-layer').forEach(el => el.remove());
    CONFIG.textZones.forEach(z => {
        const t = state.texts[z.id];
        // Defensive check: ensure text state exists and has required properties
        if (t && t.enabled && t.content) {
            const el = document.createElement('div');
            el.className = 'custom-element draggable fixed-text-layer';
            el.dataset.zone = z.id; el.dataset.type = 'text';
            const x = t.x !== undefined ? t.x : z.x;
            const y = t.y !== undefined ? t.y : z.y;
            el.style.left = `${x}%`; el.style.top = `${y}%`;
            el.style.transform = `translate(-50%, -50%) scale(${t.scale})`;
            el.style.zIndex = 2000;
            const span = document.createElement('span');
            span.innerText = t.content.replace(/\//g, '\n');
            span.style.fontFamily = t.fontFamily; span.style.color = t.color;
            span.style.fontSize = '2.5rem'; span.style.textAlign = 'center';
            span.style.display = 'block'; span.style.whiteSpace = 'pre-wrap';
            el.appendChild(span); wrap.appendChild(el);
        }
    });
    if (typeof updatePrice === 'function') updatePrice();
}

function initLayers() {
    updateLimits();
    updateLogoPunho();
}

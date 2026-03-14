/**
 * Módulo Visual - Top
 */

function setColor(colorId) {
    state.color = colorId;
    const color = CONFIG.colors.find(c => c.id === colorId);
    if (color) {
        const img = document.getElementById('product-image');
        if (img) img.src = `assets/Top/Principal/${color.file}`;
    }

    state.hntBarraColor = getAutoHntBarraColor(colorId);
    updateHntBarraLayer();
    updateLimits();

    // Check Top Color vs Logo Color Conflict (Reverse check)
    ['frente_centro', 'costas_centro'].forEach(zone => {
        const currentLogoColor = state.logoColor[zone];
        if (currentLogoColor) {
            const topColorName = color ? color.name : '';
            if (currentLogoColor.name.trim().toLowerCase() === topColorName.trim().toLowerCase()) {
                // Conflict: change logo automatically
                const altName = topColorName.toLowerCase() === 'preto' ? 'Branco' : 'Preto';
                const altColor = LOGO_COLORS.find(c => c.name === altName);
                if (altColor) setLogoColor(zone, altColor);
                else {
                    removeLogoElements(zone);
                    state.logoColor[zone] = null;
                }
            }
        }
    });

    if (typeof renderControls === 'function') renderControls();
    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

function updateHntBarraLayer() {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;
    let layer = document.getElementById('hnt-barra-layer');
    if (!layer) {
        layer = document.createElement('img'); layer.id = 'hnt-barra-layer';
        layer.className = 'layer static-layer'; layer.style.zIndex = '35';
        layer.style.position = 'absolute'; layer.style.top = '0'; layer.style.left = '0';
        layer.style.width = '100%'; layer.style.height = '100%'; layer.style.pointerEvents = 'none';
        wrap.appendChild(layer);
    }

    // Auto-contrast Logic for HntBarra layer
    let colorName = state.hntBarraColor || 'preto';

    // Standard filename format: HNT_[colorname].png (lowercase, no spaces or underscores)
    let safeColorName = colorName.toLowerCase().replace(/[ _]/g, '');
    if (safeColorName === 'azulclaro') safeColorName = 'azulbebe';

    const fileName = `HNT_${safeColorName}`;
    layer.src = `assets/Top/HntBarra/${fileName}.png`;
}

function updateLimits() {
    const layer = document.getElementById('limits-layer'); if (!layer) return;
    layer.innerHTML = ''; layer.style.display = 'block';
    const type = COLOR_LIMIT_MAP[state.color] || 'dark';
    const imgs = LIMIT_IMAGES[type];
    Object.keys(CONFIG.zones).forEach(zid => {
        if (state.zoneLimits[zid] && imgs[zid]) {
            const img = document.createElement('img');
            img.src = `assets/Top/Limites/${imgs[zid]}`;
            img.className = 'layer static-layer'; img.style.zIndex = '1000';
            img.style.position = 'absolute'; img.style.top = '0'; img.style.left = '0';
            img.style.width = '100%'; img.style.height = '100%'; img.style.pointerEvents = 'none';
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
            span.style.fontSize = '2rem'; span.style.textAlign = 'center';
            span.style.display = 'block'; span.style.whiteSpace = 'pre-wrap';
            el.appendChild(span); wrap.appendChild(el);
        }
    });
    if (typeof updatePrice === 'function') updatePrice();
}

function initLayers() {
    // Standardize initialization: If no logo set, defaulting to Black
    const blackLogo = LOGO_COLORS.find(c => c.name === 'Preto');
    if (blackLogo) {
        if (!state.logoColor['frente_centro']) state.logoColor['frente_centro'] = blackLogo;
        if (!state.logoColor['costas_centro']) state.logoColor['costas_centro'] = blackLogo;
    }

    updateHntBarraLayer();
    updateLimits();
    updateLogoLayers();
}

// --- LOGO HNT LOGIC ---
function setLogoColor(zoneId, colorObj) {
    if (!colorObj) {
        removeLogoElements(zoneId);
        state.logoColor[zoneId] = null;
        return;
    }
    const topColor = CONFIG.colors.find(c => c.id === state.color);
    if (topColor && colorObj.name.trim().toLowerCase() === topColor.name.trim().toLowerCase()) {
        alert("A cor da logo não pode ser igual à cor do top! Escolha outra cor.");
        return;
    }
    removeLogoElements(zoneId);
    if (state.elements[zoneId] && state.elements[zoneId].length > 0) {
        removeZoneElements(zoneId); // Remove custom elements if adding logo
    }
    state.logoColor[zoneId] = colorObj;
    updateLogoLayers();
    saveState();
}

function removeLogoElements(zoneId) {
    const layerId = `logo-layer-${zoneId}`;
    const l = document.getElementById(layerId);
    if (l) l.remove();
}

function updateLogoLayers() {
    ['frente_centro', 'costas_centro'].forEach(zid => {
        removeLogoElements(zid);
        const colorObj = state.logoColor[zid];
        if (colorObj) {
            const side = zid === 'frente_centro' ? 'Frente' : 'Costas';
            let fileName = side === 'Frente' ? colorObj.fileFrente : colorObj.fileCostas;
            if (fileName) {
                const fullPath = `assets/Top/LogoFree/${side}/${fileName}`;
                const wrap = document.getElementById('customization-layer'); // Use cust layer to be above product but below controls
                if (wrap) {
                    const img = document.createElement('img');
                    img.id = `logo-layer-${zid}`;
                    img.src = fullPath;
                    img.className = 'layer static-layer';
                    img.style.zIndex = '1400'; // Below custom elements
                    img.style.position = 'absolute'; img.style.top = '0'; img.style.left = '0';
                    img.style.width = '100%'; img.style.height = '100%'; img.style.pointerEvents = 'none';
                    wrap.appendChild(img);
                }
            }
        }
    });
}


function addImage(zoneId, src, filename = "Imagem Enviada", isCustom = true) {
    const wrap = document.getElementById('customization-layer');
    if (!wrap) return;

    // Remover anterior se existir naquela zona
    removeZoneElements(zoneId);

    const el = document.createElement('img');
    el.src = src;
    el.className = 'custom-element draggable';
    el.dataset.zone = zoneId;
    el.dataset.filename = filename;
    el.dataset.isCustom = isCustom;
    el.dataset.type = 'image';

    // Position in center of zone
    const zone = CONFIG.zones[zoneId];
    if (zone) {
        el.style.left = zone.x + '%';
        el.style.top = zone.y + '%';
        el.style.width = zone.width + '%'; // Default width
    } else {
        el.style.left = '50%'; el.style.top = '50%'; el.style.width = '20%';
    }

    el.style.transform = 'translate(-50%, -50%)';
    el.style.zIndex = '1500';

    wrap.appendChild(el);

    if (!state.elements[zoneId]) state.elements[zoneId] = [];
    state.elements[zoneId].push(el);

    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

function removeZoneElements(zoneId) {
    const wrap = document.getElementById('customization-layer');
    if (!wrap) return;

    // 1. Remove from DOM
    const elements = wrap.querySelectorAll(`.custom-element[data-zone="${zoneId}"]`);
    elements.forEach(el => el.remove());

    // 2. Remove from state
    state.elements[zoneId] = [];
    state.zoneLimits[zoneId] = false;

    // 3. Update Visuals
    updateLimits();
    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

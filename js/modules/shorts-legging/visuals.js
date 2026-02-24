/**
 * Módulo de Gerenciamento Visual (Camadas e Renderização) - Shorts Legging
 */

/**
 * Define a cor base do produto e atualiza as camadas dependentes
 */
function setColor(colorId, autoUpdateHnt = true) {
    state.color = colorId;
    const color = CONFIG.colors.find(c => c.id === colorId);
    if (color) {
        const productImg = document.getElementById('product-image');
        if (productImg) productImg.src = `assets/ShortsLegging/Principal/${color.file}`;
    }

    // Atualiza cor do logo HNT automaticamente se solicitado
    if (autoUpdateHnt) {
        state.hntLogoColor = getAutoHntLogoColor(colorId);
    }
    updateHntLayer();

    // Atualiza limites visuais (cores dos limites mudam conforme o fundo)
    updateLimits();

    if (typeof renderControls === 'function') renderControls();
    if (typeof updatePrice === 'function') updatePrice();
    saveState();
}

/**
 * Atualiza a camada do logotipo Hanuthai (HNT)
 */
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
            hntLayer.style.top = '0';
            hntLayer.style.left = '0';
            hntLayer.style.width = '100%';
            hntLayer.style.height = '100%';
            wrap.appendChild(hntLayer);
        }

        // Dynamic filename: Capitalized color name (e.g., 'Rosapink.png')
        let colorName = state.hntLogoColor.charAt(0).toUpperCase() + state.hntLogoColor.slice(1).toLowerCase();
        // Specific Fix for Rosa Pink (RosaPink) and other compound names if needed
        colorName = colorName.replace(/[ _]/g, '');
        if (colorName.toLowerCase() === 'rosapink') colorName = 'RosaPink';
        if (colorName.toLowerCase() === 'verdemusgo') colorName = 'VerdeMusgo';
        if (colorName.toLowerCase() === 'verdelimao') colorName = 'VerdeLimao';
        if (colorName.toLowerCase() === 'verdebandeira') colorName = 'VerdeBandeira';
        if (colorName.toLowerCase() === 'azulescuro') colorName = 'AzulEscuro';
        if (colorName.toLowerCase() === 'azulclaro') colorName = 'AzulClaro';
        if (colorName.toLowerCase() === 'rosabebe') colorName = 'RosaBebe';

        hntLayer.src = `assets/ShortsLegging/HntLegging/${colorName}.png`;
        hntLayer.style.display = 'block';
    } else {
        if (hntLayer) hntLayer.style.display = 'none';
    }
}

/**
 * Renderiza os limites (caixas de marcação) das zonas ativas
 */
function updateLimits() {
    const layer = document.getElementById('limits-layer');
    if (!layer) return;

    layer.innerHTML = '';
    layer.style.display = 'block';

    let borderColor = 'rgba(0,0,0,0.5)'; // Padrão escuro para fundos claros
    if (['preto', 'vermelho', 'azul', 'roxo', 'titanium', 'chumbo', 'azul_marinho'].includes(state.color)) {
        borderColor = 'rgba(255,255,255,0.8)'; // Claro para fundos escuros
    }

    Object.keys(CONFIG.zones).forEach(zoneId => {
        if (state.zoneLimits[zoneId]) {
            const zone = CONFIG.zones[zoneId];
            const box = document.createElement('div');
            box.style.position = 'absolute';
            box.style.left = zone.x + '%';
            box.style.top = zone.y + '%';
            box.style.width = zone.width + '%';
            box.style.height = (zone.height || zone.width) + '%';
            box.style.transform = 'translate(-50%, -50%)';
            box.style.border = `2px dashed ${borderColor}`;
            box.style.pointerEvents = 'none';
            box.style.zIndex = '100';
            box.style.boxSizing = 'border-box';
            layer.appendChild(box);
        }
    });
}

/**
 * Aplica as transformações de Zoom e Pan no container principal
 */
function applyZoomAndPan() {
    const container = document.getElementById('zoom-container');
    if (container) {
        container.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
    }
}

/**
 * Renderiza textos fixos baseados no novo modelo de zonas
 */
function renderFixedTexts() {
    const wrap = document.getElementById('customization-layer') || document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    // Remover textos fixos existentes para redesenhar
    wrap.querySelectorAll('.fixed-text-layer').forEach(el => el.remove());

    CONFIG.textZones.forEach(z => {
        const t = state.texts[z.id];
        // Defensive check: ensure text state exists and has required properties
        if (t && t.enabled && t.content) {
            const div = document.createElement('div');
            div.className = 'absolute-item draggable fixed-text-layer custom-element custom-text';
            div.dataset.zone = z.id;
            div.dataset.type = 'text';
            div.style.left = `${z.x}%`;
            div.style.top = `${z.y}%`;
            div.style.zIndex = 2000;
            // O transform combina o centralismo do zoneamento e o scale do usuário
            div.style.transform = `translate(-50%, -50%) scale(${t.scale})`;

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

/**
 * Inicialização de camadas visuais
 */
function initLayers() {
    updateHntLayer();
    updateLimits();
}

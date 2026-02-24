/**
 * Módulo de Gerenciamento Visual (Camadas e Renderização) - Shorts
 */

// Cache para acesso rápido O(1) usando Map
window.dataCache = {
    partsById: new Map(),
    extrasById: new Map(),
    uploadZonesById: new Map(),
    textZonesById: new Map(),
    colorsById: new Map(),
    categoriesById: new Map()
};

/**
 * Inicializa o cache de dados para busca rápida
 */
function initDataCache() {
    console.log('Maestro: Inicializando Cache de Dados (Shorts)...');
    if (typeof DATA === 'undefined') return;

    window.dataCache.partsById = new Map(DATA.parts.map(p => [p.id, p]));
    window.dataCache.extrasById = new Map(DATA.extras.map(e => [e.id, e]));
    window.dataCache.uploadZonesById = new Map(DATA.uploadZones.map(u => [u.id, u]));
    window.dataCache.textZonesById = new Map(DATA.textZones.map(t => [t.id, t]));
    window.dataCache.colorsById = new Map(DATA.colors.map(c => [c.id, c]));
    window.dataCache.categoriesById = new Map(DATA.categories.map(c => [c.id, c]));
}

// Referência global para elementos de camada reciclados
const staticLayerEls = {};

/**
 * Cria as camadas estáticas iniciais (partes e extras)
 */
function initLayers() {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    wrap.innerHTML = '';

    const allStatic = [
        ...DATA.parts.map(p => ({ ...p, t: 'part' })),
        ...DATA.extras.map(e => ({ ...e, t: 'extra' }))
    ].sort((a, b) => a.zIndex - b.zIndex);

    allStatic.forEach(l => {
        const img = document.createElement('img');
        img.className = 'layer static-layer';
        img.dataset.id = l.id;
        img.style.zIndex = l.zIndex;
        img.style.display = 'none';

        // ✅ OTIMIZAÇÃO: Aceleração GPU
        img.style.willChange = 'transform, opacity';
        img.style.transform = 'translate3d(0, 0, 0)';

        wrap.appendChild(img);
        staticLayerEls[l.id] = img;
    });
}

/**
 * Aplica contenção automática a uma imagem upload após carregamento
 * Garante que a imagem cabe dentro dos limites calibrados da zona
 * ✨ NOVO: Desabilita contenção quando a imagem está ampliada (scale > 1.0)
 */
function applyImageContainment(divElement, zoneData, imageElement) {
    const wrapperRect = document.querySelector('.simulator-wrapper').getBoundingClientRect();
    const divRect = divElement.getBoundingClientRect();

    if (!divRect.width || !divRect.height) return; // Aguardando carregamento

    // 🎯 DETECTAR SE ESTÁ EM MODO ZOOM - Se sim, pular contenção de tamanho
    const uploadId = divElement.dataset.id;
    const currentScale = state.uploads[uploadId]?.scale || 1.0;
    const isZooming = currentScale > 1.0;

    // Calcular dimensões reais em percentual
    let realWidthPct = (divRect.width / wrapperRect.width) * 100;
    let realHeightPct = (divRect.height / wrapperRect.height) * 100;

    // Obter limites calibrados
    let zone = zoneData;
    if (!zone && divElement.dataset.category) {
        zone = DATA.categories.find(c => c.id === divElement.dataset.category);
    }

    if (!zone || !zone.width || !zone.height) return;

    // ✨ PULAR REDUÇÃO AUTOMÁTICA DE SCALE SE ESTIVER EM MODO ZOOM
    if (!isZooming) {
        // Limites com tolerância de 5%
        const maxZoneWidth = parseFloat(zone.width);
        const maxZoneHeight = parseFloat(zone.height);
        const tolerance = 1.05;
        const limitWidth = maxZoneWidth * tolerance;
        const limitHeight = maxZoneHeight * tolerance;

        // Verificar se excede limites
        if (realWidthPct > limitWidth || realHeightPct > limitHeight) {
            // Calcular fator de escala necessário
            const scaleX = limitWidth / realWidthPct;
            const scaleY = limitHeight / realHeightPct;
            const scaleFactor = Math.min(scaleX, scaleY);

            // Extrair transformações atuais
            const currentTransform = divElement.style.transform || '';
            const rotationMatch = currentTransform.match(/rotate\(([^)]+)\)/);
            const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);

            const currentRotation = rotationMatch ? rotationMatch[1] : '0deg';
            const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1.0;

            // Aplicar novo scale (clamped)
            const newScale = currentScale * scaleFactor;
            divElement.style.transform = `translate(-50%, -50%) rotate(${currentRotation}) scale(${newScale})`;

            // Atualizar state
            if (state.uploads[uploadId]) {
                state.uploads[uploadId].scale = newScale;
            }
        }
    }

    // Verificar e corrigir posição se estiver fora dos limites
    const currentPosX = parseFloat(divElement.style.left);
    const currentPosY = parseFloat(divElement.style.top);

    const elemWidthPct = (divRect.width / wrapperRect.width) * 100;
    const elemHeightPct = (divRect.height / wrapperRect.height) * 100;

    // 🎯 Usar isZooming já detectado anteriormente
    const bounded = applyBoundaryLimits(
        currentPosX,
        currentPosY,
        elemWidthPct,
        elemHeightPct,
        divElement.dataset.id,
        divElement.dataset.category,
        isZooming  // ✨ Passa true quando scale > 1.0
    );

    if (bounded.x !== currentPosX || bounded.y !== currentPosY) {
        divElement.style.left = bounded.x + '%';
        divElement.style.top = bounded.y + '%';

        // Atualizar state
        if (state.uploads[uploadId]) {
            state.uploads[uploadId].x = bounded.x + '%';
            state.uploads[uploadId].y = bounded.y + '%';
        }
    }
}

/**
 * Atualiza todas as camadas visuais com base no estado atual
 */
function updateVisuals() {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    // RESTORED: Ajuste vertical Wrapper para Legging (Lógica do Backup)
    // Isso garante que o short suba para não cortar a legging
    if (state.extras && state.extras['calca_legging'] && state.extras['calca_legging'].enabled) {
        wrap.classList.add('calca-legging-active');
    } else {
        wrap.classList.remove('calca-legging-active');
    }

    // 1. Atualizar camadas estáticas
    const allStatic = [
        ...DATA.parts.map(p => ({ ...p, t: 'part' })),
        ...DATA.extras.map(e => ({ ...e, t: 'extra' }))
    ];

    allStatic.forEach(async (l) => {
        const img = staticLayerEls[l.id];
        if (!img) return;

        const isEnabled = l.t === 'part' || (state.extras[l.id] && state.extras[l.id].enabled);
        if (isEnabled) {
            const color = l.t === 'extra' ? state.extras[l.id].color : state.parts[l.id];

            const colorFileMap = {
                'verde_limao': 'Verdelimao',
                'verde_musgo': 'Verdemusgo',
                'azul_claro': 'AzulClaro',
                'azul_escuro': 'AzulEscuro',
                'verde_bandeira': 'VerdeBandeira',
                'rosa_pink': 'RosaPink',
                'rosa': 'RosaBebe',
                'marsala': 'Marsala',
                'cinza': 'Prata'
            };

            // Defensive check: ensure color is defined
            let formattedColor = colorFileMap[color] || (color ? color.split(/[ _]/).map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join('') : 'Preto');

            // Lógica especial para logo_hnt (HNTCósPerna)
            if (l.id === 'logo_hnt') {
                // Para logo_hnt, rosa_pink usa arquivo "Rosa" e rosa usa "RosaPink"
                if (color === 'rosa') formattedColor = 'RosaPink';
                else if (color === 'rosa_pink') formattedColor = 'Rosa';

                // Remover acentos para compatibilidade com arquivos (ex: Verdelimão -> Verdelimao)
                formattedColor = formattedColor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }

            const sigla = l.siglaSub || '';
            const filename = `Sh${sigla}${formattedColor}.png`;
            const src = `assets/${l.folder}/${filename}`;

            // ✅ OTIMIZAÇÃO: Carregamento seguro com fallback
            if (typeof AssetLoader !== 'undefined') {
                const validSrc = await AssetLoader.loadSafe(src);
                if (img.src !== validSrc) img.src = validSrc;
            } else {
                if (img.src !== src) img.src = src;
            }

            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
    });

    // 2. Atualizar Elementos Dinâmicos (Uploads e Textos)
    // Remover camadas dinâmicas existentes para reconstruir
    wrap.querySelectorAll('.dynamic-layer').forEach(el => el.remove());

    const frag = document.createDocumentFragment();

    // Renderizar Uploads
    DATA.uploadZones.forEach(z => {
        // --- DYNAMIC CALIBRATION LOGIC (Right Leg Zones) ---
        if ((z.id === 'leg_right_mid_ie' || z.id === 'leg_right_mid_ii' ||
            z.id === 'leg_right_bottom_ie' || z.id === 'leg_right_bottom_ii') && z.calibrationVariants) {
            const midHasImg = state.uploads['leg_right_mid_ie']?.src || state.uploads['leg_right_mid']?.src || state.uploads['leg_right_mid_ii']?.src;
            const bottomHasImg = state.uploads['leg_right_bottom_ie']?.src || state.uploads['leg_right_bottom']?.src || state.uploads['leg_right_bottom_ii']?.src;
            const bottomHasText = state.texts['text_leg_right_bottom'] && state.texts['text_leg_right_bottom'].text && state.texts['text_leg_right_bottom'].text.trim() !== "";

            // Logic mirrors getLimitImage:
            // IE Condition: (Mid=Img AND Bottom=Text)
            // II Condition: (Mid=Img AND Bottom=Img) OR (No Mid Img)

            let variantKey = 'IE'; // Default

            if (!midHasImg) variantKey = 'II';
            else if (midHasImg && bottomHasImg) variantKey = 'II';
            // else if (midHasImg && bottomHasText) variantKey = 'IE'; (Already default)

            const variant = z.calibrationVariants[variantKey];
            if (variant) {
                // Apply variant properties to the active zone object (mutating for this render)
                z.width = variant.width;
                z.height = variant.height;
                z.cssTop = variant.cssTop;
                if (variant.cssLeft) z.cssLeft = variant.cssLeft;
            }
        }

        const u = state.uploads[z.id];
        if (u && u.src) {
            // Parse stored coordinates OR use CALIBRATED zone position
            let posX = parseFloat(u.x) || parseFloat(z.cssLeft) || 50;
            let posY = parseFloat(u.y) || parseFloat(z.cssTop) || 50;

            const div = document.createElement('div');
            div.className = 'absolute-item draggable dynamic-layer';
            div.dataset.id = z.id;
            div.dataset.type = 'upload';
            div.dataset.category = z.category;
            div.style.left = posX + '%';
            div.style.top = posY + '%';
            div.style.zIndex = z.zIndex || 1000; // Usar z-index dinâmico da zona

            // ✅ IMPROVED: Calcular largura inicial baseada na zona com melhores fallbacks
            let initialWidth = 20; // Fallback final
            if (z.width) {
                initialWidth = parseFloat(z.width);

                // Se temos altura da zona, considerar aspect ratio para melhor ajuste
                if (z.height && u.aspectRatio) {
                    const zoneAspect = parseFloat(z.width) / parseFloat(z.height);
                    const imgAspect = u.aspectRatio;

                    if (imgAspect > zoneAspect) {
                        // Imagem mais larga - limitar por largura
                        initialWidth = parseFloat(z.width) * 0.9; // 90% do limite
                    } else {
                        // Imagem mais alta - calcular largura baseada na altura
                        initialWidth = (parseFloat(z.height) * imgAspect) * 0.9;
                    }
                }
            } else if (z.xMax && z.xMin) {
                // Fallback para limites legados
                const availableWidth = z.xMax - z.xMin;
                initialWidth = availableWidth * 0.8;
            }

            div.style.width = Math.min(initialWidth, 40) + '%'; // Nunca maior que 40%

            // ✅ OTIMIZAÇÃO: Aceleração GPU para drag suave
            div.style.willChange = 'transform';
            div.style.transform = `translate(-50%, -50%) rotate(${u.rotation}deg) scale(${u.scale})`;

            const img = document.createElement('img');
            img.src = u.src;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.pointerEvents = 'none';

            // ✅ CRITICAL FIX: Aplicar contenção após carregamento da imagem
            img.onload = () => {
                applyImageContainment(div, z, img);
                // Após ajuste, mudar para GPU-optimized transform
                const currentTransform = div.style.transform;
                if (currentTransform && currentTransform.includes('translate(-50%')) {
                    div.style.transform = currentTransform.replace('translate(-50%, -50%)', 'translate3d(-50%, -50%, 0)');
                }
            };

            div.appendChild(img);
            frag.appendChild(div);
        }
    });

    // Renderizar Textos
    DATA.textZones.forEach(z => {
        const t = state.texts[z.id];
        if (t && t.enabled && t.content) {
            const div = document.createElement('div');
            div.className = 'absolute-item draggable dynamic-layer';
            div.dataset.id = z.id;
            div.dataset.type = 'text';
            div.dataset.category = z.category;
            div.style.left = t.x;
            div.style.top = t.y;
            div.style.zIndex = 2000;

            const span = document.createElement('span');
            span.innerText = t.content.replace(/\//g, '\n');
            span.style.whiteSpace = 'pre-wrap';
            span.style.fontFamily = `'${t.fontFamily || 'Outfit'}'`;
            span.style.color = t.color;
            span.style.fontSize = '2rem';
            span.style.display = '-webkit-box';
            span.style.WebkitBoxOrient = 'vertical';
            span.style.textAlign = 'center';
            span.style.lineHeight = '1.2';

            const rotation = (dataCache.textZonesById && dataCache.textZonesById.get(z.id)?.defaultRotation) || 0;

            // ✅ OTIMIZAÇÃO: Aceleração GPU para drag suave
            div.style.willChange = 'transform';
            div.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotation}deg) scale(${t.scale})`;

            div.appendChild(span);
            frag.appendChild(div);
        }
    });

    // Check for right leg mode changes and notify user
    checkRightLegNotifications();

    // Re-aplicar overlays de limites ativos
    refreshActiveLimits();

    wrap.appendChild(frag);
}

/**
 * Helper: Get current right leg mode (IE or II)
 */
function getRightLegMode() {
    const centerImg = state.uploads['leg_right_mid_ie']?.src || state.uploads['leg_right_mid_ii']?.src || state.uploads['leg_right_mid']?.src;
    const bottomImg = state.uploads['leg_right_bottom_ie']?.src || state.uploads['leg_right_bottom_ii']?.src || state.uploads['leg_right_bottom']?.src;
    return (centerImg && bottomImg) ? 'II' : 'IE';
}

let previousRightLegMode = 'IE';

/**
 * Check and notify user when right leg mode changes
 */
function checkRightLegNotifications() {
    const currentMode = getRightLegMode();
    if (currentMode !== previousRightLegMode) {
        if (currentMode === 'II') {
            alert("⚠️ Atenção: Limites de área alterados. ⚠️\n\nA inserção de uma imagem neste campo reduzirá automaticamente o espaço disponível no \"Centro da Perna\". Verifique seu layout.\n\nSe você precisa de uma imagem maior no centro, utilize apenas texto aqui na parte inferior.");
        } else if (previousRightLegMode === 'II' && currentMode === 'IE') {
            alert("ℹ️ Área do 'Centro da Perna' restaurada. O limite de tamanho voltou ao padrão. Agora você pode aumentar sua imagem.");
        }
        previousRightLegMode = currentMode;
    }
}

// ------------------- LIMIT LOGIC (Restored) -------------------

function getLimitImage(zoneId) {
    const basePath = 'assets/Shorts/Limites/';

    // 1. Determine Color Context (Dark -> Br_, Light -> Pr_)
    let contextPartId = 'lateral_esq';
    if (zoneId.includes('centro') || zoneId.includes('perna')) {
        contextPartId = 'centro';
    }
    if (zoneId.includes('lat_dir') || zoneId.includes('lat_esq')) contextPartId = 'lateral_esq';

    const colorId = state.parts[contextPartId] || 'preto';
    const lightColors = ['branco', 'amarelo', 'rosa', 'dourado', 'prata', 'neon', 'caqui', 'bege'];

    // RESTORED PREFIX LOGIC: Dark base -> White lines (Br_Lmte_), Light base -> Black lines (Pr_Lmte_)
    const prefix = lightColors.includes(colorId) ? 'Pr_Lmte_' : 'Br_Lmte_';

    // 2. Determine Filename
    let suffix = '';

    // Clean suffixes from ID to find base type
    let cleanZoneId = zoneId;
    let variant = 'IE'; // Default variant

    if (zoneId.endsWith('_ii')) { variant = 'II'; cleanZoneId = zoneId.replace('_ii', ''); }
    if (zoneId.endsWith('_ie')) { variant = 'IE'; cleanZoneId = zoneId.replace('_ie', ''); }

    // MAPPING TO OLD FILENAMES (Backup Restoration)
    if (cleanZoneId.includes('logo_lat_dir') || cleanZoneId.includes('text_lat_dir')) suffix = 'lat_direita.png';
    else if (cleanZoneId.includes('logo_lat_esq') || cleanZoneId.includes('text_lat_esq')) suffix = 'lat_esquerda.png';
    else if (cleanZoneId.includes('logo_centro') || cleanZoneId.includes('text_centro')) suffix = 'Centro.png';

    // Leg Right Logic
    else if (cleanZoneId.includes('leg_right_mid')) {
        suffix = `Perna_dir_Img_Cent_${variant}.png`;
    }
    else if (cleanZoneId.includes('leg_right_bottom')) {
        suffix = `Perna_dir_Img_Inf_${variant}.png`;
    }

    // Leg Left Logic
    else if (cleanZoneId.includes('leg_left') || cleanZoneId.includes('text_leg_left')) {
        suffix = `Perna_esq_Img_Cent_${variant}.png`;
    }

    if (!suffix) return null;
    return basePath + prefix + suffix;
}

window.toggleLimit = function (zoneId, show) {
    // If it's a text zone ID, map to upload zone
    if (zoneId.startsWith('text_')) {
        if (zoneId.includes('leg_right_mid')) zoneId = 'leg_right_mid_ie'; // default to IE for limit toggling context if generic
        else if (zoneId.includes('leg_right_bottom')) zoneId = 'leg_right_bottom_ie';
        else zoneId = zoneId.replace('text_', 'logo_');
    }

    // Force boolean if not provided
    if (typeof show !== 'boolean') {
        show = !state.limits[zoneId];
    }

    state.limits[zoneId] = show;
    updateLimitOverlay(zoneId);
}

function updateLimitOverlay(zoneId) {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    let overlay = document.getElementById(`limit-overlay-${zoneId}`);

    if (state.limits[zoneId]) {
        // CREATE or UPDATE
        if (!overlay) {
            overlay = document.createElement('img');
            overlay.id = `limit-overlay-${zoneId}`;
            overlay.className = 'layer limit-layer';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '500'; // High z-index
            wrap.appendChild(overlay);
        }

        const src = getLimitImage(zoneId);
        if (src && overlay.src !== src) {
            overlay.src = src;
        }
        overlay.style.display = 'block';
    } else {
        // HIDE
        if (overlay) overlay.style.display = 'none';
    }
}

// Call this when colors change to update active limits
window.refreshActiveLimits = function () {
    if (!state.limits) return;
    Object.keys(state.limits).forEach(zid => {
        if (state.limits[zid]) updateLimitOverlay(zid);
    });
}

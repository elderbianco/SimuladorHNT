/**
 * Módulo de Interações (Arrastar, Zoom e Pan) - Shorts
 */

// Helper: detecta se está em dispositivo mobile/touch
function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth <= 768);
}

function setZoom(val) {
    if (val < 0.5) val = 0.5;
    if (val > 6.0) val = 6.0;
    state.zoom = val;
    currentZoom = val;
    applyZoomAndPan();
}

function applyZoomAndPan() {
    const container = document.getElementById('zoom-container');
    if (container) {
        container.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
    }
}

function setupViewportPan() {
    const viewport = document.querySelector('.simulator-area');
    if (!viewport) return;

    viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.draggable')) return;
        isPanning = true;
        panStart.x = e.clientX - panOffset.x;
        panStart.y = e.clientY - panOffset.y;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panOffset.x = e.clientX - panStart.x;
        panOffset.y = e.clientY - panStart.y;
        applyZoomAndPan();
    });

    window.addEventListener('mouseup', () => { isPanning = false; });

    viewport.addEventListener('touchstart', (e) => {
        if (e.target.closest('.draggable')) return;
        if (e.touches.length === 1) {
            isPanning = true;
            const touch = e.touches[0];
            panStart.x = touch.clientX - panOffset.x;
            panStart.y = touch.clientY - panOffset.y;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isPanning || e.touches.length !== 1) return;
        e.preventDefault();
        const touch = e.touches[0];
        panOffset.x = touch.clientX - panStart.x;
        panOffset.y = touch.clientY - panStart.y;
        applyZoomAndPan();
    }, { passive: false });

    window.addEventListener('touchend', () => { isPanning = false; });

    viewport.addEventListener('wheel', (e) => {
        if (isMobile()) return; // Lock zoom scroll on mobile
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const oldZoom = currentZoom;
        let newZoom = currentZoom + delta;

        if (newZoom < 0.5) newZoom = 0.5;
        if (newZoom > 6.0) newZoom = 6.0;

        if (newZoom !== oldZoom) {
            const rect = viewport.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const mouseX = (e.clientX - rect.left) - centerX;
            const mouseY = (e.clientY - rect.top) - centerY;

            panOffset.x = mouseX - (mouseX - panOffset.x) * (newZoom / oldZoom);
            panOffset.y = mouseY - (mouseY - panOffset.y) * (newZoom / oldZoom);

            currentZoom = newZoom;
            state.zoom = newZoom;
            applyZoomAndPan();
        }
    }, { passive: false });
}

// FUNÇÃO CENTRALIZADA: Aplicar Limites de Contenção (Suporta Rotação OBB)
// ✨ NOVO: Expande limites em 30% quando isZooming = true
function applyBoundaryLimits(pctX, pctY, elementWidthPct, elementHeightPct, zoneId, category, isZooming = false) {
    const halfW = elementWidthPct / 2;
    const halfH = elementHeightPct / 2;

    // 🎯 EXPANSÃO CONTROLADA: 30% em CADA lado = fator 1.6
    const expansionFactor = isZooming ? 1.60 : 1.0;

    // Buscar limites
    let limit = null;
    if (typeof DATA !== 'undefined') {
        limit = (DATA.uploadZones ? DATA.uploadZones.find(z => z.id === zoneId) : null) ||
            (DATA.textZones ? DATA.textZones.find(z => z.id === zoneId) : null);

        if (!limit && category && DATA.categories) {
            limit = DATA.categories.find(c => c.id === category);
        }
    }

    if (!limit) return { x: pctX, y: pctY };

    // ---------------------------------------------------------
    // LOGIC A: ROTATED ZONES (OBB - Oriented Bounding Box)
    // ---------------------------------------------------------
    // STRICT BACKUP BEHAVIOR: 'limit.defaultRotation &&' excludes 0.
    if (limit.defaultRotation && limit.width && limit.height && limit.cssLeft && limit.cssTop) {
        const wrapper = document.querySelector('.simulator-wrapper');
        const rect = wrapper.getBoundingClientRect();

        const zCx = (parseFloat(limit.cssLeft) / 100) * rect.width;
        const zCy = (parseFloat(limit.cssTop) / 100) * rect.height;
        const zW = (parseFloat(limit.width) / 100) * rect.width * expansionFactor;
        const zH = (typeof limit.height === 'string' ? parseFloat(limit.height) : limit.height) / 100 * rect.height * expansionFactor;

        const pX = (pctX / 100) * rect.width;
        const pY = (pctY / 100) * rect.height;

        const angleRad = limit.defaultRotation * (Math.PI / 180);
        const cosA = Math.cos(-angleRad);
        const sinA = Math.sin(-angleRad);

        const dx = pX - zCx;
        const dy = pY - zCy;

        const localX = dx * cosA - dy * sinA;
        const localY = dx * sinA + dy * cosA;

        const elW_px = (elementWidthPct / 100) * rect.width;
        const elH_px = (elementHeightPct / 100) * rect.height;

        let xLimit = (zW / 2) - (elW_px / 2);
        let yLimit = (zH / 2) - (elH_px / 2);

        // STRICT LOCK: If element bigger than zone, allow movement if zooming
        if (xLimit < 0) {
            if (isZooming) xLimit = Math.abs(xLimit);
            else xLimit = 0;
        }
        if (yLimit < 0) {
            if (isZooming) yLimit = Math.abs(yLimit);
            else yLimit = 0;
        }

        const clampedLocalX = Math.max(-xLimit, Math.min(localX, xLimit));
        const clampedLocalY = Math.max(-yLimit, Math.min(localY, yLimit));

        const cosB = Math.cos(angleRad);
        const sinB = Math.sin(angleRad);

        const finalPxX = (clampedLocalX * cosB - clampedLocalY * sinB) + zCx;
        const finalPxY = (clampedLocalX * sinB + clampedLocalY * cosB) + zCy;

        let resX = (finalPxX / rect.width) * 100;
        let resY = (finalPxY / rect.height) * 100;

        return { x: resX, y: resY };
    }

    // ---------------------------------------------------------
    // LOGIC B: NON-ROTATED ZONES (Center-Based Logic)
    // ---------------------------------------------------------
    // Use Real Dimensions (width/height) derived logic if available

    // Prefer "cssLeft/cssTop" + "width/height" from Data if strictly available
    // OR "x/y" + "width/height" (Backup Format)
    let zCx = null, zCy = null, zW = null, zH = null;

    if (limit.width) {
        if (limit.cssLeft && limit.cssTop) {
            zCx = parseFloat(limit.cssLeft);
            zCy = parseFloat(limit.cssTop);
        } else if (limit.x !== undefined && limit.y !== undefined) {
            zCx = parseFloat(limit.x);
            zCy = parseFloat(limit.y);
        }

        zW = parseFloat(limit.width) * expansionFactor;
        zH = (limit.height ? parseFloat(limit.height) : (zW / expansionFactor * 0.8)) * expansionFactor;
    }

    if (zCx !== null && zCy !== null && zW !== null) {
        const halfZw = zW / 2;
        const halfZh = zH / 2;

        let minX = zCx - halfZw + halfW;
        let maxX = zCx + halfZw - halfW;
        let minY = zCy - halfZh + halfH;
        let maxY = zCy + halfZh - halfH;

        // STRICT LOCK: If Min > Max (Element > Zone), Lock to Center unless zooming
        if (minX > maxX) {
            if (isZooming) { const temp = minX; minX = maxX; maxX = temp; }
            else { minX = zCx; maxX = zCx; }
        }
        if (minY > maxY) {
            if (isZooming) { const temp = minY; minY = maxY; maxY = temp; }
            else { minY = zCy; maxY = zCy; }
        }

        let finalX = Math.max(minX, Math.min(maxX, pctX));
        let finalY = Math.max(minY, Math.min(maxY, pctY));

        return { x: finalX, y: finalY };
    }

    // ---------------------------------------------------------
    // LOGIC C: LEGACY FALLBACK (Edge-Based xMin/xMax)
    // ---------------------------------------------------------
    let finalX = pctX;
    let finalY = pctY;

    if (limit.xMin !== undefined && limit.xMax !== undefined) {
        const expandedRange = (limit.xMax - limit.xMin) * (expansionFactor - 1.0) / 2;
        const minCenter = (limit.xMin - expandedRange) + halfW;
        const maxCenter = (limit.xMax + expandedRange) - halfW;

        if (minCenter > maxCenter) {
            if (isZooming) { const temp = minCenter; minCenter = maxCenter; maxCenter = temp; }
            else finalX = (limit.xMin + limit.xMax) / 2;
        }

        finalX = Math.max(minCenter, Math.min(finalX, maxCenter));
    }

    if (limit.yMin !== undefined && limit.yMax !== undefined) {
        const expandedRange = (limit.yMax - limit.yMin) * (expansionFactor - 1.0) / 2;
        const minCenter = (limit.yMin - expandedRange) + halfH;
        const maxCenter = (limit.yMax + expandedRange) - halfH;

        if (minCenter > maxCenter) {
            if (isZooming) { const temp = minCenter; minCenter = maxCenter; maxCenter = temp; }
            else finalY = (limit.yMin + limit.yMax) / 2;
        }

        finalY = Math.max(minCenter, Math.min(finalY, maxCenter));
    }

    return { x: finalX, y: finalY };
}

function setupDragDrop() {
    const wrap = document.querySelector('.simulator-viewport');
    if (!wrap) return;

    let dragStartPos = { x: 0, y: 0 };
    let isDraggingConfirmed = false;
    let dragItemDims = { width: 0, height: 0 };

    wrap.addEventListener('mousedown', (e) => {
        const draggable = e.target.closest('.draggable');
        if (draggable) {
            // ✅ DEBUG: Log drag initiation
            console.log('🎯 Drag iniciado:', {
                id: draggable.dataset.id,
                type: draggable.dataset.type,
                initialPos: { x: draggable.style.left, y: draggable.style.top },
                dimensions: {
                    width: draggable.getBoundingClientRect().width,
                    height: draggable.getBoundingClientRect().height
                }
            });

            dragItem = draggable;
            const rect = dragItem.getBoundingClientRect();
            dragStartPos = { x: e.clientX, y: e.clientY };
            isDraggingConfirmed = false;
            dragItemDims = { width: rect.width, height: rect.height };
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            currentWrapperRect = document.querySelector('.simulator-wrapper').getBoundingClientRect();
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragItem) return;
        if (!isDraggingConfirmed) {
            const dx = Math.abs(e.clientX - dragStartPos.x);
            const dy = Math.abs(e.clientY - dragStartPos.y);
            if (dx < 3 && dy < 3) return;
            isDraggingConfirmed = true;
        }
        e.preventDefault();

        let x = e.clientX - currentWrapperRect.left - dragOffset.x + (dragItemDims.width / 2);
        let y = e.clientY - currentWrapperRect.top - dragOffset.y + (dragItemDims.height / 2);
        let pctX = (x / currentWrapperRect.width) * 100;
        let pctY = (y / currentWrapperRect.height) * 100;

        const type = dragItem.dataset.type;
        const id = dragItem.dataset.id;

        // 🎯 DETECTAR SE ESTÁ EM MODO ZOOM para permitir expansão de limites
        const isZooming = type === 'upload' && state.uploads[id] && state.uploads[id].scale > 1.0;

        const bounded = applyBoundaryLimits(
            pctX,
            pctY,
            (dragItemDims.width / currentWrapperRect.width) * 100,
            (dragItemDims.height / currentWrapperRect.height) * 100,
            dragItem.dataset.id,
            dragItem.dataset.category,
            isZooming  // ✨ Permite expansão de 20% quando ampliado
        );

        dragItem.style.left = bounded.x + '%';
        dragItem.style.top = bounded.y + '%';

        if (type === 'text') { state.texts[id].x = bounded.x + '%'; state.texts[id].y = bounded.y + '%'; }
        if (type === 'upload') { state.uploads[id].x = bounded.x + '%'; state.uploads[id].y = bounded.y + '%'; }
    });

    window.addEventListener('mouseup', () => { dragItem = null; });

    // No mobile, imagens são estáticas — drag por touch desabilitado
    if (!isMobile()) {
        wrap.addEventListener('touchstart', (e) => {
            const draggable = e.target.closest('.draggable');
            if (draggable) {
                dragItem = draggable;
                const touch = e.touches[0];
                const rect = dragItem.getBoundingClientRect();
                dragStartPos = { x: touch.clientX, y: touch.clientY };
                isDraggingConfirmed = false;
                dragItemDims = { width: rect.width, height: rect.height };
                dragOffset.x = touch.clientX - rect.left;
                dragOffset.y = touch.clientY - rect.top;
                currentWrapperRect = document.querySelector('.simulator-wrapper').getBoundingClientRect();
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!dragItem) return;
            const touch = e.touches[0];
            if (!isDraggingConfirmed) {
                const dx = Math.abs(touch.clientX - dragStartPos.x);
                const dy = Math.abs(touch.clientY - dragStartPos.y);
                if (dx < 3 && dy < 3) return;
                isDraggingConfirmed = true;
            }
            e.preventDefault();

            let x = touch.clientX - currentWrapperRect.left - dragOffset.x + (dragItemDims.width / 2);
            let y = touch.clientY - currentWrapperRect.top - dragOffset.y + (dragItemDims.height / 2);
            let pctX = (x / currentWrapperRect.width) * 100;
            let pctY = (y / currentWrapperRect.height) * 100;

            const type = dragItem.dataset.type;
            const id = dragItem.dataset.id;

            const isZooming = type === 'upload' && state.uploads[id] && state.uploads[id].scale > 1.0;

            const bounded = applyBoundaryLimits(
                pctX,
                pctY,
                (dragItemDims.width / currentWrapperRect.width) * 100,
                (dragItemDims.height / currentWrapperRect.height) * 100,
                dragItem.dataset.id,
                dragItem.dataset.category,
                isZooming
            );

            dragItem.style.left = bounded.x + '%';
            dragItem.style.top = bounded.y + '%';

            if (type === 'text') { state.texts[id].x = bounded.x + '%'; state.texts[id].y = bounded.y + '%'; }
            if (type === 'upload') { state.uploads[id].x = bounded.x + '%'; state.uploads[id].y = bounded.y + '%'; }
        }, { passive: false });

        window.addEventListener('touchend', () => { dragItem = null; });
    }
}

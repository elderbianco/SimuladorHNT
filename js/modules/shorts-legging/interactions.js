/**
 * Módulo de Interações (Arrastar, Zoom e Pan) - Shorts Legging
 */

// Helper: detecta se está em dispositivo mobile/touch
function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth <= 768);
}

/**
 * Atualiza o nível de zoom
 */
function setZoom(val) {
    if (val < 0.5) val = 0.5;
    if (val > 2.0) val = 2.0;
    state.zoom = val;
    currentZoom = val;
    applyZoomAndPan();
}

/**
 * Configura o arraste e zoom do viewport principal
 */
function setupViewportPan() {
    const viewport = document.querySelector('.simulator-viewport');
    if (!viewport) return;

    viewport.addEventListener('mousedown', (e) => {
        // Não inicia pan se estiver clicando em elemento arrastável
        if (e.target.closest('.custom-element') || e.target.closest('.fixed-text-layer') || e.target.closest('.draggable')) {
            return;
        }
        isPanning = true;
        panStart.x = e.clientX - panOffset.x;
        panStart.y = e.clientY - panOffset.y;
        viewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panOffset.x = e.clientX - panStart.x;
        panOffset.y = e.clientY - panStart.y;
        applyZoomAndPan();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            viewport.style.cursor = '';
        }
    });

    // Touch Events (Mobile)
    viewport.addEventListener('touchstart', (e) => {
        if (e.target.closest('.custom-element') || e.target.closest('.fixed-text-layer')) return;
        if (e.touches.length === 1) {
            isPanning = true;
            const touch = e.touches[0];
            panStart.x = touch.clientX - panOffset.x;
            panStart.y = touch.clientY - panOffset.y;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isPanning || e.touches.length !== 1) return;
        const touch = e.touches[0];
        panOffset.x = touch.clientX - panStart.x;
        panOffset.y = touch.clientY - panStart.y;
        applyZoomAndPan();
    }, { passive: false });

    window.addEventListener('touchend', () => { isPanning = false; });

    // Mouse Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
        if (isMobile()) return; // Lock zoom scroll on mobile
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const oldZoom = currentZoom;
        let newZoom = currentZoom + delta;

        if (newZoom < 0.5) newZoom = 0.5;
        if (newZoom > 2.0) newZoom = 2.0;

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

/**
 * Configura o sistema global de arraste de elementos
 */
function setupGlobalDrag() {
    const wrap = document.querySelector('.simulator-viewport');
    const wrapper = document.querySelector('.simulator-wrapper');
    if (!wrap || !wrapper) return;

    const startDrag = (e, isTouch = false) => {
        const item = e.target.closest('.custom-element') || e.target.closest('.fixed-text-layer') || e.target.closest('.draggable');
        if (item) {
            dragItem = item;
            const clientX = isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = isTouch ? e.touches[0].clientY : e.clientY;
            const rect = dragItem.getBoundingClientRect();
            dragOffset.x = clientX - rect.left;
            dragOffset.y = clientY - rect.top;
            currentWrapperRect = wrapper.getBoundingClientRect();
            if (!isTouch) e.preventDefault();
        }
    };

    const moveDrag = (e, isTouch = false) => {
        if (!dragItem) return;
        if (!isTouch) e.preventDefault();

        currentWrapperRect = wrapper.getBoundingClientRect();
        const zoom = currentZoom || 1;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        // Calcula posição relativa ao wrapper, compensando o zoom
        let x = (clientX - currentWrapperRect.left) / zoom - (dragOffset.x / zoom) + (dragItem.offsetWidth / 2);
        let y = (clientY - currentWrapperRect.top) / zoom - (dragOffset.y / zoom) + (dragItem.offsetHeight / 2);

        const actualWidth = currentWrapperRect.width / zoom;
        const actualHeight = currentWrapperRect.height / zoom;

        let pctX = (x / actualWidth) * 100;
        let pctY = (y / actualHeight) * 100;

        // Aplica limites de zona
        const boundaries = getZoneBoundaries(dragItem);
        if (boundaries) {
            pctX = Math.max(boundaries.minX, Math.min(boundaries.maxX, pctX));
            pctY = Math.max(boundaries.minY, Math.min(boundaries.maxY, pctY));
        }

        dragItem.style.left = pctX + '%';
        dragItem.style.top = pctY + '%';

        // Atualiza estado se for um elemento persistente (como textos fixos)
        const zoneId = dragItem.dataset.zone || dragItem.dataset.parentZone;
        if (zoneId && state.texts[zoneId]) {
            state.texts[zoneId].x = pctX;
            state.texts[zoneId].y = pctY;
        }
    };

    const endDrag = () => { dragItem = null; };

    wrap.addEventListener('mousedown', (e) => startDrag(e));
    window.addEventListener('mousemove', (e) => moveDrag(e));
    window.addEventListener('mouseup', endDrag);

    // No mobile, imagens são estáticas — drag por touch desabilitado
    if (!isMobile()) {
        wrap.addEventListener('touchstart', (e) => startDrag(e, true), { passive: false });
        window.addEventListener('touchmove', (e) => moveDrag(e, true), { passive: false });
        window.addEventListener('touchend', endDrag);
    }
}

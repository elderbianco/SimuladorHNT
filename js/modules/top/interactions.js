/**
 * Módulo de Interações - Top
 */

// Helper: detecta se está em dispositivo mobile/touch
function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth <= 768);
}

function setZoom(val) {
    if (val < 0.5) val = 0.5; if (val > 2.0) val = 2.0;
    state.zoom = val; currentZoom = val; applyZoomAndPan();
}

function setupViewportPan() {
    const vp = document.querySelector('.simulator-viewport'); if (!vp) return;
    vp.addEventListener('mousedown', (e) => {
        if (state.isLocked) return;
        if (e.target.closest('.custom-element')) return;
        isPanning = true; panStart.x = e.clientX - panOffset.x; panStart.y = e.clientY - panOffset.y;
        vp.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return; panOffset.x = e.clientX - panStart.x; panOffset.y = e.clientY - panStart.y;
        applyZoomAndPan();
    });
    window.addEventListener('mouseup', () => { isPanning = false; vp.style.cursor = ''; });

    // TOUCH PANNING
    vp.addEventListener('touchstart', (e) => {
        if (state.isLocked) return;
        if (e.target.closest('.custom-element')) return;
        if (e.touches.length === 1) {
            isPanning = true; const t = e.touches[0];
            panStart.x = t.clientX - panOffset.x; panStart.y = t.clientY - panOffset.y;
        }
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
        if (!isPanning || e.touches.length !== 1) return;
        const t = e.touches[0];
        panOffset.x = t.clientX - panStart.x; panOffset.y = t.clientY - panStart.y;
        applyZoomAndPan();
    }, { passive: false });
    window.addEventListener('touchend', () => { isPanning = false; });
    vp.addEventListener('wheel', (e) => {
        if (state.isLocked || isMobile()) return; // Lock zoom scroll on mobile
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const old = currentZoom; currentZoom = Math.max(0.5, Math.min(2.0, currentZoom + delta));
        if (currentZoom !== old) {
            const rect = vp.getBoundingClientRect();
            const mx = (e.clientX - rect.left) - (rect.width / 2);
            const my = (e.clientY - rect.top) - (rect.height / 2);
            panOffset.x = mx - (mx - panOffset.x) * (currentZoom / old);
            panOffset.y = my - (my - panOffset.y) * (currentZoom / old);
            state.zoom = currentZoom; applyZoomAndPan();
        }
    }, { passive: false });
}

function setupGlobalDrag() {
    const vp = document.querySelector('.simulator-viewport');
    const vw = document.querySelector('.simulator-wrapper');
    if (!vp || !vw) return;

    const onStart = (e, touch) => {
        const item = e.target.closest('.custom-element');
        if (item) {
            dragItem = item;
            const clientX = touch ? e.touches[0].clientX : e.clientX;
            const clientY = touch ? e.touches[0].clientY : e.clientY;
            const rect = dragItem.getBoundingClientRect();
            dragOffset.x = clientX - rect.left; dragOffset.y = clientY - rect.top;
            currentWrapperRect = vw.getBoundingClientRect();
            if (!touch) e.preventDefault();
        }
    };

    const onMove = (e, touch) => {
        if (!dragItem) return;
        e.preventDefault();
        const z = currentZoom || 1;
        const cx = touch ? e.touches[0].clientX : e.clientX;
        const cy = touch ? e.touches[0].clientY : e.clientY;
        let x = (cx - currentWrapperRect.left) / z - (dragOffset.x / z) + (dragItem.offsetWidth / 2);
        let y = (cy - currentWrapperRect.top) / z - (dragOffset.y / z) + (dragItem.offsetHeight / 2);
        let px = (x / (currentWrapperRect.width / z)) * 100;
        let py = (y / (currentWrapperRect.height / z)) * 100;

        const bounds = getZoneBoundaries(dragItem);
        if (bounds) {
            px = Math.max(bounds.minX, Math.min(bounds.maxX, px));
            py = Math.max(bounds.minY, Math.min(bounds.maxY, py));
        }
        dragItem.style.left = px + '%'; dragItem.style.top = py + '%';
        const zid = dragItem.dataset.zone || dragItem.dataset.parentZone;
        if (zid && state.texts[zid]) { state.texts[zid].x = px; state.texts[zid].y = py; }
    };

    const onEnd = () => { dragItem = null; };

    vp.addEventListener('mousedown', (e) => onStart(e, false));
    window.addEventListener('mousemove', (e) => onMove(e, false));
    window.addEventListener('mouseup', onEnd);
    // No mobile, imagens são estáticas — drag por touch desabilitado
    if (!isMobile()) {
        vp.addEventListener('touchstart', (e) => onStart(e, true), { passive: false });
        window.addEventListener('touchmove', (e) => onMove(e, true), { passive: false });
        window.addEventListener('touchend', onEnd);
    }
}

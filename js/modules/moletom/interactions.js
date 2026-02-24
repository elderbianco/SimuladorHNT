/**
 * Módulo de Interações - Moletom
 */

function setZoom(val) {
    if (val < 0.5) val = 0.5; if (val > 2.5) val = 2.5;
    state.zoom = val; currentZoom = val; applyZoomAndPan();
}

function setupViewportPan() {
    const vp = document.querySelector('.simulator-viewport'); if (!vp) return;
    vp.addEventListener('mousedown', (e) => {
        if (e.target.closest('.custom-element')) return;
        isPanning = true; panStart.x = e.clientX - panOffset.x; panStart.y = e.clientY - panOffset.y;
    });
    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return; panOffset.x = e.clientX - panStart.x; panOffset.y = e.clientY - panStart.y;
        applyZoomAndPan();
    });
    window.addEventListener('mouseup', () => { isPanning = false; });

    // TOUCH PANNING
    vp.addEventListener('touchstart', (e) => {
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
        e.preventDefault(); const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const old = currentZoom; currentZoom = Math.max(0.5, Math.min(2.5, currentZoom + delta));
        const rect = vp.getBoundingClientRect();
        const mx = (e.clientX - rect.left) - (rect.width / 2); const my = (e.clientY - rect.top) - (rect.height / 2);
        panOffset.x = mx - (mx - panOffset.x) * (currentZoom / old);
        panOffset.y = my - (my - panOffset.y) * (currentZoom / old);
        state.zoom = currentZoom; applyZoomAndPan();
    }, { passive: false });
}

function setupGlobalDrag() {
    const vp = document.querySelector('.simulator-viewport');
    const vw = document.querySelector('.simulator-wrapper');
    const start = (e, t) => {
        const it = e.target.closest('.custom-element');
        if (it) {
            dragItem = it; const c = t ? e.touches[0] : e; const r = it.getBoundingClientRect();
            dragOffset.x = c.clientX - r.left; dragOffset.y = c.clientY - r.top;
            currentWrapperRect = vw.getBoundingClientRect();
        }
    };
    const move = (e, t) => {
        if (!dragItem) return;
        e.preventDefault();
        const z = currentZoom || 1; const c = t ? e.touches[0] : e;
        let x = (c.clientX - currentWrapperRect.left) / z - (dragOffset.x / z) + (dragItem.offsetWidth / 2);
        let y = (c.clientY - currentWrapperRect.top) / z - (dragOffset.y / z) + (dragItem.offsetHeight / 2);
        let px = (x / (currentWrapperRect.width / z)) * 100;
        let py = (y / (currentWrapperRect.height / z)) * 100;
        const b = getZoneBoundaries(dragItem);
        if (b) { px = Math.max(b.minX, Math.min(b.maxX, px)); py = Math.max(b.minY, Math.min(b.maxY, py)); }
        dragItem.style.left = px + '%'; dragItem.style.top = py + '%';
        const zid = dragItem.dataset.zone || dragItem.dataset.parentZone;
        if (zid && state.texts[zid]) { state.texts[zid].x = px; state.texts[zid].y = py; }
    };
    vp.addEventListener('mousedown', (e) => start(e, false)); window.addEventListener('mousemove', (e) => move(e, false)); window.addEventListener('mouseup', () => dragItem = null);
    vp.addEventListener('touchstart', (e) => start(e, true), { passive: false }); window.addEventListener('touchmove', (e) => move(e, true), { passive: false }); window.addEventListener('touchend', () => dragItem = null);
}

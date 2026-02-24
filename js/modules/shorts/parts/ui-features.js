/**
 * Módulo de Features Específicas
 * Funções: toggleLimit, updateLimitOverlay, refreshActiveLimits, getExtraIcon
 */

// ------------------- LIMITS UI -------------------
function toggleLimit(zoneId, show) {
    if (!state.limits) state.limits = {};

    // Map Text Zone IDs to Upload Zone IDs dynamically
    if (zoneId.startsWith('text_')) {
        if (zoneId.includes('leg_')) {
            zoneId = zoneId.replace('text_', '');
        } else {
            zoneId = zoneId.replace('text_', 'logo_');
        }
    }

    // Manual Fix for known Leg IDs if dynamic check fails
    if (zoneId === 'text_leg_right_mid') zoneId = 'leg_right_mid';
    if (zoneId === 'text_leg_right_bottom') zoneId = 'leg_right_bottom';
    if (zoneId === 'text_leg_left_mid') zoneId = 'leg_left_mid';

    if (typeof show !== 'boolean') show = !state.limits[zoneId];
    state.limits[zoneId] = show;

    // Compatibility with legacy keys (sync)
    if (zoneId === 'logo_lat_dir') state.limits.right = show;
    if (zoneId === 'logo_lat_esq') state.limits.left = show;

    if (typeof scheduleRender === 'function') scheduleRender(true);
}

function updateLimitOverlay(zoneId) {
    const wrap = document.querySelector('.simulator-wrapper');
    if (!wrap) return;

    if (typeof getLimitImage !== 'function') return;

    const limitImagePath = getLimitImage(zoneId);
    if (!limitImagePath) return; // Don't create overlay if no valid image path

    let overlay = document.getElementById(`limit-overlay-${zoneId}`);
    if (state.limits[zoneId]) {
        if (!overlay) {
            overlay = document.createElement('img');
            overlay.id = `limit-overlay-${zoneId}`;
            overlay.className = 'layer limit-layer';
            overlay.style.zIndex = '500';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            wrap.appendChild(overlay);
        }
        overlay.src = limitImagePath;
        overlay.style.display = 'block';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

function refreshActiveLimits() {
    // Update ALL limit overlays, not just active ones
    // This ensures disabled limits are properly hidden
    if (state.limits) {
        Object.keys(state.limits).forEach(zid => updateLimitOverlay(zid));
    }
}

function getExtraIcon(id) {
    if (id === 'calca_legging' || id === 'legging') return `<img src="assets/Shorts/Icones/Leg.png" width="30" height="30" class="extra-icon-img">`;
    if (id === 'cordao') return `<img src="assets/Shorts/Icones/Cordão.png" width="30" height="30" class="extra-icon-img">`;
    if (id === 'laco') return `<img src="assets/Shorts/Icones/Laço.png" width="30" height="30" class="extra-icon-img">`;
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
}

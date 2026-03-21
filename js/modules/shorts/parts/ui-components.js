/**
 * Módulo de Componentes UI Reutilizáveis
 * Funções: createToast, Feedbacks, getLimitImage
 */

// function renderColorGrid removed - use UIComponents.createColorPicker

// ------------------- FEEDBACK TOASTS -------------------
function createToast(message, type = 'info', icon = 'ℹ️', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icon} ${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    if (duration > 0) setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
    return toast;
}
function showLoadingFeedback(msg) { return createToast(msg, 'loading', '⏳', 0); }
function showSuccessFeedback(msg) { createToast(msg, 'success', '✅'); }
function showErrorFeedback(msg) { createToast(msg, 'error', '⚠️'); }

function getLimitImage(zoneId) {
    const basePath = 'assets/Shorts/Limites/';

    // 1. Determine Color Context (Dark -> Br_, Light -> Pr_)
    let contextPartId = 'lateral_esq'; // Default to lateral color
    if (zoneId.includes('centro') || zoneId.includes('perna') || zoneId === 'logo_centro') {
        contextPartId = 'centro';
    }
    // Override for specific lateral zones if needed
    if (zoneId.includes('lat_dir') || zoneId.includes('lat_esq')) contextPartId = 'lateral_esq';

    const colorId = (typeof state !== 'undefined' && state.parts[contextPartId]) ? state.parts[contextPartId] : 'preto';
    const lightColors = ['branco', 'amarelo', 'rosa', 'dourado', 'prata', 'neon', 'caqui', 'bege'];
    const prefix = lightColors.includes(colorId) ? 'Pr_Lmte_' : 'Br_Lmte_';

    // 2. Determine Filename
    let filename = '';

    if (zoneId === 'logo_lat_dir') {
        filename = 'lat_direita.png';
    }
    else if (zoneId === 'logo_lat_esq') {
        filename = 'lat_esquerda.png';
    }
    else if (zoneId === 'logo_centro') {
        filename = 'Centro.png';
    }
    // PERNA LOGIC
    else if (zoneId.includes('leg_right')) {
        const midHasImg = state.uploads['leg_right_mid_ie']?.src || state.uploads['leg_right_mid']?.src || state.uploads['leg_right_mid_ii']?.src;
        const bottomHasImg = state.uploads['leg_right_bottom_ie']?.src || state.uploads['leg_right_bottom']?.src || state.uploads['leg_right_bottom_ii']?.src;
        const bottomHasText = state.texts['text_leg_right_bottom'] && state.texts['text_leg_right_bottom'].text && state.texts['text_leg_right_bottom'].text.trim() !== "";

        if (zoneId.includes('mid') || zoneId === 'leg_right_mid_ie') {
            let suffix = 'IE'; // Default
            if (midHasImg) {
                if (bottomHasImg) suffix = 'II';
                else if (bottomHasText) suffix = 'IE';
            }
            filename = `Perna_dir_Img_Cent_${suffix}.png`;
        }
        else if (zoneId.includes('bottom') || zoneId === 'leg_right_bottom_ie') {
            let suffix = 'IE'; // Default
            if (!midHasImg) suffix = 'II';
            else if (midHasImg && bottomHasImg) suffix = 'II';
            else if (midHasImg && bottomHasText) suffix = 'IE';
            filename = `Perna_dir_Img_Inf_${suffix}.png`;
        }
    }
    else if (zoneId.includes('leg_left')) {
        filename = 'Perna_esq_Img_Cent_IE.png';
    }

    if (!filename) return null;
    return basePath + prefix + filename;
}

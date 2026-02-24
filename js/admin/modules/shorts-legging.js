window.loadShortsLeggingSettings = function () {
    const config = JSON.parse(localStorage.getItem('hnt_shorts_legging_config') || '{}');

    // Helper for safe value setting
    const val = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v !== undefined ? v : 0;
    };
    const chk = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.checked = v || false;
    };

    val('shorts-legging-base-price', config.basePrice || 89.90);
    val('shorts-legging-size-mod', config.sizeModPrice || 0);
    val('shorts-legging-dev-fee', config.devFee || 0);
    val('shorts-legging-logo-lat', config.logoLatPrice || 29.90);
    val('shorts-legging-text-lat', config.textLatPrice || 9.90);
    val('shorts-legging-logo-leg', config.logoLegPrice || 14.90);
    val('shorts-legging-text-leg', config.textLegPrice || 0);
    val('shorts-legging-price-10', config.price10 || 80.90);
    val('shorts-legging-price-20', config.price20 || 71.90);
    val('shorts-legging-price-30', config.price30 || 62.90);
    chk('shorts-legging-art-waiver', config.artWaiver !== undefined ? config.artWaiver : true);

    // Part Colors
    const partColorsContainer = document.getElementById('shorts-legging-part-colors');
    if (!partColorsContainer) return;

    partColorsContainer.innerHTML = '';
    const partColors = JSON.parse(localStorage.getItem('hnt_shorts_legging_part_colors') || '{}');

    if (typeof DATA !== 'undefined' && DATA.colors) {
        const subsection = document.createElement('div');
        subsection.className = 'subsection';
        subsection.innerHTML = `<div class="subsection-title">Cor da Shorts Legging</div>
        <div class="color-grid" id="shorts_legging_main_part_colors"></div>`;
        partColorsContainer.appendChild(subsection);

        const container = subsection.querySelector('#shorts_legging_main_part_colors');
        const disabledForPart = partColors['main'] || [];
        // Allow all colors for now or restrict? Shorts Legging inherits from Legging, usually same colors.
        // Assuming same available colors as Legging for now.
        const validColors = ['preto', 'branco', 'vermelho', 'rosa_pink'];

        DATA.colors.filter(c => validColors.includes(c.id)).forEach(c => {
            const isEnabled = !disabledForPart.includes(c.id);
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="shorts_legging_part_main_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
            container.appendChild(div);
        });
    }
};

window.saveShortsLeggingSettings = function () {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };

    const config = {
        basePrice: parseFloat(getVal('shorts-legging-base-price')) || 0,
        sizeModPrice: parseFloat(getVal('shorts-legging-size-mod')) || 0,
        devFee: parseFloat(getVal('shorts-legging-dev-fee')) || 0,
        logoLatPrice: getFloat('shorts-legging-logo-lat'),
        textLatPrice: getFloat('shorts-legging-text-lat'),
        logoLegPrice: getFloat('shorts-legging-logo-leg'),
        textLegPrice: getFloat('shorts-legging-text-leg'),
        price10: getFloat('shorts-legging-price-10'),
        price20: getFloat('shorts-legging-price-20'),
        price30: getFloat('shorts-legging-price-30'),
        artWaiver: document.getElementById('shorts-legging-art-waiver') ? document.getElementById('shorts-legging-art-waiver').checked : false
    };
    localStorage.setItem('hnt_shorts_legging_config', JSON.stringify(config));
    console.log('✅ Configuração do Shorts Legging salva com sucesso:', config);

    // Part Colors
    const partColors = {};
    if (typeof DATA !== 'undefined' && DATA.colors) {
        const disabled = [];
        DATA.colors.forEach(c => {
            const chk = document.getElementById(`shorts_legging_part_main_${c.id}`);
            if (chk && !chk.checked) disabled.push(c.id);
        });
        if (disabled.length > 0) partColors['main'] = disabled;
    }
    localStorage.setItem('hnt_shorts_legging_part_colors', JSON.stringify(partColors));
};

window.resetShortsLeggingToTable = function () {
    if (!confirm('Deseja restaurar todos os valores do Shorts Legging para a tabela oficial (Jan/2026)?')) return;

    const config = {
        basePrice: 89.90,
        sizeModPrice: 0,
        devFee: 0,
        logoLatPrice: 29.90,
        textLatPrice: 9.90,
        logoLegPrice: 14.90,
        textLegPrice: 0,
        price10: 80.90,
        price20: 71.90,
        price30: 62.90,
        artWaiver: true
    };
    localStorage.setItem('hnt_shorts_legging_config', JSON.stringify(config));
    loadShortsLeggingSettings();
    alert('Valores restaurados!');
};

window.loadLeggingSettings = function () {
    const config = JSON.parse(localStorage.getItem('hnt_legging_config') || '{}');

    // Helper for safe value setting
    const val = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v !== undefined ? v : 0;
    };
    const chk = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.checked = v || false;
    };

    val('legging-base-price', config.basePrice || 139.90);
    val('legging-size-mod', config.sizeModPrice || 0);
    val('legging-dev-fee', config.devFee || 0);
    val('legging-logo-lat', config.logoLatPrice || 29.90);
    val('legging-text-lat', config.textLatPrice || 9.90);
    val('legging-logo-leg', config.logoLegPrice || 14.90);
    val('legging-text-leg', config.textLegPrice || 0); // Not specified in table, keeping 0 or removing
    val('legging-price-10', config.price10 || 125.90);
    val('legging-price-20', config.price20 || 111.90);
    val('legging-price-30', config.price30 || 97.90);
    chk('legging-art-waiver', config.artWaiver !== undefined ? config.artWaiver : true);

    // Part Colors
    const partColorsContainer = document.getElementById('legging-part-colors');
    if (!partColorsContainer) return;

    partColorsContainer.innerHTML = '';
    const partColors = JSON.parse(localStorage.getItem('hnt_legging_part_colors') || '{}');

    if (typeof DATA !== 'undefined' && DATA.colors) {
        const subsection = document.createElement('div');
        subsection.className = 'subsection';
        subsection.innerHTML = `<div class="subsection-title">Cor da Calça Legging</div>
        <div class="color-grid" id="legging_main_part_colors"></div>`;
        partColorsContainer.appendChild(subsection);

        const container = subsection.querySelector('#legging_main_part_colors');
        const disabledForPart = partColors['main'] || [];
        const validColors = ['preto', 'branco', 'vermelho', 'rosa_pink'];

        DATA.colors.filter(c => validColors.includes(c.id)).forEach(c => {
            const isEnabled = !disabledForPart.includes(c.id);
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="legging_part_main_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
            container.appendChild(div);
        });
    }
};

window.saveLeggingSettings = function () {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };

    const config = {
        basePrice: parseFloat(getVal('legging-base-price')) || 0,
        sizeModPrice: parseFloat(getVal('legging-size-mod')) || 0,
        devFee: parseFloat(getVal('legging-dev-fee')) || 0,
        logoLatPrice: getFloat('legging-logo-lat'),
        textLatPrice: getFloat('legging-text-lat'),
        logoLegPrice: getFloat('legging-logo-leg'),
        textLegPrice: getFloat('legging-text-leg'),
        price10: getFloat('legging-price-10'),
        price20: getFloat('legging-price-20'),
        price30: getFloat('legging-price-30'),
        artWaiver: document.getElementById('legging-art-waiver') ? document.getElementById('legging-art-waiver').checked : false
    };

    // === VALIDAÇÃO (Nova) ===
    if (typeof AdminValidator !== 'undefined') {
        const validation = AdminValidator.validatePricingConfig(config, 'Calça Legging');
        if (!AdminValidator.showValidationResult(validation, 'Calça Legging')) {
            return; // Cancela salvamento se validação falhar
        }
    }
    // === FIM VALIDAÇÃO ===

    localStorage.setItem('hnt_legging_config', JSON.stringify(config));

    // --- SERVER SYNC ---
    if (typeof fetch !== 'undefined') {
        fetch('/api/admin/config/hnt_legging_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        }).catch(e => console.error('❌ Failed to sync config:', e));
    }

    console.log('✅ Configuração da Legging salva com sucesso:', config);

    localStorage.setItem('hnt_legging_part_colors', JSON.stringify(partColors));

    // Sync to server
    fetch('/api/admin/config/hnt_legging_part_colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partColors)
    }).catch(e => console.error('❌ Failed to sync legging colors:', e));
};

window.resetLeggingToTable = function () {
    if (!confirm('Deseja restaurar todos os valores da Calça Legging para a tabela oficial (Jan/2026)?')) return;

    const config = {
        basePrice: 139.90,
        sizeModPrice: 0,
        devFee: 0,
        logoLatPrice: 29.90,
        textLatPrice: 9.90,
        logoLegPrice: 14.90,
        textLegPrice: 0,
        price10: 125.90,
        price20: 111.90,
        price30: 97.90,
        artWaiver: true
    };
    localStorage.setItem('hnt_legging_config', JSON.stringify(config));
    loadLeggingSettings();
    alert('Valores restaurados!');
};

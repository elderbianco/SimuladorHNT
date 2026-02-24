window.loadMoletomSettings = function () {
    const config = JSON.parse(localStorage.getItem('hnt_moletom_config') || '{}');

    // Helper for safe value setting
    const val = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v !== undefined ? v : 0;
    };
    const chk = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.checked = v || false;
    };

    val('moletom-base-price', config.basePrice);
    val('moletom-size-mod', config.sizeModPrice);
    val('moletom-dev-fee', config.devFee);
    val('moletom-logo-front', config.logoFrontPrice);
    val('moletom-text-front', config.textFrontPrice);
    val('moletom-logo-back', config.logoBackPrice);
    val('moletom-text-back', config.textBackPrice);
    val('moletom-logo-hood', config.logoHoodPrice);
    val('moletom-text-hood', config.textHoodPrice);
    val('moletom-logo-sleeve', config.logoSleevePrice);
    val('moletom-text-sleeve', config.textSleevePrice);
    val('moletom-zipper-upgrade', config.zipperUpgrade);
    val('moletom-pocket-upgrade', config.pocketUpgrade);
    val('moletom-price-10', config.price10);
    val('moletom-price-20', config.price20);
    val('moletom-price-30', config.price30);
    chk('moletom-art-waiver', config.artWaiver);

    // Part Colors
    const partColorsContainer = document.getElementById('moletom-part-colors');
    if (!partColorsContainer) return;

    partColorsContainer.innerHTML = ''; // Clear prev

    const partColors = JSON.parse(localStorage.getItem('hnt_moletom_part_colors') || '{}');

    if (typeof DATA !== 'undefined' && DATA.colors) {
        const subsection = document.createElement('div');
        subsection.className = 'subsection';
        subsection.innerHTML = `<div class="subsection-title">Cor do Moletom</div>
        <div class="color-grid" id="moletom_main_part_colors"></div>`;
        partColorsContainer.appendChild(subsection);

        const container = subsection.querySelector('#moletom_main_part_colors');
        const disabledForPart = partColors['main'] || [];
        const validColors = ['branco', 'preto'];

        DATA.colors.filter(c => validColors.includes(c.id)).forEach(c => {
            const isEnabled = !disabledForPart.includes(c.id);
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="moletom_part_main_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
            container.appendChild(div);
        });
    }
};

window.saveMoletomSettings = function () {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };

    const config = {
        basePrice: parseFloat(getVal('moletom-base-price')) || 0,
        sizeModPrice: parseFloat(getVal('moletom-size-mod')) || 0,
        devFee: parseFloat(getVal('moletom-dev-fee')) || 0,
        logoFrontPrice: getFloat('moletom-logo-front'),
        textFrontPrice: getFloat('moletom-text-front'),
        logoBackPrice: getFloat('moletom-logo-back'),
        textBackPrice: getFloat('moletom-text-back'),
        logoHoodPrice: getFloat('moletom-logo-hood'),
        textHoodPrice: getFloat('moletom-text-hood'),
        logoSleevePrice: getFloat('moletom-logo-sleeve'),
        textSleevePrice: getFloat('moletom-text-sleeve'),
        zipperUpgrade: getFloat('moletom-zipper-upgrade'),
        pocketUpgrade: getFloat('moletom-pocket-upgrade'),
        price10: getFloat('moletom-price-10'),
        price20: getFloat('moletom-price-20'),
        price30: getFloat('moletom-price-30'),
        artWaiver: document.getElementById('moletom-art-waiver')?.checked || false
    };

    // === VALIDAÇÃO (Nova) ===
    if (typeof AdminValidator !== 'undefined') {
        const validation = AdminValidator.validatePricingConfig(config, 'Moletom');
        if (!AdminValidator.showValidationResult(validation, 'Moletom')) {
            return; // Cancela salvamento se validação falhar
        }
    }
    // === FIM VALIDAÇÃO ===

    localStorage.setItem('hnt_moletom_config', JSON.stringify(config));
    console.log('✅ Configuração do Moletom salva com sucesso:', config);

    // Part Colors
    const partColors = {};
    if (typeof DATA !== 'undefined' && DATA.colors) {
        const disabled = [];
        DATA.colors.forEach(c => {
            const chk = document.getElementById(`moletom_part_main_${c.id}`);
            if (chk && !chk.checked) disabled.push(c.id);
        });
        if (disabled.length > 0) partColors['main'] = disabled;
    }
    localStorage.setItem('hnt_moletom_part_colors', JSON.stringify(partColors));
};

window.resetMoletomToTable = function () {
    if (!confirm('Deseja restaurar todos os valores do Moletom para a tabela oficial (Jan/2026)?')) return;

    const config = {
        basePrice: 189.90,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 29.90,
        textFrontPrice: 19.90,
        logoBackPrice: 29.90,
        textBackPrice: 19.90,
        logoHoodPrice: 14.90,
        textHoodPrice: 9.90,
        logoSleevePrice: 14.90,
        textSleevePrice: 9.90,
        zipperUpgrade: 0,
        pocketUpgrade: 0,
        price10: 170.90,
        price20: 151.90,
        price30: 132.90,
        artWaiver: true
    };
    localStorage.setItem('hnt_moletom_config', JSON.stringify(config));
    loadMoletomSettings();
    alert('✅ Valores do Moletom restaurados para a tabela oficial!');
};

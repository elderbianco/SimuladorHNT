window.loadTopSettings = function () {
    const config = JSON.parse(localStorage.getItem('hnt_top_config') || '{}');

    // Helper for safe value setting
    const val = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v !== undefined ? v : 0;
    };
    const chk = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.checked = v || false;
    };

    val('top-base-price', config.basePrice || 89.90);
    val('top-size-mod', config.sizeModPrice || 0);
    val('top-dev-fee', config.devFee || 0);
    val('top-logo-front', config.logoFrontPrice || 14.90);
    val('top-text-front', config.textFrontPrice || 9.90);
    val('top-logo-back', config.logoBackPrice || 0); // "Personalização Inclusa: Estampa personalizada na parte de trás"
    val('top-text-back', config.textBackPrice || 0);
    val('top-price-10', config.price10 || 80.90);
    val('top-price-20', config.price20 || 71.90);
    val('top-price-30', config.price30 || 62.90);
    chk('top-art-waiver', config.artWaiver !== undefined ? config.artWaiver : true);

    // HNT Logos Split
    const legacyHnt = config.logoHntPrice !== undefined ? config.logoHntPrice : 0;
    val('top-logo-hnt-front', config.logoHntFrontPrice !== undefined ? config.logoHntFrontPrice : legacyHnt);
    val('top-logo-hnt-back', config.logoHntBackPrice !== undefined ? config.logoHntBackPrice : legacyHnt);

    // Part Colors
    const partColorsContainer = document.getElementById('top-part-colors');
    if (!partColorsContainer) return;

    partColorsContainer.innerHTML = '';
    const partColors = JSON.parse(localStorage.getItem('hnt_top_part_colors') || '{}');

    if (typeof DATA !== 'undefined' && DATA.colors) {
        const subsection = document.createElement('div');
        subsection.className = 'subsection';
        subsection.innerHTML = `<div class="subsection-title">Cor do Top</div>
        <div class="color-grid" id="top_main_part_colors"></div>`;
        partColorsContainer.appendChild(subsection);

        const container = subsection.querySelector('#top_main_part_colors');
        const disabledForPart = partColors['main'] || [];
        const validColors = ['branco', 'preto', 'rosa_pink', 'vermelho'];

        DATA.colors.filter(c => validColors.includes(c.id)).forEach(c => {
            const isEnabled = !disabledForPart.includes(c.id);
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="top_part_main_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
            container.appendChild(div);
        });
    }
};

window.saveTopSettings = function () {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };

    const config = {
        basePrice: parseFloat(getVal('top-base-price')) || 0,
        sizeModPrice: parseFloat(getVal('top-size-mod')) || 0,
        devFee: parseFloat(getVal('top-dev-fee')) || 0,
        logoFrontPrice: getFloat('top-logo-front'),
        textFrontPrice: getFloat('top-text-front'),
        logoBackPrice: getFloat('top-logo-back'),
        textBackPrice: getFloat('top-text-back'),
        logoHntFrontPrice: getFloat('top-logo-hnt-front'),
        logoHntBackPrice: getFloat('top-logo-hnt-back'),
        price10: getFloat('top-price-10'),
        price20: getFloat('top-price-20'),
        price30: getFloat('top-price-30'),
        artWaiver: document.getElementById('top-art-waiver') ? document.getElementById('top-art-waiver').checked : false,
        // Keep legacy for safety
        logoHntPrice: getFloat('top-logo-hnt-front')
    };

    // === VALIDAÇÃO (Nova) ===
    if (typeof AdminValidator !== 'undefined') {
        const validation = AdminValidator.validatePricingConfig(config, 'Top');
        if (!AdminValidator.showValidationResult(validation, 'Top')) {
            return; // Cancela salvamento se validação falhar
        }
    }
    // === FIM VALIDAÇÃO ===

    localStorage.setItem('hnt_top_config', JSON.stringify(config));
    console.log('✅ Configuração do Top salva com sucesso:', config);

    // Part Colors
    const partColors = {};
    if (typeof DATA !== 'undefined' && DATA.colors) {
        const disabled = [];
        DATA.colors.forEach(c => {
            const chk = document.getElementById(`top_part_main_${c.id}`);
            if (chk && !chk.checked) disabled.push(c.id);
        });
        if (disabled.length > 0) partColors['main'] = disabled;
    }
    localStorage.setItem('hnt_top_part_colors', JSON.stringify(partColors));
};

window.resetTopToTable = function () {
    if (!confirm('Deseja restaurar todos os valores do Top para a tabela oficial (Jan/2026)?')) return;

    const config = {
        basePrice: 89.90,
        sizeModPrice: 0,
        devFee: 0,
        logoFrontPrice: 14.90,
        textFrontPrice: 9.90,
        logoBackPrice: 0,
        textBackPrice: 0,
        logoHntFrontPrice: 0,
        logoHntBackPrice: 0,
        price10: 80.90,
        price20: 71.90,
        price30: 62.90,
        artWaiver: true
    };
    localStorage.setItem('hnt_top_config', JSON.stringify(config));
    loadTopSettings();
    alert('Valores restaurados!');
};

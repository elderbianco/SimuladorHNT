window.loadShortsSettings = function () {
    const config = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

    // Helper for safe value setting
    const val = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v !== undefined ? v : 0;
    };
    const chk = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.checked = v || false;
    };


    val('shorts-base-price', config.basePrice || 149.90);
    val('shorts-size-mod', config.sizeModPrice || 0);
    val('shorts-dev-fee', config.devFee || 0);
    val('shorts-logo-center', config.logoCenterPrice || 29.90);
    val('shorts-text-center', config.textCenterPrice || 19.90);
    val('shorts-logo-lat', config.logoLatPrice || 14.90);
    val('shorts-text-lat', config.textLatPrice || 9.90);
    val('shorts-leg-right-mid', config.legRightMidPrice || 14.90);
    val('shorts-leg-right-bottom', config.legRightBottomPrice || 14.90);
    val('shorts-leg-left', config.legLeftPrice || 14.90);
    val('shorts-extra-legging', config.extraLeggingPrice || 38.90);
    val('shorts-extra-laco', config.extraLacoPrice || 14.90);
    val('shorts-extra-cordao', config.extraCordaoPrice || 14.90);
    val('shorts-price-10', config.price10 || 134.90);
    val('shorts-price-20', config.price20 || 119.90);
    val('shorts-price-30', config.price30 || 104.90);
    chk('shorts-art-waiver', config.artWaiver !== undefined ? config.artWaiver : true);

    // Global Colors
    const globalColorsContainer = document.getElementById('shorts-colors-global');
    if (globalColorsContainer) {
        globalColorsContainer.innerHTML = '';
        const disabledColors = JSON.parse(localStorage.getItem('hnt_disabled_colors') || '[]');

        if (typeof DATA !== 'undefined' && DATA.colors) {
            DATA.colors.forEach(c => {
                const isEnabled = !disabledColors.includes(c.id);
                const div = document.createElement('div');
                div.className = 'color-item';
                div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="shorts_color_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
                globalColorsContainer.appendChild(div);
            });
        }
    }

    // Part Colors
    const partColorsContainer = document.getElementById('shorts-part-colors');
    if (partColorsContainer) {
        partColorsContainer.innerHTML = '';
        const partColors = JSON.parse(localStorage.getItem('hnt_part_colors') || '{}');

        if (typeof DATA !== 'undefined' && DATA.parts) {
            DATA.parts.forEach(p => {
                const subsection = document.createElement('div');
                subsection.className = 'subsection';
                subsection.innerHTML = `<div class="subsection-title">${p.name}</div>
        <div class="color-grid" id="part_${p.id}_colors"></div>`;
                partColorsContainer.appendChild(subsection);

                const container = subsection.querySelector(`#part_${p.id}_colors`);
                const disabledForPart = partColors[p.id] || [];

                DATA.colors.forEach(c => {
                    const isEnabled = !disabledForPart.includes(c.id);
                    const div = document.createElement('div');
                    div.className = 'color-item';
                    div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="shorts_part_${p.id}_${c.id}" ${isEnabled ? 'checked' : ''}>
        `;
                    container.appendChild(div);
                });
            });
        }
    }
};

window.saveShortsSettings = function () {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getFloat = (id) => {
        const el = document.getElementById(id);
        return el ? (parseFloat(el.value) || 0) : 0;
    };

    const config = {
        basePrice: parseFloat(getVal('shorts-base-price')) || 0,
        sizeModPrice: parseFloat(getVal('shorts-size-mod')) || 0,
        devFee: parseFloat(getVal('shorts-dev-fee')) || 0,
        logoCenterPrice: parseFloat(getVal('shorts-logo-center')) || 0,
        textCenterPrice: getFloat('shorts-text-center'),
        logoLatPrice: getFloat('shorts-logo-lat'),
        textLatPrice: getFloat('shorts-text-lat'),
        legRightMidPrice: getFloat('shorts-leg-right-mid'),
        legRightBottomPrice: getFloat('shorts-leg-right-bottom'),
        legLeftPrice: getFloat('shorts-leg-left'),
        extraLeggingPrice: getFloat('shorts-extra-legging'),
        extraLacoPrice: getFloat('shorts-extra-laco'),
        extraCordaoPrice: getFloat('shorts-extra-cordao'),
        price10: getFloat('shorts-price-10'),
        price20: getFloat('shorts-price-20'),
        price30: getFloat('shorts-price-30'),
        artWaiver: document.getElementById('shorts-art-waiver')?.checked || false,
        whatsappNumber: getVal('whatsappNumber').trim()
    };

    // === VALIDAÇÃO (Nova) ===
    if (typeof AdminValidator !== 'undefined') {
        const validation = AdminValidator.validatePricingConfig(config, 'Shorts Fight');
        if (!AdminValidator.showValidationResult(validation, 'Shorts Fight')) {
            return; // Cancela salvamento se validação falhar
        }
    }
    // === FIM VALIDAÇÃO ===

    localStorage.setItem('hnt_pricing_config', JSON.stringify(config));

    // --- SERVER SYNC ---
    fetch('/api/admin/config/hnt_pricing_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    }).then(r => r.json())
        .then(d => console.log('☁️ Config synced to server:', d))
        .catch(e => console.error('❌ Failed to sync config:', e));
    // -------------------

    // Validation: Check if all expected fields were saved
    const saved = JSON.parse(localStorage.getItem('hnt_pricing_config'));
    const missingFields = [];
    const expectedFields = ['basePrice', 'logoLatPrice', 'legRightMidPrice', 'legRightBottomPrice', 'legLeftPrice'];
    expectedFields.forEach(field => {
        if (saved[field] === undefined) missingFields.push(field);
    });

    if (missingFields.length > 0) {
        console.warn('⚠️ Some fields were not saved:', missingFields);
        alert('Aviso: Alguns campos não foram salvos corretamente. Verifique o console.');
    } else {
        console.log('✅ Configuração do Shorts salva com sucesso:', config);
    }

    // Colors
    const disabledColors = [];
    if (typeof DATA !== 'undefined' && DATA.colors) {
        DATA.colors.forEach(c => {
            const chk = document.getElementById(`shorts_color_${c.id}`);
            if (chk && !chk.checked) disabledColors.push(c.id);
        });
    }
    localStorage.setItem('hnt_part_colors', JSON.stringify(partColors));

    // Sync colors to server
    const sync = (key, data) => {
        fetch(`/api/admin/config/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(e => console.error(`❌ Failed to sync ${key}:`, e));
    };
    sync('hnt_disabled_colors', disabledColors);
    sync('hnt_part_colors', partColors);
};

window.resetShortsToTable = function () {
    if (!confirm('Deseja restaurar todos os valores do Shorts para a tabela oficial (Jan/2026)?')) return;

    const config = {
        basePrice: 149.90,
        sizeModPrice: 0,
        devFee: 0,
        logoCenterPrice: 29.90,
        textCenterPrice: 19.90,
        logoLatPrice: 14.90,
        textLatPrice: 9.90,
        legRightMidPrice: 14.90,
        legRightBottomPrice: 14.90,
        legLeftPrice: 14.90,
        extraLeggingPrice: 38.90,
        extraLacoPrice: 14.90,
        extraCordaoPrice: 14.90,
        price10: 134.90,
        price20: 119.90,
        price30: 104.90,
        artWaiver: true
    };
    localStorage.setItem('hnt_pricing_config', JSON.stringify(config));
    loadShortsSettings();
    alert('Valores restaurados! Não esqueça de clicar em "SALVAR TODAS AS CONFIGURAÇÕES" no final da página.');
};

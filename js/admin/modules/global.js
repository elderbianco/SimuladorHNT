window.loadGlobalSettings = function () {
    // Fonts - Merge System Fonts, SHARED_FONTS, and Custom Fonts
    const fontsTableBody = document.getElementById('global-fonts-table');
    const activeFonts = JSON.parse(localStorage.getItem('hnt_active_fonts') || '[]');
    const preferredFonts = JSON.parse(localStorage.getItem('hnt_preferred_fonts') || '["", "", "", "", ""]');
    const isFirstLoad = !localStorage.getItem('hnt_active_fonts');

    // Collect all fonts
    let allFonts = [];

    // 1. From DATA.fonts
    if (typeof DATA !== 'undefined' && DATA.fonts) {
        allFonts = [...DATA.fonts];
    }

    // 2. From SHARED_FONTS
    if (typeof SHARED_FONTS !== 'undefined') {
        SHARED_FONTS.forEach(f => {
            if (!allFonts.find(existing => existing.id === f.id)) {
                allFonts.push(f);
            }
        });
    }

    // 3. From Custom Fonts
    const customFontsData = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    customFontsData.forEach(f => {
        if (!allFonts.find(existing => existing.id === f.id)) {
            allFonts.push({ ...f, isCustom: true });
        }
    });

    // Sort alphabetically
    allFonts.sort((a, b) => a.name.localeCompare(b.name));

    // Populate Table
    fontsTableBody.innerHTML = '';

    // Populate Dropdowns
    const prefSelects = [
        document.getElementById('pref-font-1'),
        document.getElementById('pref-font-2'),
        document.getElementById('pref-font-3'),
        document.getElementById('pref-font-4'),
        document.getElementById('pref-font-5')
    ];

    prefSelects.forEach(sel => {
        sel.innerHTML = '<option value="">-- Selecione --</option>';
    });

    allFonts.forEach(f => {
        const isActive = isFirstLoad || activeFonts.includes(f.id);

        // Add to table
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #444';

        // Checkbox
        const tdChk = document.createElement('td');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.id = `font_${f.id}`;
        chk.checked = isActive;
        tdChk.appendChild(chk);

        // Name
        const tdName = document.createElement('td');
        tdName.innerText = f.name + (f.isCustom ? ' (Custom)' : '');

        // Preview
        const tdPrev = document.createElement('td');
        tdPrev.innerText = 'ABC abc 123';
        tdPrev.style.fontFamily = f.id;
        tdPrev.style.fontSize = '1.2rem';

        // Action
        const tdAct = document.createElement('td');
        tdAct.style.textAlign = 'center';
        if (f.isCustom) {
            const btnDel = document.createElement('button');
            btnDel.innerText = '🗑️';
            btnDel.title = 'Excluir Fonte';
            btnDel.style.background = 'none';
            btnDel.style.border = 'none';
            btnDel.style.cursor = 'pointer';
            btnDel.onclick = () => deleteCustomFont(f.id);
            tdAct.appendChild(btnDel);
        } else {
            tdAct.innerHTML = '<span style="color:#666; font-size:0.8rem;">Sistema</span>';
        }

        tr.appendChild(tdChk);
        tr.appendChild(tdName);
        tr.appendChild(tdPrev);
        tr.appendChild(tdAct);
        fontsTableBody.appendChild(tr);

        // Add to Dropdowns
        prefSelects.forEach(sel => {
            const opt = new Option(f.name, f.id);
            sel.appendChild(opt);
        });
    });

    // Set Selected Preferred Fonts
    prefSelects.forEach((sel, idx) => {
        if (preferredFonts[idx]) sel.value = preferredFonts[idx];
    });

    // Text Colors logic
    const textColorsContainer = document.getElementById('global-text-colors');
    textColorsContainer.innerHTML = '';
    const textColors = JSON.parse(localStorage.getItem('hnt_text_colors') || '[]');
    const isFirstLoadColors = !localStorage.getItem('hnt_text_colors');

    if (typeof DATA !== 'undefined' && DATA.colors) {
        DATA.colors.forEach(c => {
            const isActive = isFirstLoadColors || textColors.includes(c.id);
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
        <div class="color-preview" style="background:${c.hex}"></div>
        <span style="flex:1;">${c.name}</span>
        <input type="checkbox" id="text_color_${c.id}" ${isActive ? 'checked' : ''}>
        `;
            textColorsContainer.appendChild(div);
        });
    }

    const prodConfig = JSON.parse(localStorage.getItem('hnt_production_config') || '{"minDays":15, "maxDays":25, "holidays":[]}');
    document.getElementById('global-min-days').value = prodConfig.minDays;
    document.getElementById('global-max-days').value = prodConfig.maxDays;
    document.getElementById('global-holidays').value = (prodConfig.holidays || []).join('\n');



    // WhatsApp Load
    const priceConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');
    document.getElementById('whatsappNumber').value = priceConfig.whatsappNumber || '';
};

window.saveGlobalSettings = function () {
    // Fonts
    const activeFonts = [];
    let allAvailableFonts = [];

    if (typeof DATA !== 'undefined' && DATA.fonts) {
        allAvailableFonts = [...DATA.fonts];
    }
    if (typeof SHARED_FONTS !== 'undefined') {
        SHARED_FONTS.forEach(f => {
            if (!allAvailableFonts.find(existing => existing.id === f.id)) {
                allAvailableFonts.push(f);
            }
        });
    }
    const customFontsData = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    customFontsData.forEach(f => {
        if (!allAvailableFonts.find(existing => existing.id === f.id)) {
            allAvailableFonts.push(f);
        }
    });

    allAvailableFonts.forEach(f => {
        const chk = document.getElementById(`font_${f.id}`);
        if (chk && chk.checked) activeFonts.push(f.id);
    });
    localStorage.setItem('hnt_active_fonts', JSON.stringify(activeFonts));

    // Preferred Fonts
    const preferredFonts = [
        document.getElementById('pref-font-1')?.value || '',
        document.getElementById('pref-font-2')?.value || '',
        document.getElementById('pref-font-3')?.value || '',
        document.getElementById('pref-font-4')?.value || '',
        document.getElementById('pref-font-5')?.value || ''
    ];
    localStorage.setItem('hnt_preferred_fonts', JSON.stringify(preferredFonts));

    // Text Colors
    const textColors = [];
    if (typeof DATA !== 'undefined' && DATA.colors) {
        DATA.colors.forEach(c => {
            const chk = document.getElementById(`text_color_${c.id}`);
            if (chk && chk.checked) textColors.push(c.id);
        });
    }
    localStorage.setItem('hnt_text_colors', JSON.stringify(textColors));

    // Production
    const prodConfig = {
        minDays: parseInt(document.getElementById('global-min-days')?.value) || 15,
        maxDays: parseInt(document.getElementById('global-max-days')?.value) || 25,
        holidays: document.getElementById('global-holidays')?.value.split('\n').map(l => l.trim()).filter(l => l) || []
    };
    localStorage.setItem('hnt_production_config', JSON.stringify(prodConfig));


};


window.deleteCustomFont = function (fontId) {
    if (!confirm('Deseja realmente excluir esta fonte customizada?')) return;

    let customFonts = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    customFonts = customFonts.filter(f => f.id !== fontId);
    localStorage.setItem('hnt_custom_fonts_data', JSON.stringify(customFonts));

    // Allow time for reload
    loadGlobalSettings();
    alert('Fonte excluída com sucesso.');
};

window.handleFontUpload = function (files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fontName = file.name.split('.')[0].replace(/[-_]/g, ' ');
            const fontId = fontName.replace(/\s+/g, '') + '_' + Date.now();

            const newFont = {
                id: fontId,
                name: fontName,
                src: e.target.result
            };

            const customFonts = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
            customFonts.push(newFont);
            localStorage.setItem('hnt_custom_fonts_data', JSON.stringify(customFonts));
        };
        reader.readAsDataURL(file);
    });

    setTimeout(() => {
        alert('Fontes adicionadas! Atualizando lista...');
        loadGlobalSettings();
    }, 1000);
};

// Setup Drop Zone
window.setupFontDropZone = function () {
    const fontDropZone = document.getElementById('font-drop-zone');
    if (fontDropZone) {
        fontDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fontDropZone.style.background = 'rgba(212, 175, 55, 0.2)';
        });
        fontDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fontDropZone.style.background = 'rgba(212, 175, 55, 0.05)';
        });
        fontDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fontDropZone.style.background = 'rgba(212, 175, 55, 0.05)';
            handleFontUpload(e.dataTransfer.files);
        });
    }
    renderCustomFontList();
};


window.renderCustomFontList = function () {
    const list = document.getElementById('custom-font-list');
    if (!list) return;
    const fonts = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');

    if (fonts.length === 0) {
        list.innerHTML = '<li style="color:#666; font-style:italic;">Nenhuma fonte customizada instalada.</li>';
        return;
    }

    list.innerHTML = fonts.map(f => `
    <li
        style="background:#333; padding:8px; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
        <span>${f.name}</span>
        <button onclick="removeCustomFont('${f.name}')"
            style="background:none; border:none; color:#ff6b6b; cursor:pointer;">❌</button>
    </li>
    `).join('');
};

window.removeCustomFont = function (name) {
    if (!confirm(`Remover fonte ${name}?`)) return;
    let fonts = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
    fonts = fonts.filter(f => f.name !== name);
    localStorage.setItem('hnt_custom_fonts_data', JSON.stringify(fonts));
    renderCustomFontList();
    loadGlobalSettings();
};

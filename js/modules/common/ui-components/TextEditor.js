/**
 * Componente: TextEditor
 * Descrição: Controle completo de texto (Input, Font, Color, Scale)
 */

window.UIComponents = window.UIComponents || {};

window.UIComponents.createTextEditor = function ({
    zone,
    textState, // { enabled, content, fontFamily, color, scale, maxLines }
    config,
    fonts,
    colors,
    callbacks // { onToggle, onTextChange, onLinesChange, onFontChange, onColorChange, onScaleChange }
}) {
    const wrap = document.createElement('div');
    wrap.style.marginTop = '10px';
    wrap.style.padding = '10px';
    wrap.style.background = 'rgba(0, 240, 255, 0.03)';
    wrap.style.border = '1px dashed rgba(0, 240, 255, 0.2)';
    wrap.style.borderRadius = '6px';

    // Default state if missing
    const t = textState || { enabled: false, content: "", fontFamily: 'Outfit', color: "#FF0000", scale: 1.0, maxLines: 1 };

    // --- Header / Toggle ---
    const label = document.createElement('label');
    label.className = 'toggle-wrapper';
    label.style.cursor = 'pointer';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.fontWeight = '700';
    label.style.fontSize = '0.9rem';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = t.enabled;
    chk.style.width = '18px';
    chk.style.height = '18px';
    chk.onchange = (e) => {
        if (callbacks.onToggle) callbacks.onToggle(zone.id, e.target.checked);
    };

    label.appendChild(chk);

    const textIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`;

    // Price
    let price = 0;
    if (config) {
        if (zone.category === 'Laterais' || zone.id.includes('lat')) {
            price = config.textLatPrice || 0;
        } else {
            price = config.textPrice || 0;
        }
    }

    const labelSpan = document.createElement('span');
    // We assume InfoSystem check is done outside or passed in, or we implement a fallback
    // For now, simple text
    labelSpan.innerHTML = `${textIcon} ${zone.name.toUpperCase()} <span style="color:var(--accent);">(+R$ ${price.toFixed(2)})</span>`;
    label.appendChild(labelSpan);

    wrap.appendChild(label);

    if (t.enabled) {
        const subPanel = document.createElement('div');
        subPanel.style.marginTop = '10px';
        subPanel.style.display = 'flex';
        subPanel.style.flexDirection = 'column';
        subPanel.style.gap = '8px';

        // 1. Text Input
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = t.content;
        inp.placeholder = 'Digite o texto aqui...';
        inp.className = 'text-input';
        // Inline styles or class? 'text-input' implies logic.css
        inp.style.width = '100%';
        inp.style.background = '#0a0a0a';
        inp.style.color = '#fff';
        inp.style.border = '1px solid var(--accent)';
        inp.oninput = (e) => {
            if (callbacks.onTextChange) callbacks.onTextChange(zone.id, e.target.value);
        };
        subPanel.appendChild(inp);

        const helpInfo = document.createElement('div');
        helpInfo.style.fontSize = '0.75rem';
        helpInfo.style.color = '#666';
        helpInfo.innerText = 'ℹ️ Use "/" para quebrar a linha.';
        subPanel.appendChild(helpInfo);

        // 2. Número de Linhas
        const linesLabel = document.createElement('div');
        linesLabel.style.marginTop = '10px';
        linesLabel.style.fontSize = '0.8rem';
        linesLabel.style.fontWeight = 'bold';
        linesLabel.style.color = '#ccc';
        linesLabel.innerText = 'NÚMERO DE LINHAS:';
        subPanel.appendChild(linesLabel);

        const linesSelect = document.createElement('select');
        linesSelect.style.width = '100%';
        linesSelect.style.padding = '5px';
        linesSelect.style.background = '#111';
        linesSelect.style.color = '#fff';
        linesSelect.style.border = '1px solid #333';
        linesSelect.style.borderRadius = '4px';
        [1, 2, 3].forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.innerText = n + (n === 1 ? ' Linha' : ' Linhas');
            if ((t.maxLines || 1) === n) opt.selected = true;
            linesSelect.appendChild(opt);
        });
        linesSelect.onchange = (e) => {
            if (callbacks.onLinesChange) callbacks.onLinesChange(zone.id, parseInt(e.target.value));
        };
        subPanel.appendChild(linesSelect);

        // 3. Font Selection
        const fontLabel = document.createElement('div');
        fontLabel.style.fontSize = '0.8rem';
        fontLabel.style.fontWeight = 'bold';
        fontLabel.style.color = '#ccc';
        fontLabel.innerText = 'FONTE:';
        subPanel.appendChild(fontLabel);

        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'custom-dropdown';
        dropdownContainer.style.position = 'relative';

        const currentFontObj = fonts.find(f => f.id === t.fontFamily) || fonts[0];

        const trigger = document.createElement('div');
        trigger.className = 'custom-dropdown-trigger';
        trigger.style.background = '#111';
        trigger.style.border = '1px solid #333';
        trigger.style.padding = '8px';
        trigger.style.display = 'flex';
        trigger.style.justifyContent = 'space-between';
        trigger.style.alignItems = 'center';
        trigger.style.cursor = 'pointer';

        const triggerText = document.createElement('span');
        triggerText.innerText = currentFontObj ? currentFontObj.name : 'Selecione...';
        triggerText.style.fontFamily = t.fontFamily;
        trigger.appendChild(triggerText);
        trigger.innerHTML += '<span style="font-size:0.8rem">▼</span>';

        const optionsList = document.createElement('div');
        optionsList.className = 'custom-dropdown-options';
        optionsList.style.display = 'none';
        optionsList.style.position = 'absolute';
        optionsList.style.zIndex = '1000';
        optionsList.style.background = '#1a1a1a';
        optionsList.style.border = '1px solid #333';
        optionsList.style.maxHeight = '200px';
        optionsList.style.overflowY = 'auto';
        optionsList.style.width = '100%';
        optionsList.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';

        fonts.forEach(f => {
            const opt = document.createElement('div');
            opt.className = 'custom-dropdown-option';
            opt.style.padding = '8px';
            opt.style.cursor = 'pointer';
            opt.style.borderBottom = '1px solid #222';
            opt.innerText = f.name;
            opt.style.fontFamily = f.id;

            // Preview on hover (requires callback support or just direct mutation? Better to stick to clicks)
            // Removed onmouseenter to avoid excessive renders/complexity

            opt.onclick = (e) => {
                e.stopPropagation();
                if (callbacks.onFontChange) callbacks.onFontChange(zone.id, f.id);
                // Update trigger immediately for responsiveness?
                // Parent re-render will handle it, but we can do it here too:
                // triggerText.innerText = f.name;
                // triggerText.style.fontFamily = f.id;
                optionsList.style.display = 'none';
            };
            optionsList.appendChild(opt);
        });

        trigger.onclick = (e) => {
            e.stopPropagation();
            const isClosed = optionsList.style.display === 'none';
            // Close others
            document.querySelectorAll('.custom-dropdown-options').forEach(el => el.style.display = 'none');
            optionsList.style.display = isClosed ? 'block' : 'none';
        };

        // Close on outside click logic needed? 
        // We can add a global listener once or rely on existing one if present.
        // For self-contained component, adding listener to document is okay but tricky with removals.
        // We'll assume the app handles global clicks or we add a simple one here.
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                optionsList.style.display = 'none';
            }
        });

        dropdownContainer.appendChild(trigger);
        dropdownContainer.appendChild(optionsList);
        subPanel.appendChild(dropdownContainer);

        // 4. Color Selection
        const colorLabel = document.createElement('div');
        colorLabel.style.fontSize = '0.8rem';
        colorLabel.style.fontWeight = 'bold';
        colorLabel.style.color = '#ccc';
        colorLabel.innerText = 'COR DO TEXTO:';
        subPanel.appendChild(colorLabel);

        if (window.UIComponents && window.UIComponents.createColorPicker) {
            const colorGrid = window.UIComponents.createColorPicker(colors, null, (colorId, colorObj) => {
                if (callbacks.onColorChange) callbacks.onColorChange(zone.id, colorObj.hex);
            });
            // highlight logic is inside createColorPicker based on selectedColorId
            // But we need to pass selected ID. 'colors' usually has 'id' and 'hex'. 
            // textState has 'color' (hex).
            // minimal fix:

            // Re-call with correct selected ID logic
            const selectedColorObj = colors.find(c => c.hex === t.color);
            const selectedId = selectedColorObj ? selectedColorObj.id : null;

            const colorGridCorrect = window.UIComponents.createColorPicker(colors, selectedId, (id, c) => {
                if (callbacks.onColorChange) callbacks.onColorChange(zone.id, c.hex);
            });
            subPanel.appendChild(colorGridCorrect);
        } else {
            subPanel.innerText = "ColorPicker not available";
        }

        // 5. Scale Slider (Non-linear mapping: 70% area for reduction)
        // Mapeamento: 
        // 0 - 70   => 0.05 - 1.0 (Redução)
        // 70 - 100 => 1.0 - 4.0  (Ampliação)
        const valToSlider = (val) => {
            if (val <= 1.0) {
                // Mapeia linear de [0.05, 1.0] para [0, 70]
                return ((val - 0.05) / (1.0 - 0.05)) * 70;
            } else {
                // Mapeia linear de [1.0, 4.0] para [70, 100]
                return 70 + ((val - 1.0) / (4.0 - 1.0)) * 30;
            }
        };

        const sliderToVal = (sliderVal) => {
            if (sliderVal <= 70) {
                // Mapeia de [0, 70] para [0.05, 1.0]
                return 0.05 + (sliderVal / 70) * (1.0 - 0.05);
            } else {
                // Mapeia de [70, 100] para [1.0, 4.0]
                return 1.0 + ((sliderVal - 70) / 30) * (4.0 - 1.0);
            }
        };

        const sizeRow = document.createElement('div');
        sizeRow.style.display = 'flex';
        sizeRow.style.alignItems = 'center';
        sizeRow.style.gap = '10px';

        const sizeLabel = document.createElement('span');
        sizeLabel.style.fontSize = '0.7rem';
        sizeLabel.style.color = '#aaa';
        sizeLabel.innerText = 'TAMANHO:';
        sizeRow.appendChild(sizeLabel);

        const sl = document.createElement('input');
        sl.className = 'range-slider';
        sl.type = 'range';
        sl.min = 0; sl.max = 100; sl.step = 1;
        sl.value = valToSlider(t.scale);
        sl.style.flex = '1';

        const num = document.createElement('input');
        num.type = 'number'; num.min = 0.05; num.max = 4.0; num.step = 0.05; num.value = t.scale.toFixed(2);
        num.style.width = '75px';
        num.style.padding = '4px 8px';
        num.style.boxSizing = 'border-box';
        num.style.textAlign = 'center';
        num.style.background = '#000';
        num.style.color = '#fff';
        num.style.border = '1px solid #444';
        num.style.borderRadius = '4px';
        num.style.fontSize = '0.9rem';
        num.style.lineHeight = '1.2';

        sl.oninput = (e) => {
            const sliderVal = parseFloat(e.target.value);
            const val = sliderToVal(sliderVal);
            num.value = val.toFixed(2);
            if (callbacks.onScaleChange) callbacks.onScaleChange(zone.id, val);
        };

        num.oninput = (e) => {
            let val = parseFloat(e.target.value) || 1.0;
            if (val < 0.05) val = 0.05;
            if (val > 4.0) val = 4.0;
            sl.value = valToSlider(val);
            if (callbacks.onScaleChange) callbacks.onScaleChange(zone.id, val);
        };

        sizeRow.appendChild(sl);
        sizeRow.appendChild(num);
        subPanel.appendChild(sizeRow);

        wrap.appendChild(subPanel);
    }

    return wrap;
}

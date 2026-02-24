/**
 * Componente: SizeSelector
 * Descrição: Grid de inputs para quantidade de cada tamanho.
 */

window.UIComponents = window.UIComponents || {};

window.UIComponents.createSizeSelector = function (sizes, currentValues, config, onChange) {
    const qtyWrap = document.createElement('div');
    qtyWrap.className = 'category-group';

    // Header
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = 'Tamanhos <span class="size-icon-placeholder"></span>'; // Placeholder for icon
    qtyWrap.appendChild(header);

    const sizeGrid = document.createElement('div');
    sizeGrid.style.display = 'flex';
    sizeGrid.style.flexWrap = 'wrap';
    sizeGrid.style.gap = '8px';
    sizeGrid.style.justifyContent = 'flex-start';

    if (!sizes || sizes.length === 0) {
        sizeGrid.innerText = 'Nenhum tamanho configurado.';
        qtyWrap.appendChild(sizeGrid);
        return qtyWrap;
    }

    sizes.forEach(s => {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.alignItems = 'center';
        wrap.style.flex = '0 0 auto';

        // Price mod check
        const modPrice = (s.priceMod > 0 && config) ? (config.sizeModPrice || 0) : 0;

        const labelDiv = document.createElement('div');
        labelDiv.style.fontSize = '0.75rem';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.marginBottom = '2px';
        labelDiv.innerText = s.label;
        if (modPrice > 0) labelDiv.style.color = '#00b4d8';

        wrap.appendChild(labelDiv);

        const inp = document.createElement('input');
        inp.id = `input-qty-${s.label}`;
        inp.type = 'number';
        inp.min = 0;
        inp.value = currentValues[s.label] || 0;
        inp.className = 'size-input'; // Use class for styling ideally, but inline for now

        // Inline styles for consistency with current design
        inp.style.textAlign = 'center';
        inp.style.padding = '6px 0';
        inp.style.borderRadius = '4px';
        inp.style.border = '1px solid #444';
        inp.style.background = '#111';
        inp.style.color = '#fff';
        inp.style.fontSize = '1rem';
        inp.style.outline = 'none';

        const updateWidth = (val) => {
            const len = val.toString().length;
            const w = 36 + Math.max(0, len - 2) * 9;
            inp.style.width = `${w}px`;
        };

        updateWidth(inp.value);

        inp.oninput = (e) => {
            const val = e.target.value;
            const intVal = parseInt(val) || 0;
            updateWidth(val);
            if (onChange) onChange(s.label, intVal);
        };

        wrap.appendChild(inp);
        sizeGrid.appendChild(wrap);
    });

    qtyWrap.appendChild(sizeGrid);
    return qtyWrap;
}

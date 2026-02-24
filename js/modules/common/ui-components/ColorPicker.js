/**
 * Componente: ColorPicker
 * Descrição: Grid de seleção de cores
 */

window.UIComponents = window.UIComponents || {};

window.UIComponents.createColorPicker = function (colors, selectedColorId, onSelect, options = {}) {
    const grid = document.createElement('div');
    grid.className = 'color-grid';
    if (options.className) grid.classList.add(options.className);

    if (!colors || colors.length === 0) {
        grid.innerText = 'Sem cores disponíveis';
        grid.style.color = '#888';
        return grid;
    }

    colors.forEach(c => {
        const d = document.createElement('div');
        d.className = `color-option ${c.id === selectedColorId ? 'selected' : ''}`;
        d.style.backgroundColor = c.hex;
        d.title = c.name;

        // Hook for custom customization (e.g. disable colors)
        if (options.onRenderOption) {
            options.onRenderOption(d, c);
        }

        // Handling white/bright colors visibility if needed
        if (c.hex.toUpperCase() === '#FFFFFF') {
            d.style.border = '1px solid #ccc';
        }

        d.onclick = (e) => {
            e.stopPropagation();
            // Remove 'selected' from siblings
            Array.from(grid.children).forEach(child => child.classList.remove('selected'));
            d.classList.add('selected');

            if (onSelect) onSelect(c.id, c);
        };
        grid.appendChild(d);
    });

    return grid;
}

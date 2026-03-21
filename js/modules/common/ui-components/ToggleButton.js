/**
 * Componente: ToggleButton
 * Descrição: Botão de alternância (ex: para Extras) com ícone, texto e preço
 */

window.UIComponents = window.UIComponents || {};

window.UIComponents.createToggleButton = function ({
    id,
    label,
    iconHtml,
    price = 0,
    requestActive,
    onToggle,
    colorName = ''
}) {
    const btn = document.createElement('div');
    btn.className = `btn-toggle-extra ${requestActive ? 'active' : ''}`;
    btn.dataset.id = id;

    // Price formatting
    const priceFormatted = price > 0 ? `+ R$ ${price.toFixed(2).replace('.', ',')}` : '';

    // Structure
    let html = '';
    if (iconHtml) html += `<span class="toggle-icon">${iconHtml}</span>`;

    html += `<span style="flex:1; display:flex; flex-direction:column; justify-content:center;">`;
    html += `<span class="toggle-label">${label.toUpperCase()}</span>`;
    if (colorName) html += `<span style="font-size:0.75rem; color:#aaa;">${colorName}</span>`;
    html += `</span>`;

    if (priceFormatted) html += `<span class="price-tag">${priceFormatted}</span>`;

    btn.innerHTML = html;

    // Event
    btn.onclick = (e) => {
        e.stopPropagation();
        const isActive = btn.classList.contains('active');
        // Toggle visual state immediately or wait for parent re-render?
        // Usually safer to wait for re-render, but for responsiveness we might toggle class.
        // However, if the parent re-renders the whole list, this element will be replaced anyway.
        if (onToggle) onToggle(!isActive);
    };

    return btn;
}

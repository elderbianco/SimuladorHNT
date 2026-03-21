/**
 * Módulo de Galeria - Shorts (Restaurado)
 * Lógica original para exibir e selecionar ícones do acervo
 */

let currentPendingZone = null;

function openGallery(zoneId) {
    currentPendingZone = zoneId;
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderGallery();

        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = (e) => renderGallery(e.target.value);
            setTimeout(() => searchInput.focus(), 100);
        }
    }
}

function closeGallery() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.style.display = 'none';
}

function renderGallery(searchTerm = '') {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const term = searchTerm.toLowerCase();

    // Agrupar por categorias (Padrão original)
    const categories = [...new Set(SHARED_GALLERY.map(item => item.category))];

    categories.forEach(cat => {
        const filtered = SHARED_GALLERY.filter(item =>
            item.category === cat &&
            (item.name.toLowerCase().includes(term) || cat.toLowerCase().includes(term))
        );

        if (filtered.length > 0) {
            const section = document.createElement('div');
            section.className = 'gallery-category-section';
            section.style.width = '100%';
            section.style.marginBottom = '20px';
            section.innerHTML = `<h4 style="color:var(--gold-primary); border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:10px; width:100%;">${cat}</h4>`;

            const itemsContainer = document.createElement('div');
            itemsContainer.style.display = 'grid';
            itemsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
            itemsContainer.style.gap = '10px';

            filtered.forEach(item => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.style.cursor = 'pointer';
                div.style.textAlign = 'center';
                div.style.padding = '5px';
                div.style.border = '1px solid #333';
                div.style.borderRadius = '4px';
                div.style.background = '#111';
                div.onmouseover = () => div.style.borderColor = 'var(--gold-primary)';
                div.onmouseout = () => div.style.borderColor = '#333';
                div.onclick = () => selectGalleryImage(item);

                div.innerHTML = `
                    <img src="${item.src}" style="width:100%; height:60px; object-fit:contain; margin-bottom:5px;">
                    <div style="font-size:0.7rem; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                `;
                itemsContainer.appendChild(div);
            });

            section.appendChild(itemsContainer);
            grid.appendChild(section);
        }
    });
}

function selectGalleryImage(item) {
    if (!currentPendingZone) return;

    console.log(`[Gallery] Selecionado: ${item.name} para zona ${currentPendingZone}`);

    // Chamar a função de inserção do Shorts (que já padronizamos para addImageToZone)
    if (typeof addImageToZone === 'function') {
        addImageToZone(currentPendingZone, item.src, item.name);
    } else {
        console.error("Função addImageToZone não encontrada no Shorts.");
    }

    closeGallery();
}

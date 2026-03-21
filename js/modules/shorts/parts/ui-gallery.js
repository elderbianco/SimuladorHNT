/**
 * Módulo de Galeria e Acervo
 * Funções: openGallery, closeGallery, renderGalleryView, selectGalleryItem
 */

// ------------------- GALLERY -------------------
function openGallery(zoneId) {
    state.pendingUploadZone = zoneId;
    currentGalleryCategory = null; // Reset category when opening
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.style.display = 'flex';
        if (typeof renderGalleryView === 'function') renderGalleryView();
    }
}

function closeGallery() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.style.display = 'none';
}
window.closeGallery = closeGallery;

function renderGalleryView(searchTerm = "") {
    const g = document.getElementById('gallery-grid');
    if (!g) return;
    g.innerHTML = '';

    const galleryData = (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY : [];

    // SEARCH FILTER
    if (searchTerm && searchTerm.trim().length > 0) {
        const term = searchTerm.toLowerCase();
        const results = galleryData.filter(i => i.name.toLowerCase().includes(term));

        if (results.length === 0) {
            g.innerHTML = `<div style="text-align:center; padding:20px; color:#666; width:100%;">Nenhuma imagem encontrada para "${searchTerm}"</div>`;
            return;
        }

        results.forEach(i => {
            const d = document.createElement('div');
            d.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = i.src;

            d.appendChild(img);
            const span = document.createElement('span');
            span.innerText = i.name;
            d.appendChild(span);

            d.onclick = () => selectGalleryItem(i);
            g.appendChild(d);
        });
        return;
    }

    // CATEGORY/FOLDER VIEW
    if (!currentGalleryCategory) {
        const categories = [...new Set(galleryData.map(i => i.category || 'Gerais'))];
        const categoryIcons = {
            "Logos Hanuthai": "assets/Shorts/UiIcons/thumb_logos_hanuthai.png",
            "Animais": "assets/Shorts/UiIcons/thumb_animais.png",
            "Bandeiras": "assets/Shorts/UiIcons/thumb_bandeiras.png",
            "Personagens": "assets/Shorts/UiIcons/thumb_personagens.png",
            "Gerais": "assets/Shorts/UiIcons/thumb_gerais.png"
        };

        categories.forEach(cat => {
            const d = document.createElement('div');
            d.className = 'gallery-folder';
            const iconSrc = categoryIcons[cat] || "assets/Shorts/UiIcons/thumb_gerais.png";

            const img = document.createElement('img');
            img.src = iconSrc;
            img.className = 'folder-image-icon';
            img.alt = cat;

            const label = document.createElement('div');
            label.className = 'folder-label';
            label.innerText = cat;

            d.appendChild(img);
            d.appendChild(label);
            d.onclick = () => { currentGalleryCategory = cat; renderGalleryView(); };
            g.appendChild(d);
        });
    } else {
        // BACK BUTTON
        const backBtn = document.createElement('button');
        backBtn.className = 'gallery-back-btn';
        backBtn.innerText = '↩ Voltar para Pastas';
        backBtn.onclick = () => { currentGalleryCategory = null; renderGalleryView(); };
        const backContainer = document.createElement('div');
        backContainer.style.gridColumn = "1 / -1";
        backContainer.appendChild(backBtn);
        g.appendChild(backContainer);

        // ITEMS IN CATEGORY
        const items = galleryData.filter(i => (i.category || 'Gerais') === currentGalleryCategory);
        items.forEach(i => {
            const d = document.createElement('div');
            d.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = i.src;

            const span = document.createElement('span');
            span.innerText = i.name;

            d.appendChild(img);
            d.appendChild(span);
            d.onclick = () => selectGalleryItem(i);
            g.appendChild(d);
        });
    }
}

function selectGalleryItem(item) {
    if (!state.pendingUploadZone) return;

    // Generate Production Filename (ACERVO source)
    // Ensure function exists via logic.js check, or fallback
    let finalName = '';
    if (typeof generateFormattedFilename === 'function') {
        finalName = generateFormattedFilename(state.pendingUploadZone, item.name, 'ACERVO');
    }

    if (!state.uploads[state.pendingUploadZone]) {
        state.uploads[state.pendingUploadZone] = {};
    }

    state.uploads[state.pendingUploadZone].src = item.src;
    state.uploads[state.pendingUploadZone].filename = `[Galeria] ${item.name}`;
    state.uploads[state.pendingUploadZone].formattedFilename = finalName;
    state.uploads[state.pendingUploadZone].isCustom = false;

    // Auto-enable limit for ANY zone
    if (typeof toggleLimit === 'function') toggleLimit(state.pendingUploadZone, true);

    if (typeof scheduleRender === 'function') scheduleRender(true);
    window.closeGallery();
}

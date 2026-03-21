// GALLERY MANAGEMENT LOGIC

// 1. Render & Populate
window.renderGalleryAdmin = function () {
    if (typeof DATA === 'undefined' || !DATA.gallery) {
        console.error("DATA.gallery not loaded!");
        return;
    }

    const grid = document.getElementById('admin-gallery-grid');
    const filterSelect = document.getElementById('gallery-filter');
    const uploadSelect = document.getElementById('upload-category-select');

    if (!grid || !filterSelect || !uploadSelect) return;

    const currentFilter = filterSelect.value || 'all';
    const currentUploadCat = uploadSelect.value; // Store previous selection

    grid.innerHTML = '';

    // Get Unique Categories Logic
    const rawCategories = DATA.gallery.map(i => i.category).filter(c => c); // Valid categories only
    const categories = [...new Set(rawCategories)].sort();

    // 1.1 Populate Filter
    // Clear but keep first 'all' option
    while (filterSelect.options.length > 1) filterSelect.remove(1);

    categories.forEach(cat => {
        const option = new Option(cat, cat);
        if (cat === currentFilter) option.selected = true;
        filterSelect.appendChild(option);
    });

    // If current filter is invalid (deleted category), reset to 'all'
    if (currentFilter !== 'all' && !categories.includes(currentFilter)) {
        filterSelect.value = 'all';
    }

    // 1.2 Populate Upload Select
    const isCustomEntry = currentUploadCat && !categories.includes(currentUploadCat) && currentUploadCat !==
        'NEW_CAT_TRIGGER';

    uploadSelect.innerHTML = '';
    categories.forEach(cat => {
        const option = new Option(cat, cat);
        if (cat === currentUploadCat) option.selected = true;
        uploadSelect.appendChild(option);
    });
    // Preserve custom entered category if it's not yet in the official list (edge case) or add new
    const newOption = new Option("➕ Nova Categoria...", "NEW_CAT_TRIGGER");
    uploadSelect.appendChild(newOption);

    if (isCustomEntry) {
        // If the user was typing a new category that hasn't been saved yet, we don't strictly need to add it to dropdown
        // because the input field handles it. Just ensure input is shown if needed.
    }

    // 1.3 Render Grid
    if (DATA.gallery.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; padding: 20px;">Nenhuma imagem encontrada. <button onclick="resetGalleryFactory()" style="cursor:pointer; text-decoration:underline; border:none; background:none; color:#D4AF37;">Restaurar Padrões</button></div>';
        return;
    }

    DATA.gallery.forEach((item) => {
        // Filter Logic
        if (currentFilter !== 'all' && item.category !== currentFilter) return;

        const card = document.createElement('div');
        card.className = 'section';
        card.style.padding = '10px';
        card.style.textAlign = 'center';
        card.style.position = 'relative';

        card.innerHTML = `
    <div style="height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
        <img src="${item.src}" style="max-width: 100%; max-height: 100%; object-fit: contain;"
            onerror="this.src='https://placehold.co/100x100?text=Error'">
    </div>
    <div style="font-size: 0.8rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;"
        title="${item.name}">${item.name}</div>
    <div onclick="editItemCategory('${item.src}', '${item.category}')"
        style="font-size: 0.7rem; color: #D4AF37; cursor: pointer; margin-top: 4px; border: 1px dashed #444; padding: 2px; border-radius: 4px;"
        title="Clique para alterar categoria">
        ${item.category} ✏️
    </div>
    <button onclick="removeGalleryItem('${item.src}')" style="
                        position: absolute; top: 5px; right: 5px; 
                        background: rgba(220, 53, 69, 0.9); color: #fff; border: none; 
                        border-radius: 50%; width: 22px; height: 22px; cursor: pointer;
                        display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;
                    ">×</button>
    `;
        grid.appendChild(card);
    });
};

// Logic: Restore Factory Settings (Debug)
window.resetGalleryFactory = function () {
    if (confirm("Isso irá restaurar as imagens originais que foram 'deletadas'. Suas imagens de upload continuarão aqui. Continuar?")) {
        localStorage.removeItem('hnt_gallery_deleted');
        location.reload();
    }
};

// Logic: Edit Category
window.editItemCategory = function (src, currentCat) {
    const existingCats = [...new Set(DATA.gallery.map(i => i.category))].sort();

    const newCat = prompt(`Mover "${currentCat}" para:\n(Digite uma nova ou existente)`, currentCat);

    if (newCat && newCat.trim() !== "" && newCat !== currentCat) {
        const finalCat = newCat.trim();

        // Determine if item is Custom or Default
        let customGallery = JSON.parse(localStorage.getItem('hnt_gallery_custom') || '[]');
        const customIndex = customGallery.findIndex(i => i.src === src);

        if (customIndex !== -1) {
            // Update Custom
            customGallery[customIndex].category = finalCat;
            localStorage.setItem('hnt_gallery_custom', JSON.stringify(customGallery));
        } else {
            // Update Default (Copy-on-write strategy)
            const originalItem = DATA.gallery.find(i => i.src === src);
            if (!originalItem) return;

            // Hide original
            removeGalleryItem(src, true);

            // Create new custom
            const newItem = { ...originalItem, category: finalCat };
            customGallery = JSON.parse(localStorage.getItem('hnt_gallery_custom') || '[]'); // Re-read to be safe
            customGallery.push(newItem);
            localStorage.setItem('hnt_gallery_custom', JSON.stringify(customGallery));
        }

        // Force Reload to ensure DATA syncs up logic from shorts-data.js IIFE
        // But for better UX, we can just reload page or manually update DATA.
        // Manual update is complex because of the "deleted" list logic.
        // Simple reload is safest for data integrity.
        alert('Categoria atualizada! A página será atualizada.');
        location.reload();
    }
};

// UX: Toggle New Category Input
window.toggleNewCategoryInput = function (select) {
    const input = document.getElementById('new-category-input');
    if (select.value === 'NEW_CAT_TRIGGER') {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    } else {
        input.style.display = 'none';
        select.style.display = 'block';
    }
};

// Logic: Delete Category
window.deleteCurrentCategory = function () {
    const currentFilter = document.getElementById('gallery-filter').value;
    if (currentFilter === 'all') {
        alert('Por favor, selecione uma categoria específica no filtro para excluí-la.');
        return;
    }
    if (!confirm(`⚠️ ATENÇÃO: Deseja realmente excluir TODAS as imagens da categoria "${currentFilter}"? Esta ação removerá as imagens da visualização.`)) return;

    const toDelete = DATA.gallery.filter(i => i.category === currentFilter).map(i => i.src);
    toDelete.forEach(src => removeGalleryItem(src, true));

    alert('Categoria removida.');
    // Update UI
    document.getElementById('gallery-filter').value = 'all';
    // We need to trigger a full re-render which might require reloading data,
    // but since removeGalleryItem updates localStorage/arrays, we might be ok.
    // However, to be safe and clear the dropdown option:
    renderGalleryAdmin();
};

window.setupGalleryUpload = function () {
    // 2. Upload Logic
    const dropZone = document.getElementById('gallery-drop-zone');
    const fileInput = document.getElementById('gallery-upload-input');

    if (!dropZone || !fileInput) return;

    // PREVENT BUBBLING: Only trigger file input if clicked directly on zone or text
    dropZone.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'OPTION') {
            e.stopPropagation();
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFiles);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#D4AF37';
        dropZone.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        dropZone.style.backgroundColor = 'transparent';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        dropZone.style.backgroundColor = 'transparent';
        handleFiles({ target: { files: e.dataTransfer.files } });
    });
};

function handleFiles(e) {
    const files = [...e.target.files];
    if (files.length === 0) return;

    const select = document.getElementById('upload-category-select');
    const input = document.getElementById('new-category-input');
    let category = select.value;

    // Handle New Category Input
    if (category === 'NEW_CAT_TRIGGER') {
        category = input.value.trim();
        if (!category) {
            alert('Por favor, digite o nome da nova categoria.');
            return;
        }
        // Reset UI
        input.style.display = 'none';
        input.value = '';
        select.style.display = 'block';
    }

    let processedCount = 0;
    const newItems = [];

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            processedCount++;
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            newItems.push({
                name: file.name.split('.')[0],
                src: event.target.result,
                category: category
            });

            processedCount++;
            if (processedCount === files.length) {
                saveGalleryItemsBatch(newItems);
            }
        };
        reader.readAsDataURL(file);
    });

    // Clear input so change event triggers again for same file if needed
    const fileInput = document.getElementById('gallery-upload-input');
    if (fileInput) fileInput.value = '';
}

function saveGalleryItemsBatch(items) {
    if (items.length === 0) return;

    let customGallery = JSON.parse(localStorage.getItem('hnt_gallery_custom') || '[]');

    // Add items
    items.forEach(item => {
        customGallery.push(item);
        DATA.gallery.push(item);
    });

    localStorage.setItem('hnt_gallery_custom', JSON.stringify(customGallery));

    // Sync to server
    fetch('/api/admin/config/hnt_gallery_custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customGallery)
    }).catch(e => console.error('❌ Failed to sync gallery custom:', e));

    renderGalleryAdmin();
    alert(`${items.length} imagem(ns) adicionada(s) à categoria "${items[0].category}"!`);
}

// 3. Delete Logic
window.removeGalleryItem = function (src, silent = false) {
    if (!silent && !confirm('Tem certeza que deseja remover esta imagem?')) return;

    // Check Custom
    let customGallery = JSON.parse(localStorage.getItem('hnt_gallery_custom') || '[]');
    const initialLen = customGallery.length;
    customGallery = customGallery.filter(i => i.src !== src);

    if (customGallery.length < initialLen) {
        // Was Custom
        localStorage.setItem('hnt_gallery_custom', JSON.stringify(customGallery));
    } else {
        // Was Default -> Add to Blocklist
        let deletedItems = JSON.parse(localStorage.getItem('hnt_gallery_deleted') || '[]');
        if (!deletedItems.includes(src)) {
            deletedItems.push(src);
            localStorage.setItem('hnt_gallery_deleted', JSON.stringify(deletedItems));

            // Sync to server
            fetch('/api/admin/config/hnt_gallery_deleted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deletedItems)
            }).catch(e => console.error('❌ Failed to sync gallery deleted:', e));
        }
    }

    if (customGallery.length < initialLen) {
        // Sync custom if it was updated
        fetch('/api/admin/config/hnt_gallery_custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customGallery)
        }).catch(e => console.error('❌ Failed to sync gallery custom:', e));
    }

    // Update Runtime Array (Critical for display)
    DATA.gallery = DATA.gallery.filter(i => i.src !== src);

    if (!silent) renderGalleryAdmin();
};

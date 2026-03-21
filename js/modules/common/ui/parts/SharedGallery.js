/**
 * Shared Gallery Component (v1)
 * Centralizes image selection logic across all HNT simulators.
 * Handles categories, search, visibility fixes, and state integration.
 */

// Global State for Gallery View
if (typeof window.currentGalleryCategory === 'undefined') window.currentGalleryCategory = null;

const SharedGallery = {
    /**
     * Abre a galeria para uma zona específica
     * @param {string} zoneId - ID da zona de upload
     */
    open: function (zoneId) {
        console.log(`[SharedGallery] Abrindo para zona: ${zoneId}`);

        // Integrar com os diferentes formatos de estado dos simuladores
        if (typeof state !== 'undefined') {
            if (typeof state.pendingUploadZone !== 'undefined') state.pendingUploadZone = zoneId;
            if (typeof state.pending !== 'undefined') state.pending = zoneId;
        }

        window.currentGalleryCategory = null; // Reiniciar categoria ao abrir

        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.render();
            // Focar busca
            const search = document.getElementById('gallery-search');
            if (search) search.focus();
        } else {
            console.error('[SharedGallery] Modal "gallery-modal" não encontrado no DOM');
        }
    },

    /**
     * Fecha a galeria
     */
    close: function () {
        const modal = document.getElementById('gallery-modal');
        if (modal) modal.style.display = 'none';
    },

    /**
     * Renderiza o conteúdo da galeria (Pastas ou Imagens)
     * @param {string} searchTerm - Termo de busca opcional
     */
    render: function (searchTerm = "") {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Obter dados da base global ou local
        const galleryData = (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY :
            (typeof DATA !== 'undefined' && DATA.gallery ? DATA.gallery : []);

        if (galleryData.length === 0) {
            grid.innerHTML = `<div style="text-align:center; padding:20px; color:#888; width:100%;">Nenhuma imagem disponível no banco.</div>`;
            return;
        }

        // --- MODO BUSCA ---
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.toLowerCase();
            const results = galleryData.filter(i =>
                (i.name && i.name.toLowerCase().includes(term)) ||
                (i.category && i.category.toLowerCase().includes(term))
            );

            if (results.length === 0) {
                grid.innerHTML = `<div style="text-align:center; padding:20px; color:#888; width:100%;">Nenhuma imagem encontrada para "${searchTerm}".</div>`;
                return;
            }

            results.forEach(i => this.appendItem(grid, i));
            return;
        }

        // --- MODO CATEGORIAS (FOLDERS) ---
        if (!window.currentGalleryCategory) {
            const categories = [...new Set(galleryData.map(i => i.category || 'Gerais'))];

            const categoryIcons = {
                "Logos Hanuthai": "assets/Shorts/UiIcons/thumb_logos_hanuthai.png",
                "Animais": "assets/Shorts/UiIcons/thumb_animais.png",
                "Bandeiras": "assets/Shorts/UiIcons/thumb_bandeiras.png",
                "Personagens": "assets/Shorts/UiIcons/thumb_personagens.png",
                "Gerais": "assets/Shorts/UiIcons/thumb_gerais.png"
            };

            categories.forEach(cat => {
                const folder = document.createElement('div');
                folder.className = 'gallery-folder';
                const iconSrc = categoryIcons[cat] || "assets/Shorts/UiIcons/thumb_gerais.png";

                // Forçar cor escura nas labels para visibilidade no modal branco
                folder.innerHTML = `
                    <img src="${iconSrc}" class="folder-image-icon" onerror="this.src='assets/Shorts/UiIcons/thumb_gerais.png'">
                    <div class="folder-label" style="color: #333 !important;">${cat}</div>
                `;
                folder.onclick = () => {
                    window.currentGalleryCategory = cat;
                    this.render();
                };
                grid.appendChild(folder);
            });
        }
        // --- MODO ITENS DA CATEGORIA ---
        else {
            // Botão Voltar
            const backBtn = document.createElement('button');
            backBtn.className = 'gallery-back-btn';
            backBtn.innerHTML = '↩ Voltar para Categorias';
            backBtn.onclick = () => {
                window.currentGalleryCategory = null;
                this.render();
            };
            grid.appendChild(backBtn);

            const items = galleryData.filter(i => (i.category || 'Gerais') === window.currentGalleryCategory);
            items.forEach(i => this.appendItem(grid, i));
        }
    },

    /**
     * Adiciona um item (imagem) ao grid
     */
    appendItem: function (container, item) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.style.border = '1px solid #eee';
        div.style.background = '#fff';

        // Label com cor forçada para visibilidade
        div.innerHTML = `
            <img src="${item.src}" onerror="this.style.display='none'">
            <span style="color: #444 !important; font-weight: 500;">${item.name}</span>
        `;

        div.onclick = () => {
            const finalZoneId = (typeof state !== 'undefined') ? (state.pendingUploadZone || state.pending) : null;

            if (typeof handleZoneUpload === 'function') {
                handleZoneUpload(finalZoneId, item.src);
            } else if (typeof addImageToZone === 'function') {
                addImageToZone(finalZoneId, item.src);
            } else if (typeof createImageElement === 'function') {
                createImageElement(finalZoneId, item.src, false);
            } else {
                console.warn('[SharedGallery] Nenhuma função de upload encontrada para processar a seleção');
            }
            this.close();
        };
        container.appendChild(div);
    },

    /**
     * Inicializa eventos (chamado uma única vez)
     */
    init: function () {
        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            // Remover listeners antigos se houver (substituindo o elemento ou usando removeEventListener)
            const newSearch = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearch, searchInput);

            newSearch.addEventListener('input', (e) => {
                this.render(e.target.value);
            });
        }

        // Expor globais para compatibilidade legada (onclick nos botões HTML)
        window.openGallery = (zId) => this.open(zId);
        window.closeGallery = () => this.close();
        window.renderGalleryView = (term) => this.render(term); // Compatibilidade Shorts
        window.renderGallery = (term) => this.render(term);     // Compatibilidade Moletom
    }
};

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SharedGallery.init());
} else {
    SharedGallery.init();
}

window.SharedGallery = SharedGallery;

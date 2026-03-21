/**
 * ImageGallery - Modal de galeria de imagens
 * Componente reutilizável para seleção de imagens de uma galeria
 */

import { DOMHelpers } from '../utils/DOMHelpers.js';

export class ImageGallery {
    /**
     * @param {Object} options - Opções de configuração
     * @param {Array<Object>} options.images - Array de imagens {src, name, category}
     * @param {Function} options.onSelect - Callback ao selecionar imagem
     * @param {Function} options.onClose - Callback ao fechar galeria
     * @param {string} options.title - Título da galeria
     * @param {boolean} options.showSearch - Mostrar barra de busca (padrão: true)
     * @param {boolean} options.showCategories - Mostrar filtro de categorias (padrão: false)
     */
    constructor(options = {}) {
        this.images = options.images || [];
        this.onSelect = options.onSelect || (() => { });
        this.onClose = options.onClose || (() => { });
        this.title = options.title || 'Galeria de Imagens';
        this.showSearch = options.showSearch !== false;
        this.showCategories = options.showCategories || false;

        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.modalElement = null;
    }

    /**
     * Abre a galeria
     */
    open() {
        if (this.modalElement) {
            this.close();
        }

        this.modalElement = this.render();
        document.body.appendChild(this.modalElement);

        // Adicionar classe ao body para prevenir scroll
        document.body.style.overflow = 'hidden';

        // Focar na busca se disponível
        if (this.showSearch) {
            const searchInput = this.modalElement.querySelector('.gallery-search');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    /**
     * Fecha a galeria
     */
    close() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }

        // Restaurar scroll do body
        document.body.style.overflow = '';

        this.onClose();
    }

    /**
     * Renderiza a galeria
     * @returns {HTMLElement}
     */
    render() {
        const modal = DOMHelpers.createElement('div', {
            className: 'gallery-modal',
            onClick: (e) => {
                // Fechar ao clicar no backdrop
                if (e.target === modal) {
                    this.close();
                }
            }
        });

        const content = DOMHelpers.createElement('div', {
            className: 'gallery-content'
        });

        // Header
        const header = this.renderHeader();
        content.appendChild(header);

        // Search bar
        if (this.showSearch) {
            const searchBar = this.renderSearchBar();
            content.appendChild(searchBar);
        }

        // Categories filter
        if (this.showCategories) {
            const categories = this.renderCategories();
            content.appendChild(categories);
        }

        // Image grid
        const grid = this.renderGrid();
        content.appendChild(grid);

        modal.appendChild(content);

        return modal;
    }

    /**
     * Renderiza o header
     * @returns {HTMLElement}
     */
    renderHeader() {
        const header = DOMHelpers.createElement('div', {
            className: 'gallery-header'
        });

        const title = DOMHelpers.createElement('h2', {
            className: 'gallery-title'
        }, [this.title]);

        const closeBtn = DOMHelpers.createElement('button', {
            type: 'button',
            className: 'gallery-close-btn',
            onClick: () => this.close()
        }, ['✕']);

        header.appendChild(title);
        header.appendChild(closeBtn);

        return header;
    }

    /**
     * Renderiza a barra de busca
     * @returns {HTMLElement}
     */
    renderSearchBar() {
        const searchContainer = DOMHelpers.createElement('div', {
            className: 'gallery-search-container'
        });

        const searchInput = DOMHelpers.createElement('input', {
            type: 'text',
            className: 'gallery-search',
            placeholder: 'Buscar imagens...',
            value: this.searchTerm,
            onInput: (e) => {
                this.searchTerm = e.target.value;
                this.updateGrid();
            }
        });

        const searchIcon = DOMHelpers.createElement('span', {
            className: 'search-icon'
        }, ['🔍']);

        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);

        return searchContainer;
    }

    /**
     * Renderiza filtro de categorias
     * @returns {HTMLElement}
     */
    renderCategories() {
        const categories = this.getCategories();

        const container = DOMHelpers.createElement('div', {
            className: 'gallery-categories'
        });

        // Botão "Todas"
        const allBtn = DOMHelpers.createElement('button', {
            type: 'button',
            className: `category-btn ${this.selectedCategory === 'all' ? 'active' : ''}`,
            onClick: () => this.selectCategory('all')
        }, ['Todas']);

        container.appendChild(allBtn);

        // Botões de categorias
        categories.forEach(category => {
            const btn = DOMHelpers.createElement('button', {
                type: 'button',
                className: `category-btn ${this.selectedCategory === category ? 'active' : ''}`,
                onClick: () => this.selectCategory(category)
            }, [category]);

            container.appendChild(btn);
        });

        return container;
    }

    /**
     * Renderiza o grid de imagens
     * @returns {HTMLElement}
     */
    renderGrid() {
        const grid = DOMHelpers.createElement('div', {
            className: 'gallery-grid'
        });

        const filteredImages = this.getFilteredImages();

        if (filteredImages.length === 0) {
            const emptyMessage = DOMHelpers.createElement('div', {
                className: 'gallery-empty'
            }, ['Nenhuma imagem encontrada']);

            grid.appendChild(emptyMessage);
        } else {
            filteredImages.forEach(image => {
                const item = this.renderImageItem(image);
                grid.appendChild(item);
            });
        }

        return grid;
    }

    /**
     * Renderiza um item de imagem
     * @param {Object} image - Dados da imagem
     * @returns {HTMLElement}
     */
    renderImageItem(image) {
        const item = DOMHelpers.createElement('div', {
            className: 'gallery-item',
            onClick: () => this.selectImage(image)
        });

        const img = DOMHelpers.createElement('img', {
            src: image.src,
            alt: image.name,
            loading: 'lazy'
        });

        const name = DOMHelpers.createElement('div', {
            className: 'gallery-item-name'
        }, [image.name]);

        item.appendChild(img);
        item.appendChild(name);

        return item;
    }

    /**
     * Seleciona uma imagem
     * @param {Object} image - Imagem selecionada
     */
    selectImage(image) {
        this.onSelect(image);
        this.close();
    }

    /**
     * Seleciona categoria
     * @param {string} category - Categoria selecionada
     */
    selectCategory(category) {
        this.selectedCategory = category;
        this.updateGrid();

        // Atualizar botões de categoria
        const buttons = this.modalElement.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.textContent === category || (category === 'all' && btn.textContent === 'Todas')) {
                DOMHelpers.addClass(btn, 'active');
            } else {
                DOMHelpers.removeClass(btn, 'active');
            }
        });
    }

    /**
     * Atualiza o grid de imagens
     */
    updateGrid() {
        if (!this.modalElement) return;

        const oldGrid = this.modalElement.querySelector('.gallery-grid');
        if (!oldGrid) return;

        const newGrid = this.renderGrid();
        oldGrid.replaceWith(newGrid);
    }

    /**
     * Obtém imagens filtradas
     * @returns {Array<Object>}
     */
    getFilteredImages() {
        return this.images.filter(image => {
            // Filtro de busca
            const matchesSearch = !this.searchTerm ||
                image.name.toLowerCase().includes(this.searchTerm.toLowerCase());

            // Filtro de categoria
            const matchesCategory = this.selectedCategory === 'all' ||
                image.category === this.selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }

    /**
     * Obtém categorias únicas
     * @returns {Array<string>}
     */
    getCategories() {
        const categories = new Set();

        this.images.forEach(image => {
            if (image.category) {
                categories.add(image.category);
            }
        });

        return Array.from(categories).sort();
    }

    /**
     * Adiciona imagem à galeria
     * @param {Object} image - Nova imagem
     */
    addImage(image) {
        this.images.push(image);
        this.updateGrid();
    }

    /**
     * Remove imagem da galeria
     * @param {string} imageSrc - Src da imagem a remover
     */
    removeImage(imageSrc) {
        const index = this.images.findIndex(img => img.src === imageSrc);
        if (index > -1) {
            this.images.splice(index, 1);
            this.updateGrid();
        }
    }

    /**
     * Limpa busca
     */
    clearSearch() {
        this.searchTerm = '';
        const searchInput = this.modalElement?.querySelector('.gallery-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.updateGrid();
    }
}

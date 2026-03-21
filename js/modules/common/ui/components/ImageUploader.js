/**
 * ImageUploader - Componente de upload de imagens
 * Gerencia upload, validação e preview de imagens
 * ✅ INTEGRADO COM state.config PARA PREÇOS DINÂMICOS
 */

import { DOMHelpers } from '../utils/DOMHelpers.js';
import { ImageValidator } from '../utils/ImageValidator.js';

export class ImageUploader {
    /**
     * @param {Object} options - Opções de configuração
     * @param {string} options.zoneId - ID da zona de upload
     * @param {Function} options.onUpload - Callback ao fazer upload
     * @param {Function} options.onRemove - Callback ao remover imagem
     * @param {boolean} options.showPreview - Mostrar preview (padrão: true)
     * @param {string} options.acceptTypes - Tipos aceitos (padrão: image/*)
     * @param {Object} options.config - state.config para preços dinâmicos (OPCIONAL)
     * @param {Function} options.getPriceFunction - Função getZonePrice (OPCIONAL)
     */
    constructor(options = {}) {
        this.zoneId = options.zoneId || 'default';
        this.onUpload = options.onUpload || (() => { });
        this.onRemove = options.onRemove || (() => { });
        this.showPreview = options.showPreview !== false;
        this.acceptTypes = options.acceptTypes || 'image/*';
        this.currentImage = null;
        // ✅ Suporte a state.config
        this.config = options.config || null;
        this.getPriceFunction = options.getPriceFunction || null;
    }

    /**
     * Renderiza o uploader
     * @returns {HTMLElement}
     */
    render() {
        const container = DOMHelpers.createElement('div', {
            className: 'image-uploader',
            'data-zone': this.zoneId
        });

        // Input file (hidden)
        const fileInput = DOMHelpers.createElement('input', {
            type: 'file',
            accept: this.acceptTypes,
            className: 'file-input',
            style: { display: 'none' },
            onchange: (e) => this.handleFileSelect(e)
        });

        // Upload button
        const uploadBtn = DOMHelpers.createElement('button', {
            type: 'button',
            className: 'upload-btn',
            onClick: () => fileInput.click()
        }, [
            DOMHelpers.createElement('span', { className: 'icon' }, ['📁']),
            DOMHelpers.createElement('span', {}, ['Escolher Imagem'])
        ]);

        container.appendChild(fileInput);
        container.appendChild(uploadBtn);

        // Preview container
        if (this.showPreview) {
            const previewContainer = DOMHelpers.createElement('div', {
                className: 'preview-container',
                style: { display: 'none' }
            });
            container.appendChild(previewContainer);
        }

        return container;
    }

    /**
     * Manipula seleção de arquivo
     * @param {Event} event - Evento de change
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];

        if (!file) return;

        // Validar arquivo
        const validation = await ImageValidator.loadAndValidate(file);

        if (!validation.valid) {
            alert(validation.error);
            event.target.value = ''; // Reset input
            return;
        }

        // Armazenar imagem
        this.currentImage = {
            file,
            base64: validation.base64,
            dimensions: validation.dimensions,
            name: file.name
        };

        // Mostrar preview
        if (this.showPreview) {
            this.showImagePreview();
        }

        // ✅ Calcular preço se função disponível
        let price = 0;
        if (this.getPriceFunction && typeof this.getPriceFunction === 'function') {
            price = this.getPriceFunction(this.zoneId, 'image');
        }

        // Callback
        this.onUpload({
            zoneId: this.zoneId,
            file,
            base64: validation.base64,
            dimensions: validation.dimensions,
            price  // ✅ Inclui preço calculado
        });
    }

    /**
     * Mostra preview da imagem
     */
    showImagePreview() {
        const container = document.querySelector(`.image-uploader[data-zone="${this.zoneId}"]`);
        if (!container) return;

        const previewContainer = container.querySelector('.preview-container');
        if (!previewContainer) return;

        // Limpar preview anterior
        DOMHelpers.clearElement(previewContainer);

        // Criar preview
        const preview = DOMHelpers.createElement('div', {
            className: 'image-preview'
        });

        const img = DOMHelpers.createElement('img', {
            src: this.currentImage.base64,
            alt: this.currentImage.name
        });

        const removeBtn = DOMHelpers.createElement('button', {
            type: 'button',
            className: 'remove-btn',
            onClick: () => this.removeImage()
        }, ['✕']);

        const info = DOMHelpers.createElement('div', {
            className: 'image-info'
        }, [
            DOMHelpers.createElement('span', { className: 'filename' }, [this.currentImage.name]),
            DOMHelpers.createElement('span', { className: 'dimensions' }, [
                `${this.currentImage.dimensions.width}x${this.currentImage.dimensions.height}px`
            ])
        ]);

        preview.appendChild(img);
        preview.appendChild(removeBtn);
        preview.appendChild(info);

        previewContainer.appendChild(preview);
        DOMHelpers.show(previewContainer);
    }

    /**
     * Remove imagem
     */
    removeImage() {
        this.currentImage = null;

        // Limpar preview
        const container = document.querySelector(`.image-uploader[data-zone="${this.zoneId}"]`);
        if (container) {
            const previewContainer = container.querySelector('.preview-container');
            if (previewContainer) {
                DOMHelpers.clearElement(previewContainer);
                DOMHelpers.hide(previewContainer);
            }

            // Reset file input
            const fileInput = container.querySelector('.file-input');
            if (fileInput) {
                fileInput.value = '';
            }
        }

        // Callback
        this.onRemove({ zoneId: this.zoneId });
    }

    /**
     * Define imagem programaticamente
     * @param {string} base64 - Imagem em Base64
     * @param {string} filename - Nome do arquivo
     */
    setImage(base64, filename = 'image.jpg') {
        this.currentImage = {
            base64,
            name: filename
        };

        if (this.showPreview) {
            this.showImagePreview();
        }
    }

    /**
     * Obtém imagem atual
     * @returns {Object|null}
     */
    getImage() {
        return this.currentImage;
    }

    /**
     * Verifica se tem imagem
     * @returns {boolean}
     */
    hasImage() {
        return this.currentImage !== null;
    }
}

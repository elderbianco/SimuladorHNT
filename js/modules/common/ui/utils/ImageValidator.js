/**
 * ImageValidator - Validação de arquivos de imagem
 * Garante que apenas imagens válidas sejam carregadas
 */

export const ImageValidator = {
    /**
     * Tipos MIME permitidos
     */
    allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ],

    /**
     * Tamanho máximo em bytes (5MB)
     */
    maxSize: 5 * 1024 * 1024,

    /**
     * Dimensões mínimas
     */
    minWidth: 100,
    minHeight: 100,

    /**
     * Dimensões máximas
     */
    maxWidth: 4000,
    maxHeight: 4000,

    /**
     * Valida arquivo de imagem
     * @param {File} file - Arquivo a validar
     * @returns {Object} - {valid: boolean, error: string}
     */
    validate(file) {
        if (!file) {
            return { valid: false, error: 'Nenhum arquivo selecionado' };
        }

        // Validar tipo
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Tipo de arquivo não permitido: ${file.type}. Use JPG, PNG, GIF ou WebP.`
            };
        }

        // Validar tamanho
        if (file.size > this.maxSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `Arquivo muito grande (${sizeMB}MB). Máximo: 5MB.`
            };
        }

        if (file.size === 0) {
            return { valid: false, error: 'Arquivo vazio' };
        }

        return { valid: true };
    },

    /**
     * Valida dimensões da imagem
     * @param {HTMLImageElement} img - Elemento de imagem
     * @returns {Object} - {valid: boolean, error: string}
     */
    validateDimensions(img) {
        if (img.width < this.minWidth || img.height < this.minHeight) {
            return {
                valid: false,
                error: `Imagem muito pequena (${img.width}x${img.height}). Mínimo: ${this.minWidth}x${this.minHeight}px.`
            };
        }

        if (img.width > this.maxWidth || img.height > this.maxHeight) {
            return {
                valid: false,
                error: `Imagem muito grande (${img.width}x${img.height}). Máximo: ${this.maxWidth}x${this.maxHeight}px.`
            };
        }

        return { valid: true };
    },

    /**
     * Converte arquivo para Base64
     * @param {File} file - Arquivo a converter
     * @returns {Promise<string>} - Base64 string
     */
    toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

            reader.readAsDataURL(file);
        });
    },

    /**
     * Carrega imagem e valida dimensões
     * @param {File} file - Arquivo de imagem
     * @returns {Promise<Object>} - {valid: boolean, error: string, base64: string, dimensions: {width, height}}
     */
    async loadAndValidate(file) {
        // Validar arquivo
        const fileValidation = this.validate(file);
        if (!fileValidation.valid) {
            return fileValidation;
        }

        try {
            // Converter para Base64
            const base64 = await this.toBase64(file);

            // Carregar imagem para validar dimensões
            const img = await this.loadImage(base64);

            // Validar dimensões
            const dimensionValidation = this.validateDimensions(img);
            if (!dimensionValidation.valid) {
                return dimensionValidation;
            }

            return {
                valid: true,
                base64,
                dimensions: {
                    width: img.width,
                    height: img.height
                }
            };
        } catch (error) {
            return {
                valid: false,
                error: `Erro ao processar imagem: ${error.message}`
            };
        }
    },

    /**
     * Carrega imagem a partir de Base64
     * @param {string} base64 - String Base64
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));

            img.src = base64;
        });
    },

    /**
     * Valida Base64 MIME type
     * @param {string} base64String - String Base64 com data URI
     * @returns {Object} - {valid: boolean, mimeType: string, reason: string}
     */
    validateBase64MimeType(base64String) {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,/);

        if (!matches || matches.length < 2) {
            return {
                valid: false,
                reason: 'Formato Base64 inválido ou sem cabeçalho MIME'
            };
        }

        const mimeType = matches[1].toLowerCase();

        if (!this.allowedTypes.includes(mimeType)) {
            return {
                valid: false,
                reason: `Tipo de arquivo não permitido: ${mimeType}`
            };
        }

        return { valid: true, mimeType };
    }
};

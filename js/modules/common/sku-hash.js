/**
 * Utilitário para geração de Hash determinístico de SKU
 * Padroniza a identificação de produtos personalizados Hanuthai
 */

const SKUGenerator = {
    /**
     * Gera um SKU padronizado YY-ZZZZZZ
     * @param {Object} state - Estado atual do simulador
     * @returns {string} - SKU formatado
     */
    generateSKU(state) {
        const initial = state.productInitial || 'XX';
        const hash = this.calculateHash(state);
        return `${initial}-${hash}`;
    },

    /**
     * Calcula um hash de 6 caracteres baseado na configuração
     */
    calculateHash(state) {
        // Seleciona apenas os dados que definem a aparência/produção
        const sourceData = {
            parts: state.parts || {},
            extras: state.extras || {},
            texts: {},
            uploads: {}
        };

        // Normaliza textos
        if (state.texts) {
            Object.entries(state.texts).forEach(([key, val]) => {
                if (val.enabled && val.content) {
                    sourceData.texts[key] = {
                        c: val.content,
                        f: val.fontFamily,
                        cl: val.color
                    };
                }
            });
        }

        // Normaliza uploads (usa o nome do arquivo, não o base64 para o hash ser curto/rápido)
        if (state.uploads) {
            Object.entries(state.uploads).forEach(([key, val]) => {
                if (val.src || val.filename) {
                    sourceData.uploads[key] = val.filename || 'img';
                }
            });
        }

        const str = JSON.stringify(sourceData);

        // Algoritmo de hash simples (Murmur-like ou simple string hash)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }

        // Converte para Base36 (alfanumérico) para ser mais compacto e estético
        // Usamos unsigned right shift para garantir positivo
        const result = (hash >>> 0).toString(36).toUpperCase();

        return result.padStart(6, '0').slice(-6);
    }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.SKUGenerator = SKUGenerator;
}

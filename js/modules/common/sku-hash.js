/**
 * Utilitário para geração de Hash determinístico de SKU
 * Padroniza a identificação de produtos personalizados Hanuthai
 */

const SKUGenerator = {
    /**
     * Gera um SKU padronizado [PEDIDO]-[SIGLA]-[HASH]
     * @param {Object} state - Estado atual do simulador
     * @returns {string} - SKU formatado
     */
    generateSKU(state) {
        const orderPart = state.orderNumber || 'HNT';
        const initial = state.productInitial || 'XX';
        const hash = this.calculateHash(state);
        return `${orderPart}-${initial}-${hash}`;
    },

    /**
     * Calcula um hash numérico de 6 dígitos baseado na configuração
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

        // Normaliza uploads
        if (state.uploads) {
            Object.entries(state.uploads).forEach(([key, val]) => {
                if (val.src || val.filename) {
                    sourceData.uploads[key] = val.filename || 'img';
                }
            });
        }

        const str = JSON.stringify(sourceData);

        // Algoritmo de hash simples
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }

        // Converte para Base 10 (Somente números) para ser mais intuitivo
        // Usamos unsigned right shift e garantimos 6 dígitos
        const result = (hash >>> 0).toString(10);
        return result.padStart(6, '0').slice(-6);
    }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.SKUGenerator = SKUGenerator;
}

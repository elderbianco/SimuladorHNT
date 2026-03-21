/**
 * Sistema de Carregamento Seguro de Ativos
 * Previne erros 404 silenciosos e fornece fallbacks
 */

const AssetLoader = {
    // Cache de imagens já validadas
    validatedAssets: new Map(),
    
    // Placeholder para imagens faltando
    placeholderImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" fill="%23ff6b6b" font-size="14" text-anchor="middle" dominant-baseline="middle"%3EERRO: Imagem não encontrada%3C/text%3E%3C/svg%3E',
    
    /**
     * Carrega uma imagem com validação e fallback
     * @param {string} src - URL da imagem
     * @param {string} fallbackSrc - URL alternativa (opcional)
     * @returns {Promise<string>} - URL válida ou placeholder
     */
    async loadSafe(src, fallbackSrc = null) {
        // Verificar cache
        if (this.validatedAssets.has(src)) {
            return this.validatedAssets.get(src);
        }
        
        try {
            const validSrc = await this._testImage(src);
            this.validatedAssets.set(src, validSrc);
            return validSrc;
        } catch (error) {
            console.warn(`⚠️ Imagem não encontrada: ${src}`);
            
            // Tentar fallback
            if (fallbackSrc) {
                try {
                    const validFallback = await this._testImage(fallbackSrc);
                    this.validatedAssets.set(src, validFallback);
                    return validFallback;
                } catch {
                    console.error(`❌ Fallback também falhou: ${fallbackSrc}`);
                }
            }
            
            // Retornar placeholder
            return this.placeholderImage;
        }
    },
    
    /**
     * Testa se uma imagem pode ser carregada
     * @private
     */
    _testImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    },
    
    /**
     * Pré-carrega um conjunto de imagens
     * @param {string[]} urls - Array de URLs
     * @returns {Promise<Object>} - Relatório de carregamento
     */
    async preloadBatch(urls) {
        const results = {
            success: [],
            failed: []
        };
        
        const promises = urls.map(async (url) => {
            try {
                await this._testImage(url);
                results.success.push(url);
                this.validatedAssets.set(url, url);
            } catch {
                results.failed.push(url);
            }
        });
        
        await Promise.all(promises);
        return results;
    },
    
    /**
     * Limpa o cache de validação
     */
    clearCache() {
        this.validatedAssets.clear();
    },
    
    /**
     * Diagnóstico: Verifica todos os ativos de um simulador
     * @param {Object} DATA - Objeto de dados do simulador
     * @returns {Promise<Object>} - Relatório detalhado
     */
    async diagnoseSimulator(DATA) {
        const report = {
            total: 0,
            missing: [],
            timestamp: new Date().toISOString()
        };
        
        // Verificar partes
        for (const part of DATA.parts) {
            for (const color of DATA.colors) {
                const filename = this._generateFilename(part, color);
                const url = `assets/${part.folder}/${filename}`;
                report.total++;
                
                try {
                    await this._testImage(url);
                } catch {
                    report.missing.push({
                        type: 'part',
                        part: part.name,
                        color: color.name,
                        file: filename,
                        url: url
                    });
                }
            }
        }
        
        // Verificar extras
        for (const extra of DATA.extras) {
            for (const color of DATA.colors) {
                // Pular cores restritas
                if (extra.restrictedColors && !extra.restrictedColors.includes(color.id)) {
                    continue;
                }
                
                const filename = this._generateFilename(extra, color);
                const url = `assets/${extra.folder}/${filename}`;
                report.total++;
                
                try {
                    await this._testImage(url);
                } catch {
                    report.missing.push({
                        type: 'extra',
                        extra: extra.name,
                        color: color.name,
                        file: filename,
                        url: url
                    });
                }
            }
        }
        
        return report;
    },
    
    /**
     * Gera nome de arquivo (compatível com visuals.js)
     * @private
     */
    _generateFilename(item, color) {
        const colorFileMap = {
            'verde_limao': 'Verdelimao',
            'verde_musgo': 'Verdemusgo',
            'azul_claro': 'AzulClaro',
            'azul_escuro': 'AzulEscuro',
            'verde_bandeira': 'VerdeBandeira',
            'rosa_pink': 'RosaPink',
            'rosa': 'Rosa'
        };
        
        let formattedColor = colorFileMap[color.id] || 
            color.id.split(/[ _]/).map((w, i) => 
                i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()
            ).join('');
        
        // Remover acentos
        formattedColor = formattedColor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const sigla = item.siglaSub || '';
        return `Sh${sigla}${formattedColor}.png`;
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AssetLoader = AssetLoader;
}

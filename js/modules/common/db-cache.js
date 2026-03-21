/**
 * Módulo de Cache em Memória para Banco de Dados
 * Otimiza leitura do Excel mantendo dados em memória
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DBCache = {
    cache: null,
    lastModified: null,
    dbPath: null,

    /**
     * Inicializa o cache com o caminho do banco de dados
     * @param {string} databasePath - Caminho do arquivo Excel
     */
    init(databasePath) {
        this.dbPath = databasePath;
        console.log(`📦 Cache inicializado para: ${path.basename(databasePath)}`);
    },

    /**
     * Carrega dados do Excel (com cache)
     * @returns {Promise<Array>} Dados do banco
     */
    async load() {
        if (!this.dbPath) {
            throw new Error('Cache não inicializado. Chame init() primeiro.');
        }

        // Verificar se arquivo existe
        if (!fs.existsSync(this.dbPath)) {
            console.warn('⚠️ Arquivo de banco não encontrado, retornando array vazio');
            return [];
        }

        const stats = fs.statSync(this.dbPath);
        const fileModTime = stats.mtime.getTime();

        // Se cache válido, retorna
        if (this.cache && this.lastModified >= fileModTime) {
            console.log('📦 Retornando dados do cache (hit)');
            return this.cache;
        }

        // Cache miss - carrega do disco
        console.log('💾 Carregando dados do Excel (cache miss)...');
        const startTime = Date.now();

        try {
            const wb = XLSX.readFile(this.dbPath);
            const sheetName = wb.SheetNames.find(n => n === "CENTRAL_PEDIDOS") || wb.SheetNames[0];
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws);

            // Atualiza cache
            this.cache = data;
            this.lastModified = fileModTime;

            const loadTime = Date.now() - startTime;
            console.log(`✅ Dados carregados: ${data.length} registros (${loadTime}ms)`);

            return data;
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error.message);
            throw error;
        }
    },

    /**
     * Invalida o cache (força reload na próxima leitura)
     */
    invalidate() {
        this.cache = null;
        this.lastModified = null;
        console.log('🔄 Cache invalidado');
    },

    /**
     * Retorna estatísticas do cache
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            cached: this.cache !== null,
            recordCount: this.cache ? this.cache.length : 0,
            lastModified: this.lastModified ? new Date(this.lastModified) : null,
            cacheSize: this.cache ? JSON.stringify(this.cache).length : 0
        };
    },

    /**
     * Limpa o cache completamente
     */
    clear() {
        this.cache = null;
        this.lastModified = null;
        this.dbPath = null;
        console.log('🧹 Cache limpo completamente');
    }
};

module.exports = DBCache;

/**
 * EMB Artwork Manager Module
 * Centraliza a lógica de arquivos de bordado, assinaturas digitais e regras de isenção.
 * Criado em: 28/01/2026
 */

const EmbManager = {
    // --- Hashing & Identidade ---
    /**
     * Gera uma assinatura única baseada no conteúdo do arquivo
     * @param {File} file - Objeto File do input
     * @param {string} base64Content - Conteúdo Base64 da imagem
     */
    generateHash: function (file, base64Content) {
        if (!base64Content) return null;
        // Pega amostras do início e fim do arquivo para performance
        const head = base64Content.substring(0, 50);
        const tail = base64Content.substring(base64Content.length - 50);
        return `sz:${file.size}_h:${this._simpleHash(head)}_t:${this._simpleHash(tail)}`;
    },

    _simpleHash: function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash;
    },

    // --- Consultas de Cobertura ---
    getCoveredZones: function (embFilesState) {
        const covered = new Set();
        if (embFilesState && Array.isArray(embFilesState)) {
            embFilesState.forEach(f => {
                if (f.zones) f.zones.forEach(z => covered.add(z));
            });
        }
        return covered;
    },

    isZoneCovered: function (zoneId, embFilesState) {
        const covered = this.getCoveredZones(embFilesState);
        return covered.has(zoneId);
    },

    // --- Cálculos Financeiros ---
    calculateFees: function (uploadsState, embFilesState, feePerArt, getZoneNameCallback) {
        const coveredZones = this.getCoveredZones(embFilesState);
        const chargableArts = {}; // identifier -> { zones: [], filename:String }
        const allUniqueArts = new Set();

        Object.entries(uploadsState).forEach(([zoneId, up]) => {
            if (up && up.src && up.isCustom) {
                // Tenta usar hash, fallback para filename
                const identifier = up.fileHash || up.filename;
                if (!identifier) return;

                allUniqueArts.add(identifier);

                // Se a zona NÃO estiver coberta, contabiliza cobrança
                if (!coveredZones.has(zoneId)) {
                    if (!chargableArts[identifier]) {
                        chargableArts[identifier] = { zones: [], filename: up.filename };
                    }
                    const zName = getZoneNameCallback ? getZoneNameCallback(zoneId) : zoneId;
                    // Evita duplicar nomes de zona se houver glitch de render
                    if (!chargableArts[identifier].zones.includes(zName)) {
                        chargableArts[identifier].zones.push(zName);
                    }
                }
            }
        });

        // Conversão para array de detalhes e contagem baseada em artes únicas
        const details = [];
        let chargeableCount = 0;

        Object.values(chargableArts).forEach(item => {
            chargeableCount++;
            details.push({
                filename: item.filename,
                locations: item.zones,
                fee: feePerArt
            });
        });

        const totalCount = allUniqueArts.size;
        const savedCount = Math.max(0, totalCount - chargeableCount);

        return {
            chargeableCount,
            totalFee: chargeableCount * feePerArt,
            savedCount,
            savedValue: savedCount * feePerArt,
            details: details
        };
    },

    // --- Validação de Bloqueio (Promessas) ---
    /**
     * Verifica promessas de envio vs arquivos reais
     */
    validatePromises: function (uploadsState, embFilesState, getZoneNameCallback) {
        const coveredZones = this.getCoveredZones(embFilesState);
        const blockingZones = []; // Prometeu e não cumpriu (Nome da zona)
        const opportunityZones = []; // Não prometeu mas poderia economizar (Nome da zona)

        Object.entries(uploadsState).forEach(([zoneId, up]) => {
            if (up && up.src && up.isCustom) {
                const isCovered = coveredZones.has(zoneId);
                const zoneName = getZoneNameCallback ? getZoneNameCallback(zoneId) : zoneId;

                if (up.hasEmbPromise && !isCovered) {
                    blockingZones.push(zoneName);
                } else if (!isCovered) {
                    opportunityZones.push(zoneName);
                }
            }
        });

        return {
            blocking: blockingZones,
            opportunity: opportunityZones,
            isValid: blockingZones.length === 0
        };
    }
};

window.EmbManager = EmbManager;

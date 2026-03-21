/**
 * Módulo de Validação Comum para Admin Panel
 * Centraliza toda a lógica de validação de configurações
 */

window.AdminValidator = {
    /**
     * Valida configuração de preços de um produto
     * @param {Object} config - Objeto de configuração
     * @param {string} productName - Nome do produto para mensagens
     * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
     */
    validatePricingConfig: function (config, productName) {
        const errors = [];
        const warnings = [];

        // === VALIDAÇÕES OBRIGATÓRIAS ===

        // Preço base
        if (!config.basePrice || config.basePrice <= 0) {
            errors.push(`${productName}: Preço base é obrigatório e deve ser maior que zero`);
        }

        // === VALIDAÇÕES DE CONSISTÊNCIA ===

        // Preços em escala devem ser decrescentes
        if (config.basePrice && config.price10) {
            if (config.price10 >= config.basePrice) {
                warnings.push(`${productName}: Preço para 10 unidades (R$ ${config.price10}) deve ser menor que o preço base (R$ ${config.basePrice})`);
            }
        }

        if (config.price10 && config.price20) {
            if (config.price20 >= config.price10) {
                warnings.push(`${productName}: Preço para 20 unidades (R$ ${config.price20}) deve ser menor que o preço para 10 (R$ ${config.price10})`);
            }
        }

        if (config.price20 && config.price30) {
            if (config.price30 >= config.price20) {
                warnings.push(`${productName}: Preço para 30 unidades (R$ ${config.price30}) deve ser menor que o preço para 20 (R$ ${config.price20})`);
            }
        }

        // === VALIDAÇÕES DE VALORES NEGATIVOS ===

        const priceFields = [
            'basePrice', 'sizeModPrice', 'devFee',
            'logoCenterPrice', 'textCenterPrice',
            'logoLatPrice', 'textLatPrice',
            'legRightMidPrice', 'legRightBottomPrice', 'legLeftPrice',
            'logoLegPrice', 'textLegPrice',
            'extraLeggingPrice', 'extraLacoPrice', 'extraCordaoPrice',
            'price10', 'price20', 'price30'
        ];

        priceFields.forEach(field => {
            if (config[field] !== undefined && config[field] < 0) {
                errors.push(`${productName}: ${field} não pode ser negativo`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Exibe resultado da validação ao usuário
     * @param {Object} result - Resultado da validação
     * @param {string} productName - Nome do produto
     * @returns {boolean} - true se pode prosseguir, false se deve cancelar
     */
    showValidationResult: function (result, productName) {
        // Se há erros críticos, bloqueia
        if (!result.valid) {
            alert(`❌ Erro ao salvar ${productName}:\n\n${result.errors.join('\n')}\n\nAs configurações NÃO foram salvas.`);
            console.error(`Validation errors for ${productName}:`, result.errors);
            return false;
        }

        // Se há avisos, pede confirmação
        if (result.warnings.length > 0) {
            const proceed = confirm(
                `⚠️ Avisos para ${productName}:\n\n${result.warnings.join('\n')}\n\nDeseja continuar mesmo assim?`
            );

            if (!proceed) {
                console.log(`User cancelled save for ${productName} due to warnings`);
            }

            return proceed;
        }

        // Tudo OK
        return true;
    },

    /**
     * Valida campos esperados em uma configuração
     * @param {Object} config - Configuração salva
     * @param {string[]} expectedFields - Lista de campos esperados
     * @param {string} productName - Nome do produto
     * @returns {string[]} - Lista de campos faltantes
     */
    checkMissingFields: function (config, expectedFields, productName) {
        const missing = [];

        expectedFields.forEach(field => {
            if (config[field] === undefined) {
                missing.push(field);
            }
        });

        if (missing.length > 0) {
            console.warn(`⚠️ ${productName}: Campos não salvos:`, missing);
        }

        return missing;
    }
};

console.log('✅ AdminValidator module loaded');

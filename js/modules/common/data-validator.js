/**
 * Módulo de Validação de Dados do Banco de Dados
 * Valida pedidos antes de salvar no Excel
 */

const DataValidator = {
    /**
     * Valida um pedido individual
     * @param {Object} order - Objeto do pedido
     * @returns {Object} Resultado da validação
     */
    validateOrder(order) {
        const errors = [];
        const warnings = [];

        // === VALIDAÇÕES OBRIGATÓRIAS ===
        if (!order.ID_PEDIDO) {
            errors.push('ID_PEDIDO é obrigatório');
        }

        if (!order.TIPO_PRODUTO) {
            errors.push('TIPO_PRODUTO é obrigatório');
        }

        if (!order.TELEFONE_CLIENTE) {
            errors.push('TELEFONE_CLIENTE é obrigatório');
        }

        // === VALIDAÇÕES DE TIPO ===
        if (order.QUANTIDADE_TOTAL !== undefined && isNaN(order.QUANTIDADE_TOTAL)) {
            errors.push('QUANTIDADE_TOTAL deve ser um número');
        }

        if (order.PRECO_TOTAL !== undefined && isNaN(order.PRECO_TOTAL)) {
            errors.push('PRECO_TOTAL deve ser um número');
        }

        if (order.PRECO_UNITARIO !== undefined && isNaN(order.PRECO_UNITARIO)) {
            errors.push('PRECO_UNITARIO deve ser um número');
        }

        // === VALIDAÇÕES DE NEGÓCIO ===
        if (order.PRECO_TOTAL !== undefined && order.PRECO_TOTAL < 0) {
            errors.push('PRECO_TOTAL não pode ser negativo');
        }

        if (order.QUANTIDADE_TOTAL !== undefined && order.QUANTIDADE_TOTAL <= 0) {
            errors.push('QUANTIDADE_TOTAL deve ser maior que zero');
        }

        // === VALIDAÇÕES DE CONSISTÊNCIA ===
        if (order.PRECO_UNITARIO && order.QUANTIDADE_TOTAL && order.PRECO_TOTAL) {
            const expectedTotal = order.PRECO_UNITARIO * order.QUANTIDADE_TOTAL;
            const diff = Math.abs(expectedTotal - order.PRECO_TOTAL);

            // Tolerância de 1% para arredondamentos
            if (diff > expectedTotal * 0.01) {
                warnings.push(
                    `PRECO_TOTAL (${order.PRECO_TOTAL}) não corresponde a ` +
                    `PRECO_UNITARIO × QUANTIDADE (${expectedTotal.toFixed(2)})`
                );
            }
        }

        // === VALIDAÇÕES DE FORMATO ===
        if (order.TELEFONE_CLIENTE) {
            const phone = order.TELEFONE_CLIENTE.toString().replace(/\D/g, '');
            if (phone.length < 10 || phone.length > 15) {
                warnings.push('TELEFONE_CLIENTE parece ter formato inválido');
            }
        }

        if (order.EMAIL_CLIENTE) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(order.EMAIL_CLIENTE)) {
                warnings.push('EMAIL_CLIENTE parece ter formato inválido');
            }
        }

        // === VALIDAÇÕES DE DATA ===
        if (order.DATA_PEDIDO) {
            const dataPedido = new Date(order.DATA_PEDIDO);
            if (isNaN(dataPedido.getTime())) {
                errors.push('DATA_PEDIDO tem formato inválido');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Valida um lote de pedidos
     * @param {Array} orders - Array de pedidos
     * @returns {Object} Resultado da validação em lote
     */
    validateBatch(orders) {
        if (!Array.isArray(orders)) {
            return {
                valid: false,
                errors: ['Dados devem ser um array'],
                invalidOrders: []
            };
        }

        const results = orders.map((order, index) => ({
            index,
            id: order.ID_PEDIDO || `Pedido #${index + 1}`,
            ...this.validateOrder(order)
        }));

        const invalid = results.filter(r => !r.valid);
        const withWarnings = results.filter(r => r.warnings.length > 0);

        return {
            valid: invalid.length === 0,
            totalOrders: orders.length,
            validOrders: orders.length - invalid.length,
            invalidOrders: invalid,
            ordersWithWarnings: withWarnings,
            summary: {
                totalErrors: invalid.reduce((sum, r) => sum + r.errors.length, 0),
                totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
            }
        };
    },

    /**
     * Formata resultado de validação para exibição
     * @param {Object} result - Resultado da validação
     * @returns {string} Mensagem formatada
     */
    formatValidationResult(result) {
        if (result.valid && result.warnings.length === 0) {
            return '✅ Validação passou sem erros ou avisos';
        }

        let message = '';

        if (result.errors.length > 0) {
            message += '❌ ERROS:\n';
            result.errors.forEach(err => {
                message += `  - ${err}\n`;
            });
        }

        if (result.warnings.length > 0) {
            message += '⚠️ AVISOS:\n';
            result.warnings.forEach(warn => {
                message += `  - ${warn}\n`;
            });
        }

        return message;
    }
};

module.exports = DataValidator;

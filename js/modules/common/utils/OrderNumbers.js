/**
 * OrderNumbers Utility
 * Manages the lifecycle of Order Numbers separately from Simulation IDs.
 */

const OrderNumbers = {
    /**
     * Retorna o número de pedido atual sem incrementá-lo.
     * Garante que o número inicial seja respeitado se for a primeira vez.
     */
    peekNextOrderNumber() {
        const orderConfig = JSON.parse(localStorage.getItem('hnt_order_config') || '{"nextNumber":1000}');
        const startFrom = (parseInt(orderConfig.nextNumber) || 1000) - 1;
        let last = parseInt(localStorage.getItem('hnt_order_seq_id') || '0');

        // Se o número do admin for maior que o sequencial atual, sincroniza
        if (startFrom > last) {
            last = startFrom;
        }

        // Se nunca foi gerado, define o primeiro
        if (last === 0 || last === startFrom) {
            last = startFrom + 1;
            localStorage.setItem('hnt_order_seq_id', last);
        }

        return String(last).padStart(6, '0');
    },

    /**
     * Incrementa o número de pedido global. 
     * Deve ser chamado somente após o fechamento/pagamento de uma compra.
     */
    rotateOrderNumber() {
        let last = parseInt(localStorage.getItem('hnt_order_seq_id') || '0');
        const orderConfig = JSON.parse(localStorage.getItem('hnt_order_config') || '{"nextNumber":1000}');
        const startFrom = (parseInt(orderConfig.nextNumber) || 1000) - 1;

        if (startFrom > last) {
            last = startFrom;
        }

        const next = last + 1;
        localStorage.setItem('hnt_order_seq_id', next);

        // Mantém a config do admin atualizada (próximo disponível)
        orderConfig.nextNumber = next + 1;
        localStorage.setItem('hnt_order_config', JSON.stringify(orderConfig));

        console.log(`🔄 [OrderNumbers] Número de Pedido rotacionado para: ${next}`);
        return String(next).padStart(6, '0');
    }
};

// Exportar globalmente
window.OrderNumbers = OrderNumbers;

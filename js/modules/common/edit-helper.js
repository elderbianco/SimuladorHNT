/**
 * Módulo Helper para Edição de Pedidos
 * Compartilhado por todos os simuladores
 */

/**
 * Verifica se está em modo de edição e carrega o estado salvo
 * @param {Object} state - Objeto de estado do simulador
 * @param {Function} renderCallback - Função para renderizar a UI após carregar
 * @param {Function} pricingCallback - Função para atualizar preços após carregar
 * @returns {boolean} - true se carregou estado de edição, false caso contrário
 */
function loadEditingState(state, renderCallback, pricingCallback) {
    const editingIndex = localStorage.getItem('editingOrderIndex');

    if (editingIndex === null) {
        return false; // Não está editando
    }

    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const orderToEdit = history[editingIndex];

    if (!orderToEdit || !orderToEdit.DADOS_TECNICOS_JSON) {
        console.warn('⚠️ Pedido para edição não encontrado ou sem dados técnicos');
        localStorage.removeItem('editingOrderIndex');
        return false;
    }

    try {
        // Carregar estado salvo
        const savedState = JSON.parse(orderToEdit.DADOS_TECNICOS_JSON);

        console.log('✏️ Modo de edição ativado - Carregando pedido:', orderToEdit.order_id || orderToEdit.ID_PEDIDO);
        console.log('📦 Estado salvo:', savedState);

        // Restaurar estado completo (preservando config que já foi carregado)
        const currentConfig = state.config;
        Object.assign(state, savedState);

        // Restaurar config se foi sobrescrito
        if (currentConfig) {
            state.config = currentConfig;
        }

        // Marcar como edição (será usado no salvamento)
        state._editingIndex = parseInt(editingIndex);
        state._editingOrderId = orderToEdit.order_id || orderToEdit.ID_PEDIDO;

        // Limpar flag de edição do localStorage
        localStorage.removeItem('editingOrderIndex');

        console.log(`✅ Estado carregado - Editando índice ${state._editingIndex}`);

        // Renderizar UI com estado carregado
        if (renderCallback && typeof renderCallback === 'function') {
            renderCallback();
        }

        // Atualizar preços
        if (pricingCallback && typeof pricingCallback === 'function') {
            pricingCallback();
        }

        // Mostrar notificação visual
        showEditingNotification(orderToEdit.order_id || orderToEdit.ID_PEDIDO);

        return true;

    } catch (e) {
        console.error('❌ Erro ao carregar pedido para edição:', e);
        localStorage.removeItem('editingOrderIndex');
        return false;
    }
}

/**
 * Mostra notificação visual de que está em modo de edição
 */
function showEditingNotification(orderId) {
    const notification = document.createElement('div');
    notification.id = 'editing-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 10000;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        ">
            <span style="font-size: 1.2rem;">✏️</span>
            <div>
                <div style="font-size: 0.9rem;">Modo de Edição</div>
                <div style="font-size: 0.75rem; opacity: 0.9;">Pedido: ${orderId}</div>
            </div>
        </div>
        <style>
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
    `;

    document.body.appendChild(notification);

    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Modifica a função de salvamento para sobrescrever ao invés de adicionar
 * Deve ser chamada ANTES de salvar no localStorage
 * @param {Object} state - Objeto de estado do simulador
 * @param {Array} history - Array de histórico de pedidos
 * @param {Object} orderData - Dados do novo pedido
 * @returns {Array} - Histórico atualizado
 */
function saveOrUpdateOrder(state, history, orderData) {
    if (state._editingIndex !== undefined) {
        // SOBRESCREVER item existente
        console.log(`✏️ Atualizando pedido no índice ${state._editingIndex}`);
        history[state._editingIndex] = orderData;

        // Limpar flags de edição
        delete state._editingIndex;
        delete state._editingOrderId;

        return history;
    } else {
        // ADICIONAR novo item
        console.log('✅ Adicionando novo pedido');
        history.push(orderData);
        return history;
    }
}

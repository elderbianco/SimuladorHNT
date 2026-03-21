/**
 * Payment Controller
 * Handles order summation, mockup payment, and data submission to HNT-OPS.
 */
document.addEventListener('DOMContentLoaded', () => {
    PaymentController.init();
});

const PaymentController = {
    init: function () {
        this.loadOrderSummary();
        this.bindEvents();
    },

    loadOrderSummary: function () {
        const rawCart = localStorage.getItem('hnt_all_orders_db');
        const cartItems = rawCart ? JSON.parse(rawCart) : [];

        if (cartItems.length === 0) {
            alert("Carrinho vazio. Redirecionando...");
            window.location.href = "IndexFightShorts.html";
            return;
        }

        let totalValue = 0;
        let totalItems = 0;

        cartItems.forEach(order => {
            const price = order.item?.pricing?.total_price || order.PRECO_FINAL || 0;
            const qty = order.item?.qty_total || order.QUANTIDADE || 1;
            totalValue += price;
            totalItems += qty;
        });

        document.getElementById('payment-total').innerText = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('payment-items-count').innerText = `${totalItems} peças processadas no carrinho.`;
    },

    bindEvents: function () {
        const confirmBtn = document.getElementById('btn-confirm-payment');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.processPaymentAndSubmit());
        }
    },

    processPaymentAndSubmit: async function () {
        // 1. Show Loading
        document.getElementById('loading-overlay').style.display = 'flex';

        try {
            // 2. Load Data
            const rawCart = localStorage.getItem('hnt_all_orders_db');
            const cartItems = rawCart ? JSON.parse(rawCart) : [];
            const rawClient = localStorage.getItem('hnt_customer_profile');
            const clientProfile = rawClient ? JSON.parse(rawClient) : {};

            if (cartItems.length === 0) throw new Error("Carrinho está vazio.");

            // 3. Prepare Payload for HNT-OPS
            const payload = {
                event: 'order.created',
                timestamp: new Date().toISOString(),
                client: clientProfile,
                items: cartItems,
                metadata: {
                    source: 'ecommerce_simulador_v2',
                    total_items: cartItems.length
                }
            };

            console.log("🚀 Enviando Payload para HNT-OPS:", payload);

            // MOCK WEBHOOK REQUEST (Replace with actual Google Script / Supabase URL)
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulando delay de rede de 2s

            // Optional: call local supabase to update status if using SupabaseAdapter
            if (typeof SupabaseAdapter !== 'undefined') {
                // ... update status ...
            }

            // 4. Success -> Clean up everywhere
            this.clearAllSystemData();

            // 5. Redirect to Success
            alert("✅ Pagamento Confirmado e Pedido enviado para a Fábrica!");
            window.location.href = "IndexFightShorts.html"; // Redirecionando ao início momentaneamente

        } catch (e) {
            console.error(e);
            alert("Erro ao processar o pedido: " + e.message);
            document.getElementById('loading-overlay').style.display = 'none';
        }
    },

    clearAllSystemData: function () {
        console.log("🧹 Limpando dados do sistema (Simuladores, Carrinho, Cache)");

        // A. Limpar banco de pedidos do carrinho
        localStorage.removeItem('hnt_all_orders_db');

        // B. Limpar estados de todos os simuladores
        const simulators = ['SHORTS', 'TOP', 'LEGGING', 'SHORTS_LEGGING', 'CALCA_LEGGING', 'MOLETOM'];
        simulators.forEach(sim => {
            localStorage.removeItem(`hnt_state_${sim}`);
            sessionStorage.removeItem(`hnt_state_${sim}`);
        });

        // Opcional: Manter hnt_customer_profile para não ter que logar dnv
        // ou remover caso deseje privacidade total pós-venda
        // localStorage.removeItem('hnt_customer_profile'); 
    }
};

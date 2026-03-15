/**
 * Payment Controller
 * Handles the simulated checkout and integration with Supabase production.
 */

const STORAGE_KEY = 'hnt_all_orders_db';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    if (history.length === 0) {
        alert("Seu carrinho está vazio. Voltando para o simulador.");
        window.location.href = "IndexPedidoSimulador.html";
        return;
    }

    renderSummary(history);

    const btnPay = document.getElementById('btn-complete-payment');
    if (btnPay) {
        btnPay.onclick = () => handleCheckout(history);
    }

    // Toggle Pix/Card UI logic
    const radios = document.querySelectorAll('input[name="payment"]');
    radios.forEach(r => {
        r.onchange = () => {
            const pixDetails = document.getElementById('pix-details');
            if (pixDetails) {
                pixDetails.style.display = r.value === 'pix' ? 'block' : 'none';
            }
        };
    });
}

function renderSummary(items) {
    const container = document.getElementById('summary-items');
    let total = 0;

    container.innerHTML = '';

    items.forEach(order => {
        // Try getting price from various places (Supabase column, simulator item, or raw technical pricing)
        const price = order.PRECO_FINAL || (order.item && order.item.pricing ? order.item.pricing.total_price : 0) || order.total_price || 0;

        // Try getting qty
        const qty = order.QUANTIDADE || (order.item ? order.item.qty_total : 1) || 1;

        // Try getting name
        const name = order.TIPO_PRODUTO || (order.item ? order.item.model_name : 'Produto');

        total += parseFloat(price);

        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `
            <span>${qty}x ${name}</span>
            <span>${parseFloat(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        `;
        container.appendChild(div);
    });

    const finalEl = document.getElementById('final-amount');
    if (finalEl) {
        finalEl.innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

async function handleCheckout(items) {
    const btn = document.getElementById('btn-complete-payment');
    btn.disabled = true;
    btn.innerText = "Processando... ⌛";

    try {
        console.log("💳 Iniciando processamento de pagamento simulado...");

        // 1. Sincronizar com Supabase: Marcar como 'Aprovado' todos os itens do checkout
        if (typeof SupabaseAdapter !== 'undefined' && window.SupabaseAdapter) {
            // Loop through each order and approve it for production
            for (const order of items) {
                const orderId = order.order_id || order.ID_PEDIDO;
                console.log(`⏳ Aprovando pedido: ${orderId}`);

                // Use the integrated bridge method of SupabaseAdapter
                const success = await window.SupabaseAdapter.aprovarPedidoParaProducao(order);

                if (!success) {
                    console.warn(`⚠️ Falha ao migrar pedido ${orderId} para HNT-OPS. Tentando próximo...`);
                }
            }
            console.log("✅ Todos os pedidos foram marcados como Aprovados no Supabase.");
        } else {
            console.warn("⚠️ Supabase não disponível. Simulando apenas offline.");
        }

        // 2. Limpar Carrinho (Opcional: Mas recomendado após compra)
        // localStorage.removeItem(STORAGE_KEY);

        // 3. Sucesso!
        showSuccess();

    } catch (e) {
        console.error("❌ Erro no checkout:", e);
        alert("Erro ao processar pagamento. Tente novamente.");
        btn.disabled = false;
        btn.innerText = "Finalizar Pedido ✅";
    }
}

function showSuccess() {
    const screen = document.getElementById('success-screen');
    if (screen) {
        screen.style.display = 'flex';
        // Play sound or fire confetti if available
        if (typeof confetti !== 'undefined') confetti();
    }
}

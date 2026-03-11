/**
 * Controlador Principal - Administrador de Pedidos
 * Inicializa os módulos de Lógica e UI.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar Dashboard com Supabase
    if (typeof SupabaseAdapter !== 'undefined') {
        const pedidos = await SupabaseAdapter.getPedidos();
        if (pedidos && pedidos.length > 0) {
            localStorage.setItem(window.ORDERS_STORAGE_KEY || 'hnt_all_orders_db', JSON.stringify(pedidos));
        }
    }
    loadAdminDashboard();

    // 2. Configurar Busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTable(e.target.value);
        });
    }

    // 3. Configurar Botão de Sincronização
    const btnSync = document.getElementById('btn-force-sync');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            if (typeof SupabaseAdapter !== 'undefined') {
                btnSync.innerText = '🔄 Sincronizando...';
                const pedidos = await SupabaseAdapter.getPedidos();
                if (pedidos && pedidos.length > 0) {
                    localStorage.setItem(window.ORDERS_STORAGE_KEY || 'hnt_all_orders_db', JSON.stringify(pedidos));
                    loadAdminDashboard();
                    alert(`✅ ${pedidos.length} pedidos sincronizados do Supabase!`);
                } else {
                    alert('⚠️ Nenhum pedido encontrado no servidor.');
                }
                btnSync.innerText = '🔄 Forçar Atualização';
            } else if (typeof DatabaseManager !== 'undefined') {
                if (confirm("Deseja atualizar os dados locais com base no Excel do Servidor?")) {
                    DatabaseManager.loadFromServer();
                }
            }
        });
    }

    // 4. Configurar Botão Demo
    const btnDemo = document.getElementById('btn-import-demo');
    if (btnDemo) {
        btnDemo.addEventListener('click', () => {
            generateAndLoadDemoData();
        });
    }

    // 5. Configurar SSE (Sincronização em Tempo Real)
    // setupSSE();
});

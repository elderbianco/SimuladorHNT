/**
 * Controlador Principal - Administrador de Pedidos
 * Inicializa os módulos de Lógica e UI.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Dashboard
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
        btnSync.addEventListener('click', () => {
            if (typeof DatabaseManager !== 'undefined') {
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

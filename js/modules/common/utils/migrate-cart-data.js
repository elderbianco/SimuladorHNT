/**
 * Script de Migração de Dados do Carrinho
 * Converte dados antigos (formato flat) para o novo formato (nested com DADOS_TECNICOS_JSON)
 * 
 * USO: Incluir este script ANTES de cart-new.js no IndexPedidoSimulador.html
 */

(function () {
    const STORAGE_KEY = 'hnt_all_orders_db';

    console.log('🔄 Verificando necessidade de migração de dados...');

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            console.log('✅ Nenhum dado para migrar.');
            return;
        }

        const data = JSON.parse(raw);
        if (!Array.isArray(data) || data.length === 0) {
            console.log('✅ Nenhum dado para migrar.');
            return;
        }

        let migratedCount = 0;
        let alreadyMigratedCount = 0;

        const migratedData = data.map((order, index) => {
            // Se já tem estrutura nested (item existe), não precisa migrar
            if (order.item) {
                alreadyMigratedCount++;
                return order;
            }

            // Se tem DADOS_TECNICOS_JSON, já está no formato correto
            if (order.DADOS_TECNICOS_JSON) {
                try {
                    const technicalData = JSON.parse(order.DADOS_TECNICOS_JSON);
                    if (technicalData.item) {
                        migratedCount++;
                        return technicalData;
                    }
                } catch (e) {
                    console.warn(`⚠️ Erro ao parsear DADOS_TECNICOS_JSON do pedido ${index}:`, e);
                }
            }

            // Dados em formato desconhecido ou corrompido
            console.warn(`⚠️ Pedido ${index} em formato desconhecido, mantendo como está.`);
            return order;
        });

        // Salvar dados migrados
        if (migratedCount > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
            console.log(`✅ Migração concluída!`);
            console.log(`   - ${migratedCount} pedido(s) migrado(s)`);
            console.log(`   - ${alreadyMigratedCount} pedido(s) já no formato correto`);
            console.log(`   - Total: ${migratedData.length} pedido(s)`);
        } else {
            console.log(`✅ Todos os ${data.length} pedidos já estão no formato correto.`);
        }

    } catch (error) {
        console.error('❌ Erro durante migração:', error);
        console.log('Os dados originais foram preservados.');
    }
})();

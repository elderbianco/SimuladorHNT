// SOLUÇÃO EMERGENCIAL: Limpar localStorage completamente
// Execute este código no Console do navegador (F12 → Console)

console.log('🧹 Limpando localStorage completamente...');

// Limpar banco de dados de pedidos
localStorage.removeItem('hnt_all_orders_db');

// Limpar outros dados grandes que podem estar ocupando espaço
const keysToCheck = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    keysToCheck.push(key);
}

keysToCheck.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);

    // Remover itens grandes (mais de 100KB)
    if (size > 100000) {
        console.warn(`⚠️ Removendo ${key} (muito grande: ${(size / 1024).toFixed(2)} KB)`);
        localStorage.removeItem(key);
    }
});

console.log('✅ Limpeza concluída! Recarregue a página (F5)');

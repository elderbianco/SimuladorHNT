// Cole este código no console - ele vai criar uma variável global 'debugData'

const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];

if (history.length > 0) {
    const lastOrder = history[history.length - 1];

    // Salvar em variável global para você poder expandir
    window.debugData = {
        order: lastOrder,
        item: lastOrder.item,
        specs: lastOrder.item?.specs,
        pricing: lastOrder.item?.pricing,
        state: lastOrder.DADOS_TECNICOS_JSON ? JSON.parse(lastOrder.DADOS_TECNICOS_JSON) : null
    };

    console.log('✅ Dados salvos em window.debugData');
    console.log('Digite "debugData" no console para ver os dados');
    console.log('Digite "debugData.specs" para ver specs');
    console.log('Digite "debugData.state" para ver o state original');

    // Mostrar resumo
    console.log('\n=== RESUMO ===');
    console.log('Order ID:', lastOrder.order_id);
    console.log('Specs.parts tem dados?', Object.keys(lastOrder.item?.specs?.parts || {}).length > 0);
    console.log('Specs.uploads tem dados?', (lastOrder.item?.specs?.uploads || []).length > 0);
    console.log('Specs.texts tem dados?', (lastOrder.item?.specs?.texts || []).length > 0);
    console.log('Specs.extras tem dados?', Object.keys(lastOrder.item?.specs?.extras || {}).length > 0);

    if (window.debugData.state) {
        console.log('\nState original tem:');
        console.log('- parts?', !!window.debugData.state.parts);
        console.log('- extras?', !!window.debugData.state.extras);
        console.log('- textElements?', !!window.debugData.state.textElements);
        console.log('- embFiles?', !!window.debugData.state.embFiles);
    }
} else {
    console.log('Nenhum pedido encontrado');
}

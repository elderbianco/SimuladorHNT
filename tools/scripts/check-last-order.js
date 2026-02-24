// Cole este código no console para ver o ÚLTIMO pedido (mais recente)

const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];

if (history.length > 0) {
    const lastOrder = history[history.length - 1];

    console.log('=== ÚLTIMO PEDIDO (MAIS RECENTE) ===');
    console.log('Order ID:', lastOrder.order_id);
    console.log('Data:', lastOrder.created_at);
    console.log('\n=== ITEM COMPLETO ===');
    console.log(JSON.stringify(lastOrder.item, null, 2));

    console.log('\n=== DADOS_TECNICOS_JSON (State Original) ===');
    if (lastOrder.DADOS_TECNICOS_JSON) {
        const state = JSON.parse(lastOrder.DADOS_TECNICOS_JSON);
        console.log('State.parts:', state.parts);
        console.log('State.extras:', state.extras);
        console.log('State.textElements:', state.textElements);
        console.log('State.embFiles:', state.embFiles);
        console.log('State completo:', state);
    }
} else {
    console.log('Nenhum pedido encontrado');
}

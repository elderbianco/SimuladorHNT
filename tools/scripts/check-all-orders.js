// Cole este código no console para verificar TODOS os pedidos

const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];

console.log(`=== TOTAL DE PEDIDOS: ${history.length} ===\n`);

history.forEach((order, index) => {
    const hasSpecs = order.item?.specs;
    const hasParts = Object.keys(order.item?.specs?.parts || {}).length > 0;
    const hasUploads = (order.item?.specs?.uploads || []).length > 0;
    const hasTexts = (order.item?.specs?.texts || []).length > 0;
    const hasExtras = Object.keys(order.item?.specs?.extras || {}).length > 0;

    console.log(`Pedido ${index}:`);
    console.log(`  ID: ${order.order_id}`);
    console.log(`  Data: ${order.created_at}`);
    console.log(`  Specs existe: ${!!hasSpecs}`);
    console.log(`  Tem Parts: ${hasParts}`);
    console.log(`  Tem Uploads: ${hasUploads}`);
    console.log(`  Tem Texts: ${hasTexts}`);
    console.log(`  Tem Extras: ${hasExtras}`);
    console.log('---');
});

// Encontrar o pedido mais recente COM dados
const pedidoComDados = history.find(order => {
    return Object.keys(order.item?.specs?.parts || {}).length > 0 ||
        (order.item?.specs?.uploads || []).length > 0 ||
        (order.item?.specs?.texts || []).length > 0 ||
        Object.keys(order.item?.specs?.extras || {}).length > 0;
});

if (pedidoComDados) {
    console.log('\n=== ENCONTRADO PEDIDO COM DADOS ===');
    console.log(JSON.stringify(pedidoComDados.item.specs, null, 2));
} else {
    console.log('\n⚠️ NENHUM PEDIDO TEM DADOS EM SPECS!');
    console.log('Você precisa criar um NOVO pedido no simulador para testar.');
}

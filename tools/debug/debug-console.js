// Cole este código no console do navegador para ver os dados completos

const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];

if (history.length > 0) {
    const firstOrder = history[0];

    console.log('=== ESTRUTURA COMPLETA DO PRIMEIRO PEDIDO ===');
    console.log(JSON.stringify(firstOrder, null, 2));

    console.log('\n=== ITEM.SPECS ===');
    console.log(JSON.stringify(firstOrder.item?.specs, null, 2));

    console.log('\n=== VERIFICAÇÃO DE CAMPOS ===');
    console.log('Tem parts?', !!firstOrder.item?.specs?.parts);
    console.log('Tem uploads?', !!firstOrder.item?.specs?.uploads);
    console.log('Tem texts?', !!firstOrder.item?.specs?.texts);
    console.log('Tem extras?', !!firstOrder.item?.specs?.extras);
    console.log('Tem sizes?', !!firstOrder.item?.specs?.sizes);

    if (firstOrder.item?.specs?.parts) {
        console.log('\nPARTS:', Object.keys(firstOrder.item.specs.parts));
    }
    if (firstOrder.item?.specs?.uploads) {
        console.log('\nUPLOADS count:', firstOrder.item.specs.uploads.length);
    }
    if (firstOrder.item?.specs?.texts) {
        console.log('\nTEXTS count:', firstOrder.item.specs.texts.length);
    }
    if (firstOrder.item?.specs?.extras) {
        console.log('\nEXTRAS:', Object.keys(firstOrder.item.specs.extras));
    }
} else {
    console.log('Nenhum pedido encontrado no localStorage');
}

// Debug script - Execute this in the browser console to see the data structure
const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];
if (history.length > 0) {
    console.log('=== PRIMEIRO PEDIDO ===');
    console.log('Order completo:', history[0]);
    console.log('\n=== ITEM ===');
    console.log('Item:', history[0].item);
    console.log('\n=== SPECS ===');
    console.log('Specs:', history[0].item?.specs);
    console.log('\n=== PARTS ===');
    console.log('Parts:', history[0].item?.specs?.parts);
    console.log('\n=== UPLOADS ===');
    console.log('Uploads:', history[0].item?.specs?.uploads);
    console.log('\n=== TEXTS ===');
    console.log('Texts:', history[0].item?.specs?.texts);
    console.log('\n=== EXTRAS ===');
    console.log('Extras:', history[0].item?.specs?.extras);
    console.log('\n=== PRICING ===');
    console.log('Pricing:', history[0].item?.pricing);
} else {
    console.log('Nenhum pedido encontrado');
}

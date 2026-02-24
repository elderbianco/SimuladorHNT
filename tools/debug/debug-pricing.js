// Cole no console para ver a estrutura de pricing e config

const raw = localStorage.getItem('hnt_all_orders_db');
const history = raw ? JSON.parse(raw) : [];

if (history.length > 0) {
    const lastOrder = history[history.length - 1];
    const state = JSON.parse(lastOrder.DADOS_TECNICOS_JSON);

    console.log('=== PRICING ===');
    console.log(JSON.stringify(lastOrder.item.pricing, null, 2));

    console.log('\n=== STATE.CONFIG ===');
    console.log(JSON.stringify(state.config, null, 2));

    console.log('\n=== BREAKDOWN DETALHADO ===');
    if (lastOrder.item.pricing.breakdown) {
        console.log('Base:', lastOrder.item.pricing.breakdown.base);
        console.log('Dev Fees:', lastOrder.item.pricing.breakdown.dev_fees);
        console.log('Discounts:', lastOrder.item.pricing.breakdown.discounts);
        console.log('Addons:', lastOrder.item.pricing.breakdown.addons);
    }
}

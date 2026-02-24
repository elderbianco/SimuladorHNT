/**
 * Script de Debug - Verificar Configurações do Admin
 * 
 * COMO USAR:
 * 1. Abra o simulador Shorts Legging no navegador
 * 2. Pressione F12 para abrir o Console
 * 3. Cole este código completo e pressione Enter
 * 4. Verifique os valores exibidos
 */

console.log('=== DEBUG: Configurações do Admin ===\n');

// 1. Verificar localStorage
const configKey = 'hnt_shorts_legging_config';
const configRaw = localStorage.getItem(configKey);
console.log('1. localStorage raw:', configRaw);

if (!configRaw || configRaw === '{}') {
    console.error('❌ PROBLEMA: localStorage está vazio!');
    console.log('\n📋 SOLUÇÃO:');
    console.log('1. Acesse o painel Admin: http://localhost:3000/admin.html');
    console.log('2. Vá na aba "Shorts Legging"');
    console.log('3. Configure os preços');
    console.log('4. Clique em "Salvar Configurações"');
    console.log('5. Recarregue o simulador');
} else {
    const config = JSON.parse(configRaw);
    console.log('\n2. Configuração parseada:', config);

    console.log('\n3. Valores de Preço:');
    console.log('   - Preço Base:', config.basePrice || 'NÃO DEFINIDO');
    console.log('   - Logo Lateral:', config.logoLatPrice || 'NÃO DEFINIDO');
    console.log('   - Texto Lateral:', config.textLatPrice || 'NÃO DEFINIDO');
    console.log('   - Logo Perna:', config.logoLegPrice || 'NÃO DEFINIDO');
    console.log('   - Texto Perna:', config.textLegPrice || 'NÃO DEFINIDO');
    console.log('   - Taxa Arte:', config.devFee || 'NÃO DEFINIDO');
}

// 2. Verificar state.config atual
if (typeof state !== 'undefined') {
    console.log('\n4. state.config atual:', state.config);
    console.log('\n5. Função getZonePrice:');
    if (typeof getZonePrice === 'function') {
        console.log('   - Logo Lateral:', getZonePrice('lateral_direita', 'logo'));
        console.log('   - Texto Lateral:', getZonePrice('lateral_direita', 'text'));
        console.log('   - Logo Perna:', getZonePrice('perna_direita', 'logo'));
        console.log('   - Texto Perna:', getZonePrice('perna_direita', 'text'));
    } else {
        console.error('   ❌ Função getZonePrice não encontrada!');
    }
} else {
    console.error('❌ PROBLEMA: Variável "state" não encontrada!');
}

console.log('\n=== FIM DO DEBUG ===');

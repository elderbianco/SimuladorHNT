// ========================================
// SCRIPT COMPLETO PARA POPULAR TODOS OS SIMULADORES
// Execute no console do admin.html após fazer login
// ========================================

console.log('🚀 Iniciando configuração de TODOS os simuladores...\n');

// ========================================
// 1. SHORTS (Fight Shorts)
// ========================================
const shortsConfig = {
    basePrice: 149.90,
    sizeModPrice: 0,
    devFee: 0,
    logoCenterPrice: 29.90,
    textCenterPrice: 19.90,
    logoLatPrice: 14.90,
    textLatPrice: 9.90,
    legRightMidPrice: 14.90,
    legRightBottomPrice: 14.90,
    legLeftPrice: 14.90,
    extraLeggingPrice: 38.90,
    extraLacoPrice: 14.90,
    extraCordaoPrice: 14.90,
    price10: 134.90,
    price20: 119.90,
    price30: 104.90,
    artWaiver: true,
    whatsappNumber: ""
};
localStorage.setItem('hnt_pricing_config', JSON.stringify(shortsConfig));
console.log('✅ Shorts configurado:', shortsConfig);

// ========================================
// 2. LEGGING
// ========================================
const leggingConfig = {
    basePrice: 139.90,
    sizeModPrice: 0,
    devFee: 0,
    logoLatPrice: 29.90,
    textLatPrice: 9.90,
    logoLegPrice: 14.90,
    textLegPrice: 0,
    price10: 125.90,
    price20: 111.90,
    price30: 97.90,
    artWaiver: true
};
localStorage.setItem('hnt_legging_config', JSON.stringify(leggingConfig));
console.log('✅ Legging configurada:', leggingConfig);

// ========================================
// 3. SHORTS LEGGING
// ========================================
const shortsLeggingConfig = {
    basePrice: 89.90,
    sizeModPrice: 0,
    devFee: 0,
    logoLatPrice: 29.90,
    textLatPrice: 9.90,
    logoLegPrice: 14.90,
    textLegPrice: 9.90,
    price10: 80.90,
    price20: 71.90,
    price30: 62.90,
    artWaiver: true
};
localStorage.setItem('hnt_shorts_legging_config', JSON.stringify(shortsLeggingConfig));
console.log('✅ Shorts Legging configurado:', shortsLeggingConfig);

// ========================================
// 4. TOP
// ========================================
const topConfig = {
    basePrice: 89.90,
    sizeModPrice: 0,
    devFee: 0,
    logoFrontPrice: 14.90,
    textFrontPrice: 9.90,
    logoBackPrice: 0,
    textBackPrice: 0,
    logoHntFrontPrice: 0,
    logoHntBackPrice: 0,
    price10: 80.90,
    price20: 71.90,
    price30: 62.90,
    artWaiver: true
};
localStorage.setItem('hnt_top_config', JSON.stringify(topConfig));
console.log('✅ Top configurado:', topConfig);

// ========================================
// 5. MOLETOM
// ========================================
const moletomConfig = {
    basePrice: 0,
    sizeModPrice: 0,
    devFee: 0,
    logoFrontPrice: 0,
    textFrontPrice: 0,
    logoBackPrice: 0,
    textBackPrice: 0,
    price10: 0,
    price20: 0,
    price30: 0,
    artWaiver: true
};
localStorage.setItem('hnt_moletom_config', JSON.stringify(moletomConfig));
console.log('✅ Moletom configurado:', moletomConfig);

// ========================================
// VERIFICAÇÃO FINAL
// ========================================
console.log('\n📋 VERIFICAÇÃO FINAL:\n');

const verify = (key, name) => {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    console.log(`${name}:`, data);
    return data;
};

verify('hnt_pricing_config', 'Shorts');
verify('hnt_legging_config', 'Legging');
verify('hnt_shorts_legging_config', 'Shorts Legging');
verify('hnt_top_config', 'Top');
verify('hnt_moletom_config', 'Moletom');

console.log('\n✅ CONFIGURAÇÃO COMPLETA!');
console.log('🔄 Agora recarregue TODOS os simuladores (Ctrl+F5) para ver os preços corretos!');

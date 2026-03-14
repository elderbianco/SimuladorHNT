// Script para popular o admin com valores padrão da tabela oficial (Jan/2026 v2)
// Execute este código no console do admin.html para configurar os preços iniciais
// Versão 2 - Alinhado com resetToTable do admin

const CONFIG_VERSION = '2025-01-v2';

// SHORTS - Fight Shorts
const shortsConfig = {
    configVersion: CONFIG_VERSION,
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
    artWaiver: true
};

// LEGGING
const leggingConfig = {
    configVersion: CONFIG_VERSION,
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

// SHORTS LEGGING
const shortsLeggingConfig = {
    configVersion: CONFIG_VERSION,
    basePrice: 89.90,
    sizeModPrice: 0,
    devFee: 0,
    logoLatPrice: 29.90,
    textLatPrice: 9.90,
    logoLegPrice: 14.90,
    textLegPrice: 0,  // ✅ CORRIGIDO: era 9.90, admin usa 0
    price10: 80.90,
    price20: 71.90,
    price30: 62.90,
    artWaiver: true
};

// TOP
const topConfig = {
    configVersion: CONFIG_VERSION,
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

// MOLETOM
const moletomConfig = {
    configVersion: CONFIG_VERSION,
    basePrice: 189.90,
    sizeModPrice: 0,  // ✅ CORRIGIDO: era 10.00, admin usa 0
    devFee: 0,        // ✅ CORRIGIDO: era 30.00, admin usa 0
    logoFrontPrice: 29.90,
    textFrontPrice: 19.90,
    logoBackPrice: 29.90,
    textBackPrice: 19.90,
    logoSleevePrice: 14.90,
    textSleevePrice: 9.90,
    logoHoodPrice: 14.90,
    textHoodPrice: 9.90,
    price10: 170.90,
    price20: 151.90,
    price30: 132.90,
    artWaiver: true
};

// Salvar no localStorage
localStorage.setItem('hnt_pricing_config', JSON.stringify(shortsConfig));
localStorage.setItem('hnt_legging_config', JSON.stringify(leggingConfig));
localStorage.setItem('hnt_shorts_legging_config', JSON.stringify(shortsLeggingConfig));
localStorage.setItem('hnt_top_config', JSON.stringify(topConfig));
localStorage.setItem('hnt_moletom_config', JSON.stringify(moletomConfig));
localStorage.setItem('hnt_config_version', CONFIG_VERSION);

console.log('✅ Configurações de preço v2 salvas com sucesso!');
console.log('Recarregue os simuladores para ver os novos preços.');

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
                                                                artWaiver: true
};

// LEGGING
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

// SHORTS LEGGING
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

// TOP
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

// MOLETOM
const moletomConfig = {
    basePrice: 189.90,
    sizeModPrice: 10.00,
    devFee: 30.00,
    logoFrontPrice: 29.90,
    textFrontPrice: 19.90,
    logoBackPrice: 29.90,
    textBackPrice: 19.90,
    logoSleevePrice: 14.90,
    textSleevePrice: 9.90,
    logoHoodPrice: 14.90,
    textHoodPrice: 9.90,
    price10: 170.90,
    price20: 151.90,
    price30: 132.90,
    artWaiver: true
};

// Salvar no localStorage
localStorage.setItem('hnt_pricing_config', JSON.stringify(shortsConfig));
localStorage.setItem('hnt_legging_config', JSON.stringify(leggingConfig));
localStorage.setItem('hnt_shorts_legging_config', JSON.stringify(shortsLeggingConfig));
localStorage.setItem('hnt_top_config', JSON.stringify(topConfig));
localStorage.setItem('hnt_moletom_config', JSON.stringify(moletomConfig));

console.log('✅ Configurações de preço salvas com sucesso!');
console.log('Recarregue os simuladores para ver os novos preços.');

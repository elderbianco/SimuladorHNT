const fs = require('fs');

global.localStorage = {
    getItem: (key) => null,
    setItem: () => {}
};

const simulators = ['shorts', 'moletom', 'top', 'calca-legging', 'shorts-legging'];

for (const sim of simulators) {
    try {
        console.log('--- Testando ' + sim + ' ---');
        global.state = {
            config: {},
            sizes: { 'M': 1, 'GG': 1 },
            elements: {},
            texts: {},
            color: 'preto',
            simNumber: '123',
            orderNumber: '456'
        };
        global.CONFIG = {
            sizes: [{label: 'M', priceMod: 0}, {label: 'GG', priceMod: 10.00}],
            textZones: [],
            zones: {},
            colors: []
        };
        global.DATA = global.CONFIG;
        
        global.getDefaultFont = () => 'Outfit';
        global.updateCartCount = () => {};
        global.getAutoHntLogoColor = () => 'preto';
        
        let logicCode = fs.readFileSync(C:/Users/Nitro v15/.gemini/antigravity/scratch/SimulatorHNT_1/js/modules/ + sim + /logic.js, 'utf8');
        let pricingCode = fs.readFileSync(C:/Users/Nitro v15/.gemini/antigravity/scratch/SimulatorHNT_1/js/modules/ + sim + /pricing.js, 'utf8');
        
        logicCode = logicCode.replace(/window\.addEventListener.*/g, '');
        logicCode = logicCode.replace(/window\.dataCache.*/g, '');
        
        eval(logicCode);
        eval(pricingCode);
        
        loadAdminConfig();
        const p = calculateFullPrice();
        console.log('Math Success:', p);
    } catch (e) {
        console.error('FALHA CRÍTICA no ' + sim + ':', e.message);
    }
}

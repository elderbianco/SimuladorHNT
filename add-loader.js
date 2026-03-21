const fs = require('fs');
const path = require('path');

const replacementBlock = `
        // 1. Mostrar Notificação de Carregamento imediata
        const loader = document.createElement('div');
        loader.innerHTML = \\\`
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;box-shadow:0 15px 40px rgba(0,0,0,0.6);border:2px solid #D4AF37;">
                <div class="spinner-hnt" style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #D4AF37;border-radius:50%;animation:spin-hnt 1s linear infinite;"></div>
                <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:#D4AF37;">PROCESSANDO PEDIDO</div>
                <div style="font-size:0.9rem;color:#ccc;text-align:center;">Gerando Ficha Técnica e PDF...<br><span style="font-size:0.75rem;color:#888;">Por favor, aguarde.</span></div>
            </div>
            <style>@keyframes spin-hnt { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        \\\`;
        document.body.appendChild(loader);

        // Dá 100ms pro browser renderizar o modal e então chama saveOrderToHistory
        setTimeout(async () => {
            if (await saveOrderToHistory()) {
                if (typeof saveState === 'function') saveState();
                if (typeof updateCartCount === 'function') updateCartCount();
                
                loader.innerHTML = \\\`
                    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;border:2px solid #28a745;">
                        <div style="font-size:40px;">✅</div>
                        <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#28a745;">ADICIONADO AO CARRINHO</div>
                        <div style="font-size:0.9rem;color:#ccc;">Sendo redirecionado...</div>
                    </div>
                \\\`;
                
                setTimeout(() => {
                    window.location.href = 'IndexPedidoSimulador.html';
                }, 1500);
            } else {
                loader.remove(); // Remove loader se a validação/salvamento falhar
            }
        }, 100);
`;

const files = [
    'js/modules/moletom/ui-render.js',
    'js/modules/top/ui-render.js',
    'js/modules/top/ui-render-refactored.js',
    'js/modules/shorts-legging/ui-render.js',
    'js/modules/calca-legging/ui-render.js'
];

files.forEach(f => {
    let code = fs.readFileSync(f, 'utf8');

    // Pattern for "const success = await saveOrderToHistory(); if (success)"
    const pattern1 = /const\s+success\s*=\s*await\s+saveOrderToHistory\(\);\s*if\s*\(\s*success\s*\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'IndexPedidoSimulador\.html';\s*\}/g;

    // Pattern for "if (typeof saveOrderToHistory === 'function') { const success = await saveOrderToHistory(); if (success) { ... } }" -> Actually just replace the block inside btnCart.onclick after simulation ID creation

    if (code.includes("window.location.href = 'IndexPedidoSimulador.html';")) {
        // Custom precise replacement
        let startIdx = code.indexOf("if (typeof saveOrderToHistory === 'function') {");
        if (startIdx === -1) startIdx = code.indexOf("if (await saveOrderToHistory()) {");

        let endIdx = code.indexOf("window.location.href = 'IndexPedidoSimulador.html';");
        if (endIdx > startIdx) {
            let sliceEnd = code.indexOf("}", endIdx) + 1;
            // handle double brackets
            let nextClose = code.indexOf("}", sliceEnd);
            if (code.substring(endIdx, nextClose).includes("}")) {
                sliceEnd = nextClose + 1;
            }
            code = code.substring(0, startIdx) + replacementBlock + code.substring(sliceEnd);
            fs.writeFileSync(f, code);
            console.log("Atualizado manualmente via string inj: ", f);
        }
    }
});

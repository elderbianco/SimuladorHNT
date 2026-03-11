const fs = require('fs');
const files = [
    'js/modules/shorts/ui-render.js',
    'js/modules/moletom/ui-render.js',
    'js/modules/top/ui-render-refactored.js',
    'js/modules/top/ui-render.js',
    'js/modules/shorts-legging/ui-render.js',
    'js/modules/calca-legging/ui-render.js'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    let code = fs.readFileSync(f, 'utf8');

    // We want to replace the generic `if (await saveOrderToHistory()) { ... }` 
    // or `const success = await saveOrderToHistory(); if(success) { ... }`
    // with a reliable Loader that works for all.
    // Let's just find the `btnCart.onclick = async () => {` block and rewrite the bottom part.

    const regex = /if\s*\(\s*(?:await\s+)?saveOrderToHistory\(\s*\)\s*\)\s*\{([\s\S]*?)window\.location\.href\s*=\s*'IndexPedidoSimulador\.html';([\s\S]*?)\}/;

    if (regex.test(code)) {
        code = code.replace(regex, `
        // 1. Mostrar Notificação de Carregamento (Loading Feedback)
        const loader = document.createElement('div');
        loader.innerHTML = \`
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;box-shadow:0 15px 40px rgba(0,0,0,0.6);border:2px solid #D4AF37;">
                <div class="spinner-hnt" style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #D4AF37;border-radius:50%;animation:spin-hnt 1s linear infinite;"></div>
                <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:#D4AF37;">PROCESSANDO PEDIDO</div>
                <div style="font-size:0.9rem;color:#ccc;text-align:center;">Gerando Ficha Técnica e PDF...<br><span style="font-size:0.75rem;color:#888;">Por favor, aguarde.</span></div>
            </div>
            <style>@keyframes spin-hnt { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        \`;
        document.body.appendChild(loader);

        // Agendar para permitir que o DOM renderize o loader ANTES do travamento do jsPDF
        setTimeout(async () => {
            if (await saveOrderToHistory()) {
                if (typeof saveState === 'function') saveState();
                if (typeof updateCartCount === 'function') updateCartCount();
                
                loader.innerHTML = \`
                    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;border:2px solid #28a745;">
                        <div style="font-size:40px;">✅</div>
                        <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#28a745;">ADICIONADO AO CARRINHO</div>
                        <div style="font-size:0.9rem;color:#ccc;">Redirecionando...</div>
                    </div>
                \`;
                
                setTimeout(() => {
                    window.location.href = 'IndexPedidoSimulador.html';
                }, 1000);
            } else {
                loader.remove();
            }
        }, 100);
        `);
        fs.writeFileSync(f, code);
        console.log('Atualizado via Regex 1:', f);
    } else {
        // Regex 2 for modules like top that use `const success = await saveOrderToHistory(); if(success)`
        const regex2 = /const\s+success\s*=\s*await\s+saveOrderToHistory\(\s*\);\s*if\s*\(\s*success\s*\)\s*\{([\s\S]*?)window\.location\.href\s*=\s*'IndexPedidoSimulador\.html';([\s\S]*?)\}/;
        if (regex2.test(code)) {
            code = code.replace(regex2, `
        // 1. Mostrar Notificação de Carregamento (Loading Feedback)
        const loader = document.createElement('div');
        loader.innerHTML = \`
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;box-shadow:0 15px 40px rgba(0,0,0,0.6);border:2px solid #D4AF37;">
                <div class="spinner-hnt" style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #D4AF37;border-radius:50%;animation:spin-hnt 1s linear infinite;"></div>
                <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:#D4AF37;">PROCESSANDO PEDIDO</div>
                <div style="font-size:0.9rem;color:#ccc;text-align:center;">Gerando Ficha Técnica e PDF...<br><span style="font-size:0.75rem;color:#888;">Por favor, aguarde.</span></div>
            </div>
            <style>@keyframes spin-hnt { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        \`;
        document.body.appendChild(loader);

        setTimeout(async () => {
            const success = await saveOrderToHistory();
            if (success) {
                if (typeof saveState === 'function') saveState();
                if (typeof updateCartCount === 'function') updateCartCount();
                
                loader.innerHTML = \`
                    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;border:2px solid #28a745;">
                        <div style="font-size:40px;">✅</div>
                        <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#28a745;">ADICIONADO AO CARRINHO</div>
                        <div style="font-size:0.9rem;color:#ccc;">Redirecionando...</div>
                    </div>
                \`;
                
                setTimeout(() => {
                    window.location.href = 'IndexPedidoSimulador.html';
                }, 1000);
            } else {
                loader.remove();
            }
        }, 100);
            `);
            fs.writeFileSync(f, code);
            console.log('Atualizado via Regex 2:', f);
        } else {
            console.log('Regex não deu match em:', f);
        }
    }
});

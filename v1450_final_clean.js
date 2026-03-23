const fs = require('fs');
const path = require('path');

const detailedNotice = `function renderFinalForm() {
    const div = document.createElement('div');
    div.innerHTML = \`
        <div style="margin-top:10px; border-top:1px solid #333; padding-top:10px;">
            <label style="font-weight:bold; display:block; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; height:60px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; padding:5px;"></textarea>
        </div>
        <div style="margin-top:10px; background:#fff3cd; padding:10px; border-left:4px solid #ffc107; border-radius:4px;">
            <label style="font-weight:bold; display:block; color:#856404;">Telefone <span style="color:red">*</span> \${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_telefone', 'Necessário para contato sobre ajustes técnicos e análise de produção') : ''}</label>
            <input type="tel" id="phone-input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="(XX) XXXXX-XXXX">
        </div>
        <div style="margin-top:15px; background:#111; border:1px solid #333; padding:12px; border-radius:4px; color:#aaa; font-size:0.8rem;">
            <p style="margin:0 0 10px 0; line-height:1.4;">
                <strong style="color:#D4AF37;">⚠️ AVISO IMPORTANTE:</strong> Este documento é uma <strong>SIMULAÇÃO DIGITAL</strong> para fins de orçamento e visualização. O resultado final físico pode apresentar pequenas variações de cor, tamanho, proporções e ajuste, devido aos processos artesanais e à calibração de cada monitor. Todos os arquivos e artes passarão por análise técnica de viabilidade de bordado, e o valor final está sujeito a confirmação após essa avaliação.
            </p>
            <p style="margin:0 0 12px 0; line-height:1.4;">
                Ao prosseguir, você declara que leu e concorda com todas as informações e condições do produto disponíveis em nosso <a href="IndexFaq.html" target="_blank" style="color:#D4AF37; text-decoration:underline;">FAQ</a>, além de confirmar que possui os direitos autorais sobre as artes enviadas, assumindo total responsabilidade legal.
            </p>
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:#fff; font-weight:bold;">
                <input type="checkbox" id="terms-checkbox" style="width:18px; height:18px; margin-top:2px;">
                <span>EU LI E CONCORDO WITH THE TERMS ABOVE <span style="color:red">*</span></span>
            </label>
        </div>
    \`;
    return div;
}`;

const modules = ['calca-legging', 'shorts-legging', 'top', 'fight-shorts', 'rash-guard', 'short-balada', 'calca-moletom', 'combat-shorts'];

modules.forEach(mod => {
    const uiPath = `js/modules/${mod}/ui-render.js`;
    const simPath = `js/modules/${mod}/simulator.js`;

    // 1. Update UI Notice
    if (fs.existsSync(uiPath)) {
        let content = fs.readFileSync(uiPath, 'utf8');
        const newContent = content.replace(/function renderFinalForm\(\) \{[\s\S]*?return div;[\s\S]*?\}/, detailedNotice);
        if (content !== newContent) {
            fs.writeFileSync(uiPath, newContent);
            console.log(`✅ Fixed notice in ${uiPath}`);
        }
    }

    // 2. Remove Redundant Click Handler in simulator.js
    if (fs.existsSync(simPath)) {
        let content = fs.readFileSync(simPath, 'utf8');
        // Matches the entire btnCart assignment and onclick block
        const regex = /const btnCart = document\.getElementById\('btn-add-cart'\) \|\| document\.getElementById\('btn-export-db'\);[\s\S]*?if \(btnCart\) \{[\s\S]*?btnCart\.onclick = async \(\) => \{[\s\S]*?\};?\s*\}/g;

        if (content.match(regex)) {
            const newContent = content.replace(regex, '/* Carrinho gerenciado pelo ui-render.js */');
            fs.writeFileSync(simPath, newContent);
            console.log(`🧹 Removed redundant cart click handler in ${simPath}`);
        }
    }
});

// Final Check for IndexMoletom.html (db-integration)
const mHtml = 'IndexMoletom.html';
if (fs.existsSync(mHtml)) {
    let html = fs.readFileSync(mHtml, 'utf8');
    if (!html.includes('db-integration.js')) {
        html = html.replace('js/modules/common/database-manager.js', 'js/modules/common/db-integration.js?v=14.50"></script>\n    <script defer src="js/modules/common/database-manager.js');
        fs.writeFileSync(mHtml, html);
        console.log(`✅ Added db-integration to ${mHtml}`);
    }
}

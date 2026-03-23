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
                <span>EU LI E CONCORDO COM OS TERMOS E CONDIÇÕES ACIMA <span style="color:red">*</span></span>
            </label>
        </div>
    \`;
    return div;
}`;

const uiFiles = [
    'js/modules/calca-legging/ui-render.js',
    'js/modules/shorts-legging/ui-render.js',
    'js/modules/top/ui-render.js'
];

uiFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace current renderFinalForm function
        const newContent = content.replace(/function renderFinalForm\(\) \{[\s\S]*?return div;[\s\S]*?\}/, detailedNotice);
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log(`✅ Fixed notice in ${file}`);
        } else {
            console.warn(`⚠️ Could not find renderFinalForm in ${file} or it's already updated.`);
        }
    } else {
        console.error(`❌ File not found: ${file}`);
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

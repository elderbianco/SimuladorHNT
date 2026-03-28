const fs = require('fs');
let code = fs.readFileSync('HNT-OPS/app/app.js', 'utf8');

const regex = /^\s*else\s*\{\s*contentHtml\s*=\s*<div style="padding:40px;\s*text-align:center;\s*color:var\(--text-3\);">/m;

const separacaoBlock = \
    } else if (drawerTab === 'separacao') {
        const iconAtual = ETAPA_ICONS[p.etapa] || '📦';
        
        let painelHexHtml = '';
        let itensHtml = '';
        
        produtos.forEach((prod, idx) => {
            const indexLabel = numProdutos > 1 ? \<div style="font-weight:800; color:var(--blurple); margin-top:20px; text-transform:uppercase; font-size:12px">PRODUTO \: \</div>\ : '';
            
            // Tenta resgatar dados do simulador: tamanhos, cores
            const dt = prod.dados_tecnicos || p.dados_tecnicos || {};
            const dtObj = typeof dt === 'string' ? JSON.parse(dt) : dt;
            
            const gradeText = prod.tamanho || p.tamanho || 'Tamanho Único';
            const partes = (dtObj.cores && typeof dtObj.cores === 'object') ? dtObj.cores : {};
            
            // UI Painel Hex
            let colorRows = '';
            for (const [parte, hex] of Object.entries(partes)) {
                if (hex && String(hex).startsWith('#')) {
                    colorRows += \<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                      <div class="color-swatch-hex" style="width:30px; height:30px; border-radius:4px; background:\; border:1px solid #000; box-shadow:0 2px 4px rgba(0,0,0,0.1)"></div>
                      <div style="font-size:13px; font-weight:600; text-transform:capitalize;">\ <span style="color:var(--text-3); font-weight:400; font-size:11px;">(\)</span></div>
                    </div>\;
                }
            }
            if (!colorRows) colorRows = '<div style="font-size:12px;color:var(--text-3);">Nenhuma cor hexadecimal registrada. Confirme no PDF.</div>';

            painelHexHtml += \
                \
                <div style="background:var(--surface-color); padding:10px; border-radius:8px; border:1px solid var(--border); margin-top:10px;">
                    \
                </div>
            \;

            // UI Checklist de Peças (Tamanhos e Qtds) e QRCode
            // Como simplificação, criamos itens de checklist baseado na quantidade total ou campo de tamanhos
            const maxPecas = parseInt(prod.quantidade || p.quantidade || 1);
            let checkPecas = '';
            for(let i=1; i<=maxPecas; i++) {
                checkPecas += \
                  <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:5px; background:var(--surface-color); border-radius:6px; border:1px solid var(--border);">
                     <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex: 1;">
                         <input type="checkbox" class="modal-input" style="width:18px; height:18px; margin:0;" onclick="this.parentNode.parentNode.style.opacity = this.checked ? '0.5' : '1'">
                         <span style="font-weight:700; font-size:13px;">Peça \ de \</span>
                         <span style="font-size:11px; color:var(--text-3); background:var(--surface-2); padding:2px 6px; border-radius:4px;">\</span>
                     </label>
                     <button class="btn btn-outline" style="font-size:10px; padding:4px 8px; border-color:var(--text-3);" onclick="alert('Gerar Etiqueta QR interna...')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:12px; height:12px; margin-right:4px; display:inline-block"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" /></svg>
                        Imprimir QR
                     </button>
                  </div>
                \;
            }
            
            itensHtml += \
                \
                <div style="margin-top:10px;">\</div>
            \;
        });

        contentHtml = \
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>📦 SEPARAÇÃO (Estoque e Insumos)</span>
                    <span style="font-size:12px; font-weight:700; color:var(--text-3);">Pedido nº \</span>
                </div>
                
                <div class="detail-grid" style="margin-top:15px; grid-template-columns: 1fr;">
                    <div class="detail-item full" style="border:1px solid var(--border); padding:15px; border-radius:8px; background:var(--surface-color);">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-1);">📋 CHECKLIST GLOBAL DE INSUMOS</div>
                        <div style="display:flex; gap:20px; flex-wrap:wrap;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600; font-size:14px;">Tecido (Rolo principal)</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600; font-size:14px;">Linhas Comuns</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600; font-size:14px;">Elástico / Aviamentos</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:15px; margin-top:20px; flex-wrap:wrap;">
                    <!-- Coluna de Check individual e Etiquetas -->
                    <div style="flex: 2; min-width:300px;">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-2);">VERIFICAÇÃO POR PEÇA (GERAÇÃO DE LOTE)</div>
                        \
                        <button class="btn btn-outline" style="width:100%; margin-top:15px; border-color:var(--blurple); color:var(--blurple); font-weight:800;" onclick="alert('Enviado para a fila de impressão em lote.')">🖨️ Enviar todos para lista de impressão (Lote)</button>
                    </div>
                    
                    <!-- Coluna de Cores Hex -->
                    <div style="flex: 1; min-width:250px;">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-2);">PAINEL DE CORES (APROVAÇÃO TÉCNICA)</div>
                        \
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Validação & Pendência de Insumos</div>
                <label style="font-size:12px; font-weight:700; color:var(--text-3);">Faltou algum tecido ou elástico? Registre aqui e trave o pedido:</label>
                <textarea class="modal-input" placeholder="Ex: Rolo de malha azul em falta no estoque..." id="input-separacao-obs" style="height:60px; margin:8px 0; border:1px solid var(--border);">\</textarea>
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('\', 'Pendencia')">🚩 Marcar como PENDENTE</button>
                    <button class="btn" style="flex:2; background:var(--green); color:#000; font-weight:800;" onclick="moverEtapa('\', 'Arte')">✅ CONCLUIR SEPARAÇÃO (Mover p/ Arte)</button>
                </div>
            </div>
        \;
    }
\;

const updated = code.replace(regex, separacaoBlock + '\n    else {\n        contentHtml = <div style="padding:40px; text-align:center; color:var(--text-3);">');

fs.writeFileSync('HNT-OPS/app/app.js', updated);
console.log('App.js patched successfully!');

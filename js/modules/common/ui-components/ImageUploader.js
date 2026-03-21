/**
 * Componente: ImageUploader
 * Descrição: Controle completo de upload de imagem para uma zona.
 */

// Ícones SVG
const ICONS = {
    camera: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
    gallery: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    remove: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

window.UIComponents = window.UIComponents || {};

window.UIComponents.createImageUploader = function ({
    zone,
    uploadState, // { src, filename, isCustom, hasEmbPromise, scale }
    limitEnabled,
    config,
    isCoveredByEmb, // boolean
    callbacks // { onUpload, onRemove, onToggleLimit, onEmbPromise, onScale, openGallery }
}) {
    const wrap = document.createElement('div');
    wrap.className = 'upload-control-wrap';

    // 1. Checkbox "Mostrar Limites"
    const limitWrap = document.createElement('div');
    limitWrap.style.marginBottom = '10px';
    limitWrap.style.display = 'flex';
    limitWrap.style.alignItems = 'center';

    const lChk = document.createElement('input');
    lChk.type = 'checkbox';
    lChk.id = `chk-limit-${zone.id}`;
    lChk.checked = !!limitEnabled;
    lChk.style.marginRight = '8px';
    lChk.onchange = (e) => {
        if (callbacks.onToggleLimit) callbacks.onToggleLimit(zone.id, e.target.checked);
    };

    const lLbl = document.createElement('label');
    lLbl.htmlFor = `chk-limit-${zone.id}`;
    lLbl.innerText = 'Mostrar Limites';
    lLbl.style.fontSize = '0.85rem';
    lLbl.style.fontWeight = 'bold';
    lLbl.style.color = '#fff';
    lLbl.style.cursor = 'pointer';

    limitWrap.appendChild(lChk);
    limitWrap.appendChild(lLbl);
    wrap.appendChild(limitWrap);

    // 2. Botões de Ação
    const btnBox = document.createElement('div');
    btnBox.className = 'zone-buttons';
    btnBox.style.width = '100%';
    btnBox.style.display = 'grid';
    btnBox.style.gridTemplateColumns = '1fr 1fr';
    btnBox.style.gap = '8px';

    if (!uploadState || !uploadState.src) {
        // --- Estado: Sem Imagem ---

        // Botão Enviar Arquivo
        const btnImg = document.createElement('button');
        btnImg.className = 'zone-btn';
        btnImg.innerHTML = `<span class="btn-icon">${ICONS.camera}</span> <span class="btn-label">ENVIAR ARQUIVO</span>`;
        btnImg.onclick = () => {
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
            inp.onchange = (e) => {
                if (callbacks.onUpload) callbacks.onUpload(zone.id, e.target.files[0]);
            };
            inp.click();
        };

        // Botão Banco Imagens
        const btnGal = document.createElement('button');
        btnGal.className = 'zone-btn';
        btnGal.innerHTML = `<span class="btn-icon">${ICONS.gallery}</span> <span class="btn-label">BANCO IMAGENS</span>`;
        btnGal.onclick = () => {
            if (callbacks.openGallery) callbacks.openGallery(zone.id);
        };

        btnBox.appendChild(btnImg);
        btnBox.appendChild(btnGal);
    } else {
        // --- Estado: Com Imagem ---

        // Mensagem de Taxa (se custom e não coberto)
        if (uploadState.isCustom && !isCoveredByEmb) {
            const hint = document.createElement('div');
            hint.style.gridColumn = '1 / -1'; hint.style.fontSize = '0.7rem'; hint.style.color = '#aaa'; hint.style.textAlign = 'center';
            hint.style.marginBottom = '8px';
            const fee = (config && config.devFee) || 0;
            hint.innerHTML = `Taxa de desenvolvimento da arte de bordado (arquivo EMB): <span style="color:var(--accent);">+R$ ${fee.toFixed(2).replace('.', ',')}</span> (Cobrado somente para imagens enviadas)`;
            btnBox.appendChild(hint);
        }

        // Botão Remover
        const btnDel = document.createElement('button');
        btnDel.className = 'zone-btn zone-btn-danger'; btnDel.style.gridColumn = '1 / -1';
        btnDel.innerHTML = `<span class="btn-icon">${ICONS.remove}</span> <span class="btn-label">REMOVER IMAGEM</span>`;
        btnDel.onclick = () => {
            if (callbacks.onRemove) callbacks.onRemove(zone.id);
        };
        btnBox.appendChild(btnDel);

        // Card de Informações
        const card = document.createElement('div');
        card.className = 'info-card';
        card.style.marginTop = '10px';
        card.style.padding = '10px';
        card.style.background = 'rgba(255,255,255,0.05)';
        card.style.borderRadius = '4px';
        card.innerHTML = `<div style="font-size:0.75rem; color:#aaa; margin-bottom:5px;"><strong>Arquivo:</strong> ${uploadState.filename || 'Imagem'}</div>`;

        // Checkbox: Promessa de Arte EMB
        if (uploadState.isCustom) {
            const embPromiseWrap = document.createElement('div');
            embPromiseWrap.style.margin = '10px 0';
            embPromiseWrap.style.padding = '8px';
            embPromiseWrap.style.background = '#1a472a';
            embPromiseWrap.style.border = '1px dashed #28a745';
            embPromiseWrap.style.borderRadius = '4px';
            embPromiseWrap.style.display = 'flex';
            embPromiseWrap.style.alignItems = 'center';

            const embChk = document.createElement('input');
            embChk.type = 'checkbox';
            embChk.id = `chk-emb-promise-${zone.id}`;
            embChk.checked = !!uploadState.hasEmbPromise;
            embChk.style.marginRight = '10px';
            embChk.style.transform = 'scale(1.2)';
            embChk.onchange = (e) => {
                if (callbacks.onEmbPromise) callbacks.onEmbPromise(zone.id, e.target.checked);
            };

            const embLabel = document.createElement('label');
            embLabel.htmlFor = `chk-emb-promise-${zone.id}`;
            embLabel.innerHTML = '✅ <strong>Tenho a Matriz (.EMB)</strong> <br><span style="font-size:0.75rem; color:#d4edda;">Marque para enviar o arquivo e isentar a taxa.</span>';
            embLabel.style.cursor = 'pointer';
            embLabel.style.color = '#fff';
            embLabel.style.fontSize = '0.9rem';
            embLabel.style.lineHeight = '1.2';

            embPromiseWrap.appendChild(embChk);
            embPromiseWrap.appendChild(embLabel);
            card.appendChild(embPromiseWrap);

            if (uploadState.hasEmbPromise) {
                card.style.borderLeft = '4px solid #28a745';
            }
        }

        // Controle de Escala
        const sizeControlLabel = document.createElement('div');
        sizeControlLabel.style.fontSize = '0.7rem';
        sizeControlLabel.style.color = '#D4AF37';
        sizeControlLabel.style.marginBottom = '2px';
        sizeControlLabel.innerText = '[Imagem] Tamanho:';
        card.appendChild(sizeControlLabel);

        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.alignItems = 'center';
        flexContainer.style.gap = '8px';

        const scaleVal = uploadState.scale || 1.0;

        const sl = document.createElement('input');
        sl.className = 'range-slider';
        sl.type = 'range'; sl.min = 0.1; sl.max = 5.0; sl.step = 0.1; sl.value = scaleVal;
        sl.style.flex = '1';

        const num = document.createElement('input');
        num.type = 'number'; num.min = 0.1; num.max = 5.0; num.step = 0.1; num.value = scaleVal.toFixed(2);
        num.style.width = '75px';
        num.style.padding = '4px 8px';
        num.style.boxSizing = 'border-box';
        num.style.textAlign = 'center';
        num.style.background = '#000';
        num.style.color = '#fff';
        num.style.border = '1px solid #444';
        num.style.borderRadius = '4px';
        num.style.fontSize = '0.9rem'; // Added slightly larger font
        num.style.lineHeight = '1.2';

        sl.oninput = (e) => {
            const val = parseFloat(e.target.value);
            num.value = val.toFixed(2);
            if (callbacks.onScale) callbacks.onScale(zone.id, val);
        };

        num.oninput = (e) => {
            const val = parseFloat(e.target.value) || 1.0;
            sl.value = val;
            if (callbacks.onScale) callbacks.onScale(zone.id, val);
        };

        flexContainer.appendChild(sl);
        flexContainer.appendChild(num);
        card.appendChild(flexContainer);
        wrap.appendChild(card);
    }

    wrap.appendChild(btnBox);
    return wrap;
}

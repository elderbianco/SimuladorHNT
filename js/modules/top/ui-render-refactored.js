/**
 * Módulo de UI - Top (REFATORADO)
 * ✅ USA COMPONENTES REUTILIZÁVEIS
 * ✅ MANTÉM INTEGRAÇÃO COM state.config
 * ✅ PRESERVA PREÇOS DINÂMICOS DO ADMIN
 */

// Ícones SVG (mantidos para compatibilidade)
const cameraIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
const galleryIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
const removeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

/**
 * ✅ HELPER: Renderiza seção de cor base usando componente reutilizável
 */
function renderColorSection() {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = '<div class="category-header">Cor do Top</div>';

    const colorGrid = document.createElement('div');
    colorGrid.className = 'color-grid';
    colorGrid.style.display = 'grid';
    colorGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(40px, 1fr))';
    colorGrid.style.gap = '8px';
    colorGrid.style.padding = '10px';

    // ✅ Usa state.availableColors (filtrado pelo Admin)
    (state.availableColors || CONFIG.colors || []).forEach(c => {
        const swatch = document.createElement('div');
        swatch.className = `color-option ${state.color === c.id ? 'selected' : ''}`;
        swatch.style.backgroundColor = c.hex;
        swatch.style.width = '40px';
        swatch.style.height = '40px';
        swatch.style.borderRadius = '8px';
        swatch.style.cursor = 'pointer';
        swatch.style.border = state.color === c.id ? '3px solid #00b4d8' : '2px solid #333';
        swatch.style.transition = 'all 0.2s';
        swatch.title = c.name;

        swatch.onclick = () => {
            state.color = c.id;
            updateVisuals();
            saveState();
            renderControls(); // Re-render para atualizar seleção
        };

        if (state.color === c.id) {
            const check = document.createElement('span');
            check.innerHTML = '✓';
            check.style.color = '#fff';
            check.style.fontSize = '20px';
            check.style.display = 'flex';
            check.style.alignItems = 'center';
            check.style.justifyContent = 'center';
            check.style.height = '100%';
            check.style.textShadow = '0 0 3px #000';
            swatch.appendChild(check);
        }

        colorGrid.appendChild(swatch);
    });

    group.appendChild(colorGrid);
    return group;
}

/**
 * ✅ HELPER: Renderiza seção de tamanhos (mantém lógica original)
 */
function renderSizesSection() {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = '<div class="category-header">Tamanhos e Quantidade</div>';

    const sizeGrid = document.createElement('div');
    sizeGrid.className = 'size-grid';
    sizeGrid.style.display = 'grid';
    sizeGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    sizeGrid.style.gap = '10px';
    sizeGrid.style.padding = '10px';

    (CONFIG.sizes || []).forEach(s => {
        const sizeBox = document.createElement('div');
        sizeBox.className = 'size-box';
        sizeBox.style.background = '#1a1a1a';
        sizeBox.style.border = '1px solid #333';
        sizeBox.style.borderRadius = '8px';
        sizeBox.style.padding = '10px';
        sizeBox.style.textAlign = 'center';

        const label = document.createElement('div');
        label.style.color = '#fff';
        label.style.fontWeight = 'bold';
        label.style.marginBottom = '5px';
        label.textContent = s.label;

        // ✅ Mostra acréscimo de tamanho se aplicável (usa state.config)
        if (s.priceMod && s.priceMod > 0) {
            const modLabel = document.createElement('div');
            modLabel.style.fontSize = '0.7rem';
            modLabel.style.color = '#00b4d8';
            modLabel.textContent = `+R$ ${s.priceMod.toFixed(2)}`;
            label.appendChild(modLabel);
        }

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = state.sizes[s.label] || 0;
        input.style.width = '100%';
        input.style.background = '#111';
        input.style.border = '1px solid #444';
        input.style.color = '#fff';
        input.style.padding = '5px';
        input.style.borderRadius = '4px';
        input.style.textAlign = 'center';

        input.oninput = (e) => {
            state.sizes[s.label] = parseInt(e.target.value) || 0;
            updatePrice(); // ✅ Atualiza preço com state.config
            saveState();
        };

        sizeBox.appendChild(label);
        sizeBox.appendChild(input);
        sizeGrid.appendChild(sizeBox);
    });

    group.appendChild(sizeGrid);
    return group;
}

/**
 * ✅ HELPER: Renderiza controles de personalização (logos/textos)
 * MANTÉM INTEGRAÇÃO COMPLETA COM getZonePrice() e state.config
 */
function renderCustomizationSection() {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = '<div class="category-header">Personalização</div>';

    Object.values(CONFIG.zones).forEach(z => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-control';
        zoneDiv.style.marginBottom = '15px';
        zoneDiv.style.padding = '10px';
        zoneDiv.style.background = '#1a1a1a';
        zoneDiv.style.borderRadius = '8px';

        // ✅ CALCULA PREÇO DINÂMICO DA ZONA
        const zonePrice = getZonePrice(z.id, 'image');

        const zoneElements = state.elements[z.id] || [];
        const hasCustomImage = zoneElements.some(el => el.dataset.isCustom === 'true');
        const devFee = state.config.devFee || CONFIG.devFee || 0;

        // Título com preço
        let titleText = z.name;
        if (zonePrice > 0) {
            titleText += ` <span style="color:#00b4d8; font-weight:bold; font-size:0.85rem;">(+R$ ${zonePrice.toFixed(2)})</span>`;
        }

        if (hasCustomImage && devFee > 0) {
            titleText += ` <span style="color:var(--accent); margin-left:10px;">[Taxa Arte: R$ ${devFee.toFixed(2)}]</span>`;
        }

        const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_general') : '';
        zoneDiv.innerHTML = `<div class="zone-title">${titleText} ${infoIcon}</div>`;

        // Info sobre taxa
        if (hasCustomImage) {
            const feeInfo = document.createElement('div');
            feeInfo.style.fontSize = '0.75rem';
            feeInfo.style.color = '#aaa';
            feeInfo.style.marginBottom = '5px';
            feeInfo.innerHTML = `Taxa de desenvolvimento da arte de bordado: <span style="color:var(--accent);">+R$ ${devFee.toFixed(2).replace('.', ',')}</span> (Cobrado somente ao enviar nova imagem)`;
            zoneDiv.appendChild(feeInfo);
        }

        // Botões
        const buttonBox = document.createElement('div');
        buttonBox.className = 'zone-buttons';
        buttonBox.style.display = 'grid';
        buttonBox.style.gridTemplateColumns = '1fr 1fr';
        buttonBox.style.gap = '8px';

        const hasImage = state.elements[z.id] && state.elements[z.id].length > 0;
        const relatedText = CONFIG.textZones.find(t => t.parentZone === z.id);

        // Checkbox de limites (se tem imagem ou texto)
        if (hasImage || (relatedText && state.texts[relatedText.id] && state.texts[relatedText.id].enabled)) {
            const limitWrapper = document.createElement('div');
            limitWrapper.style.gridColumn = '1/-1';

            const limitInput = document.createElement('input');
            limitInput.type = 'checkbox';
            limitInput.id = `l-${z.id}`;
            limitInput.checked = state.zoneLimits[z.id] !== false;
            limitInput.onchange = (e) => {
                state.zoneLimits[z.id] = e.target.checked;
                updateLimits();
                saveState();
            };

            const limitLabel = document.createElement('label');
            limitLabel.htmlFor = `l-${z.id}`;
            limitLabel.innerText = ' Limites';

            limitWrapper.appendChild(limitInput);
            limitWrapper.appendChild(limitLabel);
            buttonBox.appendChild(limitWrapper);
        }

        if (!hasImage) {
            // Botão Upload
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'zone-btn';
            uploadBtn.innerHTML = `<span class="btn-icon">${cameraIcon}</span> <span class="btn-label" style="color:#fff;">ENVIAR ARQUIVO</span>`;
            uploadBtn.onclick = () => addImage(z.id);

            // Botão Galeria
            const galleryBtn = document.createElement('button');
            galleryBtn.className = 'zone-btn';
            galleryBtn.innerHTML = `<span class="btn-icon">${galleryIcon}</span> <span class="btn-label" style="color:#fff;">BANCO IMAGENS</span>`;
            galleryBtn.onclick = () => openGallery(z.id);

            buttonBox.appendChild(uploadBtn);
            buttonBox.appendChild(galleryBtn);
        } else {
            // Botão Remover
            const removeBtn = document.createElement('button');
            removeBtn.className = 'zone-btn zone-btn-danger';
            removeBtn.style.gridColumn = '1 / -1';
            removeBtn.innerHTML = `<span class="btn-icon">${removeIcon}</span> <span class="btn-label">REMOVER IMAGEM</span>`;
            removeBtn.onclick = () => removeZoneElements(z.id);
            buttonBox.appendChild(removeBtn);

            // Slider de tamanho
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'range-slider';
            slider.style.gridColumn = '1/-1';
            slider.min = 0.5;
            slider.max = 100;
            slider.value = parseFloat(state.elements[z.id][0].style.width) || z.width;
            slider.oninput = (e) => {
                state.elements[z.id][0].style.width = e.target.value + '%';
                saveState();
            };
            buttonBox.appendChild(slider);
        }

        zoneDiv.appendChild(buttonBox);

        // Input file (hidden)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = `upload-${z.id}`;
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => handleImageUpload(e, z.id);
        zoneDiv.appendChild(fileInput);

        // Controles de texto (se existir zona de texto relacionada)
        if (relatedText) {
            zoneDiv.appendChild(renderTextControl(relatedText));
        }

        group.appendChild(zoneDiv);
    });

    return group;
}

/**
 * ✅ FUNÇÃO PRINCIPAL: renderControls()
 * Mantém estrutura original mas usa helpers refatorados
 */
function renderControls() {
    const cont = document.getElementById('controls-container');
    if (!cont) return;
    cont.innerHTML = '';

    // === HEADER: IDs ===
    if (!state.simulationId && typeof generateNextSequenceNumber === 'function') {
        state.simulationId = `HNT-TP-${generateNextSequenceNumber()}`;
    }
    if ((!state.orderNumber || state.orderNumber === state.simulationId) && typeof generateNextOrderNumber === 'function') {
        state.orderNumber = generateNextOrderNumber();
    }

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'center';
    headerRow.style.marginBottom = '20px';
    headerRow.style.paddingBottom = '10px';
    headerRow.style.borderBottom = '1px solid #333';

    const simIdDiv = document.createElement('div');
    simIdDiv.innerHTML = `<span style="color:#888; font-size:0.75rem;">ID: ${state.simulationId}</span>`;

    const orderDiv = document.createElement('div');
    orderDiv.style.display = 'flex';
    orderDiv.style.alignItems = 'center';
    orderDiv.style.gap = '5px';
    orderDiv.innerHTML = `
        <span style="color:#aaa; font-size:0.8rem;">PEDIDO:</span>
        <input type="text" id="order-input-top" 
               value="${state.orderNumber || ''}" 
               placeholder="Digitar..."
               style="background:#111; border:1px solid #444; color:#fff; font-family:'Bebas Neue', sans-serif; font-size:0.9rem; padding:4px 8px; width:100px; text-align:center; border-radius:4px; outline:none;">
    `;

    headerRow.appendChild(orderDiv);
    headerRow.appendChild(simIdDiv);
    cont.appendChild(headerRow);

    // Listener para input de pedido
    setTimeout(() => {
        const orderInput = document.getElementById('order-input-top');
        if (orderInput) {
            orderInput.oninput = (e) => {
                state.orderNumber = e.target.value.trim() || generateNextOrderNumber();
                saveState();
            };
        }
    }, 100);

    // === BOTÕES DE AÇÃO ===
    const actionBtns = document.createElement('div');
    actionBtns.style.display = 'flex';
    actionBtns.style.gap = '10px';
    actionBtns.style.margin = '10px 0 20px 0';

    const btnCart = document.createElement('button');
    btnCart.innerText = 'ADICIONAR AO CARRINHO';
    btnCart.className = 'btn-primary btn-cart';
    btnCart.style.flex = '1';
    btnCart.onclick = async () => {
        if (!state.termsAccepted) {
            alert("⚠️ Você precisa aceitar os Termos e Condições para continuar.");
            const termsBox = document.getElementById('terms-checkbox');
            if (termsBox) termsBox.focus();
            return;
        }

        // Gerar novo ID de simulação
        let newSeq = '';
        if (typeof generateNextSequenceNumber === 'function') {
            newSeq = generateNextSequenceNumber();
        } else {
            let last = parseInt(localStorage.getItem('hnt_sequence_id') || '0');
            let next = last + 1;
            localStorage.setItem('hnt_sequence_id', next);
            newSeq = String(next).padStart(6, '0');
        }

        const orderPrefix = (state.orderNumber && state.orderNumber.trim() !== '' && state.orderNumber !== state.simulationId)
            ? state.orderNumber
            : 'HNT';

        state.simulationId = `${orderPrefix}-TP-${newSeq}`;

        // Gerar PDF em segundo plano
        let pdfUrl = null;
        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateAndSaveForCart) {
            try {
                console.log('📄 Gerando PDF para carrinho...');
                pdfUrl = await PDFGenerator.generateAndSaveForCart();
            } catch (err) {
                console.error('Erro ao gerar PDF:', err);
            }
        }

        if (pdfUrl) {
            state.pdfUrl = pdfUrl;
        }


        // 1. Mostrar Notificação de Carregamento imediata
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

        // Dá 100ms pro browser renderizar o modal e então chama saveOrderToHistory
        setTimeout(async () => {
            if (await saveOrderToHistory()) {
                if (typeof saveState === 'function') saveState();
                if (typeof updateCartCount === 'function') updateCartCount();
                
                loader.innerHTML = \`
                    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;border:2px solid #28a745;">
                        <div style="font-size:40px;">✅</div>
                        <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#28a745;">ADICIONADO AO CARRINHO</div>
                        <div style="font-size:0.9rem;color:#ccc;">Sendo redirecionado...</div>
                    </div>
                \`;
                
                setTimeout(() => {
                    window.location.href = 'IndexPedidoSimulador.html';
                }, 1500);
            } else {
                loader.remove(); // Remove loader se a validação/salvamento falhar
            }
        }, 100);

        }
    };

    const btnReset = document.createElement('button');
    btnReset.innerText = 'LIMPAR';
    btnReset.className = 'btn-secondary';
    btnReset.onclick = () => {
        if (confirm('Deseja realmente limpar todos os dados?')) {
            if (typeof resetSimulatorData === 'function') {
                resetSimulatorData();
            }
        }
    };

    actionBtns.appendChild(btnCart);
    actionBtns.appendChild(btnReset);
    cont.appendChild(actionBtns);

    // === SEÇÕES (REFATORADAS) ===
    cont.appendChild(renderColorSection());
    cont.appendChild(renderSizesSection());
    cont.appendChild(renderCustomizationSection());

    // === OBSERVAÇÕES ===
    const obsGroup = document.createElement('div');
    obsGroup.className = 'category-group';
    obsGroup.innerHTML = '<div class="category-header">Observações</div>';

    const obsTextarea = document.createElement('textarea');
    obsTextarea.id = 'observations';
    obsTextarea.placeholder = 'Adicione observações sobre o pedido...';
    obsTextarea.value = state.observations || '';
    obsTextarea.style.width = '100%';
    obsTextarea.style.minHeight = '80px';
    obsTextarea.style.background = '#111';
    obsTextarea.style.border = '1px solid #444';
    obsTextarea.style.color = '#fff';
    obsTextarea.style.padding = '10px';
    obsTextarea.style.borderRadius = '8px';
    obsTextarea.style.fontFamily = 'inherit';
    obsTextarea.style.resize = 'vertical';
    obsTextarea.oninput = (e) => {
        state.observations = e.target.value;
        saveState();
    };

    obsGroup.appendChild(obsTextarea);
    cont.appendChild(obsGroup);

    // === TERMOS E CONDIÇÕES ===
    const termsGroup = document.createElement('div');
    termsGroup.className = 'category-group';
    termsGroup.style.marginTop = '20px';

    const termsCheckbox = document.createElement('input');
    termsCheckbox.type = 'checkbox';
    termsCheckbox.id = 'terms-checkbox';
    termsCheckbox.checked = state.termsAccepted || false;
    termsCheckbox.onchange = (e) => {
        state.termsAccepted = e.target.checked;
        saveState();
    };

    const termsLabel = document.createElement('label');
    termsLabel.htmlFor = 'terms-checkbox';
    termsLabel.style.color = '#aaa';
    termsLabel.style.fontSize = '0.85rem';
    termsLabel.innerHTML = ' Li e aceito os <a href="termos.html" target="_blank" style="color:#00b4d8;">Termos e Condições</a>';

    termsGroup.appendChild(termsCheckbox);
    termsGroup.appendChild(termsLabel);
    cont.appendChild(termsGroup);
}

// ✅ MANTÉM TODAS AS OUTRAS FUNÇÕES ORIGINAIS
// (renderTextControl, addImage, openGallery, handleImageUpload, etc.)
// Essas funções não foram alteradas e continuam funcionando normalmente

/**
 * Módulo de UI - Shorts (REFATORADO - SPLIT VERSION)
 * 
 * Estrutura:
 * - ui-components.js: Helpers genéricos de UI (Grid de Cores, Toasts)
 * - ui-features.js: Lógica específica (Limites, Ícones Extras)
 * - ui-emb.js: Gestão de Arquivos de Bordado
 * - ui-gallery.js: Gestão de Galeria de Imagens
 * - ui-sections.js: Renderização de controles específicos (Sizes, Uploads, Textos)
 * 
 * Este arquivo atua como o ORQUESTRADOR principal.
 */

// Seções de Categorias (Lógica Principal de Iteração)
function renderCategoriesSection() {
    const sections = [];

    DATA.categories.forEach(cat => {
        const d = document.createElement('div');
        d.className = 'category-group';

        // Ícone de ajuda
        let categoryIcon = '';
        if (typeof InfoSystem !== 'undefined') {
            if (cat.id === 'Laterais') categoryIcon = InfoSystem.getIconHTML('info_laterais');
            else if (cat.id === 'Pernas') categoryIcon = InfoSystem.getIconHTML('info_pernas');
            else if (cat.id === 'Acabamento') categoryIcon = InfoSystem.getIconHTML('info_extras');
            else if (cat.id === 'Centro') categoryIcon = InfoSystem.getIconHTML('info_centro');
        }

        d.innerHTML = `<div class="category-header">${cat.name} ${categoryIcon}</div>`;

        // Cores das Partes (sem logos HNT)
        const parts = DATA.parts.filter(p => p.category === cat.id && !p.id.includes('hnt'));
        if (parts.length > 0) {
            parts.forEach(p => {
                const r = document.createElement('div');
                r.className = 'control-item';
                const currentColorId = state.parts[p.id];
                const currentColorObj = DATA.colors.find(c => c.id === currentColorId);
                const colorName = currentColorObj ? `: ${currentColorObj.name.toUpperCase()}` : '';
                r.innerHTML = `<span class="control-label">${p.name.toUpperCase()}${colorName}</span>`;

                // Color Logic (Inline)
                let available = (typeof state !== 'undefined' && state.availableColors) ? state.availableColors : (typeof DATA !== 'undefined' ? DATA.colors : []);
                if (p.restrictedColors && Array.isArray(p.restrictedColors)) {
                    available = available.filter(c => p.restrictedColors.includes(c.id));
                }

                r.appendChild(window.UIComponents.createColorPicker(available, state.parts[p.id], (cId) => {
                    state.parts[p.id] = cId;
                    if (typeof refreshActiveLimits === 'function') refreshActiveLimits();
                    scheduleRender(true);
                }));
                d.appendChild(r);
            });
        }

        // Extras
        DATA.extras.filter(e => e.category === cat.id).forEach(e => {
            const r = document.createElement('div');
            r.className = 'control-item';
            // Chama helper de ui-sections.js
            r.appendChild(renderExtraControl(e));
            d.appendChild(r);
        });

        // Uploads e Textos
        DATA.uploadZones.filter(u => u.category === cat.id).forEach(u => {
            if (u.id.endsWith('_ii')) return;

            // Custom labels
            if (u.id === 'leg_right_mid_ie') u.name = "Perna Dir. Centro";
            if (u.id === 'leg_right_bottom_ie') u.name = "Perna Dir. Inferior";

            // Safety check
            if (!state.uploads[u.id]) {
                state.uploads[u.id] = { src: null, scale: 1, rotation: u.defaultRotation || 0, x: u.cssLeft, y: u.cssTop, filename: "", isCustom: false, unlocked: false };
            }

            const r = document.createElement('div');
            r.className = 'control-item';

            if (u.requiresUnlock) {
                const flex = document.createElement('div');
                flex.style.display = 'flex';
                flex.style.alignItems = 'center';
                flex.style.justifyContent = 'space-between';

                const labelDiv = document.createElement('div');
                const up = state.uploads[u.id];
                const isCustom = up && up.src && up.isCustom;
                let devFeeText = '';

                if (isCustom) {
                    const isCovered = (typeof EmbManager !== 'undefined') ? EmbManager.isZoneCovered(u.id, state.embFiles) : false;
                    if (!isCovered) {
                        const fee = (state.config && state.config.devFee) || 0;
                        if (fee > 0) {
                            devFeeText = ` <span style="color:var(--accent); margin-left:5px;">R$ ${fee.toFixed(2).replace('.', ',')}</span>`;
                        }
                    }
                }

                // ✅ Usa state.config.zonePrices
                const zonePrice = (state.config && state.config.zonePrices && state.config.zonePrices[u.id]) ? state.config.zonePrices[u.id] : 0;

                const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_shorts') : '';
                labelDiv.innerHTML = `<span style="font-weight:600;">${u.name}${devFeeText}</span> <span style="color:#00b4d8; font-weight:bold; font-size:0.85rem;">(+R$ ${zonePrice.toFixed(2)})</span> ${infoIcon}`;

                const labelSwitch = document.createElement('label');
                labelSwitch.className = 'switch';
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.checked = !!state.uploads[u.id].unlocked;
                chk.onchange = (e) => {
                    const isChecked = e.target.checked;
                    state.uploads[u.id].unlocked = isChecked;
                    if (!isChecked) {
                        state.uploads[u.id].src = null;
                        state.limits[u.id] = false;
                        const textId = 'text_' + u.id;
                        if (state.texts[textId]) { state.texts[textId].enabled = false; }
                    }
                    scheduleRender(true);
                };
                const slider = document.createElement('span');
                slider.className = 'slider round';
                labelSwitch.appendChild(chk);
                labelSwitch.appendChild(slider);
                flex.appendChild(labelDiv);
                flex.appendChild(labelSwitch);
                r.appendChild(flex);

                if (state.uploads[u.id].unlocked) {
                    const inner = document.createElement('div');
                    inner.style.marginLeft = '15px';
                    inner.style.marginTop = '10px';
                    inner.style.borderLeft = '2px solid #ddd';
                    inner.style.paddingLeft = '10px';
                    inner.appendChild(renderUploadControl(u));

                    let textZoneId = ("text_" + u.id);
                    if (u.id.startsWith('leg_')) {
                        textZoneId = 'text_' + u.id.replace('_ie', '').replace('_ii', '');
                    }

                    const linkedText = window.dataCache.textZonesById?.get(textZoneId);
                    if (linkedText) {
                        const txtContainer = document.createElement('div');
                        txtContainer.style.marginTop = '15px';
                        txtContainer.appendChild(renderTextControl(linkedText));
                        inner.appendChild(txtContainer);
                    }
                    r.appendChild(inner);
                }
            } else {
                const up = state.uploads[u.id];
                const isCustom = up && up.src && up.isCustom;
                let feeText = '';

                // ✅ Usa getZonePrice
                const baseZonePrice = getZonePrice(u);
                const basePriceText = baseZonePrice > 0 ? ` <span style="color:#00b4d8; font-weight:bold; font-size:0.85rem;">(+R$ ${baseZonePrice.toFixed(2)})</span>` : '';

                if (isCustom) {
                    const isCovered = (typeof EmbManager !== 'undefined') ? EmbManager.isZoneCovered(u.id, state.embFiles) : false;
                    if (!isCovered) {
                        const fee = (state.config && state.config.devFee) || 0;
                        if (fee > 0) {
                            feeText = ` <span style="color:var(--accent); font-size:0.8rem;">[Taxa Arte: R$ ${fee.toFixed(2)}]</span>`;
                        }
                    }
                }

                const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_shorts') : '';
                r.innerHTML = `<span class="control-label">${u.name}${basePriceText}${feeText} ${infoIcon}</span>`;
                r.appendChild(renderUploadControl(u));

                let potentialTextId = u.id.replace('logo_', 'text_');
                if (u.id.startsWith('leg_')) {
                    potentialTextId = 'text_' + u.id.replace('_ie', '').replace('_ii', '');
                }

                const linkedText = window.dataCache.textZonesById?.get(potentialTextId);
                if (linkedText) {
                    const txtContainer = document.createElement('div');
                    txtContainer.style.marginTop = '10px';
                    txtContainer.appendChild(renderTextControl(linkedText));
                    r.appendChild(txtContainer);
                }
            }
            d.appendChild(r);
        });

        sections.push(d);
    });

    return sections;
}

/**
 * ✅ FUNÇÃO PRINCIPAL: renderControls()
 * Versão modular usando helpers
 */
function renderControls() {
    const container = document.getElementById('controls-container');
    if (!container) return;

    const savedScroll = container.scrollTop;
    const focusedElement = document.activeElement;
    const focusedId = focusedElement?.id || null;

    container.innerHTML = '';

    // === HEADER: IDs ===
    if (!state.simulationId && typeof generateNextSequenceNumber === 'function') {
        state.simulationId = `HNT-SH-${generateNextSequenceNumber()}`;
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

    const orderDiv = document.createElement('div');
    orderDiv.style.display = 'flex';
    orderDiv.style.alignItems = 'center';
    orderDiv.style.gap = '5px';
    orderDiv.innerHTML = `
        <span style="color:#aaa; font-size:0.8rem;">PEDIDO:</span>
        <input type="text" id="order-input-top" 
               value="${state.orderNumber || ''}" 
               placeholder="000000" readonly
               style="background:#0a0a0a; border:1px solid #444; color:#fff; font-family:'Bebas Neue', sans-serif; font-size:1rem; letter-spacing:1px; padding:4px 8px; width:140px; text-align:center; border-radius:4px; outline:none; cursor:default;">
    `;

    const simIdDiv = document.createElement('div');
    simIdDiv.innerHTML = `<span style="color:#888; font-size:0.75rem;">ID: ${state.simulationId}</span>`;

    headerRow.appendChild(orderDiv);
    headerRow.appendChild(simIdDiv);
    container.appendChild(headerRow);

    // === BOTÕES DE AÇÃO ===
    const actionBtns = document.createElement('div');
    actionBtns.style.display = 'flex';
    actionBtns.style.gap = '10px';
    actionBtns.style.marginBottom = '15px';

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

        const textErrors = [];
        Object.keys(state.texts).forEach(key => {
            const t = state.texts[key];
            if (t.enabled && (!t.content || t.content.trim() === '')) {
                const zoneName = (dataCache.textZonesById?.get(key))?.name || 'Texto';
                textErrors.push(zoneName);
            }
        });

        if (textErrors.length > 0) {
            alert(`⚠️ Atenção!\\n\\nVocê ativou a personalização de texto para: ${textErrors.join(', ')} mas não digitou o texto.`);
            return;
        }

        const newSeq = (typeof generateNextSequenceNumber === 'function')
            ? generateNextSequenceNumber()
            : String(parseInt(localStorage.getItem('hnt_sequence_id') || '0') + 1).padStart(6, '0');

        const orderPrefix = (state.orderNumber && state.orderNumber.trim() !== '' && state.orderNumber !== state.simulationId)
            ? state.orderNumber
            : 'HNT';

        state.simulationId = `${orderPrefix}-SH-${newSeq}`;

        // 1. Mostrar Notificação de Carregamento imediata
        const loader = document.createElement('div');
        loader.innerHTML = `
            <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;box-shadow:0 15px 40px rgba(0,0,0,0.6);border:2px solid #D4AF37;">
                <div class="spinner-hnt" style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #D4AF37;border-radius:50%;animation:spin-hnt 1s linear infinite;"></div>
                <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:#D4AF37;">PROCESSANDO PEDIDO</div>
                <div style="font-size:0.9rem;color:#ccc;text-align:center;">Gerando Ficha Técnica e PDF...<br><span style="font-size:0.75rem;color:#888;">Por favor, aguarde.</span></div>
            </div>
            <style>@keyframes spin-hnt { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loader);

        // Dá 100ms pro browser renderizar o modal e então chama saveOrderToHistory
        setTimeout(async () => {
            if (await saveOrderToHistory()) {
                saveState();
                if (typeof updateCartCount === 'function') updateCartCount();

                loader.innerHTML = `
                    <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px 50px;border-radius:15px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:20px;border:2px solid #28a745;">
                        <div style="font-size:40px;">✅</div>
                        <div style="font-weight:700;font-size:1.3rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:#28a745;">ADICIONADO AO CARRINHO</div>
                        <div style="font-size:0.9rem;color:#ccc;">Sendo redirecionado...</div>
                    </div>
                `;

                setTimeout(() => {
                    window.location.href = '../IndexPedidoSimulador.html';
                }, 1500);
            } else {
                loader.remove(); // Remove loader se a validação/salvamento falhar
            }
        }, 100);
    };

    const btnClear = document.createElement('button');
    btnClear.innerText = 'LIMPAR DADOS';
    btnClear.className = 'btn-secondary btn-clear';
    btnClear.style.flex = '1';
    btnClear.onclick = () => clearState();

    actionBtns.appendChild(btnCart);
    actionBtns.appendChild(btnClear);
    container.appendChild(actionBtns);

    // === SEÇÕES MODULARES ===
    container.appendChild(renderSizesSection());

    const categorySections = renderCategoriesSection();
    categorySections.forEach(section => container.appendChild(section));

    container.appendChild(renderHNTLogosSection());
    container.appendChild(renderFinalForm());

    // === RESTAURAR ESTADO ===
    requestAnimationFrame(() => {
        if (savedScroll > 0) container.scrollTop = savedScroll;
        if (focusedId) document.getElementById(focusedId)?.focus();

        const phoneInput = document.getElementById('phone-input');
        const obsInput = document.getElementById('obs-input');
        const orderInputTop = document.getElementById('order-input-top');
        const termsCheckbox = document.getElementById('terms-checkbox');

        if (phoneInput && obsInput && orderInputTop && termsCheckbox) {
            phoneInput.value = state.phone || '';
            obsInput.value = state.observations || '';
            termsCheckbox.checked = !!state.termsAccepted;

            termsCheckbox.onclick = (e) => {
                state.termsAccepted = e.target.checked;
                saveState();
            };

            orderInputTop.readOnly = true;
            orderInputTop.style.background = '#0a0a0a';
            orderInputTop.style.cursor = 'default';
            orderInputTop.onchange = null;

            phoneInput.oninput = (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
                state.phone = e.target.value;
                saveState();
            };

            obsInput.oninput = (e) => {
                state.observations = e.target.value;
                saveState();
            };
        }

        // EMB Upload Logic
        const embUploadBtn = document.getElementById('emb-upload-btn');
        const embFileInput = document.getElementById('emb-file-input');

        if (embUploadBtn && embFileInput) {
            embUploadBtn.onclick = () => embFileInput.click();
            embFileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (!file.name.toLowerCase().endsWith('.emb')) {
                    alert('❌ Apenas arquivos .EMB são permitidos!');
                    e.target.value = '';
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    alert('❌ O arquivo excede o tamanho máximo de 2MB!');
                    e.target.value = '';
                    return;
                }
                showEmbZoneSelection(file);
                e.target.value = '';
            };
        }

        if (typeof renderEmbFilesList === 'function') renderEmbFilesList();
    });
}

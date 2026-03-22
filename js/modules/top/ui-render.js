/**
 * Módulo de UI - Top (REFATORADO v2)
 * ✅ USA UI COMPONENTS PADRONIZADOS
 */

function renderSizesSection() {
    const section = document.createElement('div');
    section.className = 'category-group';
    const infoS = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_top_geral') : '';
    section.innerHTML = `<div class="category-header">Tamanhos ${infoS}</div>`;

    const sizeComponent = window.UIComponents.createSizeSelector(
        CONFIG.sizes,
        state.sizes,
        (label, newVal) => {
            state.sizes[label] = newVal;
            updatePrice();
            saveState();
        }
    );
    section.appendChild(sizeComponent);
    return section;
}

function renderColorSection() {
    const section = document.createElement('div');
    section.className = 'category-group';
    const cObj = CONFIG.colors.find(c => c.id === state.color);
    section.innerHTML = `<div class="category-header">COR DO TOP: ${cObj ? cObj.name.toUpperCase() : ''}</div>`;

    const colorComponent = window.UIComponents.createColorPicker(
        state.availableColors,
        state.color,
        (newId) => setColor(newId)
    );
    section.appendChild(colorComponent);
    return section;
}

function renderHNTLogoSection() {
    const section = document.createElement('div');
    section.className = 'category-group';
    section.innerHTML = '<div class="category-header">LOGO HNT</div>';

    const hntComponent = window.UIComponents.createColorPicker(
        HNT_LOGO_COLORS,
        state.hntLogoColor,
        (newId) => {
            state.hntLogoColor = newId;
            updateHntLayer();
            renderControls();
            saveState();
        },
        {
            onRenderOption: (element, color) => {
                const baseColorHex = CONFIG.colors.find(bc => bc.id === state.color)?.hex;
                if (baseColorHex === color.hex) {
                    element.style.opacity = '0.2';
                    element.style.cursor = 'not-allowed';
                    element.onclick = (e) => e.stopPropagation();
                    const baseColorName = CONFIG.colors.find(bc => bc.id === state.color)?.name || state.color;
                    element.title = `Indisponível (contraste com ${baseColorName})`;
                    element.classList.remove('selected');
                }
            }
        }
    );
    section.appendChild(hntComponent);
    return section;
}

function renderCustomizationSection() {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = '<div class="category-header">Personalização</div>';

    Object.values(CONFIG.zones).forEach(z => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-control';

        const zonePrice = getZonePrice(z.id, 'logo');
        const zoneElements = state.elements[z.id] || [];
        const hasCustomImage = zoneElements.some(el => el.dataset.isCustom === 'true');
        const devFee = state.config.devFee || CONFIG.devFee || 0;

        let titleText = z.name;
        if (zonePrice > 0) titleText += ` <span style="color:#00b4d8; font-weight:bold; font-size:0.85rem;">(+R$ ${zonePrice.toFixed(2)})</span>`;
        if (hasCustomImage && devFee > 0) titleText += ` <span style="color:var(--accent); margin-left:10px;">[Taxa Arte: R$ ${devFee.toFixed(2)}]</span>`;
        const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_general') : '';
        zoneDiv.innerHTML = `<div class="zone-title">${titleText} ${infoIcon}</div>`;

        const hasImage = state.elements[z.id] && state.elements[z.id].length > 0;
        const currentImgElement = hasImage ? state.elements[z.id][0] : null;

        let uploadState = {
            src: currentImgElement ? currentImgElement.src : null,
            filename: currentImgElement ? (currentImgElement.dataset.filename || 'Imagem Enviada') : null,
            isCustom: currentImgElement ? (currentImgElement.dataset.isCustom === 'true') : false,
            hasEmbPromise: currentImgElement ? (currentImgElement.dataset.embPromise === 'true') : false,
            scale: currentImgElement ? (parseFloat(currentImgElement.style.width) || z.width) / z.width : 1.0
        };

        const uploader = window.UIComponents.createImageUploader({
            zone: z,
            uploadState: uploadState,
            limitEnabled: state.zoneLimits[z.id] !== false,
            config: state.config,
            isCoveredByEmb: false,
            callbacks: {
                onUpload: (zoneId, file) => handleImageUpload({ target: { files: [file] } }, zoneId),
                onRemove: (zoneId) => removeZoneElements(zoneId),
                onToggleLimit: (zoneId, isChecked) => { state.zoneLimits[zoneId] = isChecked; updateLimits(); saveState(); },
                onEmbPromise: (zoneId, isChecked) => {
                    if (state.elements[zoneId] && state.elements[zoneId][0]) {
                        state.elements[zoneId][0].dataset.embPromise = isChecked;
                        updatePrice(); saveState(); renderControls();
                    }
                },
                onScale: (zoneId, val) => {
                    if (state.elements[zoneId] && state.elements[zoneId][0]) {
                        state.elements[zoneId][0].style.width = (z.width * val) + '%';
                        saveState();
                    }
                },
                openGallery: (zoneId) => openGallery(zoneId)
            }
        });
        zoneDiv.appendChild(uploader);

        const relatedTextZone = CONFIG.textZones.find(t => t.parentZone === z.id);
        if (relatedTextZone) {
            if (!state.texts[relatedTextZone.id]) {
                state.texts[relatedTextZone.id] = { enabled: false, content: '', fontFamily: 'Outfit', color: '#000000', scale: 1.0, maxLines: 1 };
            }
            const tState = state.texts[relatedTextZone.id];
            let avalFonts = CONFIG.fonts || [];
            if (typeof SHARED_FONTS !== 'undefined') { SHARED_FONTS.forEach(f => { if (!avalFonts.find(existing => existing.id === f.id)) avalFonts.push(f); }); }
            avalFonts.sort((a, b) => a.name.localeCompare(b.name));

            const textComponent = window.UIComponents.createTextEditor({
                zone: relatedTextZone,
                textState: tState,
                config: state.config,
                fonts: avalFonts,
                colors: (state.config.textColors && state.config.textColors.length > 0) ? CONFIG.colors.filter(c => state.config.textColors.includes(c.id)) : CONFIG.colors,
                callbacks: {
                    onToggle: (zoneId, enabled) => { tState.enabled = enabled; if (enabled) state.zoneLimits[z.id] = true; else if (checkZoneEmpty(z.id)) state.zoneLimits[z.id] = false; updateLimits(); updatePrice(); renderControls(); saveState(); },
                    onTextChange: (zoneId, content) => { tState.content = content; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onLinesChange: (zoneId, maxLines) => { tState.maxLines = maxLines; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onFontChange: (zoneId, fontFamily) => { tState.fontFamily = fontFamily; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onColorChange: (zoneId, color) => { tState.color = color; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onScaleChange: (zoneId, scale) => { tState.scale = scale; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); }
                }
            });
            zoneDiv.appendChild(textComponent);
        }
        group.appendChild(zoneDiv);
    });
    return group;
}

function renderControls() {
    const container = document.getElementById('controls-container'); if (!container) return;
    const scrollPos = container.scrollTop; container.innerHTML = '';

    if (!state.simulationId && typeof generateNextSequenceNumber === 'function') state.simulationId = `HNT-TP-${generateNextSequenceNumber()}`;
    if ((!state.orderNumber || state.orderNumber === state.simulationId) && typeof generateNextOrderNumber === 'function') state.orderNumber = generateNextOrderNumber();

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex'; headerRow.style.justifyContent = 'space-between'; headerRow.style.alignItems = 'center'; headerRow.style.marginBottom = '20px'; headerRow.style.paddingBottom = '10px'; headerRow.style.borderBottom = '1px solid #333';
    headerRow.innerHTML = `<div style="display:flex; align-items:center; gap:5px;"><span style="color:#aaa; font-size:0.8rem;">PEDIDO:</span><input type="text" id="order-input-top" value="${state.orderNumber || ''}" placeholder="000000" readonly style="background:#0a0a0a; border:1px solid #444; color:#fff; font-family:'Bebas Neue', sans-serif; font-size:0.9rem; padding:4px 8px; width:100px; text-align:center; border-radius:4px; outline:none; cursor:default;"></div><div style="color:#888; font-size:0.75rem;">ID: ${state.simulationId}</div>`;
    container.appendChild(headerRow);

    const actionBtns = document.createElement('div'); actionBtns.style.display = 'flex'; actionBtns.style.gap = '10px'; actionBtns.style.margin = '10px 0 20px 0';
    const isEditing = state._editingIndex !== undefined && state._editingIndex !== null;
    const btnCart = document.createElement('button');
    btnCart.className = isEditing ? 'btn-modern btn-cart' : 'btn-primary btn-cart';
    btnCart.innerText = isEditing ? 'SALVAR EDIÇÃO' : 'ADICIONAR AO CARRINHO';
    btnCart.style.flex = '1';

    if (isEditing) {
        btnCart.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btnCart.style.border = 'none';
    }

    btnCart.onclick = async () => {
        if (!state.termsAccepted) { alert("⚠️ Você precisa aceitar os Termos e Condições para continuar."); const termsBox = document.getElementById('terms-checkbox'); if (termsBox) termsBox.focus(); return; }

        // Bloquear regeneração de ID se estiver editando!
        if (!isEditing) {
            const orderPrefix = (state.orderNumber && state.orderNumber.trim() !== '' && state.orderNumber !== state.simulationId) ? state.orderNumber : 'HNT';
            let newSeq = (typeof generateNextSequenceNumber === 'function') ? generateNextSequenceNumber() : String(Date.now()).slice(-6);
            state.simulationId = `${orderPrefix}-TP-${newSeq}`;
        } else if (state._editingOrderId) {
            state.simulationId = state._editingOrderId;
        }

        let pdfUrl = (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateAndSaveForCart) ? await PDFGenerator.generateAndSaveForCart(state.simulationId, true) : null;
        if (pdfUrl) state.pdfUrl = pdfUrl;

        if (typeof saveOrderToHistory === 'function' && (await saveOrderToHistory())) {
            if (confirm(isEditing ? '✅ Edição salva com sucesso! Retornando...' : '✅ Adicionado ao carrinho!')) {
                window.location.href = 'IndexPedidoSimulador.html';
            }
        }
    };
    const btnClear = document.createElement('button'); btnClear.className = 'btn-secondary btn-clear'; btnClear.innerText = 'LIMPAR DADOS'; btnClear.style.flex = '1'; btnClear.onclick = () => clearState();
    actionBtns.appendChild(btnCart); actionBtns.appendChild(btnClear); container.appendChild(actionBtns);

    container.appendChild(renderSizesSection());
    container.appendChild(renderColorSection());
    container.appendChild(renderHNTLogoSection());
    container.appendChild(renderCustomizationSection());
    container.appendChild(renderFinalForm());

    const phoneInput = container.querySelector('#phone-input');
    const obsInput = container.querySelector('#obs-input');
    const termsCheckbox = container.querySelector('#terms-checkbox');
    const orderInputTop = document.getElementById('order-input-top');

    if (phoneInput) { phoneInput.value = state.phone || ''; phoneInput.oninput = (e) => { let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/); e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''); state.phone = e.target.value; saveState(); }; }
    if (obsInput) { obsInput.value = state.observations || ''; obsInput.oninput = (e) => { state.observations = e.target.value; saveState(); }; }
    if (termsCheckbox) { termsCheckbox.checked = !!state.termsAccepted; termsCheckbox.onclick = (e) => { state.termsAccepted = e.target.checked; saveState(); }; }
    if (orderInputTop) { orderInputTop.onchange = (e) => { let val = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, ''); state.orderNumber = val; e.target.value = val; saveState(); renderControls(); }; }

    container.scrollTop = scrollPos;
}

function renderFinalForm() {
    const div = document.createElement('div');
    div.innerHTML = `
        <div style="margin-top:10px; border-top:1px solid #333; padding-top:10px;"><label style="font-weight:bold; display:block; color:#fff;">Observações:</label><textarea id="obs-input" style="width:100%; height:60px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; padding:5px;"></textarea></div>
        <div style="margin-top:10px; background:#fff3cd; padding:10px; border-left:4px solid #ffc107; border-radius:4px;"><label style="font-weight:bold; display:block; color:#856404;">Telefone <span style="color:red">*</span></label><input type="tel" id="phone-input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="(XX) XXXXX-XXXX"></div>
        <div style="margin-top:15px; background:#111; border:1px solid #333; padding:12px; border-radius:4px; color:#aaa; font-size:0.8rem;"><p><strong style="color:#D4AF37;">⚠️ AVISO:</strong> Simulação digital para fins de orçamento.</p><label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:#fff; font-weight:bold;"><input type="checkbox" id="terms-checkbox"><span>CONCORDO COM OS TERMOS</span></label></div>
    `;
    return div;
}

function openGallery(zoneId) {
    state.pending = zoneId;
    const modal = document.getElementById('gallery-modal');
    if (modal) { modal.style.display = 'flex'; renderGallery(); }
}
window.closeGallery = function () { const modal = document.getElementById('gallery-modal'); if (modal) modal.style.display = 'none'; }
function renderGallery(searchTerm = "") {
    const g = document.getElementById('gallery-grid'); if (!g) return; g.innerHTML = '';
    const galleryData = (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY : [];
    galleryData.forEach(i => {
        const d = document.createElement('div'); d.className = 'gallery-item';
        d.innerHTML = `<img src="${i.src}"><span>${i.name}</span>`;
        d.onclick = () => {
            if (typeof createImageElement === 'function') {
                createImageElement(state.pending, i.src, false);
                state.uploads = state.uploads || {};
                state.uploads[state.pending] = { src: i.src, filename: i.name || 'Imagem do Acervo', isCustom: false };
                saveState();
            }
            window.closeGallery();
        };
        g.appendChild(d);
    });
}

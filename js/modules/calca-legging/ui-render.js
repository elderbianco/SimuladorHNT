/**
 * Módulo de UI - Calça Legging (REFATORADO v2)
 * ✅ USA UI COMPONENTS PADRONIZADOS
 */

function renderSizesSection() {
    const section = document.createElement('div');
    section.className = 'category-group';
    const infoS = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_calca_legging_geral') : '';
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
    section.innerHTML = `<div class="category-header">COR DA LEGGIN: ${cObj ? cObj.name.toUpperCase() : ''}</div>`;

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
    section.innerHTML = '<div class="category-header">LOGO HNT (Cós)</div>';

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
        const currentEl = hasImage ? state.elements[z.id][0] : null;
        const currentImgTag = currentEl ? currentEl.querySelector('img') : null;

        let uploadState = {
            src: currentImgTag ? currentImgTag.src : null,
            filename: currentEl ? (currentEl.dataset.filename || 'Imagem Enviada') : null,
            isCustom: currentEl ? (currentEl.dataset.isCustom === 'true') : false,
            hasEmbPromise: currentEl ? (currentEl.dataset.embPromise === 'true') : false,
            scale: currentEl ? (parseFloat(currentEl.style.width) || z.width) / z.width : 1.0
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
                onToggleLimit: (zoneId, isChecked) => {
                    state.zoneLimits[zoneId] = isChecked;
                    updateLimits();
                    saveState();
                },
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
            if (typeof SHARED_FONTS !== 'undefined') {
                SHARED_FONTS.forEach(f => {
                    if (!avalFonts.find(existing => existing.id === f.id)) avalFonts.push(f);
                });
            }
            avalFonts.sort((a, b) => a.name.localeCompare(b.name));

            const textComponent = window.UIComponents.createTextEditor({
                zone: relatedTextZone,
                textState: tState,
                config: state.config,
                fonts: avalFonts,
                colors: (state.config.textColors && state.config.textColors.length > 0) ? DATA.colors.filter(c => state.config.textColors.includes(c.id)) : DATA.colors,
                callbacks: {
                    onToggle: (zoneId, enabled) => {
                        tState.enabled = enabled;
                        if (enabled) state.zoneLimits[z.id] = true; else if (checkZoneEmpty(z.id)) state.zoneLimits[z.id] = false;
                        updateLimits(); updatePrice(); renderControls(); saveState();
                    },
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
    const container = document.getElementById('controls-container');
    if (!container) return;
    const scrollPos = container.scrollTop;
    container.innerHTML = '';

    if (!state.simulationId && typeof generateNextSequenceNumber === 'function') {
        state.simulationId = `HNT-SL-${generateNextSequenceNumber()}`;
    }
    if ((!state.orderNumber || state.orderNumber === state.simulationId) && typeof generateNextOrderNumber === 'function') {
        state.orderNumber = generateNextOrderNumber();
    }

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex'; headerRow.style.justifyContent = 'space-between'; headerRow.style.alignItems = 'center'; headerRow.style.marginBottom = '20px'; headerRow.style.paddingBottom = '10px'; headerRow.style.borderBottom = '1px solid #333';
    headerRow.innerHTML = `<div style="display:flex; align-items:center; gap:5px;"><span style="color:#aaa; font-size:0.8rem;">PEDIDO:</span><input type="text" id="order-input-top" value="${state.orderNumber || ''}" placeholder="000000" readonly style="background:#0a0a0a; border:1px solid #444; color:#fff; font-family:'Bebas Neue', sans-serif; font-size:0.9rem; padding:4px 8px; width:100px; text-align:center; border-radius:4px; outline:none; cursor:default;"></div><div style="color:#888; font-size:0.75rem;">ID: ${state.simulationId}</div>`;
    container.appendChild(headerRow);

    // === EDIÇÃO MODE: update static btn-add-cart appearance ===
    const isEditing = state._editingIndex !== undefined && state._editingIndex !== null;
    const btnCartStatic = document.getElementById('btn-add-cart');
    if (btnCartStatic) {
        btnCartStatic.innerText = isEditing ? '💾 SALVAR EDIÇÃO' : '🛒 Adicionar ao Carrinho';
        if (isEditing) {
            btnCartStatic.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            btnCartStatic.style.border = 'none';
            btnCartStatic.style.color = '#fff';
        } else {
            btnCartStatic.style.background = '';
            btnCartStatic.style.border = '';
            btnCartStatic.style.color = '';
        }
    }

    // === DYNAMIC: inject Limpar Dados button into controls ===
    const btnClearDynamic = document.createElement('button');
    btnClearDynamic.innerText = '🗑️ LIMPAR DADOS';
    btnClearDynamic.className = 'btn-secondary btn-clear';
    btnClearDynamic.style.cssText = 'width:100%; margin: 8px 0 16px 0;';
    btnClearDynamic.onclick = () => clearState();
    container.appendChild(btnClearDynamic);


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
    if (termsCheckbox) {
        termsCheckbox.checked = !!(state.termsAccepted || (window.state && window.state.termsAccepted));
        termsCheckbox.onclick = (e) => {
            const val = e.target.checked;
            state.termsAccepted = val;
            if (window.state) window.state.termsAccepted = val;
            saveState();
        };
    }
    if (orderInputTop) { orderInputTop.onchange = (e) => { let val = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, ''); state.orderNumber = val; e.target.value = val; saveState(); renderControls(); }; }

    container.scrollTop = scrollPos;
}

function renderFinalForm() {
    const div = document.createElement('div');
    div.innerHTML = `
        <div style="margin-top:10px; border-top:1px solid #333; padding-top:10px;">
            <label style="font-weight:bold; display:block; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; height:60px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; padding:5px;">${state.observations || ''}</textarea>
        </div>
        <div style="margin-top:10px; background:#fff3cd; padding:10px; border-left:4px solid #ffc107; border-radius:4px;">
            <label style="font-weight:bold; display:block; color:#856404;">Telefone <span style="color:red">*</span> ${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_telefone', 'Necessário para contato sobre ajustes técnicos e análise de produção') : ''}</label>
            <input type="tel" id="phone-input" value="${state.phone || ''}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="(XX) XXXXX-XXXX">
        </div>
        <div style="margin-top:15px; background:#111; border:1px solid #333; padding:12px; border-radius:4px; color:#aaa; font-size:0.8rem;">
            <p style="margin:0 0 10px 0; line-height:1.4;">
                <strong style="color:#D4AF37;">⚠️ AVISO IMPORTANTE:</strong> Este documento é uma <strong>SIMULAÇÃO DIGITAL</strong> para fins de orçamento e visualização. O resultado final físico pode apresentar pequenas variações de cor, tamanho, proporções e ajuste, devido aos processos artesanais e à calibração de cada monitor. Todos os arquivos e artes passarão por análise técnica de viabilidade de bordado, e o valor final está sujeito a confirmação após essa avaliação.
            </p>
            <p style="margin:0 0 12px 0; line-height:1.4;">
                Ao prosseguir, você declara que leu e concorda com todas as informações e condições do produto disponíveis em nosso <a href="IndexFaq.html" target="_blank" style="color:#D4AF37; text-decoration:underline;">FAQ</a>, além de confirmar que possui os direitos autorais sobre as artes enviadas, assumindo total responsabilidade legal. Em caso de dúvidas, entre em contato com nossa equipe.
            </p>
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:#fff; font-weight:bold;">
                <input type="checkbox" id="terms-checkbox" ${state.termsAccepted ? 'checked' : ''} style="width:18px; height:18px; margin-top:2px;">
                <span>EU LI E CONCORDO COM OS TERMOS E CONDIÇÕES ACIMA <span style="color:red">*</span></span>
            </label>
        </div>
    `;
    return div;
}

// Global Helpers (Legacy support)
function openGallery(zoneId) {
    state.pendingUploadZone = zoneId;
    if (typeof currentGalleryCategory !== 'undefined') currentGalleryCategory = null;
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderGallery();
    }
}
window.closeGallery = function () { // Explicit global
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.style.display = 'none';
}

function renderGallery(searchTerm = "") {
    const g = document.getElementById('gallery-grid');
    if (!g) return;
    g.innerHTML = '';
    const galleryData = (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY : [];

    if (searchTerm && searchTerm.trim().length > 0) {
        const term = searchTerm.toLowerCase();
        const results = galleryData.filter(i => i.name.toLowerCase().includes(term));
        if (results.length === 0) {
            g.innerHTML = `<div style="text-align:center; padding:20px; color:#666; width:100%;">Nenhuma imagem encontrada.</div>`;
            return;
        }
        results.forEach(i => appendGalleryItem(g, i));
        return;
    }

    if (!window.currentGalleryCategory) {
        // Categories
        const categories = [...new Set(galleryData.map(i => i.category || 'Gerais'))];
        const categoryIcons = {
            "Logos Hanuthai": "assets/Shorts/UiIcons/thumb_logos_hanuthai.png",
            "Animais": "assets/Shorts/UiIcons/thumb_animais.png",
            "Bandeiras": "assets/Shorts/UiIcons/thumb_bandeiras.png",
            "Personagens": "assets/Shorts/UiIcons/thumb_personagens.png",
            "Gerais": "assets/Shorts/UiIcons/thumb_gerais.png"
        };
        categories.forEach(cat => {
            const d = document.createElement('div');
            d.className = 'gallery-folder';
            const iconSrc = categoryIcons[cat] || "assets/Shorts/UiIcons/thumb_gerais.png";
            d.innerHTML = `<img src="${iconSrc}" class="folder-image-icon"><div class="folder-label">${cat}</div>`;
            d.onclick = () => { window.currentGalleryCategory = cat; renderGallery(); };
            g.appendChild(d);
        });
    } else {
        // Back Btn
        const b = document.createElement('button');
        b.className = 'gallery-back-btn';
        b.innerText = '↩ Voltar';
        b.onclick = () => { window.currentGalleryCategory = null; renderGallery(); };
        g.appendChild(b);

        const items = galleryData.filter(i => (i.category || 'Gerais') === window.currentGalleryCategory);
        items.forEach(i => appendGalleryItem(g, i));
    }
}

function appendGalleryItem(container, i) {
    const d = document.createElement('div');
    d.className = 'gallery-item';
    d.innerHTML = `<img src="${i.src}"><span>${i.name}</span>`;
    d.onclick = () => {
        if (state.pendingUploadZone) {
            state.zoneLimits[state.pendingUploadZone] = true;
            if (typeof updateLimits === 'function') updateLimits();
            let fmt = i.name;
            if (typeof generateFormattedFilename === 'function') fmt = generateFormattedFilename(state.pendingUploadZone, i.name, 'ACERVO');
            if (typeof createImageElement === 'function') createImageElement(state.pendingUploadZone, i.src, false, fmt);

            state.uploads = state.uploads || {};
            state.uploads[state.pendingUploadZone] = { src: i.src, filename: i.name || 'Imagem do Acervo', isCustom: false };
            saveState();
        }
        window.closeGallery();
    };
    container.appendChild(d);
}

// Logic mock if needed
async function uploadFileToServer(file, base64, zoneId) {
    try {
        const formData = {
            image: base64,
            filename: (typeof generateFormattedFilename === 'function') ? generateFormattedFilename(zoneId, file.name, 'EXT') : file.name,
            folder: file.name.match(/\.(emb|dst|pes|exp)$/i) ? 'embroidery' : 'image'
        };
        const res = await fetch('/api/upload-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success) console.log('✅ Upload:', data.path);
    } catch (e) { console.error('❌ Upload:', e); }
}

function addImage(z) { document.getElementById(`upload-${z}`).click(); }
function handleImageUpload(e, z) {
    const f = e.target.files[0]; if (!f) return;
    let fmt = f.name;
    if (typeof generateFormattedFilename === 'function') fmt = generateFormattedFilename(z, f.name, 'EXT');
    const r = new FileReader();
    r.onload = (ev) => {
        const base64 = ev.target.result;
        uploadFileToServer(f, base64, z);
        createImageElement(z, base64, true, fmt);
    };
    r.readAsDataURL(f);
}
function createImageElement(z, s, isCustom, filename = '', formattedFilename = '') {
    const l = document.getElementById('customization-layer'); const zc = CONFIG.zones[z];

    // Remove existing element for this zone before adding a new one
    if (state.elements[z] && state.elements[z].length > 0) {
        state.elements[z].forEach(e => e.remove());
        state.elements[z] = [];
    }

    const el = document.createElement('div'); el.className = 'custom-element draggable';
    el.style.left = zc.x + '%'; el.style.top = zc.y + '%'; el.style.width = zc.width + '%';
    el.style.transform = 'translate(-50%, -50%)'; el.style.zIndex = 1500;
    el.dataset.type = 'image';
    el.dataset.isCustom = isCustom;
    el.dataset.filename = filename || 'custom_upload';
    if (formattedFilename) el.dataset.formattedFilename = formattedFilename;
    const img = document.createElement('img'); img.src = s; img.style.width = '100%';
    el.appendChild(img); l.appendChild(el);
    if (!state.elements[z]) state.elements[z] = []; state.elements[z].push(el);

    // Limits
    state.zoneLimits[z] = true;
    if (typeof updateLimits === 'function') updateLimits();

    updatePrice(); renderControls(); saveState();
}
function removeZoneElements(z) {
    if (state.elements[z]) { state.elements[z].forEach(e => e.remove()); state.elements[z] = []; }
    if (checkZoneEmpty(z)) state.zoneLimits[z] = false;
    if (typeof updateLimits === 'function') updateLimits();
    updatePrice(); renderControls(); saveState();
}
function checkZoneEmpty(z) {
    const hI = state.elements[z] && state.elements[z].length > 0;
    const rT = CONFIG.textZones.find(t => t.parentZone === z);
    const hT = rT && state.texts[rT.id].enabled;
    return !hI && !hT;
}

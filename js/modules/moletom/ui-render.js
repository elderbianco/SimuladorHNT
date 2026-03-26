/**
 * Módulo de UI - Moletom (REFATORADO v2)
 */

function renderSizesSection() {
    const section = document.createElement('div');
    section.className = 'category-group active';
    const infoS = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_moletom_geral') : '';
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
    section.className = 'category-group active';
    section.innerHTML = `<div class="category-header">COR DO MOLETOM</div>`;
    const colorComponent = window.UIComponents.createColorPicker(
        state.availableColors,
        state.color,
        (newId) => {
            setColor(newId);
            renderControls();
            saveState();
        }
    );
    section.appendChild(colorComponent);
    return section;
}

function renderHNTLogoSection() {
    const section = document.createElement('div');
    section.className = 'category-group active';
    section.innerHTML = '<div class="category-header">LOGO HNT</div>';
    const hntOptions = [
        { id: 'preto', name: 'PRETO', hex: '#000000' },
        { id: 'branco', name: 'BRANCO', hex: '#FFFFFF' }
    ];
    const component = window.UIComponents.createColorPicker(
        hntOptions,
        state.hntLogoColor,
        (newId) => {
            state.hntLogoColor = newId;
            if (typeof updateHntLayer === 'function') updateHntLayer();
            renderControls();
            saveState();
        }
    );
    section.appendChild(component);
    return section;
}

function renderCustomizationSection() {
    const group = document.createElement('div');
    group.className = 'category-group active';
    group.innerHTML = '<div class="category-header">Áreas de Personalização</div>';
    Object.values(CONFIG.zones).forEach(z => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-control';
        const zonePrice = (typeof getZonePrice === 'function') ? getZonePrice(z.id, 'image') : 0;
        const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_general') : '';
        zoneDiv.innerHTML = `<div class="zone-title">${z.name} ${zonePrice > 0 ? '(+R$ ' + zonePrice.toFixed(2) + ')' : ''} ${infoIcon}</div>`;
        const hasImage = state.elements[z.id] && state.elements[z.id].length > 0;
        const currentEl = hasImage ? state.elements[z.id][state.elements[z.id].length - 1] : null;
        const currentImgTag = currentEl ? currentEl.querySelector('img') : null;
        let uploadState = {
            src: currentImgTag ? currentImgTag.src : null,
            filename: currentEl ? (currentEl.dataset.filename || 'Imagem') : null,
            isCustom: currentEl ? (currentEl.dataset.isCustom === 'true') : false,
            scale: currentEl ? (parseFloat(currentEl.dataset.scale) || 1.0) : 1.0
        };
        const uploader = window.UIComponents.createImageUploader({
            zone: z,
            uploadState: uploadState,
            limitEnabled: state.zoneLimits[z.id] !== false,
            config: state.config,
            callbacks: {
                onUpload: (zid, file) => { if (typeof handleImageUpload === 'function') handleImageUpload({ target: { files: [file] } }, zid); },
                onRemove: (zid) => { if (typeof removeZoneElements === 'function') removeZoneElements(zid); },
                onToggleLimit: (zid, val) => { state.zoneLimits[zid] = val; updateLimits(); saveState(); },
                onScale: (zid, val) => {
                    if (state.elements[zid] && state.elements[zid].length > 0) {
                        const el = state.elements[zid][state.elements[zid].length - 1];
                        el.style.transform = `translate(-50%, -50%) scale(${val})`;
                        el.dataset.scale = val;
                        saveState();
                    }
                },
                openGallery: (zid) => { if (typeof openGallery === 'function') openGallery(zid); }
            }
        });
        zoneDiv.appendChild(uploader);
        const relatedTextZone = (CONFIG.textZones || []).find(t => t.parentZone === z.id);
        if (relatedTextZone && window.UIComponents?.createTextEditor) {
            if (!state.texts[relatedTextZone.id]) state.texts[relatedTextZone.id] = { enabled: false, content: '', fontFamily: 'Outfit', color: '#000000', scale: 1.0, maxLines: 1 };
            const tState = state.texts[relatedTextZone.id];
            const textComponent = window.UIComponents.createTextEditor({
                zone: relatedTextZone, textState: tState, config: state.config, fonts: CONFIG.fonts || [], colors: DATA.colors || [],
                callbacks: {
                    onToggle: (zid, val) => { tState.enabled = val; if (val) state.zoneLimits[z.id] = true; updateLimits(); updatePrice(); renderControls(); saveState(); },
                    onTextChange: (zid, val) => { tState.content = val; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onLinesChange: (zid, val) => { tState.maxLines = val; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onFontChange: (zid, val) => { tState.fontFamily = val; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onColorChange: (zid, val) => { tState.color = val; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); },
                    onScaleChange: (zid, val) => { tState.scale = val; if (typeof renderFixedTexts === 'function') renderFixedTexts(); saveState(); }
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

    // Adiciona Header e Botões originários do BaseSimulator
    if (window.MoletomSimulatorInstance) {
        if (typeof window.MoletomSimulatorInstance.renderHeader === 'function') {
            container.appendChild(window.MoletomSimulatorInstance.renderHeader());
        }
        if (typeof window.MoletomSimulatorInstance.renderActionButtons === 'function') {
            container.appendChild(window.MoletomSimulatorInstance.renderActionButtons());
        }
    }

    // Renderiza as seções específicas criadas neste arquivo
    container.appendChild(renderSizesSection());
    container.appendChild(renderColorSection());
    container.appendChild(renderHNTLogoSection());
    container.appendChild(renderCustomizationSection());

    if (typeof renderFinalForm === 'function') {
        const form = document.createElement('div');
        form.appendChild(renderFinalForm());
        container.appendChild(form);

        if (window.MoletomSimulatorInstance && typeof window.MoletomSimulatorInstance.syncFinalForm === 'function') {
            window.MoletomSimulatorInstance.syncFinalForm(form);
        }
    }

    // Força a validação inicial dos limites e preços
    if (typeof updateLimits === 'function') updateLimits();

    container.scrollTop = scrollPos;
}

function renderFinalForm() {
    const finalInputs = document.createElement('div');
    finalInputs.innerHTML = `
        <div style="margin-top:10px; border-top:1px solid #333; padding-top:10px;">
            <label style="font-weight:bold; display:block; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; height:60px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; padding:5px;">${state.observations || ''}</textarea>
        </div>
        <div style="margin-top:10px; background:#fff3cd; padding:10px; border-left:4px solid #ffc107; border-radius:4px;">
            <label style="font-weight:bold; display:block; color:#856404;">Telefone <span style="color:red">*</span></label>
            <input type="tel" id="phone-input" value="${state.phone || ''}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="(XX) XXXXX-XXXX">
        </div>
        <div style="margin-top:15px; background:#111; border:1px solid #333; padding:12px; border-radius:4px; color:#aaa; font-size:0.8rem;">
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:#fff; font-weight:bold;">
                <input type="checkbox" id="terms-checkbox" ${state.termsAccepted ? 'checked' : ''} style="width:18px; height:18px; margin-top:2px;">
                <span>EU LI E CONCORDO COM OS TERMOS E CONDIÇÕES <span style="color:red">*</span></span>
            </label>
        </div>
    `;
    return finalInputs;
}

function openGallery(zoneId) {
    state.pendingUploadZone = zoneId;
    const modal = document.getElementById('gallery-modal');
    if (modal) { modal.style.display = 'flex'; renderGallery(); }
}
window.closeGallery = function () { const modal = document.getElementById('gallery-modal'); if (modal) modal.style.display = 'none'; }

function renderGallery(searchTerm = "") {
    const g = document.getElementById('gallery-grid'); if (!g) return;
    g.innerHTML = '';
    const galleryData = (typeof SHARED_GALLERY !== 'undefined') ? SHARED_GALLERY : [];
    galleryData.forEach(i => {
        const d = document.createElement('div'); d.className = 'gallery-item';
        d.innerHTML = `<img src="${i.src}"><span>${i.name}</span>`;
        d.onclick = () => {
            if (state.pendingUploadZone) {
                createImageElement(state.pendingUploadZone, i.src, false, i.name);
                window.closeGallery();
            }
        };
        g.appendChild(d);
    });
}

function handleImageUpload(e, z) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
        const base64 = ev.target.result;
        createImageElement(z, base64, true, f.name);
    };
    r.readAsDataURL(f);
}

function createImageElement(z, s, isCustom, filename = '') {
    const l = document.getElementById('customization-layer'); const zc = CONFIG.zones[z];
    if (state.elements[z]) { state.elements[z].forEach(e => e.remove()); state.elements[z] = []; }
    const el = document.createElement('div'); el.className = 'custom-element draggable';
    el.style.left = zc.x + '%'; el.style.top = zc.y + '%'; el.style.width = zc.width + '%';
    el.style.transform = 'translate(-50%, -50%) scale(1.0)'; el.style.zIndex = 1500;
    el.dataset.type = 'image'; el.dataset.isCustom = isCustom; el.dataset.filename = filename;
    const img = document.createElement('img'); img.src = s; img.style.width = '100%';
    el.appendChild(img); l.appendChild(el);
    if (!state.elements[z]) state.elements[z] = []; state.elements[z].push(el);
    state.zoneLimits[z] = true; updateLimits(); updatePrice(); renderControls(); saveState();
}

function removeZoneElements(z) {
    if (state.elements[z]) { state.elements[z].forEach(e => e.remove()); state.elements[z] = []; }
    state.zoneLimits[z] = false; updateLimits(); updatePrice(); renderControls(); saveState();
}

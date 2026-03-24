/**
 * Módulo de Renderização de Seções (REFATORADO)
 * Funções: renderSizesSection, renderHNTLogosSection, renderFinalForm, renderExtraControl, renderTextControl, renderUploadControl
 * Dependências: window.UIComponents
 */

// Helper para obter cores disponíveis para um alvo
function getAvailableColors(target) {
    let available = (typeof state !== 'undefined' && state.availableColors) ? state.availableColors : (typeof DATA !== 'undefined' ? DATA.colors : []);

    // Check for restrictions on the specific target (part/extra)
    if (target && target.restrictedColors && Array.isArray(target.restrictedColors)) {
        available = available.filter(c => target.restrictedColors.includes(c.id));
    }
    return available;
}

function renderSizesSection() {
    return window.UIComponents.createSizeSelector(
        DATA.sizes,
        state.sizes,
        state.config,
        (sizeLabel, newValue) => {
            state.sizes[sizeLabel] = newValue;
            scheduleRender(false);
            if (typeof updatePrice === 'function') updatePrice();
            if (typeof saveState === 'function') saveState();
        }
    );
}

function renderHNTLogosSection() {
    const hntGroup = document.createElement('div');
    hntGroup.className = 'category-group';

    DATA.parts.filter(p => p.id.includes('hnt')).forEach(p => {
        const r = document.createElement('div');
        r.className = 'control-item';

        const currentColorId = state.parts[p.id];
        const currentColorObj = DATA.colors.find(c => c.id === currentColorId);
        const colorName = currentColorObj ? `: ${currentColorObj.name.toUpperCase()}` : '';

        const displayName = p.id === 'logo_hnt' ? 'LOGO Hanuthai' : p.name.toUpperCase();

        r.innerHTML = `<span class="control-label">${displayName}${colorName}</span>`;

        const colors = getAvailableColors(p);

        r.appendChild(window.UIComponents.createColorPicker(colors, state.parts[p.id], (cId) => {
            state.parts[p.id] = cId;
            if (typeof refreshActiveLimits === 'function') refreshActiveLimits();
            scheduleRender(true);
        }));

        hntGroup.appendChild(r);
    });

    return hntGroup;
}

function renderFinalForm() {
    // Mantém a implementação original pois é específica e não vale a pena componentizar agora
    const finalInputs = document.createElement('div');

    const hasActiveUploads = Object.values(state.uploads).some(u => u && u.src);
    const embSectionStyle = hasActiveUploads ? '' : 'display:none;';

    finalInputs.innerHTML = `
        <div style="margin-top:15px; border-top: 1px solid #333; padding-top: 15px;">
            <label style="font-weight:bold; display:block; margin-bottom:5px; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; border:1px solid #444; background:#222; color:#fff; padding:8px; border-radius:4px;" rows="3" placeholder="Ex: Detalhes específicos de arte, posições, etc.">${state.observations || ''}</textarea>
        </div>
        
        <div id="emb-section-container" style="margin-top:15px; border-top: 1px solid #333; padding-top: 15px; ${embSectionStyle}">
            <div style="background:#1a472a; padding:12px; border-left:4px solid #28a745; border-radius:4px; margin-bottom:10px;">
                <label style="font-weight:bold; display:block; margin-bottom:8px; color:#fff;">
                    📎 Envio de Arquivo de Arte de Bordado (.EMB) ${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_emb') : ''}
                </label>
                <p style="color:#d4edda; font-size:0.9rem; margin:0 0 10px 0;">
                    Se você possui o arquivo de arte de bordado (.EMB), envie aqui para evitar cobrança de arte. 
                    <strong>Tamanho máximo: 2MB</strong>
                </p>
                <input type="file" id="emb-file-input" accept=".emb" style="display:none;">
                <button id="emb-upload-btn" style="background:#28a745; color:#fff; border:none; padding:10px 15px; border-radius:4px; cursor:pointer; font-weight:bold; width:100%;">
                    ➕ Adicionar Arquivo EMB
                </button>
            </div>
            <div id="emb-files-list" style="margin-top:10px;"></div>
        </div>
        
        <div style="margin-top:10px; background:rgba(212, 175, 55, 0.05); padding:12px; border:1px solid var(--gold-primary); border-radius:var(--radius-md);">
            <label style="font-weight:bold; display:block; margin-bottom:8px; color:var(--gold-primary);">Telefone para Contato <span style="color:red">*</span> ${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_telefone', 'Necessário para contato sobre ajustes técnicos e análise de produção') : ''}</label>
            <input type="tel" id="phone-input" value="${state.phone || ''}" style="width:100%; border:1px solid #444; background:#111; color:#fff; padding:10px; border-radius:4px; font-size:1rem;" placeholder="(XX) XXXXX XXXX" maxlength="15">
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

    return finalInputs;
}

function renderExtraControl(e) {
    const s = state.extras[e.id];
    const currentColorObj = DATA.colors.find(c => c.id === s.color);
    const colorName = s.enabled && currentColorObj ? `: ${currentColorObj.name.toUpperCase()}` : '';

    let ePrice = e.price;
    if (state.config && state.config.extraPrices && state.config.extraPrices[e.id] !== undefined) {
        ePrice = state.config.extraPrices[e.id];
    }

    // Obter ícone
    let iconHtml = '';
    if (typeof getExtraIcon === 'function') iconHtml = getExtraIcon(e.id);
    else {
        // Fallback simples se getExtraIcon não estiver disponível aqui (está em ui-features.js)
        // Mas ui-features.js deve estar carregado
        iconHtml = '★';
    }

    const wrapper = document.createElement('div');

    const btn = window.UIComponents.createToggleButton({
        id: e.id,
        label: e.name,
        iconHtml: iconHtml,
        price: ePrice,
        requestActive: s.enabled,
        colorName: colorName,
        onToggle: (isActive) => {
            s.enabled = isActive;
            scheduleRender(true);
        }
    });
    wrapper.appendChild(btn);

    if (s.enabled) {
        const cw = document.createElement('div');
        cw.style.paddingLeft = '10px'; cw.style.borderLeft = '2px solid #333';

        const colors = getAvailableColors(e);

        cw.appendChild(window.UIComponents.createColorPicker(colors, s.color, (cId) => {
            s.color = cId;
            scheduleRender(true);
        }));
        wrapper.appendChild(cw);
    }
    return wrapper;
}

function renderUploadControl(zone) {
    const u = state.uploads[zone.id];
    const isCovered = (typeof EmbManager !== 'undefined') ? EmbManager.isZoneCovered(zone.id, state.embFiles) : false;

    return window.UIComponents.createImageUploader({
        zone: zone,
        uploadState: u,
        limitEnabled: state.limits[zone.id],
        config: state.config,
        isCoveredByEmb: isCovered,
        callbacks: {
            onUpload: (zId, file) => { if (typeof handleZoneUpload === 'function') handleZoneUpload(zId, file); },
            onRemove: (zId) => {
                u.src = null;
                u.filename = '';
                if (typeof checkZoneUsage === 'function' && !checkZoneUsage(zId)) {
                    if (typeof toggleLimit === 'function') toggleLimit(zId, false);
                }
                scheduleRender(true);
            },
            onToggleLimit: (zId, checked) => { if (typeof toggleLimit === 'function') toggleLimit(zId, checked); },
            onEmbPromise: (zId, checked) => {
                u.hasEmbPromise = checked;
                scheduleRender(true);
                if (checked) {
                    setTimeout(() => {
                        const embSection = document.getElementById('emb-section-container');
                        if (embSection) {
                            embSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            embSection.style.transition = 'box-shadow 0.5s';
                            embSection.style.boxShadow = '0 0 20px #28a745';
                            setTimeout(() => embSection.style.boxShadow = 'none', 2000);
                        }
                    }, 200);
                }
            },
            onScale: (zId, val) => {
                u.scale = val;
                if (typeof updateVisuals === 'function') updateVisuals();
            },
            openGallery: (zId) => { if (typeof openGallery === 'function') openGallery(zId); }
        }
    });
}

function renderTextControl(zone) {
    if (!state.texts[zone.id]) {
        state.texts[zone.id] = { enabled: false, content: "", fontFamily: 'Outfit', color: "#FF0000", scale: 1.0, maxLines: 1, x: zone.cssLeft, y: zone.cssTop, unlocked: false };
    }
    const t = state.texts[zone.id];

    // --- Font Data Preparation ---
    let availableFonts = [];
    if (typeof DATA !== 'undefined' && DATA.fonts) availableFonts = [...DATA.fonts];
    if (typeof SHARED_FONTS !== 'undefined') {
        SHARED_FONTS.forEach(f => {
            if (!availableFonts.find(existing => existing.id === f.id)) availableFonts.push(f);
        });
    }

    // Load custom fonts from local storage if any
    try {
        const customFontsData = JSON.parse(localStorage.getItem('hnt_custom_fonts_data') || '[]');
        customFontsData.forEach(font => {
            if (!availableFonts.find(f => f.id === font.id)) availableFonts.push(font);
        });
    } catch (e) { }

    // Sort
    availableFonts.sort((a, b) => a.name.localeCompare(b.name));

    // Prepare Colors
    let textColors = DATA.colors;
    if (state.config && state.config.textColors && state.config.textColors.length > 0) {
        textColors = DATA.colors.filter(c => state.config.textColors.includes(c.id));
    }

    return window.UIComponents.createTextEditor({
        zone: zone,
        textState: t,
        config: state.config,
        fonts: availableFonts,
        colors: textColors,
        callbacks: {
            onToggle: (zId, checked) => {
                t.enabled = checked;
                // logic for limits
                let uploadId = zone.id.replace('text_', 'logo_');
                if (zone.id.includes('leg_')) {
                    let core = zone.id.replace('text_', '');
                    if (core === 'leg_right_mid') uploadId = 'leg_right_mid_ie';
                    else if (core === 'leg_right_bottom') uploadId = 'leg_right_bottom_ie';
                    else uploadId = core;
                }
                if (t.enabled) {
                    if (typeof toggleLimit === 'function') toggleLimit(uploadId, true);
                } else {
                    if (typeof checkZoneUsage === 'function' && !checkZoneUsage(uploadId)) {
                        if (typeof toggleLimit === 'function') toggleLimit(uploadId, false);
                    }
                }
                scheduleRender(true);
            },
            onTextChange: (zId, val) => { t.content = val; scheduleRender(false); },
            onLinesChange: (zId, val) => { t.maxLines = val; scheduleRender(false); },
            onFontChange: (zId, fontId) => { t.fontFamily = fontId; scheduleRender(false); },
            onColorChange: (zId, hex) => { t.color = hex; scheduleRender(true); },
            onScaleChange: (zId, val) => { t.scale = val; scheduleRender(false); }
        }
    });
}

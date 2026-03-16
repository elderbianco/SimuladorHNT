/**
 * Módulo de UI - Moletom (REFATORADO v2)
 * ✅ USA UI COMPONENTS PADRONIZADOS
 * ✅ MANTÉM REGRAS DE NEGÓCIO (PREÇOS, BLOQUEIOS)
 */

function renderSizesSection() {
    const section = document.createElement('div');
    section.className = 'category-group';

    // Header with Info
    const infoS = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_moletom_geral') : '';
    section.innerHTML = `<div class="category-header">Tamanhos ${infoS}</div>`;

    // Use Shared Component
    const sizeComponent = window.UIComponents.createSizeSelector(
        CONFIG.sizes,
        state.sizes,
        (label, newVal) => {
            state.sizes[label] = newVal;
            if (typeof scheduleRender === 'function') scheduleRender(false);
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
    section.innerHTML = `<div class="category-header">COR DO MOLETOM</div>`;

    // Use Shared Component
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
    section.className = 'category-group';
    section.innerHTML = '<div class="category-header">LOGO HNT</div>';

    // Moletom uses strict 'preto'/'branco' for HNT Logo, unlike others that use IDs.
    // We Map 'preto'/'branco' to color objects for the component, or just use custom data.
    const hntOptions = [
        { id: 'preto', name: 'PRETO', hex: '#000000' },
        { id: 'branco', name: 'BRANCO', hex: '#FFFFFF' }
    ];

    const component = window.UIComponents.createColorPicker(
        hntOptions,
        state.hntLogoColor,
        (newId) => {
            state.hntLogoColor = newId;
            updateHntLayer();
            renderControls();
            saveState();
        },
        {
            // Custom logic for forbidden colors (contrast check)
            onRenderOption: (element, color) => {
                const baseColorHex = CONFIG.colors.find(bc => bc.id === state.color)?.hex;
                if (baseColorHex === color.hex) {
                    element.style.opacity = '0.2';
                    element.style.cursor = 'not-allowed';
                    element.onclick = (e) => {
                        e.stopPropagation();
                    };
                    const baseColorName = CONFIG.colors.find(bc => bc.id === state.color)?.name || state.color;
                    element.title = `Indisponível (contraste com ${baseColorName})`;
                    element.classList.remove('selected');
                }
            }
        }
    );

    section.appendChild(component);
    return section;
}

function renderCustomizationSection() {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.innerHTML = '<div class="category-header">Áreas de Personalização</div>';

    Object.values(CONFIG.zones).forEach(z => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-control';

        // 1. Title/Header Logic
        const zonePrice = getZonePrice(z.id, 'image');
        const zoneElements = state.elements[z.id] || [];
        const hasCustomImage = zoneElements.some(el => el.dataset.isCustom === 'true');
        const devFee = state.config.devFee || CONFIG.devFee || 0;

        let titleText = z.name;
        if (zonePrice > 0) {
            titleText += ` <span style="color:#00b4d8; font-weight:bold; font-size:0.85rem;">(+R$ ${zonePrice.toFixed(2)})</span>`;
        }
        if (hasCustomImage && devFee > 0) {
            titleText += ` <span style="color:var(--accent); margin-left:10px;">[Taxa Arte: R$ ${devFee.toFixed(2)}]</span>`;
        }
        const infoIcon = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('customization_general') : '';
        zoneDiv.innerHTML = `<div class="zone-title">${titleText} ${infoIcon}</div>`;

        // 2. Upload using Component
        const hasImage = state.elements[z.id] && state.elements[z.id].length > 0;
        const currentImgElement = (hasImage && state.elements[z.id].length > 0) ? state.elements[z.id][state.elements[z.id].length - 1] : null;

        let uploadState = {
            src: currentImgElement ? currentImgElement.src : null,
            filename: currentImgElement ? (currentImgElement.dataset.filename || 'Imagem Enviada') : null,
            isCustom: currentImgElement ? (currentImgElement.dataset.isCustom === 'true') : false,
            hasEmbPromise: false,
            // Map % width to Scale Factor. 
            // Moletom slider was 5 to 100.
            scale: currentImgElement ? (parseFloat(currentImgElement.style.width) || z.width) / z.width : 1.0
        };

        const uploader = window.UIComponents.createImageUploader({
            zone: z,
            uploadState: uploadState,
            limitEnabled: state.zoneLimits[z.id] !== false,
            config: state.config,
            isCoveredByEmb: false,
            callbacks: {
                onUpload: (zoneId, file) => {
                    handleImageUpload({ target: { files: [file] } }, zoneId);
                },
                onRemove: (zoneId) => {
                    removeZoneElements(zoneId);
                },
                onToggleLimit: (zoneId, isChecked) => {
                    state.zoneLimits[zoneId] = isChecked;
                    updateLimits();
                    saveState();
                },
                onScale: (zoneId, val) => {
                    if (state.elements[zoneId] && state.elements[zoneId].length > 0) {
                        const el = state.elements[zoneId][state.elements[zoneId].length - 1];
                        const baseP = z.width;
                        const newP = baseP * val;
                        el.style.width = newP + '%';
                        saveState();
                    }
                },
                openGallery: (zoneId) => {
                    openGallery(zoneId);
                }
            }
        });

        zoneDiv.appendChild(uploader);

        // 3. Text Logic
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
                colors: (state.config.textColors && state.config.textColors.length > 0)
                    ? DATA.colors.filter(c => state.config.textColors.includes(c.id))
                    : DATA.colors,
                callbacks: {
                    onToggle: (zoneId, enabled) => {
                        tState.enabled = enabled;
                        if (enabled) state.zoneLimits[z.id] = true;
                        else if (checkZoneEmpty(z.id)) state.zoneLimits[z.id] = false;
                        updateLimits();
                        updatePrice();
                        renderControls();
                        saveState();
                    },
                    onTextChange: (zoneId, content) => {
                        tState.content = content;
                        if (typeof renderFixedTexts === 'function') renderFixedTexts();
                        saveState();
                    },
                    onLinesChange: (zoneId, maxLines) => {
                        tState.maxLines = maxLines;
                        if (typeof renderFixedTexts === 'function') renderFixedTexts();
                        saveState();
                    },
                    onFontChange: (zoneId, fontFamily) => {
                        tState.fontFamily = fontFamily;
                        if (typeof renderFixedTexts === 'function') renderFixedTexts();
                        saveState();
                    },
                    onColorChange: (zoneId, color) => {
                        tState.color = color;
                        if (typeof renderFixedTexts === 'function') renderFixedTexts();
                        saveState();
                    },
                    onScaleChange: (zoneId, scale) => {
                        tState.scale = scale;
                        if (typeof renderFixedTexts === 'function') renderFixedTexts();
                        saveState();
                    }
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

    // === HEADER: IDs ===
    if (!state.simulationId && typeof generateNextSequenceNumber === 'function') {
        state.simulationId = `HNT-ML-${generateNextSequenceNumber()}`;
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
               placeholder="000000" readonly
               style="background:#0a0a0a; border:1px solid #444; color:#fff; font-family:'Bebas Neue', sans-serif; font-size:0.9rem; padding:4px 8px; width:100px; text-align:center; border-radius:4px; outline:none; cursor:default;">
    `;

    headerRow.appendChild(orderDiv);
    headerRow.appendChild(simIdDiv);
    container.appendChild(headerRow);

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

        state.simulationId = `${orderPrefix}-ML-${newSeq}`;
        let pdfUrl = null;
        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateAndSaveForCart) {
            try {
                console.log('📄 Gerando PDF para carrinho...');
                pdfUrl = await PDFGenerator.generateAndSaveForCart();
            } catch (err) {
                console.error('Erro ao gerar PDF:', err);
            }
        }
        if (pdfUrl) state.pdfUrl = pdfUrl;

        if (typeof saveOrderToHistory === 'function') {
            if (saveOrderToHistory()) {
                if (confirm('✅ Produto adicionado ao carrinho!\n\nDeseja ir para a página de pedidos finalizar?')) {
                    window.location.href = 'IndexPedidoSimulador.html';
                }
            }
        }
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
    container.appendChild(renderColorSection());
    container.appendChild(renderHNTLogoSection());
    container.appendChild(renderCustomizationSection());
    container.appendChild(renderFinalForm());

    // === RESTORE STATE ===
    const phoneInput = container.querySelector('#phone-input');
    const obsInput = container.querySelector('#obs-input');
    const termsCheckbox = container.querySelector('#terms-checkbox');
    const orderInputTop = document.getElementById('order-input-top');

    if (phoneInput && obsInput && termsCheckbox) {
        phoneInput.value = state.phone || '';
        obsInput.value = state.observations || '';
        termsCheckbox.checked = !!state.termsAccepted;

        termsCheckbox.onclick = (e) => {
            state.termsAccepted = e.target.checked;
            saveState();
        };

        if (orderInputTop) {
            orderInputTop.onchange = (e) => {
                let val = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
                state.orderNumber = val;
                e.target.value = val;

                let suffix = '000000';
                if (state.simulationId) {
                    const parts = state.simulationId.split('-');
                    if (parts.length >= 3) suffix = parts[parts.length - 1];
                } else if (typeof generateNextSequenceNumber === 'function') {
                    suffix = generateNextSequenceNumber();
                }

                if (!val) state.simulationId = `HNT-ML-${suffix}`;
                else state.simulationId = `${val}-ML-${suffix}`;

                const simIdSpan = container.querySelector('div > span[style*="font-size:0.75rem"]');
                if (simIdSpan) simIdSpan.innerText = `ID: ${state.simulationId}`;

                saveState();
            };
        }

        phoneInput.oninput = (e) => {
            // Mask
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

    container.scrollTop = scrollPos;
}

function renderFinalForm() {
    const finalInputs = document.createElement('div');
    finalInputs.innerHTML = `
        <div style="margin-top:10px; border-top:1px solid #333; padding-top:10px;">
            <label style="font-weight:bold; display:block; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; height:60px; background:#222; color:#fff; border:1px solid #444; border-radius:4px; padding:5px;"></textarea>
        </div>
        <div style="margin-top:10px; background:#fff3cd; padding:10px; border-left:4px solid #ffc107; border-radius:4px;">
            <label style="font-weight:bold; display:block; color:#856404;">Telefone <span style="color:red">*</span> ${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_telefone', 'Necessário para contato sobre ajustes técnicos e análise de produção') : ''}</label>
            <input type="tel" id="phone-input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;" placeholder="(XX) XXXXX-XXXX">
        </div>
        <div style="margin-top:15px; background:#111; border:1px solid #333; padding:12px; border-radius:4px; color:#aaa; font-size:0.8rem;">
            <p style="margin:0 0 10px 0; line-height:1.4;">
                <strong style="color:#D4AF37;">⚠️ AVISO IMPORTANTE:</strong> Este documento é uma <strong>SIMULAÇÃO DIGITAL</strong> para fins de orçamento e visualização. O resultado final físico pode apresentar pequenas variações de cor, tamanho, proporções e ajuste, devido aos processos artesanais e à calibração de cada monitor. Todos os arquivos e artes passarão por análise técnica de viabilidade de bordado, e o valor final está sujeito a confirmação após essa avaliação.
            </p>
            <p style="margin:0 0 12px 0; line-height:1.4;">
                Ao prosseguir, você declara que leu e concorda com todas as informações e condições do produto disponíveis em nosso <a href="IndexFaq.html" target="_blank" style="color:#D4AF37; text-decoration:underline;">FAQ</a>, além de confirmar que possui os direitos autorais sobre as artes enviadas, assumindo total responsabilidade legal. Em caso de dúvidas, entre em contato com nossa equipe.
            </p>
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:#fff; font-weight:bold;">
                <input type="checkbox" id="terms-checkbox" style="width:18px; height:18px; margin-top:2px;">
                <span>EU LI E CONCORDO COM OS TERMOS E CONDIÇÕES ACIMA <span style="color:red">*</span></span>
            </label>
        </div>
    `;
    return finalInputs;
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

    if (!currentGalleryCategory) {
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
            d.onclick = () => { currentGalleryCategory = cat; renderGallery(); };
            g.appendChild(d);
        });
    } else {
        // Back Btn
        const b = document.createElement('button');
        b.className = 'gallery-back-btn';
        b.innerText = '↩ Voltar';
        b.onclick = () => { currentGalleryCategory = null; renderGallery(); };
        g.appendChild(b);

        const items = galleryData.filter(i => (i.category || 'Gerais') === currentGalleryCategory);
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
            updateLimits();
            let fmt = i.name;
            if (typeof generateFormattedFilename === 'function') fmt = generateFormattedFilename(state.pendingUploadZone, i.name, 'ACERVO');
            if (typeof createImageElement === 'function') createImageElement(state.pendingUploadZone, i.src, false, fmt);
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
    if (checkZoneEmpty(z)) state.zoneLimits[z] = false; updateLimits(); updatePrice(); renderControls(); saveState();
}
function checkZoneEmpty(z) {
    const hI = state.elements[z] && state.elements[z].length > 0;
    const rT = CONFIG.textZones.find(t => t.parentZone === z);
    const hT = rT && state.texts[rT.id].enabled;
    return !hI && !hT;
}

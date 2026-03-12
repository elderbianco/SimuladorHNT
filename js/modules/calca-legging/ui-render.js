/**
 * Módulo de UI - Calça Legging (REFATORADO v2)
 * ✅ USA UI COMPONENTS PADRONIZADOS
 * ✅ MANTÉM REGRAS DE NEGÓCIO (PREÇOS, BLOQUEIOS)
 */

function renderSizesSection() {
    const section = document.createElement('div');
    section.className = 'category-group';

    // Header with Info
    const infoS = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_legging_geral') : '';
    section.innerHTML = `<div class="category-header">Tamanhos ${infoS}</div>`;

    // Use Shared Component
    const sizeComponent = window.UIComponents.createSizeSelector(
        CONFIG.sizes,
        state.sizes,
        state.config,
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
    section.innerHTML = `<div class="category-header">COR DA LEGGING: ${cObj ? cObj.name.toUpperCase() : ''}</div>`;

    // Use Shared Component
    const colorComponent = window.UIComponents.createColorPicker(
        state.availableColors,
        state.color,
        (newId) => {
            setColor(newId);
        }
    );

    section.appendChild(colorComponent);
    return section;
}

function renderHNTLogoSection() {
    const section = document.createElement('div');
    section.className = 'category-group';
    section.innerHTML = '<div class="category-header">LOGO HNT (Cós)</div>';

    const component = window.UIComponents.createColorPicker(
        HNT_LOGO_COLORS,
        state.hntLogoColor, // Note: State var differs from Top (hntBarra vs hntLogo)
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
    group.innerHTML = '<div class="category-header">Personalização</div>';

    Object.values(CONFIG.zones).forEach(z => {
        const zoneDiv = document.createElement('div');
        zoneDiv.className = 'zone-control';

        // 1. Title/Header Logic
        const zonePrice = getZonePrice(z.id, 'logo'); // Note: 'logo' type for Legging customization
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
        const currentImgElement = hasImage ? state.elements[z.id][0] : null;

        let uploadState = {
            src: currentImgElement ? currentImgElement.src : null,
            filename: currentImgElement ? (currentImgElement.dataset.filename || 'Imagem Enviada') : null,
            isCustom: currentImgElement ? (currentImgElement.dataset.isCustom === 'true') : false,
            hasEmbPromise: false, // Legging doesn't seem to have embroidery promise logic in original file?
            // Map % width to Scale Factor. 
            // Legging slider was 0.5 to 100.
            scale: currentImgElement ? (parseFloat(currentImgElement.style.width) || z.width) / z.width : 1.0
        };

        const uploader = window.UIComponents.createImageUploader({
            zone: z,
            uploadState: uploadState,
            limitEnabled: state.zoneLimits[z.id] === true,
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
                    if (state.elements[zoneId] && state.elements[zoneId][0]) {
                        const baseP = z.width;
                        const newP = baseP * val;
                        state.elements[zoneId][0].style.width = newP + '%';
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
        state.simulationId = `HNT-LG-${generateNextSequenceNumber()}`;
    }
    if ((!state.orderNumber || state.orderNumber === state.simulationId) && typeof generateNextOrderNumber === 'function') {
        state.orderNumber = `HNT-PD-${generateNextOrderNumber()}`;
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

        const newSeq = (typeof generateNextSequenceNumber === 'function')
            ? generateNextSequenceNumber()
            : String(parseInt(localStorage.getItem('hnt_sequence_id') || '0') + 1).padStart(6, '0');

        const orderPrefix = (state.orderNumber && state.orderNumber.trim() !== '' && state.orderNumber !== state.simulationId)
            ? state.orderNumber
            : 'HNT';

        state.simulationId = `${orderPrefix}-LG-${newSeq}`;

        
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
    container.appendChild(renderHNTLogoSection()); // Logo Cós
    container.appendChild(renderCustomizationSection()); // Uploads & Texts

    // === FORMULÁRIO FINAL ===
    const finalInputs = document.createElement('div');
    finalInputs.innerHTML = `
        <div style="margin-top:15px; border-top: 1px solid #333; padding-top: 15px;">
            <label style="font-weight:bold; display:block; margin-bottom:5px; color:#fff;">Observações:</label>
            <textarea id="obs-input" style="width:100%; border:1px solid #444; background:#222; color:#fff; padding:8px; border-radius:4px;" rows="3" placeholder="Ex: Detalhes específicos de arte, posições, etc."></textarea>
        </div>
        <div style="margin-top:10px; background:rgba(212, 175, 55, 0.05); padding:12px; border:1px solid var(--gold-primary); border-radius:var(--radius-md);">
            <label style="font-weight:bold; display:block; margin-bottom:8px; color:var(--gold-primary);">Telefone para Contato <span style="color:red">*</span> ${(typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_telefone', 'Necessário para contato sobre ajustes técnicos e análise de produção') : ''}</label>
            <input type="tel" id="phone-input" style="width:100%; border:1px solid #444; background:#111; color:#fff; padding:10px; border-radius:4px; font-size:1rem;" placeholder="(XX) XXXXX XXXX" maxlength="15">
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
    container.appendChild(finalInputs);

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

                if (!val) state.simulationId = `HNT-LG-${suffix}`;
                else state.simulationId = `${val}-LG-${suffix}`;

                const simIdSpan = container.querySelector('div > span[style*="font-size:0.75rem"]');
                if (simIdSpan) simIdSpan.innerText = `ID: ${state.simulationId}`;

                saveState();
            };
        }

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

    container.scrollTop = scrollPos;
}

function openGallery(zoneId) {
    state.pending = zoneId;
    if (typeof currentGalleryCategory !== 'undefined') currentGalleryCategory = null;
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderGallery();
    }
}
function closeGallery() { document.getElementById('gallery-modal').style.display = 'none'; }
window.closeGallery = closeGallery;

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

    // Simple View or Category view? 
    // Original had logic for Category. Let's keep it simple for now or copy the specific category logic if needed.
    // Given shared components, we might want to standardize gallery too eventually. 
    // For now, I'll use a simple flat list to avoid complexity unless category logic is critical. 
    // Wait, the original had Category Logic (Lines 810+ in original). 
    // I should probably preserve it.

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
        if (state.pending) {
            state.zoneLimits[state.pending] = true;
            updateLimits();
            let fmt = i.name;
            if (typeof generateFormattedFilename === 'function') fmt = generateFormattedFilename(state.pending, i.name, 'ACERVO');
            if (typeof createImageElement === 'function') createImageElement(state.pending, i.src, false, fmt);
        }
        closeGallery();
    };
    container.appendChild(d);
}

// Logic helpers (kept from original)
async function uploadFileToServer(file, base64, zoneId) {
    if (typeof SupabaseAdapter === 'undefined') return;

    try {
        const fileName = (typeof generateFormattedFilename === 'function') ? generateFormattedFilename(zoneId, file.name, 'EXT') : file.name;
        const publicUrl = await SupabaseAdapter.uploadFile('client_uploads', fileName, base64, file.type);

        if (publicUrl) {
            console.log('✅ Upload para Supabase (Calça Legging) concluído:', publicUrl);
            if (zoneId && state.uploads && state.uploads[zoneId]) {
                state.uploads[zoneId].supabaseUrl = publicUrl;
            }
        }
    } catch (e) {
        console.error('❌ Erro no upload para Supabase (Calça Legging):', e);
    }
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
    state.zoneLimits[z] = true; updateLimits(); updatePrice(); renderControls(); saveState();
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

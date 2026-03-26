/**
 * BaseSimulator using ES6 Class
 * Centralizes common logic for UI rendering, state management, and cart actions.
 */

class BaseSimulator {
    constructor(config) {
        this.config = config || {};
        this.containerId = 'controls-container';
        this.simKey = this.config.storageKey || 'hnt_simulator_state';

        // Dynamic state sync: always point to window.state if available
        this._localState = window.state || {};
        this.isInitialized = false;
        Object.defineProperty(this, 'state', {
            get: function () { return window.state || this._localState; },
            set: function (val) { this._localState = val; },
            configurable: true,
            enumerable: true
        });
    }

    /**
     * Initializes the simulator
     */
    async init() {
        if (this.isInitialized) return;
        console.log(`[BaseSimulator] Starting init for ${this.constructor.name}...`);

        try {
            this.isInitialized = true; // Set early to prevent parallel init attempts

            // 1. Validar state inicial (defensivo)
            if (!this.state.parts) this.state.parts = {};
            if (!this.state.sizes) this.state.sizes = {};
            if (!this.state.texts) this.state.texts = {};
            if (!this.state.elements) this.state.elements = {};
            if (!this.state.zoneLimits) this.state.zoneLimits = {};

            console.log("[BaseSimulator] State validated");

            // 2. Hydrate from Storage if available
            this.loadState();
            console.log("[BaseSimulator] State loaded");

            // 3. Prepare Data
            if (this.loadData) {
                console.log("[BaseSimulator] Awaiting loadData...");
                await this.loadData();
                console.log("[BaseSimulator] loadData finished");
            }

            console.log("[BaseSimulator] Initialization complete - Rendering...");
            this.render();
            this.setupEventListeners();

            // 4. Update Price after first render
            this.updatePrice();
        } catch (e) {
            this.isInitialized = false;
            console.error("[BaseSimulator] Init ERROR:", e);
        }
    }

    updatePrice() {
        if (typeof window.updatePrice === 'function') {
            window.updatePrice(); // Call global fallback for now to keep HTML sync
        }
    }

    saveState() {
        if (!this.state) return;
        localStorage.setItem(this.simKey, JSON.stringify(this.state));
    }

    loadState() {
        try {
            const saved = localStorage.getItem(this.simKey);
            if (saved) {
                const data = JSON.parse(saved);
                // Selective merge to avoid breaking references
                Object.assign(this.state, data);
            }
        } catch (e) {
            console.warn("[BaseSimulator] Error loading state:", e);
        }
    }

    /**
     * Main Render Loop
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Preserve scroll position
        const scrollPos = container.scrollTop;
        container.innerHTML = '';

        try {
            // Check if editing mode is active
            const isEditing = this.state._editingIndex !== undefined && this.state._editingIndex !== null;

            // 1. Header (ID, Pedido)
            container.appendChild(this.renderHeader());

            // 2. Botões de Ação (Adicionar ao Carrinho, Limpar)
            container.appendChild(this.renderActionButtons(isEditing));

            // 3. Categorias Dinâmicas
            const categories = window.DATA?.categories || [];
            categories.forEach(cat => {
                const group = document.createElement('div');
                group.className = 'category-group active';

                // Header da Categoria
                const header = document.createElement('div');
                header.className = 'category-header';

                let iconHtml = '';
                try {
                    iconHtml = window.InfoSystem ? window.InfoSystem.getIconHTML(`info_${cat.id.toLowerCase()}`) || '' : '';
                } catch (e) { }

                header.innerHTML = `${cat.name.toUpperCase()} ${iconHtml}`;
                group.appendChild(header);

                // Conteúdo da Categoria
                const groupContent = document.createElement('div');
                groupContent.className = 'category-content';
                groupContent.style.display = 'block';

                // Injetar Seções Customizadas (Overridden by subclasses)
                try {
                    const sections = this.getCustomSections() || [];
                    const catSections = sections.filter(s => s.category === cat.id || s.category === cat.name || (!s.category && cat.id === 'Geral'));

                    console.log(`  - Category ${cat.id}: ${catSections.length} sections found`);

                    catSections.forEach(s => {
                        const item = document.createElement('div');
                        item.className = 'control-item';

                        if (s.label) {
                            const label = document.createElement('label');
                            label.className = 'control-label';
                            label.innerText = s.label;
                            item.appendChild(label);
                        }

                        if (s.type === 'color' && window.UIComponents?.createColorPicker) {
                            item.appendChild(window.UIComponents.createColorPicker(s.colors, s.selectedColor, s.onSelect, { className: 'inline-picker' }));
                        } else if (s.type === 'size' && window.UIComponents?.createSizeSelector) {
                            item.appendChild(window.UIComponents.createSizeSelector(s.sizes, s.selectedSizes || {}, this.state.config || {}, s.onUpdate));
                        } else if (s.element) {
                            item.appendChild(s.element);
                        }

                        groupContent.appendChild(item);
                    });
                } catch (e) {
                    console.error(`❌ Error rendering sections for ${cat.name}:`, e);
                }

                // Injetar Peças (Parts) se houver mapeamento
                this.renderCategoryParts(cat, groupContent);

                // Injetar Personalização (Zonas de Upload/Texto)
                this.renderCategoryCustomizations(cat, groupContent);

                // Injetar Extras (se houver)
                this.renderCategoryExtras(cat, groupContent);

                group.appendChild(groupContent);
                container.appendChild(group);
            });

            // 5. Formulário Final (Observações, Telefone, Termos)
            if (typeof window.renderFinalForm === 'function') {
                const finalForm = window.renderFinalForm();
                container.appendChild(finalForm);
                this.syncFinalForm(finalForm);
            }

        } catch (e) {
            console.error("❌ Critical Render Error (BaseSimulator):", e);
            container.innerHTML = `<div style="color:red;padding:20px;background:#fee;border:1px solid red;border-radius:4px;">Erro ao renderizar simulador: ${e.message}</div>`;
        }
    }

    renderCategoryParts(cat, container) {
        if (!window.DATA.parts) return;
        const catParts = window.DATA.parts.filter(p => p.category === cat.id);

        catParts.forEach(p => {
            const r = document.createElement('div');
            r.className = 'control-item';

            const label = document.createElement('label');
            label.className = 'control-label';
            label.innerText = p.name.toUpperCase();
            r.appendChild(label);

            if (window.UIComponents?.createColorPicker) {
                const available = (window.CONFIG?.colors || window.DATA?.colors || []);
                const curId = this.state.parts[p.id] || p.defaultColor;

                r.appendChild(window.UIComponents.createColorPicker(available, curId, (id) => {
                    this.state.parts[p.id] = id;
                    this.onStateUpdate();
                }, { className: 'inline-picker' }));
            }
            container.appendChild(r);
        });
    }

    renderCategorySections(cat, container) {
        // Obsolete: legacy mapping handled in main render loop now
    }

    renderCategoryExtras(cat, container) {
        if (!window.DATA.extras) return;
        window.DATA.extras.filter(e => e.category === cat.id).forEach(e => {
            if (typeof window.renderExtraControl === 'function') {
                const ctrl = window.renderExtraControl(e);
                if (ctrl) {
                    const r = document.createElement('div');
                    r.className = 'control-item';
                    r.appendChild(ctrl);
                    container.appendChild(r);
                }
            }
        });
    }

    renderCategoryCustomizations(cat, container) {
        const catId = (cat.id || '').toLowerCase();
        const catName = (cat.name || '').toLowerCase();

        // Match "Personalizacao" or "Personalização" (with or without accent, case insensitive)
        const isPersonalization = catId.includes('personalizacao') || catName.includes('personaliza') || catName.includes('personalizacao');
        if (!isPersonalization) return;

        const uploadZones = this.provideCustomCategoryZones?.('upload') || window.DATA?.uploadZones || (window.DATA?.zones ? Object.values(window.DATA.zones) : []);
        const textZones = this.provideCustomCategoryZones?.('text') || window.DATA?.textZones || (window.DATA?.textZones || []);

        uploadZones.forEach(u => {
            if (u.id.endsWith('_ii')) return;

            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'zone-control';

            // 1. Title
            const zonePrice = (typeof window.getZonePrice === 'function') ? window.getZonePrice(u.id, 'image') : 0;
            let titleText = u.name;
            if (zonePrice > 0) titleText += ` <span style="color:#00b4d8;">(+R$ ${zonePrice.toFixed(2)})</span>`;

            const infoI = (typeof window.InfoSystem !== 'undefined') ? window.InfoSystem.getIconHTML('info_perna_centro') : '';
            zoneDiv.innerHTML = `<div class="zone-title">${titleText} ${infoI}</div>`;

            // 2. Upload
            if (window.UIComponents?.createImageUploader) {
                const el = this.state.elements?.[u.id]?.[0];
                const uploader = window.UIComponents.createImageUploader({
                    zone: u,
                    uploadState: {
                        src: el?.src,
                        filename: el?.dataset.filename || 'Imagem',
                        isCustom: el?.dataset.isCustom === 'true',
                        scale: el?.dataset.scale ? parseFloat(el.dataset.scale) : 1.0
                    },
                    limitEnabled: this.state.zoneLimits?.[u.id] !== false,
                    config: window.CONFIG || {},
                    callbacks: {
                        onUpload: (zid, file) => { if (window.handleImageUpload) window.handleImageUpload({ target: { files: [file] } }, zid); },
                        onRemove: (zid) => { if (window.removeZoneElements) window.removeZoneElements(zid); },
                        onToggleLimit: (zid, val) => { if (this.state.zoneLimits) this.state.zoneLimits[zid] = val; this.onStateUpdate(); },
                        onScale: (zid, val) => {
                            if (this.state.elements?.[zid]?.[0]) {
                                const imgEl = this.state.elements[zid][0];
                                imgEl.style.transform = `translate(-50%, -50%) scale(${val})`;
                                imgEl.dataset.scale = val;

                                if (!this.state.uploads) this.state.uploads = {};
                                if (!this.state.uploads[zid]) this.state.uploads[zid] = {};
                                this.state.uploads[zid].scale = val;
                                this.saveState();
                            }
                        },
                        openGallery: (zid) => { if (window.openGallery) window.openGallery(zid); }
                    }
                });
                zoneDiv.appendChild(uploader);
            }

            // 3. Text Editor
            const relatedText = textZones.find(t => t.parentZone === u.id || t.id === 'text_' + u.id);
            if (relatedText && window.UIComponents?.createTextEditor) {
                if (!this.state.texts?.[relatedText.id]) {
                    if (!this.state.texts) this.state.texts = {};
                    this.state.texts[relatedText.id] = { enabled: false, content: '', fontFamily: 'Outfit', color: '#000000', scale: 1.0 };
                }
                const tState = this.state.texts[relatedText.id];
                const textEditor = window.UIComponents.createTextEditor({
                    zone: relatedText,
                    textState: tState,
                    config: this.state.config || window.CONFIG || {},
                    fonts: window.CONFIG?.fonts || window.DATA?.fonts || [],
                    colors: window.DATA?.colors || [],
                    callbacks: {
                        onToggle: (zid, val) => {
                            tState.enabled = val;
                            if (val && this.state.zoneLimits) this.state.zoneLimits[u.id] = true;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.onStateUpdate();
                        },
                        onTextChange: (zid, val) => {
                            tState.content = val;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.saveState();
                        },
                        onLinesChange: (zid, val) => {
                            tState.maxLines = val;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.saveState();
                        },
                        onFontChange: (zid, val) => {
                            tState.fontFamily = val;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.saveState();
                        },
                        onColorChange: (zid, val) => {
                            tState.color = val;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.saveState();
                        },
                        onScaleChange: (zid, val) => {
                            tState.scale = val;
                            if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                            this.saveState();
                        }
                    }
                });
                zoneDiv.appendChild(textEditor);
            }
            container.appendChild(zoneDiv);
        });
    }

    getCustomSections() { return []; }

    onStateUpdate() {
        if (typeof window.updateVisuals === 'function') window.updateVisuals();
        if (typeof window.updatePrice === 'function') window.updatePrice();
        this.saveState();
        this.render();
    }

    syncFinalForm(container) {
        const phoneInput = container.querySelector('#phone-input');
        const obsInput = container.querySelector('#obs-input');
        const termsCheckbox = container.querySelector('#terms-checkbox');

        if (phoneInput) {
            phoneInput.value = this.state.phone || '';
            phoneInput.oninput = (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 11) val = val.slice(0, 11);
                let formatted = val;
                if (val.length > 2) formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                if (val.length > 7) formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                e.target.value = formatted;
                this.state.phone = formatted;
                if (typeof window.saveState === 'function') window.saveState();
            };
        }

        if (obsInput) {
            obsInput.value = this.state.observations || '';
            obsInput.oninput = (e) => {
                this.state.observations = e.target.value;
                if (typeof window.saveState === 'function') window.saveState();
            };
        }

        if (termsCheckbox) {
            termsCheckbox.checked = !!this.state.termsAccepted;
            termsCheckbox.onchange = (e) => {
                const val = e.target.checked;
                this.state.termsAccepted = val;
                if (window.state) window.state.termsAccepted = val;
                if (typeof window.saveState === 'function') window.saveState();
            };
        }
    }

    renderHeader() {
        if (!this.state.simulationId) {
            const pref = this.config.prefix || 'GEN';
            this.state.simulationId = `HNT-${pref}-${Date.now().toString().slice(-6)}`;
        }
        const headerRow = document.createElement('div');
        headerRow.className = 'simulator-header-row';
        headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #333;';

        headerRow.innerHTML = `
            <div style="display:flex;align-items:center;gap:5px;">
                <span style="color:#aaa;font-size:0.8rem;">PEDIDO:</span>
                <input type="text" id="order-input-top" value="${this.state.orderNumber || ''}" 
                       onchange="window.state.orderNumber = this.value; if(typeof saveState==='function')saveState();"
                       style="background:#0a0a0a;border:1px solid #444;color:#fff;font-family:'Bebas Neue',sans-serif;font-size:1rem;padding:4px 8px;width:120px;text-align:center;border-radius:4px;"
                       placeholder="000000">
            </div>
            <div style="color:#888;font-size:0.75rem;">ID: ${this.state.simulationId}</div>
        `;
        return headerRow;
    }

    renderActionButtons(isEditing = false) {
        const bar = document.createElement('div');
        bar.className = 'action-bar-top';
        bar.style.cssText = 'display:flex;gap:10px;margin-bottom:20px;';

        const cartBtn = document.createElement('button');
        cartBtn.className = isEditing ? 'btn-modern' : 'btn-action btn-primary-action';
        cartBtn.innerHTML = isEditing ? '✅ SALVAR EDIÇÃO' : '🛒 ADICIONAR AO CARRINHO';
        cartBtn.style.flex = '1';
        if (isEditing) {
            cartBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            cartBtn.style.border = 'none';
        }

        cartBtn.onclick = () => this.handleAddToCart(isEditing);
        bar.appendChild(cartBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn-action';
        clearBtn.innerHTML = 'LIMPAR DADOS';
        clearBtn.style.padding = '0 15px';
        clearBtn.onclick = () => { if (typeof window.resetSimulatorData === 'function') window.resetSimulatorData(); };
        bar.appendChild(clearBtn);

        return bar;
    }

    async handleAddToCart() {
        const currentTerms = this.state.termsAccepted || (window.state && window.state.termsAccepted);
        if (!currentTerms) {
            alert("⚠️ Você precisa aceitar os Termos e Condições para continuar.");
            return;
        }

        const loader = document.createElement('div');
        loader.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:100000;display:flex;justify-content:center;align-items:center;color:white;font-family:sans-serif;">
                <div style="text-align:center;">
                    <div style="width:50px;height:50px;border:5px solid #fff;border-top:5px solid #D4AF37;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
                    <div style="font-size:1.2rem;font-weight:bold;">PROCESSANDO PEDIDO...</div>
                </div>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loader);

        try {
            if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateAndSaveForCart) {
                const pdfUrl = await PDFGenerator.generateAndSaveForCart();
                if (typeof window.saveOrderToHistory === 'function') {
                    await window.saveOrderToHistory(false, pdfUrl);
                    window.location.href = 'IndexPedidoSimulador.html';
                }
            } else {
                alert("Erro: Gerador de PDF não encontrado.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao adicionar ao carrinho: " + e.message);
        } finally {
            loader.remove();
        }
    }

    setupEventListeners() { }
}

window.BaseSimulator = BaseSimulator;

/**
 * BaseSimulator using ES6 Class
 * Centralizes common logic for UI rendering, state management, and cart actions.
 */

class BaseSimulator {
    constructor(config) {
        this.config = config || {};
        this.state = {};
        this.containerId = 'controls-container';
        this.simKey = this.config.storageKey || 'hnt_simulator_state';
    }

    /**
     * Initializes the simulator
     */
    init() {
        this.ensureStandardData();
        this.loadState();

        // Auto-select first category if none active
        if (!this.state.activeCategory && window.DATA?.categories?.length > 0) {
            this.state.activeCategory = window.DATA.categories[0].id;
        }

        this.setupEventListeners();
        this.render();
    }

    /**
     * Ensures DATA.categories and a 'Personalização' category exists
     */
    ensureStandardData() {
        if (!window.DATA) window.DATA = {};

        // 1. Fallback for categories if not defined
        if (!window.DATA.categories) {
            window.DATA.categories = window.CONFIG?.categories || [
                { id: 'Geral', name: 'Geral' }
            ];
        }

        // 2. Always ensure 'Geral' category
        const hasGeral = window.DATA.categories.find(c => c.id === 'Geral' || c.name === 'Geral');
        if (!hasGeral) {
            window.DATA.categories.unshift({ id: 'Geral', name: 'Geral' });
        }

        // 3. Always ensure 'Personalizacao' category
        const hasCustom = window.DATA.categories.find(c =>
            c.id === 'Personalizacao' ||
            c.name === 'Personalização' ||
            c.id === 'Personalização' ||
            c.name === 'Personalizacao'
        );
        if (!hasCustom) {
            window.DATA.categories.push({ id: 'Personalizacao', name: 'Personalização' });
        }
    }

    /**
     * Load state from localStorage or defaults
     */
    loadState() {
        if (typeof window.state !== 'undefined') {
            this.state = window.state;
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        if (typeof window.saveState === 'function') {
            window.saveState();
        } else {
            console.warn('saveState() not implemented globally');
        }
    }

    /**
     * Core Render Method
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const scrollPos = container.scrollTop;
        container.innerHTML = '';

        // 1. Header
        container.appendChild(this.renderHeader());

        // 2. Action Buttons (Top)
        container.appendChild(this.renderActionButtons());

        // 3. Categories Loop (Tabs style content)
        const categories = window.DATA.categories || [];
        categories.forEach(cat => {
            const d = document.createElement('div');
            d.className = 'category-group';
            if (this.state.activeCategory === cat.id) d.classList.add('active');

            // Icon logic
            let iconHtml = '';
            if (typeof window.InfoSystem !== 'undefined') {
                iconHtml = window.InfoSystem.getIconHTML(`info_${cat.id.toLowerCase()}`) || '';
            }

            d.innerHTML = `<div class="category-header" onclick="window.${this.constructor.name}Instance.toggleCategory('${cat.id}')">
                ${cat.name} ${iconHtml}
                <span class="category-toggle-icon">${this.state.activeCategory === cat.id ? '−' : '+'}</span>
            </div>`;

            if (this.state.activeCategory === cat.id) {
                const groupContent = document.createElement('div');
                groupContent.className = 'category-group-content';

                // Custom Hooks (Sizes, Product Specific) - PRIMEIRO
                this.renderCategorySections(cat, groupContent);

                // Parts (Legacy/Colors) - DEPOIS
                this.renderCategoryParts(cat, groupContent);

                // Extras
                this.renderCategoryExtras(cat, groupContent);

                // Personalization (Images/Texts)
                this.renderCategoryCustomizations(cat, groupContent);

                d.appendChild(groupContent);
            }

            container.appendChild(d);
        });

        // Restore scroll
        container.scrollTop = scrollPos;
    }

    toggleCategory(catId) {
        if (this.state.activeCategory === catId) {
            this.state.activeCategory = null;
        } else {
            this.state.activeCategory = catId;
        }
        this.render();
    }

    renderHeader() {
        if (!this.state.simulationId) {
            this.state.simulationId = `HNT-${this.config.prefix || 'GEN'}-${Date.now().toString().slice(-6)}`;
        }
        const headerRow = document.createElement('div');
        headerRow.className = 'simulator-header-row';
        headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #333;';

        headerRow.innerHTML = `
            <div style="display:flex;align-items:center;gap:5px;">
                <span style="color:#aaa;font-size:0.8rem;">PEDIDO:</span>
                <input type="text" value="${this.state.orderNumber || ''}" 
                       onchange="state.orderNumber = this.value; saveState();"
                       style="background:#111;border:1px solid #444;color:#fff;font-family:'Bebas Neue',sans-serif;font-size:1rem;padding:4px 8px;width:120px;text-align:center;border-radius:4px;">
            </div>
            <div style="color:#888;font-size:0.75rem;">ID: ${this.state.simulationId}</div>
        `;
        return headerRow;
    }

    renderActionButtons() {
        const actionBtns = document.createElement('div');
        actionBtns.style.cssText = 'display:flex;gap:10px;margin-bottom:15px;';

        const btnCart = document.createElement('button');
        btnCart.innerText = 'ADICIONAR AO CARRINHO';
        btnCart.className = 'btn-primary btn-cart';
        btnCart.style.flex = '1';
        btnCart.onclick = () => this.handleAddToCart();

        actionBtns.appendChild(btnCart);
        return actionBtns;
    }

    renderCategoryParts(cat, container) {
        if (!window.DATA.parts) return;
        const parts = window.DATA.parts.filter(p => p.category === cat.id && !p.id.includes('hnt'));

        parts.forEach(p => {
            const r = document.createElement('div');
            r.className = 'control-item';

            const curId = this.state.parts?.[p.id];
            const cObj = window.DATA.colors.find(c => c.id === curId);
            const labelText = `${p.name.toUpperCase()}${cObj ? ': ' + cObj.name.toUpperCase() : ''}`;

            r.innerHTML = `<span class="control-label">${labelText}</span>`;

            if (window.UIComponents?.createColorPicker) {
                let available = window.DATA.colors || [];
                if (p.restrictedColors) available = available.filter(c => p.restrictedColors.includes(c.id));

                r.appendChild(window.UIComponents.createColorPicker(available, curId, (id) => {
                    this.state.parts[p.id] = id;
                    this.onStateUpdate();
                }, { className: 'inline-picker' }));
            }
            container.appendChild(r);
        });
    }

    renderCategorySections(cat, container) {
        const sections = this.getCustomSections() || [];
        const catSections = sections.filter(s => s.category === cat.id || s.category === cat.name || (!s.category && cat.id === 'Geral'));

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

            container.appendChild(item);
        });
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
        if (cat.id !== 'Personalizacao' && cat.name !== 'Personalização') return;

        const uploadZones = this.provideCustomCategoryZones?.('upload') || window.DATA?.uploadZones || (window.CONFIG?.zones ? Object.values(window.CONFIG.zones) : []);
        const textZones = this.provideCustomCategoryZones?.('text') || window.DATA?.textZones || (window.CONFIG?.textZones || []);

        console.log(`[BaseSimulator] Rendering customizations for ${cat.id}. Found ${uploadZones.length} upload zones and ${textZones.length} text zones.`);

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
                        scale: el?.style.width ? (parseFloat(el.style.width) / (u.width || 20)) : 1.0
                    },
                    limitEnabled: this.state.zoneLimits?.[u.id] !== false,
                    config: window.CONFIG || {},
                    callbacks: {
                        onUpload: (zid, file) => { if (window.handleImageUpload) window.handleImageUpload({ target: { files: [file] } }, zid); },
                        onRemove: (zid) => { if (window.removeZoneElements) window.removeZoneElements(zid); },
                        onToggleLimit: (zid, val) => { if (this.state.zoneLimits) this.state.zoneLimits[zid] = val; this.onStateUpdate(); },
                        onScale: (zid, val) => {
                            if (this.state.elements?.[zid]?.[0]) {
                                const baseW = u.width || (u.xMax - u.xMin) || 20;
                                this.state.elements[zid][0].style.width = (baseW * val) + '%';
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
                            if (val \u0026\u0026 this.state.zoneLimits) this.state.zoneLimits[u.id] = true;
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

    async handleAddToCart() {
    if (!this.state.termsAccepted) {
        alert("⚠️ Aceite os Termos para continuar.");
        return;
    }
    if (typeof window.saveOrderToHistory === 'function') {
        if (window.saveOrderToHistory()) {
            if (confirm('✅ Adicionado ao carrinho! Ir para pedidos?')) window.location.href = 'IndexPedidoSimulador.html';
        }
    }
}

setupEventListeners() { }
}

window.BaseSimulator = BaseSimulator;

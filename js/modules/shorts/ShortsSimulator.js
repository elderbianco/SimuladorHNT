/**
 * ShortsSimulator Class
 * Extends BaseSimulator.
 */

class ShortsSimulator extends BaseSimulator {
    constructor() {
        super({
            prefix: 'SH',
            storageKey: 'hnt_shorts_state'
        });
    }

    getCustomSections() {
        const sections = [];

        // 1. Sizes
        sections.push({
            id: 'tamanhos',
            label: 'Tamanhos',
            type: 'size',
            category: 'Geral',
            sizes: window.CONFIG.sizes,
            selectedSizes: this.state.sizes,
            onUpdate: (label, newVal) => {
                this.state.sizes[label] = newVal;
                this.onStateUpdate();
            }
        });

        // 2. Waistband (Cós)
        if (window.DATA.parts) {
            const cosPart = window.DATA.parts.find(p => p.id === 'cos');
            if (cosPart) {
                sections.push({
                    id: 'cos',
                    label: 'Cor do Cós',
                    type: 'color',
                    category: 'Geral',
                    colors: this.state.availableColors || window.DATA.colors,
                    selectedColor: this.state.parts['cos'],
                    onSelect: (cId) => {
                        this.state.parts['cos'] = cId;
                        this.onStateUpdate();
                    }
                });
            }
        }

        return sections;
    }

    /**
     * Shorts has specific unlockable logic for customization.
     * We'll implement it within the standard category customization flow.
     */
    renderCategoryCustomizations(cat, container) {
        if (cat.id !== 'Personalizacao' && cat.name !== 'Personalização') return;

        const uploadZones = window.DATA?.uploadZones || [];
        const textZones = window.DATA?.textZones || [];

        uploadZones.forEach(u => {
            if (u.id.endsWith('_ii')) return;

            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'zone-control';

            // 1. Check Unlock Logic (Shorts specific)
            if (u.requiresUnlock) {
                const header = document.createElement('div');
                header.className = 'zone-header-flex';
                header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';

                const titleText = u.name;
                const zid = u.id;
                const isUnlocked = !!this.state.uploads?.[zid]?.unlocked;

                header.innerHTML = `<span class="zone-name">${titleText}</span>`;

                // Toggle Switch
                if (window.UIComponents?.createToggle) {
                    const toggle = window.UIComponents.createToggle(isUnlocked, (val) => {
                        if (!this.state.uploads[zid]) this.state.uploads[zid] = { unlocked: false, src: null };
                        this.state.uploads[zid].unlocked = val;
                        if (!val) {
                            this.state.uploads[zid].src = null;
                            if (this.state.limits) this.state.limits[zid] = false;
                        }
                        this.onStateUpdate();
                    });
                    header.appendChild(toggle);
                }
                zoneDiv.appendChild(header);

                if (!isUnlocked) {
                    container.appendChild(zoneDiv);
                    return;
                }
            } else {
                // Standard Title
                const zonePrice = (typeof window.getZonePrice === 'function') ? window.getZonePrice(u.id, 'image') : 0;
                let titleText = u.name;
                if (zonePrice > 0) titleText += ` <span style="color:#00b4d8;">(+R$ ${zonePrice.toFixed(2)})</span>`;
                zoneDiv.innerHTML = `<div class="zone-title">${titleText}</div>`;
            }

            // 2. Upload
            if (window.UIComponents?.createImageUploader) {
                const el = this.state.elements?.[u.id]?.[0];
                const uploader = window.UIComponents.createImageUploader({
                    zone: u,
                    uploadState: {
                        src: el?.src || this.state.uploads?.[u.id]?.src,
                        filename: el?.dataset.filename || this.state.uploads?.[u.id]?.filename || 'Imagem',
                        isCustom: el?.dataset.isCustom === 'true' || this.state.uploads?.[u.id]?.isCustom === true,
                        scale: el?.dataset.scale ? parseFloat(el.dataset.scale) : 1.0
                    },
                    limitEnabled: this.state.zoneLimits?.[u.id] === true,
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

                                // Sync to uploads state
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
            let potentialTextId = 'text_' + u.id;
            if (u.id.startsWith('leg_')) potentialTextId = 'text_' + u.id.replace('_ie', '').replace('_ii', '');

            const relatedText = textZones.find(t => t.id === potentialTextId);
            if (relatedText && window.UIComponents?.createTextEditor) {
                if (!this.state.texts?.[relatedText.id]) {
                    if (!this.state.texts) this.state.texts = {};
                    this.state.texts[relatedText.id] = { enabled: false, content: '', fontFamily: 'Outfit', color: '#000000', scale: 1.0 };
                }
                const tState = this.state.texts[relatedText.id];
                const textEditor = window.UIComponents.createTextEditor({
                    zoneId: relatedText.id,
                    zoneName: relatedText.name,
                    parentZoneId: u.id,
                    textObject: tState,
                    price: (typeof window.getZonePrice === 'function') ? window.getZonePrice(u.id, 'text') : 0,
                    fonts: window.CONFIG?.fonts || window.DATA?.fonts || [],
                    colors: window.DATA?.colors || [],
                    onUpdate: (field, val) => {
                        tState[field] = val;
                        if (field === 'enabled' && val && this.state.zoneLimits) this.state.zoneLimits[u.id] = true;
                        if (typeof window.renderFixedTexts === 'function') window.renderFixedTexts();
                        this.onStateUpdate();
                    }
                });
                zoneDiv.appendChild(textEditor);
            }

            container.appendChild(zoneDiv);
        });
    }
}

window.ShortsSimulatorInstance = new ShortsSimulator();
window.renderControls = () => window.ShortsSimulatorInstance.render();

const originalInitShorts = window.init;
window.init = async function () {
    if (originalInitShorts) await originalInitShorts();
    window.ShortsSimulatorInstance.init();
};

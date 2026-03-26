/**
 * MoletomSimulator Class
 * Extends BaseSimulator.
 */

class MoletomSimulator extends BaseSimulator {
    constructor() {
        super({
            prefix: 'MO',
            storageKey: 'hnt_moletom_state'
        });
    }

    getCustomSections() {
        const sections = [];

        // 1. Sizes
        sections.push({
            id: 'tamanhos',
            label: '',
            type: 'size',
            category: 'Geral',
            sizes: (window.DATA || window.CONFIG)?.sizes,
            selectedSizes: this.state.sizes,
            onUpdate: (label, newVal) => {
                this.state.sizes[label] = newVal;
                this.onStateUpdate();
            }
        });

        // 2. Color
        const availableColors = (window.DATA || window.CONFIG)?.colors || [];
        const cObj = availableColors.find(c => c.id === this.state.color);
        sections.push({
            id: 'cor_principal',
            label: `COR DO MOLETOM: ${cObj ? cObj.name.toUpperCase() : ''}`,
            type: 'color',
            category: 'Geral',
            colors: availableColors,
            selectedColor: this.state.color,
            onSelect: (newId) => {
                this.state.color = newId;
                if (typeof window.setColor === 'function') window.setColor(newId);
                else this.onStateUpdate();
            }
        });

        // 3. HNT Logo
        sections.push({
            id: 'logo_hnt',
            label: 'LOGO HNT',
            type: 'color',
            category: 'Geral',
            colors: [
                { id: 'preto', name: 'PRETO', hex: '#000000' },
                { id: 'branco', name: 'BRANCO', hex: '#FFFFFF' }
            ],
            selectedColor: this.state.hntLogoColor || 'preto',
            onSelect: (newId) => {
                this.state.hntLogoColor = newId;
                if (typeof window.updateHntLayer === 'function') window.updateHntLayer();
                else this.onStateUpdate();
            }
        });

        return sections;
    }

    provideCustomCategoryZones(type) {
        let zones = (type === 'upload') ? (window.DATA?.uploadZones || (window.DATA?.zones ? Object.values(window.DATA.zones) : null)) : window.DATA?.textZones;
        if (!zones) return undefined;
        // Ensure all zones map to 'Personalizacao' for Moletom
        return zones.map(z => ({
            ...z,
            category: 'Personalizacao'
        }));
    }
}

window.MoletomSimulatorInstance = new MoletomSimulator();

// Redefine renderControls to be state-aware
window.renderControls = () => {
    if (window.MoletomSimulatorInstance) {
        if (!window.MoletomSimulatorInstance.isInitialized) {
            console.log("🔄 [Moletom] renderControls triggered auto-init");
            window.MoletomSimulatorInstance.init();
        } else {
            window.MoletomSimulatorInstance.render();
        }
    }
};

// Also keep the init wrapper as a second entry point
(function () {
    const check = setInterval(() => {
        if (typeof window.init === 'function') {
            const oldInit = window.init;
            window.init = async function () {
                await oldInit();
                console.log("🚀 [Moletom] Global init() wrapper calling Instance.init()");
                if (window.MoletomSimulatorInstance && !window.MoletomSimulatorInstance.isInitialized) {
                    window.MoletomSimulatorInstance.init();
                }
            };
            clearInterval(check);
        }
    }, 100);
    setTimeout(() => clearInterval(check), 5000);
})();

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
            label: '', // Empty label to avoid duplication with SizeSelector's internal header
            type: 'size',
            category: 'Geral',
            sizes: (window.MOLETOM_DATA || window.DATA)?.sizes,
            selectedSizes: this.state.sizes,
            onUpdate: (label, newVal) => {
                this.state.sizes[label] = newVal;
                this.onStateUpdate();
            }
        });

        // 2. Color
        const availableColors = (window.MOLETOM_DATA || window.DATA)?.colors || [];
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
            selectedColor: this.state.logoPunho ? this.state.logoPunho.color : 'preto',
            onSelect: (newId) => {
                if (!this.state.logoPunho) this.state.logoPunho = { enabled: true, color: 'preto' };
                this.state.logoPunho.color = newId;
                if (typeof window.updateLogoPunho === 'function') window.updateLogoPunho();
                else this.onStateUpdate();
            }
        });


        return sections;
    }

    provideCustomCategoryZones(type) {
        let zones = (type === 'upload') ? (window.DATA?.uploadZones || (window.DATA?.zones ? Object.values(window.DATA.zones) : null)) : window.DATA?.textZones;
        if (!zones) return undefined;
        return zones.map(z => ({
            ...z,
            category: z.category || 'Personalizacao'
        }));
    }
}

window.MoletomSimulatorInstance = new MoletomSimulator();
window.renderControls = () => window.MoletomSimulatorInstance.render();

// Robust init wrapper
(function () {
    const check = setInterval(() => {
        if (typeof window.init === 'function') {
            const oldInit = window.init;
            window.init = async function () {
                await oldInit();
                if (window.MoletomSimulatorInstance) window.MoletomSimulatorInstance.init();
            };
            clearInterval(check);
        }
    }, 100);
    // Safety timeout
    setTimeout(() => clearInterval(check), 2000);
})();

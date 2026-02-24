/**
 * ShortsLeggingSimulator Class
 * Extends BaseSimulator.
 */

class ShortsLeggingSimulator extends BaseSimulator {
    constructor() {
        super({
            prefix: 'SL',
            storageKey: 'hnt_shorts_legging_state'
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
            sizes: window.DATA.sizes,
            selectedSizes: this.state.sizes,
            onUpdate: (label, newVal) => {
                this.state.sizes[label] = newVal;
                this.onStateUpdate();
            }
        });

        // 2. Main Color
        const cObj = window.DATA.colors.find(c => c.id === this.state.color);
        sections.push({
            id: 'cor_principal',
            label: `COR DO SHORTS: ${cObj ? cObj.name.toUpperCase() : ''}`,
            type: 'color',
            category: 'Geral',
            colors: window.DATA.colors,
            selectedColor: this.state.color,
            onSelect: (newId) => {
                this.state.color = newId;
                if (typeof window.setColor === 'function') window.setColor(newId);
                else this.onStateUpdate();
            }
        });

        // 3. Logo HNT
        sections.push({
            id: 'logo_hnt',
            label: 'Logo Hanuthai',
            type: 'color',
            category: 'Personalizacao',
            colors: window.DATA.colors,
            selectedColor: this.state.logoColor || 'branco',
            onSelect: (newId) => {
                this.state.logoColor = newId;
                if (typeof window.setLogoColor === 'function') window.setLogoColor(newId);
                else this.onStateUpdate();
            }
        });

        return sections;
    }

    provideCustomCategoryZones(type) {
        const zones = (type === 'upload') ? window.DATA?.uploadZones : window.DATA?.textZones;
        if (!zones) return [];
        return zones.map(z => ({
            ...z,
            category: z.category || 'Personalizacao'
        }));
    }
}

window.ShortsLeggingSimulatorInstance = new ShortsLeggingSimulator();
window.renderControls = () => window.ShortsLeggingSimulatorInstance.render();

const originalInitShortsLegging = window.init;
window.init = async function () {
    if (originalInitShortsLegging) await originalInitShortsLegging();
    window.ShortsLeggingSimulatorInstance.init();
};

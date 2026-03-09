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
            sizes: CONFIG.sizes, // Use CONFIG.sizes to match pricing logic
            selectedSizes: this.state.sizes,
            onUpdate: (label, newVal) => {
                this.state.sizes[label] = newVal;
                this.onStateUpdate();
            }
        });

        // 2. Main Color
        const cObj = CONFIG.colors.find(c => c.id === this.state.color);
        sections.push({
            id: 'cor_principal',
            label: `COR DO SHORTS: ${cObj ? cObj.name.toUpperCase() : ''}`,
            type: 'color',
            category: 'Geral',
            colors: CONFIG.colors, // Use CONFIG.colors
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
            colors: HNT_LOGO_COLORS, // Use appropriate colors
            selectedColor: this.state.hntLogoColor || 'preto',
            onSelect: (newId) => {
                this.state.hntLogoColor = newId;
                if (typeof window.updateHntLayer === 'function') window.updateHntLayer();
                this.onStateUpdate();
                this.render(); // Re-render to update contrast titles/opacity
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

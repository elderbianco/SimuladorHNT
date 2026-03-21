/**
 * TopSimulator Class
 * Extends BaseSimulator.
 */

class TopSimulator extends BaseSimulator {
    constructor() {
        super({
            prefix: 'TP',
            storageKey: 'hnt_top_state'
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

        // 2. Main Color
        const cObj = window.CONFIG.colors.find(c => c.id === this.state.color);
        sections.push({
            id: 'cor_principal',
            label: `COR DO TOP: ${cObj ? cObj.name.toUpperCase() : ''}`,
            type: 'color',
            category: 'Geral',
            colors: this.state.availableColors || window.CONFIG.colors,
            selectedColor: this.state.color,
            onSelect: (newId) => {
                this.state.color = newId;
                if (typeof window.setColor === 'function') window.setColor(newId);
                else this.onStateUpdate();
            }
        });

        // 3. Viés / Barra
        sections.push({
            id: 'vies',
            label: 'Cor do Viés / Barra',
            type: 'color',
            category: 'Personalizacao',
            colors: window.HNT_LOGO_COLORS,
            selectedColor: this.state.hntBarraColor || 'branco',
            onSelect: (newId) => {
                this.state.hntBarraColor = newId;
                if (typeof window.updateHntLayer === 'function') window.updateHntLayer();
                this.onStateUpdate();
            }
        });

        return sections;
    }

    provideCustomCategoryZones(type) {
        if (type === 'upload') {
            return Object.values(window.CONFIG.zones).map(z => ({
                ...z,
                category: 'Personalizacao'
            }));
        }
        if (type === 'text') {
            return window.CONFIG.textZones.map(t => ({
                ...t,
                category: 'Personalizacao'
            }));
        }
        return [];
    }
}

window.TopSimulatorInstance = new TopSimulator();
window.renderControls = () => window.TopSimulatorInstance.render();

const originalInitTop = window.init;
window.init = async function () {
    if (originalInitTop) await originalInitTop();
    window.TopSimulatorInstance.init();
};

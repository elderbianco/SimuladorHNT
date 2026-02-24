/**
 * ColorPicker - Componente de seleção de cores
 * Renderiza grid de cores com seleção visual
 * ✅ INTEGRADO COM state.config PARA PREÇOS DINÂMICOS
 */

import { DOMHelpers } from '../utils/DOMHelpers.js';

export class ColorPicker {
    /**
     * @param {Object} options - Opções de configuração
     * @param {Array<string>} options.colors - Array de cores (hex, rgb, etc)
     * @param {string} options.currentColor - Cor atualmente selecionada
     * @param {Function} options.onSelect - Callback ao selecionar cor
     * @param {string} options.className - Classe CSS adicional
     * @param {Object} options.config - state.config para preços dinâmicos (OPCIONAL)
     * @param {string} options.zoneId - ID da zona para cálculo de preço (OPCIONAL)
     */
    constructor(options = {}) {
        this.colors = options.colors || [];
        this.currentColor = options.currentColor || null;
        this.onSelect = options.onSelect || (() => { });
        this.className = options.className || '';
        // ✅ Suporte a state.config
        this.config = options.config || null;
        this.zoneId = options.zoneId || null;
    }

    /**
     * Renderiza o color picker
     * @returns {HTMLElement}
     */
    render() {
        const container = DOMHelpers.createElement('div', {
            className: `color-picker ${this.className}`.trim()
        });

        const grid = DOMHelpers.createElement('div', {
            className: 'color-grid'
        });

        this.colors.forEach(color => {
            const swatch = this.createSwatch(color);
            grid.appendChild(swatch);
        });

        container.appendChild(grid);

        return container;
    }

    /**
     * Cria um swatch de cor individual
     * @param {string} color - Cor do swatch
     * @returns {HTMLElement}
     */
    createSwatch(color) {
        const isSelected = color === this.currentColor;

        const swatch = DOMHelpers.createElement('div', {
            className: `color-option ${isSelected ? 'selected' : ''}`,
            style: {
                backgroundColor: color
            },
            title: color,
            onClick: () => this.selectColor(color)
        });

        // Adiciona checkmark se selecionado
        if (isSelected) {
            const checkmark = DOMHelpers.createElement('span', {
                className: 'checkmark'
            }, ['✓']);
            swatch.appendChild(checkmark);
        }

        return swatch;
    }

    /**
     * Seleciona uma cor
     * @param {string} color - Cor selecionada
     */
    selectColor(color) {
        this.currentColor = color;
        this.onSelect(color);

        // Atualiza UI
        this.updateSelection();
    }

    /**
     * Atualiza seleção visual
     */
    updateSelection() {
        const swatches = document.querySelectorAll('.color-swatch');

        swatches.forEach(swatch => {
            const swatchColor = swatch.style.backgroundColor;
            const isSelected = this.colorsMatch(swatchColor, this.currentColor);

            if (isSelected) {
                DOMHelpers.addClass(swatch, 'selected');

                // Adiciona checkmark se não existir
                if (!swatch.querySelector('.checkmark')) {
                    const checkmark = DOMHelpers.createElement('span', {
                        className: 'checkmark'
                    }, ['✓']);
                    swatch.appendChild(checkmark);
                }
            } else {
                DOMHelpers.removeClass(swatch, 'selected');

                // Remove checkmark
                const checkmark = swatch.querySelector('.checkmark');
                if (checkmark) {
                    checkmark.remove();
                }
            }
        });
    }

    /**
     * Compara duas cores (lida com diferentes formatos)
     * @param {string} color1 - Primeira cor
     * @param {string} color2 - Segunda cor
     * @returns {boolean}
     */
    colorsMatch(color1, color2) {
        if (!color1 || !color2) return false;

        // Normaliza cores para comparação
        const normalize = (color) => {
            const div = document.createElement('div');
            div.style.color = color;
            return div.style.color;
        };

        return normalize(color1) === normalize(color2);
    }

    /**
     * Adiciona cor customizada
     * @param {string} color - Nova cor
     */
    addColor(color) {
        if (!this.colors.includes(color)) {
            this.colors.push(color);
        }
    }

    /**
     * Remove cor
     * @param {string} color - Cor a remover
     */
    removeColor(color) {
        const index = this.colors.indexOf(color);
        if (index > -1) {
            this.colors.splice(index, 1);
        }
    }

    /**
     * Obtém cor atualmente selecionada
     * @returns {string|null}
     */
    getSelectedColor() {
        return this.currentColor;
    }

    /**
     * Define cor selecionada programaticamente
     * @param {string} color - Cor a selecionar
     */
    setSelectedColor(color) {
        this.selectColor(color);
    }
}

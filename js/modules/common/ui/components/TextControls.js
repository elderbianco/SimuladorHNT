/**
 * TextControls - Componente de controles de texto
 * Gerencia personalização de texto (fonte, cor, tamanho, posição)
 * ✅ INTEGRADO COM state.config PARA PREÇOS DINÂMICOS
 */

import { DOMHelpers } from '../utils/DOMHelpers.js';
import { ColorPicker } from './ColorPicker.js';

export class TextControls {
    /**
     * @param {Object} options - Opções de configuração
     * @param {string} options.zoneId - ID da zona de texto
     * @param {Array<string>} options.fonts - Fontes disponíveis
     * @param {Array<string>} options.colors - Cores disponíveis
     * @param {Object} options.currentValues - Valores atuais {text, font, color, size}
     * @param {Function} options.onChange - Callback ao mudar valores
     * @param {Object} options.config - state.config para preços dinâmicos (OPCIONAL)
     * @param {Function} options.getPriceFunction - Função getZonePrice (OPCIONAL)
     */
    constructor(options = {}) {
        this.zoneId = options.zoneId || 'default';
        this.fonts = options.fonts || ['Arial', 'Helvetica', 'Times New Roman'];
        this.colors = options.colors || ['#000000', '#FFFFFF', '#FF0000'];
        this.currentValues = options.currentValues || {
            text: '',
            font: this.fonts[0],
            color: this.colors[0],
            size: 16
        };
        this.onChange = options.onChange || (() => { });
        // ✅ Suporte a state.config
        this.config = options.config || null;
        this.getPriceFunction = options.getPriceFunction || null;
    }

    /**
     * Renderiza os controles de texto
     * @returns {HTMLElement}
     */
    render() {
        const container = DOMHelpers.createElement('div', {
            className: 'text-controls',
            'data-zone': this.zoneId
        });

        // Texto
        const textInput = this.renderTextInput();
        container.appendChild(textInput);

        // Fonte
        const fontSelect = this.renderFontSelect();
        container.appendChild(fontSelect);

        // Cor
        const colorPicker = this.renderColorPicker();
        container.appendChild(colorPicker);

        // Tamanho
        const sizeControl = this.renderSizeControl();
        container.appendChild(sizeControl);

        return container;
    }

    /**
     * Renderiza input de texto
     * @returns {HTMLElement}
     */
    renderTextInput() {
        const group = DOMHelpers.createElement('div', {
            className: 'control-group'
        });

        const label = DOMHelpers.createElement('label', {}, ['Texto:']);

        const input = DOMHelpers.createElement('input', {
            type: 'text',
            className: 'text-input',
            value: this.currentValues.text,
            placeholder: 'Digite o texto...',
            onInput: (e) => this.updateValue('text', e.target.value)
        });

        group.appendChild(label);
        group.appendChild(input);

        return group;
    }

    /**
     * Renderiza seletor de fonte
     * @returns {HTMLElement}
     */
    renderFontSelect() {
        const group = DOMHelpers.createElement('div', {
            className: 'control-group'
        });

        const label = DOMHelpers.createElement('label', {}, ['Fonte:']);

        const select = DOMHelpers.createElement('select', {
            className: 'font-select',
            onchange: (e) => this.updateValue('font', e.target.value)
        });

        this.fonts.forEach(font => {
            const option = DOMHelpers.createElement('option', {
                value: font,
                selected: font === this.currentValues.font
            }, [font]);

            select.appendChild(option);
        });

        group.appendChild(label);
        group.appendChild(select);

        return group;
    }

    /**
     * Renderiza seletor de cor
     * @returns {HTMLElement}
     */
    renderColorPicker() {
        const group = DOMHelpers.createElement('div', {
            className: 'control-group'
        });

        const label = DOMHelpers.createElement('label', {}, ['Cor:']);

        const picker = new ColorPicker({
            colors: this.colors,
            currentColor: this.currentValues.color,
            config: this.config,  // ✅ Passa config
            zoneId: this.zoneId,
            onSelect: (color) => this.updateValue('color', color)
        });

        group.appendChild(label);
        group.appendChild(picker.render());

        return group;
    }

    /**
     * Renderiza controle de tamanho
     * @returns {HTMLElement}
     */
    renderSizeControl() {
        const group = DOMHelpers.createElement('div', {
            className: 'control-group'
        });

        const label = DOMHelpers.createElement('label', {}, ['Tamanho:']);

        const sizeContainer = DOMHelpers.createElement('div', {
            className: 'size-control'
        });

        const slider = DOMHelpers.createElement('input', {
            type: 'range',
            min: '8',
            max: '72',
            value: this.currentValues.size.toString(),
            className: 'size-slider',
            onInput: (e) => {
                this.updateValue('size', parseInt(e.target.value));
                valueDisplay.textContent = e.target.value + 'px';
            }
        });

        const valueDisplay = DOMHelpers.createElement('span', {
            className: 'size-value'
        }, [this.currentValues.size + 'px']);

        sizeContainer.appendChild(slider);
        sizeContainer.appendChild(valueDisplay);

        group.appendChild(label);
        group.appendChild(sizeContainer);

        return group;
    }

    /**
     * Atualiza um valor
     * @param {string} key - Chave do valor
     * @param {*} value - Novo valor
     */
    updateValue(key, value) {
        this.currentValues[key] = value;

        // ✅ Calcular preço se função disponível
        let price = 0;
        if (this.getPriceFunction && typeof this.getPriceFunction === 'function') {
            price = this.getPriceFunction(this.zoneId, 'text');
        }

        this.onChange({
            zoneId: this.zoneId,
            values: { ...this.currentValues },
            price  // ✅ Inclui preço calculado
        });
    }

    /**
     * Obtém valores atuais
     * @returns {Object}
     */
    getValues() {
        return { ...this.currentValues };
    }

    /**
     * Define valores programaticamente
     * @param {Object} values - Novos valores
     */
    setValues(values) {
        this.currentValues = { ...this.currentValues, ...values };
        this.updateUI();
    }

    /**
     * Atualiza UI com valores atuais
     */
    updateUI() {
        const container = document.querySelector(`.text-controls[data-zone="${this.zoneId}"]`);
        if (!container) return;

        // Atualizar input de texto
        const textInput = container.querySelector('.text-input');
        if (textInput) textInput.value = this.currentValues.text;

        // Atualizar select de fonte
        const fontSelect = container.querySelector('.font-select');
        if (fontSelect) fontSelect.value = this.currentValues.font;

        // Atualizar slider de tamanho
        const sizeSlider = container.querySelector('.size-slider');
        const sizeValue = container.querySelector('.size-value');
        if (sizeSlider) sizeSlider.value = this.currentValues.size;
        if (sizeValue) sizeValue.textContent = this.currentValues.size + 'px';
    }

    /**
     * Limpa todos os valores
     */
    clear() {
        this.currentValues = {
            text: '',
            font: this.fonts[0],
            color: this.colors[0],
            size: 16
        };
        this.updateUI();
        this.onChange({
            zoneId: this.zoneId,
            values: { ...this.currentValues }
        });
    }
}

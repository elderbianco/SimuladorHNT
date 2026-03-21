/**
 * DOMHelpers - Utilitários para manipulação de DOM
 * Simplifica criação e manipulação de elementos HTML
 */

export const DOMHelpers = {
    /**
     * Cria um elemento HTML com atributos e filhos
     * @param {string} tag - Tag HTML (div, button, input, etc)
     * @param {Object} attributes - Atributos do elemento
     * @param {Array} children - Elementos filhos ou strings
     * @returns {HTMLElement}
     */
    createElement(tag, attributes = {}, children = []) {
        const el = document.createElement(tag);

        // Aplicar atributos
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Event listeners (onClick, onInput, etc)
                const eventName = key.substring(2).toLowerCase();
                el.addEventListener(eventName, value);
            } else {
                el.setAttribute(key, value);
            }
        });

        // Adicionar filhos
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                el.appendChild(child);
            }
        });

        return el;
    },

    /**
     * Remove todos os filhos de um elemento
     * @param {HTMLElement} el - Elemento a limpar
     */
    clearElement(el) {
        if (!el) return;
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },

    /**
     * Encontra elemento por ID com validação
     * @param {string} id - ID do elemento
     * @returns {HTMLElement|null}
     */
    getElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`[DOMHelpers] Elemento não encontrado: ${id}`);
        }
        return el;
    },

    /**
     * Encontra elemento por seletor
     * @param {string} selector - Seletor CSS
     * @param {HTMLElement} parent - Elemento pai (opcional)
     * @returns {HTMLElement|null}
     */
    querySelector(selector, parent = document) {
        return parent.querySelector(selector);
    },

    /**
     * Encontra todos os elementos por seletor
     * @param {string} selector - Seletor CSS
     * @param {HTMLElement} parent - Elemento pai (opcional)
     * @returns {NodeList}
     */
    querySelectorAll(selector, parent = document) {
        return parent.querySelectorAll(selector);
    },

    /**
     * Adiciona classe a um elemento
     * @param {HTMLElement} el - Elemento
     * @param {string} className - Nome da classe
     */
    addClass(el, className) {
        if (el) el.classList.add(className);
    },

    /**
     * Remove classe de um elemento
     * @param {HTMLElement} el - Elemento
     * @param {string} className - Nome da classe
     */
    removeClass(el, className) {
        if (el) el.classList.remove(className);
    },

    /**
     * Toggle classe em um elemento
     * @param {HTMLElement} el - Elemento
     * @param {string} className - Nome da classe
     */
    toggleClass(el, className) {
        if (el) el.classList.toggle(className);
    },

    /**
     * Verifica se elemento tem classe
     * @param {HTMLElement} el - Elemento
     * @param {string} className - Nome da classe
     * @returns {boolean}
     */
    hasClass(el, className) {
        return el ? el.classList.contains(className) : false;
    },

    /**
     * Define atributo de um elemento
     * @param {HTMLElement} el - Elemento
     * @param {string} attr - Nome do atributo
     * @param {string} value - Valor do atributo
     */
    setAttribute(el, attr, value) {
        if (el) el.setAttribute(attr, value);
    },

    /**
     * Remove atributo de um elemento
     * @param {HTMLElement} el - Elemento
     * @param {string} attr - Nome do atributo
     */
    removeAttribute(el, attr) {
        if (el) el.removeAttribute(attr);
    },

    /**
     * Mostra elemento
     * @param {HTMLElement} el - Elemento
     */
    show(el) {
        if (el) el.style.display = '';
    },

    /**
     * Esconde elemento
     * @param {HTMLElement} el - Elemento
     */
    hide(el) {
        if (el) el.style.display = 'none';
    }
};

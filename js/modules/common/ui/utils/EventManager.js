/**
 * EventManager - Gerenciamento centralizado de eventos
 * Facilita adicionar, remover e gerenciar event listeners
 */

export class EventManager {
    constructor() {
        this.listeners = new Map();
        this.listenerIdCounter = 0;
    }

    /**
     * Adiciona event listener e retorna ID para remoção posterior
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventType - Tipo de evento (click, input, etc)
     * @param {Function} handler - Função handler
     * @param {Object} options - Opções do addEventListener
     * @returns {number} - ID do listener
     */
    on(element, eventType, handler, options = {}) {
        if (!element || !eventType || !handler) {
            console.warn('[EventManager] Parâmetros inválidos para addEventListener');
            return null;
        }

        const listenerId = ++this.listenerIdCounter;

        element.addEventListener(eventType, handler, options);

        this.listeners.set(listenerId, {
            element,
            eventType,
            handler,
            options
        });

        return listenerId;
    }

    /**
     * Remove event listener por ID
     * @param {number} listenerId - ID retornado por on()
     */
    off(listenerId) {
        const listener = this.listeners.get(listenerId);

        if (listener) {
            listener.element.removeEventListener(
                listener.eventType,
                listener.handler,
                listener.options
            );
            this.listeners.delete(listenerId);
        }
    }

    /**
     * Remove todos os event listeners
     */
    removeAll() {
        this.listeners.forEach((listener, id) => {
            this.off(id);
        });
    }

    /**
     * Adiciona event listener que executa apenas uma vez
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventType - Tipo de evento
     * @param {Function} handler - Função handler
     * @returns {number} - ID do listener
     */
    once(element, eventType, handler) {
        const wrappedHandler = (event) => {
            handler(event);
            this.off(listenerId);
        };

        const listenerId = this.on(element, eventType, wrappedHandler);
        return listenerId;
    }

    /**
     * Adiciona event delegation (útil para elementos dinâmicos)
     * @param {HTMLElement} parent - Elemento pai
     * @param {string} eventType - Tipo de evento
     * @param {string} selector - Seletor CSS dos elementos filhos
     * @param {Function} handler - Função handler
     * @returns {number} - ID do listener
     */
    delegate(parent, eventType, selector, handler) {
        const wrappedHandler = (event) => {
            const target = event.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, event);
            }
        };

        return this.on(parent, eventType, wrappedHandler);
    }

    /**
     * Dispara evento customizado
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventName - Nome do evento
     * @param {*} detail - Dados do evento
     */
    trigger(element, eventName, detail = null) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(event);
    }

    /**
     * Debounce de função (útil para inputs)
     * @param {Function} func - Função a debounce
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} - Função com debounce
     */
    debounce(func, wait = 300) {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle de função (útil para scroll/resize)
     * @param {Function} func - Função a throttle
     * @param {number} limit - Limite de tempo em ms
     * @returns {Function} - Função com throttle
     */
    throttle(func, limit = 100) {
        let inThrottle;

        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Exporta instância singleton
export default new EventManager();

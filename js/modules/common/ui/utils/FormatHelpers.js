/**
 * FormatHelpers - Utilitários para formatação de valores
 * Funções auxiliares para formatação de preços, números, etc
 */

export const FormatHelpers = {
    /**
     * Formata valor como moeda brasileira
     * @param {number} value - Valor a formatar
     * @returns {string} - Valor formatado (ex: "R$ 1.234,56")
     */
    formatCurrency(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    /**
     * Formata número com separadores de milhares
     * @param {number} value - Valor a formatar
     * @param {number} decimals - Casas decimais (padrão: 0)
     * @returns {string} - Número formatado (ex: "1.234")
     */
    formatNumber(value, decimals = 0) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }

        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    /**
     * Formata porcentagem
     * @param {number} value - Valor a formatar (0-1 ou 0-100)
     * @param {boolean} isDecimal - Se o valor está em decimal (0-1)
     * @returns {string} - Porcentagem formatada (ex: "15%")
     */
    formatPercentage(value, isDecimal = false) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }

        if (isDecimal) {
            value *= 100;
        }

        return `${value.toFixed(0)}%`;
    },

    /**
     * Formata tamanho de arquivo
     * @param {number} bytes - Tamanho em bytes
     * @returns {string} - Tamanho formatado (ex: "1.5 MB")
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Formata data
     * @param {Date|string} date - Data a formatar
     * @param {boolean} includeTime - Incluir hora (padrão: false)
     * @returns {string} - Data formatada (ex: "16/02/2024" ou "16/02/2024 13:30")
     */
    formatDate(date, includeTime = false) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        if (isNaN(date.getTime())) {
            return 'Data inválida';
        }

        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    },

    /**
     * Capitaliza primeira letra
     * @param {string} str - String a capitalizar
     * @returns {string} - String capitalizada
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Capitaliza cada palavra
     * @param {string} str - String a capitalizar
     * @returns {string} - String com cada palavra capitalizada
     */
    capitalizeWords(str) {
        if (!str) return '';
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    },

    /**
     * Trunca texto com reticências
     * @param {string} str - String a truncar
     * @param {number} maxLength - Comprimento máximo
     * @returns {string} - String truncada
     */
    truncate(str, maxLength) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    },

    /**
     * Remove acentos de uma string
     * @param {string} str - String com acentos
     * @returns {string} - String sem acentos
     */
    removeAccents(str) {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Gera slug a partir de string
     * @param {string} str - String a converter
     * @returns {string} - Slug (ex: "meu-produto-123")
     */
    slugify(str) {
        if (!str) return '';
        return this.removeAccents(str)
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Formata número de telefone brasileiro
     * @param {string} phone - Telefone (apenas números)
     * @returns {string} - Telefone formatado (ex: "(11) 98765-4321")
     */
    formatPhone(phone) {
        if (!phone) return '';

        // Remove tudo que não é número
        phone = phone.replace(/\D/g, '');

        // Formata conforme tamanho
        if (phone.length === 11) {
            return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
        } else if (phone.length === 10) {
            return `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
        }

        return phone;
    },

    /**
     * Formata CPF
     * @param {string} cpf - CPF (apenas números)
     * @returns {string} - CPF formatado (ex: "123.456.789-00")
     */
    formatCPF(cpf) {
        if (!cpf) return '';

        cpf = cpf.replace(/\D/g, '');

        if (cpf.length === 11) {
            return `${cpf.substring(0, 3)}.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-${cpf.substring(9)}`;
        }

        return cpf;
    },

    /**
     * Formata CNPJ
     * @param {string} cnpj - CNPJ (apenas números)
     * @returns {string} - CNPJ formatado (ex: "12.345.678/0001-00")
     */
    formatCNPJ(cnpj) {
        if (!cnpj) return '';

        cnpj = cnpj.replace(/\D/g, '');

        if (cnpj.length === 14) {
            return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12)}`;
        }

        return cnpj;
    }
};

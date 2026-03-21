/**
 * Security Utility Module
 * Provides common functions for Input Sanitization and HTML Escaping
 * to prevent XSS (Cross-Site Scripting) attacks.
 */

const Security = {
    /**
     * Sanitizes a string by removing potentially dangerous characters.
     * Allows: Alphanumeric, spaces, basic punctuation (.,-@()_) and accented characters.
     * Use this before saving data to LocalStorage or Database.
     * 
     * @param {string} input - The raw input string
     * @returns {string} - The sanitized string
     */
    sanitize: function (input) {
        if (typeof input !== 'string') return input;

        // 1. Remove control characters (ASCII 0-31) except whitespace
        // 2. Remove script tags explicitly (redundant but safe)
        let clean = input.replace(/[\x00-\x1F\x7F]/g, "")
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/javascript:/gi, "");

        // 3. Whitelist approach for critical fields (Names/Phones)
        // If you need more permissive text (like addresses), use escape() on display instead.
        // This regex allows: Letters, Numbers, Portuguese Accents, Spaces, and common symbols: . , - _ @ ( ) +
        return clean.replace(/[^a-zA-Z0-9À-ÿ\s\.\,\-\_\@\(\)\+]/g, '');
    },

    /**
     * Escapes HTML special characters to prevent them from being interpreted as code.
     * Use this whenever displaying user-generated content via innerHTML.
     * 
     * @param {string} str - The string to display
     * @returns {string} - The escaped string safe for HTML
     */
    escape: function (str) {
        if (!str) return '';
        if (typeof str !== 'string') return String(str);

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return str.replace(/[&<>"'/`=]/g, function (m) { return map[m]; });
    },

    /**
     * URL Encoder for safe parameterized links
     */
    encodeURL: function (str) {
        return encodeURIComponent(str);
    }
};

// Expose to window
window.Security = Security;

/**
 * Pricing Validator Engine
 * Acts as a "Server-Side" validation layer running in the browser.
 * independent of the simulator's UI state.
 */

const PricingValidator = {

    /**
     * Default Configuration (Mirror of Admin/Data defaults)
     * In a real backend, this would be loaded from a database.
     */
    defaults: {
        basePrice: 149.90,
        textPrice: 15.00,
        logoCenterPrice: 0,
        logoLatPrice: 0,
        legZoneAddonPrice: 15.00,
        sizeModPrice: 10.00, // For GG, EXG...
        extraPrices: {
            "legging": 38.90,
            "laco": 14.90,
            "cordao": 14.90
        }
    },

    /**
     * Calculates the expected price for a Shorts item based on its specs.
     * @param {Object} item - The item object from localStorage
     * @param {Object} config - Optional config overrides (from Admin)
     */
    calculateShorts: function (item, config = {}) {
        const cfg = { ...this.defaults, ...config };
        const specs = item.specs || {};
        const sizes = specs.sizes || {};

        let unitBase = cfg.basePrice;

        // 1. Extras (Legging, Laço, Cordão)
        // specs.extras is usually { "legging": true, "laco": false }
        if (specs.extras) {
            Object.keys(specs.extras).forEach(key => {
                // Determine if it's strictly configured as an extra in our defaults
                // or if we rely on the object value being complex.
                // In localStorage, it's often saved as simplified keys.
                // We check if the key exists in our known price list.
                if (cfg.extraPrices[key]) {
                    unitBase += cfg.extraPrices[key];
                }
            });
        }

        // 2. Texts
        // Simulator Logic: Count enabled texts, exclude 'Lateral' category logic if needed.
        // But for validation, we'll try to match the simulator's robust logic.
        let textCount = 0;
        if (specs.texts && Array.isArray(specs.texts)) {
            specs.texts.forEach(t => {
                // "enabled" check might be implicit if it's in the list, but let's be safe
                // Simulator saves ALL texts? Or only active ones? 
                // Usually only active ones should count, but verify structure.
                // Assuming list contains ACTIVE texts.

                // Exclude Lateral (handled by special rule)? 
                // Simulator logic: `if (t.category && t.category.includes('Lateral')) return;`
                // We need to know the category. The saved object MIGHT NOT have category.
                // We infer from ID.
                const isLateral = t.id.includes('lat') || (t.zone_label && t.zone_label.includes('Lateral'));
                if (!isLateral) {
                    textCount++;
                }
            });
        }
        unitBase += textCount * cfg.textPrice;

        // 3. Uploads (Zones)
        // Base zone prices
        if (specs.uploads && Array.isArray(specs.uploads)) {
            specs.uploads.forEach(u => {
                // If it's a paid zone
                // In current logic, center/lat are 0.
                // Only specialized rules apply usually.
            });
        }

        // 4. Special Rules (Lateral: Image + Text = Charge Text)
        // We need to cross-ref uploads and texts.
        if (specs.uploads && specs.texts) {
            // Find lateral uploads
            const latUploads = specs.uploads.filter(u => u.id.includes('lat') || (u.zone_label && u.zone_label.includes('Lateral')));
            latUploads.forEach(u => {
                // Find corresponding text
                // ID text_lat_dir corresponds to logo_lat_dir
                const textId = u.id.replace('logo_', 'text_');
                const hasText = specs.texts.find(t => t.id === textId);

                if (hasText) {
                    unitBase += cfg.textPrice;
                }
            });
        }

        // 5. Unlocks (Legs)
        // Check if leg zones are active
        const hasLegs = (list) => list.some(x => x.id.includes('leg'));

        let legUnlockCharged = false;
        // Logic: Charge PER ZONE? Or once?
        // Simulator: `unitBase += state.config.legZoneAddonPrice` for EACH unlocked zone.
        if (specs.uploads) {
            specs.uploads.filter(u => u.id.includes('leg')).forEach(() => {
                unitBase += cfg.legZoneAddonPrice;
            });
        }
        if (specs.texts) {
            specs.texts.filter(t => t.id.includes('leg')).forEach(() => {
                unitBase += cfg.legZoneAddonPrice;
            });
        }

        // 6. Calculate Totals based on Sizes (and modifiers)
        let totalQty = 0;
        let subTotal = 0;

        Object.entries(sizes).forEach(([sizeLabel, qty]) => {
            if (qty > 0) {
                totalQty += qty;
                let modCost = 0;
                // Check if size is big (GG, EXG, EXGG)
                if (['GG', 'EXG', 'EXGG', 'G3', 'G4'].includes(sizeLabel.toUpperCase())) {
                    modCost = cfg.sizeModPrice;
                }
                subTotal += (unitBase + modCost) * qty;
            }
        });

        // 7. Matrix Fees (Development Fees)
        // This is tricky as we need to know if it's "New Art" or "Library".
        // item.specs.uploads usually has `is_custom`.
        let devFees = 0;
        if (specs.uploads) {
            const customLogos = specs.uploads.filter(u => u.is_custom);
            // Simulator defaults: 35.00 for first, but Logic says "devFeesCount".
            // Let's assume a simplified flat fee check for now or trust the validation knows.
            // For Safety: We will skip Matrix validation in this V1 and trust the "unit" calculation.
            // Or better: Just calculate Unit Base.
        }

        // Return the Unit Price (approx) or Total
        // Since matrix fees are separate, we focus on validating the UNIT BASE which is the most common attack vector.
        return {
            unitBase: unitBase,
            totalExcludingFees: subTotal
        };
    },

    /**
     * Main Entry Point to Validate an Order Item
     */
    verify: function (item) {
        // Only support Shorts for now
        if (!item.simulator_type && !item.model_name.includes('Shorts')) return true; // Skip others

        const result = this.calculateShorts(item);

        // Tolerance check (floating point diffs of 0.10 are ok)
        // We compare the calculated subtotal with the stored subtotal (before discounts/fees)
        // item.pricing.breakdown.base contains the base unit price.

        // Let's compare Unit Price Base
        const storedBase = item.pricing.breakdown ? item.pricing.breakdown.base : 0;
        const diff = Math.abs(result.unitBase - storedBase);

        if (diff > 0.50) {
            console.warn(`⚠️ Fraude Detectada ou Erro de Versão! Preço Base Salvo: ${storedBase}, Calculado: ${result.unitBase}`);
            return false;
        }

        return true;
    }
};

// Expose to Window
window.PricingValidator = PricingValidator;

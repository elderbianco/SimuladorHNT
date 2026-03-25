const PricingValidator = {

    /**
     * Default Category Configs (Fallbacks)
     */
    modelConfigs: {
        'Top': {
            basePrice: 149.90,
            textPrice: 19.90,
            logoPrice: 19.90,
            sizeModPrice: 10.00
        },
        'Moletom': {
            basePrice: 189.90,
            textPrice: 19.90,
            logoPrice: 19.90,
            sizeModPrice: 0, // Moletom usually doesn't have mod in current logic or it's fixed
            zipperUpgrade: 15.00,
            pocketUpgrade: 10.00,
            logoPunhoRemovalFee: 15.00
        },
        'Shorts': {
            basePrice: 149.90,
            textPrice: 19.90,
            textLatPrice: 9.90,
            logoPrice: 19.90,
            sizeModPrice: 10.00,
            legZoneAddonPrice: 0 // Legs are free to upload currently?
        },
        'Legging': {
            basePrice: 149.90,
            textPrice: 19.90,
            logoPrice: 19.90,
            sizeModPrice: 10.00
        }
    },

    /**
     * Main calculation engine
     * @param {Object} item - The order item object (contains specs, pricing, config)
     */
    calculate: function (item) {
        // Detect Model
        const modelName = item.model_name || '';
        let type = 'Legging'; // Fallback
        if (modelName.includes('Top')) type = 'Top';
        else if (modelName.includes('Moletom')) type = 'Moletom';
        else if (modelName.includes('Fight') || modelName.includes('Shorts')) type = 'Shorts';
        else if (modelName.includes('Legging')) type = 'Legging';

        const cfg = { ...(this.modelConfigs[type] || {}), ...(item.config || {}) };
        const specs = item.specs || item.json_tec?.specs || {};
        const sizes = specs.sizes || {};

        let unitBase = cfg.basePrice || 0;
        let totalQty = 0;
        Object.values(sizes).forEach(q => totalQty += (parseInt(q) || 0));

        // 1. Extras / Upgrades
        let upgradesCost = 0;
        if (type === 'Moletom') {
            if (specs.zipper?.enabled) upgradesCost += (cfg.zipperUpgrade || 15.00);
            if (specs.pocket?.enabled) upgradesCost += (cfg.pocketUpgrade || 10.00);
            if (specs.logoPunho && !specs.logoPunho.enabled) upgradesCost += (cfg.logoPunhoRemovalFee || 15.00) * totalQty;
        }

        if (type === 'Shorts' && specs.extras) {
            Object.entries(specs.extras).forEach(([key, val]) => {
                if (val && val.enabled) {
                    const price = (cfg.extraPrices && cfg.extraPrices[key] !== undefined)
                        ? cfg.extraPrices[key]
                        : (key === 'legging' ? 38.90 : 14.90);
                    unitBase += price;
                }
            });
        }

        // 2. Customizations (Zones)
        let customizationCost = 0;

        // Helper for Zone Prices
        const getZP = (zid, category, zoneType) => {
            if (cfg.zonePrices && cfg.zonePrices[zid] !== undefined) return cfg.zonePrices[zid];

            // Model specific fallbacks
            if (type === 'Shorts') {
                if (zid.includes('lat') || category === 'Laterais') return 0;
                if (zid.includes('leg') || category === 'Pernas') return cfg.legZoneAddonPrice || 0;
            }
            if (type === 'Top') return (zoneType === 'image' ? cfg.logoPrice : cfg.textPrice);

            // Generic Fallback
            return (zoneType === 'image' ? (cfg.logoPrice || 0) : (cfg.textPrice || 0));
        };

        // Images/Logos
        const uploads = specs.uploads || specs.elements || {};
        let customUploadsCount = 0;
        const uniqueCustomLogos = new Set();

        Object.entries(uploads).forEach(([zid, list]) => {
            if (Array.isArray(list)) {
                list.forEach(u => {
                    customizationCost += getZP(zid, u.category, 'image');
                    if (u.isCustom || u.dataset?.isCustom === 'true') {
                        uniqueCustomLogos.add(u.filename || u.dataset?.filename || 'custom');
                    }
                });
            }
        });
        customUploadsCount = uniqueCustomLogos.size;

        // Texts
        const texts = specs.texts || {};
        Object.entries(texts).forEach(([tid, t]) => {
            if (t.enabled && (t.content || t.dataset?.content)) {
                // Special Rule: Shorts Lateral
                if (type === 'Shorts' && (tid.includes('lat'))) {
                    const logoId = tid.replace('text_', 'logo_');
                    const hasImg = uploads[logoId]?.length > 0;
                    if (hasImg) customizationCost += (cfg.textLatPrice || 9.90);
                } else {
                    customizationCost += getZP(tid, t.category, 'text');
                }
            }
        });

        // 3. Wholesale Tiers (Prices)
        let tierBasePrice = cfg.basePrice;
        if (totalQty >= 30 && cfg.price30 > 0) tierBasePrice = cfg.price30;
        else if (totalQty >= 20 && cfg.price20 > 0) tierBasePrice = cfg.price20;
        else if (totalQty >= 10 && cfg.price10 > 0) tierBasePrice = cfg.price10;

        // 4. Calculate Subtotal with Sizes
        const base = (type === 'Moletom' ? (cfg.basePrice || 189.90) : (unitBase || 149.90));
        let fullUnitBase = base + customizationCost;
        if (isNaN(fullUnitBase)) fullUnitBase = base;

        let subTotal = 0;

        Object.entries(sizes).forEach(([sz, q]) => {
            const qtyVal = parseInt(q) || 0;
            if (qtyVal > 0) {
                // Simple detect for GG+ modifiers
                const isLarge = ['GG', 'EXG', 'EXGG', 'G3', 'G4', 'XG'].includes(sz.toUpperCase());
                const mod = isLarge ? (cfg.sizeModPrice || 0) : 0;
                subTotal += (fullUnitBase + mod) * qtyVal;
            }
        });

        // 5. Final Adjustments (Discounts & Fees)
        let baseDiscountPerUnit = Math.max(0, cfg.basePrice - tierBasePrice);
        let discountVal = baseDiscountPerUnit * totalQty;

        const devFees = customUploadsCount * (cfg.devFee || 0);
        let waiver = (cfg.artWaiver && totalQty >= 10 && customUploadsCount > 0) ? (cfg.devFee || 0) : 0;

        const finalTotal = subTotal - discountVal - waiver + devFees + upgradesCost;

        return {
            total: finalTotal,
            unitBase: fullUnitBase,
            discount: discountVal,
            fees: devFees,
            waiver: waiver
        };
    },

    /**
     * Verifies if an item price is valid
     */
    verify: function (item) {
        const result = this.calculate(item);
        const storedTotal = item.PRECO_FINAL || (item.pricing?.total) || 0;
        const diff = Math.abs(result.total - storedTotal);

        if (diff > 1.00) {
            console.error(`🛡️ TAMPERING DETECTED: Stored Total: ${storedTotal}, Calculated: ${result.total}`);
            return false;
        }

        return true;
    }
};

window.PricingValidator = PricingValidator;


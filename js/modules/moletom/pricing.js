/**
 * Módulo de Preços - Moletom
 */

function fmtMoney(val) {
    if (typeof val !== 'number') return val;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function updatePrice(providedPricing) {
    const p = providedPricing || calculateFullPrice();
    const display = document.getElementById('price-display');
    const totalQty = Object.values(state.sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);
    const infoT = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_total_geral') : '';
    const infoM = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_matriz') : '';
    if (display) {
        display.innerHTML = `
            <div style="font-size:2.5rem; font-weight:bold; color:#D4AF37;">R$ ${fmtMoney(p.total)} ${infoT}</div>
            ${totalQty > 1 ? `<div style="font-size:1rem; color:#aaa; margin-top:-5px; margin-bottom:10px;">(Média: R$ ${fmtMoney(p.total / totalQty)}/un)</div>` : ''}
            <div style="font-size:0.8rem; color:#666; font-weight:normal; margin-top:5px; line-height: 1.2;">
                ${totalQty} ${totalQty === 1 ? 'Peça' : 'Peças'}<br>
                Desc: ${fmtMoney(p.discountPercent)}% (-R$ ${fmtMoney(p.discountValue)})<br>
                ${p.waiver > 0 ? 'Isenção 1 Arte: SIM <br>' : ''}
                ${p.devFees > 0 ? `+ R$ ${fmtMoney(p.devFees)} (Taxa Vetorização) ${infoM}` : ''}
            </div>
        `;
    }
    if (typeof updateReport === 'function') updateReport(p.total, totalQty, p.discountPercent, p.discountValue, p.waiver, p.devFees);
    if (typeof PDFGenerator !== 'undefined') PDFGenerator.prepareDraft(state, p, CONFIG);
}

function getZonePrice(zoneId, type = 'logo') {
    if (!state.config) return 0;
    if (state.config.zonePrices && state.config.zonePrices[zoneId] !== undefined) return parseFloat(state.config.zonePrices[zoneId]);
    const isText = type === 'text', zid = zoneId.toLowerCase();
    if (zid.includes('frente')) return isText ? (state.config.textFrontPrice || 0) : (state.config.logoFrontPrice || 0);
    if (zid.includes('costas')) return isText ? (state.config.textBackPrice || 0) : (state.config.logoBackPrice || 0);
    if (zid.includes('manga') || zid.includes('punho')) return isText ? (state.config.textSleevePrice || 9.90) : (state.config.logoSleevePrice || 9.90);
    if (zid.includes('touca') || zid.includes('capuz')) return isText ? (state.config.textHoodPrice || 9.90) : (state.config.logoHoodPrice || 9.90);
    return isText ? (state.config.textPrice || 19.90) : (state.config.logoPrice || 0);
}

function calculateFullPrice() {
    let totalQty = 0;
    Object.values(state.sizes).forEach(q => totalQty += (parseInt(q) || 0));
    const baseGarmentPrice = (state.config && state.config.basePrice !== undefined) ? state.config.basePrice : 189.90;
    let customTextCost = 0, customImagesCost = 0, customUploadsCount = 0;
    const uniqueCustomLogos = new Set();
    Object.keys(state.elements).forEach(zid => {
        if (state.elements[zid].length > 0) {
            state.elements[zid].forEach(el => {
                if (el.dataset.isCustom === 'true') uniqueCustomLogos.add(el.dataset.filename || 'custom');
                customImagesCost += getZonePrice(zid, 'image');
            });
        }
    });
    customUploadsCount = uniqueCustomLogos.size;
    Object.keys(state.texts).forEach(tk => {
        const t = state.texts[tk];
        if (t.enabled && t.content) {
            const zoneConf = (CONFIG.textZones || []).find(z => z.id === tk);
            customTextCost += getZonePrice(zoneConf ? zoneConf.parentZone : tk, 'text');
        }
    });
    let upgradesCost = 0;
    if (state.zipper && state.zipper.enabled) upgradesCost += (state.config.zipperUpgrade !== undefined) ? state.config.zipperUpgrade : 15.00;
    if (state.pocket && state.pocket.enabled) upgradesCost += (state.config.pocketUpgrade !== undefined) ? state.config.pocketUpgrade : 10.00;
    let tierBasePrice = baseGarmentPrice;
    if (totalQty >= 30 && state.config.price30 > 0) tierBasePrice = state.config.price30;
    else if (totalQty >= 20 && state.config.price20 > 0) tierBasePrice = state.config.price20;
    else if (totalQty >= 10 && state.config.price10 > 0) tierBasePrice = state.config.price10;
    let fullUnitBase = baseGarmentPrice + customTextCost + customImagesCost + upgradesCost;
    let subTotal = 0;
    Object.entries(state.sizes).forEach(([sz, q]) => {
        const qtyVal = parseInt(q) || 0;
        if (qtyVal > 0) {
            const sizeData = (CONFIG.sizes || []).find(s => s.label === sz);
            const mod = (sizeData && sizeData.priceMod > 0) ? (state.config.sizeModPrice || 0) : 0;
            subTotal += (fullUnitBase + mod) * qtyVal;
        }
    });
    let discountVal = Math.max(0, baseGarmentPrice - tierBasePrice) * totalQty;
    const devFees = customUploadsCount * (state.config.devFee || 0);
    let waiver = (state.config.artWaiver && totalQty >= 10 && customUploadsCount > 0) ? (state.config.devFee || 0) : 0;
    const logoRemovalFee = (state.logoPunho && !state.logoPunho.enabled) ? (state.config.logoPunhoRemovalFee || 15.00) : 0;
    return {
        total: subTotal - discountVal - waiver + devFees + (logoRemovalFee * totalQty),
        discountPercent: subTotal > 0 ? (discountVal / subTotal) * 100 : 0,
        discountValue: discountVal,
        devFees, waiver, logoRemovalFee, upgradesCost
    };
}

function updateReport(total, qty, discPct, discVal, waiver, devFees) {
    const b = document.getElementById('summary-body');
    if (!b) return;
    const icons = {
        part: '👕', text: 'T', image: '🖼️', warn: '⚠️'
    };
    const row = (icon, title, desc, priceVal, isBonus = false) => {
        const totalItemPrice = priceVal * qty;
        const priceStr = priceVal > 0 ? `+ R$ ${fmtMoney(totalItemPrice)}` : (isBonus ? 'INCLUSO' : '-');
        return `<tr><td>${icon}</td><td><strong>${title}</strong><br>${desc}</td><td class="text-right">${priceStr}</td></tr>`;
    };
    let html = '';
    const sizeList = [];
    Object.entries(state.sizes).forEach(([size, q]) => { if (parseInt(q) > 0) sizeList.push(`${q}x ${size}`); });
    if (sizeList.length > 0) {
        html += `<tr style="background:#222; color:#D4AF37;"><td>#</td><td><strong>Base & Grade</strong></td><td class="text-right">R$ ${fmtMoney(total + discVal + waiver - devFees)}</td></tr>`;
    }
    b.innerHTML = html;
}

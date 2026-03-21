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

    updateReport(p.total, totalQty, p.discountPercent, p.discountValue, p.waiver, p.devFees);

    // Preparação paralela do PDF/Resumo
    if (typeof PDFGenerator !== 'undefined') {
        PDFGenerator.prepareDraft(state, p, CONFIG);
    }
}

/**
 * Retorna o preço de uma zona baseado no tipo (logo/texto)
 */
function getZonePrice(zoneId, type = 'logo') {
    if (!state.config) return 0;

    // 1. Preço Granular do Admin (Prioridade Máxima)
    if (state.config.zonePrices && state.config.zonePrices[zoneId] !== undefined) {
        return parseFloat(state.config.zonePrices[zoneId]);
    }

    // 2. Fallbacks de Categoria
    const isText = type === 'text';
    const zid = zoneId.toLowerCase();
    if (zid.includes('frente')) {
        return isText ? (state.config.textFrontPrice || 0) : (state.config.logoFrontPrice || 0);
    }
    if (zid.includes('costas')) {
        return isText ? (state.config.textBackPrice || 0) : (state.config.logoBackPrice || 0);
    }
    if (zid.includes('manga') || zid.includes('punho')) {
        return isText ? (state.config.textSleevePrice || 9.90) : (state.config.logoSleevePrice || 9.90);
    }
    if (zid.includes('touca') || zid.includes('capuz')) {
        return isText ? (state.config.textHoodPrice || 9.90) : (state.config.logoHoodPrice || 9.90);
    }

    // Default fallback
    return isText ? (state.config.textPrice || 19.90) : (state.config.logoPrice || 0);
}

/**
 * Calcula o preço total da simulação
 */
function calculateFullPrice() {
    // 1. Calcular Quantidade Total FIRST
    let totalQty = 0;
    Object.values(state.sizes).forEach(q => totalQty += (parseInt(q) || 0));

    // 2. Preço de Base do Admin
    const baseGarmentPrice = (state.config && state.config.basePrice !== undefined) ? state.config.basePrice : 189.90;

    let textCount = 0;
    let customTextCost = 0;
    let customImagesCost = 0;
    let customUploadsCount = 0;

    // 3. Zonas de Imagem (Logos da Galeria e Uploads)
    const uniqueCustomLogos = new Set();
    Object.keys(state.elements).forEach(zid => {
        if (state.elements[zid].length > 0) {
            state.elements[zid].forEach(el => {
                const isCustom = el.dataset.isCustom === 'true';
                if (isCustom) {
                    uniqueCustomLogos.add(el.dataset.filename || 'custom');
                }
                customImagesCost += getZonePrice(zid, 'image');
            });
        }
    });
    customUploadsCount = uniqueCustomLogos.size;

    // 4. Zonas de Texto
    Object.keys(state.texts).forEach(tk => {
        const t = state.texts[tk];
        if (t.enabled && t.content) {
            textCount++;
            const zoneConf = (CONFIG.textZones || []).find(z => z.id === tk);
            const parentZone = zoneConf ? zoneConf.parentZone : tk;
            customTextCost += getZonePrice(parentZone, 'text');
        }
    });

    // 5. Logo Punho Fee (Taxa de retirada)
    let logoRemovalFee = 0;
    if (state.logoPunho && !state.logoPunho.enabled) {
        logoRemovalFee = state.config.logoPunhoRemovalFee || 15.00;
    }

    // 6. Upgrades (Zíper e Bolso)
    let upgradesCost = 0;
    if (state.zipper && state.zipper.enabled) {
        upgradesCost += (state.config.zipperUpgrade !== undefined) ? state.config.zipperUpgrade : 15.00;
    }
    if (state.pocket && state.pocket.enabled) {
        upgradesCost += (state.config.pocketUpgrade !== undefined) ? state.config.pocketUpgrade : 10.00;
    }

    // 7. Lógica de Atacado (Tiers)
    let tierBasePrice = baseGarmentPrice;
    if (totalQty >= 30 && state.config.price30 > 0) tierBasePrice = state.config.price30;
    else if (totalQty >= 20 && state.config.price20 > 0) tierBasePrice = state.config.price20;
    else if (totalQty >= 10 && state.config.price10 > 0) tierBasePrice = state.config.price10;

    // 8. Base Unitária com Customizações (exceto descontos)
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

    // 9. Calcular Desconto: (OriginalBase - TierBase) * Qty
    let baseDiscountPerUnit = Math.max(0, baseGarmentPrice - tierBasePrice);
    let discountVal = baseDiscountPerUnit * totalQty;

    // 10. Taxas de Desenvolvimento e Isenção
    const devFees = customUploadsCount * (state.config.devFee || 0);
    let waiver = 0;
    if (state.config.artWaiver && totalQty >= 10 && customUploadsCount > 0) {
        waiver = (state.config.devFee || 0);
    }

    return {
        total: subTotal - discountVal - waiver + devFees + (logoRemovalFee * totalQty),
        discountPercent: subTotal > 0 ? (discountVal / subTotal) * 100 : 0,
        discountValue: discountVal,
        devFees: devFees,
        waiver: waiver,
        logoRemovalFee: logoRemovalFee,
        upgradesCost: upgradesCost
    };
}

function updateReport(total, qty, discPct, discVal, waiver, devFees) {
    const b = document.getElementById('summary-body');
    if (!b) return;
    let html = '';

    const icons = {
        part: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>',
        text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
        image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    };

    const row = (icon, title, desc, priceVal, isBonus = false) => {
        const totalItemPrice = priceVal * qty;
        const priceStr = priceVal > 0 ? `+ R$ ${fmtMoney(totalItemPrice)}` : (isBonus ? 'INCLUSO' : '-');
        const colorStyle = priceVal > 0 ? 'color:#ffa500;' : (isBonus ? 'color:#28a745;' : 'color:#555;');

        const unitLabel = (priceVal > 0 && qty > 1) ? `<br><span style="color:#888; font-size:0.8em;">(Unit: R$ ${fmtMoney(priceVal)})</span>` : '';

        return `
            <tr>
                <td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">${icon}</td>
                <td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word; min-width:0;">
                    <strong style="display:block; margin-bottom:2px;">${title}</strong>
                    <div style="font-size:0.85em; color:#bbb; line-height:1.3;">${desc} ${unitLabel}</div>
                </td>
                <td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; white-space:nowrap; vertical-align:top; ${colorStyle}">
                    ${priceStr}
                </td>
            </tr>
        `;
    };

    // 1. TAMANHOS
    const sizeList = [];
    Object.entries(state.sizes).forEach(([size, q]) => {
        const qtyVal = parseInt(q) || 0;
        if (qtyVal > 0) {
            const mod = (CONFIG.sizes || []).find(s => s.label === size)?.priceMod || 0;
            sizeList.push(`<strong>${qtyVal}x</strong> ${size}${mod > 0 ? ' (<span style="color:#00b4d8">Acresc. Tamanho +R$ ' + fmtMoney(mod) + '</span>)' : ''}`);
        }
    });

    if (sizeList.length > 0) {
        html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">1. CONFIGURAÇÃO DE BASE</td></tr>`;
        html += `
            <tr>
                <td style="border-bottom:1px solid #333;"><strong>Grade</strong></td>
                <td style="border-bottom:1px solid #333;">${sizeList.join(', ')}</td>
                <td class="text-right" style="border-bottom:1px solid #333;">
                    <div style="font-size:0.8em; color:#888;">R$ ${fmtMoney((total + discVal + waiver - devFees) / qty)} /un</div>
                    <strong>R$ ${fmtMoney(total + discVal + waiver - devFees)}</strong>
                </td>
            </tr>
        `;
    }

    // 2. DETALHAMENTO
    html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">DETALHES DO PRODUTO</td></tr>`;

    // Cor Base
    const colorObj = (CONFIG.colors || []).find(c => c.id === state.color);
    const hex = colorObj ? colorObj.hex : '#eee';
    const name = colorObj ? colorObj.name : state.color;
    html += `
        <tr>
            <td style="border-bottom:1px solid #333;">${icons.part}</td>
            <td style="border-bottom:1px solid #333;">
                <span class="summary-color-dot" style="background-color:${hex};"></span> 
                <strong>Cor do Moletom</strong><br>
                <span style="font-size:0.85em; color:#bbb;">${name}</span>
            </td>
            <td class="text-right" style="border-bottom:1px solid #333; color:#777;">Incluso</td>
        </tr>
    `;

    // Logo Punho (Removal Fee)
    if (state.logoPunho && !state.logoPunho.enabled) {
        const fee = state.config.logoPunhoRemovalFee || 15.00;
        html += row(
            icons.warn,
            'Remoção de Logo HNT',
            'Surcharge por retirada de marca padrão.',
            fee
        );
    }

    // Upgrades
    if (state.zipper && state.zipper.enabled) {
        html += row(icons.part, 'Upgrade de Zíper', 'Zíper reforçado na frente.', state.config.zipperUpgrade || 15.00);
    }
    if (state.pocket && state.pocket.enabled) {
        html += row(icons.part, 'Upgrade de Bolso', 'Bolso canguru com zíper.', state.config.pocketUpgrade || 10.00);
    }

    // Zonas (Logos e Textos)
    const elementsByZone = {};
    Object.keys(state.elements).forEach(zk => {
        if (state.elements[zk].length > 0) {
            state.elements[zk].forEach(el => {
                if (!elementsByZone[zk]) elementsByZone[zk] = [];
                const isCustom = el.dataset.isCustom === 'true';
                const price = getZonePrice(zk, 'logo');
                elementsByZone[zk].push({ type: 'image', desc: `Logo: ${el.dataset.formattedFilename || el.dataset.filename || 'Galeria'}`, price });
            });
        }
    });

    Object.keys(state.texts).forEach(tk => {
        const t = state.texts[tk];
        if (t.enabled && t.content) {
            const parentZone = (CONFIG.textZones || []).find(z => z.id === tk)?.parentZone || tk;
            if (!elementsByZone[parentZone]) elementsByZone[parentZone] = [];
            elementsByZone[parentZone].push({ type: 'text', desc: `Texto: "${t.content}"`, price: getZonePrice(parentZone, 'text') });
        }
    });

    Object.keys(elementsByZone).forEach(zk => {
        const zoneName = (CONFIG.zones && CONFIG.zones[zk]) ? CONFIG.zones[zk].name : zk;
        elementsByZone[zk].forEach(item => {
            html += row(item.type === 'image' ? icons.image : icons.text, `${item.type === 'image' ? 'Logo' : 'Texto'} - ${zoneName}`, item.desc, item.price, item.price === 0);
        });
    });

    // 3. FINANCEIRO
    html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">DETALHAMENTO FINANCEIRO</td></tr>`;
    if (total > 0) {
        html += `<tr style="background:#1a1a1a;"><td colspan="2"><strong>Valor Base com Customizações</strong></td><td class="text-right">R$ ${fmtMoney(total + discVal + waiver - devFees)}</td></tr>`;
    }
    if (devFees > 0) {
        html += `<tr style="background:rgba(255,165,0,0.1);"><td><strong>Taxa de Matriz</strong></td><td>Criação de matriz(es).</td><td class="text-right" style="color:#FFA500;">+ R$ ${fmtMoney(devFees)}</td></tr>`;
    }
    if (discVal > 0) {
        html += `<tr style="background:rgba(40,167,69,0.1);"><td><strong>Desconto Atacado</strong></td><td>Total de ${discPct.toFixed(1)}%</td><td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(discVal)}</td></tr>`;
    }
    if (waiver > 0) {
        html += `<tr style="background:rgba(40,167,69,0.1);"><td><strong>Bônus de Matriz</strong></td><td>Isenção por volume.</td><td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(waiver)}</td></tr>`;
    }

    // Logística & Contato
    const { minDate, maxDate } = calculateBusinessDates(new Date(), state.config.production?.minDays || 15, state.config.production?.maxDays || 25, state.config.production?.holidays || []);

    const clientProfile = JSON.parse(localStorage.getItem('hnt_customer_profile') || '{}');
    const contactPhone = clientProfile.phone || state.phone || 'Não cadastrado';

    html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">LOGÍSTICA & CONTATO</td></tr>`;
    html += `
        <tr>
            <td colspan="2"><strong>Contato / Telefone</strong></td>
            <td class="text-right" style="color:#28a745;">${contactPhone}</td>
        </tr>
        <tr>
            <td colspan="2"><strong>Data do Pedido</strong></td>
            <td class="text-right">${new Date().toLocaleDateString()}</td>
        </tr>
        <tr>
            <td colspan="2"><strong>Previsão Estimada</strong></td>
            <td class="text-right" style="color:#00b4d8;">
                ${minDate} a ${maxDate}<br>
                <span style="font-size:0.8em; color:#888;">(${state.config.production?.minDays || 15}-${state.config.production?.maxDays || 25} dias úteis)</span>
            </td>
        </tr>
    `;
    html += `<tr style="background:#00b4d8; color:#000; font-weight:800; text-transform:uppercase;"><td colspan="3" style="padding:15px;"><div style="display:flex; justify-content:space-between;"><span>TOTAL FINAL</span><span>R$ ${fmtMoney(total)}</span></div></td></tr>`;

    b.innerHTML = html;
}

function calculateBusinessDates(startDate, minDays, maxDays, holidays) {
    function addBusinessDays(date, days) {
        let d = new Date(date);
        let added = 0;
        while (added < days) {
            d.setDate(d.getDate() + 1);
            const day = d.getDay();
            if (day === 0 || day === 6) continue;
            const formatted = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
            if (holidays.includes(formatted)) continue;
            added++;
        }
        return d;
    }
    const d1 = addBusinessDays(startDate, minDays);
    const d2 = addBusinessDays(startDate, maxDays);
    return { minDate: d1.toLocaleDateString(), maxDate: d2.toLocaleDateString() };
}

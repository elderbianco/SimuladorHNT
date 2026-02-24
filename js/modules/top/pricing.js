/**
 * Módulo de Preços - Top
 */

function fmtMoney(val) {
    if (typeof val !== 'number') return val;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

function updatePrice() {
    const p = calculateFullPrice();
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

function getZonePrice(id, type) {
    if (type === 'image') {
        if (id.includes('frente')) return state.config.logoFrontPrice || 0;
        if (id.includes('costas')) return state.config.logoBackPrice || 0;
        return state.config.logoCenterPrice || 0;
    } else if (type === 'text') {
        if (id.includes('frente')) return state.config.textFrontPrice || 0;
        if (id.includes('costas')) return state.config.textBackPrice || 0;
        return state.config.textPrice || 0;
    }
    return 0;
}

function calculateFullPrice() {
    let baseGarmentPrice = state.config.basePrice || 0;
    let customUploadsCount = 0;
    let customizationCost = 0;

    // Images
    const uniqueCustomLogos = new Set();
    Object.keys(state.elements).forEach(zid => {
        if (state.elements[zid].length > 0) {
            state.elements[zid].forEach(el => {
                const isCustom = el.dataset.isCustom === 'true';
                // Both Custom and Acervo now charge the Zone Price (as per user request for Top)
                customizationCost += getZonePrice(zid, 'image');

                if (isCustom) {
                    uniqueCustomLogos.add(el.dataset.filename || 'custom');
                }
            });
        }
    });
    customUploadsCount = uniqueCustomLogos.size;

    // Texts
    Object.keys(state.texts).forEach(tk => {
        const t = state.texts[tk];
        if (t.enabled && t.content) {
            customizationCost += getZonePrice(tk, 'text');
        }
    });

    // 1. Calculate Total Quantity
    let totalQty = 0;
    Object.values(state.sizes).forEach(q => totalQty += (parseInt(q) || 0));

    // 2. Determine Active Base Price (Wholesale Tiers)
    let activeBasePrice = baseGarmentPrice;
    if (totalQty >= 30 && state.config.price30 > 0) activeBasePrice = state.config.price30;
    else if (totalQty >= 20 && state.config.price20 > 0) activeBasePrice = state.config.price20;
    else if (totalQty >= 10 && state.config.price10 > 0) activeBasePrice = state.config.price10;

    // 3. Calculate Gross and Net Totals
    let grossTotal = 0;
    let netTotal = 0;

    Object.entries(state.sizes).forEach(([sz, q]) => {
        if (q > 0) {
            const sData = CONFIG.sizes.find(s => s.label === sz);
            const sizeMod = (sData && sData.priceMod > 0) ? (state.config.sizeModPrice || 0) : 0;

            // Gross: Uses standard base price
            const unitGross = baseGarmentPrice + customizationCost + sizeMod;
            grossTotal += unitGross * q;

            // Net: Uses tiered base price
            const unitNet = activeBasePrice + customizationCost + sizeMod;
            netTotal += unitNet * q;
        }
    });

    // 4. Calculate Discount Metrics
    let discountValue = grossTotal - netTotal;
    let discountPercent = 0;
    if (grossTotal > 0) {
        discountPercent = (discountValue / grossTotal) * 100;
    }

    // 5. Calculate Fees and Waivers
    const devFees = customUploadsCount * (state.config.devFee || 0);
    // Waiver: >10 pieces AND (custom images OR customization cost)
    let waiver = (state.config.artWaiver && totalQty > 10 && (customUploadsCount > 0 || customizationCost > 0)) ? (state.config.devFee || 0) : 0;

    // 6. Final Total
    const finalTotal = netTotal + devFees - waiver;

    return {
        total: finalTotal,
        discountPercent: discountPercent,
        discountValue: discountValue,
        devFees: devFees,
        waiver: waiver,
        subTotal: baseGarmentPrice * totalQty // Return raw base subtotal for report if needed, or specific metric
    };
}

function updateReport(total, qty, discPct, discVal, waiver, devFees) {
    const b = document.getElementById('summary-body');
    if (!b) return;
    let html = '';

    const icons = {
        part: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>',
        text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
        image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:5px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
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
        if (q > 0) {
            const mod = (CONFIG.sizes || []).find(s => s.label === size)?.priceMod || 0;
            sizeList.push(`<strong>${q}x</strong> ${size}${mod > 0 ? ' (<span style="color:#00b4d8">Acresc. Tamanho +R$ ' + fmtMoney(mod) + '</span>)' : ''}`);
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
                <strong>Cor do Top</strong><br>
                <span style="font-size:0.85em; color:#bbb;">${name}</span>
            </td>
            <td class="text-right" style="border-bottom:1px solid #333; color:#777;">Incluso</td>
        </tr>
    `;

    // Zonas (Logos e Textos)
    const elementsByZone = {};

    // Zonas (Logos)
    // const elementsByZone = {}; // Removed redeclaration
    Object.keys(state.elements).forEach(zk => {
        if (state.elements[zk].length > 0) {
            state.elements[zk].forEach(el => {
                if (!elementsByZone[zk]) elementsByZone[zk] = [];
                // Price logic matches calculateFullPrice: Custom AND Acervo = ZonePrice
                const price = getZonePrice(zk, 'image');

                let filename = 'Imagem da Galeria';
                if (el.dataset.formattedFilename) {
                    filename = el.dataset.formattedFilename;
                } else {
                    const imgTag = el.querySelector('img');
                    if (imgTag && imgTag.src) {
                        const parts = imgTag.src.split('/');
                        filename = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
                    }
                }

                const isCustom = el.dataset.isCustom === 'true';
                if (isCustom) filename += ' <span style="color:#FFA500; font-size:0.8em;">(Taxa Matriz se aplicável)</span>';

                elementsByZone[zk].push({
                    type: 'image',
                    desc: `Arquivo: ${filename}`,
                    price: price
                });
            });
        }
    });

    // Agrupa textos
    Object.keys(state.texts).forEach(tk => {
        const t = state.texts[tk];
        if (t.enabled && t.content) {
            const zoneConf = (CONFIG.textZones || []).find(z => z.id === tk);
            const pZone = zoneConf ? zoneConf.parentZone : tk;
            if (!elementsByZone[pZone]) elementsByZone[pZone] = [];

            const price = getZonePrice(tk, 'text'); // Top pricing uses direct ID
            // Find color name if possible
            const colorObj = (state.config.textColors || []).find(c => c.hex === t.color);
            const colorName = colorObj ? colorObj.name : t.color;

            elementsByZone[pZone].push({
                type: 'text',
                desc: `"${t.content}"<br>Fonte: ${t.fontFamily} | Cor: ${colorName}`,
                price: price
            });
        }
    });

    // Renderiza agrupado
    Object.keys(elementsByZone).forEach(zk => {
        const zoneName = (CONFIG.zones && CONFIG.zones[zk]) ? CONFIG.zones[zk].name : zk;
        elementsByZone[zk].forEach(item => {
            html += row(
                item.type === 'image' ? icons.image : icons.text,
                `${item.type === 'image' ? 'Logo' : 'Texto'} - ${zoneName}`,
                item.desc,
                item.price,
                item.price === 0
            );
        });
    });

    // 2.1 LOGOTIPOS HANUTHAI (Standard)
    if (state.logoColor) {
        ['frente_centro', 'costas_centro'].forEach(zone => {
            const logo = state.logoColor[zone];
            if (logo) {
                const zoneName = (CONFIG.zones && CONFIG.zones[zone]) ? CONFIG.zones[zone].name : zone;
                html += row(
                    icons.part,
                    `LOGOTIPO HNT - ${zoneName.toUpperCase()}`,
                    `Cor: ${logo.name}`,
                    0,
                    true // isBonus (Free)
                );
            }
        });
    }

    // 2.2 LOGO HNT (BARRA)
    if (state.hntBarraColor) {
        const barraColorName = state.hntBarraColor === 'branco' ? 'Branco' : 'Preto';
        html += row(
            icons.part,
            `LOGO HNT (BARRA)`,
            `Cor: ${barraColorName}`,
            0,
            true
        );
    }

    // 3. FINANCEIRO & OBSERVAÇÕES
    html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">DETALHAMENTO FINANCEIRO</td></tr>`;

    // Subtotal
    if (total > 0) {
        const subTotalVal = (total + discVal + waiver - devFees);
        html += `
            <tr style="background:#1a1a1a;">
                <td colspan="2">
                    <strong>Valor Base do Pedido (${qty} peças)</strong>
                    <div style="font-size:0.8em; color:#888;">Média Unitária: R$ ${fmtMoney(subTotalVal / qty)}</div>
                </td>
                <td class="text-right">R$ ${fmtMoney(subTotalVal)}</td>
            </tr>
        `;
    }

    // Taxas Separadas
    if (devFees > 0) {
        const devFeeVal = state.config.devFee || CONFIG.devFee || 0;
        const count = Math.round(devFees / devFeeVal);
        html += `
            <tr style="background:rgba(255, 165, 0, 0.1);">
                <td><strong>Taxa de Matriz</strong></td>
                <td>
                    Refere-se a criação de <strong>${count}</strong> nova(s) matriz(es).
                    <div style="color:#FFA500; font-size:0.85em; margin-top:2px;">⚠️ Cobrado uma única vez por pedido por arte única.</div>
                </td>
                <td class="text-right" style="color:#FFA500;">+ R$ ${fmtMoney(devFees)}</td>
            </tr>
        `;
    }

    // Descontos
    if (discPct > 0) {
        html += `
            <tr style="background:rgba(40, 167, 69, 0.1);">
                <td><strong>Desconto Atacado</strong></td>
                <td>Aplicado desconto de <strong>${discPct}%</strong>.</td>
                <td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(discVal)}</td>
            </tr>
        `;
    }

    // Isenção
    if (waiver > 0) {
        html += `
            <tr style="background:rgba(40, 167, 69, 0.1);">
                <td><strong>Bônus de Matriz</strong></td>
                <td>Isenção de taxa por volume (>10 peças).</td>
                <td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(waiver)}</td>
            </tr>
        `;
    }

    // Prazo
    const { minDate, maxDate } = calculateBusinessDates(
        new Date(),
        state.config.production?.minDays || 15,
        state.config.production?.maxDays || 25,
        state.config.production?.holidays || []
    );
    html += `<tr><td colspan="3" style="padding:15px 0; color:#aaa; font-size:0.9em; border-top:1px solid #444;"><strong>📅 Previsão Estimada:</strong> ${minDate} a ${maxDate} (${state.config.production?.minDays || 15}-${state.config.production?.maxDays || 25} dias úteis)</td></tr>`;

    // Total Final
    html += `
        <tr style="background:#00b4d8; color:#000; font-weight:800; text-transform:uppercase;">
            <td colspan="3" style="padding:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                    <span style="font-size:0.9rem;">TOTAL FINAL PREVISTO</span>
                    <span style="font-size:1.4rem;">R$ ${fmtMoney(total)}</span>
                </div>
            </td>
        </tr>
    `;

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

    return {
        minDate: d1.toLocaleDateString(),
        maxDate: d2.toLocaleDateString(),
        minDateObj: d1,
        maxDateObj: d2
    };
}

/**
 * Módulo de Precificação e Relatórios - Shorts
 * Separado em: 26/01/2026
 */

function fmtMoney(val) {
    if (typeof val !== 'number') return val;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

// ------------------- PRICING -------------------
function getZonePrice(zone) {
    // CUSTOM RULE: Laterais são grátis (exceto no combo, tratado separadamente nos cálculos abaixo)
    if (zone.id.includes('lat') || zone.category === 'Laterais') return 0;

    // 1. Check Granular Price (Admin Configured)
    if (state.config.zonePrices && state.config.zonePrices[zone.id] !== undefined) {
        return parseFloat(state.config.zonePrices[zone.id]);
    }

    // 2. Fallback to Legacy Categories
    if (zone.id.includes('centro')) return state.config.logoCenterPrice || 0;
    if (zone.id.includes('lat')) return state.config.logoLatPrice || 0; // Fixed key

    // CUSTOM RULE: Base grátis para Laterais
    if (zone.category === 'Laterais') return 0;

    if (zone.id.includes('leg') || zone.category === 'Pernas') return state.config.legZoneAddonPrice || 0;

    return 0;
}

function calculateFullPrice() {
    let unitBase = state.config.basePrice || 0;

    console.log('🧮 Calculando Preço - Base:', unitBase, 'Config:', state.config);

    // Add extras
    DATA.extras.forEach(e => {
        if (state.extras[e.id] && state.extras[e.id].enabled) {
            // Check for dynamic price override from Admin
            const price = (state.config.extraPrices && state.config.extraPrices[e.id] !== undefined)
                ? state.config.extraPrices[e.id]
                : e.price;
            unitBase += price;
        }
    });

    // Add texts
    let textCount = 0;

    DATA.textZones.forEach(t => {
        // Defensive check: ensure text state exists
        if (state.texts[t.id] && state.texts[t.id].enabled) {
            // ROBUST CHECK: Check Category OR ID to exclude Laterals
            if ((t.category && t.category.includes('Lateral')) || t.id.includes('lat')) return;
            textCount++;
        }
    });

    unitBase += textCount * state.config.textPrice;

    // Add upload costs
    DATA.uploadZones.forEach(u => {
        // CHARGE IF CONTENT PRESENT
        // Rule: Custom Images = Matriz Fee (calculated later) + 0 Zone Price (Unlock Free)
        //       Acervo Images = Zone Price (as File Price)
        const up = state.uploads[u.id];
        if (up && up.src) {
            if (!up.isCustom) {
                unitBase += getZonePrice(u);
            }
        }
    });

    // CUSTOM RULE: Laterais (Img + Txt = Cobra Texto Adicional)
    DATA.uploadZones.filter(u => u.category === 'Laterais').forEach(u => {
        const hasImg = state.uploads[u.id].src;
        const tId = u.id.replace('logo_', 'text_');
        const hasTxt = state.texts[tId] && state.texts[tId].enabled;

        if (hasImg && hasTxt) {
            // Explicitly use textLatPrice (9.90) to avoid using textPrice (19.90)
            unitBase += state.config.textLatPrice;
        }
    });

    // Add unlock costs for legs (Granular) - REMOVED AS PER USER REQUEST
    // DATA.uploadZones.forEach(u => {
    //     if (u.requiresUnlock && state.uploads[u.id].unlocked) unitBase += getZonePrice(u);
    // });
    // DATA.textZones.forEach(t => {
    //     // Find corresponding upload zone to get correct granular price
    //     if (t.requiresUnlock && state.texts[t.id] && state.texts[t.id].unlocked) {
    //         const upZoneId = t.id.replace('text_', 'leg_'); // Map back to leg zone for price
    //         const granularPrice = (state.config.zonePrices && state.config.zonePrices[upZoneId])
    //             ? state.config.zonePrices[upZoneId]
    //             : state.config.legZoneAddonPrice;
    //         unitBase += granularPrice;
    //     }
    // });

    // Calculate totals per size
    let totalQty = 0;
    let subTotal = 0;

    Object.entries(state.sizes).forEach(([size, qty]) => {
        if (qty > 0) {
            totalQty += parseInt(qty) || 0;
            const sizeData = DATA.sizes.find(s => s.label === size);
            let modCost = 0;
            if (sizeData && sizeData.priceMod > 0) modCost = state.config.sizeModPrice;
            subTotal += (unitBase + modCost) * qty;
        }
    });

    // --- CÁLCULO DE TAXAS DE ARTE (EMB) ---
    let devFeesCount = 0;
    let devFees = 0;
    let savedFees = 0;
    let feeDetails = [];

    if (typeof EmbManager !== 'undefined') {
        const getZoneName = (id) => {
            const z = DATA.uploadZones.find(x => x.id === id);
            return z ? z.name : id;
        };
        const fees = EmbManager.calculateFees(state.uploads, state.embFiles, state.config.devFee, getZoneName);
        devFeesCount = fees.chargeableCount;
        devFees = fees.totalFee;
        savedFees = fees.savedValue;
        feeDetails = fees.details || [];
    } else {
        // Fallback de Segurança (Lógica legada)
        const uniqueFilesToCharge = new Set();
        const coveredZones = new Set();
        if (state.embFiles) state.embFiles.forEach(f => f.zones.forEach(z => coveredZones.add(z)));

        const allCustomFiles = new Set();

        DATA.uploadZones.forEach(u => {
            const up = state.uploads[u.id];
            if (up && up.src && up.isCustom) {
                const identifier = up.fileHash || up.filename || 'unknown';
                allCustomFiles.add(identifier);
                if (!coveredZones.has(u.id)) {
                    uniqueFilesToCharge.add(identifier);
                }
            }
        });

        devFeesCount = uniqueFilesToCharge.size;
        devFees = devFeesCount * state.config.devFee;
        const savedCount = Math.max(0, allCustomFiles.size - devFeesCount);
        savedFees = savedCount * state.config.devFee;
    }

    // --- WHOLESALE LOGIC (Fixed Tiers) ---
    // If Admin defined specific prices for quantity tiers (price10, price20, price30), 
    // we use them as the new Base Price instead of applying a %.

    let tierBasePrice = state.config.basePrice;

    // Check Tiers (highest quantity first)
    if (totalQty >= 30 && state.config.price30 > 0) {
        tierBasePrice = state.config.price30;
    } else if (totalQty >= 20 && state.config.price20 > 0) {
        tierBasePrice = state.config.price20;
    } else if (totalQty >= 10 && state.config.price10 > 0) {
        tierBasePrice = state.config.price10;
    }

    // Recalculate SubTotal with Tier Base
    // We already calculated subTotal with 'unitBase' (which was just basePrice + extras).
    // Now we need to know how much we are saving per unit on the BASE price.
    // Savings per unit = OriginalBase - TierBase
    // Total Discount = Savings * Qty

    let baseDiscountPerUnit = Math.max(0, state.config.basePrice - tierBasePrice);
    let discountVal = baseDiscountPerUnit * totalQty;

    // Calculate effective percentage for display purposes
    // (Total Discount / Original SubTotal) * 100
    let appliedDiscount = 0;
    if (subTotal > 0) {
        appliedDiscount = (discountVal / subTotal) * 100;
    }

    let waiver = 0;
    // Regra: Se habilitado e >= 10 peças ganha 1 Arte (Taxa) de brinde
    if (state.config.artWaiver && totalQty >= 10 && devFeesCount > 0) {
        waiver = state.config.devFee;
    }

    let finalTotal = subTotal - discountVal - waiver + devFees;

    return {
        perUnit: totalQty > 0 ? (subTotal / totalQty) : unitBase,
        subtotal: subTotal,
        discountPercent: appliedDiscount,
        discountValue: discountVal,
        total: finalTotal,
        devFeesCount: devFeesCount,
        devFees: devFees, // Valor total das taxas de desenvolvimento
        waiver: waiver,
        savedFees: savedFees,
        feeDetails: feeDetails
    };
}

function updatePrice(preCalculated = null) {
    try {
        const p = preCalculated || calculateFullPrice();

        const display = document.getElementById('price-display');
        const qty = Object.values(state.sizes).reduce((a, b) => a + (parseInt(b) || 0), 0);

        const infoTotal = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_total_geral') : '';
        const infoMatriz = (typeof InfoSystem !== 'undefined') ? InfoSystem.getIconHTML('info_matriz') : '';

        if (display) {
            display.innerHTML = `
            <div style="font-size:2.5rem; font-weight:bold; color:#D4AF37;">R$ ${fmtMoney(p.total)} ${infoTotal}</div>
            ${qty > 1 ? `<div style="font-size:1rem; color:#aaa; margin-top:-5px; margin-bottom:10px;">(Média: R$ ${fmtMoney(p.total / qty)}/un)</div>` : ''}
            <div style="font-size:0.8rem; color:#666; font-weight:normal; margin-top:5px; line-height: 1.2;">
                ${qty} ${qty === 1 ? 'Peça' : 'Peças'}<br>
                Desc: ${fmtMoney(p.discountPercent)}% (-R$ ${fmtMoney(p.discountValue)})<br>
                ${p.waiver > 0 ? 'Isenção 1 Arte: SIM <br>' : ''}
                ${p.devFeesCount > 0 ? `+ R$ ${fmtMoney(p.devFeesCount * state.config.devFee)} (Taxa Desenvolvimento de Arte de Bordado) ${infoMatriz}` : ''}
            </div>
        `;
        }

        updateReport(p.total, qty, fmtMoney(p.discountPercent), p.discountValue, p.waiver, p.devFeesCount * state.config.devFee, p);
    } catch (e) {
        console.error("❌ Erro ao atualizar preço (Shorts):", e);
        alert("Erro na calculadora (Shorts): " + e.message);
    }
}

function updateReport(total, qty, discPct, discVal, waiver, devFees, p = {}) {
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
        const unitPriceStr = priceVal > 0 ? `R$ ${fmtMoney(priceVal)}` : (isBonus ? 'INCLUSO' : '-');
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

    // 1. TAMANHOS E QUANTIDADES
    const sizeList = [];
    Object.entries(state.sizes).forEach(([size, q]) => {
        if (q > 0) {
            const mod = DATA.sizes.find(s => s.label === size).priceMod > 0 ? state.config.sizeModPrice : 0;
            sizeList.push(`<strong>${q}x</strong> ${size} ${mod > 0 ? '(<span style="color:#00b4d8">Acresc. Tam > GG +R$ ' + fmtMoney(mod) + '</span>)' : ''}`);
        }
    });

    if (sizeList.length > 0) {
        html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">1. CONFIGURAÇÃO DE BASE</td></tr>`;
        html += `
            <tr>
                <td style="border-bottom:1px solid #333;"><strong>Grade</strong></td>
                <td style="border-bottom:1px solid #333;">${sizeList.join(', ')}</td>
                <td class="text-right" style="border-bottom:1px solid #333;">
                    <div style="font-size:0.8em; color:#888;">R$ ${fmtMoney(state.config.basePrice)} /un</div>
                    <strong>R$ ${fmtMoney(state.config.basePrice * qty)}</strong>
                </td>
            </tr>
        `;
    }

    // 2. DETALHAMENTO POR CATEGORIA
    DATA.categories.forEach(cat => {
        let categoryRows = '';
        let hasContent = false;

        // Partes (Cores)
        DATA.parts.filter(p => p.category === cat.id).forEach(p => {
            const colorId = state.parts[p.id];
            const colorObj = DATA.colors.find(c => c.id === colorId);
            const hex = colorObj ? colorObj.hex : '#eee';

            categoryRows += row(
                icons.part,
                p.name,
                `<span class="summary-color-dot" style="background-color:${hex};"></span> ${colorObj ? colorObj.name : colorId}`,
                0, // 0 for "Incluso"
                true
            );
            hasContent = true;
        });

        // Extras
        DATA.extras.filter(e => e.category === cat.id).forEach(e => {
            if (state.extras[e.id].enabled) {
                const colorId = state.extras[e.id].color;
                const colorObj = DATA.colors.find(c => c.id === colorId);
                const hex = colorObj ? colorObj.hex : '#eee';

                const ePrice = (state.config.extraPrices && state.config.extraPrices[e.id] !== undefined)
                    ? state.config.extraPrices[e.id]
                    : e.price;

                categoryRows += row(
                    icons.part,
                    e.name,
                    `<span class="summary-color-dot" style="background-color:${hex};"></span> ${colorObj ? colorObj.name : colorId}`,
                    ePrice
                );
                hasContent = true;
            }
        });

        // Uploads
        DATA.uploadZones.filter(u => u.category === cat.id).forEach(u => {
            const d = state.uploads[u.id];
            if (d.src) {
                const price = getZonePrice(u);

                let embStatusHtml = '';
                if (d.isCustom) {
                    let isCovered = false;
                    if (typeof EmbManager !== 'undefined') {
                        isCovered = EmbManager.isZoneCovered(u.id, state.embFiles);
                    } else {
                        const c = new Set();
                        if (state.embFiles) state.embFiles.forEach(f => f.zones.forEach(z => c.add(z)));
                        isCovered = c.has(u.id);
                    }
                    embStatusHtml = isCovered
                        ? '[Matriz Fornecida: Isento]'
                        : '[Criação de Matriz Necessária]';
                } else {
                    embStatusHtml = '[Arquivo do Acervo]';
                }

                categoryRows += row(
                    icons.image,
                    u.name,
                    `Arquivo: ${d.formattedFilename || d.filename} <br> ${embStatusHtml}`,
                    price,
                    price === 0
                );
                hasContent = true;
            }
        });

        // Textos
        DATA.textZones.filter(t => t.category === cat.id).forEach(t => {
            const d = state.texts[t.id];
            // Defensive check: ensure text state exists
            if (d && d.enabled) {
                const colorName = DATA.colors.find(c => c.hex === d.color);
                const fontObj = DATA.fonts ? DATA.fonts.find(f => f.id === d.fontFamily) : null;

                // PRICING DISPLAY LOGIC FIX
                let displayPrice = state.config.textPrice;

                // Case: Lateral Text (Robust Check)
                if ((t.category && t.category.includes('Lateral')) || t.id.includes('lat')) {
                    // Check if it's actually charged
                    const uId = t.id.replace('text_', 'logo_'); // Assuming symmetry
                    const hasImg = state.uploads[uId] && state.uploads[uId].src;

                    if (hasImg) {
                        displayPrice = state.config.textLatPrice;
                    } else {
                        displayPrice = 0;
                    }
                }

                categoryRows += row(
                    icons.text,
                    `Texto ${t.name}`,
                    `"${d.content}" <br> Fonte: ${fontObj ? fontObj.name : d.fontFamily} | Cor: ${colorName ? colorName.name : 'Personalizada'}`,
                    displayPrice,
                    displayPrice === 0
                );
                hasContent = true;
            }
        });

        if (hasContent) {
            html += `<tr style="background:#2C2C2C; color:#fff; font-weight:bold;"><td colspan="3">${cat.name.toUpperCase()}</td></tr>`;
            html += categoryRows;
        }
    });

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

    // Taxas de Bordado (Detalhado)
    if (devFees > 0) {
        if (p.feeDetails && p.feeDetails.length > 0) {
            p.feeDetails.forEach(detail => {
                const locs = detail.locations.join(', ');
                html += `
                <tr style="background:rgba(255, 165, 0, 0.1);">
                    <td><strong>Taxa de Matriz</strong></td>
                    <td style="font-size:0.85em;">
                        <strong>Local:</strong> ${locs} <br>
                        <span style="color:#888; font-size:0.8em;">(Arquivo: ${detail.filename})</span>
                        <div style="color:#FFA500; font-size:0.85em; margin-top:2px;">⚠️ Cobrado uma única vez por pedido por arte única.</div>
                    </td>
                    <td class="text-right" style="color:#FFA500;">+ R$ ${fmtMoney(detail.fee)}</td>
                </tr>`;
            });
        } else {
            const count = Math.round(devFees / state.config.devFee);
            html += `
                <tr style="background:rgba(255, 165, 0, 0.1);">
                    <td><strong>Taxa de Matriz de Bordado</strong></td>
                    <td>
                        Refere-se a criação de <strong>${count}</strong> nova(s) matriz(es).
                        <div style="color:#FFA500; font-size:0.85em; margin-top:2px;">⚠️ Cobrado uma única vez por pedido por arte única.</div>
                    </td>
                    <td class="text-right" style="color:#FFA500;">+ R$ ${fmtMoney(devFees)}</td>
                </tr>
            `;
        }
    }

    // Descontos
    if (discPct > 0) {
        html += `
            <tr style="background:rgba(40, 167, 69, 0.1);">
                <td><strong>Desconto Atacado</strong></td>
                <td>Aplicado desconto de <strong>${discPct}%</strong> para quantidade acima de 10/20 peças.</td>
                <td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(discVal)}</td>
            </tr>
        `;
    }

    // Economia por EMB
    if (p.savedFees > 0) {
        html += `
            <tr style="background:rgba(40, 167, 69, 0.1);">
                <td><strong>Isenção por Arquivo EMB</strong></td>
                <td>Você economizou enviando a arte de bordado (sujeito à validação).</td>
                <td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(p.savedFees)}</td>
            </tr>
        `;
    }

    // Isenção por Quantidade
    if (waiver > 0) {
        html += `
            <tr style="background:rgba(40, 167, 69, 0.1);">
                <td><strong>Bônus de Matriz</strong></td>
                <td>Isenção de 1 taxa de bordado por volume (>10 peças).</td>
                <td class="text-right" style="color:#28a745;">- R$ ${fmtMoney(waiver)}</td>
            </tr>
        `;
    }

    // Info Adicional
    if (state.config.customInfo && state.config.customInfo.length > 0) {
        state.config.customInfo.forEach(info => {
            html += `<tr><td colspan="3" style="color:#ccc; font-size:0.9em; padding:5px 0;">- <strong>${info.label}:</strong> ${info.value}</td></tr>`;
        });
    }

    // Logística & Contato
    const { minDate, maxDate } = calculateBusinessDates(
        new Date(),
        state.config.production?.minDays || 15,
        state.config.production?.maxDays || 25,
        state.config.production?.holidays || []
    );

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
                <span style="font-size:0.8em; color:#888;">(${state.config.production?.minDays}-${state.config.production?.maxDays} dias úteis)</span>
            </td>
        </tr>
    `;

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

function copyToClipboard() {
    navigator.clipboard.writeText(document.getElementById('summary-body').innerText).then(() => alert("Copiado!"));
}



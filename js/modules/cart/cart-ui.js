/**
 * Cart UI Module
 * Handles HTML generation and DOM rendering for the Cart Dashboard.
 * Part of the "Cart Refactoring Phase 3"
 */

window.CartUI = {

    /**
     * Creates the Master Card (Order)
     */
    createGroupCard: function (group) {
        const div = document.createElement('div');
        div.className = 'order-card';
        div.style.borderLeft = "4px solid var(--gold)";
        div.style.marginBottom = "30px";
        div.style.background = "var(--card-bg)";
        div.style.borderRadius = "12px";
        div.style.overflow = "hidden";
        div.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";

        const isGeneric = group.clientName.toLowerCase() === 'cliente';
        const groupIndices = JSON.stringify(group.items.map(i => i._index));

        // Header for the Group
        div.innerHTML = `
            <div class="card-header master-header" style="background: #111; padding: 25px; cursor: default; border-bottom: 1px solid #222;">
                <div style="font-size:1.8rem; cursor:pointer; opacity: 0.8;" onclick="CartUI.toggleCard(this.parentElement)">📦</div>
                
                <div style="flex: 2; cursor:pointer;" onclick="CartUI.toggleCard(this.parentElement)">
                    <div style="font-size: 1.4rem; font-weight: bold; color:${isGeneric ? '#888' : 'var(--gold)'}">${group.clientName}</div>
                    <div class="item-subtitle" style="font-size: 1rem; margin-top:5px;">
                        ${group.items.length} Itens • <span style="color:#aaa;">${group.phone || 'Sem Telefone'}</span>
                    </div>
                </div>
    
                <div style="text-align:center">
                    <div style="font-size:0.8rem; color:#888;">Total Peças</div>
                    <div style="color:#fff; font-size:1.2rem; font-weight:bold;">${group.totalQty}</div>
                </div>
    
                <div style="text-align:right">
                    <div style="font-size:0.8rem; color:#888;">Valor Total do Pedido</div>
                    <div style="color:var(--gold); font-size:1.5rem; font-weight:bold;">${group.totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
    
                <div style="text-align:right; margin-left: 20px; display:flex; gap:12px; align-items:center;">
                    <button class="btn-delete-group" onclick="deleteGroup([${group.items.map(i => i._index).join(',')}])">
                        🗑️ <span class="btn-text-mobile">Excluir Pedido</span>
                    </button>
                    <div class="toggle-btn-modern" onclick="CartUI.toggleCard(this.parentElement.parentElement)" title="Expandir/Recolher">
                        <span class="toggle-icon" style="font-size: 0.8rem; transition: transform 0.3s;">▼</span>
                    </div>
                </div>
            </div>
    
            <div class="card-details" style="display:block; padding:0; background: transparent;">
                 <!-- ITEMS LIST (V1 Style Sub-cards) -->
                 <div class="sub-items-container" style="background: #080808; padding: 20px;">
                    ${group.items.map(item => this.renderSubItemV1Style(item)).join('')}
                 </div>
            </div>
        `;

        return div;
    },

    /**
     * V1-Style Complete Card for an Item
     */
    renderSubItemV1Style: function (order) {
        // Safety checks
        if (!order || !order.item) {
            console.warn('Invalid order data:', order);
            return '<div style="color:red; padding:20px;">Erro: Dados do pedido inválidos</div>';
        }

        const item = order.item;
        const index = order._index;
        const uid = `item-${index}`;
        const pricing = item.pricing || { unit_price: 0, total_price: 0, breakdown: {} };
        const client = order.client_info || {};

        return `
        <div class="sub-item-rich" style="background: #151515; border: 1px solid #222; border-radius: 12px; margin-bottom: 20px; overflow: hidden; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <!-- Sub Header -->
            <div class="card-header sub-header" onclick="CartUI.toggleSubTabs('${uid}')" style="background: #1c1c1c; padding: 15px 20px; border-bottom: 1px solid #222; cursor:pointer; display:flex; align-items:center;">
                 <div class="product-icon-container" style="width: 50px; height: 50px; flex-shrink:0; background: #333; border-radius: 8px; display:flex; align-items:center; justify-content:center; border: 1px solid #444;">
                    ${this.getProductIconElement(item, order)}
                 </div>
                 <div class="toggle-btn-modern" style="margin-left: 10px;">
                    <span class="toggle-icon">▼</span>
                 </div>
                 
                 <div style="flex:1; margin-left: 15px;">
                    <div style="color:#fff; font-weight:bold;">${this.getProductName(item, order)}</div>
                    <div style="font-size:0.8rem; color:#888;">ID: ${order.order_id} • ${new Date(order.created_at).toLocaleDateString()}</div>
                 </div>

                 <div style="text-align:right; margin-right: 25px;">
                    <div style="font-size:0.8rem; color:#888;">Unitário</div>
                    <div style="color:var(--gold); font-weight:bold;">${(pricing?.unit_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                 </div>

                 <div style="text-align:right; display:flex; gap:12px; align-items:center;">
                    ${(order.pdfUrl || item.pdf_path) ? `
                    <a href="${order.pdfUrl || item.pdf_path}" 
                       target="_blank" 
                       onclick="event.stopPropagation()"
                       title="Abrir Ficha Técnica (PDF)"
                       class="btn-modern btn-pdf">
                       <span style="font-size: 1.1rem;">📄</span> <span class="btn-text-mobile">VISUALIZAR PDF</span>
                    </a>` : `
                    <div style="font-size: 0.75rem; color: #666; font-style: italic; margin-right: 10px;">PDF Pendente</div>
                    `}

                    <button class="btn-modern btn-edit-modern" 
                            onclick="event.stopPropagation(); editOrder(${index})" 
                            title="Editar este produto">
                        ✏️ <span class="btn-text-mobile">Editar</span>
                    </button>
                    
                    <button class="btn-delete-tiny" 
                            onclick="event.stopPropagation(); deleteOrder(${index})" 
                            title="Remover este item">✖</button>
                 </div>
            </div>

            <!-- Detail Tabs -->
            <div id="${uid}" class="item-details" style="display:none;">
                <div class="tabs-nav">
                    <button class="tab-btn active" onclick="CartUI.switchTab(this, 'prod-${uid}')">🏠 Produto & Cores ▼</button>
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'sizes-${uid}')">📏 Tamanhos ▼</button>
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'specs-${uid}')">🎨 Detalhes (Logos) ▼</button>
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'price-${uid}')">💰 Valores ▼</button>
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'client-${uid}')">👤 Cliente ▼</button>
                </div>

                <div id="prod-${uid}" class="tab-content active">
                    <div class="grid-info">
                        ${this.renderPartsList(item.specs?.parts || {})}
                    </div>
                    <div style="margin-top:20px;">
                        ${this.renderExtrasOnly(item.specs?.extras || {})}
                    </div>
                </div>

                <div id="sizes-${uid}" class="tab-content">
                    <div class="size-grid">
                        ${this.renderSizes(item.specs?.sizes || {})}
                    </div>
                </div>

                <div id="specs-${uid}" class="tab-content">
                    ${this.renderLogosAndTexts(item.specs || {})}
                </div>

                <div id="price-${uid}" class="tab-content">
                    <h3 style="color: var(--gold); font-family: 'Bebas Neue', sans-serif; margin-bottom: 20px;">Relatório de Custos & Prazos</h3>
                    
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                            <thead style="background: #2a2a2a; color: var(--gold); text-align: left;">
                                <tr>
                                    <th style="padding: 12px 15px; border-bottom: 1px solid #444; width: 40px;"></th>
                                    <th style="padding: 12px 15px; border-bottom: 1px solid #444;">Discriminação dos Valores</th>
                                    <th style="padding: 12px 15px; border-bottom: 1px solid #444; text-align: right;">Total Acumulado</th>
                                </tr>
                            </thead>
                            <tbody style="color: #ccc;">
                                ${this.generateDetailedValuesHTML(item, pricing, order)}
                            </tbody>
                            <tfoot>
                                <tr style="background:#00b4d8; color:#000; font-weight:800; text-transform:uppercase;">
                                    <td colspan="3" style="padding:15px;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:5px;">
                                            <span style="font-size:0.9rem;">TOTAL FINAL PREVISTO</span>
                                            <span style="font-size:1.4rem;">R$ ${pricing.total_price.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- PRODUCTION TIME (Mirroring Summary) -->
                    <div style="background: #222; border-left: 3px solid #00b4d8; padding: 15px; border-radius: 4px; font-size: 0.9rem; color: #aaa; line-height:1.5;">
                        <strong>📅 Previsão de Produção:</strong><br>
                        Estimativa de 15 a 25 dias úteis a partir da aprovação final.<br>
                        <span style="color:#666;">O valor unitário médio para este pedido é de <strong>${(item.pricing && item.pricing.unit_price ? item.pricing.unit_price : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.</span>
                    </div>
                </div>

                <div id="client-${uid}" class="tab-content">
                    <div class="grid-info">
                        <div class="info-grp">
                            <div class="info-label">Nome do Cliente</div>
                            <input type="text" class="input-dark" value="${client.name || ''}" placeholder="Nome..." onchange="updateClientData(${index}, 'name', this.value)">
                        </div>
                        <div class="info-grp">
                            <div class="info-label">Telefone</div>
                            <input type="text" class="input-dark" value="${client.phone || ''}" placeholder="(00) 00000-0000" onchange="updateClientData(${index}, 'phone', this.value)">
                        </div>
                        <div class="info-grp">
                            <div class="info-label">E-mail</div>
                            <input type="text" class="input-dark" value="${client.email || ''}" placeholder="email@exemplo.com" onchange="updateClientData(${index}, 'email', this.value)">
                        </div>
                    </div>
                    <div style="margin-top:20px; border-top:1px solid #333; padding-top:15px; text-align:right;">
                        <button class="btn-modern btn-pdf" style="background:#c0392b; border:none;" onclick="deleteOrder(${index})">🗑️ Excluir Item Definitivamente</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    /**
     * Helper to generate detailed values HTML
     */
    generateDetailedValuesHTML: function (item, pricing, order) {
        // Tentar obter o state original do simulador
        let state = null;
        if (order && order.DADOS_TECNICOS_JSON) {
            try {
                state = JSON.parse(order.DADOS_TECNICOS_JSON);
            } catch (e) {
                console.error('Erro ao parsear DADOS_TECNICOS_JSON:', e);
            }
        }

        // Se não conseguiu obter o state, usar item.specs como fallback
        if (!state) {
            console.warn('DADOS_TECNICOS_JSON não disponível, usando item.specs');
            state = {
                parts: item.specs?.parts || {},
                extras: item.specs?.extras || {},
                texts: item.specs?.texts || [],
                uploads: item.specs?.uploads || [],
                sizes: item.specs?.sizes || {}
            };
        }

        const icons = {
            part: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>',
            text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
            image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
        };

        let html = '';

        // 1. CONFIGURAÇÃO DE BASE
        const sizes = state.sizes || item.specs?.sizes || {};
        const sizeEntries = Object.entries(sizes).filter(([s, q]) => q > 0);
        const sizeList = sizeEntries.map(([size, qty]) => '<strong>' + qty + 'x</strong> ' + size).join(', ');

        html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">1. CONFIGURAÇÃO DE BASE</td></tr>';
        html += '<tr>';
        html += '<td style="border-bottom:1px solid #333; padding:8px 4px;"><strong>Grade</strong></td>';
        html += '<td style="border-bottom:1px solid #333; padding:8px 4px;">' + sizeList + '</td>';
        html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
        html += '<div style="font-size:0.8em; color:#888;">R$ ' + ((pricing.breakdown?.base || pricing.unit_price || 0)).toFixed(2).replace('.', ',') + ' /un</div>';
        html += '<strong>R$ ' + ((pricing.breakdown?.base || pricing.unit_price || 0) * item.qty_total).toFixed(2).replace('.', ',') + '</strong>';
        html += '</td></tr>';

        // 2. DETALHES DO PRODUTO (Cores/Partes)
        const parts = state.parts || {};
        if (Object.keys(parts).length > 0) {
            html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">DETALHES DO PRODUTO</td></tr>';

            Object.entries(parts).forEach(([partId, colorId]) => {
                const partName = partId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const rawColor = (typeof colorId === 'object' && colorId !== null) ? (colorId.value || 'N/A') : (colorId || 'N/A');
                const colorName = rawColor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.part + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>' + partName + '</strong><br>';
                html += '<span style="font-size:0.85em; color:#bbb;">' + colorName + '</span>';
                html += '</td>';
                html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#777;">Incluso</td>';
                html += '</tr>';
            });
        }

        // 3. LOGOS/IMAGENS
        const uploads = state.uploads || {};
        const config = state.config || {};
        const uploadEntries = Object.entries(uploads).filter(([zoneId, data]) => data && (data.src || data.filename));

        if (uploadEntries.length > 0) {
            uploadEntries.forEach(([zoneId, data]) => {
                const zoneName = zoneId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const fileName = data.filename || data.src || 'Imagem';
                let logoPrice = 0;

                if (!data.isCustom) {
                    if (config.zonePrices && config.zonePrices[zoneId] !== undefined) {
                        logoPrice = config.zonePrices[zoneId];
                    } else {
                        if (zoneId.includes('lat')) logoPrice = config.logoLatPrice || 0;
                        else if (zoneId.includes('leg') || zoneId.includes('perna')) logoPrice = config.legZoneAddonPrice || config.logoLegPrice || 0;
                        else if (zoneId.includes('center') || zoneId.includes('centro')) logoPrice = config.logoCenterPrice || 0;
                    }
                }

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.image + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>Logo - ' + zoneName + '</strong><br>';
                html += '<div style="font-size:0.85em; color:#bbb; line-height:1.3;">';
                html += fileName;
                if (data.isCustom) html += ' <span style="color:#FFA500; font-size:0.8em;">(Arquivo Próprio)</span>';
                html += '</div></td>';

                if (logoPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + logoPrice.toFixed(2).replace('.', ',') + ' /un</div>';
                    html += '<strong style="color:#28a745;">R$ ' + (logoPrice * item.qty_total).toFixed(2).replace('.', ',') + '</strong>';
                    html += '</td>';
                } else {
                    const note = data.isCustom ? 'Taxa Matriz (se aplicável)' : 'Incluído no Unitário';
                    const style = data.isCustom ? 'color:#FFA500;' : 'color:#28a745;';
                    html += `<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; ${style}">${note}</td>`;
                }
                html += '</tr>';
            });
        }

        // 4. TEXTOS
        const texts = state.texts || {};
        const textEntries = Object.entries(texts).filter(([zoneId, data]) => data && data.enabled && data.content);

        if (textEntries.length > 0) {
            textEntries.forEach(([zoneId, data]) => {
                const zoneName = zoneId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let textPrice = config.textPrice || 0;

                if (zoneId.includes('lat')) {
                    const uId = zoneId.replace('text_', 'logo_');
                    const hasImg = uploads[uId] && (uploads[uId].src || uploads[uId].filename);
                    if (hasImg) textPrice = config.textLatPrice || 9.90;
                    else textPrice = 0;
                } else if (zoneId.includes('leg') || zoneId.includes('perna')) {
                    textPrice = config.textLegPrice || config.textPrice || 0;
                }

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.text + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>Texto - ' + zoneName + '</strong><br>';
                html += '<div style="font-size:0.85em; color:#bbb; line-height:1.3;">';
                html += '"' + data.content + '" (' + (data.fontFamily || 'Padrão') + ')';
                html += '</div></td>';

                if (textPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + textPrice.toFixed(2).replace('.', ',') + ' /un</div>';
                    html += '<strong style="color:#28a745;">R$ ' + (textPrice * item.qty_total).toFixed(2).replace('.', ',') + '</strong>';
                    html += '</td>';
                } else {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#28a745;">Incluído no Unitário</td>';
                }
                html += '</tr>';
            });
        }

        // 5. EXTRAS
        const extras = state.extras || {};
        const extraEntries = Object.entries(extras).filter(([key, data]) => data && data.enabled);

        if (extraEntries.length > 0) {
            extraEntries.forEach(([key, data]) => {
                const extraName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let colorName = '';
                if (data.color) {
                    const rawColor = (typeof data.color === 'object' && data.color !== null) ? (data.color.value || 'N/A') : data.color;
                    colorName = rawColor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                const extraPrice = data.price || config[key + 'Price'] || 0;

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.part + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>+ ' + extraName + '</strong><br>';
                html += '<div style="font-size:0.85em; color:#bbb;">' + (colorName || 'Aplicado ao modelo') + '</div>';
                html += '</td>';

                if (extraPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + extraPrice.toFixed(2).replace('.', ',') + ' /un</div>';
                    html += '<strong style="color:#28a745;">R$ ' + (extraPrice * item.qty_total).toFixed(2).replace('.', ',') + '</strong>';
                    html += '</td>';
                } else {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#28a745;">Incluído no Unitário</td>';
                }
                html += '</tr>';
            });
        }

        // 6. DETALHAMENTO FINANCEIRO
        html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">DETALHAMENTO FINANCEIRO</td></tr>';

        const subTotalVal = (pricing.breakdown?.base || pricing.unit_price || 0) * item.qty_total;
        html += '<tr style="background: #1a1a1a;">';
        html += '<td colspan="2" style="padding: 12px 15px; border-bottom: 1px solid #333;">';
        html += '<strong>Valor Base do Pedido (' + item.qty_total + ' peças)</strong><br>';
        html += '<div style="font-size:0.8em; color:#888;">Média Unitária: R$ ' + ((pricing.breakdown?.base || pricing.unit_price || 0)).toFixed(2).replace('.', ',') + '</div>';
        html += '</td>';
        html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333;">R$ ' + subTotalVal.toFixed(2).replace('.', ',') + '</td>';
        html += '</tr>';

        if (pricing.breakdown?.dev_fees && pricing.breakdown.dev_fees > 0) {
            html += '<tr style="background:rgba(255, 165, 0, 0.1);">';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;"><strong>Taxa de Matriz</strong></td>';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;">Refere-se a criação de nova(s) matriz(es).<div style="color:#FFA500; font-size:0.85em; margin-top:2px;">⚠️ Cobrado uma única vez por pedido por arte única.</div></td>';
            html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333; color:#FFA500;">+ R$ ' + (pricing.breakdown.dev_fees).toFixed(2).replace('.', ',') + '</td>';
            html += '</tr>';
        }

        if (pricing.breakdown?.discounts && pricing.breakdown.discounts > 0) {
            html += '<tr style="background:rgba(40, 167, 69, 0.1);">';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;"><strong>Desconto Atacado</strong></td>';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;">Aplicado desconto por volume de peças.</td>';
            html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333; color:#28a745;">- R$ ' + (pricing.breakdown.discounts).toFixed(2).replace('.', ',') + '</td>';
            html += '</tr>';
        }

        html += '<tr>';
        html += '<td colspan="3" style="padding:15px 0; color:#aaa; font-size:0.9em; border-top:1px solid #444;">';
        html += '<strong>📅 Previsão Estimada:</strong> 15 a 25 dias úteis';
        html += '</td></tr>';

        return html;
    },

    // --- HELPER RENDERS ---

    renderPartsList: function (parts) {
        if (!parts) return '';
        return Object.keys(parts).map(key => {
            const p = parts[key];
            const colorValue = (typeof p === 'object' && p !== null) ? (p.value || 'N/A') : (p || 'N/A');
            const colorHex = (typeof p === 'object' && p !== null) ? (p.hex || '#333') : '#333';

            return `
            <div class="info-grp">
                <div class="info-label">${key}</div>
                <div class="info-val">
                    <span style="display:inline-block; width:12px; height:12px; background:${colorHex}; border-radius:50%; margin-right:5px;"></span>
                    ${colorValue}
                </div>
            </div>`;
        }).join('');
    },

    renderExtrasOnly: function (extras) {
        if (!extras || Object.keys(extras).length === 0) return '';
        return '<h4>Extras / Acabamentos</h4>' + Object.keys(extras).map(key => {
            const e = extras[key];
            const val = (typeof e === 'object' && e !== null) ? (e.value || 'N/A') : (e || 'N/A');
            return `<span style="background:#333; padding:4px 8px; border-radius:4px; margin-right:10px; font-size:0.9rem;">${key}: <strong>${val}</strong></span>`;
        }).join('');
    },

    renderSizes: function (sizes) {
        if (!sizes) return '';
        return Object.keys(sizes).map(key => {
            const val = sizes[key];
            if (val > 0) {
                return `
                <div class="size-box">
                    <div class="size-bx-label">${key}</div>
                    <div class="size-bx-val">${val}</div>
                </div>`;
            }
            return '';
        }).join('');
    },

    renderLogosAndTexts: function (specs) {
        let html = '';

        // Uploads / Logos
        if (specs.uploads && specs.uploads.length > 0) {
            html += '<h4 style="color:var(--gold); border-bottom:1px solid #444; padding-bottom:5px; margin-top:20px;">🖼️ LOGOTIPOS & ARTES</h4>';
            html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px;">';
            specs.uploads.forEach(u => {
                html += `
                <div style="background:#222; padding:12px; border-radius:6px; border-left:3px solid var(--gold);">
                    <div style="font-weight:bold; color:#fff; margin-bottom:5px;">${u.zone_label}</div>
                    <div style="font-size:0.85rem; color:#888; line-height:1.4;">
                        <strong>Arquivo:</strong> ${u.file_name}<br>
                        <strong>Origem:</strong> ${u.is_custom ? 'Upload do Cliente' : 'Acervo Hanuthai'}<br>
                        <span style="color:#ffa500;">${u.is_custom ? '⚠️ Criação de Matriz Necessária' : '✅ Matriz já existente'}</span>
                    </div>
                    ${u.file_url ? `<a href="${u.file_url}" download="Logo_${u.zone_label}.png" class="btn btn-outline" style="font-size:0.7rem; padding:4px 8px; margin-top:10px; display:inline-block;">Baixar Arquivo</a>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        // Texts
        if (specs.texts && specs.texts.length > 0) {
            html += '<h4 style="color:var(--gold); border-bottom:1px solid #444; padding-bottom:5px; margin-top:25px;">🔤 TEXTOS PERSONALIZADOS</h4>';
            html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px;">';
            specs.texts.forEach(t => {
                html += `
                <div style="background:#222; padding:12px; border-radius:6px; border-left:3px solid ${t.color_hex};">
                    <div style="font-weight:bold; color:#fff; margin-bottom:5px;">${t.zone_label}</div>
                    <div style="font-size:1.1rem; margin-bottom:8px; color:var(--gold);">"${t.content}"</div>
                    <div style="font-size:0.85rem; color:#888;">
                        <strong>Fonte:</strong> ${t.font_family}<br>
                        <strong>Cor:</strong> ${t.color_name || t.color_hex}
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // Observations
        if (specs.observations && specs.observations.trim().length > 0) {
            html += '<h4 style="color:#fff; border-bottom:1px solid #444; padding-bottom:5px; margin-top:25px;">📝 OBSERVAÇÕES</h4>';
            html += `<div style="background:#222; padding:15px; border-radius:6px; border-left:3px solid #ccc; color:#ddd; margin-top:10px; font-style:italic;">
                        "${specs.observations.replace(/\n/g, '<br>')}"
                     </div>`;
        }

        if (!html) html = '<p style="color:#666; font-style:italic; padding:20px;">Nenhuma personalização de imagem ou texto encontrada para este item.</p>';

        return html;
    },

    getProductName: function (item, order) {
        if (item.model_name && item.model_name !== 'Produto Personalizado' && item.model_name !== 'custom') {
            return item.model_name;
        }

        // Try to refine from saved state
        if (order && order.DADOS_TECNICOS_JSON) {
            try {
                const state = JSON.parse(order.DADOS_TECNICOS_JSON);
                if (state.config && state.config.product) return state.config.product;
                if (state.productInitial) {
                    const map = {
                        'SH': 'Shorts Fight',
                        'TP': 'Top',
                        'LG': 'Legging',
                        'CL': 'Calça Legging',
                        'ML': 'Moletom',
                        'SL': 'Shorts Legging'
                    };
                    if (map[state.productInitial]) return map[state.productInitial];
                }
            } catch (e) {
                console.warn('Error parsing state for name detection', e);
            }
        }

        const fallbackMap = {
            'shorts': 'Shorts Fight',
            'top': 'Top',
            'legging': 'Legging',
            'moletom': 'Moletom',
            'shorts_legging': 'Shorts Legging',
            'calca_legging': 'Calça Legging'
        };

        return fallbackMap[item.simulator_type?.toLowerCase()] || item.model_name || 'Produto Personalizado';
    },

    // --- INTERACTION HANDLERS ---

    toggleCard: function (header) {
        const card = header.classList.contains('order-card') ? header : header.parentElement;
        card.classList.toggle('expanded');
    },

    switchTab: function (btn, targetId) {
        const card = btn.closest('.card-details');
        card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        card.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetId).classList.add('active');
    },

    toggleSubTabs: function (uid) {
        const el = document.getElementById(uid);
        const header = el.previousElementSibling;
        const icon = header.querySelector('.toggle-icon');

        const isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';

        if (icon) {
            icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    },

    getProductIconElement: function (item, order) {
        const type = item.simulator_type || '';
        const iconMap = {
            'shorts': 'assets/ui-icons/icon-fight-shorts.png',
            'shorts_fight': 'assets/ui-icons/icon-fight-shorts.png',
            'shorts_legging': 'assets/ui-icons/icon-shorts-calca-legging.png',
            'legging': 'assets/ui-icons/icon-calca-legging.png',
            'calca-legging': 'assets/ui-icons/icon-calca-legging.png',
            'moletom': 'assets/ui-icons/icon-moletom.png',
            'top': 'assets/ui-icons/icon-top.png'
        };

        const iconPath = iconMap[type.toLowerCase().replace(/\s+/g, '_')] || iconMap[type.toLowerCase()] || 'assets/ui-icons/icon-fight-shorts.png';

        if (iconPath) {
            return `<img src="${iconPath}" alt="${type}" style="width:70%; height:70%; object-fit:contain; filter: brightness(1.2);">`;
        }

        return `<span style="font-size:0.7rem; color:#666; font-weight:bold;">${type.substring(0, 3).toUpperCase()}</span>`;
    }
};

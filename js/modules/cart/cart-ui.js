/**
 * Cart UI Module
 * Handles HTML generation and DOM rendering for the Cart Dashboard.
 * Part of the "Cart Refactoring Phase 3"
 */

const config = window.config || {};

/**
 * Mapeamento de IDs técnicos de zona para nomes legíveis pelo cliente.
 * Cobre todos os simuladores: Shorts Fight, Shorts Legging, Calça Legging, Moletom, Top.
 */
const ZONE_LABEL_MAP = {
    // === SHORTS FIGHT ===
    'logo_centro': 'Frente Centro',
    'logo_lat_dir': 'Lateral Direita',
    'logo_lat_esq': 'Lateral Esquerda',
    'leg_right_mid_ie': 'Perna Dir. Centro (Padrão)',
    'leg_right_mid_ii': 'Perna Dir. Centro (Reduzido)',
    'leg_right_bottom_ie': 'Perna Dir. Inferior (Padrão)',
    'leg_right_bottom_ii': 'Perna Dir. Inferior (Reduzido)',
    'leg_left_mid': 'Perna Esquerda',
    // Textos do Shorts Fight
    'text_centro': 'Texto – Frente Centro',
    'text_lat_dir': 'Texto – Lateral Direita',
    'text_lat_esq': 'Texto – Lateral Esquerda',
    'text_leg_right_mid': 'Texto – Perna Dir. Centro',
    'text_leg_right_bottom': 'Texto – Perna Dir. Inferior',
    'text_leg_left_mid': 'Texto – Perna Esquerda',
    // === SHORTS LEGGING / CALÇA LEGGING ===
    'lateral_direita': 'Lateral Direita',
    'lateral_esquerda': 'Lateral Esquerda',
    'perna_direita': 'Perna Direita',
    'perna_esquerda': 'Perna Esquerda',
    // === MOLETOM / TOP ===
    'frente_centro': 'Frente Centro',
    'costas_centro': 'Costas Centro',
    'frente_esq': 'Frente Esquerda',
    'frente_dir': 'Frente Direita',
    'costas_sup': 'Costas Superior',
    'costas_inf': 'Costas Inferior',
    'manga_dir': 'Manga Direita',
    'manga_esq': 'Manga Esquerda',
    'capuz': 'Capuz',
    'bolso': 'Bolso',
    // Textos genéricos
    'text_frente_centro': 'Texto – Frente Centro',
    'text_costas_centro': 'Texto – Costas Centro',
    'text_lateral_direita': 'Texto – Lateral Direita',
    'text_lateral_esquerda': 'Texto – Lateral Esquerda',
    'text_perna_direita': 'Texto – Perna Direita',
    'text_perna_esquerda': 'Texto – Perna Esquerda',
};

/**
 * Retorna o nome legível de uma zona pelo seu ID técnico.
 * Fallback: converte underscores em espaços e capitaliza.
 */
window.resolveZoneLabel = function (zoneId) {
    if (!zoneId) return 'Zona';
    if (ZONE_LABEL_MAP[zoneId]) return ZONE_LABEL_MAP[zoneId];
    // Fallback humanizado: remove prefixo "text_" e formata
    return zoneId
        .replace(/^text_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

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
                <div style="font-size:1.8rem; cursor:pointer;" onclick="CartUI.toggleCard(this.parentElement)">🛒</div>
                
                <div style="flex: 2; cursor:pointer; margin-left: 15px;" onclick="CartUI.toggleCard(this.parentElement)">
                    <div style="font-size: 1.4rem; font-weight: bold; color:var(--gold)">Itens da Simulação</div>
                    <div class="item-subtitle" style="font-size: 1rem; margin-top:5px; color:#aaa;">
                        ${group.items.length} Produto(s)
                    </div>
                </div>
    
                <div style="text-align:center">
                    <div style="font-size:0.8rem; color:#888;">Total Peças</div>
                    <div style="color:#fff; font-size:1.2rem; font-weight:bold;">${group.totalQty}</div>
                </div>
    
                <div style="text-align:right">
                    <div style="font-size:0.8rem; color:#888;">Subtotal</div>
                    <div style="color:var(--gold); font-size:1.5rem; font-weight:bold;">${group.totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
    
                <div style="text-align:right; margin-left: 20px; display:flex; gap:12px; align-items:center;">
                    <div class="toggle-btn-modern" onclick="CartUI.toggleCard(this.parentElement.parentElement)" title="Expandir/Recolher">
                        <span class="toggle-icon" style="font-size: 0.8rem; transition: transform 0.3s;">▼</span>
                    </div>
                </div>
            </div>
    
            <div class="card-details expanded" style="display:block; padding:0; background: transparent;">
                 <!-- ITEMS LIST -->
                 <div class="sub-items-container" style="background: #080808; padding: 20px;">
                    ${group.items.map((item, idx) => this.renderSubItemV1Style(item, idx + 1, group.items.length)).join('')}
                 </div>
            </div>
        `;

        return div;
    },

    /**
     * V1-Style Complete Card for an Item
     */
    renderSubItemV1Style: function (order, currentItem = 1, totalItems = 1) {
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
        const esc = (s) => (window.Security ? window.Security.escape(s) : s);

        let state = null;
        if (order && order.DADOS_TECNICOS_JSON) {
            try {
                state = JSON.parse(order.DADOS_TECNICOS_JSON);
            } catch (e) { console.warn("Failed to parse DADOS_TECNICOS", e); }
        }
        if (!state) state = item.specs || {};

        // Unify observations (many possible keys)
        const obs = (
            item.specs?.observations ||
            state.observations ||
            state.observacoes ||
            order.observations ||
            order.observacoes ||
            ""
        ).toString().trim();

        const hasObs = obs.length > 0;

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
                 
                 <div style="flex:1; margin-left: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="color:#fff; font-weight:bold;">${esc(this.getProductName(item, order))}</div>
                        <div style="font-size:0.8rem; color:#aaa; font-weight: 500;">PEDIDO: <span style="color:var(--gold);">${esc(state.orderNumber || item.specs?.orderNumber || '---')}</span></div>
                        <div style="font-size:0.7rem; color:#666; margin-top: 2px;">
                            ID: <span style="color:#888;">${esc(state.simulationId || order.ID_SIMULACAO || '---')}</span> • 
                            ${order.created_at ? new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                        </div>
                    </div>
                    <div style="color:var(--gold); font-size: 1.1rem; font-family: 'Bebas Neue', sans-serif; border: 1px solid #333; padding: 4px 10px; border-radius: 8px; margin-right: 25px; min-width: 45px; text-align: center; background: #111;">
                        ${currentItem}/${totalItems}
                    </div>
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
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'specs-${uid}')">🎨 Lógos/Textos ▼</button>
                    <button class="tab-btn" onclick="CartUI.switchTab(this, 'price-${uid}')">💰 Valores ▼</button>
                    <button class="tab-btn" style="color:#00b4d8; font-weight:bold;" onclick="CartUI.switchTab(this, 'ship-${uid}')">📅 Logística ▼</button>
                    <button class="tab-btn" style="color:#ffa500; font-weight:bold;" onclick="CartUI.switchTab(this, 'obs-${uid}')">📝 Observações ▼</button>
                </div>

                <div id="prod-${uid}" class="tab-content active">
                    <div class="grid-info">
                        ${this.renderPartsList(state.parts || {}, state.color)}
                        ${state.hntLogoColor ? `
                            <div class="info-grp">
                                <div class="info-label">Logo HNT</div>
                                <div class="info-val">
                                    <span style="display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:5px; border:1px solid #444; background:${(state.hntLogoColor === 'branco' || state.hntLogoColor === '#FFFFFF') ? '#fff' : (state.hntLogoColor === 'preto' || state.hntLogoColor === '#000') ? '#000' : '#888'}"></span>
                                    ${state.hntLogoColor.toUpperCase()}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    ${hasObs ? `
                        <div style="margin:15px 0; padding:12px; background:rgba(212, 175, 55, 0.05); border: 1px dashed rgba(212, 175, 55, 0.3); border-radius: 8px; font-size:0.9rem; color:#ccc;">
                            <strong style="color:var(--gold);">📝 Obs:</strong> Tem observações adicionais (Veja a aba "Observações").
                        </div>
                    ` : ''}
                    <div style="margin-top:20px;">
                        ${this.renderExtrasOnly(state.extras || {}, state.config || {})}
                    </div>
                </div>

                <div id="sizes-${uid}" class="tab-content">
                    <div class="size-grid">
                        ${this.renderSizes(state.sizes || {})}
                    </div>
                </div>

                <div id="specs-${uid}" class="tab-content">
                    ${this.renderLogosAndTexts(state || {})}
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

                    <!-- PRODUCTION TIME -->
                    <div style="background: #222; border-left: 3px solid #00b4d8; padding: 15px; border-radius: 4px; font-size: 0.9rem; color: #aaa; line-height:1.5;">
                        <strong>📅 Previsão de Produção:</strong><br>
                        Estimativa de 15 a 25 dias úteis a partir da aprovação final.
                    </div>
                </div>

                <div id="ship-${uid}" class="tab-content">
                    <h3 style="color: var(--gold); font-family: 'Bebas Neue', sans-serif; margin-bottom: 20px;">📅 Logística & Prazos</h3>
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px;">
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div style="background:#222; padding:15px; border-radius:8px; border-left:3px solid var(--gold);">
                                <div style="font-size:0.8rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Data do Pedido</div>
                                <div style="font-size:1.2rem; color:#fff; font-weight:bold;">${new Date(order.logistics?.orderDate || order.created_at).toLocaleDateString()}</div>
                            </div>
                            <div style="background:#222; padding:15px; border-radius:8px; border-left:3px solid #00b4d8;">
                                <div style="font-size:0.8rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Previsão de Entrega</div>
                                <div style="font-size:1.2rem; color:#fff; font-weight:bold;">${order.logistics?.deliveryDate || '15 a 25 dias úteis'}</div>
                            </div>
                            <div style="background:#222; padding:15px; border-radius:8px; border-left:3px solid #28a745;">
                                <div style="font-size:0.8rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Contato Cadastrado</div>
                                <div style="font-size:1.2rem; color:#fff; font-weight:bold;">${order.logistics?.phone || 'Não informado'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="obs-${uid}" class="tab-content">
                    <h3 style="color: var(--gold); font-family: 'Bebas Neue', sans-serif; margin-bottom: 20px;">📝 Observações do Cliente</h3>
                    <div style="background: #1a1a1a; padding: 20px; border: 1px dashed var(--gold); border-radius: 8px; font-size: 1rem; color: #ddd; line-height: 1.6; white-space: pre-wrap;">${esc(obs) || "Nenhuma observação informada."}</div>
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
            state = {
                parts: item.specs?.parts || {},
                extras: item.specs?.extras || {},
                texts: item.specs?.texts || [],
                uploads: item.specs?.uploads || [],
                sizes: item.specs?.sizes || {}
            };
        }

        const config = state?.config || {};
        const icons = {
            part: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>',
            text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
            image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
        };

        const fmt = (v) => (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const esc = (s) => (window.Security ? window.Security.escape(s) : s);

        let html = '';

        // 1. CONFIGURAÇÃO DE BASE
        const sizes = state.sizes || item.specs?.sizes || {};
        const sizeEntries = Object.entries(sizes).filter(([s, q]) => q > 0);
        const sizeList = sizeEntries.map(([size, qty]) => '<strong>' + qty + 'x</strong> ' + size).join(', ');

        const baseP = config.basePrice || pricing.breakdown?.base || pricing.unit_price;
        // Se o baseP for igual ao unit_price e tivermos logos/extras, então o unit_price já incluiu tudo.
        // Tentar deduzir o base real se for shorts (149.90) ou calça (159.90) como fallback extremo
        const hasUploads = state.uploads && (Array.isArray(state.uploads) ? state.uploads.length > 0 : Object.keys(state.uploads).length > 0);
        const hasExtras = state.extras && Object.keys(state.extras).length > 0;
        const isActuallyTotal = (baseP === pricing.unit_price && (hasUploads || hasExtras));
        const finalBaseP = isActuallyTotal ? (item.simulator_type === 'shorts' ? 149.90 : 139.90) : baseP;

        html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">1. CONFIGURAÇÃO DE BASE</td></tr>';
        html += '<tr>';
        html += '<td style="border-bottom:1px solid #333; padding:8px 4px;"><strong>Grade</strong></td>';
        html += '<td style="border-bottom:1px solid #333; padding:8px 4px;">' + sizeList + '</td>';
        html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
        html += '<div style="font-size:0.8em; color:#888;">R$ ' + fmt(finalBaseP) + ' /un</div>';
        html += '<strong>R$ ' + fmt(finalBaseP * item.qty_total) + '</strong>';
        html += '</td></tr>';

        // 2. DETALHES DO PRODUTO (Cores/Partes)
        const parts = state.parts || {};
        if (Object.keys(parts).length > 0) {
            html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">2. DETALHES DO PRODUTO</td></tr>';

            Object.entries(parts).forEach(([partId, colorId]) => {
                const partName = partId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const rawColor = (typeof colorId === 'object' && colorId !== null) ? (colorId.value || 'N/A') : (colorId || 'N/A');
                const colorName = rawColor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.part + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>' + esc(partName) + '</strong><br>';
                html += '<span style="font-size:0.85em; color:#bbb;">' + esc(colorName) + '</span>';
                html += '</td>';
                html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#28a745;">Incluso</td>';
                html += '</tr>';
            });
        }

        // 3. LOGOS/IMAGENS
        const rawUploads = state.uploads || item.specs?.uploads || {};
        const uploadEntries = Array.isArray(rawUploads)
            ? rawUploads.map(u => [u.zone_id || 'pos', u])
            : Object.entries(rawUploads).filter(([zoneId, data]) => data && (data.src || data.filename || data.file_name));

        if (uploadEntries.length > 0) {
            html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">3. LOGOTIPOS & ARTES</td></tr>';
            uploadEntries.forEach(([zoneId, data]) => {
                const zoneName = window.resolveZoneLabel(zoneId) || data.zone_label || zoneId;
                const fileName = data.file_name || data.filename || data.file_url || data.src || 'Imagem';
                // Prioritize saved unit_price from specs
                let logoPrice = data.unit_price || 0;

                if (logoPrice === 0 && !data.isCustom && !data.is_custom) {
                    const zid = (zoneId || '').toLowerCase().trim();
                    const zlb = (zoneName || '').toLowerCase().trim();
                    const zp = config.zonePrices || {};

                    // 1. Direct match with ID or Label
                    let found = undefined;
                    Object.keys(zp).forEach(k => {
                        const lk = k.toLowerCase().trim();
                        if (lk === zid || lk === zlb) found = zp[k];
                    });

                    if (found !== undefined) {
                        logoPrice = found;
                    } else {
                        // 2. Keyword fallback (aligned with simulator logic)
                        if (zid.includes('lat') || zlb.includes('lateral')) {
                            logoPrice = config.logoLatPrice || 0;
                        } else if (zid.includes('leg') || zid.includes('perna') || zlb.includes('perna')) {
                            logoPrice = config.legZoneAddonPrice || config.logoLegPrice || 0;
                        } else if (zid.includes('center') || zid.includes('centro') || zlb.includes('centro')) {
                            // Hardcoded fallback for HNT standard (29.90) if config is missing
                            logoPrice = config.logoCenterPrice !== undefined ? config.logoCenterPrice : 29.90;
                        }
                    }
                }

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.image + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>Logo - ' + zoneName + '</strong><br>';
                html += fileName;
                if (data.isCustom || data.is_custom) html += ' <span style="color:#FFA500; font-size:0.8em;">(Arquivo Próprio)</span>';
                html += '</td>';

                if (logoPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + fmt(logoPrice) + ' /un</div>';
                    html += '<strong style="color:#ffa500;">+ R$ ' + fmt(logoPrice * item.qty_total) + '</strong>';
                    html += '</td>';
                } else {
                    const note = (data.isCustom || data.is_custom) ? 'Taxa Matriz (se aplicável)' : 'Incluso';
                    const colorStyle = (data.isCustom || data.is_custom) ? 'color:#FFA500;' : 'color:#28a745;';
                    html += `<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; ${colorStyle}">${note}</td>`;
                }
                html += '</tr>';
            });
        }

        // 4. TEXTOS
        const rawTexts = state.texts || item.specs?.texts || {};
        const textEntries = Array.isArray(rawTexts)
            ? rawTexts.map(t => [t.zone_id || 'pos', t])
            : Object.entries(rawTexts).filter(([zoneId, data]) => data && data.enabled && data.content);

        if (textEntries.length > 0) {
            html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">4. TEXTOS PERSONALIZADOS</td></tr>';
            textEntries.forEach(([zoneId, data]) => {
                const zoneName = window.resolveZoneLabel(zoneId) || data.zone_label || zoneId;
                // Prioritize saved unit_price
                let textPrice = data.unit_price || 0;

                if (textPrice === 0) {
                    const zid = (zoneId || '').toLowerCase();
                    const zlb = zoneName.toLowerCase();

                    if (zid.includes('lat') || zlb.includes('lateral')) {
                        // Verifier if there's an image in the same zone to match HNT rule
                        const uId = zoneId.replace('text_', 'logo_');
                        const hasImg = uploadEntries.some(e => e[0] === uId || e[1].zone_label === data.zone_label);
                        if (hasImg) textPrice = config.textLatPrice || 0;
                        else textPrice = 0; // Usually free if no logo, or handles elsewhere
                    } else if (zid.includes('leg') || zid.includes('perna') || zlb.includes('perna')) {
                        textPrice = config.textLegPrice || config.textPrice || 0;
                    } else {
                        textPrice = config.textPrice || 19.90;
                    }
                }

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.text + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>Texto - ' + esc(zoneName) + '</strong><br>';
                html += '"' + esc(data.content) + '" (' + esc(data.fontFamily || data.font_family || 'Padrão') + ')';
                html += '</td>';

                if (textPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + fmt(textPrice) + ' /un</div>';
                    html += '<strong style="color:#ffa500;">+ R$ ' + fmt(textPrice * item.qty_total) + '</strong>';
                    html += '</td>';
                } else {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#28a745;">Incluso</td>';
                }
                html += '</tr>';
            });
        }

        // 5. EXTRAS
        const extras = state.extras || item.specs?.extras || {};
        const extraEntries = Object.entries(extras).filter(([key, data]) => {
            if (!data) return false;
            // Allow objects with enabled/active flag
            if (typeof data === 'object') return data.enabled || data.active;
            // Allow primitive truthy values (booleans or "sim")
            return data === true || String(data).toLowerCase() === 'sim' || String(data).toLowerCase() === 'yes';
        });

        if (extraEntries.length > 0) {
            html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">5. EXTRAS / ACABAMENTOS</td></tr>';
            extraEntries.forEach(([key, data]) => {
                const extraName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let colorName = '';

                if (data && typeof data === 'object') {
                    if (data.color || data.value) {
                        const rawColor = data.value || (typeof data.color === 'object' ? data.color?.value : data.color);
                        colorName = (rawColor || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                } else {
                    colorName = 'SIM';
                }

                // Logic for Extra Price (match pricing.js)
                let extraPrice = (data && typeof data === 'object') ? (data.price || 0) : 0;
                if (extraPrice === 0) {
                    // Try to find in config
                    const eId = data.id || key.toLowerCase().replace(/\s+/g, '_');
                    extraPrice = (config.extraPrices && config.extraPrices[eId] !== undefined)
                        ? config.extraPrices[eId]
                        : (config[eId + 'Price'] || 0);

                    // Hardcoded fallback for HNT standard extras seen in screenshots
                    if (extraPrice === 0) {
                        const lowKey = key.toLowerCase();
                        if (lowKey.includes('legging')) extraPrice = 38.90;
                        if (lowKey.includes('cordao') || lowKey.includes('laco')) extraPrice = 14.90;
                    }
                }

                html += '<tr>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; vertical-align:top;">' + icons.part + '</td>';
                html += '<td style="border-bottom:1px solid #333; padding:8px 4px; word-break:break-word;">';
                html += '<strong>+ ' + esc(extraName) + '</strong><br>';
                html += '<span style="font-size:0.85em; color:#bbb;">' + esc(colorName || 'Selecionado') + '</span>';
                html += '</td>';

                if (extraPrice > 0) {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px;">';
                    html += '<div style="font-size:0.8em; color:#888;">R$ ' + fmt(extraPrice) + ' /un</div>';
                    html += '<strong style="color:#ffa500;">+ R$ ' + fmt(extraPrice * item.qty_total) + '</strong>';
                    html += '</td>';
                } else {
                    html += '<td class="text-right" style="border-bottom:1px solid #333; padding:8px 4px; color:#28a745;">Incluso</td>';
                }
                html += '</tr>';
            });
        }

        // 6. DETALHAMENTO FINANCEIRO
        html += '<tr style="background: #2C2C2C;"><td colspan="3" style="padding: 10px 15px; font-weight: bold; color: #fff;">DETALHAMENTO FINANCEIRO</td></tr>';

        const unitBaseTotal = pricing.unit_price || (pricing.total_price / item.qty_total);
        const subTotalVal = unitBaseTotal * item.qty_total;

        html += '<tr style="background: #1a1a1a;">';
        html += '<td colspan="2" style="padding: 12px 15px; border-bottom: 1px solid #333;">';
        html += '<strong>Valor Base do Pedido (' + item.qty_total + ' peças)</strong><br>';
        html += '<div style="font-size:0.8em; color:#888;">Média Unitária: R$ ' + fmt(unitBaseTotal) + '</div>';
        html += '</td>';
        html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333;">R$ ' + fmt(subTotalVal) + '</td>';
        html += '</tr>';

        if (pricing.breakdown?.dev_fees && pricing.breakdown.dev_fees > 0) {
            html += '<tr style="background:rgba(255, 165, 0, 0.1);">';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;"><strong>Taxa de Matriz</strong></td>';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;">Criação de matriz(es) para bordado.<div style="color:#FFA500; font-size:0.85em; margin-top:2px;">⚠️ Cobrado uma única vez.</div></td>';
            html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333; color:#FFA500;">+ R$ ' + fmt(pricing.breakdown.dev_fees) + '</td>';
            html += '</tr>';
        }

        if (pricing.breakdown?.discounts && pricing.breakdown.discounts > 0) {
            html += '<tr style="background:rgba(40, 167, 69, 0.1);">';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;"><strong>Desconto Atacado</strong></td>';
            html += '<td style="padding: 12px 15px; border-bottom: 1px solid #333;">Desconto por volume aplicado.</td>';
            html += '<td class="text-right" style="padding: 12px 15px; border-bottom: 1px solid #333; color:#28a745;">- R$ ' + fmt(pricing.breakdown.discounts) + '</td>';
            html += '</tr>';
        }

        html += '<tr>';
        html += '<td colspan="3" style="padding:15px 0; color:#aaa; font-size:0.9em; border-top:1px solid #444;">';
        html += '<strong>📅 Previsão Estimada:</strong> 15 a 25 dias úteis';
        html += '</td></tr>';

        return html;
    },

    // --- HELPER RENDERS ---

    renderPartsList: function (parts, primaryColor = null) {
        if (!parts || Object.keys(parts).length === 0) {
            if (primaryColor) {
                return `
                <div class="info-grp">
                    <div class="info-label">Cor Principal</div>
                    <div class="info-val">
                        ${window.Security ? window.Security.escape(primaryColor) : primaryColor}
                    </div>
                </div>`;
            }
            return '';
        }
        return Object.keys(parts).map(key => {
            const p = parts[key];
            const colorValue = (typeof p === 'object' && p !== null) ? (p.value || 'N/A') : (p || 'N/A');
            const colorHex = (typeof p === 'object' && p !== null) ? (p.hex || '#333') : '#333';
            const partLabel = window.resolveZoneLabel(key);

            return `
            <div class="info-grp">
                <div class="info-label">${partLabel}</div>
                <div class="info-val">
                    <span style="display:inline-block; width:12px; height:12px; background:${colorHex}; border-radius:50%; margin-right:5px;"></span>
                    ${window.Security ? window.Security.escape(colorValue) : colorValue}
                </div>
            </div>`;
        }).join('');
    },

    renderExtrasOnly: function (extras, config = {}) {
        let allExtras = extras ? { ...extras } : {};

        // Add config-based upgrades if not in extras
        if (config.logoPunho) allExtras['logo_punho'] = 'ATIVO';

        if (Object.keys(allExtras).length === 0) return '';
        const validExtras = Object.entries(allExtras).filter(([key, e]) => {
            if (!e) return false;
            // Support object formats {enabled: true, value: "Color"}
            if (typeof e === 'object') return e.enabled || e.active;
            // Support primitive formats like true or "SIM"
            return e === true || String(e).toLowerCase() === 'sim' || String(e).toLowerCase() === 'yes';
        });
        if (validExtras.length === 0) return '';

        return '<h4 style="margin:0 0 10px 0; color:#888;">Extras / Acabamentos</h4><div style="display:flex; flex-wrap:wrap; gap:8px;">' + validExtras.map(([key, e]) => {
            const val = (typeof e === 'object' && e !== null) ? (e.value || 'SIM') : (e || 'SIM');
            const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const esc = (s) => (window.Security ? window.Security.escape(s) : s);
            return `<span style="background:#222; padding:6px 10px; border-radius:6px; font-size:0.85rem; border-left:3px solid var(--gold); color:#eee;">${esc(cleanKey)}: <strong style="color:#fff;">${esc(val)}</strong></span>`;
        }).join('') + '</div>';
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
        const config = specs?.config || {};
        let html = '';

        // Normalização: Converter objetos em arrays se necessário
        const uploads = Array.isArray(specs.uploads) ? specs.uploads : (specs.uploads ? Object.entries(specs.uploads).map(([id, u]) => ({ ...u, zone_id: id })) : []);
        const texts = Array.isArray(specs.texts) ? specs.texts : (specs.texts ? Object.entries(specs.texts).map(([id, t]) => ({ ...t, zone_id: id })) : []);

        // 1. Logos
        if (uploads.length > 0) {
            html += '<h4 style="color:var(--gold); border-bottom:1px solid #444; padding-bottom:5px; margin-top:20px;">🖼️ LOGOTIPOS & ARTES</h4>';
            html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px;">';
            uploads.forEach(u => {
                const src = u.file_url || u.src;
                const name = u.file_name || u.filename || 'Imagem';
                const label = window.resolveZoneLabel(u.zone_id || u.zone_label);
                const isCustom = u.is_custom || u.isCustom;

                const esc = (s) => (window.Security ? window.Security.escape(s) : s);
                html += `
                <div style="background:#222; padding:12px; border-radius:6px; border-left:3px solid var(--gold);">
                    <div style="font-weight:bold; color:#fff; margin-bottom:5px;">${esc(label)}</div>
                    <div style="font-size:0.85rem; color:#888; line-height:1.4;">
                        <strong>Arquivo:</strong> ${esc(name)}<br>
                        <strong>Origem:</strong> ${isCustom ? 'Upload do Cliente' : 'Acervo Hanuthai'}<br>
                        <span style="color:#ffa500;">${isCustom ? '⚠️ Criação de Matriz Necessária' : '✅ Matriz já existente'}</span>
                    </div>
                    ${src ? `<a href="${src}" download="Logo_${esc(label)}.png" class="btn btn-outline" style="font-size:0.7rem; padding:4px 8px; margin-top:10px; display:inline-block;">Baixar Arquivo</a>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        // 2. Textos
        if (texts.length > 0) {
            html += '<h4 style="color:var(--gold); border-bottom:1px solid #444; padding-bottom:5px; margin-top:25px;">🔤 TEXTOS PERSONALIZADOS</h4>';
            html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px;">';
            texts.forEach(t => {
                const content = t.content;
                const label = window.resolveZoneLabel(t.zone_id || t.zone_label);
                const colorHex = t.color_hex || t.color || '#fff';
                const font = t.font_family || t.fontFamily || 'Standard';

                const esc = (s) => (window.Security ? window.Security.escape(s) : s);
                html += `
                <div style="background:#222; padding:12px; border-radius:6px; border-left:3px solid ${colorHex};">
                    <div style="font-weight:bold; color:#fff; margin-bottom:5px;">${esc(label)}</div>
                    <div style="font-size:1.1rem; margin-bottom:8px; color:var(--gold);">"${esc(content)}"</div>
                    <div style="font-size:0.85rem; color:#888;">
                        <strong>Fonte:</strong> ${esc(font)}<br>
                        <strong>Cor:</strong> ${esc(t.color_name || colorHex)}
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // 3. Observations omitted here to avoid duplication with the dedicated tab

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
        const itemContainer = btn.closest('.sub-item-rich') || btn.closest('.card-details');
        if (!itemContainer) return;
        itemContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        itemContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
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

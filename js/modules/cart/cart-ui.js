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
        const esc = (s) => (window.Security ? window.Security.escape(s) : s);

        let state = null;
        if (order && order.DADOS_TECNICOS_JSON) {
            try {
                const parsed = JSON.parse(order.DADOS_TECNICOS_JSON);
                state = (parsed && parsed.specs) ? { ...parsed, ...parsed.specs } : parsed;
            } catch (e) { console.warn("Failed to parse DADOS_TECNICOS", e); }
        }
        if (!state) {
            // item.specs already normalized by cart-controller
            const normalizedSpecs = item.specs || {};

            // Also try: order.json_tec (direct Supabase format)
            const jsonTec = order.json_tec;
            if (jsonTec) {
                // If json_tec has nested specs, flatten it, otherwise use it as is
                const techSpecs = jsonTec.specs || {};
                state = { ...jsonTec, ...techSpecs, ...normalizedSpecs };
            } else {
                state = normalizedSpecs;
            }
        }

        const obs = (
            item.specs?.observations ||
            state.observations ||
            state.observacoes ||
            order.observations ||
            order.observacoes ||
            ""
        ).toString().trim();

        // === ORDER NUMBER ===
        const orderNum = (() => {
            if (order.order_number && order.order_number !== '---') return order.order_number;
            const id = order.order_id || state.simulationId || order.ID_SIMULACAO || '';
            const prefixMatch = id.match(/^(\d{6})/);
            if (prefixMatch) return prefixMatch[1];
            const match = id.match(/^([A-Z0-9]+)-(?:SH|SL|TP|LG|ML|CL)-/i);
            if (match) return match[1];
            const simpleMatch = id.split('-')[0];
            if (simpleMatch && simpleMatch.length >= 4 && /^\d+$/.test(simpleMatch)) return simpleMatch;
            return order.order_number || state.orderNumber || '---';
        })();

        // === SIZES ===
        const sizes = state.sizes || item.specs?.sizes || {};
        const sizeEntries = Object.entries(sizes).filter(([, q]) => q > 0);
        const totalQty = sizeEntries.reduce((s, [, q]) => s + q, 0);
        const sizesHTML = sizeEntries.length > 0
            ? sizeEntries.map(([sz, qty]) => `<div style="display:flex;flex-direction:column;align-items:center;background:#0a0a0a;border:2px solid #2a2a2a;padding:10px 16px;min-width:58px;border-radius:2px;"><span style="font-size:0.6rem;color:#555;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${esc(sz)}</span><span style="font-size:2.2rem;font-weight:900;color:#fff;line-height:1;font-family:'Bebas Neue',sans-serif;">${qty}</span><span style="font-size:0.58rem;color:#444;">un</span></div>`).join('')
            : '<span style="color:#333;font-style:italic;font-size:0.85rem;">Sem grade</span>';

        // === PARTS / CORES ===
        const parts = state.parts || item.specs?.parts || {};
        const partsEntries = Object.entries(parts);
        const partsHTML = partsEntries.length > 0
            ? partsEntries.map(([key, val]) => {
                const label = (window.resolveZoneLabel ? window.resolveZoneLabel(key) : key).replace(/_/g, ' ');
                const colorVal = (typeof val === 'object' && val !== null) ? (val.value || 'N/A') : (val || 'N/A');
                const colorHex = (typeof val === 'object' && val !== null) ? (val.hex || '#444') : '#444';
                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0a0a0a;border-left:3px solid ${colorHex};margin-bottom:5px;"><div style="width:18px;height:18px;border-radius:50%;background:${colorHex};border:2px solid #444;flex-shrink:0;"></div><div><div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div><div style="font-size:0.88rem;color:#eee;font-weight:600;">${esc(colorVal)}</div></div></div>`;
            }).join('')
            : '<span style="color:#333;font-style:italic;font-size:0.85rem;">Sem cores</span>';

        // === EXTRAS ===
        const extras = state.extras || item.specs?.extras || {};
        const validExtras = Object.entries(extras).filter(([, e]) => {
            if (!e) return false;
            if (typeof e === 'object') return e.enabled || e.active;
            return e === true || String(e).toLowerCase() === 'sim';
        });
        const extrasHTML = validExtras.length > 0
            ? validExtras.map(([key, e]) => {
                const val = (typeof e === 'object' && e !== null) ? (e.value || 'SIM') : 'SIM';
                const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `<span style="background:#181200;border:1px solid #D4AF37;color:#D4AF37;padding:2px 8px;font-size:0.72rem;border-radius:1px;font-weight:700;">+${esc(cleanKey)}: ${esc(val)}</span>`;
            }).join('')
            : '';

        // === LOGOS / UPLOADS ===
        const rawUploads = state.uploads || item.specs?.uploads || {};
        const uploadsArr = Array.isArray(rawUploads)
            ? rawUploads
            : Object.entries(rawUploads).map(([id, u]) => ({ ...u, zone_id: id }));
        const validUploads = uploadsArr.filter(u => u && (u.src || u.file_url || u.filename || u.file_name));

        const logosHTML = validUploads.length > 0
            ? validUploads.map(u => {
                const label = (window.resolveZoneLabel ? window.resolveZoneLabel(u.zone_id || u.zone_label) : (u.zone_id || 'Zona'));
                const name = u.file_name || u.filename || u.file_url || u.src || 'Imagem';
                const isCustom = u.is_custom || u.isCustom;
                const src = u.file_url || u.src;
                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0a0a0a;border-left:3px solid ${isCustom ? '#FFA500' : '#28a745'};margin-bottom:5px;"><span style="font-size:1rem;flex-shrink:0;">${isCustom ? '⚠️' : '✅'}</span><div style="flex:1;min-width:0;"><div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div><div style="font-size:0.82rem;color:#eee;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(name)}</div><div style="font-size:0.65rem;color:${isCustom ? '#FFA500' : '#28a745'};">${isCustom ? '⚠ Criar Matriz' : 'Acervo HNT'}</div></div>${src ? `<a href="${src}" download title="Baixar" style="color:#D4AF37;font-size:1rem;text-decoration:none;flex-shrink:0;">⬇</a>` : ''}</div>`;
            }).join('')
            : '<span style="color:#333;font-style:italic;font-size:0.82rem;">Sem logos/artes</span>';

        // === TEXTS ===
        const rawTexts = state.texts || item.specs?.texts || {};
        const textsArr = Array.isArray(rawTexts)
            ? rawTexts.filter(t => t && t.enabled && t.content)
            : Object.entries(rawTexts).filter(([, t]) => t && t.enabled && t.content).map(([id, t]) => ({ ...t, zone_id: id }));

        const textsHTML = textsArr.length > 0
            ? textsArr.map(t => {
                const label = (window.resolveZoneLabel ? window.resolveZoneLabel(t.zone_id) : (t.zone_id || 'Texto'));
                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0a0a0a;border-left:3px solid #00b4d8;margin-bottom:5px;"><span style="font-size:0.9rem;flex-shrink:0;">🔤</span><div><div style="font-size:0.6rem;color:#444;text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div><div style="font-size:0.85rem;color:#eee;font-weight:600;">"${esc(t.content)}"</div><div style="font-size:0.65rem;color:#555;">${esc(t.fontFamily || 'Padrão')}</div></div></div>`;
            }).join('')
            : '';

        const hasArtwork = validUploads.length > 0 || textsArr.length > 0;
        const hasObs = obs.length > 0;

        return `
        <div class="prod-ficha" style="background:#131313;border:1px solid #1e1e1e;border-radius:3px;margin-bottom:14px;overflow:hidden;font-family:'Outfit',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.4);">

            <!-- ══ CABEÇALHO ══ -->
            <div onclick="CartUI.toggleSubTabs('${uid}')" style="display:grid;grid-template-columns:88px 1fr auto;align-items:stretch;background:#0d0d0d;border-bottom:2px solid #1a1a1a;cursor:pointer;user-select:none;">

                <!-- N° Pedido -->
                <div style="background:#D4AF37;color:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 8px;border-right:2px solid #b8962e;">
                    <span style="font-size:0.48rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:0.65;">PEDIDO</span>
                    <span style="font-size:1.7rem;font-family:'Bebas Neue',sans-serif;line-height:1;">${esc(orderNum)}</span>
                    <span style="font-size:0.58rem;font-weight:700;opacity:0.55;margin-top:2px;">${currentItem}/${totalItems}</span>
                </div>

                <!-- Produto -->
                <div style="padding:10px 16px;display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;flex-shrink:0;background:#1a1a1a;border:1px solid #252525;border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                        ${this.getProductIconElement(item, order)}
                    </div>
                    <div>
                        <div style="color:#fff;font-size:1rem;font-weight:700;letter-spacing:0.5px;">${esc(this.getProductName(item, order))}</div>
                        <div style="font-size:0.8rem; color:#aaa; font-weight: 500;">PEDIDO: <span style="color:var(--gold);">${esc((() => {
            // Priority: Explicit order_number field
            if (order.order_number && order.order_number !== '---') return order.order_number;

            const id = (order.ID_PEDIDO || order.order_id || state.simulationId || order.ID_SIMULACAO || '').toString();
            if (!id) return '---';

            // 1. Try to match HNT-PD-XXXXXX pattern
            const hntPd = id.match(/HNT-PD-(\d+)/i);
            if (hntPd) return hntPd[1];

            // 2. Try to match the segment immediately BEFORE the product code (SH, SL, TP, etc.)
            // Example: HNT-PD-010013-LG-.... -> matches 010013
            const typeMatch = id.match(/([A-Z0-9]+)-(?:SH|SL|TP|LG|ML|CL)-/i);
            if (typeMatch && /^\d+$/.test(typeMatch[1])) return typeMatch[1];

            // 3. Try to match the 6-digit prefix at the very start (standard case)
            const startDigits = id.match(/^(\d{5,8})/);
            if (startDigits) return startDigits[1];

            // 4. Fallback: Find the longest numeric sequence in the ID (usually 5-9 digits)
            const allNumbers = id.match(/(\d{5,9})/);
            if (allNumbers) return allNumbers[1];

            const simpleMatch = id.split('-')[0];
            if (simpleMatch && simpleMatch.length >= 4 && /^\d+$/.test(simpleMatch)) return simpleMatch;

            return order.order_number || state.orderNumber || '---';
        })())}</span></div>
                        <div style="font-size:0.7rem; color:#666; margin-top: 2px;">
                            ID: <span style="color:#888;">${esc(order.order_id || state.simulationId || order.ID_SIMULACAO || '---')}</span> • 
                            ${order.created_at ? new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                        </div>
                        ${extrasHTML ? `<div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap;">${extrasHTML}</div>` : ''}
                    </div>
                </div>

                <!-- Ações + Total + Toggle -->
                <div style="padding:10px 14px;display:flex;align-items:center;gap:8px;border-left:1px solid #1a1a1a;">
                    <div style="text-align:right;margin-right:6px;">
                        <div style="font-size:0.58rem;color:#333;text-transform:uppercase;letter-spacing:1px;">TOTAL</div>
                        <div style="font-size:1.15rem;color:#D4AF37;font-weight:800;font-family:'Bebas Neue',sans-serif;">${(pricing?.total_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div style="font-size:0.62rem;color:#333;">${totalQty} un × ${(pricing?.unit_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                    ${(order.pdfUrl || item.pdf_path) ? `<a href="${order.pdfUrl || item.pdf_path}" target="_blank" onclick="event.stopPropagation()" title="PDF" style="background:#c0392b;color:#fff;padding:7px 12px;border-radius:2px;font-size:0.72rem;font-weight:800;text-decoration:none;display:flex;align-items:center;gap:4px;">📄 PDF</a>` : `<span style="font-size:0.62rem;color:#2a2a2a;font-style:italic;">PDF Pendente</span>`}
                    <button onclick="event.stopPropagation();editOrder(${index})" style="background:#1e1e1e;color:#777;border:1px solid #2a2a2a;padding:7px 11px;border-radius:2px;cursor:pointer;font-size:0.72rem;font-family:'Outfit',sans-serif;">✏️</button>
                    <button onclick="event.stopPropagation();deleteOrder(${index})" style="background:rgba(255,77,77,0.07);color:#ff4d4d;border:1px solid rgba(255,77,77,0.18);width:32px;height:32px;border-radius:2px;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✖</button>
                    <div class="toggle-btn-modern" style="margin-left:2px;"><span class="toggle-icon">▼</span></div>
                </div>
            </div>

            <!-- ══ CORPO (colapsável) ══ -->
            <div id="${uid}" style="display:none;">

                <!-- 3 blocos lado a lado -->
                <div style="display:grid;grid-template-columns:auto 1fr 1.5fr;gap:0;border-bottom:1px solid #1a1a1a;">

                    <!-- GRADE -->
                    <div style="border-right:1px solid #1a1a1a;padding:14px 16px;min-width:200px;">
                        <div style="margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:8px;">
                            <span style="background:#D4AF37;color:#000;font-size:0.55rem;font-weight:800;letter-spacing:1.5px;padding:2px 7px;text-transform:uppercase;">📏 GRADE</span>
                            <span style="font-size:0.62rem;color:#444;">${totalQty} peças</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">${sizesHTML}</div>
                    </div>

                    <!-- CORES -->
                    <div style="border-right:1px solid #1a1a1a;padding:14px 16px;">
                        <div style="margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #1a1a1a;">
                            <span style="background:#1a1a1a;border:1px solid #D4AF37;color:#D4AF37;font-size:0.55rem;font-weight:800;letter-spacing:1.5px;padding:2px 7px;text-transform:uppercase;">🎨 CORES</span>
                        </div>
                        ${partsHTML}
                        ${state.hntLogoColor ? `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0a0a0a;border-left:3px solid #D4AF37;margin-bottom:5px;"><div style="width:18px;height:18px;border-radius:50%;background:${(state.hntLogoColor === 'branco' || state.hntLogoColor === '#FFFFFF') ? '#fff' : '#000'};border:2px solid #D4AF37;flex-shrink:0;"></div><div><div style="font-size:0.6rem;color:#444;text-transform:uppercase;">Logo HNT</div><div style="font-size:0.88rem;color:#eee;font-weight:600;">${esc(state.hntLogoColor).toUpperCase()}</div></div></div>` : ''}
                    </div>

                    <!-- ARTES & LOGOS -->
                    <div style="padding:14px 16px;">
                        <div style="margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:8px;">
                            <span style="background:${hasArtwork ? '#0d200d' : '#1a1a1a'};border:1px solid ${hasArtwork ? '#28a745' : '#2a2a2a'};color:${hasArtwork ? '#28a745' : '#333'};font-size:0.55rem;font-weight:800;letter-spacing:1.5px;padding:2px 7px;text-transform:uppercase;">🖼 ARTES & LOGOS</span>
                            ${hasArtwork ? `<span style="font-size:0.62rem;color:#28a745;">${validUploads.length} arq + ${textsArr.length} texto(s)</span>` : ''}
                        </div>
                        ${logosHTML}
                        ${textsHTML}
                    </div>
                </div>

                ${hasObs ? `
                <!-- OBSERVAÇÕES -->
                <div style="background:#0f0c00;border-top:2px solid #D4AF37;padding:12px 18px;display:flex;gap:12px;align-items:flex-start;">
                    <span style="background:#D4AF37;color:#000;font-size:0.55rem;font-weight:800;letter-spacing:1.5px;padding:2px 8px;text-transform:uppercase;flex-shrink:0;margin-top:3px;">⚠ OBS</span>
                    <span style="font-size:0.9rem;color:#ddd;line-height:1.6;white-space:pre-wrap;">${esc(obs)}</span>
                </div>` : ''}

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

        const normalizedType = type.toLowerCase().replace(/[\s-]+/g, '_');
        const iconPath = iconMap[normalizedType] ||
            iconMap[type.toLowerCase()] ||
            iconMap[item.product_type?.toLowerCase()] ||
            iconMap[item.product_type?.toLowerCase().replace(/[\s-]+/g, '_')] ||
            'assets/ui-icons/icon-fight-shorts.png';

        if (iconPath) {
            return `<img src="${iconPath}" alt="${type}" style="width:70%; height:70%; object-fit:contain; filter: brightness(1.2);">`;
        }

        return `<span style="font-size:0.7rem; color:#666; font-weight:bold;">${type.substring(0, 3).toUpperCase()}</span>`;
    }
};

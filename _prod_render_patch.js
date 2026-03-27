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
        const rawSpecs = item.specs || {};
        let jsonTec = order.json_tec;
        if (!jsonTec && order.DADOS_TECNICOS_JSON) {
            try { jsonTec = JSON.parse(order.DADOS_TECNICOS_JSON); } catch (e) { }
        }
        if (jsonTec && jsonTec.specs) {
            state = { ...jsonTec, ...jsonTec.specs };
        } else {
            state = rawSpecs;
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
                        <div style="color:#444;font-size:0.68rem;margin-top:1px;">${esc(order.order_id || order.ID_SIMULACAO || '---')} &nbsp;•&nbsp; ${order.created_at ? new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '---'}</div>
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

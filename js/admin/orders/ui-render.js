/**
 * Renderização de UI - Administrador de Pedidos
 */

function updateStats(orders, pieces, value) {
    if (document.getElementById('st-orders')) document.getElementById('st-orders').innerText = orders;
    if (document.getElementById('st-pieces')) document.getElementById('st-pieces').innerText = pieces;
    if (document.getElementById('st-value')) {
        document.getElementById('st-value').innerText = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}

function renderGroupRow(group, container) {
    const orderDate = group.date;
    const deadlineDays = 20;
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + deadlineDays);

    const today = new Date();
    const timeDiff = deliveryDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let deadlineStatus = `<span class="status-badge status-active">${daysLeft} Dias</span>`;
    if (daysLeft < 0) deadlineStatus = `<span class="status-badge status-late">Atrasado ${Math.abs(daysLeft)} Dias</span>`;
    if (daysLeft > 15) deadlineStatus = `<span class="status-badge status-pending">${daysLeft} Dias (Prazo)</span>`;

    const tr = document.createElement('tr');
    tr.className = 'main-row';
    tr.onclick = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        toggleDetailRow(tr);
    };

    tr.innerHTML = `
        <td style="text-align:center;"><span class="toggle-indicator">▶</span></td>
        <td>
            <strong class="gold-text">${group.displayId}</strong>
            ${!group.isPriceVerified ? `<div style="margin-top:5px;"><span class="status-badge status-late" style="font-size:0.65rem; padding:2px 5px; animation: pulse 1.5s infinite;">⚠️ SUSPEITA DE FRAUDE</span></div>` : ''}
        </td>

        <td>
            <div style="font-weight:bold; color:#fff;">${group.clientName}</div>
            <div style="font-size:0.8rem; color:#888;">${group.phone}</div>
            ${group.items[0]?.OBS_GERAL ? `<div style="font-size:0.75rem; color:#aaa; margin-top:4px; font-style:italic;">"${group.items[0].OBS_GERAL}"</div>` : ''}
        </td>
        <td>${group.totalQty} Peças</td>
        <td>${orderDate.toLocaleDateString('pt-BR')}</td>
        <td><span class="status-badge status-pending">Em Produção</span></td>
        <td>
            <div>${deliveryDate.toLocaleDateString('pt-BR')}</div>
            <div style="margin-top:2px;">${deadlineStatus}</div>
        </td>
        <td class="text-right">
            <button class="btn-icon" onclick="restoreOrder('${group.displayId}')" title="Restaurar/Editar Pedido" style="margin-right:5px; background:none; border:none; cursor:pointer; font-size:1.1rem;">✏️</button>
            <button class="btn-icon delete" onclick="deleteGroup('${group.id}')" title="Excluir Pedido Completo">🗑️</button>
        </td>
    `;

    const detailTr = document.createElement('tr');
    detailTr.className = 'detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = 8;
    detailTd.style.padding = '0';

    const detailDiv = document.createElement('div');
    detailDiv.className = 'detail-container';
    detailDiv.innerHTML = `<h4 style="margin-top:0; color:#888; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:20px;">
        Itens do Pedido: ${group.displayId} (${group.items.length})
    </h4>`;

    const itemsContainer = document.createElement('div');
    group.items.forEach(item => {
        itemsContainer.innerHTML += renderProductDetail(item);
    });

    detailDiv.appendChild(itemsContainer);
    detailTd.appendChild(detailDiv);
    detailTr.appendChild(detailTd);

    container.appendChild(tr);
    container.appendChild(detailTr);
}

function toggleDetailRow(mainTr) {
    const detailTr = mainTr.nextElementSibling;
    const indicator = mainTr.querySelector('.toggle-indicator');

    if (detailTr.classList.contains('visible')) {
        detailTr.classList.remove('visible');
        mainTr.classList.remove('expanded');
        indicator.innerText = '▶';
        indicator.style.transform = 'rotate(0deg)';
    } else {
        detailTr.classList.add('visible');
        mainTr.classList.add('expanded');
        indicator.innerText = '▼';
    }
}

function renderProductDetail(order) {
    const isV1 = !!order.item;

    const model = isV1 ? order.item.model_name : order.MODELO_DESC;
    const ref = isV1 ? order.order_id : (order.ID_SIMULACAO || order.ID_PEDIDO);
    const qty = isV1 ? order.item.qty_total : order.QTD_TOTAL;
    const price = isV1 ? (order.item.pricing?.total_price) : order.VAL_FINAL_TOTAL;
    const type = isV1 ? order.item.simulator_type : (order.TIPO_PRODUTO || order.TIPO_ITEM);

    const parts = {};
    const extras = {};
    const sizes = {};

    if (!isV1) {
        Object.keys(order).forEach(k => {
            if (k.startsWith('COR_') && k !== 'COR_BASE') parts[k.replace('COR_', '')] = { value: order[k], hex: '#333' };
            if (k.startsWith('ADIC_')) extras[k.replace('ADIC_', '')] = { value: order[k] };
            if (k.startsWith('QTD_') && k !== 'QTD_TOTAL' && order[k] > 0) sizes[k.replace('QTD_', '')] = order[k];
        });
    }

    const index = order._index || Math.floor(Math.random() * 1000);
    const uid = `prod-${index}-${Math.floor(Math.random() * 1000)}`;

    return `
    <div class="sub-item-rich">
        <div class="card-header-inner" onclick="toggleSubTabs('${uid}')">
             <div class="thumb-placeholder">${type?.substring(0, 3) || 'IMG'}</div>
             <div>
                <div style="color:#fff; font-weight:bold; font-size:1.1rem;">${model || 'Produto'}</div>
                <div style="font-size:0.8rem; color:#888;">Ref: ${ref}</div>
             </div>
             
             <div>
                <div style="font-size:0.75rem; color:#888;">Qtd</div>
                <div style="font-size:1rem; font-weight:bold; color:#fff;">${qty}</div>
             </div>
             
             <div>
                <div style="font-size:0.75rem; color:#888;">Valor</div>
                <div style="font-size:1/rem; font-weight:bold; color:var(--gold);">${(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
             </div>

              <div style="text-align:right;">
                ${order.is_price_verified === false ? `<span title="Preço Inconsistente com as regras do simulador" style="color:#ff4d4d; margin-right:10px; cursor:help;">🚩 AUDITORIA</span>` : ''}
                <span style="font-size:0.8rem; color:#666;">▼</span>
              </div>
        </div>


        <div id="${uid}" class="tab-content-wrapper" style="display:none;">
            <div class="tabs-nav">
                <button class="tab-btn active" onclick="switchDetailTab(this, 't-prod-${uid}')">Produto</button>
                <button class="tab-btn" onclick="switchDetailTab(this, 't-sizes-${uid}')">Tamanhos</button>
                <button class="tab-btn" onclick="switchDetailTab(this, 't-financial-${uid}')">💰 Financeiro</button>
            </div>

            <div id="t-prod-${uid}" class="tab-content active">
                <div class="grid-info">
                    ${isV1 ? renderPartsList(order.item.specs.parts) : renderPartsList(parts)}
                </div>
                <div style="margin-top:15px; border-top:1px solid #333; padding-top:10px;">
                    ${isV1 ? renderExtras(order.item.specs.extras) : renderExtras(extras)}
                </div>
            </div>

            <div id="t-sizes-${uid}" class="tab-content">
                 ${isV1 ? renderSizes(order.item.specs.sizes) : renderSizes(sizes)}
            </div>

            <div id="t-financial-${uid}" class="tab-content">
                 ${renderFinancialTab(order, type)}
            </div>
        </div>
    </div>
    `;
}

window.toggleSubTabs = function (uid) {
    const el = document.getElementById(uid);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

window.switchDetailTab = function (btn, targetId) {
    const parent = btn.closest('.tab-content-wrapper');
    parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
};

function renderPartsList(parts) {
    if (!parts || Object.keys(parts).length === 0) return '<p style="color:#666;">Sem dados de cores específicos.</p>';
    return Object.keys(parts).map(key => {
        const p = parts[key];
        return `
        <div class="info-grp">
            <div class="info-label">${key.replace(/_/g, ' ')}</div>
            <div class="info-val">
                <span style="display:inline-block; width:10px; height:10px; background:${p.hex || '#555'}; border-radius:50%; margin-right:5px;"></span>
                ${p.value}
            </div>
        </div>`;
    }).join('');
}

function renderExtras(extras) {
    if (!extras || Object.keys(extras).length === 0) return '';
    return Object.keys(extras).map(key => `
        <span style="background:#333; padding:3px 8px; border-radius:4px; font-size:0.8rem; margin-right:10px;">
            ${key.replace(/_/g, ' ')}: <strong>${extras[key].value}</strong>
        </span>
    `).join('');
}

function renderSizes(sizes) {
    if (!sizes || Object.keys(sizes).length === 0) return '<p>Sem grades de tamanho registradas.</p>';
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
}

function renderFinancialTab(order, productType) {
    if (typeof FinancialManager === 'undefined') {
        return '<p style="color:#ff4d4d;">Módulo financeiro não carregado.</p>';
    }

    const type = (productType || order.TIPO_PRODUTO || order.TIPO_ITEM || 'shorts').toLowerCase();
    let normalizedType = 'shorts';

    if (type.includes('moletom')) normalizedType = 'moletom';
    else if (type.includes('legging') && type.includes('shorts')) normalizedType = 'shortsLegging';
    else if (type.includes('legging')) normalizedType = 'legging';
    else if (type.includes('top')) normalizedType = 'top';
    else if (type.includes('shorts')) normalizedType = 'shorts';

    const adminPricing = FinancialManager.syncPricingFromAdmin();
    const productPricing = adminPricing[normalizedType] || {};

    const costs = FinancialManager.loadProductionCosts();
    const productCosts = costs[normalizedType] || {};

    let html = `
        <div style="background:#1a1a1a; padding:20px; border-radius:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
                <h4 style="color:var(--gold); margin:0;">💰 Análise Financeira do Item</h4>
                <span style="background:rgba(212,175,55,0.2); color:var(--gold); padding:4px 10px; border-radius:4px; font-size:0.75rem; font-weight:bold;">
                    🔄 SINCRONIZADO
                </span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:15px; margin-bottom:20px;">
                <div style="background:#252525; padding:12px; border-radius:4px; border-left:3px solid #666; font-size:0.7rem; color:#888; text-transform:uppercase;">Item</div>
                <div style="background:#252525; padding:12px; border-radius:4px; border-left:3px solid #4CAF50; font-size:0.7rem; color:#888; text-transform:uppercase;">Venda</div>
                <div style="background:#252525; padding:12px; border-radius:4px; border-left:3px solid #FF9800; font-size:0.7rem; color:#888; text-transform:uppercase;">Custo</div>
                <div style="background:#252525; padding:12px; border-radius:4px; border-left:3px solid var(--gold); font-size:0.7rem; color:#888; text-transform:uppercase;">Margem</div>
            </div>
    `;

    const fields = Object.keys(productPricing);
    fields.forEach(field => {
        const salePrice = productPricing[field] || 0;
        const costPrice = productCosts[field] || 0;
        const margin = FinancialManager.calculateItemMargin(salePrice, costPrice);
        const fieldLabel = FinancialManager.getFieldLabel(field);
        const marginColor = margin.isPositive ? '#4CAF50' : '#ff4d4d';

        html += `
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:15px; margin-bottom:10px; padding:10px; background:#0f0f0f; border-radius:4px;">
                <div style="display:flex; align-items:center;"><span style="font-size:0.85rem; color:#ddd;">${fieldLabel}</span></div>
                <div style="display:flex; align-items:center;"><span style="font-size:0.9rem; color:#4CAF50; font-weight:bold;">${FinancialManager.formatCurrency(salePrice)}</span></div>
                <div style="display:flex; align-items:center;">
                    <input type="number" value="${costPrice}" step="0.01" onchange="updateProductionCost('${normalizedType}', '${field}', this.value)"
                           style="width:100%; padding:6px; background:#1a1a1a; border:1px solid #444; color:#fff; border-radius:4px; font-size:0.85rem;">
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:0.9rem; color:${marginColor}; font-weight:bold;">${FinancialManager.formatCurrency(margin.margin)}</span>
                </div>
            </div>`;
    });

    html += `</div>`;
    return html;
}

window.toggleFinancialSection = function () {
    const section = document.getElementById('financial-analysis-section');
    const btn = document.getElementById('btn-show-financial');

    if (section.style.display === 'none') {
        section.style.display = 'block';
        if (btn) btn.style.display = 'none';
        loadFinancialAnalysisData();
        updateFinancialAnalysis();
    } else {
        section.style.display = 'none';
        if (btn) btn.style.display = 'inline-block';
    }
};

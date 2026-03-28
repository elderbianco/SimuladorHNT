/* ============================================================
   HNT-OPS v4.00 — app.js
   Modular single-file architecture, Supabase via api.js
   ============================================================ */

'use strict';

// ── STATE ──────────────────────────────────────────────────
const state = {
    orders: [],        // raw from supabase
    operators: [],     // from supabase config
    currentUser: null, // { id, name, setor }
    selectedOrder: null,
    selectedItem: null,  // item within order (for multi-sku)
    activeView: 'list',
    activeTab: 'all',
    activeDrawerTab: 'resumo',
    search: '',
    filterPrioridade: '',
    batchIds: [],
    pendencias: {},    // { orderId: [...] }
    stageData: {},     // { `${orderId}-${item}`: { etapa fields } }
    chatMsgs: {},      // { orderId: [...] }
    batchScanner: null,
    dragging: null,
    _refreshTimer: null,
};

// ── CONFIG ─────────────────────────────────────────────────
const ETAPAS = [
    { id: 'Preparação', icon: '⚙️', color: '#3b82f6' },
    { id: 'Separação', icon: '📦', color: '#f59e0b' },
    { id: 'Arte', icon: '🎨', color: '#8b5cf6' },
    { id: 'Bordado', icon: '🪡', color: '#ec4899' },
    { id: 'Costura', icon: '✂️', color: '#10b981' },
    { id: 'Qualidade', icon: '✅', color: '#06b6d4' },
    { id: 'Expedição', icon: '🚚', color: '#f43f5e' },
    { id: '⚠️ Pendência', icon: '⚠️', color: '#ef4444' },
];

const SLA_LEVELS = [
    { key: 'Verde', days: Infinity, label: 'No prazo', cls: 'sla-verde' },
    { key: 'Amarelo', days: 3, label: '3 dias', cls: 'sla-amarelo' },
    { key: 'Laranja', days: 1, label: '1 dia', cls: 'sla-laranja' },
    { key: 'Vermelho', days: 0, label: 'Atrasado', cls: 'sla-vermelho' },
];

const STAGE_REQUIRED_FIELDS = {
    Preparação: ['op_nome', 'data_entrada_setor'],
    Separação: ['op_separacao', 'tecido_confirmado'],
    Arte: ['op_arte', 'status_arte'],
    Bordado: ['op_bordado', 'maquina_id', 'data_inicio_bordado'],
    Costura: ['op_costura', 'data_inicio_costura'],
    Qualidade: ['op_qualidade', 'resultado_qualidade'],
    Expedição: ['op_expedicao', 'data_expedicao', 'cod_rastreamento'],
};

// ── UTILS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmt(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDT(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function daysUntil(dateStr) {
    if (!dateStr) return 999;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / 86400000);
}
function slaLevel(dateStr) {
    const d = daysUntil(dateStr);
    if (d < 0) return SLA_LEVELS[3]; // Vermelho
    if (d === 0) return SLA_LEVELS[2]; // Laranja
    if (d <= 3) return SLA_LEVELS[1]; // Amarelo
    return SLA_LEVELS[0]; // Verde
}
function etapaInfo(etapa) {
    return ETAPAS.find(e => e.id === etapa) || { icon: '❓', color: '#999' };
}
function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function toast(msg, type = 'info') {
    const existing = document.querySelector('.hnt-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'hnt-toast';
    el.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#1c1c1e'};color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;animation:slideUp .2s ease;box-shadow:0 4px 16px rgba(0,0,0,.3);`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
}

// ── SUPABASE HELPERS ────────────────────────────────────────
async function loadOrders() {
    try {
        const data = await api.loadDashboard();
        // The view "dashboard_pedidos" already returns a flattened or structured object.
        // If it comes with "dados_tecnicos_full", we might need to parse it if it's a string, 
        // but PostgREST usually returns JSON fields as objects already.
        state.orders = (data || []).map(o => {
            // Reconstruir o objeto de itens se ele não existir nativamente
            if (!o.items) {
                let tech = null;
                if (o.dados_tecnicos_full) {
                    try {
                        tech = typeof o.dados_tecnicos_full === 'string'
                            ? JSON.parse(o.dados_tecnicos_full)
                            : o.dados_tecnicos_full;
                    } catch (e) { tech = {}; }
                } else {
                    tech = {};
                }

                const parts = tech.parts || {};
                const sizes = tech.sizes || tech.tamanhos || {};
                const links = typeof o.link_renders === 'string' ? JSON.parse(o.link_renders || '{}') : (o.link_renders || {});

                // Mapear Cores
                const coresMapped = {};
                Object.entries(parts).forEach(([k, v]) => {
                    coresMapped[k] = {
                        hex: v?.hex || '#ccc',
                        nome: v?.value || v || 'Indefinida'
                    };
                });
                // Fallbacks do DB se parts estiver vazio
                if (Object.keys(coresMapped).length === 0) {
                    if (o.cor_centro) coresMapped['Centro'] = { hex: '#ccc', nome: o.cor_centro };
                    if (o.cor_laterais) coresMapped['Laterais'] = { hex: '#ccc', nome: o.cor_laterais };
                    if (o.cor_filete) coresMapped['Filete'] = { hex: '#ccc', nome: o.cor_filete };
                }

                // Mapear Grade de tamanhos
                const gradeMapped = {};
                if (Object.keys(sizes).length > 0) {
                    Object.assign(gradeMapped, sizes);
                } else if (o.tamanho) {
                    // "1x M, 2x G" -> parse string
                    if (o.tamanho.includes('x')) {
                        o.tamanho.split(',').forEach(p => {
                            const [q, t] = p.split('x').map(s => s.trim());
                            if (t) gradeMapped[t] = parseInt(q) || 1;
                        });
                    } else {
                        gradeMapped[o.tamanho] = o.quantidade_total || 1;
                    }
                }

                // Mapear Logos/Renders
                const logosMapped = {};
                if (links.frente) logosMapped['Frente'] = links.frente;
                if (links.costas) logosMapped['Costas'] = links.costas;
                if (links.lateral) logosMapped['Lateral'] = links.lateral;
                if (tech.logoPunho) logosMapped['Logo Punho'] = tech.logoPunho;

                const reconstructedItem = {
                    sku: o.sku_produto || o.modelo || 'Produto Customizado',
                    quantidade: o.quantidade_total || 1,
                    cores: coresMapped,
                    grade: gradeMapped,
                    logos: logosMapped
                };

                // The view dashboard_pedidos gives us flat, so order has 1 conceptual item based on its row
                o.items = tech.items || [reconstructedItem];
            }
            return o;
        });

        updateStats();
        renderCurrentView();
        updateTabCounts();
        updatePendenciaFab();
    } catch (e) {
        console.error('[HNT] loadOrders error', e);
        toast('Erro ao carregar pedidos. Verificar conexão.', 'error');
    }
}

async function updateOrderStage(orderId, novaEtapa) {
    try {
        await api.updateEtapa(orderId, novaEtapa);
        await loadOrders();
        toast(`Pedido movido → ${novaEtapa}`, 'success');
        return true;
    } catch (e) {
        toast('Erro ao mover pedido: ' + e.message, 'error');
        return false;
    }
}

// ── FILTERED DATA ───────────────────────────────────────────
function filteredOrders() {
    let data = state.orders;
    if (state.activeTab !== 'all') {
        data = data.filter(o => o.etapa_atual === state.activeTab);
    }
    if (state.filterPrioridade) {
        data = data.filter(o => (o.prioridade || 'NORMAL') === state.filterPrioridade);
    }
    if (state.search) {
        const q = state.search.toLowerCase();
        data = data.filter(o =>
            (o.numero_pedido || '').toLowerCase().includes(q) ||
            (o.cliente || '').toLowerCase().includes(q) ||
            (o.simulador_id || '').toLowerCase().includes(q) ||
            (o.items || []).some(it => (it.sku || '').toLowerCase().includes(q))
        );
    }
    return data;
}

// ── STATS ───────────────────────────────────────────────────
function updateStats() {
    const all = state.orders;
    const hoje = new Date().toISOString().slice(0, 10);
    $('statTotal').textContent = all.length;
    $('statAtrasados').textContent = all.filter(o => daysUntil(o.data_entrega) < 0).length;
    $('statUrgente').textContent = all.filter(o => (o.prioridade || '') === 'URGENTE').length;
    $('statPendencias').textContent = all.filter(o => o.etapa_atual === '⚠️ Pendência').length;
    $('statEntregues').textContent = all.filter(o => o.etapa_atual === 'Expedição' && (o.updated_at || '').startsWith(hoje)).length;
}

function updateTabCounts() {
    const all = state.orders;
    const cnt = (etapa) => all.filter(o => o.etapa_atual === etapa).length;
    $('cntAll').textContent = all.length;
    $('cntPrep').textContent = cnt('Preparação');
    $('cntSep').textContent = cnt('Separação');
    $('cntArt').textContent = cnt('Arte');
    $('cntBord').textContent = cnt('Bordado');
    $('cntCost').textContent = cnt('Costura');
    $('cntQual').textContent = cnt('Qualidade');
    $('cntExp').textContent = cnt('Expedição');
    $('cntPend').textContent = cnt('⚠️ Pendência');
}

function updatePendenciaFab() {
    const fab = $('pendenciaFab');
    const count = state.orders.filter(o => o.etapa_atual === '⚠️ Pendência').length;
    if (count > 0) {
        fab.classList.remove('hidden');
        fab.textContent = `⚠️ ${count}`;
    } else {
        fab.classList.add('hidden');
    }
}

// ── NAVIGATION ──────────────────────────────────────────────
function showView(viewId) {
    state.activeView = viewId;
    qsa('.view').forEach(v => v.classList.remove('active'));
    qsa('.nav-item').forEach(n => n.classList.remove('active'));
    const viewEl = $('view' + viewId.charAt(0).toUpperCase() + viewId.slice(1));
    if (viewEl) viewEl.classList.add('active');
    const navEl = document.querySelector(`[data-view="${viewId}"]`);
    if (navEl) navEl.classList.add('active');
    renderCurrentView();
}

function renderCurrentView() {
    switch (state.activeView) {
        case 'list': renderTable(); break;
        case 'kanban': renderKanban(); break;
        case 'producao': renderProducaoView(); break;
        case 'relatorios': renderBI(); break;
        case 'admin': renderAdmin(); break;
    }
}

// ── TABLE VIEW ──────────────────────────────────────────────
function renderTable() {
    const body = $('tableBody');
    const data = filteredOrders();
    if (!data.length) {
        body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-3);">Nenhum pedido encontrado.</div>';
        return;
    }

    body.innerHTML = data.map(order => {
        const sla = slaLevel(order.data_entrega);
        const info = etapaInfo(order.etapa_atual);
        const items = order.items || [];
        const firstItem = items[0] || {};
        const hasPend = (state.pendencias[order.id] || []).filter(p => p.status === 'open').length;
        const pend = order.etapa_atual === '⚠️ Pendência';
        return `
      <div class="table-row ${pend ? 'has-children' : ''} ${hasPend ? '' : ''}${pend ? ' bloqueado-row' : ''}" data-order-id="${order.id}" style="${pend ? 'border-left:3px solid var(--red);' : ''}">
        <div style="display:flex;align-items:center;gap:6px;">
          ${items.length > 1 ? `<div class="toggle-tree" data-toggle="${order.id}" onclick="toggleChildren(event,'${order.id}')">▶</div>` : '<div style="width:24px;"></div>'}
          <div>
            <div class="order-num" style="color:${info.color}">${order.numero_pedido || '—'}</div>
            ${order.simulador_id ? `<div style="font-size:9px;color:var(--text-3);">#${order.simulador_id}</div>` : ''}
          </div>
        </div>
        <div>
          <div class="client-name">${order.cliente || '—'}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
            ${items.length === 1
                ? `<span class="sku-badge">${firstItem.sku || '—'}</span>`
                : `<span class="sku-badge multi-sku">+${items.length} SKUs</span>`
            }
          </div>
        </div>
        <div><span class="etapa-badge" style="background:${info.color}20;color:${info.color};border:1px solid ${info.color}40;">${info.icon} ${order.etapa_atual || '?'}</span></div>
        <div style="font-size:13px;font-weight:800;text-align:center;">${order.quantidade || items.reduce((s, i) => s + (i.quantidade || 0), 0) || '—'}</div>
        <div style="font-size:12px;">${fmt(order.data_entrega)}</div>
        <div><span class="sla-badge ${sla.cls}">${sla.key === 'Vermelho' ? '⚠️' : ''} ${sla.key}</span></div>
        <div>${(order.prioridade || 'NORMAL') === 'URGENTE' ? '<span class="urgente-tag">🔴 URGENTE</span>' : '<span style="font-size:11px;color:var(--text-3);">' + (order.prioridade || 'Normal') + '</span>'}</div>
        <div style="text-align:center;">${hasPend ? `<span class="urgente-tag">${hasPend}</span>` : '—'}</div>
        <div style="font-size:11px;color:var(--text-3);">${order.operador_atual || '—'}</div>
        <div>
          <button style="width:28px;height:28px;border-radius:4px;background:var(--amber-dim);border:1px solid var(--amber);display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="openDrawer('${order.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </button>
        </div>
      </div>
      <div id="children-${order.id}" style="display:none;">
        ${items.slice(1).map(it => renderChildRow(order, it)).join('')}
      </div>`;
    }).join('');

    // Row click → drawer
    qsa('.table-row', body).forEach(row => {
        row.addEventListener('click', e => {
            if (e.target.closest('[data-toggle]') || e.target.closest('button')) return;
            openDrawer(row.dataset.orderId);
        });
    });
}

function renderChildRow(order, item) {
    return `
    <div class="table-row child" style="cursor:default;" data-order-id="${order.id}">
      <div style="display:flex;align-items:center;gap:4px;padding-left:28px;">
        <span class="tree-line"></span>
        <span style="font-size:11px;color:var(--text-3);">${item.sku || '—'}</span>
      </div>
      <div><span class="sku-badge">${item.modelo || item.sku || '—'}</span></div>
      <div>—</div>
      <div style="text-align:center;font-weight:700;">${item.quantidade || '—'}</div>
      <div>—</div><div>—</div><div>—</div><div>—</div><div>—</div>
      <div></div>
    </div>`;
}

function toggleChildren(e, orderId) {
    e.stopPropagation();
    const wrap = $('children-' + orderId);
    const btn = document.querySelector(`[data-toggle="${orderId}"]`);
    const open = wrap.style.display === 'none';
    wrap.style.display = open ? 'block' : 'none';
    if (btn) { btn.textContent = open ? '▼' : '▶'; btn.classList.toggle('open', open); }
}

// ── KANBAN VIEW ─────────────────────────────────────────────
function renderKanban() {
    const board = $('kanbanBoard');
    board.innerHTML = '';

    ETAPAS.forEach(etapa => {
        const orders = filteredOrders().filter(o => o.etapa_atual === etapa.id);
        const col = document.createElement('div');
        col.className = 'kanban-col';
        col.innerHTML = `
      <div class="kanban-col-header ${etapa.id === '⚠️ Pendência' ? 'pendencia-header' : ''}" style="border-top:3px solid ${etapa.color};">
        <span class="kanban-col-icon">${etapa.icon}</span>
        <span class="kanban-col-name" style="color:${etapa.color}">${etapa.id}</span>
        <span class="kanban-col-count ${orders.length ? 'has-items' : ''}">${orders.length}</span>
      </div>
      <div class="kanban-cards-wrap" data-stage="${etapa.id}">
        ${orders.length ? orders.map(o => kanbanCard(o)).join('') : '<div class="kanban-empty">Nenhum pedido</div>'}
      </div>`;
        board.appendChild(col);

        // Drag events on drop zone
        const zone = col.querySelector('.kanban-cards-wrap');
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (!state.dragging) return;
            const targetStage = zone.dataset.stage;
            handleKanbanDrop(state.dragging, targetStage);
        });
    });

    // Bind card click + drag
    qsa('.kanban-card', board).forEach(card => {
        card.addEventListener('click', () => openDrawer(card.dataset.orderId));
        card.addEventListener('dragstart', e => {
            state.dragging = card.dataset.orderId;
            card.classList.add('dragging');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            state.dragging = null;
        });
    });
}

function kanbanCard(order) {
    const sla = slaLevel(order.data_entrega);
    const items = order.items || [];
    const hasPend = (state.pendencias[order.id] || []).filter(p => p.status === 'open').length;
    return `
    <div class="kanban-card ${sla.key} ${hasPend ? 'bloqueado' : ''} ${order.etapa_atual === '⚠️ Pendência' ? 'pendencia-card' : ''}" draggable="true" data-order-id="${order.id}">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span class="kanban-num">${order.numero_pedido || '—'}</span>
        <span class="alerta-tag alerta-${sla.key}">${sla.key}</span>
      </div>
      <div class="kanban-sku">${order.cliente || '—'} · ${items.map(i => i.sku).filter(Boolean).join(', ') || '—'}</div>
      ${hasPend ? `<div style="margin-top:6px;"><span class="urgente-tag">⚠️ ${hasPend} pendência${hasPend > 1 ? 's' : ''}</span></div>` : ''}
      <div class="kanban-sub">📅 ${fmt(order.data_entrega)} · 👤 ${order.operador_atual || '—'}</div>
    </div>`;
}

async function handleKanbanDrop(orderId, targetStage) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.etapa_atual === targetStage) return;

    // Check for open pendencias — block if trying to move forward
    const openPend = (state.pendencias[orderId] || []).filter(p => p.status === 'open').length;
    if (openPend && targetStage !== '⚠️ Pendência') {
        toast(`⚠️ Resolva as ${openPend} pendência(s) antes de avançar!`, 'error');
        return;
    }

    // Show confirm modal
    $('confirmStageTitle').textContent = `Mover Pedido`;
    $('confirmStageMsg').textContent = `Mover "${order.numero_pedido}" de "${order.etapa_atual}" → "${targetStage}"?`;
    $('confirmStageWarn').style.display = 'none';
    openModal('confirmStageModal');
    $('btnConfirmStageOk').onclick = async () => {
        closeModal('confirmStageModal');
        await updateOrderStage(orderId, targetStage);
    };
}

// ── PRODUCAO VIEW ────────────────────────────────────────────
function renderProducaoView() {
    const el = $('producaoContent');
    if (!state.selectedOrder) {
        el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-3);">
      <div style="font-size:40px;margin-bottom:12px;">🏭</div>
      <div>Selecione um pedido pelo Dashboard ou Kanban</div>
    </div>`;
        return;
    }
    openDrawer(state.selectedOrder.id);
}

// ── DRAWER ───────────────────────────────────────────────────
function openDrawer(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    state.selectedOrder = order;
    const info = etapaInfo(order.etapa_atual);

    $('drawerTitle').innerHTML = `<span style="color:${info.color}">${order.numero_pedido || '—'}</span>`;
    $('drawerSku').textContent = (order.items || []).map(i => i.sku).filter(Boolean).join(' · ') || order.simulador_id || '—';

    renderStageMover(order);
    renderDrawerTabs(order);
    renderDrawerTab(state.activeDrawerTab, order);

    $('btnAvancarEtapa').dataset.orderId = orderId;
    $('btnAbrirPendencia').dataset.orderId = orderId;

    $('drawer').classList.add('open');
    $('drawerOverlay').classList.add('open');
}

function closeDrawer() {
    $('drawer').classList.remove('open');
    $('drawerOverlay').classList.remove('open');
}

function renderStageMover(order) {
    const mover = $('stageMover');
    const current = order.etapa_atual;
    mover.innerHTML = `
    <div class="stage-mover-label">MOVER PARA ETAPA</div>
    <div class="stage-buttons">
      ${ETAPAS.map(e => `
        <button class="stage-btn ${e.id === current ? 'current' : ''}" onclick="clickStageBtn('${order.id}','${e.id}')">
          ${e.icon} ${e.id}
        </button>`).join('')}
    </div>`;
}

function clickStageBtn(orderId, targetStage) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order || order.etapa_atual === targetStage) return;
    $('confirmStageTitle').textContent = 'Mover Pedido';
    $('confirmStageMsg').textContent = `Mover "${order.numero_pedido}" → "${targetStage}"?`;
    $('confirmStageWarn').style.display = 'none';
    openModal('confirmStageModal');
    $('btnConfirmStageOk').onclick = async () => {
        closeModal('confirmStageModal');
        const ok = await updateOrderStage(orderId, targetStage);
        if (ok) { openDrawer(orderId); }
    };
}

function renderDrawerTabs(order) {
    qsa('.drawer-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.dtab === state.activeDrawerTab);
        tab.onclick = () => {
            state.activeDrawerTab = tab.dataset.dtab;
            renderDrawerTabs(order);
            renderDrawerTab(tab.dataset.dtab, order);
        };
    });
}

function renderDrawerTab(tab, order) {
    const body = $('drawerBody');
    switch (tab) {
        case 'resumo': body.innerHTML = tabResumo(order); break;
        case 'preparacao': body.innerHTML = tabPreparacao(order); break;
        case 'separacao': body.innerHTML = tabSeparacao(order); break;
        case 'arte': body.innerHTML = tabArte(order); break;
        case 'bordado': body.innerHTML = tabBordado(order); break;
        case 'costura': body.innerHTML = tabCostura(order); break;
        case 'qualidade': body.innerHTML = tabQualidade(order); break;
        case 'expedicao': body.innerHTML = tabExpedicao(order); break;
        case 'historico': body.innerHTML = tabHistorico(order); break;
        case 'chat': body.innerHTML = tabChat(order); bindChatEvents(order); break;
        default: body.innerHTML = '';
    }
    bindStageFormEvents(order, tab);
}


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
        const data = await getAllOrders();
        state.orders = (data || []);
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
        await moveOrderToStage(orderId, novaEtapa, state.currentUser?.name || 'Sistema');
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

// ── DRAWER TAB: RESUMO ────────────────────────────────────
function tabResumo(order) {
  const items = order.items || [];
  const sla = slaLevel(order.data_entrega);
  const info = etapaInfo(order.etapa_atual);
  const pends = (state.pendencias[order.id]||[]).filter(p=>p.status==='open');
  return `
    <div class="detail-section">
      <div class="detail-section-title">Dados Gerais</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-item-label">Cliente</div><div class="detail-item-value" style="font-weight:700">${order.cliente||'—'}</div></div>
        <div class="detail-item"><div class="detail-item-label">Pedido</div><div class="detail-item-value"><span class="prod-num">${order.numero_pedido||'—'}</span></div></div>
        <div class="detail-item"><div class="detail-item-label">Entrega</div><div class="detail-item-value">${fmt(order.data_entrega)}</div></div>
        <div class="detail-item"><div class="detail-item-label">SLA</div><div class="detail-item-value"><span class="sla-badge ${sla.cls}">${sla.key}</span></div></div>
        <div class="detail-item"><div class="detail-item-label">Etapa Atual</div><div class="detail-item-value"><span class="etapa-badge" style="background:${info.color}20;color:${info.color};border:1px solid ${info.color}40;">${info.icon} ${order.etapa_atual}</span></div></div>
        <div class="detail-item"><div class="detail-item-label">Prioridade</div><div class="detail-item-value">${order.prioridade||'Normal'}</div></div>
        <div class="detail-item"><div class="detail-item-label">Operador</div><div class="detail-item-value">${order.operador_atual||'—'}</div></div>
        <div class="detail-item"><div class="detail-item-label">Criado em</div><div class="detail-item-value">${fmtDT(order.created_at)}</div></div>
        ${order.observacoes ? `<div class="detail-item full"><div class="detail-item-label">Observações</div><div class="obs-destaque">${order.observacoes}</div></div>` : ''}
      </div>
    </div>
    ${pends.length ? `
    <div class="detail-section" style="background:var(--red-dim);border-left:4px solid var(--red);">
      <div class="detail-section-title" style="color:var(--red);">⚠️ Pendências Abertas (${pends.length})</div>
      ${pends.map(p=>`<div class="pendencia-log-item"><span class="pendencia-log-badge open">${p.tipo||'Pendência'}</span><span style="flex:1">${p.descricao||'—'}</span></div>`).join('')}
    </div>` : ''}
    <div class="detail-section">
      <div class="detail-section-title">Itens do Pedido (${items.length})</div>
      ${items.map((it,i) => `
        <div class="item-card" style="margin-bottom:8px;">
          <div class="item-card-header" onclick="this.closest('.item-card').classList.toggle('expanded')">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="item-card-num">${i+1}</div>
              <div>
                <div style="font-size:13px;font-weight:700;">${it.sku||'—'} <span style="color:var(--amber);font-family:Inter Tight">×${it.quantidade||0}</span></div>
                <div style="font-size:11px;color:var(--text-3);">${it.modelo||''} ${it.tipo||''}</div>
              </div>
            </div>
            <svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <div class="item-card-body">
            ${renderFichaTecnica(it, order)}
          </div>
        </div>`).join('')}
    </div>`;
}

function renderFichaTecnica(item, order) {
  const cores = item.cores || {};
  const grade = item.grade || {};
  const logos = item.logos || {};
  return `
    <div class="ficha-setor-bloco setor-separacao">
      <div class="ficha-setor-title">📦 Separação — Tecido</div>
      ${Object.entries(cores).map(([k,v])=>`
        <div class="color-swatch-row" onclick="showColorModal('${v?.hex||'#888'}','${k}','${v?.nome||v||k}')">
          <div class="color-dot" style="background:${v?.hex||v||'#888'};"></div>
          <div style="flex:1">
            <div class="color-swatch-name">${v?.nome||v||k}</div>
            <div class="color-swatch-hex">${v?.hex||'—'}</div>
            <div class="color-swatch-part">${k}</div>
          </div>
          <div class="color-fullscreen-btn">🔍 Ver Cor</div>
        </div>`).join('') || '<div style="font-size:12px;color:var(--text-3);">Sem cores cadastradas</div>'}
    </div>
    <div class="ficha-setor-bloco setor-preparacao">
      <div class="ficha-setor-title">⚙️ Grade de Tamanhos</div>
      <div class="ficha-grade-compact">
        ${Object.entries(grade).map(([tam,qtd])=>`<span class="ficha-grade-pill">${tam} <span>×${qtd}</span></span>`).join('') || '<span style="color:var(--text-3);font-size:12px;">Sem grade</span>'}
      </div>
    </div>
    ${Object.keys(logos).length ? `
    <div class="ficha-setor-bloco setor-arte">
      <div class="ficha-setor-title">🎨 Logos / Artes</div>
      <div class="ficha-logo-row">
        ${Object.entries(logos).map(([zona, url])=>`
          <img src="${url}" alt="${zona}" class="ficha-logo-mini" title="${zona}" onclick="showImgModal('${url}')">`).join('')}
      </div>
    </div>` : ''}`;
}

// ── TAB: PREPARAÇÃO ──────────────────────────────────────
function tabPreparacao(order) {
  const d = getStageData(order.id, 'preparacao');
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-preparacao);">⚙️ Preparação do Pedido</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Operador <span class="req">*</span></div>
        <input class="field-input" name="op_nome" value="${d.op_nome||state.currentUser?.name||''}" placeholder="Nome do operador">
      </div>
      <div class="field-group">
        <div class="field-label">Data de Entrada <span class="req">*</span></div>
        <input type="date" class="field-input" name="data_entrada_setor" value="${d.data_entrada_setor||today()}">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Miniatura / Mockup do Pedido</div>
      <div style="display:flex;align-items:center;gap:10px;">
        ${order.renders ? `<img src="${order.renders}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);cursor:pointer;" onclick="showImgModal('${order.renders}')">` : '<div style="width:80px;height:80px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">🖼️</div>'}
        <div style="font-size:11px;color:var(--text-3);">Clique para ampliar mockup</div>
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Prioridade do Pedido</div>
      <select class="field-input" name="prioridade_confirmada">
        <option value="NORMAL" ${d.prioridade_confirmada==='NORMAL'?'selected':''}>Normal</option>
        <option value="ALTA" ${d.prioridade_confirmada==='ALTA'?'selected':''}>Alta</option>
        <option value="URGENTE" ${d.prioridade_confirmada==='URGENTE'?'selected':''}>🔴 Urgente</option>
      </select>
    </div>
    <div class="field-group">
      <div class="field-label">Checklist Documentação</div>
      ${['Ficha técnica conferida','Render/mockup revisado','Cliente contatado (se necessário)','OS impressa e fixada'].map((item,i)=>`
        <div class="checklist-item ${d['check_prep_'+i]?'checked':''}" onclick="toggleCheck(this,'check_prep_${i}','preparacao','${order.id}')">
          <div class="checklist-check"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
          <div class="checklist-label">${item}</div>
        </div>`).join('')}
    </div>
    <div class="field-group">
      <div class="field-label">Observações da Preparação</div>
      <textarea class="field-input field-textarea" name="obs_preparacao" placeholder="Anote aqui observações relevantes...">${d.obs_preparacao||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: SEPARAÇÃO ────────────────────────────────────────
function tabSeparacao(order) {
  const d = getStageData(order.id, 'separacao');
  const items = order.items || [];
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-separacao);">📦 Separação de Materiais</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Operador Separação <span class="req">*</span></div>
        <input class="field-input" name="op_separacao" value="${d.op_separacao||state.currentUser?.name||''}" placeholder="Nome">
      </div>
      <div class="field-group">
        <div class="field-label">Tecido Confirmado <span class="req">*</span></div>
        <select class="field-input" name="tecido_confirmado">
          <option value="">Selecionar...</option>
          <option value="sim" ${d.tecido_confirmado==='sim'?'selected':''}>✅ Sim — Tecido OK</option>
          <option value="nao" ${d.tecido_confirmado==='nao'?'selected':''}>❌ Não — Aguardando</option>
          <option value="parcial" ${d.tecido_confirmado==='parcial'?'selected':''}>⚠️ Parcial</option>
        </select>
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Conferência de Cores por Produto</div>
      ${items.map((it, idx) => {
        const cores = it.cores || {};
        return `<div style="margin-bottom:12px;padding:12px;background:var(--surface-2);border-radius:6px;border:1px solid var(--border);">
          <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:8px;">${it.sku||'Produto '+(idx+1)} — ${it.modelo||''}</div>
          ${Object.entries(cores).map(([k,v])=>`
            <div class="color-swatch-row" onclick="showColorModal('${v?.hex||v||'#888'}','${k}','${v?.nome||v||k}')">
              <div class="color-dot" style="background:${v?.hex||v||'#888'};"></div>
              <div style="flex:1"><div class="color-swatch-name">${v?.nome||v||'—'}</div><div class="color-swatch-hex">${v?.hex||'—'}</div><div class="color-swatch-part">${k}</div></div>
              <div class="color-fullscreen-btn">🔍</div>
            </div>`).join('') || '<div style="color:var(--text-3);font-size:12px;">Sem cores</div>'}
        </div>`;
      }).join('')}
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Quantidade Tecido (metros)</div>
        <input type="number" class="field-input" name="metros_tecido" value="${d.metros_tecido||''}" placeholder="0.00">
      </div>
      <div class="field-group">
        <div class="field-label">Lote / Rolo</div>
        <input class="field-input" name="lote_tecido" value="${d.lote_tecido||''}" placeholder="ID do lote">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Observações</div>
      <textarea class="field-input field-textarea" name="obs_separacao" placeholder="Falta de material, substituições...">${d.obs_separacao||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: ARTE ─────────────────────────────────────────────
function tabArte(order) {
  const d = getStageData(order.id, 'arte');
  const items = order.items || [];
  const pedidosArte = state.orders.filter(o => o.id !== order.id && (o.items||[]).some(i => (order.items||[]).some(oi => oi.sku === i.sku))).slice(0,3);
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-arte);">🎨 Desenvolvimento de Arte</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Operador Arte <span class="req">*</span></div>
        <input class="field-input" name="op_arte" value="${d.op_arte||state.currentUser?.name||''}" placeholder="Artista/Designer">
      </div>
      <div class="field-group">
        <div class="field-label">Status da Arte <span class="req">*</span></div>
        <select class="field-input" name="status_arte">
          <option value="">Selecionar...</option>
          <option value="pendente" ${d.status_arte==='pendente'?'selected':''}>⏳ Pendente</option>
          <option value="em_andamento" ${d.status_arte==='em_andamento'?'selected':''}>🔄 Em Andamento</option>
          <option value="aprovado_interno" ${d.status_arte==='aprovado_interno'?'selected':''}>✅ Aprovado Internamente</option>
          <option value="aguardando_cliente" ${d.status_arte==='aguardando_cliente'?'selected':''}>👤 Aguardando Cliente</option>
          <option value="aprovado_cliente" ${d.status_arte==='aprovado_cliente'?'selected':''}>✅✅ Aprovado pelo Cliente</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Software</div>
        <select class="field-input" name="software_arte">
          <option value="Illustrator" ${d.software_arte==='Illustrator'?'selected':''}>Adobe Illustrator</option>
          <option value="CorelDraw" ${d.software_arte==='CorelDraw'?'selected':''}>CorelDraw</option>
          <option value="Photoshop" ${d.software_arte==='Photoshop'?'selected':''}>Photoshop</option>
          <option value="Outro" ${d.software_arte==='Outro'?'selected':''}>Outro</option>
        </select>
      </div>
      <div class="field-group">
        <div class="field-label">Data Prazo Arte</div>
        <input type="date" class="field-input" name="prazo_arte" value="${d.prazo_arte||''}">
      </div>
    </div>
    ${items.map((it,i) => `
      <div style="padding:12px;background:var(--surface-2);border-radius:6px;border:1px solid var(--border);margin-bottom:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--etapa-arte);margin-bottom:8px;">🎨 ${it.sku||'Produto '+(i+1)}</div>
        ${Object.entries(it.logos||{}).map(([zona,url])=>`
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <div style="font-size:11px;color:var(--text-3);width:120px;">${zona}</div>
            <img src="${url}" style="height:48px;border:1px solid var(--border);border-radius:4px;cursor:pointer;" onclick="showImgModal('${url}')">
          </div>`).join('') || '<div style="color:var(--text-3);font-size:12px;">Sem logos/artes neste produto</div>'}
      </div>`).join('')}
    ${pedidosArte.length ? `
      <div class="arte-sidebar" style="margin-bottom:12px;">
        <div class="arte-sidebar-header">🔗 Outros pedidos com mesmo SKU</div>
        ${pedidosArte.map(p=>`
          <div class="arte-sidebar-item">
            <div class="arte-sidebar-pedido">${p.numero_pedido}</div>
            <div class="arte-sidebar-desc">${p.cliente} — ${p.etapa_atual}</div>
            <button class="color-fullscreen-btn" onclick="openDrawer('${p.id}')">Ver</button>
          </div>`).join('')}
      </div>` : ''}
    <div class="field-group">
      <div class="field-label">Link do Arquivo Final</div>
      <input class="field-input" name="link_arte_final" value="${d.link_arte_final||''}" placeholder="https://drive.google.com/...">
    </div>
    <div class="field-group">
      <div class="field-label">Observações de Arte</div>
      <textarea class="field-input field-textarea" name="obs_arte" placeholder="Notas sobre cores, tamanhos, posicionamento...">${d.obs_arte||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: BORDADO ──────────────────────────────────────────
function tabBordado(order) {
  const d = getStageData(order.id, 'bordado');
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-bordado);">🪡 Bordado</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Operador Bordado <span class="req">*</span></div>
        <input class="field-input" name="op_bordado" value="${d.op_bordado||state.currentUser?.name||''}" placeholder="Bordadeiro(a)">
      </div>
      <div class="field-group">
        <div class="field-label">Máquina <span class="req">*</span></div>
        <select class="field-input" name="maquina_id">
          <option value="">Selecionar máquina...</option>
          ${['Máquina 01','Máquina 02','Máquina 03','Máquina 04'].map(m=>`<option value="${m}" ${d.maquina_id===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Data Início <span class="req">*</span></div>
        <input type="date" class="field-input" name="data_inicio_bordado" value="${d.data_inicio_bordado||today()}">
      </div>
      <div class="field-group">
        <div class="field-label">Previsão Conclusão</div>
        <input type="date" class="field-input" name="previsao_fim_bordado" value="${d.previsao_fim_bordado||''}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Nº de Pontos</div>
        <input type="number" class="field-input" name="pontos_bordado" value="${d.pontos_bordado||''}" placeholder="Ex: 12500">
      </div>
      <div class="field-group">
        <div class="field-label">Cor da Linha Principal</div>
        <input class="field-input" name="cor_linha_principal" value="${d.cor_linha_principal||''}" placeholder="Ex: #FFFFFF Branco">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Checklist Bordado</div>
      ${['Arquivo DST/PES carregado','Tensão ajustada','Cor de linha conferida','Teste em scrap realizado'].map((item,i)=>`
        <div class="checklist-item ${d['check_bord_'+i]?'checked':''}" onclick="toggleCheck(this,'check_bord_${i}','bordado','${order.id}')">
          <div class="checklist-check"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
          <div class="checklist-label">${item}</div>
        </div>`).join('')}
    </div>
    <div class="field-group">
      <div class="field-label">Observações</div>
      <textarea class="field-input field-textarea" name="obs_bordado" placeholder="Problemas de máquina, substituições de linha...">${d.obs_bordado||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: COSTURA ──────────────────────────────────────────
function tabCostura(order) {
  const d = getStageData(order.id, 'costura');
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-costura);">✂️ Costura e Montagem</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Operador Costura <span class="req">*</span></div>
        <input class="field-input" name="op_costura" value="${d.op_costura||state.currentUser?.name||''}" placeholder="Costureiro(a)">
      </div>
      <div class="field-group">
        <div class="field-label">Data Início <span class="req">*</span></div>
        <input type="date" class="field-input" name="data_inicio_costura" value="${d.data_inicio_costura||today()}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Máquina</div>
        <select class="field-input" name="maquina_costura">
          <option value="">—</option>
          ${['Overlock 01','Overlock 02','Reta 01','Reta 02','Galoneira 01'].map(m=>`<option value="${m}" ${d.maquina_costura===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="field-group">
        <div class="field-label">Tipo de Ponto</div>
        <input class="field-input" name="tipo_ponto" value="${d.tipo_ponto||''}" placeholder="Ex: Overlock 5 fios">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Checklist Costura</div>
      ${['Tecido cortado e preparado','Bordado conferido e posicionado','Elástico/rebites conferidos','Aviamentos OK','Etiqueta interna colocada'].map((item,i)=>`
        <div class="checklist-item ${d['check_cost_'+i]?'checked':''}" onclick="toggleCheck(this,'check_cost_${i}','costura','${order.id}')">
          <div class="checklist-check"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
          <div class="checklist-label">${item}</div>
        </div>`).join('')}
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Qtd Produzida</div>
        <input type="number" class="field-input" name="qtd_produzida_costura" value="${d.qtd_produzida_costura||''}" placeholder="0">
      </div>
      <div class="field-group">
        <div class="field-label">Qtd Refugo</div>
        <input type="number" class="field-input" name="qtd_refugo_costura" value="${d.qtd_refugo_costura||''}" placeholder="0">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Observações</div>
      <textarea class="field-input field-textarea" name="obs_costura" placeholder="Ajustes de máquina, problemas de montagem...">${d.obs_costura||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: QUALIDADE ────────────────────────────────────────
function tabQualidade(order) {
  const d = getStageData(order.id, 'qualidade');
  const items = order.items || [];
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-qualidade);">✅ Controle de Qualidade</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Inspetor(a) <span class="req">*</span></div>
        <input class="field-input" name="op_qualidade" value="${d.op_qualidade||state.currentUser?.name||''}" placeholder="Nome">
      </div>
      <div class="field-group">
        <div class="field-label">Resultado <span class="req">*</span></div>
        <select class="field-input" name="resultado_qualidade">
          <option value="">Selecionar...</option>
          <option value="aprovado" ${d.resultado_qualidade==='aprovado'?'selected':''}>✅ Aprovado</option>
          <option value="reprovado" ${d.resultado_qualidade==='reprovado'?'selected':''}>❌ Reprovado — Retrabalho</option>
          <option value="aprovado_ressalvas" ${d.resultado_qualidade==='aprovado_ressalvas'?'selected':''}>⚠️ Aprovado c/ Ressalvas</option>
        </select>
      </div>
    </div>
    <div class="field-group">
      <div class="detail-section-title" style="margin-bottom:10px;">Comparativo Mockup vs. Produto Final</div>
      <div class="split-screen">
        ${items.slice(0,1).map(it=>`
          <div class="split-panel">
            <div class="split-panel-header original">📐 Mockup Original</div>
            <div class="split-panel-body">
              ${order.renders ? `<img src="${order.renders}" style="max-width:100%;max-height:180px;cursor:pointer;" onclick="showImgModal('${order.renders}')">` : '<div class="camera-placeholder">🖼️<br>Sem mockup</div>'}
            </div>
          </div>
          <div class="split-panel">
            <div class="split-panel-header photo">📷 Foto do Produto</div>
            <div class="split-panel-body">
              ${d.foto_produto ? `<img src="${d.foto_produto}" style="max-width:100%;max-height:180px;cursor:pointer;" onclick="showImgModal('${d.foto_produto}')">` : '<div class="camera-placeholder">📷<br>Sem foto ainda</div>'}
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Checklist Qualidade</div>
      ${['Costura uniforme sem falhas','Bordado centrado e firme','Cores conferidas com ficha técnica','Medidas no padrão','Etiquetas corretas','Limpeza (linhas, pontos soltos)','Embalagem adequada'].map((item,i)=>`
        <div class="checklist-item ${d['check_qual_'+i]?'checked':''}" onclick="toggleCheck(this,'check_qual_${i}','qualidade','${order.id}')">
          <div class="checklist-check"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
          <div class="checklist-label">${item}</div>
        </div>`).join('')}
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Qtd Aprovada</div>
        <input type="number" class="field-input" name="qtd_aprovada" value="${d.qtd_aprovada||''}" placeholder="0">
      </div>
      <div class="field-group">
        <div class="field-label">Qtd Reprovada</div>
        <input type="number" class="field-input" name="qtd_reprovada" value="${d.qtd_reprovada||''}" placeholder="0">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Não Conformidades Encontradas</div>
      <textarea class="field-input field-textarea" name="nao_conformidades" placeholder="Descreva os defeitos encontrados, se houver...">${d.nao_conformidades||''}</textarea>
    </div>
  </div>`;
}

// ── TAB: EXPEDIÇÃO ────────────────────────────────────────
function tabExpedicao(order) {
  const d = getStageData(order.id, 'expedicao');
  return `<div class="stage-form">
    <div class="stage-form-title" style="color:var(--etapa-expedicao);">🚚 Expedição e Entrega</div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Responsável Expedição <span class="req">*</span></div>
        <input class="field-input" name="op_expedicao" value="${d.op_expedicao||state.currentUser?.name||''}" placeholder="Operador">
      </div>
      <div class="field-group">
        <div class="field-label">Data Expedição <span class="req">*</span></div>
        <input type="date" class="field-input" name="data_expedicao" value="${d.data_expedicao||today()}">
      </div>
    </div>
    <div class="field-row">
      <div class="field-group">
        <div class="field-label">Transportadora</div>
        <select class="field-input" name="transportadora">
          <option value="Retirada" ${d.transportadora==='Retirada'?'selected':''}>🏪 Retirada na Loja</option>
          <option value="Correios" ${d.transportadora==='Correios'?'selected':''}>📬 Correios</option>
          <option value="Loggi" ${d.transportadora==='Loggi'?'selected':''}>🚴 Loggi</option>
          <option value="iFood" ${d.transportadora==='iFood'?'selected':''}>🛵 iFood Entrega</option>
          <option value="Transportadora" ${d.transportadora==='Transportadora'?'selected':''}>🚚 Transportadora</option>
          <option value="Motoboy" ${d.transportadora==='Motoboy'?'selected':''}>🏍 Motoboy</option>
        </select>
      </div>
      <div class="field-group">
        <div class="field-label">Código Rastreamento <span class="req">*</span></div>
        <input class="field-input" name="cod_rastreamento" value="${d.cod_rastreamento||''}" placeholder="Ex: BR123456789BR">
      </div>
    </div>
    <div class="field-group">
      <div class="field-label">Checklist Expedição</div>
      ${['Itens conferidos e embalados','Etiqueta de envio impressa','Nota fiscal emitida','Cliente notificado','Foto do pacote tirada'].map((item,i)=>`
        <div class="checklist-item ${d['check_exp_'+i]?'checked':''}" onclick="toggleCheck(this,'check_exp_${i}','expedicao','${order.id}')">
          <div class="checklist-check"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
          <div class="checklist-label">${item}</div>
        </div>`).join('')}
    </div>
    <div class="field-group">
      <div class="field-label">Observações de Expedição</div>
      <textarea class="field-input field-textarea" name="obs_expedicao" placeholder="Instruções especiais, fragilidade, etc.">${d.obs_expedicao||''}</textarea>
    </div>

    <div style="padding:14px;background:var(--green-dim);border:1px solid var(--green);border-radius:6px;margin-top:16px;text-align:center;">
      <div style="font-size:20px;margin-bottom:4px;">🎉</div>
      <div style="font-weight:800;color:#15803d;">Pedido pronto para expedição!</div>
      <div style="font-size:12px;color:#166534;margin-top:4px;">Confirme os dados e clique em "Atividade Concluída"</div>
    </div>
  </div>`;
}

// ── TAB: HISTÓRICO ────────────────────────────────────────
function tabHistorico(order) {
  const hist = order.historico || order.history || [];
  if (!hist.length) return `<div style="padding:40px;text-align:center;color:var(--text-3);">Sem histórico registrado.</div>`;
  return `<div class="detail-section">
    <div class="detail-section-title">Linha do Tempo — ${order.numero_pedido}</div>
    <div class="timeline">
      ${hist.map((h, i) => {
        const isDone = i < hist.length - 1;
        const isCurrent = i === hist.length - 1;
        const info = etapaInfo(h.etapa);
        return `
          <div class="timeline-item">
            <div class="timeline-dot ${isDone?'done':''} ${isCurrent?'current':''}" style="${isCurrent?'border-color:'+info.color+';background:'+info.color:''}">${isDone?'✓':info.icon}</div>
            <div class="timeline-content">
              <div class="timeline-stage">${info.icon} ${h.etapa||'—'}</div>
              <div class="timeline-meta">👤 ${h.operador||'—'} · 📅 ${fmtDT(h.data_entrada)}</div>
              ${h.obs ? `<div style="font-size:11px;color:var(--text-2);margin-top:4px;font-style:italic;">"${h.obs}"</div>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ── TAB: CHAT ─────────────────────────────────────────────
function tabChat(order) {
  const msgs = state.chatMsgs[order.id] || [];
  return `
    <div class="chat-wrap" id="chatMessages" style="padding:12px 16px;flex:1;overflow-y:auto;">
      ${msgs.length ? msgs.map(m => `
        <div class="chat-bubble ${m.author===state.currentUser?.name?'mine':''}">
          <div class="chat-avatar">${initials(m.author)}</div>
          <div class="chat-msg-wrap">
            <div class="chat-who">${m.author} · ${fmtDT(m.ts)}</div>
            <div class="chat-text">${m.text}</div>
          </div>
        </div>`).join('') : '<div style="text-align:center;color:var(--text-3);padding:30px;font-size:13px;">Nenhuma mensagem ainda.</div>'}
    </div>
    <div class="chat-input-row">
      <input type="text" class="chat-input" id="chatInput" placeholder="Escreva uma mensagem..." onkeydown="if(event.key==='Enter'){sendChatMsg('${order.id}')}">
      <button class="chat-send" onclick="sendChatMsg('${order.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
      </button>
    </div>`;
}

function bindChatEvents(order) {
  const chatArea = document.querySelector('#drawerBody .chat-wrap');
  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
}

function sendChatMsg(orderId) {
  const input = $('chatInput');
  if (!input || !input.value.trim()) return;
  if (!state.chatMsgs[orderId]) state.chatMsgs[orderId] = [];
  state.chatMsgs[orderId].push({ author: state.currentUser?.name||'Anônimo', text: input.value.trim(), ts: new Date().toISOString() });
  input.value = '';
  const order = state.orders.find(o=>o.id===orderId);
  if (order) renderDrawerTab('chat', order);
}

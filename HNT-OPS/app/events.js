/* ============================================================
   HNT-OPS v4.00 — events.js
   Modals, BI, Pendencias, Admin, Color modal, initialization
   ============================================================ */

'use strict';

// ── MODALS ──────────────────────────────────────────────────
function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); m.style.display = 'flex'; }
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('open'); m.style.display = 'none'; }
}

// ── COLOR MODAL ─────────────────────────────────────────────
function showColorModal(hex, parte, nome) {
    const modal = document.getElementById('colorModal');
    if (!modal) return;
    const bg = modal.querySelector('.color-modal-bg');
    const label = modal.querySelector('.color-modal-label');
    const sub = modal.querySelector('.color-modal-sub');
    const hexEl = modal.querySelector('.color-modal-hex');
    if (bg) bg.style.background = hex;
    if (label) label.textContent = nome || hex;
    if (sub) sub.textContent = parte || '';
    if (hexEl) hexEl.textContent = hex;
    openModal('colorModal');
}

// ── IMAGE MODAL ──────────────────────────────────────────────
function showImgModal(url) {
    const modal = document.getElementById('imgModal');
    if (!modal) return;
    const img = modal.querySelector('#imgModalSrc');
    if (img) img.src = url;
    openModal('imgModal');
}

// ── PENDENCIA MODAL ──────────────────────────────────────────
function openPendenciaModal(orderId) {
    const order = state.orders.find(function (o) { return o.id === orderId; });
    if (!order) return;
    const modal = document.getElementById('pendenciaModal');
    if (!modal) return;
    modal.querySelector('#pendenciaOrderTitle').textContent = 'Pedido: ' + (order.numero_pedido || '--');

    // Render existing pendencias
    const list = modal.querySelector('#pendenciaList');
    const pends = state.pendencias[orderId] || [];
    if (list) {
        if (pends.length) {
            list.innerHTML = pends.map(function (p, i) {
                return '<div class="pendencia-log-item">' +
                    '<span class="pendencia-log-badge ' + (p.status === 'open' ? 'open' : 'resolved') + '">' + (p.tipo || '--') + '</span>' +
                    '<span style="flex:1">' + (p.descricao || '--') + '</span>' +
                    '<span style="font-size:10px;color:var(--text-3);">' + fmtDT(p.ts) + '</span>' +
                    (p.status === 'open' ? '<button class="btn-sm btn-secondary" onclick="resolvePendencia(\'' + orderId + '\',' + i + ')">Resolver</button>' : '<span style="font-size:10px;color:var(--green);">Resolvido</span>') +
                    '</div>';
            }).join('');
        } else {
            list.innerHTML = '<div style="color:var(--text-3);font-size:12px;padding:8px 0;">Nenhuma pendencia registrada.</div>';
        }
    }

    // Store current orderId on submit btn
    const btn = modal.querySelector('#btnSalvarPendencia');
    if (btn) btn.dataset.orderId = orderId;

    openModal('pendenciaModal');
}

function resolvePendencia(orderId, idx) {
    if (state.pendencias[orderId] && state.pendencias[orderId][idx]) {
        state.pendencias[orderId][idx].status = 'resolved';
    }
    updatePendenciaFab();
    renderCurrentView();
    openPendenciaModal(orderId);
    toast('Pendencia marcada como resolvida!', 'success');
}

function savePendencia(orderId) {
    const modal = document.getElementById('pendenciaModal');
    const tipo = modal.querySelector('#pendenciaTipo') && modal.querySelector('#pendenciaTipo').value;
    const desc = modal.querySelector('#pendenciaDescricao') && modal.querySelector('#pendenciaDescricao').value.trim();
    if (!tipo || !desc) { toast('Preencha o tipo e a descricao.', 'error'); return; }
    if (!state.pendencias[orderId]) state.pendencias[orderId] = [];
    state.pendencias[orderId].push({ tipo: tipo, descricao: desc, status: 'open', ts: new Date().toISOString() });
    modal.querySelector('#pendenciaDescricao') && (modal.querySelector('#pendenciaDescricao').value = '');
    updatePendenciaFab();
    renderCurrentView();
    toast('Pendencia registrada!', 'success');
    openPendenciaModal(orderId);
}

// ── BI / RELATORIOS ──────────────────────────────────────────
function renderBI() {
    const el = document.getElementById('biContent');
    if (!el) return;
    const orders = state.orders;
    if (!orders.length) {
        el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-3);">Sem dados suficientes para BI.</div>';
        return;
    }

    // Stage distribution
    const stageCounts = {};
    ETAPAS.forEach(function (e) { stageCounts[e.id] = 0; });
    orders.forEach(function (o) {
        if (stageCounts[o.etapa_atual] !== undefined) stageCounts[o.etapa_atual]++;
        else stageCounts[o.etapa_atual] = 1;
    });

    // SLA distribution
    const slaVerde = orders.filter(function (o) { return daysUntil(o.data_entrega) > 3; }).length;
    const slaAmarelo = orders.filter(function (o) { const d = daysUntil(o.data_entrega); return d > 0 && d <= 3; }).length;
    const slaLaranja = orders.filter(function (o) { return daysUntil(o.data_entrega) === 0; }).length;
    const slaVermelho = orders.filter(function (o) { return daysUntil(o.data_entrega) < 0; }).length;

    // Total pcs
    const totalPcs = orders.reduce(function (s, o) { return s + (o.quantidade || 0); }, 0);

    // Pendencias
    const totalPend = orders.filter(function (o) { return o.etapa_atual === '⚠️ Pendência'; }).length;

    el.innerHTML = '' +
        // KPI row
        '<div class="bi-kpi-row">' +
        '<div class="bi-kpi-card"><div class="bi-kpi-value">' + orders.length + '</div><div class="bi-kpi-label">Total Pedidos</div></div>' +
        '<div class="bi-kpi-card"><div class="bi-kpi-value">' + totalPcs + '</div><div class="bi-kpi-label">Total Pecas</div></div>' +
        '<div class="bi-kpi-card" style="border-left-color:var(--red)"><div class="bi-kpi-value" style="color:var(--red)">' + slaVermelho + '</div><div class="bi-kpi-label">Atrasados</div></div>' +
        '<div class="bi-kpi-card" style="border-left-color:var(--amber)"><div class="bi-kpi-value" style="color:var(--amber)">' + slaAmarelo + '</div><div class="bi-kpi-label">Urgentes (3d)</div></div>' +
        '<div class="bi-kpi-card" style="border-left-color:var(--green)"><div class="bi-kpi-value" style="color:var(--green)">' + slaVerde + '</div><div class="bi-kpi-label">No Prazo</div></div>' +
        '<div class="bi-kpi-card" style="border-left-color:#ef4444"><div class="bi-kpi-value" style="color:#ef4444">' + totalPend + '</div><div class="bi-kpi-label">Em Pendencia</div></div>' +
        '</div>' +
        // Stage distribution
        '<div class="detail-section">' +
        '<div class="detail-section-title">Distribuicao por Etapa</div>' +
        '<div class="bi-stage-bars">' +
        ETAPAS.map(function (e) {
            const cnt = stageCounts[e.id] || 0;
            const pct = orders.length ? Math.round(cnt / orders.length * 100) : 0;
            return '<div class="bi-stage-bar-row">' +
                '<div class="bi-stage-bar-label" style="color:' + e.color + ';">' + e.icon + ' ' + e.id + '</div>' +
                '<div class="bi-stage-bar-track"><div class="bi-stage-bar-fill" style="width:' + pct + '%;background:' + e.color + ';"></div></div>' +
                '<div class="bi-stage-bar-count">' + cnt + ' (' + pct + '%)</div>' +
                '</div>';
        }).join('') +
        '</div></div>' +
        // Recent orders table
        '<div class="detail-section">' +
        '<div class="detail-section-title">Pedidos Recentes</div>' +
        '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
        '<thead><tr style="border-bottom:1px solid var(--border);color:var(--text-3);">' +
        '<th style="padding:6px 8px;text-align:left;">Pedido</th>' +
        '<th style="padding:6px 8px;text-align:left;">Cliente</th>' +
        '<th style="padding:6px 8px;text-align:left;">Etapa</th>' +
        '<th style="padding:6px 8px;text-align:left;">SLA</th>' +
        '<th style="padding:6px 8px;text-align:right;">Qtd</th>' +
        '</tr></thead><tbody>' +
        orders.slice(0, 20).map(function (o) {
            const sla = slaLevel(o.data_entrega);
            const info = etapaInfo(o.etapa_atual);
            return '<tr style="border-bottom:1px solid var(--border)05;">' +
                '<td style="padding:6px 8px;font-weight:700;color:' + info.color + ';">' + (o.numero_pedido || '--') + '</td>' +
                '<td style="padding:6px 8px;">' + (o.cliente || '--') + '</td>' +
                '<td style="padding:6px 8px;">' + info.icon + ' ' + o.etapa_atual + '</td>' +
                '<td style="padding:6px 8px;"><span class="sla-badge ' + sla.cls + '">' + sla.key + '</span></td>' +
                '<td style="padding:6px 8px;text-align:right;">' + (o.quantidade || 0) + '</td>' +
                '</tr>';
        }).join('') +
        '</tbody></table></div></div>';
}

// ── ADMIN ────────────────────────────────────────────────────
function renderAdmin() {
    const el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = '' +
        '<div class="detail-section">' +
        '<div class="detail-section-title">Configuracoes do Sistema</div>' +
        '<div class="field-group"><div class="field-label">Nome do Operador</div>' +
        '<input class="field-input" id="adminOpNome" value="' + ((state.currentUser && state.currentUser.name) || '') + '" placeholder="Seu nome"></div>' +
        '<div class="field-group"><div class="field-label">Setor</div>' +
        '<select class="field-input" id="adminOpSetor">' +
        ETAPAS.map(function (e) { return '<option value="' + e.id + '">' + e.icon + ' ' + e.id + '</option>'; }).join('') +
        '</select></div>' +
        '<button class="stage-btn" onclick="saveAdminSettings()" style="margin-top:10px;">Salvar Configuracoes</button>' +
        '</div>' +
        '<div class="detail-section">' +
        '<div class="detail-section-title">Acao Rapida</div>' +
        '<button class="stage-btn" onclick="loadOrders()" style="margin-top:6px;">Recarregar Pedidos</button>' +
        '</div>';
}

function saveAdminSettings() {
    const nome = document.getElementById('adminOpNome') && document.getElementById('adminOpNome').value.trim();
    const setor = document.getElementById('adminOpSetor') && document.getElementById('adminOpSetor').value;
    if (!nome) { toast('Informe seu nome.', 'error'); return; }
    state.currentUser = { name: nome, setor: setor };
    localStorage.setItem('hntops_user', JSON.stringify(state.currentUser));
    document.getElementById('userNameEl') && (document.getElementById('userNameEl').textContent = nome);
    document.getElementById('userInitials') && (document.getElementById('userInitials').textContent = initials(nome));
    toast('Configuracoes salvas!', 'success');
}

// ── SEARCH / FILTERS ─────────────────────────────────────────
function handleSearch(val) {
    state.search = val;
    renderCurrentView();
    updateTabCounts();
}

function handleFilterPrioridade(val) {
    state.filterPrioridade = val;
    renderCurrentView();
}

// ── BATCH MODAL ──────────────────────────────────────────────
function openBatchModal() {
    state.batchIds = [];
    document.getElementById('batchCount') && (document.getElementById('batchCount').textContent = '0');
    openModal('batchModal');
}

function addToBatch(orderId) {
    if (state.batchIds.indexOf(orderId) < 0) state.batchIds.push(orderId);
    const cnt = document.getElementById('batchCount');
    if (cnt) cnt.textContent = state.batchIds.length;
}

async function executeBatchMove() {
    const select = document.getElementById('batchStageSelect');
    if (!select || !select.value) { toast('Selecione uma etapa!', 'error'); return; }
    const targetStage = select.value;
    let ok = 0;
    for (let i = 0; i < state.batchIds.length; i++) {
        const moved = await updateOrderStage(state.batchIds[i], targetStage);
        if (moved) ok++;
    }
    closeModal('batchModal');
    toast(ok + ' pedido(s) movidos para ' + targetStage, 'success');
}

// ── CONSULTA STATUS CLIENTES ─────────────────────────────────
function renderStatusConsulta() {
    const el = document.getElementById('statusConsultaResult');
    if (!el) return;
    const input = document.getElementById('statusConsultaInput');
    if (!input || !input.value.trim()) {
        el.innerHTML = '<div style="color:var(--text-3);">Informe o numero do pedido.</div>';
        return;
    }
    const q = input.value.trim().toLowerCase();
    const found = state.orders.filter(function (o) {
        return (o.numero_pedido || '').toLowerCase().includes(q) ||
            (o.simulador_id || '').toLowerCase().includes(q);
    });
    if (!found.length) {
        el.innerHTML = '<div style="color:var(--text-3);">Pedido nao encontrado.</div>';
        return;
    }
    el.innerHTML = found.map(function (o) {
        const info = etapaInfo(o.etapa_atual);
        const sla = slaLevel(o.data_entrega);
        return '<div style="padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;margin-bottom:8px;">' +
            '<div style="font-weight:800;color:' + info.color + ';font-size:15px;">' + (o.numero_pedido || '--') + '</div>' +
            '<div style="font-size:12px;color:var(--text-2);margin:4px 0;">' + (o.cliente || '--') + '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">' +
            '<span class="etapa-badge" style="background:' + info.color + '20;color:' + info.color + ';border:1px solid ' + info.color + '40;">' + info.icon + ' ' + o.etapa_atual + '</span>' +
            '<span class="sla-badge ' + sla.cls + '">' + sla.key + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--text-3);margin-top:6px;">Entrega prevista: ' + fmt(o.data_entrega) + '</div>' +
            '</div>';
    }).join('');
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
    // Restore user
    try {
        const saved = localStorage.getItem('hntops_user');
        if (saved) {
            state.currentUser = JSON.parse(saved);
            const nameEl = document.getElementById('userNameEl');
            const initEl = document.getElementById('userInitials');
            if (nameEl) nameEl.textContent = state.currentUser.name;
            if (initEl) initEl.textContent = initials(state.currentUser.name);
        }
    } catch (e) { /* ignore */ }

    // Bind NAV
    document.querySelectorAll('[data-view]').forEach(function (el) {
        el.addEventListener('click', function () { showView(el.dataset.view); });
    });

    // Bind TABS
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            state.activeTab = btn.dataset.tab || 'all';
            document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderCurrentView();
        });
    });

    // Bind search
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', function () { handleSearch(searchEl.value); });

    // Bind priority filter
    const prioEl = document.getElementById('filterPrioridade');
    if (prioEl) prioEl.addEventListener('change', function () { handleFilterPrioridade(prioEl.value); });

    // Bind drawer close
    const btnClose = document.getElementById('btnCloseDrawer');
    if (btnClose) btnClose.addEventListener('click', closeDrawer);
    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Bind drawer action buttons
    const btnAvancar = document.getElementById('btnAvancarEtapa');
    if (btnAvancar) btnAvancar.addEventListener('click', function () {
        const orderId = btnAvancar.dataset.orderId;
        const order = state.orders.find(function (o) { return o.id === orderId; });
        if (!order) return;
        const idx = ETAPAS.findIndex(function (e) { return e.id === order.etapa_atual; });
        const next = ETAPAS[Math.min(idx + 1, ETAPAS.length - 1)];
        clickStageBtn(orderId, next.id);
    });

    const btnPend = document.getElementById('btnAbrirPendencia');
    if (btnPend) btnPend.addEventListener('click', function () {
        openPendenciaModal(btnPend.dataset.orderId);
    });

    // Bind pendencia modal save
    const btnSalvarPend = document.getElementById('btnSalvarPendencia');
    if (btnSalvarPend) btnSalvarPend.addEventListener('click', function () {
        savePendencia(btnSalvarPend.dataset.orderId);
    });

    // Bind FAB (pendencia shortcut)
    const fab = document.getElementById('pendenciaFab');
    if (fab) fab.addEventListener('click', function () {
        state.activeTab = '⚠️ Pendência';
        showView('kanban');
    });

    // Bind confirm stage modal cancel
    const btnCancel = document.getElementById('btnConfirmStageCancel');
    if (btnCancel) btnCancel.addEventListener('click', function () { closeModal('confirmStageModal'); });

    // Bind batch modal
    const btnBatch = document.getElementById('btnBatchMove');
    if (btnBatch) btnBatch.addEventListener('click', openBatchModal);
    const btnExecBatch = document.getElementById('btnExecuteBatch');
    if (btnExecBatch) btnExecBatch.addEventListener('click', executeBatchMove);

    // Bind status consulta
    const btnConsulta = document.getElementById('btnConsultarStatus');
    if (btnConsulta) btnConsulta.addEventListener('click', renderStatusConsulta);

    // Bind admin save
    const btnAdminSave = document.getElementById('btnAdminSave');
    if (btnAdminSave) btnAdminSave.addEventListener('click', saveAdminSettings);

    // Bind color modal close (click background)
    const colorModal = document.getElementById('colorModal');
    if (colorModal) colorModal.addEventListener('click', function (e) {
        if (e.target === colorModal) closeModal('colorModal');
    });

    // Bind img modal close
    const imgModal = document.getElementById('imgModal');
    if (imgModal) imgModal.addEventListener('click', function (e) {
        if (e.target === imgModal) closeModal('imgModal');
    });

    // Bind modal close buttons (generic)
    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal(btn.dataset.closeModal); });
    });

    // Bind activity complete button
    const btnComplete = document.getElementById('btnAtividadeConcluida');
    if (btnComplete) btnComplete.addEventListener('click', function () {
        const orderId = (state.selectedOrder && state.selectedOrder.id);
        if (!orderId) return;
        const order = state.orders.find(function (o) { return o.id === orderId; });
        if (!order) return;
        const idx = ETAPAS.findIndex(function (e) { return e.id === order.etapa_atual; });
        const next = ETAPAS[idx + 1];
        if (!next) { toast('Pedido ja na ultima etapa!', 'error'); return; }
        clickStageBtn(orderId, next.id);
    });

    // Start data load
    loadOrders();

    // Auto-refresh every 60s
    state._refreshTimer = setInterval(loadOrders, 60000);

    // Show default view
    showView('list');

    // smoke tests
    if (typeof runHNTTests === 'function') setTimeout(runHNTTests, 3000);
}

// ── BOOT ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function bindChatEvents(order) { const chatArea = document.querySelector('#chatMessages'); if (chatArea) chatArea.scrollTop = chatArea.scrollHeight; }

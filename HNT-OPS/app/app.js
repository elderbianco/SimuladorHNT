/* ============================================================
   HNT-OPS — App Logic v2 (com Ícones de Setor)
   ============================================================ */

// ── State Data (Configurável via Admin) ──────────────────
let ETAPAS = [];
let ETAPA_LABELS = {};
let ETAPA_ICONS = {};
let ETAPA_COLORS = {};

// ── State Data (Real) ─────────────────────────────────────
let PEDIDOS = [];
let OPERADORES = []; // Carregado via api.getOperadores()
let ETAPA_DURACOES = {}; // SLA por etapa (dias úteis)
const HISTORICO = {};
const CHAT_MSGS = {};

// ── Application State ─────────────────────────────────────
let currentView = 'lista';
let currentFilter = 'todos';
let selectedId = null;
let drawerTab = 'detalhes';

// ── DOM ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Batch State ───────────────────────────────────────────
let batchList = [];
let batchHtml5QrCode = null;

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carregar Configuração de Etapas/Stages ANTES de tudo
    if (typeof api !== 'undefined') {
        const { milestones } = await api.loadScheduleConfig();
        if (milestones && milestones.length > 0) {
            ETAPAS = milestones.map(m => m.etapa);
            milestones.forEach(m => {
                ETAPA_LABELS[m.etapa] = m.label || m.etapa;
                ETAPA_ICONS[m.etapa] = m.icone || '📋';
                ETAPA_COLORS[m.etapa] = m.cor || '#888';
                ETAPA_DURACOES[m.etapa] = m.duracao || 1;
            });
        }

        // Carregar Operadores
        const ops = await api.getOperadores();
        if (ops) {
            OPERADORES = ops.map(o => ({
                id: o.id,
                nome: o.nome,
                usuario: o.usuario,
                iniciais: o.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                perfil: o.perfil,
                setor: o.setor
            }));
        }

        const realData = await api.loadDashboard();
        if (realData && realData.length > 0) {
            PEDIDOS = realData.map(r => {
                let dt = r.dados_tecnicos_full || r.dados_tecnicos;
                if (typeof dt === 'string') { try { dt = JSON.parse(dt); } catch (e) { } }
                dt = dt || {};

                return {
                    id: r.id,
                    numero: r.numero_pedido || 'SN',
                    sku: r.sku,
                    tecnica: r.tecnica || 'Indefinida',
                    tamanho: r.tamanho || 'U',
                    quantidade: r.quantidade || 1,
                    etapa: r.etapa_atual,
                    prioridade: r.prioridade,
                    urgente: r.urgente,
                    alerta: r.alerta_cor || r.alerta_prazo || 'Verde',

                    // Novos campos de SLA dinâmico
                    diasRestantes: r.dias_restantes_etapa,
                    diasSlaEtapa: r.dias_restantes_etapa,
                    diasSlaTotal: r.dias_restantes_total,
                    paradoHa: r.dias_na_etapa_atual || 0,

                    prazo: typeof r.prazo_entrega === 'string' ? r.prazo_entrega.split('-').reverse().join('/') : r.prazo_entrega,
                    cliente: r.cliente_nome || 'Sem Cliente',
                    cpf: r.cliente_cpf || '--',
                    celular: r.cliente_celular || '--',
                    email: r.cliente_email || '--',
                    pdf: r.link_pdf,
                    emb: r.link_arquivo_bordado,
                    observacoes: r.observacoes || '',

                    // Technical Details Expansion
                    dadosTecnicos: dt,
                    renders: r.link_renders || {},

                    // Legacy color support
                    corCentro: (dt.parts?.Centro?.value || dt.parts?.Base?.value || dt.cor_centro || ''),
                    corLaterais: (dt.parts?.Laterais?.value || dt.cor_laterais || ''),
                    corFilete: (dt.parts?.Filete?.value || dt.parts?.Filetes?.value || dt.cor_filete || '')
                };
            });
        }

    }

    renderStats();
    renderTable(PEDIDOS);
    renderKanban(PEDIDOS);
    bindNav();
    bindTabs();
    bindQR();
    bindSearch();
    bindKanbanEvents();
    checkOnboarding();
    updateUserCard(); // Inicia com abas restritas até logar
});

// ── Onboarding ────────────────────────────────────────────
function checkOnboarding() {
    const skip = localStorage.getItem('hnt_onboarding_done');
    if (!skip) {
        const overlay = $('welcome-overlay');
        if (overlay) overlay.classList.add('active');
    }
}

function closeWelcome() {
    localStorage.setItem('hnt_onboarding_done', 'true');
    const overlay = $('welcome-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ── Stats ─────────────────────────────────────────────────
function renderStats() {
    $('stat-total').textContent = PEDIDOS.length;
    $('stat-urgente').textContent = PEDIDOS.filter(p => p.urgente || p.alerta === 'Vermelho').length;
    $('stat-atrasado').textContent = PEDIDOS.filter(p => p.diasRestantes <= 0).length;
    $('stat-hoje').textContent = PEDIDOS.filter(p => p.diasRestantes >= 0 && p.diasRestantes <= 1).length;
    $('stat-expedicao').textContent = PEDIDOS.filter(p => p.etapa === 'Expedicao').length;

    // Atualizar Contadores das Tabs
    if ($('count-todos')) $('count-todos').textContent = PEDIDOS.length;
    if ($('count-urgente')) $('count-urgente').textContent = PEDIDOS.filter(p => p.urgente || p.alerta === 'Vermelho').length;
    if ($('count-atrasado')) $('count-atrasado').textContent = PEDIDOS.filter(p => p.diasRestantes <= 0).length;
    if ($('count-hoje')) $('count-hoje').textContent = PEDIDOS.filter(p => p.diasRestantes >= 0 && p.diasRestantes <= 1).length;

    if (currentOperador && $('count-meu-setor')) {
        $('count-meu-setor').textContent = PEDIDOS.filter(p => p.etapa === currentOperador.setor || currentOperador.setor === 'Fábrica').length;
    }
}

// ── Table ─────────────────────────────────────────────────
function renderTable(data) {
    const tbody = $('table-body');
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = `<div style="padding:32px;text-align:center;color:var(--text-3);font-size:13px">Nenhum pedido encontrado.</div>`;
        return;
    }
    data.forEach(p => {
        const tr = document.createElement('div');
        tr.className = 'table-row';
        tr.dataset.id = p.id;
        const icon = ETAPA_ICONS[p.etapa] || '●';
        const label = ETAPA_LABELS[p.etapa] || p.etapa;
        tr.innerHTML = `
      <div class="cell-order">
        <span class="order-num">${p.numero}</span>
        <span class="order-sku" data-tooltip="Código Único do Produto">${p.sku}</span>
      </div>
      <div class="cell-qty">${p.quantidade}×<br><span style="font-size:10px;color:var(--text-3)">${p.tamanho}</span></div>
      <div class="cell-client">
        <span class="client-name">${p.cliente}</span>
        <span class="client-cpf">${p.cpf}</span>
      </div>
      <div class="cell-etapa">
        <span class="etapa-badge" style="background:${ETAPA_COLORS[p.etapa]}22; color:${ETAPA_COLORS[p.etapa]}; border: 1px solid ${ETAPA_COLORS[p.etapa]}">
          <span class="etapa-icon">${ETAPA_ICONS[p.etapa] || '📋'}</span>${ETAPA_LABELS[p.etapa] || p.etapa}
        </span>
      </div>
      <div class="cell-sla">
        <div class="sla-bar-wrap">
          ${(() => {
                const ph = slaPhaseInfo(p); return `
          <span class="alerta-tag alerta-${p.alerta} sla-phase-tag">
            ${ph.icon} ${ph.label}
          </span>
          <div class="sla-bar"><div class="sla-fill ${p.alerta.toLowerCase()}" style="width:${slaWidth(p)}%"></div></div>
          <span class="sla-label">${ph.sub}</span>
          `;
            })()}
        </div>
      </div>
      <div class="cell-prioridade">
        <div class="priority-wrap">
          ${p.urgente ? '<span class="urgente-tag">🔴 URGENTE</span>' : ''}
          <div class="priority-dots">${priorityDots(p.prioridade)}</div>
        </div>
      </div>
      <div class="cell-prazo" style="font-size:11.5px;color:var(--text-2);font-weight:600">${p.prazo}</div>
      <div class="row-actions">
        ${p.pdf ? `<button class="row-action-btn" title="Ver PDF" onclick="event.stopPropagation();openLink('${p.pdf}')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        </button>` : ''}
        ${p.emb ? `<button class="row-action-btn" title="Download .emb" onclick="event.stopPropagation();showProgress()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        </button>` : ''}
      </div>
    `;
        tr.addEventListener('click', () => openDrawer(p.id));
        tbody.appendChild(tr);
    });
}

// ── Kanban ────────────────────────────────────────────────

function renderKanban(data) {
    const wrap = $('kanban-body');
    wrap.innerHTML = '';
    ETAPAS.forEach(etapa => {
        const cards = data.filter(p => p.etapa === etapa);
        const icon = ETAPA_ICONS[etapa] || '';
        const label = ETAPA_LABELS[etapa] || etapa;
        const isPendencia = etapa === 'Pendencia';
        const col = document.createElement('div');
        col.className = 'kanban-col';
        col.innerHTML = `
      <div class="kanban-col-header${isPendencia ? ' pendencia-header' : ''}" onclick="showStageDetail('${etapa}')">
        <span class="kanban-col-icon">${icon}</span>
        <span class="kanban-col-name">${label}</span>
        <span class="kanban-col-count ${cards.length > 0 ? 'has-items' : ''}">${cards.length}</span>
      </div>
      <div class="kanban-cards-wrap" id="kcol-${etapa}" data-etapa="${etapa}">
        ${cards.map(p => {
            const ph = slaPhaseInfo(p);
            return `
          <div class="kanban-card ${p.alerta}${isPendencia ? ' pendencia-card' : ''}" data-id="${p.id}" onclick="openDrawer('${p.id}')" draggable="true">
            <div class="kanban-num">${p.numero}</div>
            <div class="kanban-sku">${p.sku} · ${p.tamanho} · ${p.quantidade}×</div>
            <div class="kanban-footer">
              <span class="alerta-tag alerta-${p.alerta}">${ph.icon} ${ph.label}</span>
              ${p.urgente ? '<span class="urgente-tag">🔴 URG</span>' : ''}
              ${isPendencia ? '<span class="pendencia-icon">⚠️</span>' : ''}
            </div>
            <div class="kanban-sub">${ph.sub}</div>
          </div>`;
        }).join('')}
        ${cards.length === 0 ? `<div class="kanban-empty">— vazio —</div>` : ''}
      </div>
    `;
        wrap.appendChild(col);
    });
    bindKanbanEvents(); // Rebind events after render
}

function bindKanbanEvents() {
    const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            card.classList.add('dragging');
        });
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
        });
    });

    const cols = document.querySelectorAll('.kanban-cards-wrap');
    cols.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessário para permitir o drop
            col.classList.add('drag-over');
        });
        col.addEventListener('dragleave', (e) => {
            col.classList.remove('drag-over');
        });
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const id = e.dataTransfer.getData('text/plain');
            const novaEtapa = col.dataset.etapa;
            if (id && novaEtapa) {
                moverEtapa(id, novaEtapa);
            }
        });
    });
}

// ── Drawer ────────────────────────────────────────────────
function openDrawer(id) {
    selectedId = id;
    drawerTab = 'detalhes';
    const p = PEDIDOS.find(x => x.id === id);
    if (!p) return;
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'detalhes'));
    $('chat-input-row').style.display = 'none';
    renderDrawer(p);
    $('drawer-overlay').classList.add('open');
    $('drawer').classList.add('open');
    // NOVO: Resetar estado de edição ao abrir
    isEditing = false;
}

function closeDrawer() {
    $('drawer-overlay').classList.remove('open');
    $('drawer').classList.remove('open');
    selectedId = null;
}

function renderDrawer(p) {
    $('drawer-num').textContent = p.numero;
    $('drawer-sku').textContent = `${p.sku} · ${p.tecnica} · ${p.tamanho} · ${p.quantidade} un.`;

    // Stage mover com ícones
    const sb = $('stage-buttons');
    sb.innerHTML = ETAPAS.filter(e => e !== 'Pendencia').map(e => `
    <button class="stage-btn ${e === p.etapa ? 'current' : ''}" onclick="moverEtapa('${p.id}','${e}')">
      <span>${ETAPA_ICONS[e]}</span> ${ETAPA_LABELS[e]}
    </button>
  `).join('') + `
    <button class="stage-btn pendencia-btn" onclick="moverEtapa('${p.id}','Pendencia')">
      <span>⚠️</span> Pendência
    </button>
  `;

    renderDrawerTab(p);
}

function renderDrawerTab(p) {
    const body = $('drawer-body');
    let contentHtml = '';

    if (drawerTab === 'detalhes') {
        const iconAtual = ETAPA_ICONS[p.etapa] || '';
        const labelAtual = ETAPA_LABELS[p.etapa] || p.etapa;

        // --- NOVO: Processamento de Dados Técnicos Detalhados ---
        const dt = p.dadosTecnicos || {};
        const parts = dt.parts || {};
        const texts = dt.texts || {};
        const renders = p.renders || {};

        // Cores Dinâmicas
        let colorsHtml = '';
        Object.entries(parts).forEach(([part, data]) => {
            const colorName = (typeof data === 'object') ? (data.value || data.name || '--') : data;
            if (colorName && colorName !== '--') {
                colorsHtml += `<div class="detail-item"><div class="detail-item-label">Cor ${part}</div><div class="detail-item-value">${colorName}</div></div>`;
            }
        });

        // Textos Dinâmicos
        let textsHtml = '';
        Object.entries(texts).forEach(([key, data]) => {
            if (data.active && data.content) {
                textsHtml += `
            <div class="personalization-item">
                <div class="pers-label">✍️ Texto ${key}</div>
                <div class="pers-content">"${data.content}"</div>
                <div class="pers-meta">${data.fontFamily || 'Padrão'} · ${data.color || 'Preto'}</div>
            </div>`;
            }
        });

        contentHtml = `
      <div class="detail-section" style="margin-top:0">
        <div class="detail-section-title">📦 Produto</div>
        <div class="detail-grid">
          <div class="detail-item"><div class="detail-item-label">SKU</div><div class="detail-item-value">${p.sku}</div></div>
          <div class="detail-item"><div class="detail-item-label">Técnica</div><div class="detail-item-value">${p.tecnica}</div></div>
          <div class="detail-item"><div class="detail-item-label">Tamanho</div><div class="detail-item-value">${p.tamanho}</div></div>
          <div class="detail-item"><div class="detail-item-label">Quantidade</div><div class="detail-item-value">${p.quantidade} un.</div></div>
          <div class="detail-item"><div class="detail-item-label">Etapa Atual</div><div class="detail-item-value"><span class="etapa-badge etapa-${p.etapa}"><span class="etapa-icon">${iconAtual}</span>${labelAtual}</span></div></div>
          <div class="detail-item"><div class="detail-item-label">SLA Etapa</div><div class="detail-item-value"><span class="alerta-tag alerta-${p.alerta}">${alertaIcon(p.alerta)} ${p.diasSlaEtapa <= 0 ? 'Vencido' : p.diasSlaEtapa + 'd.u.'}</span></div></div>
          <div class="detail-item"><div class="detail-item-label">SLA Total</div><div class="detail-item-value">${p.diasSlaTotal <= 0 ? '<span style="color:var(--red);font-weight:700">Atrasado</span>' : p.diasSlaTotal + 'd.u.'}</div></div>
          
          ${colorsHtml || `
            <div class="detail-item"><div class="detail-item-label">Cor Centro</div><div class="detail-item-value">${p.corCentro}</div></div>
            <div class="detail-item"><div class="detail-item-label">Cor Laterais</div><div class="detail-item-value">${p.corLaterais}</div></div>
            <div class="detail-item full"><div class="detail-item-label">Cor Filete</div><div class="detail-item-value">${p.corFilete}</div></div>
          `}
          
          <div class="detail-item full"><div class="detail-item-label">Prazo Final</div><div class="detail-item-value">${p.prazo}</div></div>
          ${p.observacoes ? `<div class="detail-item full"><div class="detail-item-label">Observações</div><div class="detail-item-value">${p.observacoes}</div></div>` : ''}
        </div>
      </div>

      ${textsHtml ? `
      <div class="detail-section">
        <div class="detail-section-title">🧵 Detalhes de Personalização</div>
        <div class="personalization-grid">
            ${textsHtml}
        </div>
      </div>` : ''}

      <div class="detail-section">
        <div class="detail-section-title">🎨 Artes e Arquivos</div>
        <div class="art-grid">
          <div class="art-thumb" style="cursor:pointer" onclick="${renders.frente ? `window.open('${renders.frente}','_blank')` : 'return false'}">
            ${renders.frente ? `<img src="${renders.frente}" style="width:100%;height:100%;object-fit:contain">` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>`}
            <span>Frente</span>
          </div>
          <div class="art-thumb" style="cursor:pointer" onclick="${renders.costas ? `window.open('${renders.costas}','_blank')` : 'return false'}">
            ${renders.costas ? `<img src="${renders.costas}" style="width:100%;height:100%;object-fit:contain">` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>`}
            <span>Costas</span>
          </div>
          <div class="art-thumb" style="cursor:pointer" onclick="${renders.lateral ? `window.open('${renders.lateral}','_blank')` : 'return false'}">
            ${renders.lateral ? `<img src="${renders.lateral}" style="width:100%;height:100%;object-fit:contain">` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>`}
            <span>Lateral</span>
          </div>
        </div>
        <div class="file-links" style="margin-top:10px">
          ${p.pdf ? `<a class="file-link" href="${p.pdf}" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            <span class="file-link-name">PDF de Simulação</span><span class="file-link-type">PDF</span>
          </a>` : ''}
          ${p.emb ? `<a class="file-link" href="${p.emb}" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            <span class="file-link-name">🧵 Matriz de Bordado</span><span class="file-link-type">.EMB</span>
          </a>` : ''}
          <a class="file-link" href="#" onclick="alert('Funcionalidade em desenvolvimento: Integração com Drive');return false">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
            <span class="file-link-name">🎨 Pasta de Imagens</span><span class="file-link-type">PASTA</span>
          </a>
        </div>
      </div>
    `;


    } else if (drawerTab === 'cliente') {
        contentHtml = `
      <div class="detail-section" style="margin-top:0">
        <div class="detail-section-title">👤 Informações do Cliente</div>
        <div class="detail-grid">
          <div class="detail-item full"><div class="detail-item-label">Nome Completo</div><div class="detail-item-value">${p.cliente}</div></div>
          <div class="detail-item"><div class="detail-item-label">CPF / CNPJ</div><div class="detail-item-value">${p.cpf}</div></div>
          <div class="detail-item"><div class="detail-item-label">Celular</div><div class="detail-item-value">${p.celular}</div></div>
          <div class="detail-item full"><div class="detail-item-label">E-mail</div><div class="detail-item-value">${p.email}</div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">📦 Endereço de Entrega/Faturamento</div>
        <div class="detail-grid">
           <div class="detail-item full"><div class="detail-item-label">Endereço</div><div class="detail-item-value" style="color:var(--text-3); font-style:italic">Integrado com Bling na NF-e</div></div>
        </div>
      </div>
    `;
    } else if (drawerTab === 'historico') {

        const pId = p.id;
        body.innerHTML = `<div style="padding:20px;text-align:center"><div class="loading-spinner"></div> Carregando timeline...</div>`;

        // Busca do DB se API disponível
        (async () => {
            let hist = HISTORICO[pId] || [];
            if (typeof api !== 'undefined') {
                const realHist = await api.loadHistorico(pId);
                if (realHist) {
                    hist = realHist.map(h => ({
                        etapa: h.etapa,
                        status: h.status === 'Concluido' ? 'done' : 'current',
                        op: h.operador || 'Sistema',
                        entrou: h.entrou_em ? new Date(h.entrou_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--',
                        saiu: h.saiu_em ? new Date(h.saiu_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null,
                        duracao: h.tempo_na_etapa_dias ? h.tempo_na_etapa_dias.toFixed(1) + 'd' : null
                    }));
                }
            }

            body.innerHTML = `
                <div class="detail-section">
                    <div class="detail-section-title">⏱ Timeline de Produção</div>
                    <div class="timeline">
                    ${ETAPAS.filter(e => e !== 'Pendencia').map(etapa => {
                const h = hist.find(x => x.etapa === etapa);
                const isDone = h && h.status === 'done';
                const isCurrent = h && h.status === 'current';
                return `
                        <div class="timeline-item">
                            <div class="timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}">
                            ${isDone
                        ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>'
                        : `<span style="font-size:13px">${ETAPA_ICONS[etapa]}</span>`}
                            </div>
                            <div class="timeline-content">
                            <span class="timeline-stage">${ETAPA_ICONS[etapa]} ${ETAPA_LABELS[etapa]}</span>
                            ${h ? `<div class="timeline-meta">
                                ${h.op} · ${h.entrou}${h.saiu ? ' → ' + h.saiu : ' <span style="color:var(--amber);font-weight:700">em andamento</span>'}
                                ${h.duracao ? `<span class="timeline-duration">${h.duracao}</span>` : ''}
                            </div>` : `<div class="timeline-meta" style="color:var(--text-3)">Não iniciado</div>`}
                            </div>
                        </div>`;
            }).join('')}
                    </div>
                </div>`;
        })();

    } else if (drawerTab === 'chat') {
        const pId = p.id;
        body.innerHTML = `<div style="padding:20px;text-align:center"><div class="loading-spinner"></div> Carregando mensagens...</div>`;

        (async () => {
            let msgs = CHAT_MSGS[pId] || [];
            if (typeof api !== 'undefined') {
                const realChat = await api.loadChat(pId);
                if (realChat) {
                    msgs = realChat.map(m => ({
                        autor: m.autor,
                        iniciais: m.autor.slice(0, 2).toUpperCase(),
                        texto: m.texto,
                        hora: new Date(m.enviado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
                        mine: currentOperador && m.autor === currentOperador.nome
                    }));
                }
            }

            body.innerHTML = `
                <div class="detail-section">
                    <div class="detail-section-title">💬 Chat de Setores</div>
                    ${msgs.length === 0 ? `<div style="text-align:center;color:var(--text-3);font-size:13px;padding:20px 0">Sem mensagens ainda.</div>` : ''}
                    <div class="chat-wrap">
                    ${msgs.map(m => `
                        <div class="chat-bubble ${m.mine ? 'mine' : ''}">
                        <div class="chat-avatar" title="${m.autor}">${m.iniciais}</div>
                        <div class="chat-msg-wrap">
                            <div class="chat-who">${m.autor} · ${m.hora}</div>
                            <div class="chat-text">${m.texto}</div>
                        </div>
                        </div>`).join('')}
                </div>`;
            setTimeout(() => {
                const cw = $('.chat-wrap');
                if (cw) cw.scrollTop = cw.scrollHeight;
            }, 100);
        })();
    }

    if (contentHtml !== '') {
        body.innerHTML = contentHtml;
    }
}

async function sendChat() {
    const input = $('chat-msg-input');
    const msg = input.value.trim();
    if (!msg || !selectedId || !currentOperador) {
        if (!currentOperador) alert("Você precisa estar logado (selecionar seu nome no QRCode) para enviar mensagens.");
        return;
    }

    input.value = '';
    const p = PEDIDOS.find(x => x.id === selectedId);

    // Add instantly to UI for perceived speed
    const chatWrap = document.querySelector('.chat-wrap');
    if (chatWrap) {
        const dummy = document.createElement('div');
        dummy.className = 'chat-bubble mine';
        dummy.innerHTML = `
            <div class="chat-avatar">${currentOperador.iniciais}</div>
            <div class="chat-msg-wrap">
                <div class="chat-who">${currentOperador.nome} · Agora</div>
                <div class="chat-text">${msg}</div>
            </div>
        `;
        chatWrap.appendChild(dummy);
        chatWrap.scrollTop = chatWrap.scrollHeight;
    }

    try {
        if (typeof api !== 'undefined') {
            await api.sendChat(selectedId, msg, currentOperador.nome, currentOperador.setor || p.etapa);
        } else {
            // Mock mode
            if (!CHAT_MSGS[selectedId]) CHAT_MSGS[selectedId] = [];
            CHAT_MSGS[selectedId].push({ autor: currentOperador.nome, iniciais: currentOperador.iniciais, texto: msg, hora: 'Agora', mine: true });
        }
    } catch (e) {
        console.error("Erro ao enviar mensagem", e);
        alert("Erro ao enviar mensagem no banco de dados.");
    }
}

// ── Move Stage ────────────────────────────────────────────
async function moverEtapa(id, novaEtapa) {
    const p = PEDIDOS.find(x => x.id === id);
    if (!p || p.etapa === novaEtapa) return;

    // Se estivermos em um setor, vamos pedir quem é o operador (Opcional, mas bom para o BI)
    if (typeof openOpSelect === 'function' && !currentOperador) {
        openOpSelect(async (op) => {
            currentOperador = op;
            await executeMove(id, novaEtapa, p);
        });
    } else {
        await executeMove(id, novaEtapa, p);
    }
}

async function executeMove(id, novaEtapa, p) {
    try {
        console.log(`HNT-OPS: Movendo ${p.numero} para ${novaEtapa}...`);

        // 1. Update no DB (Supabase)
        if (typeof api !== 'undefined') {
            await api.updateEtapa(id, novaEtapa);
            // Se tiver operador logado, registra o check-in na nova etapa
            if (currentOperador) {
                await api.checkInRastreamento(id, novaEtapa, currentOperador.nome);
            }
        }

        // 2. Atualiza Estado Local
        p.etapa = novaEtapa;

        // 3. UI Update
        renderDrawer(p);
        renderTable(filterData());
        renderKanban(filterData());
        renderStats();

        setTimeout(() => {
            const card = document.querySelector(`.kanban-card[data-id="${id}"]`);
            if (card) {
                card.classList.add('qr-updated');
                setTimeout(() => card.classList.remove('qr-updated'), 3000);
            }
        }, 100);
    } catch (e) {
        console.error("Erro ao mover etapa:", e);
        alert("Erro ao salvar mudança no servidor.");
    }
}

// ── Admin Actions (Ações de Gestão) ───────────────────────
async function excluirPedidoUI() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id === selectedId);
    if (!confirm(`TEM CERTEZA? Isso excluirá o pedido ${p.numero} PERMANENTEMENTE de todo o sistema.`)) return;

    try {
        if (typeof api !== 'undefined') {
            await api.deletePedido(selectedId);
        }
        PEDIDOS = PEDIDOS.filter(x => x.id !== selectedId);
        closeDrawer();
        renderTable(filterData());
        renderKanban(filterData());
        renderStats();
    } catch (e) {
        alert("Erro ao excluir pedido: " + e.message);
    }
}

async function cancelarPedidoUI() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id === selectedId);
    if (!confirm(`Deseja cancelar a produção deste pedido? ELE IRÁ PARA A ETAPA 'CANCELADO'.`)) return;

    try {
        if (typeof api !== 'undefined') {
            await api.cancelPedido(selectedId);
        }
        p.etapa = 'Cancelado';
        renderDrawer(p);
        renderTable(filterData());
        renderKanban(filterData());
    } catch (e) {
        alert("Erro ao cancelar pedido: " + e.message);
    }
}

let isEditing = false;
function toggleEdicao() {
    isEditing = !isEditing;
    const p = PEDIDOS.find(x => x.id === selectedId);
    renderDrawerTab(p);
}

async function saveEdicao() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id === selectedId);

    const fields = {
        sku: $('edit-sku').value,
        quantidade: parseInt($('edit-qtd').value),
        tamanho: $('edit-tam').value,
        observacoes: $('edit-obs').value
    };

    try {
        if (typeof api !== 'undefined') {
            await api.updatePedido(selectedId, fields);
        }

        // Update local state
        Object.assign(p, fields);
        isEditing = false;
        renderDrawer(p); // Re-render everything to show new SKU etc
        renderTable(filterData());
        renderKanban(filterData());
    } catch (e) {
        alert("Erro ao salvar alterações: " + e.message);
    }
}


function moverEtapaLocal(id, novaEtapa) {
    const p = PEDIDOS.find(x => x.id === id);
    if (p) p.etapa = novaEtapa;
}

// ── Filters & Search ──────────────────────────────────────
function filterData() {
    let data = [...PEDIDOS];
    if (currentFilter === 'urgente') data = data.filter(p => p.urgente || p.alerta === 'Vermelho');
    if (currentFilter === 'atrasado') data = data.filter(p => p.diasRestantes <= 0);
    if (currentFilter === 'hoje') data = data.filter(p => p.diasRestantes >= 0 && p.diasRestantes <= 1);
    if (currentFilter === 'meu-setor' && currentOperador) {
        data = data.filter(p => p.etapa === currentOperador.setor || currentOperador.setor === 'Fábrica');
    }
    const q = $('search-input').value.toLowerCase().trim();
    if (q) data = data.filter(p =>
        p.numero.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.cpf.includes(q)
    );
    return data;
}

function bindSearch() {
    $('search-input').addEventListener('input', () => renderTable(filterData()));
}

// ── Nav & Tabs ────────────────────────────────────────────
function bindNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
        el.addEventListener('click', () => {
            const view = el.dataset.view;

            // Proteção de Acesso para BI e Admin
            if (view === 'relatorios' || view === 'admin') {
                showAdminAuth(view, () => {
                    switchView(el);
                });
                return;
            }

            switchView(el);
        });
    });
}

function switchView(el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentView = el.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = $(currentView + '-view');
    if (target) target.classList.add('active');
}

function showAdminAuth(targetView, onSuccess) {
    const modal = $('admin-auth-modal');
    const userInput = $('admin-user-input');
    const passInput = $('admin-password-input');
    const confirmBtn = $('auth-confirm');
    const cancelBtn = $('auth-cancel');
    const errorMsg = $('auth-error-msg');

    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.add('open');
    userInput.value = '';
    passInput.value = '';
    userInput.focus();
    errorMsg.style.display = 'none';

    // Limpar eventos anteriores
    const newConfirm = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newConfirm.addEventListener('click', async () => {
        const user = userInput.value.trim();
        const pass = passInput.value.trim();
        if (!user || !pass) return;

        const result = await api.verifyAdminPassword(user, pass);

        if (result && (result.perfil === 'Admin' || result.perfil === 'Gerente')) {
            modal.style.display = 'none';
            modal.classList.remove('open');
            // Log de acesso
            api.logAdminAccess(result.id, result.nome, navigator.userAgent);
            onSuccess();
        } else {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Usuário ou senha incorretos.';
            passInput.value = '';
            passInput.focus();
        }
    });

    newCancel.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.classList.remove('open');
    });

    userInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') passInput.focus();
    });

    passInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') newConfirm.click();
    });
}

function bindTabs() {
    document.querySelectorAll('.tab[data-filter]').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            currentFilter = el.dataset.filter;
            renderTable(filterData());
        });
    });
    document.querySelectorAll('.drawer-tab[data-tab]').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            drawerTab = el.dataset.tab;
            $('chat-input-row').style.display = drawerTab === 'chat' ? 'flex' : 'none';
            const p = PEDIDOS.find(x => x.id === selectedId);
            if (p) renderDrawerTab(p);
        });
    });

    const chatInput = $('chat-msg-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') sendChat();
        });
    }
}

// ── QR Scanner ────────────────────────────────────────────
function bindQR() {
    $('btn-qr').addEventListener('click', openQR);
    $('qr-cancel').addEventListener('click', closeQR);
    $('qr-confirm').addEventListener('click', processQR);
    $('qr-manual-input').addEventListener('keydown', e => { if (e.key === 'Enter') processQR(); });
    const fab = document.querySelector('.mobile-fab');
    if (fab) fab.addEventListener('click', openQR);

    // Batch Events
    $('btn-batch').addEventListener('click', openBatchModal);
    $('batch-cancel').addEventListener('click', closeBatchModal);
    $('btn-batch-execute').addEventListener('click', executeBatchUpdate);
    $('batch-target-etapa').addEventListener('change', updateBatchGlobalTarget);
    $('batch-manual-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            processBatchManualInput();
        }
    });
}

let html5QrCode;

function openQRBase() {
    $('qr-modal').classList.add('open');
    setTimeout(() => {
        $('qr-manual-input').focus();

        // Start QR Scanner (Camera) - ONLY MOBILE
        const isMobile = window.innerWidth <= 768;
        if (isMobile && typeof Html5Qrcode !== "undefined") {
            try {
                if (!html5QrCode) {
                    html5QrCode = new Html5Qrcode("qr-reader");
                }
                const config = { fps: 10, qrbox: { width: 200, height: 200 } };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText, decodedResult) => {
                        // Success Callback
                        $('qr-manual-input').value = decodedText;
                        processQR();
                    },
                    (errorMessage) => {
                        // Parse error, ignore
                    }
                ).catch((err) => {
                    console.log("Câmera indisponível ou permissão negada:", err);
                    $('qr-placeholder').style.display = 'flex';
                });
            } catch (err) {
                console.error("Html5Qrcode init error", err);
                $('qr-placeholder').style.display = 'flex';
            }
        } else {
            const reader = $('qr-reader');
            if (reader) reader.style.display = 'none';
            $('qr-placeholder').style.display = 'flex';
            $('qr-placeholder').innerHTML = `<div style="text-align:center;color:var(--text-3);font-size:12px;padding:20px;">Use o leitor USB ou digite o código de barras abaixo.</div>`;
        }
    }, 300);
}

function closeQR() {
    $('qr-modal').classList.remove('open');

    // Stop Camera if running
    if (html5QrCode) {
        try {
            const state = html5QrCode.getState();
            // 2 indicates SCANNING, 3 indicates SECURED (PAUSED)
            if (state === 2 || state === 3) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch((err) => {
                    console.error("Failed to stop camera:", err);
                });
            }
        } catch (e) {
            console.error("Error stopping qr:", e);
        }
    }
}

async function processQR() {
    const val = $('qr-manual-input').value.trim().toUpperCase();
    if (!val) return;

    const p = PEDIDOS.find(x => x.numero === val || x.numero.includes(val));
    if (!p) {
        alert('⚠️ Pedido não encontrado: ' + val);
        return;
    }

    closeQR();
    $('qr-manual-input').value = '';

    // Fluxo Inteligente: Se detectar o pedido, pergunta quem é o operador para dar o "Check-in"
    if (typeof openOpSelect === 'function') {
        openOpSelect(async (op) => {
            currentOperador = op;

            // Registra entrada no Supabase se API ativa
            if (typeof api !== 'undefined') {
                console.log(`HNT-OPS: Registrando check-in de ${op.nome} no pedido ${p.numero}`);
                await api.checkInRastreamento(p.id, p.etapa, op.nome);
            }

            openDrawer(p.id);
            const row = document.querySelector(`.table-row[data-id="${p.id}"]`);
            if (row) {
                row.classList.add('qr-updated');
                setTimeout(() => row.classList.remove('qr-updated'), 3000);
            }
        });
    } else {
        openDrawer(p.id);
    }
}

// ── Lote Logic ────────────────────────────────────────────
let batchGlobalTarget = 'Preparacao';

function openBatchModal() {
    batchList = [];

    // Popular select global de etapas
    const select = $('batch-target-etapa');
    select.innerHTML = ETAPAS.map(e => `<option value="${e}">${ETAPA_ICONS[e] || ''} ${ETAPA_LABELS[e] || e}</option>`).join('');
    batchGlobalTarget = select.value || 'Preparacao';

    renderBatchList();

    $('batch-modal').style.display = 'flex';
    setTimeout(() => {
        $('batch-modal').classList.add('open');
        startBatchScanner();
        $('batch-manual-input').focus();
    }, 10);
}

function closeBatchModal() {
    $('batch-modal').classList.remove('open');
    if (batchHtml5QrCode) {
        batchHtml5QrCode.stop().then(() => {
            batchHtml5QrCode.clear();
            batchHtml5QrCode = null;
        }).catch(e => console.error("Error stopping batch scanner", e));
    }
    setTimeout(() => $('batch-modal').style.display = 'none', 300);
}

function startBatchScanner() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile && typeof Html5Qrcode !== "undefined") {
        try {
            if (!batchHtml5QrCode) {
                batchHtml5QrCode = new Html5Qrcode("batch-qr-reader");
            }
            const config = { fps: 15, qrbox: { width: 180, height: 180 } };

            batchHtml5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    addPedidoToBatch(decodedText);
                },
                () => { }
            ).catch(err => console.error("Batch camera error", err));
        } catch (err) { console.error("Batch init error", err); }
    } else {
        const reader = $('batch-qr-reader');
        if (reader) {
            reader.innerHTML = `<div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-3); font-size:12px; text-align:center; padding: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:32px; height:32px; margin-bottom:8px; opacity:0.5;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                LEITOR DE CÓDIGO ATIVO<br>Posicione a caixa e bipe o pedido.
            </div>`;
        }
    }
}

function processBatchManualInput() {
    const input = $('batch-manual-input');
    const val = input.value.trim();
    if (val) {
        addPedidoToBatch(val);
        input.value = '';
    }
}

function addPedidoToBatch(rawText) {
    const val = rawText.trim().toUpperCase();
    const p = PEDIDOS.find(x => x.numero === val || x.numero.includes(val));
    if (p && !batchList.some(item => item.p.id === p.id)) {
        batchList.unshift({ p: p, target: batchGlobalTarget });
        renderBatchList();

        // Feedback visual rápido
        const reader = $('batch-qr-reader');
        reader.style.borderColor = 'var(--green)';
        setTimeout(() => reader.style.borderColor = 'transparent', 500);
    }
}

function updateBatchGlobalTarget(e) {
    batchGlobalTarget = e.target.value;
    // Update all items in the list to match the new global target
    batchList.forEach(item => {
        item.target = batchGlobalTarget;
    });
    renderBatchList();
}

window.updateBatchItemTarget = function (id, value) {
    const item = batchList.find(x => x.p.id === id);
    if (item) {
        item.target = value;
    }
};

window.clearBatch = function () {
    batchList = [];
    renderBatchList();
};

function renderBatchList() {
    const wrap = $('batch-items-list');
    const countLabel = $('batch-list-count-label');

    if (countLabel) countLabel.textContent = `FILA DE PEDIDOS LIDOS (${batchList.length})`;
    $('btn-batch-execute').textContent = `🚀 PROCESSAR FILA (${batchList.length})`;

    if (batchList.length === 0) {
        wrap.innerHTML = '<div style="padding: 40px 20px; text-align:center; color:var(--text-3); font-size:13px;">A fila está vazia.<br><br>Comece a escanear códigos ou digite acima para adicionar itens.</div>';
    } else {
        const optionList = ETAPAS.map(e => `<option value="${e}">${ETAPA_ICONS[e] || ''} ${ETAPA_LABELS[e] || e}</option>`).join('');

        wrap.innerHTML = batchList.map((item, idx) => {
            const p = item.p;
            return `
            <div class="batch-item" style="background:var(--surface); border:1px solid var(--border); border-radius:6px; margin-bottom:8px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                <div style="width:24px; text-align:center; font-weight:700; color:var(--text-3); font-size:10px;">${batchList.length - idx}</div>
                <div style="flex:1; min-width:150px;">
                    <div class="batch-item-id" style="font-size:14px; margin-bottom:2px;">${p.numero}</div>
                    <div style="color:var(--text-2); font-size:11px;"><b>${p.cliente}</b></div>
                    <div style="color:var(--text-3); font-size:11px;">${p.sku} · ${p.quantidade} un.</div>
                    <div style="color:var(--text-3); font-size:10px; margin-top:2px;">Atual: <span style="color:var(--amber)">${ETAPA_LABELS[p.etapa] || p.etapa}</span></div>
                </div>
                
                <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:10px; font-weight:700; color:var(--text-3);">NOVO STATUS:</label>
                    <select class="batch-item-stage" onchange="updateBatchItemTarget('${p.id}', this.value)" style="padding:8px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1); outline:none; cursor:pointer; width:100%; font-weight:600;">
                        ${ETAPAS.map(e => `<option value="${e}" ${item.target === e ? 'selected' : ''}>${ETAPA_ICONS[e] || ''} ${ETAPA_LABELS[e] || e}</option>`).join('')}
                    </select>
                </div>
                
                <div style="padding:0 10px;">
                    <button class="batch-item-remove" onclick="removeFromBatch('${p.id}')" title="Remover da fila" style="background:var(--red-dim); color:var(--red); width:32px; height:32px; border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none;">✕</button>
                </div>
            </div>
        `}).join('');
    }
}

window.removeFromBatch = function (id) {
    batchList = batchList.filter(item => item.p.id !== id);
    renderBatchList();
};

async function executeBatchUpdate() {
    if (batchList.length === 0) return;
    const btn = $('btn-batch-execute');

    if (!confirm(`Confirma o processamento de ${batchList.length} pedidos na fila?`)) return;

    btn.disabled = true;
    btn.textContent = '⌛ Processando...';

    let successCount = 0;
    // Clona o array pois removeFromBatch será modificado durante o loop opcionalmente, mas aqui for iteramos
    for (const item of batchList) {
        const p = item.p;
        const targetEtapa = item.target;
        try {
            if (typeof api !== 'undefined') {
                await api.updateEtapa(p.id, targetEtapa);
                if (currentOperador) {
                    await api.checkInRastreamento(p.id, targetEtapa, currentOperador.nome);
                }
            }
            p.etapa = targetEtapa;
            successCount++;
            btn.textContent = `⌛ ${successCount}/${batchList.length}...`;
        } catch (e) {
            console.error(`Erro ao atualizar pedido ${p.numero}:`, e);
        }
    }

    alert(`Sucesso! ${successCount} pedidos atualizados.`);
    closeBatchModal();

    // Refresh UI
    renderTable(filterData());
    renderKanban(filterData());
    renderStats();
}

// ── Progress Bar ──────────────────────────────────────────
function showProgress() {
    $('progress-modal').classList.add('open');
    const fill = $('progress-fill');
    const lbl = $('progress-label-txt');
    let pct = 0;
    const steps = ['🧵 Verificando matriz...', '📁 Preparando arquivo...', '🗜️ Compactando...', '✅ Pronto!'];
    const iv = setInterval(() => {
        pct = Math.min(pct + Math.random() * 28, 100);
        fill.style.width = pct + '%';
        lbl.textContent = steps[Math.min(Math.floor(pct / 26), steps.length - 1)];
        if (pct >= 100) {
            clearInterval(iv);
            setTimeout(() => { $('progress-modal').classList.remove('open'); fill.style.width = '0%'; }, 1100);
        }
    }, 320);
}

// ── Chat ──────────────────────────────────────────────────
async function sendChat() {
    const input = $('chat-msg-input');
    const msg = input.value.trim();
    if (!msg || !selectedId) return;

    const p = PEDIDOS.find(x => x.id === selectedId);
    if (!p) return;

    try {
        // 1. Enviar para o DB
        if (typeof api !== 'undefined') {
            await api.sendChat(selectedId, msg, currentOperador ? currentOperador.nome : 'Sistema', p.etapa);
        }

        // 2. UI Update (otimista)
        const wrap = document.querySelector('.chat-wrap');
        if (!wrap) return;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble mine';
        const now = new Date();
        const hora = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        bubble.innerHTML = `
        <div class="chat-avatar">OP</div>
        <div class="chat-msg-wrap">
          <div class="chat-who">Você · ${hora}</div>
          <div class="chat-text">${msg}</div>
        </div>`;
        wrap.appendChild(bubble);
        input.value = '';
        bubble.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        console.error("Erro ao enviar chat:", e);
        alert("Erro ao enviar mensagem.");
    }
}

// ── Helpers ───────────────────────────────────────────────
function slaWidth(p) {
    // Se estourou qualquer um, barra cheia (vermelho)
    if (p.diasRestantes <= 0) return 100;

    // Calcula % baseado no SLA da etapa atual
    const duracaoEtapa = ETAPA_DURACOES[p.etapa] || 7;
    return Math.max(5, Math.min(100, 100 - (p.diasRestantes / duracaoEtapa * 100)));
}
function priorityDots(n) {
    return Array.from({ length: 5 }, (_, i) => `<div class="priority-dot ${i < n ? 'filled' : ''}"></div>`).join('');
}
function alertaIcon(a) {
    return { Verde: '🟢', Amarelo: '🟡', Laranja: '🟠', Vermelho: '🔴' }[a] || '';
}

/**
 * Returns { icon, label, sub } describing the SLA phase of a pedido,
 * based on diasRestantes and urgente flag.
 */
function slaPhaseInfo(p) {
    const d = p.diasRestantes;
    const isVencidoTotal = (p.diasSlaTotal !== undefined && p.diasSlaTotal <= 0);
    const isVencidoEtapa = (p.diasSlaEtapa !== undefined && p.diasSlaEtapa <= 0);

    if (p.urgente && (isVencidoEtapa || isVencidoTotal))
        return { icon: '🔴', label: 'VENC + URG', sub: isVencidoTotal ? 'Prazo Total Estourado' : 'SLA da Etapa Estourado' };

    if (p.urgente) return { icon: '🔴', label: 'URGENTE', sub: `${d}d.u. restantes` };

    if (isVencidoTotal) return { icon: '⛔', label: 'ATRASADO', sub: 'Prazo Final Vencido' };
    if (isVencidoEtapa) return { icon: '🕒', label: 'VENCIDO', sub: 'Atrasado nesta etapa' };

    if (d === 1) return { icon: '🔴', label: 'CRÍTICO', sub: 'Termina amanhã' };
    if (d <= 2) return { icon: '🟠', label: 'EM RISCO', sub: `${d}d.u. restantes` };
    if (d <= 4) return { icon: '🟡', label: 'ATENÇÃO', sub: `${d}d.u. restantes` };
    if (d <= 7) return { icon: '🟢', label: 'NO PRAZO', sub: `${d}d.u. restantes` };
    return { icon: '✅', label: 'CONFORTO', sub: `${d}d.u. restantes` };
}

function openLink(name) { alert('📄 Abrindo: ' + name); }

/* ============================================================
   BI MODULE — Relatórios e Inteligência
   ============================================================ */

// ── Mock BI Data ──────────────────────────────────────────
// OPERADORES is now dynamic (defined at the top)


const SETOR_BI = [
    { etapa: 'Preparacao', pecas: 42, leadMedio: 0.4, metaDias: 0.5, color: 'green' },
    { etapa: 'Separacao', pecas: 35, leadMedio: 0.7, metaDias: 0.8, color: 'green' },
    { etapa: 'Arte', pecas: 28, leadMedio: 1.8, metaDias: 1.5, color: 'orange' },
    { etapa: 'Bordado', pecas: 22, leadMedio: 3.2, metaDias: 2.0, color: 'red' },
    { etapa: 'Costura', pecas: 18, leadMedio: 2.1, metaDias: 1.8, color: 'orange' },
    { etapa: 'Qualidade', pecas: 15, leadMedio: 0.6, metaDias: 0.5, color: 'amber' },
    { etapa: 'Expedicao', pecas: 31, leadMedio: 0.3, metaDias: 0.3, color: 'green' },
];

const PENDENCIA_TIPOS = [
    { tipo: 'Erro de Arte', qtd: 12, color: '#f59e0b' },
    { tipo: 'Insumo Faltante', qtd: 7, color: '#f97316' },
    { tipo: 'Falha de Máquina', qtd: 5, color: '#ef4444' },
    { tipo: 'Erro de Corte', qtd: 4, color: '#6b7280' },
    { tipo: 'Outros', qtd: 3, color: '#8b5cf6' },
];

const RETRABALHO = [
    { origem: 'Arte', destino: 'Bordado', ocorrencias: 8, diasPerdidos: 3.2 },
    { origem: 'Arte', destino: 'Costura', ocorrencias: 4, diasPerdidos: 1.8 },
    { origem: 'Separação', destino: 'Bordado', ocorrencias: 3, diasPerdidos: 1.1 },
    { origem: 'Costura', destino: 'Qualidade', ocorrencias: 2, diasPerdidos: 0.9 },
];

const FORECAST = [
    { data: 'Hoje (14/03)', pedidos: 1, max: 5 },
    { data: '15/03 (seg)', pedidos: 3, max: 5 },
    { data: '16/03 (ter)', pedidos: 0, max: 5 },
    { data: '17/03 (qua)', pedidos: 1, max: 5 },
    { data: '18/03 (qui)', pedidos: 0, max: 5 },
    { data: '19/03 (sex)', pedidos: 0, max: 5 },
    { data: '20/03 (sáb)', pedidos: 0, max: 5 },
];

// ── Render Reports Page ───────────────────────────────────
function renderRelatorios() {
    const view = $('relatorios-view');
    if (!view) return;
    view.innerHTML = `
    <div class="report-toolbar">
      <span class="report-label">Período</span>
      <input class="report-input" type="date" id="r-from" value="2026-03-01">
      <span class="report-label">até</span>
      <input class="report-input" type="date" id="r-to" value="2026-03-31">
      <select class="report-select" id="r-setor">
        <option value="">Todos os Setores</option>
        ${ETAPAS.filter(e => e !== 'Pendencia').map(e => `<option>${ETAPA_LABELS[e]}</option>`).join('')}
      </select>
      <select class="report-select" id="r-sku">
        <option value="">Todos os SKUs</option>
        <option>SHORTS-FIGHT</option>
        <option>TOP-FIGHT</option>
        <option>RASHGUARD</option>
        <option>MOLETOM-FIGHT</option>
      </select>
      <div class="spacer"></div>
      <button class="btn-export" onclick="exportCSV()">📊 CSV</button>
      <button class="btn-export pdf" onclick="showProgress()">📄 PDF</button>
    </div>
    <div class="reports-grid">
      ${renderReportSetor()}
      ${renderReportOperador()}
      ${renderReportQualidade()}
      ${renderReportFinanceiro()}
    </div>
  `;
}

// ── Report 1: Produtividade por Setor ─────────────────────
function renderReportSetor() {
    const maxLead = Math.max(...SETOR_BI.map(s => s.leadMedio));
    return `
  <div class="report-card">
    <div class="report-card-header">
      <span class="report-card-icon">📊</span>
      <span class="report-card-title">Produtividade por Setor</span>
      <span class="report-card-sub">Gargalo da fábrica</span>
    </div>
    <div class="report-card-body">
      <div class="hbar-chart">
        ${SETOR_BI.map(s => {
        const diff = (s.leadMedio - s.metaDias).toFixed(1);
        const slaClass = s.leadMedio <= s.metaDias ? 'ok' : s.leadMedio <= s.metaDias * 1.5 ? 'warn' : 'danger';
        const slaLabel = s.leadMedio <= s.metaDias ? `✓ ${diff}d` : `+${diff}d acima`;
        const pct = Math.round((s.leadMedio / maxLead) * 100);
        return `
          <div class="hbar-row">
            <div class="hbar-meta">
              <span class="hbar-icon">${ETAPA_ICONS[s.etapa]}</span>
              <span class="hbar-label">${ETAPA_LABELS[s.etapa]}</span>
              <span class="hbar-val">${s.pecas} pc · ${s.leadMedio}d</span>
              <span class="hbar-sla ${slaClass}">${slaLabel}</span>
            </div>
            <div class="hbar-track">
              <div class="hbar-fill ${s.color}" style="width:${pct}%"></div>
            </div>
          </div>`;
    }).join('')}
      </div>
    </div>
  </div>`;
}

// ── Report 2: Desempenho por Operador ─────────────────────
function renderReportOperador() {
    const sorted = [...OPERADORES].sort((a, b) => b.checkOuts - a.checkOuts);
    const maxOuts = sorted[0].checkOuts;
    const rankClass = i => ['gold', 'silver', 'bronze', '', ''][i] || '';
    return `
  <div class="report-card">
    <div class="report-card-header">
      <span class="report-card-icon">👤</span>
      <span class="report-card-title">Desempenho por Operador</span>
      <span class="report-card-sub">Quem produz mais</span>
    </div>
    <div class="report-card-body">
      <table class="op-table">
        <thead>
          <tr>
            <th>#</th><th>Operador</th><th>Setor</th>
            <th>Check-ins</th><th>Volume</th>
            <th>Taxa Erro</th><th>T.Médio</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((op, i) => {
        const errRate = ((op.erros / op.checkIns) * 100).toFixed(1);
        const errClass = +errRate === 0 ? 'ok' : +errRate < 5 ? 'warn' : 'bad';
        const pct = Math.round((op.checkOuts / maxOuts) * 100);
        return `<tr>
              <td><span class="op-rank ${rankClass(i)}">${i + 1}</span></td>
              <td><strong>${op.nome}</strong></td>
              <td><span style="font-size:10.5px;color:var(--text-3)">${op.setor}</span></td>
              <td>${op.checkIns} / ${op.checkOuts}</td>
              <td>
                <div class="op-mini-bar"><div class="op-mini-fill" style="width:${pct}%"></div></div>
              </td>
              <td><span class="error-rate ${errClass}">${errRate}%</span></td>
              <td>${op.tMedio}d</td>
            </tr>`;
    }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ── Report 3: Qualidade e Pendências ─────────────────────
function renderReportQualidade() {
    const total = PENDENCIA_TIPOS.reduce((s, t) => s + t.qtd, 0);
    const totalDias = RETRABALHO.reduce((s, r) => s + r.diasPerdidos, 0);
    // Build conic-gradient
    let deg = 0;
    const gradParts = PENDENCIA_TIPOS.map(t => {
        const pct = (t.qtd / total) * 360;
        const part = `${t.color} ${deg}deg ${deg + pct}deg`;
        deg += pct;
        return part;
    });
    return `
  <div class="report-card">
    <div class="report-card-header">
      <span class="report-card-icon">⚠️</span>
      <span class="report-card-title">Qualidade e Pendências</span>
      <span class="report-card-sub">Onde estamos errando</span>
    </div>
    <div class="report-card-body">
      <div class="pie-wrap">
        <div class="pie" style="background:conic-gradient(${gradParts.join(',')})"></div>
        <div class="pie-legend">
          ${PENDENCIA_TIPOS.map(t => `
          <div class="pie-legend-item">
            <div class="pie-dot" style="background:${t.color}"></div>
            <span class="pie-legend-label">${t.tipo}</span>
            <span class="pie-legend-pct" style="color:${t.color}">${Math.round(t.qtd / total * 100)}%</span>
          </div>`).join('')}
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="detail-section-title" style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          Fluxo de Retrabalho <span style="flex:1;height:1px;background:var(--border);display:block"></span>
        </div>
        <table class="retrabalho-table">
          <thead><tr><th>Origem</th><th></th><th>Destino</th><th>Ocorr.</th><th>Dias Perdidos</th></tr></thead>
          <tbody>
            ${RETRABALHO.map(r => `
            <tr>
              <td>${r.origem}</td>
              <td class="arrow-icon">→</td>
              <td>${r.destino}</td>
              <td><strong>${r.ocorrencias}</strong></td>
              <td style="color:var(--red);font-weight:700">${r.diasPerdidos}d</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="cost-bar-wrap">
          <div class="cost-bar-label">Total de dias parados em Pendência este mês:</div>
          <div class="cost-total">⏱ ${totalDias.toFixed(1)} dias-produção perdidos</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Report 4: Fluxo Financeiro ────────────────────────────
function renderReportFinanceiro() {
    // Cálculo real baseado nos pedidos carregados (Ticket fixo estimado em 180 para demonstração)
    const activeOrders = PEDIDOS.length;
    const totalVal = PEDIDOS.reduce((s, p) => s + (p.quantidade * 180), 0);
    const ticketMedio = activeOrders > 0 ? Math.round(totalVal / activeOrders) : 0;

    // Status Críticos Reais
    const criticos = PEDIDOS.filter(p => p.prioridade >= 3).length;
    const urgentesVencidos = PEDIDOS.filter(p => p.urgente || p.diasRestantes <= 0).length;

    const maxF = Math.max(...FORECAST.map(f => f.pedidos), 1);

    return `
  <div class="report-card">
    <div class="report-card-header">
      <span class="report-card-icon">💰</span>
      <span class="report-card-title">Fluxo Financeiro e Volume</span>
      <span class="report-card-sub">Visão do dono (Dados Reais)</span>
    </div>
    <div class="report-card-body">
      <div class="fin-grid">
        <div class="fin-card highlight">
          <div class="fin-card-label">Em Produção</div>
          <div class="fin-card-val">R$ ${totalVal.toLocaleString('pt-BR')}</div>
          <div class="fin-card-sub">${activeOrders} pedidos ativos</div>
        </div>
        <div class="fin-card">
          <div class="fin-card-label">Ticket Médio</div>
          <div class="fin-card-val">R$ ${ticketMedio.toLocaleString('pt-BR')}</div>
          <div class="fin-card-sub">por pedido</div>
        </div>
        <div class="fin-card">
          <div class="fin-card-label">Prioridade Alta</div>
          <div class="fin-card-val">${criticos}</div>
          <div class="fin-card-sub">pedidos críticos</div>
        </div>
        <div class="fin-card">
          <div class="fin-card-label">Urgentes / Vencidos</div>
          <div class="fin-card-val" style="color:var(--red)">${urgentesVencidos}</div>
          <div class="fin-card-sub">ação imediata</div>
        </div>
        <div class="fin-card full">
          <div class="fin-card-label">📅 Previsão de Entrega — Próximos 7 dias</div>
          <div class="forecast-list">
            ${FORECAST.map(f => `
            <div class="forecast-item">
              <span class="forecast-date">${f.data.split(' ')[0]}</span>
              <span class="forecast-count">${f.pedidos} ped.</span>
              <div class="forecast-bar-wrap">
                <div class="forecast-bar">
                  <div class="forecast-fill" style="width:${f.pedidos > 0 ? Math.round(f.pedidos / maxF * 100) : 0}%"></div>
                </div>
              </div>
              <span style="font-size:10px;color:var(--text-3)">${f.data.split(' ').slice(1).join(' ')}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Operator Selector Logic ──────────────────────────────
let currentOperador = JSON.parse(localStorage.getItem('hnt_operator')) || null;

function selectOp(nome, btn) {
    const op = OPERADORES.find(o => o.nome === nome);
    if (!op) return;
    currentOperador = op;
    localStorage.setItem('hnt_operator', JSON.stringify(op));
    updateUserCard();
    const wrap = $('op-select-wrap');
    if (wrap) wrap.remove();
    if (window._opCallback) {
        window._opCallback(op);
        window._opCallback = null;
    }
}

function logoutOp() {
    currentOperador = null;
    localStorage.removeItem('hnt_operator');
    updateUserCard();
    alert("Operador desconectado.");
}

function updateUserCard() {
    const card = $('current-user-card');
    const tabSetor = $('tab-meu-setor');
    const navRel = $('nav-relatorios');
    const navAdm = $('nav-admin');

    // Mantemos os ícones visíveis, mas com dica de senha
    if (navRel) {
        navRel.style.display = 'flex';
        navRel.setAttribute('data-tooltip', 'Requer Senha Administrativa');
    }
    if (navAdm) {
        navAdm.style.display = 'flex';
        navAdm.setAttribute('data-tooltip', 'Requer Senha Administrativa');
    }

    if (!currentOperador) {
        card.style.display = 'none';
        if (tabSetor) tabSetor.style.display = 'none';

        // Dica visual no rodapé
        const footerUser = document.querySelector('.sidebar-user');
        if (footerUser) footerUser.setAttribute('data-tooltip', 'Clique para entrar');

        // Se estava na tab meu-setor e deslogou, volta pra todos
        if (currentFilter === 'meu-setor') {
            document.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
            document.querySelector('.tab[data-filter="todos"]').classList.add('active');
            currentFilter = 'todos';
            renderTable(filterData());
        }
        return;
    }
    card.style.display = 'flex';
    $('sidebar-user-avatar').textContent = currentOperador.iniciais;
    $('sidebar-user-name').textContent = currentOperador.nome || 'Operador';
    $('sidebar-user-setor').textContent = (currentOperador.setor || 'Fábrica') + ` (${currentOperador.perfil})`;

    if (tabSetor) {
        tabSetor.style.display = 'inline-flex';
        renderStats(); // Update contagem
    }

    // RBAC: Show/Hide Nav based on Profile
    const perf = currentOperador.perfil;
    // navRel.style.display = (perf === 'Admin' || perf === 'Gerente') ? 'flex' : 'none'; // This is now handled by auth
    // navAdm.style.display = (perf === 'Admin') ? 'flex' : 'none'; // This is now handled by auth

    // Se o operador logar e estiver em um view proibida, redireciona pra lista
    if (perf === 'Operador' && (currentView === 'relatorios' || currentView === 'admin')) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-view="lista"]').classList.add('active');
        currentView = 'lista';
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = $('lista-view');
        if (target) target.classList.add('active');
    }
}

function openOpSelect(callback) {
    const modal = $('qr-modal');
    window._opCallback = callback;
    const existing = document.getElementById('op-select-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'op-select-wrap';
    wrap.innerHTML = `
    <div style="font-size:12.5px;font-weight:700;color:var(--text-1);margin-bottom:4px">Quem está registrando?</div>
    <div style="font-size:11px;color:#888;margin-bottom:10px">Selecione seu nome para vincular ao check-in</div>
    <div class="op-select-grid">
      ${OPERADORES.map(op => `
      <button class="op-select-btn" onclick="selectOp('${op.nome}',this)">
        <div class="op-avatar">${op.iniciais}</div>
        <div>
          <div class="op-name">${op.nome}</div>
          <div class="op-setor">${op.setor} · <span style="font-weight:700; color:var(--amber)">${op.perfil}</span></div>
        </div>
      </button>`).join('')}
    </div>
  `;
    modal.querySelector('.modal').appendChild(wrap);
}

// Chamar no Init
document.addEventListener('DOMContentLoaded', () => {
    updateUserCard();
});

// Override openQR: Se não tiver operador, pede pra selecionar antes
const _origOpenQR = openQRBase;
window.openQR = function () {
    if (!currentOperador) {
        // Mostra o modal de QR só pra ter o fundo, mas abre a seleção
        _origOpenQR();
        openOpSelect();
    } else {
        _origOpenQR();
    }
};

// ── Print Label ───────────────────────────────────────────
function printLabel() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id === selectedId);
    if (!p) return;

    // Abrimos uma nova janela para imprimir
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Etiqueta ${p.numero}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700;800&display=swap');
                body {
                    font-family: 'Inter Tight', sans-serif;
                    margin: 0;
                    padding: 20px;
                    width: 300px; /* Largura típica de impressora térmica */
                    color: #000;
                }
                .label-wrap {
                    border: 2px solid #000;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .logo { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
                .numero { font-size: 24px; font-weight: 800; border-bottom: 2px dashed #000; margin-bottom: 15px; padding-bottom: 15px; }
                .qr { margin: 15px 0; }
                .sku { font-size: 16px; font-weight: 700; margin-bottom: 5px; }
                .desc { font-size: 14px; margin-bottom: 15px; }
                .cliente { font-size: 14px; font-weight: 600; text-transform: uppercase; border-top: 1px solid #000; padding-top: 10px; margin-top: 10px;}
                @media print {
                    body { -webkit-print-color-adjust: exact; margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="label-wrap">
                <div class="logo">HNT PRODUÇÃO</div>
                <div class="numero">${p.numero}</div>
                <div class="sku">${p.sku}</div>
                <div class="desc">${p.quantidade} un. · TM ${p.tamanho} <br> ${p.corCentro || ''} ${p.corLaterais ? '/ ' + p.corLaterais : ''}</div>
                
                <!-- O QR Code real viria de uma lib como qrcode.js, aqui é placeholder SVG -->
                <div class="qr">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" style="background:#000; padding:10px" fill="#fff" viewBox="0 0 24 24">
                        <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4z"/>
                        <path fill-rule="evenodd" d="M2 2h8v8H2V2zm2 2h4v4H4V4zM14 2h8v8h-8V2zm2 2h4v4h-4V4zM2 14h8v8H2v-8zm2 2h4v4H4v-4zM14 14h2v2h-2zm2 0h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-2h2v2h-2z" clip-rule="evenodd"/>
                    </svg>
                </div>

                <div class="cliente">${p.cliente}</div>
                <div style="font-size:10px; margin-top:5px">SLA: ${p.prazo}</div>
            </div>
            <script>
                // Autoprint when loaded
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function printFicha() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id === selectedId);
    if (!p) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
        <html>
        <head>
            <title>Ficha A4 ${p.numero}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap');
                body {
                    font-family: 'Inter Tight', sans-serif;
                    margin: 0;
                    padding: 30px;
                    color: #000;
                    background: #fff;
                }
                .f-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #000;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .f-logo { font-size: 32px; font-weight: 800; }
                .f-num { font-size: 28px; font-weight: 800; }
                .f-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .f-box {
                    border: 2px solid #000;
                    border-radius: 8px;
                    padding: 15px;
                }
                .f-box-title {
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .f-item { font-size: 15px; margin-bottom: 8px; }
                .f-item span { font-weight: 700; }
                .f-stages {
                    margin-top: 30px;
                    border: 2px solid #000;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .f-stage-row {
                    display: flex;
                    border-bottom: 1px solid #ccc;
                }
                .f-stage-row:last-child { border-bottom: none; }
                .f-stage-name {
                    width: 25%;
                    background: #f0f0f0;
                    padding: 12px;
                    font-weight: 700;
                    border-right: 1px solid #ccc;
                }
                .f-stage-sign {
                    flex: 1;
                    padding: 12px;
                    color: #888;
                }
                .f-qr-box {
                    text-align: center;
                }
                .f-qr-box svg {
                    width: 150px;
                    height: 150px;
                    margin-top: 10px;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; margin: 0; padding: 20px;}
                }
            </style>
        </head>
        <body>
            <div class="f-header">
                <div>
                    <div class="f-logo">HNT PRODUÇÃO</div>
                    <div style="font-size:14px; font-weight:600; margin-top:5px;">Ficha de Acompanhamento (A4)</div>
                </div>
                <div style="text-align:right">
                    <div class="f-num">${p.numero}</div>
                    <div style="font-size:16px; font-weight:600;">Prazo: ${p.prazo}</div>
                </div>
            </div>

            <div class="f-grid">
                <div class="f-box">
                    <div class="f-box-title">Detalhes do Pedido</div>
                    <div class="f-item"><span>SKU / Modelo:</span> ${p.sku}</div>
                    <div class="f-item"><span>Qtd:</span> ${p.quantidade} unidades</div>
                    <div class="f-item"><span>Tamanho:</span> ${p.tamanho}</div>
                    <div class="f-item"><span>Técnica:</span> ${p.tecnica}</div>
                    <div class="f-item" style="margin-top:10px"><span>Cores:</span> <br> Centro: ${p.corCentro || '-'} <br> Laterais: ${p.corLaterais || '-'}</div>
                    ${p.observacoes ? `<div class="f-item" style="margin-top:15px; background:#f9f9f9; padding:10px; border:1px dashed #666;"><span>Obs:</span> ${p.observacoes}</div>` : ''}
                </div>
                <div class="f-box f-qr-box">
                    <div class="f-box-title">Identificação Rápida</div>
                    <div style="color:#666; font-size:13px;">Bipe o código abaixo no terminal de produção</div>
                    <!-- Placeholder SVG para o QR -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#000" viewBox="0 0 24 24">
                        <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4z"/>
                        <path fill-rule="evenodd" d="M2 2h8v8H2V2zm2 2h4v4H4V4zM14 2h8v8h-8V2zm2 2h4v4h-4V4zM2 14h8v8H2v-8zm2 2h4v4H4v-4zM14 14h2v2h-2zm2 0h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0-2h2v2h-2z" clip-rule="evenodd"/>
                    </svg>
                    <div style="margin-top:10px; font-weight:700;">Cliente: ${p.cliente}</div>
                </div>
            </div>

            <div class="f-stages">
                <div style="background:#000; color:#fff; padding:10px 15px; font-weight:700; text-transform:uppercase;">
                    Assinatura de Rastreio (Check-in)
                </div>
                ${ETAPAS.map(etapa => `
                    <div class="f-stage-row">
                        <div class="f-stage-name">${ETAPA_LABELS[etapa] || etapa}</div>
                        <div class="f-stage-sign">Op. / Data: _________________________________________</div>
                    </div>
                `).join('')}
            </div>

            <script>
                // Autoprint when loaded
                window.onload = () => {
                    setTimeout(() => window.print(), 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ── CSV Export ────────────────────────────────────────────
function exportCSV() {
    const rows = [
        ['Número', 'SKU', 'Técnica', 'Tamanho', 'Quantidade', 'Etapa', 'SLA', 'Urgente', 'Prazo', 'Cliente', 'CPF'],
        ...PEDIDOS.map(p => [
            p.numero, p.sku, p.tecnica, p.tamanho, p.quantidade,
            ETAPA_LABELS[p.etapa] || p.etapa, p.alerta,
            p.urgente ? 'Sim' : 'Não', p.prazo, p.cliente, p.cpf
        ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hnt-ops-pedidos.csv'; a.click();
    URL.revokeObjectURL(url);
}

// ── Gestão de Prazos (Produção) ───────────────────────────

async function renderAdmin() {
    const view = $('admin-view');
    if (!view) return;

    // Carregar dados frescos
    const logs = await api.loadLoginLogs();
    const ops = await api.getOperadores();
    const scheduleData = await api.loadScheduleConfig();

    // Estado local para a matriz (copiado do banco)
    let milestones = scheduleData.milestones || [];
    let totalPrazo = 15;
    const configPrazo = scheduleData.config.find(c => c.chave === 'prazo_maximo_entrega');
    if (configPrazo) totalPrazo = parseInt(configPrazo.valor);

    // Configuração de tolerância (carregada do config, padrão 1 dia)
    let tolerancia = 1;
    const configTol = scheduleData.config.find(c => c.chave === 'tolerancia_etapa_dias');
    if (configTol) tolerancia = parseInt(configTol.valor);

    // Função interna para renderizar a matriz isoladamente
    function matrixHTML() {
        const columns = 20; // Dias 1 a 20
        let html = `
        <div class="prazos-matrix-container">
            <div style="margin-bottom: 20px; display:flex; align-items:center; gap:15px; flex-wrap:wrap; background:var(--surface-2); padding:15px; border-radius:6px; border:1px solid var(--border)">
                <span style="font-weight:800; color:var(--text-1)">PRAZO MÁXIMO DE ENTREGA:</span>
                <input type="number" id="prazos-total-days" value="${totalPrazo}" min="1" max="60" 
                       style="width:70px; padding:8px; border:2px solid var(--amber); border-radius:4px; font-weight:800; text-align:center">
                <span style="font-weight:600; color:var(--text-3)">dias <strong>\u00fateis</strong></span>
                <span style="flex:1"></span>
                <span style="font-size:11px; font-weight:700; color:var(--text-2)">TOLER\u00c2NCIA \u00b1:</span>
                <input type="number" id="prazos-tolerancia" value="${tolerancia}" min="0" max="5"
                       style="width:55px; padding:8px; border:2px solid var(--orange); border-radius:4px; font-weight:800; text-align:center">
                <span style="font-size:11px; color:var(--text-3)">dias \u00fateis aceit\u00e1vel</span>
                <span style="font-size:11px; color:var(--text-3)">* Clique no dia para definir in\u00edcio</span>
            </div>

            <!-- Legenda de cores -->
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; font-size:11px; font-weight:700;">
                <div style="display:flex; align-items:center; gap:5px;"><span style="width:12px; height:12px; background:var(--green); border-radius:2px; display:block"></span> Per\u00edodo Planejado</div>
                <div style="display:flex; align-items:center; gap:5px;"><span style="width:12px; height:12px; background:var(--amber); border-radius:2px; display:block; opacity:.85"></span> Toler\u00e2ncia (±${tolerancia}d.u.)</div>
                <div style="display:flex; align-items:center; gap:5px;"><span style="width:12px; height:12px; background:var(--red); border-radius:2px; display:block"></span> Fora do Prazo M\u00e1ximo</div>
                <div style="display:flex; align-items:center; gap:5px;"><span style="width:40px; height:4px; background:repeating-linear-gradient(90deg, var(--red) 0, var(--red) 4px, transparent 4px, transparent 8px); display:block"></span> Limite M\u00e1ximo</div>
                <span style="margin-left:auto; color:var(--text-3); font-weight:400;">\u2139\ufe0f Todos os dias s\u00e3o <strong>dias \u00fateis</strong></span>
            </div>
            
            <table class="prazos-matrix-table">
                <thead>
                    <tr>
                        <th style="width:160px; text-align:left; padding-left:15px">ETAPA DE PRODU\u00c7\u00c3O</th>
                        ${Array.from({ length: columns }, (_, i) => `<th title="Dia \u00fatil ${i + 1}">${i + 1}</th>`).join('')}
                        <th style="width:80px" title="Dura\u00e7\u00e3o em dias \u00fateis">DUR. (d.u.)</th>
                    </tr>
                </thead>
                <tbody>
                    ${ETAPAS.filter(e => e !== 'Pendencia').map(etapa => {
            const m = milestones.find(ms => ms.etapa === etapa) || { etapa, dia_inicio: 1, duracao: 1 };
            const color = ETAPA_COLORS[etapa] || 'var(--amber)';

            const startDay = m.dia_inicio || 1;
            const duration = m.duracao || 1;
            const endDay = startDay + duration - 1;
            const tolBefore = Math.max(1, startDay - tolerancia);
            const tolAfter = endDay + tolerancia;

            return `
                        <tr>
                            <td class="prazos-stage-label">
                                ${ETAPA_ICONS[etapa] || ''} ${ETAPA_LABELS[etapa]}
                            </td>
                            ${Array.from({ length: columns }, (_, i) => {
                const day = i + 1;
                const isOver = day > totalPrazo;
                const isPlanned = day >= startDay && day <= endDay;
                const isTolBef = !isPlanned && day >= tolBefore && day < startDay;
                const isTolAft = !isPlanned && day > endDay && day <= tolAfter;
                const isLimit = day === totalPrazo;

                let cls = '';
                let cellStyle = `--stage-color: ${color};`;

                if (isOver && !isLimit) {
                    cls = 'over-limit';
                } else if (isPlanned) {
                    cls = 'active-range';
                    if (day === startDay) cls += ' active-start';
                    if (day === endDay) cls += ' active-end';
                } else if (isTolBef || isTolAft) {
                    cls = 'tol-zone';
                    cellStyle += tolerancia > 0 ? '' : 'opacity:0;';
                }
                if (isLimit) cls += ' limit-line';

                return `<td class="prazos-cell ${cls}" style="${cellStyle}"
                           data-etapa="${etapa}" data-day="${day}"
                           title="${ETAPA_LABELS[etapa]}: Dia ${day}${isPlanned ? ' ✅ Planejado' : isTolBef || isTolAft ? ' 🟡 Tolerância' : ''}">
                        </td>`;
            }).join('')}
                            <td class="prazos-duration-column">
                                <input type="number" class="prazos-duration-input" 
                                       data-etapa="${etapa}" value="${duration}" min="1" max="20">
                            </td>
                        </tr>`;
        }).join('')}
                </tbody>
            </table>
            
            <div style="margin-top:25px; display:flex; justify-content:space-between; align-items:center">
                <div></div>
                <button class="btn-export" id="btn-save-prazos" style="background:var(--green); color:#000; padding:12px 40px; border:none; font-weight:800; border-radius:4px; box-shadow:var(--shadow-md)">
                    💾 SALVAR GESTÃO DE PRAZOS
                </button>
            </div>
        </div>`;
        return html;
    }

    // UI Principal
    view.innerHTML = `
    <div class="report-toolbar">
      <span class="report-label" style="font-size:16px; font-weight:700; color:var(--text-1)">Painel de Administração</span>
      <span style="font-size:10px; color:var(--text-3); margin-left:10px" data-tooltip="Auditoria e Controle de Acessos.">Segurança do Sistema 🛡️</span>
    </div>
    
    <div class="reports-grid" style="margin-top:10px">
      <!-- Gestão de Prazos (Matrix INTERATIVA Pro Max) -->
      <div class="report-card" style="grid-column: span 3;">
        <div class="report-card-header">
          <span class="report-card-icon" style="font-size:16px">🗓</span>
          <span class="report-card-title">Gestão de Prazos de Produção</span>
          <span class="report-card-sub" style="font-size:10px">Planejamento sequencial de dias úteis por setor</span>
        </div>
        <div class="report-card-body" id="prazos-matrix-view">
            ${matrixHTML()}
        </div>
      </div>

      <!-- Auditoria: Histórico de Acessos -->
      <div class="report-card" style="grid-column: span 2;">
        <div class="report-card-header">
          <span class="report-card-icon" style="font-size:16px">📜</span>
          <span class="report-card-title">Histórico de Acessos</span>
          <span class="report-card-sub" style="font-size:10px">Logs de Auditoria (Últimos 50)</span>
        </div>
        <div class="report-card-body" style="padding: 15px;">
            <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px; background:var(--surface);">
                <table class="op-table" style="width:100%; border-collapse: collapse;">
                    <thead style="position: sticky; top: 0; background: var(--surface-2); font-size: 11px;">
                        <tr>
                            <th style="padding: 8px; text-align: left;">Usuário</th>
                            <th style="padding: 8px; text-align: left;">Data/Hora</th>
                            <th style="padding: 8px; text-align: left;">Equipamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs ? logs.map(l => `
                            <tr style="border-bottom: 1px solid var(--border); font-size: 12px;">
                                <td style="padding: 8px; font-weight: 700;">${l.nome_operador || 'Desconhecido'}</td>
                                <td style="padding: 8px; color: var(--text-3); font-size:11px">${new Date(l.data_login).toLocaleString('pt-BR')}</td>
                                <td style="padding: 8px;">
                                    <div style="font-size: 10px; color: var(--amber); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.equipamento}">
                                        ${l.equipamento}
                                    </div>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" style="padding:15px; text-align:center">Nenhum log encontrado.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
      <!-- Equipe & Gestão de Usuários -->
      <div class="report-card">
        <div class="report-card-header">
          <span class="report-card-icon" style="font-size:16px">👥</span>
          <span class="report-card-title">Equipe & Acessos</span>
          <span class="report-card-sub" style="font-size:10px">Gerenciar Operadores</span>
        </div>
        <div class="report-card-body" style="padding: 15px;">
             <div style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px; padding: 5px; background:var(--surface);">
                ${ops ? ops.map(o => `
                 <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px; border-bottom: 1px solid var(--border);">
                    <div style="display:flex; align-items:center; gap:8px">
                      <div class="op-avatar" style="width:24px;height:24px;font-size:10px">${o.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>
                      <div>
                          <div style="font-weight:700; font-size:13px">${o.nome}</div>
                          <div style="color:var(--text-3); font-size:11px">${o.perfil} · ${o.setor || 'Geral'}</div>
                      </div>
                    </div>
                    <div style="display:flex; gap:5px">
                        <button class="btn-edit-op" data-id="${o.id}" style="padding:5px; font-size:14px; color:var(--amber); cursor:pointer; background:none; border:none; transition:transform 0.2s" title="Editar Usuário">✎</button>
                        <button class="btn-delete-op" data-id="${o.id}" data-nome="${o.nome}" style="padding:5px; font-size:14px; color:var(--red); cursor:pointer; background:none; border:none; transition:transform 0.2s" title="Excluir Usuário">🗑</button>
                    </div>
                 </div>
                `).join('') : ''}
                ${!ops || ops.length === 0 ? '<div style="padding:20px; text-align:center; color:var(--text-3); font-size:12px">Nenhum operador ativo.</div>' : ''}
             </div>
             <button class="btn-export" id="btn-new-op" style="width:100%; margin-top:15px; background:var(--green); color:#000; font-weight:800; border:none">＋ NOVO OPERADOR</button>
        </div>
      </div>

      <!-- Gestão do Fluxo (Kanban) -->
      <div class="report-card" style="grid-column: span 3;">
        <div class="report-card-header">
          <span class="report-card-icon" style="font-size:16px">🗂</span>
          <span class="report-card-title">Categorias & Etapas do Kanban</span>
          <span class="report-card-sub" style="font-size:10px">Definir colunas, cores e ordem de visualização</span>
        </div>
        <div class="report-card-body" style="padding: 15px;">
             <table class="op-table" style="width:100%; border-collapse: collapse;">
                <thead style="background: var(--surface-2); font-size: 11px;">
                    <tr>
                        <th style="padding: 8px; text-align: left;">Pos</th>
                        <th style="padding: 8px; text-align: left;">Ícone</th>
                        <th style="padding: 8px; text-align: left;">Slug / ID</th>
                        <th style="padding: 8px; text-align: left;">Label</th>
                        <th style="padding: 8px; text-align: left;">Cor</th>
                        <th style="padding: 8px; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${scheduleData.milestones.map((m, i) => `
                        <tr style="border-bottom: 1px solid var(--border); font-size: 12px;">
                            <td style="padding: 8px; font-weight: 700;">${m.posicao}</td>
                            <td style="padding: 8px; font-size:16px">${m.icone || '📋'}</td>
                            <td style="padding: 8px; color:var(--text-3)">${m.etapa}</td>
                            <td style="padding: 8px; font-weight: 700;">${m.label}</td>
                            <td style="padding: 8px;">
                                <div style="display:flex; align-items:center; gap:5px">
                                    <span style="width:12px; height:12px; border-radius:2px; background:${m.cor}"></span>
                                    ${m.cor}
                                </div>
                            </td>
                            <td style="padding: 8px; text-align:center">
                                <button class="btn-edit-etapa" data-slug="${m.etapa}" style="padding:5px; color:var(--amber); cursor:pointer">✎</button>
                                <button class="btn-up-etapa" data-slug="${m.etapa}" style="padding:5px; cursor:pointer" title="Subir">▲</button>
                                <button class="btn-down-etapa" data-slug="${m.etapa}" style="padding:5px; cursor:pointer" title="Descer">▼</button>
                                <button class="btn-delete-etapa" data-slug="${m.etapa}" style="padding:5px; color:var(--red); cursor:pointer">🗑</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
             </table>
             <button class="btn-export" id="btn-new-etapa" style="width:100%; margin-top:15px; background:var(--amber); color:#000; font-weight:800; border:none">＋ NOVA ETAPA / CATEGORIA</button>
        </div>
      </div>
    </div>

    <!-- Modal de Gestão de Etapa -->
    <div id="etapa-modal" class="modal-overlay" style="display:none; align-items:center; justify-content:center; z-index:2010">
        <div class="report-card" style="width:400px; box-shadow:var(--shadow-lg); animation: slideUp 0.3s ease-out">
            <div class="report-card-header" style="justify-content:space-between">
                <span id="etapa-modal-title" style="font-weight:800; color:var(--amber)">NOVA ETAPA</span>
                <button onclick="(() => { const m = document.getElementById('etapa-modal'); m.classList.remove('open'); setTimeout(() => m.style.display='none', 300); })()" style="background:none; border:none; color:var(--text-3); cursor:pointer; font-size:20px">×</button>
            </div>
            <div class="report-card-body" style="padding:20px">
                <form id="etapa-form" onsubmit="event.preventDefault()">
                    <div style="margin-bottom:15px">
                        <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">ID SLUG (Ex: Costura)</label>
                        <input type="text" id="etapa-slug" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                    </div>
                    <div style="margin-bottom:15px">
                        <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">LABEL EXIBIÇÃO</label>
                        <input type="text" id="etapa-label" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                    </div>
                    <div style="display:flex; gap:10px; margin-bottom:20px">
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">COR (HEX)</label>
                            <input type="color" id="etapa-cor" style="width:100%; height:40px; border:none; background:none; cursor:pointer">
                        </div>
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">ÍCONE (EMOJI)</label>
                            <input type="text" id="etapa-icone" placeholder="📋" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                        </div>
                    </div>
                    <button type="submit" id="btn-save-etapa" style="width:100%; padding:12px; background:var(--amber); color:#000; border:none; border-radius:4px; font-weight:800; cursor:pointer">
                        GRAVAR ETAPA
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal de Gestão de Operador (Balão) -->
    <div id="op-modal" class="modal-overlay" style="display:none; align-items:center; justify-content:center; z-index:2000">
        <div class="report-card" style="width:400px; box-shadow:var(--shadow-lg); animation: slideUp 0.3s ease-out">
            <div class="report-card-header" style="justify-content:space-between">
                <span id="op-modal-title" style="font-weight:800; color:var(--amber)">NOVO OPERADOR</span>
                <button onclick="(() => { const m = document.getElementById('op-modal'); m.classList.remove('open'); setTimeout(() => m.style.display='none', 300); })()" style="background:none; border:none; color:var(--text-3); cursor:pointer; font-size:20px">×</button>
            </div>
            <div class="report-card-body" style="padding:20px">
                <form id="op-form" onsubmit="event.preventDefault()">
                    <input type="hidden" id="op-id">
                    <div style="margin-bottom:15px">
                        <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">NOME COMPLETO</label>
                        <input type="text" id="op-nome" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                    </div>
                    <div style="display:flex; gap:10px; margin-bottom:15px">
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">USUÁRIO (LOGIN)</label>
                            <input type="text" id="op-usuario" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                        </div>
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">SENHA</label>
                            <input type="password" id="op-senha" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1)">
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; margin-bottom:20px">
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">PERFIL</label>
                            <select id="op-perfil" required style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1); cursor:pointer">
                                <option value="Operador">Operador</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div style="flex:1">
                            <label style="display:block; font-size:11px; font-weight:700; color:var(--text-3); margin-bottom:5px">SETOR</label>
                            <select id="op-setor" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:4px; background:var(--surface-2); color:var(--text-1); cursor:pointer">
                                <option value="Fábrica">Geral / Fábrica</option>
                                ${Object.keys(ETAPA_LABELS).map(k => `<option value="${k}">${ETAPA_LABELS[k]}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <button type="submit" id="btn-save-op" style="width:100%; padding:12px; background:var(--amber); color:#000; border:none; border-radius:4px; font-weight:800; cursor:pointer">
                        GRAVAR ACESSO
                    </button>
                </form>
            </div>
        </div>
    </div>
    `;

    // ── Bind Interactive Events ──
    function bindPrazosEvents() {
        const container = $('prazos-matrix-view');

        // 1. Matrix Clicks (Dia de Início)
        container.querySelectorAll('.prazos-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const etapa = cell.dataset.etapa;
                const day = parseInt(cell.dataset.day);

                let m = milestones.find(ms => ms.etapa === etapa);
                if (m) {
                    m.dia_inicio = day;
                } else {
                    milestones.push({ etapa, dia_inicio: day, duracao: 1 });
                }

                container.innerHTML = matrixHTML();
                bindPrazosEvents();
            });
        });

        // 2. Duration Inputs
        container.querySelectorAll('.prazos-duration-input').forEach(input => {
            input.addEventListener('change', () => {
                const etapa = input.dataset.etapa;
                const val = parseInt(input.value) || 1;

                let m = milestones.find(ms => ms.etapa === etapa);
                if (m) {
                    m.duracao = val;
                } else {
                    milestones.push({ etapa, dia_inicio: 1, duracao: val });
                }

                container.innerHTML = matrixHTML();
                bindPrazosEvents();
            });
        });

        // 3. Input total days
        const totalInput = $('prazos-total-days');
        if (totalInput) {
            totalInput.addEventListener('change', () => {
                totalPrazo = parseInt(totalInput.value);
                container.innerHTML = matrixHTML();
                bindPrazosEvents();
            });
        }

        // 3b. Input de tolerância
        const tolInput = $('prazos-tolerancia');
        if (tolInput) {
            tolInput.addEventListener('change', () => {
                tolerancia = Math.max(0, parseInt(tolInput.value) || 0);
                container.innerHTML = matrixHTML();
                bindPrazosEvents();
            });
        }

        // 4. Botão Salvar
        const saveBtn = $('btn-save-prazos');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                saveBtn.innerHTML = '⌛ Gravando...';
                saveBtn.disabled = true;
                await api.saveScheduleConfig(milestones, totalPrazo);
                // Persiste a tolerância como config extra
                try {
                    await apiFetch('admin_config?chave=eq.tolerancia_etapa_dias', 'PATCH', { valor: String(tolerancia) });
                } catch (e) {
                    // Pode não existir ainda — ignora silenciosamente
                }
                saveBtn.innerHTML = '✅ GESTÃO SALVA!';
                setTimeout(() => {
                    saveBtn.innerHTML = '💾 SALVAR GESTÃO DE PRAZOS';
                    saveBtn.disabled = false;
                }, 2000);
            });
        }
    }

    bindPrazosEvents();

    // ── Bind Operator Events ──
    const modalOp = $('op-modal');
    const formOp = $('op-form');

    $('btn-new-op').onclick = () => {
        formOp.reset();
        $('op-id').value = '';
        $('op-modal-title').textContent = 'NOVO OPERADOR';
        modalOp.style.display = 'flex';
        setTimeout(() => modalOp.classList.add('open'), 10);
    };

    view.querySelectorAll('.btn-edit-op').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const o = ops.find(x => x.id === id);
            if (o) {
                $('op-id').value = o.id;
                $('op-nome').value = o.nome;
                $('op-usuario').value = o.usuario;
                $('op-senha').value = o.senha;
                $('op-perfil').value = o.perfil;
                $('op-setor').value = o.setor || 'Fábrica';
                $('op-modal-title').textContent = 'EDITAR OPERADOR';
                modalOp.style.display = 'flex';
                setTimeout(() => modalOp.classList.add('open'), 10);
            }
        };
    });

    view.querySelectorAll('.btn-delete-op').forEach(btn => {
        btn.onclick = async () => {
            if (confirm(`Deseja realmente excluir (desativar) o acesso de ${btn.dataset.nome}?`)) {
                await api.deleteOperador(btn.dataset.id);
                renderAdmin(); // Recarrega tela
            }
        };
    });

    formOp.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = $('btn-save-op');
        saveBtn.disabled = true;
        saveBtn.textContent = '⌛ Gravando...';

        const opData = {
            id: $('op-id').value || undefined,
            nome: $('op-nome').value,
            usuario: $('op-usuario').value,
            senha: $('op-senha').value,
            perfil: $('op-perfil').value,
            setor: $('op-setor').value
        };

        try {
            await api.upsertOperador(opData);
            modalOp.classList.remove('open');
            setTimeout(() => {
                modalOp.style.display = 'none';
                renderAdmin(); // Recarrega tudo
            }, 300);
        } catch (err) {
            alert("Erro ao gravar operador: " + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'GRAVAR ACESSO';
        }
    };

    // ── Bind Etapa Events ──
    const modalEtapa = $('etapa-modal');
    const formEtapa = $('etapa-form');

    $('btn-new-etapa').onclick = () => {
        formEtapa.reset();
        $('etapa-slug').value = '';
        $('etapa-slug').disabled = false;
        $('etapa-modal-title').textContent = 'NOVA ETAPA';
        modalEtapa.style.display = 'flex';
        setTimeout(() => modalEtapa.classList.add('open'), 10);
    };

    view.querySelectorAll('.btn-edit-etapa').forEach(btn => {
        btn.onclick = () => {
            const slug = btn.dataset.slug;
            const m = milestones.find(x => x.etapa === slug);
            if (m) {
                $('etapa-slug').value = m.etapa;
                $('etapa-slug').disabled = true;
                $('etapa-label').value = m.label;
                $('etapa-cor').value = m.cor;
                $('etapa-icone').value = m.icone || '';
                $('etapa-modal-title').textContent = 'EDITAR ETAPA';
                modalEtapa.style.display = 'flex';
                setTimeout(() => modalEtapa.classList.add('open'), 10);
            }
        };
    });

    view.querySelectorAll('.btn-up-etapa').forEach(btn => {
        btn.onclick = async () => {
            const slug = btn.dataset.slug;
            const idx = milestones.findIndex(x => x.etapa === slug);
            if (idx > 0) {
                const tempPos = milestones[idx].posicao;
                milestones[idx].posicao = milestones[idx - 1].posicao;
                milestones[idx - 1].posicao = tempPos;
                await api.saveScheduleConfig(milestones, totalPrazo);
                renderAdmin();
            }
        };
    });

    view.querySelectorAll('.btn-down-etapa').forEach(btn => {
        btn.onclick = async () => {
            const slug = btn.dataset.slug;
            const idx = milestones.findIndex(x => x.etapa === slug);
            if (idx < milestones.length - 1) {
                const tempPos = milestones[idx].posicao;
                milestones[idx].posicao = milestones[idx + 1].posicao;
                milestones[idx + 1].posicao = tempPos;
                await api.saveScheduleConfig(milestones, totalPrazo);
                renderAdmin();
            }
        };
    });

    view.querySelectorAll('.btn-delete-etapa').forEach(btn => {
        btn.onclick = async () => {
            if (confirm(`Excluir etapa "${btn.dataset.slug}"? Isso removerá a coluna do Kanban.`)) {
                await api.deleteEtapa(btn.dataset.slug);
                renderAdmin();
            }
        };
    });

    formEtapa.onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = $('btn-save-etapa');
        saveBtn.disabled = true;
        saveBtn.textContent = '⌛ Gravando...';

        const data = {
            etapa: $('etapa-slug').value,
            label: $('etapa-label').value,
            cor: $('etapa-cor').value,
            icone: $('etapa-icone').value,
            posicao: milestones.length + 1
        };

        const existing = milestones.find(m => m.etapa === data.etapa);
        if (existing) data.posicao = existing.posicao;

        try {
            await api.upsertEtapa(data);
            modalEtapa.classList.remove('open');
            setTimeout(() => {
                modalEtapa.style.display = 'none';
                renderAdmin();
            }, 300);
        } catch (err) {
            alert("Erro ao gravar etapa: " + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'GRAVAR ETAPA';
        }
    };
}

// ── Stage Detail View ─────────────────────────────────────
function showStageDetail(etapa) {
    const modal = $('stage-detail-modal');
    const title = $('stage-detail-title');
    const body = $('stage-detail-body');
    if (!modal || !body) return;

    const label = ETAPA_LABELS[etapa] || etapa;
    const items = PEDIDOS.filter(p => p.etapa === etapa);

    title.textContent = `Lista de Pedidos - ${label.toUpperCase()} (${items.length})`;
    modal.style.display = 'flex';
    modal.classList.add('open');

    if (items.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="padding:40px; text-align:center; color:var(--text-3)">Nenhum pedido nesta etapa.</td></tr>';
        return;
    }

    body.innerHTML = items.map(p => `
        <tr style="border-bottom: 1px solid var(--border); font-size:13px">
            <td style="padding:12px; font-weight:700">
                <div style="color:var(--amber)">${p.numero}</div>
                <div style="font-size:10px; color:var(--text-3)">${new Date(p.criadoEm).toLocaleDateString()}</div>
            </td>
            <td style="padding:12px">
                <div style="font-weight:600">${p.cliente}</div>
                <div style="font-size:11px; color:var(--text-3)">${p.canal || '-'}</div>
            </td>
            <td style="padding:12px">
                <div>${p.sku}</div>
                <div style="font-size:11px; color:var(--text-3)">${p.tamanho}</div>
            </td>
            <td style="padding:12px; text-align:center; font-weight:700">${p.quantidade}</td>
            <td style="padding:12px; text-align:center">
                <span class="alerta-tag alerta-${p.alerta}" style="font-size:10px">
                    ${alertaIcon(p.alerta)} ${p.alerta}
                </span>
            </td>
            <td style="padding:12px; text-align:center">
                <button class="btn-ghost" onclick="closeStageDetailAndOpenDrawer('${p.id}')" title="Ver Detalhes">
                    👁️
                </button>
            </td>
        </tr>
    `).join('');
}

function closeStageDetailAndOpenDrawer(id) {
    const modal = $('stage-detail-modal');
    modal.style.display = 'none';
    modal.classList.remove('open');
    openDrawer(id);
}

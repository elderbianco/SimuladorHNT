/* ============================================================
   HNT-OPS — App Logic v4.03 (Final Production Release)
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
let drawerTab = 'detalhes'; // 'detalhes', 'itens', 'cliente', 'historico', 'chat'
let isEditing = false;
let currentOperador = JSON.parse(localStorage.getItem('hnt_operator')) || null;

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
            // Mapear cada linha do banco para um produto individual
            const linhasMapeadas = realData.map(r => {
                let dt = r.dados_tecnicos_full || r.dados_tecnicos;
                if (typeof dt === 'string') { try { dt = JSON.parse(dt); } catch (e) { } }
                dt = dt || {};
                return {
                    id: r.id,
                    numero: r.numero_pedido || 'SN',
                    sku: r.sku || 'N/A',
                    tipoProduto: r.tipo_produto || r.sku || 'N/A',
                    tecnica: r.tecnica || 'Indefinida',
                    tamanho: r.tamanho || 'U',
                    quantidade: r.quantidade || 1,
                    etapa: r.etapa_atual,
                    prioridade: r.prioridade || 3,
                    urgente: r.urgente || false,
                    alerta: r.alerta_cor || r.alerta_prazo || 'Verde',
                    diasRestantes: r.dias_restantes_etapa,
                    diasSlaEtapa: r.dias_restantes_etapa,
                    diasSlaTotal: r.dias_restantes_total,
                    paradoHa: r.dias_na_etapa_atual || 0,
                    prazo: typeof r.prazo_entrega === 'string' ? r.prazo_entrega.split('-').reverse().join('/') : (r.prazo_entrega || '--'),
                    dataCriacao: r.criado_em ? new Date(r.criado_em).toLocaleDateString('pt-BR') : '--',
                    cliente: r.cliente_nome || 'Sem Cliente',
                    cpf: r.cliente_cpf || '--',
                    celular: r.cliente_celular || '--',
                    email: r.cliente_email || '--',
                    pdf: r.link_pdf || null,
                    emb: r.link_arquivo_bordado || null,
                    observacoes: r.observacoes || '',
                    valor: r.valor_pedido || null,
                    // Dados técnicos completos (partes, textos, extras, uploads, grade)
                    dadosTecnicos: dt,
                    renders: r.link_renders || {},
                };
            });

            // Agrupar por numero_pedido: 1 pedido = N produtos (linhas do banco)
            const grupos = {};
            linhasMapeadas.forEach(linha => {
                // Se o número contém -SL-, pegamos a parte antes dele como a raiz
                const num = linha.numero.includes('-SL-')
                    ? linha.numero.split('-SL-')[0]
                    : linha.numero;

                if (!grupos[num]) {
                    grupos[num] = {
                        ...linha,
                        numero: num, // Define o número raiz para o grupo
                        produtos: []
                    };
                }
                grupos[num].produtos.push(linha);

                // Acumular quantidade total
                grupos[num].quantidade = grupos[num].produtos.reduce((acc, p) => acc + (p.quantidade || 1), 0);
            });

            PEDIDOS = Object.values(grupos);
        }

    }

    renderStats();
    renderTable(PEDIDOS);
    renderKanban(PEDIDOS);
    renderArteDev(); // Phase 3
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
        const produtos = p.produtos || [p];
        const numProdutos = produtos.length;
        const isMulti = numProdutos > 1;

        // --- LINHA PAI (PEDIDO) ---
        const parentTr = document.createElement('div');
        parentTr.className = `table-row parent ${isMulti ? 'has-children' : ''}`;
        parentTr.dataset.id = p.id;

        const skuSummary = isMulti
            ? `<span class="sku-badge multi-sku">${numProdutos} Produtos</span>`
            : `<span class="sku-badge">${p.sku}</span>`;

        parentTr.innerHTML = `
            <div class="cell-order">
                <div style="display:flex; align-items:center;">
                    ${isMulti ? `<div class="toggle-tree" onclick="event.stopPropagation(); toggleTree(this, '${p.numero}')">▶</div>` : ''}
                    <span class="order-num">${p.numero}</span>
                </div>
            </div>
            <div class="cell-sku">${skuSummary}</div>
            <div class="cell-date">${p.dataCriacao}</div>
            <div class="cell-qty">${p.quantidade}×</div>
            <div class="cell-client">
                <span class="client-name">${p.cliente}</span>
            </div>
            <div class="cell-etapa">
                <span class="etapa-badge" style="background:${ETAPA_COLORS[p.etapa]}22; color:${ETAPA_COLORS[p.etapa]}; border: 1px solid ${ETAPA_COLORS[p.etapa]}">
                    <span class="etapa-icon">${ETAPA_ICONS[p.etapa] || '📋'}</span>${ETAPA_LABELS[p.etapa] || p.etapa}
                </span>
            </div>
            <div class="cell-sla">${slaPhaseInfo(p).label}</div>
            <div class="cell-prioridade">${p.urgente ? '🔴 URG' : ''}</div>
            <div class="cell-prazo">${p.prazo}</div>
        `;
        parentTr.onclick = () => openDrawer(p.id);
        tbody.appendChild(parentTr);

        // --- LINHAS FILHAS (PRODUTOS) ---
        if (isMulti) {
            const childrenGroup = document.createElement('div');
            childrenGroup.className = 'child-group';
            childrenGroup.id = `children-${p.numero}`;
            childrenGroup.style.display = 'none'; // Inicia fechado

            produtos.forEach(prod => {
                const childTr = document.createElement('div');
                childTr.className = 'table-row child';
                const simId = prod.dadosTecnicos?.simulationId || 'N/A';

                childTr.innerHTML = `
                    <div class="cell-order">
                        <span class="tree-line"></span>
                        <span style="font-size:10px; color:var(--text-3)">${prod.numero}</span>
                    </div>
                    <div class="cell-sku">
                        <span class="sku-badge" style="background:#f0f0f0; border-color:#ccc; color:#666">${prod.sku}</span>
                        <span class="simulation-id" title="Simulation ID">${simId}</span>
                    </div>
                    <div class="cell-date">--</div>
                    <div class="cell-qty">${prod.quantidade}× <span style="font-size:10px">${prod.tamanho}</span></div>
                    <div class="cell-client">--</div>
                    <div class="cell-etapa">
                        <span style="font-size:10px; color:var(--text-3)">${prod.tecnica}</span>
                    </div>
                    <div class="cell-sla">--</div>
                    <div class="cell-prioridade">--</div>
                    <div class="cell-prazo">--</div>
                `;
                childTr.onclick = (e) => {
                    e.stopPropagation();
                    openDrawer(p.id); // Abre o pedido principal
                };
                childrenGroup.appendChild(childTr);
            });
            tbody.appendChild(childrenGroup);
        }
    });
}

function toggleTree(btn, num) {
    const group = $(`children-${num}`);
    if (group) {
        const isOpen = group.style.display !== 'none';
        group.style.display = isOpen ? 'none' : 'block';
        btn.classList.toggle('open', !isOpen);
        btn.textContent = isOpen ? '▶' : '▼';
    }
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
            const numProds = p.produtos ? p.produtos.length : 1;
            const skuLabel = numProds > 1 ? `<span style="color:var(--amber);font-weight:700">📦 ${numProds} Itens</span>` : p.sku;
            return `
          <div class="kanban-card ${p.alerta}${isPendencia ? ' pendencia-card' : ''}" data-id="${p.id}" onclick="openDrawer('${p.id}')" draggable="true">
            <div class="kanban-num">${p.numero}</div>
            <div class="kanban-sku">${skuLabel} · ${p.tamanho} · ${p.quantidade}×</div>
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
                // Validação antes de mover
                if (validarAvanco(id, novaEtapa)) {
                    moverEtapa(id, novaEtapa);
                }
            }
        });
    });
}

function validarAvanco(id, novaEtapa) {
    const p = PEDIDOS.find(x => x.id === id);
    if (!p) return false;

    // Se estiver pendente, não pode mover para lugar nenhum via drag & drop (exceto se for para Pendência de novo, o que é redundante)
    if (p.etapa === 'Pendencia' && novaEtapa !== 'Pendencia') {
        alert(`Pedido #${p.numero} está BLOQUEADO por pendência. Resolva no Drawer antes de mover.`);
        return false;
    }

    // Regras de negócio por etapa (Campos Obrigatórios)
    if (p.etapa === 'Preparacao' && novaEtapa === 'Separacao') {
        if (!p.pdfUrl && !p.pdf) {
            alert("Erro: O pedido precisa de um PDF de referência para ir para Separação.");
            return false;
        }
    }

    if (p.etapa === 'Arte' && novaEtapa === 'Bordado') {
        if (!p.emb && !p.link_arquivo_bordado) {
            alert("Erro: É obrigatório anexar o arquivo .EMB (Bordado) antes de avançar.");
            return false;
        }
    }

    // Se retornar para uma etapa anterior, permite sem restrição
    const indexAtual = ETAPAS.indexOf(p.etapa);
    const indexNova = ETAPAS.indexOf(novaEtapa);
    if (indexNova < indexAtual && novaEtapa !== 'Pendencia') return true;

    return true;
}

// ── Drawer ────────────────────────────────────────────────
function openDrawer(id) {
    selectedId = id;
    const p = PEDIDOS.find(x => x.id.toString() == id.toString());
    if (!p) return;
    const produtos = p.produtos || [p];

    // Inteligência: Abrir na aba da Etapa atual (Phase 3)
    const mapEtapaTab = {
        'Preparação': 'preparacao',
        'Separação': 'separacao',
        'Arte': 'arte',
        'Bordado': 'bordado',
        'Costura': 'costura',
        'Qualidade': 'qualidade',
        'Expedição': 'expedicao',
        'Pendencia': 'pendencia'
    };
    drawerTab = mapEtapaTab[p.etapa] || 'preparacao';

    renderDrawer(p);
    $('drawer-overlay').classList.add('open');
    $('drawer').classList.add('open');
    isEditing = false;
}

function closeDrawer() {
    $('drawer-overlay').classList.remove('open');
    $('drawer').classList.remove('open');
    selectedId = null;
}

function renderDrawer(p) {
    const produtos = p.produtos || [p];
    const numProdutos = produtos.length;

    $('drawer-num').textContent = p.numero;
    $('drawer-sku').textContent = numProdutos > 1
        ? `${numProdutos} Produtos no Pedido · ${p.quantidade} un. total`
        : `${p.sku} · ${p.tecnica} · ${p.tamanho} · ${p.quantidade} un.`;

    // Mostrar/ocultar aba Itens dependendo de multi-produto
    document.querySelectorAll('.drawer-tab').forEach(t => {
        if (t.dataset.tab === 'itens') {
            t.style.display = numProdutos > 1 ? 'block' : 'none';
        }
        t.classList.toggle('active', t.dataset.tab === drawerTab);
    });
}

function switchDrawerTab(tabId) {
    if (!selectedId) return;
    drawerTab = tabId;
    const p = PEDIDOS.find(x => x.id.toString() == selectedId.toString());
    if (p) renderDrawer(p);

    // Stage move buttons
    const sb = $('stage-buttons');
    sb.innerHTML = ETAPAS.filter(e => e !== 'Pendencia' && e !== 'Cancelado').map(e => `
    <button class="stage-btn ${e === p.etapa ? 'current' : ''}" onclick="moverEtapa('${p.id}','${e}')">
      <span>${ETAPA_ICONS[e] || '📋'}</span> ${ETAPA_LABELS[e] || e}
    </button>
  `).join('') + `
    <button class="stage-btn pendencia-btn ${p.etapa === 'Pendencia' ? 'current' : ''}" onclick="moverEtapa('${p.id}','Pendencia')">
      <span>⚠️</span> Pendência
    </button>
  `;

    // drawer-admin-actions logic moved to renderDrawerFooter
    renderDrawerTab(p);
    renderDrawerFooter(p);
}

function renderDrawerFooter(p) {
    const footer = $('drawer-footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="drawer-admin-actions">
            <button class="btn btn-ghost" onclick="toggleEdicao()" style="width:100%">${isEditing ? '❌ Cancelar' : '📝 Editar'}</button>
            <button class="btn btn-ghost" style="color:var(--orange); width:100%" onclick="cancelarPedidoUI()">🚫 Cancelar</button>
            <button class="btn btn-ghost" style="color:var(--red); width:100%; grid-column: span 2;" onclick="excluirPedidoUI()">🗑️ Excluir Permanente</button>
        </div>
    `;
}

function renderDrawerTab(p) {
    const body = $('drawer-body');
    let contentHtml = '';
    const produtos = p.produtos || [p];
    const numProdutos = produtos.length;

    // Status do Prazo SEMAÁFORO
    let pd = new Date();
    let prazo = new Date();
    if (p.data_entrada) pd = new Date(p.data_entrada);
    if (p.data_entrega) prazo = new Date(p.data_entrega);

    const hj = new Date();
    const isLate = hj > prazo;
    const isWarning = (prazo - hj) < (3 * 24 * 60 * 60 * 1000) && !isLate;
    const semaforoCor = isLate ? 'var(--red)' : (isWarning ? 'var(--amber)' : 'var(--green)');
    const semaforoLabel = isLate ? 'ATRASADO' : (isWarning ? 'ATENÇÃO (VENCE EM BREVE)' : 'NO PRAZO');

    if (drawerTab === 'preparacao') {
        const iconAtual = ETAPA_ICONS[p.etapa] || '📋';

        let pendenciasHtml = '';
        if (p.etapa === 'Pendencia') {
            pendenciasHtml = `
             <div style="background:var(--red-dim); border-left:4px solid var(--red); padding:15px; border-radius:4px; margin-bottom:15px;">
               <h4 style="color:var(--red); font-weight:800; margin:0 0 10px 0;">⚠️ PEDIDO COM PENDÊNCIA</h4>
               <p style="margin:0; font-size:14px; color:var(--text-1);">Este pedido está travado e aguarda resolução. Entre em contato com o cliente.</p>
             </div>
           `;
        }

        contentHtml = `
            ${pendenciasHtml}
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>📋 PREPARAÇÃO (Dashboard Administrativo)</span>
                    <span style="background:${semaforoCor}; color:#000; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:800;">${semaforoLabel}</span>
                </div>
                
                <div class="detail-grid" style="margin-top:15px; border:1px solid var(--border); border-radius:8px; padding:15px; background:var(--surface-2);">
                    <div class="detail-item full" style="border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;">
                        <div style="font-size:11px; color:var(--text-3); text-transform:uppercase; font-weight:700;">Número do Pedido</div>
                        <div style="font-size:24px; font-weight:900; color:var(--text-1);">${p.numero || 'N/A'}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div style="font-size:11px; color:var(--text-3); font-weight:700;">SKU (Produto)</div>
                        <div style="font-size:15px; font-weight:700;">${p.sku || 'N/A'}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div style="font-size:11px; color:var(--text-3); font-weight:700;">Quantitativo Itens</div>
                        <div style="font-size:15px; font-weight:700;">${numProdutos > 1 ? p.quantidade + ' itens totais' : p.quantidade + ' unidades'}</div>
                    </div>

                    <div class="detail-item">
                        <div style="font-size:11px; color:var(--text-3); font-weight:700;">Data de Entrada</div>
                        <div style="font-size:15px; font-weight:700;">${pd.toLocaleDateString('pt-BR')}</div>
                    </div>

                    <div class="detail-item">
                        <div style="font-size:11px; color:var(--text-3); font-weight:700;">SLA Previsto</div>
                        <div style="font-size:15px; font-weight:700;">${prazo.toLocaleDateString('pt-BR')}</div>
                    </div>
                    
                    <div class="detail-item full">
                        <div style="font-size:11px; color:var(--text-3); font-weight:700;">Status Pagamento</div>
                        <div style="font-size:13px; font-weight:800; color:${p.pagamento === 'Pago' ? 'var(--green)' : 'var(--amber)'};">${p.pagamento || 'Pendente'}</div>
                    </div>
                </div>
                
                <div style="margin-top:20px;">
                    <button class="btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:var(--blurple);" onclick="window.open('${p.pdfUrl || '#'}', '_blank')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        📥 Baixar PDF Original
                    </button>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Validação & Pendência</div>
                <label style="font-size:12px; font-weight:700; color:var(--text-3);">Registrar dúvida ou problema técnico antes de avançar:</label>
                <textarea class="modal-input" placeholder="O que está impedindo de prosseguir?" id="input-preparacao-obs" style="height:60px; margin:8px 0; border:1px solid var(--border);">${p.observacoes || ''}</textarea>
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Pendencia')">🚩 Marcar PENDENTE</button>
                    <button class="btn" style="flex:2; background:var(--green); color:#000; font-weight:800;" onclick="moverEtapa('${p.id}', 'Separacao')">✅ VALIDAR (Enviar Separação)</button>
                </div>
            </div>
            
            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Miniaturas de Validação</div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    ${produtos.map(prod => prod.mockupUrl ? `<img src="${prod.mockupUrl}" style="height:120px; border-radius:6px; border:1px solid var(--border); cursor:zoom-in" onclick="window.open('${prod.mockupUrl}', '_blank')">` : '<div style="display:flex;align-items:center;justify-content:center;background:var(--surface-2);width:120px;height:120px;color:var(--text-3);border:1px dashed var(--border);border-radius:6px;font-size:12px;">S/ Img</div>').join('')}
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'separacao') {
        const iconAtual = ETAPA_ICONS[p.etapa] || '📦';

        let painelHexHtml = '';
        let itensHtml = '';

        produtos.forEach((prod, idx) => {
            const indexLabel = numProdutos > 1 ? `<div style="font-weight:800; color:var(--blurple); margin-top:20px; text-transform:uppercase; font-size:12px">PRODUTO ${idx + 1}: ${prod.sku || p.sku}</div>` : '';

            const dt = prod.dadosTecnicos || p.dadosTecnicos || {};
            const gradeText = prod.tamanho || p.tamanho || 'Tamanho Único';
            const partes = (dt.cores && typeof dt.cores === 'object') ? dt.cores : {};

            let colorRows = '';
            for (const [parte, hex] of Object.entries(partes)) {
                if (hex && String(hex).startsWith('#')) {
                    colorRows += `<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                      <div class="color-swatch-hex" style="width:30px; height:30px; border-radius:4px; background:${hex}; border:1px solid #000; box-shadow:0 2px 4px rgba(0,0,0,0.1)"></div>
                      <div style="font-size:13px; font-weight:600; text-transform:capitalize;">${PART_LABEL_MAP[parte] || parte.replace(/_/g, ' ')} <span style="color:var(--text-3); font-weight:400; font-size:11px;">(${hex})</span></div>
                    </div>`;
                }
            }
            if (!colorRows) colorRows = '<div style="font-size:12px;color:var(--text-3);">Nenhuma cor hexadecimal registrada no Simulador.</div>';

            painelHexHtml += `
                ${indexLabel}
                <div style="background:var(--surface-color); padding:10px; border-radius:8px; border:1px solid var(--border); margin-top:10px;">
                    ${colorRows}
                </div>
            `;

            const maxPecas = parseInt(prod.quantidade || p.quantidade || 1);
            let checkPecas = '';
            for (let i = 1; i <= maxPecas; i++) {
                checkPecas += `
                  <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:5px; background:var(--surface-color); border-radius:6px; border:1px solid var(--border);">
                     <label style="display:flex; align-items:center; gap:8px; cursor:pointer; flex: 1;">
                         <input type="checkbox" class="modal-input" style="width:18px; height:18px; margin:0;" onclick="this.parentNode.parentNode.style.opacity = this.checked ? '0.5' : '1'">
                         <span style="font-weight:700; font-size:13px;">Peça ${i} de ${maxPecas}</span>
                         <span style="font-size:11px; color:var(--text-3); background:var(--surface-2); padding:2px 6px; border-radius:4px;">${gradeText}</span>
                     </label>
                     <button class="btn btn-outline" style="font-size:10px; padding:4px 8px; border-color:var(--text-3);" onclick="alert('Gerando Etiqueta QR para Pedido ${p.numero} - Peça ${i}...')">
                        🖨️ QR
                     </button>
                  </div>
                `;
            }

            itensHtml += `
                ${indexLabel}
                <div style="margin-top:10px;">${checkPecas}</div>
            `;
        });

        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>📦 SEPARAÇÃO (Insumos e Estoque)</span>
                    <span style="font-size:12px; font-weight:700; color:var(--text-3);">OS: ${p.numero}</span>
                </div>
                
                <div class="detail-grid" style="margin-top:15px; grid-template-columns: 1fr;">
                    <div class="detail-item full" style="border:1px solid var(--border); padding:15px; border-radius:8px; background:var(--surface-color);">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-1);">📋 CHECKLIST DE INSUMOS GERAIS</div>
                        <div style="display:flex; gap:20px; flex-wrap:wrap;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600;">Tecido Principal</span></label>
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600;">Linhas</span></label>
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" style="width:16px; height:16px;"> <span style="font-weight:600;">Elásticos/Aviamentos</span></label>
                        </div>
                    </div>
                </div>

                <div style="display:flex; gap:15px; margin-top:20px; flex-wrap:wrap;">
                    <div style="flex: 2; min-width:300px;">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-2);">CONFERÊNCIA INDIVIDUAL DE PEÇAS</div>
                        ${itensHtml}
                        <button class="btn btn-outline" style="width:100%; margin-top:15px; border-color:var(--blurple); color:var(--blurple); font-weight:800;" onclick="alert('Lote de etiquetas enviado para impressão.')">🖨️ Imprimir Lote de Etiquetas (${numProdutos} itens)</button>
                    </div>
                    
                    <div style="flex: 1; min-width:250px;">
                        <div style="font-weight:800; font-size:13px; margin-bottom:12px; color:var(--text-2);">GUIA DE CORES HEX</div>
                        ${painelHexHtml}
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Validação da Etapa</div>
                <label style="font-size:12px; font-weight:700; color:var(--text-3);">Observações de Separação (aparecem no PDF de saída):</label>
                <textarea class="modal-input" placeholder="Ex: Tecido lote B, elástico 20mm..." id="input-separacao-obs" style="height:60px; margin:8px 0; border:1px solid var(--border);">${p.observacoes || ''}</textarea>
                
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Pendencia')">🚩 MARCAR PENDÊNCIA</button>
                    <button class="btn" style="flex:2; background:var(--green); color:#000; font-weight:800;" onclick="moverEtapa('${p.id}', 'Arte')">✅ ENVIAR PARA ARTE / DESENVOLVIMENTO</button>
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'arte') {
        let artesHtml = '';

        produtos.forEach((prod, idx) => {
            const dt = prod.dadosTecnicos || p.dadosTecnicos || {};
            const indexLabel = numProdutos > 1 ? `<div style="font-weight:800; color:var(--blurple); margin-top:20px; text-transform:uppercase; font-size:12px">ARTE DO PRODUTO ${idx + 1}</div>` : '';

            // Textos e Fontes
            let textosHtml = '';
            if (dt.texts && dt.texts.length > 0) {
                textosHtml = dt.texts.map(t => `<div style="padding:8px; background:var(--surface-2); border-radius:6px; margin-bottom:5px; border-left:3px solid var(--blurple)">
                  <div style="font-size:10px; color:var(--text-3); text-transform:uppercase;">${t.position || 'Posição'}</div>
                  <div style="font-weight:700; font-size:14px;">"${t.content || '-'}"</div>
                  <div style="font-size:11px; color:var(--text-2)">Fonte: ${t.font || 'Padrão'}</div>
               </div>`).join('');
            } else {
                textosHtml = '<div style="font-size:12px; color:var(--text-3)">Nenhum texto personalizado.</div>';
            }

            // Links de arquivos Enviados pelo Cliente e artes prontas (EMB)
            const links = [
                { label: 'Original/Referência', url: prod.mockupUrl || p.pdfUrl, icon: '🖼️' },
                { label: 'Arquivo EMB (Bordado)', url: prod.emb || p.emb, icon: '🧵' }
            ].filter(l => l.url);

            artesHtml += `
                ${indexLabel}
                <div style="display:flex; gap:15px; margin-top:10px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;">
                        <div style="font-weight:800; font-size:11px; margin-bottom:8px; color:var(--text-3);">REFERÊNCIAS & TEXTOS</div>
                        ${textosHtml}
                    </div>
                    <div style="flex:1; min-width:200px;">
                        <div style="font-weight:800; font-size:11px; margin-bottom:8px; color:var(--text-3);">ARQUIVOS TÉCNICOS</div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${links.map(l => `<button class="btn btn-outline" style="justify-content:flex-start; font-size:12px;" onclick="window.open('${l.url}', '_blank')">${l.icon} ${l.label}</button>`).join('')}
                            <div style="border: 2px dashed var(--border); padding: 10px; border-radius: 6px; text-align: center; cursor: pointer; background: var(--surface-2);" onclick="alert('Upload de Vetor/Arte final em breve...')">
                                <div style="font-size:18px;">📁</div>
                                <div style="font-size:10px; font-weight:700; color:var(--text-3);">Anexar VETOR / FINAL</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title">✒️ DESENVOLVIMENTO DE ARTE</div>
                ${artesHtml}
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Status da Arte</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                   <button class="btn btn-outline" style="border-color:var(--amber); color:var(--amber);" onclick="alert('Status: Em Desenvolvimento')">🕒 Em Desenvolvimento</button>
                   <button class="btn btn-outline" style="border-color:var(--green); color:var(--green);" onclick="alert('Status: Banco de Imagens (Pronta)')">🏛️ Banco de Imagens</button>
                </div>
                
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Pendencia')">🚩 Pendência de Arte</button>
                    <button class="btn" style="flex:2; background:var(--blurple); color:white; font-weight:800;" onclick="moverEtapa('${p.id}', 'Bordado')">✅ ARTE APROVADA (Mover Bordado)</button>
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'bordado') {
        let bordadosHtml = '';
        produtos.forEach((prod, idx) => {
            const dt = prod.dadosTecnicos || p.dadosTecnicos || {};
            const indexLabel = numProdutos > 1 ? `<div style="font-weight:800; color:var(--blurple); margin-top:20px; text-transform:uppercase; font-size:12px">BORDADO ITEM ${idx + 1}</div>` : '';

            // Simulação de Mapa de Localização baseado nos dados técnicos
            const localizacao = dt.localizacao || "Perna Esquerda / Cós";
            const arquivos = [
                { name: 'Arte_Bordado_v1.DST', type: 'DST' },
                { name: 'Arte_Bordado_v1.PES', type: 'PES' }
            ];

            bordadosHtml += `
                ${indexLabel}
                <div style="display:flex; gap:20px; margin-top:10px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:250px; background:var(--surface-color); padding:15px; border-radius:8px; border:1px solid var(--border);">
                        <div style="font-weight:800; font-size:11px; margin-bottom:10px; color:var(--text-3); text-transform:uppercase;">🧵 MAPA TÉCNICO & CORES</div>
                        <div style="margin-bottom:15px;">
                            <div style="font-size:12px; color:var(--text-3);">Localização Exata:</div>
                            <div style="font-weight:700; font-size:15px; color:var(--text-1);">${localizacao}</div>
                        </div>
                        <div style="margin-bottom:15px;">
                            <div style="font-size:12px; color:var(--text-3);">Cores de Linha:</div>
                            <div style="display:flex; gap:8px; margin-top:5px;">
                                <div style="display:flex; align-items:center; gap:5px; background:var(--surface-2); padding:4px 8px; border-radius:4px; font-size:11px; font-weight:700; border:1px solid var(--border);">
                                    <div style="width:10px; height:10px; border-radius:50%; background:#fff; border:1px solid #ccc;"></div> Branca (Poliviscose)
                                </div>
                                <div style="display:flex; align-items:center; gap:5px; background:var(--surface-2); padding:4px 8px; border-radius:4px; font-size:11px; font-weight:700; border:1px solid var(--border);">
                                    <div style="width:10px; height:10px; border-radius:50%; background:#000;"></div> Preta (Resistente)
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="flex:1; min-width:250px;">
                        <div style="font-weight:800; font-size:11px; margin-bottom:10px; color:var(--text-3); text-transform:uppercase;">📁 ARQUIVOS DE MÁQUINA</div>
                        <div style="display:grid; grid-template-columns: 1fr; gap:8px;">
                            ${arquivos.map(arq => `
                                <button class="btn btn-outline" style="justify-content:space-between; font-size:12px;" onclick="alert('Baixando ${arq.name}...')">
                                   <span>📄 ${arq.name}</span>
                                   <span style="font-size:9px; background:var(--blurple-dim); color:var(--blurple); padding:2px 4px; border-radius:3px;">${arq.type}</span>
                                </button>
                            `).join('')}
                            <button class="btn btn-outline" style="justify-content:flex-start; font-size:12px; border-color:var(--red); color:var(--red);" onclick="window.open('${prod.mockupUrl || '#'}', '_blank')">📑 Ver PDF da Arte</button>
                        </div>
                    </div>
                </div>
            `;
        });

        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>🧵 ESTAÇÃO DE BORDADO</span>
                    <span style="background:var(--green-dim); color:var(--green); padding:4px 10px; border-radius:12px; font-size:11px; font-weight:900;">ARTE CONCLUÍDA</span>
                </div>
                ${bordadosHtml}
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Validação do Bordado</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Pendencia')">🚩 MARCAR ERRO/PENDÊNCIA</button>
                    <button class="btn" style="flex:2; background:var(--green); color:#000; font-weight:800;" onclick="moverEtapa('${p.id}', 'Costura')">✅ BORDADO OK (Mover para Costura)</button>
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'costura') {
        const indexLabel = numProdutos > 1 ? `<div style="font-weight:800; color:var(--blurple); margin-bottom:15px; text-transform:uppercase; font-size:12px">DETALHES DE MONTAGEM (${numProdutos} itens)</div>` : '';

        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title">✂️ MONTAGEM FINAL (COSTURA)</div>
                ${indexLabel}
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:15px;">
                    <div style="background:var(--surface-color); padding:15px; border-radius:8px; border:1px solid var(--border);">
                        <div style="font-weight:800; font-size:11px; margin-bottom:12px; color:var(--text-3); text-transform:uppercase;">📝 GUIA DE ESTILO</div>
                        <div class="detail-grid" style="grid-template-columns: 1fr; gap:10px;">
                            <div class="detail-item">
                                <div style="font-size:11px; color:var(--text-3);">Modelo / Corte:</div>
                                <div style="font-weight:700;">Short Muay Thai (Tradicional)</div>
                            </div>
                            <div class="detail-item">
                                <div style="font-size:11px; color:var(--text-3);">Cor Costuras:</div>
                                <div style="font-weight:700;">Preto Carbono (Linha 40)</div>
                            </div>
                            <div class="detail-item">
                                <div style="font-size:11px; color:var(--text-3);">Etiquetas:</div>
                                <div style="font-weight:700;">HNT Premium (Cós Central)</div>
                            </div>
                        </div>
                        <button class="btn btn-outline" style="width:100%; margin-top:15px; font-size:12px;" onclick="alert('Abrindo Guia de Montagem...')">🗺️ Abrir Exploded View (Diagrama)</button>
                    </div>

                    <div style="background:var(--surface-color); padding:15px; border-radius:8px; border:1px solid var(--border);">
                        <div style="font-weight:800; font-size:11px; margin-bottom:12px; color:var(--text-3); text-transform:uppercase;">⚙️ CONTROLE DE PROCESSOS</div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; background:var(--surface-2); padding:10px; border-radius:6px;">
                                <input type="checkbox" style="width:18px; height:18px;">
                                <span style="font-weight:700; font-size:13px;">Etiquetas Inseridas</span>
                            </label>
                            
                            <div style="margin-top:5px;">
                                <div style="font-size:11px; color:var(--text-3); margin-bottom:5px;">Costureiro(a) Responsável:</div>
                                <select class="modal-input" style="width:100%;" id="select-costureiro">
                                    <option value="">Selecione...</option>
                                    <option value="Maria">Maria Silva</option>
                                    <option value="Joao">João Santos</option>
                                    <option value="Ana">Ana Oliveira</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Finalizar Montagem</div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Pendencia')">🚩 PENDÊNCIA / DEFEITO</button>
                    <button class="btn" style="flex:2; background:var(--green); color:#000; font-weight:800;" onclick="moverEtapa('${p.id}', 'Qualidade')">✅ PEÇA MONTADA (Ir p/ Qualidade)</button>
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'qualidade') {
        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title">✨ REVISÃO E QUALIDADE (CONSERVAÇÃO)</div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
                    <div>
                        <div style="font-weight:800; font-size:11px; margin-bottom:10px; color:var(--text-3); text-transform:uppercase;">📸 GARANTIA DE QUALIDADE (FOTO)</div>
                        <div style="width:100%; height:200px; background:var(--surface-2); border:2px dashed var(--border); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="alert('Ativando Câmera...')">
                            <div style="font-size:32px;">📷</div>
                            <div style="font-size:12px; font-weight:700; color:var(--text-3); margin-top:5px;">Capturar Foto da Peça Pronta</div>
                        </div>
                        <p style="font-size:11px; color:var(--text-3); margin-top:8px;">*A foto será anexada ao histórico do pedido para auditoria.</p>
                    </div>

                    <div>
                        <div style="font-weight:800; font-size:11px; margin-bottom:10px; color:var(--text-3); text-transform:uppercase;">📋 CHECKLIST DE CONFORMIDADE</div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:8px; background:var(--surface-2); border-radius:6px;">
                                <input type="checkbox" style="width:16px; height:16px;">
                                <span style="font-size:13px; font-weight:600;">Limpeza de linhas (Fios soltos)</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:8px; background:var(--surface-2); border-radius:6px;">
                                <input type="checkbox" style="width:16px; height:16px;">
                                <span style="font-size:13px; font-weight:600;">Simetria do Bordado</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:8px; background:var(--surface-2); border-radius:6px;">
                                <input type="checkbox" style="width:16px; height:16px;">
                                <span style="font-size:13px; font-weight:600;">Integridade do Tecido / Costura</span>
                            </label>
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:8px; background:var(--surface-2); border-radius:6px;">
                                <input type="checkbox" style="width:16px; height:16px;">
                                <span style="font-size:13px; font-weight:600;">Etiquetas e Embalagem</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Decisão Final</div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn btn-outline" style="flex:1; border-color:var(--red); color:var(--red);" onclick="moverEtapa('${p.id}', 'Costura')">❌ REPROVAR (Voltar para Costura)</button>
                    <button class="btn" style="flex:2; background:var(--blurple); color:white; font-weight:800;" onclick="moverEtapa('${p.id}', 'Expedicao')">✅ APROVADO (Mover para Expedição)</button>
                </div>
            </div>
        `;
    }
    else if (drawerTab === 'expedicao') {
        contentHtml = `
            <div class="detail-section" style="margin-top:0;">
                <div class="detail-section-title">🚚 EXPEDIÇÃO E LOGÍSTICA</div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:15px;">
                    <div style="background:var(--surface-color); padding:15px; border-radius:8px; border:1px solid var(--border);">
                        <div style="font-weight:800; font-size:11px; margin-bottom:12px; color:var(--text-3); text-transform:uppercase;">📦 DADOS DE ENVIO</div>
                        <div class="detail-grid" style="grid-template-columns: 1fr; gap:10px;">
                            <div class="detail-item">
                                <div style="font-size:11px; color:var(--text-3);">Cliente:</div>
                                <div style="font-weight:700;">${p.cliente || 'Consumidor Final'}</div>
                            </div>
                            <div class="detail-item">
                                <div style="font-size:11px; color:var(--text-3);">Endereço:</div>
                                <div style="font-size:12px;">Rua Exemplo, 123 - São Paulo/SP</div>
                            </div>
                            <div style="margin-top:5px;">
                                <div style="font-size:11px; color:var(--text-3); margin-bottom:5px;">Transportadora:</div>
                                <select class="modal-input" style="width:100%;">
                                    <option>Correios (PAC)</option>
                                    <option>Correios (SEDEX)</option>
                                    <option>Jadlog</option>
                                    <option>Retirada Local</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style="background:var(--surface-color); padding:15px; border-radius:8px; border:1px solid var(--border);">
                        <div style="font-weight:800; font-size:11px; margin-bottom:12px; color:var(--text-3); text-transform:uppercase;">🎫 RASTREIO E NOTIFICAÇÃO</div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <input type="text" class="modal-input" placeholder="Código de Rastreio" style="width:100%;">
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                                <button class="btn btn-outline" style="font-size:11px; padding:8px;" onclick="alert('Enviando WhatsApp...')">💬 WhatsApp</button>
                                <button class="btn btn-outline" style="font-size:11px; padding:8px;" onclick="alert('Enviando E-mail...')">📧 E-mail</button>
                            </div>
                            
                            <button class="btn" style="width:100%; height:45px; background:var(--blurple); color:white; font-size:12px; font-weight:700; gap:8px;" onclick="alert('Gerando Etiqueta...')">
                                🖨️ Gerar Etiqueta de Envio
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:20px;">
                <div class="detail-section-title">Finalizar Pedido</div>
                <button class="btn" style="width:100%; height:56px; background:var(--green); color:#000; font-weight:900; font-size:16px;" onclick="moverEtapa('${p.id}', 'Finalizado')">🏁 CONCLUIR E BAIXAR ESTOQUE</button>
            </div>
        `;
    }
    else if (drawerTab === 'pendencia' || p.etapa === 'Pendencia') {
        const info = p.pendenciaInfo || {};
        contentHtml = `
            <div class="detail-section" style="margin-top:0; border:2px solid var(--red); padding:20px; border-radius:12px; background:rgba(239, 68, 68, 0.05);">
                <div class="detail-section-title" style="color:var(--red); display:flex; align-items:center; gap:10px;">
                    <span>⚠️ PEDIDO EM PENDÊNCIA</span>
                </div>
                
                <div style="margin-top:15px;">
                    <div style="font-size:12px; color:var(--text-3); font-weight:800; text-transform:uppercase;">Motivo da Trava:</div>
                    <div style="font-size:18px; font-weight:900; color:var(--red); margin-top:5px;">${info.motivo || 'Não especificado'}</div>
                </div>

                <div style="margin-top:20px;">
                    <div style="font-size:12px; color:var(--text-3); font-weight:800; text-transform:uppercase;">Descrição / Observação:</div>
                    <div style="font-size:14px; background:white; padding:15px; border-radius:8px; border:1px solid var(--border); margin-top:5px; line-height:1.5;">
                        ${info.observacao || 'Sem descrição detalhada.'}
                    </div>
                </div>

                <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-3);">
                    <span>Identificado por: <b>${info.operador || 'Sistema'}</b></span>
                    <span>Data: <b>${info.data ? new Date(info.data).toLocaleString() : '--'}</b></span>
                </div>
            </div>

            <div style="margin-top:30px; text-align:center;">
                <p style="font-size:13px; color:var(--text-2); margin-bottom:15px;">Após resolver o problema acima, clique no botão abaixo para retornar o pedido à sua etapa de origem (<b>${info.etapaAnterior || 'Preparação'}</b>).</p>
                <button class="btn" style="width:100%; height:56px; background:var(--green); color:#000; font-weight:900; font-size:18px;" onclick="retomarPedido('${p.id}')">
                    ✅ RESOLVIDO (Retomar Produção)
                </button>
            </div>
        `;
    }
    else {
        contentHtml = `<div style="padding:40px; text-align:center; color:var(--text-3);">
            <h3 style="margin-bottom:10px; color:var(--text-1); font-weight:800; font-size:18px;">Aba ${drawerTab.toUpperCase()}</h3>
            <p>Aba de detalhes gerais para o pedido ${p.numero}.</p>
        </div>`;
    }

    if (contentHtml !== '') {
        body.innerHTML = contentHtml;
    }
    const chatInputRow = $('chat-input-row');
    if (chatInputRow) chatInputRow.style.display = 'none';
}

function toggleItemCard(index) {
    const card = $(`item-card-${index}`);
    if (card) {
        card.classList.toggle('expanded');
    }
}


// ── Mapa de Labels de Partes (nomes amigáveis para produção) ──────────────
const PART_LABEL_MAP = {
    // Genérico
    'centro': 'Centro', 'lateral_esq': 'Lateral Esquerda', 'lateral_dir': 'Lateral Direita',
    'filete': 'Filetes', 'logo_hnt': 'Logo HNT', 'fundo_hnt': 'Fundo HNT',
    'base': 'Base', 'top': 'Topo', 'cós': 'Cós', 'cos': 'Cós', 'punho': 'Punho',
    'manga_esq': 'Manga Esquerda', 'manga_dir': 'Manga Direita',
    'bolso': 'Bolso', 'capuz': 'Capuz', 'lateral': 'Lateral',
    'leg_left_top': 'Perna Esq. (Cima)', 'leg_left_mid': 'Perna Esq. (Meio)', 'leg_left_bottom': 'Perna Esq. (Baixo)',
    'leg_right_top': 'Perna Dir. (Cima)', 'leg_right_mid': 'Perna Dir. (Meio)', 'leg_right_bottom': 'Perna Dir. (Baixo)',
    // Moletom
    'corpo': 'Corpo', 'ribana': 'Ribana',
};

// Mapa de labels de textos
const TEXT_LABEL_MAP = {
    'text_centro': 'Centro', 'text_lat_dir': 'Lateral Direita', 'text_lat_esq': 'Lateral Esquerda',
    'text_leg_left_mid': 'Perna Esq. (meio)', 'text_leg_right_mid': 'Perna Dir. (meio)',
    'text_leg_right_bottom': 'Perna Dir. (baixo)', 'text_top_frente': 'Frente',
    'text_top_costas': 'Costas', 'text_costas': 'Costas', 'text_frente': 'Frente',
    'text_left_chest': 'Peito Esq.', 'text_right_chest': 'Peito Dir.',
    'text_upper_back': 'Costas (Superior)', 'text_lower_back': 'Costas (Inferior)',
};

// Mapa de extras
const EXTRA_LABEL_MAP = {
    'laco': 'Laço', 'cordao': 'Cordão', 'calca_legging': 'Calça Legging (combo)',
    'top': 'Top (combo)', 'shorts_legging': 'Shorts Legging (combo)',
};

/**
 * renderProdutoFicha — Renderiza ficha técnica de alta densidade por setores
 * Usado tanto no expand da Produção (grid) quanto no Drawer (vertical)
 */
function renderProdutoFicha(prod, isSubItem = false) {
    const dt = prod.dadosTecnicos || {};
    const parts = dt.parts || {};
    const texts = dt.texts || {};
    const extras = dt.extras || {};
    const uploads = dt.uploads || {};
    const grade = dt.grade || dt.sizes || {};
    const logoPunho = dt.logoPunho || null;
    const p0 = prod;

    // ── Helpers ─────────────────────────────────────────────
    const gradeEntries = Object.entries(grade).filter(([, q]) => q > 0);
    const gradeHtml = gradeEntries.length > 0
        ? gradeEntries.map(([sz, qty]) => `<div class="ficha-grade-pill">${sz}<span>${qty}×</span></div>`).join('')
        : `<span style="font-size:12px;font-weight:700;">${p0.tamanho || '—'} × ${p0.quantidade || 1}</span>`;

    const coresHtml = Object.entries(parts).slice(0, 10).map(([k, v]) => {
        const colorName = typeof v === 'object' ? (v.value || v.name || '—') : (v || '—');
        const label = PART_LABEL_MAP?.[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<div class="ficha-setor-row"><span class="ficha-setor-key">${label}</span><span class="ficha-setor-val">${colorName}</span></div>`;
    }).join('') || '<span style="color:var(--text-3);font-size:11px">Sem cores definidas</span>';

    const uploadList = Object.entries(uploads).filter(([, d]) => d && d.src);
    const logosHtml = uploadList.length > 0 || logoPunho
        ? `<div class="ficha-logo-row">
            ${uploadList.map(([k, d]) => `<img class="ficha-logo-mini" src="${d.src}" title="${d.filename || k}" onclick="window.open('${d.src}','_blank')">`).join('')}
            ${logoPunho ? `<img class="ficha-logo-mini" src="${logoPunho}" title="Logo Punho" onclick="window.open('${logoPunho}','_blank')">` : ''}
           </div>`
        : '<span style="color:var(--text-3);font-size:11px">—</span>';

    const textsHtml = Object.entries(texts).filter(([, d]) => d.enabled && d.content).map(([k, d]) =>
        `<div class="ficha-setor-row"><span class="ficha-setor-key">${TEXT_LABEL_MAP?.[k] || k}</span><span class="ficha-setor-val">"${d.content}"</span></div>`
    ).join('') || '<span style="color:var(--text-3);font-size:11px">—</span>';

    const extrasHtml = Object.entries(extras).filter(([, d]) => d && d.enabled).map(([k, d]) =>
        `<div class="ficha-setor-row"><span class="ficha-setor-key">✅ ${EXTRA_LABEL_MAP?.[k] || k}</span><span class="ficha-setor-val">${d.color || 'Sim'}</span></div>`
    ).join('') || '<span style="color:var(--text-3);font-size:11px">—</span>';

    const valorFmt = p0.valor ? `R$ ${parseFloat(p0.valor).toFixed(2).replace('.', ',')}` : '—';

    const sectionClass = isSubItem ? 'drawer-ficha-section' : 'ficha-setor-bloco';
    const titleClass = isSubItem ? 'drawer-ficha-title' : 'ficha-setor-title';

    return `
        <div class="produto-ficha-container ${isSubItem ? 'sub-item' : ''}" style="${isSubItem ? 'padding:0' : 'padding:15px'}">
            
            <div class="${sectionClass} setor-preparacao">
                <div class="${titleClass} setor-preparacao">📋 Preparação</div>
                <div class="ficha-setor-row"><span class="ficha-setor-key">SKU</span><span class="ficha-setor-val">${p0.sku || '—'}</span></div>
                <div class="ficha-setor-row"><span class="ficha-setor-key">Técnica</span><span class="ficha-setor-val">${p0.tecnica || '—'}</span></div>
                <div class="ficha-setor-row"><span class="ficha-setor-key">Qtd.</span><span class="ficha-setor-val">${p0.quantidade || 1} un.</span></div>
            </div>

            <div class="${sectionClass} setor-separacao">
                <div class="${titleClass} setor-separacao">📦 Separação & Cores</div>
                <div class="ficha-grade-compact">${gradeHtml}</div>
                <div style="margin-top:10px">${coresHtml}</div>
            </div>

            <div class="${sectionClass} setor-arte">
                <div class="${titleClass} setor-arte">✒️ Arte / Logos / Textos</div>
                ${logosHtml}
                <div style="margin-top:10px">${textsHtml}</div>
            </div>

            <div class="${sectionClass} setor-bordado">
                <div class="${titleClass} setor-bordado">🧵 Bordado</div>
                ${p0.emb
            ? `<div class="ficha-setor-row"><span class="ficha-setor-key">Arquivo</span><span class="ficha-setor-val"><a href="${p0.emb}" target="_blank" style="color:var(--setor-bordado)">Baixar .EMB</a></span></div>`
            : '<span style="color:var(--text-3);font-size:11px">Sem bordado</span>'}
            </div>

            <div class="${sectionClass} setor-costura">
                <div class="${titleClass} setor-costura">✂️ Costura / Extras</div>
                ${extrasHtml}
                ${p0.observacoes ? `<div style="margin-top:8px; background:var(--amber-dim); padding:8px; border-radius:4px; font-size:11px; color:#92400e; border-left:3px solid var(--amber)"><strong>OBS:</strong> ${p0.observacoes}</div>` : ''}
            </div>

            <div class="${sectionClass} setor-qualidade">
                <div class="${titleClass} setor-qualidade">✨ Qualidade</div>
                <div class="ficha-setor-row"><span class="ficha-setor-key">Revisão</span><span class="ficha-setor-val">Pendente</span></div>
            </div>

            <div class="${sectionClass} setor-expedicao">
                <div class="${titleClass} setor-expedicao">🚚 Expedição / Valor</div>
                <div class="ficha-setor-row"><span class="ficha-setor-key">Valor unit.</span><span class="ficha-setor-val" style="color:var(--green); font-weight:800">${valorFmt}</span></div>
            </div>

        </div>`;
}

// Helper para trocar abas PROGRAMATICAMENTE
function switchDrawerTab(tab) {
    drawerTab = tab;
    const p = PEDIDOS.find(x => x.id.toString() == selectedId.toString());
    if (p) {
        renderDrawer(p);
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

    // Caso especial: Pendência (Abre Modal primeiro)
    if (novaEtapa === 'Tendencia' || novaEtapa === 'Pendencia') {
        openPendenciaModal(id);
        return;
    }

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
        if (currentView === 'arte_dev') renderArteDev();
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

// isEditing declared at top
function toggleEdicao() {
    isEditing = !isEditing;
    const p = PEDIDOS.find(x => x.id == selectedId);
    renderDrawerTab(p);
}

async function saveEdicao() {
    if (!selectedId) return;
    const p = PEDIDOS.find(x => x.id == selectedId);

    const fields = {
        numero_pedido: $('edit-numero').value,
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
        p.numero = fields.numero_pedido;
        p.sku = fields.sku;
        p.quantidade = fields.quantidade;
        p.tamanho = fields.tamanho;
        p.observacoes = fields.observacoes;
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
        p.numero.toString().includes(q) ||  // Match exato ou parcial do número
        p.sku.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q)
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
    if (target) {
        target.classList.add('active');
        if (currentView === 'arte_dev') renderArteDev();
        if (currentView === 'lista') renderTable(filterData());
        if (currentView === 'kanban') renderKanban(PEDIDOS);
        if (currentView === 'producao') renderProducao();
    }
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

            // Sincroniza o operador global para liberar ações admin em todo o sistema
            const op = OPERADORES.find(o => o.id === result.id);
            if (op) {
                currentOperador = op;
            } else {
                currentOperador = {
                    id: result.id,
                    nome: result.nome,
                    usuario: result.usuario,
                    iniciais: (result.nome || 'Admin').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                    perfil: result.perfil,
                    setor: result.setor
                };
            }
            localStorage.setItem('hnt_operator', JSON.stringify(currentOperador));
            updateUserCard();

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

    // Novo Pedido Manual
    const btnNovo = $('btn-novo-pedido');
    if (btnNovo) btnNovo.addEventListener('click', openNovoPedidoModal);
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

    const p = PEDIDOS.find(x => x.numero.toString() === val || x.sku === val);
    if (!p) {
        alert('⚠️ Pedido ou SKU não encontrado: ' + val);
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
    const p = PEDIDOS.find(x => x.numero.toString() === val || x.sku === val);
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
// currentOperador moved to top

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

    </div>
    
    <!-- NOVO: Área de Risco / Limpeza de Dados -->
    <div class="report-card" style="grid-column: span 3; border: 1px solid var(--red-dim); background: rgba(239, 68, 68, 0.05); margin-top: 15px;">
        <div class="report-card-header" style="background: rgba(239, 68, 68, 0.1);">
          <span class="report-card-icon" style="font-size:16px">⚠️</span>
          <span class="report-card-title" style="color:var(--red)">Zona de Risco: Banco de Dados</span>
          <span class="report-card-sub" style="font-size:10px">Ações permanentes e irreversíveis</span>
        </div>
        <div class="report-card-body" style="padding: 20px; text-align: center;">
             <p style="font-size:13px; color:var(--text-2); margin-bottom:15px">
               Deseja remover <strong>todos os pedidos</strong> do banco de dados para iniciar um novo ciclo? <br>
               <span style="color:var(--text-3); font-size:11px">Isso não afetará os usuários (operadores) ou as configurações de etapas.</span>
             </p>
             <button class="btn" style="background:var(--red); color:white; border:none; padding:12px 25px; font-weight:800; border-radius:6px; cursor:pointer; box-shadow:var(--shadow-md);" onclick="limparTodosPedidos()">
                🗑️ EXCLUIR TODOS OS LANÇAMENTOS (PEDIDOS)
             </button>
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

async function limparTodosPedidos() {
    if (!confirm("⚠️ ATENÇÃO: Isso excluirá PERMANENTEMENTE todos os pedidos do sistema. Tem certeza?")) return;
    if (!confirm("TEM CERTEZA ABSOLUTA? Esta ação é irreversível.")) return;

    try {
        if (typeof api !== 'undefined') {
            const success = await api.clearAllPedidos();
            if (success) {
                alert("Sucesso! Todos os pedidos foram removidos.");
                location.reload();
            } else {
                throw new Error("A API retornou falha.");
            }
        }
    } catch (e) {
        alert("Erro ao limpar banco: " + e.message);
    }
}

async function excluirPedidoUI() {
    if (!selectedId) return;
    if (!confirm("Tem certeza que deseja EXCLUIR PERMANENTEMENTE este pedido?")) return;

    try {
        if (typeof api !== 'undefined') {
            await api.deletePedido(selectedId);
            alert("Pedido excluído com sucesso.");
            closeDrawer();
            location.reload();
        }
    } catch (e) {
        alert("Erro ao excluir: " + e.message);
    }
}

// ── Novo Pedido Manual ──
function openNovoPedidoModal() {
    const modal = $('novo-pedido-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
    $('manual-cliente').focus();
}

function closeNovoPedidoModal() {
    const modal = $('novo-pedido-modal');
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

async function confirmNovoPedidoManual() {
    const cliente = $('manual-cliente').value.trim();
    const produto = $('manual-produto').value.trim();
    const tamanho = $('manual-tamanho').value.trim();
    const tecnica = $('manual-tecnica').value.trim();
    const qtd = parseInt($('manual-qtd').value) || 1;
    const obs = $('manual-obs').value.trim();

    if (!cliente || !produto) {
        alert("Por favor, preencha pelo menos o Nome do Cliente e o Produto.");
        return;
    }

    try {
        if (typeof api !== 'undefined') {
            // Pegar próximo número de pedido progressivo
            const nextIdRes = await api.getNextOrderId();
            const sku = 'MN-' + Math.random().toString(36).substring(2, 8).toUpperCase(); // SKU temporário para pedidos manuais

            const novoPedido = {
                numero_pedido: nextIdRes.numero,
                cliente: cliente,
                sku: sku,
                tecnica: tecnica,
                tamanho: tamanho,
                quantidade: qtd,
                etapa: 'Preparação',
                status: 'Aguardando',
                dados_tecnicos: JSON.stringify({
                    parts: {
                        Produto: { value: produto }
                    },
                    manual: true
                }),
                observacoes: obs,
                criado_em: new Date().toISOString()
            };

            await api.createPedido(novoPedido);
            alert(`Pedido ${nextIdRes.numero} criado com sucesso!`);
            closeNovoPedidoModal();
            location.reload();
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao criar pedido: " + e.message);
    }
}


window.toggleItemCard = function (index) {
    const card = document.getElementById('item-card-' + index);
    if (!card) return;
    const isExpanded = card.classList.contains('expanded');
    if (isExpanded) {
        card.classList.remove('expanded');
    } else {
        card.classList.add('expanded');
    }
};

// ══════════════════════════════════════════════════════════
//  PRODUCAO VIEW — Production Line Dashboard
// ══════════════════════════════════════════════════════════

// Active filter for producao view ('resumo', 'todos' or an etapa key)
let producaoFiltro = 'resumo';

/**
 * PROCESSO_INFO — Characteristics for each production stage
 */
const PROCESSO_INFO = {
    'Preparacao': {
        icon: '📋',
        objetivo: 'Validar SKU, técnica e integridade do pedido.',
        sla: '0.5 dia útil',
        responsabilidade: 'Conferência de entrada e triagem técnica.'
    },
    'Separacao': {
        icon: '📦',
        objetivo: 'Separar tecidos, insumos e aviamentos da grade.',
        sla: '0.5 dia útil',
        responsabilidade: 'Almoxarifado e separação de lotes.'
    },
    'Arte': {
        icon: '✒️',
        objetivo: 'Vetorização, ajuste de cores e fechamento de arquivos.',
        sla: '1.5 dias úteis',
        responsabilidade: 'Design Gráfico e Arte-final.'
    },
    'Bordado': {
        icon: '🧵',
        objetivo: 'Criação de matrizes e execução do bordado eletrônico.',
        sla: '2.0 dias úteis',
        responsabilidade: 'Programação e Operação de Máquinas.'
    },
    'Costura': {
        icon: '✂️',
        objetivo: 'União das partes, fechamento e acabamento têxtil.',
        sla: '2.5 dias úteis',
        responsabilidade: 'Costura e Montagem.'
    },
    'Qualidade': {
        icon: '✨',
        objetivo: 'Revisão final, limpeza de fios e etiquetagem.',
        sla: '0.5 dia útil',
        responsabilidade: 'Revisão de Qualidade.'
    },
    'Expedicao': {
        icon: '🚚',
        objetivo: 'Embalagem, bipagem de saída e logística.',
        sla: '0.3 dia útil',
        responsabilidade: 'Expedição e Envio.'
    },
    'Pendencia': {
        icon: '⚠️',
        objetivo: 'Resolução de problemas técnicos ou falta de insumos.',
        sla: 'Imediato',
        responsabilidade: 'Gestão de Produção.'
    }
};

/**
 * renderProducao — Renders the production line view with expandable sector cards
 */
function renderProducao(data) {
    const view = document.getElementById('producao-view');
    if (!view) return;

    const etapaFilterOrder = ETAPAS || [
        'Preparacao', 'Separacao', 'Arte', 'Bordado', 'Costura', 'Qualidade', 'Expedicao', 'Pendencia'
    ];

    // Build filter tabs
    const tabsHtml = `
        <div class="producao-filter-tabs">
            <button class="producao-filter-tab ${producaoFiltro === 'resumo' ? 'active' : ''}"
                    onclick="setProducaoFiltro('resumo')">
                📊 Resumo
            </button>
            <button class="producao-filter-tab ${producaoFiltro === 'todos' ? 'active' : ''}"
                    onclick="setProducaoFiltro('todos')">
                Todos <span class="producao-filter-count">${data.length}</span>
            </button>
            ${etapaFilterOrder.map(etapa => {
        const count = data.filter(p => p.etapa === etapa).length;
        const icon = ETAPA_ICONS[etapa] || '📋';
        const label = ETAPA_LABELS[etapa] || etapa;
        return `
                    <button class="producao-filter-tab ${producaoFiltro === etapa ? 'active' : ''}"
                            onclick="setProducaoFiltro('${etapa}')">
                        ${icon} ${label}
                        <span class="producao-filter-count">${count}</span>
                    </button>`;
    }).join('')}
        </div>`;

    if (producaoFiltro === 'resumo') {
        view.innerHTML = tabsHtml + renderProducaoResumo(data);
        return;
    }

    // Banner de Caracterização de Processo (se for uma etapa específica)
    let bannerHtml = '';
    const info = PROCESSO_INFO[producaoFiltro];
    if (info) {
        bannerHtml = `
            <div class="processo-banner setor-${producaoFiltro.toLowerCase()}">
                <div class="banner-icon">${info.icon}</div>
                <div class="banner-content">
                    <div class="banner-header">
                        <span class="banner-title">Processo: ${ETAPA_LABELS[producaoFiltro]}</span>
                        <span class="banner-sla">⏱ SLA Alvo: ${info.sla}</span>
                    </div>
                    <div class="banner-objective"><strong>Objetivo:</strong> ${info.objetivo}</div>
                    <div class="banner-responsibility"><strong>Responsabilidade:</strong> ${info.responsabilidade}</div>
                </div>
            </div>`;
    }

    const filtered = producaoFiltro === 'todos'
        ? data
        : data.filter(p => p.etapa === producaoFiltro);

    if (filtered.length === 0) {
        view.innerHTML = tabsHtml + bannerHtml + `
            <div style="padding:48px; text-align:center; color:var(--text-3); font-size:13px;">
                Nenhum pedido nesta etapa.
            </div>`;
        return;
    }

    const cardsHtml = filtered.map(p => buildProducaoCard(p)).join('');

    view.innerHTML = tabsHtml + bannerHtml + `<div class="producao-grid">${cardsHtml}</div>`;
}

/**
 * renderProducaoResumo — Renders the macro dashboard for production
 */
function renderProducaoResumo(data) {
    const etapaFilterOrder = ETAPAS || [
        'Preparacao', 'Separacao', 'Arte', 'Bordado', 'Costura', 'Qualidade', 'Expedicao', 'Pendencia'
    ];

    const urgentCount = data.filter(p => p.urgente || p.alerta === 'Vermelho').length;
    const delayedCount = data.filter(p => p.diasRestantes <= 0).length;

    const cardsHtml = etapaFilterOrder.map(etapa => {
        const stageItems = data.filter(p => p.etapa === etapa);
        const count = stageItems.length;
        const icon = ETAPA_ICONS[etapa] || '📋';
        const label = ETAPA_LABELS[etapa] || etapa;
        const color = ETAPA_COLORS[etapa] || '#888';
        const stageUrgents = stageItems.filter(p => p.urgente || p.alerta === 'Vermelho').length;
        const stageDelayed = stageItems.filter(p => p.diasRestantes <= 0).length;

        return `
            <div class="resumo-kpi-card" onclick="setProducaoFiltro('${etapa}')">
                <div class="kpi-header">
                    <div class="kpi-icon" style="background:${color}15; color:${color}">${icon}</div>
                    <div class="kpi-label">${label}</div>
                </div>
                <div class="kpi-value">${count}</div>
                <div class="kpi-footer">
                    ${stageUrgents > 0 ? `<span class="kpi-tag urgent">🔥 ${stageUrgents}</span>` : ''}
                    ${stageDelayed > 0 ? `<span class="kpi-tag delayed">⚠️ ${stageDelayed}</span>` : ''}
                    ${stageUrgents === 0 && stageDelayed === 0 ? '<span class="kpi-tag stable">✅ Estável</span>' : ''}
                </div>
                <div class="kpi-progress">
                    <div class="kpi-progress-fill" style="width: ${data.length > 0 ? (count / data.length * 100) : 0}%; background:${color}"></div>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="resumo-dashboard">
            <div class="resumo-highlights">
                <div class="highlight-box urgent">
                    <div class="highlight-val">${urgentCount}</div>
                    <div class="highlight-label">Urgências Ativas</div>
                </div>
                <div class="highlight-box delayed">
                    <div class="highlight-val">${delayedCount}</div>
                    <div class="highlight-label">Prazos Estourados</div>
                </div>
                <div class="highlight-box total">
                    <div class="highlight-val">${data.length}</div>
                    <div class="highlight-label">Total em Produção</div>
                </div>
            </div>
            <div class="resumo-grid-kpi">
                ${cardsHtml}
            </div>
        </div>`;
}

/** Sets the production view filter and re-renders. */
function setProducaoFiltro(filtro) {
    producaoFiltro = filtro;
    renderProducao(PEDIDOS);
}

/**
 * buildProducaoCard — Builds a single expandable production card HTML
 */
function buildProducaoCard(p) {
    const produtos = p.produtos || [p];
    const etapa = p.etapa || 'Preparacao';
    const icon = ETAPA_ICONS[etapa] || '📋';
    const color = ETAPA_COLORS[etapa] || '#888';
    const label = ETAPA_LABELS[etapa] || etapa;
    const etapaKey = etapa.toLowerCase();

    const prazoColor = p.diasRestantes < 0 ? 'var(--red)' :
        p.diasRestantes <= 1 ? 'var(--orange)' : 'var(--text-2)';

    const multiTag = produtos.length > 1
        ? `<span class="producao-badge" style="background:rgba(245,158,11,0.12);color:var(--amber);border:1px solid rgba(245,158,11,0.3)">📦 ${produtos.length} itens</span>`
        : `<span class="producao-badge" style="background:var(--surface-2);color:var(--text-2);border:1px solid var(--border)">${p.sku}</span>`;

    const numProds = produtos.length;
    const fichaHtml = produtos.map((prod, idx) => `
        <div class="ficha-product-item" style="${numProds > 1 ? 'border-bottom:4px solid var(--surface-3);' : ''}">
            ${numProds > 1 ? `
                <div style="background:var(--surface-2); padding:6px 16px; font-size:10px; font-weight:800; color:var(--text-3); text-transform:uppercase; border-bottom:1px solid var(--border)">
                    <span>Item ${idx + 1} de ${numProds}</span>
                </div>` : ''}
            ${renderProdutoFicha(prod, true)}
        </div>
    `).join('');

    return `
        <div class="producao-card" id="prod-card-${p.id}">
            <div class="producao-card-header" onclick="toggleProducaoCard('${p.id}')">
                <div class="producao-setor-icon" style="background:${color}18; border:1px solid ${color}44; font-size:18px">
                    ${icon}
                </div>
                <div class="producao-card-main">
                    <div class="producao-card-num">${p.numero}</div>
                    <div class="producao-card-sub">${p.cliente} · ${p.quantidade} un. · ${label}</div>
                </div>
                ${multiTag}
                ${p.urgente ? '<span class="producao-urgente">⚠ URG</span>' : ''}
                <span class="producao-prazo" style="color:${prazoColor}">
                    📅 ${p.prazo}
                </span>
                <span style="font-size:13px; color:var(--text-3); margin-left:4px; transition:transform 0.2s" id="prod-arrow-${p.id}">▼</span>
            </div>
            <div class="producao-ficha" id="prod-ficha-${p.id}">
                <div style="padding:14px 18px 8px; background:var(--surface); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px;">
                    <button class="btn btn-ghost" style="font-size:11px; height:28px; padding:0 10px"
                            onclick="openDrawer('${p.id}'); event.stopPropagation()">
                        📝 Abrir Drawer
                    </button>
                    <button class="btn" style="font-size:11px; height:28px; padding:0 10px; background:var(--amber-dim); color:#92400e; border:1px solid var(--amber)"
                            onclick="printFicha(); event.stopPropagation()">
                        🖨️ Imprimir Ficha
                    </button>
                </div>
                <div class="ficha-setores">${fichaHtml}</div>
            </div>
        </div>`;
}

/** Expands/collapses a production card ficha */
function toggleProducaoCard(id) {
    const ficha = document.getElementById('prod-ficha-' + id);
    const arrow = document.getElementById('prod-arrow-' + id);
    if (!ficha) return;
    const isOpen = ficha.style.display === 'block';
    ficha.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

/**
 * renderProdutoFicha — Renderiza ficha técnica de alta densidade por setores
 */
function renderProdutoFicha(prod, isSubItem = false) {
    const dt = prod.dadosTecnicos || {};
    const parts = dt.parts || {};
    const texts = dt.texts || {};
    const extras = dt.extras || {};
    const uploads = dt.uploads || {};
    const grade = dt.grade || dt.sizes || {};
    const logoPunho = dt.logoPunho || null;
    const p0 = prod;

    // ── Pre-calculate for Grade ────────────────────────────
    const gradeEntries = Object.entries(grade).filter(([, q]) => q > 0);
    const gradeHtml = gradeEntries.length > 0
        ? gradeEntries.map(([sz, qty]) => `<div class="ficha-grade-pill">${sz}<span>${qty}×</span></div>`).join('')
        : `<span style="font-size:13px; font-weight:800; color:var(--text-1)">${p0.tamanho || '—'} × ${p0.quantidade || 1} un.</span>`;

    // ── Pre-calculate for Cores ─────────────────────────────
    const coresHtml = Object.entries(parts).slice(0, 10).map(([k, v]) => {
        const colorName = typeof v === 'object' ? (v.value || v.name || '—') : (v || '—');
        const label = PART_LABEL_MAP?.[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `
            <div class="ficha-setor-row">
                <span class="ficha-setor-key">${label}</span>
                <span class="ficha-setor-val">${colorName}</span>
            </div>`;
    }).join('');

    // ── Pre-calculate for Arte ─────────────────────────────
    const uploadList = Object.entries(uploads).filter(([, d]) => d && d.src);
    const logosHtml = uploadList.length > 0 || logoPunho
        ? `<div class="ficha-logo-row">
            ${uploadList.map(([k, d]) => `<img class="ficha-logo-mini" src="${d.src}" title="${d.filename || k}" onclick="window.open('${d.src}','_blank')">`).join('')}
            ${logoPunho ? `<img class="ficha-logo-mini" src="${logoPunho}" title="Logo Punho" onclick="window.open('${logoPunho}','_blank')">` : ''}
           </div>`
        : '<div style="font-size:11px; color:var(--text-3); margin-top:4px">Nenhuma arte anexada</div>';

    const textsHtml = Object.entries(texts).filter(([, d]) => d.enabled && d.content).map(([k, d]) => `
        <div class="ficha-setor-row">
            <span class="ficha-setor-key">${TEXT_LABEL_MAP?.[k] || k}</span>
            <span class="ficha-setor-val" style="color:var(--amber)">"${d.content}"</span>
        </div>`
    ).join('');

    // ── Pre-calculate for Extras ────────────────────────────
    const extrasHtml = Object.entries(extras).filter(([, d]) => d && d.enabled).map(([k, d]) => `
        <div class="ficha-setor-row">
            <span class="ficha-setor-key">✅ ${EXTRA_LABEL_MAP?.[k] || k}</span>
            <span class="ficha-setor-val">${d.color || 'Sim'}</span>
        </div>`
    ).join('');

    const valorFmt = p0.valor ? `R$ ${parseFloat(p0.valor).toFixed(2).replace('.', ',')}` : '—';
    const sectionClass = isSubItem ? 'drawer-ficha-section' : 'ficha-setor-bloco';
    const titleClass = isSubItem ? 'drawer-ficha-title' : 'ficha-setor-title';

    return `
        <div class="produto-ficha-container ${isSubItem ? 'sub-item' : ''}">
            
            <!-- SECTOR: PREPARAÇÃO -->
            <div class="${sectionClass} setor-preparacao">
                <div class="${titleClass} setor-preparacao">📋 Preparação</div>
                <div class="drawer-ficha-duo">
                    <div class="drawer-ficha-item">
                        <div class="drawer-ficha-item-label">SKU</div>
                        <div class="drawer-ficha-item-value">${p0.sku || '—'}</div>
                    </div>
                    <div class="drawer-ficha-item">
                        <div class="drawer-ficha-item-label">Técnica</div>
                        <div class="drawer-ficha-item-value" style="color:var(--amber)">${p0.tecnica || '—'}</div>
                    </div>
                </div>
                <div class="ficha-setor-row" style="margin-top:4px">
                    <span class="ficha-setor-key">Quantidade Total</span>
                    <span class="ficha-setor-val" style="font-size:14px">${p0.quantidade || 1} un.</span>
                </div>
            </div>

            <!-- SECTOR: SEPARAÇÃO & CORES -->
            <div class="${sectionClass} setor-separacao">
                <div class="${titleClass} setor-separacao">📦 Separação & Grade</div>
                <div class="ficha-grade-compact" style="margin-bottom:12px">${gradeHtml}</div>
                <div class="drawer-ficha-item-label" style="margin-bottom:6px">Definição de Cores</div>
                <div style="background:var(--surface-2); border-radius:6px; padding:4px 12px; border:1px solid var(--border)">
                    ${coresHtml || '<div style="padding:10px; text-align:center; font-size:11px; color:var(--text-3)">Padrão da Peça</div>'}
                </div>
            </div>

            <!-- SECTOR: ARTE & PERSONALIZAÇÃO -->
            <div class="${sectionClass} setor-arte">
                <div class="${titleClass} setor-arte">✒️ Arte & Logos</div>
                ${logosHtml}
                ${textsHtml ? `<div style="margin-top:10px">${textsHtml}</div>` : ''}
            </div>

            <!-- SECTOR: BORDADO -->
            <div class="${sectionClass} setor-bordado">
                <div class="${titleClass} setor-bordado">🧵 Bordado</div>
                ${p0.emb
            ? `<div class="ficha-setor-row">
                        <span class="ficha-setor-key">Arquivo .EMB</span>
                        <span class="ficha-setor-val"><a href="${p0.emb}" target="_blank" class="btn btn-ghost" style="height:24px; padding:0 8px; font-size:10px; color:var(--setor-bordado); border-color:var(--setor-bordado)">Baixar Arquivo</a></span>
                       </div>`
            : '<div style="font-size:11px; color:var(--text-3)">Sem arquivo de bordado específico</div>'}
            </div>

            <!-- SECTOR: COSTURA & EXTRAS -->
            <div class="${sectionClass} setor-costura">
                <div class="${titleClass} setor-costura">✂️ Costura & Extras</div>
                ${extrasHtml || '<div style="font-size:11px; color:var(--text-3)">Nenhum extra selecionado</div>'}
                ${p0.observacoes ? `
                    <div style="margin-top:12px; border-top:1px dashed var(--border); padding-top:10px;">
                        <div class="drawer-ficha-item-label">Observações de Produção</div>
                        <div style="background:var(--amber-dim); padding:10px; border-radius:6px; font-size:12px; color:#92400e; line-height:1.4; border-left:4px solid var(--amber)">
                            ${p0.observacoes}
                        </div>
                    </div>` : ''}
            </div>

            <!-- SECTOR: QUALIDADE & EXPEDIÇÃO -->
            <div class="${sectionClass} setor-expedicao">
                <div class="${titleClass} setor-expedicao">✨ Revisão & Envio</div>
                <div class="drawer-ficha-duo">
                    <div class="drawer-ficha-item">
                        <div class="drawer-ficha-item-label">Valor Unit.</div>
                        <div class="drawer-ficha-item-value" style="color:var(--green)">${valorFmt}</div>
                    </div>
                    <div class="drawer-ficha-item">
                        <div class="drawer-ficha-item-label">Revisão</div>
                        <div class="drawer-ficha-item-value" style="font-size:11px; text-transform:uppercase; color:var(--text-3)">Pendente</div>
                    </div>
                </div>
            </div>

        </div>`;
}

/**
 * renderFichaTecnicaDrawer — Ficha Técnica Completa (drawer tab)
 */
function renderFichaTecnicaDrawer(p) {
    const produtos = p.produtos || [p];
    const numProdutos = produtos.length;
    const etapa = p.etapa || 'Preparação';
    const totalQty = produtos.reduce((a, x) => a + (x.quantidade || 1), 0);
    const etapaCol = ETAPA_COLORS?.[etapa] || '#888';

    return `
        <div class="drawer-ficha-wrap">
            <div style="padding:16px; background:var(--surface); border-bottom:2px solid ${etapaCol}20; display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:8px; background:${etapaCol}15; display:flex; align-items:center; justify-content:center; font-size:18px;">${ETAPA_ICONS?.[etapa] || '📋'}</div>
                    <div>
                        <div style="font-weight:900; font-size:16px">${p.numero}</div>
                        <div style="font-size:11px; color:${etapaCol}; font-weight:800; text-transform:uppercase">${ETAPA_LABELS?.[etapa] || etapa}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:6px;">
                    <div style="background:var(--surface-2); padding:6px 8px; border-radius:4px;">
                        <span style="font-size:9px; color:var(--text-3); font-weight:700;">CLIENTE</span>
                        <div style="font-size:12px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.cliente || '—'}</div>
                    </div>
                    <div style="background:var(--surface-2); padding:6px 8px; border-radius:4px;">
                        <span style="font-size:9px; color:var(--text-3); font-weight:700;">TOTAL</span>
                        <div style="font-size:12px; font-weight:700">${totalQty} un.</div>
                    </div>
                    <div style="background:var(--surface-2); padding:6px 8px; border-radius:4px;">
                        <span style="font-size:9px; color:var(--text-3); font-weight:700;">PRAZO</span>
                        <div style="font-size:12px; font-weight:700">${p.prazo || '—'}</div>
                    </div>
                </div>
            </div>
            <div class="ficha-products-list">
                ${produtos.map((prod, idx) => `
                    <div class="ficha-product-item" style="${numProdutos > 1 ? 'border-bottom:4px solid var(--surface-3);' : ''}">
                        ${numProdutos > 1 ? `
                            <div style="background:var(--surface-2); padding:8px 16px; font-size:10px; font-weight:800; color:var(--text-3); text-transform:uppercase; border-bottom:1px solid var(--border)">
                                Item ${idx + 1} de ${numProdutos}
                            </div>` : ''}
                        ${renderProdutoFicha(prod, true)}
                    </div>
                `).join('')}
            </div>
            <div style="padding:16px; border-top:1px solid var(--border)">
                <button class="btn btn-primary" style="width:100%; height:48px; font-size:14px; font-weight:800;" 
                    onclick="moverEtapa('${p.id}', '${NEXT_ETAPA?.[etapa] || etapa}')">
                    🚀 Próxima Etapa: ${ETAPA_LABELS?.[NEXT_ETAPA?.[etapa]] || 'Concluir'}
                </button>
            </div>
        </div>`;
}

function switchDrawerTab(tabId) {
    if (!selectedId) return;
    drawerTab = tabId;
    const p = PEDIDOS.find(x => x.id.toString() == selectedId.toString());
    if (p) renderDrawer(p);
    renderDrawerTab(p);
    renderDrawerFooter(p);
}

async function sendChat() {
    const input = $('chat-msg-input');
    if (!input || !input.value.trim() || !selectedId) return;
    const texto = input.value.trim();
    input.value = '';
    const op = currentOperador ? currentOperador.nome : 'Sistema';
    await api.sendChat(selectedId, op, texto);
    const p = PEDIDOS.find(x => x.id.toString() == selectedId.toString());
    if (p) renderDrawerTab(p);
}


/**
 * ── Desenvolvimento de Arte Bordado ──────────────
 * View lateral exclusiva solicitada na Phase 3
 */
function renderArteDev() {
    const body = $('arte-dev-body');
    if (!body) return;

    // Filtra pedidos que estão na etapa de 'Arte'
    const pedidosEmArte = PEDIDOS.filter(p => p.etapa === 'Arte');

    if (pedidosEmArte.length === 0) {
        body.innerHTML = `
            <div style="text-align:center; padding:60px; color:var(--text-3);">
                <div style="font-size:64px; margin-bottom:15px; opacity:0.3">✒️</div>
                <div style="font-weight:700; color:var(--text-2); font-size:20px;">Fila de artes vazia</div>
                <p>Nenhum pedido aguarda desenvolvimento de arte no momento.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="margin-bottom:20px; font-size:14px; color:var(--text-2); display:flex; justify-content:space-between; align-items:center;">
            <span><b>Fila de Produção:</b> ${pedidosEmArte.length} pedidos aguardando desenhos ou aprovação de bordado.</span>
            <button class="btn btn-ghost" onclick="renderArteDev()">🔄 Atualizar Fila</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:15px;">
    `;

    pedidosEmArte.forEach(p => {
        const d = p.produtos ? p.produtos[0] : p;
        const dt = d.dadosTecnicos || {};

        // Coleta miniaturas (mockups ou links de cliente)
        let miniSet = [];
        if (d.mockupUrl) miniSet.push(d.mockupUrl);
        if (dt.uploads && dt.uploads.length > 0) {
            dt.uploads.forEach(u => miniSet.push(u.url));
        }
        miniSet = miniSet.slice(0, 4);

        html += `
            <div class="order-card" onclick="openDrawer('${p.id}')" style="cursor:pointer; transition: transform 0.2s; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div>
                        <div style="font-size:10px; color:var(--text-3); font-weight:800; text-transform:uppercase;">PEDIDO #${p.numero}</div>
                        <div style="font-weight:900; font-size:18px; color:var(--blurple);">${p.cliente}</div>
                    </div>
                     <span style="background:var(--blurple-dim); color:var(--blurple); padding:4px 10px; border-radius:12px; font-size:11px; font-weight:900;">${p.tecnica || 'Bordado'}</span>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:15px; overflow-x:auto; padding-bottom:5px;">
                    ${miniSet.map(url => `<img src="${url}" style="width:60px; height:60px; border-radius:6px; object-fit:cover; border:1px solid var(--border); background:white;">`).join('')}
                    ${miniSet.length === 0 ? `<div style="width:60px; height:60px; border-radius:6px; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:10px; text-align:center;">S/ Img Cliente</div>` : ''}
                </div>

                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button class="btn btn-outline" style="flex:1; font-size:11px; padding:8px; font-weight:800;" onclick="event.stopPropagation(); window.open('${p.pdf || '#'}', '_blank')">📑 Abrir PDF</button>
                    <button class="btn" style="flex:1.2; font-size:11px; padding:8px; background:var(--green); color:#000; font-weight:900;" onclick="event.stopPropagation(); openDrawer('${p.id}'); drawerTab='arte'; renderDrawerTab(PEDIDOS.find(x=>x.id==='${p.id}'));">✒️ Ir p/ Arte</button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    body.innerHTML = html;
}

// ── GESTÃO DE PENDÊNCIAS (Módulo Transversal) ──────────────────

const MOTIVOS_PENDENCIA = [
    "Falta de Tecido", "Falta de Elástico", "Falta de Linha",
    "Arte Pendente", "Arte Corrompida", "Erro de Máquina",
    "Dúvida de Cliente", "Dúvida de Vendas", "Descrição Incompleta",
    "Erro de Bordado", "Erro de Costura", "Erro de Expedição"
];

function openPendenciaModal(id) {
    selectedId = id;
    const p = PEDIDOS.find(x => x.id === id);
    if (!p) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'pendencia-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px; padding:25px; border-radius:15px; border:2px solid var(--red);">
            <h2 style="color:var(--red); margin-bottom:15px; display:flex; align-items:center; gap:10px;">
                ⚠️ Marcar Pendência
            </h2>
            <p style="font-size:13px; color:var(--text-3); margin-bottom:20px;">
                O pedido <b>#${p.numero}</b> será bloqueado até que o problema seja resolvido.
            </p>
            
            <div style="margin-bottom:15px;">
                <label style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase;">Motivo da Trava:</label>
                <select class="modal-input" id="pendencia-motivo" style="width:100%; margin-top:5px;">
                    ${MOTIVOS_PENDENCIA.map(m => `<option value="${m}">${m}</option>`).join('')}
                    <option value="outro">+ Outro motivo...</option>
                </select>
                <input type="text" id="pendencia-outro" class="modal-input" placeholder="Especifique o motivo..." style="width:100%; margin-top:8px; display:none;">
            </div>

            <div style="margin-bottom:20px;">
                <label style="font-size:11px; font-weight:800; color:var(--text-3); text-transform:uppercase;">Descrição Detalhada:</label>
                <textarea class="modal-input" id="pendencia-obs" style="width:100%; height:80px; margin-top:5px;" placeholder="Explique o que aconteceu..."></textarea>
            </div>

            <div style="display:flex; gap:10px;">
                <button class="btn btn-outline" style="flex:1" onclick="document.getElementById('pendencia-modal').remove()">Cancelar</button>
                <button class="btn" style="flex:2; background:var(--red); color:white; font-weight:800;" onclick="confirmarPendencia('${id}')">BLOQUEAR PEDIDO</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const select = $('pendencia-motivo');
    const outro = $('pendencia-outro');
    select.addEventListener('change', () => {
        outro.style.display = select.value === 'outro' ? 'block' : 'none';
    });
}

async function confirmarPendencia(id) {
    const p = PEDIDOS.find(x => x.id === id);
    const mSelect = $('pendencia-motivo');
    const mOutro = $('pendencia-outro');
    const motivo = mSelect.value === 'outro' ? mOutro.value : mSelect.value;
    const obs = $('pendencia-obs').value;

    if (!motivo || motivo === 'outro') return alert('Selecione um motivo válido.');

    const info = {
        etapaAnterior: p.etapa,
        motivo: motivo,
        observacao: obs,
        data: new Date().toISOString(),
        operador: currentOperador ? currentOperador.nome : 'Sistema'
    };

    // Salvar no estado local (e futuramente no DB)
    p.pendenciaInfo = info;
    p.alerta = 'Vermelho'; // Força alerta visual

    await executeMove(id, 'Pendencia', p);
    document.getElementById('pendencia-modal').remove();
    alert(`Pedido #${p.numero} marcado como PENDENTE.`);
}

async function retomarPedido(id) {
    const p = PEDIDOS.find(x => x.id === id);
    if (!p || !p.pendenciaInfo) return;

    const etapaDestino = p.pendenciaInfo.etapaAnterior || 'Preparacao';
    delete p.pendenciaInfo;
    p.alerta = 'Verde'; // Reset alerta

    await executeMove(id, etapaDestino, p);
    alert(`Pedido #${p.numero} retomado para a etapa ${etapaDestino}.`);
}

// ── CONSULTA DE STATUS (Cliente) ──────────────────────────────────

function openStatusCheck() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'status-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px; padding:30px; border-radius:20px;">
            <h2 style="margin-bottom:20px; font-weight:800;">🔍 Consultar Status do Pedido</h2>
            <p style="font-size:14px; color:var(--text-3); margin-bottom:20px;">Insira o número do pedido para ver a etapa atual de produção.</p>
            
            <div style="display:flex; gap:10px; margin-bottom:25px;">
                <input type="text" id="status-query" class="modal-input" placeholder="Ex: 54321 ou 54321, 54322" style="flex:1; font-size:16px;">
                <button class="btn" style="background:var(--blurple); color:white; padding:0 25px;" onclick="buscarStatus()">BUSCAR</button>
            </div>

            <div id="status-results" style="max-height:300px; overflow-y:auto; border-radius:10px;">
                <!-- Resultados aqui -->
            </div>
            
            <button class="btn btn-outline" style="width:100%; margin-top:20px;" onclick="document.getElementById('status-modal').remove()">Fechar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function buscarStatus() {
    const query = $('status-query').value;
    const resultsWrap = $('status-results');
    if (!query) return;

    const ids = query.split(/[, ]+/).map(s => s.trim()).filter(s => s);
    let html = '';

    ids.forEach(num => {
        const p = PEDIDOS.find(x => x.numero == num);
        if (p) {
            const label = ETAPA_LABELS[p.etapa] || p.etapa;
            const icon = ETAPA_ICONS[p.etapa] || '📦';
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:var(--surface-2); margin-bottom:8px; border-radius:10px; border:1px solid var(--border);">
                    <div>
                        <div style="font-weight:800; font-size:12px; color:var(--text-3);">PEDIDO #${p.numero}</div>
                        <div style="font-weight:700; font-size:14px;">${p.cliente}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:20px;">${icon}</div>
                        <div style="font-weight:900; font-size:11px; color:var(--blurple); text-transform:uppercase;">${label}</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div style="padding:15px; background:var(--surface-color); margin-bottom:8px; border-radius:10px; border:1px solid var(--red); opacity:0.7;">
                    <div style="font-weight:800; font-size:12px; color:var(--red);">#${num} - NÃO ENCONTRADO</div>
                    <div style="font-size:12px; color:var(--text-3);">Verifique o número ou tente novamente mais tarde.</div>
                </div>
            `;
        }
    });

    resultsWrap.innerHTML = html;
}

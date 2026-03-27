import os

TABS_CODE = """

// ==== DRAWER TAB RENDERERS ====

function today() {
  return new Date().toISOString().slice(0,10);
}

function getStageData(orderId, stage) {
  return (state.stageData[orderId + '-' + stage]) || {};
}

function setStageData(orderId, stage, key, val) {
  const k = orderId + '-' + stage;
  if (!state.stageData[k]) state.stageData[k] = {};
  state.stageData[k][key] = val;
}

function bindStageFormEvents(order, tab) {
  const body = document.getElementById('drawerBody');
  if (!body) return;
  body.querySelectorAll('.field-input').forEach(el => {
    el.addEventListener('change', () => setStageData(order.id, tab, el.name, el.value));
    el.addEventListener('input', () => setStageData(order.id, tab, el.name, el.value));
  });
}

function toggleCheck(el, key, stage, orderId) {
  el.classList.toggle('checked');
  setStageData(orderId, stage, key, el.classList.contains('checked'));
}

function tabResumo(order) {
  const items = order.items || [];
  const sla = slaLevel(order.data_entrega);
  const info = etapaInfo(order.etapa_atual);
  const pends = (state.pendencias[order.id]||[]).filter(p=>p.status==='open');
  let html = '<div class="detail-section">';
  html += '<div class="detail-section-title">Dados Gerais</div>';
  html += '<div class="detail-grid">';
  html += '<div class="detail-item"><div class="detail-item-label">Cliente</div><div class="detail-item-value" style="font-weight:700">' + (order.cliente||'--') + '</div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Pedido</div><div class="detail-item-value"><span class="prod-num">' + (order.numero_pedido||'--') + '</span></div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Entrega</div><div class="detail-item-value">' + fmt(order.data_entrega) + '</div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">SLA</div><div class="detail-item-value"><span class="sla-badge ' + sla.cls + '">' + sla.key + '</span></div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Etapa</div><div class="detail-item-value"><span class="etapa-badge" style="background:' + info.color + '20;color:' + info.color + ';border:1px solid ' + info.color + '40;">' + info.icon + ' ' + order.etapa_atual + '</span></div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Prioridade</div><div class="detail-item-value">' + (order.prioridade||'Normal') + '</div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Operador</div><div class="detail-item-value">' + (order.operador_atual||'--') + '</div></div>';
  html += '<div class="detail-item"><div class="detail-item-label">Criado</div><div class="detail-item-value">' + fmtDT(order.created_at) + '</div></div>';
  if (order.observacoes) html += '<div class="detail-item full"><div class="detail-item-label">Obs</div><div class="obs-destaque">' + order.observacoes + '</div></div>';
  html += '</div></div>';
  if (pends.length) {
    html += '<div class="detail-section" style="background:var(--red-dim);border-left:4px solid var(--red);">';
    html += '<div class="detail-section-title" style="color:var(--red);">Pendencias (' + pends.length + ')</div>';
    pends.forEach(p => { html += '<div class="pendencia-log-item"><span class="pendencia-log-badge open">' + (p.tipo||'Pend') + '</span><span>' + (p.descricao||'--') + '</span></div>'; });
    html += '</div>';
  }
  html += '<div class="detail-section"><div class="detail-section-title">Itens (' + items.length + ')</div>';
  items.forEach((it,i) => {
    html += '<div class="item-card" style="margin-bottom:8px;">';
    html += '<div class="item-card-header" onclick="this.closest(\\'.item-card\\').classList.toggle(\\'expanded\\')">';
    html += '<div style="display:flex;align-items:center;gap:10px;"><div class="item-card-num">' + (i+1) + '</div>';
    html += '<div><div style="font-size:13px;font-weight:700;">' + (it.sku||'--') + ' x' + (it.quantidade||0) + '</div>';
    html += '<div style="font-size:11px;color:var(--text-3);">' + (it.modelo||'') + '</div></div></div>';
    html += '<svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';
    html += '</div><div class="item-card-body">' + renderFichaTecnica(it, order) + '</div></div>';
  });
  html += '</div>';
  return html;
}

function renderFichaTecnica(item, order) {
  const cores = item.cores || {};
  const grade = item.grade || {};
  const logos = item.logos || {};
  let html = '<div class="ficha-setor-bloco setor-separacao"><div class="ficha-setor-title">Tecido / Cores</div>';
  const ce = Object.entries(cores);
  if (ce.length) {
    ce.forEach(([k,v]) => {
      const hex = (v&&v.hex)||v||'#888';
      const nome = (v&&v.nome)||v||k;
      html += '<div class="color-swatch-row" onclick="showColorModal(\\'' + hex + '\\',\\'' + k + '\\',\\'' + nome + '\\')">';
      html += '<div class="color-dot" style="background:' + hex + ';"></div>';
      html += '<div style="flex:1"><div class="color-swatch-name">' + nome + '</div><div class="color-swatch-hex">' + hex + '</div><div class="color-swatch-part">' + k + '</div></div>';
      html += '<div class="color-fullscreen-btn">Ver Cor</div></div>';
    });
  } else { html += '<div style="color:var(--text-3);font-size:12px;">Sem cores cadastradas</div>'; }
  html += '</div>';
  const ge = Object.entries(grade);
  html += '<div class="ficha-setor-bloco setor-preparacao"><div class="ficha-setor-title">Grade de Tamanhos</div><div class="ficha-grade-compact">';
  if (ge.length) { ge.forEach(([t,q]) => { html += '<span class="ficha-grade-pill">' + t + ' <span>x' + q + '</span></span>'; }); }
  else { html += '<span style="color:var(--text-3);font-size:12px;">Sem grade</span>'; }
  html += '</div></div>';
  const le = Object.entries(logos);
  if (le.length) {
    html += '<div class="ficha-setor-bloco setor-arte"><div class="ficha-setor-title">Logos / Artes</div><div class="ficha-logo-row">';
    le.forEach(([z,u]) => { html += '<img src="' + u + '" alt="' + z + '" class="ficha-logo-mini" title="' + z + '" onclick="showImgModal(\\'' + u + '\\')">'; });
    html += '</div></div>';
  }
  return html;
}

function tabPreparacao(order) {
  const d = getStageData(order.id, 'preparacao');
  const opNome = d.op_nome || (state.currentUser && state.currentUser.name) || '';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-preparacao);">Preparacao do Pedido</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Operador <span class="req">*</span></div><input class="field-input" name="op_nome" value="' + opNome + '" placeholder="Nome"></div>' +
    '<div class="field-group"><div class="field-label">Data Entrada <span class="req">*</span></div><input type="date" class="field-input" name="data_entrada_setor" value="' + (d.data_entrada_setor||today()) + '"></div></div>' +
    '<div class="field-group"><div class="field-label">Prioridade</div>' +
    '<select class="field-input" name="prioridade_confirmada"><option value="NORMAL">Normal</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div>' +
    '<textarea class="field-input field-textarea" name="obs_preparacao" placeholder="Notas...">' + (d.obs_preparacao||'') + '</textarea></div></div>';
}

function tabSeparacao(order) {
  const d = getStageData(order.id, 'separacao');
  const items = order.items || [];
  const opSep = d.op_separacao || (state.currentUser && state.currentUser.name) || '';
  let colorsHtml = '';
  items.forEach((it,idx) => {
    const cores = it.cores || {};
    const ce = Object.entries(cores);
    colorsHtml += '<div style="margin-bottom:10px;padding:10px;background:var(--surface-2);border-radius:6px;border:1px solid var(--border);">';
    colorsHtml += '<div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:6px;">' + (it.sku||'Produto '+(idx+1)) + '</div>';
    if (ce.length) {
      ce.forEach(([k,v]) => {
        const hex=(v&&v.hex)||v||'#888'; const nome=(v&&v.nome)||v||k;
        colorsHtml += '<div class="color-swatch-row" onclick="showColorModal(\\'' + hex + '\\',\\'' + k + '\\',\\'' + nome + '\\')">';
        colorsHtml += '<div class="color-dot" style="background:' + hex + ';"></div>';
        colorsHtml += '<div style="flex:1"><div class="color-swatch-name">' + nome + '</div><div class="color-swatch-hex">' + hex + '</div></div>';
        colorsHtml += '<div class="color-fullscreen-btn">Ver</div></div>';
      });
    } else { colorsHtml += '<div style="color:var(--text-3);font-size:12px;">Sem cores</div>'; }
    colorsHtml += '</div>';
  });
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-separacao);">Separacao de Materiais</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Operador <span class="req">*</span></div><input class="field-input" name="op_separacao" value="' + opSep + '"></div>' +
    '<div class="field-group"><div class="field-label">Tecido Confirmado <span class="req">*</span></div>' +
    '<select class="field-input" name="tecido_confirmado"><option value="">Selecionar...</option><option value="sim">OK</option><option value="nao">Aguardando</option><option value="parcial">Parcial</option></select></div></div>' +
    '<div class="field-group"><div class="field-label">Conferencia de Cores</div>' + colorsHtml + '</div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div>' +
    '<textarea class="field-input field-textarea" name="obs_separacao">' + (d.obs_separacao||'') + '</textarea></div></div>';
}

function tabArte(order) {
  const d = getStageData(order.id, 'arte');
  const opArte = d.op_arte || (state.currentUser && state.currentUser.name) || '';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-arte);">Desenvolvimento de Arte</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Artista <span class="req">*</span></div><input class="field-input" name="op_arte" value="' + opArte + '"></div>' +
    '<div class="field-group"><div class="field-label">Status <span class="req">*</span></div>' +
    '<select class="field-input" name="status_arte"><option value="">Selecionar...</option><option value="pendente">Pendente</option><option value="em_andamento">Em Andamento</option><option value="aprovado_interno">Aprovado Internamente</option><option value="aguardando_cliente">Aguardando Cliente</option><option value="aprovado_cliente">Aprovado pelo Cliente</option></select></div></div>' +
    '<div class="field-group"><div class="field-label">Link Arquivo Final</div><input class="field-input" name="link_arte_final" value="' + (d.link_arte_final||'') + '" placeholder="https://drive.google.com/..."></div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div><textarea class="field-input field-textarea" name="obs_arte">' + (d.obs_arte||'') + '</textarea></div></div>';
}

function tabBordado(order) {
  const d = getStageData(order.id, 'bordado');
  const opBord = d.op_bordado || (state.currentUser && state.currentUser.name) || '';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-bordado);">Bordado</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Operador <span class="req">*</span></div><input class="field-input" name="op_bordado" value="' + opBord + '"></div>' +
    '<div class="field-group"><div class="field-label">Maquina <span class="req">*</span></div>' +
    '<select class="field-input" name="maquina_id"><option value="">Selecionar...</option><option value="M01">Maquina 01</option><option value="M02">Maquina 02</option><option value="M03">Maquina 03</option><option value="M04">Maquina 04</option></select></div></div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Data Inicio <span class="req">*</span></div><input type="date" class="field-input" name="data_inicio_bordado" value="' + (d.data_inicio_bordado||today()) + '"></div>' +
    '<div class="field-group"><div class="field-label">N Pontos</div><input type="number" class="field-input" name="pontos_bordado" value="' + (d.pontos_bordado||'') + '" placeholder="Ex: 12500"></div></div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div><textarea class="field-input field-textarea" name="obs_bordado">' + (d.obs_bordado||'') + '</textarea></div></div>';
}

function tabCostura(order) {
  const d = getStageData(order.id, 'costura');
  const opCost = d.op_costura || (state.currentUser && state.currentUser.name) || '';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-costura);">Costura e Montagem</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Operador <span class="req">*</span></div><input class="field-input" name="op_costura" value="' + opCost + '"></div>' +
    '<div class="field-group"><div class="field-label">Data Inicio <span class="req">*</span></div><input type="date" class="field-input" name="data_inicio_costura" value="' + (d.data_inicio_costura||today()) + '"></div></div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Qtd Produzida</div><input type="number" class="field-input" name="qtd_produzida_costura" value="' + (d.qtd_produzida_costura||'') + '"></div>' +
    '<div class="field-group"><div class="field-label">Qtd Refugo</div><input type="number" class="field-input" name="qtd_refugo_costura" value="' + (d.qtd_refugo_costura||'') + '"></div></div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div><textarea class="field-input field-textarea" name="obs_costura">' + (d.obs_costura||'') + '</textarea></div></div>';
}

function tabQualidade(order) {
  const d = getStageData(order.id, 'qualidade');
  const opQual = d.op_qualidade || (state.currentUser && state.currentUser.name) || '';
  const mockupHtml = order.renders ?
    '<img src="' + order.renders + '" style="max-width:100%;max-height:180px;cursor:pointer;" onclick="showImgModal(\\'' + order.renders + '\\')">' :
    '<div class="camera-placeholder">Sem mockup</div>';
  const fotoHtml = d.foto_produto ?
    '<img src="' + d.foto_produto + '" style="max-width:100%;max-height:180px;">' :
    '<div class="camera-placeholder">Sem foto ainda</div>';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-qualidade);">Controle de Qualidade</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Inspetor <span class="req">*</span></div><input class="field-input" name="op_qualidade" value="' + opQual + '"></div>' +
    '<div class="field-group"><div class="field-label">Resultado <span class="req">*</span></div>' +
    '<select class="field-input" name="resultado_qualidade"><option value="">Selecionar...</option><option value="aprovado">Aprovado</option><option value="reprovado">Reprovado</option><option value="aprovado_ressalvas">Aprovado c/ Ressalvas</option></select></div></div>' +
    '<div class="field-group"><div class="detail-section-title" style="margin-bottom:10px;">Mockup vs Produto Final</div>' +
    '<div class="split-screen">' +
    '<div class="split-panel"><div class="split-panel-header original">Mockup Original</div><div class="split-panel-body">' + mockupHtml + '</div></div>' +
    '<div class="split-panel"><div class="split-panel-header photo">Foto do Produto</div><div class="split-panel-body">' + fotoHtml + '</div></div>' +
    '</div></div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Qtd Aprovada</div><input type="number" class="field-input" name="qtd_aprovada" value="' + (d.qtd_aprovada||'') + '"></div>' +
    '<div class="field-group"><div class="field-label">Qtd Reprovada</div><input type="number" class="field-input" name="qtd_reprovada" value="' + (d.qtd_reprovada||'') + '"></div></div>' +
    '<div class="field-group"><div class="field-label">Nao Conformidades</div><textarea class="field-input field-textarea" name="nao_conformidades">' + (d.nao_conformidades||'') + '</textarea></div></div>';
}

function tabExpedicao(order) {
  const d = getStageData(order.id, 'expedicao');
  const opExp = d.op_expedicao || (state.currentUser && state.currentUser.name) || '';
  return '<div class="stage-form">' +
    '<div class="stage-form-title" style="color:var(--etapa-expedicao);">Expedicao e Entrega</div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Responsavel <span class="req">*</span></div><input class="field-input" name="op_expedicao" value="' + opExp + '"></div>' +
    '<div class="field-group"><div class="field-label">Data Expedicao <span class="req">*</span></div><input type="date" class="field-input" name="data_expedicao" value="' + (d.data_expedicao||today()) + '"></div></div>' +
    '<div class="field-row">' +
    '<div class="field-group"><div class="field-label">Transportadora</div>' +
    '<select class="field-input" name="transportadora"><option value="Retirada">Retirada</option><option value="Correios">Correios</option><option value="Loggi">Loggi</option><option value="Motoboy">Motoboy</option></select></div>' +
    '<div class="field-group"><div class="field-label">Cod Rastreamento <span class="req">*</span></div><input class="field-input" name="cod_rastreamento" value="' + (d.cod_rastreamento||'') + '" placeholder="Ex: BR123456789BR"></div></div>' +
    '<div class="field-group"><div class="field-label">Observacoes</div><textarea class="field-input field-textarea" name="obs_expedicao">' + (d.obs_expedicao||'') + '</textarea></div>' +
    '<div style="padding:14px;background:var(--green-dim);border:1px solid var(--green);border-radius:6px;margin-top:16px;text-align:center;">' +
    '<div style="font-size:20px;">&#x1F3C1;</div><div style="font-weight:800;color:#15803d;">Pedido pronto para expedicao!</div></div></div>';
}

function tabHistorico(order) {
  const hist = order.historico || order.history || [];
  if (!hist.length) return '<div style="padding:40px;text-align:center;color:var(--text-3);">Sem historico.</div>';
  let html = '<div class="detail-section"><div class="detail-section-title">Linha do Tempo</div><div class="timeline">';
  hist.forEach((h,i) => {
    const isDone = i < hist.length - 1;
    const isCurrent = i === hist.length - 1;
    const info = etapaInfo(h.etapa);
    html += '<div class="timeline-item">';
    html += '<div class="timeline-dot ' + (isDone?'done':'') + ' ' + (isCurrent?'current':'') + '">' + (isDone?'&#x2713;':info.icon) + '</div>';
    html += '<div class="timeline-content"><div class="timeline-stage">' + info.icon + ' ' + (h.etapa||'--') + '</div>';
    html += '<div class="timeline-meta">' + (h.operador||'--') + ' - ' + fmtDT(h.data_entrada) + '</div>';
    if (h.obs) html += '<div style="font-size:11px;color:var(--text-2);font-style:italic;">' + h.obs + '</div>';
    html += '</div></div>';
  });
  html += '</div></div>';
  return html;
}

function tabChat(order) {
  const msgs = state.chatMsgs[order.id] || [];
  const myName = state.currentUser && state.currentUser.name;
  let html = '<div style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;" id="chatMessages">';
  if (msgs.length) {
    msgs.forEach(m => {
      const mine = m.author === myName;
      html += '<div class="chat-bubble ' + (mine?'mine':'') + '">';
      html += '<div class="chat-avatar">' + initials(m.author) + '</div>';
      html += '<div class="chat-msg-wrap"><div class="chat-who">' + m.author + ' - ' + fmtDT(m.ts) + '</div>';
      html += '<div class="chat-text">' + m.text + '</div></div></div>';
    });
  } else { html += '<div style="text-align:center;color:var(--text-3);padding:30px;">Sem mensagens ainda.</div>'; }
  html += '</div>';
  html += '<div class="chat-input-row">';
  html += '<input type="text" class="chat-input" id="chatInput" placeholder="Escreva..." onkeydown="if(event.key===\\'Enter\\'){sendChatMsg(\\''+order.id+'\\')}">'; 
  html += '<button class="chat-send" onclick="sendChatMsg(\\''+order.id+'\\')">';
  html += '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>';
  html += '</button></div>';
  return html;
}

function sendChatMsg(orderId) {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;
  if (!state.chatMsgs[orderId]) state.chatMsgs[orderId] = [];
  state.chatMsgs[orderId].push({
    author: (state.currentUser&&state.currentUser.name)||'Anonimo',
    text: input.value.trim(),
    ts: new Date().toISOString()
  });
  input.value = '';
  const order = state.orders.find(o=>o.id===orderId);
  if (order) renderDrawerTab('chat', order);
}
"""

with open('app.js', 'a', encoding='utf-8') as f:
    f.write(TABS_CODE)

print('TABS_CODE appended successfully')

/**
 * Lógica de Negócio - Administrador de Pedidos
 */

const STORAGE_KEY = 'hnt_all_orders_db';
window.ORDERS_STORAGE_KEY = STORAGE_KEY;

function loadAdminDashboard() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const tableBody = document.getElementById('orders-table-body');
    const emptyState = document.getElementById('empty-state');

    // Stats
    let totalPieces = 0;
    let totalValue = 0;

    tableBody.innerHTML = '';

    if (history.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        updateStats(0, 0, 0);
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // --- GROUPING LOGIC (Using V2 Keys) ---
    const groups = {};
    const getGroupKey = (order) => {
        // V2 Key: ID_PEDIDO
        if (order.ID_PEDIDO && order.ID_PEDIDO !== 'LEGACY') return order.ID_PEDIDO;
        // Fallback for old data or no ID
        const client = order.CLIENTE_NOME || 'Cliente';
        return client.trim().toLowerCase();
    };

    history.forEach((order, index) => {
        let data = order;
        if (!data || Object.keys(data).length === 0) return;

        let qty = data.QTD_TOTAL || data.item?.qty_total || 0;
        let val = data.VAL_FINAL_TOTAL || data.item?.pricing?.total_price || 0;

        data._index = index;

        const key = getGroupKey(data);
        if (!groups[key]) {
            groups[key] = {
                id: key,
                displayId: data.ID_PEDIDO || data.order_id || 'N/A',
                clientName: data.CLIENTE_NOME || data.client_info?.name || 'Cliente Sem Nome',
                phone: data.CLIENTE_TEL || data.client_info?.phone || '',
                date: new Date(data.DATA_CRIACAO || data.created_at || Date.now()),
                items: [],
                totalVal: 0,
                totalQty: 0,
                status: data.SITUACAO || 'Produção'
            };
        }
        groups[key].items.push(data);
        groups[key].totalVal += val;
        groups[key].totalQty += qty;

        totalPieces += qty;
        totalValue += val;
    });

    allGroups = Object.values(groups).sort((a, b) => b.date - a.date);

    allGroups.forEach(group => {
        renderGroupRow(group, tableBody);
    });

    updateStats(allGroups.length, totalPieces, totalValue);
}

window.deleteGroup = function (id) {
    if (!confirm('ATENÇÃO: Isso excluirá o pedido inteiro e todos os itens dele. Continuar?')) return;

    let history = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (id && id !== 'undefined') {
        history = history.filter(h => h.order_id !== id);
    } else {
        history = history.filter(h => {
            const key = (h.order_id && h.order_id !== 'LEGACY') ? h.order_id : (h.client_info?.name || 'Cliente').trim().toLowerCase();
            return key !== id;
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadAdminDashboard();
};

window.restoreOrder = function (orderId) {
    if (!confirm(`Deseja restaurar o pedido ${orderId} para edição no simulador?`)) return;

    if (typeof DatabaseManager === 'undefined') {
        alert("Erro: Módulo DatabaseManager não carregado.");
        return;
    }

    const db = DatabaseManager.loadDatabase();
    const order = db.find(r => r.ID_PEDIDO === orderId);

    if (!order) {
        alert("Erro: Pedido não encontrado no banco de dados local.");
        return;
    }

    if (!order.DADOS_TECNICOS_JSON) {
        alert("Atenção: Este pedido não possui dados técnicos salvos para restauração (Legado).");
        return;
    }

    try {
        const technicalData = JSON.parse(order.DADOS_TECNICOS_JSON);

        // Normalize Product Type for URL mapping
        const productType = (order.TIPO_PRODUTO || order.PRODUTO_TIPO || "").trim().toLowerCase();
        let targetUrl = "";

        if (productType.includes("shorts") && productType.includes("legging")) targetUrl = "IndexShortsLegging.html";
        else if (productType.includes("fight") || productType === "shorts") targetUrl = "IndexFightShorts.html";
        else if (productType.includes("top")) targetUrl = "IndexTop.html";
        else if (productType.includes("legging")) targetUrl = "IndexCalcaLegging.html";
        else if (productType.includes("moletom")) targetUrl = "IndexMoletom.html";

        if (!targetUrl) {
            alert(`Erro: Tipo de produto desconhecido para redirecionamento: ${productType}`);
            return;
        }

        // Save to Restore Buffer
        localStorage.setItem('hnt_restore_buffer', JSON.stringify({
            simulationId: order.ID_SIMULACAO,
            orderId: orderId,
            state: technicalData
        }));

        // Redirect
        window.open(targetUrl, '_blank');

    } catch (e) {
        console.error("Erro ao restaurar pedido:", e);
        alert("Erro ao restaurar: " + e.message);
    }
};

window.filterTable = function (text) {
    const val = text.toLowerCase();
    const rows = document.querySelectorAll('.main-row');
    rows.forEach(row => {
        const content = row.innerText.toLowerCase();
        if (content.includes(val)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

window.generateAndLoadDemoData = function () {
    const clients = [
        { name: "Academia Iron Berg", phone: "(11) 98888-7777", email: "contato@ironberg.com" },
        { name: "CrossFit Alpha", phone: "(21) 99999-5555", email: "financeiro@cfalpha.com.br" },
        { name: "Team Nogueira Matriz", phone: "(11) 97777-1234", email: "compras@teamnogueira.com" },
        { name: "Arena Fight Club", phone: "(41) 98881-2222", email: "arena@fightclub.com" },
        { name: "CT Champions", phone: "(31) 99111-4444", email: "mestre@champions.com" }
    ];
    const products = ["SHORTS", "TOP", "LEGGING", "MOLETOM"];
    const colors = ["Preto", "Branco", "Vermelho", "Azul Escuro", "Rosa Pink", "Verde Bandeira"];

    const demoData = [];
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 1; i <= 5; i++) {
        const orderId = `HNT-DEMO-2026-${String(i).padStart(3, '0')}`;
        const client = clients[i - 1];
        const numItems = randInt(3, 5);

        for (let j = 1; j <= numItems; j++) {
            const prodType = rand(products);
            const qty = randInt(10, 50);
            const price = 150;
            const total = qty * price;
            const chosenColor = rand(colors);

            const simType = prodType.toLowerCase();
            const mockState = {
                simulationId: `${orderId}-${j}`,
                orderNumber: orderId,
                sizes: { "M": Math.floor(qty / 2), "G": Math.ceil(qty / 2) },
                parts: { "cor_principal": { value: chosenColor, hex: "#000" } },
                uploads: {},
                texts: {},
                pricing: { total_price: total },
                client_info: { name: client.name, phone: client.phone },
                simulator_type: simType
            };

            const row = {
                ID_PEDIDO: orderId,
                ID_SIMULACAO: `${orderId}-${j}`,
                TIPO_PRODUTO: prodType,
                DATA_CRIACAO: new Date().toISOString(),
                SITUACAO: "Em Produção",
                CLIENTE_NOME: client.name,
                CLIENTE_TEL: client.phone,
                CLIENTE_EMAIL: client.email,
                OBS_GERAL: "Demo gerada via Admin Dashboard",
                COR_BASE: chosenColor,
                QTD_TOTAL: qty,
                VAL_FINAL_TOTAL: total,
                VAL_UNIT_BASE: price,
                DADOS_TECNICOS_JSON: JSON.stringify(mockState)
            };
            demoData.push(row);
        }
    }

    if (typeof DatabaseManager !== 'undefined') {
        DatabaseManager.saveDatabase(demoData);
        alert(`✅ ${demoData.length} itens de demonstração REGERADOS!\nA página será recarregada.`);
        location.reload();
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
        alert("✅ Dados salvos via localStorage direto. Recarregando...");
        location.reload();
    }
};

window.setupSSE = function () {
    console.log("📡 Iniciando conexão de eventos em tempo real...");
    const eventSource = new EventSource('http://localhost:3000/api/updates');

    eventSource.onmessage = (event) => {
        if (event.data === 'update') {
            console.log("⚡ Mudança detectada no Excel! Atualizando painel...");
            if (typeof DatabaseManager !== 'undefined') {
                DatabaseManager.loadFromServer({ silent: true, reload: false }).then(data => {
                    if (data) {
                        loadAdminDashboard();
                        console.log("✅ Dados sincronizados automaticamente.");
                    }
                });
            }
        }
    };

    eventSource.onerror = (err) => {
        console.warn("⚠️ Conexão SSE falhou. O sistema tentará reconectar automaticamente.", err);
    };
};

window.loadFinancialAnalysisData = function () {
    if (typeof FinancialManager === 'undefined') return;

    const costs = FinancialManager.loadProductionCosts();
    const taxes = costs.taxes || {};

    const taxInput = document.getElementById('tax-percent');
    if (taxInput) taxInput.value = taxes.percentual || 0;

    const fixedCosts = taxes.fixedCosts || {};
    if (document.getElementById('cost-embalagens')) document.getElementById('cost-embalagens').value = fixedCosts.embalagens || 0;
    if (document.getElementById('cost-etiquetas')) document.getElementById('cost-etiquetas').value = fixedCosts.etiquetas || 0;
    if (document.getElementById('cost-mao-de-obra')) document.getElementById('cost-mao-de-obra').value = fixedCosts.maoDeObra || 0;
    if (document.getElementById('cost-frete')) document.getElementById('cost-frete').value = fixedCosts.frete || 0;
    if (document.getElementById('cost-outros')) document.getElementById('cost-outros').value = fixedCosts.outros || 0;
};

window.updateFinancialAnalysis = function () {
    if (typeof FinancialManager === 'undefined') return;

    const costs = FinancialManager.loadProductionCosts();

    costs.taxes = {
        percentual: parseFloat(document.getElementById('tax-percent').value) || 0,
        fixedCosts: {
            embalagens: parseFloat(document.getElementById('cost-embalagens').value) || 0,
            etiquetas: parseFloat(document.getElementById('cost-etiquetas').value) || 0,
            maoDeObra: parseFloat(document.getElementById('cost-mao-de-obra').value) || 0,
            frete: parseFloat(document.getElementById('cost-frete').value) || 0,
            outros: parseFloat(document.getElementById('cost-outros').value) || 0
        }
    };

    FinancialManager.saveProductionCosts(costs);

    const revenueStr = document.getElementById('st-value').innerText.replace('R$', '').replace(/\./g, '').replace(',', '.');
    const totalRevenue = parseFloat(revenueStr) || 0;
    const totalQuantity = parseInt(document.getElementById('st-pieces').innerText) || 0;

    const taxValue = (totalRevenue * costs.taxes.percentual) / 100;
    const totalFixedCosts = Object.values(costs.taxes.fixedCosts).reduce((sum, val) => sum + val, 0);

    const taxDisplay = document.getElementById('tax-value-display');
    if (taxDisplay) taxDisplay.innerHTML = `Valor: ${FinancialManager.formatCurrency(taxValue)}`;

    const totalCosts = taxValue + totalFixedCosts;
    const netMargin = totalRevenue - totalCosts;
    const netMarginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    const summaryHtml = `
        <div style="background:#252525; padding:15px; border-radius:6px; border-left:4px solid #4CAF50;">
            <div style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Faturamento Total</div>
            <div style="font-size:1.5rem; color:#4CAF50; font-weight:bold;">${FinancialManager.formatCurrency(totalRevenue)}</div>
        </div>
        
        <div style="background:#252525; padding:15px; border-radius:6px; border-left:4px solid #FF9800;">
            <div style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Total de Impostos</div>
            <div style="font-size:1.2rem; color:#FF9800; font-weight:bold;">${FinancialManager.formatCurrency(taxValue)}</div>
            <div style="font-size:0.75rem; color:#666; margin-top:3px;">${FinancialManager.formatPercent(costs.taxes.percentual)} do faturamento</div>
        </div>
        
        <div style="background:#252525; padding:15px; border-radius:6px; border-left:4px solid #FF9800;">
            <div style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Custos Operacionais</div>
            <div style="font-size:1.2rem; color:#FF9800; font-weight:bold;">${FinancialManager.formatCurrency(totalFixedCosts)}</div>
            <div style="font-size:0.7rem; color:#666; margin-top:5px;">
                Embalagens: ${FinancialManager.formatCurrency(costs.taxes.fixedCosts.embalagens)}<br>
                Etiquetas: ${FinancialManager.formatCurrency(costs.taxes.fixedCosts.etiquetas)}<br>
                Mão de Obra: ${FinancialManager.formatCurrency(costs.taxes.fixedCosts.maoDeObra)}<br>
                Frete: ${FinancialManager.formatCurrency(costs.taxes.fixedCosts.frete)}<br>
                Outros: ${FinancialManager.formatCurrency(costs.taxes.fixedCosts.outros)}
            </div>
        </div>
        
        <div style="background:#252525; padding:15px; border-radius:6px; border-left:4px solid #ff4d4d;">
            <div style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:5px;">Total de Custos</div>
            <div style="font-size:1.2rem; color:#ff4d4d; font-weight:bold;">${FinancialManager.formatCurrency(totalCosts)}</div>
        </div>
        
        <div style="background:${netMargin >= 0 ? '#1b5e20' : '#b71c1c'}; padding:20px; border-radius:6px; border:2px solid ${netMargin >= 0 ? '#4CAF50' : '#ff4d4d'};">
            <div style="font-size:0.85rem; color:#fff; text-transform:uppercase; margin-bottom:8px; font-weight:600;">💎 Lucro Líquido Estimado</div>
            <div style="font-size:2rem; color:#fff; font-weight:bold; margin-bottom:5px;">${FinancialManager.formatCurrency(netMargin)}</div>
            <div style="font-size:1rem; color:${netMargin >= 0 ? '#a5d6a7' : '#ef9a9a'}; font-weight:600;">
                Margem: ${FinancialManager.formatPercent(netMarginPercent)}
            </div>
            ${totalQuantity > 0 ? `<div style="font-size:0.85rem; color:#fff; margin-top:8px; opacity:0.9;">
                Lucro por peça: ${FinancialManager.formatCurrency(netMargin / totalQuantity)}
            </div>` : ''}
        </div>
        
        <div style="background:rgba(212,175,55,0.1); padding:12px; border-radius:6px; border-left:3px solid var(--gold);">
            <p style="margin:0; font-size:0.75rem; color:#ddd; line-height:1.5;">
                ⚠️ <strong>Nota:</strong> Esta análise considera apenas impostos e custos operacionais fixos. 
                Para uma análise completa, acesse a aba "Financeiro" de cada produto para incluir custos de produção específicos.
            </p>
        </div>
    `;

    const summaryContainer = document.getElementById('financial-summary');
    if (summaryContainer) summaryContainer.innerHTML = summaryHtml;
};

window.updateProductionCost = function (productType, field, value) {
    if (typeof FinancialManager === 'undefined') return;

    const costs = FinancialManager.loadProductionCosts();
    if (!costs[productType]) costs[productType] = {};

    costs[productType][field] = parseFloat(value) || 0;

    if (FinancialManager.saveProductionCosts(costs)) {
        loadAdminDashboard();
    }
};

/**
 * Cart Controller Module
 * Handles business logic, data management, and events for the Cart Dashboard.
 * Relies on window.CartUI for rendering.
 */

const STORAGE_KEY = 'hnt_all_orders_db';

/**
 * Global Controller for the Cart Dashboard
 */
window.CartController = {
    /**
     * Switch between main tabs (Identification, Cart, Production, Financial)
     */
    switchMainTab: function (tabId, btn) {
        // Update Buttons
        document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Update Content
        document.querySelectorAll('.main-tab-content').forEach(c => c.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');

        // Trigger updates based on tab
        if (tabId === 'tab-production') this.renderProductionSummary();
        if (tabId === 'tab-financial') this.renderFinancialSummary();
    },

    /**
     * Consolidates all pieces from all items in the cart
     */
    renderProductionSummary: function () {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const container = document.getElementById('production-summary-container');
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = '<p style="color:#666; font-style:italic;">Nenhum item no carrinho.</p>';
            return;
        }

        const summary = {};
        history.forEach(order => {
            if (!order.item) return;
            const name = window.CartUI.getProductName(order.item, order);
            if (!summary[name]) summary[name] = {};

            const sizes = order.item.specs?.sizes || {};
            Object.entries(sizes).forEach(([size, qty]) => {
                if (qty > 0) {
                    summary[name][size] = (summary[name][size] || 0) + parseInt(qty);
                }
            });
        });

        let html = '<div style="display:grid; gap:20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">';
        Object.entries(summary).forEach(([model, sizes]) => {
            const totalModel = Object.values(sizes).reduce((a, b) => a + b, 0);
            html += `
                <div class="card-dark" style="padding:20px; border-top: 3px solid var(--accent-blue);">
                    <div style="font-family:'Bebas Neue'; font-size:1.4rem; color:var(--gold); margin-bottom:15px;">${model}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                        ${Object.entries(sizes).map(([s, q]) => `
                            <div style="background:#222; padding:10px; border-radius:6px; min-width:60px; text-align:center; border:1px solid #333;">
                                <div style="font-size:0.75rem; color:#666;">${s}</div>
                                <div style="font-size:1.2rem; font-weight:bold; color:#fff;">${q}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top:20px; padding-top:15px; border-top:1px solid #222; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#666; font-size:0.8rem;">TOTAL DO MODELO</span>
                        <span style="font-size:1.3rem; font-weight:bold; color:var(--accent-blue);">${totalModel} pçs</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    /**
     * Renders a consolidated financial view
     */
    renderFinancialSummary: function () {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const container = document.getElementById('financial-summary-container');
        if (!container) return;

        let totalValue = 0;
        let totalPieces = 0;
        let totalDiscounts = 0;
        let totalFees = 0;

        history.forEach(o => {
            if (o.item) {
                totalValue += (o.item.pricing?.total_price || 0);
                totalPieces += (o.item.qty_total || 0);
                if (o.item.pricing?.breakdown) {
                    totalDiscounts += (o.item.pricing.breakdown.discounts || 0);
                    totalFees += (o.item.pricing.breakdown.dev_fees || 0);
                }
            }
        });

        container.innerHTML = `
            <div class="card-dark" style="max-width: 600px; margin: 0 auto; border-left: 5px solid var(--accent-blue);">
                <div style="margin-bottom:25px;">
                    <div style="color:#666; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">SUBTOTAL BRUTO</div>
                    <div style="font-size:1.5rem; color:#fff;">${(totalValue + totalDiscounts - totalFees).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px; padding:20px 0; border-top:1px solid #222; border-bottom:1px solid #222;">
                    <div>
                        <div style="color:#666; font-size:0.7rem; text-transform:uppercase;">TOTAL DESCONTOS</div>
                        <div style="color:#28a745; font-weight:bold;">- ${totalDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                    <div>
                        <div style="color:#666; font-size:0.7rem; text-transform:uppercase;">TOTAL TAXAS (MATRIZ)</div>
                        <div style="color:#ffa500; font-weight:bold;">+ ${totalFees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                </div>
                <div style="background:var(--accent-blue); color:#000; padding:25px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-family:'Bebas Neue'; font-size:1.1rem; letter-spacing:1px; opacity:0.8;">TOTAL FINAL DO PEDIDO</div>
                        <div style="font-size:0.85rem; opacity:0.7;">Para ${totalPieces} peças customizadas</div>
                    </div>
                    <div style="font-size:2.2rem; font-weight:bold; font-family:'Outfit';">
                        ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sincronizar com Supabase antes de carregar
    if (typeof SupabaseAdapter !== 'undefined') {
        const pedidos = await SupabaseAdapter.getPedidos();
        if (pedidos && pedidos.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
        }
    }
    loadDashboard();

    // Eventos (Fallbacks para botões suprimidos)
    const btnClear = document.getElementById('btn-clear-all');
    const btnExport = document.getElementById('btn-export-all');
    if (btnClear) btnClear.onclick = clearAll;
    if (btnExport) btnExport.onclick = exportExcel;
});

function loadDashboard() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    const container = document.getElementById('orders-list');

    // Stats
    let totalItems = history.length;
    let totalPieces = 0;
    let totalValue = 0;

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Seu carrinho está vazio</h2>
                <p>Nenhuma simulação encontrada no Banco de Dados local.</p>
                <br>
                <a href="IndexFightShorts.html" class="btn btn-primary" style="text-decoration:none">Novo Short</a>
                <a href="IndexTop.html" class="btn btn-primary" style="text-decoration:none; margin-left:10px;">Novo Top</a>
            </div>`;
        updateStats(0, 0, 0);
        return;
    }

    container.innerHTML = '';

    // --- GROUPING LOGIC ---
    const groups = {};

    // Grouping by Client Name (normalized)
    const getGroupKey = (order) => {
        const client = order.client_info?.name || 'Cliente';
        return client.trim().toLowerCase();
    };

    history.forEach((order, index) => {
        let data = order;

        // --- NORMALIZAÇÃO DE CAMPOS (Supabase → UI) ---
        // A tabela real utiliza nomes que podem vir em UPPER ou lower case dependendo do client
        // Normalizamos tudo para o padrão esperado pelo CartUI
        if (!data.pdfUrl) data.pdfUrl = data.pdf_url || data.PDF_URL;
        if (!data.created_at) data.created_at = data.criado_em || data.CRIADO_EM;
        if (!data.order_id) data.order_id = data.ID_PEDIDO || data.id_pedido;

        // Normalização do Cliente
        if (!data.client_info) {
            data.client_info = {
                name: data.NOME_CLIENTE || data.nome_cliente || 'Cliente',
                phone: data.TELEFONE_CLIENTE || data.telefone_cliente || ''
            };
        }

        // Preço e Quantidade (Case Insensitive e fallback robusto para estruturas planas ou aninhadas)
        const dbPrice = parseFloat(data.PRECO_FINAL || data.preco_final || data.total_price || data.item?.pricing?.total_price || 0);
        const dbQty = parseInt(data.QUANTIDADE || data.quantidade || data.item?.qty_total || 1);
        const dbUnitPrice = parseFloat(data.PRECO_UNITARIO || data.preco_unitario || data.item?.pricing?.unit_price || 0);

        if (data.DADOS_TECNICOS_JSON === undefined && (data.json_tec || data.JSON_TEC)) {
            const jtec = data.json_tec || data.JSON_TEC;
            data.DADOS_TECNICOS_JSON = typeof jtec === 'string' ? jtec : JSON.stringify(jtec);
        }

        // CRITICAL FIX: If item is missing but we have technical data, reconstruct the item
        if (!data.item && data.DADOS_TECNICOS_JSON) {
            try {
                const originalPdfUrl = data.pdfUrl;
                const technicalData = (typeof data.DADOS_TECNICOS_JSON === 'string')
                    ? JSON.parse(data.DADOS_TECNICOS_JSON)
                    : data.DADOS_TECNICOS_JSON;

                // Preço unitário fallback (se houver total e quantidade)
                const unitPriceFallback = dbPrice > 0 ? (dbPrice / dbQty) : 0;

                // Reconstruct the 'item' structure expected by the rest of the logic and CartUI
                data.item = {
                    simulator_type: technicalData.productInitial ? "shorts" : (technicalData.simulator_type || "shorts"),
                    model_name: technicalData.productInitial ? "Shorts " + technicalData.productInitial : (technicalData.model_name || "Simulação"),
                    qty_total: dbQty,
                    pricing: {
                        total_price: dbPrice || (technicalData.pricing ? technicalData.pricing.total_price : 0),
                        unit_price: dbUnitPrice || (technicalData.pricing ? technicalData.pricing.unit_price : unitPriceFallback)
                    },
                    specs: {
                        parts: technicalData.parts || {},
                        sizes: technicalData.sizes || {},
                        uploads: technicalData.uploads || {},
                        texts: technicalData.texts || {},
                        observations: technicalData.observations || ""
                    },
                    pdf_path: originalPdfUrl || ""
                };

                // Ensure basic record fields if missing
                if (!data.order_id) data.order_id = technicalData.simulationId || technicalData.orderNumber || `PEDIDO_${index}`;
                if (!data.created_at) data.created_at = new Date().toISOString();
            } catch (e) {
                console.error('Error parsing DADOS_TECNICOS_JSON:', e);
                return; // Skip this item
            }
        }

        // --- PDF LINK RESILIENCE ---
        // If still no PDF link but we have an order_id, try to predict it (fallback legacy)
        if (!data.pdfUrl && (!data.item || !data.item.pdf_path) && data.order_id) {
            // Only predict if NOT in production (local dev path)
            const fileName = `Pedido_${data.order_id}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
            const predictedUrl = `assets/BancoDados/PedidosPDF/${fileName}`;
            console.log(`🔍 Predicting local PDF link for ${data.order_id}: ${predictedUrl}`);
            if (data.item) data.item.pdf_path = predictedUrl;
            data.pdfUrl = predictedUrl;
        }

        // Debug Log for PDF link tracking
        if (data.pdfUrl || (data.item && data.item.pdf_path)) {
            console.log(`📄 PDF found for order ${data.order_id || index}:`, data.pdfUrl || (data.item ? data.item.pdf_path : ''));
        }



        // Legacy conversion if needed
        if (!data.item && Array.isArray(order)) data = convertLegacyData(order);
        if (!data || !data.item) return;

        // Add original index for updates
        data._index = index;

        const key = getGroupKey(data);
        if (!groups[key]) {
            groups[key] = {
                clientName: data.client_info?.name || 'Cliente',
                phone: data.client_info?.phone || '',
                items: [],
                totalVal: 0,
                totalQty: 0
            };
        }
        groups[key].items.push(data);
        groups[key].totalVal += (data.item.pricing?.total_price || 0);
        groups[key].totalQty += (data.item.qty_total || 0);

        // Globals
        totalPieces += (data.item.qty_total || 0);
        totalValue += (data.item.pricing?.total_price || 0);
    });

    // Render each Group using CartUI
    if (window.CartUI) {
        Object.values(groups).forEach(group => {
            const card = window.CartUI.createGroupCard(group);
            container.appendChild(card);
        });
    } else {
        console.error("CartUI module not found!");
        container.innerHTML = "<div style='color:red; text-align:center;'>Erro: Módulo CartUI não carregado.</div>";
    }

    updateStats(totalItems, totalPieces, totalValue);
}

function updateStats(items, pieces, value) {
    const elCount = document.getElementById('st-count');
    const elPieces = document.getElementById('st-pieces');
    const elTotal = document.getElementById('st-total');

    if (elCount) elCount.innerText = items;
    if (elPieces) elPieces.innerText = pieces;
    if (elTotal) elTotal.innerText = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


// --- GLOBAL ACTIONS ---

function applyGlobalInfo() {
    const globalId = document.getElementById('global-order-id').value;
    const globalName = document.getElementById('global-client-name').value;
    const globalPhone = document.getElementById('global-client-phone').value;

    if (!globalId && !globalName && !globalPhone) {
        alert("Preencha pelo menos um campo para aplicar.");
        return;
    }

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.forEach(item => {
        if (globalId) item.order_id = globalId;
        if (!item.client_info) item.client_info = {};

        if (globalName) item.client_info.name = globalName;
        if (globalPhone) item.client_info.phone = globalPhone;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    alert("Informações aplicadas a todos os itens!");
    location.reload();
}

async function deleteGroup(indices) {
    if (!confirm('Deseja excluir este pedido completo e todos os seus itens (Local e no Banco de Dados)?')) return;

    let history = JSON.parse(localStorage.getItem(STORAGE_KEY));

    // --- SUPABASE SYNC ---
    if (typeof SupabaseAdapter !== 'undefined') {
        try {
            const idsToDelete = indices.map(idx => history[idx]?.order_id || history[idx]?.ID_PEDIDO).filter(id => !!id);
            if (idsToDelete.length > 0) {
                console.log('🗑️ Excluindo grupo de pedidos do Supabase:', idsToDelete);
                await SupabaseAdapter.deletePedidos(idsToDelete);
            }
        } catch (e) {
            console.error('Erro ao excluir grupo do Supabase:', e);
        }
    }
    // ---------------------

    // Remove indices in descending order to avoid shift issues
    const sortedIndices = indices.sort((a, b) => b - a);
    sortedIndices.forEach(idx => history.splice(idx, 1));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadDashboard();
}

function updateClientData(index, field, value) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (history[index]) {
        if (!history[index].client_info) history[index].client_info = {};
        history[index].client_info[field] = value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

function saveCartChanges() {
    alert('Alterações salvas!');
    loadDashboard();
}

async function deleteOrder(index) {
    if (!confirm('⚠️ Tem certeza que deseja excluir este item?')) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    const order = history[index];
    const orderId = order?.order_id || order?.ID_PEDIDO;

    // --- SUPABASE SYNC ---
    if (orderId && typeof SupabaseAdapter !== 'undefined') {
        await SupabaseAdapter.deletePedido(orderId);
    }
    // ---------------------

    history.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadDashboard();
}

/**
 * Edita um pedido existente
 * Redireciona para o simulador com o estado carregado
 */
function editOrder(index) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const order = history[index];

    if (!order) {
        alert('❌ Pedido não encontrado!');
        return;
    }

    // Determinar o simulador correto baseado no tipo de produto
    const simulatorMap = {
        'SHORTS': 'IndexFightShorts.html',
        'TOP': 'IndexTop.html',
        'LEGGING': 'IndexCalcaLegging.html',
        'CALCA_LEGGING': 'IndexCalcaLegging.html',
        'MOLETOM': 'IndexMoletom.html',
        'SHORTS_LEGGING': 'IndexShortsLegging.html'
    };

    // Tentar obter o tipo de produto de várias fontes
    const productType = order.TIPO_PRODUTO || order.item?.simulator_type || order.item?.model_name;

    // Normalizar o tipo de produto
    let normalizedType = productType;
    if (productType && typeof productType === 'string') {
        const upperType = productType.toUpperCase();
        if (upperType.includes('SHORTS') && upperType.includes('LEGGING')) {
            normalizedType = 'SHORTS_LEGGING';
        } else if (upperType.includes('CALCA') || upperType.includes('CALÇA')) {
            normalizedType = 'CALCA_LEGGING';
        } else if (upperType.includes('SHORTS')) {
            normalizedType = 'SHORTS';
        } else if (upperType.includes('TOP')) {
            normalizedType = 'TOP';
        } else if (upperType.includes('LEGGING')) {
            normalizedType = 'LEGGING';
        } else if (upperType.includes('MOLETOM')) {
            normalizedType = 'MOLETOM';
        }
    }

    const simulatorPage = simulatorMap[normalizedType];

    if (!simulatorPage) {
        alert(`❌ Tipo de produto não reconhecido: ${productType}\n\nPor favor, entre em contato com o suporte.`);
        console.error('Tipo de produto não mapeado:', productType, order);
        return;
    }

    // Salvar índice para edição (será usado pelo simulador)
    localStorage.setItem('editingOrderIndex', index);

    console.log(`✏️ Editando pedido #${index} - Tipo: ${normalizedType} - Redirecionando para: ${simulatorPage}`);

    // Redirecionar para o simulador
    window.location.href = simulatorPage;
}


async function clearAll() {
    if (!confirm('Deseja limpar TODO o histórico de pedidos (Local e no Banco de Dados)?')) return;

    // --- SUPABASE SYNC ---
    if (typeof SupabaseAdapter !== 'undefined') {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const history = raw ? JSON.parse(raw) : [];
            const ids = history.map(o => o.order_id || o.ID_PEDIDO).filter(id => !!id);

            if (ids.length > 0) {
                console.log('🗑️ Excluindo todos os pedidos do Supabase...');
                await SupabaseAdapter.deletePedidos(ids);
            }
        } catch (e) {
            console.error('Erro ao excluir pedidos do Supabase durante limpeza total:', e);
        }
    }
    // ---------------------

    localStorage.removeItem(STORAGE_KEY);
    loadDashboard();
}

// --- LEGACY ADAPTER ---
function convertLegacyData(rowArray) {
    // Tries to map the old Array format to new Object format temporarily
    return {
        order_id: rowArray[0] || 'LEGACY',
        created_at: new Date().toISOString(),
        client_info: { name: rowArray[1] || 'Antigo', phone: rowArray[3] || '' },
        item: {
            model_name: rowArray[5] || 'Produto Antigo',
            qty_total: 1,
            pricing: { total_price: 0 },
            specs: { parts: {}, sizes: {} } // Empty
        }
    };
}

// --- EXCEL EXPORT (Updated) ---
function exportExcel() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (history.length === 0) return alert('Nada para exportar.');

    // Flatten Data for Excel
    const rows = history.map(h => {
        const item = h.item;
        return {
            "ID Pedido": h.order_id,
            "Data": new Date(h.created_at).toLocaleDateString(),
            "Cliente": h.client_info.name,
            "Telefone": h.client_info.phone,
            "Email": h.client_info.email,
            "Produto": window.CartUI ? window.CartUI.getProductName(item, h) : (item.model_name || 'Produto'),
            "Qtde Total": item.qty_total,
            "Preço Total": item.pricing.total_price,
            "Tamanhos": JSON.stringify(item.specs.sizes).replace(/[\{\}"]/g, '').replace(/,/g, ', '),
            "Cores/Partes": JSON.stringify(item.specs.parts).replace(/[\{\}"]/g, ''),
            "Textos": item.specs.texts.map(t => `${t.zone_label}: ${t.content}`).join('; ')
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos Hanuthai");
    XLSX.writeFile(wb, "Pedidos_Consolidados_Hanuthai.xlsx");
}

// Expose functions globally for legacy inline calls (onclick="...")
window.loadDashboard = loadDashboard;
window.applyGlobalInfo = applyGlobalInfo;
window.deleteGroup = deleteGroup;
window.updateClientData = updateClientData;
window.deleteOrder = deleteOrder;
window.editOrder = editOrder;
window.clearAll = clearAll;
window.exportExcel = exportExcel;

/**
 * Cart Controller Module
 * Handles business logic, data management, and events for the Cart Dashboard.
 * Relies on window.CartUI for rendering.
 */

const STORAGE_KEY = 'hnt_all_orders_db';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sincronizar com Supabase antes de carregar
    if (typeof SupabaseAdapter !== 'undefined') {
        const pedidos = await SupabaseAdapter.getPedidos();
        if (pedidos && pedidos.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
        }
    }
    loadDashboard();

    // 2. Atualizar UI se o cliente estiver logado/cadastrado
    const profileStr = localStorage.getItem('hnt_customer_profile');
    if (profileStr) {
        try {
            const profile = JSON.parse(profileStr);
            const linkCadastro = document.getElementById('link-cadastro');
            if (linkCadastro) {
                linkCadastro.innerHTML = `👤 Olá, ${profile.name.split(' ')[0]} (Ver Cadastro)`;
                linkCadastro.title = "Cadastro Vinculado. ID: " + (profile.clientId || '...');
            }
        } catch (e) { }
    }

    document.getElementById('btn-clear-all').onclick = clearAll;
    document.getElementById('btn-export-all').onclick = exportExcel;
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
        // A tabela real usa: criado_em, ID_PEDIDO, pdf_url
        // A UI espera:       created_at, order_id,  pdfUrl
        if (data.pdf_url && !data.pdfUrl) data.pdfUrl = data.pdf_url;
        if (data.criado_em && !data.created_at) data.created_at = data.criado_em;
        if (data.ID_PEDIDO && !data.order_id) data.order_id = data.ID_PEDIDO;
        if (data.DADOS_TECNICOS_JSON === undefined && data.json_tec) {
            // json_tec is the Supabase column for technical data (already parsed jsonb)
            data.DADOS_TECNICOS_JSON = typeof data.json_tec === 'string'
                ? data.json_tec
                : JSON.stringify(data.json_tec);
        }

        // CRITICAL FIX: If item is missing but we have technical data, reconstruct the item
        if (!data.item && data.DADOS_TECNICOS_JSON) {
            try {
                const originalPdfUrl = data.pdfUrl || data.pdf_url; // Preserve top-level PDF link (both formats)
                const technicalData = (typeof data.DADOS_TECNICOS_JSON === 'string')
                    ? JSON.parse(data.DADOS_TECNICOS_JSON)
                    : data.DADOS_TECNICOS_JSON;

                // Reconstruct the 'item' structure expected by the rest of the logic and CartUI
                data.item = {
                    simulator_type: technicalData.productInitial ? "shorts" : (technicalData.simulator_type || "shorts"),
                    model_name: technicalData.productInitial ? "Shorts " + technicalData.productInitial : (technicalData.model_name || "Simulação"),
                    qty_total: technicalData.qty_total || data.QUANTIDADE || data.quantity || 1,
                    pricing: {
                        total_price: data.PRECO_FINAL || data.total_price || (technicalData.pricing ? technicalData.pricing.total_price : 0),
                        unit_price: data.PRECO_UNITARIO || (technicalData.pricing ? technicalData.pricing.unit_price : 0)
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

                // Ensure basic record fields
                if (!data.order_id) data.order_id = technicalData.simulationId || technicalData.orderNumber || `PEDIDO_${index}`;
                if (!data.created_at) data.created_at = new Date().toISOString();
                if (originalPdfUrl) data.pdfUrl = originalPdfUrl;
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

function deleteGroup(indices) {
    if (!confirm('Deseja excluir este pedido completo e todos os seus itens?')) return;

    let history = JSON.parse(localStorage.getItem(STORAGE_KEY));
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
    if (!confirm('Deseja limpar TODO o histórico de pedidos?')) return;

    // --- SUPABASE SYNC (DANGEROUS BUT FOR USER CONVENIENCE) ---
    // If we wanted to clear everything from Supabase, we'd need a bulk delete.
    // For now, we clear local and user can re-sync if they want.
    // Alternatively, we could delete all rows matching a criteria.
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

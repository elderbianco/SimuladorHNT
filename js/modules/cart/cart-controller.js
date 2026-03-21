/**
 * Cart Controller Module
 * Handles business logic, data management, and events for the Cart Dashboard.
 * Relies on window.CartUI for rendering.
 */

const STORAGE_KEY = 'hnt_all_orders_db';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sincronizar com Supabase antes de carregar (MESCLANDO em vez de sobrescrever)
    // --- SYNC COM SERVER (Opcional & Non-blocking) ---
    if (typeof SupabaseAdapter !== 'undefined') {
        console.log('🔄 Sincronizando com Supabase em segundo plano...');

        const runBackgroundSync = async () => {
            try {
                // Timeout para não travar o dashboard se o Supabase demorar
                const serverPedidos = await Promise.race([
                    SupabaseAdapter.getPedidos(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase')), 5000))
                ]);

                const localRaw = localStorage.getItem(STORAGE_KEY);
                let localPedidos = localRaw ? JSON.parse(localRaw) : [];

                if (serverPedidos && serverPedidos.length > 0) {
                    const merged = [...serverPedidos];
                    let addedLocally = 0;

                    localPedidos.forEach(localItem => {
                        const localId = localItem.order_id || localItem.ID_PEDIDO || localItem.ID_SIMULACAO;
                        if (!localId) return;

                        const exists = serverPedidos.some(s => {
                            const sId = String(s.order_id || s.ID_PEDIDO || s.ID_SIMULACAO || '');
                            const lId = String(localId);
                            return sId === lId || (lId.split('-')[0] === sId && sId.length >= 4);
                        });

                        if (!exists) {
                            merged.push(localItem);
                            addedLocally++;
                        }
                    });

                    console.log(`✅ Sincronização background concluída. Total: ${merged.length}`);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                    loadDashboard(); // Recarrega para mostrar novidades se houver
                }
            } catch (e) {
                console.warn('⚠️ Sincronização background falhou ou demorou demais:', e.message);
            }
        };

        runBackgroundSync();
    } else {
        console.warn('⚠️ SupabaseAdapter não encontrado.');
    }

    // Auto-init dashboard
    try {
        await loadDashboard();
    } catch (e) {
        console.error('❌ Erro fatal ao carregar dashboard:', e);
    }

    // 2. Atualizar UI se o cliente estiver logado/cadastrado - OPERAÇÃO INDEPENDENTE
    try {
        const profileStr = localStorage.getItem('hnt_customer_profile');
        if (profileStr) {
            const profile = JSON.parse(profileStr);
            console.log('👤 Perfil detectado:', profile.name);

            const linkCadastro = document.getElementById('link-cadastro');
            if (linkCadastro) {
                linkCadastro.innerHTML = `👤 Olá, ${profile.name.split(' ')[0]} (Ver Cadastro)`;
                linkCadastro.title = "Cadastro Vinculado. ID: " + (profile.clientId || '...');
            }
        }
    } catch (e) {
        console.warn('⚠️ Falha ao processar perfil no cart-controller:', e);
    }

    const btnClear = document.getElementById('btn-clear-all');
    if (btnClear) btnClear.onclick = clearAll;

    const btnExport = document.getElementById('btn-export-all');
    if (btnExport) btnExport.onclick = exportExcel;
});

function loadDashboard() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    console.log(`📊 loadDashboard: Iniciando com ${history.length} itens no storage.`);

    const container = document.getElementById('orders-list');

    // Stats
    let totalItems = history.length;
    let totalPieces = 0;
    let totalValue = 0;

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Seu carrinho está vazio</h2>
                <p>Nenhuma simulação encontrada no Banco de Dados local ou servidor.</p>
                <br>
                <a href="IndexFightShorts.html" class="btn btn-primary" style="text-decoration:none">Novo Short</a>
                <a href="IndexTop.html" class="btn btn-primary" style="text-decoration:none; margin-left:10px;">Novo Top</a>
            </div>`;
        updateStats(0, 0, 0);
        return;
    }

    container.innerHTML = '';

    // --- GROUPING LOGIC ---
    let profile = null;
    const groups = {};
    try {
        const pStr = localStorage.getItem('hnt_customer_profile');
        if (pStr) profile = JSON.parse(pStr);
    } catch (e) { }

    const getGroupKey = (order) => {
        const name = order.client_info?.name || order.client_name;
        const profileName = profile?.name;

        // Se o nome no pedido for 'Cliente' (padrão) ou vazio, tenta usar o do perfil cadastrado
        const finalName = (name && name !== 'Cliente' && name !== '') ? name : (profileName || 'Cliente');
        return finalName.trim().toLowerCase();
    };

    history.forEach((order, index) => {
        let data = order;

        // --- NORMALIZAÇÃO DE CAMPOS (Supabase/Legacy → UI) ---
        // Se vier do Supabase (json_tec) ou formatado (DADOS_TECNICOS_JSON)
        const techDataRaw = data.DADOS_TECNICOS_JSON || data.json_tec;

        if (!data.item && techDataRaw) {
            try {
                const technicalData = (typeof techDataRaw === 'string') ? JSON.parse(techDataRaw) : techDataRaw;

                // Se o technicalData já tiver o objeto 'item' (formato novo completo)
                if (technicalData && technicalData.item) {
                    data.item = technicalData.item;
                    if (!data.order_id) data.order_id = technicalData.order_id;
                    if (!data.created_at) data.created_at = technicalData.created_at;
                } else {
                    // Re-mapear campos de topo se estiver no formato Supabase (ID_PEDIDO, etc)
                    const finalId = data.ID_PEDIDO || data.ID_SIMULACAO || technicalData.simulationId || technicalData.order_id || `PEDIDO_${index}`;
                    const finalName = data.NOME_CLIENTE || data.client_name || profile?.name || 'Cliente';
                    const finalQty = data.QUANTIDADE || data.quantity || technicalData.qty_total || 1;
                    const finalPrice = data.PRECO_FINAL || data.total_price || (technicalData.pricing ? technicalData.pricing.total_price : 0);
                    const finalDate = data.criado_em || data.DATA_CRIACAO || data.created_at || new Date().toISOString();
                    const finalPdf = data.pdf_url || data.pdfUrl || data.PDF_URL || "";

                    // Reconstruir o item para o CartUI
                    const partsArr = {};
                    if (technicalData.parts) {
                        Object.entries(technicalData.parts).forEach(([k, v]) => {
                            const colorVal = (typeof v === 'object' && v !== null) ? (v.value || v.name || 'N/A') : (v || 'N/A');
                            const colorHex = (typeof v === 'object' && v !== null) ? (v.hex || '#333') : '#333';
                            partsArr[k] = { value: colorVal, hex: colorHex };
                        });
                    }

                    const uploadsArr = [];
                    if (technicalData.uploads) {
                        Object.entries(technicalData.uploads).forEach(([id, u]) => {
                            if (u && (u.src || u.filename || u.file_url)) {
                                uploadsArr.push({
                                    zone_id: id,
                                    zone_label: u.zone_label || id.replace(/_/g, ' ').toUpperCase(),
                                    file_name: u.file_name || u.filename || 'Imagem',
                                    file_url: u.file_url || u.src,
                                    is_custom: u.is_custom !== undefined ? u.is_custom : (u.isCustom || false)
                                });
                            }
                        });
                    }

                    const textsArr = [];
                    if (technicalData.texts) {
                        Object.entries(technicalData.texts).forEach(([id, t]) => {
                            if (t && t.enabled && t.content) {
                                textsArr.push({
                                    zone_id: id,
                                    zone_label: t.zone_label || id.replace(/_/g, ' ').toUpperCase(),
                                    content: t.content,
                                    color: t.color,
                                    font_family: t.fontFamily || t.font_family
                                });
                            }
                        });
                    }

                    const initialMap = { 'SH': 'shorts', 'TP': 'top', 'LG': 'legging', 'ML': 'moletom', 'SL': 'shorts_legging', 'CL': 'calca_legging' };
                    const detectedType = technicalData.productType || technicalData.simulator_type || (technicalData.productInitial ? (initialMap[technicalData.productInitial] || "shorts") : "shorts");

                    data.item = {
                        simulator_type: detectedType,
                        model_name: technicalData.model_name || technicalData.product_type || (technicalData.productInitial ? (initialMap[technicalData.productInitial] || "Simulação") : "Simulação"),
                        qty_total: finalQty,
                        pricing: {
                            total_price: finalPrice,
                            unit_price: data.PRECO_UNITARIO || data.unit_price || (technicalData.pricing ? technicalData.pricing.unit_price : (finalPrice / finalQty))
                        },
                        specs: {
                            parts: partsArr,
                            sizes: technicalData.sizes || {},
                            uploads: uploadsArr,
                            texts: textsArr,
                            orderNumber: technicalData.orderNumber || "",
                            observations: data.observations || data.observacoes || technicalData.observations || ""
                        },
                        pdf_path: finalPdf
                    };

                    data.order_id = finalId;
                    data.client_name = finalName;
                    data.quantity = finalQty;
                    data.total_price = finalPrice;
                    data.created_at = finalDate;
                    data.pdfUrl = finalPdf;
                }
            } catch (e) {
                console.error('❌ Erro na reconstrução do item:', e, data);
            }
        }

        // --- BACKUP NORMALIZATION ---
        if (!data.order_id) data.order_id = data.ID_PEDIDO || `PEDIDO_${index}`;
        if (!data.created_at) data.created_at = data.criado_em || data.DATA_CRIACAO || new Date().toISOString();
        if (!data.client_info) {
            data.client_info = {
                name: data.client_name || data.NOME_CLIENTE || (profile?.name) || 'Cliente',
                phone: data.client_phone || data.TELEFONE_CLIENTE || (profile?.whatsapp || profile?.phone) || '',
                email: data.client_email || profile?.email || ''
            };
        }

        // Legacy conversion if needed
        if (!data.item && Array.isArray(order)) {
            console.log(`📦 Item no índice ${index} parece ser legado (Array). Convertendo...`);
            data = convertLegacyData(order);
        }

        if (!data || !data.item) {
            console.error(`❌ Falha crítica ao processar item no índice ${index}: Estrutura inválida ou item ausente.`, data);

            // Tentativa de recuperação mínima
            if (data && (data.ID_PEDIDO || data.order_id)) {
                console.warn(`🔍 Tentando recuperação mínima para o item ${data.ID_PEDIDO || data.order_id}`);
                data.item = data.item || {
                    simulator_type: 'Produto',
                    model_name: 'Recuperado',
                    qty_total: data.QUANTIDADE || 1,
                    pricing: { total_price: data.PRECO_FINAL || 0 },
                    specs: { parts: {}, sizes: {}, uploads: [], texts: [] }
                };
            } else {
                return;
            }
        }

        // Add original index for updates
        data._index = index;

        const key = getGroupKey(data);
        if (!groups[key]) {
            groups[key] = {
                clientName: data.client_info.name || 'Cliente',
                phone: data.client_info.phone || '',
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

    // Floating Bar Sync
    const checkoutContainer = document.getElementById('checkout-container');
    const finalTotalEl = document.getElementById('final-checkout-total');
    const btnTopCheckout = document.getElementById('btn-top-checkout');

    if (items > 0) {
        if (checkoutContainer) checkoutContainer.style.display = 'block';
        if (btnTopCheckout) btnTopCheckout.style.display = 'flex';
        if (finalTotalEl) finalTotalEl.innerText = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else {
        if (checkoutContainer) checkoutContainer.style.display = 'none';
        if (btnTopCheckout) btnTopCheckout.style.display = 'none';
    }
}

async function goToPayment() {
    // Basic verification: customer info is essential for payment
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    // Check if we have at least one item
    if (history.length === 0) {
        alert("Adicione itens ao carrinho para prosseguir.");
        return;
    }

    // Check if customer profile exists (from registration)
    const profile = localStorage.getItem('hnt_customer_profile');
    if (!profile) {
        if (confirm("Você ainda não completou seu cadastro. Deseja fazer isso agora para garantir a entrega?")) {
            window.location.href = "indexCadastro.html?redirect=IndexPedidoSimulador.html";
            return;
        }
    }

    // Prossiga para pagamento
    console.log("🚀 Redirecionando para checkout...");
    window.location.href = "payment.html";
}


// --- GLOBAL ACTIONS ---

// (Removido applyGlobalInfo porque os inputs globais foram retirados da UI do carrinho)

async function deleteGroup(indices) {
    if (!confirm('Deseja excluir este pedido completo e todos os seus itens?')) return;

    let history = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const toDeleteIds = indices.map(idx => history[idx]?.order_id || history[idx]?.ID_PEDIDO).filter(id => id);

    // --- SUPABASE SYNC ---
    if (toDeleteIds.length > 0 && typeof SupabaseAdapter !== 'undefined') {
        try {
            await SupabaseAdapter.deletePedidos(toDeleteIds);
        } catch (e) {
            console.error('Erro ao excluir grupo no Supabase:', e);
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
    if (!confirm('Deseja limpar TODO o histórico de pedidos? Isso removerá os dados permanentemente do servidor.')) return;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const history = raw ? JSON.parse(raw) : [];

        // --- SUPABASE SYNC ---
        if (history.length > 0 && typeof SupabaseAdapter !== 'undefined') {
            const orderIds = history.map(h => h.order_id || h.ID_PEDIDO).filter(id => id);
            if (orderIds.length > 0) {
                await SupabaseAdapter.deletePedidos(orderIds);
            }
        }
        // ---------------------

        localStorage.removeItem(STORAGE_KEY);
        loadDashboard();
    } catch (e) {
        console.error('Erro ao limpar tudo:', e);
        alert('Erro ao limpar o histórico no servidor. Tente novamente.');
    }
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
window.deleteGroup = deleteGroup;
window.updateClientData = updateClientData;
window.deleteOrder = deleteOrder;
window.editOrder = editOrder;
window.clearAll = clearAll;
window.exportExcel = exportExcel;

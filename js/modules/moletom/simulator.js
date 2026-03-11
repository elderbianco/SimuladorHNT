/**
 * Simulador Moletom - Hanuthai (Orquestrador)
 */

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    console.log("Maestro: Iniciando Simulador Moletom...");

    initDataCache();
    loadAdminConfig();
    loadState();
    state.isLocked = false;

    // Restoration Override
    if (typeof checkForRestoration === 'function') {
        checkForRestoration();
    }

    // Auto-fetch sequence
    if (!state.orderNumber) {
        fetch('/api/next-order-id')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (d.number) {
                    state.orderNumber = d.number.toString();
                    state.simulationId = getFormattedId();
                    saveState();
                    renderControls();
                }
            })
            .catch(e => console.warn('Seq API fail (expected if server is offline):', e.message));
    }

    initLayers();
    setColor(state.color || 'branco');

    renderControls();
    renderFixedTexts();
    const pricing = calculateFullPrice();
    updatePrice(pricing);
    updateCartCount();

    if (typeof PDFGenerator !== 'undefined') {
        PDFGenerator.prepareDraft(state, pricing, CONFIG);
    }

    setupViewportPan();
    setupGlobalDrag();

    // Zoom Inicial
    const applyInitialZoom = () => {
        if (window.innerWidth <= 768) {
            currentZoom = 1.30; // Aumentado para o mobile
        } else {
            currentZoom = 1.50; // Reduzido levemente no desktop
        }
        state.zoom = currentZoom;
        panOffset = { x: 0, y: 0 };
        if (typeof applyZoomAndPan === 'function') applyZoomAndPan();
    };

    applyInitialZoom();
    window.addEventListener('resize', applyInitialZoom);

    // 8. VERIFICAR MODO DE EDIÇÃO
    const editingIndex = localStorage.getItem('editingOrderIndex');
    if (editingIndex !== null) {
        console.log('✏️ Detectado modo de edição - Carregando estado...');
        setTimeout(() => {
            const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
            const orderToEdit = history[editingIndex];

            if (orderToEdit && orderToEdit.DADOS_TECNICOS_JSON) {
                try {
                    const savedState = JSON.parse(orderToEdit.DADOS_TECNICOS_JSON);
                    const currentConfig = state.config;
                    Object.assign(state, savedState);
                    if (currentConfig) state.config = currentConfig;

                    state._editingIndex = parseInt(editingIndex);
                    state._editingOrderId = orderToEdit.order_id || orderToEdit.ID_PEDIDO;
                    localStorage.removeItem('editingOrderIndex');

                    // --- RECONSTRUTOR DE ELEMENTOS (Imagens) ---
                    if (state.uploads) {
                        Object.keys(state.uploads).forEach(zoneId => {
                            const up = state.uploads[zoneId];
                            if (up && up.src) {
                                console.log(`RE-ADD: Reconstruindo imagem para zona: ${zoneId}`);
                                if (typeof addImage === 'function') {
                                    addImage(zoneId, up.src, up.filename || "Imagem Enviada", up.isCustom !== false);
                                }
                            }
                        });
                    }
                    // -------------------------------------------

                    renderControls();
                    renderFixedTexts();
                    updateVisuals();
                    const pricing = calculateFullPrice();
                    updatePrice(pricing);

                    const notification = document.createElement('div');
                    notification.innerHTML = `<div style="position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 15px rgba(102,126,234,0.4);z-index:10000;font-weight:600;display:flex;align-items:center;gap:10px;"><span style="font-size:1.2rem;">✏️</span><div><div style="font-size:0.9rem;">Modo de Edição</div><div style="font-size:0.75rem;opacity:0.9;">Pedido: ${state._editingOrderId}</div></div></div>`;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 5000);

                    console.log('✅ Estado de edição carregado');
                } catch (e) {
                    console.error('❌ Erro ao carregar estado:', e);
                    localStorage.removeItem('editingOrderIndex');
                }
            }
        }, 200);
    }

    setupMainEvents();

    if (typeof HelpSystem !== 'undefined') {
        HelpSystem.init('moletom');
    }
}

function setupMainEvents() {
    const btnC = document.getElementById('btn-copy');
    if (btnC) btnC.onclick = () => {
        const p = calculateFullPrice();
        navigator.clipboard.writeText(`Simulação Moletom ${state.simulationId}\nTotal: R$ ${p.total.toFixed(2)}`).then(() => alert("Copiado!"));
    };

    const btnP = document.getElementById('btn-pdf');
    if (btnP) btnP.onclick = async () => {
        if (await saveOrderToHistory(false)) {
            PDFGenerator.openPreview();
        }
    };

    if (btnCart) {
        // ... (existing btnCart logic)
    }

    // Controles de interacao e zoom
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const btnLock = document.getElementById('lock-interaction');

    if (zoomIn) {
        zoomIn.onclick = () => {
            if (state.isLocked) return;
            if (typeof setZoom === 'function') {
                setZoom(state.zoom + 0.1);
            } else {
                state.zoom += 0.1;
                if (typeof applyZoomAndPan === 'function') applyZoomAndPan();
            }
        };
    }

    if (zoomOut) {
        zoomOut.onclick = () => {
            if (state.isLocked) return;
            if (typeof setZoom === 'function') {
                setZoom(state.zoom - 0.1);
            } else {
                state.zoom -= 0.1;
                if (typeof applyZoomAndPan === 'function') applyZoomAndPan();
            }
        };
    }

    if (btnLock) {
        btnLock.onclick = () => {
            state.isLocked = !state.isLocked;
            btnLock.classList.toggle('locked', state.isLocked);

            // Sincronizar botões de zoom com o cadeado
            zoomIn?.classList.toggle('zoom-disabled', state.isLocked);
            zoomOut?.classList.toggle('zoom-disabled', state.isLocked);

            btnLock.innerHTML = state.isLocked ? '🔒' : '🔓';
            if (state.isLocked && typeof isPanning !== 'undefined') isPanning = false;
        };
    }
}

/**
 * Salva o pedido atual no histórico (Carrinho)
 */
async function saveOrderToHistory(silent = false) {
    // 1. Validação
    const validation = DBAdapter.validateOrder(state);
    if (!validation.valid) {
        if (!silent) {
            alert('⚠️ ' + validation.errors.join('\n'));
            if (validation.errors.some(e => e.includes('Telefone'))) document.getElementById('phone-input')?.focus();
        }
        return false;
    }

    // 2. Geração de PDF Automática (NEW)
    let pdfUrl = null;
    try {
        if (typeof PDFGenerator !== 'undefined') {
            pdfUrl = await PDFGenerator.generateAndSaveForCart();
        }
    } catch (e) {
        console.error('❌ Erro ao gerar PDF para carrinho:', e);
    }

    // 3. Formatação
    const p = calculateFullPrice();
    // Moletom uses 'CONFIG' global
    const row = DBAdapter.formatForDatabase(state, p, CONFIG, pdfUrl);

    // 3. Persistência
    try {
        const h = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');

        // --- SEQUENCING LOGIC (New) ---
        let sigla = 'ML';
        if (row.order_id && row.order_id.includes('-ML-')) sigla = 'ML';

        let typeCount = 0;
        const currentOrderNum = state.orderNumber;

        h.forEach(histItem => {
            if (histItem.DADOS_TECNICOS_JSON) {
                try {
                    const hState = JSON.parse(histItem.DADOS_TECNICOS_JSON);
                    if ((hState.orderNumber === currentOrderNum) && histItem.order_id && histItem.order_id.includes(`-${sigla}-`)) {
                        typeCount++;
                    }
                } catch (e) { }
            }
        });

        const sequenceSuffix = String(typeCount + 1).padStart(2, '0');
        row.order_id = `${row.order_id}-${sequenceSuffix}`;
        // -----------------------------

        // Verificação de Edição: Sobrescrever em vez de adicionar
        if (state._editingIndex !== undefined && state._editingIndex !== null) {
            console.log(`✏️ Atualizando item existente no índice: ${state._editingIndex}`);

            if (state._editingOrderId) {
                row.order_id = state._editingOrderId;
                row.ID_SIMULACAO = state._editingOrderId;
                row.ID_PEDIDO = state._editingOrderId;
            }

            h[state._editingIndex] = row;

            delete state._editingIndex;
            delete state._editingOrderId;
        } else {
            h.push(row);
        }
        localStorage.setItem('hnt_all_orders_db', JSON.stringify(h));

        // 4. Banco de Dados Linear (Excel)
        if (typeof DatabaseManager !== 'undefined') {
            DatabaseManager.addOrder(row);
        }

        return true;
    } catch (e) {
        console.error("Erro ao salvar:", e);
        return false;
    }
}

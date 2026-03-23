/**
 * Simulador Top - Hanuthai (Orquestrador)
 */

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    console.log("Maestro: Iniciando Simulador Top...");

    // 0. Background Config Fetch
    if (typeof fetchConfigFromServer === 'function') fetchConfigFromServer();

    initDataCache();
    loadAdminConfig();
    loadState();
    state.isLocked = false;

    // Restoration Override
    if (typeof checkForRestoration === 'function') {
        checkForRestoration();
    }

    // Auto-fetch sequence from Supabase
    if (!state.orderNumber) {
        if (typeof SupabaseAdapter !== 'undefined') {
            SupabaseAdapter.getNextOrderNumber()
                .then(res => {
                    if (res && res.number) {
                        state.orderNumber = res.number.toString();
                        state.simulationId = getFormattedId(); // from state.js
                        saveState();
                        renderControls();
                    }
                })
                .catch(e => console.warn('Supabase Seq fail:', e));
        }
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
            currentZoom = 1.45; // Reduzido levemente no desktop
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
        HelpSystem.init('top');
    }
}

function setupMainEvents() {
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) btnCopy.onclick = () => copyToClipboard();

    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) {
        btnPdf.onclick = async () => {
            if (await saveOrderToHistory(false)) {
                PDFGenerator.openPreview();
            }
        };
    }

    /* Carrinho gerenciado pelo ui-render.js */</style>
            `;
            document.body.appendChild(loader);

            try {
                // 2. Tentar salvar e redirecionar
                const action = async () => {
                    try {
                        console.log("🛒 Iniciando processo automatizado...");

                        // A. Gerar PDF em Background (se disponível)
                        let pdfUrl = null;
                        if (typeof PDFGenerator !== 'undefined' && PDFGenerator.generateAndSaveForCart) {
                            console.log("📸 Gerando PDF em background...");
                            pdfUrl = await PDFGenerator.generateAndSaveForCart();
                        }

                        // B. Salvar no Carrinho (passando a URL do PDF)
                        console.log("🛒 Salvando no carrinho...");
                        if (await saveOrderToHistory(false, pdfUrl)) {
                            console.log("🛒 Salvo com sucesso. Realizando limpeza...");

                            // C. Resetar o simulador (Limpar dados)
                            if (typeof resetSimulatorData === 'function') {
                                resetSimulatorData();
                            }

                            // D. Redirecionar
                            setTimeout(() => {
                                loader.remove();
                                window.location.href = 'IndexPedidoSimulador.html';
                            }, 500);
                        } else {
                            console.warn("🛒 Falha na validação ao salvar.");
                            loader.remove();
                        }
                    } catch (e) {
                        console.error("🛒 Erro no processamento do carrinho:", e);
                        loader.remove();
                        alert("Erro ao processar pedido. Veja o console.");
                    }
                };

                // 3. Validação de Bordados (se houver)
                if (typeof validateEmbBeforeAction === 'function') {
                    console.log("🛒 Validando bordados...");
                    validateEmbBeforeAction(action);
                } else {
                    await action();
                }

            } catch (e) {
                console.error("🛒 Erro global no clique do carrinho:", e);
                loader.remove();
                alert("Erro inesperado ao adicionar ao carrinho: " + e.message);
            }
        };
    }

    // Controles de interacao e zoom
    const zoomIn = document.getElementById('zoom-in');
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

    const zoomOut = document.getElementById('zoom-out');
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

    const btnLock = document.getElementById('lock-interaction');
    if (btnLock) {
        btnLock.onclick = () => {
            state.isLocked = !state.isLocked;
            btnLock.classList.toggle('locked', state.isLocked);
            zoomIn?.classList.toggle('zoom-disabled', state.isLocked);
            zoomOut?.classList.toggle('zoom-disabled', state.isLocked);
            btnLock.innerHTML = state.isLocked ? '🔒' : '🔓';
            if (state.isLocked && typeof isPanning !== 'undefined') isPanning = false;
        };
    }
}

function copyToClipboard() {
    const p = calculateFullPrice();
    const text = `Simulação Top ${state.simulationId}\nTotal: R$ ${p.total.toFixed(2)}`;
    navigator.clipboard.writeText(text).then(() => alert("Copiado!"));
}

/**
 * Hanuthai Simulator - Shorts Main Entry Point
 * Refatorado e Modularizado em 26/01/2026
 * 
 * Este arquivo atua como o maestro, conectando os módulos:
 * state.js, pricing.js, visuals.js, interactions.js, ui-render.js, logic.js
 */

// --- SISTEMA DE RENDERIZAÇÃO OTIMIZADO (DEBOUNCE) ---
let renderScheduled = false;
let pendingRedrawControls = false;

/**
 * Agenda uma atualização visual e de preço.
 * ✅ OTIMIZAÇÃO: Usa requestAnimationFrame para sincronizar com o ciclo de repaint do navegador
 * @param {boolean} redrawControls - Se true, reconstrói o painel de controles (UI).
 */
function scheduleRender(redrawControls = false) {
    if (redrawControls) pendingRedrawControls = true;

    if (renderScheduled) return; // Evita múltiplas chamadas no mesmo frame
    renderScheduled = true;

    requestAnimationFrame(() => {
        if (pendingRedrawControls) {
            renderControls();
            pendingRedrawControls = false;
        }
        updateVisuals();
        const pricing = calculateFullPrice();
        updatePrice(pricing);
        saveState();

        // Preparação paralela do PDF/Resumo
        if (typeof PDFGenerator !== 'undefined') {
            PDFGenerator.prepareDraft(state, pricing, DATA);
        }

        renderScheduled = false;
    });
}

/**
 * Inicialização principal do simulador
 */
async function init() {
    console.log("Maestro: Iniciando Simulador Shorts...");

    // 1. Preparar Dados e Cache
    initDataCache();
    loadAdminConfig();

    // 2. Estado Inicial
    initDefaults();
    loadState(); // Restaurar sessão anterior se houver

    // 2.5 Restoration Override (Buffer)
    if (typeof checkForRestoration === 'function') {
        checkForRestoration();
    }

    // 2.6 Server Sync (Incognito/Cross-Device) - AGUARDAR ANTES DE RENDERIZAR
    if (typeof fetchConfigFromServer === 'function') {
        console.log("☁️ Aguardando configurações do servidor...");
        await fetchConfigFromServer();
        console.log("☁️ Configurações carregadas. Prosseguindo com renderização...");
    }

    // Auto-fetch sequence
    if (!state.orderNumber) {
        const apiUrl = '/api/next-order-id'; // Relative path for both local and Render
        fetch(apiUrl)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.json();
            })
            .then(d => {
                if (d.number) {
                    state.orderNumber = d.number.toString();
                    state.simulationId = getFormattedId(); // from state.js
                    saveState();
                    scheduleRender(true);
                }
            })
            .catch(e => {
                console.warn('Seq API fail (expected if server is offline):', e.message);
            });
    }

    // 3. Preparar Visual
    initLayers();

    // 4. Renderização Inicial (AGORA COM DADOS DO SERVIDOR)
    renderControls();
    updateVisuals();
    const pricing = calculateFullPrice();
    updatePrice(pricing);
    updateCartCount();

    if (typeof PDFGenerator !== 'undefined') {
        PDFGenerator.prepareDraft(state, pricing, DATA);
    }

    // 5. Ativar Interatividade
    setupMainEvents();
    setupDragDrop();
    setupViewportPan();

    // 6. Ajustar Zoom e Pan Inicial (Aumento Automático)
    const applyInitialZoom = () => {
        if (window.innerWidth <= 768) {
            currentZoom = 1.2; // Otimizado para ocupar mais espaço no mobile
        } else {
            currentZoom = 1.65; // Otimizado para visualização principal no desktop
        }
        state.zoom = currentZoom;
        panOffset = { x: 0, y: 0 };
        if (typeof applyZoomAndPan === 'function') applyZoomAndPan();
    };

    applyInitialZoom();

    // 7. Manter aumento automático conforme redimensionamento da tela
    window.addEventListener('resize', applyInitialZoom);

    // 8. VERIFICAR MODO DE EDIÇÃO (após tudo estar carregado)
    const editingIndex = localStorage.getItem('editingOrderIndex');
    if (editingIndex !== null) {
        console.log('✏️ Detectado modo de edição - Carregando estado...');
        setTimeout(() => {
            const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
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

                    renderControls();
                    updateVisuals();
                    const pricing = calculateFullPrice();
                    updatePrice(pricing);
                    if (typeof PDFGenerator !== 'undefined') {
                        PDFGenerator.prepareDraft(state, pricing, DATA);
                    }

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

    console.log("Maestro: Pronto! Zoom:", currentZoom);
}

/**
 * Configura os ouvintes de eventos globais de tela
 */
function setupMainEvents() {
    // Vincular botões de ação do HTML
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) btnCopy.onclick = () => {
        if (typeof validateEmbBeforeAction === 'function') {
            validateEmbBeforeAction(() => copyToClipboard());
        } else {
            copyToClipboard();
        }
    };

    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf) {
        btnPdf.onclick = () => {
            if (saveOrderToHistory(false)) {
                PDFGenerator.openPreview();
            }
        };
    }

    const btnCart = document.getElementById('btn-add-cart') || document.getElementById('btn-export-db');
    if (btnCart) {
        btnCart.onclick = async () => {
            console.log("🛒 Botão Adicionar ao Carrinho clicado.");

            // 1. Mostrar Notificação de Carregamento
            const loader = document.createElement('div');
            loader.innerHTML = `
                <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 40px;border-radius:10px;z-index:100000;display:flex;flex-direction:column;align-items:center;gap:15px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #444;">
                    <div class="spinner-hnt" style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid var(--gold,#d4af37);border-radius:50%;animation:spin-hnt 1s linear infinite;"></div>
                    <div style="font-weight:600;font-size:1.1rem;font-family:'Bebas Neue',sans-serif;letter-spacing:1px;">PROCESSANDO PEDIDO...</div>
                    <div style="font-size:0.8rem;color:#aaa;">Gerando Ficha Técnica em background</div>
                </div>
                <style>@keyframes spin-hnt { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
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
                        if (saveOrderToHistory(false, pdfUrl)) {
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

    const btnRefresh = document.getElementById('btn-refresh-prices');
    if (btnRefresh) {
        btnRefresh.onclick = () => {
            console.log('🔄 Recarregando preços do admin...');
            loadAdminConfig(); // Reload from localStorage
            scheduleRender(true); // Redraw UI with new prices
            alert('✅ Preços atualizados com sucesso!');
        };
    }

    // Controles de Zoom
    const zoomIn = document.getElementById('zoom-in');
    if (zoomIn) {
        zoomIn.onclick = () => {
            if (state.isLocked) return;
            setZoom(state.zoom + 0.1);
        };
    }

    const zoomOut = document.getElementById('zoom-out');
    if (zoomOut) {
        zoomOut.onclick = () => {
            if (state.isLocked) return;
            setZoom(state.zoom - 0.1);
        };
    }

    // Trava de Interação
    const btnLock = document.getElementById('lock-interaction');
    if (btnLock) {
        btnLock.onclick = () => {
            state.isLocked = !state.isLocked;
            btnLock.classList.toggle('locked', state.isLocked);

            // Sincronizar botões de zoom com o cadeado (desabilita apenas os botões de +/-)
            zoomIn?.classList.toggle('zoom-disabled', state.isLocked);
            zoomOut?.classList.toggle('zoom-disabled', state.isLocked);

            btnLock.innerHTML = state.isLocked ? '🔒' : '🔓';

            // Log para feedback
            console.log(state.isLocked ? "🔒 Interação Bloqueada (Zoom desabilitado)" : "🔓 Interação Liberada");

            // Se bloqueou, garante que o panning parou
            if (state.isLocked) isPanning = false;
        };
    }

    // Fechar menus ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown-options').forEach(el => el.classList.remove('open'));
        }
    });

    // Listener para o campo de busca da galeria
    const gallerySearch = document.getElementById('gallery-search');
    if (gallerySearch) {
        gallerySearch.addEventListener('input', (e) => {
            renderGalleryView(e.target.value);
        });
    }

    // Inicializar Sistema de Ajuda (Botões Flutuantes)
    if (typeof HelpSystem !== 'undefined') {
        HelpSystem.init('shorts');
    }
}

// --- DISPARO INICIAL ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

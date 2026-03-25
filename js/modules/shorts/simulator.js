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

    // 2.6 Server Sync (Incognito/Cross-Device) - NÃO BLOQUEANTE para performance
    if (typeof fetchConfigFromServer === 'function') {
        console.log("☁️ Sincronizando configurações em segundo plano...");
        fetchConfigFromServer(); // Sem await: o render continua com dados do localStorage
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
                        scheduleRender(true);
                    }
                })
                .catch(e => console.warn('Supabase Seq fail:', e));
        }
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
            currentZoom = 1.1; // Otimizado mas não corta
        } else {
            currentZoom = 1.35; // Reduzido para garantir que Shorts Fight (amarras) nunca corte nas bordas laterais
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

                    renderControls();

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
    state.isLocked = false;
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
        btnPdf.onclick = async () => {
            // --- NOVO: Ocultar limites antes de gerar PDF ---
            if (window.ShortsSimulatorInstance && window.ShortsSimulatorInstance.hideAllVisualLimits) {
                window.ShortsSimulatorInstance.hideAllVisualLimits();
            }

            if (typeof PDFGenerator !== 'undefined') {
                PDFGenerator.showCaptureFlash();
                await PDFGenerator.updateSnapshot(true);
            }
            if (await saveOrderToHistory(false)) {
                PDFGenerator.openPreview();
            }
        };
    }


    // btn-add-cart handled in ui-render.js for persistence

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

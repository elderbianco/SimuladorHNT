/**
 * Simulador Shorts Legging - Hanuthai (Orquestrador)
 */

document.addEventListener('DOMContentLoaded', () => {
    init();
});

/**
 * Função principal de inicialização
 */
function init() {
    console.log("Maestro: Iniciando Simulador Shorts Legging...");

    // 1. Carregar Configurações e Estado
    initDataCache();
    loadAdminConfig();

    // 🔴 CRITICAL: Skip loadState if in edit mode to prevent localStorage override
    const editingIndex = localStorage.getItem('editingOrderIndex');
    if (!editingIndex) {
        loadState(); // Only load if NOT editing
    } else {
        console.log('⏭️ Pulando loadState() - Modo de edição detectado');
    }

    // Restoration Override
    if (typeof checkForRestoration === 'function') {
        checkForRestoration();
    }

    // 🔴 CRITICAL: CHECK EDIT MODE BEFORE ANY RENDERING
    // editingIndex already declared above
    if (editingIndex !== null) {
        console.log('✏️ Detectado modo de edição - Carregando estado ANTES da renderização...');
        console.log('📍 Editing Index:', editingIndex);

        const history = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
        const orderToEdit = history[editingIndex];

        console.log('📦 Total orders in history:', history.length);
        console.log('📦 Order to edit:', orderToEdit);

        if (orderToEdit && orderToEdit.DADOS_TECNICOS_JSON) {
            try {
                const savedState = JSON.parse(orderToEdit.DADOS_TECNICOS_JSON);
                console.log('📄 Saved state loaded:', savedState);

                // Preserve Current Configuration (Pricing)
                const currentConfig = state.config;

                // Deep Restore critical objects
                state.sizes = savedState.sizes || {};
                state.parts = savedState.parts || {};
                state.extras = savedState.extras || {};
                state.uploads = savedState.uploads || {};
                state.texts = savedState.texts || {};

                console.log('✅ Restored sizes:', state.sizes);
                console.log('✅ Restored parts:', state.parts);
                console.log('✅ Restored extras:', state.extras);
                console.log('✅ Restored uploads (keys):', Object.keys(state.uploads));
                console.log('✅ Restored texts:', state.texts);

                // Copy other properties
                Object.keys(savedState).forEach(key => {
                    if (key !== 'config' && key !== 'sizes' && key !== 'parts' && key !== 'extras' && key !== 'uploads' && key !== 'texts') {
                        state[key] = savedState[key];
                        console.log(`✅ Restored ${key}:`, savedState[key]);
                    }
                });

                // Restore IDs for updating existing record
                state._editingIndex = parseInt(editingIndex);
                state._editingOrderId = orderToEdit.order_id || orderToEdit.ID_PEDIDO;

                console.log('🔑 Editing Index set to:', state._editingIndex);
                console.log('🔑 Editing Order ID set to:', state._editingOrderId);

                // Ensure config is current
                if (currentConfig) state.config = currentConfig;

                // Clear flag
                localStorage.removeItem('editingOrderIndex');

                console.log('✅ Estado restaurado ANTES da renderização inicial');
            } catch (e) {
                console.error('❌ Erro crítico ao restaurar estado de edição:', e);
                console.error('Stack trace:', e.stack);
                alert('Erro ao carregar dados para edição. Consulte o console.');
                localStorage.removeItem('editingOrderIndex');
            }
        } else {
            console.warn('⚠️ Pedido para edição não encontrado ou sem dados técnicos.');
            console.warn('Order data:', orderToEdit);
            localStorage.removeItem('editingOrderIndex');
        }
    }

    // Auto-fetch sequence (only if NOT editing)
    if (!state.orderNumber && !state._editingIndex) {
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

    // 2. Preparar Visual e Camadas
    initLayers();
    setColor(state.color || 'branco', false);

    // 3. Renderização Inicial (agora com estado correto)
    renderControls();
    renderFixedTexts();
    const pricing = calculateFullPrice();
    updatePrice(pricing);
    updateCartCount();

    if (typeof PDFGenerator !== 'undefined') {
        PDFGenerator.prepareDraft(state, pricing, CONFIG);
    }

    // 4. Ativar Interatividade
    setupViewportPan();
    setupGlobalDrag();

    // 5. Ajustar Zoom Inicial
    const applyInitialZoom = () => {
        if (window.innerWidth <= 768) {
            currentZoom = 1.22; // Otimizado para ocupar mais espaço no mobile
        } else {
            currentZoom = 1.75; // Otimizado para visualização principal no desktop
        }
        state.zoom = currentZoom;
        panOffset = { x: 0, y: 0 };
        if (typeof applyZoomAndPan === 'function') applyZoomAndPan();
    };

    applyInitialZoom();
    window.addEventListener('resize', applyInitialZoom);

    // 6. Configurar Eventos do Documento e Botões
    setupMainEvents();

    // 7. Inicializar Sistemas de Apoio
    if (typeof HelpSystem !== 'undefined') {
        HelpSystem.init('legging');
    }

    // 8. Show edit notification if in edit mode
    if (state._editingOrderId) {
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.innerHTML = `<div style="position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 15px rgba(102,126,234,0.4);z-index:10000;font-weight:600;display:flex;align-items:center;gap:10px;"><span style="font-size:1.2rem;">✏️</span><div><div style="font-size:0.9rem;">Modo de Edição</div><div style="font-size:0.75rem;opacity:0.9;">Editando: ${state._editingOrderId}</div></div></div>`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        }, 500);
    }

    console.log("✅ Simulador inicializado com sucesso");
}

/**
 * Configura eventos globais e botões de ação do HTML
 */
function setupMainEvents() {
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) btnCopy.onclick = () => copyToClipboard();

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

    // Eventos de clique para fechar dropdowns customizados
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown-options').forEach(el => {
                el.classList.remove('open');
                el.style.display = 'none';
            });
        }
    });

    // Campo de busca da galeria
    const gallerySearch = document.getElementById('gallery-search');
    if (gallerySearch) {
        gallerySearch.addEventListener('input', (e) => {
            if (typeof renderGalleryView === 'function') {
                renderGalleryView(e.target.value);
            }
        });
    }
}

function copyToClipboard() {
    const p = calculateFullPrice();
    const text = `Simulação Hanuthai - Shorts Legging\nID: ${state.simulationId}\nTotal: R$ ${p.total.toFixed(2)}`;
    navigator.clipboard.writeText(text)
        .then(() => alert("Dados copiados com sucesso!"))
        .catch(err => console.error("Erro ao copiar:", err));
}

function exportToProductionDatabase() {
    // Lógica futura de exportação para Excel
    alert("Função de exportação para banco de dados de produção acionada.");
}

/**
 * Simulador Shorts Legging - Hanuthai (Orquestrador)
 */

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    console.log("Maestro: Iniciando Simulador Shorts Legging...");

    // 0. Carregar Configurações de Admin
    if (typeof loadAdminConfig === 'function') loadAdminConfig();

    // 1. Inicializar Estado e Cache
    initDataCache();
    loadState();
    state.isLocked = false;

    // A. Sync c/ Servidor (Opcional/Se disponível)
    if (typeof fetchConfigFromServer === 'function') fetchConfigFromServer();

    // B. Recuperar Número de Pedido do Supabase (Se não houver)
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

    // 2. Preparar Visual e Camadas
    initLayers();
    setColor(state.color || 'branco', false);

    // 3. Renderização Inicial (agora com estado correto)
    renderControls();
    renderFixedTexts();
    updatePrice();
    updateCartCount();

    if (typeof PDFGenerator !== 'undefined') {
        const pricing = calculateFullPrice();
        PDFGenerator.prepareDraft(state, pricing, CONFIG);
    }

    // 4. Ativar Interatividade
    setupViewportPan();
    setupGlobalDrag();

    // 5. Ajustar Zoom Inicial
    const applyInitialZoom = () => {
        if (window.innerWidth <= 768) {
            currentZoom = 1.2;
        } else {
            currentZoom = 1.8; // Valor intermediário para evitar cortes excessivos
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

    /* Carrinho gerenciado pelo BaseSimulator.js */

    // Eventos de clique para fechar dropdowns customizados
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown-options').forEach(el => {
                el.classList.remove('open');
                el.style.display = 'none';
            });
        }
    });

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
    alert("Função de exportação para banco de dados de produção acionada.");
}

/**
 * Módulo de Geração de PDF (v14 - ROBUST) - Atomic Print Technology
 * PRÉ-CAPTURA em background para geração INSTANTÂNEA e AUTO-SAVE.
 */
const PDFGenerator = {
    context: {
        state: null,
        pricing: null,
        productData: null
    },

    // Cache da última captura
    cachedSnapshot: null,
    captureInProgress: false,
    lastCaptureTime: 0,
    isCaptureBroken: false, // Circuit breaker: se true, não tenta mais usar html2canvas
    savedPdfUrl: null, // URL do PDF salvo no servidor

    // Carrega dinamicamente o plugin AutoTable se não existir (Mantido para compatibilidade futura, embora não usado no layout manual)
    async loadAutoTable() {
        if (window.jspdf && window.jspdf.plugin && window.jspdf.plugin.autotable) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    prepareDraft(state, pricing, productData) {
        this.context.state = state;
        this.context.pricing = pricing;
        this.context.productData = productData;
    },

    /**
     *智能PRÉ-CAPTURA: Executada em background, sem bloquear UI
     * Chamada automaticamente quando o simulador muda
     */
    async updateSnapshot(force = false) {
        // Se o sistema de captura já falhou anteriormente (erro de segurança), não tenta mais.
        if (this.isCaptureBroken) return;

        // RACE CONDITION FIX: Se forçado, espera a captura anterior terminar
        if (this.captureInProgress) {
            if (force) {
                console.log('⏳ Captura forçada solicitada, mas há uma em andamento. Aguardando...');
                while (this.captureInProgress) {
                    await new Promise(r => setTimeout(r, 100));
                }
                console.log('✅ Captura anterior finalizada. Prosseguindo com forçada.');
            } else {
                return; // Se não for forçado, apenas ignora
            }
        }

        // Throttle: no máximo 1 captura a cada 2 segundos (exceto se forçado)
        const now = Date.now();
        if (!force && (now - this.lastCaptureTime < 2000)) return;

        this.captureInProgress = true;
        this.lastCaptureTime = now;

        try {
            // FIX: Capture the zoom-container instead of the wrapper to get the full context
            const captureTarget = document.querySelector('.zoom-container') || document.querySelector('.simulator-wrapper');

            if (!captureTarget || typeof html2canvas === 'undefined') {
                this.captureInProgress = false;
                return;
            }

            const canvas = await html2canvas(captureTarget, {
                scale: 0.75, // OTIMIZAÇÃO: Reduzido para 75%
                useCORS: true,
                allowTaint: false,
                backgroundColor: null, // TRANSPARENTE para não criar barras brancas
                logging: false,
                imageTimeout: 0,
                removeContainer: true,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0,
                ignoreElements: (element) => {
                    // Ignore UI helpers
                    if (element.classList.contains('drag-handle') ||
                        element.classList.contains('resize-handle') ||
                        element.classList.contains('ui-draggable-handle') ||
                        element.classList.contains('limit-layer') ||
                        element.classList.contains('zoom-controls')) {
                        return true;
                    }
                    return false;
                },
                onclone: (clonedDoc) => {
                    // 1. Reset 'will-change'
                    const hardwareAccelerated = clonedDoc.querySelectorAll('*');
                    hardwareAccelerated.forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.willChange && style.willChange !== 'auto') {
                            el.style.willChange = 'auto';
                        }
                        if (el.style.transform.includes('translate3d')) {
                            el.style.transform = el.style.transform.replace(/translate3d\(([^,]+),\s*([^,]+)(?:,\s*[^)]+)?\)/g, 'translate($1, $2)');
                        }
                    });

                    // 2. Normalize clone for capture
                    clonedDoc.body.style.margin = '0';
                    clonedDoc.body.style.padding = '0';

                    // PRESERVAR O BACKGROUND (RingHNT)
                    const originalArea = document.querySelector('.simulator-area');
                    const target = clonedDoc.querySelector('.simulator-wrapper');

                    if (target && originalArea) {
                        // Aplica o background do Ring
                        const bgStyle = window.getComputedStyle(originalArea).backgroundImage;
                        target.style.backgroundImage = bgStyle;
                        target.style.backgroundSize = 'cover';
                        target.style.backgroundPosition = 'center bottom';
                        target.style.backgroundColor = 'transparent'; // Fundo transparente!

                        // Reset all ancestors
                        let parent = target.parentElement;
                        while (parent && parent !== clonedDoc.body) {
                            parent.style.margin = '0';
                            parent.style.padding = '0';
                            parent.style.position = 'static';
                            parent.style.transform = 'none';
                            parent.style.width = '1000px';
                            parent.style.height = '1000px';
                            parent = parent.parentElement;
                        }

                        // 3. Normalize the target itself
                        const isLeggingActive = PDFGenerator.context.state?.extras?.calca_legging?.enabled || target.classList.contains('calca-legging-active');
                        target.style.top = isLeggingActive ? '100px' : '0';
                        target.style.transform = 'none';
                        target.style.left = '0';
                        target.style.margin = '0';
                        target.style.width = '1000px';
                        target.style.height = '1000px';

                        // Centering logic logic
                        const productLayers = target.querySelectorAll('.product-layer, .layer');
                        productLayers.forEach(l => {
                            if (window.getComputedStyle(l).display === 'none') {
                                l.style.display = 'none';
                                return;
                            }
                            l.style.width = '100%';
                            l.style.height = '100%';
                            l.style.display = 'flex';
                            l.style.justifyContent = 'center';
                            l.style.alignItems = 'center';
                            l.style.transform = 'none';

                            const img = l.querySelector('img');
                            if (img) {
                                img.style.maxWidth = '100%';
                                img.style.maxHeight = '100%';
                                img.style.objectFit = 'contain';
                                img.style.margin = '0 auto';
                            }
                        });

                        // Customization Layer
                        const customLayer = target.querySelector('.customization-layer');
                        if (customLayer) {
                            if (window.getComputedStyle(customLayer).display === 'none') {
                                customLayer.style.display = 'none';
                            } else {
                                customLayer.style.width = '100%';
                                customLayer.style.height = '100%';
                                customLayer.style.top = '0';
                                customLayer.style.left = '0';
                                customLayer.style.transform = 'none';
                                customLayer.style.display = 'block';
                            }
                        }
                    }
                }
            });
            // Salvar no cache (PNG para transparência)
            this.cachedSnapshot = canvas.toDataURL('image/png');

            console.log('📸 PDF Debug: Snapshot dimensions:', canvas.width, 'x', canvas.height);

            canvas.width = 0;
            canvas.height = 0;

        } catch (error) {
            console.warn('html2canvas falhou via updateSnapshot. Tentando dom-to-image como fallback...', error);

            try {
                // Tentativa secundária com dom-to-image
                if (typeof domtoimage !== 'undefined') {
                    const dataUrl = await domtoimage.toPng(document.querySelector('.simulator-wrapper'), {
                        quality: 1.0,
                        bgcolor: 'transparent',
                        style: { transform: 'scale(1)', transformOrigin: 'top left' }
                    });

                    if (dataUrl && dataUrl.length > 100) {
                        this.cachedSnapshot = dataUrl;
                        this.captureInProgress = false;
                        console.log('✅ Snapshot recuperado via dom-to-image!');
                        return;
                    }
                }
            } catch (err2) {
                console.warn('dom-to-image também falhou:', err2);
            }

            console.warn('Erro fatal ao atualizar snapshot (Security Error?):', error);
            // Se falhar (ex: Tainted Canvas), anula o cache para forçar o fallback DOM
            this.cachedSnapshot = null;

            // ATIVAR CIRCUIT BREAKER:
            // Se houve erro (provavelmente CORS/Tainted), desabilita tentativas futuras para não travar o navegador.
            this.isCaptureBroken = true;
            console.log('⚠️ Captura de imagem desabilitada por segurança. O PDF será gerado sem a imagem visual.');
        } finally {
            this.captureInProgress = false;
        }
    },

    /**
     * Fallback Robusto: Clona o DOM do simulador quando html2canvas falha
     * (Comum em localhost ou com imagens sem CORS)
     */
    getVisualFallback() {
        const originalWrapper = document.querySelector('.simulator-wrapper');
        if (!originalWrapper) return '<div style="text-align:center;">[Visual Indisponível]</div>';

        // Clonar o wrapper completo
        const clone = originalWrapper.cloneNode(true);

        // Limpar elementos de UI (controles, limites, etc)
        clone.querySelectorAll('.drag-handle, .resize-handle, .ui-draggable-handle, .limit-layer').forEach(el => el.remove());

        // Forçar estilos para impressão
        clone.style.transform = 'scale(0.8)'; // Reduzir um pouco para caber
        clone.style.transformOrigin = 'top center';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.margin = '0 auto';
        clone.style.position = 'relative';
        clone.style.boxShadow = 'none';
        clone.style.border = 'none';

        // Converter para string HTML (wrapper temporário para extrair innerHTML)
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.height = '500px'; // Altura fixa segura
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'flex-start';

        wrapper.appendChild(clone);
        return wrapper.outerHTML;
    },

    async openPreview() {
        // 1. Mostrar Overlay de Carregamento (Bloqueante) com BARRA DE PROGRESSO
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'pdf-loading-overlay';
        loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-family:sans-serif; transition: opacity 0.3s ease;';

        loadingOverlay.innerHTML = `
            <div style="font-size:3rem; margin-bottom:20px;">📸</div>
            <h2 style="margin:0 0 10px 0; font-weight:300;">Gerando Visualização...</h2>
            
            <div style="width:300px; height:8px; background:#333; border-radius:4px; overflow:hidden; position:relative;">
                <div id="pdf-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #28a745, #85e09b); transition: width 0.1s linear;"></div>
            </div>
            <div id="pdf-progress-text" style="margin-top:10px; font-size:0.8rem; color:#888;">0%</div>
        `;
        document.body.appendChild(loadingOverlay);

        // Helper para delay
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // PROTEÇÃO FINAL: Timeout absoluto de 15 segundos para remover overlay
        const emergencyTimeout = setTimeout(() => {
            console.error('🚨 TIMEOUT EMERGENCIAL: Removendo overlay após 15 segundos');
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => loadingOverlay.remove(), 300);
            }
        }, 15000);

        try {
            // SEQUÊNCIA DE PROGRESSO INTELIGENTE (Smart Wait - OTIMIZADA)
            const bar = document.getElementById('pdf-progress-bar');
            const txt = document.getElementById('pdf-progress-text');

            // 1. Início e Forçar Renderização
            if (bar) bar.style.width = '10%';
            if (txt) txt.innerText = '10% - Processando...';

            // Forçar atualização visual
            if (typeof window.updateVisuals === 'function') window.updateVisuals();

            // CRITICAL: Limpar cache antigo para garantir nova captura
            this.cachedSnapshot = null;

            await sleep(100); // Buffer Mínimo

            // 2. Loop de Verificação de Imagens (Smart Wait OTIMIZADO com TIMEOUT)
            if (bar) bar.style.width = '30%';
            if (txt) txt.innerText = '30% - Sincronizando Assets...';

            let retries = 0;
            const maxRetries = 40; // 4 segundos máximo
            let allImagesLoaded = false;
            const startTime = Date.now();
            const maxWaitTime = 5000; // 5 segundos de timeout absoluto

            while (retries < maxRetries && !allImagesLoaded) {
                // TIMEOUT DE SEGURANÇA: Se passar de 5 segundos, sai do loop
                if (Date.now() - startTime > maxWaitTime) {
                    console.warn('⚠️ Timeout atingido ao aguardar imagens. Prosseguindo...');
                    break;
                }

                const images = document.querySelectorAll('.simulator-wrapper img');
                const total = images.length;
                let loaded = 0;
                let failed = 0;

                images.forEach(img => {
                    if (img.complete && img.naturalWidth > 0 && img.src) {
                        loaded++;
                    } else if (img.complete && img.naturalWidth === 0) {
                        // Imagem falhou ao carregar
                        failed++;
                        console.warn('⚠️ Imagem falhou:', img.src);
                    }
                });

                console.log(`📊 Imagens: ${loaded}/${total} carregadas, ${failed} falharam`);

                if (total === 0 || loaded >= total || (loaded + failed) >= total) {
                    allImagesLoaded = true;
                } else {
                    const percent = 30 + Math.floor((loaded / total) * 40);
                    if (bar) bar.style.width = `${percent}%`;
                    await sleep(100); // Check mais frequente (100ms)
                    retries++;
                }
            }

            if (!allImagesLoaded) {
                console.warn('⚠️ Nem todas as imagens carregaram, mas prosseguindo...');
            }

            // 3. Estabilização Final
            if (bar) bar.style.width = '80%';
            if (txt) txt.innerText = '80% - Finalizando...';

            // Força repaint
            document.body.offsetHeight;
            await sleep(100); // Buffer Mínimo Final

            // 4. Captura
            if (bar) bar.style.width = '90%';
            if (txt) txt.innerText = '90% - Capturando...';

            // O updateSnapshot agora espera se houver captura de fundo rodando
            await this.updateSnapshot(true);

            // 100% (Finalização)
            if (bar) bar.style.width = '100%';
            if (txt) txt.innerText = '100% - Pronto!';
            await sleep(100);

        } catch (e) {
            console.error("Erro na captura forçada:", e);
            alert("Erro ao gerar imagem: " + e.message);
        } finally {
            // Cancelar timeout de emergência
            clearTimeout(emergencyTimeout);

            // 3. Remover Overlay com Fade Out
            try {
                loadingOverlay.style.opacity = '0';
                await sleep(300);
                if (loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            } catch (err) {
                console.error('Erro ao remover overlay:', err);
                // Forçar remoção direta
                if (loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
            }
        }

        const modal = document.getElementById('summary-modal');
        if (!modal) return;

        // Sincronizar dados da tabela (Instantâneo)
        const source = document.getElementById('summary-body');
        const target = document.getElementById('summary-body-modal');
        if (source && target) target.innerHTML = source.innerHTML;

        const titleEl = document.querySelector('#summary-modal .modal-header h3');
        if (titleEl && this.context.state?.simulationId) {
            titleEl.innerText = `RESUMO DO PEDIDO (#${this.context.state.simulationId})`;
        }

        // Resetar estado do botão para "Iniciando..."
        this.updateModalButton('generating');

        // Renderizar prévia INSTANTÂNEA usando cache (agora atualizado)
        this.renderPreviewInModal();

        modal.style.display = 'flex';

        // --- NOVO: GERAR PDF EM BACKGROUND E SALVAR ---
        // Agora que o usuário está vendo o resumo, geramos o PDF real e salvamos no servidor.
        this.generateBackgroundPDF();
    },

    /**
     * Atualiza o botão do modal conforme o estado
     * @param {string} status - 'loading', 'ready', 'error'
     * @param {string} url - URL para abrir (se ready)
     */
    updateModalButton(status, url) {
        const btn = document.querySelector('#summary-modal .btn-action');
        if (!btn) return;

        // Remover listeners antigos (clone truque)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        if (status === 'loading' || status === 'generating') {
            newBtn.innerText = '⚙️ Gerando PDF... (1/2)';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.7';
            newBtn.style.cursor = 'wait';
            newBtn.style.backgroundColor = '#6c757d';
        } else if (status === 'saving') {
            newBtn.innerText = '💾 Salvando... (2/2)';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.8';
            newBtn.style.cursor = 'wait';
            newBtn.style.backgroundColor = '#17a2b8';
        } else if (status === 'ready') {
            newBtn.innerText = '📄 Visualizar PDF Salvo';
            newBtn.disabled = false;
            newBtn.style.opacity = '1';
            newBtn.style.cursor = 'pointer';
            newBtn.style.backgroundColor = '#28a745'; // Verde sucesso
            newBtn.onclick = () => window.open(url, '_blank');
        } else {
            newBtn.innerText = '⚠️ Erro - Tentar Imprimir';
            newBtn.disabled = false;
            newBtn.onclick = () => window.print();
        }
    },

    renderPreviewInModal() {
        let preview = document.getElementById('print-product-preview');
        if (!preview) {
            const modalBody = document.querySelector('#summary-modal .modal-content div[style*="padding: 20px"]');
            preview = document.createElement('div');
            preview.id = 'print-product-preview';
            preview.style.textAlign = 'center';
            preview.style.marginBottom = '20px';
            if (modalBody) modalBody.insertBefore(preview, modalBody.firstChild);
        }

        // Usar snapshot em cache para preview INSTANTÂNEO
        if (this.cachedSnapshot) {
            preview.innerHTML = `<img src="${this.cachedSnapshot}" style="max-width: 100%; height: auto; border: 1px solid #333; border-radius: 4px;">`;
        } else {
            // Fallback: clone DOM (mais lento, mas funcional)
            const originalWrapper = document.querySelector('.simulator-wrapper');
            if (originalWrapper) {
                const clone = originalWrapper.cloneNode(true);
                clone.style.transform = 'none';
                clone.style.left = '0';
                clone.style.top = '0';
                clone.style.width = '100%';
                clone.style.height = '100%';
                clone.style.position = 'relative';
                clone.querySelectorAll('.drag-handle, .resize-handle, .ui-draggable-handle').forEach(el => el.remove());
                preview.innerHTML = '';
                preview.appendChild(clone);
            }
        }
    },

    /**
     * Geração de PDF (v12) e Backup Automático Local
     */
    async generate(title) {
        // Função legado para imprimir direto (caso chamado manualmente)
        window.print();
    },

    /**
     * Envia o snapshot (ou PDF) para o servidor local
     */
    async saveToLocalFolder(id, data = null, type = 'image') {
        // Se dados não fornecidos, usa o snapshot cached (comportamento antigo/fallback)
        const payload = data || this.cachedSnapshot;
        if (!payload) return null;

        try {
            // Tenta enviar para o servidor local (server.js)
            const response = await fetch('http://localhost:3000/api/save-pedido', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    snapshot: payload, // Pode ser base64 jpg ou pdf
                    type: type, // NEW: informa o tipo explicitamente
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                const json = await response.json();
                console.log(`✅ Arquivo ${id} salvo automaticamente.`);
                return json.path; // Retorna o caminho salvo (ou URL se o server suportar)
            }
        } catch (err) {
            console.warn('Simulador offline ou erro de rede. Arquivo não salvo localmente.');
        }
        return null;
    },

    /**
     * Carrega dependências (jsPDF, QRCode) dinamicamente se não existirem
     */
    async loadDependencies() {
        const loadScript = (src, globalCheck) => {
            return new Promise((resolve, reject) => {
                if (window[globalCheck]) return resolve();
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        try {
            await Promise.all([
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', 'QRCode')
            ]);
            return true;
        } catch (e) {
            console.error('Erro ao carregar libs de PDF/QR:', e);
            return false;
        }
    },

    /**
     * Gera um PDF real em background usando jsPDF (REDESENHADO v2)
     */
    async generateBackgroundPDF() {
        // 1. Garantir Dependências
        if (typeof window.jspdf === 'undefined' || typeof QRCode === 'undefined') {
            const loaded = await this.loadDependencies();
            if (!loaded) {
                alert('Erro: Bibliotecas de PDF não carregaram. Verifique sua internet.');
                this.updateModalButton('error');
                return;
            }
        }

        const id = this.context.state?.simulationId || 'HNT_PEDIDO';

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20; // 2cm de margem

            // --- FUNÇÃO AUXILIAR: TEMPLATE DE PÁGINA ---
            const drawPageTemplate = (docArg) => {
                const width = docArg.internal.pageSize.getWidth();
                const height = docArg.internal.pageSize.getHeight();

                // 1. Fundo Branco Base (Sempre limpar)
                docArg.setFillColor(255, 255, 255);
                docArg.rect(0, 0, width, height, 'F');

                // 2. Marca D'água (Logo Expandida)
                // Nota: Se a imagem principal (snapshot) já tiver fundo (Ring), a marca d'água pode ficar redundante 
                // na primeira página, mas é essencial nas seguintes.
                const logoImg = document.querySelector('.header-logo-img');
                if (logoImg) {
                    try {
                        docArg.saveGraphicsState();
                        docArg.setGState(new docArg.GState({ opacity: 0.05 })); // Opacidade bem leve para fundo de texto

                        const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
                        const wmWidth = width * 0.9; // 90% da largura
                        const wmHeight = wmWidth * ratio;
                        const wmX = (width - wmWidth) / 2;
                        const wmY = (height - wmHeight) / 2;

                        const canvas = document.createElement('canvas');
                        canvas.width = logoImg.naturalWidth;
                        canvas.height = logoImg.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(logoImg, 0, 0);
                        const logoData = canvas.toDataURL('image/jpeg'); // JPEG é mais rápido e leve para fundo

                        docArg.addImage(logoData, 'JPEG', wmX, wmY, wmWidth, wmHeight);
                        docArg.restoreGraphicsState();
                    } catch (e) { }
                }

                // 3. Cabeçalho (Sempre Presente)
                let headY = 20;

                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(22);
                docArg.setTextColor(50, 50, 50);
                docArg.text('HANUTHAI', width / 2, headY, { align: 'center' });

                headY += 7;
                docArg.setFontSize(10);
                docArg.setFont('helvetica', 'normal');
                docArg.setTextColor(100, 100, 100);
                docArg.text('SIMULADOR DE PERSONALIZAÇÃO', width / 2, headY, { align: 'center' });

                headY += 8;
                docArg.setDrawColor(200, 200, 200);
                docArg.line(20, headY, width - 20, headY);

                // Retorna onde o conteúdo deve começar
                return headY + 10;
            };

            // --- GERAÇÃO DAS PÁGINAS ---
            let currentY = drawPageTemplate(doc);

            // Sub-cabeçalho da Primeira Página
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`PEDIDO #${id}`, margin, currentY);
            doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 15;

            // --- C. IMAGEM (Snapshot do Simulador) ---
            // A imagem só vai na primeira página
            if (this.cachedSnapshot) {
                try {
                    const imgProps = doc.getImageProperties(this.cachedSnapshot);
                    // Ajustar para caber na página mantendo aspect ratio
                    const maxImgWidth = pageWidth * 0.7;
                    const maxImgHeight = pageHeight * 0.6; // No máximo 60% da altura da página

                    let imgWidth = maxImgWidth;
                    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    // Se ficar muito alta, reduz
                    if (imgHeight > maxImgHeight) {
                        imgHeight = maxImgHeight;
                        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                    }

                    const xKey = (pageWidth - imgWidth) / 2;

                    // Sem moldura, apenas a imagem limpa
                    doc.addImage(this.cachedSnapshot, 'PNG', xKey, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                } catch (e) {
                    console.error('Erro ao adicionar imagem:', e);
                    currentY += 20;
                }
            } else {
                currentY += 10;
            }

            // --- D. RESUMO TEXTUAL (LEGACY - FAST) ---

            // Título da Seção
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = drawPageTemplate(doc);
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
            doc.text('RESUMO DO PEDIDO', pageWidth / 2, currentY + 5.5, { align: 'center' });
            currentY += 15;

            // Loop de itens
            doc.setFontSize(11);
            const rows = Array.from(document.querySelectorAll('#summary-body tr'));

            const validRows = rows.filter(row => {
                const style = window.getComputedStyle(row);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                const txt = row.innerText.trim();
                // Filtros de linhas indesejadas
                if (!txt || txt === ':' || txt.includes('Valor Base do Pedido') || txt.includes('Total:') || txt.includes('AVISO IMPORTANTE')) return false;
                return true;
            });

            validRows.forEach(row => {
                const cols = row.querySelectorAll('td');

                if (cols.length >= 2) {
                    // Helper de Limpeza Profunda (WHITELIST APPROACH)
                    // Permite apenas: Letras, Números, Espaços, Pontuação Básica, Acentos PT-BR, Símbolos de Moeda
                    const cleanDeep = (str) => {
                        if (!str) return '';
                        // 1. Remover sequências de lixo específicas primeiro
                        let s = str.replace(/!9þ|!9|& ?þ|&þ|þ|Ø=ÜÅ/g, '');

                        // 2. FILTRO WHITELIST (O mais seguro)
                        // Mantém: a-z A-Z 0-9 
                        // Acentos: \u00C0-\u00FF (Latin-1 Supplement: á, é, í, ó, ú, ç, ñ, etc.)
                        // Pontuação: . , : ; ( ) [ ] { } - _ + = / \ | ' " ? ! @ # $ % *
                        // Espaços: \s
                        s = s.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s\.,:;()\[\]\{\}\-_+=/\\|'"?!@#$%*R$]/g, '');

                        return s.replace(/\s+/g, ' ').trim();
                    };

                    let label = cleanDeep(cols[0].innerText);
                    let detail = cleanDeep(cols[1].innerText);

                    // NEW: Se houver um input ou textarea, capturar o VALUE em vez do innerText
                    const inputEl = cols[1].querySelector('input, textarea');
                    if (inputEl) {
                        detail = cleanDeep(inputEl.value);
                    }

                    let price = cols[2]?.innerText.trim() || '';

                    // Ajuste para labels vazios ou duplicados
                    if (label.length < 3) {
                        const rawDetail = cols[1].innerText;
                        const parts = rawDetail.split('\n');
                        if (parts.length > 1) {
                            label = cleanDeep(parts[0]);
                            detail = cleanDeep(parts.slice(1).join(' '));
                        } else {
                            label = detail;
                            detail = '';
                        }
                    }

                    if (!label && detail) { label = detail; detail = ''; }
                    if (!label && !detail) return;

                    // --- TRATAMENTO ESPECIAL: ARQUIVOS & MATRIZ ---
                    if (label.includes('Taxa de Matriz') && detail.includes('Arquivo:')) {
                        // Forçar quebra de linha antes de "Arquivo:" e "Cobrado"
                        detail = detail
                            .replace('(Arquivo:', '\n(Arquivo:')
                            .replace('Cobrado uma', '\nCobrado uma');

                        // Quebrar nomes de arquivos longos forçadamente
                        const fileMatch = detail.match(/\(Arquivo:\s*([^\n]+)/);
                        if (fileMatch && fileMatch[1]) {
                            const originalName = fileMatch[1];
                            // Inserir espaço a cada 10 caracteres para garantir quebra
                            const brokenName = originalName.replace(/.{10}/g, '$& ');
                            detail = detail.replace(originalName, brokenName);
                        }
                    }

                    detail = detail.replace(/\n\s+/g, '\n');

                    // Cálculos de Layout Rígidos
                    doc.setFont('helvetica', 'bold');
                    const labelStr = label + (label ? ':' : '');
                    const labelW = doc.getTextWidth(labelStr + ' ');

                    doc.setFont('helvetica', 'normal');
                    const safeGap = 5; // Gap de segurança aumentado
                    const priceW = price ? doc.getTextWidth(price) : 0;

                    // LARGURA MÁXIMA DA COLUNA DE DETALHES (CRÍTICO)
                    // Garante que o texto NUNCA invada a área do preço
                    const maxDetailW = pageWidth - margin - labelW - priceW - margin - safeGap;

                    // Quebra de Linha Automática
                    // splitTextToSize vai forçar a quebra se passar de maxDetailW
                    const detailLines = detail ? doc.splitTextToSize(detail, Math.max(maxDetailW, 20)) : [];
                    const lineHeight = 4.5;
                    const blockHeight = Math.max((detailLines.length * lineHeight), lineHeight) + 2; // +2 buffer

                    // VERIFICAÇÃO DE QUEBRA DE PÁGINA
                    if (currentY + blockHeight > pageHeight - 20) {
                        doc.addPage();
                        currentY = drawPageTemplate(doc);
                    }

                    // Renderização
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0); // Preto
                    doc.text(labelStr, margin, currentY);

                    if (detailLines.length > 0) {
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(50, 50, 50); // Grafite Escuro
                        // Renderizar texto quebrado respeitando a largura
                        doc.text(detailLines, margin + labelW, currentY);
                    }

                    if (price) {
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(0, 0, 0); // Preto
                        doc.text(price, pageWidth - margin, currentY, { align: 'right' });
                    }

                    currentY += blockHeight;
                }
                else if (cols.length === 1) {
                    let text = cols[0].innerText.trim();

                    // NEW: Se houver um input ou textarea em linha de coluna única, priorizar o VALUE
                    const singleInput = cols[0].querySelector('input, textarea');
                    if (singleInput) {
                        // Tenta pegar o label se houver (ex: 'Observações:')
                        const labelEl = cols[0].querySelector('label');
                        const labelPrefix = labelEl ? labelEl.innerText.trim() + ' ' : '';
                        text = labelPrefix + singleInput.value.trim();
                    }

                    if (!text) return;

                    // Títulos de Subseção
                    if (['DETALHES DO PRODUTO', 'DETALHAMENTO FINANCEIRO', '1. CONFIGURAÇÃO DE BASE'].some(h => text.includes(h))) {
                        if (currentY + 15 > pageHeight - 20) { doc.addPage(); currentY = drawPageTemplate(doc); }

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(9);
                        doc.setFillColor(230, 230, 230);
                        doc.rect(margin, currentY, pageWidth - (margin * 2), 5, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.text(text, margin + 2, currentY + 3.5);
                        currentY += 7;
                        doc.setFontSize(11);
                        return;
                    }

                    if (text.includes('TOTAL FINAL')) return;

                    // Helper Local de Limpeza (WHITELIST APPROACH)
                    const cleanDeepLocal = (str) => {
                        if (!str) return '';
                        let s = str.replace(/!9þ|!9|& ?þ|&þ|þ|Ø=ÜÅ/g, '');
                        // Mantém apenas caracteres seguros (Alfanuméricos, Acentos, Pontuação básica, R$)
                        s = s.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s\.,:;()\[\]\{\}\-_+=/\\|'"?!@#$%*R$]/g, '');
                        return s.replace(/\s+/g, ' ').trim();
                    };

                    // Limpeza específica para estas linhas de texto
                    text = cleanDeepLocal(text);

                    if (text) {
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(10);
                        doc.setTextColor(80, 80, 80);

                        const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
                        const h = (lines.length * 4.5) + 3;

                        if (currentY + h > pageHeight - 20) { doc.addPage(); currentY = drawPageTemplate(doc); }

                        doc.text(lines, margin, currentY);
                        currentY += h;

                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'normal');
                    }
                }
            });



            // --- E. TOTAL FINAL ---
            // Verifica espaço para o Total (precisa de uns 30mm)
            if (currentY + 30 > pageHeight - 20) {
                doc.addPage();
                currentY = drawPageTemplate(doc);
            }

            currentY += 5;
            const totalDisplay = document.getElementById('price-display');
            let totalText = totalDisplay ? totalDisplay.innerText.replace(/\n.*/g, '').trim() : 'R$ 0,00';

            // Limpeza Final do Total (WHITELIST)
            totalText = totalText.replace(/!9þ|!9|& ?þ|&þ|þ|Ø=ÜÅ/g, '');
            totalText = totalText.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s\.,:;()\[\]\{\}\-_+=/\\|'"?!@#$%*R$]/g, '');
            totalText = totalText.replace(/\s+/g, ' ').trim();

            doc.setDrawColor(0);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 10;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL FINAL: ${totalText}`, pageWidth / 2, currentY, { align: 'center' });
            currentY += 20;

            // --- F. TERMOS ---
            // Verifica espaço (precisa de uns 40-50mm)
            // Se não couber, nova página
            const termsText = "AVISO IMPORTANTE: Este documento é uma SIMULAÇÃO DIGITAL para fins de orçamento e visualização. O resultado final físico pode apresentar pequenas variações de cor, tamanho, proporções e ajuste, devido aos processos artesanais e à calibração de cada monitor. Todos os arquivos e artes passarão por análise técnica de viabilidade de bordado, e o valor final está sujeito a confirmação após essa avaliação. Ao prosseguir, você declara que leu e concorda com todas as informações e condições do produto disponíveis em nosso FAQ, além de confirmar que possui os direitos autorais sobre as artes enviadas, assumindo total responsabilidade legal. Em caso de dúvidas, entre em contato com nossa equipe.";
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            const termsLines = doc.splitTextToSize(termsText, pageWidth - (margin * 2));
            const termsHeight = (termsLines.length * 4) + 15;

            if (currentY + termsHeight > pageHeight - 20) {
                doc.addPage();
                currentY = drawPageTemplate(doc);
            }

            doc.text(termsLines, pageWidth / 2, currentY, { align: 'center' });
            currentY += termsHeight;

            // --- G. QR CODES ---
            // Precisa de 60mm
            if (currentY + 60 > pageHeight - 20) {
                doc.addPage();
                currentY = drawPageTemplate(doc);
            }

            const generateQR = (text) => {
                const el = document.createElement('div');
                new QRCode(el, { text: text, width: 512, height: 512, correctLevel: QRCode.CorrectLevel.H });
                return el.querySelector('canvas').toDataURL('image/png');
            };

            const qrSize = 50; const qrGap = 40;
            const qrStartX = (pageWidth - (qrSize * 2 + qrGap)) / 2;

            try {
                // QR 1
                const idPrefix = id.split('-')[0];
                const qr1Data = generateQR(id);
                doc.addImage(qr1Data, 'PNG', qrStartX, currentY, qrSize, qrSize);

                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text('Pedido Nº', qrStartX + (qrSize / 2), currentY - 3, { align: 'center' });
                doc.text(idPrefix, qrStartX + (qrSize / 2), currentY + qrSize + 5, { align: 'center' });

                // QR 2
                const qr2Data = generateQR(id);
                const qr2X = qrStartX + qrSize + qrGap;
                doc.addImage(qr2Data, 'PNG', qr2X, currentY, qrSize, qrSize);

                doc.text('ID Simulador:', qr2X + (qrSize / 2), currentY - 3, { align: 'center' });
                doc.text(id, qr2X + (qrSize / 2), currentY + qrSize + 5, { align: 'center' });

            } catch (errqr) { }

            // --- G. SALVAR ---
            const pdfBase64 = doc.output('datauristring').split(',').pop();
            this.updateModalButton('saving');
            const savedPath = await this.saveToLocalFolder(id, pdfBase64, 'pdf');

            if (savedPath) {
                const fileName = savedPath.split(/[/\\]/).pop();
                const publicUrl = `assets/BancoDados/PedidosPDF/${fileName}`;
                this.savedPdfUrl = publicUrl;
                this.updateModalButton('ready', publicUrl);
            } else {
                doc.save(`Pedido_${id}.pdf`);
                this.updateModalButton('ready', '#');
            }

        } catch (err) {
            console.error('Erro PDF:', err);
            this.updateModalButton('error');
            alert('Erro: ' + err.message);
        }
    },

    /**
     * Gera e salva PDF em segundo plano (para carrinho)
     * Retorna a URL do PDF salvo ou null se falhar
     */
    async generateAndSaveForCart() {
        const id = this.context.state?.simulationId || 'HNT_PEDIDO';

        try {
            // 1. Garantir dependências
            if (typeof window.jspdf === 'undefined' || typeof QRCode === 'undefined') {
                const loaded = await this.loadDependencies();
                if (!loaded) {
                    console.warn('⚠️ Bibliotecas de PDF não carregaram. PDF não será gerado.');
                    alert('Erro: Bibliotecas de PDF não carregaram. Verifique sua conexão.');
                    return null;
                }
            }

            // 2. Garantir que temos snapshot atualizado
            if (!this.cachedSnapshot) {
                console.log('📸 Capturando snapshot para PDF...');
                await this.updateSnapshot(true);
            }

            // 3. Gerar PDF (mesmo código do generateBackgroundPDF, mas sem UI)
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;

            // Template de página (função auxiliar inline)
            const drawPageTemplate = (docArg) => {
                const width = docArg.internal.pageSize.getWidth();
                const height = docArg.internal.pageSize.getHeight();

                docArg.setFillColor(255, 255, 255);
                docArg.rect(0, 0, width, height, 'F');

                // Marca D'água
                const logoDataUrl = 'assets/logo.png';
                try {
                    const wmWidth = width * 0.9;
                    const ratio = 1;
                    const wmHeight = wmWidth * ratio;
                    const wmX = (width - wmWidth) / 2;
                    const wmY = (height - wmHeight) / 2;
                    docArg.saveGraphicsState();
                    docArg.setGState(new docArg.GState({ opacity: 0.05 }));
                    docArg.addImage(logoDataUrl, 'PNG', wmX, wmY, wmWidth, wmHeight);
                    docArg.restoreGraphicsState();
                } catch (e) { }

                // Cabeçalho
                const headY = 10;
                docArg.setFontSize(18);
                docArg.setFont('helvetica', 'bold');
                docArg.setTextColor(212, 175, 55);
                docArg.text('HANUTHAI', width / 2, headY, { align: 'center' });

                return headY + 10;
            };

            let currentY = drawPageTemplate(doc);

            // Sub-cabeçalho
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`PEDIDO #${id}`, margin, currentY);
            doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 15;

            // Imagem do produto
            if (this.cachedSnapshot) {
                try {
                    const imgProps = doc.getImageProperties(this.cachedSnapshot);
                    const maxImgWidth = pageWidth - (margin * 2);
                    const maxImgHeight = pageHeight * 0.5;

                    let imgWidth = 140;
                    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    if (imgHeight > maxImgHeight) {
                        imgHeight = maxImgHeight;
                        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                    }

                    const xKey = (pageWidth - imgWidth) / 2;
                    doc.addImage(this.cachedSnapshot, 'PNG', xKey, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 15;
                } catch (e) {
                    console.error('Erro ao adicionar imagem:', e);
                    currentY += 20;
                }
            } else {
                currentY += 10;
            }

            // Resumo (simplificado - apenas pega do DOM)
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = drawPageTemplate(doc);
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
            doc.text('RESUMO DO PEDIDO', pageWidth / 2, currentY + 5.5, { align: 'center' });
            currentY += 15;

            // Total
            const totalDisplay = document.getElementById('price-display');
            let totalText = totalDisplay ? totalDisplay.innerText.replace(/\n.*/g, '').trim() : 'R$ 0,00';

            // Limpeza (whitelist)
            totalText = totalText.replace(/!9þ|!9|& ?þ|&þ|þ|Ø=ÜÅ/g, '');
            totalText = totalText.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s\.,:;()\[\]\{\}\-_+=/\\|'"?!@#$%*R$]/g, '');
            totalText = totalText.replace(/\s+/g, ' ').trim();

            doc.setDrawColor(0);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL FINAL: ${totalText}`, pageWidth / 2, currentY, { align: 'center' });

            // Salvar
            const pdfBase64 = doc.output('datauristring').split(',').pop();
            const savedPath = await this.saveToLocalFolder(id, pdfBase64, 'pdf');

            if (savedPath) {
                const fileName = savedPath.split(/[/\\]/).pop();
                const publicUrl = `assets/BancoDados/PedidosPDF/${fileName}`;
                console.log(`✅ PDF salvo para carrinho: ${publicUrl}`);
                return publicUrl;
            } else {
                console.warn('⚠️ Falha ao salvar PDF no servidor');
                return null;
            }

        } catch (err) {
            console.error('❌ Erro ao gerar PDF para carrinho:', err);
            alert('Erro ao gerar PDF: ' + err.message);
            return null;
        }
    }
};

// Hook automático para atualizar snapshot quando o simulador mudar
if (typeof window !== 'undefined') {
    window.PDFGenerator = PDFGenerator;

    // Captura inicial após 3 segundos
    setTimeout(() => {
        if (PDFGenerator.updateSnapshot) {
            PDFGenerator.updateSnapshot();
        }
    }, 3000);

    // Recapturar quando houver mudanças visuais
    // (conectar com scheduleRender se disponível)
    if (typeof scheduleRender !== 'undefined') {
        const originalScheduleRender = scheduleRender;
        window.scheduleRender = function (...args) {
            originalScheduleRender(...args);
            // Agendar atualização do snapshot (debounced)
            if (PDFGenerator.updateSnapshot) {
                setTimeout(() => PDFGenerator.updateSnapshot(), 500);
            }
        };
    }
}

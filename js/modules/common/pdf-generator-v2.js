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
            const response = await fetch('/api/save-pedido', {
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
                loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', 'jspdf'),
                loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'QRCode')
            ]);
            return true;
        } catch (e) {
            console.error('Erro ao carregar libs de PDF/QR:', e);
            return false;
        }
    },

    /**
     * Gera um PDF real em background usando jsPDF (EXPERT v15)
     */
    async generateBackgroundPDF() {
        if (typeof window.jspdf === 'undefined' || typeof QRCode === 'undefined') {
            const loaded = await this.loadDependencies();
            if (!loaded) {
                alert('Erro: Bibliotecas de PDF não carregaram.');
                this.updateModalButton('error');
                return;
            }
        }

        const id = this.context.state?.simulationId || 'HNT_PEDIDO';

        try {
            // 1. FORÇAR ATUALIZAÇÃO (Feedback Visual)
            this.updateModalButton('loading');
            console.log('🔄 Sincronizando canvas e resumo...');
            await this.updateSnapshot(true); // Força novo snapshot

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;

            // --- TEMPLATE UNITÁRIO (Padrão Expert) ---
            const drawExpertTemplate = (docArg) => {
                const width = docArg.internal.pageSize.getWidth();
                const height = docArg.internal.pageSize.getHeight();

                // Degradê
                for (let i = 0; i < height; i++) {
                    const grey = 248 - Math.floor((i / height) * 8);
                    docArg.setFillColor(grey, grey, grey);
                    docArg.rect(0, i, width, 1, 'F');
                }

                // Marca D'água
                const logoImg = document.querySelector('.header-logo-img') || document.querySelector('img[src*="logo"]');
                if (logoImg) {
                    try {
                        docArg.saveGraphicsState();
                        docArg.setGState(new docArg.GState({ opacity: 0.03 }));
                        const ratio = logoImg.naturalHeight / logoImg.naturalWidth;
                        const wmWidth = width * 0.75;
                        const wmHeight = wmWidth * ratio;
                        docArg.addImage(logoImg, 'PNG', (width - wmWidth) / 2, (height - wmHeight) / 2, wmWidth, wmHeight);
                        docArg.restoreGraphicsState();
                    } catch (e) { }
                }

                // Borda Dourada
                docArg.setDrawColor(212, 175, 55);
                docArg.setLineWidth(0.5);
                docArg.rect(margin - 2, margin - 2, width - (margin * 2) + 4, height - (margin * 2) + 4, 'S');

                // Header
                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(22);
                docArg.setTextColor(30, 30, 30);
                docArg.text('HANUTHAI', margin, margin + 10);
                docArg.setFontSize(8);
                docArg.setFont('helvetica', 'normal');
                docArg.setTextColor(120, 120, 120);
                docArg.text('CUSTOM APPAREL & FIGHTWEAR', margin, margin + 14);

                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(10);
                docArg.setTextColor(0, 0, 0);
                docArg.text(`PEDIDO: #${id}`, width - margin, margin + 8, { align: 'right' });
                docArg.setFontSize(7);
                docArg.setFont('helvetica', 'normal');
                docArg.text(`ID SIMULADOR: ${id}`, width - margin, margin + 12, { align: 'right' });

                return margin + 22;
            };

            let currentY = drawExpertTemplate(doc);

            // 2. IMAGEM (MAIOR ÁREA POSSÍVEL)
            if (this.cachedSnapshot) {
                const imgProps = doc.getImageProperties(this.cachedSnapshot);
                const maxW = pageWidth - (margin * 2);
                const maxH = pageHeight * 0.55;
                let imgW = maxW;
                let imgH = (imgProps.height * imgW) / imgProps.width;
                if (imgH > maxH) {
                    imgH = maxH;
                    imgW = (imgProps.width * imgH) / imgProps.height;
                }
                doc.addImage(this.cachedSnapshot, 'PNG', (pageWidth - imgW) / 2, currentY, imgW, imgH);
                currentY += imgH + 8;
            }

            // 3. RESUMO LINEAR CONDENSADO
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(212, 175, 55);
            doc.text('DETALHES DO ORÇAMENTO', margin, currentY);
            currentY += 8;

            const clean = (s) => s ? s.replace(/[^a-zA-Z0-9\u00C0-\u00FF\s.,:;()\[\]\-_+/\\|'"?!@#$%*R$]/g, '').trim() : '';
            const rows = Array.from(document.querySelectorAll('#summary-body tr')).filter(r => {
                const s = window.getComputedStyle(r);
                return s.display !== 'none' && r.innerText.trim() && !r.innerText.includes('Total:');
            });

            doc.setFontSize(10);
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                if (cols.length < 2) return;

                let label = clean(cols[0].innerText);
                let value = clean(cols[1].innerText || cols[1].querySelector('input, textarea')?.value);
                let price = clean(cols[2]?.innerText);

                if (!label && value) { label = value; value = ''; }
                if (!label) return;

                if (currentY > pageHeight - 35) {
                    doc.addPage();
                    currentY = drawExpertTemplate(doc);
                }

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(50, 50, 50);
                doc.text(label + (value ? ` (${value})` : '') + ':', margin, currentY);
                if (price) {
                    doc.text(price, pageWidth - margin, currentY, { align: 'right' });
                }
                currentY += 5.5;
            });

            // 4. TOTAL EM DESTAQUE
            currentY += 3;
            doc.setDrawColor(212, 175, 55);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 8;

            const totalDisplay = document.getElementById('price-display');
            const totalText = clean(totalDisplay ? totalDisplay.innerText.replace(/\n.*/g, '') : 'R$ 0,00');

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('INVESTIMENTO ESTIMADO:', margin, currentY);
            doc.text(totalText, pageWidth - margin, currentY, { align: 'right' });
            currentY += 12;

            // 5. TERMOS
            const terms = "⚠️ AVISO IMPORTANTE: Este documento é uma SIMULAÇÃO DIGITAL. O resultado físico pode apresentar pequenas variações. Artes passarão por análise técnica. Ao prosseguir, você concorda com os termos e confirma direitos sobre as artes enviadas.";
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            const termLines = doc.splitTextToSize(terms, pageWidth - (margin * 2));
            doc.text(termLines, margin, currentY);
            currentY += (termLines.length * 3.5) + 12;

            // 6. QR CODES GIGANTES (75% Largura)
            const qrSize = (pageWidth - (margin * 4)) * 0.45;
            const qrGap = 20;
            const qrX1 = (pageWidth - (qrSize * 2 + qrGap)) / 2;
            const qrX2 = qrX1 + qrSize + qrGap;

            const generateQR = (t) => {
                const d = document.createElement('div');
                new QRCode(d, { text: t, width: 256, height: 256 });
                return d.querySelector('canvas').toDataURL('image/png');
            };

            try {
                const q1 = generateQR(id);
                doc.addImage(q1, 'PNG', qrX1, currentY, qrSize, qrSize);
                doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                doc.text('Pedido Nº', qrX1 + (qrSize / 2), currentY - 3, { align: 'center' });

                const q2 = generateQR(id);
                doc.addImage(q2, 'PNG', qrX2, currentY, qrSize, qrSize);
                doc.text('ID Simulador:', qrX2 + (qrSize / 2), currentY - 3, { align: 'center' });
            } catch (e) { console.warn("QR Error", e); }

            // SALVAR
            const pdfBase64 = doc.output('datauristring').split(',').pop();
            const fileName = `Pedido_${id}`;
            this.updateModalButton('saving');

            if (typeof SupabaseAdapter !== 'undefined') {
                const url = await SupabaseAdapter.uploadFile('pedidos_pdf', `${fileName}.pdf`, pdfBase64, 'application/pdf');
                if (url) {
                    this.savedPdfUrl = url;
                    this.updateModalButton('ready', url);
                    return url;
                }
            }

            doc.save(`${fileName}.pdf`);
            this.updateModalButton('ready', '#');

        } catch (err) {
            console.error('PDF Error:', err);
            this.updateModalButton('error');
        }
    },

    /**
     * Gera e salva PDF em segundo plano (para carrinho)
     */
    async generateAndSaveForCart(customId = null) {
        return this.generateBackgroundPDF(); // Reutiliza motor expert unificado
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

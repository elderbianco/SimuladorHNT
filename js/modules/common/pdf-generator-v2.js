/**
 * Módulo de Geração de PDF (v15 - NUCLEAR) - Atomic Print Technology
 * Renderização DIRETA via Canvas para garantir fidelidade de imagem.
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
    isCaptureBroken: false,
    savedPdfUrl: null,

    prepareDraft(state, pricing, productData) {
        this.context.state = state;
        this.context.pricing = pricing;
        this.context.productData = productData;
    },

    /**
     * Motor de Renderização Nuclear v15.12 (Hyper-Fidelity)
     * Usa html2canvas + Pré-processamento Base66 para garantir rotação e escala exatas.
     */
    /**
     * Motor de Renderização Nuclear v16 (Hyper-Fidelity Centralizado)
     */
    async drawManualSnapshot() {
        return new Promise(async (resolve) => {
            try {
                console.log('☢️ Motor Nuclear v16 (Focus on Items) Ativado...');

                const originalArea = document.querySelector('.simulator-area');
                const targetWrapper = document.querySelector('.simulator-wrapper');

                if (!originalArea || !targetWrapper) {
                    console.error('❌ Simulador não encontrado!');
                    return resolve(null);
                }

                // --- 1. CRIANDO O CLONE FANTASMA APENAS DO WRAPPER (Customização) ---
                console.log('🔄 Sincronizando Design para Captura Transparente...');

                const ghostWrapper = targetWrapper.cloneNode(true);
                ghostWrapper.id = 'simulator-ghost-v16';

                const wrapperRect = targetWrapper.getBoundingClientRect();

                Object.assign(ghostWrapper.style, {
                    position: 'absolute',
                    left: '-20000px', // Oculto da tela
                    top: '0px',
                    width: `${Math.floor(wrapperRect.width)}px`,
                    height: `${Math.floor(wrapperRect.height)}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    overflow: 'visible',
                    zIndex: '-999',
                    transform: 'none', // Remove any zoom scale for capture
                    margin: '0',
                    padding: '0'
                });

                document.body.appendChild(ghostWrapper);

                // CSS Nuke no clone (Ocultar UI elements)
                const elementsToHide = ghostWrapper.querySelectorAll('.drag-handle, .resize-handle, .delete-btn, .ui-resizable-handle, .limit-layer, .selection-border');
                elementsToHide.forEach(el => el.remove());

                const targetBorders = ghostWrapper.querySelectorAll('.ui-selected, .ui-wrapper, .custom-element');
                targetBorders.forEach(el => {
                    el.style.setProperty('outline', 'none', 'important');
                    el.style.setProperty('box-shadow', 'none', 'important');
                    el.style.setProperty('border', 'none', 'important');
                });

                // Imunização Base64
                const toBase64 = (url) => new Promise((res) => {
                    if (!url || url.startsWith('data:')) return res(url);
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        res(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => res(url);
                    img.src = url;
                });

                const ghostImgs = Array.from(ghostWrapper.querySelectorAll('img'));
                for (const img of ghostImgs) {
                    if (img.src && !img.src.startsWith('data:')) {
                        img.src = await toBase64(img.src);
                    }
                }

                const ghostWithBg = Array.from(ghostWrapper.querySelectorAll('*')).filter(el => {
                    const bg = window.getComputedStyle(el).backgroundImage;
                    return bg && bg !== 'none' && bg.includes('url(');
                });

                for (const el of ghostWithBg) {
                    const bgUrl = window.getComputedStyle(el).backgroundImage.slice(4, -1).replace(/"/g, "");
                    if (!bgUrl.startsWith('data:')) {
                        const b64 = await toBase64(bgUrl);
                        el.style.backgroundImage = `url("${b64}")`;
                    }
                }

                // --- 2. CAPTURA DOS SHORTS (Transparente) ---
                let shortsDataUrl = null;
                if (typeof html2canvas !== 'undefined') {
                    const canvasResult = await html2canvas(ghostWrapper, {
                        scale: 3, // Resolução Elevada
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: null, // Transparente!
                        logging: false,
                        width: Math.floor(wrapperRect.width),
                        height: Math.floor(wrapperRect.height)
                    });
                    shortsDataUrl = canvasResult.toDataURL('image/png');
                }
                document.body.removeChild(ghostWrapper);

                if (!shortsDataUrl) {
                    throw new Error("html2canvas falhou ao capturar os items");
                }

                // --- 3. MISTURAR COM O BACKGROUND NA POSIÇÃO CORRETA E TAMANHO MAXIMIZADO ---
                const finalCanvas = document.createElement('canvas');
                const ctx = finalCanvas.getContext('2d');
                finalCanvas.width = 1600; // Tamanho grande e padronizado
                finalCanvas.height = 1200;

                // A. Carregar Fundo Escuro Base
                ctx.fillStyle = '#111111';
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                // B. Carregar Imagem RingHNT
                const loadImage = (src) => new Promise((res) => {
                    if (!src) return res(null);
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => res(img);
                    img.onerror = () => res(null);
                    img.src = src;
                });

                // Possíveis caminhos da imagem Ring
                const ringImg = await loadImage('Icons/RingHNT.jpeg') || await loadImage('assets/Icons/RingHNT.jpeg') || await loadImage('../Icons/RingHNT.jpeg') || await loadImage('assets/Galeria/RingHNT.jpeg');
                if (ringImg) {
                    // Preencher o fundo
                    ctx.drawImage(ringImg, 0, 0, finalCanvas.width, finalCanvas.height);
                }

                // C. Carregar Shorts Transparente e Desenhar Centralizado/Ampliado!
                const shortsImg = await loadImage(shortsDataUrl);
                if (shortsImg) {
                    // Calcular proporção para que ocupe quase toda a tela do canvas 1600x1200
                    const marginY = 20;
                    const marginX = 20;
                    const targetW = finalCanvas.width - (marginX * 2);
                    const targetH = finalCanvas.height - (marginY * 2);

                    let scale = Math.min(targetW / shortsImg.width, targetH / shortsImg.height); // Manter proporção

                    // Aumentar agressivamente a escala (Dinâmico por Produto)
                    let extraScale = 1.6; // Padrão
                    const prod = this.context.state?.productInitial;
                    if (prod === 'TP' || prod === 'Top') {
                        extraScale = 2.4; // Mega Zoom para o Top
                    }
                    scale = scale * extraScale;

                    // Limitar a largura do canvas
                    if (shortsImg.width * scale > finalCanvas.width * 0.95) {
                        scale = (finalCanvas.width * 0.95) / shortsImg.width;
                    }

                    // Limitar a altura do canvas
                    if (shortsImg.height * scale > finalCanvas.height * 0.95) {
                        scale = (finalCanvas.height * 0.95) / shortsImg.height;
                    }

                    const drawW = shortsImg.width * scale;
                    const drawH = shortsImg.height * scale;

                    const drawX = (finalCanvas.width - drawW) / 2;
                    let drawY = ((finalCanvas.height - drawH) / 2) + 40;

                    // Ajuste fino para o Top centralizar melhor no centro do ring
                    if (prod === 'TP' || prod === 'Top') {
                        drawY = ((finalCanvas.height - drawH) / 2) + 20;
                    }

                    ctx.drawImage(shortsImg, drawX, drawY, drawW, drawH);
                }

                const finalSnapshot = finalCanvas.toDataURL('image/jpeg', 0.95);
                console.log('✅ Print ISOLATED CLONE v16 CONCLUÍDO.');
                resolve(finalSnapshot);

            } catch (e) {
                console.error('❌ Erro Crítico Clone Engine v16:', e);
                const ghost = document.getElementById('simulator-ghost-v16');
                if (ghost) document.body.removeChild(ghost);

                // Fallback legado
                const snapshot = await this.drawLegacyManualSnapshot();
                resolve(snapshot);
            }
        });
    },

    /**
     * Motor de Backup Low-Level (v15.5)
     */
    async drawLegacyManualSnapshot() {
        return new Promise(async (resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1600; canvas.height = 1200;

                ctx.fillStyle = '#111111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const container = document.querySelector('.simulator-wrapper');
                if (!container) return resolve(null);

                const rect = container.getBoundingClientRect();

                // Padronizando scale
                const padding = 20;
                let scale = Math.min((1600 - padding * 2) / rect.width, (1200 - padding * 2) / rect.height);

                // Ampliando agressivamente o scale manual (Dinâmico por Produto)
                let extraScale = 1.6;
                const prod = this.context.state?.productInitial;
                if (prod === 'TP' || prod === 'Top') {
                    extraScale = 2.4;
                }
                scale = scale * extraScale;
                if (rect.width * scale > 1600 * 0.95) {
                    scale = (1600 * 0.95) / rect.width;
                }
                if (rect.height * scale > 1200 * 0.95) {
                    scale = (1200 * 0.95) / rect.height;
                }

                const offsetX = (1600 - (rect.width * scale)) / 2;
                let offsetY = ((1200 - (rect.height * scale)) / 2) + 40;

                if (prod === 'TP' || prod === 'Top') {
                    offsetY = ((1200 - (rect.height * scale)) / 2) + 20;
                }

                const loadImage = (src) => new Promise((res) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => res(img);
                    img.onerror = () => res(null);
                    img.src = src;
                });

                // Desenhar Fundo
                const ringImg = await loadImage('Icons/RingHNT.jpeg') || await loadImage('RingHNT.jpeg');
                if (ringImg) ctx.drawImage(ringImg, 0, 0, 1600, 1200);

                const items = Array.from(container.querySelectorAll('img, [style*="background-image"]'));
                for (const item of items) {
                    const s = window.getComputedStyle(item);
                    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue;

                    const r = item.getBoundingClientRect();
                    const src = (item.tagName === 'IMG' ? item.src : s.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)?.[1]);

                    if (src) {
                        const img = await loadImage(src);
                        if (img) {
                            ctx.save();
                            const x = offsetX + (r.left - rect.left + r.width / 2) * scale;
                            const y = offsetY + (r.top - rect.top + r.height / 2) * scale;
                            ctx.translate(x, y);

                            if (s.transform !== 'none') {
                                const m = s.transform.match(/matrix\((.+)\)/)?.[1].split(',').map(parseFloat);
                                if (m) ctx.transform(m[0], m[1], m[2], m[3], 0, 0);
                            }
                            ctx.drawImage(img, -(r.width * scale) / 2, -(r.height * scale) / 2, r.width * scale, r.height * scale);
                            ctx.restore();
                        }
                    }
                }
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (e) { resolve(null); }
        });
    },

    async updateSnapshot(force = false) {
        if (this.isCaptureBroken && !force) return;
        if (this.captureInProgress) return;

        const now = Date.now();
        if (!force && (now - this.lastCaptureTime < 2000)) return;

        this.captureInProgress = true;
        this.lastCaptureTime = now;

        try {
            console.log('☢️ Ativando Renderização Industrial Direta (v16)...');
            const snapshot = await this.drawManualSnapshot();

            if (snapshot && snapshot.length > 1000) {
                this.cachedSnapshot = snapshot;
                console.log(`✅ Snapshot v16 gerado: ${Math.round(snapshot.length / 1024)} KB`);
                this.isCaptureBroken = false;
            } else {
                console.error('❌ Falha na geração do Snapshot v16.');
            }
        } catch (e) {
            console.error('❌ Erro no motor Nuclear v16:', e);
            this.isCaptureBroken = true;
        } finally {
            this.captureInProgress = false;
        }
    },

    showCaptureFlash() {
        // Desativado na v15.8 para evitar incômodo visual
        /*
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#fff; z-index:100000; pointer-events:none; opacity:1; transition: opacity 0.4s ease-out;';
        document.body.appendChild(flash);
        requestAnimationFrame(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        });
        */
    },

    getVisualFallback() {
        const originalWrapper = document.querySelector('.simulator-wrapper');
        if (!originalWrapper) return '<div style="text-align:center;">[Visual Indisponível]</div>';
        const clone = originalWrapper.cloneNode(true);
        clone.querySelectorAll('.drag-handle, .resize-handle, .ui-draggable-handle, .limit-layer').forEach(el => el.remove());
        clone.style.transform = 'scale(0.8)';
        clone.style.transformOrigin = 'top center';
        clone.style.position = 'relative';
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.height = '500px';
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

        // Resetar estado do botão para "Iniciando..." e bloquear preview temporariamente
        this.updateModalButton('loading');

        // Sincronizar dados da tabela (Instantâneo)
        const source = document.getElementById('summary-body');
        const target = document.getElementById('summary-body-modal');
        if (source && target) target.innerHTML = source.innerHTML;

        const titleEl = document.querySelector('#summary-modal .modal-header h3');
        if (titleEl && this.context.state?.simulationId) {
            titleEl.innerText = `RESUMO DO PEDIDO (#${this.context.state.simulationId})`;
        }

        modal.style.display = 'flex';

        // --- NOVO: FORÇAR CAPTURA INSTANTÂNEA E RENDERIZAR SÓ DEPOIS ---
        console.log('🔄 Forçando Atualização de Cache Visual v15.18...');
        // Limpar cache antigo para não piscar
        this.cachedSnapshot = null;

        await this.updateSnapshot(true); // Bloqueia até o retrato estar pronto

        // Renderizar prévia INSTANTÂNEA com a FOTO FRESCA da tela
        this.renderPreviewInModal();

        // Gerar PDF em background
        this.generateBackgroundPDF();
    },

    /**
     * Atualiza o botão do modal com estados de carregamento e progresso (PROGRES BAR v15)
     */
    updateModalButton(state, url = '#') {
        const btn = document.querySelector('#summary-modal .btn-action');
        const progressContainer = document.querySelector('#pdf-progress-container');
        const progressBar = document.querySelector('#pdf-progress-bar');

        if (!btn) return;

        // Reset progress bar visibility
        if (progressContainer) progressContainer.style.display = 'none';

        switch (state) {
            case 'loading':
                btn.disabled = true;
                btn.innerHTML = '<span>🔄</span> Sincronizando Design...';
                btn.style.opacity = '0.7';
                if (progressContainer) {
                    progressContainer.style.display = 'block';
                    if (progressBar) progressBar.style.width = '30%';
                }
                break;
            case 'capturing':
                btn.innerHTML = '<span>📸</span> Capturando Imagem...';
                if (progressBar) progressBar.style.width = '60%';
                break;
            case 'saving':
                btn.innerHTML = '<span>☁️</span> Salvando na Nuvem...';
                if (progressBar) progressBar.style.width = '85%';
                break;
            case 'ready':
                btn.disabled = false;
                btn.innerHTML = '<span>✅</span> PDF PRONTO - ABRIR AGORA';
                btn.style.background = '#28a745';
                btn.style.opacity = '1';
                if (progressBar) progressBar.style.width = '100%';
                if (url && url !== '#') {
                    btn.onclick = () => window.open(url, '_blank');
                }
                // Esconder barra após 1.5s
                setTimeout(() => { if (progressContainer) progressContainer.style.display = 'none'; }, 1500);
                break;
            case 'error':
                btn.disabled = false;
                btn.innerHTML = '<span>❌</span> Erro ao gerar PDF';
                btn.style.background = '#dc3545';
                if (progressContainer) progressContainer.style.display = 'none';
                break;
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
    async generateBackgroundPDF(customId = null) {
        if (typeof window.jspdf === 'undefined' || typeof QRCode === 'undefined') {
            const loaded = await this.loadDependencies();
            if (!loaded) {
                alert('Erro: Bibliotecas de PDF não carregaram.');
                this.updateModalButton('error');
                return;
            }
        }

        // Helper para gerar QR Codes assincronamente
        const generateQR = async (text) => {
            return new Promise((resolve) => {
                try {
                    const qrDiv = document.createElement('div');
                    qrDiv.style.position = 'absolute';
                    qrDiv.style.left = '-9999px';
                    qrDiv.style.top = '-9999px';
                    document.body.appendChild(qrDiv);

                    new QRCode(qrDiv, {
                        text: text,
                        width: 256,
                        height: 256,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });

                    setTimeout(() => {
                        const canvas = qrDiv.querySelector('canvas');
                        const img = qrDiv.querySelector('img');
                        const data = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
                        document.body.removeChild(qrDiv);
                        resolve(data);
                    }, 600);
                } catch (e) {
                    console.error("Erro interno QR:", e);
                    resolve(null);
                }
            });
        };

        const sku = this.context.state?.simulationId || 'HNT_SKU';
        const orderNum = this.context.state?.orderNumber || 'SN';
        const id = customId || sku;

        try {
            // Se chamado pelo openPreview, o snapshot já foi atualizado!
            // Se chamado do background (carrinho), força a atualização
            if (!this.cachedSnapshot) {
                this.updateModalButton('loading');
                console.log('🔄 Sincronizando canvas para Background PDF...');
                await this.updateSnapshot(true);
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;

            // --- TEMPLATE INSTITUCIONAL (HNT Expert v15) ---
            const drawExpertTemplate = (docArg) => {
                const width = docArg.internal.pageSize.getWidth();
                const height = docArg.internal.pageSize.getHeight();

                // 1. Degradê de Fundo Premium
                for (let i = 0; i < height; i++) {
                    const grey = 248 - Math.floor((i / height) * 8);
                    docArg.setFillColor(grey, grey, grey);
                    docArg.rect(0, i, width, 1, 'F');
                }

                // 2. Marca D'água HNT
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

                // 3. Cabeçalho HNT
                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(24);
                docArg.setTextColor(30, 30, 30);
                docArg.text('HANUTHAI', margin, margin + 12);
                docArg.setFontSize(9);
                docArg.setFont('helvetica', 'normal');
                docArg.setTextColor(120, 120, 120);
                docArg.text('INDUSTRIAL & CUSTOM APPAREL - EXPERT MODE', margin, margin + 18);

                // 4. Metadados do Pedido
                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(11);
                docArg.setTextColor(0, 0, 0);
                docArg.text(`PEDIDO: #${orderNum}`, width - margin, margin + 10, { align: 'right' });
                docArg.setFontSize(8);
                docArg.setFont('helvetica', 'normal');
                docArg.setTextColor(100, 100, 100);
                docArg.text(`CÓDIGO SKU: ${sku}`, width - margin, margin + 15, { align: 'right' });

                return margin + 25;
            };

            let currentY = drawExpertTemplate(doc);

            // 2. IMAGEM (MAIOR ÁREA POSSÍVEL, SEM EXTRAPOLAR A PÁGINA)
            if (this.cachedSnapshot && this.cachedSnapshot.length > 500) {
                try {
                    const imgProps = doc.getImageProperties(this.cachedSnapshot);
                    const maxW = pageWidth - (margin * 2);

                    // O cabeçalho ocupa ~45mm e a imagem precisa deixar espaço para o título "RESUMO..." 
                    // e evitar quebrar a marcação (QR codes, etc.). Altura máxima segura é ~65%
                    const maxH = pageHeight * 0.65;

                    let imgW = maxW;
                    let imgH = (imgProps.height * imgW) / imgProps.width;

                    if (imgH > maxH) {
                        imgH = maxH;
                        imgW = (imgProps.width * imgH) / imgProps.height;
                    }

                    // Centralizar a imagem horizontalmente
                    doc.addImage(this.cachedSnapshot, 'JPEG', (pageWidth - imgW) / 2, currentY, imgW, imgH);
                    currentY += imgH + 10;

                } catch (e) {
                    console.warn("Falha ao adicionar imagem ao PDF:", e);
                    currentY += 10;
                }
            } else {
                console.warn("Snapshot ausente ou inválido no momento da geração.");
                currentY += 10;
            }

            // --- PROTEÇÃO CONTRA ESTOURO DE PÁGINA ---
            // Se a imagem for muito alta, forçamos a tabela para começar numa margem segura
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = margin;
            }

            // 3. RESUMO HORIZONTAL OTIMIZADO
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(212, 175, 55);
            doc.text('RESUMO TÉCNICO DO ORÇAMENTO', margin, currentY);
            currentY += 8;

            // Função de Limpeza Ultra Sônica (v15.10): Remove emojis e normaliza texto para jsPDF
            const clean = (s) => {
                if (!s) return '';
                return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");
            };

            // 4. RENDERIZAÇÃO DA TABELA (RESUMO TÉCNICO)
            let tableData = [];

            // A. Cores
            Object.entries(this.context.state.parts || {}).forEach(([p, val]) => {
                tableData.push(['COR: ' + p.toUpperCase(), clean(val.value || val)]);
            });

            // B. Textos
            Object.entries(this.context.state.texts || {}).forEach(([key, val]) => {
                if (val.enabled && val.content) {
                    tableData.push(['TEXTO: ' + key.toUpperCase(), clean(val.content)]);
                }
            });

            // C. Configurações Extras
            Object.entries(this.context.state.extras || {}).forEach(([key, val]) => {
                if (val.enabled || val.active) {
                    const extraName = key.replace(/_/g, ' ').toUpperCase();
                    tableData.push(['EXTRA: ' + extraName, 'ATIVADO']);
                }
            });

            // D. Observações
            const obs = this.context.state.observations || this.context.state.observacoes || "";
            if (obs && obs.trim().length > 0) {
                tableData.push(['OBSERVACOES', clean(obs)]);
            }

            // Gerar Tabela Automática
            doc.autoTable({
                startY: currentY,
                head: [['ATRIBUTO', 'ESPECIFICAÇÃO']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
                margin: { left: margin, right: margin }
            });

            currentY = doc.lastAutoTable.finalY + 12;

            // 4. TOTAL EM DESTAQUE - Linha removida na v15.9
            /*
            doc.setDrawColor(212, 175, 55);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            */
            currentY += 8;

            const totalDisplay = document.getElementById('price-display');
            const totalText = clean(totalDisplay ? totalDisplay.innerText.replace(/\n.*/g, '') : 'R$ 0,00');

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('INVESTIMENTO ESTIMADO:', margin, currentY);
            doc.text(totalText, pageWidth - margin, currentY, { align: 'right' });
            // 5. TERMOS E CONDIÇÕES - Removido Emojis (v15.10)
            currentY += 5;
            const terms = "AVISO IMPORTANTE: Este documento e uma SIMULACAO DIGITAL. O resultado fisico pode apresentar variacoes sutis de cores e proporcoes devido ao processo produtivo e configuracao de tela. O bordado sera validado por analise tecnica. Ao prosseguir, voce concorda com os termos e confirma direitos sobre as artes enviadas.";

            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);

            // Garantir que a largura de quebra respeite rigorosamente as margens
            const safeWidth = pageWidth - (margin * 2);
            const termLines = doc.splitTextToSize(terms, safeWidth);

            doc.text(termLines, margin, currentY);
            currentY += (termLines.length * 3.5);

            try {
                // Posicionamento Centralizado e Espaçado
                const qrSize = (pageWidth - (margin * 4)) * 0.45;
                const qrGap = 20;
                const qrX1 = (pageWidth - (qrSize * 2 + qrGap)) / 2;
                const qrX2 = qrX1 + qrSize + qrGap;
                const qrYStart = currentY + 12;

                // QR 1: Apenas Pedido
                const q1 = await generateQR(id);
                if (q1) {
                    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50);
                    doc.text('CÓDIGO DO PEDIDO', qrX1 + (qrSize / 2), qrYStart - 4, { align: 'center' });
                    doc.addImage(q1, 'PNG', qrX1, qrYStart, qrSize, qrSize);
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                    doc.text(`${id}`, qrX1 + (qrSize / 2), qrYStart + qrSize + 5, { align: 'center' });
                }

                // QR 2: Pedido + Simulator ID
                const q2 = await generateQR(`PEDIDO:${id}|SIM:${id}`);
                if (q2) {
                    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                    doc.text('CONFERÊNCIA TÉCNICA', qrX2 + (qrSize / 2), qrYStart - 4, { align: 'center' });
                    doc.addImage(q2, 'PNG', qrX2, qrYStart, qrSize, qrSize);
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                    doc.text(`REF: ${id}`, qrX2 + (qrSize / 2), qrYStart + qrSize + 5, { align: 'center' });
                }
            } catch (e) {
                console.warn("QR Error", e);
            }

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
        return this.generateBackgroundPDF(customId); // Reutiliza motor expert unificado
    }
};

// Hook automático para atualizar snapshot quando o simulador mudar
if (typeof window !== 'undefined') {
    window.PDFGenerator = PDFGenerator;

    // Captura inicial após 3 segundos (Apenas se estiver no Simulador)
    setTimeout(() => {
        if (PDFGenerator.updateSnapshot && document.querySelector('.simulator-area')) {
            PDFGenerator.updateSnapshot();
        }
    }, 3000);

    // Recapturar quando houver mudanças visuais (conectar com scheduleRender se disponível)
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

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
     * Motor de Renderização Nuclear v27 (Industrial Fidelity + Customer Context)
     * Captura o RingHNT de fundo e inclui contato/observações no resumo.
     */
    async drawManualSnapshot() {
        return new Promise(async (resolve) => {
            try {
                console.log('☢️ Motor Nuclear v34 (Gravity Balanced Fidelity) Ativado...');

                // O RingHNT fica na .simulator-area, não na .simulator-viewport
                const viewport = document.querySelector('.simulator-area') || document.querySelector('.simulator-viewport') || document.querySelector('.simulator-wrapper');

                if (!viewport) {
                    console.error('❌ Simulador não encontrado!');
                    return resolve(null);
                }

                // --- 1. IMUNIZAÇÃO DE ASSETS (Base64) ---
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
                    // Resolver caminhos relativos para absoluto se necessário
                    if (url.startsWith('../')) {
                        const base = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
                        img.src = base + '/' + url.replace('../', '');
                    } else {
                        img.src = url;
                    }
                });

                // Imunizar todas as imagens e fundos recursivamente
                const assets = Array.from(viewport.querySelectorAll('img, [style*="background-image"]'));

                // Também checar o próprio background do viewport
                const viewportStyle = window.getComputedStyle(viewport);
                if (viewportStyle.backgroundImage && viewportStyle.backgroundImage.includes('url(')) {
                    const url = viewportStyle.backgroundImage.match(/url\(["']?([^"']+)["']?\)/)?.[1];
                    if (url && !url.startsWith('data:')) {
                        const b64 = await toBase64(url);
                        viewport.style.backgroundImage = `url("${b64}")`;
                    }
                }

                for (const asset of assets) {
                    if (asset.tagName === 'IMG' && asset.src && !asset.src.startsWith('data:')) {
                        asset.src = await toBase64(asset.src);
                    } else {
                        const style = window.getComputedStyle(asset);
                        const bg = style.backgroundImage;
                        if (bg && bg.includes('url(')) {
                            const url = bg.match(/url\(["']?([^"']+)["']?\)/)?.[1];
                            if (url && !url.startsWith('data:')) {
                                const b64 = await toBase64(url);
                                asset.style.backgroundImage = `url("${b64}")`;
                            }
                        }
                    }
                }

                // --- 2. OCULTAR UI NO VIEWPORT ORIGINAL (Rápido, apenas handles) ---
                const hideElements = ['.drag-handle', '.resize-handle', '.delete-btn', '.ui-resizable-handle', '.selection-border', '.ui-selected', '.control-layer', '.zoom-controls'];
                const tempHidden = [];
                hideElements.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        tempHidden.push({ el, display: el.style.display });
                        el.style.setProperty('display', 'none', 'important');
                    });
                });

                // --- 3. CRIAR MIRROR (CLONE) PARA CAPTURA SILENCIOSA ---
                const mirror = viewport.cloneNode(true);
                mirror.id = "capture-mirror-v30";
                mirror.style.position = 'fixed';
                mirror.style.left = '-10000px';
                mirror.style.top = '0';
                mirror.style.width = '1600px';
                mirror.style.height = '1200px';
                mirror.style.zIndex = '-1';
                mirror.style.backgroundColor = '#111111';
                document.body.appendChild(mirror);

                // --- 4. APLICAR ESTILOS DE PROPORÇÃO NO MIRROR (v34) ---
                const isLeggingActive = this.context.state?.extras?.calca_legging?.enabled;
                const snapshotScale = isLeggingActive ? 1.7 : 2.2;
                const snapshotY = isLeggingActive ? '8%' : '4%'; // Ajuste de gravidade para centralização v34

                const subElements = ['.simulator-area', '.simulator-viewport', '.zoom-container', '.simulator-wrapper'];
                subElements.forEach(selector => {
                    const el = mirror.matches(selector) ? mirror : mirror.querySelector(selector);
                    if (el) {
                        if (selector === '.simulator-area') {
                            el.style.setProperty('width', '1600px', 'important');
                            el.style.setProperty('height', '1200px', 'important');
                        } else if (selector === '.simulator-wrapper') {
                            // Aplica Zoom e Centralização de v34
                            el.style.setProperty('transform', `scale(${snapshotScale}) translateY(${snapshotY})`, 'important');
                            el.style.setProperty('transform-origin', 'center center', 'important');
                        } else {
                            el.style.setProperty('width', '1200px', 'important');
                            el.style.setProperty('height', '1200px', 'important');
                        }
                        el.style.setProperty('overflow', 'visible', 'important');
                        el.style.setProperty('display', 'flex', 'important');
                        el.style.setProperty('align-items', 'center', 'important');
                        el.style.setProperty('justify-content', 'center', 'important');
                        el.style.setProperty('position', 'relative', 'important');
                        el.style.setProperty('max-height', 'none', 'important');
                    }
                });

                // --- 5. CAPTURA COM "SETTLE TIME" PARA GARANTIR RENDERIZAÇÃO NO CLONE ---
                let finalDataUrl = null;

                // Aguardar um pouco para o navegador "acordar" o mirror no layout engine
                await new Promise(r => setTimeout(r, 200));

                if (typeof domtoimage !== 'undefined') {
                    try {
                        console.log('📸 Capturando via dom-to-image v34 (Silent Mirror)...');
                        finalDataUrl = await domtoimage.toJpeg(mirror, {
                            quality: 0.95,
                            bgcolor: '#111111'
                        });
                    } catch (err) {
                        console.warn('⚠️ domtoimage falhou no mirror:', err);
                    }
                }

                if (!finalDataUrl && typeof html2canvas !== 'undefined') {
                    try {
                        console.log('📸 Fallback para html2canvas v34...');
                        const canvas = await html2canvas(mirror, {
                            scale: 1,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#111111',
                            width: 1600,
                            height: 1200
                        });
                        finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    } catch (err) {
                        console.error('⚠️ html2canvas também falhou:', err);
                    }
                }

                // --- 6. RESTAURAR E LIMPAR ---
                mirror.remove();
                tempHidden.forEach(item => { item.el.style.display = item.display; });

                if (finalDataUrl) {
                    console.log(`✅ Snapshot v34 gerado: ${Math.round(finalDataUrl.length / 1024)} KB`);
                    this.context.snapshotURL = finalDataUrl;
                    this.cachedSnapshot = finalDataUrl;
                    if (this.captureCallback) this.captureCallback(finalDataUrl);
                } else {
                    console.error('❌ Falha crítica: Nenhuma imagem capturada no Mirror v34');
                }

                resolve(finalDataUrl);
            } catch (err) {
                console.error('❌ Erro no Snapshot Silent v30:', err);
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

                // Calculate true bounding box of all visible layers for perfect centering
                let minT = Infinity, maxB = -Infinity;
                let minL = Infinity, maxR = -Infinity;

                const layers = Array.from(container.querySelectorAll('img, [style*="background-image"]'));
                layers.forEach(item => {
                    const s = window.getComputedStyle(item);
                    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;
                    const r = item.getBoundingClientRect();
                    if (r.width === 0 || r.height === 0) return;

                    minT = Math.min(minT, r.top);
                    maxB = Math.max(maxB, r.bottom);
                    minL = Math.min(minL, r.left);
                    maxR = Math.max(maxR, r.right);
                });

                const contentWidth = maxR - minL;
                const contentHeight = maxB - minT;

                if (contentWidth <= 0 || contentHeight <= 0) {
                    // Fallback to rect if no layers detected
                    minT = rect.top; maxB = rect.bottom;
                    minL = rect.left; maxR = rect.right;
                }

                const padding = 60;
                let scale = Math.min((1600 - padding * 2) / (maxR - minL), (1200 - padding * 2) / (maxB - minT));

                // Ampliando scale manual (Dinâmico por Produto)
                let extraScale = 1.35;
                const prod = this.context.state?.productInitial || this.context.state?.productType;
                if (prod === 'TP' || prod === 'Top') extraScale = 2.0;

                scale = scale * extraScale;

                // Segurança de limite
                if ((maxR - minL) * scale > 1600 * 0.92) scale = (1600 * 0.92) / (maxR - minL);
                if ((maxB - minT) * scale > 1200 * 0.92) scale = (1200 * 0.92) / (maxB - minT);

                const offsetX = (1600 - ((maxR - minL) * scale)) / 2;
                let offsetY = (1200 - ((maxB - minT) * scale)) / 2;

                // Ajuste fino para balanço visual
                if (prod === 'TP' || prod === 'Top') {
                    offsetY -= 20;
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
                            const x = offsetX + (r.left - minL + r.width / 2) * scale;
                            const y = offsetY + (r.top - minT + r.height / 2) * scale;
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
                console.log(`✅ Snapshot v25 gerado: ${Math.round(snapshot.length / 1024)} KB`);
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
        clone.querySelectorAll('.drag-handle, .resize-handle, .delete-btn', '.ui-resizable-handle', '.selection-border', '.ui-selected', '.control-layer', '.zoom-controls').forEach(el => el.remove());
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
     * Gera PDF (v12) e Backup Automático Local
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

            // AutoTable MUST be loaded after jsPDF
            await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js', '__autotableLoaded');
            window['__autotableLoaded'] = true;

            return true;
        } catch (e) {
            console.error('Erro ao carregar libs de PDF/QR:', e);
            return false;
        }
    },

    /**
     * Gera um PDF real em background usando jsPDF (EXPERT v25)
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

            // --- TEMPLATE INSTITUCIONAL (HNT Expert v21) ---
            const drawExpertTemplate = (docArg) => {
                const width = docArg.internal.pageSize.getWidth();
                const height = docArg.internal.pageSize.getHeight();

                for (let i = 0; i < height; i++) {
                    const grey = 248 - Math.floor((i / height) * 8);
                    docArg.setFillColor(grey, grey, grey);
                    docArg.rect(0, i, width, 1, 'F');
                }

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

                docArg.setFont('helvetica', 'bold');
                docArg.setFontSize(24);
                docArg.setTextColor(30, 30, 30);
                docArg.text('HANUTHAI', margin, margin + 12);

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

            if (this.cachedSnapshot && this.cachedSnapshot.length > 500) {
                try {
                    const imgProps = doc.getImageProperties(this.cachedSnapshot);
                    const maxW = pageWidth - (margin * 2);
                    const maxH = pageHeight * 0.55; // Reduzido para dar mais espaço à tabela detalhada

                    let imgW = maxW;
                    let imgH = (imgProps.height * imgW) / imgProps.width;

                    if (imgH > maxH) {
                        imgH = maxH;
                        imgW = (imgProps.width * imgH) / imgProps.height;
                    }

                    doc.addImage(this.cachedSnapshot, 'JPEG', (pageWidth - imgW) / 2, currentY, imgW, imgH);
                    currentY += imgH + 10;
                } catch (e) {
                    currentY += 10;
                }
            }

            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = margin;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(212, 175, 55);
            doc.text('RESUMO TÉCNICO DETALHADO', margin, currentY);
            currentY += 8;

            const clean = (s) => {
                if (!s) return '';
                return s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");
            };

            const fmt = (v) => (typeof v === 'number') ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : v;

            let tableData = [];
            const state = this.context.state || {};
            const config = this.context.productData || {};
            const pricing = this.context.pricing || {};

            // Helper para preços de zona
            const getPrice = (id, type) => {
                if (typeof window.getZonePrice === 'function') return window.getZonePrice({ id: id, category: '' });
                return 0;
            };

            // 1. CONFIGURAÇÃO DE BASE (Grade + Contato + Datas)
            tableData.push([{ content: '1. CONFIGURACAO DE BASE, CONTATO & PRAZOS', colSpan: 3, styles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' } }]);

            // Tenta recuperar telefone do perfil ou state
            let phone = 'Nao Registrado';
            try {
                const profile = JSON.parse(localStorage.getItem('hnt_customer_profile') || '{}');
                phone = profile.whatsapp || profile.phone || state.client_info?.phone || 'Nao Registrado';
            } catch (e) { }

            tableData.push(['CONTATO / TELEFONE', clean(phone), '']);

            // DATAS (PEDIDO E ENTREGA)
            const production = state.config?.production || { minDays: 15, maxDays: 25 };
            const today = new Date();
            const formatDate = (d) => d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();

            // Cálculo simples de previsão (adicionamos os dias úteis como dias corridos * 1.4 aprox ou apenas dias diretos se preferir)
            // Aqui usaremos os dias diretos + margem para segurança factory
            const deliveryDate = new Date(today.getTime() + (production.maxDays * 24 * 60 * 60 * 1000));

            tableData.push(['DATA DO PEDIDO', formatDate(today), '']);
            tableData.push(['PREVISAO DE ENTREGA', formatDate(deliveryDate), '']);

            const sizes = state.sizes || {};
            const totalQty = Object.values(sizes).reduce((acc, q) => acc + (parseInt(q) || 0), 0);
            const sizeString = Object.entries(sizes)
                .filter(([_, qty]) => parseInt(qty) > 0)
                .map(([size, qty]) => `${qty}x ${size}`)
                .join(', ');

            const baseUnitPrice = state.config?.basePrice || 0;
            tableData.push(['GRADE DE TAMANHOS', clean(sizeString), '']);
            tableData.push(['VALOR BASE (UNIT)', '', `R$ ${fmt(baseUnitPrice)}`]);

            // 2. DETALHAMENTO POR CATEGORIA (SIDEBAR SYNC)
            const categories = config.categories || [{ id: 'default', name: 'DETALHES DO PRODUTO' }];

            categories.forEach(cat => {
                let catItems = [];

                // Partes (Sempre Incluso)
                if (config.parts) {
                    config.parts.filter(p => p.category === cat.id).forEach(p => {
                        const colorId = state.parts?.[p.id];
                        const colorObj = config.colors?.find(c => c.id === colorId);
                        catItems.push([clean(p.name.toUpperCase()), `COR: ${clean(colorObj ? colorObj.name : colorId)}`, 'INCLUSO']);
                    });
                }

                // Extras (Incluso vs Pago)
                if (config.extras) {
                    config.extras.filter(e => e.category === cat.id).forEach(e => {
                        const extraState = state.extras?.[e.id];
                        if (extraState?.enabled || extraState?.active) {
                            const colorObj = config.colors?.find(c => c.id === extraState.color);
                            const price = (state.config?.extraPrices?.[e.id] !== undefined) ? state.config.extraPrices[e.id] : e.price;
                            const detail = colorObj ? `COR: ${clean(colorObj.name)}` : 'ATIVADO';
                            const valStr = price === 0 ? 'INCLUSO' : `+ R$ ${fmt(price)}`;
                            catItems.push([clean(e.name.toUpperCase()), clean(detail), valStr]);
                        }
                    });
                }

                // Uploads (Diferenciação Acervo vs Custom)
                if (config.uploadZones) {
                    config.uploadZones.filter(u => u.category === cat.id).forEach(u => {
                        const up = state.uploads?.[u.id];
                        if (up?.src) {
                            let price = 0;
                            if (!up.isCustom) {
                                // Lógica de getZonePrice replicada
                                if (state.config?.zonePrices?.[u.id] !== undefined) {
                                    price = parseFloat(state.config.zonePrices[u.id]);
                                } else if (u.id.includes('centro')) {
                                    price = state.config?.logoCenterPrice || 0;
                                }
                            }
                            const valStr = price === 0 ? 'INCLUSO' : `+ R$ ${fmt(price)}`;
                            catItems.push([clean(u.name.toUpperCase()), `ARQUIVO: ${clean(up.formattedFilename || up.filename)}`, valStr]);
                        }
                    });
                }

                // Textos (Logic Sync com Sidebar)
                if (config.textZones) {
                    config.textZones.filter(t => t.category === cat.id).forEach(t => {
                        const txt = state.texts?.[t.id];
                        if (txt?.enabled && txt?.content) {
                            let price = 0;
                            const isLat = (t.category && t.category.includes('Lateral')) || t.id.includes('lat');
                            if (!isLat) {
                                price = state.config?.textPrice || 0;
                            } else {
                                // Se for lateral e tiver imagem, cobra textLatPrice (9.90)
                                const upId = t.id.replace('text_', 'logo_');
                                if (state.uploads?.[upId]?.src) price = state.config?.textLatPrice || 0;
                            }
                            const valStr = price === 0 ? 'INCLUSO' : `+ R$ ${fmt(price)}`;
                            catItems.push([`TEXTO: ${clean(t.name.toUpperCase())}`, `"${clean(txt.content)}" (Fonte: ${clean(txt.fontFamily)})`, valStr]);
                        }
                    });
                }

                if (catItems.length > 0) {
                    tableData.push([{ content: clean(cat.name.toUpperCase()), colSpan: 3, styles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
                    tableData = tableData.concat(catItems);
                }
            });

            // 3. SEÇÃO FINANCEIRA
            tableData.push([{ content: 'DETALHAMENTO FINANCEIRO', colSpan: 3, styles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' } }]);

            const subtotalVal = (pricing.total + (pricing.discountValue || 0) + (pricing.waiver || 0) - (pricing.devFees || 0));
            tableData.push(['SUBTOTAL (PECAS + EXTRAS)', '', `R$ ${fmt(subtotalVal)}`]);
            tableData.push(['MEDIA UNITARIA', '', `R$ ${fmt(subtotalVal / totalQty)}`]);

            if (pricing.devFees > 0) {
                tableData.push(['TAXAS DE MATRIZ (+)', '', `R$ ${fmt(pricing.devFees)}`]);
            }
            if (pricing.discountValue > 0) {
                tableData.push(['DESCONTO ATACADO (-)', `${fmt(pricing.discountPercent)}%`, `R$ ${fmt(pricing.discountValue)}`]);
            }
            if (pricing.waiver > 0) {
                tableData.push(['ISENCAO/BONUS (-)', '', `R$ ${fmt(pricing.waiver)}`]);
            }

            const obs = state.observations || state.observacoes || "";
            if (obs.trim().length > 0) {
                tableData.push([{ content: 'OBSERVACOES:', colSpan: 3, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
                tableData.push([{ content: clean(obs), colSpan: 3 }]);
            }

            doc.autoTable({
                startY: currentY,
                head: [['ATRIBUTO', 'ESPECIFICACAO', 'VALOR']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
                headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
                margin: { left: margin, right: margin, bottom: 45 }
            });

            currentY = doc.lastAutoTable.finalY + 10;

            const drawFooter = async (docArg, yPos) => {
                let y = yPos;
                if (y > pageHeight - 65) { docArg.addPage(); y = margin; }

                docArg.setDrawColor(200);
                docArg.line(margin, y, pageWidth - margin, y);
                y += 8;

                const totalDisplay = document.getElementById('price-display');
                const totalText = clean(totalDisplay ? totalDisplay.innerText.replace(/\n.*/g, '') : `R$ ${fmt(pricing.total)}`);

                docArg.setFontSize(14);
                docArg.setFont('helvetica', 'bold');
                docArg.setTextColor(0, 0, 0);
                docArg.text('INVESTIMENTO TOTAL:', margin, y);
                docArg.text(totalText, pageWidth - margin, y, { align: 'right' });
                y += 7;

                // PREVISÃO ESTIMADA
                const production = state.config?.production || { minDays: 15, maxDays: 25 };
                const today = new Date();
                const formatDate = (d) => d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();

                docArg.setFontSize(8);
                docArg.setFont('helvetica', 'bold');
                docArg.setTextColor(100, 100, 100);
                docArg.text(`PREVISAO ESTIMADA: ${production.minDays}-${production.maxDays} DIAS UTEIS APOS APROVACAO.`, margin, y);
                y += 8;

                const terms = "AVISO: Este documento e uma SIMULACAO DIGITAL. Cores e proporcoes podem variar sutilmente no produto fisico. Voce confirma direitos sobre as artes enviadas e concorda com os termos de fabricacao.";
                docArg.setFontSize(6.5);
                docArg.setFont('helvetica', 'italic');
                docArg.setTextColor(150, 150, 150);
                const termLines = docArg.splitTextToSize(terms, pageWidth - (margin * 2));
                docArg.text(termLines, margin, y);
                y += (termLines.length * 4) + 5;

                const qrSize = 45; // Aumentado em 50% conforme solicitado (30 -> 45)
                const gap = 50; // Mais distanciados conforme solicitado (Aumentado de 25 -> 50)
                const totalQRWidth = (qrSize * 2) + gap;
                const startX = (pageWidth - totalQRWidth) / 2;
                const qrY = y;

                try {
                    const qPedido = await generateQR(`PEDIDO:${orderNum}`);
                    if (qPedido) {
                        docArg.addImage(qPedido, 'PNG', startX, qrY, qrSize, qrSize);
                        docArg.setFontSize(6); docArg.setFont('helvetica', 'bold');
                        docArg.text(`PEDIDO: ${orderNum}`, startX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });
                    }
                    const qSku = await generateQR(`SKU:${sku}`);
                    if (qSku) {
                        docArg.addImage(qSku, 'PNG', startX + qrSize + gap, qrY, qrSize, qrSize);
                        docArg.setFontSize(6); docArg.setFont('helvetica', 'bold');
                        docArg.text(`SKU: ${sku}`, startX + qrSize + gap + (qrSize / 2), qrY + qrSize + 4, { align: 'center' });
                    }
                } catch (e) { }
            };

            await drawFooter(doc, currentY);

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

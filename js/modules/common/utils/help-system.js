
var HelpSystem = {
    currentContext: 'geral',
    whatsappNumber: '',

    init: function (context) {
        this.currentContext = context || 'geral';
        this.loadConfig();
        this.injectStyles();
        this.createFloatingButtons(); // Changed to plural
        this.createModal();
    },

    loadConfig: function () {
        try {
            const config = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');
            // If whatsappNumber is missing or empty, use a default fallback
            this.whatsappNumber = config.whatsappNumber || '5511999999999';
        } catch (e) {
            console.error("Erro ao carregar configurações para HelpSystem:", e);
            this.whatsappNumber = '5511999999999'; // Fallback on error too
        }
    },

    injectStyles: function () {
        if (document.getElementById('help-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'help-system-styles';
        style.textContent = `
            /* Container for Buttons */
            .help-buttons-container {
                position: fixed;
                bottom: 20px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                z-index: 9999;
                align-items: center;
            }

            /* Common Floating Button Style */
            .float-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                text-decoration: none;
                color: white;
                font-size: 20px;
                font-weight: bold;
            }
            .float-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 5px 10px rgba(0,0,0,0.4);
            }
            
            /* WhatsApp Specific */
            .btn-whatsapp {
                background-color: #25D366;
            }
            .btn-whatsapp svg {
                width: 22px;
                height: 22px;
                fill: white;
            }

            /* Help Specific */
            .btn-help {
                background-color: #007bff;
                font-family: sans-serif;
            }
            
            /* Tooltip on hover */
            .float-btn::after {
                content: attr(data-tooltip);
                position: absolute;
                right: 60px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s;
            }
            .float-btn:hover::after {
                opacity: 1;
            }

            /* Modal Overlay */
            .help-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10000;
                display: none;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .help-modal-overlay.open {
                display: flex;
                opacity: 1;
            }

            /* Modal Content */
            .help-modal {
                background: white;
                width: 90%;
                max-width: 800px;
                height: 80vh;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
                animation: slideUp 0.3s ease-out;
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* Close Button */
            .help-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 24px;
                color: #555;
                cursor: pointer;
                background: none;
                border: none;
                z-index: 2;
            }
            .help-modal-close:hover { color: #000; }

            /* Tabs */
            .help-tabs {
                display: flex;
                background: #f4f4f4;
                border-bottom: 1px solid #ddd;
                padding: 0 15px;
            }
            .help-tab {
                padding: 15px 25px;
                cursor: pointer;
                font-weight: 600;
                color: #555;
                border-bottom: 3px solid transparent;
                transition: all 0.2s;
            }
            .help-tab.active {
                color: #007bff;
                border-bottom: 3px solid #007bff;
                background: white;
            }
            .help-tab:hover:not(.active) {
                background: #e9e9e9;
            }

            /* Content Area */
            .help-content-area {
                flex: 1;
                overflow-y: auto;
                padding: 25px;
                line-height: 1.6;
                color: #333;
            }
            .help-section { display: none; }
            .help-section.active { display: block; }

            /* Typography & Elements */
            .help-modal h2 { margin-top: 0; color: #222; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .help-modal h3 { color: #444; margin-top: 20px; }
            .help-faq-item { margin-bottom: 15px; border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
            .help-faq-question {
                background: #f9f9f9;
                padding: 12px 15px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .help-faq-question:hover { background: #f0f0f0; }
            .help-faq-answer {
                padding: 15px;
                display: none;
                border-top: 1px solid #eee;
                background: white;
            }
            .help-faq-item.open .help-faq-answer { display: block; }
            .help-faq-item.open .help-faq-question { background: #eef6ff; color: #007bff; }
            
            /* Responsive */
            @media (max-width: 600px) {
                .help-modal { height: 100vh; width: 100%; border-radius: 0; }
                .help-buttons-container { bottom: 85px; right: 15px; left: auto; }
                .help-tabs { overflow-x: auto; }
                .help-tab { white-space: nowrap; padding: 12px 15px; }
            }
        `;
        document.head.appendChild(style);
    },

    createFloatingButtons: function () {
        // Remove old buttons if exist
        const oldBtn = document.getElementById('help-floating-btn');
        if (oldBtn) oldBtn.remove();

        const oldContainer = document.getElementById('help-buttons-container');
        if (oldContainer) oldContainer.remove();

        const container = document.createElement('div');
        container.id = 'help-buttons-container';
        container.className = 'help-buttons-container';

        // 1. WhatsApp Button (Bottom - Visually)
        if (this.whatsappNumber && this.whatsappNumber.trim() !== "") {
            const waReq = document.createElement('a');
            waReq.className = 'float-btn btn-whatsapp';
            waReq.setAttribute('data-tooltip', 'Fale no WhatsApp');
            const cleanNum = this.whatsappNumber.replace(/\D/g, '');
            waReq.href = `https://wa.me/${cleanNum}`;
            waReq.target = '_blank';
            waReq.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
            container.appendChild(waReq);
        }

        // 2. Help Button (REMOVED per user request)
        // const helpBtn = document.createElement('button');
        // helpBtn.className = 'float-btn btn-help'; ...

        // Clear and rebuild to ensure order
        container.innerHTML = '';
        // container.appendChild(helpBtn);

        if (this.whatsappNumber && this.whatsappNumber.trim() !== "") {
            const waReq = document.createElement('a');
            waReq.className = 'float-btn btn-whatsapp';
            waReq.setAttribute('data-tooltip', 'Fale no WhatsApp');
            const cleanNum = this.whatsappNumber.replace(/\D/g, '');
            waReq.href = `https://wa.me/${cleanNum}`;
            waReq.target = '_blank';
            waReq.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';
            container.appendChild(waReq);
        }

        document.body.appendChild(container);

        // Make Draggable
        this.makeElementDraggable(container);
    },

    makeElementDraggable: function (elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let dragStarted = false;

        const dragMouseDown = (e) => {
            if (e.target.closest('a') || e.target.closest('.help-modal-close')) return; // Allow click actions

            // Allow clicking buttons, but holding moves container
            // We'll use a small threshold to differentiate click vs drag

            e.preventDefault();
            pos3 = e.clientX || e.touches[0].clientX;
            pos4 = e.clientY || e.touches[0].clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            // Mobile (Passive false is important for touchmove to prevent scroll if we want to drag)
            document.addEventListener('touchend', closeDragElement, { passive: false });
            document.addEventListener('touchmove', elementDrag, { passive: false });
        };

        const elementDrag = (e) => {
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            e.preventDefault();
            // Calculate new cursor position:
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            // Set element's new position:
            const newTop = (elmnt.offsetTop - pos2);
            const newLeft = (elmnt.offsetLeft - pos1);

            // Boundary checks (Keep on screen)
            const maxH = window.innerHeight - elmnt.offsetHeight;
            const maxW = window.innerWidth - elmnt.offsetWidth;

            elmnt.style.top = Math.max(0, Math.min(newTop, maxH)) + "px";
            elmnt.style.left = Math.max(0, Math.min(newLeft, maxW)) + "px";
            elmnt.style.bottom = 'auto'; // Disable bottom once dragged
            elmnt.style.right = 'auto';  // Disable right once dragged

            dragStarted = true;
        };

        const closeDragElement = () => {
            // Stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
            document.removeEventListener('touchend', closeDragElement);
            document.removeEventListener('touchmove', elementDrag);

            // Re-enable click after drag? Browser usually handles this by distinguishing click
        };

        elmnt.onmousedown = dragMouseDown;
        elmnt.addEventListener('touchstart', dragMouseDown, { passive: false });
    },

    createModal: function () {
        if (document.getElementById('help-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'help-modal-overlay';
        overlay.className = 'help-modal-overlay';

        // Close on click outside
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeModal();
        };

        const modal = document.createElement('div');
        modal.className = 'help-modal';

        // Header/Tabs
        modal.innerHTML = `
            <button class="help-modal-close" onclick="HelpSystem.closeModal()">&times;</button>
            <div class="help-tabs">
                <div class="help-tab active" onclick="HelpSystem.switchTab('guide')" id="tab-guide">Guia ${this.getContextName()}</div>
                <div class="help-tab" onclick="HelpSystem.switchTab('tech')" id="tab-tech">Bordado x DTF</div>
                <div class="help-tab" onclick="HelpSystem.switchTab('faq')" id="tab-faq">Perguntas Frequentes</div>
                <div class="help-tab" onclick="HelpSystem.switchTab('info')" id="tab-info">Informações Gerais</div>
            </div>
            
            <div class="help-content-area">
                <!-- Guide Section (Dynamic based on Context) -->
                <div id="content-guide" class="help-section active">
                    ${this.getGuideContent()}
                </div>

                <!-- Tech Section (Bordado x DTF) -->
                <div id="content-tech" class="help-section">
                    ${this.getTechGuideContent()}
                </div>

                <!-- General FAQ Section -->
                <div id="content-faq" class="help-section">
                    <h2>Perguntas Frequentes</h2>
                    <div class="help-faq-list">
                        ${this.getGeneralFaqContent()}
                    </div>
                </div>

                <!-- Info Section -->
                <div id="content-info" class="help-section">
                    <h2>Informações & Contatos</h2>
                    <p><strong>Hanuthai Fight Wear</strong></p>
                    <p>Qualidade e personalização para lutadores.</p>
                    <hr>
                    <p>📧 <strong>Suporte:</strong> suporte@hanuthai.com.br</p>
                    <p>🕒 <strong>Horário de Atendimento:</strong> Seg-Sex, 9h às 18h</p>
                    <p>📦 <strong>Envios:</strong> Enviamos para todo o Brasil.</p>
                    <p>📞 <strong>WhatsApp:</strong> ${this.whatsappNumber || 'Consulte no site'}</p>
                    <div style="margin-top:20px; padding:15px; background:#f9f9f9; border-radius:8px;">
                        <h4>Sobre o Simulador</h4>
                        <p>Versão 14.6</p>
                        <p>Desenvolvido para facilitar a criação de peças exclusivas.</p>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    },

    openModal: function () {
        document.getElementById('help-modal-overlay').classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    },

    closeModal: function () {
        document.getElementById('help-modal-overlay').classList.remove('open');
        document.body.style.overflow = '';
    },

    switchTab: function (tabName) {
        // Update Tabs
        document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Update Content
        document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`content-${tabName}`).classList.add('active');
    },

    toggleFaq: function (element) {
        element.parentElement.classList.toggle('open');
    },

    getContextName: function () {
        const names = {
            'shorts': 'Shorts',
            'top': 'Top',
            'legging': 'Calça Legging',
            'moletom': 'Moletom',
            'geral': 'Help'
        };
        return names[this.currentContext] || 'Simulador';
    },

    getGuideContent: function () {
        const guides = {
            'shorts': `
                <h2>FIGHT SHORTS - Especificações Técnicas</h2>
                <div style="background:rgba(0,123,255,0.05); padding:15px; border-radius:8px; border-left:4px solid #007bff; margin-bottom:20px;">
                    <p>Qualidade industrial com alma artesanal. Conheça as especificações do nosso Fight Shorts:</p>
                </div>
                
                <ul style="padding-left:20px; font-size:0.95em; color: #333;">
                    <li><strong>Bordados Direto na Peça:</strong> Sem apliques. Alta definição para máxima durabilidade e qualidade superior.</li>
                    <li><strong>Costuras Reforçadas:</strong> Desenvolvidas para suportar alta intensidade e performance.</li>
                    <li><strong>Tecido Premium (96% Polyester / 4% Elastano):</strong> Alta resistência com elasticidade, conforto e excelente caimento estruturado.</li>
                    <li><strong>Modelo Tailandês:</strong> Abertura lateral que permite movimentos 100% livres e confortáveis.</li>
                    <li><strong>Tecido Acetinado:</strong> Acabamento de alto nível que realça a peça.</li>
                    <li><strong>Secagem Rápida:</strong> Tecnologia que facilita a transpiração.</li>
                    <li><strong>Elástico Reforçado:</strong> Ajuste firme no cós com opção de <strong>cordão interno</strong>.</li>
                    <li><strong>Legging Interna (Opcional):</strong> Conforto e agilidade extra para treinos pesados.</li>
                </ul>

                <p><strong>🎨 Personalização:</strong> Você escolhe tudo — tamanho, cores, escritas, imagens e acessórios. Confeccionado artesanalmente para ser único.</p>
                
                <p><strong>🧵 Tecnologia:</strong> As customizações nos Fight Shorts são feitas através de <strong>bordado direto</strong>.</p>
                <p><strong>💡 Dica EMB:</strong> Se possuir arquivo EMB (arquivo de bordado) com sua logo, não será cobrada a taxa de desenvolvimento.</p>
            `,
            'top': `
                <h2>Guia do Simulador de Top</h2>
                <p><strong>🎨 Tecnologia:</strong> As personalizações nos simuladores Top, Calça Legging, Shorts Legging e moletom são em <strong>customizações em DTF têxtil exclusivamente</strong>, para alterações consulte-nos.</p>
                <div style="background:rgba(255,0,150,0.05); padding:15px; border-radius:8px; border-left:4px solid #ff0096; margin-bottom:20px;">
                    <p><strong>⚠️ Regra de Logos (DTF):</strong></p>
                    <p>Logos para aplicação em DTF não são cobradas desde que esteja com boa qualidade. Imagens com baixa qualidade poderão estão sujeitas a avaliação podendo ser recusadas ou se necessário serem ajustadas ou reconstruídas, serão cobradas taxa de <strong>R$ 35 reais</strong>.</p>
                </div>
                <ul>
                    <li><strong>Bojo:</strong> Todos os Tops acompanham bojo removível.</li>
                    <li><strong>Diferencial:</strong> A cor branca NÃO é transparente.</li>
                </ul>
            `,
            'legging': `
                <h2>Personalizando sua Calça Legging</h2>
                <p><strong>🎨 Tecnologia:</strong> As personalizações nos simuladores Calça Legging, Shorts Legging, Top e moletom são em <strong>customizações em DTF têxtil exclusivamente</strong>, para alterações consulte-nos.</p>
                <div style="background:rgba(255,0,150,0.05); padding:15px; border-radius:8px; border-left:4px solid #ff0096; margin-bottom:20px;">
                    <p><strong>⚠️ Regra de Logos (DTF):</strong></p>
                    <p>Logos em DTF não são cobradas com boa qualidade. Se necessário ajuste ou reconstrução por baixa qualidade, será cobrada taxa de <strong>R$ 35 reais</strong>.</p>
                </div>
                <ul>
                    <li><strong>Transparência Zero:</strong> Tecido branco de alta gramatura.</li>
                    <li><strong>Design:</strong> Personalize a cor base e detalhes laterais.</li>
                </ul>
            `,
            'moletom': `
                <h2>Guia do Moletom</h2>
                <p><strong>🎨 Tecnologia:</strong> As personalizações nos simuladores Moletom, Calça Legging, Shorts Legging e Top são em <strong>customizações em DTF têxtil exclusivamente</strong>, para alterações consulte-nos.</p>
                <div style="background:rgba(255,0,150,0.05); padding:15px; border-radius:8px; border-left:4px solid #ff0096; margin-bottom:20px;">
                    <p><strong>⚠️ Regra de Logos (DTF):</strong></p>
                    <p>Logos de boa qualidade não tem custo. Imagens ruins sujeitas a avaliação e taxa de <strong>R$ 35 reais</strong> para ajuste/reconstrução.</p>
                </div>
                <ul>
                    <li><strong>Cores:</strong> Selecione cores para mangas, corpo e capuz separadamente.</li>
                    <li><strong>Logos:</strong> Perfeito para grandes artes na frente e costas.</li>
                </ul>
            `
        };
        return guides[this.currentContext] || '<p>Selecione um contexto.</p>';
    },

    getTechGuideContent: function () {
        return `
            <h2>Bordado x DTF</h2>
            <p>Escolha a técnica ideal para o seu projeto:</p>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0; font-size: 0.85em;">
                <tr style="background:#f4f4f4;">
                    <th style="padding:8px; border:1px solid #ddd;">Técnica</th>
                    <th style="padding:8px; border:1px solid #ddd;">Bordado</th>
                    <th style="padding:8px; border:1px solid #ddd;">DTF Digital</th>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Indicado</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">Fight Shorts / Moletom</td>
                    <td style="padding:8px; border:1px solid #ddd;">Calça Legging / Tops / Lycras</td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Vantagem</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">Eterno, relevo nobre.</td>
                    <td style="padding:8px; border:1px solid #ddd;">Alta definição, flexível.</td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Envio</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">PDF/Vetor (EMB grátis)</td>
                    <td style="padding:8px; border:1px solid #ddd;">PNG Transparente 300 DPI</td>
                </tr>
            </table>
            <div style="font-size:0.9em;">
                <p><strong>🧵 Regras para Bordado:</strong> Letras min. 5mm. Fios de alta resistência.</p>
                <p><strong>🎨 Regras para DTF:</strong> Impressão idêntica ao arquivo. Linhas min. 0.5mm. <br><em>*Taxa de R$ 35,00 para arquivos de baixa qualidade.</em></p>
            </div>
        `;
    },

    getGeneralFaqContent: function () {
        const faqs = [
            { q: "Qual o prazo de produção?", a: "O prazo padrão é de 15 a 20 dias úteis após a confirmação do pagamento e aprovação da arte final." },
            { q: "Quais arquivos devo enviar?", a: "Sempre prefira arquivos em vetor (PDF, AI, CDR) ou imagens PNG com fundo transparente em alta resolução (300dpi)." },
            { q: "Posso pedir apenas 1 peça?", a: "Sim! Nosso simulador permite pedidos unitários, mas temos descontos progressivos para maiores quantidades." },
            { q: "As cores do simulador são exatas?", a: "O simulador é uma representação digital aproximada. Pode haver pequenas variações de tom na impressão real no tecido (sublimação)." },
            { q: "Como finalizo o pedido?", a: "Após personalizar, clique em 'Exportar para Produção' ou 'Salvar PDF' e envie para nosso comercial via WhatsApp." }
        ];

        return faqs.map(item => `
            <div class="help-faq-item">
                <div class="help-faq-question" onclick="HelpSystem.toggleFaq(this)">
                    ${item.q} <span>&#9660;</span>
                </div>
                <div class="help-faq-answer">
                    ${item.a}
                </div>
            </div>
        `).join('');
    }
};


const InfoSystem = {
    texts: {},

    defaults: {
        'upload_shorts': `
            <h3>Especificações Técnicas - Fight Shorts</h3>
            <p><strong>Qualidade e Confecção:</strong></p>
            <ul>
                <li><strong>Bordados Direto na Peça:</strong> Sem apliques. Bordado de alta definição para destacar a peça e garantir máxima durabilidade e qualidade superior.</li>
                <li><strong>Tecido Premium:</strong> 96% Polyester / 4% Elastano. Alta resistência com elasticidade, proporcionando elegância, versatilidade, conforto e um excelente caimento estruturado.</li>
                <li><strong>Tecido Acetinado:</strong> Acabamento que realça as cores e o design da peça.</li>
                <li><strong>Secagem Rápida:</strong> Tecnologia que facilita a transpiração e manutenção.</li>
            </ul>
            <p><strong>Design e Performance:</strong></p>
            <ul>
                <li><strong>Modelo Tailandês:</strong> Abertura lateral que permite movimentos 100% livres, sem resistência e com total conforto.</li>
                <li><strong>Costuras Reforçadas:</strong> Desenvolvidas para suportar alta intensidade.</li>
                <li><strong>Elástico Reforçado:</strong> Ajuste firme no cós com opção de <strong>cordão interno</strong>.</li>
                <li><strong>Legging Interna (Opcional):</strong> Oferece conforto e agilidade extra para treinos intensos.</li>
            </ul>
            <p><strong>Personalização Ilimitada:</strong></p>
            <p>Você escolhe como quer montar o seu produto: várias opções de tamanhos, cores, escritas, imagens e acessórios. Confeccionado artesanalmente para ser único.</p>
        `,
        'upload_others': `
            <h3>Estampa DTF Têxtil</h3>
            <p>As personalizações nos simuladores Moletom, Top, Legging e Shorts Legging são em <strong>DTF têxtil exclusivamente</strong>. Para alterações, consulte-nos.</p>
            <p><strong>Diferencial Hanuthai:</strong> Nossa malha branca possui tecnologia de alta densidade, garantindo <strong>transparência zero</strong> em todos os modelos.</p>
            <p><strong>Regra de Logos:</strong> Logos para aplicação em DTF não são cobradas, desde que o arquivo possua boa qualidade. Caso seja necessária a reconstrução do design, poderá ser aplicada uma taxa conforme avaliação técnica.</p>
        `,
        'sizes': '<h3>Tabela de Medidas</h3><p>Nossos tamanhos seguem o padrão brasileiro. Note que artes muito complexas podem sofrer pequenos ajustes proporcionais ao tamanho da peça escolhida.</p>',
        'sizes_shorts_v2': '<div class="img-overlay-wrapper"><div class="img-overlay-text"><h3>Tabela de Medidas (Shorts)</h3><p>Nossos tamanhos seguem o padrão brasileiro.</p><p style="color:#d9534f; margin-top:8px; font-weight:bold; font-size:0.85rem;">⚠️ Tamanhos GG, EXG e EXGG possuem acréscimo de R$ 10,00.</p></div><img src="assets/Shorts/Tamanhos/Shorts.png"></div>',
        'text_zones': '<h3>Personalização de Texto</h3><p>Adicione seu nome, apelido, ou nome da equipe. O valor é cobrado por área adicionada.</p>',
        'discounts': '<h3>Política de Descontos</h3><p>O desconto progressivo aplica-se sobre o valor total do pedido, incentivando compras em maiores quantidades para equipes e lojistas.</p>',
        'info_pernas': `
            <h3>Área Especial (Pernas)</h3>
            <p><strong>Por que há um acréscimo?</strong></p>
            <p>As pernas são áreas curvas e de difícil acesso para as máquinas de bordado industriais. O valor adicional cobre o tempo de configuração extra e o uso de bastidores especiais para garantir que o bordado não sofra deformações durante o uso.</p>
            <p><strong>Dica de Designer:</strong> Ideal para logos de academias ou ícones de graduação.</p>
        `,
        'info_matriz': `
            <h3>Desenvolvimento de Matriz de Bordado</h3>
            <p>Para que sua logo seja bordada, um designer precisa converter a imagem em um arquivo de "pontos de costura" (matriz). Este é um serviço técnico especializado.</p>
            <ul>
                <li><strong>Isenção 1:</strong> Se você já possui o arquivo técnico em formato <strong>.EMB</strong>, envie-o no campo indicado para não pagar esta taxa.</li>
                <li><strong>Isenção 2:</strong> Pedidos acima de 10 peças ganham 1 desenvolvimento de matriz de brinde.</li>
            </ul>
        `,
        'info_laterais': `
            <h3>Espaço de Laterais</h3>
            <p>As laterais dos shorts Fight são os melhores espaços para patrocinadores e logos verticais.</p>
            <p><strong>Atenção:</strong> Adicionar textos muito longos sobre imagens nas laterais pode gerar avisos de sobreposição. Procure manter o design limpo para melhor leitura.</p>
        `,
        'info_extras': `
            <h3>Acabamentos e Opcionais</h3>
            <ul>
                <li><strong>Legging Interna:</strong> Oferece compressão e evita assaduras. Disponível apenas em <strong>Preto ou Branco</strong>.</li>
                <li><strong>Laço de Cetim:</strong> Detalhe clássico do Muay Thai lateral.</li>
                <li><strong>Cordão Interno:</strong> Segurança extra no ajuste da cintura.</li>
            </ul>
        `,
        'info_total_geral': `
            <h3>Composição do Valor Total</h3>
            <p>Nosso cálculo é transparente e considera:</p>
            <ol>
                <li><strong>Valor Base:</strong> O modelo do short com bordados Hanuthai.</li>
                <li><strong>Adicionais:</strong> Zonas de perna, textos extras e acessórios escolhidos.</li>
                <li><strong>Taxas de Arte:</strong> Cobradas uma única vez por logomarca nova.</li>
                <li><strong>Descontos:</strong> Aplicados automaticamente se você atingir 10 ou 20 peças.</li>
            </ol>
        `,
        'info_centro': `
            <h3>Personalização Centro Frente</h3>
            <p>Esta é a área principal do short. Ideal para o escudo da sua equipe ou academia.</p>
            <p><strong>Atenção:</strong> O espaço é otimizado para artes centralizadas. Se incluir um texto, tente não exceder a largura proporcional para manter a estética.</p>
        `,
        'info_telefone': `
            <h3>Por que o telefone é obrigatário?</h3>
            <p>O seu número é fundamental para que nosso time de produção entre em contato caso surjam dúvidas ou necessidade de <strong>ajustes técnicos</strong> durante o desenvolvimento da sua peça.</p>
            <p>Além disso, enviaremos a <strong>Aprovação de Arte final</strong> para garantir que tudo saia exatamente como você personalizou antes de iniciarmos a confecção.</p>
        `,
        'info_emb': `
            <h3>Arquivos Técnicos (.EMB)</h3>
            <p>O arquivo .EMB contém as informações de pontos, densidade e ordem de cores para a máquina de bordar.</p>
            <p><strong>Benefícios:</strong> Além de isentar a taxa de desenvolvimento, o envio do .EMB garante que o bordado saia exatamente com o acabamento técnico que você já utiliza em outros materiais.</p>
        `,
        'info_top_geral': `
            <h3>Personalização de Top Fitness</h3>
            <p>Nossos tops são desenvolvidos com suplex de alta compressão e forro duplo.</p>
            <ul>
                <li><strong>Frente/Costas:</strong> Você pode adicionar sua logo em ambas as faces.</li>
                <li><strong>Cores:</strong> Escolha cores que destaquem o bordado sobre o tecido escolhido.</li>
            </ul>
        `,
        'info_legging_geral': `
            <h3>Customização de Calça Legging</h3>
            <p>As leggings Hanuthai possuem modelagem "empina bumbum" e cintura alta.</p>
            <ul>
                <li><strong>Laterais:</strong> Posição estratégica para logos verticais grandes.</li>
                <li><strong>Conforto:</strong> O bordado é feito de forma a não incomodar ou pinicar durante o exercício.</li>
            </ul>
        `,
        'info_moletom_geral': `
            <h3>Moletom Canguru Premium</h3>
            <p>Moletom pesado (flanelado) ideal para climas frios e pós-treino.</p>
            <ul>
                <li><strong>Bolso Canguru:</strong> A personalização frontal é posicionada logo acima do bolso.</li>
                <li><strong>Capuz:</strong> Lembre-se que o capuz abaixado pode cobrir parte da arte nas costas.</li>
            </ul>
        `,
        'info_shorts_legging_geral': `
            <h3>Conceito Shorts Legging</h3>
            <p>O Shorts Legging Hanuthai combina a compressão e segurança da legging interna com o design clássico do shorts externo.</p>
            <ul>
                <li><strong>Híbrido:</strong> Duas peças em uma só, ideal para MMA, No-Gi e treinos de alta intensidade.</li>
                <li><strong>Cós Anatômico:</strong> Ajuste firme que não escorrega durante o movimento.</li>
            </ul>
        `,
        'info_perna_sl': `
            <h3>Customização na Perna Interna</h3>
            <p>Este é o grande diferencial deste modelo. Você pode estampar artes diretamente na malha elástica da legging.</p>
            <p><strong>Dica Técnica:</strong> Utilize artes com cores sólidas para garantir que a estampa acompanhe a elasticidade do tecido sem rachar.</p>
        `,
        'info_laterais_sl': `
            <h3>Espaço de Laterais (Shorts Externo)</h3>
            <p>As laterais do shorts externo são perfeitas para nomes e logotipos horizontais.</p>
            <p><strong>Dica:</strong> Personalizar apenas um lado com o nome e o outro com sua logo cria um visual equilibrado e profissional.</p>
        `,
        'info_punho_moletom': `
            <h3>Logo de Punho (Hanuthai)</h3>
            <p>Por padrão, nossos moletons levam a logo Hanuthai no punho.</p>
            <p><strong>Removendo a Logo:</strong> Caso prefira um design totalmente liso ou queira colocar sua própria marca no futuro, cobramos uma taxa de R$ 15,00 para a alteração da linha de produção (remoção).</p>
        `,
        'info_cores_logotipos': `
            <h3>Paleta de Cores para Bordado</h3>
            <p>Diferente do tecido do produto, estas cores referem-se às **linhas de bordado** disponíveis.</p>
            <p><strong>Dica:</strong> Procure combinar a cor da logo com os outros detalhes do conjunto para um visual profissional.</p>
        `,
        'customization_shorts': `
            <h3>Personalização em Bordado</h3>
            <p>Nos <strong>Shorts Fight</strong>, as personalizações de textos e imagens são aplicadas através de <strong>bordado eletrônico</strong> de alta definição direto no tecido.</p>
            <p>Esta técnica garante durabilidade extrema e acabamento premium 3D.</p>
            <p><a href="FAQ.html" target="_blank" style="color:#D4AF37; text-decoration:underline;">Ver diferença entre Bordado e DTF no FAQ 🔗</a></p>
        `,
        'customization_general': `
            <h3>Personalização em DTF Têxtil</h3>
            <p>Neste produto, utilizamos a tecnologia <strong>DTF (Direct to Film) Têxtil</strong>.</p>
            <p>Diferente do bordado, o DTF é uma estampa de alta fusão que permite cores vibrantes, degradês e toque suave, sem adicionar peso excessivo à peça.</p>
            <p><a href="FAQ.html" target="_blank" style="color:#D4AF37; text-decoration:underline;">Ver diferença entre Bordado e DTF no FAQ 🔗</a></p>
        `
    },

    init: function () {
        this.loadTexts();
        this.injectStyles();
        this.attachGlobalListeners();
    },

    loadTexts: function () {
        try {
            const stored = JSON.parse(localStorage.getItem('hnt_info_texts') || '{}');
            this.texts = { ...this.defaults, ...stored };
        } catch (e) {
            console.error("Erro ao carregar textos informativos", e);
            this.texts = this.defaults;
        }
    },

    getIconHTML: function (key, customTitle) {
        const title = customTitle || "Clique para mais informações";
        return `<span class="info-icon" data-info-key="${key}" title="${title}">ℹ️</span>`;
    },

    showModal: function (key) {
        const content = this.texts[key] || '<p>Informação não disponível.</p>';

        let modal = document.getElementById('info-modal');
        if (!modal) {
            this.createModalDOM();
            modal = document.getElementById('info-modal');
        }

        document.getElementById('info-modal-content-body').innerHTML = content;
        modal.classList.add('visible');
    },

    createModalDOM: function () {
        const modal = document.createElement('div');
        modal.id = 'info-modal';
        modal.className = 'info-modal-overlay';
        modal.innerHTML = `
            <div class="info-modal-box">
                <button class="info-close-btn">&times;</button>
                <div id="info-modal-content-body" class="info-body"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close events
        modal.querySelector('.info-close-btn').onclick = () => this.closeModal();
        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal();
        }
    },

    closeModal: function () {
        document.getElementById('info-modal').classList.remove('visible');
    },

    injectStyles: function () {
        if (document.getElementById('info-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'info-system-styles';
        style.textContent = `
            /* Icon Style */
            .info-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                background: #6c757d;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-family: monospace;
                cursor: pointer;
                margin-left: 8px;
                vertical-align: middle;
                transition: background 0.2s;
            }
            .info-icon:hover {
                background: #007bff;
            }

            /* Modal Styles */
            .info-modal-overlay {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
            }
            .info-modal-overlay.visible {
                display: flex;
            }
            .info-modal-box {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                font-family: 'Outfit', 'Poppins', sans-serif;
                animation: infoModalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @keyframes infoModalPop {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .info-close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                border: none;
                background: #f0f0f0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                color: #333;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                transition: 0.2s;
            }
            .info-close-btn:hover {
                background: #e0e0e0;
                transform: rotate(90deg);
            }
            .info-body h3 {
                margin-top: 0;
                color: #D4AF37;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 12px;
                margin-bottom: 20px;
                font-size: 1.4rem;
                font-family: 'Bebas Neue', cursive;
                letter-spacing: 1px;
            }
            .info-body p {
                line-height: 1.6;
                color: #444;
                margin: 12px 0;
                font-size: 1rem;
            }
            .info-body ul, .info-body ol {
                padding-left: 20px;
                color: #444;
            }
            .info-body li {
                margin-bottom: 8px;
                line-height: 1.4;
            }
            .info-body strong {
                color: #222;
            }
            .info-body img {
                width: auto;
                max-width: 100%;
                max-height: 85vh;
                height: auto;
                display: block;
                margin: 0 auto;
            }
            .img-overlay-wrapper {
                position: relative;
                width: 100%;
                text-align: center;
            }
            .img-overlay-text {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                max-width: 400px;
                z-index: 10;
            }
            .img-overlay-text h3 {
                margin: 0 0 5px 0;
                font-size: 1.1rem;
                border-bottom: none;
                padding-bottom: 0;
                color: #222;
            }
            .img-overlay-text p {
                margin: 0;
                font-size: 0.9rem;
                color: #555;
            }
        `;
        document.head.appendChild(style);
    },

    attachGlobalListeners: function () {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('info-icon')) {
                const key = e.target.getAttribute('data-info-key');
                if (key) this.showModal(key);
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => InfoSystem.init());
} else {
    InfoSystem.init();
}

/**
 * Ferramenta de Calibração de Zonas - Hanuthai
 * Atualizado para suportar Shorts e variantes de Limites Dinâmicos
 */

// Definição de simuladores e suas zonas
const SIMULATORS = {
    top: {
        name: 'Top',
        image: 'assets/Top/Principal/rosa.png',
        limitImage: 'assets/Top/Limites/Pr_frente.png',
        limitType: 'light',
        zones: [
            { id: 'frente_centro', name: 'Frente Centro', type: 'image', limitImage: 'Pr_frente.png' },
            { id: 'costas_centro', name: 'Costas Centro', type: 'image', limitImage: 'Pr_costas.png' },
            { id: 'text_frente', name: 'Texto Frente', type: 'text' },
            { id: 'text_costas', name: 'Texto Costas', type: 'text' }
        ]
    },
    moletom: {
        name: 'Moletom',
        image: 'assets/Moletom/Principal/Branco.png',
        limitImage: 'assets/Moletom/Limites/Pr_frente Preto.png',
        limitType: 'light',
        zones: [
            { id: 'frente_centro', name: 'Frente Centro', type: 'image', limitImage: 'Pr_frente Preto.png' },
            { id: 'costas_centro', name: 'Costas Centro', type: 'image', limitImage: 'Pr_costas Preto.png' },
            { id: 'manga_direita', name: 'Manga Direita', type: 'image' },
            { id: 'manga_esquerda', name: 'Manga Esquerda', type: 'image' },
            { id: 'text_frente', name: 'Texto Frente', type: 'text' },
            { id: 'text_costas', name: 'Texto Costas', type: 'text' },
            { id: 'text_manga_dir', name: 'Texto Manga Direita', type: 'text' },
            { id: 'text_manga_esq', name: 'Texto Manga Esquerda', type: 'text' }
        ]
    },
    legging: {
        name: 'Legging',
        image: 'assets/Legging/Principal/rosa.png',
        limitImage: 'assets/Legging/Limites/Pr_lateral direita.png',
        limitType: 'light',
        zones: [
            { id: 'lateral_direita', name: 'Lateral Direita', type: 'image', limitImage: 'Pr_lateral direita.png' },
            { id: 'lateral_esquerda', name: 'Lateral Esquerda', type: 'image', limitImage: 'Pr_Lateral esquerda.png' },
            { id: 'perna_direita', name: 'Perna Direita', type: 'image' },
            { id: 'perna_esquerda', name: 'Perna Esquerda', type: 'image', limitImage: 'Pr_perna.png' },
            { id: 'text_lat_dir', name: 'Texto Lateral Direita', type: 'text' },
            { id: 'text_lat_esq', name: 'Texto Lateral Esquerda', type: 'text' },
            { id: 'text_perna_dir', name: 'Texto Perna Direita', type: 'text' },
            { id: 'text_perna_esq', name: 'Texto Perna Esquerda', type: 'text' }
        ]
    },
    shorts_legging: {
        name: 'ShortsLegging',
        image: 'assets/ShortsLegging/Principal/rosa.png',
        limitImage: 'assets/ShortsLegging/Limites/Pr_Lateral direita.png',
        limitType: 'light',
        zones: [
            { id: 'lateral_direita', name: 'Lateral Direita', type: 'image', limitImage: 'Pr_Lateral direita.png' },
            { id: 'lateral_esquerda', name: 'Lateral Esquerda', type: 'image', limitImage: 'Pr_Lateral esquerda.png' },
            { id: 'perna_direita', name: 'Perna Direita', type: 'image', limitImage: 'Pr_Perna.png' },
            { id: 'perna_esquerda', name: 'Perna Esquerda', type: 'image', limitImage: 'Pr_Perna.png' },
            { id: 'text_lat_dir', name: 'Texto Lateral Direita', type: 'text' },
            { id: 'text_lat_esq', name: 'Texto Lateral Esquerda', type: 'text' },
            { id: 'text_perna_dir', name: 'Texto Perna Direita', type: 'text' },
            { id: 'text_perna_esq', name: 'Texto Perna Esquerda', type: 'text' }
        ]
    },
    shorts: {
        name: 'Shorts',
        image: 'assets/Shorts/Principal/rosa.png',
        limitImage: 'assets/Shorts/Limites/Pr_Lmte_Centro.png',
        limitType: 'light',
        zones: [
            // Zonas Principais
            { id: 'logo_centro', name: 'Frente Centro', type: 'image', limitImage: 'Pr_Lmte_Centro.png' },
            { id: 'text_centro', name: 'Texto Frente', type: 'text', limitImage: 'Pr_Lmte_Centro.png' },

            { id: 'logo_lat_dir', name: 'Lateral Direita', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_lat_direita .png' },
            { id: 'text_lat_dir', name: 'Texto Lat. Direita', type: 'text', hasRotation: true, limitImage: 'Pr_Lmte_lat_direita .png' },

            { id: 'logo_lat_esq', name: 'Lateral Esquerda', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_lat_esquerda.png' },
            { id: 'text_lat_esq', name: 'Texto Lat. Esquerda', type: 'text', hasRotation: true, limitImage: 'Pr_Lmte_lat_esquerda.png' },

            // Variantes de Perna (Inclinação e Tamanhos)
            // Perna Direita Centro
            { id: 'leg_right_mid_ie', name: 'Perna Dir. Centro (Padrão IE)', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Cent_IE.png', realId: 'leg_right_mid' },
            { id: 'leg_right_mid_ii', name: 'Perna Dir. Centro (Reduzido II)', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Cent_II.png', realId: 'leg_right_mid' },

            // Perna Direita Inferior
            { id: 'leg_right_bottom_ie', name: 'Perna Dir. Inferior (Padrão IE)', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Inf_IE.png', realId: 'leg_right_bottom' },
            { id: 'leg_right_bottom_ii', name: 'Perna Dir. Inferior (Reduzido II)', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Inf_II.png', realId: 'leg_right_bottom' },

            // Perna Esquerda
            { id: 'leg_left_mid', name: 'Perna Esquerda', type: 'image', hasRotation: true, limitImage: 'Pr_Lmte_Perna_esq_Img_Cent_IE.png' },

            // Textos Perna
            { id: 'text_leg_right_mid', name: 'Texto Perna Dir. Centro', type: 'text', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Cent_IE.png' },
            { id: 'text_leg_right_bottom', name: 'Texto Perna Dir. Inf.', type: 'text', hasRotation: true, limitImage: 'Pr_Lmte_Perna_dir_Img_Inf_IE.png' },
            { id: 'text_leg_left_mid', name: 'Texto Perna Esq.', type: 'text', hasRotation: true, limitImage: 'Pr_Lmte_Perna_esq_Img_Cent_IE.png' },
        ]
    }
};

// Estado da aplicação
const state = {
    currentSimulator: null,
    currentZone: null,
    currentZoneIndex: 0,
    points: [],
    calibratedData: {},
    rotation: 0,
    showLimits: true
};

// Elementos DOM
const elements = {
    simulatorSelect: document.getElementById('simulator-select'),
    zoneList: document.getElementById('zone-list'),
    canvas: document.getElementById('calibration-canvas'),
    canvasContainer: document.getElementById('canvas-container'),
    instructionText: document.getElementById('instruction-text'),
    results: document.getElementById('results'),
    resultsContent: document.getElementById('results-content'),
    progress: document.getElementById('progress'),
    btnExport: document.getElementById('btn-export'),
    btnReset: document.getElementById('btn-reset')
};

const ctx = elements.canvas.getContext('2d');
let currentImage = null;
let currentLimitImage = null;
let canvasWidth = 800;
let canvasHeight = 600;

// Inicialização
elements.simulatorSelect.addEventListener('change', onSimulatorChange);
elements.canvas.addEventListener('click', onCanvasClick);
elements.btnExport.addEventListener('click', exportData);
elements.btnReset.addEventListener('click', resetAll);

// Event Handlers
function onSimulatorChange(e) {
    const simId = e.target.value;
    if (!simId) return;

    state.currentSimulator = simId;
    state.currentZoneIndex = 0;
    state.calibratedData[simId] = {};

    loadSimulator(simId);
}

function loadSimulator(simId) {
    const sim = SIMULATORS[simId];
    renderZoneList(sim.zones);
    loadImage(sim.image);

    elements.btnExport.style.display = 'block';
    elements.btnReset.style.display = 'block';

    startZoneCalibration(0);
}

function loadImage(imagePath) {
    currentImage = new Image();
    currentImage.onload = () => {
        // Ajustar canvas para caber a imagem
        const maxWidth = 800;
        const maxHeight = 600;
        const ratio = Math.min(maxWidth / currentImage.width, maxHeight / currentImage.height);

        canvasWidth = currentImage.width * ratio;
        canvasHeight = currentImage.height * ratio;

        elements.canvas.width = canvasWidth;
        elements.canvas.height = canvasHeight;

        elements.canvasContainer.style.display = 'block';

        drawCanvas();
    };
    currentImage.src = imagePath;
}

function loadLimitImage(zone) {
    if (!zone || !zone.limitImage) {
        currentLimitImage = null;
        drawCanvas();
        return;
    }

    const sim = SIMULATORS[state.currentSimulator];
    const limitPath = sim.name === 'Shorts' ? `assets/Shorts/Limites/${zone.limitImage}` : `assets/${sim.name}/Limites/${zone.limitImage}`;

    currentLimitImage = new Image();
    currentLimitImage.onload = () => {
        drawCanvas();
    };
    currentLimitImage.onerror = () => {
        console.warn('Limite não encontrado:', limitPath);
        currentLimitImage = null;
        drawCanvas();
    };
    currentLimitImage.src = limitPath;
}

function renderZoneList(zones) {
    elements.zoneList.innerHTML = '';
    zones.forEach((zone, index) => {
        const div = document.createElement('div');
        div.className = 'zone-item';
        div.onclick = () => startZoneCalibration(index);

        const nameBadge = zone.type === 'text' ? '📝' : '🖼️';
        const rotationBadge = zone.hasRotation ? ' 🔄' : '';

        div.innerHTML = `
            <div class="zone-name">${nameBadge} ${zone.name}${rotationBadge}</div>
            <div class="zone-status">Pendente</div>
        `;
        div.dataset.index = index;
        elements.zoneList.appendChild(div);
    });
}

function startZoneCalibration(index) {
    const sim = SIMULATORS[state.currentSimulator];
    state.currentZone = sim.zones[index];
    state.currentZoneIndex = index;
    state.points = [];
    state.rotation = 0;

    // Carregar imagem de limite para esta zona
    loadLimitImage(state.currentZone);

    updateZoneListUI();
    updateInstructions();
    drawCanvas();
}

function updateZoneListUI() {
    const items = elements.zoneList.querySelectorAll('.zone-item');
    items.forEach((item, idx) => {
        item.classList.remove('active', 'completed');

        const simId = state.currentSimulator;
        const zoneId = SIMULATORS[simId].zones[idx].id;

        if (idx === state.currentZoneIndex) {
            item.classList.add('active');
            item.querySelector('.zone-status').textContent = 'Em calibração...';
        } else if (state.calibratedData[simId] && state.calibratedData[simId][zoneId]) {
            item.classList.add('completed');
            item.querySelector('.zone-status').textContent = '✓ Calibrado';
        } else {
            item.querySelector('.zone-status').textContent = 'Pendente';
        }
    });

    updateProgress();
}

function calculateRotation(p0, p1) {
    // Vetor do Top-Left para Top-Right
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    // Y cresce para baixo
    // Se TR está abaixo de TL, dy > 0, angulo positivo (horário)
    // Se TR está acima de TL, dy < 0, angulo negativo (anti-horário)
    const rad = Math.atan2(dy, dx);
    const deg = rad * (180 / Math.PI);
    return parseFloat(deg.toFixed(1));
}

function updateInstructions() {
    const zone = state.currentZone;
    const stepNames = ['Superior Esquerdo (TL)', 'Superior Direito (TR)', 'Inferior Esquerdo (BL)', 'Inferior Direito (BR)'];

    // Botão de toggle de limites
    const limitToggle = zone.limitImage ? `
        <button onclick="toggleLimits()" 
                style="padding: 6px 12px; background: ${state.showLimits ? '#28a745' : '#6c757d'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; margin-left: 10px;">
            ${state.showLimits ? '👁️ Limites Visíveis' : '👁️‍🗨️ Mostrar Limites'}
        </button>` : '';

    if (state.points.length < 4) {
        const nextStep = stepNames[state.points.length];
        const rotationNote = zone.hasRotation ? '<br><strong>⚠️ Esta zona detecta inclinação. Marque os cantos com precisão.</strong>' : '';
        elements.instructionText.innerHTML = `
            <strong>Zona Atual: ${zone.name}</strong>${limitToggle}<br>
            Clique no ponto <strong style="color: #D4AF37;">${nextStep}</strong> do limite da zona.${rotationNote}
        `;
    } else if (zone.hasRotation && state.rotation === 0) {
        // Tentativa de cálculo automático já foi feita no onCanvasClick
        // Mostra o ângulo detectado para confirmação
        elements.instructionText.innerHTML = `
            <strong>Zona: ${zone.name}</strong>${limitToggle}<br>
            Ângulo Detectado: <strong>${state.rotation}°</strong><br>
            Pressione Confirmar se estiver correto.<br>
            <input type="number" id="rotation-input" value="${state.rotation}" min="-180" max="180" step="0.1" 
                   style="width: 100px; padding: 8px; margin: 10px 0; font-size: 1rem; border-radius: 4px; border: 2px solid #D4AF37;">
            <button onclick="confirmRotation()" 
                    style="padding: 8px 15px; background: #D4AF37; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                Confirmar / Atualizar
            </button>
        `;
    } else {
        elements.instructionText.innerHTML = `
            <strong>Zona: ${zone.name}</strong>${limitToggle}<br>
            ✓ Calibração completa! <span style="font-size:0.9em; color:#666;">(Ângulo: ${state.rotation || 0}°)</span>
            <button onclick="confirmZone()" 
                    style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px;">
                ✓ Salvar e Próxima
            </button>
            <button onclick="clearPoints()" 
                    style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                🔄 Refazer
            </button>
        `;
    }
}

function onCanvasClick(e) {
    if (state.points.length >= 4) return;
    // Se estiver esperando confirmação de rotação, bloqueia clique
    // (Lógica flexível: permitir recalcular se clicar de volta? Melhor limpar tudo no reset)

    const rect = elements.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / canvasWidth) * 100;
    const y = ((e.clientY - rect.top) / canvasHeight) * 100;

    state.points.push({ x, y });

    // Auto-calcula rotação no 2º ponto? Não, no 4º ponto para ter o quadro completo?
    // A rotação é definida pela aresta superior (Points 0 e 1)
    if (state.points.length >= 2 && state.currentZone.hasRotation) {
        // Atualiza rotação preliminar
        state.rotation = calculateRotation(state.points[0], state.points[1]);
    }

    updateInstructions();
    drawCanvas();
}

function drawCanvas() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Desenhar imagem do produto
    if (currentImage) {
        ctx.drawImage(currentImage, 0, 0, canvasWidth, canvasHeight);
    }

    // Desenhar imagem de limite (se disponível e habilitada)
    if (currentLimitImage && state.showLimits) {
        ctx.globalAlpha = 0.7; // Transparência para ver através
        ctx.drawImage(currentLimitImage, 0, 0, canvasWidth, canvasHeight);
        ctx.globalAlpha = 1.0; // Restaurar opacidade
    }

    // Desenhar pontos
    const colors = ['#ff5722', '#2196f3', '#4caf50', '#ffeb3b'];
    const labels = ['TL', 'TR', 'BL', 'BR'];

    state.points.forEach((point, index) => {
        const px = (point.x / 100) * canvasWidth;
        const py = (point.y / 100) * canvasHeight;

        // Círculo
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, 2 * Math.PI);
        ctx.fillStyle = colors[index];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[index], px, py);
    });

    // Desenhar retângulo se temos pelo menos 2 pontos (linha superior) ou 4 (retângulo)
    if (state.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        const p0 = state.points[0];
        const p1 = state.points[1];

        ctx.moveTo((p0.x / 100) * canvasWidth, (p0.y / 100) * canvasHeight);
        ctx.lineTo((p1.x / 100) * canvasWidth, (p1.y / 100) * canvasHeight);

        if (state.points.length === 4) {
            const p2 = state.points[2]; // BL (Bottom-Left) - Ordem de clique: TL, TR, BL, BR
            const p3 = state.points[3]; // BR (Bottom-Right)
            // Ordem visual do quad: TL -> TR -> BR -> BL -> TL (fechar)
            // Se o usuário clica: 1(TL), 2(TR), 3(BL), 4(BR)
            // Poligono: p0 -> p1 -> p3 -> p2 -> p0

            ctx.lineTo((p3.x / 100) * canvasWidth, (p3.y / 100) * canvasHeight);
            ctx.lineTo((p2.x / 100) * canvasWidth, (p2.y / 100) * canvasHeight);
            ctx.closePath();
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Desenhar centro se 4 pontos
    if (state.points.length === 4) {
        const p0 = state.points[0];
        const p1 = state.points[1];
        const p2 = state.points[2];
        const p3 = state.points[3];

        const centerX = ((p0.x + p1.x + p2.x + p3.x) / 4 / 100) * canvasWidth;
        const centerY = ((p0.y + p1.y + p2.y + p3.y) / 4 / 100) * canvasHeight;

        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#D4AF37';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function clearPoints() {
    state.points = [];
    state.rotation = 0;
    updateInstructions();
    drawCanvas();
}

function toggleLimits() {
    state.showLimits = !state.showLimits;
    updateInstructions();
    drawCanvas();
}

window.toggleLimits = toggleLimits;

function confirmRotation() {
    const input = document.getElementById('rotation-input');
    if (input) {
        state.rotation = parseFloat(input.value) || 0;
        updateInstructions();
    }
}

window.confirmRotation = confirmRotation;

function confirmZone() {
    if (state.points.length < 4) {
        alert('⚠️ Por favor, clique nos 4 pontos antes de confirmar.');
        return;
    }

    const zone = state.currentZone;
    const simId = state.currentSimulator;

    // Calcular coordenadas
    const p0 = state.points[0]; // TL
    const p1 = state.points[1]; // TR
    const p2 = state.points[2]; // BL
    const p3 = state.points[3]; // BR

    const centerX = (p0.x + p1.x + p2.x + p3.x) / 4;
    const centerY = (p0.y + p1.y + p2.y + p3.y) / 4;

    // Width e Height aproximados (baseados na média das arestas)
    // Para rotação, width é a distancia entre p0 e p1 (Edge Top)
    // Height é distancia entre p0 e p2 (Edge Left) -- assumindo retangulo
    // Distancia Euclidiana
    const getDist = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

    // Width (TL -> TR)
    // A porcentagem X/Y não é uniforme se o aspect ratio não for quadrado?
    // O sistema de coordenadas do simulador é % CSS (top/left).
    // Width é CSS %.
    // CUIDADO: Se a imagem não for quadrada, 1% X != 1% Y.
    // Mas width é % do Parent Width. Height % do Parent Height.
    // O simulador usa `width` e `height` em %.
    // Vamos usar a diferença simples em X e Y para caixas retas, ou distancia para rotacionadas?
    // Se rotacionado, a largura visual "width: 20%" é relativa à largura do container, mas girada.

    let width, height;

    if (zone.hasRotation) {
        // Se tem rotação, usaremos Distancia vetorial mas normalizada para % do eixo correspondente?
        // Sim, width é relativo ao Width do container.
        const widthV = getDist(p0, p1);
        const heightV = getDist(p0, p2);
        width = widthV;
        height = heightV;
    } else {
        width = Math.abs(p1.x - p0.x);
        height = Math.abs(p2.y - p0.y);
    }

    // Salvar dados
    const zoneData = {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        points: {
            topLeft: { x: p0.x.toFixed(2), y: p0.y.toFixed(2) },
            topRight: { x: p1.x.toFixed(2), y: p1.y.toFixed(2) },
            bottomLeft: { x: p2.x.toFixed(3), y: p2.y.toFixed(2) }, // Typo fix on precision
            bottomRight: { x: p3.x.toFixed(2), y: p3.y.toFixed(2) }
        },
        calculated: {
            x: parseFloat(centerX.toFixed(2)), // Center X
            y: parseFloat(centerY.toFixed(2)), // Center Y
            width: parseFloat(width.toFixed(2)),
            height: parseFloat(height.toFixed(2))
        }
    };

    if (zone.hasRotation) {
        zoneData.calculated.rotation = state.rotation;
    }

    if (!state.calibratedData[simId]) {
        state.calibratedData[simId] = {};
    }
    state.calibratedData[simId][zone.id] = zoneData;

    // Avançar
    const sim = SIMULATORS[simId];
    if (state.currentZoneIndex < sim.zones.length - 1) {
        startZoneCalibration(state.currentZoneIndex + 1);
    } else {
        showResults();
    }
}

window.confirmZone = confirmZone;
window.clearPoints = clearPoints;

function showResults() {
    elements.results.style.display = 'block';
    updateResultsDisplay();
}

function updateResultsDisplay() {
    const simId = state.currentSimulator;
    const data = state.calibratedData[simId];

    if (!data) return;

    let html = '';

    Object.values(data).forEach(zone => {
        const rotationLine = zone.calculated.rotation !== undefined
            ? `<div class="coord-line">rotation: ${zone.calculated.rotation}°</div>`
            : '';

        html += `
            <div class="coord-display">
                <strong style="color: #D4AF37;">${zone.name}</strong> (${zone.type}) [${zone.id}]
                <div class="coord-line">cssLeft: ${zone.calculated.x}% (aprox center)</div>
                <div class="coord-line">cssTop: ${zone.calculated.y}% (aprox center)</div>
                <div class="coord-line">width: ${zone.calculated.width}%</div>
                <div class="coord-line">height: ${zone.calculated.height}%</div>
                ${rotationLine}
            </div>
        `;
    });

    elements.resultsContent.innerHTML = html;
}

function updateProgress() {
    const simId = state.currentSimulator;
    if (!simId) return;

    const sim = SIMULATORS[simId];
    const total = sim.zones.length;
    const completed = Object.keys(state.calibratedData[simId] || {}).length;
    const percent = (completed / total) * 100;

    elements.progress.style.width = percent + '%';
}

function exportData() {
    const simId = state.currentSimulator;
    const data = state.calibratedData[simId];

    if (!data || Object.keys(data).length === 0) {
        alert('⚠️ Nenhuma zona calibrada para exportar.');
        return;
    }

    // Criar objeto de exportação compatível
    const exportObj = {};

    Object.values(data).forEach(zone => {
        const zoneConfig = {
            id: zone.id,
            // O sistema usa cssLeft/cssTop como CENTRO ou canto?
            // simulator-shorts.js: cssLeft: "14.0%". style.left = z.cssLeft. transform: translate(-50%, -50%).
            // Isso significa que cssLeft/cssTop SÃO O CENTRO.
            // Então calculated.x e y (Centro) estão CORRETOS para cssLeft/Top.
            cssLeft: zone.calculated.x + '%',
            cssTop: zone.calculated.y + '%',
            width: zone.calculated.width + '%',
            // height: zone.calculated.height + '%', // Simulator usually assumes proportional height or auto?
            // Lets include it for completeness if needed
            // height: zone.calculated.height + '%',
            name: zone.name
        };

        if (zone.calculated.rotation !== undefined) {
            zoneConfig.defaultRotation = zone.calculated.rotation;
        }

        exportObj[zone.id] = zoneConfig;
    });

    const jsonString = JSON.stringify(exportObj, null, 4);

    const exportHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;" id="export-modal">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: #D4AF37; margin-bottom: 20px;">📊 Dados Exportados - ${SIMULATORS[simId].name}</h2>
                <p style="margin-bottom: 15px; color: #666;">Copie abaixo. Nota: As zonas duplicadas (IE/II) devem ser mescladas manualmente na lógica se necessário.</p>
                <div class="export-box">${jsonString}</div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="copyToClipboard()" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        📋 Copiar para Clipboard
                    </button>
                    <button onclick="closeExportModal()" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        ✖ Fechar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', exportHtml);
}

function copyToClipboard() {
    const exportBox = document.querySelector('.export-box');
    const text = exportBox.textContent;

    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Código copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar. Por favor, copie manualmente.');
    });
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.remove();
}

window.copyToClipboard = copyToClipboard;
window.closeExportModal = closeExportModal;

function resetAll() {
    if (!confirm('⚠️ Deseja realmente resetar todos os dados calibrados? Esta ação não pode ser desfeita.')) {
        return;
    }

    state.calibratedData = {};
    state.points = [];
    state.rotation = 0;
    state.currentZone = null;
    state.currentZoneIndex = 0;

    elements.simulatorSelect.value = '';
    elements.canvasContainer.style.display = 'none';
    elements.results.style.display = 'none';
    elements.zoneList.innerHTML = '';
    elements.instructionText.textContent = 'Selecione um simulador para começar a calibração das zonas.';
    elements.progress.style.width = '0%';

    elements.btnExport.style.display = 'none';
    elements.btnReset.style.display = 'none';
}

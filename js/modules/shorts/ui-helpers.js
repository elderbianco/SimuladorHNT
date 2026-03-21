
/**
 * Verifica se existem uploads customizados sem cobertura EMB e exibe alerta se necessário.
 * Retorna true se estiver tudo ok (ou usuário confirmou "sem arte"), false se o fluxo foi interrompido (modal aberto).
 * Aceita um callback para executar se/quando for confirmado.
 */
window.validateEmbBeforeAction = function (onSuccess) {
    const coveredZones = new Set();
    if (state.embFiles) {
        state.embFiles.forEach(f => f.zones.forEach(z => coveredZones.add(z)));
    }

    const missingZones = [];
    DATA.uploadZones.forEach(u => {
        const up = state.uploads[u.id];
        if (up && up.src && up.isCustom) {
            if (!coveredZones.has(u.id)) {
                missingZones.push(u.name);
            }
        }
    });

    // Remove duplicates from missingZones names if any
    const uniqueMissingZones = [...new Set(missingZones)];

    if (uniqueMissingZones.length > 0) {
        showEmbAlert(uniqueMissingZones, onSuccess);
        return false;
    }

    // Tudo ok, executa direto
    onSuccess();
    return true;
};

function showEmbAlert(zones, onProceed) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:11000;';

    const content = document.createElement('div');
    content.style.cssText = 'background:#fff; padding:30px; border-radius:12px; max-width:550px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align:center; animation: fadeIn 0.3s ease;';

    content.innerHTML = `
        <div style="font-size:3rem; margin-bottom:15px;">⚠️</div>
        <h2 style="color:#D4AF37; margin:0 0 15px 0; font-family:'Roboto Condensed', sans-serif; text-transform:uppercase;">Atenção: Matriz de Bordado</h2>
        
        <p style="color:#333; font-size:1.1rem; line-height:1.5; margin-bottom:20px;">
            Detectamos que você enviou imagens personalizadas para: <br>
            <strong>${zones.join(', ')}</strong>
        </p>
        
        <div style="background:#f8f9fa; border-left:4px solid #28a745; padding:15px; text-align:left; margin-bottom:25px; border-radius:4px;">
            <p style="margin:0; color:#155724;">
                <strong>💡 Economize na sua compra!</strong><br>
                Se você já possui o arquivo da arte em formato <strong>.EMB</strong>, envie-o agora para obter <strong>isenção da taxa de desenvolvimento</strong>.
            </p>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
            <button id="alert-btn-upload" style="background:#28a745; color:#fff; border:none; padding:15px; border-radius:6px; font-size:1.1rem; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;">
                📎 Tenho a arte (.EMB) - Enviar Agora
            </button>
            
            <button id="alert-btn-proceed" style="background:#6c757d; color:#fff; border:none; padding:12px; border-radius:6px; font-size:1rem; cursor:pointer; margin-top:5px;">
                Não tenho a arte (Prosseguir com cobrança)
            </button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('alert-btn-upload').onclick = () => {
        document.body.removeChild(modal);
        // Scroll até a seção EMB e foca
        const embSection = document.getElementById('emb-section-container');
        if (embSection) {
            embSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Destacar visualmente
            embSection.style.transition = 'box-shadow 0.5s';
            embSection.style.boxShadow = '0 0 20px #28a745';
            setTimeout(() => embSection.style.boxShadow = 'none', 2000);

            // Abrir file picker
            setTimeout(() => {
                const btn = document.getElementById('emb-upload-btn');
                if (btn) btn.click();
            }, 800);
        }
    };

    document.getElementById('alert-btn-proceed').onclick = () => {
        document.body.removeChild(modal);
        onProceed();
    };
}

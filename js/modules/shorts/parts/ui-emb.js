/**
 * Módulo de Gestão de Arquivos de Bordado (EMB)
 * Funções: showEmbZoneSelection, renderEmbFilesList, removeEmbFile, validateEmbBeforeAction
 */

function showEmbZoneSelection(file) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000;';

    const content = document.createElement('div');
    content.style.cssText = 'background:#fff; padding:25px; border-radius:8px; max-width:500px; width:90%;';

    content.innerHTML = `
        <h3 style="margin:0 0 15px 0; color:#333;">📎 ${file.name}</h3>
        <p style="color:#666; margin:0 0 15px 0;">Tamanho: ${(file.size / 1024).toFixed(2)} KB</p>
        <p style="color:#333; font-weight:bold; margin:0 0 10px 0;">Selecione onde esta arte será utilizada:</p>
        <div id="emb-zone-checkboxes" style="max-height:300px; overflow-y:auto; margin-bottom:15px;"></div>
        <div style="display:flex; gap:10px;">
            <button id="emb-confirm-btn" style="flex:1; background:#28a745; color:#fff; border:none; padding:12px; border-radius:4px; cursor:pointer; font-weight:bold;">
                ✓ Confirmar
            </button>
            <button id="emb-cancel-btn" style="flex:1; background:#dc3545; color:#fff; border:none; padding:12px; border-radius:4px; cursor:pointer; font-weight:bold;">
                ✗ Cancelar
            </button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const zoneCheckboxes = document.getElementById('emb-zone-checkboxes');

    // 1. Filtrar zonas com uploads ativos e agrupar variantes
    const activeZones = DATA.uploadZones.filter(z => state.uploads[z.id] && state.uploads[z.id].src);

    if (activeZones.length === 0) {
        zoneCheckboxes.innerHTML = '<p style="color:#d9534f; text-align:center;">Nenhuma imagem enviada ainda.<br>Faça upload de uma imagem no simulador antes de vincular o arquivo EMB.</p>';
        document.getElementById('emb-confirm-btn').disabled = true;
        document.getElementById('emb-confirm-btn').style.opacity = '0.5';
        document.getElementById('emb-confirm-btn').style.cursor = 'not-allowed';
    } else {
        // Mapa para agrupar zonas (ex: remover _ie e _ii)
        const groupedZones = {};

        activeZones.forEach(zone => {
            let baseId = zone.id;
            let displayName = zone.name;

            // Unificar Perna Direita Centro
            if (baseId.includes('leg_right_mid')) {
                baseId = 'leg_right_mid_unified';
                displayName = 'Perna Direita Centro';
            }
            // Unificar Perna Direita Inferior
            else if (baseId.includes('leg_right_bottom')) {
                baseId = 'leg_right_bottom_unified';
                displayName = 'Perna Direita Inferior';
            }

            if (!groupedZones[baseId]) {
                groupedZones[baseId] = {
                    name: displayName,
                    originalIds: []
                };
            }
            groupedZones[baseId].originalIds.push(zone.id);
        });

        Object.keys(groupedZones).forEach(key => {
            const group = groupedZones[key];
            const div = document.createElement('div');
            div.style.cssText = 'padding:8px; border-bottom:1px solid #eee;';
            div.innerHTML = `
                <label style="display:flex; align-items:center; cursor:pointer;">
                    <input type="checkbox" value="${group.originalIds.join(',')}" style="margin-right:8px;">
                    <span style="color:#333;">${group.name}</span>
                </label>
            `;
            zoneCheckboxes.appendChild(div);
        });
    }

    // Confirm button
    document.getElementById('emb-confirm-btn').onclick = () => {
        const selectedOriginalIds = [];
        const checkboxes = zoneCheckboxes.querySelectorAll('input:checked');

        checkboxes.forEach(cb => {
            const ids = cb.value.split(',');
            selectedOriginalIds.push(...ids);
        });

        if (selectedOriginalIds.length === 0) {
            alert('⚠️ Selecione pelo menos uma zona!');
            return;
        }

        // Add file to state
        state.embFiles.push({
            filename: file.name,
            size: file.size,
            zones: selectedOriginalIds
        });

        if (typeof saveState === 'function') saveState();
        renderEmbFilesList();
        document.body.removeChild(modal);
    };

    // Cancel button
    document.getElementById('emb-cancel-btn').onclick = () => {
        document.body.removeChild(modal);
    };
}

/**
 * Render list of EMB files
 */
function renderEmbFilesList() {
    const listContainer = document.getElementById('emb-files-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (!state.embFiles || state.embFiles.length === 0) {
        return;
    }

    state.embFiles.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.style.cssText = 'background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; padding:10px; margin-bottom:8px;';

        const zoneNames = file.zones.map(zoneId => {
            const zone = DATA.uploadZones.find(z => z.id === zoneId);
            return zone ? zone.name : zoneId;
        }).join(', ');

        fileDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="flex:1;">
                    <div style="font-weight:bold; color:#333; margin-bottom:4px;">📎 ${file.filename}</div>
                    <div style="font-size:0.85rem; color:#666;">Tamanho: ${(file.size / 1024).toFixed(2)} KB</div>
                    <div style="font-size:0.85rem; color:#28a745; margin-top:4px;">
                        <strong>Zonas:</strong> ${zoneNames}
                    </div>
                </div>
                <button onclick="removeEmbFile(${index})" style="background:#dc3545; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85rem;">
                    🗑️ Remover
                </button>
            </div>
        `;

        listContainer.appendChild(fileDiv);
    });
}

/**
 * Remove EMB file from list
 */
window.removeEmbFile = function (index) {
    if (confirm('Deseja remover este arquivo EMB?')) {
        state.embFiles.splice(index, 1);
        if (typeof saveState === 'function') saveState();
        renderEmbFilesList();
    }
};

/**
 * Verifica se existem uploads customizados sem cobertura EMB e exibe alerta se necessário.
 * Retorna true se estiver tudo ok (ou usuário confirmou "sem arte"), false se o fluxo foi interrompido (modal aberto).
 * Aceita um callback para executar se/quando for confirmado.
 */
window.validateEmbBeforeAction = function (onSuccess) {
    if (typeof EmbManager !== 'undefined') {
        const result = EmbManager.validatePromises(state.uploads, state.embFiles, (zId) => {
            const z = DATA.uploadZones.find(x => x.id === zId);
            return z ? z.name : zId;
        });

        // === PRIORIDADE 1: BLOQUEIO ===
        if (result.blocking.length > 0) {
            if (typeof showEmbBlockingAlert === 'function') showEmbBlockingAlert([...new Set(result.blocking)]);
            else alert('Bloqueio: Algumas zonas requerem arquivo EMB.');
            return false;
        }

        // === PRIORIDADE 2: OPORTUNIDADE ===
        if (result.opportunity.length > 0) {
            if (typeof showEmbAlert === 'function') showEmbAlert([...new Set(result.opportunity)], onSuccess);
            else {
                if (confirm('Atenção: Você tem imagens enviadas, mas não anexou o arquivo de bordado correspondente (.EMB).\n\nClique em [OK] para prosseguir sem enviar o arquivo.\nClique em [Cancelar] para retornar e anexar a arte.')) onSuccess();
            }
            return false;
        }

        onSuccess();
        return true;
    }

    // --- FALLBACK (Lógica Legada) ---
    const coveredZones = new Set();
    if (state.embFiles) {
        state.embFiles.forEach(f => f.zones.forEach(z => coveredZones.add(z)));
    }

    const missingZones = [];
    const blockingZones = [];

    DATA.uploadZones.forEach(u => {
        const up = state.uploads[u.id];
        if (up && up.src && up.isCustom) {
            const isCovered = coveredZones.has(u.id);

            if (up.hasEmbPromise && !isCovered) {
                // Prometeu e não enviou -> Bloqueio
                blockingZones.push(u.name);
            } else if (!isCovered) {
                // Não prometeu e não enviou -> Aviso (Oportunidade)
                missingZones.push(u.name);
            }
        }
    });

    if (blockingZones.length > 0) {
        if (typeof showEmbBlockingAlert === 'function') showEmbBlockingAlert(blockingZones);
        else alert('Bloqueio: Faltam arquivos EMB para: ' + blockingZones.join(', '));
        return false;
    }

    if (missingZones.length > 0) {
        if (typeof showEmbAlert === 'function') showEmbAlert(missingZones, onSuccess);
        else {
            if (confirm('Atenção: Você tem uploads sem arquivo EMB: ' + missingZones.join(', ') + '. Deseja continuar?')) onSuccess();
        }
        return false;
    }

    onSuccess();
    return true;
};

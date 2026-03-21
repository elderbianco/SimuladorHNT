/**
 * Módulo de Orquestração de Salvar - Admin
 */

window.saveAll = function (alertUser = true) {
    // Call save functions from each module
    if (window.saveGlobalSettings) window.saveGlobalSettings();
    if (window.saveShortsSettings) window.saveShortsSettings();
    if (window.saveShortsLeggingSettings) window.saveShortsLeggingSettings();
    if (window.saveLeggingSettings) window.saveLeggingSettings();
    if (window.saveMoletomSettings) window.saveMoletomSettings();
    if (window.saveTopSettings) window.saveTopSettings();

    if (alertUser) {
        alert('✅ Configurações salvas com sucesso! Atualize as páginas dos simuladores para aplicar as mudanças.');
    }
};

window.saveAllSilent = function () {
    window.saveAll(false);
};

window.setupAutoSave = function () {
    document.querySelectorAll('input[type="number"], input[type="checkbox"], select, textarea').forEach(el => {
        // Avoid auto-saving for login or other non-config fields if necessary
        if (el.id && (el.id.includes('login') || el.id === 'gallery-upload-input')) return;

        el.addEventListener('input', () => {
            window.saveAllSilent();
        });
    });
};

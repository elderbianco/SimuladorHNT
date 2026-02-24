// ADMIN PANEL MAIN LOGIC

// =============================================
// INITIALIZATION - Auto-populate on first run
// =============================================

function initializeDefaultConfigs() {
    // Official table values (Jan 2026)
    const configs = {
        'hnt_pricing_config': {
            basePrice: 149.90,
            sizeModPrice: 0,
            devFee: 0,
            logoCenterPrice: 29.90,
            textCenterPrice: 19.90,
            logoLatPrice: 14.90,
            textLatPrice: 9.90,
            legRightMidPrice: 14.90,
            legRightBottomPrice: 14.90,
            legLeftPrice: 14.90,
            extraLeggingPrice: 38.90,
            extraLacoPrice: 14.90,
            extraCordaoPrice: 14.90,
            price10: 134.90,
            price20: 119.90,
            price30: 104.90,
            artWaiver: true,
            whatsappNumber: ""
        },
        'hnt_legging_config': {
            basePrice: 139.90,
            sizeModPrice: 0,
            devFee: 0,
            logoLatPrice: 29.90,
            textLatPrice: 9.90,
            logoLegPrice: 14.90,
            textLegPrice: 0,
            price10: 125.90,
            price20: 111.90,
            price30: 97.90,
            artWaiver: true
        },
        'hnt_shorts_legging_config': {
            basePrice: 89.90,
            sizeModPrice: 0,
            devFee: 0,
            logoLatPrice: 29.90,
            textLatPrice: 9.90,
            logoLegPrice: 14.90,
            textLegPrice: 9.90,
            price10: 80.90,
            price20: 71.90,
            price30: 62.90,
            artWaiver: true
        },
        'hnt_top_config': {
            basePrice: 89.90,
            sizeModPrice: 0,
            devFee: 0,
            logoFrontPrice: 14.90,
            textFrontPrice: 9.90,
            logoBackPrice: 0,
            textBackPrice: 0,
            logoHntFrontPrice: 0,
            logoHntBackPrice: 0,
            price10: 80.90,
            price20: 71.90,
            price30: 62.90,
            artWaiver: true
        },
        'hnt_moletom_config': {
            basePrice: 189.90,
            sizeModPrice: 0,
            devFee: 0,
            logoFrontPrice: 29.90,
            textFrontPrice: 19.90,
            logoBackPrice: 29.90,
            textBackPrice: 19.90,
            logoHoodPrice: 14.90,
            textHoodPrice: 9.90,
            logoSleevePrice: 14.90,
            textSleevePrice: 9.90,
            zipperUpgrade: 0,
            pocketUpgrade: 0,
            price10: 170.90,
            price20: 151.90,
            price30: 132.90,
            artWaiver: true
        }
    };

    // Initialize each config
    Object.keys(configs).forEach(key => {
        const existing = localStorage.getItem(key);
        if (!existing) {
            // First time: populate with defaults
            localStorage.setItem(key, JSON.stringify(configs[key]));
            console.log(`✅ Initialized ${key} with default values`);
        } else {
            // Check if existing config has missing fields
            try {
                const parsed = JSON.parse(existing);
                let needsUpdate = false;

                // Add missing fields from defaults
                Object.keys(configs[key]).forEach(field => {
                    if (parsed[field] === undefined) {
                        parsed[field] = configs[key][field];
                        needsUpdate = true;
                    }
                });

                if (needsUpdate) {
                    localStorage.setItem(key, JSON.stringify(parsed));
                    console.log(`✅ Updated ${key} with missing fields`);
                } else {
                    console.log(`✅ ${key} already complete`);
                }
            } catch (e) {
                console.error(`❌ Error parsing ${key}, resetting to defaults`);
                localStorage.setItem(key, JSON.stringify(configs[key]));
            }
        }
    });

    console.log('✅ Configuration initialization complete');
}

// Run initialization immediately
initializeDefaultConfigs();

// =============================================
// TAB SWITCHING
// =============================================

// TAB SWITCHING
window.switchTab = function (tabName, btn) {
    // Hide all
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Activate clicked
    if (btn) {
        btn.classList.add('active');
    } else {
        // Fallback checks
        const buttons = document.querySelectorAll('.tab');
        buttons.forEach(b => {
            if (b.getAttribute('onclick').includes(`'${tabName}'`)) b.classList.add('active');
        });
    }

    const tabContent = document.getElementById('tab-' + tabName);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    if (tabName === 'global') {
        if (window.renderGalleryAdmin) renderGalleryAdmin();
    }
};

// INIT DASHBOARD
window.initDashboard = function () {
    if (window.renderUserTable) renderUserTable();

    if (window.loadGlobalSettings) loadGlobalSettings();
    if (window.loadShortsSettings) loadShortsSettings();
    if (window.loadShortsLeggingSettings) loadShortsLeggingSettings();
    if (window.loadLeggingSettings) loadLeggingSettings();

    if (window.loadMoletomSettings) loadMoletomSettings();
    if (window.loadTopSettings) loadTopSettings();

    if (window.renderGalleryAdmin) renderGalleryAdmin();

    // Setup Collapsibles
    setupCollapsibles();
};

// COLLAPSIBLE LOGIC
function setupCollapsibles() {
    const headers = document.querySelectorAll('.collapsible-header');
    headers.forEach(header => {
        // Remove existing listeners to avoid duplicates if re-initialized
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', function () {
            this.classList.toggle('collapsed');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });
}

// SAVE ALL
window.saveAllSettings = function () {
    if (window.saveGlobalSettings) saveGlobalSettings();
    if (window.saveShortsSettings) saveShortsSettings();
    if (window.saveShortsLeggingSettings) saveShortsLeggingSettings();
    if (window.saveLeggingSettings) saveLeggingSettings();
    if (window.saveMoletomSettings) saveMoletomSettings();
    if (window.saveTopSettings) saveTopSettings();
    alert('✅ Todas as configurações foram salvas!');
};

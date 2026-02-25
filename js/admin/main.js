// ADMIN PANEL MAIN LOGIC

// =============================================
// INITIALIZATION - Auto-populate on first run
// =============================================

// Hydrate local storage from Supabase
async function hydrateConfigsFromServer() {
    const configKeys = [
        'hnt_pricing_config',
        'hnt_legging_config',
        'hnt_shorts_legging_config',
        'hnt_top_config',
        'hnt_moletom_config',
        'hnt_production_config',
        'hnt_production_costs',
        'hnt_active_fonts',
        'hnt_preferred_fonts',
        'hnt_custom_fonts_data',
        'hnt_text_colors',
        'hnt_admin_users',
        'hnt_gallery_custom',
        'hnt_gallery_deleted',
        'hnt_disabled_colors',
        'hnt_part_colors',
        'hnt_legging_part_colors',
        'hnt_shorts_legging_part_colors',
        'hnt_moletom_part_colors',
        'hnt_top_part_colors'
    ];

    console.log('🔄 Hydrating configs from server...');

    for (const key of configKeys) {
        try {
            const response = await fetch(`/api/admin/config/${key}`);
            if (response.ok) {
                const data = await response.json();
                if (data && Object.keys(data).length > 0) {
                    localStorage.setItem(key, JSON.stringify(data));
                    console.log(`✅ ${key} hydrated from server`);
                }
            }
        } catch (error) {
            console.error(`❌ Error hydrating ${key}:`, error);
        }
    }
}

// Run initialization
async function initializeAdmin() {
    // 1. First, set defaults if empty
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

    Object.keys(configs).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(configs[key]));
        }
    });

    // 2. Hydrate from server (Overwrites if exists)
    await hydrateConfigsFromServer();

    // 3. Hydrate Orders from Server
    if (typeof DatabaseManager !== 'undefined' && DatabaseManager.loadFromServer) {
        console.log('📦 Loading orders from database...');
        await DatabaseManager.loadFromServer({ silent: true, reload: false });
    }

    console.log('✅ Admin initialization complete');
}

// Global initialization call is now managed inside DOMContentLoaded or Auth Success
// initializeAdmin(); // We will call this after login success or session check


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

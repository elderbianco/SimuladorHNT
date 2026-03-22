/**
 * Auth Widget — HNT Simuladores
 * Renders login/register buttons in the top-right of every page header.
 * If logged in: shows user first name + logout button.
 * On login: fetches profile from clientes_cadastrados → saves to hnt_customer_profile → auto-fills #phone-input.
 */
const AuthWidget = (() => {
    const PROFILE_KEY = 'hnt_customer_profile';
    const WIDGET_ID = 'auth-widget-container';

    // ─── Internal helpers ──────────────────────────────────────────────────

    function getFirstName(fullName = '') {
        return fullName.trim().split(' ')[0] || fullName;
    }

    function formatPhone(digits = '') {
        const d = digits.replace(/\D/g, '');
        if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
        if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return digits;
    }

    function getSupabase() {
        return window.supabaseClient || (typeof supabase !== 'undefined' ? supabase : null);
    }

    function getLoginRedirect() {
        const current = encodeURIComponent(window.location.pathname + window.location.search);
        return `IndexLogin.html?redirect=${current}`;
    }

    // ─── Widget styles (injected once) ─────────────────────────────────────

    function injectStyles() {
        if (document.getElementById('auth-widget-styles')) return;
        const style = document.createElement('style');
        style.id = 'auth-widget-styles';
        style.textContent = `
            #auth-widget-container {
                position: absolute;
                right: 18px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 9999;
            }
            .auth-btn {
                font-family: 'Outfit', 'Bebas Neue', sans-serif;
                font-size: 0.78rem;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 7px 14px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .auth-btn-register {
                background: transparent;
                color: #FFD700;
                border: 1.5px solid #FFD700;
            }
            .auth-btn-register:hover {
                background: #FFD700;
                color: #000;
            }
            .auth-btn-login {
                background: #FFD700;
                color: #000;
            }
            .auth-btn-login:hover {
                background: #ffe84d;
                transform: translateY(-1px);
                box-shadow: 0 4px 14px rgba(255,215,0,0.35);
            }
            .auth-user-chip {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .auth-user-name {
                color: #FFD700;
                font-size: 0.82rem;
                font-weight: 700;
                letter-spacing: 0.5px;
                max-width: 130px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .auth-btn-logout {
                background: transparent;
                color: #888;
                border: 1px solid #444;
                font-size: 0.72rem;
                padding: 5px 10px;
            }
            .auth-btn-logout:hover {
                border-color: #ff4d4d;
                color: #ff4d4d;
            }
        `;
        document.head.appendChild(style);
    }

    // ─── Render functions ──────────────────────────────────────────────────

    function renderGuest(container) {
        container.innerHTML = `
            <a href="indexCadastro.html" class="auth-btn auth-btn-register">✏️ Cadastro</a>
            <a href="${getLoginRedirect()}" class="auth-btn auth-btn-login">🔐 Login</a>
        `;
    }

    function renderLoggedIn(container, name) {
        const firstName = getFirstName(name);
        container.innerHTML = `
            <div class="auth-user-chip">
                <span class="auth-user-name">👤 ${firstName}</span>
                <button class="auth-btn auth-btn-logout" id="auth-logout-btn">Sair</button>
            </div>
        `;
        document.getElementById('auth-logout-btn')?.addEventListener('click', logout);
    }

    // ─── Profile helpers ───────────────────────────────────────────────────

    async function fetchAndSaveProfile(userId) {
        const sb = getSupabase();
        if (!sb || !userId) return null;
        try {
            const { data, error } = await sb
                .from('clientes_cadastrados')
                .select('*')
                .eq('auth_user_id', userId)
                .maybeSingle();

            if (error || !data) return null;

            const profile = {
                name: data.nome_comprador,
                email: data.email_comprador,
                document: data.cpf_cnpj_comprador,
                whatsapp: data.celular_comprador,
                phone: data.telefone_comprador,
                address: data.endereco_comprador,
                neighborhood: data.bairro_comprador,
                number: data.numero_comprador,
                complement: data.complemento_comprador,
                zipcode: data.cep_comprador,
                city: data.cidade_comprador,
                state: data.uf_comprador,
                clientId: data.id_cliente,
                authUserId: data.auth_user_id,
                updatedAt: data.atualizado_em
            };
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            console.log('✅ Auth Widget: perfil carregado', profile.name);
            return profile;
        } catch (e) {
            console.warn('Auth Widget: falha ao buscar perfil', e);
            return null;
        }
    }

    function autoFillPhone(profile) {
        if (!profile) return;
        const phone = profile.whatsapp || profile.phone;
        if (!phone) return;

        // Try immediately, and again after a short delay (for dynamic renders)
        const fill = () => {
            const input = document.getElementById('phone-input');
            if (input && !input.value) {
                input.value = formatPhone(phone);
                console.log('📱 Auth Widget: telefone preenchido automaticamente');
            }
        };
        fill();
        setTimeout(fill, 800);
        setTimeout(fill, 2000);
    }

    // ─── Logout ────────────────────────────────────────────────────────────

    async function logout() {
        const sb = getSupabase();
        if (sb) await sb.auth.signOut();
        localStorage.removeItem(PROFILE_KEY);

        // Clear phone inputs
        const phoneInput = document.getElementById('phone-input');
        if (phoneInput) phoneInput.value = '';

        // Re-render widget
        const container = document.getElementById(WIDGET_ID);
        if (container) renderGuest(container);
    }

    // ─── Init ──────────────────────────────────────────────────────────────

    async function init() {
        injectStyles();

        // Ensure container exists in header
        let container = document.getElementById(WIDGET_ID);
        if (!container) {
            const header = document.querySelector('header, .premium-header, #header');
            if (!header) return;
            container = document.createElement('div');
            container.id = WIDGET_ID;
            header.appendChild(container);
        }

        const sb = getSupabase();
        if (!sb) {
            renderGuest(container);
            return;
        }

        try {
            const { data: { session } } = await sb.auth.getSession();

            if (session?.user) {
                const userId = session.user.id;

                // Try localStorage first for speed, then fetch from DB
                let profile = null;
                const cached = localStorage.getItem(PROFILE_KEY);
                if (cached) {
                    try { profile = JSON.parse(cached); } catch (_) { }
                }

                // Refresh from DB if no cached profile or cache is old
                if (!profile || !profile.authUserId) {
                    profile = await fetchAndSaveProfile(userId);
                }

                const displayName = profile?.name || session.user.user_metadata?.full_name || session.user.email;
                renderLoggedIn(container, displayName);
                autoFillPhone(profile);

            } else {
                renderGuest(container);

                // Still try to auto-fill from localStorage if previous session stored profile
                const cached = localStorage.getItem(PROFILE_KEY);
                if (cached) {
                    try { autoFillPhone(JSON.parse(cached)); } catch (_) { }
                }
            }
        } catch (e) {
            console.warn('Auth Widget: session check failed', e);
            renderGuest(container);
        }
    }

    // ─── Listen to auth state changes ─────────────────────────────────────

    function listenAuthChanges() {
        const sb = getSupabase();
        if (!sb) return;
        sb.auth.onAuthStateChange(async (event, session) => {
            const container = document.getElementById(WIDGET_ID);
            if (!container) return;

            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchAndSaveProfile(session.user.id);
                const displayName = profile?.name || session.user.user_metadata?.full_name || session.user.email;
                renderLoggedIn(container, displayName);
                autoFillPhone(profile);
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(PROFILE_KEY);
                renderGuest(container);
            }
        });
    }

    return { init, logout, autoFillPhone, fetchAndSaveProfile };
})();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AuthWidget.init();
        // Re-run after a delay to catch dynamically-rendered phone inputs
        setTimeout(() => {
            const cached = localStorage.getItem('hnt_customer_profile');
            if (cached) {
                try { AuthWidget.autoFillPhone(JSON.parse(cached)); } catch (_) { }
            }
        }, 1200);
    });
} else {
    AuthWidget.init();
    setTimeout(() => {
        const cached = localStorage.getItem('hnt_customer_profile');
        if (cached) {
            try { AuthWidget.autoFillPhone(JSON.parse(cached)); } catch (_) { }
        }
    }, 1200);
}

window.AuthWidget = AuthWidget;

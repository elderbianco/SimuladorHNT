document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const showPasswordCheckbox = document.getElementById('show-password');
    const errorMsg = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loader = document.getElementById('loginLoader');

    // Mover pro painel se já tem sessao
    checkExistingSession();

    // Lógica para mostrar/esconder senha
    if (showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener('change', () => {
            passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
        });
    }

    async function checkExistingSession() {
        if (!window.authApi) return;
        try {
            const { session } = await window.authApi.getSession();
            if (session) {
                redirectAfterLogin();
            }
        } catch (e) {
            console.error('Session check failed:', e);
        }
    }

    function redirectAfterLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'HNT-OPS/app/index.html';
        window.location.href = redirectUrl;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let email = emailInput.value.trim();
        const password = passwordInput.value;

        // Alias para "e"
        if (email === 'e') {
            email = 'e@hanuthai.com.br';
        }

        if (!email || !password) return;

        // Resetar UI
        errorMsg.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
        loader.style.display = 'block';

        try {
            const { data, error } = await window.authApi.signIn(email, password);

            if (error) {
                console.error('Login error:', error.message);
                errorMsg.style.display = 'block';
                errorMsg.textContent = "Credenciais inválidas. Use o e-mail e senha configurados no Supabase.";
                loginBtn.disabled = false;
                loginBtn.innerText = "Entrar";
                loader.style.display = 'none';
            } else if (data.session) {
                // Success
                redirectAfterLogin();
            }
        } catch (err) {
            console.error('Auth crash:', err);
            errorMsg.style.display = 'block';
            errorMsg.textContent = "Erro crítico de autenticação. Tente novamente.";
            loginBtn.disabled = false;
            loginBtn.innerText = "Entrar";
            loader.style.display = 'none';
        }
    });

});


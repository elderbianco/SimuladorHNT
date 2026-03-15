document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loader = document.getElementById('loginLoader');

    // Mover pro painel se já tem sessao
    checkExistingSession();

    async function checkExistingSession() {
        const { session } = await window.authApi.getSession();
        if (session) {
            redirectAfterLogin();
        }
    }

    function redirectAfterLogin() {
        // Redirecionar para onde o usuário estava tentando ir, ou para o Admin de Pedidos por padrão
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'IndexAdministrarPedidoSimulador.html';
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
        loader.style.display = 'block';

        const { data, error } = await window.authApi.signIn(email, password);

        if (error) {
            console.error('Login error:', error.message);
            errorMsg.style.display = 'block';
            errorMsg.textContent = "Credenciais inválidas. Use o e-mail e senha configurados no Supabase.";
            loginBtn.disabled = false;
            loader.style.display = 'none';
        } else if (data.session) {
            // Success
            redirectAfterLogin();
        }
    });

});

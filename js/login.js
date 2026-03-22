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
        // Usar click e change para garantir captura em diferentes navegadores
        const toggle = () => {
            console.log('👁 Alternando visibilidade da senha:', showPasswordCheckbox.checked);
            passwordInput.type = showPasswordCheckbox.checked ? 'text' : 'password';
        };
        showPasswordCheckbox.addEventListener('change', toggle);
        showPasswordCheckbox.addEventListener('click', toggle);
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

    // Função de fallback para login de operador (tabela producao_operadores)
    async function tryOperatorLogin(usuario, senha) {
        console.log('🔍 Tentando login de operador para:', usuario);
        // Usamos a chave anon do Supabase para consultar a tabela
        const SUPABASE_URL = 'https://sflllqfytzpwgnaksvkj.supabase.co';
        const ANON_KEY = 'sb_publishable_LaBMdoSK9HGEjLBbeKxXiA_vy2EnlxY';

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/producao_operadores?usuario=eq.${usuario}&senha=eq.${senha}&ativo=eq.true`, {
                headers: {
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${ANON_KEY}`
                }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                console.log('✅ Operador autenticado:', data[0].nome);
                // Criamos uma "pseudo-sessão" no localStorage para o HNT-OPS reconhecer
                localStorage.setItem('hnt_op_user', JSON.stringify(data[0]));
                return true;
            }
        } catch (e) {
            console.error('Operator login failed:', e);
        }
        return false;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = emailInput.value.trim();
        const password = passwordInput.value;

        if (!userInput || !password) return;

        // Resetar UI
        errorMsg.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
        loader.style.display = 'block';

        try {
            // 1. Tentar Login via Supabase Auth (E-mail)
            let isEmail = userInput.includes('@');
            let authResult = null;

            if (isEmail) {
                authResult = await window.authApi.signIn(userInput, password);
            }

            if (authResult && authResult.data && authResult.data.session) {
                redirectAfterLogin();
            } else {
                // 2. Fallback: Tentar login via tabela de operadores (Username exato)
                const isOp = await tryOperatorLogin(userInput, password);
                if (isOp) {
                    redirectAfterLogin();
                } else {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = "Credenciais inválidas. Verifique seu usuário/e-mail e senha.";
                    loginBtn.disabled = false;
                    loginBtn.innerText = "Entrar";
                    loader.style.display = 'none';
                }
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

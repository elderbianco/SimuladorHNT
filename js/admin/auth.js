/**
 * Módulo de Autenticação - Admin
 */

window.getStoredUsers = function () {
    try {
        const stored = localStorage.getItem('hnt_admin_users');
        if (!stored) return [{ user: 'Admin', pass: '12345' }];
        return JSON.parse(stored);
    } catch (e) {
        console.error("Erro crítico no armazenamento de usuários. Resetando...", e);
        const standard = [{ user: 'Admin', pass: '12345' }];
        localStorage.setItem('hnt_admin_users', JSON.stringify(standard));
        return standard;
    }
};

window.saveUsers = function (users) {
    localStorage.setItem('hnt_admin_users', JSON.stringify(users));
};

window.login = function () {
    console.log("Tentativa de login...");
    const uInput = document.getElementById('login-user');
    const pInput = document.getElementById('login-pass');

    if (!uInput || !pInput) return;

    const u = uInput.value.trim();
    const p = pInput.value.trim();

    // 1. Tenta carregar usuários do storage (com proteção contra erro)
    let users = [];
    try { users = window.getStoredUsers(); } catch (e) { users = []; }

    // 2. Validação: Storage OU Hardcoded Master Password
    const storageValid = users.find(x => x.user.toLowerCase() === u.toLowerCase() && x.pass === p);
    const masterValid = (u.toLowerCase() === 'admin' && p === '12345');

    if (storageValid || masterValid) {
        console.log("Login bem sucedido!");
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        localStorage.setItem('hnt_admin_logged_in', 'true');

        // Se entrou com master mas não existia no storage, corrige o storage
        if (masterValid && !storageValid) {
            users.push({ user: 'Admin', pass: '12345' });
            window.saveUsers(users);
        }

        if (window.initDashboard) window.initDashboard();
    } else {
        console.warn("Login falhou para:", u);
        const errDiv = document.getElementById('login-error');
        if (errDiv) {
            errDiv.style.display = 'block';
            errDiv.innerText = "Senha incorreta. A senha padrão é 12345";
        }
        alert("Acesso negado.\n\nUsuário Padrão: Admin\nSenha Padrão: 12345");
    }
};

window.logout = function () {
    localStorage.setItem('hnt_admin_logged_in', 'false'); // Force logout state
    location.reload();
};

window.renderUserTable = function () {
    const users = window.getStoredUsers();
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const userData = users[i] || { user: '', pass: '' };
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${userData.user}" onchange="updateUser(${i}, 'user', this.value)" placeholder="Novo usuário"></td>
            <td><input type="text" value="${userData.pass}" onchange="updateUser(${i}, 'pass', this.value)" placeholder="Senha"></td>
        `;
        tbody.appendChild(tr);
    }
};

window.updateUser = function (index, field, value) {
    const users = window.getStoredUsers();
    if (!users[index]) users[index] = { user: '', pass: '' };
    users[index][field] = value;

    const cleanUsers = users.filter(u => u.user || u.pass);
    if (cleanUsers.length === 0) {
        cleanUsers.push({ user: 'Admin', pass: '12345' });
    }

    window.saveUsers(users);
};

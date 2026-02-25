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

    // Sync to server
    fetch('/api/admin/config/hnt_admin_users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
    }).catch(e => console.error('❌ Failed to sync admin users:', e));
};

window.logout = function () {
    window.authApi.signOut().then(() => {
        location.reload();
    });
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

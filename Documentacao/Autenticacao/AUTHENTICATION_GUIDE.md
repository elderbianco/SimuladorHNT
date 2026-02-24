# 🔒 Guia de Autenticação - SimulatorHNT

## Visão Geral

A partir de agora, os endpoints críticos da API estão protegidos com autenticação JWT (JSON Web Token). Isso impede que pessoas não autorizadas modifiquem ou deletem dados importantes.

---

## 🔑 Endpoints Protegidos

Os seguintes endpoints agora **requerem autenticação**:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/save-db` | POST | Salvar banco de dados |
| `/api/delete-pdf/:id` | DELETE | Deletar pedido |
| `/api/backups/restore` | POST | Restaurar backup |
| `/api/next-order-id` | GET | Obter próximo ID de pedido |

---

## 📝 Como Usar

### Passo 1: Fazer Login

Primeiro, você precisa fazer login para obter um token de autenticação:

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'admin',
        password: 'hanuthai2024'  // Senha configurada no .env
    })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "expiresIn": "24h",
//   "message": "Login realizado com sucesso"
// }

const token = data.token;
```

### Passo 2: Usar o Token nas Requisições

Agora use o token obtido no header `Authorization` das requisições protegidas:

```javascript
const response = await fetch('http://localhost:3000/api/save-db', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // ✅ Token aqui
    },
    body: JSON.stringify(dadosDoBanco)
});
```

---

## 🛠️ Configuração

### Credenciais Padrão

As credenciais estão configuradas no arquivo `.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hanuthai2024
JWT_SECRET=sua_chave_secreta_super_segura_mude_isso_em_producao_12345
```

### ⚠️ IMPORTANTE: Alterar em Produção

**Antes de colocar em produção, você DEVE:**

1. Alterar a senha em `.env`
2. Alterar o `JWT_SECRET` para uma chave aleatória e segura
3. Nunca compartilhar o arquivo `.env` (ele está no `.gitignore`)

---

## 🔍 Testando com cURL

### Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"hanuthai2024"}'
```

### Usar Endpoint Protegido

```bash
# Substitua SEU_TOKEN_AQUI pelo token recebido no login
curl -X POST http://localhost:3000/api/save-db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '[]'
```

---

## ❌ Erros Comuns

### 401 - Acesso Negado

```json
{
  "error": "Acesso negado. Token não fornecido.",
  "message": "Por favor, faça login para acessar este recurso."
}
```

**Solução:** Você esqueceu de enviar o token. Faça login e inclua o header `Authorization`.

### 403 - Token Inválido

```json
{
  "error": "Token inválido ou expirado.",
  "message": "Por favor, faça login novamente."
}
```

**Solução:** Seu token expirou (24 horas) ou está incorreto. Faça login novamente.

### 401 - Credenciais Inválidas

```json
{
  "error": "Credenciais inválidas",
  "message": "Usuário ou senha incorretos"
}
```

**Solução:** Verifique o usuário e senha no arquivo `.env`.

---

## 🔄 Atualizar Frontend

Se você tem um frontend que usa esses endpoints, precisa atualizá-lo para:

1. Adicionar tela de login
2. Armazenar o token (localStorage ou sessionStorage)
3. Incluir o token em todas as requisições protegidas

### Exemplo de Implementação

```javascript
// Login e armazenar token
async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('authToken', data.token);
        return true;
    }
    return false;
}

// Função helper para requisições autenticadas
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Não autenticado. Faça login primeiro.');
    }
    
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(url, options);
    
    // Se token expirou, redirecionar para login
    if (response.status === 403) {
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    }
    
    return response;
}

// Uso
await authenticatedFetch('/api/save-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
});
```

---

## 📋 Checklist de Segurança

- [x] Autenticação JWT implementada
- [x] Endpoints críticos protegidos
- [x] Credenciais em variáveis de ambiente
- [x] `.env` no `.gitignore`
- [ ] Senha forte configurada em produção
- [ ] JWT_SECRET aleatório em produção
- [ ] Frontend atualizado com login
- [ ] Testes de segurança realizados

---

## 🆘 Suporte

Se tiver problemas:

1. Verifique se o arquivo `.env` existe e está configurado
2. Verifique se as dependências estão instaladas (`npm install`)
3. Verifique os logs do servidor no console
4. Teste o endpoint de login primeiro

---

**Documentação criada em:** 2026-02-16  
**Versão da API:** 1.0.0

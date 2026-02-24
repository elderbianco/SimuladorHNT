# 🔧 Resolução de Problemas - Autenticação JWT

## Problemas Comuns e Soluções

---

## ❌ Erro: "Unexpected token '<'"

### Sintomas

- Ao tentar fazer login, aparece erro no console do navegador
- Mensagem: `SyntaxError: Unexpected token '<'`
- Status HTTP: 404

### Causa

O servidor está retornando HTML em vez de JSON, geralmente porque:

1. O endpoint `/api/auth/login` não foi encontrado
2. O middleware `express.static()` está interceptando a requisição

### Solução

Verifique a ordem dos middlewares em `server.js`:

**❌ ERRADO:**

```javascript
app.use(express.static(path.join(__dirname))); // ANTES das rotas
app.post('/api/auth/login', ...); // Nunca será executado
```

**✅ CORRETO:**

```javascript
app.post('/api/auth/login', ...); // Rotas PRIMEIRO
// ... todas as outras rotas
app.use(express.static(path.join(__dirname))); // Static files POR ÚLTIMO
```

**Passos:**

1. Abra `server.js`
2. Mova `app.use(express.static(...))` para DEPOIS de todas as rotas da API
3. Reinicie o servidor
4. Teste novamente

---

## ❌ Erro: "Acesso negado. Token não fornecido"

### Sintomas

- Status HTTP: 401
- Mensagem: "Acesso negado. Token não fornecido."

### Causa

Você está tentando acessar um endpoint protegido sem enviar o token JWT.

### Solução

Inclua o token no header `Authorization`:

```javascript
fetch('/api/save-db', {
    headers: {
        'Authorization': `Bearer ${token}` // ✅ Adicione isto
    }
})
```

---

## ❌ Erro: "Token inválido ou expirado"

### Sintomas

- Status HTTP: 403
- Mensagem: "Token inválido ou expirado."

### Causa

1. O token expirou (24 horas)
2. O token está corrompido
3. O `JWT_SECRET` foi alterado no servidor

### Solução

**Faça login novamente:**

```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'admin',
        password: 'hanuthai2024'
    })
});

const { token } = await response.json();
localStorage.setItem('authToken', token);
```

---

## ❌ Erro: "Credenciais inválidas"

### Sintomas

- Status HTTP: 401
- Mensagem: "Usuário ou senha incorretos"

### Causa

As credenciais fornecidas não correspondem às configuradas no `.env`.

### Solução

1. Verifique o arquivo `.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hanuthai2024
```

1. Certifique-se de usar as mesmas credenciais no login

2. Se alterou o `.env`, reinicie o servidor

---

## ❌ Servidor não inicia

### Sintomas

- Erro ao executar `node server.js`
- Mensagem: "Cannot find module..."

### Causa

Dependências não instaladas.

### Solução

```bash
npm install jsonwebtoken dotenv
```

---

## ❌ Variáveis de ambiente não carregam

### Sintomas

- Login sempre falha
- Console mostra: "undefined" para credenciais

### Causa

Arquivo `.env` não existe ou está mal configurado.

### Solução

1. Verifique se o arquivo `.env` existe na raiz do projeto

2. Conteúdo mínimo do `.env`:

```env
JWT_SECRET=sua_chave_secreta_aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hanuthai2024
PORT=3000
```

1. Reinicie o servidor

---

## ❌ CORS Error

### Sintomas

- Erro no console: "CORS policy blocked"
- Requisições de outros domínios falham

### Causa

O servidor não está configurado para aceitar requisições de outros domínios.

### Solução

O CORS já está habilitado em `server.js`:

```javascript
app.use(cors());
```

Se ainda assim houver problemas, configure explicitamente:

```javascript
app.use(cors({
    origin: 'http://seu-dominio.com',
    credentials: true
}));
```

---

## ❌ Porta 3000 já em uso

### Sintomas

- Erro: "EADDRINUSE: address already in use :::3000"

### Causa

Outro processo está usando a porta 3000.

### Solução

**Windows:**

```powershell
# Encontrar processo
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# Ou matar todos os processos Node
Get-Process -Name node | Stop-Process -Force
```

**Ou altere a porta no `.env`:**

```env
PORT=3001
```

---

## 🔍 Debugging

### Verificar se o servidor está rodando

```bash
curl http://localhost:3000/api/auth/login
```

Deve retornar erro 401 (não 404).

### Verificar logs do servidor

Ao fazer login, deve aparecer no console:

```
✅ Login bem-sucedido: admin
```

Ou:

```
⚠️ Tentativa de login falhou: admin
```

### Testar endpoint protegido

```javascript
// Sem token - deve retornar 401
fetch('/api/save-db', { method: 'POST' })

// Com token - deve retornar 200
fetch('/api/save-db', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## 📞 Checklist de Diagnóstico

Antes de pedir ajuda, verifique:

- [ ] Servidor está rodando (`node server.js`)
- [ ] Arquivo `.env` existe e está configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Middleware na ordem correta (rotas antes de static)
- [ ] Credenciais corretas
- [ ] Token sendo enviado no header `Authorization`
- [ ] Porta 3000 não está em uso por outro processo

---

## 🆘 Ainda com Problemas?

1. Verifique os logs do servidor no terminal
2. Abra o DevTools do navegador (F12) e veja a aba Network
3. Consulte `AUTHENTICATION_GUIDE.md` para exemplos completos
4. Teste com a página `test-auth.html` para isolar o problema

---

**Última atualização:** 2026-02-16

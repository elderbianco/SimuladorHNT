# 📚 Documentação de Autenticação - SimulatorHNT

Esta pasta contém toda a documentação relacionada à implementação de autenticação JWT no SimulatorHNT.

## 📁 Arquivos Disponíveis

### 1. AUTHENTICATION_GUIDE.md

**Guia completo de uso da autenticação**

- Como fazer login
- Como usar tokens JWT
- Exemplos de código
- Tratamento de erros
- Integração com frontend

### 2. REFACTORING_PLAN.md

**Plano geral de refatoração do projeto**

- Análise de arquitetura
- Problemas identificados
- Plano de ação priorizado
- Próximas etapas

### 3. TROUBLESHOOTING.md

**Resolução de problemas comuns**

- Erro "Unexpected token '<'"
- Problemas de middleware
- Servidor não inicia
- Token inválido/expirado

## 🔑 Credenciais Padrão

```
Usuário: admin
Senha: hanuthai2024
```

> ⚠️ **IMPORTANTE:** Altere estas credenciais em produção editando o arquivo `.env`

## 🚀 Quick Start

### 1. Testar Autenticação

Abra no navegador:

```
http://localhost:3000/test-auth.html
```

### 2. Fazer Login via API

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
```

### 3. Usar Token em Requisições

```javascript
const response = await fetch('/api/save-db', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dados)
});
```

## 🔒 Endpoints Protegidos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/save-db` | POST | Salvar banco de dados |
| `/api/delete-pdf/:id` | DELETE | Deletar pedido |
| `/api/backups/restore` | POST | Restaurar backup |
| `/api/next-order-id` | GET | Obter próximo ID |

## 📖 Documentação Adicional

Para informações mais detalhadas, consulte:

- **AUTHENTICATION_GUIDE.md** - Guia completo de autenticação
- **REFACTORING_PLAN.md** - Plano de melhorias do projeto
- **TROUBLESHOOTING.md** - Solução de problemas

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se o servidor está rodando (`node server.js`)
2. Verifique se o arquivo `.env` existe e está configurado
3. Consulte o arquivo `TROUBLESHOOTING.md`
4. Verifique os logs do servidor no console

---

**Última atualização:** 2026-02-16  
**Versão:** 1.0.0

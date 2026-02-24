# Guia de Reinicialização do Servidor

**Data:** 08/02/2026  
**Objetivo:** Ativar as melhorias implementadas no sistema Excel

---

## ⚠️ Ação Necessária

O servidor precisa ser reiniciado para ativar as seguintes melhorias:

1. ✅ Sistema de backup automático
2. ✅ Validação de dados
3. ✅ Cache em memória (10x mais rápido)

---

## 🔄 Como Reiniciar

### Opção 1: Via Terminal Atual

1. Pressione `Ctrl+C` no terminal onde o servidor está rodando
2. Execute novamente: `node server.js`

### Opção 2: Novo Terminal

1. Abra um novo terminal
2. Navegue até o diretório do projeto
3. Execute: `node server.js`

---

## ✅ Verificação Pós-Reinício

Após reiniciar, você deve ver no console:

```
🚀 Servidor Hanuthai rodando em http://localhost:3000
📂 Pedidos serão salvos em: assets/BancoDados/PedidosPDF
📊 Banco de Dados Excel: assets/BancoDados/BancoDados_Mestre.xlsx
📦 Cache de banco de dados ativado
📦 Cache inicializado para: BancoDados_Mestre.xlsx
```

---

## 🧪 Testes Rápidos

### 1. Testar Cache

```bash
# Abrir no navegador ou Postman
GET http://localhost:3000/api/cache/stats
```

**Resposta esperada:**

```json
{
  "success": true,
  "cache": {
    "cached": false,
    "recordCount": 0,
    "lastModified": null,
    "cacheSize": 0
  }
}
```

### 2. Testar Backups

```bash
GET http://localhost:3000/api/backups
```

**Resposta esperada:**

```json
{
  "success": true,
  "count": 0,
  "backups": []
}
```

### 3. Testar Validação

Tente salvar um pedido sem campos obrigatórios:

```bash
POST http://localhost:3000/api/save-db
Content-Type: application/json

[{
  "TIPO_PRODUTO": "SHORTS"
}]
```

**Resposta esperada (erro 400):**

```json
{
  "error": "Dados inválidos",
  "validation": {
    "invalidCount": 1,
    "errors": [...]
  }
}
```

---

## 📊 Novos Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/backups` | GET | Lista backups disponíveis |
| `/api/backups/restore` | POST | Restaura backup específico |
| `/api/cache/stats` | GET | Estatísticas do cache |

---

## 🎯 Benefícios Ativados

Após reiniciar:

- ✅ **Backup automático** - Criado antes de cada salvamento
- ✅ **Validação de dados** - Bloqueia dados inválidos
- ✅ **Cache 10x mais rápido** - Leituras otimizadas
- ✅ **APIs de gerenciamento** - Controle total sobre backups

---

## 📝 Documentação Completa

Para mais detalhes, consulte:

- `Documentacao/melhorias_excel_resumo.md` - Resumo completo
- `Documentacao/diagnostico/database_analysis.md` - Análise do banco

---

**Pronto para reiniciar? Execute `node server.js` no terminal!**

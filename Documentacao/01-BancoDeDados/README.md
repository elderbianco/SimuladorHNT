# 📊 BANCO DE DADOS - Documentação

Sistema híbrido de gerenciamento de dados (JSON + Excel + Supabase)

---

## 📚 DOCUMENTOS DISPONÍVEIS

### 1. **DATABASE_README.md**

📘 Guia completo do sistema de banco de dados

- Estrutura de arquivos JSON
- Como usar o database-manager.js
- Exemplos de código
- Preparação para Supabase
- Comandos e utilitários

### 2. **IMPLEMENTACAO_COMPLETA.md**

📗 Resumo da implementação

- O que foi criado
- Como funciona o sistema
- Próximos passos
- Testes e validação

---

## 🎯 TÓPICOS PRINCIPAIS

### Estrutura de Dados

- JSON normalizado e relacional
- Schemas de pedidos, clientes e configurações
- Integridade referencial

### Scripts de Gerenciamento

- `database-manager.js` - CRUD completo
- `excel-generator.js` - Geração automática de Excel
- `migrate-data.js` - Migração de dados legados

### Preparação para Cloud

- Schema SQL para Supabase/PostgreSQL
- Estratégia de migração
- APIs e endpoints

---

## 🚀 INÍCIO RÁPIDO

```bash
# Gerar Excel
node excel-generator.js

# Ver estatísticas
node -e "const db = require('./database-manager'); console.log(db.getStats())"

# Migrar dados
node migrate-data.js
```

---

## 📖 LEIA TAMBÉM

- [Documentação de Simuladores](../02-Simuladores/) - Como os simuladores salvam dados
- [Documentação do Admin](../03-Admin/) - Configurações e preços
- [Estrutura do Projeto](../99-Geral/ESTRUTURA_PROJETO.md) - Visão geral

---

**Última atualização:** 2026-02-07

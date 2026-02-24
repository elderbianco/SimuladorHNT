# 🗄️ SISTEMA DE BANCO DE DADOS HÍBRIDO

Sistema de gerenciamento de dados com estrutura JSON + Excel, preparado para migração futura para Supabase.

## 📁 ESTRUTURA DE ARQUIVOS

```
SimulatorHNT/
├── database/
│   ├── config/              # Configurações (Admin)
│   │   ├── pricing.json     # Tabela de preços
│   │   └── colors.json      # Cores disponíveis
│   ├── orders/              # Pedidos
│   │   └── pedidos.json     # Todos os pedidos
│   ├── clients/             # Clientes
│   │   └── clientes.json    # Cadastro de clientes
│   └── backup/              # Backups automáticos
│
├── database-manager.js      # Gerenciador de dados
├── excel-generator.js       # Gerador de Excel
├── migrate-data.js          # Script de migração
└── assets/BancoDados/
    └── BancoDados_Mestre.xlsx  # Excel gerado automaticamente
```

## 🚀 COMO USAR

### 1. GERAR EXCEL A PARTIR DO JSON

```bash
node excel-generator.js
```

Isso vai:
- Ler todos os dados dos arquivos JSON
- Gerar o arquivo `BancoDados_Mestre.xlsx`
- Criar abas: CONFIG, PRICING, COLORS, CLIENTES, CENTRAL_PEDIDOS, SHORTS, TOP, etc.

### 2. MIGRAR DADOS EXISTENTES

**Passo 1:** Criar backup do localStorage

```bash
node migrate-data.js --backup
```

Siga as instruções para baixar o backup do navegador.

**Passo 2:** Executar migração

```bash
node migrate-data.js
```

### 3. USAR O DATABASE MANAGER

```javascript
const db = require('./database-manager');

// Adicionar pedido
const pedido = db.addOrder({
    tipo_produto: 'shorts',
    cliente_id: 'CLI-123',
    item: {
        quantidade_total: 10,
        tamanhos: { M: 5, G: 5 }
    },
    financeiro: {
        preco_total: 1499.00
    }
});

// Buscar pedidos
const pedidos = db.findOrders({
    tipo_produto: 'shorts',
    status: 'pendente'
});

// Adicionar/Atualizar cliente
const cliente = db.upsertClient({
    nome: 'João Silva',
    telefone: '(11) 99999-9999',
    email: 'joao@example.com'
});

// Estatísticas
const stats = db.getStats();
console.log(stats);
```

## 📊 ESTRUTURA DOS DADOS

### PEDIDO (JSON)

```json
{
  "id": "HNT-SH-123456",
  "tipo_produto": "shorts",
  "created_at": "2026-02-07T14:30:00Z",
  "status": "pendente",
  "cliente_id": "CLI-001",
  "cliente": {
    "nome": "João Silva",
    "telefone": "(11) 99999-9999"
  },
  "item": {
    "quantidade_total": 10,
    "tamanhos": {"M": 5, "G": 5},
    "cores": {"corpo": "preto"},
    "logos": [...],
    "textos": [...]
  },
  "financeiro": {
    "preco_total": 1499.00,
    "breakdown": {...}
  },
  "dados_tecnicos_json": "{...}"
}
```

### CLIENTE (JSON)

```json
{
  "id": "CLI-001",
  "nome": "João Silva",
  "telefone": "(11) 99999-9999",
  "email": "joao@example.com",
  "total_pedidos": 5,
  "total_gasto": 7495.00,
  "created_at": "2026-01-15T10:00:00Z"
}
```

## 🔄 WORKFLOW RECOMENDADO

1. **Simuladores salvam** → JSON (`database/orders/pedidos.json`)
2. **Admin salva** → JSON (`database/config/*.json`)
3. **Você visualiza** → Excel (gerado automaticamente)
4. **Análises** → Excel ou scripts Node.js

## 🎯 PREPARAÇÃO PARA SUPABASE

A estrutura JSON está preparada para migração direta para Supabase:

### Tabelas SQL (Futuro)

```sql
-- Tabela de Pedidos
CREATE TABLE pedidos (
    id TEXT PRIMARY KEY,
    tipo_produto TEXT,
    created_at TIMESTAMP,
    status TEXT,
    cliente_id TEXT REFERENCES clientes(id),
    item JSONB,
    financeiro JSONB,
    dados_tecnicos_json TEXT
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id TEXT PRIMARY KEY,
    nome TEXT,
    telefone TEXT UNIQUE,
    email TEXT,
    total_pedidos INTEGER,
    total_gasto DECIMAL,
    created_at TIMESTAMP
);

-- Tabela de Configuração
CREATE TABLE config_pricing (
    tipo_produto TEXT,
    chave TEXT,
    valor DECIMAL,
    PRIMARY KEY (tipo_produto, chave)
);
```

## 📈 VANTAGENS

✅ **Normalizado** - Sem duplicação de dados
✅ **Escalável** - Suporta milhões de registros
✅ **Flexível** - Fácil adicionar novos campos
✅ **Visual** - Excel gerado automaticamente
✅ **Relacional** - Preparado para SQL
✅ **Backup** - Backups automáticos
✅ **Performance** - Rápido para buscar/filtrar

## 🛠️ MANUTENÇÃO

### Backup Manual

```bash
# Copiar pasta database
xcopy database database_backup_$(date +%Y%m%d) /E /I
```

### Restaurar Backup

```bash
# Restaurar de backup
xcopy database_backup_20260207 database /E /I /Y
```

### Limpar Backups Antigos

```bash
# Manter apenas últimos 30 dias
node -e "require('./database-manager')._cleanOldBackups(30)"
```

## 📞 SUPORTE

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Confira a estrutura dos arquivos JSON
3. Execute `node excel-generator.js` para regenerar Excel
4. Em caso de erro, restaure do backup

---

**Versão:** 1.0.0  
**Data:** 2026-02-07  
**Status:** ✅ Pronto para produção

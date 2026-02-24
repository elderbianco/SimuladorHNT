# 🗂️ ESTRUTURA COMPLETA DO PROJETO

```
SimulatorHNT/
│
├── 📁 Documentacao/                    ← DOCUMENTAÇÃO AQUI!
│   ├── README.md                       (Índice principal)
│   ├── DATABASE_README.md              (Guia completo)
│   └── IMPLEMENTACAO_COMPLETA.md       (Resumo da implementação)
│
├── 📁 database/                        ← DADOS JSON
│   ├── 📁 config/                      (Configurações do Admin)
│   │   ├── pricing.json                (Tabela de preços)
│   │   └── colors.json                 (Cores disponíveis)
│   │
│   ├── 📁 orders/                      (Pedidos)
│   │   └── pedidos.json                (Todos os pedidos)
│   │
│   ├── 📁 clients/                     (Clientes)
│   │   └── clientes.json               (Cadastro de clientes)
│   │
│   └── 📁 backup/                      (Backups automáticos)
│
├── 📁 assets/BancoDados/               ← EXCEL GERADO
│   ├── BancoDados_Mestre.xlsx          (Excel original)
│   └── BancoDados_Novo.xlsx            (Excel gerado automaticamente)
│
├── 📄 database-manager.js              ← GERENCIADOR DE DADOS
├── 📄 excel-generator.js               ← GERADOR DE EXCEL
├── 📄 migrate-data.js                  ← MIGRAÇÃO DE DADOS
│
└── ... (outros arquivos do projeto)
```

---

## 📚 ONDE ESTÁ CADA COISA

### **Documentação** → `Documentacao/`

- README.md (índice)
- DATABASE_README.md (guia completo)
- IMPLEMENTACAO_COMPLETA.md (resumo)

### **Dados JSON** → `database/`

- config/ (Admin)
- orders/ (Pedidos)
- clients/ (Clientes)
- backup/ (Backups)

### **Excel** → `assets/BancoDados/`

- BancoDados_Novo.xlsx (gerado automaticamente)

### **Scripts** → Raiz do projeto

- database-manager.js
- excel-generator.js
- migrate-data.js

---

## 🎯 FLUXO DE TRABALHO

```
1. Simulador salva → database/orders/pedidos.json
2. Admin salva → database/config/*.json
3. Você executa → node excel-generator.js
4. Excel gerado → assets/BancoDados/BancoDados_Novo.xlsx
5. Você visualiza → No Excel!
```

---

**Tudo organizado e documentado!** ✅

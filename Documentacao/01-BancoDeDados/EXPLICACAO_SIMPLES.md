# 💾 BANCO DE DADOS - Explicação Simples

**Para quem não é programador**

---

## 🤔 O QUE É UM BANCO DE DADOS?

Imagine um **arquivo de escritório gigante** onde você guarda:

- 📋 Fichas de clientes
- 📝 Pedidos
- 💰 Preços
- 🎨 Configurações

Só que **digital** e **super organizado**!

---

## 📂 COMO ESTÁ ORGANIZADO?

### **Analogia: Arquivo de Escritório**

```
┌─────────────────────────────────────────┐
│  🗄️ ARQUIVO (database/)                 │
├─────────────────────────────────────────┤
│                                         │
│  📁 GAVETA 1: Configurações             │
│     (database/config/)                  │
│     ├── 💰 Tabela de Preços             │
│     └── 🎨 Cores Disponíveis            │
│                                         │
│  📁 GAVETA 2: Pedidos                   │
│     (database/orders/)                  │
│     └── 📋 Todos os Pedidos             │
│                                         │
│  📁 GAVETA 3: Clientes                  │
│     (database/clients/)                 │
│     └── 👤 Cadastro de Clientes         │
│                                         │
│  📁 GAVETA 4: Backup                    │
│     (database/backup/)                  │
│     └── 💾 Cópias de Segurança          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 COMO FUNCIONA NO DIA A DIA?

### **Passo a Passo:**

#### 1️⃣ **Cliente Faz um Pedido**

```
Cliente usa o simulador
    ↓
Escolhe cores, logos, tamanhos
    ↓
Clica em "Adicionar ao Carrinho"
    ↓
Sistema SALVA automaticamente
```

#### 2️⃣ **Onde é Salvo?**

```
Informações vão para:
database/orders/pedidos.json

É como uma FICHA DE PEDIDO digital
```

#### 3️⃣ **Como Você Visualiza?**

```
Clique duas vezes em:
gerar-excel.bat

Sistema cria Excel com TUDO organizado
```

#### 4️⃣ **Você Abre o Excel**

```
Abra:
assets/BancoDados/BancoDados_Novo.xlsx

Veja todos os pedidos em planilha!
```

---

## 📊 O QUE TEM NO EXCEL?

### **Abas (Planilhas):**

1. **CONFIG** - Configurações gerais
2. **PRICING** - Tabela de preços
3. **COLORS** - Cores disponíveis
4. **CLIENTES** - Cadastro de clientes
5. **CENTRAL_PEDIDOS** - TODOS os pedidos
6. **SHORTS** - Só pedidos de shorts
7. **TOP** - Só pedidos de tops
8. **LEGGING** - Só pedidos de leggings
9. **MOLETOM** - Só pedidos de moletons

---

## 🎯 TAREFAS COMUNS

### ✅ **Ver Todos os Pedidos**

1. Clique duas vezes: `gerar-excel.bat`
2. Aguarde (5-10 segundos)
3. Abra: `assets/BancoDados/BancoDados_Novo.xlsx`
4. Vá na aba **CENTRAL_PEDIDOS**

### ✅ **Ver Pedidos de um Produto Específico**

1. Abra o Excel (mesmo processo acima)
2. Vá na aba do produto (ex: **SHORTS**)
3. Pronto! Só pedidos daquele produto

### ✅ **Ver Quantos Pedidos Tenho**

1. Clique duas vezes: `ver-estatisticas.bat`
2. Veja o resumo na tela

### ✅ **Procurar um Cliente**

1. Abra o Excel
2. Vá na aba **CLIENTES**
3. Use Ctrl+F para buscar

---

## 💡 VANTAGENS DESTE SISTEMA

### **Antes (Sistema Antigo):**

❌ Dados espalhados  
❌ Difícil de organizar  
❌ Risco de perder informações  
❌ Difícil fazer relatórios  

### **Agora (Sistema Novo):**

✅ Tudo em um lugar  
✅ Organizado automaticamente  
✅ Backup automático  
✅ Excel sempre atualizado  
✅ Fácil fazer relatórios  
✅ Preparado para crescer  

---

## 🔒 SEGURANÇA

### **Backups Automáticos:**

Toda vez que um pedido é salvo:

1. Sistema cria **cópia de segurança**
2. Guarda em: `database/backup/`
3. Você pode restaurar se precisar

### **Como Ver os Backups:**

1. Abra a pasta: `database/backup/`
2. Veja arquivos com data e hora
3. Exemplo: `pedidos_2026-02-07T15-30-00.json`

---

## 🆘 E SE DER PROBLEMA?

### ❓ **"Perdi um pedido!"**

**Não se preocupe!**

1. Vá em: `database/backup/`
2. Procure o backup mais recente
3. Me chame para restaurar

### ❓ **"O Excel não atualiza!"**

**Solução:**

1. Feche o Excel
2. Clique em: `gerar-excel.bat`
3. Abra o Excel novamente

### ❓ **"Não entendi nada!"**

**Calma!**

1. Leia este guia novamente
2. Teste os arquivos `.bat` (clique duplo)
3. Me chame se precisar

---

## 📞 ARQUIVOS ÚTEIS

### **Clique Duplo Nestes Arquivos:**

- `gerar-excel.bat` → Atualiza o Excel
- `ver-estatisticas.bat` → Mostra resumo
- `iniciar-servidor.bat` → Liga o sistema

### **Pastas Importantes:**

- `database/` → Onde ficam os dados
- `assets/BancoDados/` → Onde fica o Excel
- `Documentacao/` → Manuais e guias

---

## ✅ RESUMO RÁPIDO

1. **Pedidos são salvos** automaticamente em `database/`
2. **Você visualiza** no Excel (gere com `gerar-excel.bat`)
3. **Backups** são feitos automaticamente
4. **Tudo organizado** por tipo de produto
5. **Fácil de usar** com os arquivos `.bat`

---

**Agora ficou mais fácil?** 😊

*Última atualização: 2026-02-07*

# 📚 GUIA PARA INICIANTES - Sistema Hanuthai

**Para quem não é programador e quer entender o sistema**

---

## 🤔 O QUE É ESTE SISTEMA?

Imagine que você tem uma **loja de roupas personalizadas**. Este sistema é como um **assistente digital** que:

1. 🎨 **Ajuda clientes a criar** roupas personalizadas (simuladores)
2. 💾 **Guarda todas as informações** dos pedidos (banco de dados)
3. 📊 **Organiza tudo em planilhas** que você pode ver no Excel
4. 📄 **Gera fichas técnicas** em PDF para produção

---

## 🏗️ COMO FUNCIONA? (Analogia Simples)

### **Pense no Sistema como uma LOJA FÍSICA:**

```
┌─────────────────────────────────────────┐
│  🏪 LOJA (Seu Site)                     │
├─────────────────────────────────────────┤
│                                         │
│  🎨 PROVADOR                            │
│  (Simuladores)                          │
│  → Cliente escolhe cores, logos, etc.   │
│                                         │
│  📝 BALCÃO DE PEDIDOS                   │
│  (Carrinho)                             │
│  → Cliente finaliza o pedido            │
│                                         │
│  💾 ARQUIVO DE PEDIDOS                  │
│  (Banco de Dados)                       │
│  → Sistema guarda tudo                  │
│                                         │
│  📊 CADERNO DE CONTROLE                 │
│  (Excel)                                │
│  → Você visualiza e organiza            │
│                                         │
│  📄 FICHA TÉCNICA                       │
│  (PDF)                                  │
│  → Vai para produção                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📂 ONDE ESTÃO AS COISAS?

### **Pense nas Pastas como GAVETAS:**

#### 📁 **Gaveta 1: database/** (Arquivo Digital)

Onde ficam guardados TODOS os pedidos e configurações

- Como um **arquivo de escritório**
- Organizado em **pastas temáticas**
- Sempre atualizado automaticamente

#### 📁 **Gaveta 2: assets/BancoDados/** (Planilhas)

Onde fica o **Excel** que você pode abrir e ver

- Como um **caderno de controle**
- Gerado automaticamente do arquivo digital
- Você pode ver, filtrar, fazer gráficos

#### 📁 **Gaveta 3: Documentacao/** (Manual)

Onde ficam as **instruções** de como usar tudo

- Como um **manual de instruções**
- Organizado por assunto
- Este arquivo que você está lendo!

---

## 🎯 O QUE VOCÊ PODE FAZER?

### ✅ **TAREFAS SIMPLES (Não precisa programar):**

1. **Ver Pedidos no Excel**
   - Abra: `assets/BancoDados/BancoDados_Novo.xlsx`
   - Veja todos os pedidos organizados
   - Filtre, ordene, faça gráficos

2. **Atualizar o Excel**
   - Clique duas vezes em: `gerar-excel.bat` (vou criar)
   - Pronto! Excel atualizado

3. **Ver Fichas Técnicas**
   - Abra: `assets/BancoDados/PedidosPDF/`
   - Cada pedido tem seu PDF

### ⚙️ **TAREFAS AVANÇADAS (Precisa de ajuda):**

1. **Mudar Preços**
   - Abra: `admin.html` no navegador
   - Altere os valores
   - Salve

2. **Configurar Cores**
   - Abra: `admin.html` no navegador
   - Escolha cores disponíveis
   - Salve

---

## 🆘 PROBLEMAS COMUNS

### ❓ "Não vejo meus pedidos no Excel"

**Solução:**

1. Clique duas vezes em `gerar-excel.bat`
2. Aguarde alguns segundos
3. Abra o Excel novamente

### ❓ "O simulador não está salvando"

**Solução:**

1. Verifique se o servidor está rodando
2. Olhe se tem um ícone de terminal aberto
3. Se não tiver, clique em `iniciar-servidor.bat`

### ❓ "Perdi um pedido"

**Solução:**

1. Não se preocupe! Tudo tem backup
2. Vá em: `database/backup/`
3. Procure o arquivo com a data
4. Me chame para ajudar a restaurar

---

## 📞 PRECISA DE AJUDA?

### **Para Tarefas do Dia a Dia:**

- Consulte este guia
- Veja os vídeos tutoriais (em breve)
- Use os arquivos `.bat` (clique duplo)

### **Para Problemas Técnicos:**

- Anote o que aconteceu
- Tire um print da tela
- Me chame!

---

## 🎓 GLOSSÁRIO (Palavras Difíceis)

- **JSON** = Formato de arquivo digital (como .txt ou .doc)
- **Excel** = Planilha que você já conhece
- **PDF** = Arquivo que não pode ser editado
- **Banco de Dados** = Arquivo organizado de informações
- **Simulador** = Ferramenta para criar roupas personalizadas
- **Admin** = Painel de controle/configurações
- **Backup** = Cópia de segurança

---

## ✅ CHECKLIST DIÁRIO

Use esta lista para verificar se está tudo OK:

- [ ] Servidor está rodando? (ícone de terminal aberto)
- [ ] Excel está atualizado? (clique em `gerar-excel.bat`)
- [ ] Pedidos novos foram salvos?
- [ ] PDFs foram gerados?
- [ ] Backup foi feito? (automático, só verificar pasta)

---

**Criado com ❤️ para facilitar sua vida!**

*Última atualização: 2026-02-07*

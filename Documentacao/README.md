# 📚 DOCUMENTAÇÃO DO SISTEMA HANUTHAI

Bem-vindo à documentação completa organizada por temas!

---

## 🌟 **NOVO USUÁRIO? COMECE AQUI!**

### 📖 **Guias para Iniciantes (Sem Conhecimento Técnico)**

Se você **não é programador** e quer apenas **usar o sistema**, comece por aqui:

1. 👶 **[GUIA PARA INICIANTES](./99-Geral/GUIA_INICIANTES.md)**
   - O que é o sistema (explicação simples)
   - Como funciona (com analogias)
   - Tarefas do dia a dia
   - Problemas comuns e soluções

2. 💾 **[BANCO DE DADOS - Explicação Simples](./01-BancoDeDados/EXPLICACAO_SIMPLES.md)**
   - O que é banco de dados (sem jargão)
   - Como ver seus pedidos no Excel
   - Como usar os arquivos `.bat` (clique duplo)
   - Backups e segurança

### ⚡ **Atalhos Rápidos (Clique Duplo):**

Na pasta principal do projeto, você encontra:

- `gerar-excel.bat` → Atualiza o Excel com pedidos
- `ver-estatisticas.bat` → Mostra resumo de pedidos
- `iniciar-servidor.bat` → Liga o sistema

---

## 👨‍💻 **PARA DESENVOLVEDORES**

Se você é **programador** ou quer entender **detalhes técnicos**:

---

## 📂 ESTRUTURA DA DOCUMENTAÇÃO

### 📁 **01-BancoDeDados/**

Tudo sobre o sistema de banco de dados híbrido (JSON + Excel + Supabase)

- Sistema de gerenciamento de dados
- Estrutura JSON normalizada
- Geração automática de Excel
- Preparação para Supabase
- Scripts de migração

👉 [Acessar Documentação de Banco de Dados](./01-BancoDeDados/)

---

### 📁 **02-Simuladores/**

Documentação dos simuladores de produtos

- Shorts Fight
- Shorts Legging
- Top
- Legging
- Moletom
- Arquitetura e módulos
- Personalização e configuração

👉 [Acessar Documentação de Simuladores](./02-Simuladores/)

---

### 📁 **03-Admin/**

Painel administrativo e configurações

- Gerenciamento de preços
- Configuração de cores
- Opções de produtos
- Sincronização com simuladores

👉 [Acessar Documentação do Admin](./03-Admin/)

---

### 📁 **04-Frontend/**

Interface do usuário e páginas

- Página de pedidos (IndexPedidoSimulador.html)
- Carrinho de compras
- Componentes visuais
- Estilos e temas

👉 [Acessar Documentação de Frontend](./04-Frontend/)

---

### 📁 **05-Integracao/**

Integrações e APIs

- Geração de PDF
- Exportação de dados
- APIs externas
- Webhooks e automações

👉 [Acessar Documentação de Integração](./05-Integracao/)

---

### 📁 **99-Geral/**

Informações gerais do projeto

- Estrutura completa do projeto
- Guias de início rápido
- Troubleshooting
- FAQ

👉 [Acessar Documentação Geral](./99-Geral/)

---

## 🚀 INÍCIO RÁPIDO

### Para Desenvolvedores

```bash
# Ver estrutura do projeto
cat Documentacao/99-Geral/ESTRUTURA_PROJETO.md

# Entender banco de dados
cat Documentacao/01-BancoDeDados/DATABASE_README.md
```

### Para Usuários

```bash
# Gerar Excel atualizado
node excel-generator.js

# Ver estatísticas
node -e "const db = require('./database-manager'); console.log(db.getStats())"
```

---

## 📖 COMO USAR ESTA DOCUMENTAÇÃO

1. **Navegue pelas pastas** de acordo com o tema que precisa
2. **Cada pasta** tem seu próprio README com índice
3. **Documentos específicos** estão organizados por assunto
4. **Use a busca** para encontrar tópicos específicos

---

## 🔄 ATUALIZAÇÕES

Esta documentação é atualizada conforme o sistema evolui.

**Última atualização:** 2026-02-07  
**Versão:** 1.0.0

---

## 📞 SUPORTE

Para adicionar nova documentação:

1. Identifique o tema (01-BancoDeDados, 02-Simuladores, etc.)
2. Crie o arquivo .md na pasta correspondente
3. Atualize o README da pasta
4. Referencie no README principal (este arquivo)

---

**Desenvolvido com ❤️ para Hanuthai**

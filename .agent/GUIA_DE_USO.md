# 📚 Guia Completo de Uso - Agentes, Workflows e Skills

> **Projeto:** Simulador HNT - Sistema de Personalização de Produtos Esportivos
>
> **Última atualização:** 14/02/2026

---

## 📖 Índice

1. [Como Usar Este Guia](#como-usar-este-guia)
2. [Localização dos Agentes](#localização-dos-agentes)
3. [Agentes Especializados](#agentes-especializados)
4. [Workflows Automatizados](#workflows-automatizados)
5. [Skills Especializadas](#skills-especializadas)
6. [Exemplos Práticos](#exemplos-práticos)

---

## 📂 Localização dos Agentes

Os agentes estão instalados de forma **Global** para facilitar o uso em qualquer projeto:

- **Pasta Global:** `C:\Users\Nitro v15\.antigravity\agents\`
- **Pasta Local:** `.agent/agents/` (Cópias de backup)

> [!TIP]
> Use a pasta global para manter seus agentes sincronizados entre todos os seus projetos Hanuthai.

---

## 🎯 Como Usar Este Guia

### Sintaxe para Chamar Recursos

**Agentes:**

```
"Use o agente [nome-do-agente] para [tarefa]"
"Preciso do [nome-do-agente] para ajudar com [problema]"
```

**Workflows:**

```
"Execute o workflow [nome] para [objetivo]"
"Rode o fluxo [nome]"
```

**Skills:**

```
"Aplique a skill [nome] para [tarefa]"
"Use a habilidade [nome]"
```

---

## 🤖 Agentes Especializados

### 1. **E-commerce Specialist** 🛒 [NOVO]

**Função:** Especialista em sistemas de e-commerce, otimização de vendas e conversão.

**Quando Usar:**

- Otimizar o funil de vendas e checkout do simulador.
- Implementar estratégias de upselling e cross-selling.
- Melhorar a experiência de compra do usuário.

**Exemplo de Uso:**

```markdown
"E-commerce Specialist, otimize o fluxo de checkout para reduzir o abandono de carrinho."
```

---

### 2. **Payment Integration Specialist** 💳 [NOVO]

**Função:** Especialista em gateways de pagamento (Mercado Pago, PIX, PagSeguro).

**Quando Usar:**

- Integrar novos métodos de pagamento.
- Configurar webhooks de confirmação de pedido.
- Resolver problemas em transações financeiras.

**Exemplo de Uso:**

```markdown
"Payment Integration Specialist, integre o pagamento via PIX do Mercado Pago."
```

---

### 3. **Analytics Engineer** 📊 [NOVO]

**Função:** Implementação de métricas, tracking de eventos e dashboards de dados.

**Quando Usar:**

- Configurar Google Analytics 4.
- Rastrear quais cores e tamanhos são mais selecionados.
- Medir a taxa de conversão do simulador.

**Exemplo de Uso:**

```markdown
"Analytics Engineer, configure o rastreamento de cliques no botão 'Adicionar ao Carrinho'."
```

---

### 4. **Backend Specialist** 🔧

**Função:** Desenvolvimento e otimização de código backend (Node.js, APIs, servidor)

**Quando Usar:**

- Criar ou modificar APIs REST
- Otimizar rotas do servidor
- Implementar middlewares
- Gerenciar banco de dados
- Criar endpoints para novos recursos

**Exemplo de Uso:**

```
"Use o Backend Specialist para criar uma API que retorne 
os pedidos filtrados por data e status"
```

**Situações no Projeto:**

- Adicionar novos endpoints em `server.js`
- Otimizar `excel-generator.js`
- Melhorar `database-manager.js`

---

### 2. **Frontend Specialist** 🎨

**Função:** Desenvolvimento de interfaces, UI/UX, JavaScript frontend

**Quando Usar:**

- Criar ou melhorar componentes visuais
- Implementar interações do usuário
- Otimizar renderização
- Melhorar responsividade
- Adicionar animações

**Exemplo de Uso:**

```
"Frontend Specialist, melhore a interface do painel de 
personalização com animações suaves e feedback visual"
```

**Situações no Projeto:**

- Melhorar `ui-render.js` dos simuladores
- Criar novos controles visuais
- Otimizar CSS e layout
- Implementar drag-and-drop

---

### 3. **Debugger** 🐛

**Função:** Identificar e corrigir bugs, análise de erros

**Quando Usar:**

- Código não funciona como esperado
- Erros no console
- Comportamento inconsistente
- Problemas de estado
- Bugs de renderização

**Exemplo de Uso:**

```
"Debugger, o preço não está atualizando quando mudo 
a cor. Encontre e corrija o problema"
```

**Situações no Projeto:**

- Erros em `pricing.js`
- Problemas de sincronização de estado
- Bugs de localStorage
- Erros de cálculo

---

### 4. **Database Architect** 💾

**Função:** Design e otimização de estruturas de dados

**Quando Usar:**

- Criar novos schemas
- Otimizar queries
- Migrar dados
- Reestruturar banco de dados
- Melhorar performance de dados

**Exemplo de Uso:**

```
"Database Architect, crie um schema otimizado para 
armazenar histórico de modificações de pedidos"
```

**Situações no Projeto:**

- Melhorar estrutura do Excel
- Otimizar localStorage
- Criar novos formatos de dados
- Migração de dados

---

### 5. **Performance Optimizer** ⚡

**Função:** Otimização de performance, velocidade, memória

**Quando Usar:**

- Aplicação lenta
- Alto uso de memória
- Renderização travando
- Carregamento demorado
- Otimizar algoritmos

**Exemplo de Uso:**

```
"Performance Optimizer, o simulador está lento ao 
adicionar muitas imagens. Otimize o código"
```

**Situações no Projeto:**

- Otimizar `visuals.js`
- Melhorar renderização de canvas
- Reduzir uso de memória
- Cache de imagens

---

### 6. **Test Engineer** 🧪

**Função:** Criação e execução de testes automatizados

**Quando Usar:**

- Criar testes unitários
- Testes de integração
- Validar funcionalidades
- Prevenir regressões
- Garantir qualidade

**Exemplo de Uso:**

```
"Test Engineer, crie testes para validar o cálculo 
de preços em todos os simuladores"
```

**Situações no Projeto:**

- Testar `pricing.js`
- Validar `logic.js`
- Testar integração com Excel
- Testes de UI

---

### 7. **DevOps Engineer** 🚀

**Função:** Deployment, CI/CD, automação de processos

**Quando Usar:**

- Configurar deployment
- Automatizar builds
- Criar scripts de deploy
- Configurar ambientes
- Monitoramento

**Exemplo de Uso:**

```
"DevOps Engineer, crie um script para fazer deploy 
automático do projeto para o servidor de produção"
```

**Situações no Projeto:**

- Automatizar deploy
- Criar scripts de backup
- Configurar servidor
- Monitorar aplicação

---

### 8. **Security Auditor** 🔒

**Função:** Auditoria de segurança, identificação de vulnerabilidades

**Quando Usar:**

- Revisar segurança do código
- Identificar vulnerabilidades
- Validar autenticação
- Proteger dados sensíveis
- Compliance

**Exemplo de Uso:**

```
"Security Auditor, revise o código de upload de 
imagens e identifique possíveis vulnerabilidades"
```

**Situações no Projeto:**

- Validar uploads
- Proteger dados de pedidos
- Revisar `server.js`
- Sanitizar inputs

---

### 9. **Documentation Writer** 📝

**Função:** Criar documentação técnica clara e completa

**Quando Usar:**

- Documentar APIs
- Criar guias de uso
- Documentar arquitetura
- Criar READMEs
- Comentários de código

**Exemplo de Uso:**

```
"Documentation Writer, crie documentação completa 
da API do servidor com exemplos de uso"
```

**Situações no Projeto:**

- Documentar APIs
- Criar guia de desenvolvimento
- Documentar estrutura de dados
- Comentar código complexo

---

### 10. **Code Archaeologist** 🔍

**Função:** Análise de código legado, entendimento de sistemas antigos

**Quando Usar:**

- Entender código antigo
- Encontrar dependências
- Mapear fluxos complexos
- Identificar código morto
- Refatoração segura

**Exemplo de Uso:**

```
"Code Archaeologist, analise o código do simulador 
antigo e identifique o que pode ser removido"
```

**Situações no Projeto:**

- Analisar backups
- Entender código legado
- Identificar código não usado
- Mapear dependências

---

### 11. **Project Planner** 📋

**Função:** Planejamento de projetos, roadmaps, estimativas

**Quando Usar:**

- Planejar novos recursos
- Criar roadmaps
- Estimar tempo
- Priorizar tarefas
- Organizar sprints

**Exemplo de Uso:**

```
"Project Planner, crie um roadmap para implementar 
sistema de pagamento integrado ao simulador"
```

**Situações no Projeto:**

- Planejar novos simuladores
- Roadmap de features
- Estimativas de tempo
- Priorização

---

### 12. **Orchestrator** 🎼

**Função:** Coordenação de tarefas complexas, múltiplos agentes

**Quando Usar:**

- Tarefas muito complexas
- Múltiplas etapas
- Coordenar vários agentes
- Projetos grandes
- Refatorações massivas

**Exemplo de Uso:**

```
"Orchestrator, coordene a migração completa do 
sistema de preços para uma nova arquitetura"
```

**Situações no Projeto:**

- Grandes refatorações
- Migração de sistemas
- Implementação de features complexas
- Reestruturação de código

---

### 13. **Explorer Agent** 🗺️

**Função:** Exploração e mapeamento de codebase

**Quando Usar:**

- Entender estrutura do projeto
- Mapear dependências
- Encontrar arquivos
- Visualizar arquitetura
- Onboarding

**Exemplo de Uso:**

```
"Explorer Agent, mapeie toda a estrutura do projeto 
e crie um diagrama da arquitetura"
```

**Situações no Projeto:**

- Entender estrutura
- Mapear módulos
- Documentar arquitetura
- Onboarding de novos devs

---

### 14. **SEO Specialist** 🔎

**Função:** Otimização para motores de busca

**Quando Usar:**

- Melhorar SEO
- Meta tags
- Performance web
- Acessibilidade
- Indexação

**Exemplo de Uso:**

```
"SEO Specialist, otimize a landing page do simulador 
para melhorar o ranking no Google"
```

**Situações no Projeto:**

- Otimizar `index.html`
- Melhorar meta tags
- Performance de carregamento
- Acessibilidade

---

### 15. **Mobile Developer** 📱

**Função:** Desenvolvimento mobile, responsividade

**Quando Usar:**

- Adaptar para mobile
- Progressive Web App
- Touch interactions
- Responsividade
- Mobile-first

**Exemplo de Uso:**

```
"Mobile Developer, adapte o simulador para funcionar 
perfeitamente em dispositivos móveis"
```

**Situações no Projeto:**

- Responsividade dos simuladores
- Touch gestures
- Mobile optimization
- PWA features

---

## 🔄 Workflows Automatizados

### 1. **debug** 🐛

**Função:** Processo sistemático de depuração

**Quando Usar:**

- Bug complexo
- Erro difícil de encontrar
- Problema intermitente
- Debugging estruturado

**Como Chamar:**

```
"Execute o workflow debug para resolver o problema 
de preço incorreto no Shorts Legging"
```

---

### 2. **test** 🧪

**Função:** Criação e execução de testes

**Quando Usar:**

- Criar suite de testes
- Validar funcionalidade
- Testes de regressão
- CI/CD

**Como Chamar:**

```
"Rode o workflow test para validar todas as 
funcionalidades de cálculo de preço"
```

---

### 3. **deploy** 🚀

**Função:** Processo de deployment

**Quando Usar:**

- Deploy para produção
- Deploy para staging
- Automatizar releases
- Configurar ambientes

**Como Chamar:**

```
"Execute o workflow deploy para publicar a nova 
versão do simulador"
```

---

### 4. **plan** 📋

**Função:** Planejamento estruturado

**Quando Usar:**

- Planejar novo recurso
- Criar roadmap
- Estimar esforço
- Organizar tarefas

**Como Chamar:**

```
"Use o workflow plan para planejar a implementação 
do sistema de cupons de desconto"
```

---

### 5. **orchestrate** 🎼

**Função:** Orquestração de tarefas complexas

**Quando Usar:**

- Projeto muito grande
- Múltiplas etapas
- Coordenação complexa
- Refatoração massiva

**Como Chamar:**

```
"Execute o workflow orchestrate para migrar todo 
o sistema para TypeScript"
```

---

### 6. **ui-ux-pro-max** 🎨

**Função:** Design UI/UX profissional

**Quando Usar:**

- Redesign completo
- Melhorar UX
- Design system
- Componentes visuais

**Como Chamar:**

```
"Rode o workflow ui-ux-pro-max para redesenhar 
completamente a interface do admin"
```

---

## 🎯 Skills Especializadas

### **systematic-debugging** 🔍

**Quando Usar:** Debugging metódico e estruturado

**Exemplo:**

```
"Aplique a skill systematic-debugging para encontrar 
por que o localStorage não está salvando"
```

---

### **clean-code** ✨

**Quando Usar:** Refatoração para código limpo

**Exemplo:**

```
"Use a skill clean-code para refatorar o pricing.js 
e torná-lo mais legível"
```

---

### **performance-profiling** ⚡

**Quando Usar:** Análise de performance

**Exemplo:**

```
"Aplique performance-profiling no visuals.js para 
identificar gargalos"
```

---

### **testing-patterns** 🧪

**Quando Usar:** Implementar testes seguindo padrões

**Exemplo:**

```
"Use testing-patterns para criar testes unitários 
para o módulo de pricing"
```

---

### **api-patterns** 🔌

**Quando Usar:** Criar APIs seguindo best practices

**Exemplo:**

```
"Aplique api-patterns ao criar a nova API de pedidos"
```

---

### **database-design** 💾

**Quando Usar:** Design de schemas e estruturas de dados

**Exemplo:**

```
"Use database-design para criar o schema do novo 
sistema de histórico"
```

---

### **frontend-design** 🎨

**Quando Usar:** Design de interfaces frontend

**Exemplo:**

```
"Aplique frontend-design para criar o novo painel 
de controle do admin"
```

---

### **nodejs-best-practices** 🟢

**Quando Usar:** Seguir melhores práticas Node.js

**Exemplo:**

```
"Use nodejs-best-practices para revisar e melhorar 
o código do server.js"
```

---

### **nextjs-react-expert** ⚛️

**Quando Usar:** Desenvolvimento com Next.js/React

**Exemplo:**

```
"Aplique nextjs-react-expert se decidirmos migrar 
o frontend para React"
```

---

### **seo-fundamentals** 🔎

**Quando Usar:** Otimização SEO

**Exemplo:**

```
"Use seo-fundamentals para otimizar todas as páginas 
do simulador"
```

---

## 💡 Exemplos Práticos por Situação

### Situação 1: Bug no Cálculo de Preço

```
"Debugger, o preço total está incorreto quando adiciono 
texto personalizado. Use systematic-debugging para 
encontrar e corrigir o problema"
```

### Situação 2: Criar Novo Simulador

```
"Frontend Specialist, crie um novo simulador para 
'Kimono de Jiu-Jitsu' seguindo o padrão dos simuladores 
existentes. Use frontend-design e clean-code"
```

### Situação 3: Otimizar Performance

```
"Performance Optimizer, o simulador está lento ao 
carregar muitas imagens. Aplique performance-profiling 
e otimize o código"
```

### Situação 4: Implementar Nova Feature

```
"Orchestrator, coordene a implementação de um sistema 
de cupons de desconto. Use o workflow plan primeiro, 
depois coordene Backend Specialist e Frontend Specialist"
```

### Situação 5: Melhorar Segurança

```
"Security Auditor, revise todo o código de upload e 
processamento de imagens. Use vulnerability-scanner 
para identificar problemas"
```

### Situação 6: Documentar Sistema

```
"Documentation Writer, crie documentação completa do 
sistema de preços, incluindo exemplos de uso e fluxogramas"
```

### Situação 7: Preparar Deploy

```
"DevOps Engineer, execute o workflow deploy para 
configurar deployment automático no servidor de produção"
```

### Situação 8: Refatorar Código Legado

```
"Code Archaeologist, analise o código do simulador antigo 
e identifique o que pode ser removido. Depois, use 
clean-code para refatorar o que for mantido"
```

---

## 🎓 Dicas de Uso

### ✅ Boas Práticas

1. **Seja específico:** Quanto mais detalhes, melhor o resultado
2. **Combine recursos:** Use agentes + skills para melhores resultados
3. **Use workflows:** Para tarefas complexas, workflows coordenam melhor
4. **Contexto é importante:** Explique o problema e o objetivo

### ❌ Evite

1. **Comandos vagos:** "Melhore o código" → "Use clean-code para refatorar pricing.js"
2. **Múltiplas tarefas:** Divida em etapas menores
3. **Sem contexto:** Sempre explique o que está tentando fazer

---

## 📞 Suporte

Para dúvidas ou sugestões sobre este guia, consulte a documentação em:

- `.agent/ARCHITECTURE.pt.md` - Arquitetura completa
- `.agent/agents/` - Detalhes de cada agente
- `.agent/skills/` - Documentação de skills

---

**Última atualização:** 14/02/2026
**Versão:** 1.0.0

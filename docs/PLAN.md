# Plano de Orquestração: Análise Completa do SimuladorHNT

**Objetivo:** Elaborar um relatório exaustivo pontuando aspectos positivos, negativos, sugestões de melhoria e avaliação de funcionamento dos links da aplicação.

## Fase 1: Planejamento (Atual)

- [x] O `project-planner` definiu este plano estrutural (PLAN.md).
- [ ] Aguardar aprovação do usuário para iniciar a Fase 2.

## Fase 2: Implementação (Análise Paralela Múltipla)

Assim que aprovado, ativaremos **3 agentes especialistas** em paralelo para avaliar o sistema em diferentes frentes:

### 1. Agente: `frontend-specialist` (Frontend & UI/UX)

- **Foco:** Analisar os arquivos `HTML` (ex: `index.html`, `IndexFaq.html`, `Index*.html`), a organização e padrão dos `CSS`, interações em `JS` e responsividade.
- **Teste de Links:** Mapear todos os links internos (`<a href="...">`) para garantir que nenhum leve a páginas inexistentes (Erro 404).

### 2. Agente: `security-auditor` (Segurança & Backend)

- **Foco:** Analisar o `server.js` e chamadas de API feitas pelo cliente (`fetch`). Verificar se há exposição de chaves no arquivo `.env` carregado no frontend ou vazamento de dados de configuração.

### 3. Agente: `performance-optimizer` (Performance & Estrutura)

- **Foco:** Avaliar a carga de arquivos pesados (pastas `Gif/`, `UploadImagem/`, `Fotoscarrocel/`) e a estratégia de carregamento dos assets. Avaliar a integridade geral do repositório pós-limpeza.

## Fase 3: Sintetização (Relatório Final)

O Orquestrador compilará as saídas dos 3 agentes no formato definitivo:

1. Pontos Positivos
2. Pontos Negativos (Gargalos, segurança, etc)
3. Avaliação de Links e Roteamento
4. Sugestões de Melhoria (Código e Produto)
5. Scripts de Validação/Lint (se aplicável ao ambiente)

---
*Este plano requer aprovação explícita para seguir adiante.*

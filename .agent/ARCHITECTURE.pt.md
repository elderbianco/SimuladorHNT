# Arquitetura do Antigravity Kit

> Kit Completo de Expansão de Capacidades para Agentes de IA

---

## 📋 Visão Geral

O Antigravity Kit é um sistema modular composto por:

- **20 Agentes Especialistas** - Personas de IA baseadas em funções
- **36 Habilidades (Skills)** - Módulos de conhecimento específico de domínio
- **11 Fluxos de Trabalho (Workflows)** - Procedimentos de comando de barra (slash commands)

---

## 🏗️ Estrutura de Diretórios

```plaintext
.agent/
├── ARCHITECTURE.md          # Este arquivo (Original em Inglês)
├── ARCHITECTURE.pt.md       # Este arquivo (Traduzido)
├── agents/                  # 20 Agentes Especialistas
├── skills/                  # 36 Habilidades
├── workflows/               # 11 Comandos de Barra
├── rules/                   # Regras Globais
└── scripts/                 # Scripts Mestres de Validação
```

---

## 🤖 Agentes (20)

Personas de IA especialistas para diferentes domínios.

| Agente                   | Foco                       | Habilidades Usadas                                       |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `orchestrator`           | Coordenação multi-agente   | parallel-agents, behavioral-modes                        |
| `project-planner`        | Descoberta, planejamento   | brainstorming, plan-writing, architecture                |
| `frontend-specialist`    | UI/UX Web                  | frontend-design, react-best-practices, tailwind-patterns |
| `backend-specialist`     | API, lógica de negócios    | api-patterns, nodejs-best-practices, database-design     |
| `database-architect`     | Esquema, SQL               | database-design, prisma-expert                           |
| `mobile-developer`       | iOS, Android, RN           | mobile-design                                            |
| `game-developer`         | Lógica de jogo, mecânicas  | game-development                                         |
| `devops-engineer`        | CI/CD, Docker              | deployment-procedures, docker-expert                     |
| `security-auditor`       | Compliance de segurança    | vulnerability-scanner, red-team-tactics                  |
| `penetration-tester`     | Segurança ofensiva         | red-team-tactics                                         |
| `test-engineer`          | Estratégias de teste       | testing-patterns, tdd-workflow, webapp-testing           |
| `debugger`               | Análise de causa raiz      | systematic-debugging                                     |
| `performance-optimizer`  | Velocidade, Web Vitals     | performance-profiling                                    |
| `seo-specialist`         | Ranking, visibilidade      | seo-fundamentals, geo-fundamentals                       |
| `documentation-writer`   | Manuais, docs              | documentation-templates                                  |
| `product-manager`        | Requisitos, user stories   | plan-writing, brainstorming                              |
| `product-owner`          | Estratégia, backlog, MVP   | plan-writing, brainstorming                              |
| `qa-automation-engineer` | Testes E2E, pipelines CI   | webapp-testing, testing-patterns                         |
| `code-archaeologist`     | Código legado, refatoração | clean-code, code-review-checklist                        |
| `explorer-agent`         | Análise da codebase        | -                                                        |

---

## 🧩 Habilidades (36)

Domínios de conhecimento modular que os agentes podem carregar sob demanda, com base no contexto da tarefa.

### Frontend & UI

| Habilidade              | Descrição                                                             |
| ----------------------- | --------------------------------------------------------------------- |
| `react-best-practices`  | Otimização de performance React & Next.js (Vercel - 57 regras)        |
| `web-design-guidelines` | Auditoria de UI Web - 100+ regras de acessibilidade, UX (Vercel)      |
| `tailwind-patterns`     | Utilitários Tailwind CSS v4                                           |
| `frontend-design`       | Padrões UI/UX, design systems                                         |
| `ui-ux-pro-max`         | 50 estilos, 21 paletas, 50 fontes                                     |

### Backend & API

| Habilidade              | Descrição                      |
| ----------------------- | ------------------------------ |
| `api-patterns`          | REST, GraphQL, tRPC            |
| `nestjs-expert`         | Módulos NestJS, DI, decorators |
| `nodejs-best-practices` | Node.js async, módulos         |
| `python-patterns`       | Padrões Python, FastAPI        |

### Banco de Dados

| Habilidade        | Descrição                   |
| ----------------- | --------------------------- |
| `database-design` | Design de esquema, otimização|
| `prisma-expert`   | Prisma ORM, migrações       |

### TypeScript/JavaScript

| Habilidade          | Descrição                           |
| ------------------- | ----------------------------------- |
| `typescript-expert` | Programação em nível de tipo, perf. |

### Nuvem & Infraestrutura

| Habilidade              | Descrição                 |
| ----------------------- | ------------------------- |
| `docker-expert`         | Containerização, Compose  |
| `deployment-procedures` | CI/CD, fluxos de deploy   |
| `server-management`     | Gerenciamento de infra    |

### Testes & Qualidade

| Habilidade              | Descrição                |
| ----------------------- | ------------------------ |
| `testing-patterns`      | Jest, Vitest, estratégias|
| `webapp-testing`        | E2E, Playwright          |
| `tdd-workflow`          | Test-driven development  |
| `code-review-checklist` | Padrões de revisão de código|
| `lint-and-validate`     | Linting, validação       |

### Segurança

| Habilidade              | Descrição                |
| ----------------------- | ------------------------ |
| `vulnerability-scanner` | Auditoria de segurança, OWASP|
| `red-team-tactics`      | Segurança ofensiva       |

### Arquitetura & Planejamento

| Habilidade      | Descrição                  |
| --------------- | -------------------------- |
| `app-builder`   | Estrutura de app full-stack|
| `architecture`  | Padrões de design de sistema|
| `plan-writing`  | Planejamento de tarefas, quebra|
| `brainstorming` | Questionamento socrático   |

### Mobile

| Habilidade      | Descrição             |
| --------------- | --------------------- |
| `mobile-design` | Padrões de UI/UX Mobile|

### Desenvolvimento de Jogos

| Habilidade         | Descrição             |
| ------------------ | --------------------- |
| `game-development` | Lógica de jogo, mecânicas|

### SEO & Crescimento

| Habilidade         | Descrição                     |
| ------------------ | ----------------------------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals` | Otimização GenAI              |

### Shell/CLI

| Habilidade           | Descrição                 |
| -------------------- | ------------------------- |
| `bash-linux`         | Comandos Linux, scripting |
| `powershell-windows` | Windows PowerShell        |

### Outros

| Habilidade                | Descrição                 |
| ------------------------- | ------------------------- |
| `clean-code`              | Padrões de código (Global)|
| `behavioral-modes`        | Personas de Agente        |
| `parallel-agents`         | Padrões multi-agente      |
| `mcp-builder`             | Protocolo de Contexto de Modelo|
| `documentation-templates` | Formatos de documentação  |
| `i18n-localization`       | Internacionalização       |
| `performance-profiling`   | Web Vitals, otimização    |
| `systematic-debugging`    | Resolução de problemas    |

---

## 🔄 Fluxos de Trabalho (11)

Procedimentos de comando de barra. Invoque com `/command`.

| Comando          | Descrição                |
| ---------------- | ------------------------ |
| `/brainstorm`    | Descoberta socrática     |
| `/create`        | Criar novas funcionalidades|
| `/debug`         | Depurar problemas        |
| `/deploy`        | Implantar aplicação      |
| `/enhance`       | Melhorar código existente|
| `/orchestrate`   | Coordenação multi-agente |
| `/plan`          | Quebra de tarefas        |
| `/preview`       | Pré-visualizar alterações|
| `/status`        | Verificar status do projeto|
| `/test`          | Rodar testes             |
| `/ui-ux-pro-max` | Design com 50 estilos    |

---

## 🎯 Protocolo de Carregamento de Habilidades

```plaintext
Solicitação do Usuário → Correspondência de Descrição de Habilidade → Carregar SKILL.md
                                            ↓
                                    Ler references/
                                            ↓
                                    Ler scripts/
```

### Estrutura de Habilidade

```plaintext
skill-name/
├── SKILL.md           # (Obrigatório) Metadados & instruções
├── scripts/           # (Opcional) Scripts Python/Bash
├── references/        # (Opcional) Templates, docs
├── assets/            # (Opcional) Imagens, logos
```

### Habilidades Aprimoradas (com scripts/references)

| Habilidade          | Arquivos | Cobertura                           |
| ------------------- | -------- | ----------------------------------- |
| `ui-ux-pro-max`     | 27       | 50 estilos, 21 paletas, 50 fontes   |
| `app-builder`       | 20       | Estrutura full-stack                |

---

## 📜 Scripts (2)

Scripts mestres de validação que orquestram scripts de nível de habilidade.

### Scripts Mestres

| Script          | Propósito                               | Quando Usar              |
| --------------- | --------------------------------------- | ------------------------ |
| `checklist.py`  | Validação baseada em prioridade (Core)  | Desenvolvimento, pré-commit|
| `verify_all.py` | Verificação abrangente (Tudo)           | Pré-implantação, releases|

### Uso

```bash
# Validação rápida durante desenvolvimento
python .agent/scripts/checklist.py .

# Verificação completa antes da implantação
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

### O Que Eles Verificam

**checklist.py** (Verificações principais):

- Segurança (vulnerabilidades, segredos)
- Qualidade de Código (lint, tipos)
- Validação de Esquema
- Suíte de Testes
- Auditoria de UX
- Verificação de SEO

**verify_all.py** (Suíte completa):

- Tudo em checklist.py MAIS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Análise de Bundle
- Auditoria Mobile
- Verificação i18n

Para detalhes, veja [scripts/README.md](scripts/README.md)

---

## 📊 Estatísticas

| Métrica             | Valor                         |
| ------------------- | ----------------------------- |
| **Total Agentes**   | 20                            |
| **Total Habilidades**| 36                            |
| **Total Fluxos**    | 11                            |
| **Total Scripts**   | 2 (mestre) + 18 (nível habilidade)|
| **Cobertura**       | ~90% desenvolvimento web/mobile|

---

## 🔗 Referência Rápida

| Necessidade | Agente                | Habilidades                           |
| ----------- | --------------------- | ------------------------------------- |
| Web App     | `frontend-specialist` | react-best-practices, frontend-design |
| API         | `backend-specialist`  | api-patterns, nodejs-best-practices   |
| Mobile      | `mobile-developer`    | mobile-design                         |
| Banco de Dados| `database-architect`| database-design, prisma-expert        |
| Segurança   | `security-auditor`    | vulnerability-scanner                 |
| Testes      | `test-engineer`       | testing-patterns, webapp-testing      |
| Depuração   | `debugger`            | systematic-debugging                  |
| Planejamento| `project-planner`     | brainstorming, plan-writing           |

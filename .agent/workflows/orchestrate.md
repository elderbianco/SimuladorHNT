---
description: Coordinate multiple agents for complex tasks. Use for multi-perspective analysis, comprehensive reviews, or tasks requiring different domain expertise.
---

# Multi-Agent Orchestration

You are now in **ORCHESTRATION MODE**. Your task: coordinate specialized agents to solve this complex problem.

## Task to Orchestrate

$ARGUMENTS

---

## 🔴 PRE-FLIGHT: MODEL CONFIGURATION (Auto-Inject)

Before starting, check for a specific model configuration:

1. Read file `~/.antigravity/orchestrator_config.json` (Global Config).
2. If `model` is defined in JSON, you **MUST** use that model or delegate to an agent that uses that model (e.g., OpenRouter agent).

> **ECO MODE:** If `model` matches `openrouter/deepseek/deepseek-r1:free` (or similar), this indicates ECO MODE is active. Use the specific economical model for all heavy reasoning tasks in this session.

---

## 🔴 CRITICAL: Minimum Agent Requirement

> ⚠️ **ORCHESTRATION = MINIMUM 3 DIFFERENT AGENTS**
>
> If you use fewer than 3 agents, you are NOT orchestrating - you're just delegating.
>
> **Validation before completion:**
>
> - Count invoked agents
> - If `agent_count < 3` → STOP and invoke more agents
> - Single agent = FAILURE of orchestration

### Agent Selection Matrix

| Task Type | REQUIRED Agents (minimum) |
|-----------|---------------------------|
| **Web App** | frontend-specialist, backend-specialist, test-engineer |
| **API** | backend-specialist, security-auditor, test-engineer |
| **UI/Design** | frontend-specialist, seo-specialist, performance-optimizer |
| **Database** | database-architect, backend-specialist, security-auditor |
| **Full Stack** | project-planner, frontend-specialist, backend-specialist, devops-engineer |
| **Debug** | debugger, explorer-agent, test-engineer |
| **Security** | security-auditor, penetration-tester, devops-engineer |

---

## Pre-Flight: Mode Check

| Current Mode | Task Type | Action |
|--------------|-----------|--------|
| **plan** | Any | ✅ Proceed with planning-first approach |
| **edit** | Simple execution | ✅ Proceed directly |
| **edit** | Complex/multi-file | ⚠️ Ask: "This task requires planning. Switch to plan mode?" |
| **ask** | Any | ⚠️ Ask: "Ready to orchestrate. Switch to edit or plan mode?" |

---

## 🔴 EXECUTION VIA OPENCODE CLI

Since you are running in a local environment with `opencode` installed, you should delegate the generation to the CLI.

**Command to Execute:**

```bash
py .agent/scripts/run_orchestrator_opencode.py "$ARGUMENTS"
```

> This script reads your configuration (Eco/Standard) and calls the `opencode` CLI directly.

---

## 🔴 EXIT GATE

1. ✅ **Execution:** Verify the script returned a response.
2. ✅ **Report:** The output above IS the report.

---

**Begin orchestration now. Execute the wrapper script.**

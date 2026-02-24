# Guia de Implantação: Sistema Orquestrador Econômico (Eco Mode)

Este documento descreve como replicar a estrutura de Orquestração resiliente e econômica em qualquer ambiente Antigravity.

## 📋 Pré-requisitos

1. **Python 3.x:** Necessário para rodar os scripts de configuração e execução.
2. **OpenCode CLI:** Instalado e configurado no PATH do sistema.
3. **OpenRouter API Key:** Configurada na CLI do OpenCode (`opencode config set openrouter_key "SUA_CHAVE"`).
4. **Antigravity:** Ambiente de agente ativo com suporte a workflows e scripts.

---

## 🏗️ Estrutura de Arquivos

Para o sistema funcionar, os seguintes arquivos devem ser copiados para o diretório `.agent` do seu projeto:

```text
.agent/
├── orchestrator_config.json (*)   <-- Criado automaticamente pelo script
├── scripts/
│   ├── manage_orchestrator_config.py  <-- Gerencia o modo (Eco/Standard)
│   └── run_orchestrator_opencode.py   <-- Wrapper que chama o OpenCode CLI
└── workflows/
    ├── orchestrate.md                 <-- Workflow principal (Orquestrador)
    ├── enable-eco.md                  <-- Comando (/enable-eco)
    ├── disable-eco.md                 <-- Comando (/disable-eco)
    └── set-model.md                   <-- Comando (/set-model "modelo")
```

---

## 🛠️ Detalhes da Lógica

### 1. Persistência Global

A configuração do modelo não fica apenas na pasta do projeto. O script utiliza o diretório home do usuário para manter a preferência ativa:

* **Linux/Mac:** `~/.antigravity/orchestrator_config.json`
* **Windows:** `C:\Users\Nome\.antigravity\orchestrator_config.json`

### 2. Integração Eco + Orchestrate

A interligação ocorre em duas etapas:

1. **Workflow `orchestrate.md`:** Em vez de delegar diretamente a agentes internos, ele invoca o script de execução.
2. **Script `run_orchestrator_opencode.py`:**
    * Lê a configuração global.
    * Se estiver em modo "Eco", prioriza modelos gratuitos (Tier S: DeepSeek R1).
    * **Fallback Inteligente:** Se o modelo DeepSeek falhar, ele tenta automaticamente o Llama 3.3, depois o Qwen 2.5, e por fim o Gemini Flash Lite, garantindo que a tarefa nunca pare por indisponibilidade de um servidor gratuito.

---

## 🚀 Passo a Passo para Implantação

### Passo 1: Criar Scripts Python

Crie os arquivos em `.agent/scripts/` conforme os códigos fornecidos na sessão anterior. Garanta que o caminho da configuração aponte para `os.path.expanduser('~')`.

### Passo 2: Criar Workflows de Comando

Crie os arquivos `.md` na pasta `.agent/workflows/`. O arquivo `orchestrate.md` deve conter a instrução explícita de chamar o script via CLI:

```bash
python .agent/scripts/run_orchestrator_opencode.py "$ARGUMENTS"
```

### Passo 3: Ativação

No terminal do Antigravity, execute:

1. `/enable-eco` (Para definir o modo econômico inicial).
2. `/orchestrate "Sua tarefa aqui"` (O sistema usará o OpenCode para processar).

---

## 💡 Dicas de Manutenção

* **Atualizar Tiers:** Se novos modelos gratuitos surgirem no OpenRouter, basta editá-los na lista `MODEL_TIERS` dentro de `run_orchestrator_opencode.py`.
* **Verificar Status:** Use `opencode models` para garantir que o modelo desejado está disponível na lista da CLI.

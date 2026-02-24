---
description: Define um modelo customizado para o orquestrador. Uso: /set-model "modelo"
---

# Definir Modelo Customizado

Este comando permite especificar qual modelo de IA o Orquestrador deve utilizar.

## Argumentos

- $1: Nome do modelo (ex: "openrouter/google/gemini-2.0-flash-lite-preview-02-05:free")

## Passos

1. Executar script de configuração com o argumento fornecido
// turbo
2. Executar: `python .agent/scripts/manage_orchestrator_config.py --action set --model "$1"`

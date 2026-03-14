# HNT-OPS: Pontos de Observação e Métricas (Experimental)

Este documento detalha os pontos críticos que o motor de testes (`sim_tester.py`) valida para garantir que o Simulador HNT suporte a carga de produção real.

## 📊 Métricas de Stress

| Métrica | Objetivo | Ponto de Observação |
|---------|----------|-------------------|
| **Volume de pedidos** | 100+ | Velocidade de renderização da Matrix de Prazos (Tabela). |
| **Urgência (🔴)** | 10-15% | Destaque visual e priorização automática no topo da lista. |
| **Distribuição de Etapas** | Homogênea | Identificação de gargalos (ex: Acúmulo em `Bordado`). |

## ⚠️ Pontos de Observação Críticos

### 1. Gargalo de Bordado/Costura

Nos testes experimentais, foi observado que o setor de **Bordado** tende a acumular mais pedidos devido ao tempo de máquina.

- **Observação:** Cards parados há mais de 3 dias no Bordado devem disparar alerta visual no Dashboard.

### 2. Cumprimento do SLA (15 dias)

O sistema calcula automaticamente `Data Entrada + 15 dias`.

- **Observação:** Pedidos com menos de 3 dias restantes (Semáforo Amarelo/Laranja) precisam de "Check-in" prioritário via QR Code para evitar atrasos na Expedição.

### 3. Integridade do Banco de Dados

A tabela `producao_pedidos` no banco SQLite experimental espelha os campos do Supabase para validar:

- Formato de SKU (Ex: `SHORTS-MUAY-22`).
- Máscara de CPF do cliente.
- Vínculo entre Pedido Original e Etapa de Produção.

## 🛠️ Como usar este ambiente

1. Execute `iniciar_testes.bat`.
2. Gere 100 pedidos para popular o sistema.
3. Use o `app/index.html` (com o banco experimental conectado) para validar a usabilidade.

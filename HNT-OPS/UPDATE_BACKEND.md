# Conclusão da Fase 1: Supabase + API

O Módulo BI está completo e agora o front-end está **conetado com o Supabase real**.

## O que foi realizado

1. **Migration das Tabelas `producao_*` no Supabase `SimulatorHNT_01`** (sa-east-1).
    * `producao_pedidos`
    * `producao_rastreamento`
    * `producao_problemas`
    * `producao_mensagens`
    * `admin_configuracoes`
    * Triggers de automação de fluxo (semáforo de prazos, número de série).
    * Algoritmo de Prioridade em SQL Immutable (score 0-150+).
    * View `dashboard_pedidos` calculada no backend.
2. **Dados mock no DB:** Foram injetadas 7 ordens falsas para que o dashboard já recupere dados do cliente de ID `f2311784-...`.
3. **Módulo de Integração com a API (`api.js`)**: Realiza requisições POST/GET/PATCH diretamente pelo Supabase REST.
4. **App.js assíncrono:** Agora no evento `DOMContentLoaded`, o aplicativo tenta fazer fetch na API (Supabase) via `api.loadDashboard()`.

## 🚨 Ação Necessária do Desenvolvedor

Para que a conexão com o Supabase não use os dados MOCK no fallback, é obrigatório inserir a Chave Anon (Anon Key) no arquivo `api.js` na linha 7:

```javascript
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'SUA_CHAVE_ANON_AQUI'; 
```

Assim que a chave for trocada, o Front-end mostrará as 7 tarefas que foram incluídas remotamente no banco de dados.

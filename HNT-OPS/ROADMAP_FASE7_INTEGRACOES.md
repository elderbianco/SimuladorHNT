# 🚀 HNT-OPS — Roadmap Fase 7 & Fase 4 (Integrações Potentes)

> **Status:** 📋 PLANEJADO — NÃO IMPLEMENTADO  
> **Criado em:** 2026-03-14  
> **Baseado em:** ESPECIFICACAO_TECNICA_FASE1.md v1.3.0  
> **Pré-requisito:** Fases 1–3 concluídas ✅

---

## 📐 Visão Geral das Integrações

```
┌─────────────────────────────────────────────────────────────────┐
│                     HNT-OPS ECOSYSTEM                           │
│                                                                 │
│  [Kanban + SLA] ──► [Supabase DB] ──► [Edge Function]          │
│                                            │                    │
│                              ┌─────────────┴──────────────┐    │
│                              ▼                            ▼    │
│                         [N8N Webhook]              [PDF Engine] │
│                              │                            │    │
│                     ┌────────┴────────┐          [Ficha A4 Pro] │
│                     ▼                ▼                          │
│              [WhatsApp API]    [Email SMTP]                     │
│              (Gerente/Setor)   (Cliente/CC)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔔 FASE 7 — Webhook N8N + Notificações WhatsApp

### Objetivo

Quando um pedido for movido para a etapa **"Pendência"** (ou atingir SLA vermelho), o sistema deve notificar automaticamente o gerente de produção via WhatsApp, sem qualquer ação manual.

### Fluxo Completo

```
1. Operador arrasta card → etapa "Pendencia"
        │
        ▼
2. api.updateEtapa(id, "Pendencia") → Supabase
        │
        ▼
3. Database Trigger (Postgres Function)
   → detecta etapa_atual = 'Pendencia'
   → chama Supabase Edge Function: notify-pendencia
        │
        ▼
4. Edge Function (Deno)
   → monta payload com: pedido, cliente, setor, operador
   → POST → N8N Webhook URL
        │
        ▼
5. N8N Workflow
   ├─ Node: Format Message (templates WhatsApp)
   ├─ Node: WhatsApp API (via Evolution API / Z-API / Waba)
   │    → Envia mensagem ao número do gerente
   │    → Mensagem: "🚨 PENDÊNCIA | HNT-XXX | BORDADO
   │                 Cliente: João Silva
   │                 Motivo: Falta de insumo
   │                 Aberto: 14/03 às 19:30"
   └─ Node: (Opcional) Log em planilha Google Sheets
```

### Arquivos a Criar

| Arquivo | Localidade | Descrição |
|---|---|---|
| `edge-functions/notify-pendencia/index.ts` | Supabase | Edge Function principal |
| `n8n/workflow-pendencia.json` | N8N | Workflow exportado |
| `db/trigger_pendencia_notify.sql` | Supabase | Trigger Postgres |
| `app/api.js` | Frontend | Adicionar campo `notificacao_pendencia` |

### Schema Supabase necessário

```sql
-- Tabela de configuração de notificações (ainda não criada)
CREATE TABLE IF NOT EXISTS admin_notificacoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo text NOT NULL,           -- 'pendencia', 'sla_vermelho', 'expedicao_pronta'
    ativo boolean DEFAULT true,
    webhook_url text,             -- URL do N8N
    whatsapp_numero text,         -- Número do gerente
    template_msg text,            -- Template da mensagem
    criado_em timestamptz DEFAULT now()
);

-- Trigger function (a criar)
CREATE OR REPLACE FUNCTION fn_notify_pendencia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.etapa_atual = 'Pendencia' AND OLD.etapa_atual != 'Pendencia' THEN
        PERFORM net.http_post(
            url := (SELECT webhook_url FROM admin_notificacoes WHERE tipo = 'pendencia' AND ativo LIMIT 1),
            body := json_build_object(
                'pedido_id', NEW.id,
                'numero', NEW.numero_pedido,
                'cliente', NEW.cliente_nome,
                'etapa_anterior', OLD.etapa_atual,
                'timestamp', NOW()
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Function (estrutura base — não implementar)

```typescript
// supabase/functions/notify-pendencia/index.ts
// STATUS: RASCUNHO — NÃO DEPLOYAR

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface PendenciaPayload {
  pedido_id: string;
  numero: string;
  cliente: string;
  etapa_anterior: string;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  const payload: PendenciaPayload = await req.json();
  
  const N8N_WEBHOOK = Deno.env.get('N8N_WEBHOOK_PENDENCIA') ?? '';
  
  const msg = {
    pedido: payload.numero,
    cliente: payload.cliente,
    de: payload.etapa_anterior,
    para: 'Pendência',
    horario: new Date(payload.timestamp).toLocaleString('pt-BR'),
  };

  await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### N8N Workflow — Nós necessários

```
[Webhook Trigger]
    → [Set Node: formata mensagem WhatsApp]
    → [HTTP Request: WhatsApp API (Evolution/Z-API)]
    → [IF: Erro?]
        ├─ NÃO → [Google Sheets: Log OK]
        └─ SIM → [Email: Fallback para gerente]
```

### Variáveis de Ambiente necessárias

```env
# .env.production (não commitar!)
N8N_WEBHOOK_PENDENCIA=https://n8n.seu-servidor.com/webhook/hnt-pendencia
WHATSAPP_GERENTE=5511999999999
EVOLUTION_API_URL=https://evolution.xxx.com
EVOLUTION_API_TOKEN=xxxx
```

### Critérios de Aceite

- [ ] Pedido movido para Pendência → WhatsApp recebido em ≤ 30 segundos
- [ ] Mensagem contém: número do pedido, cliente, etapa anterior, horário
- [ ] Se WhatsApp falhar → email fallback é disparado
- [ ] Admin pode ativar/desativar notificações no painel

---

## 📄 FASE 4 — Fichas de Produção Robustas (com Mockup do Cliente)

### Objetivo

Gerar fichas A4 profissionais que incluam a **miniatura do mockup aprovado pelo cliente** (arte do produto), junto dos dados técnicos e QR code de rastreio — substituindo o placeholder SVG atual.

### Fluxo Completo

```
1. Arte aprovada → Upload para Supabase Storage (bucket: artes-aprovadas)
        │
        ▼
2. Link da arte salvo em producao_pedidos.link_arte_aprovada
        │
        ▼
3. Ao imprimir ficha → renderFichaA4(p)
        │
        ├─ Carrega imagem do Storage via URL pública
        ├─ Gera QR Code real (qrcode.js ou api.qrserver.com)
        └─ Compõe layout A4 completo com:
             • Cabeçalho HNT
             • Grid: mockup | dados técnicos | QR
             • Tabela de assinaturas por etapa
             • Informações do cliente
             • Alertas de cor/personalização
```

### Layout proposto da Ficha A4

```
┌──────────────────────────────────────────────────┐
│  [HNT LOGO]        FICHA DE PRODUÇÃO   [URGENTE] │
│  HNT-0042              Prazo: 21/03/2026          │
├────────────────┬─────────────────┬───────────────┤
│  MOCKUP        │  DADOS TÉCNICOS │   QR CODE     │
│  ┌──────────┐  │ SKU: SHORTS-F   │  ┌─────────┐ │
│  │ [Imagem] │  │ Técnica: Bordado│  │ ██ ██  │ │
│  │ Cliente  │  │ Tam: M | Qtd: 3 │  │ ██  █  │ │
│  │ Aprovada │  │ Centro: Preto   │  │  █ ██  │ │
│  └──────────┘  │ Lat: Branco     │  └─────────┘ │
│                │ Filete: Dourado │  Escaneie para│
│                │ Obs: Bordado 3D │  check-in     │
├────────────────┴─────────────────┴───────────────┤
│  CLIENTE: João Silva · CPF: 000.000.000-00        │
│  CEL: (11) 99999-9999 · Email: joao@email.com    │
├──────────────────────────────────────────────────┤
│  ASSINATURAS DE RASTREIO (CHECK-IN POR ETAPA)    │
│  ┌──────────┬──────────────────────────────────┐ │
│  │ PREP.    │ Op: _______ / Data: ___ / ___ /  │ │
│  │ SEPARAÇÃO│ Op: _______ / Data: ___ / ___ /  │ │
│  │ ARTE     │ Op: _______ / Data: ___ / ___ /  │ │
│  │ BORDADO  │ Op: _______ / Data: ___ / ___ /  │ │
│  │ COSTURA  │ Op: _______ / Data: ___ / ___ /  │ │
│  │ QUALIDADE│ Op: _______ / Data: ___ / ___ /  │ │
│  │ EXPEDIÇÃO│ Op: _______ / Data: ___ / ___ /  │ │
│  └──────────┴──────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Arquivos a Modificar

| Arquivo | Tipo de Mudança |
|---|---|
| `app/app.js` → `printFicha()` | Adicionar imagem real + QR code real |
| `app/api.js` | Adicionar `uploadArte(pedidoId, file)` e `getArteURL(pedidoId)` |
| `migration_fase4.sql` | Adicionar coluna `link_arte_aprovada text` |

### Dependências externas

```html
<!-- QR Code real (já disponível no index.html como html5-qrcode) -->
<!-- Alternativa: API pública → https://api.qrserver.com/v1/create-qr-code/?data=HNT-0042&size=150x150 -->

<!-- Para geração de PDF real (opcional) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

### Migration necessária (não rodar ainda)

```sql
-- migration_fase4_fichas_robustas.sql
-- STATUS: AGUARDANDO APROVAÇÃO

ALTER TABLE producao_pedidos
    ADD COLUMN IF NOT EXISTS link_arte_aprovada text,
    ADD COLUMN IF NOT EXISTS arte_aprovada_em timestamptz,
    ADD COLUMN IF NOT EXISTS arte_aprovada_por text;

-- Bucket de artes (configurar no painel Supabase Storage)
-- Nome: artes-aprovadas
-- Acesso: Private (URLs assinadas de curta duração)
-- Política: authenticated users podem fazer upload
```

### Critérios de Aceite

- [ ] Upload de imagem de arte acessível no drawer do pedido
- [ ] Ficha A4 impressa com mockup real (não placeholder SVG)
- [ ] QR Code gerado com o número real do pedido
- [ ] Layout responsivo para impressão (print CSS)
- [ ] Funciona offline (imagens pré-carregadas antes do print)

---

## 📊 RESUMO DE PRIORIZAÇÃO

| Feature | Impacto | Esforço | Prioridade |
|---|---|---|---|
| WhatsApp Pendência | 🔥 Alto | 🟡 Médio | P0 |
| Ficha A4 com Arte | 🔥 Alto | 🟡 Médio | P1 |
| Email Fallback | 🟡 Médio | 🟢 Baixo | P2 |
| PDF via jsPDF | 🟡 Médio | 🔴 Alto | P3 |
| SLA Alert no WhatsApp | 🟡 Médio | 🟡 Médio | P3 |

---

## 🗓 Estimativa de Implementação

| Fase | O que fazer | Tempo estimado |
|---|---|---|
| **Prep** | Configurar Evolution API / Z-API + N8N | 2-4h |
| **7a** | Edge Function + Trigger Postgres | 1-2h |
| **7b** | N8N Workflow (Webhook → WhatsApp) | 1h |
| **7c** | UI Admin para config de notificações | 2h |
| **4a** | Upload de arte no drawer + Storage | 2h |
| **4b** | Ficha A4 com mockup + QR real | 3h |

**Total estimado: ~12-14h de desenvolvimento**

---

> **Para iniciar:** Diga `/orchestrate Implementar Fase 7a — Edge Function notify-pendencia`  
> **Ou apenas:** `@[/enhance] integrar WhatsApp via N8N para alertas de Pendência`

---

*Documento criado por Antigravity AI — HNT-Ops Planner*  
*Não remover: este arquivo serve como contrato de escopo para as próximas sessões.*

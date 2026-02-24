# 📋 Plano de Refatoração - SimulatorHNT

> **Arquivo de Referência Temporário**  
> Criado em: 2026-02-16  
> Baseado na análise de arquitetura multi-agente

---

## 🎯 Resumo Executivo

**Avaliação Atual:** ⭐⭐⭐☆☆ (3/5) - Parcialmente Modular

**Principais Problemas:**

1. 🔴 NENHUM endpoint tem autenticação (CRÍTICO)
2. 🔴 `server.js` monolítico (461 linhas)
3. 🔴 `ui-render.js` gigante (1730 linhas, 76KB)
4. 🔴 19 arquivos soltos sem organização modular

---

## 📊 Plano de Ação Priorizado

### 🔴 FASE 1: CRÍTICO (EM ANDAMENTO)

#### ✅ 1. Adicionar Autenticação aos Endpoints Críticos

- **Status:** 🔄 EM PROGRESSO
- **Impacto:** ALTO
- **Esforço:** MÉDIO
- **Tempo:** 2-3 dias

**Endpoints que precisam proteção:**

- `POST /api/save-db` (linha 246 do server.js)
- `DELETE /api/delete-pdf/:id` (linha 125 do server.js)
- `POST /api/backups/restore` (linha 376 do server.js)
- `GET /api/next-order-id` (linha 168 do server.js)

**Abordagem:**

1. Criar `server/middleware/auth.js`
2. Implementar autenticação simples (token/senha)
3. Aplicar middleware aos endpoints críticos
4. Testar proteção

---

#### ⬜ 2. Refatorar `server.js` em Rotas + Controllers

- **Status:** ⏳ PENDENTE
- **Impacto:** ALTO
- **Esforço:** ALTO
- **Tempo:** 3-5 dias

**Estrutura alvo:**

```
server/
├── routes/
│   ├── orders.js
│   ├── database.js
│   └── backups.js
├── controllers/
│   ├── OrderController.js
│   └── DatabaseController.js
├── middleware/
│   ├── validation.js
│   ├── security.js
│   └── auth.js
└── server.js (apenas configuração)
```

---

#### ⬜ 3. Dividir `ui-render.js` (1730 linhas → 8 módulos)

- **Status:** ⏳ PENDENTE
- **Impacto:** ALTO
- **Esforço:** ALTO
- **Tempo:** 4-6 dias

**Divisão proposta:**

```
shorts/ui/
├── ControlsRenderer.js      (~500 linhas)
├── ColorControls.js          (~200 linhas)
├── UploadControls.js         (~200 linhas)
├── TextControls.js           (~300 linhas)
├── GalleryView.js            (~200 linhas)
├── EmbControls.js            (~150 linhas)
├── ExtraControls.js          (~100 linhas)
└── UIHelpers.js              (~80 linhas)
```

---

### ⚠️ FASE 2: ALTA PRIORIDADE

#### ⬜ 4. Organizar 19 Arquivos Soltos

- **Tempo:** 1-2 dias

**Arquivos a mover:**

- `cart-new.js` → `modules/cart/CartManager.js`
- `help-system.js` → `modules/utils/help-system/`
- `zone-calibration.js` → `modules/common/zone-calibration.js`
- `simulator-*.js` → respectivas pastas de produto

---

#### ⬜ 5. Criar Camada de Componentes UI Reutilizáveis

- **Tempo:** 3-4 dias

```
modules/ui-components/
├── ColorPicker.js
├── ImageUploader.js
├── TextEditor.js
├── SizeSelector.js
└── PriceDisplay.js
```

---

#### ⬜ 6. Implementar Rate Limiting

- **Tempo:** 1 dia

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitos uploads. Tente novamente em 15 minutos.'
});
```

---

### 🟡 FASE 3: MÉDIA PRIORIDADE

1. ⬜ Dividir `cart-new.js` (923 linhas)
2. ⬜ Criar BaseSimulator (reduzir duplicação)
3. ⬜ Reorganizar CSS em arquitetura modular

---

## 🔒 Vulnerabilidades Identificadas

### CRÍTICAS (Corrigir AGORA)

1. **Falta de Autenticação**
   - Severidade: CRÍTICA
   - Risco: Qualquer um pode modificar/deletar dados
   - Status: 🔄 EM CORREÇÃO

2. **Endpoints Públicos Perigosos**
   - `POST /api/save-db` - Sobrescrever banco
   - `DELETE /api/delete-pdf/:id` - Deletar pedidos
   - `POST /api/backups/restore` - Restaurar backups

### ALTAS

1. **Falta de Rate Limiting**
   - Severidade: MÉDIA
   - Risco: DoS, esgotamento de disco

2. **Logs Não Persistentes**
   - Severidade: BAIXA
   - Risco: Dificulta auditoria

---

## 📁 Estrutura Recomendada (Referência)

```
SimulatorHNT/
├── server/                    # Backend organizado
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── client/                    # Frontend organizado
│   ├── modules/
│   │   ├── core/
│   │   ├── ui-components/
│   │   ├── simulators/
│   │   │   ├── base/
│   │   │   └── [produtos]/
│   │   └── utils/
│   ├── css/
│   └── pages/
│
├── shared/
├── database/
├── assets/
└── docs/
```

---

## 📈 Métricas de Progresso

### Antes da Refatoração

- Arquivos > 1000 linhas: 1 🔴
- Arquivos soltos: 19 🔴
- Endpoints sem auth: 100% 🔴
- Duplicação: ~30% ⚠️

### Meta

- Arquivos > 1000 linhas: 0 ✅
- Arquivos soltos: 0 ✅
- Endpoints sem auth: 0% ✅
- Duplicação: < 10% ✅

---

## 🔗 Documentos de Referência

Análise completa disponível em:

- `brain/2518a16d-.../architecture_analysis.md` (análise detalhada)
- `brain/2518a16d-.../walkthrough.md` (resumo executivo)
- `brain/2518a16d-.../orchestration_report.md` (relatório final)

---

## ✅ Checklist de Implementação

### Fase 1 - Autenticação (ATUAL)

- [ ] Criar pasta `server/middleware/`
- [ ] Implementar `auth.js`
- [ ] Criar `.env` para credenciais
- [ ] Proteger endpoint `POST /api/save-db`
- [ ] Proteger endpoint `DELETE /api/delete-pdf/:id`
- [ ] Proteger endpoint `POST /api/backups/restore`
- [ ] Testar autenticação
- [ ] Documentar uso

### Fase 1 - Refatorar server.js

- [ ] Criar estrutura de pastas
- [ ] Extrair rotas
- [ ] Extrair controllers
- [ ] Extrair middleware
- [ ] Testar endpoints
- [ ] Atualizar documentação

### Fase 1 - Dividir ui-render.js

- [ ] Criar pasta `shorts/ui/`
- [ ] Extrair ControlsRenderer
- [ ] Extrair ColorControls
- [ ] Extrair UploadControls
- [ ] Extrair TextControls
- [ ] Extrair GalleryView
- [ ] Extrair EmbControls
- [ ] Extrair ExtraControls
- [ ] Criar UIHelpers
- [ ] Testar funcionalidade

---

**Última atualização:** 2026-02-16  
**Próxima revisão:** Após completar Fase 1

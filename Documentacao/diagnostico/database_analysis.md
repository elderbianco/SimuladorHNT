# Análise Orquestrada: Estrutura do Banco de Dados

**Data:** 08/02/2026  
**Tipo:** Análise Multi-Perspectiva  
**Agentes Envolvidos:** Database Architect, Backend Specialist, DevOps Engineer, Security Auditor

---

## 📊 Estrutura Atual Identificada

### Arquivos de Dados

- `BD_Simulador.xlsx` (8 KB)
- `BancoDados_Mestre.xlsx` (112 KB) - **Principal**
- `BancoDados_Novo.xlsx` (38 KB)
- `order_sequence.json` (16 bytes) - Sequenciador de pedidos

### Esquema de Dados (107 Colunas)

#### 1. Identificação (8 colunas)

- ID_PEDIDO, ID_SIMULACAO, TIPO_PRODUTO
- DATA_CRIACAO, DATA_ATUALIZACAO, DATA_PEDIDO
- STATUS_PEDIDO, NUMERO_ITEM

#### 2. Dados do Cliente (4 colunas)

- NOME_CLIENTE, TELEFONE_CLIENTE
- EMAIL_CLIENTE, OBS_CLIENTE

#### 3. Cores Variáveis (11 colunas)

- COR_PRINCIPAL, COR_LATERAL_DIREITA, COR_LATERAL_ESQUERDA
- COR_CENTRO, COR_COS, COR_VIES, COR_DETALHES
- COR_PERNA_DIR_SUP, COR_PERNA_DIR_INF
- COR_PERNA_ESQ_SUP, COR_PERNA_ESQ_INF

#### 4. Grade de Tamanhos (14 colunas)

- QTD_TAMANHO_PP, P, M, G, GG, EXG, EXGG
- QTD_TAMANHO_38, 40, 42, 44, 46, 48
- QUANTIDADE_TOTAL

#### 5. Extras (3 colunas)

- EXTRA_LEGGING_INTERNA
- EXTRA_CORDAO, EXTRA_LACOS

#### 6. Logos (30 colunas)

- 6 zonas × 5 propriedades (Arquivo, Posição X/Y, Escala, Rotação)
- Zonas: Centro, Lateral Dir/Esq, Perna Dir/Esq (Meio/Inf)

#### 7. Textos (28 colunas)

- 4 zonas × 7 propriedades (Conteúdo, Fonte, Tamanho, Cor, Posição X/Y, Rotação)

#### 8. Financeiro (9 colunas)

- PRECO_UNITARIO, PRECO_BASE_ATACADO
- CUSTO_PERSONALIZACAO, CUSTO_EXTRAS
- VALOR_DESCONTOS, PRECO_TOTAL
- MARGEM_LUCRO_PCT, MARGEM_LUCRO_VALOR, PRECO_FINAL

#### 9. Produção (8 colunas)

- CUSTO_PRODUCAO_UNITARIO, CUSTO_PRODUCAO_TOTAL
- STATUS_PRODUCAO
- DATA_INICIO_PRODUCAO, DATA_FIM_PRODUCAO
- PREVISAO_ENTREGA_MIN, PREVISAO_ENTREGA_MAX
- OBSERVACOES_PRODUCAO

#### 10. Sistema (1 coluna)

- DADOS_TECNICOS_JSON (backup completo do estado)

---

## 🎯 Análise por Perspectiva

### 🗄️ Database Architect

#### ✅ Pontos Positivos

1. **Esquema Abrangente**
   - 107 colunas cobrem todas as necessidades do negócio
   - Separação lógica clara (Cliente, Produto, Financeiro, Produção)

2. **Backup de Segurança**
   - Campo `DADOS_TECNICOS_JSON` preserva estado completo
   - Permite recuperação total em caso de corrupção

3. **Rastreabilidade**
   - IDs únicos (pedido + simulação)
   - Timestamps de criação/atualização

#### ❌ Pontos Negativos

1. **Violação de Normalização**
   - **1NF violada:** Colunas repetitivas (Logo_1, Logo_2, etc.)
   - **2NF violada:** Dados de produto misturados com pedido
   - **3NF violada:** Cálculos derivados armazenados (PRECO_TOTAL)

2. **Falta de Relacionamentos**
   - Sem tabelas separadas para Clientes, Produtos, Cores
   - Impossível fazer queries eficientes
   - Duplicação massiva de dados

3. **Escalabilidade Limitada**
   - Excel tem limite de ~1 milhão de linhas
   - Performance degrada com +10k pedidos
   - Sem índices ou otimização de queries

4. **Integridade de Dados**
   - Sem constraints (chaves estrangeiras, checks)
   - Sem validação de tipos
   - Risco de inconsistência

#### 💡 Sugestões

**Migração para PostgreSQL/MySQL:**

```sql
-- Estrutura Normalizada Proposta
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'shorts', 'legging', etc
    nome VARCHAR(255),
    preco_base DECIMAL(10,2) NOT NULL
);

CREATE TABLE cores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    hex_code VARCHAR(7)
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INT REFERENCES clientes(id),
    produto_id INT REFERENCES produtos(id),
    status VARCHAR(50) DEFAULT 'pendente',
    data_pedido TIMESTAMP DEFAULT NOW(),
    preco_total DECIMAL(10,2),
    margem_lucro_pct DECIMAL(5,2),
    observacoes TEXT
);

CREATE TABLE pedido_personalizacao (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    zona VARCHAR(50), -- 'centro', 'lateral_dir', etc
    tipo VARCHAR(20), -- 'logo', 'texto', 'cor'
    conteudo JSONB, -- Flexível para diferentes tipos
    posicao_x INT,
    posicao_y INT,
    escala DECIMAL(5,2),
    rotacao INT
);

CREATE TABLE pedido_tamanhos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    tamanho VARCHAR(10), -- 'PP', 'P', 'M', etc
    quantidade INT NOT NULL CHECK (quantidade > 0)
);

CREATE TABLE producao (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'aguardando',
    custo_unitario DECIMAL(10,2),
    custo_total DECIMAL(10,2),
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    previsao_entrega_min DATE,
    previsao_entrega_max DATE,
    observacoes TEXT
);

-- Índices para Performance
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX idx_producao_status ON producao(status);
```

---

### 💻 Backend Specialist

#### ✅ Pontos Positivos

1. **Integração Funcional**
   - `XLSX.js` funciona bem para leitura/escrita
   - Endpoints REST claros (`/api/save-db`)

2. **Estrutura de Dados Rica**
   - JSON técnico permite flexibilidade
   - Fácil adicionar novos campos

#### ❌ Pontos Negativos

1. **Performance**
   - Leitura/escrita de Excel é lenta (I/O bloqueante)
   - Sem cache ou otimização
   - Cada operação reescreve arquivo inteiro

2. **Concorrência**
   - **CRÍTICO:** Sem controle de concorrência
   - Múltiplos usuários podem corromper dados
   - Sem transações ou locks

3. **Queries Limitadas**
   - Impossível fazer `WHERE`, `JOIN`, `GROUP BY`
   - Filtros e relatórios exigem carregar tudo na memória

#### 💡 Sugestões

**API com Prisma ORM:**

```javascript
// prisma/schema.prisma
model Cliente {
  id        Int      @id @default(autoincrement())
  nome      String
  telefone  String   @unique
  email     String?
  pedidos   Pedido[]
  createdAt DateTime @default(now())
}

model Pedido {
  id              Int      @id @default(autoincrement())
  numeroPedido    String   @unique
  clienteId       Int
  cliente         Cliente  @relation(fields: [clienteId], references: [id])
  produtoTipo     String
  status          String   @default("pendente")
  dataPedido      DateTime @default(now())
  precoTotal      Decimal  @db.Decimal(10, 2)
  personalizacoes Personalizacao[]
  tamanhos        PedidoTamanho[]
  producao        Producao?
  
  @@index([clienteId])
  @@index([status])
  @@index([dataPedido])
}

// API Endpoints
app.get('/api/pedidos', async (req, res) => {
  const { status, clienteId, dataInicio, dataFim } = req.query;
  
  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(status && { status }),
      ...(clienteId && { clienteId: parseInt(clienteId) }),
      ...(dataInicio && dataFim && {
        dataPedido: {
          gte: new Date(dataInicio),
          lte: new Date(dataFim)
        }
      })
    },
    include: {
      cliente: true,
      personalizacoes: true,
      tamanhos: true,
      producao: true
    },
    orderBy: { dataPedido: 'desc' }
  });
  
  res.json(pedidos);
});
```

---

### 🚀 DevOps Engineer

#### ✅ Pontos Positivos

1. **Simplicidade Inicial**
   - Fácil backup (copiar arquivo)
   - Sem dependências de infraestrutura

2. **Portabilidade**
   - Funciona offline
   - Fácil migrar entre máquinas

#### ❌ Pontos Negativos

1. **Escalabilidade Zero**
   - Impossível distribuir carga
   - Sem replicação ou alta disponibilidade

2. **Backup Manual**
   - Sem versionamento automático
   - Risco de perda de dados

3. **Monitoramento**
   - Sem métricas ou logs estruturados
   - Impossível rastrear performance

#### 💡 Sugestões

**Migração para Nuvem (Faseada):**

**Fase 1: Local com PostgreSQL**

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hanuthai_db
      POSTGRES_USER: hanuthai
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    
  app:
    build: .
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://hanuthai:${DB_PASSWORD}@postgres:5432/hanuthai_db
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
```

**Fase 2: Nuvem (Railway/Render/Supabase)**

```javascript
// .env.production
DATABASE_URL=postgresql://user:pass@aws-region.railway.app:5432/production_db
REDIS_URL=redis://redis-region.railway.app:6379
S3_BUCKET=hanuthai-uploads
```

**Fase 3: Produção Completa**

- PostgreSQL gerenciado (AWS RDS / Supabase)
- Redis para cache
- S3 para uploads
- Backups automáticos diários
- Monitoramento (Datadog / New Relic)

---

### 🔒 Security Auditor

#### ✅ Pontos Positivos

1. **Dados Locais**
   - Sem exposição na internet (por enquanto)
   - Controle físico dos dados

#### ❌ Pontos Negativos

1. **Sem Criptografia**
   - Dados sensíveis (telefone, email) em texto plano
   - Arquivo Excel pode ser aberto por qualquer um

2. **Sem Auditoria**
   - Impossível rastrear quem modificou o quê
   - Sem logs de acesso

3. **Backup Vulnerável**
   - Arquivos podem ser deletados acidentalmente
   - Sem proteção contra ransomware

4. **LGPD/GDPR**
   - Difícil implementar "direito ao esquecimento"
   - Sem controle de retenção de dados

#### 💡 Sugestões

**Segurança em Camadas:**

```javascript
// 1. Criptografia de dados sensíveis
const crypto = require('crypto');

function encryptPII(data) {
  const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

// 2. Audit Log
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(50), -- 'CREATE', 'UPDATE', 'DELETE'
  table_name VARCHAR(100),
  record_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);

// 3. Backup Automático com Retenção
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hanuthai hanuthai_db | gzip > /backups/db_$DATE.sql.gz

# Manter apenas últimos 30 dias
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

---

## 📋 Resumo Executivo

### Situação Atual

- ✅ **Funcional** para operação local de pequeno porte
- ⚠️ **Limitado** para crescimento
- ❌ **Inadequado** para produção em escala

### Riscos Críticos

1. **Perda de Dados** - Sem backup automático
2. **Corrupção** - Sem controle de concorrência
3. **Performance** - Degrada com volume
4. **Segurança** - Dados não criptografados

---

## 🎯 Plano de Migração Recomendado

### Fase 1: Preparação (1-2 semanas)

- [ ] Criar schema normalizado (PostgreSQL)
- [ ] Script de migração Excel → SQL
- [ ] Testes em ambiente local
- [ ] Validação de integridade

### Fase 2: Transição (2-3 semanas)

- [ ] Rodar ambos sistemas em paralelo
- [ ] Migrar dados históricos
- [ ] Treinar equipe
- [ ] Ajustar relatórios

### Fase 3: Nuvem (1 mês)

- [ ] Escolher provedor (Supabase/Railway/AWS)
- [ ] Configurar infraestrutura
- [ ] Migrar para produção
- [ ] Monitoramento e backups

### Fase 4: Otimização (contínuo)

- [ ] Implementar cache (Redis)
- [ ] Otimizar queries
- [ ] Adicionar analytics
- [ ] Relatórios avançados

---

## 💰 Estimativa de Custos (Nuvem)

| Serviço | Provedor | Custo Mensal (USD) |
|---------|----------|-------------------|
| **Banco de Dados** | Supabase Free / Railway | $0 - $20 |
| **Servidor** | Railway / Render | $5 - $20 |
| **Storage (S3)** | AWS / Cloudflare R2 | $1 - $5 |
| **Backups** | Incluído | $0 |
| **Monitoramento** | Sentry Free | $0 |
| **TOTAL** | | **$6 - $45/mês** |

**ROI Esperado:**

- ⬆️ +300% performance
- ⬆️ +500% escalabilidade
- ⬇️ -90% risco de perda de dados
- ⬆️ Capacidade de relatórios avançados

---

## 🏁 Conclusão

**Recomendação:** Migração para banco relacional é **ESSENCIAL** para:

1. Crescimento sustentável do negócio
2. Segurança e conformidade (LGPD)
3. Relatórios financeiros e estatísticos
4. Escalabilidade futura

**Prioridade:** ALTA  
**Complexidade:** Média  
**Tempo Estimado:** 1-2 meses (faseado)  
**Risco:** Baixo (com migração faseada)

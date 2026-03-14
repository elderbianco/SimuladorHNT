-- =============================================================
-- HNT-OPS: Migration SQL Completo — Fase 1
-- Projeto: SimulatorHNT_01 (sflllqfytzpwgnaksvkj)
-- Data:    2026-03-14
-- INSTRUÇÃO: Execute no Supabase SQL Editor (projeto sa-east-1)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- STEP 1: TIPOS CUSTOMIZADOS (ENUMs)
-- ─────────────────────────────────────────────────────────────

-- Etapas da linha de produção
DO $$ BEGIN
  CREATE TYPE etapa_producao AS ENUM (
    'Preparacao',    -- verificação, etiquetas, fichas
    'Separacao',     -- almoxarifado: tecido, elásticos, insumos
    'Arte',          -- desenvolvimento da matriz / filme DTF
    'Bordado',       -- execução nas máquinas de bordado
    'Costura',       -- montagem física da peça
    'Qualidade',     -- arremate, conferência, passadoria
    'Expedicao',     -- embalagem, NF, envio
    'Pendencia'      -- raia de problemas e falhas
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Técnica de personalização do produto
DO $$ BEGIN
  CREATE TYPE tecnica_personalizacao AS ENUM (
    'Bordado',
    'DTF',
    'Bordado e DTF',
    'Sublimacao',
    'Sem Personalizacao'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Semáforo de prazo / alerta de SLA
DO $$ BEGIN
  CREATE TYPE alerta_prazo AS ENUM (
    'Verde',    -- no prazo
    'Amarelo',  -- atenção (padrão: 3 dias)
    'Laranja',  -- crítico (padrão: 1 dia)
    'Vermelho'  -- prazo estourado ou peça parada
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status de uma etapa no rastreamento
DO $$ BEGIN
  CREATE TYPE status_etapa AS ENUM (
    'Aguardando',    -- ainda não chegou nessa etapa
    'Em Andamento',  -- etapa ativa no momento
    'Concluido',     -- etapa finalizada com sucesso
    'Devolvido'      -- etapa devolvida com anotação de erro
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categorias de problemas/falhas na produção
DO $$ BEGIN
  CREATE TYPE tipo_problema AS ENUM (
    'Erro de Arte',
    'Falta de Insumo',
    'Erro de Costura',
    'Maquina Quebrada',
    'Erro de Medida',
    'Qualidade Reprovada',
    'Outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Canais de envio de notificação
DO $$ BEGIN
  CREATE TYPE canal_notificacao AS ENUM (
    'WhatsApp',
    'Email',
    'Sistema'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 2: SEQUÊNCIA PARA NÚMERO DE PEDIDO LEGÍVEL
-- ─────────────────────────────────────────────────────────────
-- Gera: HNT-2026-0001, HNT-2026-0002, etc.
CREATE SEQUENCE IF NOT EXISTS seq_numero_pedido START WITH 1 INCREMENT BY 1;


-- ─────────────────────────────────────────────────────────────
-- STEP 3: PEDIDOS EM PRODUÇÃO (tabela principal)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producao_pedidos (

  -- Identificação
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido           TEXT,          -- ex: HNT-2026-0001 (gerado automaticamente)
  pedido_origem_id        TEXT NOT NULL, -- ID_PEDIDO da tabela pedidos do SimuladorHNT
  cliente_id              UUID,          -- FK para clientes_cadastrados

  -- Produto
  sku                     TEXT NOT NULL, -- código base do modelo
  tecnica                 tecnica_personalizacao NOT NULL DEFAULT 'Bordado',
  tamanho                 TEXT,          -- P, M, G, GG, XG...
  cor_centro              TEXT,
  cor_laterais            TEXT,
  cor_filete              TEXT,
  quantidade              INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),

  -- Arquivos vinculados (Supabase Storage)
  link_pdf                TEXT,  -- PDF de simulação gerado pelo SimuladorHNT
  link_arquivo_bordado    TEXT,  -- matriz de bordado (.emb / .dst / .pes)
  link_pasta_imagens      TEXT,  -- pasta com imagens enviadas pelo cliente

  -- Controle de fluxo
  etapa_atual             etapa_producao NOT NULL DEFAULT 'Preparacao',
  prioridade              INTEGER NOT NULL DEFAULT 0 CHECK (prioridade BETWEEN 0 AND 5),
  urgente                 BOOLEAN NOT NULL DEFAULT FALSE,

  -- Prazos e SLA
  data_entrada            DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo_entrega           DATE NOT NULL,
  dias_restantes          INTEGER GENERATED ALWAYS AS (prazo_entrega - CURRENT_DATE) STORED,
  dias_producao_estimado  INTEGER, -- total estimado configurado pelo admin

  -- Alerta visual (semáforo, calculado automaticamente)
  alerta_prazo            alerta_prazo NOT NULL DEFAULT 'Verde',

  -- Notas gerais
  observacoes             TEXT,

  -- Controle de tempo
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK para cliente
ALTER TABLE producao_pedidos
  ADD CONSTRAINT fk_pedido_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes_cadastrados(id) ON DELETE SET NULL;

-- Número de pedido único
CREATE UNIQUE INDEX IF NOT EXISTS uq_numero_pedido
  ON producao_pedidos(numero_pedido)
  WHERE numero_pedido IS NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_etapa      ON producao_pedidos(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_pedidos_prazo      ON producao_pedidos(prazo_entrega ASC);
CREATE INDEX IF NOT EXISTS idx_pedidos_prioridade ON producao_pedidos(prioridade DESC, prazo_entrega ASC);
CREATE INDEX IF NOT EXISTS idx_pedidos_alerta     ON producao_pedidos(alerta_prazo);
CREATE INDEX IF NOT EXISTS idx_pedidos_origem     ON producao_pedidos(pedido_origem_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_urgente    ON producao_pedidos(urgente) WHERE urgente = TRUE;

COMMENT ON TABLE producao_pedidos IS
  'Tabela central do HNT-Ops. Representa cada pedido em produção com etapa, prazo e prioridade.';
COMMENT ON COLUMN producao_pedidos.prioridade IS
  '0 = Normal | 1 = Moderada | 2 = Alta | 3 = Urgente | 4 = Crítica | 5 = Máxima';
COMMENT ON COLUMN producao_pedidos.dias_restantes IS
  'Calculado automaticamente: prazo_entrega - data de hoje.';
COMMENT ON COLUMN producao_pedidos.link_arquivo_bordado IS
  'Arquivo de matriz de bordado (.emb, .dst, .pes) no Supabase Storage.';


-- ─────────────────────────────────────────────────────────────
-- STEP 4: RASTREAMENTO POR ETAPA (log de movimentação)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producao_rastreamento (

  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id           UUID NOT NULL REFERENCES producao_pedidos(id) ON DELETE CASCADE,

  -- Identificação da etapa
  etapa               etapa_producao NOT NULL,
  status              status_etapa NOT NULL DEFAULT 'Aguardando',

  -- Quem fez a leitura (QR ou manual)
  operador            TEXT,       -- nome do operador
  leitura_via         TEXT,       -- 'Webcam', 'Celular', 'Manual'

  -- Timestamps de passagem
  entrou_em           TIMESTAMPTZ, -- quando o pedido chegou nessa etapa
  saiu_em             TIMESTAMPTZ, -- quando o pedido saiu dessa etapa

  -- Duração calculada automaticamente em dias decimais
  tempo_na_etapa_dias NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN saiu_em IS NOT NULL AND entrou_em IS NOT NULL
      THEN EXTRACT(EPOCH FROM (saiu_em - entrou_em)) / 86400.0
      ELSE NULL
    END
  ) STORED,

  -- Checklist
  rubrica_assinada    BOOLEAN DEFAULT FALSE,
  observacoes         TEXT,

  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_pedido ON producao_rastreamento(pedido_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_etapa  ON producao_rastreamento(etapa, status);

COMMENT ON TABLE producao_rastreamento IS
  'Log de rastreabilidade. Cada linha = 1 passagem de um pedido por uma etapa de produção.';
COMMENT ON COLUMN producao_rastreamento.leitura_via IS
  'Como o QR foi lido: Webcam (desktop) | Celular (mobile) | Manual.';
COMMENT ON COLUMN producao_rastreamento.tempo_na_etapa_dias IS
  'Duração automática em dias decimais. Ex: 1.5 = 1 dia e meio.';


-- ─────────────────────────────────────────────────────────────
-- STEP 5: PROBLEMAS E PENDÊNCIAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producao_problemas (

  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id               UUID NOT NULL REFERENCES producao_pedidos(id) ON DELETE CASCADE,
  rastreamento_id         UUID REFERENCES producao_rastreamento(id) ON DELETE SET NULL,

  -- Origem e destino do problema
  relatado_por_etapa      etapa_producao NOT NULL, -- quem reportou
  devolver_para_etapa     etapa_producao,           -- setor responsável (para devolução do card)
  tipo_problema           tipo_problema NOT NULL,

  -- Descrição
  descricao               TEXT NOT NULL,
  foto_url                TEXT, -- evidência fotográfica

  -- Resolução
  resolvido               BOOLEAN NOT NULL DEFAULT FALSE,
  como_foi_resolvido      TEXT,
  resolvido_por           TEXT,
  resolvido_em            TIMESTAMPTZ,

  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problemas_pedido   ON producao_problemas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_problemas_abertos  ON producao_problemas(resolvido) WHERE resolvido = FALSE;
CREATE INDEX IF NOT EXISTS idx_problemas_etapa    ON producao_problemas(relatado_por_etapa);

COMMENT ON TABLE producao_problemas IS
  'Registro de falhas e pendências. Suporta devolução de card entre setores com anotação.';


-- ─────────────────────────────────────────────────────────────
-- STEP 6: CHAT INTERNO ENTRE SETORES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producao_mensagens (

  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problema_id   UUID NOT NULL REFERENCES producao_problemas(id) ON DELETE CASCADE,

  -- Autor
  autor         TEXT NOT NULL, -- nome do operador
  etapa_autor   etapa_producao,

  -- Conteúdo
  texto         TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'Texto' CHECK (tipo IN ('Texto', 'Imagem', 'Sistema')),
  anexo_url     TEXT,

  enviado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_problema ON producao_mensagens(problema_id, enviado_em ASC);

COMMENT ON TABLE producao_mensagens IS
  'Chat interno vinculado a um problema. Comunicação assíncrona entre etapas de produção.';


-- ─────────────────────────────────────────────────────────────
-- STEP 7: CONFIGURAÇÕES DO PAINEL ADMIN
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_configuracoes (

  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave         TEXT UNIQUE NOT NULL, -- identificador da configuração
  valor         JSONB NOT NULL,       -- dados em JSON
  descricao     TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO admin_configuracoes (chave, valor, descricao) VALUES

-- Tempo médio por etapa (em dias úteis) — usado no algoritmo de prioridade
('tempo_medio_por_etapa', '{
  "Preparacao": 1,
  "Separacao":  1,
  "Arte":       2,
  "Bordado":    3,
  "Costura":    4,
  "Qualidade":  1,
  "Expedicao":  1
}', 'Tempo médio em dias úteis para cada etapa. Alimenta o cálculo de prioridade.'),

-- Semáforo de alertas de prazo
('semaforo_prazo', '{
  "amarelo_em_dias": 3,
  "laranja_em_dias": 1,
  "vermelho_em_dias": 0
}', 'Dias restantes para acionar cada cor do semáforo de prazo.'),

-- Gatilhos de notificação automática
('gatilhos_notificacao', '{
  "pedido_parado_ha_dias": 2,
  "prazo_estourado": true,
  "novo_problema": true,
  "pedido_expedido": true
}', 'Quando o sistema deve disparar alertas automáticos.'),

-- Destinatários das notificações
('destinatarios_alerta', '{
  "gerente_whatsapp": "",
  "gerente_email":    "",
  "equipe_email":     ""
}', 'Números/emails que recebem as notificações automáticas.'),

-- Configuração do QR Code
('qr_code', '{
  "url_base":    "https://hnt-ops.app/scan/",
  "acao_padrao": "Confirmar Etapa"
}', 'URL base e comportamento padrão ao escanear o QR Code das fichas.')

ON CONFLICT (chave) DO NOTHING;

COMMENT ON TABLE admin_configuracoes IS
  'Painel de controle do gestor. Todas as configurações operacionais em formato chave → JSON.';


-- ─────────────────────────────────────────────────────────────
-- STEP 8: LOG DE NOTIFICAÇÕES ENVIADAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_notificacoes (

  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id     UUID REFERENCES producao_pedidos(id) ON DELETE SET NULL,
  problema_id   UUID REFERENCES producao_problemas(id) ON DELETE SET NULL,

  -- Destino
  canal         canal_notificacao NOT NULL, -- WhatsApp | Email | Sistema
  destinatario  TEXT NOT NULL,              -- número ou email

  -- Conteúdo
  assunto       TEXT,
  mensagem      TEXT NOT NULL,

  -- Status do envio
  status_envio  TEXT NOT NULL DEFAULT 'Pendente'
                CHECK (status_envio IN ('Pendente', 'Enviado', 'Falhou')),
  tentativas    INTEGER NOT NULL DEFAULT 0,
  erro          TEXT,

  enviado_em    TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_pedido  ON admin_notificacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notif_fila    ON admin_notificacoes(status_envio) WHERE status_envio = 'Pendente';

COMMENT ON TABLE admin_notificacoes IS
  'Histórico de todas as notificações disparadas por WhatsApp e e-mail.';


-- ─────────────────────────────────────────────────────────────
-- STEP 9: FUNÇÕES E TRIGGERS
-- ─────────────────────────────────────────────────────────────

-- 9.1 ── Manter atualizado_em sempre atual
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pedidos_atualizado ON producao_pedidos;
CREATE TRIGGER trg_pedidos_atualizado
  BEFORE UPDATE ON producao_pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

DROP TRIGGER IF EXISTS trg_problemas_atualizado ON producao_problemas;
CREATE TRIGGER trg_problemas_atualizado
  BEFORE UPDATE ON producao_problemas
  FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();


-- 9.2 ── Calcular alerta de prazo (semáforo) automaticamente
CREATE OR REPLACE FUNCTION fn_calcular_alerta_prazo()
RETURNS TRIGGER AS $$
DECLARE
  v_cfg         JSONB;
  v_amarelo     INTEGER;
  v_laranja     INTEGER;
  v_vermelho    INTEGER;
  v_dias        INTEGER;
BEGIN
  SELECT valor INTO v_cfg FROM admin_configuracoes WHERE chave = 'semaforo_prazo';

  v_amarelo  := COALESCE((v_cfg->>'amarelo_em_dias')::INTEGER,  3);
  v_laranja  := COALESCE((v_cfg->>'laranja_em_dias')::INTEGER,  1);
  v_vermelho := COALESCE((v_cfg->>'vermelho_em_dias')::INTEGER, 0);
  v_dias     := NEW.prazo_entrega - CURRENT_DATE;

  NEW.alerta_prazo :=
    CASE
      WHEN v_dias <= v_vermelho THEN 'Vermelho'
      WHEN v_dias <= v_laranja  THEN 'Laranja'
      WHEN v_dias <= v_amarelo  THEN 'Amarelo'
      ELSE                           'Verde'
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_alerta ON producao_pedidos;
CREATE TRIGGER trg_calcular_alerta
  BEFORE INSERT OR UPDATE OF prazo_entrega ON producao_pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_calcular_alerta_prazo();


-- 9.3 ── Gerar número de pedido legível (HNT-2026-0001)
CREATE OR REPLACE FUNCTION fn_gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL THEN
    NEW.numero_pedido :=
      'HNT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
      LPAD(NEXTVAL('seq_numero_pedido')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_numero_pedido ON producao_pedidos;
CREATE TRIGGER trg_numero_pedido
  BEFORE INSERT ON producao_pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_gerar_numero_pedido();


-- 9.4 ── Abrir rastreamento na Preparação ao criar pedido
CREATE OR REPLACE FUNCTION fn_abrir_etapa_inicial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO producao_rastreamento (pedido_id, etapa, status, entrou_em)
  VALUES (NEW.id, 'Preparacao', 'Em Andamento', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_etapa_inicial ON producao_pedidos;
CREATE TRIGGER trg_etapa_inicial
  AFTER INSERT ON producao_pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_abrir_etapa_inicial();


-- 9.5 ── Registrar mudança de etapa no rastreamento
CREATE OR REPLACE FUNCTION fn_registrar_mudanca_etapa()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etapa_atual IS DISTINCT FROM NEW.etapa_atual THEN

    -- Fechar etapa anterior
    UPDATE producao_rastreamento
    SET saiu_em = NOW(), status = 'Concluido'
    WHERE pedido_id = NEW.id
      AND etapa     = OLD.etapa_atual
      AND status    = 'Em Andamento';

    -- Abrir nova etapa
    INSERT INTO producao_rastreamento (pedido_id, etapa, status, entrou_em)
    VALUES (NEW.id, NEW.etapa_atual, 'Em Andamento', NOW());

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mudanca_etapa ON producao_pedidos;
CREATE TRIGGER trg_mudanca_etapa
  AFTER UPDATE OF etapa_atual ON producao_pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_registrar_mudanca_etapa();


-- ─────────────────────────────────────────────────────────────
-- STEP 10: FUNÇÃO DE SCORE DE PRIORIDADE (para ordenação)
-- ─────────────────────────────────────────────────────────────
-- Quanto maior o score, mais urgente o pedido aparece na lista/kanban
CREATE OR REPLACE FUNCTION fn_calcular_score_prioridade(
  p_prioridade        INTEGER,
  p_urgente           BOOLEAN,
  p_prazo_entrega     DATE,
  p_dias_estimado     INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_dias_restantes  INTEGER;
  v_folga_dias      INTEGER;
  v_score           NUMERIC;
BEGIN
  v_dias_restantes := p_prazo_entrega - CURRENT_DATE;
  v_folga_dias     := v_dias_restantes - COALESCE(p_dias_estimado, 7);

  -- Base: prioridade manual × 10
  v_score := p_prioridade * 10;

  -- Bônus por marcação de urgente
  IF p_urgente THEN v_score := v_score + 50; END IF;

  -- Penalidade por prazo apertado (folga negativa = prazo impossível)
  v_score := v_score + GREATEST(0, 10 - v_folga_dias);

  -- Prazo estourado = score de emergência máxima
  IF v_dias_restantes <= 0 THEN v_score := v_score + 100; END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ─────────────────────────────────────────────────────────────
-- STEP 11: VIEW — DASHBOARD PRINCIPAL
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW dashboard_pedidos AS
SELECT
  pp.id,
  pp.numero_pedido,
  pp.pedido_origem_id,
  pp.sku,
  pp.tecnica,
  pp.tamanho,
  pp.quantidade,
  pp.etapa_atual,
  pp.prioridade,
  pp.urgente,
  pp.alerta_prazo,
  pp.data_entrada,
  pp.prazo_entrega,
  pp.dias_restantes,
  pp.link_pdf,
  pp.link_arquivo_bordado,

  -- Dados do cliente
  cc.nome_comprador     AS cliente_nome,
  cc.celular_comprador  AS cliente_celular,
  cc.email_comprador    AS cliente_email,
  cc.cpf_cnpj_comprador AS cliente_cpf,

  -- Dados técnicos do produto original
  p.TIPO_PRODUTO        AS tipo_produto,
  p.PRECO_FINAL         AS valor_pedido,
  p.json_tec            AS dados_tecnicos,

  -- Score de prioridade para ordenação inteligente
  fn_calcular_score_prioridade(
    pp.prioridade, pp.urgente, pp.prazo_entrega, pp.dias_producao_estimado
  ) AS score_ordenacao,

  -- Dias parado na etapa atual
  COALESCE(CURRENT_DATE - MAX(r.entrou_em::date), 0) AS dias_na_etapa_atual,

  -- Quantidade de problemas ainda em aberto
  COUNT(DISTINCT prob.id) FILTER (WHERE prob.resolvido = FALSE) AS problemas_em_aberto

FROM producao_pedidos pp
LEFT JOIN clientes_cadastrados cc  ON cc.id = pp.cliente_id
LEFT JOIN pedidos p                ON p."ID_PEDIDO" = pp.pedido_origem_id
LEFT JOIN producao_rastreamento r
  ON r.pedido_id = pp.id
  AND r.etapa    = pp.etapa_atual
  AND r.status   = 'Em Andamento'
LEFT JOIN producao_problemas prob  ON prob.pedido_id = pp.id
GROUP BY pp.id, cc.id, p."ID_PEDIDO";

COMMENT ON VIEW dashboard_pedidos IS
  'View principal do HNT-Ops. Une produção, cliente e produto para o dashboard.';


-- ─────────────────────────────────────────────────────────────
-- STEP 12: ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE producao_pedidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_rastreamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_problemas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_mensagens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_configuracoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notificacoes    ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler e operar tabelas de produção
CREATE POLICY "equipe_acessa_producao" ON producao_pedidos
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "equipe_acessa_rastreamento" ON producao_rastreamento
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "equipe_acessa_problemas" ON producao_problemas
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "equipe_acessa_mensagens" ON producao_mensagens
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "equipe_ve_notificacoes" ON admin_notificacoes
  FOR SELECT TO authenticated USING (TRUE);

-- Configurações: somente gestor/admin
CREATE POLICY "somente_admin_configura" ON admin_configuracoes
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ─────────────────────────────────────────────────────────────
-- STEP 11: API DE CONSULTA P/ IA DE VENDAS (READ-ONLY)
-- ─────────────────────────────────────────────────────────────

-- View otimizada para o Chatbot do WhatsApp/N8N
-- Filtra apenas informações que o cliente pode saber
CREATE OR REPLACE VIEW consulta_publica_pedidos AS
SELECT 
    p.numero_pedido,
    p.etapa_atual,
    p.urgente,
    p.prazo_entrega,
    p.cliente_nome,
    -- Ofuscação parcial do CPF para segurança extra
    overlay(p.cliente_cpf placing '***.***' from 5 for 7) as cpf_mascarado,
    CASE 
        WHEN p.prazo_entrega < CURRENT_DATE THEN 'Atrasado'
        WHEN p.prazo_entrega = CURRENT_DATE THEN 'Entrega Hoje'
        ELSE 'No Prazo'
    END as status_prazo
FROM 
    producao_pedidos p;

COMMENT ON VIEW consulta_publica_pedidos IS 'View segura para consulta via IA de Vendas (WhatsApp/N8N)';

-- ─────────────────────────────────────────────────────────────
-- STEP 12: GESTÃO DE ACESSOS E AUDITORIA (LOGS)
-- ─────────────────────────────────────────────────────────────

-- Tabela de Operadores/Usuários do Sistema
CREATE TABLE IF NOT EXISTS producao_operadores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        TEXT NOT NULL,
    usuario     TEXT UNIQUE NOT NULL,
    senha       TEXT NOT NULL, -- Em produção deve ser hash, aqui usaremos texto p/ facilidade
    perfil      TEXT NOT NULL CHECK (perfil IN ('Admin', 'Gerente', 'Operador')),
    setor       TEXT,
    ativo       BOOLEAN DEFAULT TRUE,
    criado_em   TIMESTAMPTZ DEFAULT NOW(),
    ultimo_login TIMESTAMPTZ
);

-- Tabela de Logs de Acesso
CREATE TABLE IF NOT EXISTS admin_login_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operador_id     UUID REFERENCES producao_operadores(id) ON DELETE SET NULL,
    nome_operador   TEXT,
    data_login      TIMESTAMPTZ DEFAULT NOW(),
    equipamento     TEXT, -- User Agent / Device Info
    ip_address      TEXT,
    sucesso         BOOLEAN DEFAULT TRUE
);

-- Inserção de Usuários Iniciais
INSERT INTO producao_operadores (nome, usuario, senha, perfil, setor) VALUES
('Elder Bianco', 'elder', 'admin123', 'Admin', 'Gestão'),
('Patrícia L.', 'patricia', 'gerente123', 'Gerente', 'Arte'),
('Marcos T.', 'marcos', 'op123', 'Operador', 'Bordado')
ON CONFLICT (usuario) DO NOTHING;

COMMENT ON TABLE producao_operadores IS 'Usuários com acesso ao sistema HNT-Ops.';
COMMENT ON TABLE admin_login_logs IS 'Audit log de quem acessou o sistema e em qual equipamento.';

-- ─────────────────────────────────────────────────────────────
-- Tabela de Configurações Gerais do Admin
CREATE TABLE IF NOT EXISTS admin_config (
    chave       TEXT PRIMARY KEY,
    valor       TEXT NOT NULL,
    descricao   TEXT,
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Milestones de SLA por Etapa
-- Define quantos dias após o pedido a etapa deve estar concluída
CREATE TABLE IF NOT EXISTS admin_sla_milestones (
    etapa           etapa_producao PRIMARY KEY,
    dias_limite     INTEGER NOT NULL DEFAULT 1,
    atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Inserção de Configurações Iniciais
INSERT INTO admin_config (chave, valor, descricao) VALUES
('prazo_maximo_entrega', '15', 'Prazo máximo prometido ao cliente (em dias)')
ON CONFLICT (chave) DO NOTHING;

-- Inserção de SLA Inicial (Baseado na imagem do usuário como exemplo)
INSERT INTO admin_sla_milestones (etapa, dias_limite) VALUES
('Preparacao', 3),
('Separacao', 5),
('Arte', 8),
('Bordado', 10),
('Costura', 12),
('Qualidade', 14),
('Expedicao', 15)
ON CONFLICT (etapa) DO NOTHING;

COMMENT ON TABLE admin_config IS 'Configurações globais do dashboard administrativo';
COMMENT ON TABLE admin_sla_milestones IS 'Metas de SLA: dias úteis desde o pedido para conclusão de cada etapa';
-- ─────────────────────────────────────────────────────────────
-- FIM DO SCRIPT — HNT-OPS FASE 1 ✅
-- ─────────────────────────────────────────────────────────────

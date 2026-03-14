-- ============================================================
--   HNT-OPS — Migration: Fase 4 — Fichas de Produção Robustas
--   STATUS: 🚧 STUB — NÃO EXECUTAR — AGUARDANDO FASE 4
--   Criado em: 2026-03-14
--   Descrição: Adiciona suporte a artes aprovadas nas fichas
-- ============================================================

-- INSTRUÇÕES:
-- 1. Revisar colunas antes de executar em produção
-- 2. Criar bucket 'artes-aprovadas' no Supabase Storage
-- 3. Configurar políticas de acesso do bucket
-- 4. Só então executar este arquivo via supabase CLI ou dashboard

-- TODO - Fase 4a: Colunas de arte aprovada
/*
ALTER TABLE producao_pedidos
    ADD COLUMN IF NOT EXISTS link_arte_aprovada  text,
    ADD COLUMN IF NOT EXISTS arte_aprovada_em    timestamptz,
    ADD COLUMN IF NOT EXISTS arte_aprovada_por   text,
    ADD COLUMN IF NOT EXISTS link_mockup_cliente text; -- URL do mockup enviado pelo cliente
*/

-- TODO - Fase 7: Tabela de configuração de notificações
/*
CREATE TABLE IF NOT EXISTS admin_notificacoes (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo            text NOT NULL,
    ativo           boolean DEFAULT true,
    webhook_url     text,
    whatsapp_numero text,
    template_msg    text,
    criado_em       timestamptz DEFAULT now()
);

-- Seed inicial
INSERT INTO admin_notificacoes (tipo, ativo, template_msg) VALUES
    ('pendencia',     true,  '🚨 PENDÊNCIA | {pedido} | {etapa_anterior} → Pendência\nCliente: {cliente}\nHorário: {horario}'),
    ('sla_vermelho',  false, '🔴 SLA CRÍTICO | {pedido} | {diasRestantes}d restantes\nCliente: {cliente}'),
    ('expedicao',     false, '✅ EXPEDIDO | {pedido} | Pronto para entrega\nCliente: {cliente}')
ON CONFLICT DO NOTHING;
*/

-- TODO - Fase 7: Trigger de notificação de pendência
/*
CREATE OR REPLACE FUNCTION fn_notify_pendencia()
RETURNS TRIGGER AS $$
DECLARE
    v_webhook_url text;
BEGIN
    IF NEW.etapa_atual = 'Pendencia' AND OLD.etapa_atual != 'Pendencia' THEN
        SELECT webhook_url INTO v_webhook_url
        FROM admin_notificacoes
        WHERE tipo = 'pendencia' AND ativo
        LIMIT 1;

        IF v_webhook_url IS NOT NULL THEN
            PERFORM net.http_post(
                url  := v_webhook_url,
                body := json_build_object(
                    'pedido_id',       NEW.id,
                    'numero',          NEW.numero_pedido,
                    'cliente',         NEW.cliente_nome,
                    'etapa_anterior',  OLD.etapa_atual,
                    'timestamp',       NOW()
                )::text,
                headers := '{"Content-Type": "application/json"}'::jsonb
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trig_notify_pendencia ON producao_pedidos;
CREATE TRIGGER trig_notify_pendencia
    AFTER UPDATE ON producao_pedidos
    FOR EACH ROW EXECUTE FUNCTION fn_notify_pendencia();
*/

-- Nota: Requer extensão pg_net no Supabase (disponível por padrão)
-- Verificar: SELECT * FROM pg_extension WHERE extname = 'pg_net';

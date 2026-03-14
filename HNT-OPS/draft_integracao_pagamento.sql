/* 
  =============================================================
  DRAFT: INTEGRAÇÃO SIMULADOR DE VENDAS -> HNT-OPS
  =============================================================
  ATENÇÃO: Este script é um RASCUNHO (Draft) e não deve ser
  aplicado até que o módulo de pagamento do Simulador de Vendas
  (SimuladorHNT) esteja operando com um campo de status no banco.

  Este Trigger SQL ficará vigiando a tabela de 'vendas' do simulador. 
  Quando o cliente aprovar o pagamento, o pedido "cai" silenciosamente 
  e automaticamente na tela do chão de fábrica (HNT-Ops). 
*/

-- Passo 1: Criar a Função que captura a Venda Paga
CREATE OR REPLACE FUNCTION trg_enviar_para_producao()
RETURNS TRIGGER AS $$
BEGIN
    -- Vamos assumir que no Simulador a tabela se chama "pedidos_venda" 
    -- e o campo que define o pagamento seja "status". 
    -- O if verifica se "Tornou-se Pago" só naquele exato momento.
    IF NEW.status = 'Aprovado' AND OLD.status <> 'Aprovado' THEN
    
        -- Insere uma "Ficha de Produção" na tabela do HNT-Ops
        INSERT INTO public.producao_pedidos (
            numero,             -- Número do pedido (ex: HNT-1234)
            sku,                -- Código SKU do Produto da Venda
            cliente_nome,       -- Nome puxado do carrinho
            cliente_celular,    
            cliente_cpf,
            tecnica,
            tamanho,
            quantidade,
            link_pdf,           -- O PDF Gerado pelo simulador 3D
            valor,              -- O valor total do pedido  
            prazo_entrega,      -- Hoje + N Dias de produção (Exemplo fixo: 15 dias)
            etapa_atual         -- Etapa inicial
        ) VALUES (
            NEW.numero_pedido, 
            COALESCE(NEW.produto_sku, 'SKU-INDEFINIDO'), 
            NEW.cliente_nome, 
            NEW.cliente_celular, 
            NEW.cliente_cpf,
            'Indefinida', 
            COALESCE(NEW.tamanho, 'U'), 
            COALESCE(NEW.quantidade, 1),
            NEW.link_mockup_pdf, 
            NEW.valor_total,
            (CURRENT_DATE + INTERVAL '15 days'), 
            'Preparacao'
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 2: Vincular o Gatilho à tabela do E-commerce (exemplo: `pedidos_venda`)
/*
CREATE TRIGGER tg_nova_venda_aprovada
AFTER UPDATE ON public.pedidos_venda
FOR EACH ROW
EXECUTE FUNCTION trg_enviar_para_producao();
*/

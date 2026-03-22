-- 🔐 HNT SIMULATOR: SECURITY POLICIES (RLS)
-- Execute este script no SQL Editor do seu Dashboard Supabase.

-- 1. Ativar RLS nas tabelas principais
ALTER TABLE IF EXISTS public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes_cadastrados ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'clientes_cadastrados'
-- Permitir que qualquer pessoa insira um novo cadastro (público)
CREATE POLICY "Enable insert for anonymous users" 
ON public.clientes_cadastrados FOR INSERT 
WITH CHECK (true);

-- Permitir que usuários visualizem apenas seus próprios dados (baseado no e-mail ou auth_user_id)
CREATE POLICY "Users can view own data" 
ON public.clientes_cadastrados FOR SELECT 
USING (auth.uid() = auth_user_id);

-- 3. Políticas para 'pedidos'
-- Permitir inserção anônima (para o fluxo de simulação)
CREATE POLICY "Enable insert for everyone" 
ON public.pedidos FOR INSERT 
WITH CHECK (true);

-- Permitir visualização apenas de pedidos vinculados ao auth_user_id do usuário logado
CREATE POLICY "Users can view own orders" 
ON public.pedidos FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Permitir exclusão apenas de seus próprios pedidos
CREATE POLICY "Users can delete own orders" 
ON public.pedidos FOR DELETE 
USING (auth.uid() = auth_user_id);

-- ⚠️ IMPORTANTE: O Painel Admin/HNT-OPS deve usar a 'service_role' key para ignorar estas restrições 
-- e visualizar todos os pedidos, ou possuir funções de banco (Database Functions) autorizadas.

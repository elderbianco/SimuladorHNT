# HNT-OPS: Sandbox Data Seeder
# Gera 100 pedidos fictícios no Supabase para testes de estresse e lógica de prioridade.

$SUPABASE_URL = "https://sflllqfytzpwgnaksvkj.supabase.co"
$SUPABASE_KEY = "sb_publishable_LaBMdoSK9HGEjLBbeKxXiA_vy2EnlxY" # Usando anon key para inserção permitida por RLS ou service role se necessário

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$skus = @("SHR-FGT", "TSH-BTCO", "RGD-LNG", "TOP-FGT", "MLT-FGT")
$clientes = @("João Silva", "Maria Oliveira", "Carlos Souza", "Ana Costa", "Pedro Santos", "Juliana Lima", "Ricardo Rocha", "Fernanda Alves")
$etapas = @("Preparacao", "Separacao", "Arte", "Bordado", "Costura", "Qualidade", "Expedicao")
$tecnicas = @("Bordado", "DTF", "Bordado e DTF", "Sublimacao")

Write-Host "--- Iniciando Geração de 100 Pedidos Sandbox ---" -ForegroundColor Cyan

for ($i = 1; $i -le 100; $i++) {
    $sku = $skus[(Get-Random -Maximum $skus.Count)]
    $cliente = $clientes[(Get-Random -Maximum $clientes.Count)]
    $etapa = $etapas[(Get-Random -Maximum $etapas.Count)]
    $tecnica = $tecnicas[(Get-Random -Maximum $tecnicas.Count)]
    $qtd = Get-Random -Minimum 1 -Maximum 10
    $urgente = (Get-Random -Maximum 10) -lt 2 # 20% de chance de ser urgente
    
    # Prazo entre -2 e +15 dias
    $prazoDays = Get-Random -Minimum -2 -Maximum 16
    $prazo = (Get-Date).AddDays($prazoDays).ToString("yyyy-MM-dd")

    $body = @{
        "pedido_origem_id" = "SANDBOX-$i"
        "sku" = $sku
        "cliente_nome" = $cliente
        "quantidade" = $qtd
        "etapa_atual" = $etapa
        "tecnica" = $tecnica
        "urgente" = $urgente
        "prazo_entrega" = $prazo
        "observacoes" = "Pedido gerado via script de Sandbox."
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/producao_pedidos" -Method Post -Headers $headers -Body $body
        Write-Host "[$i/100] Pedido inserido: $cliente - SKU: $sku (Status: OK)" -ForegroundColor Green
    } catch {
        Write-Host "[$i/100] Erro ao inserir pedido: $_" -ForegroundColor Red
    }
}

Write-Host "--- Sandbox Populado com Sucesso! ---" -ForegroundColor Cyan

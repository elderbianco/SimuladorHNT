# Script para sincronizar agentes locais com globais
# Uso: .\sync-agents-global.ps1

$globalPath = "C:\Users\Nitro v15\.gemini\antigravity"
$localPath = ".agent"

Write-Host "`n🌍 Sincronizador de Agentes Globais" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Criar diretórios globais se não existirem
Write-Host "📁 Verificando diretórios globais..." -ForegroundColor Yellow
@('agents', 'skills', 'workflows') | ForEach-Object {
    $dir = Join-Path $globalPath $_
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  ✅ Criado: $dir" -ForegroundColor Green
    }
    else {
        Write-Host "  ✓ Existe: $dir" -ForegroundColor Gray
    }
}

# Copiar agentes
Write-Host "`n📦 Copiando agentes..." -ForegroundColor Yellow
$agentFiles = Get-ChildItem "$localPath\agents\*.md" -ErrorAction SilentlyContinue
if ($agentFiles) {
    Copy-Item "$localPath\agents\*.md" "$globalPath\agents\" -Force
    Write-Host "  ✅ $($agentFiles.Count) agentes copiados!" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Nenhum agente encontrado" -ForegroundColor Yellow
}

# Copiar skills
Write-Host "`n🎯 Copiando skills..." -ForegroundColor Yellow
if (Test-Path "$localPath\skills") {
    Copy-Item "$localPath\skills\*" "$globalPath\skills\" -Recurse -Force
    Write-Host "  ✅ Skills copiadas!" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Nenhuma skill encontrada" -ForegroundColor Yellow
}

# Copiar workflows
Write-Host "`n🔄 Copiando workflows..." -ForegroundColor Yellow
$workflowFiles = Get-ChildItem "$localPath\workflows\*.md" -ErrorAction SilentlyContinue
if ($workflowFiles) {
    Copy-Item "$localPath\workflows\*.md" "$globalPath\workflows\" -Force
    Write-Host "  ✅ $($workflowFiles.Count) workflows copiados!" -ForegroundColor Green
}
else {
    Write-Host "  ⚠️  Nenhum workflow encontrado" -ForegroundColor Yellow
}

Write-Host "`n🎉 Sincronização concluída!" -ForegroundColor Green
Write-Host "`nAgentes agora disponíveis globalmente em:" -ForegroundColor Cyan
Write-Host "  $globalPath" -ForegroundColor White

Write-Host "`n📋 Resumo:" -ForegroundColor Cyan
Write-Host "  Agentes: " -NoNewline -ForegroundColor Gray
Get-ChildItem "$globalPath\agents\*.md" | Measure-Object | ForEach-Object { Write-Host $_.Count -ForegroundColor White }
Write-Host "  Skills: " -NoNewline -ForegroundColor Gray
Get-ChildItem "$globalPath\skills" -Directory | Measure-Object | ForEach-Object { Write-Host $_.Count -ForegroundColor White }
Write-Host "  Workflows: " -NoNewline -ForegroundColor Gray
Get-ChildItem "$globalPath\workflows\*.md" | Measure-Object | ForEach-Object { Write-Host $_.Count -ForegroundColor White }

Write-Host "`n✨ Pronto para usar em qualquer projeto!" -ForegroundColor Green

# 🌍 Guia de Agentes Globais vs Locais

## 📍 Estrutura de Diretórios

### Agentes Globais

```
C:\Users\Nitro v15\.gemini\antigravity\
├── agents\           ← Agentes globais (todos os projetos)
├── skills\           ← Skills globais
├── workflows\        ← Workflows globais
└── docs\             ← Documentação dos agentes
```

### 🤖 Agentes e Recursos do Projeto

> **Localização Global:** `C:\Users\Nitro v15\.gemini\antigravity\agents\`

```
C:\Users\Nitro v15\.gemini\antigravity\scratch\SimulatorHNT\
└── .agent\
    ├── agents\       ← Agentes específicos deste projeto
    ├── skills\       ← Skills específicas
    └── workflows\    ← Workflows específicos
```

---

## 🔄 Como Mover Agentes para Global

### Método 1: Copiar Manualmente

**Passo 1:** Criar diretório global (se não existir)

```powershell
# Executar no PowerShell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.antigravity\agents"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.antigravity\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.antigravity\workflows"
```

**Passo 2:** Copiar agentes desejados

```powershell
# Copiar agentes específicos
Copy-Item ".agent\agents\*.pt.md" "$env:USERPROFILE\.antigravity\agents\"

# Ou copiar todos
Copy-Item ".agent\agents\*" "$env:USERPROFILE\.antigravity\agents\" -Recurse
```

**Passo 3:** Copiar skills e workflows

```powershell
Copy-Item ".agent\skills\*" "$env:USERPROFILE\.antigravity\skills\" -Recurse
Copy-Item ".agent\workflows\*" "$env:USERPROFILE\.antigravity\workflows\" -Recurse
```

---

### Método 2: Script Automatizado

Criei um script para você fazer isso automaticamente:

**Arquivo:** `sync-agents-global.ps1`

```powershell
# Script para sincronizar agentes locais com globais

$globalPath = "$env:USERPROFILE\.antigravity"
$localPath = ".agent"

# Criar diretórios globais se não existirem
@('agents', 'skills', 'workflows') | ForEach-Object {
    $dir = Join-Path $globalPath $_
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "✅ Criado: $dir" -ForegroundColor Green
    }
}

# Copiar agentes
Write-Host "`n📦 Copiando agentes..." -ForegroundColor Cyan
Copy-Item "$localPath\agents\*.md" "$globalPath\agents\" -Force
Write-Host "✅ Agentes copiados!" -ForegroundColor Green

# Copiar skills
Write-Host "`n🎯 Copiando skills..." -ForegroundColor Cyan
Copy-Item "$localPath\skills\*" "$globalPath\skills\" -Recurse -Force
Write-Host "✅ Skills copiadas!" -ForegroundColor Green

# Copiar workflows
Write-Host "`n🔄 Copiando workflows..." -ForegroundColor Cyan
Copy-Item "$localPath\workflows\*.md" "$globalPath\workflows\" -Force
Write-Host "✅ Workflows copiados!" -ForegroundColor Green

Write-Host "`n🎉 Sincronização concluída!" -ForegroundColor Green
Write-Host "Agentes agora disponíveis globalmente em:" -ForegroundColor Yellow
Write-Host $globalPath -ForegroundColor White
```

**Como usar:**

```powershell
# No diretório do projeto
.\sync-agents-global.ps1
```

---

## 🎯 Prioridade de Carregamento

Quando você usa um agente, o Antigravity procura nesta ordem:

1. **Agentes Locais** (`.agent/agents/`) - Prioridade ALTA
2. **Agentes Globais** (`~/.antigravity/agents/`) - Prioridade MÉDIA

**Vantagem:** Você pode ter uma versão global e sobrescrever localmente se necessário!

---

## 💡 Estratégia Recomendada

### Agentes Globais (Todos os Projetos)

✅ **Manter globalmente:**

- Backend Specialist
- Frontend Specialist
- Debugger
- Performance Optimizer
- Test Engineer
- DevOps Engineer
- Security Auditor
- Documentation Writer
- Code Archaeologist
- Project Planner

### Agentes Locais (Projeto Específico)

📍 **Manter apenas no SimulatorHNT:**

- E-commerce Specialist (customizado para este projeto)
- Payment Integration Specialist (configurações específicas)
- Image Processing Specialist (otimizado para uploads do simulador)
- Analytics Engineer (métricas específicas)
- Email Marketing Specialist (templates do projeto)

---

## 🔧 Configuração Avançada

### Criar Alias para Agentes Globais

**Arquivo:** `$env:USERPROFILE\.antigravity\config.json`

```json
{
  "agents": {
    "aliases": {
      "debug": "debugger",
      "test": "test-engineer",
      "backend": "backend-specialist",
      "frontend": "frontend-specialist",
      "ecom": "ecommerce-specialist"
    }
  },
  "defaultAgents": [
    "debugger",
    "frontend-specialist",
    "backend-specialist"
  ]
}
```

**Uso com alias:**

```
"debug, encontre o problema no pricing.js"
"backend, crie uma API para pedidos"
```

---

## 📋 Checklist de Migração

### Para Tornar Agentes Globais

- [ ] Criar diretório `~/.antigravity/agents`
- [ ] Copiar agentes desejados
- [ ] Testar em outro projeto
- [ ] Configurar aliases (opcional)
- [ ] Documentar quais são globais vs locais

### Para Manter Sincronizado

- [ ] Criar script de sincronização
- [ ] Executar após criar novos agentes
- [ ] Versionar agentes importantes
- [ ] Fazer backup regularmente

---

## 🚀 Comandos Rápidos

### Listar Agentes Globais

```powershell
Get-ChildItem "$env:USERPROFILE\.antigravity\agents" -Name
```

### Listar Agentes Locais

```powershell
Get-ChildItem ".agent\agents" -Name
```

### Verificar Duplicatas

```powershell
# Ver quais agentes existem em ambos os lugares
$global = Get-ChildItem "$env:USERPROFILE\.antigravity\agents" -Name
$local = Get-ChildItem ".agent\agents" -Name
Compare-Object $global $local -IncludeEqual
```

---

## ⚠️ Cuidados

### ❌ Evite

- Sobrescrever agentes globais sem backup
- Misturar versões incompatíveis
- Perder customizações locais

### ✅ Boas Práticas

- Versionar agentes importantes
- Documentar customizações
- Fazer backup antes de sincronizar
- Testar em projeto de teste primeiro

---

## 🎯 Exemplo Prático

### Cenário: Novo Projeto React

```powershell
# 1. Criar novo projeto
npx create-react-app meu-projeto
cd meu-projeto

# 2. Agentes globais já estão disponíveis!
# Não precisa copiar nada

# 3. Usar agentes globais
"Frontend Specialist, configure o projeto React"
"Test Engineer, crie testes para os componentes"

# 4. Criar agentes específicos do projeto (se necessário)
# Eles ficam em meu-projeto/.agent/agents/
```

---

## 📞 Suporte

**Dúvidas?**

- Consulte: [GUIA_DE_USO.md](GUIA_DE_USO.md)
- Veja: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**Última atualização:** 14/02/2026
**Versão:** 1.0.0

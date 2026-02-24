# 🧪 Guia de Testes Manuais - Top Simulator Refatorado

## ⚠️ Nota sobre Testes Automatizados no Navegador

O teste automatizado no navegador falhou devido a problema de configuração do ambiente (`$HOME` não definido).

**Solução:** Testes manuais seguindo este guia.

---

## ✅ Testes Automatizados (Concluídos)

### Resultado: 100% de Sucesso

```
📊 RESULTADOS DOS TESTES
==================================================
✅ Passou: 36
❌ Falhou: 0
📈 Total: 36
🎯 Taxa de Sucesso: 100.00%
==================================================
```

### Componentes Testados

1. **DOMHelpers** (8 testes) ✅
   - createElement
   - addClass/removeClass
   - show/hide
   - clearElement

2. **ImageValidator** (6 testes) ✅
   - Validação de tipo
   - Validação de tamanho
   - Validação completa

3. **FormatHelpers** (5 testes) ✅
   - formatCurrency
   - formatNumber
   - formatCPF
   - formatPhone

4. **ColorPicker** (4 testes) ✅
   - Inicialização
   - Integração com config
   - Seleção de cor
   - Callback

5. **ImageUploader** (5 testes) ✅
   - Inicialização
   - Integração com config
   - Upload/remoção de imagem
   - getPriceFunction

6. **TextControls** (5 testes) ✅
   - Inicialização
   - Integração com config
   - Atualização de valores
   - Callback com preço
   - Clear

7. **Integração state.config** (3 testes) ✅
   - getZonePrice para logos
   - getZonePrice para textos
   - Componentes usando getZonePrice

---

## 📋 Checklist de Testes Manuais

### 1. Abrir o Simulador

```
http://localhost:3000/Top.html
```

**Verificar:**

- [ ] Página carrega sem erros no console
- [ ] Interface aparece corretamente
- [ ] IDs de simulação e pedido são gerados

---

### 2. Testar Seleção de Cores

**Passos:**

1. Localizar seção "Cor do Top"
2. Clicar em diferentes cores
3. Observar preview do produto

**Verificar:**

- [ ] Cores são exibidas em grid
- [ ] Cor selecionada mostra checkmark (✓)
- [ ] Preview atualiza ao selecionar cor
- [ ] Apenas cores permitidas pelo Admin aparecem

**Integração com Admin:**

- [ ] Abrir Admin em outra aba
- [ ] Desabilitar uma cor
- [ ] Voltar ao simulador
- [ ] Verificar se cor desabilitada sumiu

---

### 3. Testar Tamanhos e Quantidade

**Passos:**

1. Localizar seção "Tamanhos e Quantidade"
2. Inserir quantidades em diferentes tamanhos
3. Observar cálculo de preço

**Verificar:**

- [ ] Todos os tamanhos aparecem (PP, P, M, G, GG, EXG, etc.)
- [ ] Tamanhos grandes mostram acréscimo (ex: +R$ 5,00)
- [ ] Preço atualiza ao mudar quantidade
- [ ] Desconto atacado aplica (10, 20, 30 peças)

**Teste de Preços:**

```
Cenário 1: 5 peças tamanho M
- Preço base: R$ 129,90/un
- Total: R$ 649,50

Cenário 2: 15 peças tamanho M
- Preço atacado (10+): R$ 115,90/un
- Total: R$ 1.738,50
- Desconto: ~10%

Cenário 3: 2 peças GG
- Preço base: R$ 129,90
- Acréscimo tamanho: +R$ 5,00
- Total: R$ 269,80 (R$ 134,90/un)
```

**Integração com Admin:**

- [ ] Abrir Admin
- [ ] Alterar preço base de R$ 129,90 para R$ 140,00
- [ ] Voltar ao simulador
- [ ] Verificar se preço atualizou automaticamente

---

### 4. Testar Personalização (Logos)

**Passos:**

1. Localizar seção "Personalização"
2. Clicar em "ENVIAR ARQUIVO" para frente
3. Selecionar uma imagem
4. Observar preview e preço

**Verificar:**

- [ ] Zonas aparecem (Frente Centro, Costas Centro)
- [ ] Preço da zona é exibido (ex: +R$ 15,00)
- [ ] Botão "ENVIAR ARQUIVO" funciona
- [ ] Botão "BANCO IMAGENS" funciona
- [ ] Preview da imagem aparece no produto
- [ ] Taxa de desenvolvimento aparece (+R$ 30,00)
- [ ] Slider de tamanho funciona
- [ ] Botão "REMOVER IMAGEM" funciona
- [ ] Checkbox "Limites" funciona

**Teste de Preços:**

```
Cenário: 10 peças + Logo Frente
- Base: R$ 115,90/un (atacado 10+)
- Logo Frente: +R$ 15,00/un
- Taxa Dev: +R$ 30,00 (total)
- Isenção: -R$ 30,00 (>10 peças)
- Total: R$ 1.309,00
```

**Integração com Admin:**

- [ ] Abrir Admin
- [ ] Alterar "Logo Frente" de R$ 15,00 para R$ 20,00
- [ ] Voltar ao simulador
- [ ] Verificar se preço da zona atualizou

---

### 5. Testar Personalização (Textos)

**Passos:**

1. Localizar controles de texto (abaixo de cada zona)
2. Digitar texto
3. Selecionar fonte
4. Selecionar cor
5. Ajustar tamanho

**Verificar:**

- [ ] Input de texto funciona
- [ ] Seletor de fonte mostra fontes ativas
- [ ] Seletor de cor funciona
- [ ] Slider de tamanho funciona
- [ ] Preview atualiza em tempo real
- [ ] Preço de texto é adicionado (+R$ 15,00)
- [ ] Checkbox "Limites" funciona

**Teste de Preços:**

```
Cenário: 10 peças + Texto Frente
- Base: R$ 115,90/un (atacado 10+)
- Texto Frente: +R$ 15,00/un
- Total: R$ 1.309,00
```

---

### 6. Testar Cálculo de Preço Total

**Passos:**

1. Configurar pedido completo:
   - 15 peças (tamanhos variados)
   - Logo frente (upload)
   - Texto costas
2. Observar resumo de preço

**Verificar:**

- [ ] Preço total aparece destacado
- [ ] Média por peça é calculada
- [ ] Desconto atacado é aplicado
- [ ] Taxa de desenvolvimento aparece
- [ ] Isenção de taxa (>10 peças) funciona
- [ ] Resumo detalhado mostra todos os itens

**Exemplo de Resumo Esperado:**

```
TOTAL FINAL: R$ 2.118,50
Média: R$ 141,23/un

Detalhamento:
- 15 peças (tamanhos variados)
- Desconto Atacado: 10% (-R$ 194,85)
- Logo Frente: +R$ 15,00/un
- Texto Costas: +R$ 15,00/un
- Taxa Matriz: +R$ 30,00
- Isenção: -R$ 30,00
```

---

### 7. Testar Observações e Termos

**Passos:**

1. Adicionar observações
2. Aceitar termos e condições

**Verificar:**

- [ ] Textarea de observações funciona
- [ ] Texto é salvo ao digitar
- [ ] Checkbox de termos funciona
- [ ] Não permite adicionar ao carrinho sem aceitar termos

---

### 8. Testar Adicionar ao Carrinho

**Passos:**

1. Configurar pedido completo
2. Aceitar termos
3. Clicar em "ADICIONAR AO CARRINHO"

**Verificar:**

- [ ] Validação de telefone funciona
- [ ] PDF é gerado em segundo plano
- [ ] Pedido é salvo no localStorage
- [ ] Confirmação aparece
- [ ] Opção de ir para página de pedidos

---

### 9. Testar Sincronização com Admin

**Teste Completo de Sincronização:**

1. **Abrir duas abas:**
   - Aba 1: Admin (`admin.html`)
   - Aba 2: Top Simulator (`Top.html`)

2. **No Admin, alterar:**
   - Preço base: R$ 129,90 → R$ 140,00
   - Logo Frente: R$ 15,00 → R$ 20,00
   - Taxa Dev: R$ 30,00 → R$ 35,00

3. **Voltar ao Simulador:**
   - [ ] Preços atualizaram automaticamente
   - [ ] Não precisa recarregar página
   - [ ] Cálculo total está correto

---

### 10. Testar Botão Limpar

**Passos:**

1. Configurar pedido completo
2. Clicar em "LIMPAR"
3. Confirmar

**Verificar:**

- [ ] Todos os campos são resetados
- [ ] Imagens são removidas
- [ ] Textos são limpos
- [ ] Novo ID de simulação é gerado
- [ ] Preço volta ao padrão

---

## 🐛 Problemas Conhecidos

### Nenhum problema conhecido no momento

Se encontrar algum problema, documente aqui:

**Problema:** [Descrição]  
**Passos para Reproduzir:** [Lista]  
**Comportamento Esperado:** [Descrição]  
**Comportamento Atual:** [Descrição]

---

## ✅ Checklist Final

Após completar todos os testes acima:

- [ ] Todos os testes de cores passaram
- [ ] Todos os testes de tamanhos passaram
- [ ] Todos os testes de personalização passaram
- [ ] Todos os testes de preços passaram
- [ ] Sincronização com Admin funciona
- [ ] Adicionar ao carrinho funciona
- [ ] Nenhum erro no console

---

## 📊 Resultado Esperado

Se todos os testes passarem, você deve ter:

✅ **Interface funcional** com todos os controles  
✅ **Preços dinâmicos** sincronizados com Admin  
✅ **Cálculos corretos** incluindo descontos e taxas  
✅ **Preview em tempo real** de todas as customizações  
✅ **Persistência** de dados no localStorage  
✅ **Geração de PDF** automática ao adicionar ao carrinho

---

## 🚀 Próximos Passos

Após validar manualmente:

1. Aplicar refatoração aos outros 6 simuladores
2. Criar testes E2E com Playwright (quando ambiente estiver configurado)
3. Documentar padrões de uso para novos simuladores

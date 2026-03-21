# Plano de Implementação: Correção de Observações e Valores no Carrinho

O objetivo é garantir que as observações inseridas pelo cliente e os preços das zonas de logo sejam exibidos corretamente no dashboard do carrinho.

## 1. Análise do Problema

* **Observações:** Atualmente, as observações são salvas no objeto `state` (como `state.observations` ou `state.observacoes`), mas parecem estar ausentes ou escondidas na interface do carrinho. Precisamos garantir visibilidade em locais estratégicos (aba de Produto e aba de Logos/Textos).
* **Valores (Preços):** Identificamos um erro de sensibilidade a maiúsculas/minúsculas na comparação das chaves das zonas de logo (ex: `LOGO CENTRO` vs `centro`). Além disso, os preços extras não estavam sendo carregados corretamente por falta do objeto `config` no backup do pedido.

## 2. Tarefas e Mudanças Sugeridas

### `js/modules/cart/cart-ui.js`

* [ ] **Aba de Produto & Cores:** Adicionar um bloco de destaque para as observações logo abaixo da lista de cores.
* [ ] **Aba de Logos & Textos:** Incluir as observações como o último item desta aba para conferência técnica.
* [ ] **Relatório de Valores:** Aplicar normalização de texto (`toLowerCase`) em todas as verificações de zona para garantir a aplicação dos preços do `config`.

### `js/modules/common/db-adapter.js` (Concluído em turnos anteriores)

* [x] Incluir o objeto `config` completo no `DADOS_TECNICOS_JSON` para preservar preços e regras no momento da simulação.

## 3. Verificação

* [ ] Adicionar um item com observações e verificar se aparecem nas abas.
* [ ] Verificar se logomarcas centrais e laterais exibem os preços corretos (não agnósticos ao caso).


## 📝 REGRA GLOBAL: Atualização de Versão
Sempre que houver qualquer modificação no projeto, o número da versão (ex: v14.12 -> v14.13) DEVE obrigatoriamente ser atualizado globalmente no HTML e JS.
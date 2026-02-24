# Relatório de Auditoria Técnica - SimulatorHNT

**Data:** 08/02/2026
**Escopo:** Análise completa da pasta `SimulatorHNT`

## 1. Visão Geral Executiva

O projeto `SimulatorHNT` é uma aplicação web de personalização de produtos esportivos (Shorts, Leggings, Tops, Moletom). A arquitetura evoluiu para um sistema modular (`js/modules`), o que é um ponto muito positivo. O sistema opera em um modelo híbrido/local, utilizando um servidor Node.js leve (`server.js`) para operações de sistema de arquivos e `localStorage` para persistência de estado.

Embora funcional e resiliente em produção, o código apresenta **alta duplicação** (principalmente na área administrativa) e um **acoplamento forte** entre a lógica de negócios e a renderização de interface, o que dificulta a manutenção e testes automatizados.

---

## 2. Pontos Positivos (O Que Manter)

1. **Arquitetura Modular (`js/modules`)**:
    * A separação em `common`, `shorts`, `top`, etc., é excelente. Módulos como `emb-manager.js`, `pdf-generator.js` e `db-integration.js` demonstram boa separação de responsabilidades.
    * **Destaque:** `pdf-generator.js` possui uma lógica de "Circuit Breaker" e fallbacks (html2canvas -> dom-to-image) robusta, garantindo que o usuário raramente fique sem o PDF.

2. **Resiliência e Fallbacks**:
    * `asset-loader.js` evita que imagens quebradas "quebrem" a visualização, usando placeholders.
    * O sistema de restauração de pedidos (`checkForRestoration` em `logic.js`) é bem implementado, permitindo recuperar estados complexos.

3. **Configuração Centralizada (Admin)**:
    * A existência de um painel administrativo (`admin.html`) que controla preços e opções em todos os simuladores é vital para a operação. O uso de `localStorage` para compartilhar configs entre abas é uma solução pragmática e eficaz para o ambiente local.

4. **Sanitização Básica**:
    * O back-end (`server.js`) sanitiza nomes de arquivos (`replace(/[^a-zA-Z0-9-_]/g, '_')`) antes de salvar, mitigando riscos de *Path Traversal*.

---

## 3. Pontos Negativos (O Que Melhorar)

1. **Duplicação de Código Crítica**:
    * **Exemplo:** Os arquivos `js/admin/modules/shorts.js`, `legging.js`, `top.js` contêm 90% de código idêntico (funções `loadSettings`, `saveSettings`, `resetToTable`).
    * **Impacto:** Adicionar uma nova funcionalidade (ex: novo campo de taxa) exige alterar 5+ arquivos, aumentando drasticamente a chance de bugs por esquecimento.

2. **Acoplamento Lógica vs. UI**:
    * Arquivos como `ui-render.js` misturam concatenação de strings HTML com lógica de negócios (ex: cálculo de taxas dentro do loop de renderização).
    * **Impacto:** Torna o código difícil de ler e quase impossível de testar unitariamente sem um navegador.

3. **Estilização "Hardcoded"**:
    * Muito CSS está sendo injetado via JavaScript (`element.style.cssText = ...`).
    * **Impacto:** Dificulta a manutenção visual e a criação de temas (Dark Mode, etc). Deveria estar em classes CSS.

4. **Segurança e Validação no Back-end**:
    * O `server.js` aceita uploads em Base64 e salva cegamente. Embora sanitize o nome, não valida o "Magic Number" do arquivo para garantir que é realmente uma imagem ou PDF.
    * Endereços como `http://localhost:3000` estão "inseguros" (sem autenticação), o que é aceitável para uso local controlado, mas perigoso se exposto em rede.

5. **Código Legado e "Morto"**:
    * Existem funções comentadas e trechos de código antigo (versões anteriores de geradores de PDF) que poluem os arquivos e confundem novos desenvolvedores.

---

## 4. Sugestões e Mudanças Necessárias

### Imediato (Mudanças Necessárias - Alta Prioridade)

1. **Padronização de Erros no Admin**:
    * Corrigir a inconsistência onde `shorts.js` valida campos obrigatórios ao salvar, mas `legging.js` não. Implementar uma função de validação comum.
2. **Validação de Tipos no Servidor**:
    * No `server.js`, implementar verificação simples do cabeçalho Base64 (MIME type) antes de gravar o arquivo, rejeitando scripts ou executáveis disfarçados.

### Curto Prazo (Refatoração Recomendada)

1. **Refatoração do Admin (DRY)**:
    * Criar um `AdminConfigFactory`. Em vez de arquivos repetidos, ter um objeto de configuração (Schema) para cada produto e uma única lógica que gera a UI e salva os dados.
    * *Exemplo:* `AdminBuilder.createSection('shorts', shortsConfigSchema)`.
2. **Limpeza de Código**:
    * Remover todo o código comentado marcado como "Legacy" ou "V1" em `pdf-generator.js` e outros módulos.
    * Centralizar "Strings Mágicas" (nomes de chaves de localStorage) em um arquivo de constantes (`consts.js`).

### Longo Prazo (Evolução)

1. **Adoção de Framework Reativo (Vue.js ou React)**:
    * O tamanho e complexidade do `ui-render.js` justificam o uso de uma biblioteca como Vue.js (que pode ser usada via CDN sem build complexo) para gerenciar o estado da UI e evitar manipulação manual do DOM.
2. **Testes Unitários**:
    * Isolar a lógica pura (cálculo de preços, validação de regras) em arquivos que não dependam de `document` ou `window`, permitindo testes com Jest ou Vitest.

---

## 5. Conclusão

O projeto está em um estado **estável e funcional**, mas com **dívida técnica moderada** devido à duplicação. A modularização recente foi um grande passo na direção certa. O foco agora deve ser eliminar a repetição no Admin e "limpar" a mistura de HTML dentro do JavaScript para garantir longevidade e facilidade de manutenção.

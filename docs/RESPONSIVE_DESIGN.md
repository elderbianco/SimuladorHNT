# 📱 Design Responsivo - SimulatorHNT

Este documento detalha a implementação de responsividade no SimulatorHNT, incluindo estratégias de layout, breakpoints e boas práticas.

---

## 🎯 Objetivos

1. **Acessibilidade Universal**: Funcionar perfeitamente em qualquer dispositivo
2. **Performance**: Manter alta performance em dispositivos móveis
3. **Usabilidade**: Interface intuitiva em todas as resoluções
4. **Consistência**: Experiência uniforme entre plataformas

---

## 📐 Breakpoints

O sistema utiliza três breakpoints principais:

```css
/* Mobile First Approach */

/* Mobile: 320px - 767px (padrão) */
/* Estilos base aplicados a todos os dispositivos */

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
    /* Estilos para tablets */
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
    /* Estilos para desktops */
}
```

### Justificativa dos Breakpoints

- **320px**: Menor resolução de smartphone comum
- **768px**: Transição para tablets em modo retrato
- **1024px**: Transição para desktops e tablets em modo paisagem

---

## 🏗️ Estratégias de Layout

### 1. Mobile First

Todos os estilos são escritos primeiro para mobile, com media queries adicionando complexidade para telas maiores:

```css
/* Base (Mobile) */
.simulator-container {
    display: flex;
    flex-direction: column;
    padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
    .simulator-container {
        flex-direction: row;
        padding: 2rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .simulator-container {
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

### 2. Flexbox e Grid

Uso extensivo de Flexbox e CSS Grid para layouts flexíveis:

```css
/* Área de controles */
.controls-area {
    display: grid;
    grid-template-columns: 1fr; /* Mobile: 1 coluna */
    gap: 1rem;
}

@media (min-width: 768px) {
    .controls-area {
        grid-template-columns: repeat(2, 1fr); /* Tablet: 2 colunas */
    }
}

@media (min-width: 1024px) {
    .controls-area {
        grid-template-columns: repeat(3, 1fr); /* Desktop: 3 colunas */
    }
}
```

### 3. Unidades Relativas

Preferência por unidades relativas (rem, em, %, vw, vh) ao invés de pixels fixos:

```css
/* ❌ Evitar */
.button {
    width: 200px;
    font-size: 16px;
}

/* ✅ Preferir */
.button {
    width: 100%;
    max-width: 12.5rem;
    font-size: 1rem;
}
```

---

## 🎨 Componentes Responsivos

### Simulador Principal

```css
/* Mobile: Visualização em coluna */
.simulator-layout {
    display: flex;
    flex-direction: column;
}

.product-view {
    width: 100%;
    height: 60vh;
}

.controls {
    width: 100%;
}

/* Desktop: Visualização lado a lado */
@media (min-width: 1024px) {
    .simulator-layout {
        flex-direction: row;
    }
    
    .product-view {
        width: 60%;
        height: 80vh;
    }
    
    .controls {
        width: 40%;
    }
}
```

### Barra de Ações

```css
/* Mobile: Barra fixa no rodapé */
.action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-dark);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
}

.action-bar button {
    width: 100%;
}

/* Desktop: Barra inline */
@media (min-width: 1024px) {
    .action-bar {
        position: static;
        flex-direction: row;
        justify-content: flex-end;
        box-shadow: none;
    }
    
    .action-bar button {
        width: auto;
    }
}
```

### Color Picker

```css
/* Mobile: Paleta simplificada */
.color-picker {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.color-swatch {
    width: 100%;
    aspect-ratio: 1;
    min-height: 44px; /* Touch target mínimo */
}

/* Desktop: Paleta expandida */
@media (min-width: 1024px) {
    .color-picker {
        grid-template-columns: repeat(8, 1fr);
    }
    
    .color-swatch {
        min-height: 32px;
    }
}
```

---

## 👆 Touch Targets

### Tamanhos Mínimos

Seguindo as diretrizes de acessibilidade:

```css
/* Tamanho mínimo de 44x44px para elementos tocáveis */
.touchable {
    min-width: 44px;
    min-height: 44px;
    padding: 0.75rem;
}

/* Espaçamento entre elementos tocáveis */
.touch-group {
    display: flex;
    gap: 0.5rem; /* Mínimo 8px entre elementos */
}
```

### Hover vs Touch

```css
/* Efeitos hover apenas em dispositivos com mouse */
@media (hover: hover) {
    .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
}

/* Feedback visual para touch */
.button:active {
    transform: scale(0.98);
}
```

---

## 📏 Tipografia Responsiva

### Escala Tipográfica

```css
/* Mobile */
:root {
    --font-size-base: 14px;
    --font-size-h1: 1.75rem;
    --font-size-h2: 1.5rem;
    --font-size-h3: 1.25rem;
}

/* Tablet */
@media (min-width: 768px) {
    :root {
        --font-size-base: 15px;
        --font-size-h1: 2rem;
        --font-size-h2: 1.75rem;
        --font-size-h3: 1.5rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    :root {
        --font-size-base: 16px;
        --font-size-h1: 2.5rem;
        --font-size-h2: 2rem;
        --font-size-h3: 1.75rem;
    }
}
```

### Comprimento de Linha

```css
/* Limitar largura de texto para legibilidade */
.text-content {
    max-width: 65ch; /* 65 caracteres */
    line-height: 1.6;
}
```

---

## 🖼️ Imagens Responsivas

### Técnicas Utilizadas

```html
<!-- Imagens com srcset para diferentes resoluções -->
<img 
    src="product-medium.jpg"
    srcset="
        product-small.jpg 480w,
        product-medium.jpg 768w,
        product-large.jpg 1200w
    "
    sizes="
        (max-width: 768px) 100vw,
        (max-width: 1024px) 50vw,
        33vw
    "
    alt="Produto"
/>
```

```css
/* Imagens responsivas por padrão */
img {
    max-width: 100%;
    height: auto;
}

/* Aspect ratio para evitar layout shift */
.product-image {
    aspect-ratio: 3 / 4;
    object-fit: cover;
}
```

---

## 🎭 Navegação Responsiva

### Menu Mobile

```css
/* Mobile: Menu hamburguer */
.nav-toggle {
    display: block;
}

.nav-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 80%;
    height: 100vh;
    background: var(--bg-dark);
    transition: left 0.3s ease;
}

.nav-menu.active {
    left: 0;
}

/* Desktop: Menu horizontal */
@media (min-width: 1024px) {
    .nav-toggle {
        display: none;
    }
    
    .nav-menu {
        position: static;
        width: auto;
        height: auto;
        display: flex;
        flex-direction: row;
    }
}
```

---

## 🔧 Utilitários Responsivos

### Classes de Visibilidade

```css
/* Mostrar apenas em mobile */
.show-mobile {
    display: block;
}

@media (min-width: 768px) {
    .show-mobile {
        display: none;
    }
}

/* Mostrar apenas em desktop */
.show-desktop {
    display: none;
}

@media (min-width: 1024px) {
    .show-desktop {
        display: block;
    }
}
```

### Espaçamento Responsivo

```css
/* Espaçamento adaptativo */
.section {
    padding: 1rem;
}

@media (min-width: 768px) {
    .section {
        padding: 2rem;
    }
}

@media (min-width: 1024px) {
    .section {
        padding: 3rem;
    }
}
```

---

## 🧪 Testes de Responsividade

### Dispositivos Testados

#### Mobile

- iPhone SE (375x667)
- iPhone 12 Pro (390x844)
- Samsung Galaxy S21 (360x800)
- Pixel 5 (393x851)

#### Tablet

- iPad (768x1024)
- iPad Pro (1024x1366)
- Samsung Galaxy Tab (800x1280)

#### Desktop

- 1366x768 (HD)
- 1920x1080 (Full HD)
- 2560x1440 (2K)

### Ferramentas de Teste

1. **Chrome DevTools**
   - Device toolbar
   - Responsive mode
   - Network throttling

2. **Firefox Responsive Design Mode**
   - Múltiplos viewports
   - Touch simulation

3. **BrowserStack** (Recomendado)
   - Testes em dispositivos reais
   - Screenshots automatizados

---

## ✅ Checklist de Responsividade

### Layout

- [ ] Conteúdo legível em 320px
- [ ] Sem scroll horizontal
- [ ] Elementos não sobrepostos
- [ ] Espaçamento adequado

### Interação

- [ ] Botões com tamanho mínimo de 44x44px
- [ ] Formulários utilizáveis em mobile
- [ ] Navegação acessível
- [ ] Gestos touch funcionais

### Performance

- [ ] Imagens otimizadas
- [ ] CSS minificado
- [ ] JavaScript otimizado
- [ ] Lazy loading implementado

### Conteúdo

- [ ] Texto legível sem zoom
- [ ] Contraste adequado
- [ ] Fontes escaláveis
- [ ] Imagens com alt text

---

## 🚀 Performance em Mobile

### Otimizações Implementadas

1. **Critical CSS**
   - Estilos críticos inline
   - Carregamento assíncrono de CSS não-crítico

2. **Lazy Loading**
   - Imagens carregadas sob demanda
   - Módulos JavaScript importados dinamicamente

3. **Minificação**
   - CSS e JS minificados
   - Remoção de código não utilizado

4. **Caching**
   - Service Workers (futuro)
   - Cache de assets estáticos

---

## 📊 Métricas de Performance

### Lighthouse Scores (Mobile)

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 100

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## 🔄 Manutenção Contínua

### Boas Práticas

1. **Testar em dispositivos reais** sempre que possível
2. **Monitorar analytics** para identificar dispositivos mais usados
3. **Atualizar breakpoints** conforme necessário
4. **Revisar performance** regularmente
5. **Coletar feedback** de usuários mobile

---

*Última atualização: Fevereiro 2026*

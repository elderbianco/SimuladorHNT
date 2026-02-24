# UI Components Library - Integração com Sistema de Preços

## ⚠️ IMPORTANTE: Integração com state.config

Todos os componentes desta biblioteca foram projetados para integrar com o sistema de preços dinâmicos do Admin.

## Como Usar com Preços Dinâmicos

### ColorPicker

```javascript
import { ColorPicker } from '../common/ui/components/ColorPicker.js';

const picker = new ColorPicker({
    colors: state.availableColors,
    currentColor: state.corBase,
    config: state.config,  // ✅ Passa configuração dinâmica
    zoneId: 'frente',
    onSelect: (color) => {
        state.corBase = color;
        updatePreview();
        updatePrice();  // ✅ Atualiza preço
    }
});
```

### ImageUploader

```javascript
import { ImageUploader } from '../common/ui/components/ImageUploader.js';

const uploader = new ImageUploader({
    zoneId: 'frente_centro',
    config: state.config,  // ✅ Passa configuração dinâmica
    getPriceFunction: getZonePrice,  // ✅ Passa função de preço
    onUpload: (data) => {
        handleImageUpload(data.base64, data.zoneId);
        updatePrice();  // ✅ Atualiza preço
    },
    showPreview: true
});
```

### TextControls

```javascript
import { TextControls } from '../common/ui/components/TextControls.js';

const textControls = new TextControls({
    zoneId: 'text_frente',
    fonts: state.availableFonts,
    colors: state.availableColors,
    currentValues: state.texts['text_frente'],
    config: state.config,  // ✅ Passa configuração dinâmica
    getPriceFunction: getZonePrice,  // ✅ Passa função de preço
    onChange: (data) => {
        state.texts[data.zoneId] = data.values;
        updatePreview();
        updatePrice();  // ✅ Atualiza preço
    }
});
```

### ImageGallery

```javascript
import { ImageGallery } from '../common/ui/components/ImageGallery.js';

const gallery = new ImageGallery({
    images: state.galleryImages,
    title: 'Selecione uma Imagem',
    showSearch: true,
    onSelect: (image) => {
        addImageToZone(image, zoneId);
        updatePrice();  // ✅ Atualiza preço
    }
});
```

## Sincronização com Admin

Os componentes são compatíveis com o sistema de sincronização em tempo real:

```javascript
// logic.js
window.addEventListener('storage', (e) => {
    if (e.key === 'hnt_top_config') {
        loadAdminConfig();  // Recarrega state.config
        renderControls();   // Re-renderiza UI com novos preços
        updatePrice();      // Atualiza cálculos
    }
});
```

## Funções Necessárias

Para usar os componentes com preços dinâmicos, certifique-se de ter:

1. **state.config** - Carregado via `loadAdminConfig()`
2. **getZonePrice(zoneId, type)** - Função de cálculo de preço
3. **updatePrice()** - Função de atualização de preço
4. **updatePreview()** - Função de atualização de preview

## Exemplo Completo

```javascript
// Importar componentes
import {
    ColorPicker,
    ImageUploader,
    TextControls,
    ImageGallery
} from '../common/ui/index.js';

// Carregar configuração do Admin
loadAdminConfig();  // Popula state.config

// Usar componente com integração completa
function renderColorSection() {
    const picker = new ColorPicker({
        colors: state.availableColors,
        currentColor: state.corBase,
        config: state.config,  // ✅ Preços dinâmicos
        zoneId: 'base',
        onSelect: (color) => {
            state.corBase = color;
            updatePreview();
            updatePrice();  // ✅ Recalcula com state.config
            saveState();
        }
    });
    
    container.appendChild(picker.render());
}
```

## Validação

Antes de usar os componentes, valide:

```javascript
// Verificar se state.config está carregado
if (!state.config || !state.config.basePrice) {
    console.error('⚠️ state.config não carregado! Chame loadAdminConfig() primeiro.');
    loadAdminConfig();
}

// Verificar se getZonePrice existe
if (typeof getZonePrice !== 'function') {
    console.error('⚠️ getZonePrice() não encontrado!');
}

// Verificar se updatePrice existe
if (typeof updatePrice !== 'function') {
    console.error('⚠️ updatePrice() não encontrado!');
}
```

## Benefícios

✅ **Preços Dinâmicos** - Atualiza automaticamente do Admin  
✅ **Sincronização** - Mudanças em tempo real  
✅ **Consistência** - Mesma lógica de preço em todos os simuladores  
✅ **Manutenibilidade** - Código reutilizável com integração preservada

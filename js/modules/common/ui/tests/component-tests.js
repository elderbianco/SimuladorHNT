/**
 * Testes Automatizados - UI Components Library
 * Framework: Jest-like (adaptável para qualquer framework)
 */

// ============================================
// SETUP & HELPERS
// ============================================

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    describe(name, fn) {
        console.log(`\n📦 ${name}`);
        fn();
    }

    it(description, fn) {
        try {
            fn();
            this.passed++;
            console.log(`  ✅ ${description}`);
        } catch (error) {
            this.failed++;
            console.error(`  ❌ ${description}`);
            console.error(`     ${error.message}`);
        }
    }

    expect(value) {
        return {
            toBe: (expected) => {
                if (value !== expected) {
                    throw new Error(`Expected ${expected}, got ${value}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(value) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
                }
            },
            toBeTruthy: () => {
                if (!value) {
                    throw new Error(`Expected truthy value, got ${value}`);
                }
            },
            toBeFalsy: () => {
                if (value) {
                    throw new Error(`Expected falsy value, got ${value}`);
                }
            },
            toContain: (expected) => {
                if (!value.includes(expected)) {
                    throw new Error(`Expected to contain ${expected}`);
                }
            },
            toBeInstanceOf: (expected) => {
                if (!(value instanceof expected)) {
                    throw new Error(`Expected instance of ${expected.name}`);
                }
            }
        };
    }

    report() {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 RESULTADOS DOS TESTES`);
        console.log(`${'='.repeat(50)}`);
        console.log(`✅ Passou: ${this.passed}`);
        console.log(`❌ Falhou: ${this.failed}`);
        console.log(`📈 Total: ${this.passed + this.failed}`);
        console.log(`🎯 Taxa de Sucesso: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
        console.log(`${'='.repeat(50)}\n`);
    }
}

const test = new TestRunner();

// Mock DOM
class MockElement {
    constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.attributes = {};
        this.style = {};
        this.classList = new Set();
        this.innerHTML = '';
        this.textContent = '';
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    querySelector(selector) {
        return this.children[0] || null;
    }

    querySelectorAll(selector) {
        return this.children;
    }
}

global.document = {
    createElement: (tag) => new MockElement(tag),
    querySelector: () => new MockElement('div'),
    querySelectorAll: () => []
};

// ============================================
// TESTES: DOMHelpers
// ============================================

test.describe('DOMHelpers', () => {
    // Mock import
    const DOMHelpers = {
        createElement: (tag, attrs = {}, children = []) => {
            const el = document.createElement(tag);
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'className') el.classList.add(value);
                else if (key === 'style') Object.assign(el.style, value);
                else if (key.startsWith('on')) el[key] = value;
                else el.setAttribute(key, value);
            });
            children.forEach(child => {
                if (typeof child === 'string') el.textContent += child;
                else el.appendChild(child);
            });
            return el;
        },

        addClass: (el, className) => {
            el.classList.add(className);
        },

        removeClass: (el, className) => {
            el.classList.delete(className);
        },

        show: (el) => {
            el.style.display = 'block';
        },

        hide: (el) => {
            el.style.display = 'none';
        },

        clearElement: (el) => {
            el.children = [];
            el.innerHTML = '';
        }
    };

    test.it('createElement deve criar elemento com tag correta', () => {
        const el = DOMHelpers.createElement('div');
        test.expect(el.tagName).toBe('div');
    });

    test.it('createElement deve aplicar className', () => {
        const el = DOMHelpers.createElement('div', { className: 'test' });
        test.expect(el.classList.has('test')).toBeTruthy();
    });

    test.it('createElement deve aplicar estilos', () => {
        const el = DOMHelpers.createElement('div', { style: { color: 'red' } });
        test.expect(el.style.color).toBe('red');
    });

    test.it('addClass deve adicionar classe', () => {
        const el = document.createElement('div');
        DOMHelpers.addClass(el, 'active');
        test.expect(el.classList.has('active')).toBeTruthy();
    });

    test.it('removeClass deve remover classe', () => {
        const el = document.createElement('div');
        el.classList.add('active');
        DOMHelpers.removeClass(el, 'active');
        test.expect(el.classList.has('active')).toBeFalsy();
    });

    test.it('show deve tornar elemento visível', () => {
        const el = document.createElement('div');
        DOMHelpers.show(el);
        test.expect(el.style.display).toBe('block');
    });

    test.it('hide deve ocultar elemento', () => {
        const el = document.createElement('div');
        DOMHelpers.hide(el);
        test.expect(el.style.display).toBe('none');
    });

    test.it('clearElement deve limpar filhos', () => {
        const el = document.createElement('div');
        el.appendChild(document.createElement('span'));
        DOMHelpers.clearElement(el);
        test.expect(el.children.length).toBe(0);
    });
});

// ============================================
// TESTES: ImageValidator
// ============================================

test.describe('ImageValidator', () => {
    const ImageValidator = {
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 10MB

        validateType: (file) => {
            return ImageValidator.allowedTypes.includes(file.type);
        },

        validateSize: (file) => {
            return file.size <= ImageValidator.maxSize;
        },

        validate: (file) => {
            if (!ImageValidator.validateType(file)) {
                return { valid: false, error: 'Tipo de arquivo não permitido' };
            }
            if (!ImageValidator.validateSize(file)) {
                return { valid: false, error: 'Arquivo muito grande' };
            }
            return { valid: true };
        }
    };

    test.it('deve aceitar tipos de imagem válidos', () => {
        const file = { type: 'image/jpeg', size: 1024 };
        test.expect(ImageValidator.validateType(file)).toBeTruthy();
    });

    test.it('deve rejeitar tipos inválidos', () => {
        const file = { type: 'application/pdf', size: 1024 };
        test.expect(ImageValidator.validateType(file)).toBeFalsy();
    });

    test.it('deve aceitar arquivos dentro do limite de tamanho', () => {
        const file = { type: 'image/jpeg', size: 1024 * 1024 }; // 1MB
        test.expect(ImageValidator.validateSize(file)).toBeTruthy();
    });

    test.it('deve rejeitar arquivos muito grandes', () => {
        const file = { type: 'image/jpeg', size: 20 * 1024 * 1024 }; // 20MB
        test.expect(ImageValidator.validateSize(file)).toBeFalsy();
    });

    test.it('validate deve retornar objeto com valid=true para arquivo válido', () => {
        const file = { type: 'image/jpeg', size: 1024 };
        const result = ImageValidator.validate(file);
        test.expect(result.valid).toBeTruthy();
    });

    test.it('validate deve retornar erro para tipo inválido', () => {
        const file = { type: 'application/pdf', size: 1024 };
        const result = ImageValidator.validate(file);
        test.expect(result.valid).toBeFalsy();
        test.expect(result.error).toContain('não permitido');
    });
});

// ============================================
// TESTES: FormatHelpers
// ============================================

test.describe('FormatHelpers', () => {
    const FormatHelpers = {
        formatCurrency: (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },

        formatNumber: (value, decimals = 2) => {
            return value.toFixed(decimals);
        },

        formatCPF: (cpf) => {
            const cleaned = cpf.replace(/\D/g, '');
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        },

        formatPhone: (phone) => {
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 11) {
                return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
    };

    test.it('formatCurrency deve formatar valor como moeda brasileira', () => {
        const result = FormatHelpers.formatCurrency(129.90);
        test.expect(result).toContain('129,90');
    });

    test.it('formatNumber deve formatar número com decimais', () => {
        const result = FormatHelpers.formatNumber(10.5, 2);
        test.expect(result).toBe('10.50');
    });

    test.it('formatCPF deve formatar CPF corretamente', () => {
        const result = FormatHelpers.formatCPF('12345678900');
        test.expect(result).toBe('123.456.789-00');
    });

    test.it('formatPhone deve formatar celular (11 dígitos)', () => {
        const result = FormatHelpers.formatPhone('11987654321');
        test.expect(result).toBe('(11) 98765-4321');
    });

    test.it('formatPhone deve formatar telefone fixo (10 dígitos)', () => {
        const result = FormatHelpers.formatPhone('1133334444');
        test.expect(result).toBe('(11) 3333-4444');
    });
});

// ============================================
// TESTES: ColorPicker Component
// ============================================

test.describe('ColorPicker Component', () => {
    class ColorPicker {
        constructor(options = {}) {
            this.colors = options.colors || [];
            this.currentColor = options.currentColor || null;
            this.onSelect = options.onSelect || (() => { });
            this.config = options.config || null;
            this.zoneId = options.zoneId || null;
        }

        selectColor(color) {
            this.currentColor = color;
            this.onSelect(color);
        }

        getSelectedColor() {
            return this.currentColor;
        }
    }

    test.it('deve inicializar com cores fornecidas', () => {
        const picker = new ColorPicker({ colors: ['#FF0000', '#00FF00'] });
        test.expect(picker.colors.length).toBe(2);
    });

    test.it('deve aceitar config para integração com preços', () => {
        const config = { logoFrontPrice: 15.00 };
        const picker = new ColorPicker({ config, zoneId: 'frente' });
        test.expect(picker.config.logoFrontPrice).toBe(15.00);
    });

    test.it('selectColor deve atualizar cor atual', () => {
        const picker = new ColorPicker({ colors: ['#FF0000'] });
        picker.selectColor('#FF0000');
        test.expect(picker.getSelectedColor()).toBe('#FF0000');
    });

    test.it('selectColor deve chamar callback onSelect', () => {
        let called = false;
        const picker = new ColorPicker({
            onSelect: () => { called = true; }
        });
        picker.selectColor('#FF0000');
        test.expect(called).toBeTruthy();
    });
});

// ============================================
// TESTES: ImageUploader Component
// ============================================

test.describe('ImageUploader Component', () => {
    class ImageUploader {
        constructor(options = {}) {
            this.zoneId = options.zoneId || 'default';
            this.onUpload = options.onUpload || (() => { });
            this.config = options.config || null;
            this.getPriceFunction = options.getPriceFunction || null;
            this.currentImage = null;
        }

        setImage(base64, filename) {
            this.currentImage = { base64, name: filename };
        }

        hasImage() {
            return this.currentImage !== null;
        }

        getImage() {
            return this.currentImage;
        }

        removeImage() {
            this.currentImage = null;
        }
    }

    test.it('deve inicializar com zoneId', () => {
        const uploader = new ImageUploader({ zoneId: 'frente_centro' });
        test.expect(uploader.zoneId).toBe('frente_centro');
    });

    test.it('deve aceitar config e getPriceFunction para preços dinâmicos', () => {
        const config = { devFee: 30.00 };
        const getPriceFunction = () => 15.00;
        const uploader = new ImageUploader({ config, getPriceFunction });
        test.expect(uploader.config.devFee).toBe(30.00);
        test.expect(uploader.getPriceFunction()).toBe(15.00);
    });

    test.it('setImage deve armazenar imagem', () => {
        const uploader = new ImageUploader();
        uploader.setImage('data:image/png;base64,...', 'test.png');
        test.expect(uploader.hasImage()).toBeTruthy();
    });

    test.it('getImage deve retornar imagem atual', () => {
        const uploader = new ImageUploader();
        uploader.setImage('data:image/png;base64,...', 'test.png');
        const img = uploader.getImage();
        test.expect(img.name).toBe('test.png');
    });

    test.it('removeImage deve limpar imagem', () => {
        const uploader = new ImageUploader();
        uploader.setImage('data:image/png;base64,...', 'test.png');
        uploader.removeImage();
        test.expect(uploader.hasImage()).toBeFalsy();
    });
});

// ============================================
// TESTES: TextControls Component
// ============================================

test.describe('TextControls Component', () => {
    class TextControls {
        constructor(options = {}) {
            this.zoneId = options.zoneId || 'default';
            this.fonts = options.fonts || [];
            this.colors = options.colors || [];
            this.currentValues = options.currentValues || {
                text: '',
                font: this.fonts[0],
                color: this.colors[0],
                size: 16
            };
            this.onChange = options.onChange || (() => { });
            this.config = options.config || null;
            this.getPriceFunction = options.getPriceFunction || null;
        }

        updateValue(key, value) {
            this.currentValues[key] = value;
            let price = 0;
            if (this.getPriceFunction) {
                price = this.getPriceFunction(this.zoneId, 'text');
            }
            this.onChange({ zoneId: this.zoneId, values: this.currentValues, price });
        }

        getValues() {
            return { ...this.currentValues };
        }

        clear() {
            this.currentValues = {
                text: '',
                font: this.fonts[0],
                color: this.colors[0],
                size: 16
            };
        }
    }

    test.it('deve inicializar com valores padrão', () => {
        const controls = new TextControls({
            fonts: ['Arial'],
            colors: ['#000000']
        });
        test.expect(controls.currentValues.font).toBe('Arial');
    });

    test.it('deve aceitar config e getPriceFunction', () => {
        const config = { textFrontPrice: 15.00 };
        const getPriceFunction = (zoneId, type) => 15.00;
        const controls = new TextControls({ config, getPriceFunction });
        test.expect(controls.config.textFrontPrice).toBe(15.00);
    });

    test.it('updateValue deve atualizar valor', () => {
        const controls = new TextControls({ fonts: ['Arial'] });
        controls.updateValue('text', 'Teste');
        test.expect(controls.getValues().text).toBe('Teste');
    });

    test.it('updateValue deve chamar onChange com preço calculado', () => {
        let receivedPrice = 0;
        const controls = new TextControls({
            getPriceFunction: () => 15.00,
            onChange: (data) => { receivedPrice = data.price; }
        });
        controls.updateValue('text', 'Teste');
        test.expect(receivedPrice).toBe(15.00);
    });

    test.it('clear deve resetar valores', () => {
        const controls = new TextControls({ fonts: ['Arial'], colors: ['#000000'] });
        controls.updateValue('text', 'Teste');
        controls.clear();
        test.expect(controls.getValues().text).toBe('');
    });
});

// ============================================
// TESTES DE INTEGRAÇÃO: state.config
// ============================================

test.describe('Integração com state.config', () => {
    const mockState = {
        config: {
            logoFrontPrice: 15.00,
            logoBackPrice: 15.00,
            textFrontPrice: 15.00,
            textBackPrice: 15.00,
            devFee: 30.00,
            basePrice: 129.90
        }
    };

    const getZonePrice = (zoneId, type) => {
        if (type === 'image') {
            if (zoneId.includes('frente')) return mockState.config.logoFrontPrice;
            if (zoneId.includes('costas')) return mockState.config.logoBackPrice;
        } else if (type === 'text') {
            if (zoneId.includes('frente')) return mockState.config.textFrontPrice;
            if (zoneId.includes('costas')) return mockState.config.textBackPrice;
        }
        return 0;
    };

    test.it('getZonePrice deve retornar preço correto para logo frente', () => {
        const price = getZonePrice('frente_centro', 'image');
        test.expect(price).toBe(15.00);
    });

    test.it('getZonePrice deve retornar preço correto para texto costas', () => {
        const price = getZonePrice('costas_centro', 'text');
        test.expect(price).toBe(15.00);
    });

    test.it('componente deve usar getZonePrice para calcular preço', () => {
        class ImageUploader {
            constructor(options) {
                this.getPriceFunction = options.getPriceFunction;
                this.zoneId = options.zoneId;
            }
            calculatePrice() {
                return this.getPriceFunction(this.zoneId, 'image');
            }
        }

        const uploader = new ImageUploader({
            zoneId: 'frente_centro',
            getPriceFunction: getZonePrice
        });

        test.expect(uploader.calculatePrice()).toBe(15.00);
    });
});

// ============================================
// EXECUTAR TESTES
// ============================================

console.log('\n🧪 INICIANDO TESTES AUTOMATIZADOS\n');
console.log('=' + '='.repeat(49));

// Executar todos os testes
test.report();

console.log('\n✅ Testes concluídos!\n');

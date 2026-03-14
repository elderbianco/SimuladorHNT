/**
 * Registration Controller Module
 * Orchestrates form behavior, masks, and submission
 */
const RegistrationController = {
    init: async function () {
        this.setupMasks();
        this.bindEvents();
        await this.checkExistingSession();
    },

    setupMasks: function () {
        this.masks = {
            document: IMask(document.getElementById('document'), {
                mask: [
                    { mask: '000.000.000-00', type: 'CPF' },
                    { mask: '00.000.000/0000-00', type: 'CNPJ' }
                ]
            }),
            zipcode: IMask(document.getElementById('zipcode'), {
                mask: '00000-000'
            }),
            whatsapp: IMask(document.getElementById('whatsapp'), {
                mask: '(00) 00000-0000'
            })
        };
    },

    bindEvents: function () {
        const form = document.getElementById('cadastro-form');
        const zipcodeField = document.getElementById('zipcode');
        const docField = document.getElementById('document');
        const googleBtn = document.getElementById('btn-google-login');

        // CEP Events
        this.masks.zipcode.on('complete', () => this.handleCEPAutoFill());
        zipcodeField.addEventListener('blur', () => this.handleCEPAutoFill());

        // Document Validation Highlight
        docField.addEventListener('blur', () => {
            const isValid = RegistrationValidation.validateDocument(docField.value);
            const errorEl = document.getElementById('document-error');

            if (!isValid && docField.value.length > 0) {
                errorEl.style.display = 'block';
                docField.style.borderColor = '#ff4d4d';
            } else {
                errorEl.style.display = 'none';
                docField.style.borderColor = '';
            }
        });

        // Google Login
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        // Form Submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    checkExistingSession: async function () {
        if (typeof supabase === 'undefined') return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const user = session.user;
                document.getElementById('email').value = user.email || '';
                document.getElementById('full-name').value = user.user_metadata?.full_name || '';
                document.getElementById('email').readOnly = true;
            }
        } catch (e) {
            console.warn('Supabase session check skipped or failed', e);
        }
    },

    handleCEPAutoFill: async function () {
        const field = document.getElementById('zipcode');
        const cep = field.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        field.style.borderColor = 'var(--accent-blue)';
        const data = await RegistrationAPI.buscarCEP(cep);

        if (data && !data.error) {
            document.getElementById('address').value = data.address;
            document.getElementById('neighborhood').value = data.neighborhood;
            document.getElementById('city').value = data.city;
            document.getElementById('state').value = data.state;

            field.style.borderColor = 'var(--gold)';
            document.getElementById('number').focus();
        } else if (data && data.error) {
            alert(data.error);
            field.style.borderColor = '#ff4d4d';
        }
    },

    handleGoogleLogin: async function () {
        if (typeof supabase === 'undefined') {
            alert('Erro de conexão com o servidor de autenticação.');
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });

        if (error) {
            console.error('Google Auth Error:', error.message);
            alert('Falha ao autenticar com o Google.');
        }
    },

    handleSubmit: function (e) {
        e.preventDefault();

        const docVal = document.getElementById('document').value;
        if (!RegistrationValidation.validateDocument(docVal)) {
            alert('Por favor, insira um CPF ou CNPJ válido.');
            document.getElementById('document').focus();
            return;
        }

        const userData = {
            email: document.getElementById('email').value,
            name: document.getElementById('full-name').value,
            document: docVal.replace(/\D/g, ''),
            address: document.getElementById('address').value,
            number: document.getElementById('number').value,
            complement: document.getElementById('complement').value,
            neighborhood: document.getElementById('neighborhood').value,
            zipcode: document.getElementById('zipcode').value.replace(/\D/g, ''),
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
            marketing: document.getElementById('marketing').checked,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('hnt_customer_profile', JSON.stringify(userData));
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'IndexPedidoSimulador.html';
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => RegistrationController.init());

/**
 * Registration Controller Module
 * Orchestrates form behavior, masks, and submission
 */
const RegistrationController = {
    init: async function () {
        this.setupMasks();
        this.bindEvents();
        await this.checkExistingSession();
        this.preFillFromProfile();
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
            }),
            phone: IMask(document.getElementById('phone'), {
                mask: [
                    { mask: '(00) 0000-0000' },
                    { mask: '(00) 00000-0000' }
                ]
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
                docField.style.borderColor = 'var(--danger)';
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
                const emailField = document.getElementById('email');
                const nameField = document.getElementById('full-name');

                if (emailField) {
                    emailField.value = user.email || '';
                    emailField.classList.add('read-only-field');
                    emailField.readOnly = true;
                }

                if (nameField && !nameField.value) {
                    nameField.value = user.user_metadata?.full_name || '';
                }

                // If logged in, help the user realize they are identified
                const googleBtn = document.getElementById('btn-google-login');
                if (googleBtn) {
                    googleBtn.innerHTML = `✅ CONECTADO COMO: ${user.email.toUpperCase()}`;
                    googleBtn.style.borderColor = 'var(--gold)';
                    googleBtn.style.color = 'var(--gold)';
                    googleBtn.disabled = true;
                }
            }
        } catch (e) {
            console.warn('Supabase session check skipped or failed', e);
        }
    },

    preFillFromProfile: function () {
        const profileStr = localStorage.getItem('hnt_customer_profile');
        if (!profileStr) return;

        try {
            const profile = JSON.parse(profileStr);
            console.log('📝 Pre-enchendo formulário a partir do perfil local:', profile);

            const mapping = {
                'email': 'email',
                'full-name': 'name',
                'document': 'document',
                'address': 'address',
                'number': 'number',
                'complement': 'complement',
                'neighborhood': 'neighborhood',
                'zipcode': 'zipcode',
                'city': 'city',
                'state': 'state',
                'whatsapp': 'whatsapp',
                'phone': 'phone'
            };

            Object.entries(mapping).forEach(([fieldId, profileKey]) => {
                const el = document.getElementById(fieldId);
                if (el && profile[profileKey] && !el.value) {
                    el.value = profile[profileKey];
                    if (this.masks[profileKey === 'name' ? 'document' : profileKey]) {
                        this.masks[profileKey === 'name' ? 'document' : profileKey].updateValue();
                    }
                }
            });

            // Se for edit explicitamente via URL, permitir edição de tudo
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('edit') === 'true') {
                document.querySelectorAll('.read-only-field').forEach(el => {
                    el.classList.remove('read-only-field');
                    el.readOnly = false;
                });
            }

        } catch (e) {
            console.warn('Falha ao pre-encher formulário:', e);
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

            // Bloquear campos de endereço após preenchimento automático
            document.getElementById('address').classList.add('read-only-field');
            document.getElementById('neighborhood').classList.add('read-only-field');
            document.getElementById('city').classList.add('read-only-field');
            document.getElementById('state').classList.add('read-only-field');

            field.style.borderColor = 'var(--gold)';
            document.getElementById('number').focus();
        } else if (data && data.error) {
            alert(data.error);
            field.style.borderColor = 'var(--danger)';
            this.clearAddress();
        }
    },

    clearAddress: function () {
        const fields = ['zipcode', 'address', 'neighborhood', 'city', 'state', 'number', 'complement'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.classList.remove('read-only-field');
                if (id !== 'address' && id !== 'neighborhood' && id !== 'city' && id !== 'state') {
                    el.readOnly = false;
                }
            }
        });

        document.getElementById('zipcode').focus();
        this.masks.zipcode.updateValue();
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

    handleSubmit: async function (e) {
        e.preventDefault();

        const errors = [];
        const errorListEl = document.getElementById('error-list');
        const errorContainer = document.getElementById('validation-errors');

        // --- MANUAL VALIDATION ---
        // 1. Privacy
        const privacyCheck = document.getElementById('privacy-policy');
        // 2. Email
        const email = document.getElementById('email').value.trim();
        // 3. Document (Special validation)
        const docField = document.getElementById('document');
        // 5. Address (Zipcode)
        const zip = document.getElementById('zipcode').value.replace(/\D/g, '');
        // 6. WhatsApp (Primary phone)
        const whats = document.getElementById('whatsapp').value.replace(/\D/g, '');

        const fields = {
            'privacy-policy': !!privacyCheck?.checked,
            'email': !!email,
            'document': RegistrationValidation.validateDocument(docField.value),
            'full-name': !!document.getElementById('full-name').value.trim(),
            'zipcode': zip.length === 8,
            'number': !!document.getElementById('number').value.trim(),
            'whatsapp': whats.length >= 10
        };

        // Reset borders
        Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.borderColor = '';
        });

        if (!fields['privacy-policy']) errors.push('Aceite a Política de Privacidade.');
        if (!fields['email']) errors.push('O e-mail é obrigatório.');
        if (!fields['document']) errors.push('CPF ou CNPJ inválido. Certifique-se de digitar um documento real para fins de faturamento.');
        if (!fields['full-name']) errors.push('O nome completo é obrigatório.');
        if (!fields['zipcode']) errors.push('O CEP deve conter 8 dígitos.');
        if (!fields['number']) errors.push('O número do endereço é obrigatório.');
        if (!fields['whatsapp']) errors.push('O WhatsApp principal deve ter DDD e número.');

        // NOTE: Fixed phone (Telefone Fixo) is NOT checked on purpose (optional).

        if (errors.length > 0) {
            // Apply red borders
            Object.keys(fields).forEach(id => {
                if (!fields[id]) {
                    const el = document.getElementById(id);
                    if (el) el.style.borderColor = 'var(--danger)';
                }
            });
            errorContainer.style.display = 'block';
            errorListEl.innerHTML = errors.map(err => `<li>${err}</li>`).join('');

            // Scroll to the error list container
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Hide error container if everything is fine now
        errorContainer.style.display = 'none';

        // Proceed to save logic...
        const btn = document.getElementById('btn-submit');
        btn.disabled = true;
        btn.innerHTML = '🕒 SALVANDO CADASTRO...';

        let storedClientId = localStorage.getItem('hnt_client_id');
        if (!storedClientId) {
            storedClientId = 'CLI_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
            localStorage.setItem('hnt_client_id', storedClientId);
        }

        const docVal = document.getElementById('document').value;
        const userData = {
            clientId: storedClientId,
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
            phone: document.getElementById('phone').value.replace(/\D/g, ''),
            marketing: document.getElementById('marketing').checked,
            updatedAt: new Date().toISOString()
        };

        // 1. Salvar no LocalStorage para uso imediato no carrinho
        localStorage.setItem('hnt_customer_profile', JSON.stringify({
            ...userData,
            updatedAt: new Date().toISOString()
        }));

        // 2. Sincronizar com Banco de Dados Supabase (Sequência Rigorosa Bling)
        if (typeof supabase !== 'undefined') {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id || null;
                const hoje = new Date().toLocaleDateString('pt-BR');

                const { error } = await supabase
                    .from('clientes_cadastrados')
                    .upsert({
                        numero_pedido: null,
                        nome_comprador: userData.name,
                        data_pedido: hoje,
                        cpf_cnpj_comprador: userData.document,
                        endereco_comprador: userData.address,
                        bairro_comprador: userData.neighborhood,
                        numero_comprador: userData.number,
                        complemento_comprador: userData.complement,
                        cep_comprador: userData.zipcode,
                        cidade_comprador: userData.city,
                        uf_comprador: userData.state || 'SC',
                        telefone_comprador: userData.phone || userData.whatsapp,
                        celular_comprador: userData.whatsapp,
                        email_comprador: userData.email,
                        auth_user_id: userId,
                        id_cliente: userData.clientId,
                        consentimento_marketing: userData.marketing,
                        atualizado_em: new Date().toISOString()
                    }, { onConflict: 'cpf_cnpj_comprador' });

                if (error) console.error('Erro ao sincronizar com Supabase:', error);
            } catch (err) {
                console.error('Falha na persistência remota:', err);
            }
        }

        console.log('✅ Cadastro realizado e sincronizado com sucesso!');

        // Update cart if possible
        let cartItems = JSON.parse(localStorage.getItem('hnt_all_orders_db') || '[]');
        let updatedCount = 0;
        cartItems.forEach(item => {
            if (!item.client_info || !item.client_info.name || item.client_info.name === 'Cliente' || item.client_info.document === userData.document) {
                item.client_info = {
                    name: userData.name,
                    phone: userData.whatsapp || userData.phone,
                    email: userData.email,
                    document: userData.document,
                    clientId: userData.clientId
                };
                updatedCount++;
            }
        });
        if (updatedCount > 0) {
            localStorage.setItem('hnt_all_orders_db', JSON.stringify(cartItems));
        }

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'IndexPedidoSimulador.html';
        window.location.href = redirect;
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => RegistrationController.init());

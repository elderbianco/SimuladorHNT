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

            // Bloquear campos de endereço após preenchimento automático
            document.getElementById('address').readOnly = true;
            document.getElementById('neighborhood').readOnly = true;
            document.getElementById('city').readOnly = true;
            document.getElementById('state').readOnly = true;

            field.style.borderColor = 'var(--gold)';
            document.getElementById('number').focus();
        } else if (data && data.error) {
            alert(data.error);
            field.style.borderColor = '#ff4d4d';
            // Se houver erro, limpar e desbloquear os campos
            this.clearAddress();
        }
    },

    clearAddress: function () {
        document.getElementById('zipcode').value = '';
        document.getElementById('address').value = '';
        document.getElementById('neighborhood').value = '';
        document.getElementById('city').value = '';
        document.getElementById('state').value = '';
        document.getElementById('number').value = '';
        document.getElementById('complement').value = '';

        // Desbloquear campos de endereço
        document.getElementById('address').readOnly = false;
        document.getElementById('neighborhood').readOnly = false;
        document.getElementById('city').readOnly = false;
        document.getElementById('state').readOnly = false;

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

        const docField = document.getElementById('document');
        const docVal = docField.value;
        if (!RegistrationValidation.validateDocument(docVal)) {
            alert('Por favor, insira um CPF ou CNPJ válido.');
            docField.focus();
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
            phone: document.getElementById('phone').value.replace(/\D/g, ''),
            marketing: document.getElementById('marketing').checked
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
                        // Ordem idêntica à fornecida no Excel:
                        numero_pedido: null,             // 1 (Vazio no cadastro)
                        nome_comprador: userData.name,   // 2
                        data_pedido: hoje,               // 3 (Data do Cadastro)
                        cpf_cnpj_comprador: userData.document, // 4
                        endereco_comprador: userData.address,  // 5
                        bairro_comprador: userData.neighborhood, // 6
                        numero_comprador: userData.number,      // 7
                        complemento_comprador: userData.complement, // 8
                        cep_comprador: userData.zipcode,         // 9
                        cidade_comprador: userData.city,         // 10
                        uf_comprador: userData.state || 'SC',    // 11
                        telefone_comprador: userData.phone || userData.whatsapp, // 12
                        celular_comprador: userData.whatsapp,    // 13
                        email_comprador: userData.email,         // 14

                        // Campos extras técnicos
                        auth_user_id: userId,
                        consentimento_marketing: userData.marketing,
                        atualizado_em: new Date().toISOString()
                    }, { onConflict: 'cpf_cnpj_comprador' });

                if (error) {
                    console.error('Erro ao sincronizar com Supabase:', error);
                }
            } catch (err) {
                console.error('Falha na persistência remota:', err);
            }
        }

        alert('Cadastro realizado com sucesso!');

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'IndexPedidoSimulador.html';
        window.location.href = redirect;
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => RegistrationController.init());

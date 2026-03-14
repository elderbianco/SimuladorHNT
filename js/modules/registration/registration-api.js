/**
 * Registration API Module
 * Handles external service calls (ViaCEP)
 */
const RegistrationAPI = {
    buscarCEP: async function (cep) {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) return { error: 'CEP não encontrado' };

            return {
                address: data.logradouro || '',
                neighborhood: data.bairro || '',
                city: data.localidade || '',
                state: data.uf || ''
            };
        } catch (error) {
            console.error('Erro na busca de CEP:', error);
            return { error: 'Falha na conexão com serviço de CEP' };
        }
    }
};

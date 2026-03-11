/**
 * SupabaseAdapter - Comunicação com Backend Serverless
 */

const SupabaseAdapter = {

    /**
     * Sobe um arquivo para o Storage do Supabase
     */
    async uploadFile(bucket, fileName, fileData, type = 'image/png') {
        if (!window.supabaseClient) {
            console.error('❌ Supabase Client não inicializado');
            return null;
        }

        try {
            // Converter base64 para Blob se necessário
            let blob = fileData;
            if (typeof fileData === 'string' && fileData.startsWith('data:')) {
                const res = await fetch(fileData);
                blob = await res.blob();
            }

            const { data, error } = await window.supabaseClient.storage
                .from(bucket)
                .upload(fileName, blob, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: type
                });

            if (error) throw error;

            const { data: { publicUrl } } = window.supabaseClient.storage
                .from(bucket)
                .getPublicUrl(fileName);

            console.log(`✅ Arquivo salvo no Supabase (${bucket}):`, publicUrl);
            return publicUrl;
        } catch (err) {
            console.error(`❌ Erro no upload para Supabase (${bucket}):`, err);
            return null;
        }
    },

    /**
     * Salva o registro do pedido no Banco de Dados
     */
    async savePedido(formattedData, technicalJson) {
        if (!window.supabaseClient) {
            console.error('❌ Supabase Client não inicializado');
            return null;
        }

        try {
            // Mapeamento para as colunas reais da tabela `pedidos`
            const row = {
                ID_PEDIDO: formattedData.order_id,
                ID_SIMULACAO: technicalJson.simulationId,
                TIPO_PRODUTO: formattedData.product_type,
                NOME_CLIENTE: formattedData.client_name || 'Simulador',
                TELEFONE_CLIENTE: formattedData.client_phone,
                COR_BASE: formattedData.color,
                TAMANHO: formattedData.grade,
                QUANTIDADE: parseInt(formattedData.quantity) || 0,
                PRECO_FINAL: parseFloat(formattedData.total_price) || 0,
                pdf_url: formattedData.pdfUrl,
                json_tec: technicalJson, // Backup completo
                STATUS_PEDIDO: 'Simulação'
            };

            const { data, error } = await window.supabaseClient
                .from('pedidos')
                .insert([row])
                .select();

            if (error) throw error;
            console.log('✅ Pedido salvo no Supabase DB:', data);
            return data;
        } catch (err) {
            console.error('❌ Erro ao salvar pedido no Supabase DB:', err);
            return null;
        }
    },

    /**
     * Busca todos os pedidos do Banco de Dados
     */
    async getPedidos() {
        if (!window.supabaseClient) {
            console.error('❌ Supabase Client não inicializado');
            return [];
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('pedidos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log(`✅ ${data.length} pedidos carregados do Supabase`);
            return data;
        } catch (err) {
            console.error('❌ Erro ao buscar pedidos no Supabase:', err);
            return [];
        }
    }
};

window.SupabaseAdapter = SupabaseAdapter;

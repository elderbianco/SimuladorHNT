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
            let blob = fileData;

            // CONVERSÃO ROBUSTA: Se for string, verificar se é Base64
            if (typeof fileData === 'string') {
                if (fileData.startsWith('data:')) {
                    // Formato completo: data:application/pdf;base64,.....
                    const res = await fetch(fileData);
                    blob = await res.blob();
                } else if (/^[A-Za-z0-9+/=]+$/.test(fileData.substring(0, 100).replace(/\s/g, ''))) {
                    // Formato Raw Base64 (sem prefixo) - Comum na saída do jsPDF
                    console.log('📦 Detectado Base64 bruto. Convertendo para Blob...');
                    const byteCharacters = atob(fileData.replace(/\s/g, ''));
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: type });
                }
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
     * Auxiliar para limpar strings de preço (remove R$, espaços e converte vírgula)
     */
    cleanPrice(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        // Remove tudo que não é número, vírgula ou ponto
        const cleaned = String(val).replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
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
            // Tratamento robusto de preços e quantidades
            // formattedData.total_price pode vir do DBAdapter (número) ou de edições (string)
            const finalPrice = this.cleanPrice(formattedData.total_price);
            const finalQty = parseInt(formattedData.quantity) || 0;
            const unitPrice = finalQty > 0 ? (finalPrice / finalQty) : finalPrice;

            console.log('📦 Preparando objeto para Supabase:', {
                order_id: formattedData.order_id,
                price: finalPrice,
                qty: finalQty,
                unit: unitPrice
            });

            const row = {
                ID_PEDIDO: formattedData.order_id,
                ID_SIMULACAO: technicalJson.simulationId,
                TIPO_PRODUTO: formattedData.product_type,
                NOME_CLIENTE: formattedData.client_name || 'Simulador',
                TELEFONE_CLIENTE: formattedData.client_phone,
                COR_BASE: formattedData.color,
                TAMANHO: formattedData.grade,
                QUANTIDADE: finalQty,
                PRECO_FINAL: finalPrice,
                PRECO_UNITARIO: unitPrice, // Adicionado suporte a preço unitário
                pdf_url: formattedData.pdfUrl,
                json_tec: technicalJson, // Backup completo
                STATUS_PEDIDO: 'Simulação'
            };

            console.log('📤 Enviando linha para Supabase:', {
                id: row.ID_PEDIDO,
                preco: row.PRECO_FINAL,
                unitário: row.PRECO_UNITARIO,
                qty: row.QUANTIDADE
            });

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
            // IMPORTANT: The real timestamp column in the 'pedidos' table is 'criado_em', NOT 'created_at'
            const { data, error } = await window.supabaseClient
                .from('pedidos')
                .select('*')
                .order('criado_em', { ascending: false });

            if (error) throw error;
            console.log(`✅ ${data.length} pedidos carregados do Supabase`);
            return data;
        } catch (err) {
            console.error('❌ Erro ao buscar pedidos no Supabase:', err);
            return [];
        }
    },

    /**
     * Exclui um pedido do Banco de Dados e tenta limpar arquivos se necessário
     */
    async deletePedido(orderId) {
        if (!window.supabaseClient) {
            console.error('❌ Supabase Client não inicializado');
            return false;
        }

        try {
            const { error } = await window.supabaseClient
                .from('pedidos')
                .delete()
                .eq('ID_PEDIDO', orderId);

            if (error) throw error;
            console.log(`✅ Pedido ${orderId} excluído do Supabase`);
            return true;
        } catch (err) {
            console.error(`❌ Erro ao excluir pedido ${orderId} do Supabase:`, err);
            return false;
        }
    },

    /**
     * Exclui múltiplos pedidos do Banco de Dados
     * @param {string[]} orderIds - Lista de IDs de pedido
     */
    async deletePedidos(orderIds) {
        if (!window.supabaseClient || !orderIds || orderIds.length === 0) {
            return false;
        }

        try {
            const { error } = await window.supabaseClient
                .from('pedidos')
                .delete()
                .in('ID_PEDIDO', orderIds);

            if (error) throw error;
            console.log(`✅ ${orderIds.length} pedidos excluídos do Supabase`);
            return true;
        } catch (err) {
            console.error('❌ Erro ao excluir pedidos em massa no Supabase:', err);
            return false;
        }
    },

    /**
     * Aprova um pedido para a produção (Integração HNT-OPS)
     * Realiza a ponte entre o Simulador e o chão de fábrica.
     */
    async aprovarPedidoParaProducao(orderData) {
        if (!window.supabaseClient) {
            console.error('❌ Supabase Client não inicializado');
            return false;
        }

        try {
            const orderId = orderData.order_id || orderData.ID_PEDIDO;
            const docComprador = orderData.item?.client_info?.document || orderData.cliente_cpf || orderData.document;

            console.log(`🚀 Iniciando aprovação de pedido ${orderId} para HNT-OPS...`);

            // 1. Buscar o ID interno do cliente cadastrado (Foreign Key)
            let clienteInternalId = null;
            if (docComprador) {
                const { data: client, error: clientErr } = await window.supabaseClient
                    .from('clientes_cadastrados')
                    .select('id')
                    .eq('cpf_cnpj_comprador', docComprador.replace(/\D/g, ''))
                    .maybeSingle();

                if (!clientErr && client) {
                    clienteInternalId = client.id;
                    console.log('✅ Cliente identificado no banco:', clienteInternalId);
                }
            }

            // 2. Atualizar status na tabela original de pedidos
            const { error: updateErr } = await window.supabaseClient
                .from('pedidos')
                .update({
                    STATUS_PEDIDO: 'Aprovado',
                    json_tec: orderData.item || orderData.json_tec
                })
                .eq('ID_PEDIDO', orderId);

            if (updateErr) throw updateErr;

            // 3. Inserir na fila de produção (producao_pedidos)
            // Se o pedido já existir lá (vindo de uma retentativa), o Supabase pode recusar se houver UK, 
            // mas o migration_fase1.sql permite múltiplos se o numero_pedido não colidir.

            const prazo = new Date();
            prazo.setDate(prazo.getDate() + 15); // Padrão 15 dias

            const prodRow = {
                pedido_origem_id: orderId,
                cliente_id: clienteInternalId,
                sku: orderData.product_type || orderData.TIPO_PRODUTO || 'SKU-INDEFINIDO',
                quantidade: parseInt(orderData.quantity || orderData.QUANTIDADE || 1),
                tamanho: orderData.grade || orderData.TAMANHO || 'Personalizado',
                link_pdf: orderData.pdfUrl || orderData.pdf_url || '',
                prazo_entrega: prazo.toISOString().split('T')[0], // Apenas a data YYYY-MM-DD
                etapa_atual: 'Preparacao',
                urgente: false
            };

            const { data: prodResult, error: prodErr } = await window.supabaseClient
                .from('producao_pedidos')
                .insert([prodRow])
                .select();

            if (prodErr) {
                console.error('❌ Erro detalhado ao inserir na produção:', prodErr);
                throw prodErr;
            }

            console.log('✅ Pedido inserido com sucesso na fila de produção HNT-OPS!', prodResult);
            return true;

        } catch (err) {
            console.error('❌ Erro na integração Simulador -> HNT-OPS:', err);
            return false;
        }
    }
};

window.SupabaseAdapter = SupabaseAdapter;

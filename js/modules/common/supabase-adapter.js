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

            let completeJson = technicalJson;
            if (formattedData.DADOS_TECNICOS_JSON) {
                try {
                    completeJson = JSON.parse(formattedData.DADOS_TECNICOS_JSON);
                } catch (e) { /* fallback */ }
            }

            // 🔐 RLS: Get session userId for Row Level Security
            let userId = null;
            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                userId = session?.user?.id || null;
            } catch (authErr) { console.warn('Auth check failed', authErr); }

            // 🛡️ SECURITY: Price Tampering Validation
            let isPriceVerified = true;
            if (window.PricingValidator) {
                isPriceVerified = window.PricingValidator.verify({
                    model_name: formattedData.product_type,
                    specs: technicalJson,
                    PRECO_FINAL: finalPrice,
                    config: window.CONFIG // Assorted from global scope if available
                });

                if (!isPriceVerified) {
                    this.logAudit('security', 'warning', `Frontend Integrity Check Failed - Order ${formattedData.order_id}`, {
                        paid: finalPrice,
                        model: formattedData.product_type
                    });
                }
            } else {
                console.warn('⚠️ PricingValidator not found. Skipping client-side integrity check.');
            }



            const row = {
                ID_PEDIDO: formattedData.order_id,
                ID_SIMULACAO: technicalJson.simulationId || (completeJson ? completeJson.simulationId : ''),
                TIPO_PRODUTO: formattedData.product_type,
                NOME_CLIENTE: formattedData.client_name || 'Simulador',
                TELEFONE_CLIENTE: formattedData.client_phone,
                COR_BASE: formattedData.color,
                TAMANHO: formattedData.grade,
                QUANTIDADE: finalQty,
                PRECO_FINAL: finalPrice,
                PRECO_UNITARIO: unitPrice,
                pdf_url: formattedData.pdfUrl,
                json_tec: completeJson,
                auth_user_id: userId, // 🛡️ Linked to Supabase Auth
                is_price_verified: isPriceVerified, // 🛡️ Tampering detection flag
                STATUS_PEDIDO: isPriceVerified ? 'Simulação' : 'PENDING_AUDIT'

            };

            console.log('📤 Enviando linha para Supabase:', {
                id: row.ID_PEDIDO,
                preco: row.PRECO_FINAL,
                unitário: row.PRECO_UNITARIO,
                qty: row.QUANTIDADE
            });

            const { data, error } = await window.supabaseClient
                .from('pedidos')
                .upsert([row], { onConflict: 'ID_PEDIDO' })
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

            // --- DATA EXTRACTION & ROBUSTNESS ---
            // If we don't have the 'item' object (standard simulator format), 
            // try to reconstruct it from json_tec or DADOS_TECNICOS_JSON (Supabase format)
            let item = orderData.item;
            if (!item && (orderData.json_tec || orderData.DADOS_TECNICOS_JSON)) {
                try {
                    const rawJson = orderData.json_tec || orderData.DADOS_TECNICOS_JSON;
                    item = (typeof rawJson === 'string') ? JSON.parse(rawJson) : rawJson;
                    // If the parsed JSON is just the specs, wrap it
                    if (item && !item.specs && (item.parts || item.sizes)) {
                        item = { specs: item, simulator_type: orderData.TIPO_PRODUTO };
                    }
                } catch (e) { console.error("Erro ao parsear dados técnicos:", e); }
            }
            item = item || {};
            const specs = item.specs || item; // Fallback to item itself if not wrapped
            const parts = specs.parts || {};

            // Extract profile for fallback or ID lookup
            let profile = null;
            try {
                const pStr = localStorage.getItem('hnt_customer_profile');
                if (pStr) profile = JSON.parse(pStr);
            } catch (e) { }

            const docComprador = item.client_info?.document || orderData.cliente_cpf || orderData.document || profile?.document;

            console.log(`🚀 Iniciando aprovação de pedido ${orderId} para HNT-OPS...`);

            // 1. Buscar ou Criar o ID interno do cliente cadastrado (Foreign Key)
            let clienteInternalId = null;
            if (docComprador) {
                const cpfLimp = docComprador.replace(/\D/g, '');

                // Primeiro tenta buscar
                const { data: client, error: clientErr } = await window.supabaseClient
                    .from('clientes_cadastrados')
                    .select('id')
                    .eq('cpf_cnpj_comprador', cpfLimp)
                    .maybeSingle();

                if (!clientErr && client) {
                    clienteInternalId = client.id;
                } else {
                    // Se não achou, vamos tentar criar um registro básico para o HNT-OPS não ficar sem nome
                    const nomeFallback = item.client_info?.name || profile?.name || 'Cliente';
                    if (nomeFallback !== 'Cliente') {
                        console.log(`👤 Cliente não encontrado. Criando registro temporário para: ${nomeFallback}`);
                        const { data: newClient, error: insErr } = await window.supabaseClient
                            .from('clientes_cadastrados')
                            .upsert({
                                nome_comprador: nomeFallback,
                                cpf_cnpj_comprador: cpfLimp,
                                celular_comprador: item.client_info?.phone || profile?.whatsapp || '',
                                email_comprador: item.client_info?.email || profile?.email || ''
                            }, { onConflict: 'cpf_cnpj_comprador' })
                            .select('id')
                            .single();

                        if (!insErr && newClient) {
                            clienteInternalId = newClient.id;
                        }
                    }
                }
            }

            // 2. Atualizar status na tabela original de pedidos
            await window.supabaseClient
                .from('pedidos')
                .update({
                    STATUS_PEDIDO: 'Aprovado',
                    json_tec: item
                })
                .eq('ID_PEDIDO', orderId);

            // 3. Preparar Linha de Produção (HNT-OPS)
            const prazo = new Date();
            prazo.setDate(prazo.getDate() + 15);

            // Helper to clean color object to string
            const getColorLabel = (val) => {
                if (!val) return null;
                return (typeof val === 'object') ? (val.value || val.name || null) : val;
            };

            // Size Summary
            let sizeStr = 'Grade Única';
            if (specs.sizes) {
                const entries = Object.entries(specs.sizes).filter(([s, q]) => q > 0);
                if (entries.length > 0) {
                    sizeStr = entries.map(([s, q]) => `${q}x ${s}`).join(', ');
                }
            } else if (orderData.TAMANHO) {
                sizeStr = orderData.TAMANHO;
            }

            const prodRow = {
                pedido_origem_id: orderId,
                cliente_id: clienteInternalId,
                sku: item.simulator_type || orderData.TIPO_PRODUTO || 'SKU-INDEFINIDO',
                quantidade: parseInt(item.qty_total || orderData.QUANTIDADE || 1),
                tamanho: sizeStr,
                link_pdf: orderData.pdfUrl || orderData.pdf_url || item.pdf_path || '',

                // Technical Colors Mapping
                cor_centro: getColorLabel(parts.Centro || parts.Base || parts.cor_centro),
                cor_laterais: getColorLabel(parts.Laterais || parts.cor_laterais),
                cor_filete: getColorLabel(parts.Filete || parts.Filetes || parts.cor_filete),

                // Technique Mapping (Fallback to Bordado)
                tecnica: (parts.Tecnica || parts.tecnica || 'Bordado').includes('DTF') ? 'DTF' : 'Bordado',

                // NOVO: Full Technical Details for HNT-OPS dynamic rendering
                dados_tecnicos: {
                    parts: parts,
                    texts: specs.texts || {},
                    extras: specs.extras || {},
                    logoPunho: specs.logoPunho || null,
                    simulationId: specs.simulationId
                },

                // NOVO: Render Links mapping
                link_renders: {
                    frente: orderData.render_frente || null,
                    costas: orderData.render_costas || null,
                    lateral: orderData.render_lateral || null
                },

                numero_pedido: specs.orderNumber || orderId, // Sincroniza número puro (010008) com HNT-OPS
                prazo_entrega: prazo.toISOString().split('T')[0],
                etapa_atual: 'Preparacao',
                urgente: !!(orderData.urgente || false),
                observacoes: specs.observations || ''
            };


            const { data: prodResult, error: prodErr } = await window.supabaseClient
                .from('producao_pedidos')
                .insert([prodRow])
                .select();

            if (prodErr) throw prodErr;

            console.log('✅ Pedido inserido no HNT-OPS com mapeamento completo:', prodResult);
            return true;

        } catch (err) {
            console.error('❌ Erro na integração Simulador -> HNT-OPS:', err);
            return false;
        }
    },


},


    /**
     * Obtém o próximo número de pedido disponível, considerando o banco e configs.
     */
    async getNextOrderNumber() {
        if (!window.supabaseClient) return null;
        try {
            // 1. Buscar maior número na produção
            const { data: lastPedido, error: err1 } = await window.supabaseClient
                .from('producao_pedidos')
                .select('numero_pedido')
                .order('numero_pedido', { ascending: false })
                .limit(1);

            let maxFound = 0;
            if (lastPedido && lastPedido.length > 0) {
                // Remove prefixos se houver (ex: HNT-1000 -> 1000)
                const raw = lastPedido[0].numero_pedido.toString();
                maxFound = parseInt(raw.replace(/\D/g, '')) || 0;
            }

            // 2. Buscar número inicial na admin_config
            const { data: configRow, error: err2 } = await window.supabaseClient
                .from('admin_config')
                .select('valor')
                .eq('chave', 'proximo_id_simulacao');

            let startFrom = 1000;
            if (configRow && configRow.length > 0) {
                startFrom = parseInt(configRow[0].valor) || 1000;
            }

            // O próximo é o maior entre os dois + 1
            const nextNum = Math.max(maxFound, startFrom - 1) + 1;
            console.log(`🔢 Próximo número calculado: ${nextNum} (Max Prod: ${maxFound}, Start Admin: ${startFrom})`);

            return {
                number: nextNum,
                formatted: String(nextNum).padStart(6, '0')
            };

        } catch (e) {
            console.error('❌ Erro ao calcular próximo número de pedido:', e);
            return null;
        }
    },

        /**
         * Atualiza uma chave na tabela admin_config
         */
        async updateAdminConfig(chave, valor, descricao = '') {
    if (!window.supabaseClient) return;
    try {
        const { error } = await window.supabaseClient
            .from('admin_config')
            .upsert([{ chave, valor: valor.toString(), descricao, atualizado_em: new Date() }]);
        if (error) throw error;
        console.log(`⚙️ Config '${chave}' atualizada para '${valor}'`);
    } catch (e) {
        console.error(`❌ Falha ao atualizar config ${chave}:`, e);
    }
},


    /**
     * Registra um evento na tabela de auditoria
     */
    async logAudit(eventType, severity, description, metadata = {}) {
    if (!window.supabaseClient) return;
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        const { error } = await window.supabaseClient
            .from('audit_logs')
            .insert([{
                event_type: eventType,
                severity: severity,
                description: description,
                user_id: session?.user?.id || null,
                metadata: metadata
            }]);
        if (error) throw error;
    } catch (e) {
        console.error('❌ Falha ao registrar log de auditoria:', e);
    }
}
};

window.SupabaseAdapter = SupabaseAdapter;


const fs = require('fs');
const path = require('path');

/**
 * OrderController
 * Gerencia pedidos e PDFs
 */
class OrderController {
    /**
     * Valida MIME type de arquivos Base64
     * Previne uploads maliciosos
     */
    validateBase64MimeType(base64String) {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,/);

        if (!matches || matches.length < 2) {
            return { valid: false, reason: 'Formato Base64 inválido ou sem cabeçalho MIME' };
        }

        const mimeType = matches[1].toLowerCase();

        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf'
        ];

        if (!allowedMimes.includes(mimeType)) {
            return {
                valid: false,
                reason: `Tipo de arquivo não permitido: ${mimeType}. Apenas imagens e PDFs são aceitos.`
            };
        }

        return { valid: true, mimeType };
    }

    /**
     * POST /api/save-pedido
     * Salva snapshot do pedido como PDF/imagem
     */
    async savePedido(req, res) {
        const { id, snapshot, timestamp } = req.body;

        if (!id || !snapshot) {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Validação de segurança
        const validation = this.validateBase64MimeType(snapshot);
        if (!validation.valid) {
            console.warn(`⚠️ Upload bloqueado: ${validation.reason}`);
            return res.status(400).json({ error: validation.reason });
        }
        console.log(`✅ MIME type validado: ${validation.mimeType}`);

        try {
            const folderPath = path.join(process.cwd(), 'assets', 'BancoDados', 'PedidosPDF');

            // Garantir que pasta existe
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Formatar ID
            let fileBaseName = id.replace(/[^a-zA-Z0-9-_]/g, '_');

            // Detectar tipo (PDF ou Imagem)
            let extension = 'jpg';
            let dataToSave = snapshot;

            if (snapshot.startsWith('data:application/pdf')) {
                extension = 'pdf';
                dataToSave = snapshot.split('base64,')[1];
                console.log('Debug: Detected PDF data URI.');
            } else if (snapshot.startsWith('data:image')) {
                extension = 'jpg';
                dataToSave = snapshot.split('base64,')[1];
                console.log('Debug: Detected Image data URI.');
            } else {
                console.log('Debug: No data URI header detected. Checking req.body.type.');
                if (req.body.type === 'pdf') {
                    extension = 'pdf';
                }
            }

            const fileName = `Pedido_${fileBaseName}.${extension}`;
            const filePath = path.join(folderPath, fileName);

            fs.writeFileSync(filePath, dataToSave, 'base64');

            console.log(`✅ Pedido salvo: ${fileName}`);
            res.json({ success: true, path: filePath });
        } catch (err) {
            console.error('❌ Erro ao salvar pedido:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * DELETE /api/delete-pdf/:id
     * Deleta PDF de um pedido específico
     */
    async deletePdf(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID não fornecido' });
        }

        try {
            const folderPath = path.join(process.cwd(), 'assets', 'BancoDados', 'PedidosPDF');
            const fileBaseName = id.replace(/[^a-zA-Z0-9-_]/g, '_');

            // Tentar deletar ambos .pdf e .jpg (caso exista)
            const extensions = ['pdf', 'jpg', 'png'];
            let deleted = false;

            for (const ext of extensions) {
                const fileName = `Pedido_${fileBaseName}.${ext}`;
                const filePath = path.join(folderPath, fileName);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`✅ Arquivo deletado: ${fileName}`);
                    deleted = true;
                }
            }

            if (deleted) {
                res.json({ success: true, message: 'Arquivo deletado com sucesso' });
            } else {
                res.status(404).json({ error: 'Arquivo não encontrado' });
            }
        } catch (err) {
            console.error('❌ Erro ao deletar arquivo:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * GET /api/next-order-id
     * Retorna próximo ID sequencial de pedido (Centralizado via Supabase)
     */
    async getNextOrderId(req, res) {
        const supabase = require('../utils/supabase');

        try {
            // 1. Tenta carregar a configuração do Admin
            const { data: configData, error: configError } = await supabase
                .from('adm_cfg')
                .select('valor')
                .eq('chave', 'hnt_order_config')
                .single();

            // 2. Busca o maior número de pedido já existente na produção
            const { data: lastPedidos, error: pedidosError } = await supabase
                .from('dashboard_pedidos') // View ou tabela que contém o número formatado
                .select('numero_puro') // Assumindo que temos o número limpo
                .order('numero_puro', { ascending: false })
                .limit(1);

            let nextId = 1000; // Fallback inicial

            if (configData && configData.valor && configData.valor.nextNumber) {
                nextId = parseInt(configData.valor.nextNumber);
            }

            if (lastPedidos && lastPedidos.length > 0) {
                const lastNum = parseInt(lastPedidos[0].numero_puro);
                if (lastNum >= nextId) {
                    nextId = lastNum + 1;
                }
            }

            // 3. Atualiza a configuração para o próximo que pedir (Reserva)
            const nextReservation = nextId + 1;
            await supabase.from('adm_cfg').upsert({
                chave: 'hnt_order_config',
                valor: { nextNumber: nextReservation },
                atualizado_em: new Date().toISOString()
            }, { onConflict: 'chave' });

            console.log(`📡 Próximo ID Gerado e Reservado: ${nextId} (Próxima reserva: ${nextReservation})`);
            res.json({ number: nextId }); // Retorna 'number' para manter compatibilidade com o front antigo que esperava 'number' ou 'nextId'
        } catch (err) {
            console.error('❌ Erro ao gerar ID Centralizado:', err);

            // Fallback local se o Supabase falhar (Proteção de Produção)
            const seqFile = path.join(process.cwd(), 'assets', 'BancoDados', 'order_sequence.json');
            try {
                let sequence = { lastId: 999 };
                if (fs.existsSync(seqFile)) {
                    sequence = JSON.parse(fs.readFileSync(seqFile, 'utf-8'));
                }
                sequence.lastId++;
                fs.writeFileSync(seqFile, JSON.stringify(sequence, null, 2));
                return res.json({ number: sequence.lastId });
            } catch (e) {
                res.status(500).json({ error: 'Erro crítico de sequência' });
            }
        }
    }
}

module.exports = new OrderController();

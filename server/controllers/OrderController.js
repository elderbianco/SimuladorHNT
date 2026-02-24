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
     * Retorna próximo ID sequencial de pedido
     */
    async getNextOrderId(req, res) {
        const seqFile = path.join(process.cwd(), 'assets', 'BancoDados', 'order_sequence.json');

        try {
            let sequence = { lastId: 0 };

            if (fs.existsSync(seqFile)) {
                sequence = JSON.parse(fs.readFileSync(seqFile, 'utf-8'));
            }

            sequence.lastId++;
            fs.writeFileSync(seqFile, JSON.stringify(sequence, null, 2));

            res.json({ nextId: sequence.lastId });
        } catch (err) {
            console.error('❌ Erro ao gerar ID:', err);
            res.status(500).json({ error: 'Erro de sequencia' });
        }
    }
}

module.exports = new OrderController();

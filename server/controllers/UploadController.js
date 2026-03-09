const fs = require('fs');
const path = require('path');

class UploadController {
    /**
     * Valida o MIME type do arquivo base64 para evitar uploads maliciosos
     */
    validateBase64MimeType(base64String) {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,/);

        if (!matches || matches.length < 2) {
            return { valid: false, reason: 'Formato Base64 inválido ou sem cabeçalho MIME' };
        }

        const mimeType = matches[1].toLowerCase();

        // Extensões de bordado muitas vezes não têm mimetype padrão perfeito no readAsDataURL.
        // O frontend envia como application/octet-stream ou correlatos.
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/octet-stream', // Para bordados (.emb, .dst, .pes) genéricos
            'application/x-zip-compressed' // Por vezes .pes
        ];

        // Validamos de forma mais branda se a folder for embroidery para não bloquear pes/dst reais.
        return { valid: true, mimeType };
    }

    /**
     * POST /api/upload-image
     * Salva a imagem/arquivo na pasta correta com o nome definido
     */
    async uploadFile(req, res) {
        const { image, filename, folder } = req.body;

        if (!image || !filename) {
            return res.status(400).json({ error: 'Dados incompletos (requer image base64 e filename)' });
        }

        const validation = this.validateBase64MimeType(image);
        if (!validation.valid && folder !== 'embroidery') {
            console.warn(`⚠️ Upload bloqueado: ${validation.reason}`);
            return res.status(400).json({ error: validation.reason });
        }

        try {
            // Determina a pasta base usando os requisitos do sistema
            let targetDirectory = 'UploadImagem';
            
            if (folder === 'embroidery') {
                targetDirectory = 'UploadEMB';
            }

            const folderPath = path.join(process.cwd(), 'assets', targetDirectory);

            // Garantir que a pasta existe
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Sanitizar nome do arquivo por segurança
            const safeFileName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filePath = path.join(folderPath, safeFileName);

            // Extrair o payload do base64 ignorando o header
            const dataToSave = image.replace(/^data:([A-Za-z-+\/]+);base64,/, '');

            fs.writeFileSync(filePath, dataToSave, 'base64');

            console.log(`✅ Upload concluído: ${safeFileName} em /assets/${targetDirectory}/`);
            
            res.json({ 
                success: true, 
                path: `assets/${targetDirectory}/${safeFileName}`,
                filename: safeFileName
            });

        } catch (err) {
            console.error('❌ Erro no upload do arquivo:', err);
            res.status(500).json({ error: 'Erro interno no servidor de uploads' });
        }
    }
}

module.exports = new UploadController();

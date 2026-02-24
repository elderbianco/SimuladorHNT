const BackupManager = require('../../js/modules/common/backup-manager');

/**
 * BackupController
 * Gerencia backups do banco de dados
 */
class BackupController {
    /**
     * GET /api/backups
     * Lista todos os backups disponíveis
     */
    async listBackups(req, res) {
        try {
            const backups = await BackupManager.listBackups();
            res.json(backups);
        } catch (e) {
            console.error("❌ Erro ao listar backups:", e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * POST /api/backups/restore
     * Restaura um backup específico
     */
    async restoreBackup(req, res) {
        try {
            const { filename } = req.body;

            if (!filename) {
                return res.status(400).json({ error: 'Nome do arquivo de backup não fornecido' });
            }

            await BackupManager.restoreBackup(filename);

            console.log(`✅ Backup restaurado: ${filename}`);
            res.json({ success: true, message: 'Backup restaurado com sucesso' });
        } catch (e) {
            console.error("❌ Erro ao restaurar backup:", e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new BackupController();

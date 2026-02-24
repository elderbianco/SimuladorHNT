/**
 * Módulo de Gerenciamento de Backups
 * Cria backups automáticos do banco de dados Excel com versionamento
 */

const fs = require('fs');
const path = require('path');

const BackupManager = {
    /**
     * Cria um backup do banco de dados principal
     * @returns {Promise<string>} Caminho do arquivo de backup criado
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString()
                .replace(/:/g, '-')
                .replace(/\./g, '-')
                .split('T')[0] + '_' + new Date().toTimeString().split(' ')[0].replace(/:/g, '-');

            const backupDir = path.join(__dirname, '../../../assets/BancoDados/Backups');

            // Criar diretório se não existir
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
                console.log('📁 Diretório de backups criado');
            }

            // Caminho do arquivo principal
            const source = path.join(__dirname, '../../../assets/BancoDados/BancoDados_Mestre.xlsx');

            // Verificar se arquivo existe
            if (!fs.existsSync(source)) {
                console.warn('⚠️ Arquivo principal não encontrado, backup não criado');
                return null;
            }

            // Caminho do backup
            const backup = path.join(backupDir, `BancoDados_${timestamp}.xlsx`);

            // Copiar arquivo
            fs.copyFileSync(source, backup);

            // Obter tamanho do arquivo
            const stats = fs.statSync(backup);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

            console.log(`✅ Backup criado: ${path.basename(backup)} (${sizeMB} MB)`);

            // Limpar backups antigos
            this.cleanOldBackups(backupDir, 30);

            return backup;
        } catch (error) {
            console.error('❌ Erro ao criar backup:', error.message);
            throw error;
        }
    },

    /**
     * Remove backups mais antigos que o número de dias especificado
     * @param {string} dir - Diretório de backups
     * @param {number} daysToKeep - Número de dias para manter
     */
    cleanOldBackups(dir, daysToKeep = 30) {
        try {
            const files = fs.readdirSync(dir);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

            let removedCount = 0;

            files.forEach(file => {
                // Ignorar arquivos que não são backups
                if (!file.startsWith('BancoDados_') || !file.endsWith('.xlsx')) {
                    return;
                }

                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    removedCount++;
                    console.log(`🗑️ Backup antigo removido: ${file}`);
                }
            });

            if (removedCount > 0) {
                console.log(`🧹 ${removedCount} backup(s) antigo(s) removido(s)`);
            }
        } catch (error) {
            console.error('⚠️ Erro ao limpar backups antigos:', error.message);
        }
    },

    /**
     * Lista todos os backups disponíveis
     * @returns {Array} Lista de backups com informações
     */
    listBackups() {
        try {
            const backupDir = path.join(__dirname, '../../../assets/BancoDados/Backups');

            if (!fs.existsSync(backupDir)) {
                return [];
            }

            const files = fs.readdirSync(backupDir);

            const backups = files
                .filter(file => file.startsWith('BancoDados_') && file.endsWith('.xlsx'))
                .map(file => {
                    const filePath = path.join(backupDir, file);
                    const stats = fs.statSync(filePath);

                    return {
                        filename: file,
                        path: filePath,
                        size: stats.size,
                        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
                        created: stats.mtime,
                        age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
                    };
                })
                .sort((a, b) => b.created - a.created); // Mais recente primeiro

            return backups;
        } catch (error) {
            console.error('❌ Erro ao listar backups:', error.message);
            return [];
        }
    },

    /**
     * Restaura um backup específico
     * @param {string} backupFilename - Nome do arquivo de backup
     * @returns {Promise<boolean>} Sucesso da operação
     */
    async restoreBackup(backupFilename) {
        try {
            const backupDir = path.join(__dirname, '../../../assets/BancoDados/Backups');
            const backupPath = path.join(backupDir, backupFilename);
            const targetPath = path.join(__dirname, '../../../assets/BancoDados/BancoDados_Mestre.xlsx');

            // Verificar se backup existe
            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup não encontrado');
            }

            // Criar backup do arquivo atual antes de restaurar
            const currentBackup = path.join(backupDir, `BancoDados_pre-restore_${Date.now()}.xlsx`);
            if (fs.existsSync(targetPath)) {
                fs.copyFileSync(targetPath, currentBackup);
                console.log(`💾 Backup do estado atual criado: ${path.basename(currentBackup)}`);
            }

            // Restaurar backup
            fs.copyFileSync(backupPath, targetPath);

            console.log(`✅ Backup restaurado: ${backupFilename}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error.message);
            throw error;
        }
    }
};

module.exports = BackupManager;

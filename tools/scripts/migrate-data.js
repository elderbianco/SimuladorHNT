/**
 * MIGRATE DATA - Migra dados do localStorage para JSON estruturado
 * Executa uma única vez para converter dados existentes
 */

const db = require('./database-manager');
const fs = require('fs');
const path = require('path');

class DataMigrator {
    constructor() {
        this.stats = {
            pedidos_migrados: 0,
            clientes_criados: 0,
            erros: 0
        };
    }

    /**
     * Migra dados do localStorage (simulado via arquivo)
     */
    async migrateFromLocalStorage() {
        console.log('🔄 Iniciando migração de dados...\n');

        try {
            // Simular leitura do localStorage
            // Em produção, isso seria feito no navegador
            const localStorageData = this._readLocalStorageBackup();

            if (!localStorageData || !localStorageData.length) {
                console.log('⚠️  Nenhum dado encontrado para migrar');
                return;
            }

            console.log(`📦 Encontrados ${localStorageData.length} pedidos para migrar\n`);

            // Migrar cada pedido
            for (const oldOrder of localStorageData) {
                try {
                    await this._migrateOrder(oldOrder);
                    this.stats.pedidos_migrados++;
                } catch (error) {
                    console.error(`❌ Erro ao migrar pedido ${oldOrder.order_id}:`, error.message);
                    this.stats.erros++;
                }
            }

            // Exibir estatísticas
            console.log('\n✅ MIGRAÇÃO CONCLUÍDA!\n');
            console.log('📊 ESTATÍSTICAS:');
            console.log(`   Pedidos migrados: ${this.stats.pedidos_migrados}`);
            console.log(`   Clientes criados: ${this.stats.clientes_criados}`);
            console.log(`   Erros: ${this.stats.erros}`);

        } catch (error) {
            console.error('❌ Erro na migração:', error.message);
        }
    }

    /**
     * Migra um pedido individual
     */
    async _migrateOrder(oldOrder) {
        // 1. Processar cliente
        let cliente = null;
        if (oldOrder.client_info && oldOrder.client_info.phone) {
            cliente = db.getClientByPhone(oldOrder.client_info.phone);

            if (!cliente) {
                cliente = db.upsertClient({
                    nome: oldOrder.client_info.name || '',
                    telefone: oldOrder.client_info.phone || '',
                    email: oldOrder.client_info.email || ''
                });
                this.stats.clientes_criados++;
            }
        }

        // 2. Parsear dados técnicos
        let dadosTecnicos = null;
        try {
            if (oldOrder.DADOS_TECNICOS_JSON) {
                dadosTecnicos = JSON.parse(oldOrder.DADOS_TECNICOS_JSON);
            }
        } catch (e) {
            console.warn(`   ⚠️  Erro ao parsear DADOS_TECNICOS_JSON do pedido ${oldOrder.order_id}`);
        }

        // 3. Estruturar novo pedido
        const newOrder = {
            id: oldOrder.order_id,
            id_simulacao: dadosTecnicos?.simulationId || oldOrder.order_id,
            tipo_produto: oldOrder.item?.simulator_type || 'shorts',
            created_at: oldOrder.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: oldOrder.status || 'pendente',
            cliente_id: cliente?.id || null,
            cliente: cliente ? {
                nome: cliente.nome,
                telefone: cliente.telefone,
                email: cliente.email
            } : null,
            observacoes: dadosTecnicos?.observations || '',

            // Item do pedido
            item: {
                modelo: this._getProductName(oldOrder, dadosTecnicos),
                quantidade_total: oldOrder.item?.qty_total || 0,
                tamanhos: dadosTecnicos?.sizes || {},
                cores: dadosTecnicos?.parts || {},
                logos: this._extractLogos(dadosTecnicos),
                textos: this._extractTextos(dadosTecnicos),
                extras: this._extractExtras(dadosTecnicos)
            },

            // Financeiro
            financeiro: {
                preco_unitario: oldOrder.item?.pricing?.unit_price || 0,
                preco_total: oldOrder.item?.pricing?.total_price || 0,
                preco_final: oldOrder.item?.pricing?.total_price || 0,
                breakdown: {
                    base: oldOrder.item?.pricing?.breakdown?.base || 0,
                    personalizacao: oldOrder.item?.pricing?.breakdown?.addons || 0,
                    extras: oldOrder.item?.pricing?.breakdown?.extras || 0,
                    dev_fees: oldOrder.item?.pricing?.breakdown?.dev_fees || 0,
                    discounts: oldOrder.item?.pricing?.breakdown?.discounts || 0
                }
            },

            // Dados técnicos completos (para restauração)
            dados_tecnicos_json: oldOrder.DADOS_TECNICOS_JSON || ''
        };

        // 4. Salvar no novo formato
        db.addOrder(newOrder);

        console.log(`   ✓ Migrado: ${newOrder.id} (${newOrder.tipo_produto})`);
    }

    /**
     * Helper to determine Product Name from Item or State
     */
    _getProductName(oldOrder, dadosTecnicos) {
        let name = oldOrder.item?.model_name;
        if (name && name !== 'Produto Personalizado' && name !== 'custom') return name;

        if (dadosTecnicos) {
            if (dadosTecnicos.config && dadosTecnicos.config.product) return dadosTecnicos.config.product;
            if (dadosTecnicos.productInitial) {
                const map = {
                    'SH': 'Shorts Fight',
                    'TP': 'Top',
                    'LG': 'Legging',
                    'ML': 'Moletom',
                    'SL': 'Shorts Legging'
                };
                if (map[dadosTecnicos.productInitial]) return map[dadosTecnicos.productInitial];
            }
        }
        return name || 'Produto Personalizado';
    }

    /**
     * Extrai logos dos dados técnicos
     */
    _extractLogos(dadosTecnicos) {
        if (!dadosTecnicos || !dadosTecnicos.uploads) return [];

        const logos = [];
        Object.entries(dadosTecnicos.uploads).forEach(([zona, data]) => {
            if (data && (data.src || data.filename)) {
                logos.push({
                    zona: zona,
                    arquivo: data.filename || data.src || '',
                    posicao: { x: data.x || 0, y: data.y || 0 },
                    escala: data.scale || 1,
                    rotacao: data.rotation || 0
                });
            }
        });

        return logos;
    }

    /**
     * Extrai textos dos dados técnicos
     */
    _extractTextos(dadosTecnicos) {
        if (!dadosTecnicos || !dadosTecnicos.texts) return [];

        const textos = [];
        Object.entries(dadosTecnicos.texts).forEach(([zona, data]) => {
            if (data && data.enabled && data.content) {
                textos.push({
                    zona: zona,
                    conteudo: data.content,
                    fonte: data.fontFamily || 'Arial',
                    tamanho: data.fontSize || 24,
                    cor: data.color || '#FFFFFF'
                });
            }
        });

        return textos;
    }

    /**
     * Extrai extras dos dados técnicos
     */
    _extractExtras(dadosTecnicos) {
        if (!dadosTecnicos || !dadosTecnicos.extras) return [];

        const extras = [];
        Object.entries(dadosTecnicos.extras).forEach(([key, data]) => {
            if (data && data.enabled) {
                extras.push({
                    tipo: key,
                    cor: data.color || '',
                    ativo: true
                });
            }
        });

        return extras;
    }

    /**
     * Lê backup do localStorage (para teste)
     */
    _readLocalStorageBackup() {
        try {
            // Tentar ler do arquivo de backup se existir
            const backupFile = path.join(__dirname, 'localStorage-backup.json');
            if (fs.existsSync(backupFile)) {
                const content = fs.readFileSync(backupFile, 'utf8');
                return JSON.parse(content);
            }
            return [];
        } catch (error) {
            console.error('Erro ao ler backup:', error.message);
            return [];
        }
    }

    /**
     * Cria backup do localStorage atual (executar no navegador)
     */
    static createLocalStorageBackup() {
        // Este código deve ser executado no console do navegador
        const script = `
// Cole este código no console do navegador para criar backup
const data = localStorage.getItem('hnt_all_orders_db');
if (data) {
    const orders = JSON.parse(data);
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localStorage-backup.json';
    a.click();
    console.log('✅ Backup criado! Salve o arquivo na pasta do projeto.');
} else {
    console.log('❌ Nenhum dado encontrado no localStorage');
}
        `;

        console.log('\n📝 INSTRUÇÕES PARA CRIAR BACKUP:\n');
        console.log('1. Abra o navegador e vá para: http://localhost:3000');
        console.log('2. Abra o Console (F12)');
        console.log('3. Cole o código abaixo e pressione Enter:\n');
        console.log(script);
        console.log('\n4. Salve o arquivo baixado como "localStorage-backup.json" na pasta do projeto');
        console.log('5. Execute novamente este script de migração\n');
    }
}

// Se executado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log('\n📚 USO:');
        console.log('   node migrate-data.js              - Migra dados do backup');
        console.log('   node migrate-data.js --backup     - Mostra instruções para criar backup\n');
    } else if (args.includes('--backup')) {
        DataMigrator.createLocalStorageBackup();
    } else {
        const migrator = new DataMigrator();
        migrator.migrateFromLocalStorage();
    }
}

module.exports = DataMigrator;

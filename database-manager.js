/**
 * DATABASE MANAGER - Gerenciador Centralizado de Dados
 * Estrutura híbrida: JSON + Excel
 * Preparado para migração Supabase
 */

const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.basePath = path.join(__dirname, 'database');
        this.configPath = path.join(this.basePath, 'config');
        this.ordersPath = path.join(this.basePath, 'orders');
        this.clientsPath = path.join(this.basePath, 'clients');
        this.backupPath = path.join(this.basePath, 'backup');
    }

    // ==================== CONFIGURAÇÃO ====================

    /**
     * Carrega configuração de preços
     */
    loadPricing() {
        const file = path.join(this.configPath, 'pricing.json');
        return this._loadJSON(file);
    }

    /**
     * Salva configuração de preços
     */
    savePricing(data) {
        const file = path.join(this.configPath, 'pricing.json');
        data.last_updated = new Date().toISOString();
        return this._saveJSON(file, data);
    }

    /**
     * Carrega cores disponíveis
     */
    loadColors() {
        const file = path.join(this.configPath, 'colors.json');
        return this._loadJSON(file);
    }

    /**
     * Salva cores disponíveis
     */
    saveColors(data) {
        const file = path.join(this.configPath, 'colors.json');
        data.last_updated = new Date().toISOString();
        return this._saveJSON(file, data);
    }

    // ==================== PEDIDOS ====================

    /**
     * Carrega todos os pedidos
     */
    loadOrders() {
        const file = path.join(this.ordersPath, 'pedidos.json');
        return this._loadJSON(file);
    }

    /**
     * Adiciona novo pedido
     */
    addOrder(order) {
        const data = this.loadOrders();

        // Gerar ID se não existir
        if (!order.id) {
            order.id = this._generateOrderId(order.tipo_produto);
        }

        // Adicionar timestamps
        order.created_at = order.created_at || new Date().toISOString();
        order.updated_at = new Date().toISOString();

        // Adicionar à lista
        data.pedidos.push(order);
        data.last_updated = new Date().toISOString();

        // Salvar
        this._saveJSON(path.join(this.ordersPath, 'pedidos.json'), data);

        // Fazer backup
        this._backup('pedidos');

        return order;
    }

    /**
     * Atualiza pedido existente
     */
    updateOrder(orderId, updates) {
        const data = this.loadOrders();
        const index = data.pedidos.findIndex(p => p.id === orderId);

        if (index === -1) {
            throw new Error(`Pedido ${orderId} não encontrado`);
        }

        // Atualizar
        data.pedidos[index] = {
            ...data.pedidos[index],
            ...updates,
            updated_at: new Date().toISOString()
        };

        data.last_updated = new Date().toISOString();

        // Salvar
        this._saveJSON(path.join(this.ordersPath, 'pedidos.json'), data);

        return data.pedidos[index];
    }

    /**
     * Busca pedido por ID
     */
    getOrder(orderId) {
        const data = this.loadOrders();
        return data.pedidos.find(p => p.id === orderId);
    }

    /**
     * Busca pedidos por filtro
     */
    findOrders(filter = {}) {
        const data = this.loadOrders();
        let results = data.pedidos;

        // Filtrar por tipo de produto
        if (filter.tipo_produto) {
            results = results.filter(p => p.tipo_produto === filter.tipo_produto);
        }

        // Filtrar por status
        if (filter.status) {
            results = results.filter(p => p.status === filter.status);
        }

        // Filtrar por cliente
        if (filter.cliente_id) {
            results = results.filter(p => p.cliente_id === filter.cliente_id);
        }

        // Filtrar por data
        if (filter.data_inicio) {
            results = results.filter(p => p.created_at >= filter.data_inicio);
        }

        if (filter.data_fim) {
            results = results.filter(p => p.created_at <= filter.data_fim);
        }

        return results;
    }

    // ==================== CLIENTES ====================

    /**
     * Carrega todos os clientes
     */
    loadClients() {
        const file = path.join(this.clientsPath, 'clientes.json');
        return this._loadJSON(file);
    }

    /**
     * Adiciona ou atualiza cliente
     */
    upsertClient(clientData) {
        const data = this.loadClients();

        // Buscar cliente existente por telefone
        let client = data.clientes.find(c => c.telefone === clientData.telefone);

        if (client) {
            // Atualizar existente
            Object.assign(client, clientData);
            client.updated_at = new Date().toISOString();
        } else {
            // Criar novo
            client = {
                id: this._generateClientId(),
                ...clientData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                total_pedidos: 0,
                total_gasto: 0
            };
            data.clientes.push(client);
        }

        data.last_updated = new Date().toISOString();

        // Salvar
        this._saveJSON(path.join(this.clientsPath, 'clientes.json'), data);

        return client;
    }

    /**
     * Busca cliente por ID
     */
    getClient(clientId) {
        const data = this.loadClients();
        return data.clientes.find(c => c.id === clientId);
    }

    /**
     * Busca cliente por telefone
     */
    getClientByPhone(phone) {
        const data = this.loadClients();
        return data.clientes.find(c => c.telefone === phone);
    }

    // ==================== UTILITÁRIOS ====================

    /**
     * Carrega arquivo JSON
     */
    _loadJSON(file) {
        try {
            if (!fs.existsSync(file)) {
                return { version: '1.0.0', last_updated: new Date().toISOString() };
            }
            const content = fs.readFileSync(file, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Erro ao carregar ${file}:`, error.message);
            return { version: '1.0.0', last_updated: new Date().toISOString() };
        }
    }

    /**
     * Salva arquivo JSON
     */
    _saveJSON(file, data) {
        try {
            const content = JSON.stringify(data, null, 2);
            fs.writeFileSync(file, content, 'utf8');
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${file}:`, error.message);
            return false;
        }
    }

    /**
     * Gera ID de pedido
     */
    _generateOrderId(tipo) {
        const prefixes = {
            'shorts': 'SH',
            'top': 'TP',
            'legging': 'LG',
            'moletom': 'ML',
            'shorts_legging': 'SL'
        };

        const prefix = prefixes[tipo] || 'XX';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        return `HNT-${prefix}-${timestamp}${random}`;
    }

    /**
     * Gera ID de cliente
     */
    _generateClientId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CLI-${timestamp}${random}`;
    }

    /**
     * Faz backup de arquivo
     */
    _backup(type) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const sourceFile = path.join(
                type === 'pedidos' ? this.ordersPath : this.clientsPath,
                `${type}.json`
            );
            const backupFile = path.join(this.backupPath, `${type}_${timestamp}.json`);

            if (fs.existsSync(sourceFile)) {
                fs.copyFileSync(sourceFile, backupFile);
            }
        } catch (error) {
            console.error(`Erro ao fazer backup de ${type}:`, error.message);
        }
    }

    /**
     * Estatísticas gerais
     */
    getStats() {
        const orders = this.loadOrders();
        const clients = this.loadClients();

        return {
            total_pedidos: orders.pedidos.length,
            total_clientes: clients.clientes.length,
            pedidos_por_tipo: this._countByField(orders.pedidos, 'tipo_produto'),
            pedidos_por_status: this._countByField(orders.pedidos, 'status'),
            valor_total: orders.pedidos.reduce((sum, p) => sum + (p.financeiro?.preco_total || 0), 0)
        };
    }

    /**
     * Conta registros por campo
     */
    _countByField(array, field) {
        return array.reduce((acc, item) => {
            const value = item[field] || 'indefinido';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }
}

// Exportar instância única (Singleton)
module.exports = new DatabaseManager();

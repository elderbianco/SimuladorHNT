/**
 * EXCEL GENERATOR - Gera Excel a partir do JSON
 * Mantém compatibilidade com estrutura atual
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const db = require('./database-manager');

class ExcelGenerator {
    constructor() {
        this.outputPath = path.join(__dirname, 'assets', 'BancoDados', 'BancoDados_Novo.xlsx');
    }

    /**
     * Gera Excel completo a partir dos JSONs
     */
    generate() {
        console.log('📊 Gerando Excel a partir dos dados JSON...\n');

        const workbook = XLSX.utils.book_new();

        // 1. Aba CONFIG
        this._addConfigSheet(workbook);

        // 2. Aba PRICING
        this._addPricingSheet(workbook);

        // 3. Aba COLORS
        this._addColorsSheet(workbook);

        // 4. Aba CLIENTES
        this._addClientsSheet(workbook);

        // 5. Aba CENTRAL_PEDIDOS (consolidado)
        this._addCentralOrdersSheet(workbook);

        // 6. Abas por produto
        this._addProductSheets(workbook);

        // Salvar arquivo
        XLSX.writeFile(workbook, this.outputPath);

        console.log(`✅ Excel gerado com sucesso: ${this.outputPath}\n`);

        // Estatísticas
        const stats = db.getStats();
        console.log('📈 ESTATÍSTICAS:');
        console.log(`   Total de Pedidos: ${stats.total_pedidos}`);
        console.log(`   Total de Clientes: ${stats.total_clientes}`);
        console.log(`   Valor Total: R$ ${stats.valor_total.toFixed(2)}`);
        console.log(`   Por Tipo:`, stats.pedidos_por_tipo);
        console.log(`   Por Status:`, stats.pedidos_por_status);
    }

    /**
     * Adiciona aba CONFIG
     */
    _addConfigSheet(workbook) {
        const pricing = db.loadPricing();
        const colors = db.loadColors();

        const data = [
            ['CATEGORIA', 'CHAVE', 'VALOR', 'TIPO_PRODUTO', 'DESCRICAO'],
            ['info', 'version', pricing.version, 'global', 'Versão do schema'],
            ['info', 'last_updated', pricing.last_updated, 'global', 'Última atualização'],
            ['', '', '', '', ''],
            ['CONFIGURAÇÕES DE CORES', '', '', '', ''],
            ['colors', 'total_available', colors.available_colors.length, 'global', 'Total de cores disponíveis'],
            ['colors', 'total_disabled', colors.disabled_colors.length, 'global', 'Total de cores desabilitadas'],
            ['colors', 'total_text_colors', colors.text_colors.length, 'global', 'Total de cores de texto']
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, 'CONFIG');
    }

    /**
     * Adiciona aba PRICING
     */
    _addPricingSheet(workbook) {
        const pricing = db.loadPricing();

        const data = [
            ['TIPO_PRODUTO', 'ITEM', 'VALOR', 'UNIDADE', 'DESCRICAO']
        ];

        Object.entries(pricing.products).forEach(([product, config]) => {
            data.push([product, 'base_price', config.base_price, 'R$', 'Preço base do produto']);

            if (config.logo_center_price) data.push([product, 'logo_center_price', config.logo_center_price, 'R$', 'Logo centro']);
            if (config.logo_lat_price) data.push([product, 'logo_lat_price', config.logo_lat_price, 'R$', 'Logo lateral']);
            if (config.logo_leg_price) data.push([product, 'logo_leg_price', config.logo_leg_price, 'R$', 'Logo perna']);
            if (config.text_price) data.push([product, 'text_price', config.text_price, 'R$', 'Texto padrão']);
            if (config.text_lat_price) data.push([product, 'text_lat_price', config.text_lat_price, 'R$', 'Texto lateral']);
            if (config.text_leg_price) data.push([product, 'text_leg_price', config.text_leg_price, 'R$', 'Texto perna']);
            if (config.dev_fee) data.push([product, 'dev_fee', config.dev_fee, 'R$', 'Taxa de matriz']);

            if (config.extras) {
                Object.entries(config.extras).forEach(([extra, price]) => {
                    data.push([product, `extra_${extra}`, price, 'R$', `Extra: ${extra}`]);
                });
            }

            data.push(['', '', '', '', '']); // Linha em branco
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, 'PRICING');
    }

    /**
     * Adiciona aba COLORS
     */
    _addColorsSheet(workbook) {
        const colors = db.loadColors();

        const data = [
            ['ID', 'NOME', 'HEX', 'CATEGORIA', 'ATIVO']
        ];

        colors.available_colors.forEach(color => {
            const disabled = colors.disabled_colors.includes(color.id);
            data.push([
                color.id,
                color.name,
                color.hex,
                color.category,
                disabled ? 'NÃO' : 'SIM'
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, 'COLORS');
    }

    /**
     * Adiciona aba CLIENTES
     */
    _addClientsSheet(workbook) {
        const clientsData = db.loadClients();

        const data = [
            ['ID', 'NOME', 'TELEFONE', 'EMAIL', 'TOTAL_PEDIDOS', 'TOTAL_GASTO', 'DATA_CADASTRO', 'ULTIMA_COMPRA']
        ];

        clientsData.clientes.forEach(client => {
            data.push([
                client.id,
                client.nome || '',
                client.telefone || '',
                client.email || '',
                client.total_pedidos || 0,
                client.total_gasto || 0,
                client.created_at || '',
                client.updated_at || ''
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, 'CLIENTES');
    }

    /**
     * Adiciona aba CENTRAL_PEDIDOS (consolidado)
     */
    _addCentralOrdersSheet(workbook) {
        const ordersData = db.loadOrders();

        const data = [this._getOrderHeaders()];

        ordersData.pedidos.forEach(order => {
            data.push(this._orderToRow(order));
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, ws, 'CENTRAL_PEDIDOS');
    }

    /**
     * Adiciona abas por produto
     */
    _addProductSheets(workbook) {
        const ordersData = db.loadOrders();
        const products = ['shorts', 'top', 'legging', 'shorts_legging', 'moletom'];

        products.forEach(product => {
            const productOrders = ordersData.pedidos.filter(o => o.tipo_produto === product);

            const data = [this._getOrderHeaders()];

            productOrders.forEach(order => {
                data.push(this._orderToRow(order));
            });

            const sheetName = product.toUpperCase().replace('_', '_');
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        });
    }

    /**
     * Retorna cabeçalhos das colunas de pedidos
     */
    _getOrderHeaders() {
        return [
            'ID_PEDIDO',
            'ID_SIMULACAO',
            'TIPO_PRODUTO',
            'DATA_CRIACAO',
            'DATA_ATUALIZACAO',
            'STATUS_PEDIDO',
            'CLIENTE_ID',
            'NOME_CLIENTE',
            'TELEFONE_CLIENTE',
            'EMAIL_CLIENTE',
            'OBS_CLIENTE',
            'QUANTIDADE_TOTAL',
            'PRECO_UNITARIO',
            'PRECO_TOTAL',
            'VALOR_DESCONTOS',
            'PRECO_FINAL',
            'DADOS_TECNICOS_JSON'
        ];
    }

    /**
     * Converte pedido para linha do Excel
     */
    _orderToRow(order) {
        return [
            order.id || '',
            order.id_simulacao || '',
            order.tipo_produto || '',
            order.created_at || '',
            order.updated_at || '',
            order.status || 'pendente',
            order.cliente_id || '',
            order.cliente?.nome || '',
            order.cliente?.telefone || '',
            order.cliente?.email || '',
            order.observacoes || '',
            order.item?.quantidade_total || 0,
            order.financeiro?.preco_unitario || 0,
            order.financeiro?.preco_total || 0,
            order.financeiro?.breakdown?.discounts || 0,
            order.financeiro?.preco_final || order.financeiro?.preco_total || 0,
            order.dados_tecnicos_json || ''
        ];
    }
}

// Se executado diretamente
if (require.main === module) {
    const generator = new ExcelGenerator();
    generator.generate();
}

module.exports = ExcelGenerator;

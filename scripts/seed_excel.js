const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------
// 1. CONFIGURAÇÃO DO SCHEMA (107+ Colunas)
// ---------------------------------------------------------
const priorityCols = [
    // 1. IDENTIFICAÇÃO
    "ID_PEDIDO", "ID_SIMULACAO", "TIPO_PRODUTO", "DATA_CRIACAO", "DATA_ATUALIZACAO",
    "DATA_PEDIDO", "STATUS_PEDIDO", "NUMERO_ITEM",

    // 2. DADOS DO CLIENTE
    "NOME_CLIENTE", "TELEFONE_CLIENTE", "EMAIL_CLIENTE", "OBS_CLIENTE",

    // 3. CORES VARIÁVEIS
    "COR_PRINCIPAL", "COR_LATERAL_DIREITA", "COR_LATERAL_ESQUERDA", "COR_CENTRO",
    "COR_COS", "COR_VIES", "COR_DETALHES",
    "COR_PERNA_DIR_SUP", "COR_PERNA_DIR_INF", "COR_PERNA_ESQ_SUP", "COR_PERNA_ESQ_INF",

    // 4. GRADE DE TAMANHOS
    "QTD_TAMANHO_PP", "QTD_TAMANHO_P", "QTD_TAMANHO_M", "QTD_TAMANHO_G", "QTD_TAMANHO_GG",
    "QTD_TAMANHO_EXG", "QTD_TAMANHO_EXGG",
    "QTD_TAMANHO_38", "QTD_TAMANHO_40", "QTD_TAMANHO_42", "QTD_TAMANHO_44",
    "QTD_TAMANHO_46", "QTD_TAMANHO_48",
    "QUANTIDADE_TOTAL",

    // 5. EXTRAS
    "EXTRA_LEGGING_INTERNA", "EXTRA_CORDAO", "EXTRA_LACOS",

    // 6. LOGOS
    "Logo_Centro_Arquivo", "Logo_Centro_Posicao_X", "Logo_Centro_Posicao_Y", "Logo_Centro_Escala", "Logo_Centro_Rotacao",
    "Logo_Lateral_Dir_Arquivo", "Logo_Lateral_Dir_Posicao_X", "Logo_Lateral_Dir_Posicao_Y", "Logo_Lateral_Dir_Escala", "Logo_Lateral_Dir_Rotacao",
    "Logo_Lateral_Esq_Arquivo", "Logo_Lateral_Esq_Posicao_X", "Logo_Lateral_Esq_Posicao_Y", "Logo_Lateral_Esq_Escala", "Logo_Lateral_Esq_Rotacao",
    "Logo_Perna_Dir_Meio_Arquivo", "Logo_Perna_Dir_Meio_Posicao_X", "Logo_Perna_Dir_Meio_Posicao_Y", "Logo_Perna_Dir_Meio_Escala", "Logo_Perna_Dir_Meio_Rotacao",
    "Logo_Perna_Dir_Inf_Arquivo", "Logo_Perna_Dir_Inf_Posicao_X", "Logo_Perna_Dir_Inf_Posicao_Y", "Logo_Perna_Dir_Inf_Escala", "Logo_Perna_Dir_Inf_Rotacao",
    "Logo_Perna_Esq_Meio_Arquivo", "Logo_Perna_Esq_Meio_Posicao_X", "Logo_Perna_Esq_Meio_Posicao_Y", "Logo_Perna_Esq_Meio_Escala", "Logo_Perna_Esq_Meio_Rotacao",

    // 7. TEXTOS
    "Texto_Centro_Conteudo", "Texto_Centro_Fonte", "Texto_Centro_Tamanho", "Texto_Centro_Cor", "Texto_Centro_Posicao_X", "Texto_Centro_Posicao_Y", "Texto_Centro_Rotacao",
    "Texto_Perna_Dir_Meio_Conteudo", "Texto_Perna_Dir_Meio_Fonte", "Texto_Perna_Dir_Meio_Tamanho", "Texto_Perna_Dir_Meio_Cor", "Texto_Perna_Dir_Meio_Posicao_X", "Texto_Perna_Dir_Meio_Posicao_Y", "Texto_Perna_Dir_Meio_Rotacao",
    "Texto_Perna_Dir_Inf_Conteudo", "Texto_Perna_Dir_Inf_Fonte", "Texto_Perna_Dir_Inf_Tamanho", "Texto_Perna_Dir_Inf_Cor", "Texto_Perna_Dir_Inf_Posicao_X", "Texto_Perna_Dir_Inf_Posicao_Y", "Texto_Perna_Dir_Inf_Rotacao",
    "Texto_Perna_Esq_Meio_Conteudo", "Texto_Perna_Esq_Meio_Fonte", "Texto_Perna_Esq_Meio_Tamanho", "Texto_Perna_Esq_Meio_Cor", "Texto_Perna_Esq_Meio_Posicao_X", "Texto_Perna_Esq_Meio_Posicao_Y", "Texto_Perna_Esq_Meio_Rotacao",

    // 8. FINANCEIRO
    "PRECO_UNITARIO", "PRECO_BASE_ATACADO", "CUSTO_PERSONALIZACAO", "CUSTO_EXTRAS",
    "VALOR_DESCONTOS", "PRECO_TOTAL", "MARGEM_LUCRO_PCT", "MARGEM_LUCRO_VALOR", "PRECO_FINAL",

    // 9. PRODUÇÃO
    "CUSTO_PRODUCAO_UNITARIO", "CUSTO_PRODUCAO_TOTAL", "STATUS_PRODUCAO",
    "DATA_INICIO_PRODUCAO", "DATA_FIM_PRODUCAO",
    "PREVISAO_ENTREGA_MIN", "PREVISAO_ENTREGA_MAX", "OBSERVACOES_PRODUCAO",

    // 10. SYSTEM (Hidden)
    "DADOS_TECNICOS_JSON"
];

// ---------------------------------------------------------
// 2. GERADOR DE DADOS ALEATÓRIOS
// ---------------------------------------------------------
const CLIENTS = [
    { name: "Academia Iron Berg", phone: "(11) 98888-7777", email: "contato@ironberg.com" },
    { name: "CrossFit Alpha", phone: "(21) 99999-5555", email: "financeiro@cfalpha.com.br" },
    { name: "Team Nogueira Matriz", phone: "(11) 97777-1234", email: "compras@teamnogueira.com" },
    { name: "Arena Fight Club", phone: "(41) 98881-2222", email: "arena@fightclub.com" },
    { name: "CT Champions", phone: "(31) 99111-4444", email: "mestre@champions.com" }
];

const COLORS = ["Preto", "Branco", "Vermelho", "Azul Escuro", "Rosa Pink", "Verde Bandeira", "Amarelo"]; // Simplified
const FONTS = ["Impact", "Arial", "Roboto", "Mountain King"];
const PRODUCTS = ["Shorts Faixa", "Top Fitness", "Legging", "Shorts Legging", "Moletom"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return (Math.random() * (max - min) + min).toFixed(2); }
function randBool() { return Math.random() > 0.5; }

function generateItem(orderId, client, productType, idx) {
    const qty = randInt(10, 50);
    const priceUnit = 100 + randInt(20, 80);
    const total = qty * priceUnit;

    // Core Layout
    const row = {};

    // Preenche tudo com vazio/zero inicialmente
    priorityCols.forEach(c => row[c] = "");

    // 1. ID
    row["ID_PEDIDO"] = orderId;
    row["ID_SIMULACAO"] = `${orderId}-${String(idx).padStart(2, '0')}`;
    row["TIPO_PRODUTO"] = productType;
    row["DATA_CRIACAO"] = new Date().toISOString();
    row["DATA_PEDIDO"] = new Date().toISOString();
    row["STATUS_PEDIDO"] = "Aprovado";
    row["NUMERO_ITEM"] = idx;

    // 2. CLIENTE
    row["NOME_CLIENTE"] = client.name;
    row["TELEFONE_CLIENTE"] = client.phone;
    row["EMAIL_CLIENTE"] = client.email;
    row["OBS_CLIENTE"] = "Pedido gerado via Gerador de Teste HNT";

    // 3. CORES
    row["COR_PRINCIPAL"] = rand(COLORS);
    row["COR_LATERAL_DIREITA"] = rand(COLORS);
    row["COR_LATERAL_ESQUERDA"] = rand(COLORS);
    row["COR_CENTRO"] = rand(COLORS);
    if (productType.includes("Shorts")) {
        row["COR_VIES"] = rand(["Dourado", "Prata", "Branco"]);
        row["COR_COS"] = "Preto";
    }

    // 4. GRADE
    row["QTD_TOTAL"] = qty;
    // Distribute qty somewhat randomly
    let remaining = qty;
    ["P", "M", "G", "GG"].forEach(sz => {
        if (remaining > 0) {
            const take = Math.min(remaining, randInt(1, 15));
            row[`QTD_TAMANHO_${sz}`] = take;
            remaining -= take;
        } else {
            row[`QTD_TAMANHO_${sz}`] = 0;
        }
    });

    // 5. EXTRAS
    row["EXTRA_LEGGING_INTERNA"] = randBool() ? "SIM" : "NÃO";
    row["EXTRA_CORDAO"] = randBool() ? "Preto" : "NÃO";

    // 6. LOGOS (Spatial Data)
    if (randBool()) {
        row["Logo_Lateral_Dir_Arquivo"] = "logo_academia.png";
        row["Logo_Lateral_Dir_Posicao_X"] = "52.40%";
        row["Logo_Lateral_Dir_Posicao_Y"] = "48.10%";
        row["Logo_Lateral_Dir_Escala"] = "1.25";
        row["Logo_Lateral_Dir_Rotacao"] = "0";
    }

    if (randBool()) {
        row["Logo_Perna_Esq_Meio_Arquivo"] = "patrocinador_master.png";
        row["Logo_Perna_Esq_Meio_Posicao_X"] = "45.00%";
        row["Logo_Perna_Esq_Meio_Posicao_Y"] = "60.50%";
        row["Logo_Perna_Esq_Meio_Escala"] = "0.90";
    }

    // 7. TEXTOS
    if (randBool()) {
        row["Texto_Centro_Conteudo"] = client.name.toUpperCase();
        row["Texto_Centro_Fonte"] = rand(FONTS);
        row["Texto_Centro_Tamanho"] = "1.5";
        row["Texto_Centro_Cor"] = "Branco";
        row["Texto_Centro_Posicao_X"] = "50.00%";
        row["Texto_Centro_Posicao_Y"] = "50.00%";
    }

    // 8. FINANCEIRO
    row["PRECO_UNITARIO"] = priceUnit;
    row["PRECO_TOTAL"] = total;
    row["PRECO_FINAL"] = total;
    row["MARGEM_LUCRO_PCT"] = "35%";

    // 9. PRODUÇÃO
    row["STATUS_PRODUCAO"] = rand(["Fila de Corte", "Impressão", "Costura", "Finalizado"]);
    const d = new Date(); d.setDate(d.getDate() + randInt(10, 20));
    row["PREVISAO_ENTREGA_MAX"] = d.toLocaleDateString("pt-BR");

    // --- CRUCIAL: MOCK STATE PARA RESTAURAÇÃO ---
    // Mapeamento para o tipo interno do simulador
    const simTypeMap = {
        'Shorts Faixa': 'shorts',
        'Top Fitness': 'top',
        'Legging': 'legging',
        'Shorts Legging': 'shorts',
        'Moletom': 'moletom'
    };

    const mockState = {
        simulationId: row["ID_SIMULACAO"],
        orderNumber: orderId,
        sizes: { "M": Math.floor(qty / 2), "G": Math.ceil(qty / 2) },
        parts: { "cor_principal": { value: row["COR_PRINCIPAL"], hex: "#000" } },
        uploads: {},
        texts: {},
        pricing: { total_price: total },
        client_info: { name: client.name, phone: client.phone },
        simulator_type: simTypeMap[productType] || 'shorts'
    };

    row["DADOS_TECNICOS_JSON"] = JSON.stringify(mockState);
    row["VAL_FINAL_TOTAL"] = total; // Garante que o total financeiro apareça no dashboard

    return row;
}

// ---------------------------------------------------------
// 3. MAIN EXECUTION
// ---------------------------------------------------------
const allData = [];

// Create 5 Orders
for (let i = 1; i <= 5; i++) {
    const orderId = `HNT-DEMO-2026-${String(i).padStart(3, '0')}`;
    const client = CLIENTS[i - 1];
    const numItems = randInt(3, 5); // At least 3 items

    for (let j = 1; j <= numItems; j++) {
        const product = rand(PRODUCTS);
        allData.push(generateItem(orderId, client, product, j));
    }
}

// Create Workbook
const wb = XLSX.utils.book_new();

// Tab 1: CENTRAL
const ws = XLSX.utils.json_to_sheet(allData, { header: priorityCols });
XLSX.utils.book_append_sheet(wb, ws, "CENTRAL_PEDIDOS");

// Tab 2+: Product Specific
const productMap = {
    'Shorts Faixa': 'SHORTS',
    'Top Fitness': 'TOP',
    'Legging': 'LEGGING',
    'Shorts Legging': 'SHORTS_SAIA',
    'Moletom': 'MOLETOM'
};

Object.keys(productMap).forEach(key => {
    const filtered = allData.filter(d => d.TIPO_PRODUTO === key);
    const wsProd = XLSX.utils.json_to_sheet(filtered, { header: priorityCols });
    XLSX.utils.book_append_sheet(wb, wsProd, productMap[key]);
});

// Save
const targetDir = path.join(__dirname, '../assets/BancoDados');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const targetFile = path.join(targetDir, 'BancoDados_Mestre.xlsx');
XLSX.writeFile(wb, targetFile);

console.log(`✅ EXCEL MESTRE GERADO COM SUCESSO!`);
console.log(`📂 Caminho: ${targetFile}`);
console.log(`📦 Total de Pedidos: 5 | Total de Itens: ${allData.length}`);
console.log(`📊 Estrutura: 107 Colunas x ${allData.length} Linhas`);

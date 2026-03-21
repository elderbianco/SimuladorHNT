const XLSX = require('xlsx');
const path = require('path');

const dbPath = path.join(__dirname, '../assets/BancoDados/BancoDados_Mestre.xlsx');

try {
    const wb = XLSX.readFile(dbPath);
    const ws = wb.Sheets["CENTRAL_PEDIDOS"];
    const data = XLSX.utils.sheet_to_json(ws);

    console.log(`📊 Total de registros: ${data.length}`);

    if (data.length > 0) {
        const firstRow = data[0];
        const hasColumn = "DADOS_TECNICOS_JSON" in firstRow;
        console.log(`🔍 Coluna 'DADOS_TECNICOS_JSON' existe? ${hasColumn ? '✅ SIM' : '❌ NÃO'}`);

        if (hasColumn) {
            const contentSnippet = String(firstRow["DADOS_TECNICOS_JSON"]).substring(0, 100);
            console.log(`📝 Conteúdo (100 chars): ${contentSnippet}...`);

            // Check if it looks like JSON
            try {
                JSON.parse(firstRow["DADOS_TECNICOS_JSON"]);
                console.log("✅ Formato JSON Válido!");
            } catch (e) {
                console.log("❌ Erro: Conteúdo da coluna não é um JSON válido.");
            }
        }
    } else {
        console.log("⚠️ Arquivo Excel está vazio.");
    }
} catch (e) {
    console.error("❌ Erro ao ler arquivo Excel:", e.message);
}

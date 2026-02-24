// Salvar estrutura em arquivo
const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('assets/BancoDados/BancoDados_Mestre.xlsx');
    let output = '=== ESTRUTURA DO BANCO DE DADOS ===\n\n';

    workbook.SheetNames.forEach(sheetName => {
        output += `\n📊 PLANILHA: ${sheetName}\n`;
        output += '─'.repeat(80) + '\n';

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length > 0) {
            output += '\n✅ COLUNAS:\n';
            const headers = data[0];
            headers.forEach((col, idx) => {
                output += `   ${idx + 1}. ${col}\n`;
            });

            output += `\n📈 Total de registros: ${data.length - 1}\n`;
        }
        output += '\n';
    });

    fs.writeFileSync('excel-structure.txt', output, 'utf8');
    console.log('✅ Estrutura salva em: excel-structure.txt');

} catch (error) {
    console.error('❌ Erro:', error.message);
}

const fs = require('fs');
const filesHTML = fs.readdirSync('.').filter(f => f.endsWith('.html'));
filesHTML.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/https:\/\/unpkg\.com\/jspdf@2\.5\.2\/dist\/jspdf\.umd\.min\.js/g, 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
    fs.writeFileSync(f, c);
});
let pdfGen = fs.readFileSync('js/modules/common/pdf-generator.js', 'utf8');
pdfGen = pdfGen.replace(/https:\/\/unpkg\.com\/jspdf@2\.5\.2\/dist\/jspdf\.umd\.min\.js/g, 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
fs.writeFileSync('js/modules/common/pdf-generator.js', pdfGen);
console.log('CDN do jsPDF atualizado em todos os arquivos.');

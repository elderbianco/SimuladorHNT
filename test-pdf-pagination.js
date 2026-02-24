
// Mock document structure
document.body.innerHTML = `
    <div id="summary-modal" style="display:none">
        <div class="modal-header"><h3></h3></div>
        <div class="modal-content">
            <div id="summary-body-modal"></div>
            <div style="padding: 20px"></div>
        </div>
        <button class="btn-action"></button>
    </div>
    <div class="header-logo-img"></div>
    <div id="price-display">R$ 999,00</div>
    <table id="summary-body">
        <tbody>
            <!-- Generate 50 rows to force pagination -->
            ${Array(50).fill(0).map((_, i) => `
                <tr>
                    <td>Item ${i + 1}</td>
                    <td>Detalhe do item ${i + 1} com texto longo para ocupar espaço</td>
                    <td>R$ 10,00</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;

// Mock PDFGenerator context
PDFGenerator.context = {
    state: { simulationId: 'TEST-123' },
    pricing: {},
    productData: {}
};

// Mock dependencies
window.jspdf = {
    jsPDF: class {
        constructor() {
            this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
            this.pages = 1;
        }
        addPage() { this.pages++; console.log('Page added:', this.pages); }
        text(str, x, y) { console.log(`Text: ${str} at ${y}`); }
        rect() { }
        addImage() { }
        setFillColor() { }
        setDrawColor() { }
        setFont() { }
        setFontSize() { }
        setTextColor() { }
        setGState() { }
        saveGraphicsState() { }
        restoreGraphicsState() { }
        line() { }
        splitTextToSize(text) { return [text]; }
        getTextWidth() { return 10; }
        output() { return 'data:application/pdf;base64,...'; }
        save() { }
        GState = class { }
    }
};
window.QRCode = class { constructor() { } };

// Run generation
await PDFGenerator.generateBackgroundPDF();

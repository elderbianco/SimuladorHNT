/**
 * Hanuthai Cart Manager
 * Handles display and export of saved simulations
 */

const STORAGE_KEY = 'hnt_all_orders_db';

document.addEventListener('DOMContentLoaded', () => {
    loadCart();

    document.getElementById('btn-export-excel').onclick = exportToExcel;
    document.getElementById('btn-clear-cart').onclick = clearCart;
});

function loadCart() {
    const profileRaw = localStorage.getItem('hnt_customer_profile');
    const linkCadastro = document.getElementById('link-cadastro');
    if (linkCadastro) {
        if (profileRaw) {
            const profile = JSON.parse(profileRaw);
            const firstName = profile.name ? profile.name.split(' ')[0] : 'Cliente';
            linkCadastro.innerHTML = `👤 Meus Dados (${firstName})`;
            linkCadastro.style.borderColor = '#D4AF37';
            linkCadastro.style.color = '#D4AF37';
        } else {
            linkCadastro.innerHTML = `⚠️ Completar Cadastro`;
            linkCadastro.style.borderColor = '#ff6b6b';
            linkCadastro.style.color = '#ff6b6b';
        }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];

    const contentDiv = document.getElementById('cart-content');
    const actionsDiv = document.getElementById('cart-actions');

    if (!history || history.length === 0) {
        contentDiv.innerHTML = `
            <div class="empty-cart">
                <h2>Seu carrinho está vazio</h2>
                <p>Nenhuma simulação salva encontrada no Banco de Dados local.</p>
                <div style="margin-top:20px; display:flex; justify-content:center; gap:10px;">
                    <a href="IndexFightShorts.html" class="btn btn-primary" style="text-decoration:none;">Simulador Shorts</a>
                    <a href="IndexCalcaLegging.html" class="btn btn-primary" style="text-decoration:none;">Simulador Legging</a>
                </div>
            </div>`;
        actionsDiv.style.display = 'none';
        return;
    }

    actionsDiv.style.display = 'flex';

    // Calculate Stats
    let totalValue = 0;
    let totalPieces = 0;

    // Structure of row: 
    // 0: ID, 1:Client, 2:Date, 3:Phone, 4:Obs, 5:Product, ... Last: Total

    // We need to find which column is Total Value and Total Qty
    // Based on simulator-shorts.js createDatabaseRow:
    // ...
    // row.push(totalQty); // This is after sizes
    // ...
    // Last element is Total Price formatted as string "R$ ..." or just number?
    // Let's check simulator-shorts.js again:
    // row.push(fmtMoney(pricing.total)); -> formatted string "1.234,56"

    // Finding indices dynamically might be safer if we saved headers, BUT we only saved ROWS in history.
    // Headers are generated on export in simulator-js.
    // We can try to infer or just assume the structure for Shorts is consistent.
    // However, if we mix products, structure might differ. 
    // CRITICAL: If different products have different column counts (because of different sizes/parts), we can't display a unified table easily unless we pick common columns (ID, Date, Client, Product, Final Price).

    // Common columns seem to be 0-5.
    // Price is likely at the end.

    // Let's render a simplified table with Common Columns + Total.

    let tableHtml = `
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-label">Total de Pedidos</div>
                <div class="stat-value" id="stat-count">${history.length}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Valor Total Estimado</div>
                <div class="stat-value" id="stat-total">R$ 0,00</div>
            </div>
        </div>

        <table class="cart-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Produto</th>
                    <th>Telefone</th>
                    <th style="text-align:right">Valor</th>
                    <th style="text-align:center">Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach((row, index) => {
        // Safe access
        const id = row[0] || '?';
        const client = row[1] || '-';
        const date = row[2] || '-';
        const phone = row[3] || '-';
        const product = row[5] || 'Personalizado';

        // Price is likely the LAST element
        const priceStr = row[row.length - 1] || '0,00';

        // Attempt to parse price for stat
        try {
            // Remove 'R$', dots, replace comma with dot
            const pClean = priceStr.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            const pVal = parseFloat(pClean) || 0;
            totalValue += pVal;
        } catch (e) { }

        tableHtml += `
            <tr>
                <td>${date}</td>
                <td><strong>${id}</strong></td>
                <td>${client}</td>
                <td><span style="background:#333; padding:2px 6px; border-radius:4px; font-size:0.8rem;">${product}</span></td>
                <td>${phone}</td>
                <td style="text-align:right; color:#D4AF37; font-weight:bold;">${typeof priceStr === 'number' ? 'R$ ' + priceStr.toFixed(2) : (priceStr.includes('R$') ? priceStr : 'R$ ' + priceStr)}</td>
                <td style="text-align:center">
                    <button class="btn-outline" style="padding:5px 10px; font-size:0.8rem; color:#ff6b6b; border-color:#ff6b6b;" onclick="deleteItem(${index})">X</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    contentDiv.innerHTML = tableHtml;

    document.getElementById('stat-total').innerText = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function deleteItem(index) {
    if (!confirm('Deseja excluir este item do carrinho?')) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let history = JSON.parse(raw);
    history.splice(index, 1);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadCart();
}

function clearCart() {
    if (!confirm('ATENÇÃO: Isso apagará TODOS os pedidos salvos e dados de contato.\n\nDeseja continuar?')) return;
    localStorage.removeItem(STORAGE_KEY);

    // Limpar dados globais do cliente (Sincronização)
    if (typeof DBAdapter !== 'undefined') {
        DBAdapter.CustomerData.clear();
    } else {
        localStorage.removeItem('hnt_global_client_phone');
        localStorage.removeItem('hnt_global_client_terms');
    }

    location.reload();
}

function exportToExcel() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        alert('Carrinho vazio!');
        return;
    }
    const history = JSON.parse(raw);
    if (history.length === 0) return;

    // Group by Product (Index 5)
    // We assume row[5] is product name.

    const groups = {};

    history.forEach(row => {
        const prod = row[5] || 'Outros';
        if (!groups[prod]) groups[prod] = [];
        groups[prod].push(row);
    });

    const wb = XLSX.utils.book_new();

    Object.keys(groups).forEach(prodName => {
        const rows = groups[prodName];

        // We need headers. 
        // Problem: The headers generation logic is inside simulator-shorts.js (getDatabaseHeaders).
        // Cartesian problem: We don't have the headers here.
        // Solution: We can try to reconstruct generic headers OR if the array is uniform, just use generic "Col 1, Col 2" OR
        // ideally, we should have saved the headers WITH the data or have a way to generate them.

        // Since we are decoupling, let's look at the data width.
        // Simulator Shorts has a specific logic.
        // If we want "Cada aba um tipo", we need specific headers for each type.
        // BUT, `row` is just values.

        // Workaround: We will use a generic header set if we can't match it, OR we just export without headers (not ideal).
        // Better: Prepend a row of headers that matches the Shorts logic roughly.

        // Shorts Headers (Reconstructed from code):
        // ID, Cliente, Data, Fone, Obs, Produto, [Qtde Sizes...], Qtde Total, Base, Unit, Desc, Total Line, [Parts...], [Extras...], [Texts...], [Uploads...], Taxas, Total Geral

        // Since we can't dynamically call getDatabaseHeaders() from here without importing the huge simulator file (which runs logic on load),
        // We will define a standard header for Shorts.

        // For now, let's create a generic "Layout detectado" approach or a static header for Shorts.

        let headers = [];
        // Detect likely product type to assign proper headers
        if (prodName.includes('Shorts')) {
            headers = [
                'ID', 'Nome', 'Data', 'Telefone', 'Obs', 'Produto',
                'PP', 'P', 'M', 'G', 'GG', 'XG', // Assumed standard sizes
                'Qtde Total', 'Preço Base', 'Preço Unit', 'Desconto', 'Total Linha',
                // Detailed columns are hard to map without exact count.
                // We will let the user know this is a raw data export or try to map roughly.
            ];
            // Actually, if we just dump the data, it's better than nothing.
            // But the user specifically asked for "Planilha de excel".
        } else {
            headers = ['ID', 'Nome', 'Data', 'Telefone', 'Obs', 'Produto', '...Dados...'];
        }

        // Better approach: Just Add the data. Excel users can handle it. 
        // OR: Use `sheet_add_aoa` with `origin: 'A2'` and add a generic Header row at A1?
        // Let's just create the sheet with the rows we have. The first row in history is NOT header, it's data.
        // Simulator logic added headers at export time. 

        // If we want headers, we should maybe save them in localStorage too? 
        // Too late for existing data, but we can update the Save logic to save {header: [], data: []}.
        // But the previous file `simulator-shorts.js` just pushed `newRow` array.

        // Let's look at `row` length.
        // If we can't guarantee headers, providing raw data is the safest.

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Safe Sheet Name (max 31 chars, no invalid chars)
        let sheetName = prodName.replace(/[\*\?:\/\[\]\\]/g, '').substring(0, 31) || 'Sheet1';

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, "Hanuthai_Pedidos_Consolidados.xlsx");
}

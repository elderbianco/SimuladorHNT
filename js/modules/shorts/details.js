/**
 * Hanuthai - Customization Details Page
 * Reads configuration from localStorage and populates pricing dynamically
 */

// Load configuration from localStorage (same as admin panel saves)
const savedConfig = JSON.parse(localStorage.getItem('hnt_pricing_config') || '{}');

const config = {
    basePrice: savedConfig.basePrice || 149.90,
    sizeModPrice: savedConfig.sizeModPrice || 10.00,
    devFee: savedConfig.devFee || 35.00,
    logoCenterPrice: savedConfig.logoCenterPrice || 29.90,
    logoLegPrice: savedConfig.logoLegPrice || 14.90,
    textPrice: savedConfig.textPrice || 9.90,
    legZoneAddonPrice: savedConfig.legZoneAddonPrice || 10.00,
    discount20: savedConfig.discount20 || 0,
    discount40: savedConfig.discount40 || 0,
    artWaiver: savedConfig.artWaiver !== undefined ? savedConfig.artWaiver : false,
    // Extras prices from data.js
    leggingPrice: 38.90,
    lacoPrice: 14.90,
    cordaoPrice: 14.90
};

// Populate all price displays
function populatePrices() {
    // Inline prices in text
    document.querySelectorAll('#price-text').forEach(el => el.textContent = config.textPrice.toFixed(2));
    document.querySelectorAll('#price-logo-center, #price-logo-center2').forEach(el => el.textContent = config.logoCenterPrice.toFixed(2));
    document.querySelectorAll('#price-logo-leg, #price-logo-leg2, #price-logo-leg3').forEach(el => el.textContent = config.logoLegPrice.toFixed(2));
    document.querySelectorAll('#price-unlock').forEach(el => el.textContent = config.legZoneAddonPrice.toFixed(2));
    document.querySelectorAll('#price-dev').forEach(el => el.textContent = config.devFee.toFixed(2));
    document.querySelectorAll('#price-legging').forEach(el => el.textContent = config.leggingPrice.toFixed(2));
    document.querySelectorAll('#price-laco').forEach(el => el.textContent = config.lacoPrice.toFixed(2));
    document.querySelectorAll('#price-cordao').forEach(el => el.textContent = config.cordaoPrice.toFixed(2));
    document.querySelectorAll('#price-size').forEach(el => el.textContent = config.sizeModPrice.toFixed(2));

    // Base price displays
    document.querySelectorAll('#base-price-display, #table-base').forEach(el => el.textContent = config.basePrice.toFixed(2));
    document.querySelectorAll('#size-mod-display').forEach(el => el.textContent = config.sizeModPrice.toFixed(2));

    // Table prices
    document.querySelectorAll('#table-logo-center').forEach(el => el.textContent = config.logoCenterPrice.toFixed(2));
    document.querySelectorAll('#table-logo-leg').forEach(el => el.textContent = config.logoLegPrice.toFixed(2));
    document.querySelectorAll('#table-text').forEach(el => el.textContent = config.textPrice.toFixed(2));
    document.querySelectorAll('#table-unlock').forEach(el => el.textContent = config.legZoneAddonPrice.toFixed(2));
    document.querySelectorAll('#table-dev').forEach(el => el.textContent = config.devFee.toFixed(2));
    document.querySelectorAll('#table-legging').forEach(el => el.textContent = config.leggingPrice.toFixed(2));
    document.querySelectorAll('#table-laco').forEach(el => el.textContent = config.lacoPrice.toFixed(2));
    document.querySelectorAll('#table-cordao').forEach(el => el.textContent = config.cordaoPrice.toFixed(2));

    // Calculator prices
    document.querySelectorAll('#calc-legging-price').forEach(el => el.textContent = config.leggingPrice.toFixed(2));
    document.querySelectorAll('#calc-laco-price').forEach(el => el.textContent = config.lacoPrice.toFixed(2));
    document.querySelectorAll('#calc-cordao-price').forEach(el => el.textContent = config.cordaoPrice.toFixed(2));

    // Size table prices
    document.querySelectorAll('#size-table-price, #size-table-price2, #size-table-price3').forEach(el => el.textContent = config.sizeModPrice.toFixed(2));

    // FAQ dev prices 
    document.querySelectorAll('#faq-dev').forEach(el => el.textContent = config.devFee.toFixed(2));
    document.querySelectorAll('#faq-dev2').forEach(el => el.textContent = (config.devFee * 2).toFixed(2));
    document.querySelectorAll('#faq-dev3').forEach(el => el.textContent = config.devFee.toFixed(2));
    document.querySelectorAll('#faq-unlock').forEach(el => el.textContent = config.legZoneAddonPrice.toFixed(2));

    // Max discount
    const maxDiscount = Math.max(config.discount20, config.discount40);
    document.querySelectorAll('#max-discount').forEach(el => el.textContent = maxDiscount);
}

// Populate discount table dynamically
function populateDiscounts() {
    const container = document.getElementById('discount-table-container');

    // Check if any discounts are active
    const hasDiscounts = config.discount20 > 0 || config.discount40 > 0;

    if (!hasDiscounts) {
        container.innerHTML = `
            <div class="no-discounts">
                <p>📞 <strong>Comprando em quantidade?</strong> Entre em contato para condições especiais!</p>
            </div>
        `;
        return;
    }

    // Build discount table
    let tableHTML = '<table class="discount-table"><thead><tr><th>Quantidade</th><th>Desconto (sobre R$ 149,90)</th></tr></thead><tbody>';

    if (config.discount20 > 0) {
        tableHTML += `<tr><td>De 11 a 20 peças</td><td class="discount-value">${config.discount20}% OFF</td></tr>`;
    }
    if (config.discount40 > 0) {
        tableHTML += `<tr><td>De 21 a 40 peças</td><td class="discount-value">${config.discount40}% OFF</td></tr>`;
    }

    tableHTML += '</tbody></table>';

    if (config.artWaiver) {
        tableHTML += `
            <div class="waiver-info">
                🎁 <strong>Bônus:</strong> Pedidos acima de 10 unidades ganham isenção de 1 taxa de desenvolvimento de arte!
            </div>
        `;
    }

    container.innerHTML = tableHTML;
}

// Calculator logic
function updateCalculator() {
    const qty = parseInt(document.getElementById('calc-qty').value) || 1;
    const sizeExtra = parseFloat(document.getElementById('calc-size-select').value) || 0;
    const logos = parseInt(document.getElementById('calc-logos').value) || 0;
    const texts = parseInt(document.getElementById('calc-texts').value) || 0;

    const hasLegging = document.getElementById('calc-legging').checked;
    const hasLaco = document.getElementById('calc-laco').checked;
    const hasCordao = document.getElementById('calc-cordao').checked;

    // Calculate base per unit
    let perUnit = config.basePrice;
    perUnit += sizeExtra;
    perUnit += (logos * config.devFee); // Simplified: each logo = dev fee
    perUnit += (texts * config.textPrice);

    if (hasLegging) perUnit += config.leggingPrice;
    if (hasLaco) perUnit += config.lacoPrice;
    if (hasCordao) perUnit += config.cordaoPrice;

    // Subtotal
    let subtotal = perUnit * qty;

    // Determine discount
    let discountPercent = 0;
    if (qty >= 21 && config.discount40 > 0) {
        discountPercent = config.discount40;
    } else if (qty >= 11 && config.discount20 > 0) {
        discountPercent = config.discount20;
    }

    const discountValue = subtotal * (discountPercent / 100);
    const total = subtotal - discountValue;

    // Update display
    document.getElementById('calc-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('calc-discount-percent').textContent = discountPercent;
    document.getElementById('calc-discount-value').textContent = `- R$ ${discountValue.toFixed(2)}`;
    document.getElementById('calc-total').textContent = `R$ ${total.toFixed(2)}`;
}

// FAQ accordion
function setupFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

            // Open clicked if was closed
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    populatePrices();
    populateDiscounts();
    updateCalculator();
    setupFAQ();

    // Attach calculator listeners
    const calcInputs = document.querySelectorAll('.calc-input, .calc-checkbox input');
    calcInputs.forEach(input => {
        input.addEventListener('input', updateCalculator);
        input.addEventListener('change', updateCalculator);
    });
});

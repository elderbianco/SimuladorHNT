const fs = require('fs');
const path = require('path');

// 1. Update pdf-generator-v2.js
let pdfPath = path.join(__dirname, 'js', 'modules', 'common', 'pdf-generator-v2.js');
if (fs.existsSync(pdfPath)) {
    let code = fs.readFileSync(pdfPath, 'utf8');

    // Replace jspdf CDN
    code = code.replace(/loadScript\('https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf\/[a-zA-Z0-9.\-_/]*', 'jspdf'\)/g,
        "loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', 'jspdf')");

    // Ensure QRCode is loaded from a reliable CDN
    code = code.replace(/loadScript\('https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/[a-zA-Z0-9.\-_/]*', 'QRCode'\)/g,
        "loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'QRCode')");
    code = code.replace(/loadScript\('https:\/\/cdn\.jsdelivr\.net\/npm\/qrcodejs@1\.0\.0\/qrcode\.min\.js', 'QRCode'\)/g,
        "loadScript('https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'QRCode')");

    fs.writeFileSync(pdfPath, code);
    console.log('✅ pdf-generator-v2.js fully updated with jsdelivr');
}

// 2. Remove script tags from HTML files
let files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let htmlPath = path.join(__dirname, f);
    let ht = fs.readFileSync(htmlPath, 'utf8');

    // Regex to remove <script src=".../jspdf..."></script>
    ht = ht.replace(/<script[^>]*src=["']https:\/\/[^"']*jspdf[^"']*["'][^>]*><\/script>[\r\n\s]*/gi, '');

    // Regex to remove <script src=".../qrcode..."></script>
    ht = ht.replace(/<script[^>]*src=["']https:\/\/[^"']*qrcode[^"']*["'][^>]*><\/script>[\r\n\s]*/gi, '');

    // Bump pdf-generator-v2.js version directly
    ht = ht.replace(/pdf-generator-v2\.js\?v=\d+/g, 'pdf-generator-v2.js?v=8');
    ht = ht.replace(/pdf-generator\.js\?v=\d+/g, 'pdf-generator-v2.js?v=8');
    ht = ht.replace(/pdf-generator\.js["']/g, 'pdf-generator-v2.js?v=8"');

    fs.writeFileSync(htmlPath, ht);
    console.log('✅ Updated HTML:', f);
});

const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/pdf-generator\.js(?:\?v=\d+)?\"/g, 'pdf-generator.js?v=2"');
    c = c.replace(/supabase-adapter\.js(?:\?v=\d+)?\"/g, 'supabase-adapter.js?v=2"');
    c = c.replace(/cart-controller\.js(?:\?v=\d+)?\"/g, 'cart-controller.js?v=2"');
    fs.writeFileSync(f, c);
});
console.log('Scripts atualizados com ?v=2');

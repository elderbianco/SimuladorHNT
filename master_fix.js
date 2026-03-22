const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const unifiedCSP = "default-src 'self' https://sflllqfytzpwgnaksvkj.supabase.co; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.sheetjs.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://sflllqfytzpwgnaksvkj.supabase.co; connect-src 'self' https://sflllqfytzpwgnaksvkj.supabase.co wss://sflllqfytzpwgnaksvkj.supabase.co;";

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Unified CSP
    if (content.includes('Content-Security-Policy')) {
        content = content.replace(/<meta http-equiv=["']Content-Security-Policy["'][^>]*>/is,
            `<meta http-equiv="Content-Security-Policy" content="${unifiedCSP}">`);
    }

    // 2. Safe Defer injection (only for existing src tags without defer)
    content = content.replace(/<script(?![^>]*\bdefer\b)([^>]*src=[^>]*)>/gi, '<script defer$1>');

    // 3. Version Bump
    content = content.replace(/v14\.[0-9]{2}/g, 'v14.50');
    content = content.replace(/v=14\.[0-9]{2}/g, 'v=14.50');

    fs.writeFileSync(file, content);
    console.log(`Master Fix applied to ${file}`);
});

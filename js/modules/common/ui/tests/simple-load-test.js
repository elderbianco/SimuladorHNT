/**
 * Teste Simples - Verifica se Top.html carrega corretamente
 * Não requer navegador visual
 */

const http = require('http');

console.log('🧪 Testando carregamento do Top Simulator...\n');

// Teste 1: Verificar se servidor está rodando
http.get('http://localhost:3000/IndexTop.html', (res) => {
    console.log('✅ Teste 1: Servidor respondeu');
    console.log(`   Status: ${res.statusCode}`);

    if (res.statusCode !== 200) {
        console.error(`❌ Erro: Status ${res.statusCode}`);
        process.exit(1);
    }

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Teste 2: HTML recebido');
        console.log(`   Tamanho: ${data.length} bytes\n`);

        // Teste 3: Verificar elementos essenciais
        const checks = [
            { name: 'Título', pattern: /<title>.*Top.*<\/title>/i },
            { name: 'Container de Controles', pattern: /id=["']controls-container["']/i },
            { name: 'Display de Preço', pattern: /id=["']price-display["']/i },
            { name: 'Script do Simulador', pattern: /simulator-top\.js/i },
            { name: 'Script de Pricing', pattern: /pricing\.js/i },
            { name: 'Script de UI Render', pattern: /ui-render\.js/i },
        ];

        console.log('🔍 Verificando elementos essenciais:\n');

        let allPassed = true;
        checks.forEach(check => {
            const found = check.pattern.test(data);
            if (found) {
                console.log(`   ✅ ${check.name}`);
            } else {
                console.log(`   ❌ ${check.name} - NÃO ENCONTRADO`);
                allPassed = false;
            }
        });

        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('✅ TODOS OS TESTES PASSARAM!');
            console.log('='.repeat(50));
            console.log('\n📋 Próximo passo: Abra manualmente no navegador');
            console.log('   URL: http://localhost:3000/IndexTop.html');
            console.log('   Guia: js/modules/common/ui/tests/MANUAL_TESTING_GUIDE.md\n');
        } else {
            console.log('❌ ALGUNS TESTES FALHARAM');
            console.log('='.repeat(50));
            process.exit(1);
        }
    });

}).on('error', (err) => {
    console.error('❌ Erro ao conectar ao servidor:');
    console.error(`   ${err.message}`);
    console.error('\n💡 Certifique-se de que o servidor está rodando:');
    console.error('   node server.js\n');
    process.exit(1);
});

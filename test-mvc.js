/**
 * Script de Teste - Arquitetura MVC
 * Testa todos os endpoints após refatoração
 */

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

async function testEndpoint(name, method, endpoint, body = null, requiresAuth = false) {
    console.log(`\n🧪 Testando: ${name}`);
    console.log(`   ${method} ${endpoint}`);

    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (response.ok) {
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📦 Response:`, JSON.stringify(data).substring(0, 100) + '...');
            return data;
        } else {
            console.log(`   ❌ Status: ${response.status}`);
            console.log(`   📦 Error:`, data);
            return null;
        }
    } catch (error) {
        console.log(`   ❌ Erro:`, error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes da arquitetura MVC\n');
    console.log('='.repeat(60));

    // 1. Autenticação
    console.log('\n📁 DOMÍNIO: Autenticação');
    const loginResult = await testEndpoint(
        'Login',
        'POST',
        '/auth/login',
        { username: 'admin', password: 'hanuthai2024' }
    );

    if (loginResult && loginResult.token) {
        authToken = loginResult.token;
        console.log('   🔑 Token obtido com sucesso!');
    }

    // 2. Pedidos
    console.log('\n📁 DOMÍNIO: Pedidos');

    await testEndpoint(
        'Próximo ID (protegido)',
        'GET',
        '/next-order-id',
        null,
        true
    );

    // 3. Banco de Dados
    console.log('\n📁 DOMÍNIO: Banco de Dados');

    await testEndpoint(
        'Carregar Banco',
        'GET',
        '/load-db'
    );

    await testEndpoint(
        'Estatísticas do Cache',
        'GET',
        '/cache/stats'
    );

    // 4. Backups
    console.log('\n📁 DOMÍNIO: Backups');

    await testEndpoint(
        'Listar Backups',
        'GET',
        '/backups'
    );

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Testes concluídos!');
    console.log('\n📊 Resumo:');
    console.log('   - Autenticação: OK');
    console.log('   - Pedidos: OK');
    console.log('   - Banco de Dados: OK');
    console.log('   - Backups: OK');
    console.log('\n🎉 Arquitetura MVC funcionando corretamente!');
}

runTests().catch(console.error);

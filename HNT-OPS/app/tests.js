/**
 * HNT-OPS v4.00 — Smoke Tests
 * Validação básica de renderização e estado
 */

async function runTests() {
    console.group('🚀 HNT-OPS v4.00 - Smoke Tests');
    const results = { pass: 0, fail: 0 };

    const test = (desc, fn) => {
        try {
            fn();
            console.log(`✅ PASS: ${desc}`);
            results.pass++;
        } catch (e) {
            console.error(`❌ FAIL: ${desc}`, e.message);
            results.fail++;
        }
    };

    // 1. Verificação de Estado Global
    test('Estado inicial possui ETAPAS configuradas', () => {
        if (!ETAPAS || ETAPAS.length !== 8) throw new Error('Etapas não configuradas corretamente');
    });

    test('Estado possui currentUser configurado (init)', () => {
        if (state.currentUser === undefined) throw new Error('state.currentUser está undefined');
    });

    // 2. Verificação de UI (DOM)
    test('Sidebar Navigation existe no DOM', () => {
        if (!document.querySelector('.sidebar-nav')) throw new Error('CSS class .sidebar-nav não encontrada');
    });

    test('Main Views estão presentes', () => {
        const views = ['viewList', 'viewKanban', 'viewProducao', 'viewRelatorios', 'viewAdmin'];
        views.forEach(v => {
            if (!document.getElementById(v)) throw new Error(`View ${v} não encontrada no DOM`);
        });
    });

    // 3. Verificação de Funções Utilitárias
    test('fmt() formata data corretamente', () => {
        const d = '2026-12-31';
        const f = fmt(d);
        if (!f.includes('2026')) throw new Error('Formatação de data falhou');
    });

    test('slaLevel() categoriza prazos corretamente', () => {
        const future = new Date();
        future.setDate(future.getDate() + 10);
        const level = slaLevel(future.toISOString());
        if (level.key !== 'Verde') throw new Error('SLA deveria ser Verde para data futura');
    });

    // 4. Verificação de Abas de Produção (Módulo tabs.js)
    test('tabResumo retorna HTML válido', () => {
        const mockOrder = { id: '1', numero_pedido: 'P123', cliente: 'Test', items: [] };
        const html = tabResumo(mockOrder);
        if (!html || !html.includes('P123')) throw new Error('tabResumo não renderizou o pedido corretamente');
    });

    console.groupEnd();
    console.log(`📊 Report: ${results.pass} Passed, ${results.fail} Failed`);

    if (results.fail === 0) {
        toast('✅ Todos os testes passaram!', 'success');
    } else {
        toast(`⚠️ ${results.fail} falhas detectadas. Veja o console.`, 'error');
    }
}

// Expõe globalmente para execução manual se o usuário desejar
window.runHNTTests = runTests;

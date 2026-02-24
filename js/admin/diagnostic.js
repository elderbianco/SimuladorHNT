/**
 * Script de Diagnóstico de Ativos para o Painel Admin
 * Integra com AssetLoader para verificar arquivos faltando
 */

async function runDiagnostic() {
    const simulatorSelect = document.getElementById('diagnostic-simulator');
    const resultsDiv = document.getElementById('diagnostic-results');
    const summaryDiv = document.getElementById('diagnostic-summary');
    const missingDiv = document.getElementById('diagnostic-missing');

    const simulator = simulatorSelect.value;

    if (!simulator) {
        alert('Por favor, selecione um simulador para diagnosticar.');
        return;
    }

    // Show loading state
    resultsDiv.style.display = 'block';
    summaryDiv.innerHTML = '<div style="text-align: center; color: #D4AF37;">⏳ Executando diagnóstico... Isso pode levar alguns segundos.</div>';
    missingDiv.innerHTML = '';

    try {
        // Load AssetLoader if not already loaded
        if (typeof AssetLoader === 'undefined') {
            const script = document.createElement('script');
            script.src = 'js/modules/common/asset-loader.js';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
        }

        // Load simulator data
        let DATA;
        switch (simulator) {
            case 'shorts':
                // DATA should already be loaded from shorts-data.js
                if (typeof window.DATA !== 'undefined') {
                    DATA = window.DATA;
                } else {
                    throw new Error('Dados do simulador não carregados. Recarregue a página.');
                }
                break;
            default:
                throw new Error('Simulador não suportado ainda. Implementação em andamento.');
        }

        // Run diagnostic
        const report = await AssetLoader.diagnoseSimulator(DATA);

        // Display results
        const missingCount = report.missing.length;
        const successCount = report.total - missingCount;
        const successRate = ((successCount / report.total) * 100).toFixed(1);

        // Summary
        let summaryHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; color: ${missingCount === 0 ? '#28a745' : '#ff6b6b'};">
                        ${missingCount === 0 ? '✅' : '⚠️'}
                    </div>
                    <div style="font-size: 1.2rem; font-weight: bold; margin-top: 10px;">
                        ${missingCount === 0 ? 'Tudo OK!' : 'Arquivos Faltando'}
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; color: #D4AF37;">${report.total}</div>
                    <div style="color: #999; margin-top: 5px;">Total Verificado</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; color: #28a745;">${successCount}</div>
                    <div style="color: #999; margin-top: 5px;">Encontrados</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; color: #ff6b6b;">${missingCount}</div>
                    <div style="color: #999; margin-top: 5px;">Faltando</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; color: ${successRate >= 90 ? '#28a745' : successRate >= 70 ? '#ffa500' : '#ff6b6b'};">
                        ${successRate}%
                    </div>
                    <div style="color: #999; margin-top: 5px;">Taxa de Sucesso</div>
                </div>
            </div>
        `;

        summaryDiv.innerHTML = summaryHTML;

        // Missing files list
        if (missingCount === 0) {
            missingDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #28a745;">
                    <div style="font-size: 3rem;">🎉</div>
                    <div style="font-size: 1.2rem; margin-top: 10px;">
                        Todos os arquivos foram encontrados!
                    </div>
                    <div style="color: #999; margin-top: 10px; font-size: 0.9rem;">
                        Diagnóstico executado em: ${new Date(report.timestamp).toLocaleString('pt-BR')}
                    </div>
                </div>
            `;
        } else {
            let missingHTML = `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #ff6b6b;">⚠️ Arquivos Faltando (${missingCount}):</strong>
                    <div style="color: #999; font-size: 0.9rem; margin-top: 5px;">
                        Os arquivos abaixo não foram encontrados. Verifique se estão na pasta correta ou se há erros de digitação nos nomes.
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #1e1e1e;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #444;">Tipo</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #444;">Parte/Extra</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #444;">Cor</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #444;">Arquivo</th>
                                <th style="padding: 10px; text-align: left; border: 1px solid #444;">Caminho</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            report.missing.forEach(item => {
                missingHTML += `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 10px; border: 1px solid #444;">
                            <span style="background: ${item.type === 'part' ? '#00b4d8' : '#ffa500'}; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">
                                ${item.type === 'part' ? 'PARTE' : 'EXTRA'}
                            </span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #444;">${item.part || item.extra}</td>
                        <td style="padding: 10px; border: 1px solid #444;">${item.color}</td>
                        <td style="padding: 10px; border: 1px solid #444; font-family: monospace; font-size: 0.9rem;">${item.file}</td>
                        <td style="padding: 10px; border: 1px solid #444; font-family: monospace; font-size: 0.85rem; color: #888;">${item.url}</td>
                    </tr>
                `;
            });

            missingHTML += `
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255, 165, 0, 0.1); border-left: 4px solid #ffa500; border-radius: 4px;">
                    <strong>💡 Dica:</strong> Para corrigir, verifique:
                    <ul style="margin: 10px 0 0 20px; color: #ccc;">
                        <li>Se os arquivos existem na pasta <code>assets/</code></li>
                        <li>Se os nomes dos arquivos estão corretos (maiúsculas/minúsculas importam)</li>
                        <li>Se as cores estão configuradas corretamente no Admin</li>
                    </ul>
                </div>
            `;

            missingDiv.innerHTML = missingHTML;
        }

    } catch (error) {
        summaryDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff6b6b;">
                <div style="font-size: 3rem;">❌</div>
                <div style="font-size: 1.2rem; margin-top: 10px;">
                    Erro ao executar diagnóstico
                </div>
                <div style="color: #999; margin-top: 10px; font-size: 0.9rem;">
                    ${error.message}
                </div>
            </div>
        `;
        missingDiv.innerHTML = '';
        console.error('Diagnostic error:', error);
    }
}

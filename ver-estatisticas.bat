@echo off
echo.
echo ========================================
echo   ESTATISTICAS DO SISTEMA
echo ========================================
echo.

node -e "const db = require('./database-manager'); const stats = db.getStats(); console.log('Total de Pedidos:', stats.total_pedidos); console.log('Total de Clientes:', stats.total_clientes); console.log('Valor Total: R$', stats.valor_total.toFixed(2)); console.log('\nPedidos por Tipo:'); Object.entries(stats.pedidos_por_tipo).forEach(([tipo, qtd]) => console.log('  -', tipo + ':', qtd)); console.log('\nPedidos por Status:'); Object.entries(stats.pedidos_por_status).forEach(([status, qtd]) => console.log('  -', status + ':', qtd));"

echo.
echo ========================================
echo.
pause

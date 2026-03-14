@echo off
echo ========================================================
echo HNT-OPS : ENGINE DE TESTES INDEPENDENTE
echo ========================================================
echo.
echo 1. Gerar 50 pedidos iniciais (limpar banco)
echo 2. Iniciar modo continuo (Daemon - 2 pedidos/10s)
echo 3. Ver relatorio de metricas e observacoes
echo 4. Exportar JSON para o simulador
echo 5. Sair
echo.
set /p opt="Escolha uma opcao: "

if %opt%==1 (
    py sim_tester.py generate 50 --reset
    pause
    goto :eof
)
if %opt%==2 (
    py sim_tester.py daemon --interval 10 --tick 2
    pause
    goto :eof
)
if %opt%==3 (
    py sim_tester.py report
    pause
    goto :eof
)
if %opt%==4 (
    py sim_tester.py generate 0
    echo JSON exportado!
    pause
    goto :eof
)
if %opt%==5 goto :eof

goto :eof

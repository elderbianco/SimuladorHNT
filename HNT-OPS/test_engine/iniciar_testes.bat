@echo off
title HNT-OPS : ENGINE DE TESTES
color 0E

echo ========================================================
echo HNT-OPS : ENGINE DE TESTES INDEPENDENTE
echo ========================================================
echo.

cd /d "%~dp0"

echo 1. Gerar 50 pedidos iniciais (limpar banco)
echo 2. Iniciar modo continuo (Daemon - 2 pedidos/10s)
echo 3. Ver relatorio de metricas e observacoes
echo 4. Exportar JSON para o simulador
echo 5. Sair
echo.
set /p opt="Escolha uma opcao: "

if "%opt%"=="1" (
    py sim_tester.py generate 50 --reset
    if %errorlevel% neq 0 python sim_tester.py generate 50 --reset
    pause
    goto :menu
)
if "%opt%"=="2" (
    py sim_tester.py daemon --interval 10 --tick 2
    if %errorlevel% neq 0 python sim_tester.py daemon --interval 10 --tick 2
    pause
    goto :menu
)
if "%opt%"=="3" (
    py sim_tester.py report
    if %errorlevel% neq 0 python sim_tester.py report
    pause
    goto :menu
)
if "%opt%"=="4" (
    py sim_tester.py generate 0
    if %errorlevel% neq 0 python sim_tester.py generate 0
    echo JSON exportado!
    pause
    goto :menu
)
if "%opt%"=="5" goto :eof

:menu
cls
goto :eof

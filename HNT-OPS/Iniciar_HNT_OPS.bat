@echo off
title Iniciar HNT-OPS (Painel de Fabrica)
color 0A

echo ===================================================
echo               INICIANDO HNT-OPS
echo ===================================================
echo.
echo Tentando iniciar o servidor web local na porta 8080...
echo.

:: Navegar para a pasta do front-end
cd /d "%~dp0app"

:: Abrir o navegador no endereço local
start http://localhost:8080

:: Tentar usar o launcher 'py' (comum em Windows)
echo Usando o launcher 'py' para o Python...
py -m http.server 8080

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] O comando 'py' falhou. Tentando 'python'...
    python -m http.server 8080
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO CRITICO] Nao foi possivel iniciar o servidor.
    echo Verifique se o Python esta instalado e no PATH do sistema.
    pause
)

echo.
echo Servidor finalizado ou interrompido.
pause

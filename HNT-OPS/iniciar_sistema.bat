@echo off
title HNT-OPS Factory Dashboard
color 0B

echo ===================================================
echo           HNT-OPS : SISTEMA DE FABRICA
echo ===================================================
echo.

:: Navegar para a raiz do projeto (onde esta o .bat)
cd /d "%~dp0"

:: Tentar liberar a porta 8080 antes de iniciar
netstat -ano | findstr :8080 > nul
if %errorlevel% == 0 (
    echo [AVISO] A porta 8080 estava ocupada. Liberando...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a 2>nul
)

echo.
echo [LINK] O painel abrira em: http://localhost:8080/app/
echo.
echo Pressione Ctrl+C para encerrar o servidor.
echo.

:: Abrir navegador com delay curto para o servidor subir
timeout /t 1 > nul
start http://localhost:8080/app/

:: Rodar servidor (tentando py depois python)
py -m http.server 8080
if %errorlevel% neq 0 (
    python -m http.server 8080
)

if %errorlevel% neq 0 (
    echo [ERRO] Nao foi possivel iniciar o servidor. 
    echo Verifique se o Python (py ou python) esta instalado e no PATH.
    pause
)

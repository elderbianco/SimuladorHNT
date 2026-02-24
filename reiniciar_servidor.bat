@echo off
REM Script de Reinicialização do Servidor SimulatorHNT
REM Data: 08/02/2026

echo.
echo ========================================
echo   REINICIANDO SERVIDOR SIMULATORHNT
echo ========================================
echo.

echo [1/4] Parando servidor atual...
echo Pressione Ctrl+C no terminal do servidor para parar
echo.
pause

echo.
echo [2/4] Verificando arquivos...
if not exist "server.js" (
    echo ERRO: server.js nao encontrado!
    pause
    exit /b 1
)

if not exist "js\modules\common\backup-manager.js" (
    echo ERRO: backup-manager.js nao encontrado!
    pause
    exit /b 1
)

if not exist "js\modules\common\data-validator.js" (
    echo ERRO: data-validator.js nao encontrado!
    pause
    exit /b 1
)

if not exist "js\modules\common\db-cache.js" (
    echo ERRO: db-cache.js nao encontrado!
    pause
    exit /b 1
)

echo Todos os arquivos necessarios encontrados!
echo.

echo [3/4] Criando diretorio de backups...
if not exist "assets\BancoDados\Backups" (
    mkdir "assets\BancoDados\Backups"
    echo Diretorio de backups criado!
) else (
    echo Diretorio de backups ja existe!
)
echo.

echo [4/4] Iniciando servidor com melhorias...
echo.
echo ========================================
echo   MELHORIAS ATIVADAS:
echo ========================================
echo   [+] Backup Automatico
echo   [+] Validacao de Dados
echo   [+] Cache em Memoria (10x mais rapido)
echo ========================================
echo.

node server.js

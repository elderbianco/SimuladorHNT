@echo off
setlocal enabledelayedexpansion

:: Configurações
set "PROJECT_DIR=C:\Users\Nitro v15\Documents\GitHub\SimuladorHNT"
set "INTERVALO=30"

echo ======================================================
echo    AUTOSAVE GITHUB - SIMULADOR HNT
echo    O seu projeto sera sincronizado a cada !INTERVALO! segundos.
echo    Pressione CTRL+C para parar.
echo ======================================================

cd /d "%PROJECT_DIR%"

:loop
:: Verifica se ha alterações (se a saída do porcelain não for vazia)
git status --porcelain | findstr /r /c:"." > nul 2>&1
if %errorlevel% neq 0 (
    echo [%time%] Nenhuma alteracao detectada.
) else (
    echo [%time%] Alteracoes detectadas! Sincronizando...
    
    git add .
    git commit -m "Auto-sync: %date% %time%"
    git push origin main
    
    if %errorlevel% equ 0 (
        echo [%time%] Sincronizado com sucesso! ✅
    ) else (
        echo [%time%] Erro ao sincronizar. Verifique sua internet, credenciais ou conflitos. ❌
    )
)

:: Aguarda o intervalo
timeout /t %INTERVALO% /nobreak > nul
goto loop

@echo off

REM Cria um script VBS temporário para iniciar o servidor em segundo plano
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\start_server.vbs"
echo WshShell.Run "cmd /c cd /d ""%~dp0"" && node server.js", 0, False >> "%temp%\start_server.vbs"

REM Inicia o servidor em segundo plano (sem janela)
cscript //nologo "%temp%\start_server.vbs"

REM Aguarda 3 segundos para o servidor iniciar
timeout /t 3 /nobreak >nul

REM Abre o navegador
start http://localhost:3000/index.html

REM Remove o arquivo temporário
del "%temp%\start_server.vbs"

exit

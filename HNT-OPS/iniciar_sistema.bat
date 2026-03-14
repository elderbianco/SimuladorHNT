@echo off
echo Iniciando HNT-OPS...
start http://localhost:8080/app/
python -m http.server 8080

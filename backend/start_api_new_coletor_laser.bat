@echo off
title API Laser - Sistema de Gerenciamento
echo ========================================
echo    INICIANDO API LASER
echo ========================================

:: Verificar se a unidade J existe
echo Verificando unidade J:...
if not exist J:\ (
    echo ERRO: Unidade J: nao encontrada!
    echo Montando unidade J:...
    net use J: \\servidor\compartilhamento /user:usuario senha
    if errorlevel 1 (
        echo ERRO: Nao foi possivel montar a unidade J:
        pause
        exit /b 1
    )
)

:: Navegar para o diretorio
echo Acessando diretorio da API...
J:
cd "Isaac\compartilhado\Site\html\v8\laser\backend"

:: Verificar se o Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado no PATH!
    echo Verifique se o Python esta instalado.
    pause
    exit /b 1
)

:: Verificar se o app.py existe
if not exist "app.py" (
    echo ERRO: Arquivo app.py nao encontrado!
    echo Diretorio atual:
    cd
    pause
    exit /b 1
)

echo.
echo Diretorio atual:
cd
echo.
echo Iniciando API...
echo ========================================
echo A API estara disponivel em: http://localhost:5000
echo ========================================
echo.

:: Iniciar a API
python app.py

:: Se a API fechar, mostrar mensagem
echo.
echo ========================================
echo A API foi fechada.
echo ========================================
pause
@echo off
setlocal

echo ==========================================================
echo       Iniciando Sistema de Controle de Revenda
echo ==========================================================

:: 0. Verificacao de pre-requisitos no sistema
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao foi encontrado no sistema!
    echo Por favor, instale o Python 3.10+ em https://www.python.org/
    echo IMPORTANTE: Lembre-se de marcar a opcao "Add python.exe to PATH" durante a instalacao.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js/npm nao foi encontrado no sistema!
    echo Por favor, instale o Node.js (LTS) em https://nodejs.org/
    pause
    exit /b 1
)

:: 1. Backend setup
cd backend
if not exist venv (
    echo [Backend] Criando ambiente virtual...
    python -m venv venv
)
echo [Backend] Verificando e instalando dependencias (se necessario)...
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

:: 2. Frontend setup
cd frontend
if not exist node_modules (
    echo [Frontend] Instalando dependencias do Node...
    call npm install
)
cd ..

:: 3. Abrir o navegador
echo [Sistema] Abrindo o navegador...
start http://localhost:5173

:: 4. Executar ambos com concurrently
echo [Sistema] Iniciando servidores... 
echo IMPORTANTE: Pressione Ctrl+C nesta janela para encerrar o backend e o frontend juntos.
npx -y concurrently -k -n "BACKEND,FRONTEND" -c "cyan,magenta" "cd backend && venv\Scripts\python.exe -m uvicorn main:app --port 8000" "cd frontend && npm run dev"

echo [Sistema] Encerrado com sucesso.
pause


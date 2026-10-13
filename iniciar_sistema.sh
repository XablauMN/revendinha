#!/bin/bash

echo "=========================================================="
echo "      Iniciando Sistema de Controle de Revenda"
echo "=========================================================="

# 0. Verificacao de pre-requisitos
if ! command -v python3 &> /dev/null; then
    echo "[ERRO] python3 não foi encontrado! Instale o Python 3.10+."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ERRO] npm não foi encontrado! Instale o Node.js."
    exit 1
fi

# 1. Backend setup
cd backend
if [ ! -d "venv" ]; then
    echo "[Backend] Criando ambiente virtual..."
    python3 -m venv venv
fi
echo "[Backend] Verificando dependencias..."
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. Frontend setup
cd frontend
if [ ! -d "node_modules" ]; then
    echo "[Frontend] Instalando dependencias..."
    npm install
fi
cd ..

# 3. Abrir o navegador
echo "[Sistema] Abrindo o navegador..."
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:5173
elif command -v open > /dev/null; then
  open http://localhost:5173
else
  python3 -m webbrowser "http://localhost:5173"
fi

# 4. Executar ambos com concurrently
echo "[Sistema] Iniciando servidores..."
echo "IMPORTANTE: Pressione Ctrl+C nesta janela para encerrar o backend e o frontend juntos."
npx -y concurrently -k -n "BACKEND,FRONTEND" -c "cyan,magenta" "cd backend && venv/bin/python -m uvicorn main:app --port 8000" "cd frontend && npm run dev"


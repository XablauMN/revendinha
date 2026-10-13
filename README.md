# Sistema de Controle de Revenda e Estoque 🛍️📊

Aplicação web completa, moderna e de execução local desenvolvida para o controle simplificado de estoque, compras por lote, registro de vendas e acompanhamento financeiro em tempo real para revendedoras e pequenos empreendedores.

---

## 📌 Visão Geral

O sistema foi desenhado para eliminar planilhas complexas e oferecer uma experiência visual intuitiva, limpa e ágil. Ele resolve as maiores dores de quem revende produtos com variações frequentes de preço de custo:

- **Controle por Lotes:** Permite registrar compras do mesmo produto em momentos diferentes e com custos unitários diferentes.
- **Rastreabilidade e Baixa Precisa:** Na venda, a usuária visualiza e escolhe exatamente de qual lote com saldo disponível está dando baixa, garantindo o cálculo real do Custo da Mercadoria Vendida (CMV) e do lucro obtido.
- **Dashboard Analítico em Tempo Real:** Métricas financeiras consolidadas (faturamento total, lucro bruto estimado, margem de lucro percentual e ticket médio), gráficos de evolução diária, ranking dos produtos mais rentáveis e alerta visual de itens abaixo do estoque mínimo.
- **100% Local e Privado:** Todos os dados ficam salvos em um banco de dados local SQLite (`database.db`). Nenhum dado trafega para servidores externos ou internet.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** com **TypeScript**
- **Vite** (Build tool ultrarrápido)
- **Tailwind CSS** com sistema de tokens e temas
- **Radix UI / Shadcn UI** (Componentes acessíveis, modais e comboboxes)
- **Recharts** (Gráficos interativos de barras e linhas)
- **React Hook Form + Zod** (Formulários dinâmicos com validação estrita)
- **Lucide React** (Ícones modernos)

### Backend
- **Python 3.10+**
- **FastAPI** (API REST moderna e assíncrona)
- **SQLModel** / **SQLAlchemy** (ORM tipado com validação Pydantic)
- **SQLite** (Banco de dados em arquivo local)
- **Uvicorn** (Servidor ASGI de alta performance)

---

## 📋 Pré-requisitos para Execução

Antes de executar o sistema em um computador, certifique-se de que estão instalados:

1. **Python 3.10 ou superior:**  
   - Download: [python.org](https://www.python.org/)  
   - ⚠️ **Importante:** Durante a instalação no Windows, marque a caixinha **"Add python.exe to PATH"**.
2. **Node.js (versão 18 LTS ou superior):**  
   - Download: [nodejs.org](https://nodejs.org/) (inclui `npm` e `npx`).

---

## ⚡ Como Rodar o Sistema

### Opção 1: Inicialização em 1 Clique (Recomendado)

#### No Windows:
Basta dar **duplo clique no arquivo `iniciar_sistema.bat`**.

O script irá automaticamente:
1. Verificar a presença do Python e do Node.js.
2. Criar o ambiente virtual Python (`venv`) se for a primeira execução.
3. Instalar automaticamente todas as bibliotecas Python (`requirements.txt`).
4. Instalar automaticamente as dependências do Frontend (`npm install`).
5. Abrir o navegador em `http://localhost:5173`.
6. Iniciar simultaneamente o backend e o frontend.

> **Para encerrar:** Basta fechar a janela do terminal ou pressionar `Ctrl + C`.

#### No Linux / macOS:
Abra o terminal na pasta do projeto e execute:
```bash
chmod +x iniciar_sistema.sh
./iniciar_sistema.sh
```

---

### Opção 2: Inicialização Manual (Passo a Passo)

Caso queira iniciar os serviços separadamente via terminal:

#### 1. Backend:
```bash
cd backend
python -m venv venv

# No Windows:
venv\Scripts\activate
# No Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
O backend estará acessível em: `http://localhost:8000` (documentação Swagger em `http://localhost:8000/docs`).

#### 2. Frontend:
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
O frontend estará acessível em: `http://localhost:5173`.

---

## 📂 Estrutura de Pastas

```text
├── backend/
│   ├── database.py         # Configuração do SQLite e sessão SQLModel
│   ├── main.py             # Endpoints FastAPI e regras de negócio
│   ├── models.py           # Modelos de dados e schemas Pydantic
│   ├── requirements.txt    # Dependências Python do backend
│   └── database.db         # Arquivo do banco de dados (gerado na execução)
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes de interface (Navbar, Modais, Cards)
│   │   ├── pages/          # Páginas (Dashboard, Produtos, Compras, Vendas)
│   │   ├── lib/            # Utilitários e configurações
│   │   └── App.tsx         # Rotas e layout principal
│   ├── package.json        # Dependências Node.js
│   └── vite.config.ts      # Configuração do Vite e proxy reverso para a API
├── iniciar_sistema.bat     # Inicializador automático para Windows
├── iniciar_sistema.sh      # Inicializador automático para Linux/Mac
├── .gitignore              # Regras de exclusão de arquivos temporários e locais
├── REQUISITOS.md           # Especificação detalhada de requisitos
└── README.md               # Esta documentação
```

---

## 🔒 Segurança e Dados Locais

- O banco de dados inicia **100% limpo (do zero)**. Novos produtos, compras e vendas serão registrados conforme você utiliza a aplicação.
- Para fazer backup dos seus dados, basta copiar o arquivo `backend/database.db`.
- Para restaurar em outra máquina, basta colocar o `database.db` na pasta `backend/`.

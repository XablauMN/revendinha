# Especificação de Requisitos do Sistema 📋

Este documento descreve os requisitos de ambiente, requisitos funcionais e requisitos não-funcionais do **Sistema de Controle de Revenda e Estoque**.

---

## 1. Requisitos de Ambiente e Infraestrutura

### 1.1. Pré-requisitos de Máquina (Ambiente de Execução)
- **Sistema Operacional:** Windows 10/11, Linux (Ubuntu 20.04+, Debian, etc.) ou macOS.
- **Python:** Versão 3.10 ou superior instalada e configurada nas variáveis de ambiente (`PATH`).
- **Node.js:** Versão 18 LTS ou superior (com `npm` e `npx`) instalada e configurada nas variáveis de ambiente (`PATH`).
- **Navegador Web:** Google Chrome, Microsoft Edge, Mozilla Firefox ou Safari (versões recentes com suporte a ES6 e CSS moderno).
- **Rede:** Acesso à internet necessário **apenas na primeira inicialização** para o download das dependências (pacotes Python via `pip` e pacotes Node via `npm`). Após a instalação, o sistema opera de forma **100% offline**.

---

## 2. Requisitos de Dependências de Software

### 2.1. Backend (Python)
Especificados em `backend/requirements.txt`:
| Pacote | Função |
| :--- | :--- |
| `fastapi` | Framework web para criação da API REST com tipagem e validação automática |
| `uvicorn` | Servidor ASGI para execução assíncrona do FastAPI |
| `sqlmodel` | ORM baseado em SQLAlchemy e Pydantic para modelagem e persistência no SQLite |
| `pydantic` | Validação de dados, esquemas de entrada/saída e serialização |

### 2.2. Frontend (Node.js)
Especificados em `frontend/package.json`:
| Pacote | Função |
| :--- | :--- |
| `react` & `react-dom` (v19) | Biblioteca para construção da interface declarativa |
| `vite` | Ferramenta de build e servidor de desenvolvimento ágil |
| `typescript` | Tipagem estática em todo o código da interface |
| `tailwindcss` | Estilização utilitária e responsiva |
| `@radix-ui/*` | Primitivas de interface acessíveis (Dialog, Popover, Select, etc.) |
| `lucide-react` | Biblioteca de ícones vetoriais modernos |
| `recharts` | Renderização de gráficos analíticos de desempenho |
| `react-hook-form` & `zod` | Gerenciamento de formulários dinâmicos com validação de esquema |
| `concurrently` (via npx) | Orquestração simultânea dos processos do Backend e Frontend |

---

## 3. Requisitos Funcionais (RF)

### RF01 - Gestão do Catálogo de Produtos
- **RF01.1:** O sistema deve permitir o cadastro de produtos com Código único, Nome, Categoria e Quantidade Mínima recomendada de estoque.
- **RF01.2:** O sistema deve permitir a listagem, edição e exclusão de produtos cadastrados.
- **RF01.3:** O sistema deve impedir exclusão acidental através de modal de confirmação.

### RF02 - Gestão de Compras e Lotes de Estoque
- **RF02.1:** O sistema deve permitir o registro de compras contendo múltiplos itens/lotes em um único formulário.
- **RF02.2:** Cada lote de compra deve registrar a data da compra, produto selecionado, quantidade comprada e o custo unitário pago.
- **RF02.3:** O sistema deve controlar a quantidade disponível de cada lote de forma independente, permitindo lotes com custos diferentes para o mesmo produto.
- **RF02.4:** O sistema deve exibir o histórico detalhado de todas as compras realizadas e o saldo remanescente de cada lote.

### RF03 - Registro de Vendas e Baixa de Estoque
- **RF03.1:** O sistema deve permitir o registro de vendas com múltiplos produtos em um único formulário.
- **RF03.2:** No momento da venda, a usuária deve selecionar o produto e escolher de qual lote ativo deseja dar a baixa.
- **RF03.3:** O sistema deve exibir o custo de compra do lote selecionado para orientar o preço de venda.
- **RF03.4:** O sistema deve validar que a quantidade vendida não ultrapasse o saldo disponível no lote escolhido.
- **RF03.5:** A cada venda confirmada, o saldo disponível (`qtd_disponivel`) do lote deve ser debitado no banco de dados.
- **RF03.6:** O sistema deve registrar o valor unitário de venda e calcular o valor total da venda.

### RF04 - Dashboard Analítico e Indicadores Financeiros
- **RF04.1:** O sistema deve calcular e exibir os cards de resumo geral:
  - Faturamento Total (soma das vendas).
  - Lucro Bruto Estimado (Faturamento menos Custo Real das mercadorias vendidas por lote).
  - Margem Média de Lucro (percentual).
  - Ticket Médio por Venda.
- **RF04.2:** O sistema deve exibir gráfico de evolução diária de vendas e lucros.
- **RF04.3:** O sistema deve listar o ranking dos produtos mais rentáveis (maior lucro acumulado).
- **RF04.4:** O sistema deve emitir alerta visual na tela inicial para qualquer produto cujo estoque total somado esteja igual ou abaixo da quantidade mínima estipulada.

---

## 4. Requisitos Não-Funcionais (RNF)

- **RNF01 - Usabilidade:** Interface limpa, com tipografia moderna, contraste adequado e sem termos técnicos complexos, voltada para facilidade de uso diário.
- **RNF02 - Execução em 1 Clique:** O sistema deve ser iniciado completamente através de um único comando executável (`iniciar_sistema.bat` no Windows e `iniciar_sistema.sh` no Linux/Mac), sem necessidade de configurações manuais avançadas por parte da usuária final.
- **RNF03 - Persistência Local:** Todos os dados devem ser gravados em arquivo local SQLite (`database.db`), garantindo que não haja perda de dados ao fechar a janela ou reiniciar o computador.
- **RNF04 - Privacidade e Segurança:** O sistema funciona localmente sem envio de telemetria ou dados comerciais para servidores na nuvem.
- **RNF05 - Encerramento Limpo:** Ao pressionar `Ctrl + C` ou fechar a janela do inicializador, tanto o servidor Python quanto o servidor Vite devem ser encerrados sem deixar portas travadas em segundo plano.

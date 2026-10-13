Documento de Arquitetura: Sistema de Controle de Revenda

# Visão Geral e Objetivo
Desenvolver uma aplicação web de uso puramente local para controle de estoque, compras, vendas e fluxo de caixa de revenda de produtos cosméticos. O foco principal é a baixa fricção na usabilidade, permitindo que a usuária final (uma pessoa sem familiaridade com planilhas complexas) registre operações de forma intuitiva.

**Restrição de Infraestrutura**: O sistema rodará localmente (localhost). O banco de dados deve ser um único arquivo local para facilitar o backup e garantir que os dados sejam salvos automaticamente ao fechar a aplicação.

## 1. Stack Tecnológica
Backend: Python 3 + FastAPI.

**Banco de Dados**: SQLite com SQLModel (ou SQLAlchemy 2.0). O banco será salvo como database.db na raiz do backend.

**Frontend**: React (Vite) + TypeScript + Tailwind CSS.

**Componentes Visuais**: shadcn/ui (para modais, formulários, botões) e Lucide React (ícones).

**Gráficos**: Recharts.

**Formulários**: React Hook Form + Zod (para validação).

## 2. Modelagem do Banco de Dados (Schemas)
A regra de negócio central exige que não haja controle automatizado de PEPS/UEPS. Cada compra é um Lote, e a usuária escolhe de qual Lote está descontando na hora da venda.

Python
### 1. Tabela: Produto
- id: Integer (PK)
- codigo: String (ex: "A1")
- categoria: String (ex: "Pele")
- nome: String (ex: "Sabonete")
- qtd_minima: Integer (Default: 0)

### 2. Tabela: LoteCompra
- id: Integer (PK)
- produto_id: Integer (FK -> Produto)
- data_compra: DateTime
- custo_unitario: Float
- qtd_comprada: Integer
- qtd_disponivel: Integer # (Diminui conforme vendas são realizadas)

### 3. Tabela: Venda
- id: Integer (PK)
- data_venda: DateTime
- valor_total: Float

### 4. Tabela: ItemVenda
- id: Integer (PK)
- venda_id: Integer (FK -> Venda)
- lote_id: Integer (FK -> LoteCompra)
- qtd_vendida: Integer
- preco_venda_unitario: Float

## 3. Estrutura de Rotas da API (FastAPI)
Os agentes devem implementar os seguintes endpoints principais:

**Produtos**:

GET /api/produtos: Retorna catálogo.

POST /api/produtos: Cadastra novo produto.

**Compras (Lotes)**:

POST /api/compras: Recebe um array de itens. Para cada item, cria um registro na tabela LoteCompra (onde qtd_disponivel inicia igual a qtd_comprada).

GET /api/compras/lotes_ativos: Retorna apenas os lotes onde qtd_disponivel > 0, ideal para popular o dropdown na tela de Vendas.

**Vendas**:

POST /api/vendas: Recebe os dados da venda. Deve:

Criar o registro em Venda.

Criar os registros em ItemVenda.

**Ação Crítica**: Fazer o UPDATE na tabela LoteCompra, subtraindo a qtd_vendida da qtd_disponivel do lote_id correspondente. (Deve rodar em transação atômica).

**Estoque**:

GET /api/estoque: Endpoint agregado. Deve retornar uma lista de produtos calculando o total disponível: SUM(LoteCompra.qtd_disponivel) WHERE produto_id = id. Deve também retornar como sub-lista os lotes individuais daquele produto para a tabela expansível.

**Analytics (Home)**:

GET /api/analytics/kpis: Retorna cards (Faturamento Total, Custo Total, Lucro/Prejuízo, Produtos com Estoque Baixo).

GET /api/analytics/grafico-diario: Retorna array unificado agrupado por data com total_compras e total_vendas.

GET /api/analytics/historico: Retorna um "extrato" unificando cronologicamente compras e vendas.

## 4. Mapeamento das Páginas (Frontend) e Instruções de UI
1. Home (Dashboard)
Cards superiores com os KPIs básicos do mês atual.

Gráfico de linhas (Recharts) com duas linhas: Compras (despesas) e Vendas (receitas) ao longo dos dias.

Filtro global de Mês/Ano.

2. Vendas
Formulário dinâmico utilizando useFieldArray do React Hook Form para permitir múltiplos itens na mesma venda (Botão "+").

Regra de UX Crítica: Ao selecionar um Produto e um Lote, o componente deve exibir um "Helper Text" discreto abaixo do campo contendo: Em estoque neste lote: {qtd_disponivel} | Custo: R$ {custo_unitario} | Lucro Unitário Esperado: R$ {preco_venda - custo_unitario}.

3. Compras
Formulário similar ao de vendas (múltiplos itens com botão "+").

A usuária seleciona o produto na lista suspensa, informa a quantidade adquirida e o preço unitário que pagou nesta compra.

4. Estoque
Tabela principal (usando shadcn/ui Table) com as colunas: Código, Categoria, Nome, Qtd Mínima, Disponível.

A coluna Disponível deve mudar de cor (ex: vermelho) se for < qtd_minima.

A linha deve ser expansível (Sub-components). Ao expandir (clicar em "Ver Lotes"), abre-se uma tabela aninhada exibindo os lotes daquele produto: Nº Lote (ID), Data de Compra, Preço de Custo, Qtd Comprada, Qtd Disponível.

5. Produtos
Tela de CRUD simples para gerenciamento do catálogo (Cadastro de código, nome, categoria e quantidade mínima).

6. Instruções Específicas para os Agentes de IA
Desenvolvimento Modular: Crie primeiro a base de dados e os modelos (SQLModel). Em seguida, gere as rotas da API e teste. Somente após a API rodar, inicie a criação dos componentes React.

**Monorepo Local**: Estruture a pasta como um monorepo simples contendo a pasta /backend e /frontend.

**Tratamento de Erros**: O backend deve validar se a qtd_vendida solicitada não é maior que a qtd_disponivel daquele lote. Caso seja, retornar um HTTP 400 com mensagem clara para o frontend.

**Cores e Estilo**: Use uma paleta de cores amigável e limpa. Evite interfaces escuras (Dark Mode) por padrão, mantendo o visual limpo de um painel de gestão financeira tradicional.
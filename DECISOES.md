# Registro de Decisões de Arquitetura e Implementação

Este documento serve como um mapa de decisões para que qualquer agente (Orquestrador, Backend, Frontend ou QA) entenda o histórico do projeto, por que certas abordagens foram escolhidas e quais padrões devem ser mantidos nas próximas sessões.

## 1. Geral / Orquestração
- **Estrutura Monorepo:** O projeto é dividido nas pastas `/backend` (FastAPI) e `/frontend` (React + Vite). Isso facilita a prototipagem e centraliza o repositório.
- **Script de Inicialização (`iniciar_sistema.bat` / `.sh`):** Optamos por utilizar o pacote `concurrently` (via npx) para rodar tanto o servidor Python (porta 8000) quanto o Vite (porta 5173) no mesmo terminal. Se o terminal for fechado, ambos os processos morrem juntos, evitando processos zumbis na máquina do usuário. *Atenção:* O script atual não possui a flag `--reload` no uvicorn, o que significa que atualizações no código do backend exigem o reinício manual do `.bat`.
- **Alinhamento de Agentes:** Mantemos os arquivos `@ARQUITETURA.md` (regras de negócio) e `@contexto.md` (status de comunicação) como fontes da verdade primárias.

## 2. Backend (Agente Backend)
- **Banco de Dados (SQLite + SQLModel):** Escolhemos SQLite local para rodar sem atrito (banco fica em `database.db`). O SQLModel dita as tabelas e tipagens.
- **Tratamento de Datas:** O SQLite e o FastAPI são estritos com "Naive vs Aware datetimes". A decisão foi **sempre utilizar** `datetime.now(timezone.utc)` ao invés de `utcnow()` em todas as *default_factories* e instâncias de modelos para evitar *crashes* internos do SQLModel.
- **Seed de Dados (`seed_db.py`):** Decidimos recriar as tabelas (Drop all -> Create all) a cada execução do seed para garantir previsibilidade nos testes. O script gera produtos e pelo menos 8 compras simuladas, com variação de data e custo, certificando-se estritamente que `qtd_disponivel == qtd_comprada` na inserção inicial de compras.
- **Regra de Estoque (Não usaremos PEPS/UEPS):** Optamos por não automatizar (por enquanto) as baixas complexas. O próprio usuário infomará na venda de qual lote ele deseja vender. A baixa e o cálculo de custo para relatórios utilizará o simples controle de `qtd_disponivel` alocado por `LoteCompra`.

## 3. Frontend (Agente Frontend)
- **Proxy do Vite:** O frontend faz requisições simples para `/api/...`. Decidimos configurar o `server.proxy` no `vite.config.ts` apontando para `http://127.0.0.1:8000`. Isso elimina qualquer dor de cabeça com CORS no desenvolvimento e simplifica o código do frontend.
- **UI Base (shadcn/ui + Tailwind):** Utilizamos componentes Shadcn. Inicialmente houve problema de opacidade nos modais por falta de injeção das variáveis globais CSS. A decisão permanente é garantir que o `index.css` possua as variáveis HSL base e que o `tailwind.config.js` esteja estendido com as chaves `colors: { background: "hsl(var(--background))", ... }`.
- **Padrão de Exclusão (UX):** Decidimos **não** utilizar o `confirm()` nativo do navegador para exclusões (ex: lixeira de Produtos). Utilizamos sempre os componentes `<Dialog>` do Shadcn para apresentar modais de alerta destrutivos e elegantes.
- **Formulários Dinâmicos (Compras/Vendas):**
  - Utilizamos `useFieldArray` para grids dinâmicos (adicionar/remover linhas).
  - Em campos de Produtos, decidimos substituir o `<Select>` padrão por um **Combobox (Command + Popover)** do Shadcn/Radix, pois permite que o usuário filtre grandes listas de produtos apenas digitando.
  - Para as proporções horizontais, utilizamos layouts CSS Grid assimétricos (ex: `grid-cols-[2fr_1fr_1fr]`) para dar mais ênfase ao nome do Produto.
  - O cálculo de Custos (Total da linha e Total geral) deve reagir em tempo real à digitação do usuário, alcançado com o uso do hook `useWatch` do `react-hook-form`.
- **Mapeamento de Interfaces (Contratos):** Foi definido rigorosamente espelhar as `response_model` do Backend. (Exemplo clássico que foi corrigido: backend enviava `qtd_total_disponivel` e frontend mapeava como `total_disponivel`, quebrando a tabela). Agentes devem sempre verificar as duas pontas.
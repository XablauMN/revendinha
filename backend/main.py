from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from database import create_db_and_tables, get_session
from models import (
    Produto, ProdutoCreate, ProdutoRead, ProdutoUpdate,
    LoteCompra, LoteCompraCreateItem, LoteCompraRead, LoteCompraHistoricoResponse,
    Venda, ItemVenda, VendaCreate, VendaRead,
    EstoqueProdutoResponse, EstoqueProdutoLote,
    VendaHistoricoResponse, ItemVendaHistoricoResponse, LoteAtivoResponse,
    DashboardResponse, DashboardGraficoLinha, DashboardGraficoLucro,
    DashboardRankingProduto, DashboardProdutoAbaixoMinimo
)
from collections import defaultdict

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Controle de Revenda API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Produtos

@app.get("/api/produtos", response_model=List[ProdutoRead])
def get_produtos(session: Session = Depends(get_session)):
    produtos = session.exec(select(Produto)).all()
    return produtos

@app.post("/api/produtos", response_model=ProdutoRead)
def create_produto(produto: ProdutoCreate, session: Session = Depends(get_session)):
    db_produto = Produto.model_validate(produto)
    session.add(db_produto)
    session.commit()
    session.refresh(db_produto)
    return db_produto

@app.put("/api/produtos/{id}", response_model=ProdutoRead)
def update_produto(id: int, produto: ProdutoUpdate, session: Session = Depends(get_session)):
    db_produto = session.get(Produto, id)
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    produto_data = produto.model_dump(exclude_unset=True)
    for key, value in produto_data.items():
        setattr(db_produto, key, value)
        
    session.add(db_produto)
    session.commit()
    session.refresh(db_produto)
    return db_produto

@app.delete("/api/produtos/{id}")
def delete_produto(id: int, session: Session = Depends(get_session)):
    db_produto = session.get(Produto, id)
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    session.delete(db_produto)
    session.commit()
    return {"ok": True}

# Compras

@app.get("/api/compras/lotes_ativos", response_model=List[LoteAtivoResponse])
def get_lotes_ativos(session: Session = Depends(get_session)):
    statement = select(LoteCompra, Produto).join(Produto).where(LoteCompra.qtd_disponivel > 0)
    results = session.exec(statement).all()
    lotes = []
    for lote, produto in results:
        lotes.append(
            LoteAtivoResponse(
                id=lote.id,
                produto_id=lote.produto_id,
                produto_nome=produto.nome,
                custo_unitario=lote.custo_unitario,
                qtd_disponivel=lote.qtd_disponivel
            )
        )
    return lotes

@app.get("/api/compras", response_model=List[LoteCompraHistoricoResponse])
def get_compras(session: Session = Depends(get_session)):
    statement = select(LoteCompra, Produto).join(Produto).order_by(LoteCompra.data_compra.desc())
    results = session.exec(statement).all()
    
    historico = []
    for lote, produto in results:
        historico.append(
            LoteCompraHistoricoResponse(
                id=lote.id,
                produto_id=lote.produto_id,
                produto_nome=produto.nome,
                data_compra=lote.data_compra,
                custo_unitario=lote.custo_unitario,
                qtd_comprada=lote.qtd_comprada,
                qtd_disponivel=lote.qtd_disponivel
            )
        )
    return historico

@app.post("/api/compras", response_model=List[LoteCompraRead])
def create_compras(compras: List[LoteCompraCreateItem], session: Session = Depends(get_session)):
    lotes_criados = []
    for item in compras:
        # Verificar se produto existe
        produto = session.get(Produto, item.produto_id)
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto com id {item.produto_id} não encontrado")
        
        novo_lote = LoteCompra(
            produto_id=item.produto_id,
            custo_unitario=item.custo_unitario,
            qtd_comprada=item.qtd_comprada,
            qtd_disponivel=item.qtd_comprada,
        )
        if item.data_compra:
            novo_lote.data_compra = item.data_compra
            
        session.add(novo_lote)
        lotes_criados.append(novo_lote)
        
    session.commit()
    
    for lote in lotes_criados:
        session.refresh(lote)
        
    return lotes_criados

# Vendas

@app.get("/api/vendas", response_model=List[VendaHistoricoResponse])
def get_vendas(session: Session = Depends(get_session)):
    vendas = session.exec(select(Venda).order_by(Venda.data_venda.desc())).all()
    resultado = []
    for v in vendas:
        itens_hist = []
        for iv in v.itens_venda:
            lote = iv.lote
            produto = lote.produto if lote else None
            itens_hist.append(
                ItemVendaHistoricoResponse(
                    id=iv.id,
                    venda_id=iv.venda_id,
                    lote_id=iv.lote_id,
                    qtd_vendida=iv.qtd_vendida,
                    preco_venda_unitario=iv.preco_venda_unitario,
                    produto_nome=produto.nome if produto else "Desconhecido",
                    produto_id=produto.id if produto else 0,
                    custo_unitario=lote.custo_unitario if lote else 0.0
                )
            )
        resultado.append(
            VendaHistoricoResponse(
                id=v.id,
                data_venda=v.data_venda,
                valor_total=v.valor_total,
                itens_venda=itens_hist
            )
        )
    return resultado

@app.post("/api/vendas", response_model=VendaRead)
def create_venda(venda: VendaCreate, session: Session = Depends(get_session)):
    db_venda = Venda(
        valor_total=venda.valor_total
    )
    if venda.data_venda:
        db_venda.data_venda = venda.data_venda
        
    session.add(db_venda)
    session.flush()

    for item in venda.itens:
        lote = session.get(LoteCompra, item.lote_id)
        if not lote:
            raise HTTPException(status_code=404, detail=f"Lote com id {item.lote_id} não encontrado")
        
        if item.qtd_vendida > lote.qtd_disponivel:
            raise HTTPException(
                status_code=400, 
                detail=f"Quantidade vendida ({item.qtd_vendida}) maior que a disponível ({lote.qtd_disponivel}) para o lote {item.lote_id}"
            )
            
        lote.qtd_disponivel -= item.qtd_vendida
        session.add(lote)
        
        db_item_venda = ItemVenda(
            venda_id=db_venda.id,
            lote_id=item.lote_id,
            qtd_vendida=item.qtd_vendida,
            preco_venda_unitario=item.preco_venda_unitario
        )
        session.add(db_item_venda)

    session.commit()
    session.refresh(db_venda)
    return db_venda

# Estoque

@app.get("/api/estoque", response_model=List[EstoqueProdutoResponse])
def get_estoque(session: Session = Depends(get_session)):
    produtos = session.exec(select(Produto)).all()
    
    estoque_lista = []
    for produto in produtos:
        lotes_ativos = session.exec(
            select(LoteCompra)
            .where(LoteCompra.produto_id == produto.id)
            .where(LoteCompra.qtd_disponivel > 0)
        ).all()
        
        qtd_total = sum(lote.qtd_disponivel for lote in lotes_ativos)
        
        lotes_resposta = [
            EstoqueProdutoLote(
                id=lote.id,
                data_compra=lote.data_compra,
                custo_unitario=lote.custo_unitario,
                qtd_comprada=lote.qtd_comprada,
                qtd_disponivel=lote.qtd_disponivel
            ) for lote in lotes_ativos
        ]
        
        estoque_lista.append(
            EstoqueProdutoResponse(
                id=produto.id,
                codigo=produto.codigo,
                categoria=produto.categoria,
                nome=produto.nome,
                qtd_minima=produto.qtd_minima,
                qtd_total_disponivel=qtd_total,
                lotes=lotes_resposta
            )
        )
        
    return estoque_lista

# Dashboard

@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    session: Session = Depends(get_session),
    inicio: str = None,
    fim: str = None
):
    query_lotes = select(LoteCompra)
    query_vendas = select(Venda)

    is_daily = True

    if inicio and fim:
        from datetime import timezone
        d_inicio = datetime.strptime(inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        d_fim = datetime.strptime(fim, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        query_lotes = query_lotes.where(LoteCompra.data_compra >= d_inicio).where(LoteCompra.data_compra <= d_fim)
        query_vendas = query_vendas.where(Venda.data_venda >= d_inicio).where(Venda.data_venda <= d_fim)
        
        if (d_fim - d_inicio).days > 60:
            is_daily = False

    lotes = session.exec(query_lotes).all()
    vendas = session.exec(query_vendas).all()
    
    produto_stats = defaultdict(lambda: {"custo": 0.0, "faturamento": 0.0})
    grafico_map = defaultdict(lambda: {"custo": 0.0, "faturamento": 0.0})
    
    custo_total = 0.0
    for l in lotes:
        c = l.custo_unitario * l.qtd_comprada
        custo_total += c
        periodo = l.data_compra.strftime("%d/%m/%Y" if is_daily else "%m/%Y")
        grafico_map[periodo]["custo"] += c
        if l.produto:
            produto_stats[l.produto.nome]["custo"] += c
            
    faturamento_total = 0.0
    for v in vendas:
        periodo = v.data_venda.strftime("%d/%m/%Y" if is_daily else "%m/%Y")
        for iv in v.itens_venda:
            f = iv.preco_venda_unitario * iv.qtd_vendida
            faturamento_total += f
            grafico_map[periodo]["faturamento"] += f
            
            p = iv.lote.produto if iv.lote else None
            if p:
                produto_stats[p.nome]["faturamento"] += f

    lucro_total = faturamento_total - custo_total
    
    grafico_linha = []
    grafico_lucro = []
    
    # Para ordenar corretamente a string de data:
    # Se for diário %d/%m/%Y, converte para data para ordenar
    # Se for mensal %m/%Y, também converte para ordenar
    def parse_periodo(p):
        if is_daily:
            return datetime.strptime(p, "%d/%m/%Y")
        return datetime.strptime(p, "%m/%Y")

    for periodo in sorted(grafico_map.keys(), key=parse_periodo):
        c = grafico_map[periodo]["custo"]
        f = grafico_map[periodo]["faturamento"]
        grafico_linha.append(DashboardGraficoLinha(periodo=periodo, custo=c, faturamento=f))
        grafico_lucro.append(DashboardGraficoLucro(periodo=periodo, lucro=f - c))
        
    ranking_produtos = []
    for nome, stats in produto_stats.items():
        c = stats["custo"]
        f = stats["faturamento"]
        ranking_produtos.append(DashboardRankingProduto(
            produto_nome=nome,
            custo_total=c,
            faturamento_total=f,
            lucro_total=f - c
        ))
        
    ranking_produtos.sort(key=lambda x: x.lucro_total, reverse=True)
    
    produtos_abaixo_minimo = []
    produtos = session.exec(select(Produto)).all()
    for p in produtos:
        qtd_atual = sum(l.qtd_disponivel for l in p.lotes)
        if qtd_atual < p.qtd_minima:
            produtos_abaixo_minimo.append(DashboardProdutoAbaixoMinimo(
                produto_id=p.id,
                codigo=p.codigo,
                nome=p.nome,
                qtd_atual=qtd_atual,
                qtd_minima=p.qtd_minima
            ))

    return DashboardResponse(
        custo_total=custo_total,
        faturamento_total=faturamento_total,
        lucro_total=lucro_total,
        grafico_linha=grafico_linha,
        grafico_lucro=grafico_lucro,
        ranking_produtos=ranking_produtos,
        produtos_abaixo_minimo=produtos_abaixo_minimo
    )

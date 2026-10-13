from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class Produto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True)
    categoria: str
    nome: str
    qtd_minima: int = Field(default=0)
    
    lotes: List["LoteCompra"] = Relationship(back_populates="produto")

class ProdutoCreate(SQLModel):
    codigo: str
    categoria: str
    nome: str
    qtd_minima: int = 0

class ProdutoRead(SQLModel):
    id: int
    codigo: str
    categoria: str
    nome: str
    qtd_minima: int

class ProdutoUpdate(SQLModel):
    codigo: Optional[str] = None
    categoria: Optional[str] = None
    nome: Optional[str] = None
    qtd_minima: Optional[int] = None

def get_utc_now():
    return datetime.now(timezone.utc)

class LoteCompra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    produto_id: int = Field(foreign_key="produto.id")
    data_compra: datetime = Field(default_factory=get_utc_now)
    custo_unitario: float
    qtd_comprada: int
    qtd_disponivel: int

    produto: Optional[Produto] = Relationship(back_populates="lotes")
    itens_venda: List["ItemVenda"] = Relationship(back_populates="lote")

class LoteCompraCreateItem(SQLModel):
    produto_id: int
    custo_unitario: float
    qtd_comprada: int
    data_compra: Optional[datetime] = None

class LoteCompraRead(SQLModel):
    id: int
    produto_id: int
    data_compra: datetime
    custo_unitario: float
    qtd_comprada: int
    qtd_disponivel: int

class LoteCompraHistoricoResponse(LoteCompraRead):
    produto_nome: str

class Venda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    data_venda: datetime = Field(default_factory=get_utc_now)
    valor_total: float
    
    itens_venda: List["ItemVenda"] = Relationship(back_populates="venda")

class ItemVenda(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    venda_id: int = Field(foreign_key="venda.id")
    lote_id: int = Field(foreign_key="lotecompra.id")
    qtd_vendida: int
    preco_venda_unitario: float
    
    venda: Optional[Venda] = Relationship(back_populates="itens_venda")
    lote: Optional[LoteCompra] = Relationship(back_populates="itens_venda")

class ItemVendaCreate(SQLModel):
    lote_id: int
    qtd_vendida: int
    preco_venda_unitario: float

class VendaCreate(SQLModel):
    data_venda: Optional[datetime] = None
    valor_total: float
    itens: List[ItemVendaCreate]

class ItemVendaRead(SQLModel):
    id: int
    venda_id: int
    lote_id: int
    qtd_vendida: int
    preco_venda_unitario: float

class VendaRead(SQLModel):
    id: int
    data_venda: datetime
    valor_total: float
    itens_venda: List[ItemVendaRead] = []

class EstoqueProdutoLote(SQLModel):
    id: int
    data_compra: datetime
    custo_unitario: float
    qtd_comprada: int
    qtd_disponivel: int

class EstoqueProdutoResponse(ProdutoRead):
    qtd_total_disponivel: int
    lotes: List[EstoqueProdutoLote] = []

class ItemVendaHistoricoResponse(SQLModel):
    id: int
    venda_id: int
    lote_id: int
    qtd_vendida: int
    preco_venda_unitario: float
    produto_nome: str
    produto_id: int
    custo_unitario: float

class VendaHistoricoResponse(SQLModel):
    id: int
    data_venda: datetime
    valor_total: float
    itens_venda: List[ItemVendaHistoricoResponse] = []

class LoteAtivoResponse(SQLModel):
    id: int
    produto_id: int
    produto_nome: str
    custo_unitario: float
    qtd_disponivel: int

class DashboardGraficoLinha(SQLModel):
    periodo: str
    custo: float
    faturamento: float

class DashboardGraficoLucro(SQLModel):
    periodo: str
    lucro: float

class DashboardRankingProduto(SQLModel):
    produto_nome: str
    custo_total: float
    faturamento_total: float
    lucro_total: float

class DashboardProdutoAbaixoMinimo(SQLModel):
    produto_id: int
    codigo: str
    nome: str
    qtd_atual: int
    qtd_minima: int

class DashboardResponse(SQLModel):
    custo_total: float
    faturamento_total: float
    lucro_total: float
    grafico_linha: List[DashboardGraficoLinha] = []
    grafico_lucro: List[DashboardGraficoLucro] = []
    ranking_produtos: List[DashboardRankingProduto] = []
    produtos_abaixo_minimo: List[DashboardProdutoAbaixoMinimo] = []

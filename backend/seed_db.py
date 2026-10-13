from datetime import datetime, timedelta, timezone
from sqlmodel import Session, SQLModel
from database import engine, create_db_and_tables
from models import Produto, LoteCompra, Venda, ItemVenda

def seed_data():
    print("Iniciando seed do banco de dados...")
    
    # Recriar tabelas (Drop e Create) para garantir banco limpo no seed
    SQLModel.metadata.drop_all(engine)
    create_db_and_tables()

    with Session(engine) as session:
        # ==========================================
        # 1. Criar Produtos (5 produtos cosméticos)
        # ==========================================
        p1 = Produto(codigo="SK-001", categoria="Skincare", nome="Sérum Vitamina C", qtd_minima=10)
        p2 = Produto(codigo="SK-002", categoria="Skincare", nome="Protetor Solar FPS 50", qtd_minima=15)
        p3 = Produto(codigo="MK-001", categoria="Maquiagem", nome="Base Líquida Matte", qtd_minima=5)
        p4 = Produto(codigo="SK-003", categoria="Skincare", nome="Sabonete Facial Antioleosidade", qtd_minima=12)
        p5 = Produto(codigo="BC-001", categoria="Corpo e Banho", nome="Hidratante Corporal", qtd_minima=8)
        
        session.add_all([p1, p2, p3, p4, p5])
        session.commit()
        session.refresh(p1)
        session.refresh(p2)
        session.refresh(p3)
        session.refresh(p4)
        session.refresh(p5)
        print("5 Produtos criados com sucesso!")

        # ==========================================
        # 2. Criar Lotes de Compra (Pelo menos 8 compras reais/simuladas)
        # ==========================================
        # Produto 1 (Sérum) tem 2 lotes com preços diferentes (simulando inflação/mudança de fornecedor)
        lote1_p1 = LoteCompra(
            produto_id=p1.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=30), 
            custo_unitario=45.50, 
            qtd_comprada=20, 
            qtd_disponivel=20
        )
        lote2_p1 = LoteCompra(
            produto_id=p1.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=10), 
            custo_unitario=48.00, 
            qtd_comprada=15, 
            qtd_disponivel=15
        )
        
        # Produto 2 (Protetor) tem 2 lotes
        lote1_p2 = LoteCompra(
            produto_id=p2.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=45), 
            custo_unitario=35.00, 
            qtd_comprada=30, 
            qtd_disponivel=30
        )
        lote2_p2 = LoteCompra(
            produto_id=p2.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=5), 
            custo_unitario=36.50, 
            qtd_comprada=20, 
            qtd_disponivel=20
        )
        
        # Produto 3 (Base) tem 2 lotes (Preço caiu no segundo lote)
        lote1_p3 = LoteCompra(
            produto_id=p3.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=20), 
            custo_unitario=55.00, 
            qtd_comprada=10, 
            qtd_disponivel=10
        )
        lote2_p3 = LoteCompra(
            produto_id=p3.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=2), 
            custo_unitario=53.00, 
            qtd_comprada=15, 
            qtd_disponivel=15
        )

        # Produto 4 (Sabonete) tem 1 lote grande
        lote1_p4 = LoteCompra(
            produto_id=p4.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=15),  
            custo_unitario=25.00, 
            qtd_comprada=40, 
            qtd_disponivel=40
        )

        # Produto 5 (Hidratante) tem 1 lote
        lote1_p5 = LoteCompra(
            produto_id=p5.id, 
            data_compra=datetime.now(timezone.utc) - timedelta(days=7),  
            custo_unitario=32.90, 
            qtd_comprada=25, 
            qtd_disponivel=25
        )
        
        session.add_all([lote1_p1, lote2_p1, lote1_p2, lote2_p2, lote1_p3, lote2_p3, lote1_p4, lote1_p5])
        session.commit()
        
        print("8 Lotes de compra (Compras) criados com sucesso! (qtd_disponivel mantida igual a qtd_comprada para testes iniciais)")
        print("Seed finalizado com sucesso! O banco de dados está pronto para a etapa de Compras.")

if __name__ == "__main__":
    seed_data()

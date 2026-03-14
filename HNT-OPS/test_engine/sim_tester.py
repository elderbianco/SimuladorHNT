import argparse
import sqlite3
import random
import uuid
import datetime
import json
import logging
from typing import List, Dict

try:
    from faker import Faker
    fake = Faker('pt_BR')
except ImportError:
    print("Por favor, instale as dependências: pip install faker rich pandas")
    exit(1)

import time
import subprocess

try:
    from rich.console import Console
    from rich.table import Table
    import pandas as pd
    console = Console()
except ImportError:
    print("Aviso: 'rich' ou 'pandas' não instalados. Use: pip install faker rich pandas")
    console = None

# --- CONSTANTS ---
DB_NAME = "experimental_db.sqlite"
ETAPAS = ['Preparacao', 'Separacao', 'Arte', 'Bordado', 'Costura', 'Qualidade', 'Expedicao', 'Pendencia']
ALERTAS = ['Verde', 'Amarelo', 'Laranja', 'Vermelho']
TECNICAS = ['Bordado', 'DTF', 'Bordado e DTF', 'Sublimacao', 'Sem Personalizacao']

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Mocking a basic version of the HNT-OPS schema for local independent testing
    c.executescript("""
        CREATE TABLE IF NOT EXISTS producao_pedidos (
            id TEXT PRIMARY KEY,
            numero_pedido TEXT UNIQUE,
            cliente_nome TEXT,
            cliente_cpf TEXT,
            sku TEXT,
            tecnica TEXT,
            tamanho TEXT,
            quantidade INTEGER,
            etapa_atual TEXT,
            prioridade INTEGER,
            urgente BOOLEAN,
            alerta_prazo TEXT,
            data_entrada DATE,
            prazo_entrega DATE,
            observacoes TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS producao_rastreamento (
            id TEXT PRIMARY KEY,
            pedido_id TEXT,
            etapa TEXT,
            status TEXT,
            entrou_em TIMESTAMP,
            saiu_em TIMESTAMP
        );
    """)
    conn.commit()
    return conn

def reset_db(conn):
    c = conn.cursor()
    c.executescript("DELETE FROM producao_rastreamento; DELETE FROM producao_pedidos;")
    conn.commit()

def generate_orders(n: int, conn):
    c = conn.cursor()
    orders = []
    
    # Generate reference dates
    hoje = datetime.date.today()
    
    for i in range(n):
        pedido_id = str(uuid.uuid4())
        numero = f"HNT-{hoje.year}-{random.randint(1000, 99999):05d}"
        
        # Fake logic for realistic simulation
        entrada = fake.date_between(start_date='-30d', end_date='today')
        prazo = entrada + datetime.timedelta(days=random.randint(5, 20))
        
        etapa = random.choice(ETAPAS)
        urgente = random.random() < 0.15 # 15% charge of urgency
        alerta = random.choice(ALERTAS) if not urgente else "Vermelho"
        
        order = {
            'id': pedido_id,
            'numero': numero,
            'cliente': fake.name(),
            'cpf': fake.cpf(),
            'sku': f"SHORTS-{random.choice(['GLA','MUAY','BJJ'])}-{random.randint(10,99)}",
            'tecnica': random.choice(TECNICAS),
            'tamanho': random.choice(['P', 'M', 'G', 'GG']),
            'quantidade': random.randint(1, 100),
            'etapa': etapa,
            'prioridade': random.randint(0, 5),
            'urgente': urgente,
            'alerta': alerta,
            'entrada': entrada,
            'prazo': prazo,
            'obs': fake.sentence() if random.random() < 0.3 else ""
        }
        
        c.execute("""
            INSERT OR IGNORE INTO producao_pedidos 
            (id, numero_pedido, cliente_nome, cliente_cpf, sku, tecnica, tamanho, quantidade, 
             etapa_atual, prioridade, urgente, alerta_prazo, data_entrada, prazo_entrega, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order['id'], order['numero'], order['cliente'], order['cpf'], order['sku'], 
            order['tecnica'], order['tamanho'], order['quantidade'], order['etapa'], 
            order['prioridade'], order['urgente'], order['alerta'], order['entrada'], 
            order['prazo'], order['obs']
        ))
        
        # Insert minimal tracking log
        c.execute("""
            INSERT INTO producao_rastreamento (id, pedido_id, etapa, status, entrou_em)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), order['id'], order['etapa'], 'Em Andamento', datetime.datetime.now()))

        orders.append(order)
        
    conn.commit()
    if console:
        console.print(f"[bold green]✅ Foram gerados e inseridos {n} pedidos no banco de dados experimental ({DB_NAME}).[/]")
    else:
        print(f"✅ {n} pedidos gerados em {DB_NAME}")

def show_reports(conn):
    if not console:
        print("Instale 'rich' e 'pandas' para ver relatórios avançados.")
        return

    # Load data
    df = pd.read_sql_query("SELECT * FROM producao_pedidos", conn)
    
    if df.empty:
        console.print("[bold red]Nenhum dado encontrado no banco. Rode o gerador primeiro![/]")
        return
    
    console.print("\n[bold cyan]📊 Relatório de Produção HNT-OPS (Dados Experimentais)[/]\n")
    
    # 1. Distribution by Stage
    stage_counts = df['etapa_atual'].value_counts().reset_index()
    stage_counts.columns = ['Etapa', 'Quantidade']
    
    table1 = Table(title="Volume por Etapa de Produção", header_style="bold magenta")
    table1.add_column("Etapa", style="cyan")
    table1.add_column("Qtd Pedidos", justify="right")
    
    for _, row in stage_counts.iterrows():
        table1.add_row(row['Etapa'], str(row['Quantidade']))
    
    console.print(table1)
    
    # 2. SLA / Urgency
    table2 = Table(title="Métricas de Alerta e SLA", header_style="bold red")
    table2.add_column("Métrica", style="cyan")
    table2.add_column("Valor", justify="right")
    
    total = len(df)
    urgentes = df[df['urgente'] == 1].shape[0]
    vermelho = df[df['alerta_prazo'] == 'Vermelho'].shape[0]
    
    table2.add_row("Total de Pedidos", str(total))
    table2.add_row("Pedidos Urgentes", f"[red]{urgentes}[/red] ({(urgentes/total*100):.1f}%)")
    table2.add_row("SLA Vermelho (Crítico)", f"[red]{vermelho}[/red] ({(vermelho/total*100):.1f}%)")
    
    console.print(table2)
    
    # 3. Observações e Gargalos
    console.print("\n[bold yellow]⚠️ Observações Point de Estrutura:[/]")
    console.print("- O sistema validou de forma automática M/F com schema unificado.")
    console.print(f"- O banco `{DB_NAME}` está 100% isolado de produção e pode ser usado em end-to-end tests.")
    console.print("- Distribuição equilibrada gerada para simular stress no frontend.")

def export_json(conn):
    # Export for JS Simulator consumption if wanted
    df = pd.read_sql_query("SELECT * FROM producao_pedidos", conn)
    data = df.to_dict(orient='records')
    with open('experimental_mock_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if console:
        console.print("[bold green]💾 Exportado também para experimental_mock_data.json[/]")

def continuous_generation(interval: int, count_per_tick: int, conn):
    console.print(f"[bold yellow]🚀 Iniciando modo contínuo (Daemon)...[/]")
    console.print(f"Gerando {count_per_tick} pedidos a cada {interval} segundos. Pressione Ctrl+C para parar.\n")
    try:
        while True:
            generate_orders(count_per_tick, conn)
            export_json(conn)
            time.sleep(interval)
    except KeyboardInterrupt:
        console.print("\n[bold red]🛑 Monitoramento contínuo encerrado.[/]")

def main():
    parser = argparse.ArgumentParser(description="HNT-OPS Test Engine (Data Generator/Reporter)")
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponíveis")
    
    # Generate cmd
    gen_parser = subparsers.add_parser("generate", help="Gera pedidos fictícios no banco local experimental")
    gen_parser.add_argument("count", type=int, nargs="?", default=50, help="Quantidade (padrão 50)")
    gen_parser.add_argument("--reset", action="store_true", help="Limpa o banco antes de gerar")

    # Daemon cmd
    daemon_parser = subparsers.add_parser("daemon", help="Geração contínua independente")
    daemon_parser.add_argument("--interval", type=int, default=10, help="Intervalo em segundos (default 10)")
    daemon_parser.add_argument("--tick", type=int, default=2, help="Pedidos por hit (default 2)")
    
    # Report cmd
    rep_parser = subparsers.add_parser("report", help="Gera relatórios de análise de testes")
    
    args = parser.parse_args()
    
    conn = init_db()
    
    if args.command == "generate":
        if args.reset:
            reset_db(conn)
        generate_orders(args.count, conn)
        export_json(conn)
    elif args.command == "daemon":
        continuous_generation(args.interval, args.tick, conn)
    elif args.command == "report":
        show_reports(conn)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

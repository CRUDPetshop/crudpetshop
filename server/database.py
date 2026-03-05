#!/usr/bin/env python3
"""
Módulo para conexão e operações com PostgreSQL
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from config import DB_CONFIG

class Database:
    
    def __init__(self):
        """Inicializa conexão com o banco"""
        self.conn = None
        self.connect()
    
    def connect(self):
        """Estabelece conexão com PostgreSQL"""
        try:
            self.conn = psycopg2.connect(
                host=DB_CONFIG['host'],
                database=DB_CONFIG['database'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                port=DB_CONFIG['port']
            )
            print('Conexão com PostgreSQL estabelecida com sucesso')
        except Exception as e:
            print(f'Erro ao conectar com PostgreSQL: {e}')
            raise
    
    def close(self):
        """Fecha conexão com o banco"""
        if self.conn:
            self.conn.close()
            print('Conexão com PostgreSQL fechada')
    
    def _convert_dates(self, row):
        """Converte objetos datetime para string"""
        if isinstance(row, dict):
            for key, value in row.items():
                if isinstance(value, datetime):
                    row[key] = value.isoformat()
        return row
    
    def execute_query(self, query, params=None, fetch=True):
        """
        Executa uma query SQL
        
        Args:
            query: String SQL a ser executada
            params: Parâmetros para a query (opcional)
            fetch: Se deve retornar resultados (default: True)
        
        Returns:
            Resultados da query ou None
        """
        try:
            cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            
            if fetch:
                results = cursor.fetchall()
                cursor.close()
                # Converte para dict e formata datas
                return [self._convert_dates(dict(row)) for row in results]
            else:
                self.conn.commit()
                lastrowid = cursor.lastrowid if hasattr(cursor, 'lastrowid') else None
                cursor.close()
                return lastrowid
                
        except Exception as e:
            self.conn.rollback()
            print(f'Erro ao executar query: {e}')
            raise
    
    def get_all_users(self):
        """Retorna todos os usuários"""
        query = "SELECT * FROM dbtutores ORDER BY id_tutor"
        return self.execute_query(query)
    
    def get_user_by_id(self, user_id):
        """
        Busca usuário por ID
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Dicionário com dados do usuário ou None
        """
        query = "SELECT * FROM dbtutores WHERE id_tutor = %s"
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None

    def create_pets(self, nome, email, telefone1, endereco, bairro, cidade, estado):
        """
        Cria um novo usuário
        
        Args:
            nome: Nome do usuário
            email: Email do usuário
        
        Returns:
            ID do usuário criado
        """
        query = """
            INSERT INTO dbtutores (nome, email, telefone1, endereco, bairro, cidade, estado, criado_em) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW()) 
            RETURNING id_tutor
        """
        cursor = self.conn.cursor()
        cursor.execute(query, (nome, email, telefone1, endereco, bairro, cidade, estado))
        id_tutor = cursor.fetchone()[0]
        self.conn.commit()
        cursor.close()
        return id_tutor

    def __del__(self):
        """Destrutor - fecha conexão automaticamente"""
        self.close()
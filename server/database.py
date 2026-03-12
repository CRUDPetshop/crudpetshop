import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date
from decimal import Decimal
from config import DB_CONFIG

INIT_SQL_PATH = os.path.join(os.path.dirname(__file__), 'init.sql')


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

    def setup(self):
        """
        Lê e executa o init.sql para criar as tabelas caso não existam.
        Chamado uma vez na inicialização do servidor.
        """
        if not os.path.exists(INIT_SQL_PATH):
            print(f'[DB] Aviso: init.sql não encontrado em {INIT_SQL_PATH}')
            return

        with open(INIT_SQL_PATH, 'r', encoding='utf-8') as f:
            sql = f.read()

        try:
            cursor = self.conn.cursor()
            cursor.execute(sql)
            self.conn.commit()
            cursor.close()
            print('[DB] init.sql executado com sucesso')
        except Exception as e:
            self.conn.rollback()
            print(f'[DB] Erro ao executar init.sql: {e}')
            raise
    
    def _convert_dates(self, row: dict) -> dict:
        """
        Converte tipos do PostgreSQL para tipos serializáveis em JSON:
          
        datetime / date  →  string ISO
        Decimal          →  float
        """
        if isinstance(row, dict):
            for key, value in row.items():
                if isinstance(value, (datetime, date)):
                    row[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    row[key] = float(value)
        return row
    
    def execute_query(self, query: str, params=None, fetch: bool = True):
        """
        Executa uma query SQL.

        Args:
            query:  String SQL
            params: Parâmetros (tuple ou dict)
            fetch:  True  → retorna lista de dicts (SELECT)
                    False → comita e retorna None   (DML sem RETURNING)

        Returns:
            Lista de dicts, ou None.
        """
        try:
            cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)

            if fetch:
                results = cursor.fetchall()
                cursor.close()
                return [self._convert_dates(dict(row)) for row in results]
            else:
                self.conn.commit()
                cursor.close()
                return None

        except Exception as e:
            self.conn.rollback()
            print(f'Erro ao executar query: {e}')
            raise


    def listar_tutores(self):

        if not self.conn:
            self.connect()

        query = """
            SELECT *
            FROM tutores
            ORDER BY id;     
        """
           
        return self.execute_query(query)
    
    def lista_tutor_id(self, id):

        query = """
            SELECT *
            FROM tutores
            WHERE id = %s;
        """
        
        return self.execute_query(query)



    
    def listar_pets(self):

        if not self.conn:
            self.connect()

        query = """
            SELECT *
            FROM animais
            ORDER BY id;     
        """
             
        return self.execute_query(query)
    
    def cadastrar_tutor(self, dados):
        query = """
            INSERT INTO tutores (
                nome, cpf, email, telefone, nascimento, genero, 
                cep, logradouro, numero, complemento, bairro, 
                cidade, estado, origem, obs, criado_em 
            )
            VALUES (
                %(nome)s, %(cpf)s, %(email)s, %(telefone)s, %(nascimento)s, %(genero)s,
                %(cep)s, %(logradouro)s, %(numero)s, %(complemento)s, %(bairro)s,
                %(cidade)s, %(estado)s, %(origem)s, %(obs)s, NOW() 
            )
            RETURNING *;
        """
        # with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
        #     cursor.execute(query, dados)
        #     self.conn.commit()
        #     tutor = cursor.fetchone()
        tutor = self.execute_query(query, dados)
        return self._convert_dates(tutor)
    
    def cadastrar_pet(self, dados):
        query = """
            INSERT INTO animais(
                tutor_id, especie, nome, raca, cor, sexo,
                nascimento, porte, castrado, peso, microchip,
                condicoes, medicamentos, ultima_vacina,
                proxima_vacina, temperamento, reacao_banho, obs, criado_em
            )
            VALUES (
                %(tutor_id)s, %(especie)s, %(nome)s, %(raca)s, %(cor)s, %(sexo)s,
                %(nascimento)s, %(porte)s, %(castrado)s, %(peso)s, %(microchip)s, 
                %(condicoes)s, %(medicamentos)s, %(ultima_vacina)s, 
                %(proxima_vacina)s, %(temperamento)s, %(reacao_banho)s, %(obs)s, NOW()
            )
            RETURNING *;
    """
        # with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
        #     cursor.execute(query, dados)
        #     self.conn.commit()
        #     pet = cursor.fetchone()
        pet = self.execute_query(query, dados)
        return self._convert_dates(pet)

    def atualizar_tutor(self, id, dados):
        query = """
            UPDATE tutores
            SET
                nome = %(nome)s,
                cpf = %(cpf)s,
                telefone = %(telefone)s,
                nascimento = %(nascimento)s,
                genero = %(genero)s,
                cep = %(cep)s,
                logradouro = %(logradouro)s,
                numero = %(numero)s,
                complemento = %(complemento)s,
                bairro = %(bairro)s,
                cidade = %(cidade)s,
                estado = %(estado)s,
                origem = %(origem)s,
                obs = %(obs)s
            WHERE id = %(id)s
            RETURNING *;
    """
        dados["id"] = id

        # with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
        #     cursor.execute(query, dados)
        #     self.conn.commit()
        #     tutor = cursor.fetchone()
        tutor = self.execute_query(query, dados)
        return self._convert_dates(tutor)
    
    def atualizar_pet(self, id, dados):
        query = """
            UPDATE animais
            SET
                tutor_id = %(tutor_id)s,
                especie = %(especie)s,
                nome = %(nome)s,
                raca = %(raca)s,
                cor = %(cor)s,
                sexo = %(sexo)s,
                nascimento = %(nascimento)s,
                porte = %(porte)s,
                microchip = %(microchip)s,
                peso = %(peso)s,
                condicoes = %(condicoes)s,
                medicamentos = %(medicamentos)s,
                ultima_vacina = %(ultima_vacina)s,
                proxima_vacina = %(proxima_vacina)s,
                temperamento = %(temperamento)s,
                reacao_banho = %(reacao_banho)s,
                obs = %(obs)s
            WHERE id = %(id)s
            RETURNING *;
    """
        dados["id"] = id

        # with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
        #     cursor.execute(query, dados)
        #     self.conn.commit()
        #     pet = cursor.fetchone()
        pet = self.execute_query(query, dados)
        return self._convert_dates(pet)
    
    def deletar_tutor(self, id):
        query = """
        DELETE FROM tutores
        WHERE id = %s;
    """
        with self.conn.cursor() as cursor:
            cursor.execute(query, (id,))
            self.conn.commit()

    def deletar_pet(self, id):
        query = """
        DELETE FROM animais
        WHERE id = %s;
    """
        with self.conn.cursor() as cursor:
            cursor.execute(query, (id,))
            self.conn.commit()

    def criar_agendamento(self, dados):
        query = """
            INSERT INTO agendamentos (
            tutor_id,
            animal_id,
            servico,
            addons,
            data,
            horario,
            pagamento,
            notificacao,
            obs,
            status,
            total
        )
        VALUES (
            %(tutor_id)s,
            %(animal_id)s,
            %(servico)s,
            %(addons)s,
            %(data)s,
            %(horario)s,
            %(pagamento)s,
            %(notificacao)s,
            %(obs)s,
            %(status)s,
            %(total)s
        )
        RETURNING *;
    """
    
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, dados)
            self.conn.commit()
            agendamento = cursor.fetchone()
        
        return self._convert_dates(agendamento)
    
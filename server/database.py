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
    
    def execute_query(self, query: str, params=None, fetch: bool = True, commit: bool = True):
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
                if commit: 
                    self.conn.commit()
                cursor.close()
                return [self._convert_dates(dict(row)) for row in results]
            else:
                if commit:
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

        result =  self.execute_query(query, (id,))
        return result[0] if result else None


    def listar_pets(self):

        if not self.conn:
            self.connect()

        query = """
            SELECT *
            FROM animais
            ORDER BY id;     
        """
             
        return self.execute_query(query)


    def lista_pet_id(self, id):

        query = """
            SELECT *
            FROM animais
            WHERE id = %s;
        """

        result =  self.execute_query(query, (id,))
        return result[0] if result else None

    def lista_pet_tutor_id(self, id):

        query = """
            SELECT *
            FROM animais
            WHERE tutor_id = %s;
        """

        result =  self.execute_query(query, (id,))
        return result

    
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
        tutor = self.execute_query(query, dados)
        return self._convert_dates(tutor)
    
    def cadastrar_pet(self, dados):
        dados['ultima_vacina'] = dados.get('ultima_vacina') or None
        dados['proxima_vacina'] = dados.get('proxima_vacina') or None

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
        tutor = self.execute_query(query, dados)
        return tutor[0] if tutor else None


    def atualizar_pet(self, id, dados):
        dados['ultima_vacina'] = dados.get('ultima_vacina') or None
        dados['proxima_vacina'] = dados.get('proxima_vacina') or None

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
        pet = self.execute_query(query, dados)
        return pet[0] if pet else None

    
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

    def cadastrar_agendamento(self, dados):

        try: 
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

            agendamento = self.execute_query(query, dados, True, False)
            dados['id_agendamento'] = agendamento[0]["id"]
        
            t = dados.get('transporte') or {}

            if t.get('busca') or t.get('entrega'):

                addr_tutor = t.get('addr_tutor') or {}
                addr_busca_raw = t.get('addr_busca')
                addr_entrega_raw = t.get('addr_entrega')

                addr_busca = (addr_busca_raw if isinstance(addr_busca_raw, dict) else None) or addr_tutor
                addr_entrega = (addr_entrega_raw if isinstance(addr_entrega_raw, dict) else None) or addr_tutor

                addr_keys = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado']

                transporte_payload = {
                    **{k: v for k, v in t.items() if k not in ('addr_busca', 'addr_entrega', 'addr_tutor')},
                    'agendamento_id': dados['id_agendamento'],
                    **{f'busca_{k}': addr_busca.get(k) for k in addr_keys},
                    **{f'entrega_{k}': addr_entrega.get(k) for k in addr_keys},
                }

                query_transporte = """
                    INSERT INTO transportes (
                        agendamento_id,
                        tem_busca,
                        tem_entrega,
                        horario_busca,
                        horario_entrega,
                        obs_busca,
                        obs_entrega,
                        busca_cep,
                        busca_logradouro,
                        busca_numero,
                        busca_complemento,
                        busca_bairro,
                        busca_cidade,
                        busca_estado,
                        entrega_cep,
                        entrega_logradouro,
                        entrega_numero,
                        entrega_complemento,
                        entrega_bairro,
                        entrega_cidade,
                        entrega_estado
                    )
                    VALUES (
                        %(agendamento_id)s,
                        %(busca)s,
                        %(entrega)s,
                        %(horario_busca)s,
                        %(horario_entrega)s,
                        %(obs_busca)s,
                        %(obs_entrega)s,
                        %(busca_cep)s, 
                        %(busca_logradouro)s, 
                        %(busca_numero)s, 
                        %(busca_complemento)s, 
                        %(busca_bairro)s, 
                        %(busca_cidade)s, 
                        %(busca_estado)s,
                        %(entrega_cep)s, 
                        %(entrega_logradouro)s, 
                        %(entrega_numero)s, 
                        %(entrega_complemento)s, 
                        %(entrega_bairro)s, 
                        %(entrega_cidade)s, 
                        %(entrega_estado)s
                    )
                    RETURNING *;
                """

                transporte = self.execute_query(
                    query_transporte, 
                    transporte_payload, 
                    fetch=True, 
                    commit=False
                )

                if not transporte:
                    raise Exception("Erro ao cadastrar transporte")
                
            self.conn.commit()

            return agendamento[0]
        
        except Exception as e:
        
            self.conn.rollback()
            print(f"Erro ao cadastrar: {e}")
            raise

    def listar_todos_agendamentos(self):

        query = """
            SELECT
                ag.id,
                ag.horario,
                ag.servico,
                ag.data,
                ag.addons,
                ag.status,
                ag.total,
                ag.pagamento,
                ag.obs,
                animais.nome as animal_nome,
                animais.especie as animal_especie,
                tutores.nome as tutor_nome
            FROM
                agendamentos ag
            INNER JOIN
                animais ON animais.id = ag.animal_id
            INNER JOIN
                tutores ON tutores.id = ag.tutor_id
        """

        return self.execute_query(query)

    def atualizar_agendamento(self, id, dados):

        query = """
            UPDATE 
                agendamentos
            SET
                status = %(status)s,
                pagamento = %(pagamento)s,
                obs = %(obs)s
            WHERE 
                id = %(id)s
            RETURNING *;
        """

        dados["id"] = id
        agendamento = self.execute_query(query, dados)
        return agendamento[0] if agendamento else None

    def deletar_agendamento(self, id):
        query = """
            DELETE FROM agendamentos
            WHERE id = %s;
        """
        with self.conn.cursor() as cursor:
            cursor.execute(query, (id,))
            self.conn.commit()
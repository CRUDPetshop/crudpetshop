\c projeto_db;

DROP TABLE IF EXISTS animal CASCADE;
DROP TABLE IF EXISTS raca CASCADE;
DROP TABLE IF EXISTS especie CASCADE;
DROP TABLE IF EXISTS tutores CASCADE;
DROP TABLE IF EXISTS estado CASCADE;

CREATE TABLE estado (
    id SERIAL PRIMARY KEY,
    uf CHAR(2),
    descricao VARCHAR(50) NOT NULL
);

INSERT INTO estado (uf, descricao, regiao) VALUES
('AC', 'Acre'),
('AL', 'Alagoas'),
('AP', 'Amapá'),
('AM', 'Amazonas'),
('BA', 'Bahia'),
('CE', 'Ceará'),
('DF', 'Distrito Federal'),
('ES', 'Espírito'),
('GO', 'Goiás'),
('MA', 'Maranhão'),
('MT', 'Mato Grosso'),
('MS', 'Mato Grosso do Sul'),
('MG', 'Minas Gerais'),
('PA', 'Pará'),
('PB', 'Paraíba'),
('PR', 'Paraná'),
('PE', 'Pernambuco'),
('PI', 'Piauí'),
('RJ', 'Rio de Janeiro'),
('RN', 'Rio Grande do Norte'),
('RS', 'Rio Grande do Sul'),
('RO', 'Rondônia'),
('RR', 'Roraima'),
('SC', 'Santa Catarina'),
('SP', 'São Paulo'),
('SE', 'Sergipe'),
('TO', 'Tocantins');

CREATE TABLE tutores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(50),
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    bairro VARCHAR(50),
    cidade VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado CHAR(2)
);

CREATE TABLE raca (
    cod_raca SERIAL PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

INSERT INTO raca (descricao) VALUES
    ('Vira-lata'),
    ('Labrador'),
    ('Golden Retriever'),
    ('Poodle'),
    ('Bulldog'),
    ('Vira-lata'),
    ('Persa'),
    ('Siamês'),
    ('Maine Coon');

CREATE TABLE animal (
    id SERIAL PRIMARY KEY,
    tutor INT REFERENCES tutores(id),
    nome VARCHAR(50) NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    dtnascimento DATE,
    cor VARCHAR(30),
    porte CHAR(1) CHECK (porte IN ('P', 'M', 'G')),
    microchip BOOLEAN DEFAULT FALSE,
    num_chip VARCHAR(30),
    castrado BOOLEAN DEFAULT FALSE,
    doencas_alergias TEXT,
    peso NUMERIC(5,2)
);
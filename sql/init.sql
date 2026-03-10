CREATE TABLE IF NOT EXISTS tutores (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(200)        NOT NULL,
    cpf         VARCHAR(14) UNIQUE  NOT NULL,
    email       VARCHAR(200),
    telefone    VARCHAR(20),
    nascimento  DATE,
    genero      VARCHAR(30),
    cep         VARCHAR(10),
    logradouro  VARCHAR(200),
    numero      VARCHAR(20),
    complemento VARCHAR(100),
    bairro      VARCHAR(100),
    cidade      VARCHAR(100),
    estado      CHAR(2),
    origem      VARCHAR(100),
    obs         TEXT,
    criado_em   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animais (
    id              SERIAL PRIMARY KEY,
    tutor_id        INTEGER NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    especie         VARCHAR(50)  NOT NULL,
    nome            VARCHAR(100) NOT NULL,
    raca            VARCHAR(100),
    cor             VARCHAR(80),
    sexo            VARCHAR(20),
    nascimento      DATE,
    porte           VARCHAR(20),
    castrado        VARCHAR(20),
    peso            NUMERIC(6,2),
    microchip       VARCHAR(50),
    condicoes       TEXT,           -- valores separados por vírgula
    medicamentos    TEXT,
    ultima_vacina   DATE,
    proxima_vacina  DATE,
    temperamento    VARCHAR(80),
    reacao_banho    VARCHAR(80),
    obs             TEXT,
    criado_em       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id          SERIAL PRIMARY KEY,
    tutor_id    INTEGER REFERENCES tutores(id) ON DELETE SET NULL,
    animal_id   INTEGER REFERENCES animais(id) ON DELETE SET NULL,
    servico     VARCHAR(100) NOT NULL,
    addons      TEXT,               -- valores separados por vírgula
    data        DATE         NOT NULL,
    horario     VARCHAR(10)  NOT NULL,
    pagamento   VARCHAR(50),
    notificacao VARCHAR(50),
    obs         TEXT,
    status      VARCHAR(30)  NOT NULL DEFAULT 'Confirmado',
    total       NUMERIC(10,2),
    criado_em   TIMESTAMP DEFAULT NOW()
);
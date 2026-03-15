# 🐾 PataFeliz – Sistema de PetShop

Sistema web completo para gerenciamento de petshop com cadastro de tutores, animais e agendamento de serviços.

---

## 📁 Estrutura do Projeto

```
projeto-fullstack/
├── client/                  # Frontend (HTML, CSS, JS)
│   ├── assets/
│   │   ├── css/             # Estilos
│   │   └── js/
│   │       ├── app.js       # Lógica geral
│   │       ├── tutor.js     # Lógica de tutores
│   │       └── animal.js    # Lógica de animais
│   ├── components/          # Componentes reutilizáveis
│   └── pages/
│       ├── index.html       # Página inicial
│       ├── tutores.html     # Cadastro de tutores
│       ├── animais.html     # Cadastro de animais
│       ├── agendamento.html # Agendamento de serviços
│       └── service.html     # Catálogo de serviços
│
├── server/                  # Backend (Python puro)
│   ├── config.py            # Configurações (DB e servidor)
│   ├── database.py          # Conexão e queries PostgreSQL
│   ├── router.py            # Mini-framework de rotas com decorators
│   ├── routes.py            # Definição dos endpoints da API
│   └── server.py            # Ponto de entrada do servidor
│
├── sql/
│   └── init.sql             # Script de criação das tabelas
│
├── docker-compose.yml       # PostgreSQL + Adminer
├── .env                     # Variáveis de ambiente
└── requirements.txt         # Dependências Python
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- [Python 3.11+](https://www.python.org/downloads/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/projeto-fullstack.git
cd projeto-fullstack
```

### 2. Configure o arquivo `.env`

```env
DB_HOST=localhost
DB_NAME=petshop
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5433

SERVER_HOST=localhost
SERVER_PORT=8000
```

### 3. Suba o banco de dados com Docker

```bash
docker compose up -d
```

Isso inicia o **PostgreSQL** na porta `5433` e o **Adminer** na porta `8080`.

### 4. Crie o ambiente virtual e instale as dependências

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 5. Inicie o servidor

```bash
python server.py
```

Acesse: **http://localhost:8000**

---

## 🔗 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tutores` | Lista todos os tutores |
| GET | `/api/tutores/:id` | Busca tutor por ID |
| POST | `/api/cad_tutores` | Cadastra novo tutor |
| PUT | `/api/att_tutores/:id` | Atualiza tutor |
| DELETE | `/api/del_tutores/:id` | Remove tutor |
| GET | `/api/pet` | Lista todos os animais |
| POST | `/api/cad_pet` | Cadastra novo animal |
| PUT | `/api/att_pet/:id` | Atualiza animal |
| DELETE | `/api/del_pet/:id` | Remove animal |
| POST | `/api/agendamentos` | Cria agendamento |

---

## 🗄️ Banco de Dados

### Adminer (interface visual)

Acesse **http://localhost:8080** e faça login com:

| Campo | Valor |
|-------|-------|
| Sistema | PostgreSQL |
| Servidor | `postgres` |
| Usuário | `postgres` |
| Senha | `postgres` |
| Base de dados | `petshop` |

### Tabelas

- **tutores** — dados dos responsáveis pelos animais
- **animais** — dados dos pets vinculados a um tutor
- **agendamentos** — serviços agendados (banho, tosa, consulta, etc.)

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML, CSS, Bootstrap, JavaScript |
| Backend | Python puro (sem frameworks) |
| Banco de dados | PostgreSQL 15 |
| Interface DB | Adminer |
| Infraestrutura | Docker + Docker Compose |

---

## ⚙️ Dependências Python

```
psycopg2-binary
python-dotenv
```
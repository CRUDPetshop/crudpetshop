# 🚀 Sistema Full Stack - Python Puro + PostgreSQL + Docker

Sistema completo de gerenciamento de usuários com **servidor HTTP em Python puro** (sem frameworks), **múltiplas páginas HTML** e **PostgreSQL em Docker**.

## 📁 Estrutura do Projeto

```
projeto-fullstack/
├── server/                    # Servidor e lógica de backend
│   ├── server.py             # Servidor HTTP em Python puro
│   ├── database.py           # Módulo de conexão com PostgreSQL
│   └── config.py             # Configurações do projeto
│
├── client/                   # Interface web (frontend)
│   ├── index.html           # Página principal (CRUD de usuários)
│   ├── pages/               # Páginas adicionais
│   │   ├── sobre.html       # Sobre o sistema
│   │   └── relatorios.html  # Relatórios e estatísticas
│   ├── components/          # Componentes reutilizáveis (futuro)
│   └── assets/
│       ├── css/
│       │   └── styles.css   # Estilos da aplicação
│       └── js/
│           └── app.js       # Lógica JavaScript
│
├── sql/                     # Scripts de banco de dados
│   └── init.sql            # Script de inicialização
│
├── docker-compose.yml       # Orquestração dos containers
├── Dockerfile              # Imagem Docker do servidor Python (opcional)
├── Makefile               # Comandos úteis
├── requirements.txt       # Dependências Python
├── .env.example          # Exemplo de variáveis de ambiente
├── .dockerignore         # Arquivos ignorados pelo Docker
└── .gitignore           # Arquivos ignorados pelo Git
```

## 🛠️ Tecnologias Utilizadas

### Servidor (Backend)
- **Python 3.x** (puro, sem frameworks)
- **http.server** - Servidor HTTP nativo do Python
- **psycopg2** - Driver PostgreSQL para Python
- **mimetypes** - Servir arquivos estáticos

### Cliente (Frontend)
- **HTML5** - Múltiplas páginas
- **CSS3** - Design moderno com gradientes
- **JavaScript ES6+** - Fetch API para requisições

### Infraestrutura
- **PostgreSQL 15** - Banco de dados em container
- **Docker & Docker Compose** - Containerização
- **Adminer** - Interface web para gerenciar o banco

## 📋 Pré-requisitos

### Opção 1: Com Docker (Recomendado)
- Docker
- Docker Compose
- Python 3.7+ (para o servidor)
- pip

### Opção 2: Sem Docker
- Python 3.7+
- PostgreSQL 12+
- pip

## 🚀 Instalação e Configuração

### Método 1: Usando Docker (Recomendado) 🐳

#### 1. Clone o projeto
```bash
cd projeto-fullstack
```

#### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` se necessário (os valores padrão já funcionam):
```env
DB_HOST=localhost
DB_NAME=projeto_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
```

#### 3. Inicie o PostgreSQL com Docker
```bash
# Usando Make (mais fácil)
make up

# Ou usando docker-compose diretamente
docker-compose up -d
```

Isso vai iniciar:
- 🐘 **PostgreSQL** na porta 5432
- 📊 **Adminer** (interface web) na porta 8080

#### 4. Instale as dependências Python
```bash
pip install -r requirements.txt
# ou
make install
```

#### 5. Inicie o servidor Python
```bash
cd server
python3 server.py
```

#### 6. Acesse a aplicação
- **Aplicação**: http://localhost:8000
- **Adminer** (DB Admin): http://localhost:8080
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuário: postgres
  - Senha: postgres
  - Base de dados: projeto_db

### Método 2: Sem Docker

<details>
<summary>Clique para ver instruções sem Docker</summary>

#### 1. Instale o PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### 2. Configure o banco de dados
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE projeto_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE projeto_db TO postgres;
\q
```

#### 3. Execute o script SQL
```bash
psql -U postgres -d projeto_db -f sql/init.sql
```

#### 4. Configure e inicie
```bash
cp .env.example .env
pip install -r requirements.txt
cd server && python3 server.py
```

</details>

## 📖 Páginas do Sistema

### 🏠 Página Principal (/)
- CRUD completo de usuários
- Formulário de cadastro/edição
- Listagem com cards interativos
- Validação em tempo real

### 📖 Sobre (/pages/sobre.html)
- Informações sobre o projeto
- Tecnologias utilizadas
- Funcionalidades
- Objetivos

### 📊 Relatórios (/pages/relatorios.html)
- Estatísticas gerais
- Total de usuários
- Última atualização
- Tabela completa de dados

## 🔧 Comandos Úteis (Makefile)

```bash
make help       # Mostra todos os comandos disponíveis
make up         # Sobe os containers do Docker
make down       # Para os containers
make restart    # Reinicia os containers
make logs       # Mostra logs em tempo real
make clean      # Remove tudo (containers, volumes, etc)
make db-shell   # Conecta ao shell do PostgreSQL
make adminer    # Abre o Adminer no navegador
make install    # Instala dependências Python
make dev        # Inicia ambiente de desenvolvimento completo
```

## 📡 API Endpoints

### Listar todos os usuários
```http
GET /api/usuarios
```

### Buscar usuário por ID
```http
GET /api/usuarios/{id}
```

### Criar novo usuário
```http
POST /api/usuarios
Content-Type: application/json

{
  "nome": "Maria Santos",
  "email": "maria@email.com"
}
```

### Atualizar usuário
```http
PUT /api/usuarios/{id}
Content-Type: application/json

{
  "nome": "Maria Silva Santos",
  "email": "maria.santos@email.com"
}
```

### Deletar usuário
```http
DELETE /api/usuarios/{id}
```

## 🎨 Adicionando Novas Páginas HTML

### 1. Crie o arquivo HTML
```bash
# Crie na pasta client/pages/
touch client/pages/nova-pagina.html
```

### 2. Estrutura básica da página
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Página</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 Nova Página</h1>
            <p class="subtitle">Descrição da página</p>
        </header>

        <nav class="navigation">
            <a href="/" class="nav-link">🏠 Início</a>
            <a href="/pages/sobre.html" class="nav-link">📖 Sobre</a>
            <a href="/pages/relatorios.html" class="nav-link">📊 Relatórios</a>
            <a href="/pages/nova-pagina.html" class="nav-link active">🎯 Nova Página</a>
        </nav>

        <main>
            <!-- Seu conteúdo aqui -->
        </main>

        <footer>
            <p>Desenvolvido com Python puro + PostgreSQL + Docker</p>
        </footer>
    </div>

    <!-- Scripts se necessário -->
    <script src="/assets/js/app.js"></script>
</body>
</html>
```

### 3. Acesse a página
```
http://localhost:8000/pages/nova-pagina.html
```

O servidor automaticamente servirá qualquer arquivo `.html`, `.css`, `.js` que estiver na pasta `client/`!

## 🐛 Troubleshooting

### PostgreSQL não conecta
```bash
# Verifique se o container está rodando
docker ps

# Veja os logs
docker logs projeto_postgres

# Reinicie os containers
make restart
```

### Porta já em uso
```bash
# Porta 8000 (servidor Python)
lsof -ti:8000 | xargs kill -9

# Porta 5432 (PostgreSQL)
docker-compose down
make up
```

### Banco de dados não inicializa
```bash
# Limpe tudo e recomece
make clean
make up

# Ou manualmente
docker-compose down -v
docker-compose up -d
```

### Erro de permissão no Docker
```bash
# Linux: adicione seu usuário ao grupo docker
sudo usermod -aG docker $USER
# Depois faça logout e login novamente
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_HOST=localhost
DB_NAME=projeto_db
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
DB_PORT=5432

# Servidor
SERVER_HOST=localhost
SERVER_PORT=8000
```

## 📦 Docker Compose Services

### postgres
- Imagem: `postgres:15-alpine`
- Porta: `5432`
- Volume persistente para dados
- Script de inicialização automático

### adminer
- Imagem: `adminer:latest`
- Porta: `8080`
- Interface web para gerenciar o PostgreSQL

## 🧪 Testando a API

```bash
# Listar usuários
curl http://localhost:8000/api/usuarios

# Criar usuário
curl -X POST http://localhost:8000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Pedro Costa","email":"pedro@email.com"}'

# Atualizar usuário
curl -X PUT http://localhost:8000/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nome":"Pedro Silva","email":"pedro.silva@email.com"}'

# Deletar usuário
curl -X DELETE http://localhost:8000/api/usuarios/1
```

## 📝 Próximos Passos

- [ ] Autenticação JWT
- [ ] Paginação na API
- [ ] Filtros e busca avançada
- [ ] Upload de imagens
- [ ] Testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Deploy em produção

## 📄 Licença

Projeto livre para uso educacional e comercial.

---

**Desenvolvido com ❤️ usando Python puro, PostgreSQL e Docker**


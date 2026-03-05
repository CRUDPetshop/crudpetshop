import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'projeto_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'port': os.getenv('DB_PORT', '5432')
}

SERVER_CONFIG = {
    'host': os.getenv('SERVER_HOST', 'localhost'),
    'port': int(os.getenv('SERVER_PORT', '8000'))
}
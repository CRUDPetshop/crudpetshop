import os
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Importa o router já com as rotas registradas
from routes import router, db

# Pasta raiz dos arquivos estáticos (HTML, CSS, JS)
CLIENT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'client')
)

# Mapeamento de paths "amigáveis" → arquivo HTML
PAGE_ALIASES = {
    '/':           'pages/index.html',
    '/servicos':   'pages/service.html',
    '/tutores':    'pages/tutores.html',
    '/animais':    'pages/animais.html',
    '/agendamento':'pages/agendamento.html',
}


class PetShopHandler(BaseHTTPRequestHandler):

    # ── CORS preflight ────────────────────────────────────────────────────────

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods',
                         'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # ── Despacho geral ────────────────────────────────────────────────────────

    def _dispatch(self):
        parsed = urlparse(self.path)
        path   = parsed.path

        # 1) Tenta resolver como rota de API
        if path.startswith('/api/'):
            handled = router.dispatch(self)
            if not handled:
                self._send_json({'error': 'Rota não encontrada'}, 404)
            return

        # 2) Resolve aliases de páginas (/tutores → tutores.html)
        filename = PAGE_ALIASES.get(path)
        if filename:
            self._serve_file(os.path.join(CLIENT_DIR, filename))
            return

        # 3) Serve arquivo estático diretamente
        file_path = os.path.normpath(
            os.path.join(CLIENT_DIR, path.lstrip('/'))
        )

        # Proteção contra path traversal
        if not file_path.startswith(os.path.abspath(CLIENT_DIR)):
            self._send_error_html('Acesso negado', 403)
            return

        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, 'index.html')

        self._serve_file(file_path)

    do_GET    = _dispatch
    do_POST   = _dispatch
    do_PUT    = _dispatch
    do_DELETE = _dispatch

    # ── Utilitários de resposta ───────────────────────────────────────────────

    def _send_json(self, data: dict, status: int = 200):
        import json
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, filepath: str):
        mime_type, _ = mimetypes.guess_type(filepath)
        mime_type = mime_type or 'application/octet-stream'
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self._send_error_html(f'Arquivo não encontrado: {filepath}', 404)
        except Exception as e:
            self._send_error_html(f'Erro interno: {e}', 500)

    def _send_error_html(self, msg: str, status: int):
        body = f'<h1>{status} – {msg}</h1>'.encode()
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        """Log colorido no terminal."""
        method = args[0].split()[0] if args else ''
        colors = {
            'GET': '\033[94m', 'POST': '\033[92m',
            'PUT': '\033[93m', 'DELETE': '\033[91m',
        }
        c = colors.get(method, '')
        reset = '\033[0m'
        print(f"  {c}{fmt % args}{reset}  [{self.log_date_time_string()}]")


# ─────────────────────────────────────────────────────────────────────────────
# INICIALIZAÇÃO
# ─────────────────────────────────────────────────────────────────────────────

def run():
    host = os.getenv('HOST', 'localhost')
    port = int(os.getenv('PORT', 8000))

    print('\n🐾  PataFeliz PetShop – iniciando...')

    # Cria tabelas se não existirem
    db.setup()

    # Rotas registradas
    print('\n📋  Rotas da API:')
    for method, pattern, _, fn in router._routes:
        color = {
            'GET': '\033[94m', 'POST': '\033[92m',
            'PUT': '\033[93m', 'DELETE': '\033[91m',
        }.get(method, '')
        print(f"   {color}{method:7}\033[0m {pattern.pattern}  →  {fn.__name__}")

    httpd = HTTPServer((host, port), PetShopHandler)
    print(f'\n🚀  Servidor rodando em http://{host}:{port}')
    print(f'📁  Arquivos estáticos: {CLIENT_DIR}')
    print('     Pressione Ctrl+C para parar\n')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n\n🛑  Servidor encerrado.')
        db.close()
        httpd.shutdown()


if __name__ == '__main__':
    run()
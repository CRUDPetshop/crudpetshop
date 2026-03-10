import re
import json
from urllib.parse import urlparse, parse_qs


class Request:
    """Encapsula os dados da requisição HTTP."""

    def __init__(self, handler):
        parsed = urlparse(handler.path)
        self.method      = handler.command
        self.path        = parsed.path
        self.query       = parse_qs(parsed.query)   # {'page': ['1'], ...}
        self.params      = {}                        # preenchido pelo router
        self.headers     = handler.headers
        self._handler    = handler
        self._body_cache = None

    @property
    def body(self) -> dict:
        """Lê e faz parse do body JSON (lazy, com cache)."""
        if self._body_cache is not None:
            return self._body_cache
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self._handler.rfile.read(length) if length else b''
            self._body_cache = json.loads(raw.decode('utf-8')) if raw else {}
        except (json.JSONDecodeError, ValueError):
            self._body_cache = {}
        return self._body_cache

    def query_get(self, key: str, default=None):
        """Retorna o primeiro valor de um query param."""
        values = self.query.get(key)
        return values[0] if values else default


class Response:
    """Encapsula o envio da resposta HTTP."""

    def __init__(self, handler):
        self._handler = handler

    def _base_headers(self, status: int, content_type: str):
        self._handler.send_response(status)
        self._handler.send_header('Content-Type', content_type)
        self._handler.send_header('Access-Control-Allow-Origin', '*')
        self._handler.send_header('Access-Control-Allow-Methods',
                                  'GET, POST, PUT, DELETE, OPTIONS')
        self._handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self._handler.end_headers()

    def json(self, data, status: int = 200):
        """Envia resposta JSON."""
        body = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
        self._base_headers(status, 'application/json; charset=utf-8')
        self._handler.wfile.write(body)

    def error(self, message: str, status: int = 400):
        """Envia resposta de erro JSON."""
        self.json({'error': message}, status)

    def created(self, data):
        """Atalho para 201 Created."""
        self.json(data, 201)

    def no_content(self):
        """Atalho para 204 No Content."""
        self._base_headers(204, 'application/json')


class Router:
    """
    Roteador com suporte a decorators e parâmetros dinâmicos.

    Uso:
        router = Router()

        @router.get('/api/tutores')
        def list_tutores(req, res):
            res.json([...])

        @router.post('/api/tutores')
        def create_tutor(req, res):
            data = req.body
            res.created({...})

        @router.get('/api/tutores/:id')
        def get_tutor(req, res):
            tutor_id = req.params['id']
            res.json({...})
    """

    def __init__(self):
        # lista de (method, regex_pattern, param_names, handler_fn)
        self._routes: list[tuple] = []

    def _pattern_to_regex(self, pattern: str) -> tuple[re.Pattern, list[str]]:
        """
        Converte '/api/tutores/:id' em regex e extrai nomes dos parâmetros.
        Retorna (compiled_regex, ['id'])
        """
        param_names = []

        def replacer(match):
            param_names.append(match.group(1))
            return r'([^/]+)'

        regex_str = re.sub(r':([a-zA-Z_][a-zA-Z0-9_]*)', replacer, pattern)
        regex_str = f'^{regex_str}$'
        return re.compile(regex_str), param_names

    def _add_route(self, method: str, pattern: str, fn):
        compiled, param_names = self._pattern_to_regex(pattern)
        self._routes.append((method.upper(), compiled, param_names, fn))
        return fn

    # ── Decorators por método ──────────────────────────────────────────────

    def get(self, pattern: str):
        def decorator(fn):
            return self._add_route('GET', pattern, fn)
        return decorator

    def post(self, pattern: str):
        def decorator(fn):
            return self._add_route('POST', pattern, fn)
        return decorator

    def put(self, pattern: str):
        def decorator(fn):
            return self._add_route('PUT', pattern, fn)
        return decorator

    def delete(self, pattern: str):
        def decorator(fn):
            return self._add_route('DELETE', pattern, fn)
        return decorator

    def patch(self, pattern: str):
        def decorator(fn):
            return self._add_route('PATCH', pattern, fn)
        return decorator

    # ── Resolução de rota ─────────────────────────────────────────────────

    def resolve(self, method: str, path: str) -> tuple | None:
        """
        Procura a rota correspondente.
        Retorna (handler_fn, params_dict) ou None se não encontrar.
        """
        for route_method, pattern, param_names, fn in self._routes:
            if route_method != method.upper():
                continue
            match = pattern.match(path)
            if match:
                params = dict(zip(param_names, match.groups()))
                return fn, params
        return None

    def dispatch(self, handler) -> bool:
        """
        Chamado pelo HTTPRequestHandler para despachar a requisição.
        Retorna True se uma rota foi encontrada e executada.
        """
        req = Request(handler)
        res = Response(handler)

        result = self.resolve(req.method, req.path)
        if result is None:
            return False

        route_fn, params = result
        req.params = params

        try:
            route_fn(req, res)
        except Exception as e:
            import traceback
            traceback.print_exc()
            res.error(f'Erro interno: {str(e)}', 500)

        return True
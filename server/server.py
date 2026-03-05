from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import mimetypes
from urllib.parse import urlparse, parse_qs
from database import Database

class APIHandler(BaseHTTPRequestHandler):

    CLIENT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client')
    
    def __init__(self, *args, **kwargs):
        self.db = Database()
        super().__init__(*args, **kwargs)
    
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def _send_json(self, data, status=200):
        self._set_headers(status)
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, message, status=400):
        self._send_json({'error': message}, status)
    
    def _serve_file(self, filepath):
        try:
            mime_type, _ = mimetypes.guess_type(filepath)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            with open(filepath, 'rb') as f:
                content = f.read()
                self._set_headers(content_type=mime_type)
                self.wfile.write(content)
        except FileNotFoundError:
            self._set_headers(404, 'text/html')
            self.wfile.write(b'<h1>404 - Arquivo nao encontrado</h1>')
        except Exception as e:
            self._set_headers(500, 'text/html')
            self.wfile.write(f'<h1>500 - Erro interno: {str(e)}</h1>'.encode())
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/usuarios':
            usuarios = self.db.get_all_users()
            self._send_json({'usuarios': usuarios})

        elif path == '/api/pets':

            usuarios = self.db.get_all_users()
            self._send_json({'pets': usuarios})
            
        elif path.startswith('/api/pets/'):
            user_id = path.split('/')[-1]
            try:
                user_id = int(user_id)
                usuario = self.db.get_user_by_id(user_id)

                if usuario:
                    self._send_json({'usuario': usuario})
                else:
                    self._send_error('Usuário não encontrado', 404)
            except ValueError:
                self._send_error('ID inválido', 400)
        else:
            if path == '/':
                path = '/index.html'
            
            file_path = os.path.normpath(os.path.join(self.CLIENT_DIR, path.lstrip('/')))
            
            if not file_path.startswith(os.path.abspath(self.CLIENT_DIR)):
                self._send_error('Acesso negado', 403)
                return
            
            if os.path.isdir(file_path):
                file_path = os.path.join(file_path, 'index.html')
            
            self._serve_file(file_path)
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/usuarios':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                nome = data.get('nome')
                email = data.get('email')
                
                if not nome or not email:
                    self._send_error('Nome e email são obrigatórios', 400)
                    return
                
                user_id = self.db.create_user(nome, email)
                self._send_json({'id': user_id, 'message': 'Usuário criado com sucesso'}, 201)
                
            except json.JSONDecodeError:
                self._send_error('JSON inválido', 400)
            except Exception as e:
                self._send_error(f'Erro ao criar usuário: {str(e)}', 500)

        elif path == '/api/pets':

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                nome = data.get('nome')
                email = data.get('email')
                telefone = data.get('telefone1')
                endereco = data.get('endereco')
                bairro = data.get('bairro')
                cidade = data.get('cidade')
                estado = data.get('estado')
                
                if not nome or not email:
                    self._send_error('Nome e email são obrigatórios', 400)
                    return
                
                user_id = self.db.create_pets(nome, email, telefone, endereco, bairro, cidade, estado)
                self._send_json({'id': user_id, 'message': 'Usuário criado com sucesso'}, 201)
                
            except json.JSONDecodeError:
                self._send_error('JSON inválido', 400)
            except Exception as e:
                self._send_error(f'Erro ao criar PET: {str(e)}', 500)

        else:
            self._send_error('Endpoint não encontrado', 404)
    
    def do_PUT(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/pets/'):
            user_id = path.split('/')[-1]
            
            try:
                user_id = int(user_id)
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                data = json.loads(put_data.decode('utf-8'))
                
                nome = data.get('nome')
                email = data.get('email')
                telefone = data.get('telefone1')
                endereco = data.get('endereco')
                bairro = data.get('bairro')
                cidade = data.get('cidade')
                estado = data.get('estado')
                
                if not nome or not email:
                    self._send_error('Nome e email são obrigatórios', 400)
                    return
                
                success = self.db.update_pets(user_id, nome, email, telefone, endereco, bairro, cidade, estado)
                
                if success:
                    self._send_json({'message': 'Usuário atualizado com sucesso'})
                else:
                    self._send_error('Usuário não encontrado', 404)
                    
            except ValueError:
                self._send_error('ID inválido', 400)
            except json.JSONDecodeError:
                self._send_error('JSON inválido', 400)
            except Exception as e:
                self._send_error(f'Erro ao atualizar usuário: {str(e)}', 500)
        else:
            self._send_error('Endpoint não encontrado', 404)
    
    def do_DELETE(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/usuarios/'):
            user_id = path.split('/')[-1]
            
            try:
                user_id = int(user_id)
                success = self.db.delete_user(user_id)
                
                if success:
                    self._send_json({'message': 'Usuário deletado com sucesso'})
                else:
                    self._send_error('Usuário não encontrado', 404)
                    
            except ValueError:
                self._send_error('ID inválido', 400)
            except Exception as e:
                self._send_error(f'Erro ao deletar usuário: {str(e)}', 500)
        else:
            self._send_error('Endpoint não encontrado', 404)
    
    def log_message(self, format, *args):
        print(f"{self.address_string()} - [{self.log_date_time_string()}] {format % args}")


def run_server(host='localhost', port=8000):
    server_address = (host, port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f'Servidor rodando em http://{host}:{port}')
    print('Pressione Ctrl+C para parar')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor encerrado')
        httpd.shutdown()


if __name__ == '__main__':
    run_server()

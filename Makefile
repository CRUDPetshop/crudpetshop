.PHONY: help up down restart logs clean db-shell adminer install dev

help: ## Mostra esta ajuda
	@echo "Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Sobe os containers (PostgreSQL + Adminer)
	docker-compose up -d
	@echo ""
	@echo "✅ Containers iniciados!"
	@echo "📊 Adminer: http://localhost:8080"
	@echo "🐘 PostgreSQL: localhost:5432"

down: ## Para os containers
	docker-compose down

restart: ## Reinicia os containers
	docker-compose restart

logs: ## Mostra os logs dos containers
	docker-compose logs -f

clean: ## Remove containers, volumes e imagens
	docker-compose down -v
	@echo "🧹 Limpeza completa realizada!"

db-shell: ## Conecta ao shell do PostgreSQL
	docker exec -it projeto_postgres psql -U postgres -d projeto_db

adminer: ## Abre o Adminer no navegador
	@echo "Abrindo Adminer..."
	@xdg-open http://localhost:8080 2>/dev/null || open http://localhost:8080 2>/dev/null || echo "Acesse: http://localhost:8080"

install: ## Instala dependências Python
	pip install -r requirements.txt

dev: up ## Inicia ambiente de desenvolvimento
	@echo ""
	@echo "🚀 Ambiente de desenvolvimento pronto!"
	@echo ""
	@echo "Para iniciar o servidor Python:"
	@echo "  cd server && python3 server.py"
	@echo ""
	@echo "Servidor: http://localhost:8000"
	@echo "Adminer: http://localhost:8080"

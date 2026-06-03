# .PHONY tells Make these are commands, not actual files on your computer
.PHONY: dev down prod prod-down clean logs backend-shell frontend-shell

# --- LOCAL DEVELOPMENT ---

# Start the local development environment with live reloading
dev:
	docker compose up --build -d

# Stop the local development environment
down:
	docker compose down

# --- PRODUCTION ---

# Start the highly optimized, secure production stack in detached mode (-d)
prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Stop the production stack
prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# --- UTILITIES ---

# View live logs for all running containers
logs:
	docker compose logs -f

# Deep clean: Stop containers, remove named volumes, and clear dangling images
clean:
	docker compose down -v

# Drop into the backend container's terminal for debugging
shell-backend:
	docker exec -it pams_backend bash

# Drop into the frontend container's terminal
shell-frontend:
	docker exec -it pams_frontend sh
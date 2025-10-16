.PHONY: help setup build up down logs restart clean

help:
	@echo "GameControl - Available Commands"
	@echo ""
	@echo "  make setup       - Run initial setup (builds images, starts services)"
	@echo "  make build       - Build Docker images"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - View service logs (follow mode)"
	@echo "  make clean       - Remove all containers and volumes"
	@echo "  make ps          - Show running containers"
	@echo ""

setup:
	@echo "Setting up GameControl..."
	@cp .env.example .env || true
	@mkdir -p data logs
	docker-compose build --no-cache
	docker-compose up -d
	@echo "✓ GameControl is starting..."
	@echo "  Frontend: http://localhost:3000"
	@echo "  API Docs: http://localhost:8000/docs"

build:
	@echo "Building Docker images..."
	docker-compose build --no-cache

up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started"

down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

restart:
	@echo "Restarting services..."
	docker-compose restart
	@echo "✓ Services restarted"

logs:
	docker-compose logs -f

ps:
	docker-compose ps

clean:
	@echo "Removing all containers and volumes..."
	docker-compose down -v
	@echo "✓ Cleanup complete"

shell-backend:
	docker-compose exec backend /bin/bash

shell-frontend:
	docker-compose exec frontend /bin/sh
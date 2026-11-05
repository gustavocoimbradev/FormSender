.PHONY: up down urls test migrate status

up:
	@./scripts/free-ports.sh
	@docker compose up -d --remove-orphans
	@./scripts/urls.sh

down:
	@docker compose down

urls:
	@./scripts/urls.sh

test:
	@docker compose exec app ./vendor/bin/pest $(ARGS)

migrate:
	@docker compose exec app php artisan migrate --force $(ARGS)

status:
	@docker compose ps

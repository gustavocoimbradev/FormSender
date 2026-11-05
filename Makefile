.PHONY: up down urls test migrate seed status

up:
	@./scripts/free-ports.sh
	@docker compose up -d --wait --remove-orphans
	@$(MAKE) --no-print-directory seed
	@./scripts/urls.sh

down:
	@docker compose down

urls:
	@./scripts/urls.sh

test:
	@docker compose exec app ./vendor/bin/pest $(ARGS)

migrate:
	@docker compose exec app php artisan migrate --force $(ARGS)

seed:
	@docker compose exec -T app php artisan db:seed --force $(ARGS)

status:
	@docker compose ps

.PHONY: up down urls test

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

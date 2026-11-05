.PHONY: up start down urls test migrate seed status

# Foreground: logs stream in the terminal and Ctrl+C stops everything.
up:
	@./scripts/free-ports.sh
	@./scripts/after-up.sh & \
	trap 'kill $$! 2>/dev/null' EXIT; \
	docker compose up --remove-orphans; \
	code=$$?; \
	if [ $$code -eq 130 ]; then exit 0; fi; \
	exit $$code

# Same stack in the background (for scripts and CI-like use); stop it with `make down`.
start:
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

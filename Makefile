# `make dev` and `make prod` are the two ways to run it; `make up` is the old name of `make dev` and still works.
.PHONY: dev up start down urls logs test migrate seed reset status prod prod-setup prod-logs prod-down prod-backup

# Quiet by default. For the full logs: `make dev logs` (or `make dev LOGS=1`).
UP_FLAGS :=
ifneq ($(filter dev up,$(MAKECMDGOALS)),)
ifneq ($(or $(filter logs,$(MAKECMDGOALS)),$(LOGS)),)
UP_FLAGS := --logs
endif
endif

# Development, in the foreground: Ctrl+C stops everything.
dev:
	@./scripts/up.sh $(UP_FLAGS)

up: dev

# Same stack in the background (for scripts and automation); stop it with `make down`.
start:
	@./scripts/free-ports.sh
	@docker compose up -d --wait --remove-orphans
	@$(MAKE) --no-print-directory seed
	@./scripts/urls.sh

down:
	@docker compose down

urls:
	@./scripts/urls.sh

# Follows the logs of a running stack. (`make dev logs` already shows them.)
logs:
	@$(if $(filter up,$(MAKECMDGOALS)),:,docker compose logs -f --tail=100)

test:
	@docker compose exec app ./vendor/bin/pest $(ARGS)

migrate:
	@docker compose exec app php artisan migrate --force $(ARGS)

seed:
	@docker compose exec -T app php artisan db:seed --force $(ARGS)

# Back to a fresh install (asks first). `make reset YES=1` skips the question.
reset:
	@YES=$(YES) ./scripts/reset.sh

status:
	@docker compose ps

# ---- Production: `make prod` builds and starts everything in the background and keeps it running (reads .env.prod).
PROD := docker compose --profile tunnel --env-file .env.prod -f docker-compose.prod.yml

prod:
	@./scripts/prod.sh

# Asks for the address again (a domain, or an IP address), then starts it.
prod-setup:
	@./scripts/prod.sh --setup

prod-logs:
	@$(PROD) logs -f --tail=100

# Stops it; the data (database, files) stays. `make prod` starts it again.
prod-down:
	@$(PROD) down

# Saves the database to backups/. Copy that folder somewhere safe.
prod-backup:
	@mkdir -p backups
	@$(PROD) exec -T postgres pg_dump -U formsender formsender | gzip > backups/formsender-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "Saved in backups/. The files visitors attached are in the Docker volume formsender-prod_storage."

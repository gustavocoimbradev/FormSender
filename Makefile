.PHONY: up start down urls logs test migrate seed reset status

# Quiet by default. For the full logs: `make up logs` (or `make up LOGS=1`).
UP_FLAGS :=
ifneq ($(filter up,$(MAKECMDGOALS)),)
ifneq ($(or $(filter logs,$(MAKECMDGOALS)),$(LOGS)),)
UP_FLAGS := --logs
endif
endif

# Foreground: Ctrl+C stops everything.
up:
	@./scripts/up.sh $(UP_FLAGS)

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

# Follows the logs of a running stack. (`make up logs` already shows them.)
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

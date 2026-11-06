# Every command has two versions: `:dev` (this machine, with sample data and a fake inbox) and `:prod` (the server).
#   make up:dev      make up:prod      start it (dev stays in the foreground, prod runs for good)
#   make down:dev    make down:prod    stop it (the data stays)
#   make logs:dev    make logs:prod    follow the logs
#   make status:dev  make status:prod  what is running
#   make urls:dev    make urls:prod    where to open it
#   make migrate:dev make migrate:prod run the database migrations
#   make reset:dev   make reset:prod   back to a fresh install (asks first; prod saves a backup before)
#   make backup:dev  make backup:prod  save the database to backups/
#   make start:dev   make start:prod   start it in the background, for scripts (prod always is)
#   make seed:dev    make setup:prod   sample data / ask for the address again
#   make test:dev                      run the test suite
.PHONY: up\:dev up\:prod start\:dev start\:prod down\:dev down\:prod urls\:dev urls\:prod logs\:dev logs\:prod \
	status\:dev status\:prod seed\:dev seed\:prod migrate\:dev migrate\:prod reset\:dev reset\:prod \
	backup\:dev backup\:prod setup\:prod test\:dev dev prod prod-setup prod-logs prod-down prod-backup \
	up start down urls logs seed migrate reset status backup test

PROD := docker compose --profile tunnel --env-file .env.prod -f docker-compose.prod.yml

# Quiet by default. For the full logs: `make up:dev logs` (or `make up:dev LOGS=1`).
UP_FLAGS :=
ifneq ($(filter up:dev,$(MAKECMDGOALS)),)
ifneq ($(or $(filter logs,$(MAKECMDGOALS)),$(LOGS)),)
UP_FLAGS := --logs
endif
endif

# ---------------------------------------------------------------- start

# Development, in the foreground: Ctrl+C stops everything.
up\:dev:
	@./scripts/up.sh $(UP_FLAGS)

# Production: builds and starts everything in the background and keeps it running (reads .env.prod).
up\:prod:
	@./scripts/prod.sh

# The same stack in the background (for scripts and automation); stop it with `make down:dev`.
start\:dev:
	@./scripts/free-ports.sh
	@docker compose up -d --wait --remove-orphans
	@$(MAKE) --no-print-directory seed:dev
	@./scripts/urls.sh

start\:prod: up\:prod

# Asks for the address again (a domain, or an IP address), then starts it.
setup\:prod:
	@./scripts/prod.sh --setup

# ---------------------------------------------------------------- stop, look

# Stops it; the data (database, files) stays.
down\:dev:
	@docker compose down

down\:prod:
	@$(PROD) down

status\:dev:
	@docker compose ps

status\:prod:
	@$(PROD) ps

urls\:dev:
	@./scripts/urls.sh

urls\:prod:
	@set -a; . ./.env.prod; set +a; \
	echo "  Dashboard $$PUBLIC_URL"; \
	echo "  API       $$PUBLIC_URL/api"; \
	echo "  API docs  $$PUBLIC_URL/docs  (closed unless API_DOCS=true)"

# Follows the logs of a running stack. (`make up:dev logs` already shows them.)
logs\:dev:
	@$(if $(filter up:dev,$(MAKECMDGOALS)),:,docker compose logs -f --tail=100)

logs\:prod:
	@$(PROD) logs -f --tail=100

# ---------------------------------------------------------------- database

migrate\:dev:
	@docker compose exec app php artisan migrate --force $(ARGS)

migrate\:prod:
	@$(PROD) exec web php artisan migrate --force $(ARGS)

seed\:dev:
	@docker compose exec -T app php artisan db:seed --force $(ARGS)

seed\:prod:
	@echo "Nothing to seed in production: the setup screen creates the administrator and the email settings."

# Back to a fresh install (asks first). `make reset:dev YES=1` skips the question.
reset\:dev:
	@YES=$(YES) ./scripts/reset.sh

# Production: saves a backup, then erases everything (asks first). `make reset:prod YES=1` skips the question.
reset\:prod:
	@YES=$(YES) ./scripts/reset-prod.sh

# Saves the database to backups/. Copy that folder somewhere safe.
backup\:dev:
	@mkdir -p backups
	@docker compose exec -T postgres pg_dump -U formsender formsender | gzip > backups/formsender-dev-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "Saved in backups/."

backup\:prod:
	@mkdir -p backups
	@$(PROD) exec -T postgres pg_dump -U formsender formsender | gzip > backups/formsender-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "Saved in backups/. The files visitors attached are in the Docker volume formsender-prod_storage."

# ---------------------------------------------------------------- tests

test\:dev:
	@docker compose exec app ./vendor/bin/pest $(ARGS)

# ---------------------------------------------------------------- old names: they say what to use now

RENAMED_dev := make up:dev
RENAMED_prod := make up:prod
RENAMED_prod-setup := make setup:prod
RENAMED_prod-logs := make logs:prod
RENAMED_prod-down := make down:prod
RENAMED_prod-backup := make backup:prod

dev prod prod-setup prod-logs prod-down prod-backup:
	@echo "This command was renamed: $(RENAMED_$@)"; exit 1

# Without :dev or :prod it is not clear what is meant (`make up:dev logs` still works: there `logs` is just a flag).
up start down urls logs seed migrate reset status backup:
	@$(if $(filter up:dev,$(MAKECMDGOALS)),:,echo "Say which one: make $@:dev or make $@:prod"; exit 1)

test:
	@echo "Use make test:dev"; exit 1

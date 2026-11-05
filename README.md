# FormSender

[![CI](https://github.com/gustavocoimbradev/FormSender/actions/workflows/ci.yml/badge.svg)](https://github.com/gustavocoimbradev/FormSender/actions/workflows/ci.yml)

Form backend as a service. Create a form, drop its endpoint on any website, and every submission is saved and delivered by email to the destinations you choose.

> **Status:** the API (`/backend`) is complete and tested. The dashboard (`/frontend`, Next.js) is scaffolded and not started yet.

## How it works

1. An admin logs in and creates a **form**: accepted fields, destination emails, allowed websites.
2. The form gets its own secret **token**.
3. A website sends `POST /api/forms/{id}/submit` with that token.
4. The API validates the data, **saves it**, and answers `202` immediately.
5. A **queue worker** delivers the email through the configured SMTP. Every destination keeps its own delivery status for auditing.

## Highlights

- **Instant responses.** Emails never block a request: Redis queue, retries with backoff, per-destination status (`pending`, `sent`, `partial`, `failed`).
- **Audit trail.** Submissions are stored with a snapshot of the form and are kept even if the form is deleted.
- **Per-form token and domain allow-list.** Constant-time token check, dynamic CORS per form, `*.example.com` wildcards.
- **Roles and ownership.** `admin` and `user`; only the initial admin (the *owner*) can change or remove other admins.
- **SMTP configured at runtime** through the API, stored encrypted. Mailpit is the local default, so development never sends a real email.
- **Auth.** Sanctum bearer tokens with expiry, one-time `/setup` for the first admin, password reset by a hashed emailed code (cool-down, throttling, attempt lock), login throttling without account enumeration.
- **Hardened by default.** Security headers, restricted CORS, encrypted queue payloads for secrets.
- **Self-documenting API.** OpenAPI docs generated from the code, written in plain language, and enforced by tests.

## Stack

| Layer | Choice |
|---|---|
| API | Laravel 13, PHP 8.4, strict types everywhere |
| Data | PostgreSQL 16, Redis 7 (queue and cache) |
| Auth | Laravel Sanctum |
| Tests | Pest, TDD |
| Docs | Scramble (OpenAPI) |
| Infra | Docker Compose, Mailpit, GitHub Actions |
| Front-end | Next.js 14, TypeScript, Tailwind (scaffold) |

## Engineering notes

- **The Laravel way, without over-engineering.** Form Requests, API Resources, policies, route model binding. Controllers stay thin; an Action class exists only where a use case earns it (multiple steps, transaction, side effects). No repositories or service layers "just in case".
- **Test-driven.** About 250 Pest tests, written before the code. CI runs them on every push against **SQLite and a real PostgreSQL 16**.
- **Conventional Commits** and small, focused commits.

## Running it

Requires Docker.

```bash
make up      # checks Docker, starts everything, prints the panel URL and a QR code; Ctrl+C stops it
make up logs # same, streaming every log
make urls    # lists every URL (panel, API docs, Mailpit)
```

Then create the first admin once:

```bash
curl -X POST http://localhost:8000/api/setup \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@company.com", "password": "a-long-password"}'
```

| URL | What |
|---|---|
| `http://localhost:8000/` | API documentation |
| `http://localhost:8025` | Mailpit inbox (every email sent locally lands here) |

Ports are chosen automatically (`scripts/free-ports.sh`) so the stack never collides with anything already running. The exact links are printed by `make up`.

| Command | |
|---|---|
| `make start` | Same as `up`, but in the background (`make down` stops it) |
| `make test` | Run the test suite |
| `make migrate` / `make seed` | Run migrations / seeders |
| `make status` / `make down` | Container status / stop |

## API at a glance

| Area | Endpoints |
|---|---|
| Setup and auth | `POST /setup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Password reset | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Forms | CRUD on `/forms`, `POST /forms/{id}/token` (regenerate) |
| Submitting | `POST /forms/{id}/submit` (form token, no login) |
| Submissions | `GET /forms/{id}/submissions`, `GET /forms/{id}/submissions/{id}` |
| Users (admin) | CRUD on `/users` |
| Settings (admin) | `GET` and `PUT /settings` (SMTP) |

## Structure

```
backend/    Laravel API (app/Actions, Http, Jobs, Policies, tests)
frontend/   Next.js dashboard (scaffold)
docker/     PHP image and entrypoint
scripts/    free port detection, URLs
.github/    CI workflow
```

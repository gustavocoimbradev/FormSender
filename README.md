<h1 align="center">➤ Form Sender</h1>

<p align="center">
  <b>The email API for your website forms.</b><br>
  Send email from any website form without writing a back end. Self-hosted, open source and up in one command. Point a form at a URL and every message lands in your team's inbox, in a template you design.
</p>

<p align="center">
  <a href="https://github.com/gustavocoimbradev/form-sender/actions/workflows/ci.yml"><img src="https://github.com/gustavocoimbradev/form-sender/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/Laravel-13-ff2d20?logo=laravel&logoColor=white" alt="Laravel 13">
  <img src="https://img.shields.io/badge/PHP-8.4-777bb4?logo=php&logoColor=white" alt="PHP 8.4">
  <img src="https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs" alt="Next.js 14">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-8b6bff" alt="MIT license"></a>
</p>

<p align="center"><img src="docs/screenshots/email.png" alt="A form's Email tab, with a live preview" width="900"></p>

## What it does

Your site gets a form, and every message lands in your team's inbox. No back end to write: Form Sender validates it, stores it, answers right away and sends the email in the background.

1. **Create a form** in the dashboard: fields, destinations, design, texts, email.
2. **Add one line to your site:**

```html
<script src="https://YOUR-DOMAIN/embed.js" data-form="FORM_CODE" async></script>
```

3. **Done.** The form draws itself with the fields you set, and edits made in the dashboard reach every site at once. Prefer an `<iframe>`, or a link? Every form also has its own public page.

Straight from code it is one request too:

```bash
curl -X POST https://YOUR-DOMAIN/api/forms/FORM_CODE/submit -F name=Maria -F email=maria@company.com
```

## Run it

Needs Docker.

```bash
make up       # development: everything up with sample data, a fake inbox (Mailpit) and free ports picked for you
make prod     # production: asks for your address the first time, then builds and runs it for good
```

`make prod` asks **what address people will use**: a domain (`forms.mycompany.com`, https with the certificate handled for you) or an **IP address** (plain http). It creates `.env.prod`, builds, starts everything in the background and keeps it running, even after the server restarts. Open the address and create the first administrator, then set your SMTP in the dashboard. To update, `git pull` and `make prod` again.

| Command | |
|---|---|
| `make prod` | Set up (first time), build and start or update |
| `make prod-setup` | Change the address |
| `make prod-logs` / `make prod-down` | Watch it / stop it (data stays) |
| `make prod-backup` | Save the database to `backups/` |
| `make down` / `make test` / `make reset` | Development: stop / run the tests / start over |

Keep `APP_KEY` safe: the saved SMTP password is encrypted with it. Without a keyboard, `ADDRESS=forms.mycompany.com make prod`. Over an IP the site is plain http, so a form on an https website needs a domain.

## What is in it

- **Three ways in:** a script, an iframe or a public page (with our credit), all drawn from the same form.
- **Your design and your words:** a CSS editor with a live preview (color swatches, snippets, formatting) and every text of the form editable, in any language.
- **An email per form:** code editor with live preview; replying goes to the visitor. File fields arrive as attachments.
- **Reliable:** emails go through a queue with retries, a status per destination, a retry button and an alert to the admins when one fails for good.
- **Spam stays in view:** a hidden trap field, allowed sites per form and rate limits. Caught messages are kept as Spam, never emailed.
- **Teams:** admins and users, SMTP set in the dashboard (stored encrypted), optional retention of old messages.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/integration.png" alt="Integration tab: one script line to paste"></td>
    <td width="50%"><img src="docs/screenshots/messages.png" alt="Received messages with delivery status"></td>
  </tr>
</table>

## Under the hood

**Laravel 13** (PHP 8.4), **PostgreSQL 16**, **Redis**, **Next.js 14** with TypeScript and Tailwind, all in Docker Compose. The API is documented in plain language at its root in development (OpenAPI, generated from the code and checked by the tests). CI runs the Pest suite on SQLite and PostgreSQL, plus Pint and Larastan.

```
backend/     Laravel API
frontend/    Next.js dashboard
docker/      PHP image, production images and proxy
scripts/     make up and make prod
```

## License

[MIT](LICENSE): free to use, copy, modify and distribute, including commercially, as long as the copyright notice (credit to **Gustavo Coimbra**) is kept.

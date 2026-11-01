# Deployment and verification

> This v0.2.1 is an unaudited preview. Test in an isolated environment first.

## Local development

1. Install Node.js 22.16+, npm and PostgreSQL 17.
2. `cp .env.example .env`.
3. Edit `.env`: set a PostgreSQL database you own, `BETTER_AUTH_SECRET` (32+ random characters), `BETTER_AUTH_URL` and `APP_URL`.
4. Run `npm ci`, `npm run db:migrate`.
5. Create an administrator from a **trusted terminal**. Example:

```bash
read -r -p "Administrator email: " ADMIN_EMAIL
read -r -s -p "Administrator password: " ADMIN_PASSWORD; echo
export ADMIN_EMAIL ADMIN_PASSWORD
npm run admin:create
unset ADMIN_PASSWORD ADMIN_EMAIL
```

6. Optional *fictional* seed: `ALLOW_DEMO_SEED=true npm run db:seed` (run only once).
7. Run `npm run dev`, open `http://localhost:3000`, and sign in at `/login`.

There is no public signup. Creating an account using the script is a deliberate one-time system administration task.

## Docker Compose

1. Install Docker and the Compose plugin. Copy `.env.example` to `.env`.
2. Set:

```text
POSTGRES_PASSWORD=<a-long-random-URI-safe-password>
BETTER_AUTH_SECRET=<at-least-32-random-characters>
APP_URL=http://localhost:3000
APP_TIME_ZONE=Asia/Shanghai
```

`POSTGRES_PASSWORD` must be URL-safe for the sample Compose connection string (e.g. `openssl rand -hex 24`). Use a different `BETTER_AUTH_SECRET` value. The `.env` file is Git-ignored.

3. Build and start the database:

```bash
docker compose --profile tools build
docker compose up -d db
docker compose --profile tools run --rm maintenance npm run db:migrate
```

4. Create the administrator without storing the password in the Compose file:

```bash
read -r -p "Administrator email: " ADMIN_EMAIL
read -r -s -p "Administrator password: " ADMIN_PASSWORD; echo
export ADMIN_EMAIL ADMIN_PASSWORD
docker compose --profile tools run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD maintenance npm run admin:create
unset ADMIN_EMAIL ADMIN_PASSWORD
```

5. Optional fictional demonstration venues:

```bash
docker compose --profile tools run --rm -e ALLOW_DEMO_SEED=true maintenance npm run db:seed
```

6. Start the web app:

```bash
docker compose up -d app
```

The sample Compose binds port 3000 to `127.0.0.1` only. Use an HTTPS reverse proxy (Caddy or Nginx) for public access and update `APP_URL` to the canonical HTTPS origin. **Do not change the port binding to `0.0.0.0` without explicit firewall, reverse proxy, throttling and security review.**

## Deployment checklist

- [ ] Install dependencies, run `npm run typecheck`, `npm test`, and `npm run build` successfully. To run database tests, set `TEST_DATABASE_URL` to a disposable PostgreSQL database whose name ends in `_test`.
- [ ] Run migrations on a *fresh* database, then create the first admin.
- [ ] Confirm `/api/auth/sign-up/email` rejects public self-signup.
- [ ] Confirm all `/api/admin/*` routes return 401 when unauthenticated.
- [ ] Confirm the admin can create a venue and review an application.
- [ ] Confirm overlapping *approved* bookings cannot both be approved, including concurrent approvals.
- [ ] Confirm the public tracking link does not expose name or email.
- [ ] Put the application behind HTTPS and rate-limit `/api/reservations`, `/api/track`, `/api/auth/*`.
- [ ] Replace defaults; use a dedicated database user and database backups.
- [ ] Establish privacy notice, retention/deletion policy, moderation and incident response.
- [ ] Check against your chosen Better Auth and Drizzle library versions before upgrading.

## Caveats

- Email delivery, applicant identity verification, attachments and notifications are not in this preview.
- Booking inserts atomically enforce 5 submissions per email per 24 hours and BOOKING_MAX_PER_MINUTE accepted submissions across the deployment (default 60). This is not IP-based or verified-user throttling; configure edge rate limits to handle request floods.
- Better Auth schema should be validated against the precise installed version when dependencies are installed.
- Database migrations here are idempotent for the initial creation, not a general migration engine. Use versioned migrations for later releases.
- The project targets one independent organization per deployment. Multi-tenant isolation is not implemented.

## New in v0.2.1

Run offline checks (no npm dependencies required):

```bash
npm run test:static
```

The offline suite verifies origin checks, bounded JSON body parsing, schema guardrails and time zone calculations. It does not replace the dependency-backed `npm run typecheck`, `npm test`, `npm run build`, or PostgreSQL and browser tests. The repair includes package-lock.json and uses npm ci in CI/Docker. Review the lockfile and run npm audit again before deployment.

If using a reverse proxy, **APP_URL must match the exact external browser origin**; this is required for CSRF-related origin checks. Local Docker's default is `http://localhost:3000`.

## GitHub staging (private by default)

With GitHub CLI installed and authenticated (`gh auth login`), run `bash scripts/create-private-github-repo.sh` from this source directory. It creates `gbhysss/open-venue-booking` as a **Private** repository only after explicit confirmation. No access or mutation to `gbhysss/yycg` is involved.

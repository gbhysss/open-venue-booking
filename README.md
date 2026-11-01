# OpenVenue

**A friendly, self-hosted venue booking and approval system for community organizations.**

[中文说明](README.zh-CN.md) · [Installation](docs/installation.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md)

> **Status: v0.2.2 container preview.** Typecheck, production build, native PostgreSQL 17 integration and local HTTP regression tests have passed. See [QUALITY_STATUS.md](QUALITY_STATUS.md) for exact evidence and remaining limits. Linux Docker Compose deployment and database recovery passed in GitHub CI for application commit 728b33d. Public hosting is a separate deployment step.

## Highlights

- Public venue directory and mobile-friendly booking form
- Real-time view of *approved* occupied time slots (without exposing applicant details)
- Anonymous booking with a private, high-entropy tracking token (the URL is shown only once)
- Administrator-only dashboard to create/disable venues and approve/reject requests
- PostgreSQL exclusion constraint prevents overlapping **approved** bookings even during concurrent approvals
- Better Auth sessions and password hashing; public account sign-up disabled
- Docker Compose and SQL migration, optional fictional demo dataset
- Open to community contributions under the MIT license

## Screens

- `/` — browse venues
- `/venues/[id]` — request a reservation
- `/track#token=...` — check an individual request (the secret stays in a URL fragment, not a server access-log query string)
- `/login` — administrator sign-in
- `/admin` — manage venues and review bookings

## Guided local Docker setup (macOS or Linux)

For a fresh checkout with Docker Desktop installed, run `bash scripts/setup-docker.sh`. The script creates random local secrets, prompts for administrator credentials and optionally installs fictional demo venues. It refuses to overwrite an existing `.env`. An Internet connection is required to download dependencies and container images.

## GitHub publication plan

**Do not publish this preview publicly yet.** On a Mac with `git` and GitHub CLI (`gh`) installed, use `gh auth login` and then run `bash scripts/create-private-github-repo.sh`. It uses the GitHub account `gbhysss`, runs offline checks, asks twice before uploading, and **creates only a new PRIVATE** `gbhysss/open-venue-booking` repository. It never writes to `gbhysss/yycg`. Manually review rights/attribution, review the committed `package-lock.json`, and complete your deployment checks before changing visibility.

## Quick start (local development)

Requirements: Node 22.16+, PostgreSQL 17+, npm.

```bash
cp .env.example .env
# Set DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL in .env
npm ci
npm run db:migrate
npm run admin:create  # export ADMIN_EMAIL and ADMIN_PASSWORD before running
npm run dev
```

The sign-up endpoint is disabled in the running web app. `admin:create` creates the first admin through a **separate command-line process**; protect that terminal, and do not store a password in code or git.

See [docs/installation.md](docs/installation.md) for Docker commands, administrator setup, production steps and verification checklist.

## Main technologies

Next.js 16 · React 19 · TypeScript · PostgreSQL 17 · Drizzle · Better Auth · Zod · plain CSS.

The core data model and business logic were written for this independent project. **No school datasets, identities, credentials, or original repository Git history are included.**

## Safety & privacy

- Unauthenticated endpoints cannot access administrator lists or configuration.
- The optional tracking token is a bearer secret: whoever holds the link can see the reservation's status. New links use URL fragments and send the token in a POST body rather than query strings. It does **not** return names or contact details.
- Use HTTPS in production, configure APP_URL to the exact public origin (required for admin mutation Origin checks), and add edge rate limiting to public endpoints.
- The demo seed contains fictional organizations and venues only.
- Review retention periods, email consent, abuse protection and backup policies before handling personal data.

This is a starter, not a formally audited production solution. Report security concerns privately using [SECURITY.md](SECURITY.md).

## Roadmap

- [x] Booking requests and private status tracking
- [x] Administrator workflow
- [x] Database-enforced approval conflicts
- [x] Basic Docker and developer documentation
- [x] Offline security checks and time-zone tests (14 passing)
- [x] Bounded API JSON bodies and same-origin guard for admin writes
- [x] Local native PostgreSQL and standalone HTTP regression tests
- [ ] GitHub CI run and deployed public demo
- [ ] Audit logging UI and more granular permissions
- [ ] Emails and configurable notifications
- [ ] Localization and accessibility review
- [ ] QR check-in and import/export tools

## Contribute

Help with translations, accessibility, tests, docs or deployment guides. Open an issue for discussions. See [CONTRIBUTING.md](CONTRIBUTING.md).

MIT License © 2026 OpenVenue contributors.

## v0.2.1

修复内容与升级步骤：[docs/upgrading-0.2.1.md](docs/upgrading-0.2.1.md)。验证范围：[QUALITY_STATUS.md](QUALITY_STATUS.md)。

## v0.2.2 容器验证

容器健康检查、数据库恢复验收与本机演示步骤见 [docs/container-verification.md](docs/container-verification.md)。GitHub Actions 的 Docker 任务提供逐次提交的验收结果。

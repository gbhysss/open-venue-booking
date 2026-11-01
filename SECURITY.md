# Security policy

**This repository is a v0.2.1 preview, not an audited production release.**

## Reporting a vulnerability

Use GitHub **Private vulnerability reporting** (Security → Advisories → Report a vulnerability) when enabled for the repository. Do not publish working exploits or secrets in public issues. If the private reporting function is unavailable, first request a private channel from the maintainers without sharing exploit details.

## Security expectations

- Do not deploy the preview on a public hostname before testing authorization, data retention and rate limits.
- Rotate any secret accidentally committed to Git; deleting a file from the latest commit is not sufficient.
- Keep dependency versions updated and review automated security advisories.
- Use HTTPS and a reverse proxy. Do not expose PostgreSQL to the Internet.
- Use backups and limit administrator access.
- Never seed live personal data into a public demo.

## Included controls

- Authenticated admin APIs, same-origin checks on privileged writes, bounded JSON bodies, Better Auth sessions, private tracking tokens passed in a POST body, input validation and a database-level constraint on overlapping approved reservations.
- No self-service signup in the server's runtime authentication configuration.

## Not yet included

- Production-proven request throttling and bot mitigation, audit log dashboard, email ownership verification, comprehensive security integration tests, organization-level data retention controls and an external penetration test.

## Additional v0.2.1 considerations

- Set `APP_URL` to the exact browser origin. A mismatch (e.g. HTTPS vs HTTP, subdomain or port) will deliberately block administrator POST/PATCH calls.
- Newly generated private tracking links use fragment identifiers (`#token=...`). Fragments are not sent to HTTP servers; however anyone who gets the full link still gains access to that booking status.
- The included offline tests provide limited regression coverage, **not** a security audit or an end-to-end test.
- The reviewed package-lock.json is included. Use npm ci in development, CI and Docker; rerun the dependency audit before release.

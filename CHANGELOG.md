# Changelog

## 0.2.1 — regression fixes (2026-11-01)

- Preserve omitted venue fields on PATCH; reject empty/unknown patches.
- Paginate and filter reservations in the database; use full-dataset statistics.
- Revalidate future time, venue availability and capacity during atomic approval.
- Upgrade Next.js to 16.4.3 and React/React DOM to 19.2.9; include lockfile and npm ci.
- Enforce atomic per-email and shared per-minute booking quotas.
- Exclude all real .env variants from Docker context and preserve runtime write permissions.
- Add native PostgreSQL, HTTP and UI regression coverage; see QUALITY_STATUS.md.


## 0.2.0 — independent safety preview (2026-11-01)

- Add privileged request same-origin checks and bounded JSON body parsing.
- Move private tracking secrets to URL fragments and POST request bodies.
- Normalize booking minimum dates to configured venue time zone.
- Add 14 passing offline tests for security rules and time-zone behavior.
- Add explicit, confirmation-gated helper for private GitHub staging.
- Full runtime typecheck and integration tests remain pending.


## [0.1.0] — 2026-11-01

- Initial independent source-code preview
- Venue directory and responsive public booking form
- Private tracking token and status page
- Administrator authentication and venue/approval workflows
- PostgreSQL concurrency-safe exclusion constraint for approved bookings
- Development scripts, Docker configuration and starter documentation

**Not yet a CI-verified production release.**

# Contributing to OpenVenue

Bug reports, independent installation feedback, documentation fixes, accessibility work and translations are welcome. English and Chinese issue descriptions are both accepted.

## Report a problem

Use [the issue forms](https://github.com/gbhysss/open-venue-booking/issues/new/choose). Include a version/commit, environment, smallest reproduction and expected/actual behavior. Use fictional data and redact logs. Security reports belong in the private channel described in [SECURITY.md](SECURITY.md).

## Make a change

1. Discuss substantial behavior changes in an issue before implementation.
2. Fork the repository, create a focused branch and use `npm ci` with a maintained Node 22 version (22.16+).
3. Configure your own local database and secrets from `.env.example`; never commit the resulting `.env`.
4. Run `npm run test:static`, `npm run typecheck`, `npm test` and `npm run build`.
5. For database changes, use an explicit disposable `TEST_DATABASE_URL` ending in `_test`. Tests without that setting skip database coverage; report that honestly.
6. For API changes, follow the fictional local environment in [.github/workflows/ci.yml](.github/workflows/ci.yml) and run `npm run test:api`. The isolated Docker CI covers the deployment path.
7. Open a PR describing the problem, behavior, validation and deployment impact. Include screenshots for UI changes and regression coverage for defects.

## Code and data expectations

Validate external inputs, parameterize database queries, enforce server-side authorization, and retain transaction/constraint protection for overlapping approvals. New features should work without organization-specific accounts or datasets. Do not submit credentials, applicant information, private tracking links or proprietary assets.

Contributions are provided under the repository's MIT license. Dependencies and borrowed material retain their own licenses; document attribution and compatibility when introducing them. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## 中文提示

欢迎中文反馈。请说明版本、环境、复现步骤与实际结果，日志和截图必须脱敏。较大的功能变更先开 Issue 讨论；漏洞不要提交到公开 Issue。PR 请列出真实执行的检查和部署影响。

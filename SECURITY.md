# Security policy

OpenVenue v0.2.x is preview software. The latest published preview receives best-effort fixes; there is no guaranteed response time or support SLA.

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/gbhysss/open-venue-booking/security/advisories/new) when it is available. If the private form is unavailable, open an issue containing only a request for a private reporting channel. Do not include exploit details, credentials, booking records or tracking links in that public request.

Include the affected version, deployment type, impact, a minimal fictional-data reproduction and suggested mitigation in the private report. Do not test against someone else's deployment without authorization.

## Included safeguards

Server-side administrator authorization, signed Better Auth sessions, disabled public signup, same-origin checks for privileged writes, bounded application JSON bodies, private status tokens, atomic booking quotas and PostgreSQL constraints for approved-slot conflicts. Docker runs the web app without root and includes schema-aware readiness checks.

## Deployment responsibilities

Use unique secrets, HTTPS, a correctly configured external APP_URL, proxy-level request limits/timeouts, backups, and organization-specific retention/deletion and privacy rules. The default Compose file does not expose PostgreSQL and binds the application to loopback. Never seed real data into a public demo.

Anyone holding a full private tracking link can read the status and decision note; keep sensitive content out of notes. Applicant email ownership is not verified. Accepted-submission quotas do not replace protection against request floods. Tests and dependency scans do not constitute an independent penetration test or a guarantee against unknown vulnerabilities.

If a credential leaks, rotate it and assess the entire history and deployment; deleting the latest file alone is insufficient.

## 中文说明

漏洞优先通过 GitHub 私密安全报告提交。入口不可用时，只在公开 Issue 请求建立私密渠道，不要公开漏洞复现、密钥、真实预约记录或私密查询链接。本项目为预览版，响应与修复为尽力维护，不承诺生产 SLA。

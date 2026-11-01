# Contributing to OpenVenue

Thank you for helping build a useful resource for schools, community centers and nonprofits.

## First contribution

1. Search existing issues before opening a duplicate.
2. For significant changes, discuss the proposal in an issue first.
3. Create a branch from `main` and keep pull requests focused.
4. Run `npm run typecheck`, `npm test`, and `npm run build` locally before sending a PR.
5. Include a brief description, test steps and screenshots for user interface changes.

## Coding principles

- Every API route must implement **server-side authorization** when it reads or mutates private data.
- Validate external input and use parameterized SQL or Drizzle query methods.
- New features must not require any school-specific accounts, branding or infrastructure.
- Never add real personal information, credentials, production secrets or private documents.
- Supply tests for bug fixes and security-sensitive code.

## Community standards

Be respectful, give credit and focus on constructive feedback. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

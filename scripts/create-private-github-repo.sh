#!/usr/bin/env bash
# Intentionally creates a PRIVATE GitHub repository. Never changes yyсg or existing Git remotes.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO='gbhysss/open-venue-booking'
if [[ ! -f package.json ]] || ! grep -q '"name": "open-venue-booking"' package.json; then
  echo 'Refusing: this is not an OpenVenue source directory.' >&2; exit 1
fi
if [[ -d .git ]]; then
  echo 'This directory already has Git history. Not changing a remote or pushing anything.' >&2; exit 1
fi
for tool in git gh node npm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing $tool. Install it before using this helper." >&2; exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  echo 'Log in first using: gh auth login' >&2; exit 1
fi
user="$(gh api user --jq .login)"
if [[ "$user" != 'gbhysss' ]]; then
  echo "Authenticated as $user, expected gbhysss. Refusing to publish to the wrong account." >&2; exit 1
fi
if [[ -e .env ]] && ! grep -Eq '^\.env' .gitignore; then
  echo 'A local .env exists and is not ignored. Refusing to continue.' >&2; exit 1
fi
printf 'Running offline source security tests...\n'
npm run test:static
printf '\nThis helper only creates %s as PRIVATE.\n' "$REPO"
printf 'Review source, licenses and all files before making it public.\n'
printf 'Type exactly PRIVATE to start local Git and upload: '
read -r answer
if [[ "$answer" != 'PRIVATE' ]]; then echo 'Cancelled.'; exit 1; fi

git init -b main
git add .
printf '\nThe files to be pushed are:\n'
git diff --cached --name-only
if git diff --cached --name-only | grep -E '(^\.env$|(^|/)node_modules/|(^|/)\.next/|\.pem$|\.key$)' ; then
  echo 'Potentially sensitive file staged. Refusing to upload.' >&2; exit 1
fi
printf '\nType exactly PUSH to confirm the private GitHub upload: '
read -r answer
if [[ "$answer" != 'PUSH' ]]; then echo 'Cancelled. Local Git was initialized; no remote upload occurred.'; exit 1; fi

git commit -m 'chore: initial independent OpenVenue preview'
gh repo create "$REPO" --private --source=. --remote=origin --push
printf '\nUploaded to a PRIVATE repository: https://github.com/%s\n' "$REPO"
printf 'Do not switch to Public until tests, licensing and manual security review are complete.\n'

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v docker >/dev/null; then
  echo 'Docker Desktop / Docker Compose is required. Install it before running this script.' >&2
  exit 1
fi
if ! docker compose version >/dev/null; then
  echo 'Docker Compose is unavailable.' >&2
  exit 1
fi
if ! command -v openssl >/dev/null; then
  echo 'OpenSSL is required to generate local secrets.' >&2
  exit 1
fi
if [[ -e .env ]]; then
  echo '.env already exists. Not overwriting your local configuration.' >&2
  echo 'Follow docs/installation.md to continue setup.' >&2
  exit 1
fi
DB_PASSWORD="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -hex 32)"
cat > .env <<EOF
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://openvenue:${DB_PASSWORD}@localhost:5432/openvenue
BETTER_AUTH_SECRET=${AUTH_SECRET}
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
APP_NAME=OpenVenue
APP_TIME_ZONE=Asia/Shanghai
BOOKING_MAX_PER_MINUTE=60
ALLOW_DEMO_SEED=false
EOF
chmod 600 .env
echo 'Generated unique credentials in .env (Git-ignored).'
echo 'Building Docker images and initializing the local database...'
docker compose --profile tools build
docker compose up -d --wait --wait-timeout 90 db
docker compose --profile tools run --rm maintenance npm run db:migrate
printf 'Administrator email: '
read -r ADMIN_EMAIL
while true; do
  printf 'Administrator password (at least 12 characters, hidden): '
  read -rs ADMIN_PASSWORD
  printf '\n'
  if [[ ${#ADMIN_PASSWORD} -ge 12 ]]; then break; fi
  echo 'Please use 12 or more characters.'
done
export ADMIN_EMAIL ADMIN_PASSWORD
docker compose --profile tools run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD maintenance npm run admin:create
unset ADMIN_PASSWORD ADMIN_EMAIL
printf 'Add three fictional demo venues? [y/N] '
read -r REPLY
if [[ "$REPLY" == 'y' || "$REPLY" == 'Y' ]]; then
  docker compose --profile tools run --rm -e ALLOW_DEMO_SEED=true maintenance npm run db:seed
fi
docker compose up -d --wait --wait-timeout 90 app
printf '\nLocal deployment started. Open http://localhost:3000\n'
printf 'Admin sign-in: http://localhost:3000/login\n'
printf 'Important: do not expose the preview publicly without security review.\n'

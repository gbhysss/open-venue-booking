#!/usr/bin/env bash
# Creates and removes ONLY a randomly named disposable CI stack.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${CI:-}" != true ]]; then
  echo 'This destructive disposable-stack test is for CI=true environments only.' >&2
  exit 1
fi
for tool in docker node npm curl; do
  command -v "$tool" >/dev/null || { echo "Missing $tool" >&2; exit 1; }
done
if [[ -e .env.production.local ]]; then
  echo 'Refusing to overwrite an existing .env.production.local.' >&2
  exit 1
fi
test_project="openvenue-ci-$(node -e "console.log(require('crypto').randomBytes(6).toString('hex'))")"
test_env="$(mktemp)"
compose_test=(docker compose --env-file "$test_env" -p "$test_project" -f docker-compose.yml -f docker-compose.test.yml --profile tools)
canary_created=false
cleanup() {
  result=$?
  trap - EXIT
  if [[ $result -ne 0 ]]; then
    "${compose_test[@]}" logs --no-color --tail=100 app db || true
  fi
  "${compose_test[@]}" down --volumes --remove-orphans || true
  rm -f "$test_env"
  if [[ "$canary_created" == true ]]; then rm -f .env.production.local; fi
  exit "$result"
}
trap cleanup EXIT
export POSTGRES_PASSWORD="$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")"
export BETTER_AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
export APP_URL=http://127.0.0.1:3000
printf 'POSTGRES_PASSWORD=%s\nBETTER_AUTH_SECRET=%s\nAPP_URL=%s\nBOOKING_MAX_PER_MINUTE=20\n' \
  "$POSTGRES_PASSWORD" "$BETTER_AUTH_SECRET" "$APP_URL" > "$test_env"
chmod 600 "$test_env"
printf 'DOCKER_ENV_CANARY=fictional-value-that-must-not-enter-the-image\n' > .env.production.local
canary_created=true

# Verify the real deployment does not expose PostgreSQL and binds the app locally.
docker compose --env-file "$test_env" -f docker-compose.yml config --format json | node --input-type=module -e '
  import assert from "node:assert/strict";
  let text="";for await(const chunk of process.stdin)text+=chunk;
  const config=JSON.parse(text);
  assert.equal((config.services.db.ports||[]).length,0);
  assert.ok(config.services.app.ports.every(p=>p.host_ip==="127.0.0.1"));
  console.log("PASS production port isolation");'

"${compose_test[@]}" build app maintenance
"${compose_test[@]}" run --rm --no-deps maintenance node -e '
  const assert=require("node:assert/strict"),fs=require("node:fs");
  for(const file of [".env",".env.local",".env.production",".env.production.local"])
    assert.equal(fs.existsSync("/app/"+file),false,file+" leaked into build image");
  console.log("PASS env-file exclusion from build image");'
"${compose_test[@]}" up -d --wait --wait-timeout 90 db
"${compose_test[@]}" run --rm maintenance npm run db:migrate
# Reapplying the idempotent scripts must preserve the schema and indexes.
"${compose_test[@]}" run --rm maintenance npm run db:migrate
export ADMIN_EMAIL=ci-docker@example.invalid ADMIN_PASSWORD=ci-docker-only-not-a-real-password
"${compose_test[@]}" run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD maintenance npm run admin:create
"${compose_test[@]}" run --rm -e ALLOW_DEMO_SEED=true maintenance npm run db:seed
"${compose_test[@]}" up -d --wait --wait-timeout 90 app

test_app_id="$("${compose_test[@]}" ps -q app)"
"${compose_test[@]}" exec -T app node -e '
  const assert=require("node:assert/strict"),fs=require("node:fs");
  assert.notEqual(process.getuid(),0);
  for(const file of [".env",".env.local",".env.production",".env.production.local"])
    assert.equal(fs.existsSync("/app/"+file),false,file+" leaked into runtime image");
  console.log("PASS non-root runtime and env-file exclusion");'
export TEST_APP_URL="$APP_URL" TEST_DATABASE_URL="postgresql://openvenue:${POSTGRES_PASSWORD}@127.0.0.1:5432/openvenue_test"
export TEST_ADMIN_EMAIL="$ADMIN_EMAIL" TEST_ADMIN_PASSWORD="$ADMIN_PASSWORD" BOOKING_MAX_PER_MINUTE=20
npm run test:api
before_id="$(node --input-type=module -e 'const x=await (await fetch(process.env.APP_URL+"/api/venues")).json();if(x.data.length!==3)process.exit(1);console.log(x.data[0].id)')"

# Exercise loss/recovery of real sockets rather than merely restarting the web process.
"${compose_test[@]}" stop db
status="$(curl --silent --max-time 8 --output /tmp/openvenue-health.json --write-out '%{http_code}' "$APP_URL/api/health")"
[[ "$status" == 503 ]] || { echo "Expected unavailable readiness; got $status" >&2; exit 1; }
node -e 'const assert=require("node:assert/strict"),fs=require("node:fs");assert.deepEqual(JSON.parse(fs.readFileSync("/tmp/openvenue-health.json")),{status:"unavailable"})'
"${compose_test[@]}" up -d --wait --wait-timeout 90 db
for attempt in {1..30}; do
  if curl --silent --fail --max-time 6 "$APP_URL/api/health" > /dev/null; then break; fi
  sleep 1
done
curl --silent --fail --max-time 6 "$APP_URL/api/health" > /dev/null
after_id="$(node --input-type=module -e 'const x=await (await fetch(process.env.APP_URL+"/api/venues")).json();console.log(x.data[0].id)')"
[[ "$before_id" == "$after_id" ]] || { echo 'Demo data did not persist across restart' >&2; exit 1; }
[[ "$(docker inspect --format '{{.RestartCount}}' "$test_app_id")" == 0 ]] || { echo 'Web process restarted unexpectedly' >&2; exit 1; }
echo 'PASS database outage returns 503, then recovers with data intact and no app restart'
echo 'PASS Docker Compose deployment regression'

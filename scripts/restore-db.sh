#!/usr/bin/env bash
set -euo pipefail

# Wipes the target Postgres database and reloads it from a pg_dump
# custom-format backup. Runs pg_restore *inside* the `db` container so the
# host/deploy machine never needs postgres client tools installed locally
# -- only Docker, which the stack already requires.
#
# Usage:
#   scripts/restore-db.sh [dump-file] [-f compose-file] [-e env-file] [--force]
#
# Examples:
#   scripts/restore-db.sh
#   scripts/restore-db.sh db-backup/backup_2026-01-19.dump
#   scripts/restore-db.sh db-backup/backup_2026-01-19.dump -f docker-compose.prod.yml -e .env.production --force

DUMP_FILE="db-backup/backup_2026-01-19.dump"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
FORCE=0

if [[ $# -gt 0 && "$1" != -* ]]; then
  DUMP_FILE="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--compose-file) COMPOSE_FILE="$2"; shift 2 ;;
    -e|--env-file) ENV_FILE="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

[[ -f "$DUMP_FILE" ]] || { echo "Dump file not found: $DUMP_FILE" >&2; exit 1; }
[[ -f "$ENV_FILE" ]] || { echo "Env file not found: $ENV_FILE" >&2; exit 1; }
[[ -f "$COMPOSE_FILE" ]] || { echo "Compose file not found: $COMPOSE_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-loan_db}"

if [[ "${NODE_ENV:-}" == "production" && "$FORCE" -ne 1 ]]; then
  echo "Refusing to overwrite a production database without --force." >&2
  echo "Target: db='$POSTGRES_DB' via '$COMPOSE_FILE' (NODE_ENV=production)" >&2
  exit 1
fi

echo "==> Restoring '$DUMP_FILE' into database '$POSTGRES_DB' (all existing data will be replaced)"

docker compose -f "$COMPOSE_FILE" up -d db

echo "==> Waiting for db to be ready..."
until docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  sleep 1
done

echo "==> Dropping and recreating schema 'public' (clean slate, immune to drift vs. the dump)..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

echo "==> Running pg_restore inside the db container..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore --no-owner --no-privileges \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$DUMP_FILE"

echo "==> Applying any Prisma migrations newer than the dump..."
npx dotenv -e "$ENV_FILE" -- prisma migrate deploy

echo "==> Restore complete."

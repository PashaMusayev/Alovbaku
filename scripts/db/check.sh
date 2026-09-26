#!/usr/bin/env bash
# Applies the Supabase stub, all migrations and the seed to a throwaway local
# Postgres database to prove they are valid. Requires a local `psql`.
# Usage: DATABASE_URL=postgres://postgres@localhost/postgres npm run db:check
set -euo pipefail
BASE_URL="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
DB="alov_check_$$"
psql "$BASE_URL" -qc "create database $DB" >/dev/null
trap 'psql "$BASE_URL" -qc "drop database if exists $DB" >/dev/null' EXIT
URL="${BASE_URL%/*}/$DB"
for f in scripts/db/supabase-stub.sql supabase/migrations/*.sql supabase/seed.sql; do
  psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>&1 || { echo "✗ $f"; psql "$URL" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null; exit 1; }
  echo "✓ $f"
done

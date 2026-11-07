#!/usr/bin/env bash
# Builds a fresh test database that behaves like the Supabase project:
# roles anon/authenticated, Supabase's default "players may run new functions" grant, then every SQL part in order.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${PGDATABASE:-kfci}"
PSQL=(psql -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB"
"${PSQL[@]}" -d postgres -c "do \$\$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end \$\$;"
"${PSQL[@]}" -d "$DB" -c "grant usage on schema public to anon, authenticated" \
  -c "alter default privileges in schema public grant execute on functions to anon, authenticated"
for f in leaderboard-setup leaderboard-v2 online-v3 accounts-v4 clubs-v5 lock-internal-functions security-v6 update-v7; do
  "${PSQL[@]}" -d "$DB" -f "docs/$f.sql" 2>&1 | grep -v NOTICE || true
done
# A test-only server admin password (never the real one).
"${PSQL[@]}" -d "$DB" -v pw="${TEST_ADMIN_PASS:-ci-test-admin-pass}" <<'SQL'
insert into public.kf_admin_auth (k, pass_hash) values (1, extensions.crypt(:'pw', extensions.gen_salt('bf', 6)))
on conflict (k) do update set pass_hash = excluded.pass_hash;
SQL
echo "Test database $DB is ready."

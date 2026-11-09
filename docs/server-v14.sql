-- Keksfabrik / Cookie Factory server care: off-site backups, cleanup, save checks, planned events, part 14 (game version 56)
-- Needs parts 1–13 first. Safe to run again.

-- 0. A small table for server jobs (when they last ran and what they did) ----------------------------
create table if not exists public.kf_jobs (k text primary key, at timestamptz not null default now(), info jsonb not null default '{}'::jsonb);
alter table public.kf_jobs enable row level security;
revoke all on public.kf_jobs from anon, authenticated;

-- 1. Transfer codes are gone (accounts and save files cover it) ----------------------------------------
drop function if exists public.save_upload(text);
drop function if exists public.save_download(text);
drop table if exists public.kf_saves;

-- 2. Off-site backups ------------------------------------------------------------------------------
-- A GitHub job fetches the newest backup once a week with a key and stores it encrypted outside Supabase.
-- Only a hash of the key is kept here; the owner creates the key in admin.html and saves it as a GitHub secret.
create table if not exists public.kf_offsite (
  k            int primary key default 1 check (k = 1),
  key_hash     text,
  created_at   timestamptz,
  last_export  timestamptz,
  exports      int not null default 0
);
alter table public.kf_offsite enable row level security;
revoke all on public.kf_offsite from anon, authenticated;

create or replace function public.backup_offsite(p_key text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare o record; b record;
begin
  select * into o from kf_offsite where k = 1;
  if not found or o.key_hash is null or o.key_hash <> encode(digest(coalesce(p_key, ''), 'sha256'), 'hex') then
    perform pg_sleep(1); raise exception 'forbidden';
  end if;
  if o.last_export > now() - interval '20 minutes' then raise exception 'too soon'; end if;
  perform kf_backup_tick();
  select * into b from kf_backups order by id desc limit 1;
  if not found then raise exception 'no backup yet'; end if;
  update kf_offsite set last_export = now(), exports = exports + 1 where k = 1;
  perform kf_log('backup: off-site copy', 'backup ' || b.id);
  return json_build_object('id', b.id, 'at', b.at, 'kind', b.kind, 'counts', b.counts, 'data', b.data);
end $$;

-- status | newkey (shown once) | remove
create or replace function public.admin_offsite(p_pass text, p_action text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare key text; o record;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'newkey' then
    key := encode(gen_random_bytes(24), 'hex');
    insert into kf_offsite (k, key_hash, created_at) values (1, encode(digest(key, 'sha256'), 'hex'), now())
    on conflict (k) do update set key_hash = excluded.key_hash, created_at = now(), last_export = null;
    perform kf_log('backup: new off-site key', '');
  elsif p_action = 'remove' then
    update kf_offsite set key_hash = null where k = 1;
    perform kf_log('backup: off-site key removed', '');
  elsif p_action <> 'status' then
    raise exception 'unknown action';
  end if;
  select * into o from kf_offsite where k = 1;
  return json_build_object('key', key, 'on', o.key_hash is not null, 'created_at', o.created_at, 'last_export', o.last_export, 'exports', coalesce(o.exports, 0));
end $$;

-- 3. Automatic cleanup -----------------------------------------------------------------------------
-- Removes data nobody needs any more, so the free database stays small. Runs at most every 6 hours.
create or replace function public.kf_cleanup_run() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb := '{}'::jsonb; n int;
begin
  delete from kf_presence where seen_at < now() - interval '365 days'; get diagnostics n = row_count; r := r || jsonb_build_object('players', n);
  delete from kf_days where day < (now() at time zone 'UTC')::date - 120; get diagnostics n = row_count; r := r || jsonb_build_object('days', n);
  delete from kf_steps s where s.at < now() - interval '365 days' and not exists (select 1 from kf_presence p where p.id = s.id); get diagnostics n = row_count; r := r || jsonb_build_object('steps', n);
  delete from kf_push_queue where sent_at < now() - interval '3 days' or (sent_at is null and created_at < now() - interval '7 days'); get diagnostics n = row_count; r := r || jsonb_build_object('push', n);
  delete from kf_admin_log where at < now() - interval '180 days'; get diagnostics n = row_count; r := r || jsonb_build_object('admin_log', n);
  delete from kf_sessions where last_used < now() - interval '180 days'; get diagnostics n = row_count; r := r || jsonb_build_object('sessions', n);
  delete from kf_admin_sessions where expires_at < now(); get diagnostics n = row_count; r := r || jsonb_build_object('admin_sessions', n);
  delete from kf_rate where at < now() - interval '2 days'; get diagnostics n = row_count; r := r || jsonb_build_object('limits', n);
  delete from kf_login_fails where at < now() - interval '1 day';
  delete from kf_admin_fails where at < now() - interval '1 day';
  delete from kf_gifts where claimed and created_at < now() - interval '90 days'; get diagnostics n = row_count; r := r || jsonb_build_object('gifts', n);
  delete from kf_mail where claimed and created_at < now() - interval '90 days'; get diagnostics n = row_count; r := r || jsonb_build_object('mail', n);
  delete from kf_reports where status = 'done' and created_at < now() - interval '90 days'; get diagnostics n = row_count; r := r || jsonb_build_object('reports', n);
  delete from kf_appeals where status <> 'open' and created_at < now() - interval '120 days'; get diagnostics n = row_count; r := r || jsonb_build_object('appeals', n);
  delete from kf_feedback where status = 'done' and created_at < now() - interval '180 days'; get diagnostics n = row_count; r := r || jsonb_build_object('feedback', n);
  delete from kf_errors where last_at < now() - interval '60 days'; get diagnostics n = row_count; r := r || jsonb_build_object('crashes', n);
  delete from kf_mutes where until < now(); get diagnostics n = row_count; r := r || jsonb_build_object('mutes', n);
  delete from kf_device_bans where until < now();
  delete from kf_save_flags where status = 'ok' and created_at < now() - interval '90 days';
  delete from kf_schedule where not active and repeat = 'once' and last_run < now() - interval '30 days';
  delete from kf_news where until < now() - interval '30 days'; get diagnostics n = row_count; r := r || jsonb_build_object('news', n);
  delete from kf_events where ends_at < now() - interval '30 days'; get diagnostics n = row_count; r := r || jsonb_build_object('events', n);
  insert into kf_jobs (k, at, info) values ('cleanup', now(), r) on conflict (k) do update set at = now(), info = excluded.info;
  return r;
end $$;

create or replace function public.kf_cleanup() returns json
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from kf_jobs where k = 'cleanup' and at > now() - interval '6 hours') then
    return json_build_object('ran', false, 'at', (select at from kf_jobs where k = 'cleanup'));
  end if;
  perform pg_advisory_xact_lock(4243);
  if exists (select 1 from kf_jobs where k = 'cleanup' and at > now() - interval '6 hours') then return json_build_object('ran', false); end if;
  return json_build_object('ran', true, 'removed', kf_cleanup_run());
end $$;

-- 4. Save checks ------------------------------------------------------------------------------------
-- An account save whose total grows much faster than the game allows is flagged for the owner.
-- The save itself is kept (nobody loses progress); the owner decides in the Moderation tab.
create table if not exists public.kf_save_flags (
  id          bigserial primary key,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  username    text not null,
  old_baked   double precision not null,
  new_baked   double precision not null,
  hours       double precision not null,
  created_at  timestamptz not null default now(),
  status      text not null default 'open' check (status in ('open', 'ok'))
);
alter table public.kf_save_flags enable row level security;
revoke all on public.kf_save_flags from anon, authenticated;

create or replace function public.kf_save_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare hrs double precision; lim double precision;
begin
  -- the first account save (any size) and saves that don't grow are fine
  if old.save_at is null or new.save_baked is null or old.save_baked is null or new.save_baked <= old.save_baked then return new; end if;
  hrs := greatest(0, extract(epoch from (now() - old.save_at)) / 3600.0);
  -- the leaderboard rule (10x per 5 minutes, at most 10^12), plus 100x per extra day away (offline play without signing in)
  lim := greatest(old.save_baked, 1e8) * power(10::double precision, least(least(12 * hrs, 12) + greatest(hrs - 1, 0) / 12.0, 200));
  if new.save_baked > lim
     and not exists (select 1 from kf_save_flags where account = new.id and status = 'open' and created_at > now() - interval '1 hour') then
    insert into kf_save_flags (account, username, old_baked, new_baked, hours) values (new.id, new.username, old.save_baked, new.save_baked, hrs);
    perform kf_admin_alert('save', false, '⚠️ Verdächtiger Spielstand', '⚠️ Suspicious save', new.username, new.username);
  end if;
  return new;
end $$;
drop trigger if exists kf_save_check on public.kf_accounts;
create trigger kf_save_check before update of save_baked on public.kf_accounts for each row execute function public.kf_save_check();

-- list | ok {id} | ok_all
create or replace function public.admin_saveflags(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json);
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'ok' then update kf_save_flags set status = 'ok' where id = (d->>'id')::bigint; perform kf_log('save flag cleared', coalesce(d->>'id', ''));
  elsif p_action = 'ok_all' then update kf_save_flags set status = 'ok' where status = 'open'; perform kf_log('save flags cleared', 'all');
  elsif p_action <> 'list' then raise exception 'unknown action'; end if;
  return coalesce((select json_agg(json_build_object('id', f.id, 'username', f.username, 'old', f.old_baked, 'new', f.new_baked, 'hours', f.hours,
      'created_at', f.created_at, 'banned', exists (select 1 from kf_bans b where b.account = f.account and (b.until is null or b.until > now())))
      order by f.id desc) from kf_save_flags f where f.status = 'open'), '[]'::json);
end $$;

-- 5. Planned events and announcements ---------------------------------------------------------------
create table if not exists public.kf_schedule (
  id          bigserial primary key,
  kind        text not null check (kind in ('event', 'news')),
  title       text not null default '' check (char_length(title) <= 80),
  body        text not null default '' check (char_length(body) <= 600),
  ev_kind     text check (ev_kind in ('prod', 'click', 'gold', 'orders')),
  mult        double precision check (mult > 1 and mult <= 10),
  hours       double precision not null check (hours > 0 and hours <= 720),
  repeat      text not null default 'once' check (repeat in ('once', 'weekly')),
  next_at     timestamptz not null,
  active      boolean not null default true,
  last_run    timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.kf_schedule enable row level security;
revoke all on public.kf_schedule from anon, authenticated;

-- Starts what is due. Cheap when nothing is due; called by every minute ping and by the daily keep-awake job.
create or replace function public.kf_schedule_tick() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; nx timestamptz;
begin
  if not exists (select 1 from kf_schedule where active and next_at <= now()) then return 0; end if;
  for r in select * from kf_schedule where active and next_at <= now() order by next_at for update skip locked loop
    if r.kind = 'event' then
      insert into kf_events (kind, mult, title, starts_at, ends_at) values (r.ev_kind, r.mult, left(r.title, 60), now(), now() + r.hours * interval '1 hour');
    else
      insert into kf_news (title, body, until) values (left(r.title, 80), r.body, now() + r.hours * interval '1 hour');
    end if;
    if r.repeat = 'weekly' then
      nx := r.next_at;
      while nx <= now() loop nx := nx + interval '7 days'; end loop;
      update kf_schedule set next_at = nx, last_run = now() where id = r.id;
    else
      update kf_schedule set active = false, last_run = now() where id = r.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- list | add {kind, title, body, ev_kind, mult, hours, repeat, at} | delete {id} | toggle {id}
create or replace function public.admin_schedule(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); k text := d->>'kind'; at timestamptz; hrs double precision;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'add' then
    at := (d->>'at')::timestamptz;
    hrs := coalesce(nullif(d->>'hours', '')::double precision, 2);
    if at is null then raise exception 'invalid time'; end if;
    if at < now() - interval '5 minutes' and coalesce(d->>'repeat', 'once') = 'once' then raise exception 'time in the past'; end if;
    if k = 'event' then
      if coalesce(d->>'ev_kind', '') not in ('prod', 'click', 'gold', 'orders') then raise exception 'invalid event'; end if;
      if coalesce(nullif(d->>'mult', '')::double precision, 0) <= 1 or (d->>'mult')::double precision > 10 then raise exception 'invalid multiplier'; end if;
      if hrs < .25 or hrs > 168 then raise exception 'invalid duration'; end if;
    elsif k = 'news' then
      if char_length(btrim(coalesce(d->>'title', ''))) < 1 then raise exception 'title missing'; end if;
      if hrs < 1 or hrs > 720 then raise exception 'invalid duration'; end if;
    else raise exception 'invalid kind'; end if;
    insert into kf_schedule (kind, title, body, ev_kind, mult, hours, repeat, next_at)
    values (k, left(btrim(coalesce(d->>'title', '')), 80), left(coalesce(d->>'body', ''), 600), case when k = 'event' then d->>'ev_kind' end,
            case when k = 'event' then (d->>'mult')::double precision end, hrs, case when d->>'repeat' = 'weekly' then 'weekly' else 'once' end, at);
    perform kf_log('schedule: add ' || k, left(coalesce(d->>'title', ''), 80) || ' · ' || to_char(at at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC' || case when d->>'repeat' = 'weekly' then ' weekly' else '' end);
    perform kf_schedule_tick();
  elsif p_action = 'delete' then
    delete from kf_schedule where id = (d->>'id')::bigint; perform kf_log('schedule: delete', coalesce(d->>'id', ''));
  elsif p_action = 'toggle' then
    update kf_schedule set active = not active where id = (d->>'id')::bigint; perform kf_log('schedule: pause/resume', coalesce(d->>'id', ''));
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return coalesce((select json_agg(json_build_object('id', id, 'kind', kind, 'title', title, 'body', body, 'ev_kind', ev_kind, 'mult', mult, 'hours', hours,
      'repeat', repeat, 'next_at', next_at, 'active', active, 'last_run', last_run) order by active desc, next_at)
    from kf_schedule where active or last_run > now() - interval '7 days'), '[]'::json);
end $$;

-- The minute ping also starts planned events (replaces part 10's version).
create or replace function public.kf_ping(p_id uuid, p_baked double precision)
returns json language plpgsql security definer set search_path = public as $$
declare old_b double precision; old_t timestamptz; hrs double precision; b double precision;
begin
  b := coalesce(p_baked, 0);
  if b = 'NaN'::double precision or b < 0 then b := 0; end if;
  b := least(b, 9.9e299);
  select baked, seen_at into old_b, old_t from kf_presence where id = p_id;
  if not found then
    insert into kf_presence (id, baked) values (p_id, least(b, 1e15));
  elsif old_t < now() - interval '20 seconds' then
    hrs := extract(epoch from (now() - old_t)) / 3600.0;
    update kf_presence
      set baked = greatest(old_b, least(b, greatest(old_b, 1e8) * power(10::double precision, least(12 * hrs, 12)))),
          seen_at = now()
      where id = p_id;
  end if;
  insert into kf_days (id, day) values (p_id, (now() at time zone 'UTC')::date) on conflict do nothing;
  perform kf_schedule_tick();
  if random() < 0.02 then perform kf_backup_tick(); perform kf_reminders(); perform kf_cleanup(); end if;
  return kf_live();
end $$;

-- 6. Usage: how full the free database is ------------------------------------------------------------
-- usage | cleanup (runs the cleanup now)
create or replace function public.admin_usage(p_pass text, p_action text default 'usage')
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'cleanup' then perform kf_cleanup_run(); perform kf_log('cleanup now', '');
  elsif p_action <> 'usage' then raise exception 'unknown action'; end if;
  return json_build_object(
    'db_bytes', pg_database_size(current_database()),
    'limit_bytes', 500 * 1024 * 1024,
    'tables', (select json_agg(json_build_object('name', t.relname, 'bytes', t.b, 'rows', t.rows) order by t.b desc) from (
                 select c.relname, pg_total_relation_size(c.oid) as b, greatest(c.reltuples, 0)::bigint as rows
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'
                 order by 2 desc limit 10) t),
    'mau', (select count(distinct id) from kf_days where day > (now() at time zone 'UTC')::date - 30),
    'dau', (select count(*) from kf_days where day = (now() at time zone 'UTC')::date),
    'accounts', (select count(*) from kf_accounts),
    'backups', (select count(*) from kf_backups),
    'cleanup', (select json_build_object('at', at, 'removed', info) from kf_jobs where k = 'cleanup'),
    'offsite', (select json_build_object('on', key_hash is not null, 'last_export', last_export, 'exports', exports) from kf_offsite where k = 1));
end $$;

-- 7. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_cleanup_run() from public, anon, authenticated;
revoke all on function public.kf_save_check() from public, anon, authenticated;
revoke all on function public.backup_offsite(text) from public;
revoke all on function public.admin_offsite(text, text) from public;
revoke all on function public.kf_cleanup() from public;
revoke all on function public.admin_saveflags(text, text, json) from public;
revoke all on function public.kf_schedule_tick() from public;
revoke all on function public.admin_schedule(text, text, json) from public;
revoke all on function public.kf_ping(uuid, double precision) from public;
revoke all on function public.admin_usage(text, text) from public;
grant execute on function public.backup_offsite(text) to anon;
grant execute on function public.admin_offsite(text, text) to anon;
grant execute on function public.kf_cleanup() to anon;
grant execute on function public.admin_saveflags(text, text, json) to anon;
grant execute on function public.kf_schedule_tick() to anon;
grant execute on function public.admin_schedule(text, text, json) to anon;
grant execute on function public.kf_ping(uuid, double precision) to anon;
grant execute on function public.admin_usage(text, text) to anon;

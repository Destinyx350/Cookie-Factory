-- Keksfabrik / Cookie Factory live dashboard and weekly report, part 15 (game version 57)
-- Needs parts 1–14 first. Safe to run again.

-- 1. What the dashboard counts ----------------------------------------------------------------------
-- One row per player per day already exists (kf_days). It now also notes the browser language (2 letters),
-- the device type and where the game runs (website, installed app, game portal). Nothing that identifies a person.
alter table public.kf_days add column if not exists lang text;
alter table public.kf_days add column if not exists dev  text;
alter table public.kf_days add column if not exists src  text;
create index if not exists kf_days_day on public.kf_days (day);

-- Crashes per day (kf_errors only keeps one row per kind of crash).
create table if not exists public.kf_err_days (day date primary key, n int not null default 0);
alter table public.kf_err_days enable row level security;
revoke all on public.kf_err_days from anon, authenticated;

create or replace function public.kf_err_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int := case when tg_op = 'INSERT' then new.count else new.count - old.count end;
begin
  if n > 0 then
    insert into kf_err_days (day, n) values ((now() at time zone 'UTC')::date, n)
    on conflict (day) do update set n = kf_err_days.n + excluded.n;
  end if;
  return null;
end $$;
drop trigger if exists kf_err_count on public.kf_errors;
create trigger kf_err_count after insert or update of count on public.kf_errors for each row execute function public.kf_err_count();

-- 2. Weekly reports -----------------------------------------------------------------------------------
create table if not exists public.kf_week_reports (
  id          bigserial primary key,
  week        text not null unique,            -- ISO week, e.g. 2026-W46
  created_at  timestamptz not null default now(),
  data        jsonb not null
);
alter table public.kf_week_reports enable row level security;
revoke all on public.kf_week_reports from anon, authenticated;

-- The numbers of the last 7 days against the 7 before, plus open to-dos (internal).
create or replace function public.kf_week_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb := '{}'::jsonb; w int; f timestamptz; t timestamptz; fd date; td date; wk_key text; lim double precision := 500 * 1024 * 1024;
begin
  for w in 0 .. 1 loop
    t := now() - w * interval '7 days'; f := t - interval '7 days';
    td := (t at time zone 'UTC')::date; fd := (f at time zone 'UTC')::date;
    wk_key := case when w = 0 then 'this' else 'last' end;
    r := r || jsonb_build_object(wk_key, jsonb_build_object(
      'players',     (select count(distinct id) from kf_days where day > fd and day <= td),
      'new_players', (select count(*) from kf_presence where first_seen >= f and first_seen < t),
      'returning',   (select count(distinct d.id) from kf_days d join kf_presence p on p.id = d.id where d.day > fd and d.day <= td and p.first_seen < f),
      'accounts',    (select count(*) from kf_accounts where created_at >= f and created_at < t),
      'chat',        (select count(*) from kf_club_msgs where created_at >= f and created_at < t),
      'gifts',       (select count(*) from kf_gifts where created_at >= f and created_at < t),
      'reports',     (select count(*) from kf_reports where created_at >= f and created_at < t),
      'crashes',     (select coalesce(sum(n), 0) from kf_err_days where day > fd and day <= td),
      'feedback',    (select count(*) from kf_feedback where created_at >= f and created_at < t),
      'bans',        (select count(*) from kf_admin_log where action like '%ban account%' and at >= f and at < t),
      'clubs',       (select count(*) from kf_clubs where created_at >= f and created_at < t)));
  end loop;
  -- day-2 return: players who started 8–14 days ago and came back on a later day
  r := r || jsonb_build_object('day2', (
    select case when count(*) = 0 then null else round(100.0 * count(*) filter (where exists (
      select 1 from kf_days d where d.id = p.id and d.day > (p.first_seen at time zone 'UTC')::date)) / count(*)) end
    from kf_presence p where p.first_seen >= now() - interval '14 days' and p.first_seen < now() - interval '7 days'));
  r := r || jsonb_build_object('todo', jsonb_build_object(
    'reports',  (select count(*) from kf_reports where status = 'open'),
    'appeals',  (select count(*) from kf_appeals where status = 'open'),
    'feedback', (select count(*) from kf_feedback where status = 'open'),
    'crashes',  (select count(*) from kf_errors),
    'saves',    (select count(*) from kf_save_flags where status = 'open'),
    'db_pct',   round((100 * pg_database_size(current_database()) / lim)::numeric, 1),
    'offsite',  (select case when key_hash is null then 'off' when last_export is null or last_export < now() - interval '9 days' then 'late' else 'ok' end from kf_offsite where k = 1),
    'top_lang', (select json_agg(x) from (select lang, count(distinct id) n from kf_days where day > (now() at time zone 'UTC')::date - 7 and lang is not null group by lang order by 2 desc limit 3) x)));
  return r;
end $$;

-- Makes this week's report once (the first call in a new ISO week) and sends the owner a push.
-- Called by the minute ping now and then and by the daily keep-awake job.
create or replace function public.kf_week_report() returns json
language plpgsql security definer set search_path = public as $$
declare wk text := to_char(now() at time zone 'UTC', 'IYYY-"W"IW'); d jsonb; p int; pl int; a int; todo int; pct text; b_de text; b_en text;
begin
  if exists (select 1 from kf_week_reports where week = wk) then return json_build_object('made', false, 'week', wk); end if;
  perform pg_advisory_xact_lock(4244);
  if exists (select 1 from kf_week_reports where week = wk) then return json_build_object('made', false, 'week', wk); end if;
  d := kf_week_data();
  insert into kf_week_reports (week, data) values (wk, d);
  delete from kf_week_reports where created_at < now() - interval '400 days';
  p := (d->'this'->>'players')::int; pl := (d->'last'->>'players')::int; a := (d->'this'->>'accounts')::int;
  todo := (d->'todo'->>'reports')::int + (d->'todo'->>'appeals')::int + (d->'todo'->>'feedback')::int + (d->'todo'->>'saves')::int;
  pct := case when pl > 0 then ' (' || case when p >= pl then '+' else '' end || round(100.0 * (p - pl) / pl) || ' %)' else '' end;
  b_de := p || ' Spieler' || pct || ' · ' || a || ' neue Konten · ' || case when todo > 0 then todo || ' offene Aufgaben' else 'nichts offen 🎉' end;
  b_en := p || ' players' || pct || ' · ' || a || ' new accounts · ' || case when todo > 0 then todo || ' open to-dos' else 'nothing open 🎉' end;
  perform kf_admin_alert('week', false, '📈 Wochenbericht', '📈 Weekly report', b_de, b_en);
  return json_build_object('made', true, 'week', wk);
end $$;

-- list (the last 12 reports) | preview (the numbers right now, not saved)
create or replace function public.admin_reports(p_pass text, p_action text default 'list')
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'preview' then return json_build_object('week', 'now', 'created_at', now(), 'data', kf_week_data()); end if;
  if p_action <> 'list' then raise exception 'unknown action'; end if;
  return coalesce((select json_agg(json_build_object('week', week, 'created_at', created_at, 'data', data) order by id desc)
    from (select * from kf_week_reports order by id desc limit 12) r), '[]'::json);
end $$;

-- 3. The live dashboard -------------------------------------------------------------------------------
create or replace function public.admin_dash(p_pass text, p_days int default 30)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare n int := least(greatest(coalesce(p_days, 30), 7), 120); td date := (now() at time zone 'UTC')::date; fd date := td - n + 1;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  return json_build_object(
    'from', fd, 'to', td,
    'online', (select count(*) from kf_presence where seen_at > now() - interval '3 minutes'),
    'players', (select count(distinct id) from kf_days where day >= fd),
    'days', (select json_agg(json_build_object('day', g.day,
                'players',  (select count(*) from kf_days d where d.day = g.day),
                'new',      (select count(*) from kf_presence p where (p.first_seen at time zone 'UTC')::date = g.day),
                'accounts', (select count(*) from kf_accounts a where (a.created_at at time zone 'UTC')::date = g.day),
                'crashes',  coalesce((select e.n from kf_err_days e where e.day = g.day), 0)) order by g.day)
             from (select generate_series(fd, td, interval '1 day')::date as day) g),
    'langs', (select json_agg(json_build_object('k', k, 'n', c) order by c desc) from (
                select coalesce(lang, '?') k, count(distinct id) c from kf_days where day >= fd group by 1 order by 2 desc limit 8) x),
    'devs',  (select json_agg(json_build_object('k', k, 'n', c) order by c desc) from (
                select coalesce(dev, '?') k, count(distinct id) c from kf_days where day >= fd group by 1) x),
    'srcs',  (select json_agg(json_build_object('k', k, 'n', c) order by c desc) from (
                select coalesce(src, '?') k, count(distinct id) c from kf_days where day >= fd group by 1) x));
end $$;

-- 4. The minute ping notes language, device and source (replaces part 14's version) -----------------------
drop function if exists public.kf_ping(uuid, double precision);
create or replace function public.kf_ping(p_id uuid, p_baked double precision, p_lang text default null, p_dev text default null, p_src text default null)
returns json language plpgsql security definer set search_path = public as $$
declare old_b double precision; old_t timestamptz; hrs double precision; b double precision; l text; dv text; sr text;
begin
  b := coalesce(p_baked, 0);
  if b = 'NaN'::double precision or b < 0 then b := 0; end if;
  b := least(b, 9.9e299);
  l  := case when p_lang ~ '^[a-z]{2}$' then p_lang end;
  dv := case when p_dev in ('phone', 'tablet', 'desktop') then p_dev end;
  sr := case when p_src in ('web', 'app', 'portal') then p_src end;
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
  insert into kf_days (id, day, lang, dev, src) values (p_id, (now() at time zone 'UTC')::date, l, dv, sr)
  on conflict (id, day) do update set lang = coalesce(kf_days.lang, excluded.lang), dev = coalesce(kf_days.dev, excluded.dev), src = coalesce(kf_days.src, excluded.src)
    where kf_days.lang is null and excluded.lang is not null;
  perform kf_schedule_tick();
  if random() < 0.02 then perform kf_backup_tick(); perform kf_reminders(); perform kf_cleanup(); perform kf_week_report(); end if;
  return kf_live();
end $$;

-- 5. Cleanup also trims the crash counter (replaces part 14's version, adds the last line before the log)
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
  delete from kf_err_days where day < (now() at time zone 'UTC')::date - 120;
  insert into kf_jobs (k, at, info) values ('cleanup', now(), r) on conflict (k) do update set at = now(), info = excluded.info;
  return r;
end $$;

-- 6. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_err_count() from public, anon, authenticated;
revoke all on function public.kf_week_data() from public, anon, authenticated;
revoke all on function public.kf_cleanup_run() from public, anon, authenticated;
revoke all on function public.kf_week_report() from public;
revoke all on function public.admin_reports(text, text) from public;
revoke all on function public.admin_dash(text, int) from public;
revoke all on function public.kf_ping(uuid, double precision, text, text, text) from public;
grant execute on function public.kf_week_report() to anon;
grant execute on function public.admin_reports(text, text) to anon;
grant execute on function public.admin_dash(text, int) to anon;
grant execute on function public.kf_ping(uuid, double precision, text, text, text) to anon;

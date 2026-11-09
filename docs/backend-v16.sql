-- Keksfabrik / Cookie Factory backend care, part 16 (game version 58)
-- Indexes and fixes from Supabase's checks, jobs on the server's own clock (pg_cron), a limit against fake player counts,
-- recovery codes and a device list for accounts, a list of installed server parts, health alarms and a live signal for club chat.
-- Needs parts 1–15 first. Safe to run again.

-- 0. Which server parts are installed ----------------------------------------------------------------
create table if not exists public.kf_schema (part int primary key, name text not null, applied_at timestamptz not null default now());
alter table public.kf_schema enable row level security;
revoke all on public.kf_schema from anon, authenticated;
insert into public.kf_schema (part, name)
select p, n from (values
  (1, 'leaderboard-setup', 'public.leaderboard'), (2, 'leaderboard-v2', 'public.lb_period'), (3, 'online-v3', 'public.kf_codes'),
  (4, 'accounts-v4', 'public.kf_accounts'), (5, 'clubs-v5', 'public.kf_clubs'), (6, 'security-v6', 'public.kf_admin_auth'),
  (7, 'update-v7', 'public.kf_backups'), (8, 'social-v8', 'public.kf_friends'), (9, 'push-v9', 'public.kf_push_subs'),
  (10, 'insights-v10', 'public.kf_errors'), (11, 'admin-v11', 'public.kf_bans'), (12, 'staff-v12', 'public.kf_mods'),
  (13, 'community-v13', 'public.kf_feedback'), (14, 'server-v14', 'public.kf_schedule'), (15, 'stats-v15', 'public.kf_week_reports')
) v(p, n, t) where to_regclass(t) is not null
on conflict (part) do nothing;

-- 1. Indexes for every foreign key, primary keys for the three log tables, and the online counter --------------
create index if not exists kf_admin_push_mod     on public.kf_admin_push (mod_id);
create index if not exists kf_admin_sessions_mod on public.kf_admin_sessions (mod_id);
create index if not exists kf_club_msgs_account  on public.kf_club_msgs (account);
create index if not exists kf_club_reacts_acc    on public.kf_club_reacts (account);
create index if not exists kf_club_rewards_acc   on public.kf_club_rewards (account);
create index if not exists kf_club_week_account  on public.kf_club_week (account);
create index if not exists kf_club_week_club     on public.kf_club_week (club);
create index if not exists kf_clubs_owner        on public.kf_clubs (owner);
create index if not exists kf_device_bans_acc    on public.kf_device_bans (account);
create index if not exists kf_gifts_from         on public.kf_gifts (from_acc);
create index if not exists kf_push_queue_account on public.kf_push_queue (account);
create index if not exists kf_reports_reporter   on public.kf_reports (reporter);
create index if not exists kf_save_flags_account on public.kf_save_flags (account);
create index if not exists kf_sessions_account   on public.kf_sessions (account);
create index if not exists kf_wars_a             on public.kf_wars (club_a);
create index if not exists kf_wars_b             on public.kf_wars (club_b);
create index if not exists kf_presence_seen      on public.kf_presence (seen_at);
create index if not exists kf_rate_lookup        on public.kf_rate (kind, key, at);
alter table public.kf_login_fails add column if not exists id bigserial;
alter table public.kf_admin_fails add column if not exists id bigserial;
alter table public.kf_rate        add column if not exists id bigserial;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.kf_login_fails'::regclass and contype = 'p') then alter table public.kf_login_fails add primary key (id); end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.kf_admin_fails'::regclass and contype = 'p') then alter table public.kf_admin_fails add primary key (id); end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.kf_rate'::regclass and contype = 'p') then alter table public.kf_rate add primary key (id); end if;
end $$;

-- 2. Fixed search paths, and pg_net out of the public schema ------------------------------------------
alter function public.kf_ban_msg(timestamptz, text) set search_path = public;
alter function public.kf_b32(bytea) set search_path = public;
alter function public.kf_club_level(bigint) set search_path = public;
-- pg_net can't be moved, so it is reinstalled in "extensions". Its functions stay in the schema "net", where the push wake-up
-- (kf_push_kick) looks for them, so nothing else changes.
do $$ begin
  if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_net' and n.nspname = 'public') then
    drop extension pg_net;
    create extension pg_net schema extensions;
  end if;
end $$;

-- 3. Leftovers: the old leaderboard password table (replaced by the server password in part 6) --------------------
drop table if exists public.lb_admin;

-- 4. Accounts: recovery codes and the device list -------------------------------------------------------
alter table public.kf_accounts add column if not exists recovery_hash text;
alter table public.kf_accounts add column if not exists recovery_at timestamptz;
alter table public.kf_sessions add column if not exists label text check (char_length(label) <= 60);

-- status | new (shows a new one-time code once; the old one stops working)
create or replace function public.acc_recovery(p_token text, p_action text default 'status')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); c text; r record;
begin
  if p_action = 'new' then
    perform kf_rate_hit('recovery', 10, interval '1 hour');
    c := kf_b32(gen_random_bytes(10));
    update kf_accounts set recovery_hash = crypt(c, gen_salt('bf', 8)), recovery_at = now() where id = a;
  elsif p_action <> 'status' then raise exception 'unknown action'; end if;
  select recovery_hash is not null as on, recovery_at into r from kf_accounts where id = a;
  return json_build_object('on', r.on, 'at', r.recovery_at, 'code', c);
end $$;

-- A forgotten password: username + recovery code + new password. Same lockout as signing in; the code works once.
create or replace function public.acc_recover(p_user text, p_code text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record; u text := lower(btrim(coalesce(p_user, ''))); k text := kf_ip(); b record;
        c text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z2-7]', '', 'g');
begin
  delete from kf_login_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_login_fails where username = u) >= 8
     or (k is not null and (select count(*) from kf_rate where kind = 'login_fail' and key = k and at > now() - interval '15 minutes') >= 20) then
    return json_build_object('error', 'too many tries');
  end if;
  if char_length(coalesce(p_pass, '')) < 6 or char_length(p_pass) > 72 then return json_build_object('error', 'invalid password'); end if;
  select * into r from kf_accounts where lower(username) = u;
  if not found or r.recovery_hash is null or char_length(c) <> 16 or r.recovery_hash <> crypt(c, r.recovery_hash) then
    insert into kf_login_fails (username) values (u);
    if k is not null then insert into kf_rate (kind, key) values ('login_fail', k); end if;
    perform pg_sleep(1);
    return json_build_object('error', 'wrong username or code');
  end if;
  delete from kf_login_fails where username = u;
  select * into b from kf_bans where account = r.id;
  if found then
    if b.until is null or b.until > now() then
      return json_build_object('error', 'banned', 'until', b.until, 'reason', b.reason, 'username', r.username, 'appeal', kf_appeal_info(r.id));
    end if;
    perform kf_unban(r.id);
  end if;
  update kf_accounts set pass_hash = crypt(p_pass, gen_salt('bf', 10)), recovery_hash = null, recovery_at = null where id = r.id;
  delete from kf_sessions where account = r.id;
  return json_build_object('token', acc_new_session(r.id), 'username', r.username, 'recovered', true,
    'has_save', r.save_data is not null, 'save_at', r.save_at, 'save_baked', r.save_baked);
end $$;

-- list | name {label} (names this device) | remove {id} (signs out one other device)
create or replace function public.acc_devices(p_token text, p_action text default 'list', p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); h text := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex'); d json := coalesce(p_data, '{}'::json);
begin
  if p_action = 'name' then
    update kf_sessions set label = nullif(left(btrim(regexp_replace(coalesce(d->>'label', ''), '[[:cntrl:]<>]', '', 'g')), 60), '') where token_hash = h;
  elsif p_action = 'remove' then
    delete from kf_sessions where account = a and token_hash <> h and left(token_hash, 12) = coalesce(d->>'id', '');
  elsif p_action <> 'list' then raise exception 'unknown action'; end if;
  return coalesce((select json_agg(json_build_object('id', left(token_hash, 12), 'label', label, 'created_at', created_at, 'last_used', last_used,
      'current', token_hash = h) order by token_hash = h desc, last_used desc) from kf_sessions where account = a), '[]'::json);
end $$;

-- 5. Live signal for club chat (Supabase Realtime broadcast). Only "something changed" is sent, never the message itself;
-- members fetch the chat as before. The topic has a secret part that only members get.
create or replace function public.kf_rt_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'realtime' and p.proname = 'send');
$$;

alter table public.kf_clubs add column if not exists chat_key text;
update public.kf_clubs set chat_key = encode(extensions.gen_random_bytes(12), 'hex') where chat_key is null;
alter table public.kf_clubs alter column chat_key set default encode(extensions.gen_random_bytes(12), 'hex');

create or replace function public.club_rt(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); t text;
begin
  select 'kf-club-' || c.chat_key into t from kf_club_members m join kf_clubs c on c.id = m.club where m.account = a;
  return json_build_object('topic', t, 'on', t is not null and kf_rt_ok());
end $$;

create or replace function public.kf_club_signal() returns trigger
language plpgsql security definer set search_path = public as $$
declare cl uuid; t text;
begin
  if not kf_rt_ok() then return null; end if;
  if tg_table_name = 'kf_club_msgs' then cl := coalesce(new.club, old.club);
  else select m.club into cl from kf_club_msgs m where m.id = coalesce(new.msg_id, old.msg_id); end if;
  select 'kf-club-' || chat_key into t from kf_clubs where id = cl;
  if t is null then return null; end if;
  begin
    execute 'select realtime.send($1, $2, $3, false)' using jsonb_build_object('k', tg_table_name), 'chat', t;
  exception when others then null;   -- the chat never fails because of the live signal
  end;
  return null;
end $$;
drop trigger if exists kf_club_signal on public.kf_club_msgs;
create trigger kf_club_signal after insert or delete on public.kf_club_msgs for each row execute function public.kf_club_signal();
drop trigger if exists kf_club_signal on public.kf_club_reacts;
create trigger kf_club_signal after insert or delete on public.kf_club_reacts for each row execute function public.kf_club_signal();

-- 6. Health checks (every 10 minutes): stuck push messages, crash spikes, a full database, failed server jobs ---------
create or replace function public.kf_health_check() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb; stuck int; today int; avg7 numeric; pct numeric; failed int := 0; ck text;
  alert_once constant interval := interval '6 hours';
begin
  stuck := (select count(*) from kf_push_queue where sent_at is null and created_at < now() - interval '15 minutes' and created_at > now() - interval '2 days');
  today := coalesce((select n from kf_err_days where day = (now() at time zone 'UTC')::date), 0);
  avg7 := coalesce((select avg(n) from kf_err_days where day between (now() at time zone 'UTC')::date - 7 and (now() at time zone 'UTC')::date - 1), 0);
  pct := round((100 * pg_database_size(current_database()) / (500.0 * 1024 * 1024))::numeric, 1);
  if to_regclass('cron.job_run_details') is not null then
    execute 'select count(*) from cron.job_run_details where status = ''failed'' and start_time > now() - interval ''1 hour''' into failed;
  end if;
  r := jsonb_build_object('push_stuck', stuck, 'crashes_today', today, 'crashes_avg', round(avg7, 1), 'db_pct', pct, 'jobs_failed', failed);
  for ck in select unnest(array['push', 'crash', 'db', 'jobs']) loop
    if (ck = 'push' and stuck > 0) or (ck = 'crash' and today >= greatest(20, 3 * avg7)) or (ck = 'db' and pct >= 80) or (ck = 'jobs' and failed > 0) then
      if not exists (select 1 from kf_jobs where kf_jobs.k = 'alert:' || ck and kf_jobs.at > now() - alert_once) then
        insert into kf_jobs (k, at, info) values ('alert:' || ck, now(), r) on conflict (k) do update set at = now(), info = excluded.info;
        perform kf_admin_alert('health_' || ck, false, '🩺 Server: ' || case ck when 'push' then 'Push hängt' when 'crash' then 'Viele Abstürze' when 'db' then 'Datenbank fast voll' else 'Server-Job fehlgeschlagen' end,
          '🩺 Server: ' || case ck when 'push' then 'push is stuck' when 'crash' then 'many crashes' when 'db' then 'database almost full' else 'a server job failed' end,
          case ck when 'push' then stuck || ' Push-Nachrichten warten seit über 15 Minuten.' when 'crash' then today || ' Abstürze heute (sonst ' || round(avg7) || ').' when 'db' then 'Die Datenbank ist zu ' || pct || ' % voll.' else failed || ' Server-Jobs sind in der letzten Stunde fehlgeschlagen.' end,
          case ck when 'push' then stuck || ' push messages have waited for over 15 minutes.' when 'crash' then today || ' crashes today (usually ' || round(avg7) || ').' when 'db' then 'The database is ' || pct || '% full.' else failed || ' server jobs failed in the last hour.' end);
      end if;
    end if;
  end loop;
  insert into kf_jobs (k, at, info) values ('health', now(), r) on conflict (k) do update set at = now(), info = excluded.info;
  return r;
end $$;

-- The owner's health card: installed parts, server jobs and the latest checks
create or replace function public.admin_health(p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare jobs json := '[]'::json; cron boolean := to_regclass('cron.job') is not null;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if cron then
    execute $q$select coalesce(json_agg(json_build_object('name', j.jobname, 'schedule', j.schedule, 'active', j.active,
        'last_status', d.status, 'last_at', d.start_time, 'last_msg', left(d.return_message, 120)) order by j.jobname), '[]'::json)
      from cron.job j left join lateral (select status, start_time, return_message from cron.job_run_details x where x.jobid = j.jobid order by start_time desc limit 1) d on true
      where j.jobname like 'kf-%'$q$ into jobs;
  end if;
  return json_build_object(
    'schema', (select json_agg(json_build_object('part', part, 'name', name, 'at', applied_at) order by part) from kf_schema),
    'cron', cron, 'jobs', jobs, 'realtime', kf_rt_ok(),
    'checks', (select json_build_object('at', at, 'r', info) from kf_jobs where k = 'health'),
    'alerts', (select json_agg(json_build_object('k', substr(k, 7), 'at', at) order by at desc) from kf_jobs where k like 'alert:%'));
end $$;

-- 7. The minute ping: a limit against made-up player ids, and jobs only when the server has no clock of its own
create or replace function public.kf_ping(p_id uuid, p_baked double precision, p_lang text default null, p_dev text default null, p_src text default null)
returns json language plpgsql security definer set search_path = public as $$
declare old_b double precision; old_t timestamptz; hrs double precision; b double precision; l text; dv text; sr text; ip text;
begin
  b := coalesce(p_baked, 0);
  if b = 'NaN'::double precision or b < 0 then b := 0; end if;
  b := least(b, 9.9e299);
  l  := case when p_lang ~ '^[a-z]{2}$' then p_lang end;
  dv := case when p_dev in ('phone', 'tablet', 'desktop') then p_dev end;
  sr := case when p_src in ('web', 'app', 'portal') then p_src end;
  select baked, seen_at into old_b, old_t from kf_presence where id = p_id;
  if not found then
    -- one device may bring at most 30 new player ids an hour (a school or family network still fits); more are not counted
    ip := kf_ip();
    if ip is not null then
      if (select count(*) from kf_rate where kind = 'newid' and key = ip and at > now() - interval '1 hour') >= 30 then return kf_live(); end if;
      insert into kf_rate (kind, key) values ('newid', ip);
    end if;
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
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform kf_schedule_tick();
    if random() < 0.02 then perform kf_backup_tick(); perform kf_reminders(); perform kf_cleanup(); perform kf_week_report(); perform kf_health_check(); end if;
  end if;
  return kf_live();
end $$;

-- 8. Jobs on the server's own clock (pg_cron), so planned events start on time even when nobody plays -------------
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('kf-schedule',  '* * * * *',    'select public.kf_schedule_tick()');
    perform cron.schedule('kf-health',    '*/10 * * * *', 'select public.kf_health_check()');
    perform cron.schedule('kf-cleanup',   '7 */6 * * *',  'select public.kf_cleanup()');
    perform cron.schedule('kf-backup',    '23 3 * * *',   'select public.kf_backup_tick()');
    perform cron.schedule('kf-reminders', '41 16 * * *',  'select public.kf_reminders()');
    perform cron.schedule('kf-week',      '5 0 * * 1',    'select public.kf_week_report()');
    perform cron.schedule('kf-cron-tidy', '13 4 * * *',   $c$delete from cron.job_run_details where end_time < now() - interval '7 days'$c$);
  end if;
end $$;

insert into public.kf_schema (part, name) values (16, 'backend-v16') on conflict (part) do update set applied_at = now();

-- 9. Who may call what: the jobs now run on their own and are closed to the public ---------------------------
revoke all on function public.kf_backup_tick() from public, anon, authenticated;
revoke all on function public.kf_cleanup() from public, anon, authenticated;
revoke all on function public.kf_reminders() from public, anon, authenticated;
revoke all on function public.kf_schedule_tick() from public, anon, authenticated;
revoke all on function public.kf_week_report() from public, anon, authenticated;
revoke all on function public.kf_health_check() from public, anon, authenticated;
revoke all on function public.kf_club_signal() from public, anon, authenticated;
revoke all on function public.kf_rt_ok() from public, anon, authenticated;
revoke all on function public.acc_recovery(text, text) from public;
revoke all on function public.acc_recover(text, text, text) from public;
revoke all on function public.acc_devices(text, text, json) from public;
revoke all on function public.club_rt(text) from public;
revoke all on function public.admin_health(text) from public;
revoke all on function public.kf_ping(uuid, double precision, text, text, text) from public;
grant execute on function public.acc_recovery(text, text) to anon;
grant execute on function public.acc_recover(text, text, text) to anon;
grant execute on function public.acc_devices(text, text, json) to anon;
grant execute on function public.club_rt(text) to anon;
grant execute on function public.admin_health(text) to anon;
grant execute on function public.kf_ping(uuid, double precision, text, text, text) to anon;

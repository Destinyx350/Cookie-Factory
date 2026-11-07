-- Keksfabrik / Cookie Factory backups and leaderboard accounts, part 7 (game version 46)
-- Needs parts 1–6 first. Safe to run again. Never deletes scores, saves or accounts.

-- 1. Backups --------------------------------------------------------------------------------------
-- Snapshots of everything that matters, kept inside the database. A new automatic one is made at most
-- once a week (the keep-awake job and the game itself ask for it). The admin can make one any time and
-- download it as a file from the Server tab.
create table if not exists public.kf_backups (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  kind    text not null check (kind in ('auto', 'manual')),
  counts  jsonb not null,
  data    jsonb not null
);
alter table public.kf_backups enable row level security;
revoke all on public.kf_backups from anon, authenticated;

create or replace function public.kf_backup_make(p_kind text) returns bigint
language plpgsql security definer set search_path = public as $$
declare t text; d jsonb := '{}'::jsonb; c jsonb := '{}'::jsonb; rs jsonb; n bigint; new_id bigint;
begin
  foreach t in array array['leaderboard', 'lb_period', 'lb_rewards', 'lb_banned', 'lb_resets', 'kf_accounts', 'kf_clubs',
    'kf_club_members', 'kf_club_msgs', 'kf_club_week', 'kf_club_closed', 'kf_club_rewards', 'kf_gifts', 'kf_codes', 'kf_code_uses',
    'kf_news', 'kf_events', 'kf_mail', 'kf_mutes', 'kf_reports', 'kf_badwords', 'kf_config', 'kf_seasons'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb), count(*) from public.%I x', t) into rs, n;
      d := d || jsonb_build_object(t, rs);
      c := c || jsonb_build_object(t, n);
    end if;
  end loop;
  insert into kf_backups (kind, counts, data) values (p_kind, c, d) returning id into new_id;
  -- Keep the newest 6 of each kind.
  delete from kf_backups where kind = p_kind and id not in (select id from kf_backups where kind = p_kind order by id desc limit 6);
  return new_id;
end $$;

-- Makes the weekly automatic backup when it is due. Cheap when nothing is due.
create or replace function public.kf_backup_tick() returns json
language plpgsql security definer set search_path = public as $$
declare last timestamptz; made boolean := false;
begin
  select max(at) into last from kf_backups where kind = 'auto';
  if last is null or last < now() - interval '7 days' then
    perform pg_advisory_xact_lock(4242);
    select max(at) into last from kf_backups where kind = 'auto';
    if last is null or last < now() - interval '7 days' then perform kf_backup_make('auto'); made := true; last := now(); end if;
  end if;
  return json_build_object('made', made, 'last', last);
end $$;

-- The live ping now also asks for the weekly backup once in a while.
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
  if random() < 0.02 then perform kf_backup_tick(); end if;
  return kf_live();
end $$;

-- 2. Leaderboard spot belongs to the account ---------------------------------------------------------
alter table public.kf_accounts add column if not exists lb_id uuid;
create unique index if not exists kf_accounts_lb_id on public.kf_accounts (lb_id) where lb_id is not null;

-- Links this device's leaderboard entry to the account (only if the account has none yet) and returns
-- the account's entry, so a new device can take over the same spot.
create or replace function public.acc_lb_link(p_token text, p_lb uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); cur uuid; l record;
begin
  select lb_id into cur from kf_accounts where id = a;
  if cur is null and p_lb is not null and not exists (select 1 from kf_accounts where lb_id = p_lb) then
    update kf_accounts set lb_id = p_lb where id = a;
    cur := p_lb;
  end if;
  -- other_taken: the entry this device used belongs to a different account, so the game must not remove it.
  if cur is null then return json_build_object('lb_id', null); end if;
  select name, score, updated_at into l from leaderboard where id = cur;
  return json_build_object('lb_id', cur, 'name', l.name, 'score', l.score, 'updated_at', l.updated_at,
    'other_taken', p_lb is not null and exists (select 1 from kf_accounts where lb_id = p_lb and id <> a));
end $$;

create or replace function public.acc_me(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  select * into r from kf_accounts where id = acc_from_token(p_token);
  return json_build_object('username', r.username, 'has_save', r.save_data is not null, 'save_at', r.save_at,
    'save_baked', r.save_baked, 'created_at', r.created_at, 'lb_id', r.lb_id);
end $$;

-- Leaderboard names are now unique (ignoring upper/lower case). Existing entries keep their names.
create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_score double precision;
  old_time  timestamptz;
  old_name  text;
  hrs       double precision;
  new_score double precision;
  per       text;
begin
  if not kf_feat('lb') then return; end if;
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 2 or char_length(p_name) > 20 or p_name ~ '[<>]' then raise exception 'invalid name'; end if;
  if not kf_text_ok(p_name) then raise exception 'name not allowed'; end if;
  if p_score is null or p_score = 'NaN'::double precision or p_score < 0 or p_score >= 1e300 then raise exception 'invalid score'; end if;
  if exists (select 1 from lb_banned where id = p_id) then raise exception 'banned'; end if;
  select score, updated_at, name into old_score, old_time, old_name from leaderboard where id = p_id;
  if (old_name is null or lower(old_name) <> lower(p_name))
     and exists (select 1 from leaderboard where lower(name) = lower(p_name) and id <> p_id) then
    raise exception 'name taken';
  end if;
  perform lb_close_periods();

  if old_time is null then
    if p_score > 1e15 then raise exception 'score too high for a new entry'; end if;
    insert into leaderboard (id, name, score, updated_at) values (p_id, p_name, p_score, now());
    new_score := p_score;
    old_score := p_score;
  else
    if old_time > now() - interval '20 seconds' then return; end if;
    hrs := extract(epoch from (now() - old_time)) / 3600.0;
    if p_score > greatest(old_score, 1e8) * power(10::double precision, least(12 * hrs, 12)) then raise exception 'score grew too fast'; end if;
    update leaderboard set name = p_name, score = greatest(score, p_score), updated_at = now() where id = p_id
      returning score into new_score;
  end if;

  foreach per in array array[lb_week(now()), lb_month(now())] loop
    insert into lb_period (period, id, name, base, gain, updated_at)
    values (per, p_id, p_name, old_score, greatest(0, new_score - old_score), now())
    on conflict (period, id) do update
      set name = excluded.name,
          gain = greatest(lb_period.gain, new_score - lb_period.base),
          updated_at = now();
  end loop;
end $$;

-- 3. Admin: backups ----------------------------------------------------------------------------------
-- Separate function so admin_mod stays as it is: list, make, download, and restore one player's account.
create or replace function public.admin_backup(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); b record; e jsonb; r kf_accounts; n int := 0;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'make' then
    perform kf_log('backup: make', '');
    perform kf_backup_make('manual');
  elsif p_action = 'get' then
    perform kf_log('backup: download', d->>'id');
    select * into b from kf_backups where id = (d->>'id')::bigint;
    if not found then raise exception 'backup not found'; end if;
    return json_build_object('id', b.id, 'at', b.at, 'kind', b.kind, 'counts', b.counts, 'data', b.data);
  elsif p_action = 'restore_account' then
    -- Puts one account (and its save) back the way it was in the backup. Creates it again if it was deleted.
    select * into b from kf_backups where id = (d->>'id')::bigint;
    if not found then raise exception 'backup not found'; end if;
    select x into e from jsonb_array_elements(b.data->'kf_accounts') x where lower(x->>'username') = lower(btrim(coalesce(d->>'user', ''))) limit 1;
    if e is null then raise exception 'player not in this backup'; end if;
    r := jsonb_populate_record(null::kf_accounts, e);
    perform kf_log('backup: restore account', r.username || ' from backup ' || b.id);
    if exists (select 1 from kf_accounts where id = r.id) then
      update kf_accounts set save_data = r.save_data, save_at = now() - interval '1 minute', save_baked = r.save_baked, club_hw = r.club_hw where id = r.id;
    else
      if exists (select 1 from kf_accounts where lower(username) = lower(r.username)) then raise exception 'username taken'; end if;
      if r.lb_id is not null and exists (select 1 from kf_accounts where lb_id = r.lb_id) then r.lb_id := null; end if;
      insert into kf_accounts select r.*;
    end if;
    n := 1;
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return json_build_object('restored', n, 'backups', coalesce((select json_agg(json_build_object('id', id, 'at', at, 'kind', kind, 'counts', counts,
      'size', pg_column_size(data)) order by id desc) from kf_backups), '[]'::json));
end $$;

-- 4. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_backup_make(text) from public, anon, authenticated;
revoke all on function public.kf_backup_tick() from public;
revoke all on function public.acc_lb_link(text, uuid) from public;
revoke all on function public.admin_backup(text, text, json) from public;
grant execute on function public.kf_backup_tick() to anon;
grant execute on function public.acc_lb_link(text, uuid) to anon;
grant execute on function public.admin_backup(text, text, json) to anon;

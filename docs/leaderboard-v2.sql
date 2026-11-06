-- Keksfabrik / Cookie Factory leaderboard, part 2 (game version 40)
-- Adds weekly and monthly boards with prizes for the top 3, bans, remote game resets,
-- and admin tools. Run it once in Supabase: SQL Editor -> New query (empty) -> paste -> Run.
-- It is safe to run again. It never deletes scores.
--
-- After running it, set the admin password for the server once (the owner gets this line
-- privately; it is not stored in the repository):
--   insert into public.lb_admin (k, salt, hash) values (1, '<salt>', '<hash>')
--   on conflict (k) do update set salt = excluded.salt, hash = excluded.hash;

-- 1. Weekly and monthly boards: cookies baked during the period ------------------------------
create table if not exists public.lb_period (
  period      text not null,              -- 'W2026-45' (ISO week, UTC) or 'M2026-11' (month, UTC)
  id          uuid not null,
  name        text not null,
  base        double precision not null,  -- the player's score when this period started for them
  gain        double precision not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (period, id)
);
alter table public.lb_period enable row level security;
drop policy if exists "Anyone can read period boards" on public.lb_period;
create policy "Anyone can read period boards" on public.lb_period for select to anon using (true);
revoke all on public.lb_period from anon, authenticated;
grant select (period, name, gain, updated_at) on public.lb_period to anon;

-- 2. Prizes: the top 3 of every finished week and month -----------------------------------------
create table if not exists public.lb_rewards (
  period      text not null,
  place       int  not null,
  id          uuid not null,
  name        text not null,
  gain        double precision not null,
  claimed     boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (period, place)
);
alter table public.lb_rewards enable row level security;
drop policy if exists "Anyone can read winners" on public.lb_rewards;
create policy "Anyone can read winners" on public.lb_rewards for select to anon using (true);
revoke all on public.lb_rewards from anon, authenticated;
grant select (period, place, name, gain) on public.lb_rewards to anon;

-- 3. Moderation: bans, remote resets, admin password (none of these are readable by players) ----
create table if not exists public.lb_banned (id uuid primary key, name text, created_at timestamptz not null default now());
create table if not exists public.lb_resets (id uuid primary key, created_at timestamptz not null default now());
create table if not exists public.lb_admin  (k int primary key default 1 check (k = 1), salt text not null, hash text not null);
alter table public.lb_banned enable row level security;
alter table public.lb_resets enable row level security;
alter table public.lb_admin  enable row level security;
revoke all on public.lb_banned, public.lb_resets, public.lb_admin from anon, authenticated;

-- 4. Helpers ------------------------------------------------------------------------------------
create or replace function public.lb_week(t timestamptz) returns text language sql immutable as $$
  select 'W' || to_char(t at time zone 'UTC', 'IYYY-IW');
$$;
create or replace function public.lb_month(t timestamptz) returns text language sql immutable as $$
  select 'M' || to_char(t at time zone 'UTC', 'YYYY-MM');
$$;

-- Records the top 3 of every finished period that has no winners yet. Called automatically.
create or replace function public.lb_close_periods() returns void
language plpgsql security definer set search_path = public as $$
declare p text;
begin
  for p in
    select distinct lp.period from lb_period lp
    where lp.period not in (lb_week(now()), lb_month(now()))
      and not exists (select 1 from lb_rewards r where r.period = lp.period)
  loop
    insert into lb_rewards (period, place, id, name, gain)
    select p, x.rn, x.id, x.name, x.gain from (
      select lp.id, lp.name, lp.gain, row_number() over (order by lp.gain desc, lp.updated_at asc) as rn
      from lb_period lp
      where lp.period = p and lp.gain > 0 and not exists (select 1 from lb_banned b where b.id = lp.id)
    ) x
    where x.rn <= 3
    on conflict do nothing;
  end loop;
  delete from lb_period where updated_at < now() - interval '100 days';
end $$;

-- 5. Saving scores (replaces the old version; same checks plus bans and period boards) ----------
create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_score double precision;
  old_time  timestamptz;
  hrs       double precision;
  new_score double precision;
  per       text;
begin
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 2 or char_length(p_name) > 20 or p_name ~ '[<>]' then raise exception 'invalid name'; end if;
  if p_score is null or p_score = 'NaN'::double precision or p_score < 0 or p_score >= 1e300 then raise exception 'invalid score'; end if;
  if exists (select 1 from lb_banned where id = p_id) then raise exception 'banned'; end if;
  perform lb_close_periods();

  select score, updated_at into old_score, old_time from leaderboard where id = p_id;
  if not found then
    if p_score > 1e15 then raise exception 'score too high for a new entry'; end if;
    insert into leaderboard (id, name, score, updated_at) values (p_id, p_name, p_score, now());
    new_score := p_score;
    old_score := p_score;   -- a new player's period gain starts at 0
  else
    if old_time > now() - interval '20 seconds' then return; end if;
    hrs := extract(epoch from (now() - old_time)) / 3600.0;
    if p_score > greatest(old_score, 1e8) * power(10::double precision, least(12 * hrs, 290)) then raise exception 'score grew too fast'; end if;
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

-- Rank on a weekly or monthly board.
create or replace function public.lb_period_rank(p_period text, p_gain double precision)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) + 1 from lb_period where period = p_period and gain > p_gain;
$$;

-- Leaving also removes the player from the weekly and monthly boards.
create or replace function public.leave_leaderboard(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from leaderboard where id = p_id;
  delete from lb_period where id = p_id;
end $$;

-- What the game checks for a player: banned, reset requested, prizes waiting.
create or replace function public.lb_status(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform lb_close_periods();
  return json_build_object(
    'banned', exists (select 1 from lb_banned where id = p_id),
    'reset',  exists (select 1 from lb_resets where id = p_id),
    'rewards', (select count(*) from lb_rewards where id = p_id and not claimed));
end $$;

-- Hands out a player's prizes once.
create or replace function public.claim_lb_rewards(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare r json;
begin
  perform lb_close_periods();
  with c as (
    update lb_rewards set claimed = true where id = p_id and not claimed returning period, place, gain
  )
  select coalesce(json_agg(json_build_object('period', period, 'place', place, 'gain', gain)), '[]'::json) into r from c;
  return r;
end $$;

-- The game confirms that it has reset itself after an admin reset.
create or replace function public.ack_reset(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from lb_resets where id = p_id;
end $$;

-- 6. Admin tools (need the admin password) -------------------------------------------------------
create or replace function public.lb_admin_ok(p_pass text)
returns boolean language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select salt, hash into a from lb_admin where k = 1;
  if found and encode(sha256(convert_to(a.salt || coalesce(p_pass, ''), 'UTF8')), 'hex') = a.hash then
    return true;
  end if;
  perform pg_sleep(1);   -- slows down password guessing
  return false;
end $$;

create or replace function public.admin_lb(p_pass text, p_action text, p_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'list' then
    return json_build_object(
      'entries', coalesce((select json_agg(json_build_object('id', l.id, 'name', l.name, 'score', l.score, 'updated_at', l.updated_at,
                   'reset', exists (select 1 from lb_resets r where r.id = l.id)) order by l.score desc) from leaderboard l), '[]'::json),
      'banned',  coalesce((select json_agg(json_build_object('id', b.id, 'name', b.name, 'created_at', b.created_at) order by b.created_at desc) from lb_banned b), '[]'::json),
      'resets',  (select count(*) from lb_resets));
  elsif p_action = 'remove' then
    delete from leaderboard where id = p_id;
    delete from lb_period where id = p_id;
  elsif p_action = 'ban' then
    insert into lb_banned (id, name) values (p_id, (select name from leaderboard where id = p_id)) on conflict (id) do nothing;
    delete from leaderboard where id = p_id;
    delete from lb_period where id = p_id;
  elsif p_action = 'unban' then
    delete from lb_banned where id = p_id;
  elsif p_action = 'reset' then
    insert into lb_resets (id) values (p_id) on conflict (id) do nothing;
    delete from leaderboard where id = p_id;
    delete from lb_period where id = p_id;
  elsif p_action = 'clear' then
    delete from leaderboard where true;
    delete from lb_period where true;
  else
    raise exception 'unknown action';
  end if;
  return json_build_object('ok', true);
end $$;

-- 7. Who may call what ----------------------------------------------------------------------------
revoke all on function public.lb_close_periods() from public;
revoke all on function public.lb_admin_ok(text) from public;
revoke all on function public.submit_score(uuid, text, double precision) from public;
revoke all on function public.lb_period_rank(text, double precision) from public;
revoke all on function public.leave_leaderboard(uuid) from public;
revoke all on function public.lb_status(uuid) from public;
revoke all on function public.claim_lb_rewards(uuid) from public;
revoke all on function public.ack_reset(uuid) from public;
revoke all on function public.admin_lb(text, text, uuid) from public;
grant execute on function public.submit_score(uuid, text, double precision) to anon;
grant execute on function public.lb_period_rank(text, double precision) to anon;
grant execute on function public.leave_leaderboard(uuid) to anon;
grant execute on function public.lb_status(uuid) to anon;
grant execute on function public.claim_lb_rewards(uuid) to anon;
grant execute on function public.ack_reset(uuid) to anon;
grant execute on function public.admin_lb(text, text, uuid) to anon;

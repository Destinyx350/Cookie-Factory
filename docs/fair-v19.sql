-- Keksfabrik / Cookie Factory: fair play, part 19 (game version 67)
-- Needs parts 1–18 first. Safe to run again.

-- 1. Server time for the game's clock check -----------------------------------------------------------
-- The game compares its device clock with this, so moving the clock forward no longer gives offline cookies or extra daily rewards.
create or replace function public.kf_now() returns double precision
language sql stable security definer set search_path = public as $$ select extract(epoch from clock_timestamp()) * 1000 $$;

-- 2. Leaderboard score limit by play time ---------------------------------------------------------------
-- Every spot remembers when it joined. Spots that were already there count as 30 days old (no limit for them).
alter table public.leaderboard add column if not exists created_at timestamptz;
update public.leaderboard set created_at = now() - interval '30 days' where created_at is null;
alter table public.leaderboard alter column created_at set default now();
alter table public.leaderboard alter column created_at set not null;

create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision, p_token text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  old_score double precision;
  old_time  timestamptz;
  old_name  text;
  hrs       double precision;
  new_score double precision;
  per       text;
  acc       uuid;
  cur       uuid;
  born      timestamptz;
  c         double precision;
begin
  if not kf_feat('lb') then return; end if;
  -- v18: only accounts are on the leaderboard, always under their username (p_name is ignored)
  select id, username into acc, p_name from kf_accounts where lb_id = p_id;
  if acc is null and coalesce(p_token, '') <> '' then
    acc := acc_from_token(p_token);
    select lb_id, username into cur, p_name from kf_accounts where id = acc;
    if cur is not null and cur <> p_id then raise exception 'account has another spot'; end if;
    update kf_accounts set lb_id = p_id where id = acc and lb_id is null;
  end if;
  if acc is null then raise exception 'account needed'; end if;
  if p_score is null or p_score = 'NaN'::double precision or p_score < 0 or p_score >= 1e300 then raise exception 'invalid score'; end if;
  if exists (select 1 from lb_banned where id = p_id) then raise exception 'banned'; end if;
  select score, updated_at, name, created_at into old_score, old_time, old_name, born from leaderboard where id = p_id;
  if (old_name is null or lower(old_name) <> lower(p_name))
     and exists (select 1 from leaderboard where lower(name) = lower(p_name) and id <> p_id) then
    raise exception 'name taken';
  end if;
  perform lb_close_periods();

  -- v19: a spot can only be as high as its age allows (1e9 when new, about x31 per hour after that),
  -- so a fresh account can't jump to the top. Both this and the growth limit clamp the score instead of rejecting it.
  c := least(p_score, power(10::double precision, least(300, 9 + 1.5 * coalesce(extract(epoch from (now() - born)) / 3600.0, 0))));
  if old_time is null then
    insert into leaderboard (id, name, score, updated_at) values (p_id, p_name, c, now());
    new_score := c;
    old_score := c;
  else
    if old_time > now() - interval '20 seconds' then return; end if;
    hrs := extract(epoch from (now() - old_time)) / 3600.0;
    c := least(c, greatest(old_score, 1e8) * power(10::double precision, least(12 * hrs, 12)));
    update leaderboard set name = p_name, score = greatest(score, c), updated_at = now() where id = p_id
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


-- 3. Clicks board: at most 20 clicks a second, like the game ---------------------------------------
create or replace function public.submit_stats(p_id uuid, p_clicks double precision, p_gold double precision, p_asc double precision, p_fast int default null)
returns json language plpgsql security definer set search_path = public as $$
declare o lb_stats%rowtype; secs double precision; c double precision; g double precision; a double precision; f int; wk text := kf_week_key();
begin
  if not exists (select 1 from leaderboard where id = p_id) then raise exception 'not on the leaderboard'; end if;
  if exists (select 1 from lb_banned where id = p_id) then raise exception 'banned'; end if;
  c := case when p_clicks is null or p_clicks = 'NaN'::double precision then 0 else greatest(0, least(p_clicks, 1e15)) end;
  g := case when p_gold is null or p_gold = 'NaN'::double precision then 0 else greatest(0, least(p_gold, 1e12)) end;
  a := case when p_asc is null or p_asc = 'NaN'::double precision then 0 else greatest(0, least(p_asc, 1e9)) end;
  select * into o from lb_stats where id = p_id for update;
  if not found then
    insert into lb_stats (id, clicks, gold, ascs) values (p_id, least(c, 1e8), least(g, 1e6), least(a, 1e5)) returning * into o;
  else
    secs := greatest(1, extract(epoch from (now() - o.updated_at)));
    update lb_stats set
      clicks = greatest(o.clicks, least(c, o.clicks + 20 * secs + 200)),      -- at most 20 clicks a second (the game's own limit)
      gold   = greatest(o.gold,   least(g, o.gold + secs / 3 + 5)),          -- at most one golden cookie every 3 s
      ascs   = greatest(o.ascs,   least(a, o.ascs + secs / 60 + 1)),          -- at most one ascension a minute
      updated_at = now()
    where id = p_id returning * into o;
  end if;
  f := case when p_fast between 1 and 7 * 86400 then greatest(10, p_fast) end;   -- 10 s is the fastest that counts
  if f is not null and (o.fast_wk is distinct from wk or o.fast is null or f < o.fast) then
    update lb_stats set fast = f, fast_wk = wk, fast_at = now() where id = p_id returning * into o;
  end if;
  return json_build_object('clicks', o.clicks, 'gold', o.gold, 'asc', o.ascs, 'fast', case when o.fast_wk = wk then o.fast end);
end $$;


insert into public.kf_schema (part, name) values (19, 'fair-v19') on conflict (part) do update set applied_at = now();

-- 4. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_now() from public;
revoke all on function public.submit_score(uuid, text, double precision, text) from public;
revoke all on function public.submit_stats(uuid, double precision, double precision, double precision, int) from public;
grant execute on function public.kf_now() to anon;
grant execute on function public.submit_score(uuid, text, double precision, text) to anon;
grant execute on function public.submit_stats(uuid, double precision, double precision, double precision, int) to anon;

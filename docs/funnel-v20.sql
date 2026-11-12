-- Keksfabrik / Cookie Factory: new-player funnel, part 20 (game version 68)
-- Needs parts 1–19 first. Safe to run again.

-- 1. Journey steps remember the game version and where the game runs ------------------------------------
-- So the admin panel can show whether an update helped new players (version 68 and later vs. before).
alter table public.kf_steps add column if not exists ver int;
alter table public.kf_steps add column if not exists src text;

drop function if exists public.kf_track(uuid, text);
create or replace function public.kf_track(p_id uuid, p_step text, p_ver int default null, p_src text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_id is null or p_step not in ('open', 'play', 'tut1', 'click50', 'build1', 'up1', 'tut3', 'tut5', 'tutdone', 'bld25', 'world', 'asc1',
                                    'acc', 'club', 'lb', 'push', 'comeback', 'chest1', 'chest2', 'chest3') then return; end if;
  if exists (select 1 from kf_steps where id = p_id and step = p_step) then return; end if;
  perform kf_rate_hit('track', 120, interval '1 hour');
  insert into kf_steps (id, step, ver, src) values (p_id, p_step,
    case when p_ver between 1 and 100000 then p_ver end,
    case when p_src in ('web', 'app', 'portal') then p_src end)
  on conflict do nothing;
end $$;

-- 2. Admin: funnel for new players, grouped by the version they started with ---------------------------
-- New players = players whose 'open' step is in the time range. back1 = came back on a later day
-- (only counted for players who started at least 2 days ago, so the number isn't too low for the newest ones).
create or replace function public.admin_funnel(p_pass text, p_days int default 30, p_src text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d int := greatest(1, least(coalesce(p_days, 30), 365)); r json;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  with c as (
    select o.id, coalesce(o.ver, 0) ver, o.at,
           coalesce(o.src, (select k.src from kf_days k where k.id = o.id and k.src is not null order by k.day limit 1)) src
    from kf_steps o where o.step = 'open' and o.at > now() - make_interval(days => d)
  ), f as (
    select * from c where p_src is null or p_src = '' or src = p_src
  ), g as (
    select f.ver, count(*) n,
           count(*) filter (where f.at < now() - interval '2 days') back_n,
           count(*) filter (where f.at < now() - interval '2 days'
                              and exists (select 1 from kf_days k where k.id = f.id and k.day > (f.at at time zone 'UTC')::date)) back,
           (select coalesce(json_object_agg(step, m), '{}'::json) from (
              select s.step, count(*) m from kf_steps s join f f2 on f2.id = s.id where f2.ver = f.ver group by s.step) z) steps
    from f group by f.ver
  )
  select json_build_object(
    'days', d, 'src', nullif(p_src, ''),
    'srcs', coalesce((select json_object_agg(coalesce(src, '?'), n) from (select src, count(*) n from c group by src) s), '{}'::json),
    'groups', coalesce((select json_agg(json_build_object('ver', ver, 'n', n, 'back_n', back_n, 'back', back, 'steps', steps) order by ver desc) from g), '[]'::json))
  into r;
  return r;
end $$;

insert into public.kf_schema (part, name) values (20, 'funnel-v20') on conflict (part) do update set applied_at = now();

-- 3. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_track(uuid, text, int, text) from public;
revoke all on function public.admin_funnel(text, int, text) from public;
grant execute on function public.kf_track(uuid, text, int, text) to anon;
grant execute on function public.admin_funnel(text, int, text) to anon;

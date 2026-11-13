-- Keksfabrik / Cookie Factory: play time, part 21 (game version 69)
-- Needs parts 1–20 first. Safe to run again.

-- 1. Play time per player and day ---------------------------------------------------------------------
-- The game pings the server every minute while it is open and visible. The time between two pings counts
-- as play time when it is at most 3 minutes; a longer gap (or the first ping) starts a new session.
alter table public.kf_days add column if not exists play_s int not null default 0;
alter table public.kf_days add column if not exists sess int not null default 0;

create or replace function public.kf_play_note()
returns trigger language plpgsql security definer set search_path = public as $$
declare g double precision; d date := (now() at time zone 'UTC')::date;
begin
  if tg_op = 'INSERT' then
    insert into kf_days (id, day, sess) values (new.id, d, 1)
    on conflict (id, day) do update set sess = kf_days.sess + 1;
    return new;
  end if;
  if new.seen_at is null or old.seen_at is null or new.seen_at <= old.seen_at then return new; end if;
  g := extract(epoch from (new.seen_at - old.seen_at));
  if g <= 180 then
    insert into kf_days (id, day, play_s) values (new.id, d, round(g)::int)
    on conflict (id, day) do update set play_s = least(86400, kf_days.play_s + excluded.play_s);
  else
    insert into kf_days (id, day, sess) values (new.id, d, 1)
    on conflict (id, day) do update set sess = kf_days.sess + 1;
  end if;
  return new;
end $$;

drop trigger if exists kf_play_note on public.kf_presence;
create trigger kf_play_note after insert or update of seen_at on public.kf_presence
  for each row execute function public.kf_play_note();

-- 2. Admin: play time --------------------------------------------------------------------------------
-- days: per day the players who played, average minutes per player and average session length.
-- first_day: minutes on the first day, for new players grouped by the version they started on (journey step 'open').
create or replace function public.admin_playtime(p_pass text, p_days int default 30, p_src text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d int := greatest(1, least(coalesce(p_days, 30), 365)); s text := nullif(p_src, ''); r json;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  with k as (
    select * from kf_days where day > (now() at time zone 'UTC')::date - d and (play_s > 0 or sess > 0)
      and (s is null or src = s or (src is null and exists (select 1 from kf_days k2 where k2.id = kf_days.id and k2.src = s)))
  ), n as (
    select o.id, coalesce(o.ver, 0) ver, (o.at at time zone 'UTC')::date d0 from kf_steps o
    where o.step = 'open' and o.at > now() - make_interval(days => d)
  )
  select json_build_object(
    'days', d, 'src', s,
    'since', (select min(day) from kf_days where play_s > 0),
    'total', (select json_build_object('player_days', count(*), 'avg_min', round(coalesce(avg(play_s), 0) / 60.0, 1),
                'sess_min', round(coalesce(sum(play_s)::numeric / nullif(sum(greatest(sess, 1)), 0), 0) / 60.0, 1),
                'sess_per_day', round(coalesce(avg(greatest(sess, 1)), 0), 2),
                'ten_plus', round(100.0 * count(*) filter (where play_s >= 600) / nullif(count(*), 0))) from k where play_s > 0),
    'per_day', coalesce((select json_agg(json_build_object('day', g::date,
                'players', (select count(*) from k where k.day = g::date and k.play_s > 0),
                'avg_min', (select round(coalesce(avg(play_s), 0) / 60.0, 1) from k where k.day = g::date and k.play_s > 0)) order by g)
              from generate_series((now() at time zone 'UTC')::date - least(d, 120) + 1, (now() at time zone 'UTC')::date, interval '1 day') g), '[]'::json),
    'by_src', coalesce((select json_agg(json_build_object('k', coalesce(src, '?'), 'n', n, 'avg_min', m) order by n desc)
              from (select src, count(*) n, round(avg(play_s) / 60.0, 1) m from k where play_s > 0 group by src) x), '[]'::json),
    'first_day', coalesce((select json_agg(json_build_object('ver', ver, 'n', c, 'avg_min', m) order by ver desc)
              from (select n.ver, count(*) c, round(avg(coalesce(k.play_s, 0)) / 60.0, 1) m
                    from n left join k on k.id = n.id and k.day = n.d0
                    where s is null or k.src = s
                    group by n.ver) y), '[]'::json))
  into r;
  return r;
end $$;

-- 3. Journey: did the browser agree to keep the save? ('keep' / 'nokeep') -------------------------------
create or replace function public.kf_track(p_id uuid, p_step text, p_ver int default null, p_src text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_id is null or p_step not in ('open', 'play', 'tut1', 'click50', 'build1', 'up1', 'tut3', 'tut5', 'tutdone', 'bld25', 'world', 'asc1',
                                    'acc', 'club', 'lb', 'push', 'comeback', 'chest1', 'chest2', 'chest3', 'keep', 'nokeep') then return; end if;
  if exists (select 1 from kf_steps where id = p_id and step = p_step) then return; end if;
  perform kf_rate_hit('track', 120, interval '1 hour');
  insert into kf_steps (id, step, ver, src) values (p_id, p_step,
    case when p_ver between 1 and 100000 then p_ver end,
    case when p_src in ('web', 'app', 'portal') then p_src end)
  on conflict do nothing;
end $$;

insert into public.kf_schema (part, name) values (21, 'playtime-v21') on conflict (part) do update set applied_at = now();

-- 4. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_play_note() from public, anon, authenticated;
revoke all on function public.admin_playtime(text, int, text) from public;
revoke all on function public.kf_track(uuid, text, int, text) from public;
grant execute on function public.admin_playtime(text, int, text) to anon;
grant execute on function public.kf_track(uuid, text, int, text) to anon;

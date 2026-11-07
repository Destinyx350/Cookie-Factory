-- Keksfabrik / Cookie Factory crash reports, player journey, comeback reminders and chat extras, part 10 (game version 51)
-- Needs parts 1–9 first. Safe to run again. Never deletes scores, saves or accounts.

-- 1. Tables ----------------------------------------------------------------------------------------
-- Crash reports from players' browsers, grouped by message and place.
create table if not exists public.kf_errors (
  fp          text primary key,
  msg         text not null,
  src         text not null default '',
  stack       text not null default '',
  ver         int not null default 0,
  ua          text not null default '',
  count       int not null default 1,
  first_at    timestamptz not null default now(),
  last_at     timestamptz not null default now()
);
-- Player journey: which milestones each anonymous player reached, and on which days they played.
create table if not exists public.kf_steps (id uuid not null, step text not null, at timestamptz not null default now(), primary key (id, step));
create table if not exists public.kf_days (id uuid not null, day date not null, primary key (id, day));
-- Club chat: emoji reactions and one pinned message per club.
create table if not exists public.kf_club_reacts (
  msg_id      bigint not null references public.kf_club_msgs(id) on delete cascade,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  emoji       text not null check (emoji in ('👍', '❤️', '😂', '🎉', '🍪')),
  primary key (msg_id, account, emoji)
);
alter table public.kf_clubs add column if not exists pinned bigint;
-- Comeback reminders: when the last push reminder went out.
alter table public.kf_accounts add column if not exists reminded_at timestamptz;

alter table public.kf_errors      enable row level security;
alter table public.kf_steps       enable row level security;
alter table public.kf_days        enable row level security;
alter table public.kf_club_reacts enable row level security;
revoke all on public.kf_errors, public.kf_steps, public.kf_days, public.kf_club_reacts from anon, authenticated;

-- 2. Crash reports --------------------------------------------------------------------------------
create or replace function public.kf_report_error(p_msg text, p_stack text default '', p_src text default '', p_ver int default 0, p_ua text default '')
returns void language plpgsql security definer set search_path = public, extensions as $$
declare m text := left(btrim(coalesce(p_msg, '')), 300); s text := left(coalesce(p_src, ''), 200); f text;
begin
  if m = '' then return; end if;
  perform kf_rate_hit('error', 20, interval '1 hour');
  f := md5(m || '|' || s);
  insert into kf_errors (fp, msg, src, stack, ver, ua) values (f, m, s, left(coalesce(p_stack, ''), 2000), coalesce(p_ver, 0), left(coalesce(p_ua, ''), 200))
  on conflict (fp) do update set count = kf_errors.count + 1, last_at = now(), ver = greatest(kf_errors.ver, excluded.ver),
    stack = case when excluded.stack <> '' then excluded.stack else kf_errors.stack end, ua = excluded.ua;
  if random() < 0.05 then delete from kf_errors where fp not in (select fp from kf_errors order by last_at desc limit 300); end if;
end $$;

-- 3. Player journey -------------------------------------------------------------------------------
create or replace function public.kf_track(p_id uuid, p_step text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_id is null or p_step not in ('open', 'click50', 'build1', 'up1', 'tut5', 'tutdone', 'bld25', 'world', 'asc1', 'acc', 'club', 'lb', 'push', 'comeback') then return; end if;
  if exists (select 1 from kf_steps where id = p_id and step = p_step) then return; end if;
  perform kf_rate_hit('track', 120, interval '1 hour');
  insert into kf_steps (id, step) values (p_id, p_step) on conflict do nothing;
end $$;

-- The live ping now also notes the day (for "came back" numbers) and now and then sends comeback reminders.
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
  if random() < 0.02 then perform kf_backup_tick(); perform kf_reminders(); end if;
  if random() < 0.002 then delete from kf_days where day < (now() at time zone 'UTC')::date - 120; end if;
  return kf_live();
end $$;

-- 4. Comeback reminders: a push to players away for 3+ days, once per absence ------------------------
create or replace function public.kf_reminders()
returns json language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select a.id from kf_accounts a
           where greatest(coalesce(a.save_at, a.created_at), coalesce(a.last_login, a.created_at)) < now() - interval '3 days'
             and (a.reminded_at is null or a.reminded_at < greatest(coalesce(a.save_at, a.created_at), coalesce(a.last_login, a.created_at)))
             and exists (select 1 from kf_push_subs s where s.account = a.id)
           limit 200 loop
    perform kf_push(r.id, '🍪 Deine Bäckerei vermisst dich!', '🍪 Your bakery misses you!',
      'Komm zurück und hol dir dein Willkommensgeschenk.', 'Come back for your welcome-back gift.');
    update kf_accounts set reminded_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return json_build_object('sent', n);
end $$;

-- 5. Club chat: reactions and pinned message -------------------------------------------------------
create or replace function public.club_react(p_token text, p_msg bigint, p_emoji text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token);
begin
  if p_emoji not in ('👍', '❤️', '😂', '🎉', '🍪') then raise exception 'invalid emoji'; end if;
  if not exists (select 1 from kf_club_msgs m join kf_club_members cm on cm.club = m.club and cm.account = a where m.id = p_msg) then raise exception 'message not found'; end if;
  if exists (select 1 from kf_club_reacts where msg_id = p_msg and account = a and emoji = p_emoji) then
    delete from kf_club_reacts where msg_id = p_msg and account = a and emoji = p_emoji;
  else
    insert into kf_club_reacts (msg_id, account, emoji) values (p_msg, a, p_emoji);
  end if;
  return club_mine(p_token);
end $$;

create or replace function public.club_pin(p_token text, p_msg bigint default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record;
begin
  select * into m from kf_club_members where account = a;
  if not found or m.role <> 'owner' then raise exception 'only the owner can do that'; end if;
  if p_msg is not null and not exists (select 1 from kf_club_msgs where id = p_msg and club = m.club) then raise exception 'message not found'; end if;
  update kf_clubs set pinned = p_msg where id = m.club;
  return club_mine(p_token);
end $$;

-- club_mine now also returns reactions and the pinned message (replaces part 8's version).
create or replace function public.club_mine(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; cl record; wk text := lb_week(now()); total double precision; rk bigint; w record;
begin
  perform kf_war_close();
  perform kf_war_pair();
  select * into m from kf_club_members where account = a;
  if not found then return json_build_object('club', null); end if;
  select * into cl from kf_clubs where id = m.club;
  total := coalesce((select sum(gain) from kf_club_week where club = cl.id and week = wk), 0);
  rk := (select count(*) + 1 from (select club, sum(gain) s from kf_club_week where week = wk group by club) x where x.s > total);
  select * into w from kf_wars where (club_a = cl.id or club_b = cl.id) order by id desc limit 1;
  return json_build_object(
    'club', json_build_object('id', cl.id, 'name', cl.name, 'emoji', cl.emoji, 'descr', cl.descr, 'open', cl.open, 'trophies', cl.trophies),
    'role', m.role, 'week_gain', total, 'rank', rk, 'weekend', kf_weekend(),
    'war', case when w.id is null then null else json_build_object(
        'wk', w.wk, 'current', w.wk = wk and not w.closed,
        'me', case when w.club_a = cl.id then w.a_gain else w.b_gain end,
        'them', case when w.club_a = cl.id then w.b_gain else w.a_gain end,
        'vs', case when w.club_a = cl.id then w.b_name else w.a_name end,
        'vs_emoji', case when w.club_a = cl.id then w.b_emoji else w.a_emoji end,
        'closed', w.closed, 'won', w.winner = cl.id, 'tie', w.closed and w.winner is null) end,
    'members', (select json_agg(json_build_object('username', ac.username, 'role', mm.role,
                  'gain', coalesce((select gain from kf_club_week w2 where w2.account = mm.account and w2.week = wk and w2.club = cl.id), 0))
                  order by mm.role desc, mm.joined_at)
                from kf_club_members mm join kf_accounts ac on ac.id = mm.account where mm.club = cl.id),
    'pinned', (select json_build_object('id', p.id, 'username', p.username, 'body', p.body) from kf_club_msgs p where p.id = cl.pinned and p.club = cl.id),
    'msgs', coalesce((select json_agg(json_build_object('id', z.id, 'username', z.username, 'body', z.body, 'created_at', z.created_at,
                  'reacts', coalesce((select json_agg(json_build_object('e', r.emoji, 'n', r.n, 'mine', r.mine) order by r.emoji)
                    from (select emoji, count(*) n, bool_or(account = a) mine from kf_club_reacts where msg_id = z.id group by emoji) r), '[]'::json)) order by z.id)
                from (select * from kf_club_msgs where club = cl.id order by id desc limit 50) z), '[]'::json));
end $$;


-- 6. Admin: crash reports and player journey --------------------------------------------------------
create or replace function public.admin_insights(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json);
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'error_done' then
    perform kf_log('insights: crash fixed', left(coalesce((select msg from kf_errors where fp = d->>'fp'), ''), 200));
    delete from kf_errors where fp = d->>'fp';
  elsif p_action = 'errors_clear' then
    perform kf_log('insights: clear crash list', '');
    delete from kf_errors where true;
  elsif p_action = 'journey' then
    return json_build_object(
      'new30', (select count(*) from kf_presence where first_seen > now() - interval '30 days'),
      'steps', coalesce((select json_object_agg(step, n) from (select s.step, count(*) n from kf_steps s join kf_presence p on p.id = s.id
                 where p.first_seen > now() - interval '30 days' group by s.step) x), '{}'::json),
      'cohort', (select count(*) from kf_presence where first_seen between now() - interval '30 days' and now() - interval '2 days'),
      'back1', (select count(*) from kf_presence p where p.first_seen between now() - interval '30 days' and now() - interval '2 days'
                 and exists (select 1 from kf_days d where d.id = p.id and d.day > (p.first_seen at time zone 'UTC')::date)),
      'cohort7', (select count(*) from kf_presence where first_seen between now() - interval '30 days' and now() - interval '8 days'),
      'back7', (select count(*) from kf_presence p where p.first_seen between now() - interval '30 days' and now() - interval '8 days'
                 and exists (select 1 from kf_days d where d.id = p.id and d.day >= (p.first_seen at time zone 'UTC')::date + 7)),
      'daily', coalesce((select json_agg(json_build_object('day', dd::date, 'n', (select count(*) from kf_days k where k.day = dd::date)) order by dd)
                 from generate_series(current_date - 13, current_date, interval '1 day') dd), '[]'::json));
  elsif p_action <> 'errors' then
    raise exception 'unknown action';
  end if;
  return coalesce((select json_agg(json_build_object('fp', fp, 'msg', msg, 'src', src, 'stack', stack, 'ver', ver, 'ua', ua, 'count', count,
      'first_at', first_at, 'last_at', last_at) order by last_at desc) from (select * from kf_errors order by last_at desc limit 100) e), '[]'::json);
end $$;

-- 7. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_reminders() from public;
revoke all on function public.kf_report_error(text, text, text, int, text) from public;
revoke all on function public.kf_track(uuid, text) from public;
revoke all on function public.club_react(text, bigint, text) from public;
revoke all on function public.club_pin(text, bigint) from public;
revoke all on function public.admin_insights(text, text, json) from public;
grant execute on function public.kf_reminders() to anon;
grant execute on function public.kf_report_error(text, text, text, int, text) to anon;
grant execute on function public.kf_track(uuid, text) to anon;
grant execute on function public.club_react(text, bigint, text) to anon;
grant execute on function public.club_pin(text, bigint) to anon;
grant execute on function public.admin_insights(text, text, json) to anon;

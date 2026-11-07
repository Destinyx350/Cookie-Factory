-- Keksfabrik / Cookie Factory profiles, friends, club wars and invites, part 8 (game version 48)
-- Needs parts 1–7 first. Safe to run again. Never deletes scores, saves or accounts.

-- 1. Tables ----------------------------------------------------------------------------------------
alter table public.kf_accounts add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.kf_clubs add column if not exists trophies int not null default 0;

create table if not exists public.kf_friends (
  a           uuid not null references public.kf_accounts(id) on delete cascade,   -- who asked
  b           uuid not null references public.kf_accounts(id) on delete cascade,   -- who was asked
  status      text not null default 'pending' check (status in ('pending', 'ok')),
  created_at  timestamptz not null default now(),
  primary key (a, b),
  check (a <> b)
);
create index if not exists kf_friends_b on public.kf_friends (b);

-- Club wars: every weekend (Saturday and Sunday, UTC) clubs are paired by this week's baking so far.
create table if not exists public.kf_wars (
  id          bigserial primary key,
  wk          text not null,
  club_a      uuid references public.kf_clubs(id) on delete set null,
  club_b      uuid references public.kf_clubs(id) on delete set null,
  a_name      text not null,
  b_name      text not null,
  a_emoji     text not null default '🍪',
  b_emoji     text not null default '🍪',
  a_gain      double precision not null default 0,
  b_gain      double precision not null default 0,
  winner      uuid,
  closed      boolean not null default false
);
create unique index if not exists kf_wars_a on public.kf_wars (wk, club_a);
create unique index if not exists kf_wars_b on public.kf_wars (wk, club_b);

create table if not exists public.kf_referrals (
  invitee     uuid primary key references public.kf_accounts(id) on delete cascade,
  inviter     uuid not null references public.kf_accounts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  rewarded    boolean not null default false
);
create index if not exists kf_referrals_inviter on public.kf_referrals (inviter);

alter table public.kf_friends    enable row level security;
alter table public.kf_wars       enable row level security;
alter table public.kf_referrals  enable row level security;
revoke all on public.kf_friends, public.kf_wars, public.kf_referrals from anon, authenticated;

-- 2. Club wars (internal) --------------------------------------------------------------------------
-- (kf.test_weekend only exists in the automatic tests; players can't set it.)
create or replace function public.kf_weekend() returns boolean language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('kf.test_weekend', true), '')::boolean, extract(isodow from (now() at time zone 'UTC')) in (6, 7));
$$;

-- Pairs clubs for the weekend: 1st vs 2nd, 3rd vs 4th, … by cookies baked this week so far.
-- Clubs that start baking later in the weekend are paired with each other as soon as two are waiting.
create or replace function public.kf_war_pair() returns void
language plpgsql security definer set search_path = public as $$
declare wk text := lb_week(now()); r record; prev record; have boolean := false;
begin
  if not kf_weekend() then return; end if;
  perform pg_advisory_xact_lock(4343);
  for r in select c.id, c.name, c.emoji, coalesce(sum(w.gain), 0) g
           from kf_clubs c join kf_club_week w on w.club = c.id and w.week = wk
           where not exists (select 1 from kf_wars x where x.wk = lb_week(now()) and (x.club_a = c.id or x.club_b = c.id))
           group by c.id, c.name, c.emoji having coalesce(sum(w.gain), 0) > 0 order by 4 desc loop
    if not have then prev := r; have := true;
    else
      insert into kf_wars (wk, club_a, club_b, a_name, b_name, a_emoji, b_emoji)
      values (wk, prev.id, r.id, prev.name, r.name, prev.emoji, r.emoji) on conflict do nothing;
      have := false;
    end if;
  end loop;
end $$;

-- Closes finished wars: the winner gets a trophy, and every member of the winning club gets a prize.
create or replace function public.kf_war_close() returns void
language plpgsql security definer set search_path = public as $$
declare w record; win uuid; wname text;
begin
  for w in select * from kf_wars where not closed and wk <> lb_week(now()) for update skip locked loop
    win := case when w.a_gain > w.b_gain then w.club_a when w.b_gain > w.a_gain then w.club_b else null end;
    wname := case when win = w.club_a then w.a_name else w.b_name end;
    update kf_wars set closed = true, winner = win where id = w.id;
    if win is not null then
      update kf_clubs set trophies = trophies + 1 where id = win;
      insert into kf_mail (to_acc, title, body, gems, minutes)
      select m.account, '⚔️ ' || wname, 'Club war won! · Clubkrieg gewonnen!', 40, 30 from kf_club_members m where m.club = win;
    end if;
  end loop;
end $$;

-- 3. Saving: weekend war gains (replaces part 5's acc_save) --------------------------------------
create or replace function public.acc_save(p_token text, p_data text, p_baked double precision)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); t timestamptz; old_b double precision; old_t timestamptz; hw double precision;
        b double precision; d double precision := 0; hrs double precision; c uuid;
begin
  if p_data is null or octet_length(p_data) < 20 then raise exception 'empty save'; end if;
  if octet_length(p_data) > 1000000 then raise exception 'save too big'; end if;
  b := coalesce(p_baked, 0);
  if b = 'NaN'::double precision or b < 0 then b := 0; end if;
  b := least(b, 9.9e299);
  select save_baked, save_at, club_hw into old_b, old_t, hw from kf_accounts where id = a;
  if old_t is not null and old_t >= now() - interval '15 seconds' then
    return json_build_object('saved', false, 'save_at', old_t);
  end if;
  if old_t is null then
    hw := b;
  else
    hw := coalesce(hw, old_b);
    if b > hw then
      hrs := least(extract(epoch from (now() - old_t)) / 3600.0, 1);
      d := least(b, greatest(hw, 1e8) * power(10::double precision, 12 * hrs)) - hw;
      hw := hw + d;
    end if;
  end if;
  update kf_accounts set save_data = p_data, save_at = now(), save_baked = b, club_hw = hw where id = a returning save_at into t;
  select club into c from kf_club_members where account = a;
  if c is not null and d > 0 then
    insert into kf_club_week (week, account, club, gain) values (lb_week(now()), a, c, d)
    on conflict (week, account, club) do update set gain = kf_club_week.gain + excluded.gain, updated_at = now();
    if kf_weekend() then
      perform kf_war_pair();
      update kf_wars set a_gain = a_gain + d where wk = lb_week(now()) and club_a = c and not closed;
      update kf_wars set b_gain = b_gain + d where wk = lb_week(now()) and club_b = c and not closed;
    end if;
  end if;
  return json_build_object('saved', true, 'save_at', t);
end $$;

-- 4. Clubs: war and trophies in club_mine / club_list ------------------------------------------
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
    'msgs', coalesce((select json_agg(json_build_object('id', id, 'username', username, 'body', body, 'created_at', created_at) order by id)
                from (select * from kf_club_msgs where club = cl.id order by id desc limit 50) z), '[]'::json));
end $$;

create or replace function public.club_list(p_search text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  return coalesce((select json_agg(x order by x.week_gain desc, x.members desc) from (
    select cl.id, cl.name, cl.emoji, cl.descr, cl.open, cl.trophies,
           (select count(*) from kf_club_members m where m.club = cl.id) as members,
           coalesce((select sum(gain) from kf_club_week w where w.club = cl.id and w.week = lb_week(now())), 0) as week_gain
    from kf_clubs cl
    where coalesce(p_search, '') = '' or cl.name ilike '%' || p_search || '%'
    order by week_gain desc limit 50) x), '[]'::json);
end $$;

-- 5. Profiles -------------------------------------------------------------------------------------
-- The game sends a few public numbers about the bakery (no save data).
create or replace function public.acc_profile(p_token text, p_data json)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); d json := coalesce(p_data, '{}'::json);
  n jsonb := '{}'::jsonb; k text;
begin
  foreach k in array array['ach', 'asc', 'reb', 'bld', 'up', 'clicks', 'days'] loop
    if d->>k ~ '^[0-9]{1,12}$' then n := n || jsonb_build_object(k, (d->>k)::bigint); end if;
  end loop;
  if char_length(coalesce(d->>'title', '')) between 1 and 40 and kf_text_ok(d->>'title') and d->>'title' !~ '[<>]' then n := n || jsonb_build_object('title', d->>'title'); end if;
  if char_length(coalesce(d->>'bakery', '')) between 2 and 20 and kf_text_ok(d->>'bakery') and d->>'bakery' !~ '[<>]' then n := n || jsonb_build_object('bakery', d->>'bakery'); end if;
  update kf_accounts set profile = n where id = a;
end $$;

-- Public profile by account username or leaderboard name.
create or replace function public.player_profile(p_name text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare n text := lower(btrim(coalesce(p_name, ''))); ac kf_accounts%rowtype; lb leaderboard%rowtype; c_name text; c_emoji text; c_tr int; rk bigint; wins bigint := 0; fr bigint := 0; seen timestamptz;
begin
  select * into ac from kf_accounts where lower(username) = n;
  if ac.id is null then
    select * into lb from leaderboard where lower(name) = n;
    if lb.id is not null then select * into ac from kf_accounts where lb_id = lb.id; end if;
  elsif ac.lb_id is not null then
    select * into lb from leaderboard where id = ac.lb_id;
  end if;
  if ac.id is null and lb.id is null then raise exception 'player not found'; end if;
  if lb.id is not null then
    rk := (select count(*) + 1 from leaderboard where score > lb.score);
    wins := (select count(*) from lb_rewards where id = lb.id);
  end if;
  if ac.id is not null then
    select c.name, c.emoji, c.trophies into c_name, c_emoji, c_tr from kf_club_members m join kf_clubs c on c.id = m.club where m.account = ac.id;
    fr := (select count(*) from kf_friends where status = 'ok' and (a = ac.id or b = ac.id));
    select seen_at into seen from kf_presence where id = ac.player_id;
  end if;
  return json_build_object(
    'username', ac.username, 'bakery', coalesce(lb.name, ac.profile->>'bakery'), 'since', ac.created_at,
    'baked', greatest(coalesce(lb.score, 0), coalesce(ac.club_hw, 0)), 'rank', rk, 'wins', wins,
    'club', case when c_name is null then null else json_build_object('name', c_name, 'emoji', c_emoji, 'trophies', c_tr) end,
    'friends', fr, 'online', seen is not null and seen > now() - interval '3 minutes', 'stats', coalesce(ac.profile, '{}'::jsonb));
end $$;

-- 6. Friends --------------------------------------------------------------------------------------
create or replace function public.friend_list(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token);
begin
  return json_build_object(
    'friends', coalesce((select json_agg(json_build_object('username', ac.username,
        'online', exists (select 1 from kf_presence p where p.id = ac.player_id and p.seen_at > now() - interval '3 minutes'),
        'seen', (select seen_at from kf_presence p where p.id = ac.player_id),
        'baked', coalesce(ac.club_hw, 0),
        'club', (select c.emoji || ' ' || c.name from kf_club_members m join kf_clubs c on c.id = m.club where m.account = ac.id)) order by ac.username)
      from kf_friends f join kf_accounts ac on ac.id = case when f.a = me then f.b else f.a end
      where f.status = 'ok' and (f.a = me or f.b = me)), '[]'::json),
    'incoming', coalesce((select json_agg(ac.username order by f.created_at) from kf_friends f join kf_accounts ac on ac.id = f.a where f.b = me and f.status = 'pending'), '[]'::json),
    'outgoing', coalesce((select json_agg(ac.username order by f.created_at) from kf_friends f join kf_accounts ac on ac.id = f.b where f.a = me and f.status = 'pending'), '[]'::json));
end $$;

create or replace function public.friend_request(p_token text, p_user text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token); other uuid;
begin
  select id into other from kf_accounts where lower(username) = lower(btrim(coalesce(p_user, '')));
  if other is null then perform pg_sleep(0.3); raise exception 'player not found'; end if;
  if other = me then raise exception 'cannot add yourself'; end if;
  if exists (select 1 from kf_friends where (a = me and b = other) or (a = other and b = me and status = 'ok')) then return friend_list(p_token); end if;
  if (select count(*) from kf_friends where a = me or b = me) >= 100 then raise exception 'friend list full'; end if;
  if exists (select 1 from kf_friends where a = other and b = me and status = 'pending') then
    update kf_friends set status = 'ok' where a = other and b = me;      -- they already asked: you are friends now
  else
    perform kf_rate_hit('friend', 30, interval '1 hour');
    insert into kf_friends (a, b) values (me, other);
  end if;
  return friend_list(p_token);
end $$;

create or replace function public.friend_answer(p_token text, p_user text, p_accept boolean)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token); other uuid;
begin
  select id into other from kf_accounts where lower(username) = lower(btrim(coalesce(p_user, '')));
  if p_accept then update kf_friends set status = 'ok' where a = other and b = me and status = 'pending';
  else delete from kf_friends where a = other and b = me and status = 'pending'; end if;
  return friend_list(p_token);
end $$;

create or replace function public.friend_remove(p_token text, p_user text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token); other uuid;
begin
  select id into other from kf_accounts where lower(username) = lower(btrim(coalesce(p_user, '')));
  delete from kf_friends where (a = me and b = other) or (a = other and b = me);
  return friend_list(p_token);
end $$;

-- 7. Invites --------------------------------------------------------------------------------------
-- A new account (less than a day old) can name who invited it. Both get a bonus once the new player
-- has baked a million cookies. An inviter gets the bonus for at most 10 invites a week.
create or replace function public.ref_claim(p_token text, p_ref text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token); inv uuid; made timestamptz;
begin
  select created_at into made from kf_accounts where id = me;
  if made < now() - interval '1 day' then return json_build_object('ok', false, 'why', 'too late'); end if;
  select id into inv from kf_accounts where lower(username) = lower(btrim(coalesce(p_ref, '')));
  if inv is null or inv = me then return json_build_object('ok', false, 'why', 'unknown'); end if;
  insert into kf_referrals (invitee, inviter) values (me, inv) on conflict do nothing;
  return json_build_object('ok', true);
end $$;

create or replace function public.kf_ref_rewards(p_acc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record; nm text;
begin
  for r in select f.* from kf_referrals f join kf_accounts i on i.id = f.invitee
           where not f.rewarded and (f.invitee = p_acc or f.inviter = p_acc) and coalesce(i.club_hw, 0) >= 1e6 loop
    update kf_referrals set rewarded = true where invitee = r.invitee;
    select username into nm from kf_accounts where id = r.invitee;
    insert into kf_mail (to_acc, title, body, gems, minutes) values (r.invitee, '🤝 Welcome bonus · Willkommensbonus', 'Thanks for joining! · Danke fürs Mitmachen!', 25, 30);
    if (select count(*) from kf_referrals where inviter = r.inviter and rewarded and created_at > now() - interval '7 days') <= 10 then
      insert into kf_mail (to_acc, title, body, gems, minutes) values (r.inviter, '🤝 ' || nm, 'Your invite paid off! · Deine Einladung hat sich gelohnt!', 25, 30);
    end if;
  end loop;
end $$;

-- Hands out gifts, club prizes and admin mail once, and checks invite bonuses and finished wars.
create or replace function public.social_claim(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare me uuid := acc_from_token(p_token); g json; r json; m json;
begin
  perform club_close_weeks();
  perform kf_war_close();
  perform kf_ref_rewards(me);
  with c as (update kf_gifts set claimed = true where to_acc = me and not claimed returning from_name, kind, amount, note, created_at)
  select coalesce(json_agg(json_build_object('from', from_name, 'kind', kind, 'amount', amount, 'note', note, 'created_at', created_at)), '[]'::json) into g from c;
  with c as (update kf_club_rewards set claimed = true where account = me and not claimed returning week, place, club_name)
  select coalesce(json_agg(json_build_object('week', week, 'place', place, 'club', club_name)), '[]'::json) into r from c;
  with c as (update kf_mail set claimed = true where to_acc = me and not claimed returning title, body, gems, stars, minutes, created_at)
  select coalesce(json_agg(json_build_object('title', title, 'body', body, 'gems', gems, 'stars', stars, 'minutes', minutes, 'created_at', created_at)), '[]'::json) into m from c;
  return json_build_object('gifts', g, 'rewards', r, 'mail', m, 'muted', (select until from kf_mutes where account = me and until > now()),
    'friend_requests', (select count(*) from kf_friends f where f.b = me and f.status = 'pending'));
end $$;

-- 8. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_weekend() from public, anon, authenticated;
revoke all on function public.kf_war_pair() from public, anon, authenticated;
revoke all on function public.kf_war_close() from public, anon, authenticated;
revoke all on function public.kf_ref_rewards(uuid) from public, anon, authenticated;
revoke all on function public.acc_profile(text, json) from public;
revoke all on function public.player_profile(text) from public;
revoke all on function public.friend_list(text) from public;
revoke all on function public.friend_request(text, text) from public;
revoke all on function public.friend_answer(text, text, boolean) from public;
revoke all on function public.friend_remove(text, text) from public;
revoke all on function public.ref_claim(text, text) from public;
grant execute on function public.acc_profile(text, json) to anon;
grant execute on function public.player_profile(text) to anon;
grant execute on function public.friend_list(text) to anon;
grant execute on function public.friend_request(text, text) to anon;
grant execute on function public.friend_answer(text, text, boolean) to anon;
grant execute on function public.friend_remove(text, text) to anon;
grant execute on function public.ref_claim(text, text) to anon;

-- Keksfabrik / Cookie Factory bakery clubs and gifts, part 5 (game version 44)
-- Needs part 2 (leaderboard-v2.sql) and part 4 (accounts-v4.sql) first.
-- Safe to run again. Never deletes accounts, saves or scores.

create table if not exists public.kf_clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 24 and name ~ '^[A-Za-z0-9ÄÖÜäöüß _-]+$'),
  emoji       text not null default '🍪' check (char_length(emoji) <= 8),
  descr       text not null default '' check (char_length(descr) <= 140),
  open        boolean not null default true,
  owner       uuid references public.kf_accounts(id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index if not exists kf_clubs_name_key on public.kf_clubs (lower(name));

create table if not exists public.kf_club_members (
  account     uuid primary key references public.kf_accounts(id) on delete cascade,
  club        uuid not null references public.kf_clubs(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'member')),
  joined_at   timestamptz not null default now()
);
create index if not exists kf_club_members_club on public.kf_club_members (club);

create table if not exists public.kf_club_msgs (
  id          bigserial primary key,
  club        uuid not null references public.kf_clubs(id) on delete cascade,
  account     uuid references public.kf_accounts(id) on delete set null,
  username    text not null,
  body        text not null check (char_length(body) between 1 and 200),
  created_at  timestamptz not null default now()
);
create index if not exists kf_club_msgs_club on public.kf_club_msgs (club, id desc);

-- Cookies each member baked for their club this week (weeks start Monday 00:00 UTC).
create table if not exists public.kf_club_week (
  week        text not null,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  club        uuid not null references public.kf_clubs(id) on delete cascade,
  gain        double precision not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (week, account, club)
);
create table if not exists public.kf_club_closed (week text primary key, closed_at timestamptz not null default now());
create table if not exists public.kf_club_rewards (
  week        text not null,
  place       int  not null,
  club_name   text not null,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  claimed     boolean not null default false,
  primary key (week, account)
);

create table if not exists public.kf_gifts (
  id          bigserial primary key,
  from_acc    uuid references public.kf_accounts(id) on delete set null,
  from_name   text not null,
  to_acc      uuid not null references public.kf_accounts(id) on delete cascade,
  kind        text not null check (kind in ('gems', 'stars')),
  amount      int  not null check (amount between 1 and 50),
  note        text not null default '' check (char_length(note) <= 60),
  created_at  timestamptz not null default now(),
  claimed     boolean not null default false
);
create index if not exists kf_gifts_to on public.kf_gifts (to_acc) where not claimed;

alter table public.kf_clubs        enable row level security;
alter table public.kf_club_members enable row level security;
alter table public.kf_club_msgs    enable row level security;
alter table public.kf_club_week    enable row level security;
alter table public.kf_club_closed  enable row level security;
alter table public.kf_club_rewards enable row level security;
alter table public.kf_gifts        enable row level security;
revoke all on public.kf_clubs, public.kf_club_members, public.kf_club_msgs, public.kf_club_week,
  public.kf_club_closed, public.kf_club_rewards, public.kf_gifts from anon, authenticated;

-- Highest cookie total ever saved to the account. Only cookies above it count for the club,
-- so loading an older save and the newer one again can't count the same cookies twice.
alter table public.kf_accounts add column if not exists club_hw double precision;

-- Saving to an account now also counts the cookies baked for the player's club this week.
-- Growth is capped like the leaderboard, so a faked number can't win the club ranking.
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
  end if;
  return json_build_object('saved', true, 'save_at', t);
end $$;

-- Records the top 3 clubs of every finished week; everyone who baked for them gets a prize.
create or replace function public.club_close_weeks() returns void
language plpgsql security definer set search_path = public, extensions as $$
declare w text;
begin
  for w in select distinct cw.week from kf_club_week cw
           where cw.week <> lb_week(now()) and not exists (select 1 from kf_club_closed x where x.week = cw.week)
  loop
    insert into kf_club_rewards (week, place, club_name, account)
    select w, t.rn, t.name, cw.account
    from (select cw2.club, cl.name, row_number() over (order by sum(cw2.gain) desc) as rn
          from kf_club_week cw2 join kf_clubs cl on cl.id = cw2.club
          where cw2.week = w group by cw2.club, cl.name having sum(cw2.gain) > 0) t
    join kf_club_week cw on cw.week = w and cw.club = t.club and cw.gain > 0
    where t.rn <= 3
    on conflict do nothing;
    insert into kf_club_closed (week) values (w) on conflict do nothing;
  end loop;
  delete from kf_club_week where updated_at < now() - interval '60 days';
end $$;

create or replace function public.club_list(p_search text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  return coalesce((select json_agg(x order by x.week_gain desc, x.members desc) from (
    select cl.id, cl.name, cl.emoji, cl.descr, cl.open,
           (select count(*) from kf_club_members m where m.club = cl.id) as members,
           coalesce((select sum(gain) from kf_club_week w where w.club = cl.id and w.week = lb_week(now())), 0) as week_gain
    from kf_clubs cl
    where coalesce(p_search, '') = '' or cl.name ilike '%' || p_search || '%'
    order by week_gain desc limit 50) x), '[]'::json);
end $$;

create or replace function public.club_mine(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; cl record; wk text := lb_week(now()); total double precision; rk bigint;
begin
  select * into m from kf_club_members where account = a;
  if not found then return json_build_object('club', null); end if;
  select * into cl from kf_clubs where id = m.club;
  total := coalesce((select sum(gain) from kf_club_week where club = cl.id and week = wk), 0);
  rk := (select count(*) + 1 from (select club, sum(gain) s from kf_club_week where week = wk group by club) x where x.s > total);
  return json_build_object(
    'club', json_build_object('id', cl.id, 'name', cl.name, 'emoji', cl.emoji, 'descr', cl.descr, 'open', cl.open),
    'role', m.role, 'week_gain', total, 'rank', rk,
    'members', (select json_agg(json_build_object('username', ac.username, 'role', mm.role,
                  'gain', coalesce((select gain from kf_club_week w where w.account = mm.account and w.week = wk and w.club = cl.id), 0))
                  order by mm.role desc, mm.joined_at)
                from kf_club_members mm join kf_accounts ac on ac.id = mm.account where mm.club = cl.id),
    'msgs', coalesce((select json_agg(json_build_object('id', id, 'username', username, 'body', body, 'created_at', created_at) order by id)
                from (select * from kf_club_msgs where club = cl.id order by id desc limit 50) z), '[]'::json));
end $$;

create or replace function public.club_create(p_token text, p_name text, p_emoji text, p_descr text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); c uuid;
begin
  if exists (select 1 from kf_club_members where account = a) then raise exception 'already in a club'; end if;
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 3 or char_length(p_name) > 24 or p_name !~ '^[A-Za-z0-9ÄÖÜäöüß _-]+$' then raise exception 'invalid club name'; end if;
  if exists (select 1 from kf_clubs where lower(name) = lower(p_name)) then raise exception 'club name taken'; end if;
  if (select count(*) from kf_clubs where created_at > now() - interval '1 minute') >= 10 then raise exception 'busy, try again in a minute'; end if;
  insert into kf_clubs (name, emoji, descr, owner) values (p_name, left(coalesce(nullif(p_emoji, ''), '🍪'), 8), left(coalesce(p_descr, ''), 140), a) returning id into c;
  insert into kf_club_members (account, club, role) values (a, c, 'owner');
  return club_mine(p_token);
end $$;

create or replace function public.club_join(p_token text, p_club uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); cl record;
begin
  if exists (select 1 from kf_club_members where account = a) then raise exception 'already in a club'; end if;
  select * into cl from kf_clubs where id = p_club;
  if not found then raise exception 'club not found'; end if;
  if not cl.open then raise exception 'club is closed'; end if;
  if (select count(*) from kf_club_members where club = p_club) >= 30 then raise exception 'club is full'; end if;
  insert into kf_club_members (account, club, role) values (a, p_club, 'member');
  return club_mine(p_token);
end $$;

-- When an owner leaves (or deletes their account), the longest member becomes the owner.
-- A club without members is removed.
create or replace function public.club_member_gone() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare nxt uuid;
begin
  if not exists (select 1 from kf_clubs where id = old.club) then return null; end if;
  if exists (select 1 from kf_club_members where club = old.club and role = 'owner') then return null; end if;
  select account into nxt from kf_club_members where club = old.club order by joined_at limit 1;
  if nxt is null then delete from kf_clubs where id = old.club;
  else update kf_club_members set role = 'owner' where account = nxt; update kf_clubs set owner = nxt where id = old.club; end if;
  return null;
end $$;
drop trigger if exists kf_club_member_gone on public.kf_club_members;
create trigger kf_club_member_gone after delete on public.kf_club_members for each row execute function public.club_member_gone();

create or replace function public.club_leave(p_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from kf_club_members where account = acc_from_token(p_token);
end $$;

create or replace function public.club_kick(p_token text, p_user text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; target uuid;
begin
  select * into m from kf_club_members where account = a;
  if not found or m.role <> 'owner' then raise exception 'only the owner can do that'; end if;
  select id into target from kf_accounts where lower(username) = lower(btrim(coalesce(p_user, '')));
  if target is null or target = a then raise exception 'player not found'; end if;
  delete from kf_club_members where account = target and club = m.club;
  return club_mine(p_token);
end $$;

create or replace function public.club_edit(p_token text, p_descr text, p_open boolean)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record;
begin
  select * into m from kf_club_members where account = a;
  if not found or m.role <> 'owner' then raise exception 'only the owner can do that'; end if;
  update kf_clubs set descr = left(coalesce(p_descr, ''), 140), open = coalesce(p_open, true) where id = m.club;
  return club_mine(p_token);
end $$;

create or replace function public.club_post(p_token text, p_body text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; u text;
begin
  select * into m from kf_club_members where account = a;
  if not found then raise exception 'not in a club'; end if;
  p_body := btrim(coalesce(p_body, ''));
  if char_length(p_body) < 1 or char_length(p_body) > 200 then raise exception 'invalid message'; end if;
  if exists (select 1 from kf_club_msgs where account = a and created_at > now() - interval '3 seconds') then raise exception 'slow down'; end if;
  select username into u from kf_accounts where id = a;
  insert into kf_club_msgs (club, account, username, body) values (m.club, a, u, p_body);
  delete from kf_club_msgs where club = m.club and id not in (select id from kf_club_msgs where club = m.club order by id desc limit 200);
  return club_mine(p_token);
end $$;

-- Gifts: up to 50 gems, 5 star crumbs and 10 gifts sent per day; up to 60 gems and 6 star crumbs received per day.
create or replace function public.gift_limits(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  return json_build_object(
    'gems_left',  50 - coalesce((select sum(amount) from kf_gifts where from_acc = a and kind = 'gems'  and created_at >= day), 0),
    'stars_left',  5 - coalesce((select sum(amount) from kf_gifts where from_acc = a and kind = 'stars' and created_at >= day), 0),
    'gifts_left', 10 - (select count(*) from kf_gifts where from_acc = a and created_at >= day));
end $$;

create or replace function public.gift_send(p_token text, p_to text, p_kind text, p_amount int, p_note text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); to_id uuid; me text; lim json; day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  if p_kind not in ('gems', 'stars') then raise exception 'invalid gift'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'invalid amount'; end if;
  select id into to_id from kf_accounts where lower(username) = lower(btrim(coalesce(p_to, '')));
  if to_id is null then perform pg_sleep(0.5); raise exception 'player not found'; end if;
  if to_id = a then raise exception 'cannot gift yourself'; end if;
  lim := gift_limits(p_token);
  if (lim->>'gifts_left')::int < 1 then raise exception 'daily gift limit reached'; end if;
  if p_kind = 'gems'  and p_amount > (lim->>'gems_left')::int  then raise exception 'daily gem limit reached'; end if;
  if p_kind = 'stars' and p_amount > (lim->>'stars_left')::int then raise exception 'daily star limit reached'; end if;
  if p_kind = 'gems' and p_amount + coalesce((select sum(amount) from kf_gifts where to_acc = to_id and kind = 'gems' and created_at >= day), 0) > 60 then raise exception 'receiver limit reached'; end if;
  if p_kind = 'stars' and p_amount + coalesce((select sum(amount) from kf_gifts where to_acc = to_id and kind = 'stars' and created_at >= day), 0) > 6 then raise exception 'receiver limit reached'; end if;
  select username into me from kf_accounts where id = a;
  insert into kf_gifts (from_acc, from_name, to_acc, kind, amount, note) values (a, me, to_id, p_kind, p_amount, left(btrim(coalesce(p_note, '')), 60));
  return gift_limits(p_token);
end $$;

-- Hands out unclaimed gifts and club prizes once.
create or replace function public.social_claim(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); g json; r json;
begin
  perform club_close_weeks();
  with c as (update kf_gifts set claimed = true where to_acc = a and not claimed returning from_name, kind, amount, note, created_at)
  select coalesce(json_agg(json_build_object('from', from_name, 'kind', kind, 'amount', amount, 'note', note, 'created_at', created_at)), '[]'::json) into g from c;
  with c as (update kf_club_rewards set claimed = true where account = a and not claimed returning week, place, club_name)
  select coalesce(json_agg(json_build_object('week', week, 'place', place, 'club', club_name)), '[]'::json) into r from c;
  return json_build_object('gifts', g, 'rewards', r);
end $$;

-- Admin: see clubs and recent messages, delete a message or a whole club.
create or replace function public.admin_clubs(p_pass text, p_action text, p_id text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'delete_club' then delete from kf_clubs where id = p_id::uuid;
  elsif p_action = 'delete_msg' then delete from kf_club_msgs where id = p_id::bigint;
  elsif p_action <> 'list' then raise exception 'unknown action'; end if;
  return json_build_object(
    'clubs', coalesce((select json_agg(json_build_object('id', cl.id, 'name', cl.name, 'emoji', cl.emoji,
               'members', (select count(*) from kf_club_members m where m.club = cl.id)) order by cl.created_at desc) from kf_clubs cl), '[]'::json),
    'msgs', coalesce((select json_agg(json_build_object('id', z.id, 'club', z.cname, 'username', z.username, 'body', z.body, 'created_at', z.created_at) order by z.id desc)
               from (select mm.*, cl.name as cname from kf_club_msgs mm join kf_clubs cl on cl.id = mm.club order by mm.id desc limit 40) z), '[]'::json),
    'gifts_today', (select count(*) from kf_gifts where created_at > now() - interval '1 day'));
end $$;

revoke all on function public.club_close_weeks() from public, anon, authenticated;
revoke all on function public.club_member_gone() from public, anon, authenticated;
revoke all on function public.club_list(text) from public;
revoke all on function public.club_mine(text) from public;
revoke all on function public.club_create(text, text, text, text) from public;
revoke all on function public.club_join(text, uuid) from public;
revoke all on function public.club_leave(text) from public;
revoke all on function public.club_kick(text, text) from public;
revoke all on function public.club_edit(text, text, boolean) from public;
revoke all on function public.club_post(text, text) from public;
revoke all on function public.gift_limits(text) from public;
revoke all on function public.gift_send(text, text, text, int, text) from public;
revoke all on function public.social_claim(text) from public;
revoke all on function public.admin_clubs(text, text, text) from public;
grant execute on function public.club_list(text) to anon;
grant execute on function public.club_mine(text) to anon;
grant execute on function public.club_create(text, text, text, text) to anon;
grant execute on function public.club_join(text, uuid) to anon;
grant execute on function public.club_leave(text) to anon;
grant execute on function public.club_kick(text, text) to anon;
grant execute on function public.club_edit(text, text, boolean) to anon;
grant execute on function public.club_post(text, text) to anon;
grant execute on function public.gift_limits(text) to anon;
grant execute on function public.gift_send(text, text, text, int, text) to anon;
grant execute on function public.social_claim(text) to anon;
grant execute on function public.admin_clubs(text, text, text) to anon;

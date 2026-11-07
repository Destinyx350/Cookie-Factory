-- Keksfabrik / Cookie Factory security and admin tools, part 6 (game version 45)
-- Needs parts 1–5 (leaderboard-setup, leaderboard-v2, online-v3, accounts-v4, clubs-v5) first.
-- Safe to run again. Never deletes scores, saves or accounts.
-- After running it, add the server admin password with the one-line insert the owner received privately.

-- 0. Supabase lets players call every new function by default. Stop that for functions made from now on,
--    and take away rights from signed-in Supabase users, which the game never uses.
alter default privileges in schema public revoke execute on functions from anon, authenticated;
revoke execute on all functions in schema public from authenticated;
alter function public.lb_week(timestamptz) set search_path = public;
alter function public.lb_month(timestamptz) set search_path = public;

-- 1. Tables ----------------------------------------------------------------------------------------
create table if not exists public.kf_admin_auth (k int primary key default 1 check (k = 1), pass_hash text not null, updated_at timestamptz not null default now());
create table if not exists public.kf_admin_sessions (token_hash text primary key, created_at timestamptz not null default now(), expires_at timestamptz not null);
create table if not exists public.kf_admin_fails (key text not null, at timestamptz not null default now());
create table if not exists public.kf_admin_log (id bigserial primary key, at timestamptz not null default now(), action text not null, detail text not null default '');
create table if not exists public.kf_rate (kind text not null, key text not null, at timestamptz not null default now());
create index if not exists kf_rate_idx on public.kf_rate (kind, key, at);
create table if not exists public.kf_badwords (word text primary key check (word ~ '^[a-z]{2,30}$'));
create table if not exists public.kf_mutes (account uuid primary key references public.kf_accounts(id) on delete cascade, until timestamptz not null, reason text not null default '');
create table if not exists public.kf_reports (
  id          bigserial primary key,
  msg_id      bigint,
  club_name   text not null default '',
  reported    text not null,
  body        text not null,
  reporter    uuid references public.kf_accounts(id) on delete set null,
  reporter_name text not null,
  created_at  timestamptz not null default now(),
  status      text not null default 'open' check (status in ('open', 'done'))
);
create unique index if not exists kf_reports_once on public.kf_reports (msg_id, reporter);
create table if not exists public.kf_mail (
  id          bigserial primary key,
  to_acc      uuid not null references public.kf_accounts(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  body        text not null default '' check (char_length(body) <= 600),
  gems        int not null default 0 check (gems between 0 and 100000),
  stars       int not null default 0 check (stars between 0 and 1000),
  minutes     int not null default 0 check (minutes between 0 and 10080),
  created_at  timestamptz not null default now(),
  claimed     boolean not null default false
);
create index if not exists kf_mail_to on public.kf_mail (to_acc) where not claimed;
create table if not exists public.kf_config (k text primary key, v jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.kf_seasons (id serial primary key, name text not null, archived_at timestamptz not null default now(), top jsonb not null);

alter table public.kf_admin_auth     enable row level security;
alter table public.kf_admin_sessions enable row level security;
alter table public.kf_admin_fails    enable row level security;
alter table public.kf_admin_log      enable row level security;
alter table public.kf_rate           enable row level security;
alter table public.kf_badwords       enable row level security;
alter table public.kf_mutes          enable row level security;
alter table public.kf_reports        enable row level security;
alter table public.kf_mail           enable row level security;
alter table public.kf_config         enable row level security;
alter table public.kf_seasons        enable row level security;
revoke all on public.kf_admin_auth, public.kf_admin_sessions, public.kf_admin_fails, public.kf_admin_log, public.kf_rate,
  public.kf_badwords, public.kf_mutes, public.kf_reports, public.kf_mail, public.kf_config, public.kf_seasons from anon, authenticated;

insert into public.kf_badwords (word) values
  ('fuck'),('fucking'),('fucker'),('motherfucker'),('shit'),('bitch'),('cunt'),('pussy'),('asshole'),('bastard'),('whore'),('slut'),
  ('retard'),('porn'),('porno'),('nazi'),('nazis'),('hitler'),('arsch'),('arschloch'),('fotze'),('hure'),('hurensohn'),('wichser'),
  ('ficken'),('fick'),('scheisse'),('scheise'),('schlampe'),('missgeburt'),('spast'),('nutte'),('schwuchtel'),('kanake')
on conflict do nothing;
insert into public.kf_config (k, v) values ('feat', '{"chat":true,"gifts":true,"clubs":true,"lb":true}'), ('maint', '{"on":false,"de":"","en":""}'), ('min_ver', '0')
on conflict (k) do nothing;

-- 2. Internal helpers (not callable by players) -----------------------------------------------------
-- A hash of the player's internet address, used only for per-device limits. The address itself is never stored.
create or replace function public.kf_ip() returns text language plpgsql stable security definer set search_path = public, extensions as $$
declare h json; v text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::json; exception when others then h := null; end;
  if h is null then return null; end if;
  v := btrim(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1), ''));
  if v = '' then return null; end if;
  return left(encode(digest('kf-ip:' || v, 'sha256'), 'hex'), 24);
end $$;

-- Raises when this device did the same thing too often. Without a known address nothing is limited here
-- (the older per-game limits still apply).
create or replace function public.kf_rate_hit(p_kind text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text := kf_ip();
begin
  if k is null then return; end if;
  if random() < 0.02 then delete from kf_rate where at < now() - interval '2 days'; end if;
  if (select count(*) from kf_rate where kind = p_kind and key = k and at > now() - p_window) >= p_max then
    raise exception 'too many requests, try again later';
  end if;
  insert into kf_rate (kind, key) values (p_kind, k);
end $$;

-- True when the text has no blocked word. Letters like 0/1/3/4/5/@/$ count as o/i/e/a/s/a/s.
create or replace function public.kf_text_ok(p text) returns boolean language plpgsql stable security definer set search_path = public as $$
declare n text; toks text[]; sq text; w text;
begin
  n := translate(lower(coalesce(p, '')), '013457@$!|äöüß', 'oieastasilaous');
  toks := regexp_split_to_array(n, '[^a-z]+');
  sq := regexp_replace(n, '[^a-z]', '', 'g');
  for w in select word from kf_badwords loop
    if w = any(toks) then return false; end if;
    if char_length(w) >= 5 and position(w in sq) > 0 then return false; end if;
  end loop;
  return true;
end $$;

create or replace function public.kf_feat(p_name text) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (v->>p_name)::boolean from kf_config where k = 'feat'), true);
$$;

create or replace function public.kf_muted(p_acc uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from kf_mutes where account = p_acc and until > now());
$$;

create or replace function public.kf_log(p_action text, p_detail text) returns void language sql security definer set search_path = public as $$
  insert into kf_admin_log (action, detail) values (left(p_action, 60), left(coalesce(p_detail, ''), 500));
$$;

-- 3. Admin sign-in: own password (bcrypt), sessions that last 12 hours, lockout after wrong tries ----
create or replace function public.admin_login(p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare ik text := coalesce(kf_ip(), 'all'); h text; t text;
begin
  -- Wrong tries return an error object instead of raising, so they are remembered.
  delete from kf_admin_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_admin_fails where key = ik) >= 5 or (select count(*) from kf_admin_fails) >= 30 then
    return json_build_object('error', 'locked');
  end if;
  select pass_hash into h from kf_admin_auth where k = 1;
  if h is null then return json_build_object('error', 'not set up'); end if;
  if h <> crypt(coalesce(p_pass, ''), h) then
    insert into kf_admin_fails (key) values (ik);
    perform pg_sleep(1);
    return json_build_object('error', 'wrong password');
  end if;
  delete from kf_admin_sessions where expires_at < now();
  t := encode(gen_random_bytes(32), 'hex');
  insert into kf_admin_sessions (token_hash, expires_at) values (encode(digest(t, 'sha256'), 'hex'), now() + interval '12 hours');
  perform kf_log('admin sign-in', '');
  return json_build_object('token', t, 'expires_at', now() + interval '12 hours');
end $$;

create or replace function public.admin_logout(p_pass text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from kf_admin_sessions where token_hash = encode(digest(coalesce(p_pass, ''), 'sha256'), 'hex');
$$;

-- All admin tools check this. p_pass is now the admin session token, not the password.
create or replace function public.lb_admin_ok(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  return exists (select 1 from kf_admin_sessions where token_hash = encode(digest(coalesce(p_pass, ''), 'sha256'), 'hex') and expires_at > now());
end $$;

-- The old quick password hash is no longer used.
delete from public.lb_admin;

-- 4. Accounts: name filter, per-device limits, password change signs out other devices ---------------
create or replace function public.acc_signup(p_user text, p_pass text, p_player uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid;
begin
  p_user := btrim(coalesce(p_user, ''));
  if p_user !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'invalid username'; end if;
  if not kf_text_ok(p_user) then raise exception 'blocked word'; end if;
  if char_length(coalesce(p_pass, '')) < 6 or char_length(p_pass) > 72 then raise exception 'invalid password'; end if;
  if exists (select 1 from kf_accounts where lower(username) = lower(p_user)) then raise exception 'username taken'; end if;
  if (select count(*) from kf_accounts where created_at > now() - interval '1 minute') >= 20 then raise exception 'busy, try again in a minute'; end if;
  perform kf_rate_hit('signup', 5, interval '1 hour');
  insert into kf_accounts (username, pass_hash, player_id) values (p_user, crypt(p_pass, gen_salt('bf', 10)), p_player) returning id into a;
  return json_build_object('token', acc_new_session(a), 'username', p_user, 'has_save', false);
end $$;

create or replace function public.acc_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record; u text := lower(btrim(coalesce(p_user, ''))); k text := kf_ip();
begin
  delete from kf_login_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_login_fails where username = u) >= 8
     or (k is not null and (select count(*) from kf_rate where kind = 'login_fail' and key = k and at > now() - interval '15 minutes') >= 20) then
    return json_build_object('error', 'too many tries');
  end if;
  select * into r from kf_accounts where lower(username) = u;
  if not found or r.pass_hash <> crypt(coalesce(p_pass, ''), r.pass_hash) then
    insert into kf_login_fails (username) values (u);
    if k is not null then insert into kf_rate (kind, key) values ('login_fail', k); end if;
    perform pg_sleep(1);
    return json_build_object('error', 'wrong username or password');
  end if;
  delete from kf_login_fails where username = u;
  return json_build_object('token', acc_new_session(r.id), 'username', r.username,
    'has_save', r.save_data is not null, 'save_at', r.save_at, 'save_baked', r.save_baked);
end $$;

create or replace function public.acc_password(p_token text, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); h text;
begin
  select pass_hash into h from kf_accounts where id = a;
  if h <> crypt(coalesce(p_old, ''), h) then perform pg_sleep(1); raise exception 'wrong password'; end if;
  if char_length(coalesce(p_new, '')) < 6 or char_length(p_new) > 72 then raise exception 'invalid password'; end if;
  update kf_accounts set pass_hash = crypt(p_new, gen_salt('bf', 10)) where id = a;
  delete from kf_sessions where account = a and token_hash <> encode(digest(p_token, 'sha256'), 'hex');
end $$;

-- Signs out every other device. Returns how many were signed out.
create or replace function public.acc_logout_all(p_token text)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); n int;
begin
  delete from kf_sessions where account = a and token_hash <> encode(digest(p_token, 'sha256'), 'hex');
  get diagnostics n = row_count;
  return n;
end $$;

-- 5. Clubs and gifts: feature switches, mutes, word filter, per-device limits, reports --------------
create or replace function public.club_create(p_token text, p_name text, p_emoji text, p_descr text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); c uuid;
begin
  if not kf_feat('clubs') then raise exception 'clubs are off'; end if;
  if exists (select 1 from kf_club_members where account = a) then raise exception 'already in a club'; end if;
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 3 or char_length(p_name) > 24 or p_name !~ '^[A-Za-z0-9ÄÖÜäöüß _-]+$' then raise exception 'invalid club name'; end if;
  if not kf_text_ok(p_name) or not kf_text_ok(p_descr) then raise exception 'blocked word'; end if;
  if exists (select 1 from kf_clubs where lower(name) = lower(p_name)) then raise exception 'club name taken'; end if;
  if (select count(*) from kf_clubs where created_at > now() - interval '1 minute') >= 10 then raise exception 'busy, try again in a minute'; end if;
  perform kf_rate_hit('club', 3, interval '1 hour');
  insert into kf_clubs (name, emoji, descr, owner) values (p_name, left(coalesce(nullif(p_emoji, ''), '🍪'), 8), left(coalesce(p_descr, ''), 140), a) returning id into c;
  insert into kf_club_members (account, club, role) values (a, c, 'owner');
  return club_mine(p_token);
end $$;

create or replace function public.club_join(p_token text, p_club uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); cl record;
begin
  if not kf_feat('clubs') then raise exception 'clubs are off'; end if;
  if exists (select 1 from kf_club_members where account = a) then raise exception 'already in a club'; end if;
  select * into cl from kf_clubs where id = p_club;
  if not found then raise exception 'club not found'; end if;
  if not cl.open then raise exception 'club is closed'; end if;
  if (select count(*) from kf_club_members where club = p_club) >= 30 then raise exception 'club is full'; end if;
  insert into kf_club_members (account, club, role) values (a, p_club, 'member');
  return club_mine(p_token);
end $$;

create or replace function public.club_edit(p_token text, p_descr text, p_open boolean)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record;
begin
  select * into m from kf_club_members where account = a;
  if not found or m.role <> 'owner' then raise exception 'only the owner can do that'; end if;
  if not kf_text_ok(p_descr) then raise exception 'blocked word'; end if;
  update kf_clubs set descr = left(coalesce(p_descr, ''), 140), open = coalesce(p_open, true) where id = m.club;
  return club_mine(p_token);
end $$;

create or replace function public.club_post(p_token text, p_body text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; u text;
begin
  if not kf_feat('chat') then raise exception 'chat is off'; end if;
  if kf_muted(a) then raise exception 'muted'; end if;
  select * into m from kf_club_members where account = a;
  if not found then raise exception 'not in a club'; end if;
  p_body := btrim(coalesce(p_body, ''));
  if char_length(p_body) < 1 or char_length(p_body) > 200 then raise exception 'invalid message'; end if;
  if not kf_text_ok(p_body) then raise exception 'blocked word'; end if;
  if exists (select 1 from kf_club_msgs where account = a and created_at > now() - interval '3 seconds') then raise exception 'slow down'; end if;
  select username into u from kf_accounts where id = a;
  insert into kf_club_msgs (club, account, username, body) values (m.club, a, u, p_body);
  delete from kf_club_msgs where club = m.club and id not in (select id from kf_club_msgs where club = m.club order by id desc limit 200);
  return club_mine(p_token);
end $$;

-- Report a chat message in your own club. The admin sees every report in the admin panel.
create or replace function public.club_report(p_token text, p_msg bigint)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); m record; me text; cn text;
begin
  select mm.* into m from kf_club_msgs mm join kf_club_members cm on cm.club = mm.club and cm.account = a where mm.id = p_msg;
  if not found then raise exception 'message not found'; end if;
  if m.account = a then raise exception 'cannot report yourself'; end if;
  if exists (select 1 from kf_reports where msg_id = p_msg and reporter = a) then return json_build_object('ok', true); end if;
  perform kf_rate_hit('report', 20, interval '1 hour');
  select username into me from kf_accounts where id = a;
  select name into cn from kf_clubs where id = m.club;
  insert into kf_reports (msg_id, club_name, reported, body, reporter, reporter_name) values (p_msg, coalesce(cn, ''), m.username, m.body, a, me);
  return json_build_object('ok', true);
end $$;

-- Gifts: only from accounts that are at least a day old and have baked at least a million cookies.
create or replace function public.gift_send(p_token text, p_to text, p_kind text, p_amount int, p_note text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); to_id uuid; me record; lim json; day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  if not kf_feat('gifts') then raise exception 'gifts are off'; end if;
  if kf_muted(a) then raise exception 'muted'; end if;
  if p_kind not in ('gems', 'stars') then raise exception 'invalid gift'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'invalid amount'; end if;
  select username, created_at, coalesce(club_hw, 0) as hw into me from kf_accounts where id = a;
  if me.created_at > now() - interval '24 hours' then raise exception 'account too new'; end if;
  if me.hw < 1e6 then raise exception 'play more first'; end if;
  if not kf_text_ok(p_note) then raise exception 'blocked word'; end if;
  select id into to_id from kf_accounts where lower(username) = lower(btrim(coalesce(p_to, '')));
  if to_id is null then perform pg_sleep(0.5); raise exception 'player not found'; end if;
  if to_id = a then raise exception 'cannot gift yourself'; end if;
  lim := gift_limits(p_token);
  if (lim->>'gifts_left')::int < 1 then raise exception 'daily gift limit reached'; end if;
  if p_kind = 'gems'  and p_amount > (lim->>'gems_left')::int  then raise exception 'daily gem limit reached'; end if;
  if p_kind = 'stars' and p_amount > (lim->>'stars_left')::int then raise exception 'daily star limit reached'; end if;
  if p_kind = 'gems' and p_amount + coalesce((select sum(amount) from kf_gifts where to_acc = to_id and kind = 'gems' and created_at >= day), 0) > 60 then raise exception 'receiver limit reached'; end if;
  if p_kind = 'stars' and p_amount + coalesce((select sum(amount) from kf_gifts where to_acc = to_id and kind = 'stars' and created_at >= day), 0) > 6 then raise exception 'receiver limit reached'; end if;
  perform kf_rate_hit('gift', 20, interval '1 hour');
  insert into kf_gifts (from_acc, from_name, to_acc, kind, amount, note) values (a, me.username, to_id, p_kind, p_amount, left(btrim(coalesce(p_note, '')), 60));
  return gift_limits(p_token);
end $$;

-- Gifts, club prizes and admin mail are handed out once.
create or replace function public.social_claim(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); g json; r json; m json;
begin
  perform club_close_weeks();
  with c as (update kf_gifts set claimed = true where to_acc = a and not claimed returning from_name, kind, amount, note, created_at)
  select coalesce(json_agg(json_build_object('from', from_name, 'kind', kind, 'amount', amount, 'note', note, 'created_at', created_at)), '[]'::json) into g from c;
  with c as (update kf_club_rewards set claimed = true where account = a and not claimed returning week, place, club_name)
  select coalesce(json_agg(json_build_object('week', week, 'place', place, 'club', club_name)), '[]'::json) into r from c;
  with c as (update kf_mail set claimed = true where to_acc = a and not claimed returning title, body, gems, stars, minutes, created_at)
  select coalesce(json_agg(json_build_object('title', title, 'body', body, 'gems', gems, 'stars', stars, 'minutes', minutes, 'created_at', created_at)), '[]'::json) into m from c;
  return json_build_object('gifts', g, 'rewards', r, 'mail', m, 'muted', (select until from kf_mutes where account = a and until > now()));
end $$;

-- 6. Leaderboard, live counter and cloud codes -------------------------------------------------------
-- Growth limit: still 10x per 5 minutes while playing, but at most 10^12 for one jump after a long break.
create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_score double precision;
  old_time  timestamptz;
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
  perform lb_close_periods();

  select score, updated_at into old_score, old_time from leaderboard where id = p_id;
  if not found then
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

create or replace function public.kf_live()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'online', (select count(*) from kf_presence where seen_at > now() - interval '3 minutes'),
    'today',  (select count(*) from kf_presence where seen_at > now() - interval '24 hours'),
    'players', (select count(*) from kf_presence),
    'total',  (select coalesce(sum(baked), 0) from kf_presence),
    'cfg',    (select coalesce(json_object_agg(k, v), '{}'::json) from kf_config));
$$;

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
  return kf_live();
end $$;

create or replace function public.save_upload(p_data text)
returns json language plpgsql security definer set search_path = public as $$
declare abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; c text; i int; tries int := 0; exp timestamptz := now() + interval '24 hours';
begin
  if p_data is null or octet_length(p_data) < 20 then raise exception 'empty save'; end if;
  if octet_length(p_data) > 1000000 then raise exception 'save too big'; end if;
  delete from kf_saves where expires_at < now();
  if (select count(*) from kf_saves where created_at > now() - interval '1 minute') >= 30 then raise exception 'busy, try again in a minute'; end if;
  perform kf_rate_hit('cloud', 10, interval '1 hour');
  loop
    b := uuid_send(gen_random_uuid()); c := '';
    for i in 0..7 loop c := c || substr(abc, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from kf_saves where code = c);
    tries := tries + 1; if tries > 5 then raise exception 'try again'; end if;
  end loop;
  insert into kf_saves (code, data, expires_at) values (c, p_data, exp);
  return json_build_object('code', c, 'expires_at', exp);
end $$;

-- Past seasons for the leaderboard's hall of fame.
create or replace function public.lb_seasons()
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('name', name, 'archived_at', archived_at, 'top', top) order by id desc), '[]'::json)
  from (select * from kf_seasons order by id desc limit 5) s;
$$;

-- 7. Admin tools (all need an admin session). Every change is written to the admin log. -----------
create or replace function public.admin_lb(p_pass text, p_action text, p_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action <> 'list' then perform kf_log('leaderboard: ' || p_action, coalesce((select name from leaderboard where id = p_id), p_id::text, '')); end if;
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

create or replace function public.admin_online(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); c text; days double precision; hrs double precision; st double precision; rep int; i int; j int; n int;
        abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; made text[] := '{}';
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action <> 'list' then perform kf_log('online: ' || p_action, left(d::text, 300)); end if;
  if p_action = 'code_add' then
    c := upper(regexp_replace(coalesce(d->>'code', ''), '[^A-Za-z0-9]', '', 'g'));
    days := nullif(d->>'days', '')::double precision;
    insert into kf_codes (code, label, gems, stars, minutes, max_uses, expires_at)
    values (c, coalesce(d->>'label', ''), coalesce((d->>'gems')::int, 0), coalesce((d->>'stars')::int, 0), coalesce((d->>'minutes')::int, 0),
            nullif(d->>'max_uses', '')::int, case when days is null or days <= 0 then null else now() + days * interval '1 day' end)
    on conflict (code) do update set label = excluded.label, gems = excluded.gems, stars = excluded.stars, minutes = excluded.minutes,
            max_uses = excluded.max_uses, expires_at = excluded.expires_at;
  elsif p_action = 'code_bulk' then
    -- Many one-time codes at once, e.g. for a giveaway.
    n := least(greatest(coalesce(nullif(d->>'count', '')::int, 10), 1), 100);
    days := nullif(d->>'days', '')::double precision;
    for i in 1..n loop
      loop
        b := uuid_send(gen_random_uuid());
        c := left(upper(regexp_replace(coalesce(d->>'prefix', ''), '[^A-Za-z0-9]', '', 'g')), 10);
        for j in 0..5 loop c := c || substr(abc, (get_byte(b, j) % 32) + 1, 1); end loop;
        exit when not exists (select 1 from kf_codes where code = c);
      end loop;
      insert into kf_codes (code, label, gems, stars, minutes, max_uses, expires_at)
      values (c, coalesce(d->>'label', ''), coalesce((d->>'gems')::int, 0), coalesce((d->>'stars')::int, 0), coalesce((d->>'minutes')::int, 0),
              1, case when days is null or days <= 0 then null else now() + days * interval '1 day' end);
      made := made || c;
    end loop;
  elsif p_action = 'code_del' then
    delete from kf_codes where code = upper(d->>'code');
  elsif p_action = 'news_add' then
    days := nullif(d->>'days', '')::double precision;
    insert into kf_news (title, body, until)
    values (d->>'title', coalesce(d->>'body', ''), case when days is null or days <= 0 then null else now() + days * interval '1 day' end);
  elsif p_action = 'news_del' then
    delete from kf_news where id = (d->>'id')::bigint;
  elsif p_action = 'event_add' then
    -- Optional: start later (start_hours) and repeat every week (repeat_weeks, up to 12).
    hrs := coalesce(nullif(d->>'hours', '')::double precision, 24);
    st := greatest(coalesce(nullif(d->>'start_hours', '')::double precision, 0), 0);
    rep := least(greatest(coalesce(nullif(d->>'repeat_weeks', '')::int, 0), 0), 12);
    for i in 0..rep loop
      insert into kf_events (kind, mult, title, starts_at, ends_at)
      values (d->>'kind', (d->>'mult')::double precision, coalesce(d->>'title', ''),
              now() + st * interval '1 hour' + i * interval '7 days', now() + st * interval '1 hour' + i * interval '7 days' + hrs * interval '1 hour');
    end loop;
  elsif p_action = 'event_end' then
    update kf_events set starts_at = least(starts_at, now() - interval '1 second'), ends_at = now() where id = (d->>'id')::bigint and ends_at > now();
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return json_build_object(
    'live',   kf_live(),
    'bulk',   to_json(made),
    'codes',  coalesce((select json_agg(json_build_object('code', code, 'label', label, 'gems', gems, 'stars', stars, 'minutes', minutes,
                'max_uses', max_uses, 'uses', uses, 'expires_at', expires_at) order by created_at desc) from (select * from kf_codes order by created_at desc limit 60) k), '[]'::json),
    'news',   coalesce((select json_agg(json_build_object('id', id, 'title', title, 'body', body, 'created_at', created_at, 'until', until) order by id desc)
                from (select * from kf_news order by id desc limit 20) n), '[]'::json),
    'events', coalesce((select json_agg(json_build_object('id', id, 'kind', kind, 'mult', mult, 'title', title, 'starts_at', starts_at, 'ends_at', ends_at) order by starts_at desc)
                from (select * from kf_events order by ends_at desc limit 30) e), '[]'::json));
end $$;

create or replace function public.admin_accounts(p_pass text, p_action text, p_id uuid default null, p_new text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action <> 'list' then perform kf_log('accounts: ' || p_action, coalesce((select username from kf_accounts where id = p_id), '')); end if;
  if p_action = 'set_password' then
    if char_length(coalesce(p_new, '')) < 6 or char_length(p_new) > 72 then raise exception 'invalid password'; end if;
    update kf_accounts set pass_hash = crypt(p_new, gen_salt('bf', 10)) where id = p_id;
    delete from kf_sessions where account = p_id;
  elsif p_action = 'delete' then
    delete from kf_accounts where id = p_id;
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return json_build_object(
    'count', (select count(*) from kf_accounts),
    'accounts', coalesce((select json_agg(json_build_object('id', id, 'username', username, 'created_at', created_at,
                   'last_login', last_login, 'save_at', save_at, 'save_baked', save_baked) order by last_login desc nulls last)
                 from (select * from kf_accounts order by last_login desc nulls last limit 100) x), '[]'::json));
end $$;

create or replace function public.admin_clubs(p_pass text, p_action text, p_id text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'delete_club' then perform kf_log('clubs: delete club', coalesce((select name from kf_clubs where id = p_id::uuid), ''));
  elsif p_action = 'delete_msg' then perform kf_log('clubs: delete message', coalesce((select username || ': ' || body from kf_club_msgs where id = p_id::bigint), '')); end if;
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

-- Moderation, player search, mail, settings, statistics, log and seasons.
create or replace function public.admin_mod(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); q text; acc uuid; nm text; n int := 0; cl uuid; r record;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action not in ('search', 'reports', 'log', 'stats', 'settings', 'mutes', 'words', 'seasons') then
    perform kf_log('mod: ' || p_action, left(d::text, 300));
  end if;

  if p_action = 'search' then
    q := btrim(coalesce(d->>'q', ''));
    return json_build_object(
      'accounts', coalesce((select json_agg(json_build_object('id', a.id, 'username', a.username, 'created_at', a.created_at, 'last_login', a.last_login,
          'save_at', a.save_at, 'save_baked', a.save_baked,
          'club', (select c.name from kf_club_members m join kf_clubs c on c.id = m.club where m.account = a.id),
          'muted', (select until from kf_mutes where account = a.id and until > now()),
          'gifts_sent', (select count(*) from kf_gifts where from_acc = a.id and created_at > now() - interval '30 days'),
          'gifts_got', (select count(*) from kf_gifts where to_acc = a.id and created_at > now() - interval '30 days'),
          'reports', (select count(*) from kf_reports where lower(reported) = lower(a.username)),
          'online', (select seen_at from kf_presence p where p.id = a.player_id)) order by a.username)
        from (select * from kf_accounts where q <> '' and username ilike '%' || q || '%' order by username limit 20) a), '[]'::json),
      'scores', coalesce((select json_agg(json_build_object('id', l.id, 'name', l.name, 'score', l.score, 'updated_at', l.updated_at,
          'banned', exists (select 1 from lb_banned b where b.id = l.id)) order by l.score desc)
        from (select * from leaderboard where q <> '' and name ilike '%' || q || '%' order by score desc limit 20) l), '[]'::json),
      'clubs', coalesce((select json_agg(json_build_object('id', c.id, 'name', c.name, 'emoji', c.emoji,
          'members', (select count(*) from kf_club_members m where m.club = c.id)))
        from (select * from kf_clubs where q <> '' and name ilike '%' || q || '%' limit 20) c), '[]'::json));

  elsif p_action = 'mail' then
    -- To one player (to = username) or every member of a club (club = id). Optional reward.
    if char_length(btrim(coalesce(d->>'title', ''))) < 1 then raise exception 'title missing'; end if;
    if nullif(d->>'club', '') is not null then
      insert into kf_mail (to_acc, title, body, gems, stars, minutes)
      select m.account, left(d->>'title', 80), left(coalesce(d->>'body', ''), 600), coalesce(nullif(d->>'gems', '')::int, 0),
             coalesce(nullif(d->>'stars', '')::int, 0), coalesce(nullif(d->>'minutes', '')::int, 0)
      from kf_club_members m where m.club = (d->>'club')::uuid;
      get diagnostics n = row_count;
      insert into kf_club_msgs (club, account, username, body) values ((d->>'club')::uuid, null, '📣 Admin', left(btrim(d->>'title') || coalesce(nullif(' – ' || btrim(coalesce(d->>'body', '')), ' – '), ''), 200));
    else
      select id into acc from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'to', '')));
      if acc is null then raise exception 'player not found'; end if;
      insert into kf_mail (to_acc, title, body, gems, stars, minutes)
      values (acc, left(d->>'title', 80), left(coalesce(d->>'body', ''), 600), coalesce(nullif(d->>'gems', '')::int, 0),
              coalesce(nullif(d->>'stars', '')::int, 0), coalesce(nullif(d->>'minutes', '')::int, 0));
      n := 1;
    end if;
    return json_build_object('sent', n);

  elsif p_action = 'mute' then
    select id into acc from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'user', '')));
    if acc is null then raise exception 'player not found'; end if;
    insert into kf_mutes (account, until, reason) values (acc, now() + least(greatest(coalesce(nullif(d->>'hours', '')::double precision, 24), 1), 24 * 365) * interval '1 hour', left(coalesce(d->>'reason', ''), 120))
    on conflict (account) do update set until = excluded.until, reason = excluded.reason;
    return admin_mod(p_pass, 'mutes', null);
  elsif p_action = 'unmute' then
    delete from kf_mutes where account = (select id from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'user', ''))));
    return admin_mod(p_pass, 'mutes', null);
  elsif p_action = 'mutes' then
    return coalesce((select json_agg(json_build_object('username', a.username, 'until', m.until, 'reason', m.reason) order by m.until)
      from kf_mutes m join kf_accounts a on a.id = m.account where m.until > now()), '[]'::json);

  elsif p_action = 'reports' then
    return coalesce((select json_agg(json_build_object('id', id, 'msg_id', msg_id, 'club', club_name, 'reported', reported, 'body', body,
        'reporter', reporter_name, 'created_at', created_at, 'status', status,
        'msg_exists', exists (select 1 from kf_club_msgs m where m.id = r2.msg_id)) order by (status = 'open') desc, id desc)
      from (select * from kf_reports order by id desc limit 100) r2), '[]'::json);
  elsif p_action = 'report_done' then
    update kf_reports set status = 'done' where id = (d->>'id')::bigint;
    if (d->>'delete')::boolean then delete from kf_club_msgs where id = (select msg_id from kf_reports where id = (d->>'id')::bigint); end if;
    return admin_mod(p_pass, 'reports', null);

  elsif p_action = 'rename' then
    nm := btrim(regexp_replace(coalesce(d->>'name', ''), '\s+', ' ', 'g'));
    if d->>'kind' = 'club' then
      if char_length(nm) < 3 or char_length(nm) > 24 or nm !~ '^[A-Za-z0-9ÄÖÜäöüß _-]+$' then raise exception 'invalid club name'; end if;
      update kf_clubs set name = nm where id = (d->>'id')::uuid;
    elsif d->>'kind' = 'account' then
      if nm !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'invalid username'; end if;
      if exists (select 1 from kf_accounts where lower(username) = lower(nm) and id <> (d->>'id')::uuid) then raise exception 'username taken'; end if;
      update kf_accounts set username = nm where id = (d->>'id')::uuid;
    elsif d->>'kind' = 'score' then
      if char_length(nm) < 2 or char_length(nm) > 20 or nm ~ '[<>]' then raise exception 'invalid name'; end if;
      update leaderboard set name = nm where id = (d->>'id')::uuid;
      update lb_period set name = nm where id = (d->>'id')::uuid;
    else raise exception 'unknown kind'; end if;
    return json_build_object('ok', true);

  elsif p_action = 'words' then
    return coalesce((select json_agg(word order by word) from kf_badwords), '[]'::json);
  elsif p_action = 'word_add' then
    nm := lower(regexp_replace(coalesce(d->>'word', ''), '[^A-Za-zÄÖÜäöüß]', '', 'g'));
    nm := translate(nm, 'äöüß', 'aous');
    if nm !~ '^[a-z]{2,30}$' then raise exception 'invalid word'; end if;
    insert into kf_badwords (word) values (nm) on conflict do nothing;
    return admin_mod(p_pass, 'words', null);
  elsif p_action = 'word_del' then
    delete from kf_badwords where word = lower(d->>'word');
    return admin_mod(p_pass, 'words', null);

  elsif p_action = 'settings' then
    return (select coalesce(json_object_agg(k, v), '{}'::json) from kf_config);
  elsif p_action = 'set' then
    -- feat: {chat, gifts, clubs, lb}; maint: {on, de, en}; min_ver: number
    if d->>'k' not in ('feat', 'maint', 'min_ver') then raise exception 'unknown setting'; end if;
    insert into kf_config (k, v, updated_at) values (d->>'k', (d->'v')::jsonb, now())
    on conflict (k) do update set v = excluded.v, updated_at = now();
    return admin_mod(p_pass, 'settings', null);

  elsif p_action = 'stats' then
    return json_build_object(
      'live', kf_live(),
      'accounts', (select count(*) from kf_accounts),
      'active7', (select count(*) from kf_accounts where last_login > now() - interval '7 days' or save_at > now() - interval '7 days'),
      'new14', (select json_agg(json_build_object('day', dd::date, 'n', (select count(*) from kf_accounts where created_at::date = dd::date)) order by dd)
                from generate_series(current_date - 13, current_date, interval '1 day') dd),
      'gifts14', (select json_agg(json_build_object('day', dd::date, 'n', (select count(*) from kf_gifts where created_at::date = dd::date)) order by dd)
                from generate_series(current_date - 13, current_date, interval '1 day') dd),
      'clubs', (select count(*) from kf_clubs),
      'top_clubs', coalesce((select json_agg(x) from (select c.name, c.emoji, sum(w.gain) as gain from kf_club_week w join kf_clubs c on c.id = w.club
                where w.week = lb_week(now()) group by c.name, c.emoji order by sum(w.gain) desc limit 5) x), '[]'::json),
      'top_codes', coalesce((select json_agg(x) from (select code, label, uses from kf_codes where uses > 0 order by uses desc limit 5) x), '[]'::json),
      'msgs24', (select count(*) from kf_club_msgs where created_at > now() - interval '1 day'),
      'reports_open', (select count(*) from kf_reports where status = 'open'),
      'lb_entries', (select count(*) from leaderboard),
      'mutes', (select count(*) from kf_mutes where until > now()),
      'ip_seen', kf_ip() is not null);

  elsif p_action = 'log' then
    return coalesce((select json_agg(json_build_object('at', at, 'action', action, 'detail', detail) order by id desc)
      from (select * from kf_admin_log order by id desc limit 100) l), '[]'::json);

  elsif p_action = 'seasons' then
    return coalesce((select json_agg(json_build_object('id', id, 'name', name, 'archived_at', archived_at, 'top', top) order by id desc) from kf_seasons), '[]'::json);
  elsif p_action = 'season_end' then
    -- Saves the top 10 as a finished season, then starts a fresh leaderboard.
    nm := left(coalesce(nullif(btrim(d->>'name'), ''), 'Season ' || ((select count(*) from kf_seasons) + 1)), 40);
    insert into kf_seasons (name, top)
    values (nm, coalesce((select jsonb_agg(jsonb_build_object('name', name, 'score', score) order by score desc) from (select * from leaderboard order by score desc limit 10) t), '[]'::jsonb));
    delete from leaderboard where true;
    delete from lb_period where true;
    return admin_mod(p_pass, 'seasons', null);
  end if;
  raise exception 'unknown action';
end $$;

-- 8. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_ip() from public, anon, authenticated;
revoke all on function public.kf_rate_hit(text, int, interval) from public, anon, authenticated;
revoke all on function public.kf_text_ok(text) from public, anon, authenticated;
revoke all on function public.kf_feat(text) from public, anon, authenticated;
revoke all on function public.kf_muted(uuid) from public, anon, authenticated;
revoke all on function public.kf_log(text, text) from public, anon, authenticated;
revoke all on function public.lb_admin_ok(text) from public, anon, authenticated;
revoke all on function public.admin_login(text) from public;
revoke all on function public.admin_logout(text) from public;
revoke all on function public.admin_mod(text, text, json) from public;
revoke all on function public.acc_logout_all(text) from public;
revoke all on function public.club_report(text, bigint) from public;
revoke all on function public.lb_seasons() from public;
grant execute on function public.admin_login(text) to anon;
grant execute on function public.admin_logout(text) to anon;
grant execute on function public.admin_mod(text, text, json) to anon;
grant execute on function public.acc_logout_all(text) to anon;
grant execute on function public.club_report(text, bigint) to anon;
grant execute on function public.lb_seasons() to anon;

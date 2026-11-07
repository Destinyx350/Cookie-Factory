-- Keksfabrik / Cookie Factory moderators, ban appeals, two-step sign-in and weekly summary, part 12 (game version 53)
-- Needs parts 1–11 first. Safe to run again.
--
-- After running it, nothing changes for you until you add a moderator or turn on two-step sign-in in admin.html.
-- If you ever lose the phone with the authenticator app, turn two-step sign-in off here in the SQL Editor:
--   update public.kf_admin_auth set totp_on = false, totp_secret = null;

-- 1. Moderators ------------------------------------------------------------------------------------
create table if not exists public.kf_mods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (name ~ '^[A-Za-z0-9_]{3,16}$'),
  pass_hash   text not null,
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);
create unique index if not exists kf_mods_name on public.kf_mods (lower(name));
alter table public.kf_admin_sessions add column if not exists mod_id uuid references public.kf_mods(id) on delete cascade;
alter table public.kf_admin_log add column if not exists who text not null default 'owner';
alter table public.kf_mods enable row level security;
revoke all on public.kf_mods from anon, authenticated;

-- The owner's tools accept only owner sessions (moderator sessions have mod_id set).
create or replace function public.lb_admin_ok(p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  return exists (select 1 from kf_admin_sessions where token_hash = encode(digest(coalesce(p_pass, ''), 'sha256'), 'hex')
                 and expires_at > now() and mod_id is null);
end $$;

-- Who is signed in with this token: 'owner', a moderator's name, or null.
create or replace function public.kf_mod_who(p_pass text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare s record;
begin
  select * into s from kf_admin_sessions where token_hash = encode(digest(coalesce(p_pass, ''), 'sha256'), 'hex') and expires_at > now();
  if not found then return null; end if;
  if s.mod_id is null then return 'owner'; end if;
  return (select name from kf_mods where id = s.mod_id);
end $$;

-- Every log line says who did it. Moderator actions start with 👮 and their name.
create or replace function public.kf_log(p_action text, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
declare w text := coalesce(nullif(current_setting('kf.who', true), ''), 'owner');
begin
  insert into kf_admin_log (action, detail, who)
  values (left(case when w = 'owner' then p_action else '👮 ' || w || ' · ' || p_action end, 80), left(coalesce(p_detail, ''), 500), w);
end $$;

create or replace function public.mod_login(p_user text, p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare ik text := coalesce(kf_ip(), 'all'); m record; t text;
begin
  delete from kf_admin_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_admin_fails where key = ik) >= 5 or (select count(*) from kf_admin_fails) >= 30 then
    return json_build_object('error', 'locked');
  end if;
  select * into m from kf_mods where lower(name) = lower(btrim(coalesce(p_user, '')));
  if not found or m.pass_hash <> crypt(coalesce(p_pass, ''), m.pass_hash) then
    insert into kf_admin_fails (key) values (ik);
    perform pg_sleep(1);
    return json_build_object('error', 'wrong password');
  end if;
  delete from kf_admin_sessions where expires_at < now();
  t := encode(gen_random_bytes(32), 'hex');
  insert into kf_admin_sessions (token_hash, expires_at, mod_id) values (encode(digest(t, 'sha256'), 'hex'), now() + interval '12 hours', m.id);
  update kf_mods set last_login = now() where id = m.id;
  perform set_config('kf.who', m.name, true);
  perform kf_log('sign-in', '');
  return json_build_object('token', t, 'expires_at', now() + interval '12 hours', 'name', m.name);
end $$;

-- What a moderator may do: reports, mutes (at most 7 days) and finding players. The owner may use it too.
create or replace function public.mod_tools(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare who text := kf_mod_who(p_pass); d json := coalesce(p_data, '{}'::json); acc uuid; q text; hrs double precision;
begin
  if who is null then raise exception 'wrong admin password'; end if;
  perform set_config('kf.who', who, true);
  if p_action = 'me' then
    return json_build_object('name', who, 'owner', who = 'owner');
  elsif p_action = 'reports' then
    return coalesce((select json_agg(json_build_object('id', id, 'club', club_name, 'reported', reported, 'body', body,
        'reporter', reporter_name, 'created_at', created_at, 'status', status,
        'msg_exists', exists (select 1 from kf_club_msgs m where m.id = r2.msg_id)) order by (status = 'open') desc, id desc)
      from (select * from kf_reports order by id desc limit 100) r2), '[]'::json);
  elsif p_action = 'report_done' then
    perform kf_log('report ' || case when (d->>'delete')::boolean then 'deleted' else 'done' end,
      coalesce((select reported || ': ' || left(body, 200) from kf_reports where id = (d->>'id')::bigint), ''));
    update kf_reports set status = 'done' where id = (d->>'id')::bigint;
    if (d->>'delete')::boolean then delete from kf_club_msgs where id = (select msg_id from kf_reports where id = (d->>'id')::bigint); end if;
    return mod_tools(p_pass, 'reports', null);
  elsif p_action = 'mute' then
    select id into acc from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'user', '')));
    if acc is null then raise exception 'player not found'; end if;
    hrs := least(greatest(coalesce(nullif(d->>'hours', '')::double precision, 24), 1), case when who = 'owner' then 24 * 365 else 24 * 7 end);
    insert into kf_mutes (account, until, reason) values (acc, now() + hrs * interval '1 hour', left(coalesce(d->>'reason', ''), 120))
    on conflict (account) do update set until = excluded.until, reason = excluded.reason;
    perform kf_log('mute', btrim(d->>'user') || ' ' || hrs || ' h' || coalesce(nullif(': ' || left(coalesce(d->>'reason', ''), 120), ': '), ''));
    return mod_tools(p_pass, 'mutes', null);
  elsif p_action = 'unmute' then
    delete from kf_mutes where account = (select id from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'user', ''))));
    perform kf_log('unmute', btrim(coalesce(d->>'user', '')));
    return mod_tools(p_pass, 'mutes', null);
  elsif p_action = 'mutes' then
    return coalesce((select json_agg(json_build_object('username', a.username, 'until', m.until, 'reason', m.reason) order by m.until)
      from kf_mutes m join kf_accounts a on a.id = m.account where m.until > now()), '[]'::json);
  elsif p_action = 'search' then
    q := btrim(coalesce(d->>'q', ''));
    return coalesce((select json_agg(json_build_object('username', a.username, 'created_at', a.created_at,
        'last_seen', greatest(a.save_at, a.last_login),
        'club', (select c.name from kf_club_members m join kf_clubs c on c.id = m.club where m.account = a.id),
        'muted', (select until from kf_mutes where account = a.id and until > now()),
        'banned', exists (select 1 from kf_bans b where b.account = a.id and (b.until is null or b.until > now())),
        'reports', (select count(*) from kf_reports where lower(reported) = lower(a.username))) order by a.username)
      from (select * from kf_accounts where char_length(q) >= 2 and username ilike '%' || q || '%' order by username limit 20) a), '[]'::json);
  end if;
  raise exception 'unknown action';
end $$;

-- The owner manages moderators: list | add {name, pass} | password {name, pass} | remove {name}
create or replace function public.admin_mods(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); nm text := btrim(coalesce(d->>'name', '')); pw text := coalesce(d->>'pass', '');
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action in ('add', 'password') and (char_length(pw) < 8 or char_length(pw) > 72) then raise exception 'invalid password'; end if;
  if p_action = 'add' then
    if nm !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'invalid name'; end if;
    if exists (select 1 from kf_mods where lower(name) = lower(nm)) then raise exception 'name taken'; end if;
    insert into kf_mods (name, pass_hash) values (nm, crypt(pw, gen_salt('bf', 10)));
    perform kf_log('add moderator', nm);
  elsif p_action = 'password' then
    update kf_mods set pass_hash = crypt(pw, gen_salt('bf', 10)) where lower(name) = lower(nm);
    if not found then raise exception 'moderator not found'; end if;
    delete from kf_admin_sessions where mod_id = (select id from kf_mods where lower(name) = lower(nm));
    perform kf_log('moderator password', nm);
  elsif p_action = 'remove' then
    delete from kf_mods where lower(name) = lower(nm);
    perform kf_log('remove moderator', nm);
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return coalesce((select json_agg(json_build_object('name', m.name, 'created_at', m.created_at, 'last_login', m.last_login,
      'actions', (select count(*) from kf_admin_log l where l.who = m.name and l.at > now() - interval '30 days')) order by m.name)
    from kf_mods m), '[]'::json);
end $$;

-- 2. Ban appeals -----------------------------------------------------------------------------------
create table if not exists public.kf_appeals (
  id          bigserial primary key,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  username    text not null,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  status      text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  answer      text not null default '' check (char_length(answer) <= 300),
  answered_at timestamptz
);
create index if not exists kf_appeals_account on public.kf_appeals (account, id desc);
alter table public.kf_appeals enable row level security;
revoke all on public.kf_appeals from anon, authenticated;

create or replace function public.kf_appeal_info(p_acc uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('status', status, 'answer', answer, 'created_at', created_at, 'answered_at', answered_at)
  from kf_appeals where account = p_acc order by id desc limit 1;
$$;

-- A banned player asks for a review. They can't sign in, so they prove it's them with username and password.
create or replace function public.ban_appeal(p_user text, p_pass text, p_body text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record; u text := lower(btrim(coalesce(p_user, ''))); b text := btrim(coalesce(p_body, ''));
begin
  delete from kf_login_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_login_fails where username = u) >= 8 then raise exception 'too many tries'; end if;
  select * into r from kf_accounts where lower(username) = u;
  if not found or r.pass_hash <> crypt(coalesce(p_pass, ''), r.pass_hash) then
    insert into kf_login_fails (username) values (u);
    perform pg_sleep(1);
    raise exception 'wrong username or password';
  end if;
  if not exists (select 1 from kf_bans where account = r.id and (until is null or until > now())) then raise exception 'not banned'; end if;
  if char_length(b) < 1 or char_length(b) > 500 then raise exception 'invalid message'; end if;
  if exists (select 1 from kf_appeals where account = r.id and status = 'open') then raise exception 'appeal already open'; end if;
  if exists (select 1 from kf_appeals where account = r.id and created_at > now() - interval '1 day') then raise exception 'one appeal per day'; end if;
  insert into kf_appeals (account, username, body) values (r.id, r.username, b);
  return kf_appeal_info(r.id);
end $$;

-- acc_login now also tells a banned player how their appeal went (replaces part 11's version).
create or replace function public.acc_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record; u text := lower(btrim(coalesce(p_user, ''))); k text := kf_ip(); b record;
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
  select * into b from kf_bans where account = r.id;
  if found then
    if b.until is null or b.until > now() then
      return json_build_object('error', 'banned', 'until', b.until, 'reason', b.reason, 'username', r.username, 'appeal', kf_appeal_info(r.id));
    end if;
    perform kf_unban(r.id);
  end if;
  return json_build_object('token', acc_new_session(r.id), 'username', r.username,
    'has_save', r.save_data is not null, 'save_at', r.save_at, 'save_baked', r.save_baked);
end $$;

-- The owner answers appeals: list | answer {id, accept, answer}. Accepting lifts the ban.
create or replace function public.admin_appeals(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); a record;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'answer' then
    select * into a from kf_appeals where id = (d->>'id')::bigint and status = 'open';
    if not found then raise exception 'appeal not found'; end if;
    update kf_appeals set status = case when (d->>'accept')::boolean then 'accepted' else 'rejected' end,
      answer = left(btrim(coalesce(d->>'answer', '')), 300), answered_at = now() where id = a.id;
    if (d->>'accept')::boolean then perform kf_unban(a.account); end if;
    perform kf_log(case when (d->>'accept')::boolean then 'appeal accepted' else 'appeal rejected' end, a.username);
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return coalesce((select json_agg(json_build_object('id', x.id, 'username', x.username, 'body', x.body, 'created_at', x.created_at,
      'status', x.status, 'answer', x.answer, 'answered_at', x.answered_at,
      'ban', (select json_build_object('reason', b.reason, 'until', b.until, 'created_at', b.created_at) from kf_bans b where b.account = x.account))
      order by (x.status = 'open') desc, x.id desc)
    from (select * from kf_appeals order by id desc limit 50) x), '[]'::json);
end $$;

-- 3. Two-step sign-in for the owner (time-based codes from an authenticator app) -------------------
alter table public.kf_admin_auth add column if not exists totp_secret bytea;
alter table public.kf_admin_auth add column if not exists totp_pending bytea;
alter table public.kf_admin_auth add column if not exists totp_on boolean not null default false;
alter table public.kf_admin_auth add column if not exists totp_last bigint not null default 0;

create or replace function public.kf_b32(p bytea) returns text
language plpgsql immutable as $$
declare a text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; bits text := ''; o text := ''; i int;
begin
  for i in 0 .. length(p) - 1 loop bits := bits || lpad(get_byte(p, i)::bit(8)::text, 8, '0'); end loop;
  while length(bits) % 5 <> 0 loop bits := bits || '0'; end loop;
  for i in 0 .. length(bits) / 5 - 1 loop o := o || substr(a, ('0'::bit(3)::text || substr(bits, i * 5 + 1, 5))::bit(8)::int + 1, 1); end loop;
  return o;
end $$;

create or replace function public.kf_totp_code(p_secret bytea, p_step bigint) returns text
language plpgsql immutable set search_path = public, extensions as $$
declare h bytea := extensions.hmac(int8send(p_step), p_secret, 'sha1'); o int; v bigint;
begin
  o := get_byte(h, 19) & 15;
  v := ((get_byte(h, o) & 127)::bigint << 24) | (get_byte(h, o + 1)::bigint << 16) | (get_byte(h, o + 2)::bigint << 8) | get_byte(h, o + 3)::bigint;
  return lpad((v % 1000000)::text, 6, '0');
end $$;

-- The step of a matching code (30-second windows, one step early or late allowed), or null.
create or replace function public.kf_totp_match(p_secret bytea, p_code text, p_after bigint) returns bigint
language plpgsql stable set search_path = public, extensions as $$
declare st bigint := floor(extract(epoch from now()) / 30)::bigint; s bigint;
begin
  if p_secret is null or coalesce(p_code, '') !~ '^\d{6}$' then return null; end if;
  for s in st - 1 .. st + 1 loop
    if s > coalesce(p_after, 0) and kf_totp_code(p_secret, s) = p_code then return s; end if;
  end loop;
  return null;
end $$;

-- Owner sign-in with the optional code (replaces part 6's admin_login).
drop function if exists public.admin_login(text);
create or replace function public.admin_login(p_pass text, p_code text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare ik text := coalesce(kf_ip(), 'all'); a record; t text; st bigint;
begin
  delete from kf_admin_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_admin_fails where key = ik) >= 5 or (select count(*) from kf_admin_fails) >= 30 then
    return json_build_object('error', 'locked');
  end if;
  select * into a from kf_admin_auth where k = 1;
  if not found then return json_build_object('error', 'not set up'); end if;
  if a.pass_hash <> crypt(coalesce(p_pass, ''), a.pass_hash) then
    insert into kf_admin_fails (key) values (ik);
    perform pg_sleep(1);
    return json_build_object('error', 'wrong password');
  end if;
  if a.totp_on then
    if coalesce(p_code, '') = '' then return json_build_object('error', 'code needed'); end if;
    st := kf_totp_match(a.totp_secret, btrim(p_code), a.totp_last);
    if st is null then
      insert into kf_admin_fails (key) values (ik);
      perform pg_sleep(1);
      return json_build_object('error', 'wrong code');
    end if;
    update kf_admin_auth set totp_last = st where k = 1;
  end if;
  delete from kf_admin_sessions where expires_at < now();
  t := encode(gen_random_bytes(32), 'hex');
  insert into kf_admin_sessions (token_hash, expires_at) values (encode(digest(t, 'sha256'), 'hex'), now() + interval '12 hours');
  perform kf_log('admin sign-in', case when a.totp_on then 'with code' else '' end);
  return json_build_object('token', t, 'expires_at', now() + interval '12 hours');
end $$;

-- status | setup (new key) | confirm {code} (turns it on) | disable {code}
create or replace function public.admin_2fa(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); a record; s bytea; st bigint;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  select * into a from kf_admin_auth where k = 1;
  if p_action = 'setup' then
    if a.totp_on then raise exception 'already on'; end if;
    s := gen_random_bytes(20);
    update kf_admin_auth set totp_pending = s where k = 1;
    return json_build_object('on', false, 'secret', kf_b32(s),
      'uri', 'otpauth://totp/Cookie%20Factory:owner?secret=' || kf_b32(s) || '&issuer=Cookie%20Factory&digits=6&period=30');
  elsif p_action = 'confirm' then
    st := kf_totp_match(a.totp_pending, btrim(coalesce(d->>'code', '')), 0);
    if st is null then raise exception 'wrong code'; end if;
    update kf_admin_auth set totp_secret = totp_pending, totp_pending = null, totp_on = true, totp_last = st where k = 1;
    perform kf_log('two-step sign-in on', '');
  elsif p_action = 'disable' then
    if not a.totp_on then return json_build_object('on', false); end if;
    st := kf_totp_match(a.totp_secret, btrim(coalesce(d->>'code', '')), a.totp_last);
    if st is null then raise exception 'wrong code'; end if;
    update kf_admin_auth set totp_secret = null, totp_on = false, totp_last = 0 where k = 1;
    perform kf_log('two-step sign-in off', '');
  elsif p_action <> 'status' then
    raise exception 'unknown action';
  end if;
  return json_build_object('on', (select totp_on from kf_admin_auth where k = 1));
end $$;

-- 4. Weekly summary: the last 7 days next to the 7 days before --------------------------------------
create or replace function public.admin_summary(p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r json := '{}'::json; w int; f timestamptz; t timestamptz; fd date; td date; k text;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  for w in 0 .. 1 loop
    t := now() - w * interval '7 days'; f := t - interval '7 days';
    td := (t at time zone 'UTC')::date; fd := (f at time zone 'UTC')::date;
    k := case when w = 0 then 'this' else 'last' end;
    r := (r::jsonb || jsonb_build_object(k, jsonb_build_object(
      'players',      (select count(distinct id) from kf_days where day > fd and day <= td),
      'new_players',  (select count(*) from kf_presence where first_seen >= f and first_seen < t),
      'returning',    (select count(distinct d.id) from kf_days d join kf_presence p on p.id = d.id
                         where d.day > fd and d.day <= td and p.first_seen < f),
      'accounts',     (select count(*) from kf_accounts where created_at >= f and created_at < t),
      'chat',         (select count(*) from kf_club_msgs where created_at >= f and created_at < t),
      'gifts',        (select count(*) from kf_gifts where created_at >= f and created_at < t),
      'reports',      (select count(*) from kf_reports where created_at >= f and created_at < t),
      'crashes',      (select count(*) from kf_errors where last_at >= f and last_at < t),
      'bans',         (select count(*) from kf_admin_log where action like '%ban account%' and at >= f and at < t),
      'clubs',        (select count(*) from kf_clubs where created_at >= f and created_at < t))))::json;
  end loop;
  return r;
end $$;

-- 5. Who may call what ------------------------------------------------------------------------------
revoke all on function public.lb_admin_ok(text) from public, anon, authenticated;
revoke all on function public.kf_mod_who(text) from public, anon, authenticated;
revoke all on function public.kf_log(text, text) from public, anon, authenticated;
revoke all on function public.kf_appeal_info(uuid) from public, anon, authenticated;
revoke all on function public.kf_b32(bytea) from public, anon, authenticated;
revoke all on function public.kf_totp_code(bytea, bigint) from public, anon, authenticated;
revoke all on function public.kf_totp_match(bytea, text, bigint) from public, anon, authenticated;
revoke all on function public.mod_login(text, text) from public;
revoke all on function public.mod_tools(text, text, json) from public;
revoke all on function public.admin_mods(text, text, json) from public;
revoke all on function public.ban_appeal(text, text, text) from public;
revoke all on function public.acc_login(text, text) from public;
revoke all on function public.admin_appeals(text, text, json) from public;
revoke all on function public.admin_login(text, text) from public;
revoke all on function public.admin_2fa(text, text, json) from public;
revoke all on function public.admin_summary(text) from public;
grant execute on function public.mod_login(text, text) to anon;
grant execute on function public.mod_tools(text, text, json) to anon;
grant execute on function public.admin_mods(text, text, json) to anon;
grant execute on function public.ban_appeal(text, text, text) to anon;
grant execute on function public.acc_login(text, text) to anon;
grant execute on function public.admin_appeals(text, text, json) to anon;
grant execute on function public.admin_login(text, text) to anon;
grant execute on function public.admin_2fa(text, text, json) to anon;
grant execute on function public.admin_summary(text) to anon;

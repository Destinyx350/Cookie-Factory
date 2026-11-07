-- Keksfabrik / Cookie Factory accounts, part 4 (game version 43)
-- Username + password accounts (no email needed) with a cloud save per account.
-- Needs part 2 (leaderboard-v2.sql) first, because the admin tools reuse its password check.
-- Safe to run again. Never deletes accounts or saves.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.kf_accounts (
  id          uuid primary key default gen_random_uuid(),
  username    text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  pass_hash   text not null,
  player_id   uuid,
  save_data   text check (save_data is null or octet_length(save_data) <= 1000000),
  save_at     timestamptz,
  save_baked  double precision not null default 0,
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);
create unique index if not exists kf_accounts_username_key on public.kf_accounts (lower(username));

create table if not exists public.kf_sessions (
  token_hash  text primary key,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_used   timestamptz not null default now()
);

create table if not exists public.kf_login_fails (
  username    text not null,
  at          timestamptz not null default now()
);

alter table public.kf_accounts    enable row level security;
alter table public.kf_sessions    enable row level security;
alter table public.kf_login_fails enable row level security;
revoke all on public.kf_accounts, public.kf_sessions, public.kf_login_fails from anon, authenticated;

-- Internal: turns a session token into an account id (sessions last 180 days of inactivity).
create or replace function public.acc_from_token(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare a uuid; h text := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
begin
  delete from kf_sessions where last_used < now() - interval '180 days';
  update kf_sessions set last_used = now() where token_hash = h returning account into a;
  if a is null then raise exception 'not signed in'; end if;
  return a;
end $$;

-- Internal: makes a new session and returns its token.
create or replace function public.acc_new_session(p_account uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare t text := encode(gen_random_bytes(32), 'hex');
begin
  insert into kf_sessions (token_hash, account) values (encode(digest(t, 'sha256'), 'hex'), p_account);
  update kf_accounts set last_login = now() where id = p_account;
  return t;
end $$;

create or replace function public.acc_signup(p_user text, p_pass text, p_player uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid;
begin
  p_user := btrim(coalesce(p_user, ''));
  if p_user !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'invalid username'; end if;
  if char_length(coalesce(p_pass, '')) < 6 or char_length(p_pass) > 72 then raise exception 'invalid password'; end if;
  if exists (select 1 from kf_accounts where lower(username) = lower(p_user)) then raise exception 'username taken'; end if;
  if (select count(*) from kf_accounts where created_at > now() - interval '1 minute') >= 20 then raise exception 'busy, try again in a minute'; end if;
  insert into kf_accounts (username, pass_hash, player_id) values (p_user, crypt(p_pass, gen_salt('bf', 10)), p_player) returning id into a;
  return json_build_object('token', acc_new_session(a), 'username', p_user, 'has_save', false);
end $$;

create or replace function public.acc_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record; u text := lower(btrim(coalesce(p_user, '')));
begin
  -- Failed logins return an error object instead of raising, so the failed attempt is remembered
  -- (an exception would undo it) and 8 wrong tries lock the name for 15 minutes.
  delete from kf_login_fails where at < now() - interval '15 minutes';
  if (select count(*) from kf_login_fails where username = u) >= 8 then
    return json_build_object('error', 'too many tries');
  end if;
  select * into r from kf_accounts where lower(username) = u;
  if not found or r.pass_hash <> crypt(coalesce(p_pass, ''), r.pass_hash) then
    insert into kf_login_fails (username) values (u);
    perform pg_sleep(1);
    return json_build_object('error', 'wrong username or password');
  end if;
  delete from kf_login_fails where username = u;
  return json_build_object('token', acc_new_session(r.id), 'username', r.username,
    'has_save', r.save_data is not null, 'save_at', r.save_at, 'save_baked', r.save_baked);
end $$;

create or replace function public.acc_logout(p_token text)
returns void language sql security definer set search_path = public, extensions as $$
  delete from kf_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

create or replace function public.acc_me(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  select * into r from kf_accounts where id = acc_from_token(p_token);
  return json_build_object('username', r.username, 'has_save', r.save_data is not null, 'save_at', r.save_at,
    'save_baked', r.save_baked, 'created_at', r.created_at);
end $$;

create or replace function public.acc_save(p_token text, p_data text, p_baked double precision)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); t timestamptz;
begin
  if p_data is null or octet_length(p_data) < 20 then raise exception 'empty save'; end if;
  if octet_length(p_data) > 1000000 then raise exception 'save too big'; end if;
  update kf_accounts set save_data = p_data, save_at = now(),
         save_baked = greatest(0, least(coalesce(p_baked, 0), 9.9e299))
    where id = a and (save_at is null or save_at < now() - interval '15 seconds')
    returning save_at into t;
  return json_build_object('saved', t is not null, 'save_at', coalesce(t, (select save_at from kf_accounts where id = a)));
end $$;

create or replace function public.acc_load(p_token text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare d text;
begin
  select save_data into d from kf_accounts where id = acc_from_token(p_token);
  if d is null then raise exception 'no save'; end if;
  return d;
end $$;

create or replace function public.acc_password(p_token text, p_old text, p_new text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); h text;
begin
  select pass_hash into h from kf_accounts where id = a;
  if h <> crypt(coalesce(p_old, ''), h) then perform pg_sleep(1); raise exception 'wrong password'; end if;
  if char_length(coalesce(p_new, '')) < 6 or char_length(p_new) > 72 then raise exception 'invalid password'; end if;
  update kf_accounts set pass_hash = crypt(p_new, gen_salt('bf', 10)) where id = a;
end $$;

create or replace function public.acc_delete(p_token text, p_pass text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); h text;
begin
  select pass_hash into h from kf_accounts where id = a;
  if h <> crypt(coalesce(p_pass, ''), h) then perform pg_sleep(1); raise exception 'wrong password'; end if;
  delete from kf_accounts where id = a;
end $$;

-- Admin: list accounts, set a new password for someone who forgot theirs, delete an account.
create or replace function public.admin_accounts(p_pass text, p_action text, p_id uuid default null, p_new text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
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

revoke all on function public.acc_from_token(text) from public, anon, authenticated;
revoke all on function public.acc_new_session(uuid) from public, anon, authenticated;
revoke all on function public.acc_signup(text, text, uuid) from public;
revoke all on function public.acc_login(text, text) from public;
revoke all on function public.acc_logout(text) from public;
revoke all on function public.acc_me(text) from public;
revoke all on function public.acc_save(text, text, double precision) from public;
revoke all on function public.acc_load(text) from public;
revoke all on function public.acc_password(text, text, text) from public;
revoke all on function public.acc_delete(text, text) from public;
revoke all on function public.admin_accounts(text, text, uuid, text) from public;
grant execute on function public.acc_signup(text, text, uuid) to anon;
grant execute on function public.acc_login(text, text) to anon;
grant execute on function public.acc_logout(text) to anon;
grant execute on function public.acc_me(text) to anon;
grant execute on function public.acc_save(text, text, double precision) to anon;
grant execute on function public.acc_load(text) to anon;
grant execute on function public.acc_password(text, text, text) to anon;
grant execute on function public.acc_delete(text, text) to anon;
grant execute on function public.admin_accounts(text, text, uuid, text) to anon;

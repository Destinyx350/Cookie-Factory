-- Keksfabrik / Cookie Factory account bans, part 11 (game version 52)
-- Needs parts 1–10 first. Safe to run again.
--
-- A banned account can't sign in, and every online feature that needs the account (saving to the account,
-- clubs, chat, gifts, friends, push) stops with the reason and end time. Its leaderboard spot is banned too.
-- "Block device" also stops new accounts, clubs, gifts and reports from the devices the player used.

-- 1. Tables ---------------------------------------------------------------------------------------
create table if not exists public.kf_bans (
  account     uuid primary key references public.kf_accounts(id) on delete cascade,
  username    text not null,
  reason      text not null default '' check (char_length(reason) <= 200),
  until       timestamptz,                       -- null = forever
  lb_id       uuid,                              -- leaderboard spot this ban added to lb_banned
  devices     text[] not null default '{}',      -- hashed device addresses blocked with the ban
  created_at  timestamptz not null default now()
);
create table if not exists public.kf_device_bans (
  ip          text primary key,
  account     uuid references public.kf_accounts(id) on delete cascade,
  until       timestamptz,
  created_at  timestamptz not null default now()
);
-- Remember which (hashed) device address each sign-in came from, so a ban can also block the device.
alter table public.kf_sessions add column if not exists ip text default public.kf_ip();

alter table public.kf_bans enable row level security;
alter table public.kf_device_bans enable row level security;
revoke all on public.kf_bans, public.kf_device_bans from anon, authenticated;

-- The text the game shows: 'banned: {"until": …, "reason": …}'
create or replace function public.kf_ban_msg(p_until timestamptz, p_reason text) returns text
language sql stable as $$
  select 'banned: ' || json_build_object('until', p_until, 'reason', coalesce(p_reason, ''))::text;
$$;

-- 2. Checks in the account functions --------------------------------------------------------------
create or replace function public.acc_from_token(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare a uuid; h text := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex'); b record;
begin
  delete from kf_sessions where last_used < now() - interval '180 days';
  update kf_sessions set last_used = now() where token_hash = h returning account into a;
  if a is null then raise exception 'not signed in'; end if;
  select * into b from kf_bans where account = a;
  if found then
    if b.until is null or b.until > now() then raise exception '%', kf_ban_msg(b.until, b.reason); end if;
    perform kf_unban(a);
  end if;
  return a;
end $$;

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
    if b.until is null or b.until > now() then return json_build_object('error', 'banned', 'until', b.until, 'reason', b.reason); end if;
    perform kf_unban(r.id);
  end if;
  return json_build_object('token', acc_new_session(r.id), 'username', r.username,
    'has_save', r.save_data is not null, 'save_at', r.save_at, 'save_baked', r.save_baked);
end $$;

-- Blocked devices can't make new accounts, clubs, cloud codes, gifts, friend requests or reports.
create or replace function public.kf_rate_hit(p_kind text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare k text := kf_ip(); d record;
begin
  if k is null then return; end if;
  if p_kind not in ('error', 'track') then
    select * into d from kf_device_bans where ip = k;
    if found then
      if d.until is null or d.until > now() then
        raise exception '%', kf_ban_msg(d.until, (select reason from kf_bans where account = d.account));
      end if;
      delete from kf_device_bans where ip = k;
    end if;
  end if;
  if random() < 0.02 then delete from kf_rate where at < now() - interval '2 days'; end if;
  if (select count(*) from kf_rate where kind = p_kind and key = k and at > now() - p_window) >= p_max then
    raise exception 'too many requests, try again later';
  end if;
  insert into kf_rate (kind, key) values (p_kind, k);
end $$;

-- 3. Ban and unban (internal) ---------------------------------------------------------------------
create or replace function public.kf_unban(p_acc uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select * into b from kf_bans where account = p_acc;
  if not found then return; end if;
  if b.lb_id is not null then delete from lb_banned where id = b.lb_id; end if;
  delete from kf_device_bans where account = p_acc;
  delete from kf_bans where account = p_acc;
end $$;

-- 4. Admin -----------------------------------------------------------------------------------------
-- list | ban {user, hours (0 = forever), reason, device, wipe_chat} | unban {user}
create or replace function public.admin_bans(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); r kf_accounts; hrs double precision; til timestamptz; why text; devs text[] := '{}'; lb uuid;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action in ('ban', 'unban') then
    select * into r from kf_accounts where lower(username) = lower(btrim(coalesce(d->>'user', '')));
    if not found then raise exception 'player not found'; end if;
  end if;
  if p_action = 'ban' then
    hrs := coalesce(nullif(d->>'hours', '')::double precision, 0);
    if hrs < 0 or hrs > 87600 then raise exception 'invalid hours'; end if;
    til := case when hrs = 0 then null else now() + make_interval(secs => hrs * 3600) end;
    why := left(btrim(coalesce(d->>'reason', '')), 200);
    perform kf_unban(r.id);
    if coalesce((d->>'device')::boolean, false) then
      select coalesce(array_agg(distinct ip), '{}') into devs from kf_sessions where account = r.id and ip is not null;
      insert into kf_device_bans (ip, account, until) select x, r.id, til from unnest(devs) x
        on conflict (ip) do update set account = excluded.account, until = excluded.until;
    end if;
    if r.lb_id is not null and not exists (select 1 from lb_banned where id = r.lb_id) then
      insert into lb_banned (id, name) values (r.lb_id, coalesce((select name from leaderboard where id = r.lb_id), r.username));
      lb := r.lb_id;
    end if;
    insert into kf_bans (account, username, reason, until, lb_id, devices) values (r.id, r.username, why, til, lb, devs);
    delete from kf_club_members where account = r.id;          -- leaves the club (a leader hands it on)
    delete from kf_push_subs where account = r.id;
    if coalesce((d->>'wipe_chat')::boolean, false) then delete from kf_club_msgs where account = r.id; end if;
    perform kf_log('ban account', r.username || case when til is null then ' forever' else ' until ' || to_char(til, 'YYYY-MM-DD HH24:MI') end
      || case when cardinality(devs) > 0 then ' + ' || cardinality(devs) || ' device(s)' else '' end || case when why <> '' then ': ' || why else '' end);
  elsif p_action = 'unban' then
    perform kf_unban(r.id);
    perform kf_log('unban account', r.username);
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  for lb in select account from kf_bans where until is not null and until < now() limit 50 loop perform kf_unban(lb); end loop;   -- ended bans
  return coalesce((select json_agg(json_build_object('username', b.username, 'reason', b.reason, 'until', b.until, 'created_at', b.created_at,
      'devices', cardinality(b.devices)) order by b.created_at desc) from kf_bans b), '[]'::json);
end $$;

-- 5. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_ban_msg(timestamptz, text) from public, anon, authenticated;
revoke all on function public.kf_unban(uuid) from public, anon, authenticated;
revoke all on function public.acc_from_token(text) from public, anon, authenticated;
revoke all on function public.kf_rate_hit(text, int, interval) from public, anon, authenticated;
revoke all on function public.acc_login(text, text) from public;
revoke all on function public.admin_bans(text, text, json) from public;
grant execute on function public.acc_login(text, text) to anon;
grant execute on function public.admin_bans(text, text, json) to anon;

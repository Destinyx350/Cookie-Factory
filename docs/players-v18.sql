-- Keksfabrik / Cookie Factory: one name per player, warnings, ban history, player card and to-do list, part 18 (game version 64)
-- Needs parts 1–17 first. Safe to run again.

-- 1. One name ---------------------------------------------------------------------------------------
-- The leaderboard is for accounts only and always shows the username. The bakery name is only decoration in the game.
-- Usernames can change once every 30 days; old names are kept so the admin (and old links) still find the player.
alter table public.kf_accounts add column if not exists renamed_at timestamptz;
alter table public.kf_accounts add column if not exists rename_free boolean not null default false;
create table if not exists public.kf_name_hist (
  id          bigserial primary key,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  name        text not null,
  changed_at  timestamptz not null default now()
);
create index if not exists kf_name_hist_acc on public.kf_name_hist (account);
create index if not exists kf_name_hist_name on public.kf_name_hist (lower(name));
alter table public.kf_name_hist enable row level security;
revoke all on public.kf_name_hist from anon, authenticated;

-- Spots without an account leave the leaderboard; linked spots take the username.
delete from public.lb_period where id not in (select lb_id from public.kf_accounts where lb_id is not null);
delete from public.leaderboard where id not in (select lb_id from public.kf_accounts where lb_id is not null);
update public.leaderboard l set name = a.username from public.kf_accounts a where a.lb_id = l.id and l.name is distinct from a.username;
update public.lb_period p set name = a.username from public.kf_accounts a where a.lb_id = p.id and p.name is distinct from a.username;

-- The score send now carries the session token: it links a new spot to the account and takes its username.
drop function if exists public.submit_score(uuid, text, double precision);
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
  select score, updated_at, name into old_score, old_time, old_name from leaderboard where id = p_id;
  if (old_name is null or lower(old_name) <> lower(p_name))
     and exists (select 1 from leaderboard where lower(name) = lower(p_name) and id <> p_id) then
    raise exception 'name taken';
  end if;
  perform lb_close_periods();

  if old_time is null then
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


create or replace function public.acc_lb_link(p_token text, p_lb uuid default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); cur uuid; l record; u text;
begin
  select lb_id, username into cur, u from kf_accounts where id = a;
  if cur is null and p_lb is not null and not exists (select 1 from kf_accounts where lb_id = p_lb) then
    update kf_accounts set lb_id = p_lb where id = a;
    cur := p_lb;
  end if;
  if cur is null then return json_build_object('lb_id', null); end if;
  update leaderboard set name = u where id = cur and name is distinct from u;
  select name, score, updated_at into l from leaderboard where id = cur;
  return json_build_object('lb_id', cur, 'name', l.name, 'score', l.score, 'updated_at', l.updated_at,
    'other_taken', p_lb is not null and exists (select 1 from kf_accounts where lb_id = p_lb and id <> a));
end $$;

-- Puts a new username everywhere it is shown (internal).
create or replace function public.kf_name_apply(p_acc uuid, p_new text) returns void
language plpgsql security definer set search_path = public as $$
declare lb uuid := (select lb_id from kf_accounts where id = p_acc);
begin
  if lb is not null then
    update leaderboard set name = p_new where id = lb;
    update lb_period set name = p_new where id = lb;
    update lb_banned set name = p_new where id = lb;
  end if;
  update kf_club_msgs set username = p_new where account = p_acc;
  update kf_bans set username = p_new where account = p_acc;
  update kf_appeals set username = p_new where account = p_acc;
  update kf_save_flags set username = p_new where account = p_acc;
end $$;

-- A username is free when no account uses it and no other player gave it up in the last 90 days.
create or replace function public.kf_name_free(p_name text, p_acc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from kf_accounts where lower(username) = lower(p_name) and id is distinct from p_acc)
     and not exists (select 1 from kf_name_hist where lower(name) = lower(p_name) and account is distinct from p_acc and changed_at > now() - interval '90 days')
$$;

create or replace function public.acc_name_info(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); r kf_accounts;
begin
  select * into r from kf_accounts where id = a;
  return json_build_object('username', r.username, 'renamed_at', r.renamed_at, 'free', r.rename_free,
    'next_at', case when r.rename_free or r.renamed_at is null then null else r.renamed_at + interval '30 days' end,
    'old', coalesce((select json_agg(name order by changed_at desc) from (select name, changed_at from kf_name_hist where account = a order by changed_at desc limit 5) h), '[]'::json));
end $$;

create or replace function public.acc_rename(p_token text, p_new text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); r kf_accounts; n text := btrim(coalesce(p_new, '')); case_only boolean;
begin
  select * into r from kf_accounts where id = a;
  if n !~ '^[A-Za-z0-9_]{3,16}$' then raise exception 'invalid username'; end if;
  if n = r.username then raise exception 'same name'; end if;
  case_only := lower(n) = lower(r.username);   -- only upper/lower case changes: always allowed
  if not case_only and not r.rename_free and r.renamed_at is not null and r.renamed_at > now() - interval '30 days' then raise exception 'rename wait'; end if;
  if not kf_text_ok(n) then raise exception 'blocked word'; end if;
  if not kf_name_free(n, a) then raise exception 'username taken'; end if;
  if not case_only then
    perform kf_rate_hit('rename', 5, interval '1 day');
    insert into kf_name_hist (account, name) values (a, r.username);
  end if;
  update kf_accounts set username = n, renamed_at = case when case_only then renamed_at else now() end,
    rename_free = case when case_only then rename_free else false end where id = a;
  perform kf_name_apply(a, n);
  return acc_name_info(p_token);
end $$;

-- Sign-in also works with a name the player gave up in the last 90 days (for example after a forced rename).
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
  if not found then
    select a.* into r from kf_name_hist h join kf_accounts a on a.id = h.account
      where lower(h.name) = u and h.changed_at > now() - interval '90 days' order by h.changed_at desc limit 1;
  end if;
  if r.id is null or r.pass_hash <> crypt(coalesce(p_pass, ''), r.pass_hash) then
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

-- Profiles also open with an old name (old share links keep working).
create or replace function public.player_profile(p_name text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare n text := lower(btrim(coalesce(p_name, ''))); ac kf_accounts%rowtype; lb leaderboard%rowtype; c_name text; c_emoji text; c_tr int; rk bigint; wins bigint := 0; fr bigint := 0; seen timestamptz;
  st lb_stats%rowtype; ranks jsonb := '{}'::jsonb; wk text := kf_week_key();
begin
  select * into ac from kf_accounts where lower(username) = n;
  if ac.id is null then
    select * into lb from leaderboard where lower(name) = n;
    if lb.id is not null then select * into ac from kf_accounts where lb_id = lb.id; end if;
  elsif ac.lb_id is not null then
    select * into lb from leaderboard where id = ac.lb_id;
  end if;
  if ac.id is null and lb.id is null then   -- an old name still finds the player
    select a.* into ac from kf_name_hist h join kf_accounts a on a.id = h.account where lower(h.name) = n order by h.changed_at desc limit 1;
    if ac.lb_id is not null then select * into lb from leaderboard where id = ac.lb_id; end if;
  end if;
  if ac.id is null and lb.id is null then raise exception 'player not found'; end if;
  if lb.id is not null then
    rk := (select count(*) + 1 from leaderboard where score > lb.score);
    wins := (select count(*) from lb_rewards where id = lb.id);
    select * into st from lb_stats where id = lb.id;
    if st.id is not null and not exists (select 1 from lb_banned where id = lb.id) then
      if st.clicks > 0 then ranks := ranks || jsonb_build_object('clicks', (select count(*) + 1 from lb_stats where clicks > st.clicks)); end if;
      if st.gold > 0 then ranks := ranks || jsonb_build_object('gold', (select count(*) + 1 from lb_stats where gold > st.gold)); end if;
      if st.ascs > 0 then ranks := ranks || jsonb_build_object('asc', (select count(*) + 1 from lb_stats where ascs > st.ascs)); end if;
      if st.fast_wk = wk then ranks := ranks || jsonb_build_object('fast', (select count(*) + 1 from lb_stats where fast_wk = wk and (fast < st.fast or (fast = st.fast and fast_at < st.fast_at))), 'fast_s', st.fast); end if;
    end if;
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
    'friends', fr, 'online', seen is not null and seen > now() - interval '3 minutes', 'stats', coalesce(ac.profile, '{}'::jsonb),
    'style', coalesce(ac.pstyle, '{}'::jsonb), 'ranks', ranks);
end $$;


-- 2. Player history: warnings, bans, mutes and renames --------------------------------------------------
create table if not exists public.kf_player_log (
  id          bigserial primary key,
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  kind        text not null check (kind in ('warn', 'ban', 'unban', 'ended', 'mute', 'unmute', 'rename')),
  reason      text not null default '',
  hours       double precision,            -- null: no time; 0: forever
  strike      int,
  who         text not null default 'owner',
  tx          bigint not null default txid_current(),
  created_at  timestamptz not null default now(),
  seen_at     timestamptz                  -- warnings and renames: when the player saw the notice
);
create index if not exists kf_player_log_acc on public.kf_player_log (account, created_at desc);
alter table public.kf_player_log enable row level security;
revoke all on public.kf_player_log from anon, authenticated;

create or replace function public.kf_who() returns text
language sql stable set search_path = public as $$ select coalesce(nullif(current_setting('kf.who', true), ''), 'owner') $$;

-- Every ban and mute is written down, whichever tool made it. A ban replaced in the same step is not logged as an unban.
create or replace function public.kf_ban_logged() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    delete from kf_player_log where account = new.account and kind = 'unban' and tx = txid_current();
    insert into kf_player_log (account, kind, reason, hours, who)
    values (new.account, 'ban', coalesce(new.reason, ''), case when new.until is null then 0 else round(extract(epoch from (new.until - now())) / 3600.0) end, kf_who());
    return new;
  end if;
  if not exists (select 1 from kf_accounts where id = old.account) then return old; end if;   -- the account itself is being deleted
  insert into kf_player_log (account, kind, reason, who, seen_at)
  values (old.account, case when old.until is not null and old.until <= now() then 'ended' else 'unban' end, '', kf_who(), now());
  return old;
end $$;
drop trigger if exists kf_ban_logged on public.kf_bans;
create trigger kf_ban_logged after insert or delete on public.kf_bans for each row execute function public.kf_ban_logged();

create or replace function public.kf_mute_logged() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from kf_accounts where id = old.account) then return old; end if;   -- the account itself is being deleted
    if old.until > now() then insert into kf_player_log (account, kind, who, seen_at) values (old.account, 'unmute', kf_who(), now()); end if;
    return old;
  end if;
  insert into kf_player_log (account, kind, reason, hours, who, seen_at)
  values (new.account, 'mute', coalesce(new.reason, ''), round(extract(epoch from (new.until - now())) / 3600.0), kf_who(), now());
  return new;
end $$;
drop trigger if exists kf_mute_logged on public.kf_mutes;
create trigger kf_mute_logged after insert or update or delete on public.kf_mutes for each row execute function public.kf_mute_logged();

-- Notices for the player: warnings and forced renames, each shown once.
create or replace function public.acc_notices(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); r json;
begin
  select coalesce(json_agg(json_build_object('kind', kind, 'reason', reason, 'strike', strike, 'hours', hours, 'at', created_at) order by id), '[]'::json)
    into r from kf_player_log where account = a and seen_at is null and kind in ('warn', 'rename');
  update kf_player_log set seen_at = now() where account = a and seen_at is null and kind in ('warn', 'rename');
  return json_build_object('notices', r, 'username', (select username from kf_accounts where id = a));
end $$;

-- 3. Admin: find players, one card per player, warnings with strikes, forced rename --------------------
create or replace function public.kf_strikes(p_acc uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from kf_player_log where account = p_acc and kind = 'warn' and created_at > now() - interval '180 days'
$$;

create or replace function public.admin_players(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json); q text := btrim(coalesce(d->>'q', d->>'user', '')); r kf_accounts; why text; st int; hrs double precision; nn text; i int; names text[];
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'find' then
    if q = '' then return '[]'::json; end if;
    return coalesce((select json_agg(x) from (
      select a.username, a.created_at, a.last_login,
        (select json_agg(h.name order by h.changed_at desc) from kf_name_hist h where h.account = a.id) old,
        (select score from leaderboard where id = a.lb_id) score,
        exists (select 1 from kf_bans b where b.account = a.id and (b.until is null or b.until > now())) banned,
        exists (select 1 from kf_mutes m where m.account = a.id and m.until > now()) muted,
        kf_strikes(a.id) strikes,
        (select seen_at > now() - interval '3 minutes' from kf_presence p where p.id = a.player_id) online
      from kf_accounts a
      where a.username ilike '%' || q || '%'
         or exists (select 1 from kf_name_hist h where h.account = a.id and h.name ilike '%' || q || '%')
      order by lower(a.username) = lower(q) desc, a.last_login desc nulls last limit 20) x), '[]'::json);
  end if;
  if p_action not in ('card', 'warn', 'rename') then raise exception 'unknown action'; end if;
  select * into r from kf_accounts where lower(username) = lower(q);
  if not found then
    select a.* into r from kf_name_hist h join kf_accounts a on a.id = h.account where lower(h.name) = lower(q) order by h.changed_at desc limit 1;
  end if;
  if r.id is null then raise exception 'player not found'; end if;
  if p_action = 'warn' then
    why := left(btrim(coalesce(d->>'reason', '')), 200);
    if why = '' then raise exception 'reason needed'; end if;
    st := kf_strikes(r.id) + 1;
    hrs := case st when 1 then null when 2 then 24 when 3 then 168 else 0 end;   -- warning, 24 h, 7 days, forever
    insert into kf_player_log (account, kind, reason, hours, strike, who) values (r.id, 'warn', why, hrs, st, kf_who());
    perform kf_log('warn player', r.username || ' · strike ' || st || ': ' || why);
    if hrs is not null then perform admin_bans(p_pass, 'ban', json_build_object('user', r.username, 'hours', hrs, 'reason', 'Strike ' || st || ': ' || why)); end if;
    return json_build_object('username', r.username, 'strike', st, 'hours', hrs);
  elsif p_action = 'rename' then
    why := left(btrim(coalesce(d->>'reason', '')), 200);
    for i in 1..30 loop
      nn := 'baker_' || lpad(floor(random() * 100000)::text, 5, '0');
      exit when kf_name_free(nn, r.id);
    end loop;
    insert into kf_name_hist (account, name) values (r.id, r.username);
    update kf_accounts set username = nn, rename_free = true where id = r.id;
    perform kf_name_apply(r.id, nn);
    insert into kf_player_log (account, kind, reason, who) values (r.id, 'rename', why, kf_who());
    perform kf_log('rename player', r.username || ' → ' || nn || case when why <> '' then ': ' || why else '' end);
    return json_build_object('username', nn, 'old', r.username);
  end if;
  names := array(select lower(r.username) union select lower(name) from kf_name_hist where account = r.id);
  return json_build_object(
    'account', json_build_object('username', r.username, 'created_at', r.created_at, 'last_login', r.last_login, 'save_at', r.save_at,
      'save_baked', r.save_baked, 'renamed_at', r.renamed_at, 'rename_free', r.rename_free, 'bakery', r.profile->>'bakery',
      'devices', (select count(*) from kf_sessions where account = r.id),
      'seen_at', (select seen_at from kf_presence where id = r.player_id)),
    'names', coalesce((select json_agg(json_build_object('name', name, 'until', changed_at) order by changed_at desc) from kf_name_hist where account = r.id), '[]'::json),
    'lb', (select json_build_object('score', l.score, 'rank', (select count(*) + 1 from leaderboard x where x.score > l.score),
        'banned', exists (select 1 from lb_banned b where b.id = l.id),
        'clicks', s.clicks, 'gold', s.gold, 'asc', s.ascs) from leaderboard l left join lb_stats s on s.id = l.id where l.id = r.lb_id),
    'club', (select json_build_object('name', c.name, 'emoji', c.emoji, 'owner', c.owner = r.id) from kf_club_members m join kf_clubs c on c.id = m.club where m.account = r.id),
    'ban', (select json_build_object('reason', reason, 'until', until, 'created_at', created_at) from kf_bans where account = r.id),
    'mute', (select json_build_object('reason', reason, 'until', until) from kf_mutes where account = r.id and until > now()),
    'strikes', kf_strikes(r.id),
    'log', coalesce((select json_agg(json_build_object('kind', kind, 'reason', reason, 'hours', hours, 'strike', strike, 'who', who, 'at', created_at) order by id desc)
      from (select * from kf_player_log where account = r.id order by id desc limit 50) z), '[]'::json),
    'reports', json_build_object('n', (select count(*) from kf_reports where lower(reported) = any(names)),
      'open', (select count(*) from kf_reports where lower(reported) = any(names) and status = 'open'),
      'last', coalesce((select json_agg(json_build_object('body', body, 'club', club_name, 'at', created_at, 'status', status) order by created_at desc)
        from (select * from kf_reports where lower(reported) = any(names) order by created_at desc limit 5) z), '[]'::json),
      'made', (select count(*) from kf_reports where reporter = r.id)),
    'gifts', json_build_object('sent', (select count(*) from kf_gifts where from_acc = r.id and created_at > now() - interval '30 days'),
      'got', (select count(*) from kf_gifts where to_acc = r.id and created_at > now() - interval '30 days')),
    'flags', (select count(*) from kf_save_flags where account = r.id and status = 'open'),
    'appeal', (select json_build_object('body', body, 'status', status, 'at', created_at) from kf_appeals where account = r.id order by created_at desc limit 1));
end $$;

-- 4. Admin to-do list: everything that waits for the owner, in one call -------------------------------
create or replace function public.admin_todo(p_pass text)
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  return json_build_object(
    'reports', json_build_object('n', (select count(*) from kf_reports where status = 'open'),
      'top', coalesce((select json_agg(json_build_object('id', id, 'who', reported, 'body', body, 'club', club_name, 'at', created_at) order by created_at desc)
        from (select * from kf_reports where status = 'open' order by created_at desc limit 5) z), '[]'::json)),
    'appeals', json_build_object('n', (select count(*) from kf_appeals where status = 'open'),
      'top', coalesce((select json_agg(json_build_object('id', id, 'who', username, 'body', body, 'at', created_at) order by created_at desc)
        from (select * from kf_appeals where status = 'open' order by created_at desc limit 5) z), '[]'::json)),
    'flags', json_build_object('n', (select count(*) from kf_save_flags where status = 'open'),
      'top', coalesce((select json_agg(json_build_object('id', id, 'who', username, 'old', old_baked, 'new', new_baked, 'at', created_at) order by created_at desc)
        from (select * from kf_save_flags where status = 'open' order by created_at desc limit 5) z), '[]'::json)),
    'feedback', json_build_object('n', (select count(*) from kf_feedback where status = 'open'),
      'top', coalesce((select json_agg(json_build_object('id', id, 'who', username, 'kind', kind, 'body', body, 'at', created_at) order by created_at desc)
        from (select * from kf_feedback where status = 'open' order by created_at desc limit 5) z), '[]'::json)),
    'crashes', json_build_object('n', (select count(*) from kf_errors where last_at > now() - interval '24 hours'),
      'top', coalesce((select json_agg(json_build_object('msg', left(msg, 160), 'count', count, 'at', last_at) order by count desc)
        from (select * from kf_errors where last_at > now() - interval '24 hours' order by count desc limit 5) z), '[]'::json)),
    'alarms', coalesce((select json_agg(json_build_object('kind', substr(k, 7), 'at', at) order by at desc) from kf_jobs where k like 'alert:%' and at > now() - interval '6 hours'), '[]'::json));
end $$;

insert into public.kf_schema (part, name) values (18, 'players-v18') on conflict (part) do update set applied_at = now();

-- 5. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_name_apply(uuid, text) from public, anon, authenticated;
revoke all on function public.kf_name_free(text, uuid) from public, anon, authenticated;
revoke all on function public.kf_who() from public, anon, authenticated;
revoke all on function public.kf_ban_logged() from public, anon, authenticated;
revoke all on function public.kf_mute_logged() from public, anon, authenticated;
revoke all on function public.kf_strikes(uuid) from public, anon, authenticated;
revoke all on function public.submit_score(uuid, text, double precision, text) from public;
revoke all on function public.acc_lb_link(text, uuid) from public;
revoke all on function public.acc_name_info(text) from public;
revoke all on function public.acc_rename(text, text) from public;
revoke all on function public.acc_login(text, text) from public;
revoke all on function public.player_profile(text) from public;
revoke all on function public.acc_notices(text) from public;
revoke all on function public.admin_players(text, text, json) from public;
revoke all on function public.admin_todo(text) from public;
grant execute on function public.submit_score(uuid, text, double precision, text) to anon;
grant execute on function public.acc_lb_link(text, uuid) to anon;
grant execute on function public.acc_name_info(text) to anon;
grant execute on function public.acc_rename(text, text) to anon;
grant execute on function public.acc_login(text, text) to anon;
grant execute on function public.player_profile(text) to anon;
grant execute on function public.acc_notices(text) to anon;
grant execute on function public.admin_players(text, text, json) to anon;
grant execute on function public.admin_todo(text) to anon;

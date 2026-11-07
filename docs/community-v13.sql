-- Keksfabrik / Cookie Factory club levels, feedback and admin alerts, part 13 (game version 54)
-- Needs parts 1–12 first. Safe to run again.

-- 1. Club levels -----------------------------------------------------------------------------------
-- Experience: 100 for every member who bakes in a week (counted per week), 500 for every club war won.
create or replace function public.kf_club_xp(p_club uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((select count(*) from kf_club_week w where w.club = p_club and w.gain > 0), 0) * 100
       + coalesce((select count(*) from kf_wars where winner = p_club), 0) * 500;
$$;

-- Level 1–10 with the experience needed for this and the next level.
create or replace function public.kf_club_level(p_xp bigint) returns json
language plpgsql immutable as $$
declare t bigint[] := array[0, 300, 800, 1600, 2800, 4500, 7000, 10000, 14000, 20000]; lv int := 1; i int;
begin
  for i in 1 .. 10 loop if coalesce(p_xp, 0) >= t[i] then lv := i; end if; end loop;
  return json_build_object('level', lv, 'xp', coalesce(p_xp, 0), 'cur', t[lv], 'next', case when lv < 10 then t[lv + 1] end);
end $$;

-- club_mine also returns the level (replaces part 10's version).
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
    'club', json_build_object('id', cl.id, 'name', cl.name, 'emoji', cl.emoji, 'descr', cl.descr, 'open', cl.open, 'trophies', cl.trophies, 'level', kf_club_level(kf_club_xp(cl.id))),
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


-- The club list shows each club's level too (replaces part 8's version).
create or replace function public.club_list(p_search text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
begin
  return coalesce((select json_agg(x order by x.week_gain desc, x.members desc) from (
    select cl.id, cl.name, cl.emoji, cl.descr, cl.open, cl.trophies,
           (select count(*) from kf_club_members m where m.club = cl.id) as members,
           coalesce((select sum(gain) from kf_club_week w where w.club = cl.id and w.week = lb_week(now())), 0) as week_gain,
           (kf_club_level(kf_club_xp(cl.id))->>'level')::int as level
    from kf_clubs cl
    where coalesce(p_search, '') = '' or cl.name ilike '%' || p_search || '%'
    order by week_gain desc limit 50) x), '[]'::json);
end $$;

-- 2. Feedback from players -------------------------------------------------------------------------
create table if not exists public.kf_feedback (
  id          bigserial primary key,
  kind        text not null check (kind in ('bug', 'idea', 'other')),
  body        text not null check (char_length(body) between 5 and 1000),
  player      uuid,
  username    text,
  ver         int not null default 0,
  ua          text not null default '',
  created_at  timestamptz not null default now(),
  status      text not null default 'open' check (status in ('open', 'done'))
);
alter table public.kf_feedback enable row level security;
revoke all on public.kf_feedback from anon, authenticated;

-- Anyone can send feedback (5 per device a day). With an account, the username comes along.
create or replace function public.kf_feedback_send(p_id uuid, p_token text, p_kind text, p_body text, p_ver int default 0, p_ua text default '')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare u text; b text := btrim(coalesce(p_body, ''));
begin
  if p_kind not in ('bug', 'idea', 'other') then raise exception 'invalid kind'; end if;
  if char_length(b) < 5 or char_length(b) > 1000 then raise exception 'invalid message'; end if;
  perform kf_rate_hit('feedback', 5, interval '1 day');
  if coalesce(p_token, '') <> '' then
    begin select username into u from kf_accounts where id = acc_from_token(p_token); exception when others then u := null; end;
  end if;
  insert into kf_feedback (kind, body, player, username, ver, ua) values (p_kind, b, p_id, u, coalesce(p_ver, 0), left(coalesce(p_ua, ''), 200));
  delete from kf_feedback where id not in (select id from kf_feedback order by id desc limit 500);
  return json_build_object('ok', true);
end $$;

-- list | done {id} | delete {id}
create or replace function public.admin_feedback(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d json := coalesce(p_data, '{}'::json);
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'done' then update kf_feedback set status = 'done' where id = (d->>'id')::bigint;
  elsif p_action = 'delete' then delete from kf_feedback where id = (d->>'id')::bigint;
  elsif p_action <> 'list' then raise exception 'unknown action'; end if;
  return coalesce((select json_agg(json_build_object('id', id, 'kind', kind, 'body', body, 'username', username, 'ver', ver, 'ua', ua,
      'created_at', created_at, 'status', status) order by (status = 'open') desc, id desc)
    from (select * from kf_feedback order by id desc limit 100) f), '[]'::json);
end $$;

-- 3. Alerts for the owner and moderators ------------------------------------------------------------
create table if not exists public.kf_admin_push (
  endpoint    text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  lang        text not null default 'en' check (lang in ('de', 'en')),
  mod_id      uuid references public.kf_mods(id) on delete cascade,   -- null = the owner
  created_at  timestamptz not null default now()
);
alter table public.kf_admin_push enable row level security;
revoke all on public.kf_admin_push from anon, authenticated;
alter table public.kf_push_queue add column if not exists target text check (target in ('owner', 'staff'));
alter table public.kf_push_queue add column if not exists kind text;
alter table public.kf_push_queue add column if not exists url text check (url ~ '^[a-z0-9_.-]{1,40}$');

-- status {endpoint} | subscribe {sub, lang} | unsubscribe {endpoint}. Owner and moderators.
create or replace function public.admin_push(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare who text := kf_mod_who(p_pass); d json := coalesce(p_data, '{}'::json); m uuid; ep text;
begin
  if who is null then raise exception 'wrong admin password'; end if;
  select mod_id into m from kf_admin_sessions where token_hash = encode(digest(coalesce(p_pass, ''), 'sha256'), 'hex');
  if p_action = 'subscribe' then
    ep := d->'sub'->>'endpoint';
    if ep is null or ep !~ '^https://' or char_length(ep) > 1000 or d->'sub'->'keys'->>'p256dh' is null or d->'sub'->'keys'->>'auth' is null then raise exception 'invalid subscription'; end if;
    insert into kf_admin_push (endpoint, p256dh, auth, lang, mod_id)
    values (ep, d->'sub'->'keys'->>'p256dh', d->'sub'->'keys'->>'auth', case when d->>'lang' = 'de' then 'de' else 'en' end, m)
    on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, mod_id = excluded.mod_id;
    perform set_config('kf.who', who, true);
    perform kf_log('alerts on', '');
  elsif p_action = 'unsubscribe' then
    delete from kf_admin_push where endpoint = d->>'endpoint';
  elsif p_action <> 'status' then
    raise exception 'unknown action';
  end if;
  return json_build_object('on', exists (select 1 from kf_admin_push where endpoint = coalesce(d->>'endpoint', d->'sub'->>'endpoint')),
    'devices', (select count(*) from kf_admin_push where mod_id is not distinct from m));
end $$;

-- Internal: queue an alert, at most one of each kind every 10 minutes, only if someone listens.
create or replace function public.kf_admin_alert(p_kind text, p_staff boolean, t_de text, t_en text, b_de text, b_en text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from kf_admin_push where p_staff or mod_id is null) then return; end if;
  if exists (select 1 from kf_push_queue where kind = p_kind and created_at > now() - interval '10 minutes') then return; end if;
  insert into kf_push_queue (account, t_de, t_en, b_de, b_en, target, kind, url)
  values (null, left(t_de, 80), left(t_en, 80), left(coalesce(b_de, ''), 160), left(coalesce(b_en, ''), 160),
          case when p_staff then 'staff' else 'owner' end, p_kind, 'admin.html');
end $$;

create or replace function public.kf_alert_on_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_admin_alert('report', true, '🚩 Neue Meldung', '🚩 New report', new.reported || ': „' || left(new.body, 100) || '“', new.reported || ': "' || left(new.body, 100) || '"');
  return null;
end $$;
drop trigger if exists kf_alert_report on public.kf_reports;
create trigger kf_alert_report after insert on public.kf_reports for each row execute function public.kf_alert_on_report();

create or replace function public.kf_alert_on_appeal() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_admin_alert('appeal', false, '📨 Neuer Einspruch', '📨 New ban appeal', new.username || ': „' || left(new.body, 100) || '“', new.username || ': "' || left(new.body, 100) || '"');
  return null;
end $$;
drop trigger if exists kf_alert_appeal on public.kf_appeals;
create trigger kf_alert_appeal after insert on public.kf_appeals for each row execute function public.kf_alert_on_appeal();

create or replace function public.kf_alert_on_feedback() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_admin_alert('feedback', false, '💬 Neues Feedback', '💬 New feedback',
    case new.kind when 'bug' then 'Fehler: ' when 'idea' then 'Idee: ' else '' end || left(new.body, 120),
    case new.kind when 'bug' then 'Bug: ' when 'idea' then 'Idea: ' else '' end || left(new.body, 120));
  return null;
end $$;
drop trigger if exists kf_alert_feedback on public.kf_feedback;
create trigger kf_alert_feedback after insert on public.kf_feedback for each row execute function public.kf_alert_on_feedback();

-- Only brand-new kinds of crashes (the same crash again only raises its counter).
create or replace function public.kf_alert_on_crash() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_admin_alert('crash', false, '🐞 Neuer Fehler im Spiel', '🐞 New crash in the game', left(new.msg, 150), left(new.msg, 150));
  return null;
end $$;
drop trigger if exists kf_alert_crash on public.kf_errors;
create trigger kf_alert_crash after insert on public.kf_errors for each row execute function public.kf_alert_on_crash();

-- The push sender also delivers alerts (to admin devices, opening admin.html). Replaces part 9's versions.
create or replace function public.push_take(p_secret text)
returns json language plpgsql security definer set search_path = public as $$
declare r json;
begin
  if not exists (select 1 from kf_push_cfg where k = 1 and secret = p_secret) then perform pg_sleep(1); raise exception 'forbidden'; end if;
  delete from kf_push_queue where sent_at < now() - interval '3 days';
  with q as (
    update kf_push_queue set sent_at = now()
    where id in (select id from kf_push_queue where sent_at is null order by id limit 100 for update skip locked)
    returning *)
  select coalesce(json_agg(json_build_object('id', q.id, 't_de', q.t_de, 't_en', q.t_en, 'b_de', q.b_de, 'b_en', q.b_en, 'url', q.url,
      'subs', case when q.target is not null then
          coalesce((select json_agg(json_build_object('endpoint', a.endpoint, 'p256dh', a.p256dh, 'auth', a.auth, 'lang', a.lang))
                    from kf_admin_push a where q.target = 'staff' or a.mod_id is null), '[]'::json)
        else
          coalesce((select json_agg(json_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth, 'lang', s.lang))
                    from (select * from kf_push_subs s where q.account is null or s.account = q.account limit 1000) s), '[]'::json)
        end)), '[]'::json)
  into r from q;
  return r;
end $$;

create or replace function public.push_gone(p_secret text, p_endpoints text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from kf_push_cfg where k = 1 and secret = p_secret) then raise exception 'forbidden'; end if;
  delete from kf_push_subs where endpoint = any(p_endpoints);
  delete from kf_admin_push where endpoint = any(p_endpoints);
end $$;

-- 4. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_club_xp(uuid) from public, anon, authenticated;
revoke all on function public.kf_club_level(bigint) from public, anon, authenticated;
revoke all on function public.kf_admin_alert(text, boolean, text, text, text, text) from public, anon, authenticated;
revoke all on function public.kf_alert_on_report() from public, anon, authenticated;
revoke all on function public.kf_alert_on_appeal() from public, anon, authenticated;
revoke all on function public.kf_alert_on_feedback() from public, anon, authenticated;
revoke all on function public.kf_alert_on_crash() from public, anon, authenticated;
revoke all on function public.club_mine(text) from public;
revoke all on function public.club_list(text) from public;
revoke all on function public.kf_feedback_send(uuid, text, text, text, int, text) from public;
revoke all on function public.admin_feedback(text, text, json) from public;
revoke all on function public.admin_push(text, text, json) from public;
revoke all on function public.push_take(text) from public;
revoke all on function public.push_gone(text, text[]) from public;
grant execute on function public.club_mine(text) to anon;
grant execute on function public.club_list(text) to anon;
grant execute on function public.kf_feedback_send(uuid, text, text, text, int, text) to anon;
grant execute on function public.admin_feedback(text, text, json) to anon;
grant execute on function public.admin_push(text, text, json) to anon;
grant execute on function public.push_take(text) to anon;
grant execute on function public.push_gone(text, text[]) to anon;

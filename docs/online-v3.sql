-- Keksfabrik / Cookie Factory online features, part 3 (game version 42)
-- Admin codes, announcements, global events, live counter, cloud save transfer.
-- Needs part 2 (leaderboard-v2.sql) first, because the admin tools reuse its password check.
-- Safe to run again. Never deletes scores or saves.

-- 1. Codes made in the admin panel --------------------------------------------------------------
create table if not exists public.kf_codes (
  code       text primary key check (code ~ '^[A-Z0-9]{3,24}$'),
  label      text not null default '' check (char_length(label) <= 40),
  gems       int  not null default 0 check (gems between 0 and 100000),
  stars      int  not null default 0 check (stars between 0 and 1000),
  minutes    int  not null default 0 check (minutes between 0 and 10080),  -- minutes of production
  max_uses   int  check (max_uses is null or max_uses > 0),               -- empty = unlimited
  uses       int  not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.kf_code_uses (
  code    text not null references public.kf_codes(code) on delete cascade,
  player  uuid not null,
  used_at timestamptz not null default now(),
  primary key (code, player)
);

-- 2. Announcements --------------------------------------------------------------------------------
create table if not exists public.kf_news (
  id         bigserial primary key,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '' check (char_length(body) <= 600),
  created_at timestamptz not null default now(),
  until      timestamptz
);

-- 3. Global events --------------------------------------------------------------------------------
create table if not exists public.kf_events (
  id         bigserial primary key,
  kind       text not null check (kind in ('prod', 'click', 'gold', 'orders')),
  mult       double precision not null check (mult > 1 and mult <= 10),
  title      text not null default '' check (char_length(title) <= 60),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- 4. Live counter ---------------------------------------------------------------------------------
create table if not exists public.kf_presence (
  id         uuid primary key,
  baked      double precision not null default 0,
  seen_at    timestamptz not null default now(),
  first_seen timestamptz not null default now()
);

-- 5. Cloud save transfer --------------------------------------------------------------------------
create table if not exists public.kf_saves (
  code       text primary key,
  data       text not null check (octet_length(data) <= 1000000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Who may read what: players only see current announcements and events, nothing else -----------
alter table public.kf_codes     enable row level security;
alter table public.kf_code_uses enable row level security;
alter table public.kf_news      enable row level security;
alter table public.kf_events    enable row level security;
alter table public.kf_presence  enable row level security;
alter table public.kf_saves     enable row level security;
revoke all on public.kf_codes, public.kf_code_uses, public.kf_news, public.kf_events, public.kf_presence, public.kf_saves from anon, authenticated;
drop policy if exists "Current announcements" on public.kf_news;
create policy "Current announcements" on public.kf_news for select to anon using (until is null or until > now());
grant select (id, title, body, created_at, until) on public.kf_news to anon;
drop policy if exists "Current and upcoming events" on public.kf_events;
create policy "Current and upcoming events" on public.kf_events for select to anon using (ends_at > now());
grant select (id, kind, mult, title, starts_at, ends_at) on public.kf_events to anon;

-- Functions ---------------------------------------------------------------------------------------
create or replace function public.redeem_code(p_id uuid, p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare c text; r record;
begin
  c := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  select * into r from kf_codes where code = c;
  if not found then perform pg_sleep(0.5); raise exception 'unknown code'; end if;
  if r.expires_at is not null and r.expires_at < now() then raise exception 'code expired'; end if;
  if exists (select 1 from kf_code_uses where code = c and player = p_id) then raise exception 'already used'; end if;
  update kf_codes set uses = uses + 1 where code = c and (max_uses is null or uses < max_uses);
  if not found then raise exception 'code used up'; end if;
  insert into kf_code_uses (code, player) values (c, p_id);
  return json_build_object('label', r.label, 'gems', r.gems, 'stars', r.stars, 'minutes', r.minutes);
end $$;

create or replace function public.kf_live()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'online', (select count(*) from kf_presence where seen_at > now() - interval '3 minutes'),
    'today',  (select count(*) from kf_presence where seen_at > now() - interval '24 hours'),
    'players', (select count(*) from kf_presence),
    'total',  (select coalesce(sum(baked), 0) from kf_presence));
$$;

-- Heartbeat: counts the player as online and adds their cookies to the worldwide total.
-- Uses the same growth limit as the leaderboard, so a faked number can't blow up the total.
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
      set baked = greatest(old_b, least(b, greatest(old_b, 1e8) * power(10::double precision, least(12 * hrs, 290)))),
          seen_at = now()
      where id = p_id;
  end if;
  return kf_live();
end $$;

-- Cloud transfer: upload gives a code valid for 24 hours, download returns the save.
create or replace function public.save_upload(p_data text)
returns json language plpgsql security definer set search_path = public as $$
declare abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; c text; i int; tries int := 0; exp timestamptz := now() + interval '24 hours';
begin
  if p_data is null or octet_length(p_data) < 20 then raise exception 'empty save'; end if;
  if octet_length(p_data) > 1000000 then raise exception 'save too big'; end if;
  delete from kf_saves where expires_at < now();
  if (select count(*) from kf_saves where created_at > now() - interval '1 minute') >= 30 then raise exception 'busy, try again in a minute'; end if;
  loop
    b := uuid_send(gen_random_uuid()); c := '';
    for i in 0..7 loop c := c || substr(abc, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from kf_saves where code = c);
    tries := tries + 1; if tries > 5 then raise exception 'try again'; end if;
  end loop;
  insert into kf_saves (code, data, expires_at) values (c, p_data, exp);
  return json_build_object('code', c, 'expires_at', exp);
end $$;

create or replace function public.save_download(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare c text; d text;
begin
  c := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if c like 'KEKS%' and length(c) = 12 then c := substr(c, 5); end if;
  select data into d from kf_saves where code = c and expires_at > now();
  if not found then perform pg_sleep(1); raise exception 'unknown or expired code'; end if;
  return d;
end $$;

-- Admin tools for codes, announcements, events and the live numbers (need the admin password).
create or replace function public.admin_online(p_pass text, p_action text, p_data json default null)
returns json language plpgsql security definer set search_path = public as $$
declare d json := coalesce(p_data, '{}'::json); c text; days double precision; hrs double precision;
begin
  if not lb_admin_ok(p_pass) then raise exception 'wrong admin password'; end if;
  if p_action = 'code_add' then
    c := upper(regexp_replace(coalesce(d->>'code', ''), '[^A-Za-z0-9]', '', 'g'));
    days := nullif(d->>'days', '')::double precision;
    insert into kf_codes (code, label, gems, stars, minutes, max_uses, expires_at)
    values (c, coalesce(d->>'label', ''), coalesce((d->>'gems')::int, 0), coalesce((d->>'stars')::int, 0), coalesce((d->>'minutes')::int, 0),
            nullif(d->>'max_uses', '')::int, case when days is null or days <= 0 then null else now() + days * interval '1 day' end)
    on conflict (code) do update set label = excluded.label, gems = excluded.gems, stars = excluded.stars, minutes = excluded.minutes,
            max_uses = excluded.max_uses, expires_at = excluded.expires_at;
  elsif p_action = 'code_del' then
    delete from kf_codes where code = upper(d->>'code');
  elsif p_action = 'news_add' then
    days := nullif(d->>'days', '')::double precision;
    insert into kf_news (title, body, until)
    values (d->>'title', coalesce(d->>'body', ''), case when days is null or days <= 0 then null else now() + days * interval '1 day' end);
  elsif p_action = 'news_del' then
    delete from kf_news where id = (d->>'id')::bigint;
  elsif p_action = 'event_add' then
    hrs := coalesce(nullif(d->>'hours', '')::double precision, 24);
    insert into kf_events (kind, mult, title, starts_at, ends_at)
    values (d->>'kind', (d->>'mult')::double precision, coalesce(d->>'title', ''), now(), now() + hrs * interval '1 hour');
  elsif p_action = 'event_end' then
    update kf_events set starts_at = least(starts_at, now() - interval '1 second'), ends_at = now() where id = (d->>'id')::bigint and ends_at > now();
  elsif p_action <> 'list' then
    raise exception 'unknown action';
  end if;
  return json_build_object(
    'live',   kf_live(),
    'codes',  coalesce((select json_agg(json_build_object('code', code, 'label', label, 'gems', gems, 'stars', stars, 'minutes', minutes,
                'max_uses', max_uses, 'uses', uses, 'expires_at', expires_at) order by created_at desc) from kf_codes), '[]'::json),
    'news',   coalesce((select json_agg(json_build_object('id', id, 'title', title, 'body', body, 'created_at', created_at, 'until', until) order by id desc)
                from (select * from kf_news order by id desc limit 20) n), '[]'::json),
    'events', coalesce((select json_agg(json_build_object('id', id, 'kind', kind, 'mult', mult, 'title', title, 'starts_at', starts_at, 'ends_at', ends_at) order by ends_at desc)
                from (select * from kf_events order by ends_at desc limit 20) e), '[]'::json));
end $$;

revoke all on function public.redeem_code(uuid, text) from public;
revoke all on function public.kf_live() from public;
revoke all on function public.kf_ping(uuid, double precision) from public;
revoke all on function public.save_upload(text) from public;
revoke all on function public.save_download(text) from public;
revoke all on function public.admin_online(text, text, json) from public;
grant execute on function public.redeem_code(uuid, text) to anon;
grant execute on function public.kf_live() to anon;
grant execute on function public.kf_ping(uuid, double precision) to anon;
grant execute on function public.save_upload(text) to anon;
grant execute on function public.save_download(text) to anon;
grant execute on function public.admin_online(text, text, json) to anon;

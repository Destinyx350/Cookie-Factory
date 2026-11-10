-- Keksfabrik / Cookie Factory category leaderboards and profile style, part 17 (game version 61)
-- Needs parts 1–16 first. Safe to run again.

-- 1. Category numbers per leaderboard spot ---------------------------------------------------------
-- Clicks, golden cookies and ascensions in total, and the fastest run to 1 billion cookies this week.
-- Growth is clamped (never rejected), like the cookie score, so honest players always count.
create table if not exists public.lb_stats (
  id          uuid primary key references public.leaderboard(id) on delete cascade,
  clicks      double precision not null default 0,
  gold        double precision not null default 0,
  ascs        double precision not null default 0,   -- ascensions ("asc" is a reserved word)
  fast        int,                         -- seconds from the start of a run to 1 billion cookies
  fast_wk     text,                        -- ISO week of that run, e.g. 2026-W46
  fast_at     timestamptz,
  updated_at  timestamptz not null default now()
);
create index if not exists lb_stats_clicks on public.lb_stats (clicks desc);
create index if not exists lb_stats_gold   on public.lb_stats (gold desc);
create index if not exists lb_stats_asc    on public.lb_stats (ascs desc);
create index if not exists lb_stats_fast   on public.lb_stats (fast_wk, fast);
alter table public.lb_stats enable row level security;
revoke all on public.lb_stats from anon, authenticated;

create or replace function public.kf_week_key() returns text
language sql stable set search_path = public as $$ select to_char(now() at time zone 'UTC', 'IYYY-"W"IW') $$;

-- Sent with the score every minute. Only for players on the leaderboard who aren't banned.
create or replace function public.submit_stats(p_id uuid, p_clicks double precision, p_gold double precision, p_asc double precision, p_fast int default null)
returns json language plpgsql security definer set search_path = public as $$
declare o lb_stats%rowtype; secs double precision; c double precision; g double precision; a double precision; f int; wk text := kf_week_key();
begin
  if not exists (select 1 from leaderboard where id = p_id) then raise exception 'not on the leaderboard'; end if;
  if exists (select 1 from lb_banned where id = p_id) then raise exception 'banned'; end if;
  c := case when p_clicks is null or p_clicks = 'NaN'::double precision then 0 else greatest(0, least(p_clicks, 1e15)) end;
  g := case when p_gold is null or p_gold = 'NaN'::double precision then 0 else greatest(0, least(p_gold, 1e12)) end;
  a := case when p_asc is null or p_asc = 'NaN'::double precision then 0 else greatest(0, least(p_asc, 1e9)) end;
  select * into o from lb_stats where id = p_id for update;
  if not found then
    insert into lb_stats (id, clicks, gold, ascs) values (p_id, least(c, 1e8), least(g, 1e6), least(a, 1e5)) returning * into o;
  else
    secs := greatest(1, extract(epoch from (now() - o.updated_at)));
    update lb_stats set
      clicks = greatest(o.clicks, least(c, o.clicks + 50 * secs + 500)),      -- at most 50 clicks a second
      gold   = greatest(o.gold,   least(g, o.gold + secs / 3 + 5)),          -- at most one golden cookie every 3 s
      ascs   = greatest(o.ascs,   least(a, o.ascs + secs / 60 + 1)),          -- at most one ascension a minute
      updated_at = now()
    where id = p_id returning * into o;
  end if;
  f := case when p_fast between 1 and 7 * 86400 then greatest(10, p_fast) end;   -- 10 s is the fastest that counts
  if f is not null and (o.fast_wk is distinct from wk or o.fast is null or f < o.fast) then
    update lb_stats set fast = f, fast_wk = wk, fast_at = now() where id = p_id returning * into o;
  end if;
  return json_build_object('clicks', o.clicks, 'gold', o.gold, 'asc', o.ascs, 'fast', case when o.fast_wk = wk then o.fast end);
end $$;

-- clicks | gold | asc | fast: top 50 and your own place
create or replace function public.lb_board(p_kind text, p_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare wk text := kf_week_key(); me json; col text;
begin
  if p_kind not in ('clicks', 'gold', 'asc', 'fast') then raise exception 'unknown board'; end if;
  col := case p_kind when 'asc' then 'ascs' else p_kind end;
  if p_kind = 'fast' then
    select json_build_object('rank', (select count(*) + 1 from lb_stats x where x.fast_wk = wk and (x.fast < s.fast or (x.fast = s.fast and x.fast_at < s.fast_at))), 'v', s.fast)
      into me from lb_stats s where s.id = p_id and s.fast_wk = wk;
    return json_build_object('me', me, 'top', coalesce((select json_agg(json_build_object('name', l.name, 'v', s.fast) order by s.fast, s.fast_at)
      from (select * from lb_stats where fast_wk = wk and id not in (select id from lb_banned) order by fast, fast_at limit 50) s join leaderboard l on l.id = s.id), '[]'::json));
  end if;
  execute format('select json_build_object(''rank'', (select count(*) + 1 from lb_stats x where x.%1$I > s.%1$I), ''v'', s.%1$I) from lb_stats s where s.id = $1 and s.%1$I > 0', col) into me using p_id;
  return json_build_object('me', me, 'top', coalesce((select json_agg(json_build_object('name', t.name, 'v', t.v) order by t.v desc, t.u)
    from (select l.name, (to_jsonb(s) ->> col)::double precision v, s.updated_at u from lb_stats s join leaderboard l on l.id = s.id
          where s.id not in (select id from lb_banned) and (to_jsonb(s) ->> col)::double precision > 0
          order by 2 desc, 3 limit 50) t), '[]'::json));
end $$;

-- 2. Profile style: avatar, color, motto and three showcase achievements (accounts only) -----------
alter table public.kf_accounts add column if not exists pstyle jsonb not null default '{}'::jsonb;

create or replace function public.acc_style(p_token text, p_data json)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); d json := coalesce(p_data, '{}'::json); n jsonb := '{}'::jsonb; m text; sh jsonb := '[]'::jsonb; x text;
  avs constant text[] := array['🍪','🧁','🍩','🎂','🥐','🍰','🍫','🥨','👩‍🍳','🧑‍🍳','👵','🐻','🐱','🐶','🦊','🐼','🦄','🐸','🚀','👑','⭐','🔥','🌈','🎮'];
  cols constant text[] := array['orange','gold','red','pink','purple','blue','teal','green'];
begin
  perform kf_rate_hit('style', 30, interval '1 hour');
  if d->>'av' = any(avs) then n := n || jsonb_build_object('av', d->>'av'); end if;
  if d->>'col' = any(cols) then n := n || jsonb_build_object('col', d->>'col'); end if;
  m := btrim(regexp_replace(coalesce(d->>'motto', ''), '[[:cntrl:]]', '', 'g'));
  if char_length(m) > 0 then
    if char_length(m) > 60 or m ~ '[<>]' then raise exception 'invalid motto'; end if;
    if not kf_text_ok(m) then raise exception 'blocked word'; end if;
    n := n || jsonb_build_object('motto', m);
  end if;
  if json_typeof(d->'show') = 'array' then
    for x in select json_array_elements_text(d->'show') limit 10 loop
      exit when jsonb_array_length(sh) >= 3;
      if x ~ '^[A-Za-z0-9_+.-]{1,40}$' and not sh ? x then sh := sh || to_jsonb(x); end if;
    end loop;
    n := n || jsonb_build_object('show', sh);
  end if;
  update kf_accounts set pstyle = n where id = a;
  return n::json;
end $$;

-- 3. Profiles show the style and the place in every board (replaces part 8's version) ------------
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

insert into public.kf_schema (part, name) values (17, 'boards-v17') on conflict (part) do update set applied_at = now();

-- 4. Who may call what ------------------------------------------------------------------------------
revoke all on function public.kf_week_key() from public, anon, authenticated;
revoke all on function public.submit_stats(uuid, double precision, double precision, double precision, int) from public;
revoke all on function public.lb_board(text, uuid) from public;
revoke all on function public.acc_style(text, json) from public;
revoke all on function public.player_profile(text) from public;
grant execute on function public.submit_stats(uuid, double precision, double precision, double precision, int) to anon;
grant execute on function public.lb_board(text, uuid) to anon;
grant execute on function public.acc_style(text, json) to anon;
grant execute on function public.player_profile(text) to anon;

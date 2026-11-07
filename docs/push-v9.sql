-- Keksfabrik / Cookie Factory push notifications, part 9 (game version 49)
-- Needs parts 1–8 first. Safe to run again.
-- Also deploy the edge function in supabase/functions/kf-push (see docs/PUSH.md). No secrets to copy: the database
-- makes its own shared secret, and the function makes its own push keys on first run and keeps them in kf_push_cfg.

-- pg_net lets the database wake the edge function right away (Supabase has it; plain PostgreSQL may not).
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then create extension if not exists pg_net; end if;
end $$;

create table if not exists public.kf_push_subs (
  endpoint    text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  account     uuid not null references public.kf_accounts(id) on delete cascade,
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  lang        text not null default 'en' check (lang in ('de', 'en')),
  created_at  timestamptz not null default now()
);
create index if not exists kf_push_subs_account on public.kf_push_subs (account);
create table if not exists public.kf_push_queue (
  id          bigserial primary key,
  account     uuid references public.kf_accounts(id) on delete cascade,   -- null = everyone
  t_de        text not null, t_en text not null,
  b_de        text not null default '', b_en text not null default '',
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index if not exists kf_push_queue_open on public.kf_push_queue (id) where sent_at is null;
create table if not exists public.kf_push_cfg (k int primary key default 1 check (k = 1), url text not null, secret text not null);
alter table public.kf_push_cfg add column if not exists vapid_pub text;
alter table public.kf_push_cfg add column if not exists vapid_priv text;
insert into public.kf_push_cfg (k, url, secret)
values (1, 'https://nmmlemtljjvfurlrvuvm.supabase.co/functions/v1/kf-push', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (k) do nothing;

alter table public.kf_push_subs  enable row level security;
alter table public.kf_push_queue enable row level security;
alter table public.kf_push_cfg   enable row level security;
revoke all on public.kf_push_subs, public.kf_push_queue, public.kf_push_cfg from anon, authenticated;
-- Only the edge function (Supabase's service role) may read the push keys.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, update on public.kf_push_cfg to service_role;
  end if;
end $$;

-- Players: turn push on or off for one device (browser).
create or replace function public.push_subscribe(p_token text, p_sub json, p_lang text default 'en')
returns json language plpgsql security definer set search_path = public, extensions as $$
declare a uuid := acc_from_token(p_token); ep text := p_sub->>'endpoint';
begin
  if ep is null or ep !~ '^https://' or char_length(ep) > 1000 or p_sub->'keys'->>'p256dh' is null or p_sub->'keys'->>'auth' is null then raise exception 'invalid subscription'; end if;
  insert into kf_push_subs (endpoint, account, p256dh, auth, lang)
  values (ep, a, p_sub->'keys'->>'p256dh', p_sub->'keys'->>'auth', case when p_lang = 'de' then 'de' else 'en' end)
  on conflict (endpoint) do update set account = excluded.account, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang;
  delete from kf_push_subs where account = a and endpoint not in (select endpoint from kf_push_subs where account = a order by created_at desc limit 5);
  return json_build_object('ok', true);
end $$;

-- The public push key for the game (the edge function makes the key pair on its first run).
create or replace function public.push_pubkey()
returns text language plpgsql security definer set search_path = public, extensions as $$
declare c record;
begin
  select * into c from kf_push_cfg where k = 1;
  if c.vapid_pub is null and to_regproc('net.http_post') is not null then
    begin
      execute 'select net.http_post(url := $1, headers := $2, body := $3)'
        using c.url, jsonb_build_object('Content-Type', 'application/json', 'x-kf-secret', c.secret), '{}'::jsonb;
    exception when others then null;
    end;
  end if;
  return c.vapid_pub;
end $$;

create or replace function public.push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from kf_push_subs where endpoint = p_endpoint;
$$;

-- Internal: put a notification in the queue.
create or replace function public.kf_push(p_acc uuid, t_de text, t_en text, b_de text default '', b_en text default '')
returns void language sql security definer set search_path = public as $$
  insert into kf_push_queue (account, t_de, t_en, b_de, b_en)
  select p_acc, left(t_de, 80), left(t_en, 80), left(coalesce(b_de, ''), 160), left(coalesce(b_en, ''), 160)
  where p_acc is null or exists (select 1 from kf_push_subs where account = p_acc);
$$;

-- Wakes the edge function right away (if pg_net and the setup line are there). Never blocks the game.
create or replace function public.kf_push_kick() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare c record;
begin
  select * into c from kf_push_cfg where k = 1;
  if c.url is null or to_regproc('net.http_post') is null then return null; end if;
  begin
    execute 'select net.http_post(url := $1, headers := $2, body := $3)'
      using c.url, jsonb_build_object('Content-Type', 'application/json', 'x-kf-secret', c.secret), '{}'::jsonb;
  exception when others then null;
  end;
  return null;
end $$;
drop trigger if exists kf_push_kick on public.kf_push_queue;
create trigger kf_push_kick after insert on public.kf_push_queue for each statement execute function public.kf_push_kick();

-- What sends a notification.
create or replace function public.kf_push_on_gift() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_push(new.to_acc, '🎁 Geschenk von ' || new.from_name, '🎁 Gift from ' || new.from_name,
    new.amount || case when new.kind = 'gems' then ' Edelsteine' else ' Sternenkrümel' end,
    new.amount || case when new.kind = 'gems' then ' gems' else ' star crumbs' end);
  return null;
end $$;
drop trigger if exists kf_push_gift on public.kf_gifts;
create trigger kf_push_gift after insert on public.kf_gifts for each row execute function public.kf_push_on_gift();

create or replace function public.kf_push_on_mail() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_push(new.to_acc, '✉️ ' || new.title, '✉️ ' || new.title, left(new.body, 160), left(new.body, 160));
  return null;
end $$;
drop trigger if exists kf_push_mail on public.kf_mail;
create trigger kf_push_mail after insert on public.kf_mail for each row execute function public.kf_push_on_mail();

create or replace function public.kf_push_on_friend() returns trigger language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if new.status <> 'pending' then return null; end if;
  select username into nm from kf_accounts where id = new.a;
  perform kf_push(new.b, '🤝 Freundschaftsanfrage', '🤝 Friend request', nm || ' möchte dein Freund sein.', nm || ' wants to be your friend.');
  return null;
end $$;
drop trigger if exists kf_push_friend on public.kf_friends;
create trigger kf_push_friend after insert on public.kf_friends for each row execute function public.kf_push_on_friend();

create or replace function public.kf_push_on_club_prize() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform kf_push(new.account, '🏆 Club-Preis!', '🏆 Club prize!', 'Platz ' || new.place || ' mit ' || new.club_name, '#' || new.place || ' with ' || new.club_name);
  return null;
end $$;
drop trigger if exists kf_push_club_prize on public.kf_club_rewards;
create trigger kf_push_club_prize after insert on public.kf_club_rewards for each row execute function public.kf_push_on_club_prize();

create or replace function public.kf_push_on_event() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.starts_at > now() + interval '5 minutes' then return null; end if;
  perform kf_push(null, '⚡ Event: ×' || new.mult, '⚡ Event: ×' || new.mult,
    coalesce(nullif(new.title, ''), 'Jetzt mitspielen!'), coalesce(nullif(new.title, ''), 'Play now!'));
  return null;
end $$;
drop trigger if exists kf_push_event on public.kf_events;
create trigger kf_push_event after insert on public.kf_events for each row execute function public.kf_push_on_event();

-- For the edge function only (checked with the shared secret): take waiting notifications with their devices.
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
  select coalesce(json_agg(json_build_object('id', q.id, 't_de', q.t_de, 't_en', q.t_en, 'b_de', q.b_de, 'b_en', q.b_en,
      'subs', coalesce((select json_agg(json_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth, 'lang', s.lang))
               from (select * from kf_push_subs s where q.account is null or s.account = q.account limit 1000) s), '[]'::json))), '[]'::json)
  into r from q;
  return r;
end $$;

create or replace function public.push_gone(p_secret text, p_endpoints text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from kf_push_cfg where k = 1 and secret = p_secret) then raise exception 'forbidden'; end if;
  delete from kf_push_subs where endpoint = any(p_endpoints);
end $$;

-- Who may call what
revoke all on function public.kf_push(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.kf_push_kick() from public, anon, authenticated;
revoke all on function public.kf_push_on_gift() from public, anon, authenticated;
revoke all on function public.kf_push_on_mail() from public, anon, authenticated;
revoke all on function public.kf_push_on_friend() from public, anon, authenticated;
revoke all on function public.kf_push_on_club_prize() from public, anon, authenticated;
revoke all on function public.kf_push_on_event() from public, anon, authenticated;
revoke all on function public.push_subscribe(text, json, text) from public;
revoke all on function public.push_unsubscribe(text) from public;
revoke all on function public.push_pubkey() from public;
revoke all on function public.push_take(text) from public;
revoke all on function public.push_gone(text, text[]) from public;
grant execute on function public.push_subscribe(text, json, text) to anon;
grant execute on function public.push_unsubscribe(text) to anon;
grant execute on function public.push_pubkey() to anon;
grant execute on function public.push_take(text) to anon;
grant execute on function public.push_gone(text, text[]) to anon;

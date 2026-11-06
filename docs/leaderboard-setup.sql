-- Keksfabrik / Cookie Factory leaderboard
-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
-- It is safe to run again.

create table if not exists public.leaderboard (
  id          uuid primary key,
  name        text not null check (char_length(name) between 2 and 20),
  score       double precision not null check (score >= 0 and score < 1e300),
  updated_at  timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

-- Everyone may read names and scores, but never the secret save ids.
drop policy if exists "Anyone can read the leaderboard" on public.leaderboard;
create policy "Anyone can read the leaderboard" on public.leaderboard for select to anon using (true);
revoke all on public.leaderboard from anon, authenticated;
grant select (name, score, updated_at) on public.leaderboard to anon;

-- Players can only write through this function. It checks the name and score,
-- never lowers a score, and ignores updates sent less than 20 seconds apart.
create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision)
returns void language plpgsql security definer set search_path = public as $$
begin
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 2 or char_length(p_name) > 20 or p_name ~ '[<>]' then
    raise exception 'invalid name';
  end if;
  if p_score is null or p_score = 'NaN'::double precision or p_score < 0 or p_score >= 1e300 then
    raise exception 'invalid score';
  end if;
  insert into leaderboard (id, name, score, updated_at)
  values (p_id, p_name, p_score, now())
  on conflict (id) do update
    set name = excluded.name, score = greatest(leaderboard.score, excluded.score), updated_at = now()
    where leaderboard.updated_at < now() - interval '20 seconds';
end $$;

-- Your place on the board for a given score.
create or replace function public.leaderboard_rank(p_score double precision)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) + 1 from leaderboard where score > p_score;
$$;

-- Lets a player take their own bakery off the board.
create or replace function public.leave_leaderboard(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from leaderboard where id = p_id;
$$;

revoke all on function public.submit_score(uuid, text, double precision) from public;
revoke all on function public.leaderboard_rank(double precision) from public;
revoke all on function public.leave_leaderboard(uuid) from public;
grant execute on function public.submit_score(uuid, text, double precision) to anon;
grant execute on function public.leaderboard_rank(double precision) to anon;
grant execute on function public.leave_leaderboard(uuid) to anon;

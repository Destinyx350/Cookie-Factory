-- Anti-cheat update for the leaderboard (version 37).
-- Paste into Supabase: SQL Editor -> New query (empty) -> Run.
create or replace function public.submit_score(p_id uuid, p_name text, p_score double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_score double precision;
  old_time  timestamptz;
  hrs       double precision;
begin
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char_length(p_name) < 2 or char_length(p_name) > 20 or p_name ~ '[<>]' then
    raise exception 'invalid name';
  end if;
  if p_score is null or p_score = 'NaN'::double precision or p_score < 0 or p_score >= 1e300 then
    raise exception 'invalid score';
  end if;
  select score, updated_at into old_score, old_time from leaderboard where id = p_id;
  if not found then
    if p_score > 1e15 then raise exception 'score too high for a new entry'; end if;
    insert into leaderboard (id, name, score, updated_at) values (p_id, p_name, p_score, now());
    return;
  end if;
  if old_time > now() - interval '20 seconds' then return; end if;
  hrs := extract(epoch from (now() - old_time)) / 3600.0;
  if p_score > greatest(old_score, 1e8) * power(10::double precision, least(4 * hrs, 290)) then
    raise exception 'score grew too fast';
  end if;
  update leaderboard set name = p_name, score = greatest(score, p_score), updated_at = now() where id = p_id;
end $$;

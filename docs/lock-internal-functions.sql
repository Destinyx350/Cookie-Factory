-- Keksfabrik / Cookie Factory: lock the internal helper functions (run once in the Supabase SQL Editor).
-- Supabase gives players (anon) execute rights on every new function by default, so "from public"
-- alone does not lock them. Players reach these helpers only through the game's own functions.
-- Safe to run again. Changes no data.
revoke all on function public.acc_from_token(text)   from public, anon, authenticated;
revoke all on function public.acc_new_session(uuid)  from public, anon, authenticated;
revoke all on function public.lb_admin_ok(text)      from public, anon, authenticated;
revoke all on function public.lb_close_periods()     from public, anon, authenticated;
revoke all on function public.club_close_weeks()     from public, anon, authenticated;
revoke all on function public.club_member_gone()     from public, anon, authenticated;

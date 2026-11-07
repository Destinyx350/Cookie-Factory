# 🔔 Turning on push notifications

Push notifications reach players even when the game is closed: gifts, friend requests, club prizes, messages from the admin and new global events. There are no secrets to copy: the database creates its own shared secret, and the sender creates its own push keys on its first run and keeps them in a locked table.

## 1. Database

Run [`push-v9.sql`](push-v9.sql) in the **SQL Editor** (after parts 1–8). It is safe to run again.

## 2. Edge function

1. In Supabase open **Edge Functions → Deploy a new function → Via editor**.
2. Name it `kf-push`, paste [`supabase/functions/kf-push/index.ts`](../supabase/functions/kf-push/index.ts) and click **Deploy**.
3. In the function's settings turn **Verify JWT** (JWT verification) **off**. The database calls it with its own shared secret instead.

That's all. The first time a player turns push on, the function creates the push keys.

## How it works

- Players turn push on under **Settings → Display → Push notifications** (needs an account; on iPhone/iPad the game must be added to the home screen first).
- Database triggers put notifications in `kf_push_queue`; `pg_net` wakes the `kf-push` function, which sends them with Web Push and removes devices that no longer exist.
- The function reads `kf_push_cfg` with Supabase's built-in service key, which only Supabase has. Players can only read the public key (`push_pubkey`).
- If the function isn't set up yet, nothing breaks: notifications wait in the queue and are cleaned up after 3 days.

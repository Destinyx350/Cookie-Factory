# 🔔 Turning on push notifications

Push notifications reach players even when the game is closed: gifts, friend requests, club prizes, messages from the admin and new global events. They need three parts in Supabase. The owner received the secret values privately; they are never stored in this repository.

## 1. Database

Run [`push-v9.sql`](push-v9.sql) in the **SQL Editor** (after parts 1–8). It is safe to run again.

## 2. Edge function

1. In Supabase open **Edge Functions → Deploy a new function → Via editor**.
2. Name it `kf-push`, paste [`supabase/functions/kf-push/index.ts`](../supabase/functions/kf-push/index.ts) and click **Deploy**.
3. In the function's settings turn **Verify JWT** (JWT verification) **off**. The database calls it with a shared secret instead.

## 3. Secrets

In **Edge Functions → Secrets**, add:

| Name | Value |
| --- | --- |
| `VAPID_PUBLIC` | the public key (it is also in `index.html` as `VAPID_PUB`) |
| `VAPID_PRIVATE` | the private key (received privately) |
| `KF_PUSH_SECRET` | the shared secret (received privately) |

Then run the one-line `kf_push_cfg` setup in the SQL Editor (received privately). It tells the database where the function is and which secret to send.

## How it works

- Players turn push on under **Settings → Display → Push notifications** (needs an account; on iPhone/iPad the game must be added to the home screen first).
- Database triggers put notifications in `kf_push_queue`; `pg_net` wakes the `kf-push` function, which sends them with Web Push and removes devices that no longer exist.
- If the function isn't set up yet, nothing breaks: notifications simply wait in the queue (and are cleaned up after 3 days).

# 🏆 Turning on the leaderboard

The leaderboard is already built into the game. It stays hidden until it is connected to a free [Supabase](https://supabase.com) database. Setup takes about 5 minutes.

## 1. Create the database

1. Sign up at **supabase.com** (signing in with GitHub works) and click **New project**.
2. Pick any name, for example `keksfabrik`, set a database password (you won't need it in the game), choose the region closest to your players, and click **Create new project**. Wait about a minute until it's ready.

## 2. Create the leaderboard table

1. In the left menu, open **SQL Editor** and click **New query**.
2. Copy everything from [`leaderboard-setup.sql`](leaderboard-setup.sql), paste it in, and click **Run**. It should say *Success. No rows returned*.

## 3. Connect the game

1. Open **Project Settings → API** (on newer dashboards: **Project Settings → Data API** and **API Keys**).
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`) and the **anon public** key (a long text starting with `eyJ`, or `sb_publishable_` on newer projects).
3. In `index.html`, find this line and paste both values between the quotes:

   ```js
   const LB_URL='',LB_KEY='';
   ```

   The anon key is meant to be public. It can only read names and scores and call the three leaderboard functions.

   Or send both values to Claude and ask it to switch the leaderboard on.

## How it works

- Players join from the trophy at the top (or the **Goals** tab) with their bakery name. Their total **cookies baked** is sent every minute while they play, and the board refreshes every 30 seconds while it's open.
- Scores only go up. Updates sent less than 20 seconds apart are ignored.
- Saves that used the admin panel can't join.
- Players can leave at any time, which deletes their entry.

## Weekly and monthly prizes, bans and admin tools (version 40)

Run [`leaderboard-v2.sql`](leaderboard-v2.sql) once in the **SQL Editor** (clear the editor first, paste, **Run**). It's safe to run again and never deletes scores. Then run the one-line admin password setup the owner received privately. It isn't stored in this repository.

- **This week / This month boards** count the cookies a player bakes during that week or month (weeks start Monday 00:00 UTC, months on the 1st).
- When a week or month ends, the **top 3** are recorded automatically. Their game hands out the prize the next time they play:

  | Place | Weekly prize | Monthly prize |
  | --- | --- | --- |
  | 🥇 1st | 100 gems + 2 h of cookies | 300 gems + 8 star crumbs + 6 h of cookies |
  | 🥈 2nd | 60 gems + 1 h of cookies | 200 gems + 5 star crumbs + 4 h of cookies |
  | 🥉 3rd | 30 gems + 30 min of cookies | 100 gems + 3 star crumbs + 2 h of cookies |

- **Admin panel → Leaderboard** (needs the admin password): see every player, **Remove** them, **Ban** them (they can't rejoin until unbanned), **Reset game** (their own save is wiped the next time they open the game, with a notice), **Unban**, or **Clear the whole leaderboard**.
- Saves live in each player's own browser, so a reset can only reach players who joined the leaderboard. It happens when their game next connects.

## Online features, accounts, clubs and gifts (versions 42–44)

Run these once each in the **SQL Editor**, in this order, after `leaderboard-v2.sql`. All are safe to run again.

1. [`online-v3.sql`](online-v3.sql): admin codes, announcements, global events, and the live counter (its cloud transfer codes were removed again in part 13).
2. [`accounts-v4.sql`](accounts-v4.sql): username + password accounts with a cloud save.
3. [`clubs-v5.sql`](clubs-v5.sql): bakery clubs (up to 30 members, club chat, weekly prizes for the top 3 clubs) and gifts (daily limits: 50 gems, 5 star crumbs and 10 gifts sent; 60 gems and 6 star crumbs received).

4. [`lock-internal-functions.sql`](lock-internal-functions.sql): closes internal helper functions to players (only needed for projects set up before it existed).
5. [`security-v6.sql`](security-v6.sql): the separate server admin password with lockout, per-device limits, the word filter, reports, mutes, admin mail, feature switches, maintenance mode, statistics, the admin log and seasons. Then run the one-line server password setup the owner received privately.
6. [`update-v7.sql`](update-v7.sql): weekly automatic backups (download them in the admin **Server** tab), leaderboard spots linked to accounts and unique leaderboard names.
7. [`social-v8.sql`](social-v8.sql): player profiles, friends, weekend club wars and invite bonuses.
8. [`push-v9.sql`](push-v9.sql): push notifications (also needs the edge function, see [PUSH.md](PUSH.md)).
9. [`insights-v10.sql`](insights-v10.sql): crash reports and the player journey (admin **Server** tab), push reminders for players away 3+ days, and club chat reactions and pinned messages.
10. [`admin-v11.sql`](admin-v11.sql): account bans (sign-in and every online feature blocked, with the reason shown; optionally the player's devices too).
11. [`staff-v12.sql`](staff-v12.sql): moderator logins, ban appeals, two-step sign-in for the server password, and the weekly summary.
12. [`community-v13.sql`](community-v13.sql): club levels, player feedback, and push alerts for the owner and moderators (the alerts also need the updated `kf-push` edge function, which opens admin.html when you tap an alert).
13. [`server-v14.sql`](server-v14.sql): automatic cleanup of old data, the database usage card, checks for unrealistic account-save jumps, planned events and announcements, the off-site backup function, and removes the transfer codes.

The admin panel's **Online**, **Moderation** and **Server** tabs manage everything online. They need the server password. Since version 52 the admin panel is only in `admin.html` (https://destinyx350.github.io/Cookie-Factory/admin.html), not in the game players get.

## Anti-cheat

- Saves changed outside the game (browser tools or edited files) are flagged and can't join.
- Account saves that jump far beyond what the game allows are flagged in the admin **Moderation** tab (⚠️ Suspicious saves). The save is kept; you decide (OK or ban).
- The database rejects new entries above 1e15 cookies, and scores that grow more than 10x per 5 minutes (above 100 million). The game sends a score every minute and caps it just under this limit, so honest players are never rejected; their score catches up within minutes.
- If your project was set up before version 37, run [`leaderboard-anticheat-update.sql`](leaderboard-anticheat-update.sql) once in the **SQL Editor** to add the database check.

## Removing a fake or rude entry

In Supabase, open **Table Editor → leaderboard**, find the row, and delete it.

The game runs in the browser, so a determined cheater could still send a made-up score. If that happens, delete the row as above.

## Two-step sign-in and moderators (version 53)

- **Two-step sign-in:** in admin.html open **Online → Server → 📱 Two-step sign-in → Set up**, add the key to an authenticator app (Google Authenticator, Microsoft Authenticator, 2FAS …) and type the code it shows. From then on the server password also asks for the 6-digit code.
- **Lost your phone?** Run this in the Supabase SQL Editor to turn it off, then set it up again:
  `update public.kf_admin_auth set totp_on = false, totp_secret = null;`
- **Moderators:** add them in **Online → Moderation → 👮 Moderators** and give them the name and password in person. They open admin.html, go to Settings → Admin and use **Moderator? Sign in here**. They don't need (and shouldn't get) the admin panel password.


## Off-site backups (version 56)

Supabase keeps the weekly backups inside the same project. An encrypted copy is also kept at GitHub, so the game survives even if the project is lost.

1. Open admin.html → **Online** → **Server** → **Off-site backups** → **Create key**. The key is shown once.
2. In GitHub open **Settings → Secrets and variables → Actions → New repository secret**. Name `KF_BACKUP_KEY`, value: the key. Also keep the key in your password manager.
3. Test it: **Actions → Off-site backup → Run workflow**. It then runs every Monday and keeps each copy for 90 days (download it under the run's **Artifacts**).

Opening a copy: unzip the downloaded artifact, then run

```bash
KF_BACKUP_KEY=<your key> node tools/decrypt-backup.js kf-backup-YYYY-MM-DD.json.gz.enc
```

It writes `kf-backup-YYYY-MM-DD.json` with every table's rows (accounts and saves, clubs, the leaderboard …). To restore single players, put the snapshot back into the backups list in the **SQL Editor** and use **Restore account** in the admin **Server** tab:

```sql
insert into public.kf_backups (kind, counts, data)
values ('manual', '<the "counts" part of the file>'::jsonb, '<the "data" part of the file>'::jsonb);
```

A new key (or **Turn off**) stops the old one at once; update the GitHub secret after making a new key. Copies made with an old key still open with that old key.

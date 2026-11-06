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

## Anti-cheat

- Saves changed outside the game (browser tools, edited files or text) are flagged and can't join.
- The database rejects new entries above 1e15 cookies, and scores that grow more than 10x per 5 minutes (above 100 million). The game sends a score every minute and caps it just under this limit, so honest players are never rejected; their score catches up within minutes.
- If your project was set up before version 37, run [`leaderboard-anticheat-update.sql`](leaderboard-anticheat-update.sql) once in the **SQL Editor** to add the database check.

## Removing a fake or rude entry

In Supabase, open **Table Editor → leaderboard**, find the row, and delete it.

The game runs in the browser, so a determined cheater could still send a made-up score. If that happens, delete the row as above.

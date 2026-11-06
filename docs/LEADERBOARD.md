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

- Players join from the **Goals** tab with their bakery name. Their total **cookies baked** is sent when they open the leaderboard and every 5 minutes while they play.
- Scores only go up. Updates sent less than 20 seconds apart are ignored.
- Saves that used the admin panel can't join.
- Players can leave at any time, which deletes their entry.

## Anti-cheat

- Saves changed outside the game (browser tools, edited files or text) are flagged and can't join.
- The database rejects new entries above 1e15 cookies, and scores that grow more than 10,000x per hour (above 100 million).
- If your project was set up before version 37, run [`leaderboard-anticheat-update.sql`](leaderboard-anticheat-update.sql) once in the **SQL Editor** to add the database check.

## Removing a fake or rude entry

In Supabase, open **Table Editor → leaderboard**, find the row, and delete it.

The game runs in the browser, so a determined cheater could still send a made-up score. If that happens, delete the row as above.

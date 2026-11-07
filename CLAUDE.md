# Cookie Factory (Keksfabrik): rules for every change

The game is one file, `index.html`. `manifest.webmanifest`, `sw.js` (offline support) and `icons/` make it installable as an app. It is published with GitHub Pages from the `main` branch.

## Every update must also update the docs

Do these in the **same commit** as the change, every time:

1. **README.md**
   - Add a new `### Version N` block at the top of **What's new · Neuigkeiten**, in English with a German version in the `<details>` block. Remove the previous version's block, because older versions live in the in-game list.
   - Update the **Features** table and the German feature list if a feature was added, changed or removed. Keep numbers (upgrades, achievements, …) correct.
   - Retake `docs/gameplay.png` or `docs/start-screen.png` if the change visibly affects them.
2. **In-game "What's New"** (`NEWS` in `index.html`)
   - Raise `NEWS_VER` by 1 and add a matching `{v:N, sum:[de,en], items:[[type,de,en], …]}` entry at the top of `NEWS`.
   - The version number must match the README.
3. **sw.js**: raise `CACHE` (`keksfabrik-vN`) to the new version number so installed apps drop old files.
4. **version.json**: set `{"v":N}` to the new version number. Running games compare it with `NEWS_VER` and show the "Update now" notice.

## Languages

All player-facing text exists in German and English. Use `tt('Deutsch','English')` or the `tr()` keys.

## Admin password

- The admin panel is locked by a password. Only a PBKDF2-SHA256 hash is in the code (`ADM_SALT`, `ADM_ITER`, `ADM_HASH`).
- **Never** write the plain password into any file, commit, README or comment. The repository is public.
- To change the password: pick a new one, generate a new random 16-byte salt, compute
  `pbkdf2_hmac('sha256', password, salt, 150000)` and replace `ADM_SALT` and `ADM_HASH`.
  Unlocks saved in players' browsers stop working automatically.

## Redeem codes

- Codes live in `CODES` in `index.html`. Only a SHA-256 hash is stored: `sha256(CODE_SALT + ':' + CODE)` as hex, where `CODE` is upper-case letters and digits only (spaces and dashes are removed when a player types it).
- **Never** write a code in plain text in any file, commit, comment or README. Tell the owner the codes in chat only.
- Each entry: `{h:'<hash>', until:Date.parse('YYYY-MM-DDT00:00:00') /* optional */, n:[de,en], r:()=>{ /* give reward */ return 'text shown to player'; }}`.
- Used codes are stored per save in `S.codes` (first 12 hex characters of the hash).

## Leaderboard

- Code is in the `V35: Bestenliste` block of `index.html`; the database setup is `docs/leaderboard-setup.sql`, and owner steps are in `docs/LEADERBOARD.md`.
- It is live: `LB_URL` and `LB_KEY` point to the owner's Supabase project (project ID `nmmlemtljjvfurlrvuvm`). The key is the publishable (public) key, which is safe in the code. Never put a `service_role` or secret key in the repo.
- Emptying `LB_URL` and `LB_KEY` hides the leaderboard again.
- Saves that used the admin panel (`S.adm`, or admin values that aren't the defaults) must never be able to submit scores.

## Anti-cheat

- **Save seal:** every save written to storage, backups, export text and save files goes through `sealJSON(S)`, which appends a `sig` hash. `sanitize()` checks it with `sealState()`; a missing or wrong seal sets `S.tamp=1` (sticky). Never write a save with plain `JSON.stringify(S)`.
- `sealMigrate()` seals saves that existed before version 37 once per browser (marker `keksfabrik-seal`).
- The seal secret is inside `sealHash()`. Don't print it in chat, the README or comments.
- Flagged (`S.tamp`) and admin-used (`S.adm`) saves can never submit leaderboard scores (`lbCheat()`).
- **Server:** the current `submit_score` lives in `docs/leaderboard-v2.sql`. It rejects new entries above 1e15, growth above 10x per 5 minutes (above 100 million), and banned players. The game sends a score every minute and caps it with the same formula (`lbCapped()`, using `S.lb.ls` and `S.lb.t`) so honest players are never rejected. Changes to it must also be given to the owner as a paste-ready SQL file (like `docs/leaderboard-anticheat-update.sql`) to run in the Supabase SQL Editor.
- No browser game can stop someone who edits the game code itself; these checks catch the common tricks and protect the leaderboard.

## Device layouts

- An inline script at the top of `<body>` sets `data-device` (phone / tablet / desktop), `data-orient` (portrait / landscape) and `data-input` (touch / mouse) on `<html>` before the page paints, and again on resize. A manual choice is stored in `localStorage['keksfabrik-device']` (per device, not in the save).
- Per-device CSS lives in the `V39` block at the end of the main stylesheet. Check layout changes on phone upright and sideways, tablet upright and sideways, and desktop.
- Never animate `transform` on an element that contains a `position: fixed` child (like the phone tab bar inside `.store`), or the fixed child moves with it. Opening animations use `backwards` fill so nothing stays applied afterwards.

## Leaderboard v2 (version 40)

- `docs/leaderboard-v2.sql` adds weekly/monthly boards (`lb_period`), prizes (`lb_rewards`, top 3 recorded lazily by `lb_close_periods()` when a period has ended), bans (`lb_banned`), remote resets (`lb_resets`) and admin tools (`admin_lb`, checked against `lb_admin`).
- The server admin password is stored as `sha256(salt || password)` in `lb_admin`. The insert line with salt and hash is given to the owner in chat only; never commit it.
- Prizes are defined in `LB_PRIZE` in `index.html`. Admin moderation actions must not set `S.adm`.
- Test SQL changes in a local PostgreSQL first (role `anon`), then give the owner one paste-ready file.
- Supabase grants `anon` execute on every new function by default, so internal helpers must be revoked `from public, anon, authenticated` (not just `from public`). Test with `alter default privileges in schema public grant execute on functions to anon, authenticated` set on the local DB. `docs/lock-internal-functions.sql` fixes existing projects.

## Orders balance (version 41)

- `ordReward(s)` decides an order's payout when it completes and on the card: `min(kps0 × rc × order multipliers, max(run × cap, rmin)) × busy`. `rc`, `cap` and `rmin` live in `ORD_D`. The run cap keeps orders from exploding right after an ascension.
- `S.orders.heat` (+1 per order, -1 per 4 minutes) drives the "customers busy" multiplier `ordBusy()`.
- Click targets follow the recent click rate (`ordCps`), buy targets follow buildings owned. Item drops from orders can't add more cookies than the order itself.

## Online features (version 42)

- Server side is `docs/online-v3.sql` (needs `leaderboard-v2.sql` first): admin codes (`kf_codes`, `redeem_code`), announcements (`kf_news`), global events (`kf_events`, multiplier 1–10), live counter (`kf_presence`, `kf_ping`, `kf_live`, same growth cap as the leaderboard), cloud transfer (`kf_saves`, `save_upload` / `save_download`, codes valid 24 h), admin tools (`admin_online`).
- Client is the `V42` block. Event multipliers live in `GEV` and are applied in `recalc()` and `ordReward()`. Every player gets an anonymous id (`kfId()`, stored in `S.lb.id`) for pings and server codes.
- Cloud transfer uploads the same sealed text as a save file, so the anti-cheat seal still applies.

## Accounts (version 43)

- Server side is `docs/accounts-v4.sql` (needs `leaderboard-v2.sql`): `kf_accounts` (bcrypt via pgcrypto in schema `extensions`), `kf_sessions` (only sha256 of tokens stored), `kf_login_fails` (8 wrong tries lock a name for 15 min; `acc_login` returns `{error}` instead of raising so the failure is recorded).
- Client is the `V43` block. The session token lives in `localStorage['keksfabrik-session']`, never in the save. Account saves use the sealed save text. Auto-save every 5 minutes and on `pagehide` (keepalive).
- Never name a form field `id`: `form.id` then returns that field instead of the form's id (use `getAttribute('id')`).

## Clubs and gifts (version 44)

- Server side is `docs/clubs-v5.sql` (needs `leaderboard-v2.sql` and `accounts-v4.sql`): `kf_clubs`, `kf_club_members` (one club per account, max 30, an `after delete` trigger hands the club to the longest member or removes an empty club), `kf_club_msgs` (1 per 3 s, last 200 kept), `kf_club_week` (weekly gain per account and club), `kf_club_rewards` (top 3 clubs, recorded lazily by `club_close_weeks()`), `kf_gifts`.
- Club gain is counted in `acc_save` (it replaces the v4 version): only cookies above the account's highest saved total (`kf_accounts.club_hw`) count, capped at 10^(12 × hours since the last save, max 1 h). Admin-used or flagged saves send 0.
- Gift limits: a sender 50 gems, 5 star crumbs and 10 gifts per UTC day; a receiver 60 gems and 6 star crumbs. The client takes the gift from the sender's save after `gift_send` succeeds, and gifting is blocked when `lbCheat()`.
- Client is the `V44` block. `social_claim` (every 2 minutes and when the club dialog opens) hands out gifts and club prizes once; prizes are in `CLUB_PRIZE`. Admin tools: `admin_clubs` (list, delete a club, delete a chat message), shown in the admin Online tab.

## Security and admin tools (version 45)

- Server side is `docs/security-v6.sql` (needs parts 1–5). It turns off Supabase's default execute grant for new functions and removes all rights from `authenticated`.
- **Server admin password** is separate from the in-game panel password and stored as bcrypt in `kf_admin_auth`. `admin_login` returns `{error}` instead of raising (5 wrong tries per device, 30 overall, lock for 15 min) and gives a 12-hour session token. `lb_admin_ok(p_pass)` now checks that token, so every `admin_*` function takes the token in `p_pass`. The client keeps it in `sessionStorage['keksfabrik-admtok']`. The bcrypt insert line is given to the owner in chat only; never commit it or the password.
- **Per-device limits:** `kf_ip()` hashes the address from `request.headers`; `kf_rate_hit(kind, max, window)` limits sign-ups, clubs, cloud codes, gifts and reports. Without a known address only the older global limits apply.
- **Word filter:** `kf_text_ok()` with words in `kf_badwords` (leetspeak mapped, short words match whole words only). Used for usernames, club names, chat, gift notes and leaderboard names.
- **Gifts** need an account at least 24 h old with `club_hw` ≥ 1e6. **Mutes** (`kf_mutes`) block chat and gifts. **Reports** (`kf_reports`, `club_report`) show in the admin Moderation tab.
- `kf_config` holds feature switches (`feat`), maintenance mode (`maint`) and the minimum version (`min_ver`); `kf_live()` returns them as `cfg`, so every player gets them with the minute ping (`cfgApply`, `featOn`, `#maintOv`).
- Score growth is capped at 10x per 5 minutes but at most 10^12 for one jump (`least(12*hrs, 12)` in `submit_score` and `kf_ping`, mirrored in `lbCapped()`).
- Admin tools: `admin_mod` (search, mail, mute, reports, rename, words, settings, stats, log, seasons). Changes made with any `admin_*` function are written to `kf_admin_log`. Client is the `V45` block (Moderation and Server tabs). Never reuse a function name from elsewhere in `index.html` (an `admSet` clash broke the value editor once).
- `index.html` has a Content-Security-Policy meta tag. A new external host (fonts, API) must be added there.

## Backups, tests and leaderboard accounts (version 46)

- Server side is `docs/update-v7.sql`: `kf_backups` (JSON snapshots of every important table, no sessions), `kf_backup_make()` (internal), `kf_backup_tick()` (weekly automatic backup, also called by `kf_ping` now and then and by the keep-awake workflow), `admin_backup` (list, make, get, restore one account), `acc_lb_link` and `kf_accounts.lb_id` (one leaderboard entry per account), unique leaderboard names in `submit_score` (`name taken`).
- Client: `lbAccSync()` in the `V46` block adopts the account's leaderboard spot after sign-in and after loading an account save (not while the "which bakery" question is open). Backups card in the admin Server tab.
- **Tests:** `tests/` (`sql.test.js`, `browser.test.js`, `run.js`, `setup-db.sh`). GitHub runs them on every pull request (`.github/workflows/tests.yml`); only merge when they pass. Add tests for every new feature. Run locally with the env vars in `tests/README.md`. Tests use their own admin password and unlock the in-game panel by setting `sessionStorage['keksfabrik-admin']` to `ADM_HASH`.
- `.github/workflows/keep-awake.yml` calls `kf_backup_tick` and `kf_live` every 2 days so the free Supabase project never pauses. GitHub turns scheduled workflows off after 60 days without commits; re-enable it in the Actions tab if that happens.

## Shipping changes

- The owner asked Claude to **merge its own pull requests into `main`** without waiting for them, once all tests pass (including the GitHub `Tests` check). After merging, check the GitHub Pages deploy finished and that the live site serves the new `NEWS_VER`.
- Only merge Claude's own PRs from the session branch, never someone else's.

## Before pushing

- Check that the script still parses, and play through the change in a browser (desktop and phone width) with no console errors.

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

## Orders balance (version 41)

- `ordReward(s)` decides an order's payout when it completes and on the card: `min(kps0 × rc × order multipliers, max(run × cap, rmin)) × busy`. `rc`, `cap` and `rmin` live in `ORD_D`. The run cap keeps orders from exploding right after an ascension.
- `S.orders.heat` (+1 per order, -1 per 4 minutes) drives the "customers busy" multiplier `ordBusy()`.
- Click targets follow the recent click rate (`ordCps`), buy targets follow buildings owned. Item drops from orders can't add more cookies than the order itself.

## Shipping changes

- The owner asked Claude to **merge its own pull requests into `main`** without waiting for them, once all tests pass. After merging, check the GitHub Pages deploy finished and that the live site serves the new `NEWS_VER`.
- Only merge Claude's own PRs from the session branch, never someone else's.

## Before pushing

- Check that the script still parses, and play through the change in a browser (desktop and phone width) with no console errors.

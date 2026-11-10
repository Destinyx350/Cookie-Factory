# Cookie Factory (Keksfabrik): rules for every change

Players get one file, `index.html`. `manifest.webmanifest`, `sw.js` (offline support) and `icons/` make it installable as an app. It is published with GitHub Pages from the `main` branch.

## Source parts and the build

- **Edit the parts in `src/`, never `index.html` directly.** `src/page/*.html` (page skeleton), `src/css/*.css` (the stylesheet in order), `src/js/*.js` (the one big script, split at its section markers). `src/order.txt` lists the order.
- After every change run `node tools/build.js`; it joins the parts into `index.html`. Commit both. GitHub's `Tests` check runs `node tools/build.js --check` and fails if `index.html` doesn't match `src/`.
- The script parts are one shared scope (one IIFE across the files): a name declared in one part is visible in all later parts, and top-level names must stay unique across all parts.
- New feature blocks go in a new `src/js/NN-vXX-….js` file, placed in `src/order.txt` before `44-v40-admin-bestenliste-verwalten.js` (like the V42–V49 blocks), and new CSS at the end of `src/css/08-clean-v47-v48.css` or in a new CSS file listed after it.

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
- **Server:** the current `submit_score` lives in `docs/leaderboard-v2.sql`. It rejects new entries above 1e15, growth above 10x per 5 minutes (above 100 million), and banned players. The game sends a score every minute and caps it with the same formula (`lbCapped()`, using `S.lb.ls` and `S.lb.t`) so honest players are never rejected. Changes to it go into a new numbered server part in `docs/` for the owner.
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
- **Server admin password** is separate from the in-game panel password and stored as bcrypt in `kf_admin_auth`. `admin_login` returns `{error}` instead of raising (5 wrong tries per device, 30 overall, lock for 15 min) and gives a 12-hour session token. `lb_admin_ok(p_pass)` now checks that token, so every `admin_*` function takes the token in `p_pass`. The client keeps it in `sessionStorage['keksfabrik-admtok']`. Since version 52 the whole admin panel is only in `admin.html`. The bcrypt insert line is given to the owner in chat only; never commit it or the password.
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

## Clean design (version 47)

- The `V47` CSS block at the end of the main stylesheet makes the look flat: it sets the old 3D tokens (`--sh`, `--hi`, `--btnd`, `--goldd`, `--grnd`) to transparent and the gradient pairs (`--btn1/2`, `--gold1/2`, `--grn1/2`) to single colors, then uses `--edge`, `--edge-2`, `--soft` and `--r-lg/md/sm`. New UI should use these tokens: 1px edges, soft shadows, no hard "0 3px 0" bevel shadows.
- Rounded display font (Fredoka) only for headings and big numbers; controls use the body font.
- Header: language, save time and help are hidden there (they live in Settings; `#helpSetBtn`, `#shareSetBtn`). On phones the header is one row and the bakery name replaces the brand title.
- Saving settings: account first, then "Save now", the rest is moved into `details.savemore` at startup (`V47` script block). Settings search opens it on a match.
- Admin tabs are grouped (`#admGrp`, `ADM_ONLINE`). A test or link that opens an online tab must pick the "Online" group first.
- `updHints()` shows at most 3 hints plus a "+N" button. `S.opt.hc` sets `data-hc` for high contrast.
- Speed: number formats are cached (`nf()`); don't call `toLocaleString` with options in hot paths. The background cookie canvas draws at 30 fps, only while visible, and measures its size with a `ResizeObserver`.

## Social: profiles, friends, club wars, invites (version 48)

- Server side is `docs/social-v8.sql` (needs parts 1–7). It replaces `acc_save` (adds weekend war gains), `club_mine` (adds `war`, `weekend`, `trophies`), `club_list` and `social_claim` (adds invite bonuses, war closing and `friend_requests`).
- **Profiles:** `acc_profile` stores only whitelisted public numbers in `kf_accounts.profile` (sent at most every 10 min by `profPush()`); `player_profile(name)` works for usernames and leaderboard names. Any element with `data-prof="name"` opens the profile dialog.
- **Friends:** `kf_friends (a asked b, pending/ok)`, `friend_list/request/answer/remove`. The "Friends" tab lives in the club dialog.
- **Club wars:** `kf_wars`, paired lazily on weekends by `kf_war_pair()` (unpaired clubs with gain this week, 1v2, 3v4…), closed by `kf_war_close()` after the week (trophy plus mail prizes). `kf_weekend()` honours the `kf.test_weekend` setting so tests can pretend it's a weekend; players can't set it.
- **Invites:** `?ref=<username>` is stored in `localStorage['keksfabrik-ref']` and removed from the URL; after sign-up `ref_claim` records it (only for accounts under a day old). `kf_ref_rewards` mails both players once the new player has `club_hw` ≥ 1e6; an inviter is rewarded for at most 10 invites a week. `shareURL()` adds the ref when signed in.
- Link previews: Open Graph tags in `<head>` and `docs/og-card.png` (1200×630).

## Late-game content and push (version 49)

- Buildings are data in `B`; tier upgrades, ownership achievements, heavenly nodes and milestones are generated from it. A new building needs a `B` entry and an `ART` icon `b<index>` (outlined style in the `Object.assign(ART,{…})` block). Keep README counts in sync (now 23 buildings, 349 upgrades, 192 achievements; the Goals statistics show the live numbers).
- **Push:** server side is `docs/push-v9.sql` (`kf_push_subs`, `kf_push_queue`, `kf_push_cfg`, triggers on gifts, mail, friend requests, club prizes and events; `push_take`/`push_gone` need the shared secret). The sender is the edge function `supabase/functions/kf-push` (Verify JWT off). It needs no secrets: the SQL creates the shared secret in `kf_push_cfg`, the function reads that table with Supabase's built-in service key and creates the VAPID key pair on its first run. The client gets the public key from `push_pubkey()`. Never put push keys or the secret in the repo or chat. Owner steps: `docs/PUSH.md`.
- Client: `V49` block (`pushEnable/Disable/State`), switch under Settings → Display. `sw.js` shows notifications (`push`, `notificationclick`).

## Insights, comeback gift, chat upgrades and portals (version 51)

- Server side is `docs/insights-v10.sql` (needs parts 1–9): `kf_errors` + `kf_report_error` (crash reports, grouped by md5 of message and place, 20 per device per hour, newest 300 kept), `kf_steps` + `kf_track` (journey steps, whitelist in the function), `kf_days` (one row per player per day, written by `kf_ping`), `kf_reminders()` (push to accounts away 3+ days, once per absence via `kf_accounts.reminded_at`; called by the daily keep-awake job and now and then by `kf_ping`), `kf_club_reacts` + `club_react`, `kf_clubs.pinned` + `club_pin` (owner only), `club_mine` (adds `pinned` and per-message `reacts`), `admin_insights` (errors, error_done, errors_clear, journey).
- Client is the `V51` block (`src/js/43b-v51-absturz-weg-chat.js`). The error box at the very top of the script queues errors in `window.__kfErrQ`; `errFlush()` sends at most 5 per session and skips noise. Journey steps are in `STEPS` (checked every 15 s, sent once per save id, remembered in `localStorage['keksfabrik-steps']`); a new step needs the same name in the `kf_track` whitelist. Admin cards: `admInsHtml()` in the Server tab.
- **Comeback gift:** at startup, if the player was away 3+ days and `S.cb` is older than 3 days: `min(50, 10 + 5 × days)` gems plus 30 minutes of base production, shown in the away dialog. `S.cb` is in the save.
- **Portals:** `node tools/portal.js` builds `dist/portal/` (no manifest, `window.KF_PORTAL=1`). Portal mode skips the service worker, the update notice, push and the app section. `.github/workflows/portal.yml` uploads it as a download; steps and store texts in `docs/PORTALS.md`. `dist/` is not committed. The itch.io page is live at https://destinyx350.itch.io/cookie-factory (version 60): the owner replaces the upload there after updates; `ITCH_URL` (`43h-…`) adds a "Rate us on itch.io" button in Settings → Game, except in portal builds.

## Admin version and account bans (version 52)

- **Two builds:** `node tools/build.js` writes `index.html` (players, **no admin code**) and `admin.html` (the owner's version with the admin panel, `noindex`, not linked anywhere; live at `/admin.html`). Both are committed; `--check` checks both.
- Admin-only parts are marked `admin` in `src/order.txt` (whole files: `29-admin-panel.js`, `36-…`, `37a-…`, `38a-…`, `39a-…`, `40a-…`, `43c-…`, `43e-…`, `44-…`). Page parts use `<!--admin-->…<!--/admin-->` (the Admin settings tab and pane). New admin code goes in such an admin file, never in a player part.
- The build fails if the player version uses any name declared in an admin part. Player code talks to the admin panel only through the hook object `ADMH` (`01-start.js`): `ADMH.on` (unlocked), `ADMH.build()`, `ADMH.fill()`, which `29-admin-panel.js` fills in. `ADMH.build` existing means "this is admin.html".
- `sw.js` caches `admin.html` under its own key, so players never get it from the offline cache. Tests load `admin.html` for the admin device and read `ADM_HASH` from it. The portal build uses the player version.
- **Account bans:** server side is `docs/admin-v11.sql` (needs parts 1–10): `kf_bans`, `kf_device_bans`, `kf_sessions.ip` (hashed, default `kf_ip()`), new `acc_from_token` (raises `banned: {until, reason}`), `acc_login` (returns `{error:'banned', until, reason}`), `kf_rate_hit` (blocked devices can't sign up, make clubs, gift, befriend or report), `kf_unban` (internal; also ends lb ban and device bans; expired bans end by themselves), `admin_bans` (list, ban {user, hours 0 = forever, reason, device, wipe_chat}, unban). A ban also bans the linked leaderboard spot, removes the player from their club and their push devices, and is logged.
- Client: `lbApi` passes any `banned: …` error to `banSeen()` (`43d-v52-konto-sperre.js`), which signs out, shows `#banOv` with the reason, and clubs show "Your account is banned". Admin UI: "Account bans" card in Moderation and "Ban …" in player search (`43e-admin-sperren.js`).

## Moderators, appeals, two-step sign-in, weekly summary, portal ads (version 53)

- Server side is `docs/staff-v12.sql` (needs parts 1–11). `kf_mods` (bcrypt) and `kf_admin_sessions.mod_id`: moderator sessions use the same table, and `lb_admin_ok` now accepts **only owner sessions** (`mod_id is null`), so every older `admin_*` function stays owner-only. `kf_mod_who(token)` gives 'owner' or the moderator's name. `kf_log` writes `who` (from the `kf.who` setting) and prefixes moderator actions with `👮 name ·`. `mod_login`, `mod_tools` (me, reports, report_done, mute ≤ 7 days for moderators, unmute, mutes, search), `admin_mods` (list/add/password/remove).
- **Appeals:** `kf_appeals`, `ban_appeal(user, pass, body)` (banned players can't sign in, so they prove it with their password; one open appeal, one per day), `acc_login` returns `appeal` with the ban, `admin_appeals` (list, answer {id, accept, answer}; accepting calls `kf_unban`).
- **Two-step sign-in (owner only):** `kf_admin_auth.totp_*`, `kf_totp_code` (RFC 6238, HMAC-SHA1, 30 s, 6 digits; tested against the RFC vectors), `kf_totp_match` (±1 step, each step only once via `totp_last`), `admin_login(p_pass, p_code default null)` returns `{error:'code needed'|'wrong code'}`; the old one-argument version is dropped. `admin_2fa` (status/setup/confirm/disable). Recovery SQL is in `docs/LEADERBOARD.md`.
- `admin_summary` (this 7 days vs the 7 before). Client admin file `43f-admin-team.js`: moderator sign-in on the lock screen (`modLockHtml`, `modPanel`, token in `sessionStorage['keksfabrik-modtok']`), Moderators/Appeals cards in Moderation, weekly and two-step cards in Server. The server sign-in form switches to a code field when `admNeedCode`.
- Player file `43d-v52-konto-sperre.js`: `banShow()` shows the ban with the appeal form; `43g-v53-portal-werbung.js`: rewarded ads only when `KF_PORTAL` is `crazygames` or `gamedistribution` (`tools/portal.js --sdk …`, looser CSP in those builds only, GD id from `--gd-id` or the `GD_GAME_ID` repo variable). `adMute` keeps game sound off during an ad. 20 minutes of production per ad, 5-minute wait.
- The test stand-in for PostgREST (`tests/lib.js`) accepts digits in function names.

## Club levels, feedback, admin alerts, privacy (version 54)

- Server side is `docs/community-v13.sql` (needs parts 1–12). **Club levels:** `kf_club_xp(club)` = 100 per member-week with gain > 0 in `kf_club_week` + 500 per war won; `kf_club_level(xp)` gives level 1–10 with `cur`/`next` (thresholds 0, 300, 800, 1600, 2800, 4500, 7000, 10000, 14000, 20000). `club_mine` returns `club.level`, `club_list` returns `level`.
- Client (`43h-v54-clubstufen-feedback.js`): `S.clv` (in the save) is synced from the club data in `clubRender()` (`clubLvlSync`); `recalc()` multiplies production by `1 + 0.01 × (level − 1)`, club prizes get `+5 % × (level − 1)` (`clubPrizeLv`). Feedback dialog `fbOpen()` → `kf_feedback_send` (5 per device a day); "Send feedback" and the privacy link sit next to Help in Settings → Game.
- **Feedback:** `kf_feedback` (newest 500), `admin_feedback` (list/done/delete) in the Server tab (`43i-admin-alarme-feedback.js`).
- **Admin alerts:** `kf_admin_push` (owner devices have `mod_id` null), `admin_push` (status/subscribe/unsubscribe, owner and moderators), `kf_push_queue.target` ('owner' | 'staff'), `.kind`, `.url`. `kf_admin_alert()` queues at most one alert per kind every 10 minutes and only if a device listens. Triggers: new report (staff), appeal, feedback, new crash type (owner). `push_take` sends `target` rows to admin devices and returns `url`; `push_gone` cleans both tables. The edge function adds `url` (only `[a-z0-9_.-]`) to the game address; `sw.js` focuses an `admin.html` window for admin alerts. Redeploy `supabase/functions/kf-push` after changing it.
- **Privacy page:** `privacy.html` (static, own strict CSP, English and German). Keep it in sync when the game starts storing or sending something new.

## Soundtrack and 3D graphics (version 55)

- **Music** lives in `src/js/13-audio-engine-…js` between `/*MUSIC-START*/` and `/*MUSIC-END*/`. It is self-contained so it also runs offline: `mxGraph(ctx, out)` builds the mixer (channels drum/bass/keys/pad/lead/perc/str/fx with pan, reverb and echo sends, kick sidechain on keys/pad/strings, EQ, limiter, master gain .6), `INS` are the instruments (FM e-piano and bells, pads, strings, brass, flute, muted trumpet, synth lead, three basses, drum kit), `TRK` the 7 tracks (key, bpm, swing, chord progressions per section A/B/C, `form`, which `parts` play per section, drum patterns as 16-step strings), `mxMelody` makes a motif plus answer per section (fixed seed, so each track is recognizable), `mxPlayer(X)` plays steps (`P.run(until)` schedules at most 64 steps per call).
- `curTrk()` picks the track by tab (bake → night at night, world → boss during an adventure run); `musI()` sets the intensity from combo and boosts. New track ids must also go into `TRK_OK` (`03-zahlen.js`).
- `node tools/music-preview.js [track] [seconds]` renders the music offline to `dist/music/` (wav, and mp3 with ffmpeg) and prints peak and loudness. Check levels after every music change (peak under 0.98); the browser tests render all tracks briefly.
- **3D** is `src/js/43j-v55-3d-grafik.js` (WebGL 1, no libraries): `g3dMesh(skin)` builds the cookie (domed top, rounded edge, fbm dough noise, chips, specks; per-vertex colour and gloss), `g3dDraw` lights it (warm key, cool fill, rim, specular). The canvas `canvas.c3d` sits in `#cookie` (the SVG stays as fallback, hidden by `.is3d`). It renders at 30 fps (15 if slow), only while visible, still frames when effects are off, and only on demand (tap, pointer, change) when WebGL runs in software (`R.soft`: SwiftShader/llvmpipe, e.g. on GitHub's test machines). Golden and background cookies are rendered once into images (`g3dSprites`, `g3dGoldHtml`). Icons get the `#kf3d` SVG filter via `:root[data-g3d] svg.art` (`art()` adds the class). `S.opt.g3d` (Settings → Display) turns it all off. `.stage canvas` has opacity .2, so canvas rules for the cookie must be more specific.

## Server care: cleanup, save checks, planned events, off-site backups (version 56)

- Server side is `docs/server-v14.sql` (needs parts 1–13). It drops the transfer codes (`save_upload`, `save_download`, `kf_saves`); the client has no transfer code or save text any more (account and save file only). Never write save text into the UI again; save files still go through `sealJSON`.
- **Cleanup:** `kf_cleanup_run()` (internal) deletes old rows (presence after 365 days, `kf_days` 120, sessions unused 180, claimed gifts/mail 90, done reports 90, answered appeals 120, done feedback 180, crashes 60, admin log 180, sent push 3 …) and records counts in `kf_jobs` (`k='cleanup'`). `kf_cleanup()` (anon) runs it at most every 6 hours; `kf_ping` calls it now and then and the keep-awake job daily. Never delete accounts, saves or the leaderboard there. Keep `privacy.html` in sync with these times.
- **Usage card:** `admin_usage(p_pass, 'usage'|'cleanup')` returns DB size against the free 500 MB, the 10 biggest tables, players in 30 days, today, accounts, backups, last cleanup and off-site status.
- **Save checks:** trigger `kf_save_check` (before update of `save_baked` on `kf_accounts`) writes `kf_save_flags` when a save grows beyond `max(old, 1e8) × 10^(min(12×hrs, 12) + max(hrs − 1, 0)/12)`. The first account save never counts. At most one open flag per account an hour; alert kind `save` to the owner. The save is always kept. `admin_saveflags` (list, ok {id}, ok_all); Moderation card with OK and "Ban …".
- **Planner:** `kf_schedule` (kind event|news, ev_kind, mult, hours, repeat once|weekly, next_at, active). `kf_schedule_tick()` (anon, early exit when nothing is due) runs from every `kf_ping` and the keep-awake job and inserts into `kf_events`/`kf_news`; weekly items move on by 7 days. `admin_schedule` (list, add, delete, toggle). Card in the admin Online tab (`admPlanHtml`).
- **Off-site backups:** `kf_offsite` holds only the sha256 of the key. `admin_offsite` (status, newkey shows the key once, remove); `backup_offsite(p_key)` (anon, 1 s delay on a wrong key, at most every 20 minutes) runs `kf_backup_tick` and returns the newest backup. `.github/workflows/offsite-backup.yml` (Mondays and by hand) needs the repo secret `KF_BACKUP_KEY`, encrypts with `openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -md sha256` and uploads a 90-day artifact. `tools/decrypt-backup.js` opens it. The repository is public: never upload or log an unencrypted backup, and never write the key into the repo or chat.
- Client admin file `43k-admin-server-pflege.js` (`v56aReady`, `admCareLoad()`), hooked into `39a` (Moderation and Server tabs) and `36` (Online tab).

## Live dashboard, weekly report, trailer, website (version 57)

- Server side is `docs/stats-v15.sql` (needs parts 1–14). `kf_days` gets `lang` (browser language, `^[a-z]{2}$`), `dev` (phone|tablet|desktop) and `src` (web|app|portal), filled once per player and day. `kf_ping` now takes `p_lang, p_dev, p_src` (all default null; the two-argument version is dropped, old games still work). The client sends them only while `kfPingX` is true and falls back to the old call once if the server doesn't know them yet. Unknown values are stored as null. Keep `privacy.html` in sync.
- `kf_err_days` counts crashes per day (trigger `kf_err_count` on `kf_errors`). `admin_dash(p_pass, p_days 7–120)` returns online now, players in range, per-day players/new/accounts/crashes, and top languages, devices and sources.
- **Weekly report:** `kf_week_data()` (internal: last 7 days vs the 7 before, day-2 return, open to-dos: reports, appeals, feedback, crashes, suspicious saves, DB %, off-site status, top languages). `kf_week_report()` (anon) stores one row per ISO week in `kf_week_reports` on the first call of the week and sends the owner a push (alert kind `week`). It's called by `kf_ping` now and then and by the daily keep-awake job. `admin_reports(p_pass, 'list'|'preview')`.
- Client admin file `43l-admin-dashboard.js` (`v57aReady`, `admV57Load()`), hooked into the Server tab in `39a`. Charts are plain HTML/CSS, one series each in `--viz-1` (checked against the dark panel), a tooltip for the whole column, and a table view. The to-do texts are made on the client from the report data (`repTodo`).
- **Trailer:** `node tools/trailer.js` (needs the test tools and ffmpeg) plays `admin.html` offline, sets up a mid-game bakery with the admin panel before recording, records with the browser's screencast (not Playwright's video, which needs its own ffmpeg build) and writes `docs/trailer.mp4`, `docs/trailer.jpg` and `docs/trailer.gif`; `--phone` writes an upright version to `dist/trailer/`. Re-record it when the game's look changes a lot.
- **Website:** `welcome.html` is a static landing page (EN/DE, trailer, screenshots, install steps, FAQ) with its own CSP. Its inline script is allowed by a `sha256-…` hash in the CSP: after changing the script, recompute the hash, or the language switch stops working (the browser test catches it).
- `sw.js` only treats `/`, `index.html` and `admin.html` as the game page. Other pages and videos (range requests) go straight to the network and are never cached as the game.

## Backend care, recovery codes, devices, live chat, health (version 58)

- Server side is `docs/backend-v16.sql` (needs parts 1–15). `kf_schema (part, name, applied_at)` lists the installed server parts (part number = the file's version suffix: `leaderboard-setup` = 1 … `backend-v16` = 16; part 16 fills in 1–15). A new server part ends with `insert into public.kf_schema (part, name) values (N, '<file>') on conflict (part) do update set applied_at = now();` and raises `KF_SCHEMA_NEED` in `43n-admin-gesundheit.js`, so admin.html shows when a part is missing.
- **Indexes and fixes:** every foreign key has an index; `kf_rate`, `kf_login_fails`, `kf_admin_fails` have `id` primary keys; `kf_presence(seen_at)` is indexed (`kf_rate(kind, key, at)` already was, as `kf_rate_idx`); the war foreign keys use `kf_wars_club_a_idx`/`_b_idx` because `kf_wars_a`/`_b` (part 8) start with the week. `kf_ban_msg`, `kf_b32`, `kf_club_level` have a fixed `search_path`. pg_net is reinstalled in schema `extensions` (its functions stay in `net`; `kf_push_kick` calls them dynamically). `lb_admin` and `docs/leaderboard-anticheat-update.sql` are gone.
- **pg_cron jobs:** `kf-schedule` (every minute), `kf-health` (10 min), `kf-cleanup` (6 h), `kf-backup` (daily), `kf-reminders` (daily), `kf-week` (Monday 00:05 UTC), `kf-cron-tidy`. `kf_schedule_tick`, `kf_cleanup`, `kf_backup_tick`, `kf_reminders`, `kf_week_report`, `kf_health_check` are internal now (revoked from anon); `kf_ping` runs them itself only when pg_cron is missing (like the local test database). SQL tests start them with `job('name')`. The keep-awake workflow only calls `kf_live`.
- **Fake player counts:** `kf_ping` stores at most 30 new player ids per hashed device address an hour (`kf_rate` kind `newid`); more are answered but not counted.
- **Recovery codes:** `kf_accounts.recovery_hash/recovery_at` (bcrypt). `acc_recovery(token, 'status'|'new')` shows a 16-character base32 code once (10 new codes per device an hour). `acc_recover(user, code, pass)` has the same lockout as `acc_login` (8 wrong tries per name, 20 per device, 15 min), refuses banned accounts like `acc_login`, sets the password, signs out every session, uses the code up and returns the login object. Client `43m-v58-konto-sicherheit-chat-live.js`: code dialog after sign-up (`recMake(true)`), "Recovery code" and "Signed-in devices" folds in the account box (`accSecHtml`), "Forgot your password?" on the sign-in tab (`accForgotHtml`, `#accRecF`). `accLoginOk(r)` in `37-…` is the shared signed-in step. The browser test `signup` helper closes the code dialog.
- **Devices:** `kf_sessions.label` (≤ 60 characters, control characters and `<>` removed). `acc_devices(token, 'list'|'name'|'remove', {label|id})`; ids are the first 12 hex characters of the token hash; the current session can't be removed this way. The client names its session after sign-in (`devName()`: browser · OS · device · App/Portal).
- **Live club chat:** `kf_clubs.chat_key` is secret and only given to members by `club_rt(token)` → `{topic: 'kf-club-<key>', on}`. Triggers on `kf_club_msgs` and `kf_club_reacts` call `realtime.send(…, 'chat', topic, false)` with only `{k: table}`, never the text (`kf_club_signal`, `kf_rt_ok()`). The client opens a Phoenix websocket to `wss://<project>.supabase.co/realtime/v1/websocket` only while the club dialog is open, joins `realtime:<topic>`, refetches `club_mine` on a broadcast and polls every 60 s instead of 10 s while live (`clubRT`, `#clubOv[data-rt="1"]`). The CSP allows the `wss://` host. Browser tests mock the socket with `ctx.routeWebSocket` and a fake `realtime.send`.
- **Health:** `kf_health_check()` (internal, every 10 min) looks for stuck push messages (> 15 min), crashes today ≥ max(20, 3 × the 7-day average), a database ≥ 80 % full and failed pg_cron jobs in the last hour, and calls `kf_admin_alert('health_<kind>')` at most once per kind every 6 hours (`kf_jobs` keys `alert:<kind>`, last result in `health`). `admin_health(p_pass)` returns parts, pg_cron jobs with their last run, Realtime status, checks and alarms (admin file `43n-admin-gesundheit.js`, card in the Server tab). `.github/workflows/uptime.yml` checks the website and `kf_live` every 30 minutes and opens or closes a GitHub issue labelled `uptime`.

## Tab bar, building cards, transitions, bakery start, vibration, history, welcome back (version 59)

- Player file `43o-v59-oberflaeche-plus.js` (`v59Ready`). Hooks in older parts: `selectTab` → `paneIn()`, `updBuild` → `rowIn()` and `bldMs()`, `snd()` → `vibFor()`, `showAway()` → `awayPlus()`, `renderStart()` → `stBakery()`. Check `v59Ready` before calling them, because those parts run before this file.
- **Tab bar:** order and hidden tabs are per device in `localStorage['keksfabrik-tabs']` (`{order, hide}`), applied with CSS `order` and `.tabhid` (separate from the unlock `hidden` attribute). "Build" can't be hidden; hiding the open tab switches to Build. Settings section `#tabSec` is added to Display at startup.
- **Building cards:** `.msbar` shows progress from the last to the next entry of `MS`, and the status line says "next milestone at N". `#bviewSeg` switches `#buildList.bgrid` (grid hides the flavor and status lines); the choice is in `localStorage['keksfabrik-bview']`.
- **Transitions:** opacity only on panes (`.panein`), because panes sit inside `.store`, which holds the fixed phone tab bar; rows may move (`.rowin`). New rows animate only after the first 1.5 s. `data-motion="off"` turns all of it off.
- **Start screen:** `stBakery()` draws an SVG bakery in `#stLogo` (`.bake`), with chimney smoke, glowing windows, sun by day and moon and stars at night (20–6 h). The sign is `#stSign`, set with `textContent` (never HTML).
- **Vibration:** `S.opt.vib` (default on, in `DEFOPT` and `sanitize`), only on `data-input="touch"`, at most every 70 ms, patterns in `VIB` by sound kind. `#vibChk` is added under the background-music switch.
- **History:** `S.hist = {h, d, a, ac}` in the save (`fresh()`, `sanitize()` via the hoisted `sanHist()`, kept on ascension): `h` hourly `[minute, all, kps]` (72), `d` one point per day updated in place (365), `a` ascension minutes (100). `histTick()` runs at startup, every 2 s (adds only when due) and when the page becomes visible. `#histBox` sits after `#statBox`: two log-scale SVG charts (cookies in total, production), each ending with a live "now" point, a range switch (3 days, 30 days, all), hover values, 👼 ascension marks and a table view.
- **Welcome back:** `awayPlus(r)` counts up the offline cookies, slides in the tiles and adds **Collect all** (`[data-aw2="all"]`: `claimAll()` if `goalsReady()`, plus `expCollect` for finished expeditions).

## Category leaderboards and profile style (version 61)

- Server side is `docs/boards-v17.sql` (needs parts 1–16). `lb_stats` (one row per leaderboard spot, cascades with it): `clicks`, `gold`, `ascs` (not `asc`, a reserved word), `fast` (seconds to 1e9 in one run), `fast_wk` (ISO week, `kf_week_key()`), `fast_at`. `submit_stats(id, clicks, gold, asc, fast)` is sent right after every successful `submit_score` (`lbStatsSend()`); first insert capped (1e8 / 1e6 / 1e5), later growth clamped, never rejected (clicks +50/s+500, gold +1/3 s+5, ascensions +1/min+1), values never go down, banned spots refused. `fast` counts between 10 s and 7 days and only improves within a week. `lb_board(kind, id)` → `{me:{rank,v}, top:[{name,v}]}` (50, banned spots hidden; `fast` this week only, ascending).
- **Profile style:** `kf_accounts.pstyle` set by `acc_style(token, data)` (30 per device an hour): `av` from a fixed list of 24 emojis, `col` one of 8 names, `motto` ≤ 60 characters without `<>` and through `kf_text_ok`, `show` up to 3 achievement ids. The lists `PAVS`/`PCOLS` in the client must match the SQL. `player_profile` (replaces part 8's) adds `style` and `ranks` (clicks, gold, asc, fast, fast_s).
- **Run timer:** `S.rr = {t, a, f, w}` in the save (`fresh()`, hoisted `sanRR()` in `sanitize`): a new run starts when `S.asc` changes; `f = -1` if the run already had 1e6+ cookies when timing began (old saves), else seconds to 1e9 once reached, `w` its week (`lbWeekId`). `rrFast()` only returns this week's time.
- Client is `src/js/43p-v61-bestenlisten-profile.js` (`v61Ready`); hooks in `34-…` (`lbStatsSend`, `lbCatSeg()`/`lbCatHtml()` in `renderLb`) and `42-…` (`profAv`, `profCol`, `profExtra`). `?p=<name>` opens a profile once the start screen is closed and is removed from the URL (`profShareUrl`).

## Shipping changes

- The owner asked Claude to **merge its own pull requests into `main`** without waiting for them, once all tests pass (including the GitHub `Tests` check). After merging, check the GitHub Pages deploy finished and that the live site serves the new `NEWS_VER`.
- Only merge Claude's own PRs from the session branch, never someone else's.

## Before pushing

- Check that the script still parses, and play through the change in a browser (desktop and phone width) with no console errors.

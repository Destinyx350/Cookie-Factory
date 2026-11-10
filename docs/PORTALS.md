# Put Cookie Factory on game portals

**Live:** itch.io → https://destinyx350.itch.io/cookie-factory.

**Automatic itch.io updates:** the *Portal package* workflow pushes every new version to itch.io by itself once the repository has the secret `BUTLER_API_KEY`:

1. On itch.io open *Settings → API keys* (https://itch.io/user/settings/api-keys) and click **Generate new API key**. Copy it. Never paste it into a chat, an issue or a file in this repository.
2. On GitHub open the repository's *Settings → Secrets and variables → Actions → New repository secret*. Name: `BUTLER_API_KEY`, value: the key.
3. Run the workflow once by hand: *Actions → Portal package → Run workflow*. It uploads the game as a new file on the itch.io channel `html5`.
4. Only the first time: on itch.io open *Edit game → Uploads*, tick **This file will be played in the browser** on the new upload and delete the old zip you uploaded by hand. Save.

From then on every merge into `main` updates the itch.io game. Without the secret the step is skipped and you can still upload `cookie-factory-portal` by hand (*Edit game* → *Uploads* → replace the zip).

Game portals like itch.io, CrazyGames, GameDistribution and Newgrounds show the game to many new players.
Each one wants a zip with `index.html` at the top level. The game builds that zip by itself.

## 1. Get the zip

**Easiest:** open the repository on GitHub → **Actions** → **Portal package** → the newest green run →
download the zip you need under *Artifacts*. Each download is the zip to upload (it holds `index.html` and `icons/`).
They are rebuilt after every update to `main`.

| Zip | For | Ads |
| --- | --- | --- |
| **cookie-factory-portal** | itch.io, Newgrounds, Poki form, any other site | none |
| **cookie-factory-crazygames** | CrazyGames | optional rewarded ads through the CrazyGames SDK |
| **cookie-factory-gamedistribution** | GameDistribution | optional rewarded ads through the GameDistribution SDK |

**Ads are always optional.** The ad versions show a small **🎬 Watch an ad: +20 min** button under the cookie counter.
Players who press it watch one ad and get 20 minutes of production (then the button waits 5 minutes). Nothing else
shows ads, sound is paused while an ad plays, and your own site never has ads.

**GameDistribution needs your game ID:** upload the game there once, copy the 32-character *Game ID* from their
dashboard, then on GitHub open **Settings → Secrets and variables → Actions → Variables → New repository variable**,
name it `GD_GAME_ID` and paste the ID. The next build puts it in the zip (or run the *Portal package* workflow by hand
under Actions → Run workflow). Upload that new zip as an update.

**Or on your computer:**

```bash
node tools/portal.js
```

Then zip the *contents* of `dist/portal/` (not the folder itself). For the ad versions:

```bash
node tools/portal.js --sdk crazygames
```

```bash
node tools/portal.js --sdk gamedistribution --gd-id YOUR_GAME_ID
```

### What is different in the portal version

- No app install, no offline mode and no push notifications (portals run the game inside their page, where these don't work).
- No "update now" notice. Upload a new zip after a big update.
- Everything else works: saving, accounts, the leaderboard, clubs, codes and events.
- Saves are stored per website. A player who played on GitHub Pages starts fresh on a portal. With an account
  (Settings → Saving) they can load the same bakery everywhere.

## 2. Upload

| Portal | Where | Notes |
| --- | --- | --- |
| **itch.io** | itch.io → *Upload new project* | Kind of project: **HTML**. Upload the zip, tick **This file will be played in the browser**. Viewport 1280 × 800, tick **Mobile friendly** and **Fullscreen button**. Pricing: *No payments* or *Donations*. |
| **CrazyGames** | developer.crazygames.com | Upload **cookie-factory-crazygames** as an HTML5 game. They test it first. |
| **GameDistribution** | gamedistribution.com/developers | Upload **cookie-factory-gamedistribution** as HTML5 (with your game ID, see above). |
| **Newgrounds** | newgrounds.com/projects/games | *HTML5 / zip*. Size 1280 × 800, allow fullscreen. |
| **Poki** | developers.poki.com | Poki picks games by hand and needs their SDK. Send the itch.io link with the form. |

Pictures: use `docs/og-card.png` (1200 × 630) as cover, plus `docs/gameplay.png` and `docs/start-screen.png` as screenshots.
itch.io wants a cover of 630 × 500: crop the middle of `og-card.png`.

## 3. Store texts

Copy these into the portal forms.

### English

**Title:** Cookie Factory – Idle Bakery

**Short description (≤ 120 characters):**
Bake, build and expand your bakery empire. A free idle clicker with clubs, events and a live leaderboard.

**Description:**

> Start with one cookie. End with a cookie universe.
>
> Click the big cookie, hire grandmas, build farms, factories and portals, and watch the numbers grow, even while you're away.
>
> - 23 buildings, 349 upgrades and 192 achievements
> - Ascend for heavenly chips and a skill tree that changes every run
> - A whole world to explore: heroes, dungeons, stores in other cities, pets and a season pass
> - Join a bakery club, chat, react and win weekly club wars together
> - Weekly and monthly leaderboards with prizes
> - Plays on phone, tablet and desktop, in English and German
>
> No download, no sign-up needed. An optional account keeps your bakery safe on every device.

**Tags:** idle, clicker, incremental, cookie, casual, simulation, singleplayer, browser

**Controls:** Mouse or touch. Keyboard: Tab to the cookie, then Space or Enter clicks it.

### Deutsch

**Titel:** Keksfabrik – Idle-Bäckerei

**Kurzbeschreibung (≤ 120 Zeichen):**
Backe, baue und erweitere dein Bäckerei-Imperium. Ein kostenloses Idle-Spiel mit Clubs, Events und Bestenliste.

**Beschreibung:**

> Fang mit einem Keks an. Ende mit einem Keks-Universum.
>
> Klick den großen Keks, stell Omas ein, bau Farmen, Fabriken und Portale und sieh zu, wie die Zahlen wachsen, auch wenn du nicht spielst.
>
> - 23 Gebäude, 349 Upgrades und 192 Erfolge
> - Steige auf für Himmelschips und einen Fähigkeitenbaum, der jede Runde anders macht
> - Eine ganze Welt: Helden, Dungeons, Filialen in anderen Städten, Haustiere und ein Saison-Pass
> - Tritt einem Bäckerei-Club bei, chatte, reagiere und gewinnt zusammen Clubkriege
> - Wöchentliche und monatliche Bestenlisten mit Preisen
> - Läuft auf Handy, Tablet und Computer, auf Deutsch und Englisch
>
> Kein Download, keine Anmeldung nötig. Ein freiwilliges Konto hält deine Bäckerei auf jedem Gerät sicher.

**Schlagwörter:** Idle, Clicker, Inkrementell, Kekse, Casual, Simulation, Browser

**Steuerung:** Maus oder Touch. Tastatur: mit Tab zum Keks, dann klickt Leertaste oder Enter.

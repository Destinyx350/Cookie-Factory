# Put Cookie Factory on game portals

Game portals like itch.io, CrazyGames, GameDistribution and Newgrounds show the game to many new players.
Each one wants a zip with `index.html` at the top level. The game builds that zip by itself.

## 1. Get the zip

**Easiest:** open the repository on GitHub → **Actions** → **Portal package** → the newest green run →
download **cookie-factory-portal** under *Artifacts*. That download is the zip to upload (it holds `index.html` and `icons/`).
It is rebuilt after every update to `main`.

**Or on your computer:**

```bash
node tools/portal.js
```

Then zip the *contents* of `dist/portal/` (not the folder itself).

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
| **CrazyGames** | developer.crazygames.com | Upload as HTML5 game. They test it first; their full release needs their SDK later (ads), which the game does not have yet. |
| **GameDistribution** | gamedistribution.com/developers | Upload as HTML5. They also ask for their SDK before a game earns money. |
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

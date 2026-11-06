# Cookie Factory (Keksfabrik): rules for every change

The whole game is one file, `index.html`. It is published with GitHub Pages from the `main` branch.

## Every update must also update the docs

Do these in the **same commit** as the change, every time:

1. **README.md**
   - Add a new `### Version N` block at the top of **What's new · Neuigkeiten**, in English with a German version in the `<details>` block. Remove the previous version's block, because older versions live in the in-game list.
   - Update the **Features** table and the German feature list if a feature was added, changed or removed. Keep numbers (upgrades, achievements, …) correct.
   - Retake `docs/gameplay.png` or `docs/start-screen.png` if the change visibly affects them.
2. **In-game "What's New"** (`NEWS` in `index.html`)
   - Raise `NEWS_VER` by 1 and add a matching `{v:N, sum:[de,en], items:[[type,de,en], …]}` entry at the top of `NEWS`.
   - The version number must match the README.

## Languages

All player-facing text exists in German and English. Use `tt('Deutsch','English')` or the `tr()` keys.

## Admin password

- The admin panel is locked by a password. Only a PBKDF2-SHA256 hash is in the code (`ADM_SALT`, `ADM_ITER`, `ADM_HASH`).
- **Never** write the plain password into any file, commit, README or comment. The repository is public.
- To change the password: pick a new one, generate a new random 16-byte salt, compute
  `pbkdf2_hmac('sha256', password, salt, 150000)` and replace `ADM_SALT` and `ADM_HASH`.
  Unlocks saved in players' browsers stop working automatically.

## Before pushing

- Check that the script still parses, and play through the change in a browser (desktop and phone width) with no console errors.

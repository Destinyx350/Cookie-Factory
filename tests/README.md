# Tests

GitHub runs these automatically on every pull request and on every push to `main` (see `.github/workflows/tests.yml`).
Pull requests are only merged when they pass.

- `sql.test.js`: every rule the database enforces (accounts, clubs, gifts, filters, admin sign-in, leaderboard, backups), called as the `anon` role like the game does.
- `browser.test.js`: the real game in Chromium on desktop and phone sizes, talking to the test database: accounts on two devices, the leaderboard spot following the account, clubs and reports, the admin tools, maintenance mode, admin mail and phone layouts.

## Run them yourself

You need PostgreSQL 15 or newer, Node 20 and the test tools:

```bash
cd tests && npm install && npx playwright install chromium
```

```bash
PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres bash tests/setup-db.sh
```

```bash
cd tests && PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres node run.js
```

If your PostgreSQL listens on another port, also set `PGPORT` (the tests otherwise try 5433). If Playwright can't find its browser, point `PW_CHROMIUM` at a Chromium binary.

The browser tests load `index.html` for players and `admin.html` for the admin device, so run `node tools/build.js` first.

`node run.js sql` or `node run.js browser` runs only one part. The test database uses its own test admin password, never the real one.

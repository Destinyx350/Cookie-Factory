#!/usr/bin/env node
// Builds the upload package for game portals (itch.io, CrazyGames, GameDistribution, Newgrounds …).
//
//   node tools/portal.js        writes dist/portal/ (index.html + icons/), ready to zip
//
// The portal version is the same game with window.KF_PORTAL set, so it skips what a portal can't host:
// no service worker (offline/app install), no "update now" notice, no push. Saves, accounts, leaderboard
// and clubs still work. See docs/PORTALS.md for the upload steps and store texts.
const fs = require('fs'), path = require('path');
const { build, ROOT } = require('./build.js');

let html = build().player;
const swap = (a, b) => { if (!html.includes(a)) throw new Error('portal build: text not found: ' + a); html = html.replace(a, b); };
swap('<link rel="manifest" href="manifest.webmanifest">\n', '');
swap('<body>\n', '<body>\n<script>window.KF_PORTAL=1;</script>\n');

const out = path.join(ROOT, 'dist/portal');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'icons'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const f of fs.readdirSync(path.join(ROOT, 'icons'))) fs.copyFileSync(path.join(ROOT, 'icons', f), path.join(out, 'icons', f));
console.log('Built dist/portal/ (' + html.length + ' characters). Zip the contents of that folder and upload the zip.');

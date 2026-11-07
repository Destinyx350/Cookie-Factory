#!/usr/bin/env node
// Builds the upload package for game portals (itch.io, CrazyGames, GameDistribution, Newgrounds …).
//
//   node tools/portal.js                                    dist/portal/                   no ads (itch.io, Newgrounds, …)
//   node tools/portal.js --sdk crazygames                   dist/portal-crazygames/        CrazyGames SDK, optional rewarded ads
//   node tools/portal.js --sdk gamedistribution --gd-id ID  dist/portal-gamedistribution/  GameDistribution SDK (ID from their dashboard)
//
// The portal version is the player version (no admin code) with window.KF_PORTAL set, so it skips what a portal
// can't host: no service worker (offline/app install), no "update now" notice, no push. Saves, accounts,
// leaderboard and clubs still work. Ads only exist in the two SDK versions, and only when a player presses the
// "Watch an ad" button. See docs/PORTALS.md for the upload steps and store texts.
const fs = require('fs'), path = require('path');
const { build, ROOT } = require('./build.js');

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] || '' : ''; };
const sdk = arg('--sdk');
if (sdk && !['crazygames', 'gamedistribution'].includes(sdk)) throw new Error('--sdk must be crazygames or gamedistribution');
const gdId = (arg('--gd-id') || process.env.GD_GAME_ID || '').trim();
if (gdId && !/^[0-9a-f]{32}$/i.test(gdId)) throw new Error('--gd-id must be the 32-character game ID from GameDistribution');

let html = build().player;
const swap = (a, b) => { if (!html.includes(a)) throw new Error('portal build: text not found: ' + a.slice(0, 60)); html = html.replace(a, b); };
swap('<link rel="manifest" href="manifest.webmanifest">\n', '');
let head = '<script>window.KF_PORTAL=' + JSON.stringify(sdk || 1) + ';</script>\n';
if (sdk) {
  // Ad networks load scripts, frames and pictures from many hosts, so the ad versions use a looser
  // Content-Security-Policy. The portals run the game inside their own sandboxed frame.
  html = html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '<meta http-equiv="Content-Security-Policy" content="object-src \'none\'; base-uri \'self\'">');
}
if (sdk === 'crazygames') head += '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n';
if (sdk === 'gamedistribution') {
  if (!gdId) console.warn('Warning: no GameDistribution game ID (--gd-id or GD_GAME_ID). The ad button stays hidden until you build with it.');
  head += '<script>window.GD_OPTIONS={gameId:' + JSON.stringify(gdId) + ',onEvent:function(e){if(e&&e.name==="SDK_READY")window.__kfGdReady=1;if(window.__kfGdEvent)window.__kfGdEvent(e);}};</script>\n'
    + '<script async src="https://html5.api.gamedistribution.com/main.min.js"></script>\n';
}
swap('<body>\n', '<body>\n' + head);

const out = path.join(ROOT, 'dist', sdk ? 'portal-' + sdk : 'portal');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'icons'), { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
for (const f of fs.readdirSync(path.join(ROOT, 'icons'))) fs.copyFileSync(path.join(ROOT, 'icons', f), path.join(out, 'icons', f));
console.log('Built ' + path.relative(ROOT, out) + '/ (' + html.length + ' characters). Zip the contents of that folder and upload the zip.');

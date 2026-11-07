#!/usr/bin/env node
// Builds the game from the parts in src/ (in the order listed in src/order.txt):
//
//   index.html   the game players get. It contains NO admin code: parts marked "admin" in src/order.txt and
//                <!--admin--> … <!--/admin--> blocks in the page parts are left out.
//   admin.html   the same game with the admin panel, for the owner only (not linked anywhere).
//
//   node tools/build.js           write index.html and admin.html
//   node tools/build.js --check   exit with an error if they don't match src/ (used by the tests on GitHub)
//
// The build also refuses to finish if the player version still mentions anything that is defined only in the
// admin parts, so admin code can't sneak back into index.html by accident.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

function readOrder() {
  const rows = fs.readFileSync(path.join(ROOT, 'src/order.txt'), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const list = rows.map(l => { const m = /^admin\s+(.+)$/.exec(l); return { file: m ? m[1] : l, admin: !!m }; });
  const seen = new Set(fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).map(f => 'src/' + String(f).split(path.sep).join('/')));
  for (const p of list) if (!seen.has(p.file)) throw new Error('src/order.txt lists a missing file: ' + p.file);
  for (const f of seen) if (/\.(js|css|html)$/.test(f) && !list.some(p => p.file === f)) throw new Error('This file is not listed in src/order.txt: ' + f);
  return list.map(p => Object.assign(p, { text: fs.readFileSync(path.join(ROOT, p.file), 'utf8') }));
}

// Names declared at the top level of a script part (function x, const/let/var x = …, a = …).
function topNames(code) {
  const names = new Set();
  for (const line of code.split('\n')) {
    let m = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (m) { names.add(m[1]); continue; }
    m = /^(?:const|let|var)\s+/.exec(line);
    if (!m) continue;
    let depth = 0, q = '', expectName = true;
    for (let i = m[0].length; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (c === ';' && depth === 0) break;
      else if (c === ',' && depth === 0) { expectName = true; continue; }
      if (expectName && depth === 0) {
        const n = /^\s*([A-Za-z_$][\w$]*)/.exec(line.slice(i));
        if (n) { names.add(n[1]); i += n[0].length - 1; }
        expectName = false;
      }
    }
  }
  return names;
}

function build() {
  const parts = readOrder();
  const admin = parts.map(p => p.text).join('\n')
    .replace('<head>\n', '<head>\n<meta name="robots" content="noindex, nofollow">\n');
  const player = parts.filter(p => !p.admin).map(p => p.text.replace(/<!--admin-->[\s\S]*?<!--\/admin-->/g, '')).join('\n');

  // Safety check: nothing defined only in the admin parts may be used by the player version.
  const playerJs = parts.filter(p => !p.admin && p.file.endsWith('.js')).map(p => p.text).join('\n');
  const own = topNames(playerJs);
  const leaks = [];
  for (const p of parts.filter(p => p.admin && p.file.endsWith('.js'))) {
    for (const n of topNames(p.text)) {
      if (own.has(n)) throw new Error(n + ' is declared both in ' + p.file + ' and in a player part');
      const re = new RegExp('(^|[^\\w$.])' + n.replace(/\$/g, '\\$') + '(?![\\w$])');
      const hit = player.split('\n').findIndex(l => re.test(l));
      if (hit >= 0) leaks.push(n + ' (from ' + p.file + ') is used in the player version: ' + player.split('\n')[hit].trim().slice(0, 140));
    }
  }
  if (leaks.length) throw new Error('Admin code would leak into index.html:\n  ' + leaks.join('\n  '));
  if (/<!--\/?admin-->/.test(player)) throw new Error('An <!--admin--> block is not closed');
  return { player, admin };
}

module.exports = { build, ROOT };
if (require.main !== module) return;
const out = build();
const files = { 'index.html': out.player, 'admin.html': out.admin };
if (process.argv.includes('--check')) {
  let bad = 0;
  for (const [f, t] of Object.entries(files)) {
    const cur = fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : '';
    if (cur !== t) { console.error(f + ' is out of date. Run: node tools/build.js'); bad++; }
  }
  if (bad) process.exit(1);
  console.log('index.html (' + out.player.length + ' characters, no admin code) and admin.html (' + out.admin.length + ') match src/.');
} else {
  for (const [f, t] of Object.entries(files)) fs.writeFileSync(path.join(ROOT, f), t);
  console.log('Built index.html (' + out.player.length + ' characters, no admin code) and admin.html (' + out.admin.length + ') from src/.');
}

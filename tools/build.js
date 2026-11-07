#!/usr/bin/env node
// Builds the game file index.html from the parts in src/ (in the order listed in src/order.txt).
// Players still get one single file; the parts only make the code easier to work on.
//
//   node tools/build.js           write index.html
//   node tools/build.js --check   exit with an error if index.html doesn't match src/ (used by the tests on GitHub)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

function build() {
  const order = fs.readFileSync(path.join(ROOT, 'src/order.txt'), 'utf8')
    .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const seen = new Set(fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).map(f => 'src/' + String(f).split(path.sep).join('/')));
  for (const f of order) if (!seen.has(f)) throw new Error('src/order.txt lists a missing file: ' + f);
  for (const f of seen) if (/\.(js|css|html)$/.test(f) && !order.includes(f)) throw new Error('This file is not listed in src/order.txt: ' + f);
  return order.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
}

const out = build();
const target = path.join(ROOT, 'index.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (cur !== out) { console.error('index.html is out of date. Run: node tools/build.js'); process.exit(1); }
  console.log('index.html matches src/ (' + out.length + ' characters).');
} else {
  fs.writeFileSync(target, out);
  console.log('Built index.html (' + out.length + ' characters) from src/.');
}

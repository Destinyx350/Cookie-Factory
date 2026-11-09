#!/usr/bin/env node
// Records a short gameplay trailer of the real game, without the online features.
//
//   node tools/trailer.js            16:9 trailer → docs/trailer.mp4, docs/trailer.jpg (poster) and docs/trailer.gif (short loop for the README)
//   node tools/trailer.js --phone    upright phone version → dist/trailer/trailer-phone.mp4 (for TikTok, Shorts, Reels)
//   node tools/trailer.js --keep     also keep the captured frames in dist/trailer/
//
// How it works: a small local web server serves the repository, Chromium plays admin.html (only to set up a mid-game
// bakery with the admin panel, before recording starts), the browser's screencast captures the frames and ffmpeg turns
// them into a video. Title cards are part of the page, so the video needs no editing. Needs the test tools (cd tests && npm install) and
// ffmpeg. Set PW_CHROMIUM if Playwright can't find its browser. Run node tools/build.js first.
const fs = require('fs'), path = require('path'), http = require('http'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tests/node_modules/playwright'));
const PHONE = process.argv.includes('--phone'), KEEP = process.argv.includes('--keep');
const OUT = path.join(ROOT, 'dist/trailer'), W = PHONE ? 360 : 1280, H = PHONE ? 640 : 720, DPR = PHONE ? 2 : 1;
const ADM = /ADM_HASH='([0-9a-f]+)'/.exec(fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'))[1];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
fs.mkdirSync(OUT, { recursive: true });

const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

// A title card drawn by the page itself (fades in, stays, fades out).
const CARD = (title, sub, small, ms) => `(() => {
  const d = document.createElement('div'); d.id = 'trCard';
  d.innerHTML = '<img src="icons/icon-512.png" alt=""><h1>${title}</h1><p>${sub}</p><small>${small}</small>';
  const st = document.createElement('style');
  st.textContent = '#trCard{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,#3a2a5e,#120e1f 70%);color:#fff;font-family:Fredoka,system-ui,sans-serif;animation:trIn .5s ease both}'
    + '#trCard img{width:${PHONE ? 120 : 150}px;height:auto;border-radius:28px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.5));animation:trPop .7s cubic-bezier(.2,1.4,.4,1) both}'
    + '#trCard h1{margin:6px 0 0;font-size:${PHONE ? 40 : 64}px;font-weight:700;letter-spacing:.5px}#trCard p{margin:0;font-size:${PHONE ? 20 : 28}px;color:#ffd36a}#trCard small{margin-top:10px;font-size:${PHONE ? 15 : 20}px;color:#c9c2e0}'
    + '#trCard.out{animation:trOut .5s ease both}@keyframes trIn{from{opacity:0}}@keyframes trOut{to{opacity:0}}@keyframes trPop{from{transform:scale(.4);opacity:0}}';
  document.head.appendChild(st); document.body.appendChild(d);
  setTimeout(() => d.classList.add('out'), ${ms} - 500); setTimeout(() => { d.remove(); st.remove(); }, ${ms});
})()`;

(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(Object.assign({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] },
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}));
  const ctx = await br.newContext(Object.assign({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, locale: 'en-US' }, PHONE ? { isMobile: true, hasTouch: true } : {}));
  await ctx.route(/supabase\.co/, r => r.abort());
  await ctx.addInitScript(h => { try { sessionStorage.setItem('keksfabrik-admin', h); localStorage.setItem('keksfabrik-device', ''); } catch (e) {} }, ADM);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  const wait = ms => p.waitForTimeout(ms);
  const js = (f, a) => p.evaluate(f, a);
  const tab = t => js(t => { const e = document.querySelector('[data-tab="' + t + '"]'); if (e) e.click(); }, t);

  // ---- Set-up (cut off later) ----
  await p.goto(url + 'admin.html');
  await p.locator('#startOv [data-lang=en]').click(); await p.click('#stGo');
  if (await p.isVisible('#nameOv')) { await p.fill('#nameIn', 'Sunny Bakery'); await p.click('#nameOk'); }
  await p.addStyleTag({ content: '#introOv,#tutBox{display:none!important}' + (PHONE ? '.toast{display:none!important}' : '') });
  await p.click('#setBtn'); await p.click('#setSeg [data-sp=admin]'); await p.click('#admGrp [data-ag=game]').catch(() => {});
  for (const a of ['add:1000000000', 'work:all']) await js(a => { const b = document.querySelector('[data-act="' + a + '"]'); if (b) b.click(); }, a);
  await p.click('#setClose');
  for (let i = 0; i < 110; i++) await js(() => { const b = document.getElementById('bestBtn'); if (b) b.click(); });
  await js(() => { const b = document.querySelector('[data-hint="claim"]'); if (b) b.click(); });
  await wait(7000); // toasts, confetti and unlock notes settle
  await js(() => document.querySelectorAll('.toast,#toasts > *').forEach(t => t.remove()));
  await tab('build'); await js(() => scrollTo(0, 0));
  const FR = path.join(OUT, PHONE ? 'frames-phone' : 'frames'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
  const frames = [], cdp = await ctx.newCDPSession(p);
  cdp.on('Page.screencastFrame', f => {
    const n = frames.length + 1, file = 'f' + String(n).padStart(5, '0') + '.jpg';
    fs.writeFileSync(path.join(FR, file), Buffer.from(f.data, 'base64')); frames.push({ file, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await js(CARD('Cookie Factory', 'Bake. Build. Explore.', 'A free idle game for your browser', 3200)); await wait(600); // the first card is already up when recording starts
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });

  // ---- Recording ----
  const ck = async (n, gap) => {
    const b = await p.locator('#cookie').boundingBox(); if (!b) return;
    for (let i = 0; i < n; i++) {
      const x = b.x + b.width * (.35 + Math.random() * .3), y = b.y + b.height * (.35 + Math.random() * .3);
      if (PHONE) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y);
      await wait(gap);
    }
  };
  await wait(2700);
  await ck(28, 70);                                                   // click frenzy on the 3D cookie
  await js(() => { const b = document.querySelector('[data-act="gold:spawn"]'); if (b) b.click(); });
  await wait(300);
  const gold = await p.$('.golden'); if (gold) { await wait(700); await gold.click().catch(() => {}); }
  await ck(18, 60);
  for (let i = 0; i < 6; i++) { await js(() => { const b = document.getElementById('bestBtn'); if (b) b.click(); }); await wait(260); }
  if (!PHONE) { await p.mouse.wheel(0, 260); await wait(900); await p.mouse.wheel(0, -260); }
  for (const [t, ms] of [['up', 1600], ['work', 1700], ['world', 2400], ['orders', 1700], ['ach', 1600], ['shop', 1500]]) {
    await tab(t); if (PHONE) await js(() => { const s = document.querySelector('.store'); if (s) scrollTo(0, s.getBoundingClientRect().top + scrollY - 8); });
    // the set-up used the admin panel, so the leaderboard row would say "admin used": leave it out of the picture
    if (t === 'ach') await js(() => document.querySelectorAll('[data-pane="ach"] button, [data-pane="ach"] a, [data-pane="ach"] div').forEach(e => { if (/admin used|Admin benutzt/i.test(e.textContent) && e.textContent.length < 120) e.style.visibility = 'hidden'; }));
    await wait(ms);
  }
  await tab('build'); await js(() => scrollTo(0, 0)); await wait(300);
  await ck(22, 60);
  await js(CARD('Play free now', 'destinyx350.github.io/Cookie-Factory', 'English · Deutsch · works offline · no download', 3400)); await wait(3500);
  const tEnd = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await ctx.close(); await br.close(); srv.close();
  if (frames.length < 10) throw new Error('only ' + frames.length + ' frames captured');
  // The screencast only sends a frame when the picture changes: each frame lasts until the next one.
  const list = frames.map((f, i) => "file '" + f.file + "'\nduration " + Math.max(.001, ((frames[i + 1] ? frames[i + 1].t : tEnd) - f.t)).toFixed(4)).join('\n') + "\nfile '" + frames[frames.length - 1].file + "'\n";
  fs.writeFileSync(path.join(FR, 'list.txt'), list);
  const len = (tEnd - frames[0].t).toFixed(2);
  const ff = a => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
  const mp4 = PHONE ? path.join(OUT, 'trailer-phone.mp4') : path.join(ROOT, 'docs/trailer.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-vf', 'fps=30,scale=' + W * DPR + ':' + H * DPR + ':flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', PHONE ? '26' : '27', '-movflags', '+faststart', '-an', mp4]);
  if (!PHONE) {
    ff(['-ss', '6', '-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(ROOT, 'docs/trailer.jpg')]);
    ff(['-ss', '3', '-t', '7', '-i', mp4, '-vf', 'fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', path.join(ROOT, 'docs/trailer.gif')]);
  }
  if (!KEEP) fs.rmSync(FR, { recursive: true, force: true });
  const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';
  console.log('Trailer: ' + path.relative(ROOT, mp4) + ' (' + len + ' s, ' + kb(mp4) + ')' + (PHONE ? '' : ', docs/trailer.jpg, docs/trailer.gif (' + kb(path.join(ROOT, 'docs/trailer.gif')) + ')'));
})().catch(e => { console.error(e); srv.close(); process.exit(1); });

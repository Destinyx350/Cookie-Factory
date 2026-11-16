#!/usr/bin/env node
// Records a short gameplay trailer of the real game (offline, without the online features), and the README screenshots.
//
//   node tools/trailer.js            16:9 trailer → docs/trailer.mp4, docs/trailer.jpg (poster) and docs/trailer.gif (short loop for the README)
//   node tools/trailer.js --phone    upright phone version → dist/trailer/trailer-phone.mp4 (for TikTok, Shorts, Reels)
//   node tools/trailer.js --shots    screenshots → docs/gameplay.png and docs/start-screen.png (1280 × 820)
//   node tools/trailer.js --keep     also keep the captured frames in dist/trailer/
//
// How it works: a small local web server serves the repository and Chromium plays admin.html (the admin panel only sets up a
// mid-game bakery before recording starts). Software rendering here only reaches about 6 frames a second, so the page runs in
// slow motion while it is recorded: its clock, timers, animation frames and CSS animations all run at SLOW of real speed, the
// browser's screencast captures the frames, and ffmpeg plays them back at normal speed. That gives a smooth 30 fps video.
// Title cards, captions and the pointer are drawn by the page itself, so the video needs no editing.
// Needs the test tools (cd tests && npm install) and ffmpeg. Set PW_CHROMIUM if Playwright can't find its browser.
// Run node tools/build.js first.
const fs = require('fs'), path = require('path'), http = require('http'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tests/node_modules/playwright'));
const PHONE = process.argv.includes('--phone'), KEEP = process.argv.includes('--keep'), SHOTS = process.argv.includes('--shots');
const OUT = path.join(ROOT, 'dist/trailer'), W = PHONE ? 360 : 1280, H = SHOTS ? 820 : PHONE ? 640 : 720, DPR = PHONE ? 2 : 1;
const SLOW = SHOTS ? 1 : 0.2;   // page speed while recording (0.2 = five times slower than real time)
const ADM = /ADM_HASH='([0-9a-f]+)'/.exec(fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'))[1];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
fs.mkdirSync(OUT, { recursive: true });

const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
  if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

// Runs in the page before the game: slow motion for every clock the game uses, and a prepared save for the second load.
const PAGE_INIT = ([k, adm]) => {
  try {
    sessionStorage.setItem('keksfabrik-admin', adm); localStorage.setItem('keksfabrik-device', '');
    localStorage.setItem('keksfabrik-acchint', JSON.stringify({ n: 3, t: Date.now() }));
    const prep = sessionStorage.getItem('trSave');
    if (prep) { localStorage.setItem('keksfabrik-save-v1', prep); localStorage.setItem('keksfabrik-chests', '0'); sessionStorage.removeItem('trSave'); }
  } catch (e) {}
  if (k === 1) return;
  const rd = Date.now.bind(Date), pn = performance.now.bind(performance), d0 = rd(), p0 = pn();
  const vNow = () => d0 + (rd() - d0) * k, vPerf = () => p0 + (pn() - p0) * k, OD = Date;
  class D extends OD { constructor(...a) { super(...(a.length ? a : [vNow()])); } static now() { return vNow(); } }
  window.Date = D; performance.now = vPerf;
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window), raf = window.requestAnimationFrame.bind(window);
  window.setTimeout = (f, ms, ...a) => st(f, (+ms || 0) / k, ...a);
  window.setInterval = (f, ms, ...a) => si(f, (+ms || 0) / k, ...a);
  // CDP Animation.setPlaybackRate already slows the frame timestamps, so frames get the page's own slowed clock instead
  window.requestAnimationFrame = cb => raf(() => cb(vPerf()));
};

// Overlays drawn by the page: title cards, captions and a pointer with a click ripple. Durations are in video time.
const FX = (phone) => `(() => {
  if (window.trFx) return;
  const st = document.createElement('style');
  st.textContent = '#trCard{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,#3a2a5e,#120e1f 70%);color:#fff;font-family:Fredoka,system-ui,sans-serif;animation:trIn .5s ease both}'
    + '#trCard img{width:${phone ? 120 : 150}px;height:auto;border-radius:28px;filter:drop-shadow(0 12px 30px rgba(0,0,0,.5));animation:trPop .8s cubic-bezier(.2,1.4,.4,1) both}'
    + '#trCard h1{margin:6px 0 0;font-size:${phone ? 40 : 64}px;font-weight:700;letter-spacing:.5px;animation:trUp .6s .15s ease both}#trCard p{margin:0;font-size:${phone ? 20 : 28}px;color:#ffd36a;animation:trUp .6s .3s ease both}#trCard small{margin-top:10px;font-size:${phone ? 15 : 20}px;color:#c9c2e0;animation:trUp .6s .45s ease both}'
    + '#trCard.out{animation:trOut .5s ease both}@keyframes trIn{from{opacity:0}}@keyframes trOut{to{opacity:0}}@keyframes trPop{from{transform:scale(.4);opacity:0}}@keyframes trUp{from{transform:translateY(14px);opacity:0}}'
    + '#trCap{position:fixed;left:50%;bottom:${phone ? 96 : 34}px;z-index:99990;transform:translateX(-50%);padding:${phone ? '10px 18px' : '12px 26px'};border-radius:999px;background:rgba(18,12,38,.86);border:1px solid rgba(255,211,106,.5);color:#fff;font:600 ${phone ? 19 : 26}px/1.2 Fredoka,system-ui,sans-serif;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .35s ease,transform .35s ease}'
    + '#trCap.on{opacity:1;transform:translateX(-50%) translateY(-6px)}#trCap b{color:#ffd36a;font-weight:600}'
    + '#trCur{position:fixed;left:0;top:0;z-index:99995;width:28px;height:28px;pointer-events:none;transition:transform .55s cubic-bezier(.45,.05,.25,1);filter:drop-shadow(0 3px 6px rgba(0,0,0,.45))}'
    + '#trCur svg{width:100%;height:100%;transition:transform .12s ease}#trCur.dn svg{transform:scale(.82)}'
    + '.trRing{position:fixed;z-index:99994;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:3px solid rgba(255,211,106,.95);pointer-events:none;animation:trRing .45s ease-out forwards}@keyframes trRing{from{transform:scale(.2);opacity:1}to{transform:scale(1);opacity:0}}';
  document.head.appendChild(st);
  const cur = document.createElement('div'); cur.id = 'trCur';
  cur.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 2l15 9.5-6.6 1.4 3.9 7.3-3 1.6-3.9-7.4L4 19z" fill="#fff" stroke="#1a1030" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  ${phone ? "cur.style.display='none';" : ''}
  document.body.appendChild(cur);
  const cap = document.createElement('div'); cap.id = 'trCap'; document.body.appendChild(cap);
  window.trFx = {
    move(x, y, ms) { cur.style.transitionDuration = (ms || 550) + 'ms'; cur.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)'; },
    click(x, y) { cur.classList.add('dn'); setTimeout(() => cur.classList.remove('dn'), 120); const r = document.createElement('div'); r.className = 'trRing'; r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 500); },
    cap(t) { if (!t) { cap.classList.remove('on'); return; } cap.innerHTML = t; cap.classList.add('on'); },
    card(title, sub, small, ms) {
      const d = document.createElement('div'); d.id = 'trCard';
      d.innerHTML = '<img src="icons/icon-512.png" alt=""><h1>' + title + '</h1><p>' + sub + '</p><small>' + small + '</small>';
      document.body.appendChild(d); setTimeout(() => d.classList.add('out'), ms - 500); setTimeout(() => d.remove(), ms);
    }
  };
})()`;

(async () => {
  await new Promise(ok => srv.listen(0, ok));
  const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(Object.assign({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] },
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}));
  const ctx = await br.newContext(Object.assign({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, locale: 'en-US', serviceWorkers: 'block' }, PHONE ? { isMobile: true, hasTouch: true } : {}));
  // The server time check answers "not installed", so the game trusts the (slowed) device clock; everything else online is off.
  await ctx.route(/rpc\/kf_now/, r => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.kf_now in the schema cache' }) }));
  await ctx.route(/supabase\.co\/(?!rest\/v1\/rpc\/kf_now)/, r => r.abort());
  await ctx.addInitScript(PAGE_INIT, [SLOW, ADM]);
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('page error:', e.message));
  const cdp = await ctx.newCDPSession(p);
  const wait = ms => p.waitForTimeout(ms / SLOW);   // ms of video time
  const js = (f, a) => p.evaluate(f, a);
  const tab = t => js(t => { const e = document.querySelector('[data-tab="' + t + '"]'); if (e) e.click(); }, t);
  const slowCss = async () => { await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: SLOW }); };
  const quiet = '#introOv,#tutBox,#accHint,.v68in,#awayOv' + (PHONE ? ',.toast' : '') + '{display:none!important}';

  // ---- Set-up (not recorded): a mid-game bakery made with the admin panel ----
  await p.goto(url + 'admin.html'); await slowCss();
  await p.waitForTimeout(1500);
  if (await p.isVisible('#stGo')) await p.click('#stGo');
  await p.addStyleTag({ content: quiet });
  await p.click('#setBtn'); await p.click('#setSeg [data-sp=admin]'); await p.click('#admGrp [data-ag=game]').catch(() => {});
  for (const a of ['add:1000000000', 'work:all']) await js(a => { const b = document.querySelector('[data-act="' + a + '"]'); if (b) b.click(); }, a);
  await p.click('#setClose');
  for (let i = 0; i < 110; i++) await js(() => { const b = document.getElementById('bestBtn'); if (b) b.click(); });
  await js(() => { const b = document.querySelector('[data-hint="claim"]'); if (b) b.click(); });
  await wait(2500);
  // Add customer reviews and a welcome chest that is ready, then load the bakery again (the second load uses this save).
  await js(() => window.dispatchEvent(new Event('pagehide')));
  await js(() => {
    const o = JSON.parse(localStorage.getItem('keksfabrik-save-v1')), now = Date.now(), d = new Date(now - 864e5);
    const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    o.name = 'Sunny Bakery'; o.tampSeen = 1; o.opt.start = !!window.trStart; o.opt.lang = 'en';
    o.rv = { l: [[now - 52e5, 4, 'gro+0', 4, [0, 6]], [now - 41e5, 5, 'var+0', 12, [0, 6]], [now - 33e5, 3, 'mid0', 2, [0, 6]], [now - 21e5, 5, 'act+0', 8, [0, 6]], [now - 12e5, 4, 'ord+0', 14, [0, 6]], [now - 4e5, 5, 'var+2', 0, [0, 9]]], nx: 900, kp: 0, ck: 0, gd: 0, b5: 1 };
    o.ret = { n: 0, a: day, s: day };
    sessionStorage.setItem('trSave', JSON.stringify(o));
  });
  if (SHOTS) await js(() => { const o = JSON.parse(sessionStorage.getItem('trSave')); o.opt.start = true; sessionStorage.setItem('trSave', JSON.stringify(o)); });
  await p.reload(); await slowCss(); await p.waitForTimeout(3000);
  await p.addStyleTag({ content: quiet });

  if (SHOTS) {
    // Start screen first (the save above asks for it), then the bakery.
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(ROOT, 'docs/start-screen.png') });
    await p.click('#stGo'); await p.waitForTimeout(2500);
    await p.addStyleTag({ content: quiet + '.toast,#toasts{display:none!important}' });
    await js(() => document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }));
    await tab('build'); await p.waitForTimeout(1200);
    const b = await p.locator('#cookie').boundingBox();
    for (let i = 0; i < 12; i++) { await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(90); }
    await p.mouse.move(W - 20, H - 20); await p.waitForTimeout(1800);
    await p.screenshot({ path: path.join(ROOT, 'docs/gameplay.png') });
    await ctx.close(); await br.close(); srv.close();
    console.log('Screenshots: docs/start-screen.png, docs/gameplay.png');
    return;
  }

  await wait(1500);
  await js(() => document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }));
  await js(() => document.querySelectorAll('.toast,#toasts > *').forEach(t => t.remove()));
  await tab('build'); await js(() => { const w = document.querySelector('.wrap'); if (w) w.scrollTop = 0; scrollTo(0, 0); });
  await js(FX(PHONE));
  const FR = path.join(OUT, PHONE ? 'frames-phone' : 'frames'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
  const frames = [];
  cdp.on('Page.screencastFrame', f => {
    const n = frames.length + 1, file = 'f' + String(n).padStart(5, '0') + '.jpg';
    fs.writeFileSync(path.join(FR, file), Buffer.from(f.data, 'base64')); frames.push({ file, t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await js(() => trFx.card('Cookie Factory', 'Bake. Build. Grow.', 'A free idle game for your browser', 3400));
  await wait(400);   // the first card is already up when recording starts
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;

  // ---- Recording (all times are video time) ----
  const centre = async sel => { const b = await p.locator(sel).first().boundingBox().catch(() => null); return b ? [b.x + b.width / 2, b.y + b.height / 2, b] : null; };
  const glide = async (x, y, ms = 550) => { if (!PHONE) { await js(([x, y, ms]) => trFx.move(x, y, ms), [x, y, ms]); await wait(ms + 60); } };
  const press = async (x, y) => { await js(([x, y]) => trFx.click(x, y), [x, y]); if (PHONE) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
  const hit = async (sel, ms) => { const c = await centre(sel); if (!c) return false; await glide(c[0], c[1], ms); await press(c[0], c[1]); return true; };
  const cap = t => js(t => trFx.cap(t), t);
  const cookie = async (n, gap) => {
    const c = await centre('#cookie'); if (!c) return; const b = c[2];
    await glide(c[0], c[1], 500);
    for (let i = 0; i < n; i++) {
      const x = b.x + b.width * (.38 + Math.random() * .24), y = b.y + b.height * (.38 + Math.random() * .24);
      if (!PHONE) await js(([x, y]) => trFx.move(x, y, 50), [x, y]);
      await press(x, y); await wait(gap);
    }
  };
  if (!PHONE) await js(([w, h]) => trFx.move(w * .62, h * .7, 10), [W, H]);
  await wait(3100);

  await cap('Tap the <b>3D cookie</b>');
  await cookie(30, 75);
  await js(() => { const b = document.querySelector('[data-act="gold:spawn"]'); if (b) b.click(); });
  await wait(500);
  await cap('Catch <b>golden cookies</b> for big boosts');
  if (await p.$('.golden')) { await wait(500); await hit('.golden', 650); }
  await wait(900);
  await cookie(16, 70);

  await cap('Build your <b>bakery empire</b>');
  for (let i = 0; i < 5; i++) { await hit('#bestBtn', i ? 220 : 600); await wait(380); }
  if (!PHONE) { await glide(W * .72, H * .62, 500); await p.mouse.move(W * .72, H * .62); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 70); await wait(60); } await wait(500); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -70); await wait(60); } }
  await wait(400);

  await cap('Customers <b>review</b> your bakery ⭐');
  if (await hit('#rvChip', 650)) { await wait(2600); await hit('#rvClose', 600); }
  await wait(300);

  await cap('Open a <b>gift chest</b> every day');
  if (await hit('#retChip', 700)) { await wait(2300); await hit('#rwClose', 600); }
  await wait(300);

  // the set-up used the admin panel, so the Goals tab would say the save can't join the leaderboard: leave that line out of the picture
  const hideAdm = () => js(() => document.querySelectorAll('.store *').forEach(e => { if (/save modified|admin used|Spielstand verändert|Admin benutzt/i.test(e.textContent) && e.textContent.length < 160 && !e.querySelector('[data-tab]')) e.style.visibility = 'hidden'; }));
  await cap('');
  await hit('[data-tab="world"]', 650); await cap('Explore the <b>world</b>'); await wait(2300);
  await hit('[data-tab="ach"]', 550); await hideAdm(); await cap('Daily rewards, streaks and <b>200 achievements</b>'); await wait(2100);
  await hit('[data-tab="up"]', 550); await cap('Upgrades, helpers, orders and more'); await wait(1300);
  await hit('[data-tab="work"]', 450); await wait(1300);
  await cap('');
  await hit('[data-tab="build"]', 500); await wait(300);
  await cookie(16, 70);
  await wait(300);

  await js(() => trFx.card('Play free on itch.io', 'destinyx350.itch.io/cookie-factory', 'No download · phone and computer · no ads', 3600));
  await wait(3700);
  const tEnd = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await ctx.close(); await br.close(); srv.close();
  if (frames.length < 10) throw new Error('only ' + frames.length + ' frames captured');
  // Each frame lasts until the next one, and the slow motion is undone here (× SLOW).
  const list = frames.map((f, i) => "file '" + f.file + "'\nduration " + Math.max(.001, ((frames[i + 1] ? frames[i + 1].t : tEnd) - f.t) * SLOW).toFixed(4)).join('\n') + "\nfile '" + frames[frames.length - 1].file + "'\n";
  fs.writeFileSync(path.join(FR, 'list.txt'), list);
  const len = ((tEnd - frames[0].t) * SLOW).toFixed(1), fps = (frames.length / ((tEnd - t0) * SLOW)).toFixed(1);
  const ff = a => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
  const mp4 = PHONE ? path.join(OUT, 'trailer-phone.mp4') : path.join(ROOT, 'docs/trailer.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-vf', 'fps=30,scale=' + W * DPR + ':' + H * DPR + ':flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', PHONE ? '24' : '23', '-movflags', '+faststart', '-an', mp4]);
  if (!PHONE) {
    ff(['-ss', '5', '-i', mp4, '-frames:v', '1', '-q:v', '3', path.join(ROOT, 'docs/trailer.jpg')]);
    ff(['-ss', '3.2', '-t', '6.5', '-i', mp4, '-vf', 'fps=12,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=112:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', path.join(ROOT, 'docs/trailer.gif')]);
  }
  if (!KEEP) fs.rmSync(FR, { recursive: true, force: true });
  const kb = f => Math.round(fs.statSync(f).size / 1024) + ' KB';
  console.log('Trailer: ' + path.relative(ROOT, mp4) + ' (' + len + ' s, ' + frames.length + ' frames, about ' + fps + ' captured frames per second, ' + kb(mp4) + ')' + (PHONE ? '' : ', docs/trailer.jpg, docs/trailer.gif (' + kb(path.join(ROOT, 'docs/trailer.gif')) + ')'));
})().catch(e => { console.error(e); srv.close(); process.exit(1); });

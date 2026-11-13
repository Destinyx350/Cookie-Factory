// Browser tests: the real game in Chromium, on desktop and phone, talking to the test database.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { pool, handle, check, rpc, ADMIN_PASS, LB, ROOT } = require('./lib');
const ADM_HASH = /ADM_HASH='([0-9a-f]+)'/.exec(fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'))[1];
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

module.exports = async function browserTests(url) {
  console.log('\nBrowser');
  await pool.query("delete from kf_backups; delete from kf_accounts; delete from kf_clubs; delete from leaderboard; delete from lb_period; delete from kf_rate; delete from kf_admin_fails; delete from kf_reports; delete from kf_mail; delete from kf_news; delete from kf_events; delete from kf_errors; delete from kf_steps; delete from kf_days; delete from kf_bans; delete from kf_device_bans; delete from kf_appeals; delete from kf_mods; delete from kf_feedback; delete from kf_admin_push; delete from kf_push_queue; update kf_admin_auth set totp_on = false, totp_secret = null, totp_pending = null; update kf_config set v = '{\"on\":false,\"de\":\"\",\"en\":\"\"}' where k = 'maint'");
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const errors = [];
  // A stand-in for Supabase Realtime (v58 live club chat): answers joins and heartbeats; tests push broadcasts with rtPush().
  const rtSockets = [];
  const rtPush = () => rtSockets.forEach(s => s.topics.forEach(t => s.ws.send(JSON.stringify({ topic: t, event: 'broadcast', payload: { type: 'broadcast', event: 'chat', payload: { k: 'kf_club_msgs' } } }))));
  // V68: a first visit has no start screen and no name window; the bakery gets a name by itself (renamed by tapping it at the top)
  const firstPlay = async (p, name) => {
    if (await p.isVisible('#stGo').catch(() => false)) { await p.locator('#startOv [data-lang=en]').click().catch(() => {}); await p.click('#stGo'); }
    if (await p.isVisible('#nameOv').catch(() => false)) { await p.fill('#nameIn', name); await p.click('#nameOk'); }
    else if (name && !(await p.evaluate(() => !!document.querySelector('.overlay:not([hidden])')))) { await p.click('#plName'); await p.fill('#nameIn', name); await p.click('#nameOk'); await p.waitForTimeout(250); }
  };
  async function device(name, ip, opts = {}, admin = false, page = '') {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 820 }, extraHTTPHeaders: { 'x-test-ip': ip }, acceptDownloads: true }, opts));
    await ctx.route(LB + '/**', handle);
    await ctx.routeWebSocket(/\/realtime\/v1\/websocket/, ws => {
      const so = { ws, topics: [] }; rtSockets.push(so);
      ws.onMessage(m => {
        let j; try { j = JSON.parse(m); } catch (e) { return; }
        if (j.event === 'phx_join') { so.topics.push(j.topic); ws.send(JSON.stringify({ topic: j.topic, event: 'phx_reply', payload: { status: 'ok', response: { postgres_changes: [] } }, ref: j.ref })); }
        else if (j.event === 'heartbeat') ws.send(JSON.stringify({ topic: 'phoenix', event: 'phx_reply', payload: { status: 'ok', response: {} }, ref: j.ref }));
      });
    });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    // no welcome chests on the long-running test devices (their once-a-day card would pop up mid-test; the v68 block tests them)
    await ctx.addInitScript(() => { try { if (!localStorage.getItem('keksfabrik-chests')) localStorage.setItem('keksfabrik-chests', '3'); } catch (e) {} });
    if (admin) await ctx.addInitScript(h => { try { sessionStorage.setItem('keksfabrik-admin', h); if (!sessionStorage.getItem('keksfabrik-admsec')) sessionStorage.setItem('keksfabrik-admsec', JSON.stringify({ mod: 'all', srv: 'all' })); } catch (e) {} }, ADM_HASH);
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(name + ': ' + m.text()); });
    await p.goto(page ? url + page : admin ? url + 'admin.html' : url);
    await firstPlay(p, /\?p=/.test(page) ? '' : name);   // a ?p= link opens a profile on top right away
    await p.addStyleTag({ content: '#introOv{display:none!important}' });
    return p;
  }
  const settings = async (p, pane) => { await p.click('#setBtn'); await p.click('#setSeg [data-sp=' + pane + ']'); };
  const signup = async (p, user) => {
    await settings(p, 'save'); await p.click('[data-accm=signup]');
    await p.fill('#accF [name=user]', user); await p.fill('#accF [name=pass]', 'cookies123'); await p.click('#accF button[type=submit]');
    await p.waitForSelector('#accBox .accme', { timeout: 8000 }).catch(() => {});
    // v58: a new account shows its recovery code once
    if (await p.waitForSelector('#accAskOv:not([hidden]) #recCode', { timeout: 15000 }).then(() => true, () => false)) { await p.click('#accYes'); await p.waitForSelector('#accAskOv', { state: 'hidden', timeout: 5000 }).catch(() => {}); }
    await p.click('#setClose');
  };
  const goals = p => p.evaluate(() => document.querySelector('[data-tab="ach"]').click());
  const text = async (p, sel) => ((await p.textContent(sel).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  const ping = p => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

  // 1. Accounts on two devices
  const a = await device('Alpha Bakery', '10.0.0.1');
  await signup(a, 'alpha_ci');
  check((await pool.query("select count(*)::int n from kf_accounts where username = 'alpha_ci' and save_data is not null")).rows[0].n === 1, 'account is created with the save');
  for (let i = 0; i < 40; i++) await a.locator('button[aria-label^="Bake a cookie"]').first().click({ force: true });
  const b = await device('Phone Bakery', '10.0.0.2', PHONE);
  await settings(b, 'save'); await b.fill('#accF [name=user]', 'alpha_ci'); await b.fill('#accF [name=pass]', 'cookies123'); await b.click('#accF button[type=submit]');
  await b.waitForSelector('#accAskOv:not([hidden])', { timeout: 8000 }).catch(() => {});
  check(await b.isVisible('#accAskOv'), 'signing in on a second device asks which bakery to keep');
  await b.click('#accYes'); await b.waitForTimeout(1200);
  check((await text(b, '#plName')).includes('Alpha'), 'phone now plays the account bakery');
  await b.click('#setClose');

  // 2. Leaderboard spot follows the account
  // v62: creating an account puts the bakery on the leaderboard by itself
  await goals(a); await a.click('#lbBar'); await a.waitForTimeout(3500);
  const link = (await pool.query("select lb_id from kf_accounts where username = 'alpha_ci'")).rows[0].lb_id;
  check(!!link && (await pool.query('select name from leaderboard where id = $1', [link])).rows.map(r => r.name).join() === 'alpha_ci', 'a new account joins the leaderboard by itself, under its username, and links the spot to the account');
  check(await a.isVisible('[data-lb=leave]') && !(await a.isVisible('[data-lb=join]')), 'the leaderboard shows the new account as joined, with a Leave button');
  await a.click('#lbClose');
  await b.reload(); await b.locator('#startOv [data-lang=en]').click(); await b.waitForTimeout(1500);
  // the "which bakery" question can come late on slow machines
  if (await b.waitForSelector('#accAskOv:not([hidden])', { timeout: 6000 }).then(() => true, () => false)) { await b.click('#accYes'); await b.waitForSelector('#accAskOv', { state: 'hidden', timeout: 5000 }).catch(() => {}); }
  await b.click('#stGo'); await b.waitForTimeout(2500);
  if (await b.isVisible('#accAskOv')) await b.click('#accYes');
  await b.waitForTimeout(2000);
  check((await pool.query('select count(*)::int n from leaderboard')).rows[0].n === 1, 'the second device uses the same leaderboard spot (no duplicate)');
  const bLb = await b.evaluate(() => { const out = {}; for (const k of Object.keys(localStorage)) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && o.lb) out[k] = o.lb; } catch (e) {} } return out; });
  const cur = bLb[await b.evaluate(() => { const n = +(localStorage.getItem('keksfabrik-slot') || 1); return n === 1 ? 'keksfabrik-save-v1' : 'keksfabrik-save-v1-s' + n; })];
  check(cur && cur.id === link && cur.on, 'the phone took over the account\'s leaderboard spot', bLb);

  // 3. Clubs, chat filter and reports
  await goals(a); await a.click('#clubBar'); await a.fill('#clubNewF [name=cname]', 'CI Club'); await a.click('#clubNewF button[type=submit]');
  await a.waitForSelector('.clubhead', { timeout: 8000 }).catch(() => {});
  check(await a.isVisible('.clubhead'), 'create a club');
  const c = await device('Gamma Bakery', '10.0.0.3', PHONE);
  await signup(c, 'gamma_ci'); await goals(c); await c.click('#clubBar'); await c.click('#clubBody [data-clt=list]');
  await c.waitForSelector('[data-cl^="join:"]', { timeout: 8000 }); await c.click('[data-cl^="join:"]'); await c.waitForSelector('#clubPostF', { timeout: 8000 });
  await c.fill('#clubPostF [name=body]', 'du bist ein w1chser'); await c.click('#clubPostF button[type=submit]'); await c.waitForTimeout(800);
  check(/isn’t allowed/.test(await text(c, '#clubBody .nameerr')), 'rude chat messages are blocked');
  await c.fill('#clubPostF [name=body]', 'hello everyone'); await c.click('#clubPostF button[type=submit]'); await c.waitForTimeout(900);
  await c.click('#clubClose');
  await a.click('[data-cl=refresh]'); await a.waitForSelector('.crep', { timeout: 8000 });
  await a.locator('.crep').first().click(); await a.locator('.crep').first().click(); await a.waitForTimeout(800);
  check((await pool.query('select count(*)::int n from kf_reports')).rows[0].n === 1, 'a player can report a chat message');
  await a.click('#clubClose');

  // 4. Admin: server sign-in, reports, mail, switches, maintenance, backups
  const d = await device('Admin Bakery', '10.0.0.9', {}, true);
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="mod"]');
  await d.fill('#admModPwF [name=spw]', 'wrong-pass'); await d.click('#admModPwF button[type=submit]'); await d.waitForTimeout(1500);
  check(/Wrong server password/.test(await text(d, '#admMod')), 'wrong server password is refused');
  await d.fill('#admModPwF [name=spw]', ADMIN_PASS); await d.click('#admModPwF button[type=submit]');
  await d.waitForSelector('[data-mda^="repdel:"]', { timeout: 10000 }).catch(() => {});
  check(await d.isVisible('[data-mda^="repdel:"]'), 'admin sees the report');
  await d.click('[data-mda^="repdel:"]'); await d.waitForTimeout(1000);
  check((await pool.query('select count(*)::int n from kf_club_msgs')).rows[0].n === 0, 'admin deletes the reported message');
  await d.fill('#admMailF [name=to]', 'gamma_ci'); await d.fill('#admMailF [name=title]', 'Welcome!'); await d.fill('#admMailF [name=gems]', '25');
  await d.click('#admMailF button[type=submit]'); await d.waitForTimeout(1000);
  check((await pool.query('select count(*)::int n from kf_mail')).rows[0].n === 1, 'admin sends a message with a gift');
  await d.click('#admSeg [data-ap="srv"]'); await d.waitForSelector('[data-bka=make]', { timeout: 10000 }).catch(() => {});
  await d.click('[data-bka=make]'); await d.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_backups where kind = 'manual'")).rows[0].n === 1, 'admin makes a backup');
  const [dl] = await Promise.all([d.waitForEvent('download', { timeout: 10000 }).catch(() => null), d.click('[data-bka^="get:"]')]);
  check(dl && /keksfabrik-backup-.*\.json$/.test(dl.suggestedFilename()), 'admin downloads the backup as a file');
  await d.fill('#admMaintF [name=en]', 'Back soon'); await d.click('#admMaintF button[type=submit]'); await d.waitForTimeout(1000);
  await ping(c); await c.waitForSelector('#maintOv:not([hidden])', { timeout: 8000 }).catch(() => {});
  check(await c.isVisible('#maintOv'), 'players see maintenance mode');
  await ping(d); await d.waitForTimeout(1200);
  check(!(await d.isVisible('#maintOv')), 'the admin can keep playing during maintenance');
  await d.click('#admMaintF button[type=submit]'); await d.waitForTimeout(1000); await ping(c); await c.waitForTimeout(1500);
  check(!(await c.isVisible('#maintOv')), 'maintenance ends for players');

  // 5. Mail arrives in the game
  await c.waitForTimeout(18000); await goals(c); if (!(await c.isVisible('#rwOv'))) await c.click('#clubBar');
  await c.waitForSelector('#rwOv:not([hidden])', { timeout: 10000 }).catch(() => {});
  check(/Welcome!/.test(await text(c, '#rwOv')), 'player gets the admin message as a popup');

  // Maintenance is over: every device checks the server again before going on (slow machines may not have yet)
  for (const pg of [a, b, c, d]) { await ping(pg); await pg.waitForSelector('#maintOv', { state: 'hidden', timeout: 10000 }).catch(() => {}); }

  // 5b. Clean layout (v47): settings order, admin groups, accessibility
  await settings(b, 'save');
  const order = await b.evaluate(() => [...document.querySelectorAll('#setOv .optsec[data-sc="save"]:not([hidden])')].map(x => x.querySelector('#accBox') ? 'account' : x.querySelector('#saveBtn') ? 'save' : x.classList.contains('savemore') ? 'more' : 'other').slice(0, 3).join(','));
  check(order === 'account,save,more', 'saving page shows the account first and tucks the rest under "More options"', order);
  await b.fill('#setQ', 'backup'); await b.waitForTimeout(200);
  check(await b.evaluate(() => document.querySelector('#setOv details.savemore').open), 'searching settings opens "More options" when it matches');
  await b.fill('#setQ', ''); await b.click('#setSeg [data-sp=disp]'); await b.check('#hcChk');
  check(await b.evaluate(() => document.documentElement.dataset.hc === '1'), 'high contrast can be switched on');
  await b.uncheck('#hcChk'); await b.click('#setClose');
  check(await b.evaluate(() => document.querySelector('.top').getBoundingClientRect().height < 70), 'phone header fits in one row');
  if (!(await d.isVisible('#setOv'))) await d.click('#setBtn');
  await d.click('#setSeg [data-sp=admin]');
  check(await d.evaluate(() => [...document.querySelectorAll('#admSeg [data-ap]')].filter(x => x.offsetParent).length <= 7), 'admin shows only one group of tabs at a time');
  await d.click('#admGrp [data-ag=game]'); await d.waitForTimeout(200);
  check(await d.evaluate(() => !document.querySelector('#admSeg [data-ap="mod"]').offsetParent && !!document.querySelector('#admSeg [data-ap="quick"]').offsetParent), 'admin "Game" group hides the online tabs');
  await d.click('#setClose');

  // 5c. Social (v48): profiles, friends, war card, invites
  await goals(a); await a.click('#lbBar'); await a.waitForSelector('#lbBody .pname', { timeout: 8000 }).catch(() => {});
  await a.locator('#lbBody .pname').first().click();
  await a.waitForSelector('#profOv:not([hidden]) .phead', { timeout: 8000 }).catch(() => {});
  check(/Alpha/.test(await text(a, '#profOv')), 'tapping a leaderboard name opens the player profile', await text(a, '#profOv'));
  await a.click('#profClose'); await a.click('#lbClose');

  // 5c2. Category leaderboards and profile style (v61)
  const st = (await pool.query("select s.clicks, s.id from lb_stats s join kf_accounts k on k.lb_id = s.id where k.username = 'alpha_ci'")).rows;
  check(st.length === 1 && st[0].clicks >= 20, 'the score send also sends clicks, golden cookies and ascensions', st);
  await pool.query("update lb_stats set fast = 125, fast_wk = kf_week_key(), fast_at = now() where id = $1", [st[0] && st[0].id]);
  await goals(a); await a.click('#lbBar'); await a.waitForSelector('#lbBody [data-lbc="clicks"]', { timeout: 8000 }).catch(() => {});
  check(await a.locator('#lbBody [data-lbc]').count() === 5, 'the leaderboard has five categories');
  await a.click('#lbBody [data-lbc="clicks"]'); await a.waitForSelector('#lbBody [data-prof]', { timeout: 8000 }).catch(() => {});
  check(/clicked the big cookie/.test(await text(a, '#lbBody')) && /alpha_ci/.test(await text(a, '#lbBody .lblist')) && await a.evaluate(() => document.querySelector('#lbBody [data-lbc="clicks"]').getAttribute('aria-pressed') === 'true'), 'the clicks board lists players', await text(a, '#lbBody'));
  await a.click('#lbBody [data-lbc="fast"]'); await a.waitForTimeout(1200);
  check(/2 min 5 s/.test(await text(a, '#lbBody')), 'the fastest-billion board shows run times', await text(a, '#lbBody'));
  await a.locator('#lbBody .lblist [data-prof]').first().click();
  await a.waitForSelector('#profOv:not([hidden]) [data-pe="edit"]', { timeout: 8000 }).catch(() => {});
  check(/#1/.test(await text(a, '#profOv .pranks')) && /Fastest billion · 2 min 5 s/.test(await text(a, '#profOv .pranks')), 'the profile shows the player\'s place in each board', await text(a, '#profOv'));
  await a.click('[data-pe="edit"]'); await a.click('[data-pav="🦊"]'); await a.click('[data-pcol="teal"]');
  await a.fill('#profEditF [name=motto]', 'Baking since breakfast');
  await a.evaluate(() => { const s = document.querySelector('[data-pes="0"]'); if (s && s.options.length > 1) s.selectedIndex = 1; });
  await a.click('#profEditF button[type=submit]'); await a.waitForTimeout(1500);
  const ps = (await pool.query("select pstyle from kf_accounts where username = 'alpha_ci'")).rows[0].pstyle;
  check(ps.av === '🦊' && ps.col === 'teal' && ps.motto === 'Baking since breakfast' && Array.isArray(ps.show) && ps.show.length === 1, 'players choose an avatar, color, motto and favourite achievement', ps);
  check(/🦊/.test(await text(a, '#profOv .pav')) && await a.evaluate(() => document.querySelector('#profOv .pav').classList.contains('pc-teal')) && /Baking since breakfast/.test(await text(a, '#profOv .pmotto')) && await a.isVisible('#profOv .pach'), 'the profile shows the new style');
  await a.click('[data-pe="edit"]'); await a.fill('#profEditF [name=motto]', '<b>hi</b>'); await a.click('#profEditF button[type=submit]'); await a.waitForTimeout(1000);
  check(/no < or >/.test(await text(a, '#profEditErr')), 'a motto with < or > is refused');
  await a.click('[data-pe="cancel"]');
  await a.evaluate(() => { window.__shared = ''; navigator.share = undefined; navigator.clipboard.writeText = t => { window.__shared = t; return Promise.resolve(); }; });
  await a.click('[data-pe="share"]'); await a.waitForTimeout(300);
  check(await a.evaluate(() => /\?p=alpha_ci$/.test(window.__shared)), 'sharing copies a link to the profile');
  await a.click('#profClose'); await a.click('#lbClose');
  await a.click('#ntfBtn'); await a.waitForTimeout(300);
  check(/My Style/.test(await text(a, '#ntfBody')) && /Spread the Word/.test(await text(a, '#ntfBody')), 'styling and sharing the profile unlock the new achievements (v67)');
  await a.click('#ntfClose'); await a.waitForTimeout(250);
  {
    const pv = await device('Profile Viewer', '10.0.61.1', {}, false, '?p=alpha_ci');
    await pv.waitForSelector('#profOv:not([hidden]) .phead', { timeout: 8000 }).catch(() => {});
    check(/alpha_ci/.test(await text(pv, '#profOv')) && /Baking since breakfast/.test(await text(pv, '#profOv')) && !(await pv.isVisible('[data-pe="edit"]')) && !/\?p=/.test(pv.url()), 'a shared ?p= link opens that profile');
    await pv.context().close();
  }
  if (await c.isVisible('#rwOv')) await c.click('#rwClose');
  if (await c.isVisible('#clubOv')) await c.click('#clubClose');
  await goals(c); await c.click('#clubBar'); await c.click('#clubBody [data-clt=friends]');
  await c.waitForSelector('#frAddF', { timeout: 8000 }); await c.fill('#frAddF [name=fu]', 'alpha_ci'); await c.click('#frAddF button[type=submit]'); await c.waitForTimeout(1000);
  check(/alpha_ci/.test(await text(c, '#clubBody')), 'send a friend request from the Friends tab');
  await c.click('#clubClose');
  await goals(a); await a.click('#clubBar'); await a.click('#clubBody [data-clt=friends]');
  await a.waitForSelector('[data-fr^="yes:"]', { timeout: 8000 }).catch(() => {});
  await a.click('[data-fr^="yes:"]'); await a.waitForTimeout(1000);
  check((await pool.query("select count(*)::int n from kf_friends where status = 'ok'")).rows[0].n === 1, 'accept a friend request');
  check(/gamma_ci/.test(await text(a, '#clubBody .lblist')), 'the new friend shows in the list');
  await a.click('#clubBody [data-clt=mine]'); await a.waitForSelector('.warcard', { timeout: 8000 }).catch(() => {});
  check(await a.isVisible('.warcard'), 'the club page shows the weekend club war');
  await a.click('#clubClose');
  const ectx = await browser.newContext({ viewport: { width: 1280, height: 820 }, extraHTTPHeaders: { 'x-test-ip': '10.0.0.5' } });
  await ectx.route(LB + '/**', handle); await ectx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const e = await ectx.newPage(); e.on('pageerror', x => errors.push('invite: ' + x.message));
  await e.goto(url + '?ref=alpha_ci'); await e.waitForTimeout(800);
  check(/alpha_ci invited you/.test(await text(e, '#stRef')) || /alpha_ci hat dich/.test(await text(e, '#stRef')), 'an invite link shows who invited you');
  check(!/ref=/.test(e.url()), 'the invite code is removed from the address bar');
  await firstPlay(e, 'Invited Bakery');
  await e.addStyleTag({ content: '#introOv{display:none!important}' });
  await signup(e, 'epsilon_ci'); await e.waitForTimeout(1200);
  check((await pool.query("select count(*)::int n from kf_referrals r join kf_accounts a on a.id = r.inviter where a.username = 'alpha_ci'")).rows[0].n === 1, 'signing up through an invite link records the invite');
  // v62: a taken bakery name falls back to the username
  {
    const tk = await device('Alpha Bakery', '10.0.62.1');
    await signup(tk, 'taken_ci'); await tk.waitForTimeout(1500);
    const tr = (await pool.query("select l.name from kf_accounts k join leaderboard l on l.id = k.lb_id where k.username = 'taken_ci'")).rows;
    check(tr.length === 1 && tr[0].name === 'taken_ci' && (await text(tk, '#plName')) === 'Alpha Bakery', 'the leaderboard always uses the username, and the bakery name stays as it is', tr);
    await settings(tk, 'save'); await tk.click('#setClose');
    await goals(tk); await tk.click('#lbBar'); await tk.waitForSelector('[data-lb=leave]', { timeout: 8000 }).catch(() => {});
    await tk.click('[data-lb=leave]'); await tk.waitForTimeout(1500);
    check((await pool.query("select count(*)::int n from leaderboard where name = 'taken_ci'")).rows[0].n === 0 && await tk.isVisible('[data-lb=join]'), 'a player can still leave the leaderboard after joining automatically');
    await tk.context().close();
  }

  // v64: one name, guests need an account, change username, warnings, player card, to-do, sections
  {
    const g = await device('Guest Bakery', '10.0.64.1');
    await goals(g); await g.click('#lbBar'); await g.waitForSelector('#lbBody [data-lb=acc]', { timeout: 8000 }).catch(() => {});
    check(await g.isVisible('#lbBody [data-lb=acc]') && !(await g.isVisible('#lbBody [data-lb=join]')), 'guests are asked to create an account to join the leaderboard');
    await g.click('#lbBody [data-lb=acc]'); await g.waitForTimeout(400);
    check(await g.isVisible('#accF') && await g.evaluate(() => document.querySelector('[data-accm=signup]').getAttribute('aria-pressed') === 'true'), '"Create account" opens the sign-up form');
    await g.context().close();
    const rn = await device('Rename Bakery', '10.0.64.2');
    await signup(rn, 'ren_ci'); await rn.waitForTimeout(1500);
    await settings(rn, 'save'); await rn.evaluate(() => { const d = document.querySelector('#accBox details[data-sec="name"]'); if (d) d.open = true; });
    await rn.fill('#accRenF [name=nu]', 'ren_new'); await rn.click('#accRenF button[type=submit]'); await rn.waitForTimeout(1500);
    const rr = (await pool.query("select a.username, l.name from kf_accounts a left join leaderboard l on l.id = a.lb_id where a.username in ('ren_ci', 'ren_new')")).rows;
    check(rr.length === 1 && rr[0].username === 'ren_new' && rr[0].name === 'ren_new' && /ren_new/.test(await text(rn, '#accBox .accme')), 'a player changes the username, and the leaderboard follows', rr);
    check(/Next change from/.test(await text(rn, '#accBox details[data-sec="name"]')) && /ren_ci/.test(await text(rn, '#accBox details[data-sec="name"]')), 'the account shows when the next change is possible and the earlier name');
    await rn.click('#setClose');
    // the owner finds the player by the old name and warns them
    await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]');
    check(await d.evaluate(() => document.querySelector('#admSeg [data-g="online"]').dataset.ap === 'todo'), 'the To-do tab comes first in the Online group');
    await d.waitForSelector('#admTodo .admtodohead', { timeout: 10000 }).catch(() => {});
    check(/Waiting for you|All done/.test(await text(d, '#admTodo')), 'the To-do tab lists what waits for the owner');
    await d.fill('#admQ', 'ren_c'); await d.waitForSelector('#admQP .pcl', { timeout: 8000 }).catch(() => {});
    check(/ren_new/.test(await text(d, '#admQP')), 'the admin search also finds players by an old name');
    await d.fill('#admQ', ''); await d.click('#admSeg [data-ap="pl"]');
    await d.fill('#admPlF [name=q]', 'ren'); await d.click('#admPlF button[type=submit]'); await d.waitForSelector('#admPl [data-pcard="ren_new"]', { timeout: 8000 }).catch(() => {});
    await d.click('#admPl [data-pcard="ren_new"]'); await d.waitForSelector('#admPlWarnF', { timeout: 8000 }).catch(() => {});
    check(/ren_new/.test(await text(d, '#admPlCard .plhead')) && /ren_ci/.test(await text(d, '#admPlCard .plhead')) && /Strikes: 0\/4/.test(await text(d, '#admPlCard')), 'the player card shows the name, earlier names and strikes');
    await d.fill('#admPlWarnF [name=reason]', 'Be nice in chat'); await d.click('#admPlWarnF button[type=submit]'); await d.waitForTimeout(1500);
    check(/Strikes: 1\/4/.test(await text(d, '#admPlCard')) && /Warning/.test(await text(d, '#admPlCard')) && /Be nice in chat/.test(await text(d, '#admPlCard')), 'warning a player adds a strike and shows it in the history');
    await rn.reload(); await rn.locator('#startOv [data-lang=en]').click().catch(() => {}); await rn.click('#stGo').catch(() => {});
    await rn.waitForSelector('#rwOv:not([hidden])', { timeout: 12000 }).catch(() => {});
    check(/Warning/.test(await text(rn, '#rwT')) && /Be nice in chat/.test(await text(rn, '#rwBody')) && /Strike 1 of 4/.test(await text(rn, '#rwBody')), 'the player sees the warning in the game', await text(rn, '#rwBody'));
    await rn.click('#rwClose').catch(() => {});
    await d.click('#admPlCard [data-plp="name"]'); await d.waitForTimeout(200);
    check(/Tap again to confirm/.test(await text(d, '#admPlCard [data-plp="name"]')), 'quick bans ask for a second tap');
    await d.click('#admPlCard [data-plp="name"]'); await d.waitForTimeout(1500);
    const fn = (await pool.query("select username, rename_free from kf_accounts where username like 'baker_%'")).rows;
    check(fn.length === 1 && fn[0].rename_free === true && /baker_\d{5}/.test(await text(d, '#admPlCard .plhead')), 'the "Bad name" preset forces a new name', fn);
    // sections in the long tabs
    await d.click('#admSeg [data-ap="mod"]'); await d.waitForSelector('#admMod .admsecbar', { timeout: 8000 }).catch(() => {});
    await d.click('[data-asec="mod:pl"]'); await d.waitForTimeout(200);
    const secs = await d.evaluate(() => [...document.querySelectorAll('#admMod .admcard')].map(c => [c.querySelector('h4').textContent.trim().slice(0, 2), getComputedStyle(c).display !== 'none']));
    check(secs.some(([t, v]) => t.startsWith('🚩') && !v) && secs.some(([t, v]) => t.startsWith('🔎') && v), 'the Moderation tab is split into Players and Community', secs);
    await d.click('[data-asec="mod:all"]'); await d.click('#setClose');
    await rn.context().close();
  }
  await ectx.close();

  // v66: smoother UI, calmer messages, tidy bell, light mode, better first minutes
  {
    const f = await device('Fresh Bakery', '10.0.66.1');
    await f.addStyleTag({ content: '#rwOv{display:none!important}' });
    await f.waitForTimeout(800);
    check(await f.evaluate(() => document.documentElement.dataset.coach === 'cookie' && !!document.querySelector('.coach') && document.documentElement.dataset.quiet === '1'), 'new players get a pointer on the cookie and a quiet start');
    const ck = await f.locator('#cookie').boundingBox(), tap = async n => { for (let i = 0; i < n; i++) { await f.mouse.click(ck.x + ck.width / 2, ck.y + ck.height / 2); await f.waitForTimeout(60); } };
    await tap(10); await f.waitForTimeout(1600);
    check(await f.evaluate(() => document.documentElement.dataset.coach === 'buy' && !!document.querySelector('#buildList .row.coachrow[data-i="0"]')), 'the first step claims itself, then the pointer moves to the first building');
    await f.click('#buildList .row[data-i="0"]'); await f.waitForTimeout(1600);
    for (let k = 0; k < 10 && !(await f.isVisible('#accHint')); k++) {
      await tap(20); await f.evaluate(() => { const r = document.querySelector('#buildList .row.can[data-i="0"]'); if (r) r.click(); }); await f.waitForTimeout(900);
    }
    await f.waitForSelector('#accHint:not([hidden])', { timeout: 6000 }).catch(() => {});
    check(await f.isVisible('#accHint') && /No email needed/.test(await text(f, '#accHint')), 'after the first steps, guests see one card that explains what an account gives');
    await f.click('#accHint [data-ah="later"]'); await f.waitForTimeout(700);
    check(!(await f.isVisible('#accHint')), '"Later" hides the account card');
    // windows fade out when they close, but count as closed right away
    await settings(f, 'save');
    for (let i = 0; i < 3; i++) { await f.click('#saveBtn'); await f.waitForTimeout(50); }
    await f.click('#setClose');
    const cl = await f.evaluate(() => { const o = document.getElementById('setOv'); return [o.classList.contains('ovout'), o.hidden, o.hasAttribute('hidden')]; });
    await f.waitForTimeout(300);
    check(cl[0] && cl[1] && !cl[2] && await f.evaluate(() => document.getElementById('setOv').hasAttribute('hidden')), 'windows fade out when they close', cl);
    // messages: one at a time, the same message counted
    let most = 0, merged = false;
    for (let k = 0; k < 40; k++) { const r = await f.evaluate(() => [document.querySelectorAll('#toasts .toast').length, document.querySelector('#toasts .toast .tn') ? document.querySelector('#toasts .toast').textContent : '']); most = Math.max(most, r[0]); if (/×3/.test(r[1])) merged = true; await f.waitForTimeout(200); }
    check(most === 1 && merged, 'messages show one at a time and the same message is counted (×3)', { most, merged });
    await f.click('#ntfBtn'); await f.waitForTimeout(300);
    check(/×3/.test(await text(f, '#ntfBody')) && await f.locator('#ntfBody .nitem.new').count() > 0, 'the bell groups the same messages and marks new ones');
    await f.click('#ntfRead'); await f.waitForTimeout(200);
    check(await f.locator('#ntfBody .nitem.new').count() === 0 && await f.isVisible('#ntfBody [data-nf="imp"]'), '"Mark all read" clears the new marks, and there is an Important filter');
    await f.click('#ntfClose');
    // light mode
    await settings(f, 'disp'); await f.click('#lookSeg [data-look="light"]'); await f.click('#setClose');
    const lt = await f.evaluate(() => [document.documentElement.dataset.look, getComputedStyle(document.getElementById('stTitle')).color]);
    check(lt[0] === 'light' && lt[1] !== 'rgb(255, 255, 255)', 'light mode works and the start title stays readable', lt);
    await f.context().close();
    // leaderboard categories fade in when switching
    await goals(a); await a.click('#lbBar'); await a.waitForSelector('#lbBody [data-lbc="gold"]', { timeout: 8000 }).catch(() => {});
    await a.click('#lbBody [data-lbc="gold"]'); await a.waitForTimeout(150);
    check(await a.evaluate(() => document.getElementById('lbBody').classList.contains('swin')), 'switching leaderboard categories fades the list in');
    await a.click('#lbBody [data-lbc="ck"]'); await a.click('#lbClose');
  }

  // v67: clock check, new achievements, cookie stays in view, "What's new" on itch.io
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, extraHTTPHeaders: { 'x-test-ip': '10.0.67.1' } });
    await ctx.route(LB + '/**', handle); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await ctx.addInitScript(() => {
      const off = +(sessionStorage.getItem('dtoff') || 0);
      if (off) { const D = Date, n = D.now.bind(D); class FD extends D { constructor(...a) { super(...(a.length ? a : [n() + off])); } static now() { return n() + off; } } window.Date = FD; }
    });
    const c = await ctx.newPage(); c.on('pageerror', e => errors.push('v67: ' + e.message));
    await c.goto(url); await firstPlay(c, 'Clock Bakery');
    await c.addStyleTag({ content: '#introOv,#tutBox,#rwOv,#accHint{display:none!important}' });
    const ck = await c.locator('#cookie').boundingBox();
    for (let i = 0; i < 20; i++) { await c.mouse.click(ck.x + ck.width / 2, ck.y + ck.height / 2); await c.waitForTimeout(60); }
    await c.evaluate(() => { const r = document.querySelector('#buildList .row.can'); if (r) r.click(); });
    await c.waitForTimeout(4000);   // the game asks the server for the time and stamps the save
    await settings(c, 'save'); await c.click('#saveBtn'); await c.click('#setClose'); await c.waitForTimeout(400);
    await c.evaluate(() => sessionStorage.setItem('dtoff', String(2 * 86400e3)));   // move the device clock 2 days ahead
    await c.reload(); await c.locator('#startOv [data-lang=en]').click().catch(() => {}); await c.click('#stGo').catch(() => {});
    await c.addStyleTag({ content: '#introOv,#tutBox,#rwOv,#accHint{display:none!important}' });
    await c.waitForTimeout(6000);
    if (await c.isVisible('#awayOv')) await c.click('#awayClose').catch(() => {});
    await c.click('#ntfBtn'); await c.waitForTimeout(300);
    check(/device clock was ahead/.test(await text(c, '#ntfBody')), 'moving the device clock forward no longer gives offline cookies', (await text(c, '#ntfBody')).slice(0, 200));
    await c.click('#ntfClose');
    await ctx.close();
    // the cookie column stays in view on computers
    const sctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await sctx.route(LB + '/**', handle); await sctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await sctx.addInitScript(() => { try { if (!localStorage.getItem('keksfabrik-save-v1')) localStorage.setItem('keksfabrik-save-v1', JSON.stringify({ name: 'Tall', b: [60, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cookies: 1e13, run: 1e14, all: 1e14, t: Date.now(), opt: { lang: 'en', start: false } })); } catch (e) {} });
    const st = await sctx.newPage(); await st.goto(url); await st.waitForTimeout(1500);
    await st.addStyleTag({ content: '#introOv,#tutBox,#rwOv,#awayOv,#accHint{display:none!important}' });
    await st.mouse.move(900, 500); await st.mouse.wheel(0, 900); await st.waitForTimeout(500);
    const pos = await st.evaluate(() => [Math.round(document.querySelector('.stage').getBoundingClientRect().top), Math.round(document.querySelector('.store').getBoundingClientRect().top), scrollY]);
    check(pos[2] > 300 && pos[0] >= 0 && pos[0] < 40 && pos[1] < 0, 'on computers the cookie stays in view while the buildings scroll', pos);
    await sctx.close();
  }

  // v68: no name window, no start screen the first time, first steps claim themselves, welcome chests, funnel data
  {
    // service workers blocked: requests they make would skip the kf_now stand-in below
    const ctx = await browser.newContext({ viewport: { width: 960, height: 640 }, extraHTTPHeaders: { 'x-test-ip': '10.0.68.1' }, serviceWorkers: 'block' });
    await ctx.route(LB + '/**', handle); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    let srvOff = 0;   // pretend the server's clock is ahead too (registered last, so it wins over handle)
    await ctx.route(/rpc\/kf_now/, r => r.fulfill({ contentType: 'application/json', body: String(Date.now() + srvOff) }));
    await ctx.addInitScript(() => {
      const off = +(sessionStorage.getItem('dtoff') || 0);
      if (off) { const D = Date, n = D.now.bind(D); class FD extends D { constructor(...a) { super(...(a.length ? a : [n() + off])); } static now() { return n() + off; } } window.Date = FD; }
    });
    const w = await ctx.newPage(); w.on('pageerror', e => errors.push('v68: ' + e.message));
    await w.goto(url); await w.waitForTimeout(900);
    check(!(await w.isVisible('#startOv')) && !(await w.isVisible('#nameOv')) && (await text(w, '#plName')).length >= 2, 'v68: new players start right away with a bakery name and no name window', await text(w, '#plName'));
    check(await w.isVisible('.v68in button'), 'v68: new guests see "Already have an account? Sign in" under the first steps');
    await w.click('.v68in button'); await w.waitForTimeout(400);
    check(await w.isVisible('#setOv') && await w.isVisible('#accF') && await w.evaluate(() => document.querySelector('[data-accm=login]').getAttribute('aria-pressed') === 'true'), 'v68: "Sign in" opens the sign-in form');
    await w.click('#setClose'); await w.waitForTimeout(300);
    await w.addStyleTag({ content: '#introOv{display:none!important}' });
    const ck = await w.locator('#cookie').boundingBox();
    for (let i = 0; i < 10; i++) { await w.mouse.click(ck.x + ck.width / 2, ck.y + ck.height / 2); await w.waitForTimeout(70); }
    await w.waitForTimeout(1800);
    check(/2 \/ /.test(await text(w, '#tutBox .tk')) && await w.evaluate(() => { const r = document.querySelector('#buildList .row.coachrow[data-i="0"]'); return !!r && /Buy/.test(r.dataset.ct || ''); }), 'v68: 10 clicks finish the first step by itself, and an arrow points at the first building');
    await w.click('#buildList .row[data-i="0"]'); await w.waitForTimeout(1800);
    check(/3 \/ /.test(await text(w, '#tutBox .tk')), 'v68: buying it finishes the second step by itself too');
    check(await w.isVisible('#retChip') && !(await w.evaluate(() => document.getElementById('retChip').classList.contains('ready'))), 'v68: a 🎁 welcome chest countdown shows at the top');
    await w.click('#retChip'); await w.waitForTimeout(400);
    check(/Come back tomorrow/.test(await text(w, '#rwT')) && /Chest 1 of 3/.test(await text(w, '#rwBody')) && /Login streak: day 1/.test(await text(w, '#rwBody')), 'v68: the chest tells you what waits tomorrow', await text(w, '#rwBody'));
    await w.click('#rwClose'); await w.waitForTimeout(300);
    await w.click('#plName'); await w.fill('#nameIn', 'Chest Bakery'); await w.click('#nameOk'); await w.waitForTimeout(300);
    check((await text(w, '#plName')) === 'Chest Bakery', 'v68: tapping the bakery name at the top renames it');
    await settings(w, 'save'); await w.click('#saveBtn'); await w.click('#setClose'); await w.waitForTimeout(400);
    // only the device clock is a day ahead: the chest stays closed
    await w.evaluate(() => sessionStorage.setItem('dtoff', String(86400e3)));
    await w.reload(); await w.waitForTimeout(600);
    check(await w.isVisible('#stGo'), 'v68: the start screen shows again from the second visit');
    await w.click('#stGo'); await w.addStyleTag({ content: '#introOv,#awayOv{display:none!important}' });
    await w.waitForTimeout(5000);
    check(!(await w.evaluate(() => document.getElementById('retChip').classList.contains('ready'))), 'v68: moving the device clock forward does not open the chest early');
    // a real new day (server time agrees): the chest opens
    srvOff = 86400e3;
    await w.reload(); await w.waitForTimeout(600); await w.click('#stGo').catch(() => {});
    await w.addStyleTag({ content: '#introOv,#awayOv{display:none!important}' });
    for (let k = 0; k < 30 && !(await w.evaluate(() => document.getElementById('retChip').classList.contains('ready')).catch(() => false)); k++) await w.waitForTimeout(500);
    await w.evaluate(() => document.querySelectorAll('.overlay').forEach(o => { if (o.id !== 'rwOv') o.hidden = true; }));
    await w.click('#retChip'); await w.waitForTimeout(500);
    check(/Chest opened/.test(await text(w, '#rwT')) && /\+10 gems/.test(await text(w, '#rwBody')), 'v68: the next day the chest opens and gives gems and cookies', await text(w, '#rwBody'));
    await w.click('#rwClose'); await w.waitForTimeout(400);
    check(await w.isVisible('#retChip') && !(await w.evaluate(() => document.getElementById('retChip').classList.contains('ready'))), 'v68: then the countdown to chest 2 starts');
    await w.waitForTimeout(16000);   // journey steps are sent every 15 s
    const st = (await pool.query("select step, ver, src from kf_steps where step in ('play', 'tut1', 'chest1') and ver >= 68")).rows;
    check(['play', 'tut1', 'chest1'].every(k => st.some(r => r.step === k && r.src === 'web')), 'v68: journey steps are stored with the version and the source', st);
    await ctx.close();
  }

  // v69: the browser is asked to keep the save; players see no admin changes in What's New
  {
    const k = await device('Keep Bakery', '10.0.69.1');
    await k.evaluate(() => document.getElementById('newsBtn').click()); await k.waitForTimeout(400);
    check(await k.locator('#newsBody .ntag.k-adm').count() === 0 && /Safer saves/.test(await text(k, '#newsBody')) && !/New admin panel/.test(await text(k, '#newsBody')), 'v69: players see no admin changes in What\'s New');
    await k.keyboard.press('Escape'); await k.waitForTimeout(300);
    await settings(k, 'save');
    const pl = await text(k, '#persLine'), on = /keeps this save/.test(pl);
    check(await k.isVisible('#persLine') && /browser/.test(pl), 'v69: Settings → Saving says whether the browser keeps the save', pl);
    if (!on) { await k.click('#persLine [data-pers]'); await k.waitForTimeout(1500); }
    await k.click('#setClose');
    const ks = (await pool.query("select step from kf_steps where step in ('keep', 'nokeep') and ver >= 69")).rows;
    check(on || ks.length >= 1, 'v69: asking the browser is noted as a journey step', ks);
    await k.context().close();
  }

  // v70: customer reviews, rating bonus, the reviews window, and saves with reviews load fine
  {
    const rctx = await browser.newContext({ viewport: { width: 1100, height: 780 } });
    await rctx.route(LB + '/**', handle); await rctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const now = Date.now();
    await rctx.addInitScript(s => { try { if (!localStorage.getItem('keksfabrik-save-v1')) localStorage.setItem('keksfabrik-save-v1', JSON.stringify(Object.assign(s, { t: Date.now() }))); localStorage.setItem('keksfabrik-chests', '3'); } catch (e) {} },
      { name: 'Review Bakery', b: [30, 20, 12, 6, 3], cookies: 1e7, run: 1e8, all: 1e8, clicks: 400, gold: 3, t: now, opt: { lang: 'en', start: false },
        rv: { l: [[now - 3600e3, 4, 'gro+0', 2, [0, 4]], [now - 2400e3, 3, 'mid1', 5, [0, 4]], [now - 1200e3, 5, 'var+2', 8, [0, 4]], [now - 600e3, 2, 'ord-0', 11, [0, 4]], [0, 9, 'bogus', 99, []]], nx: 3, kp: 1, ck: 0, gd: 0, b5: 1 } });
    const rp = await rctx.newPage(); rp.on('pageerror', e => errors.push('v70: ' + e.message));
    await rp.goto(url); await rp.waitForTimeout(800);
    await rp.addStyleTag({ content: '#introOv,#awayOv,#tutBox,#accHint{display:none!important}' });
    await rp.evaluate(() => document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }));
    await rp.waitForTimeout(5000);
    check(/⭐ \d\.\d · 5/.test(await text(rp, '#rvChip')), 'v70: a new customer review arrives and the chip shows the rating and 5 reviews (the broken one is dropped)', await text(rp, '#rvChip'));
    await rp.click('#rvChip'); await rp.waitForTimeout(400);
    check(await rp.isVisible('#rvOv') && /Customer reviews/.test(await text(rp, '#rvT')) && await rp.locator('#rvBody .rvf').count() === 4 && await rp.locator('#rvBody .rvlist li').count() === 5 && /production|bonus/.test(await text(rp, '#rvBody')), 'v70: the reviews window shows the rating, what customers notice and the latest reviews');
    check(/“.+”/.test(await text(rp, '#rvBody .rvlist li')) && /ago/.test(await text(rp, '#rvBody .rvlist li')), 'v70: reviews are quoted in English and show how long ago');
    await rp.keyboard.press('Escape'); await rp.waitForTimeout(300);
    check(!(await rp.isVisible('#rvOv')), 'v70: Escape closes the reviews window');
    await settings(rp, 'save'); await rp.click('#saveBtn'); await rp.click('#setClose'); await rp.waitForTimeout(300);
    await rp.reload(); await rp.waitForTimeout(1200);
    const kept = await rp.evaluate(() => { try { const o = JSON.parse(localStorage.getItem('keksfabrik-save-v1')); return [o.all, o.rv && o.rv.l.length, o.name, !!(o.ach && o.ach.x_rv5)]; } catch (e) { return ['x']; } });
    check(kept[0] >= 1e8 && kept[1] === 5 && kept[2] === 'Review Bakery', 'v70: a save with reviews loads again with all its progress', kept);
    check(kept[3] === true, 'v70: a 5-star review unlocks the Five Stars achievement', kept);
    await rctx.close();
  }

  // 5d. Push setting (v49)
  await settings(a, 'disp');
  check(await a.isVisible('#pushBtn') && /Push/.test(await text(a, '#pushT')), 'push notification switch shows in Settings → Display');
  await a.click('#setClose');

  // 5e. Crash reports, player journey, chat reactions and pin, comeback gift, portal version (v51)
  await a.waitForTimeout(16000);
  check((await pool.query("select count(*)::int n from kf_steps where step = 'open'")).rows[0].n >= 3, 'journey: every new player counts as "opened the game"');
  check((await pool.query("select count(*)::int n from kf_steps where step in ('acc', 'club')")).rows[0].n >= 2, 'journey: account and club steps are counted');
  await c.evaluate(() => setTimeout(() => { throw new Error('ci crash test'); }, 0)); await c.waitForTimeout(2000);
  for (let i = errors.length - 1; i >= 0; i--) if (/ci crash test/.test(errors[i])) errors.splice(i, 1);
  check((await pool.query("select count(*)::int n from kf_errors where msg like '%ci crash test%'")).rows[0].n === 1, 'a crash in the game is reported to the server');
  await c.evaluate(() => { const b = document.getElementById('errBox'); if (b) b.remove(); });
  await a.click('#clubBar'); await a.click('#clubBody [data-clt=mine]'); await a.waitForSelector('[data-cr=wave]', { timeout: 8000 });
  await a.click('[data-cr=wave]'); await a.waitForTimeout(1000);
  check((await pool.query("select count(*)::int n from kf_club_msgs where body = '👋'")).rows[0].n === 1, 'chat: the 👋 button waves to the club');
  await c.click('#clubBar'); await c.click('#clubBody [data-clt=mine]'); await c.waitForSelector('[data-cr^="pick:"]', { timeout: 8000 });
  await c.locator('[data-cr^="pick:"]').last().click(); await c.locator('.cpick button').first().click(); await c.waitForTimeout(1000);
  check((await pool.query('select count(*)::int n from kf_club_reacts')).rows[0].n === 1, 'chat: a member reacts to a message');
  check(await c.isVisible('.cre.mine'), 'chat: your own reaction is highlighted');
  check(!(await c.isVisible('[data-cr^="pin:"]')), 'chat: only the leader sees the pin button');
  await a.click('[data-cl=refresh]'); await a.waitForSelector('[data-cr^="pin:"]', { timeout: 8000 });
  await a.locator('[data-cr^="pin:"]').last().click(); await a.waitForSelector('.cpin', { timeout: 8000 }).catch(() => {});
  check(await a.isVisible('.cpin') && /👋/.test(await text(a, '.cpin')), 'chat: the leader pins a message');
  await a.click('[data-cr=unpin]'); await a.waitForTimeout(1000);
  check(!(await a.isVisible('.cpin')), 'chat: the leader unpins it again');
  await a.click('#clubClose'); await c.click('#clubClose');
  await d.evaluate(() => document.querySelector('[data-sva=reload]').click()); await d.waitForSelector('[data-ina^="done:"]', { state: 'attached', timeout: 10000 }).catch(() => {});
  check(/ci crash test/.test(await text(d, '#admSrv')), 'admin sees the crash report');
  check(/Player journey/.test(await text(d, '#admSrv')) && await d.evaluate(() => !!document.querySelector('#admSrv .admfun')), 'admin sees the player journey');
  await d.evaluate(() => document.querySelector('[data-ina^="done:"]').click()); await d.waitForTimeout(1200);
  check((await pool.query('select count(*)::int n from kf_errors')).rows[0].n === 0, 'admin marks a crash as fixed');
  // Comeback gift: play, close, come back 4 days later
  const g = await device('Comeback Bakery', '10.0.0.6');
  await g.waitForTimeout(1500); const gctx = g.context(); await g.close();
  const g2 = await gctx.newPage(); g2.on('pageerror', x => errors.push('comeback: ' + x.message));
  await g2.clock.install({ time: new Date(Date.now() + 4 * 86400000) });
  await g2.goto(url); await g2.addStyleTag({ content: '#introOv{display:none!important}' });
  if (await g2.isVisible('#stGo')) await g2.click('#stGo');
  await g2.waitForSelector('#awayOv:not([hidden])', { timeout: 8000 }).catch(() => {});
  check(/Welcome-back gift/.test(await text(g2, '#awayBody')), 'players coming back after 3+ days get a welcome-back gift');
  await gctx.close();
  // Portal version
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'tools/portal.js')]);
  const pctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  await pctx.route(LB + '/**', handle); await pctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const pp = await pctx.newPage(); pp.on('pageerror', x => errors.push('portal: ' + x.message));
  await pp.goto(url + 'dist/portal/'); await pp.waitForTimeout(2500);
  check(await pp.evaluate(() => window.KF_PORTAL === 1 && !document.querySelector('link[rel=manifest]')), 'portal version: built with the portal flag and no app manifest');
  check(await pp.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length === 0), 'portal version: no offline service worker');
  check(await pp.evaluate(() => document.getElementById('appT').parentElement.hidden), 'portal version: the app install section is hidden');
  // v65: in a frame that may not scroll (itch.io with "Enable scrollbars" off) the game area scrolls itself
  {
    const fp = await pctx.newPage(); fp.on('pageerror', x => errors.push('portal frame: ' + x.message));
    await fp.setViewportSize({ width: 1100, height: 520 });
    await fp.setContent('<!doctype html><body style="margin:0"><iframe id="g" scrolling="no" src="' + url + 'dist/portal/" width="1000" height="440" style="border:0"></iframe></body>');
    const fr = await (await fp.$('#g')).contentFrame(); await fr.waitForSelector('#cookie', { timeout: 10000 }).catch(() => {}); await fr.waitForTimeout(800);
    await firstPlay(fr, '');
    await fr.addStyleTag({ content: '#introOv,#tutBox{display:none!important}' });
    await fp.mouse.move(700, 300); for (let k = 0; k < 6; k++) { await fp.mouse.wheel(0, 300); await fp.waitForTimeout(80); }
    await fp.waitForTimeout(300);
    const em = await fr.evaluate(() => ({ embed: document.documentElement.dataset.embed, top: document.querySelector('.wrap').scrollTop, win: scrollY }));
    check(em.embed === '1' && em.top > 0, 'in a frame that may not scroll, the game area still scrolls', em);
    await fp.close();
  }
  // v65: a forced update never locks copies on game sites (they can't update by reloading)
  await pctx.route(LB + '/rest/v1/rpc/kf_ping', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ online: 1, cfg: { min_ver: 999, maint: { on: false }, feat: {} } }) }));
  const plk = await pctx.newPage(); await plk.goto(url + 'dist/portal/'); await plk.waitForTimeout(3000);
  const wl = await pctx.newPage(); await wl.goto(url); await wl.waitForTimeout(3000);
  check(!(await plk.isVisible('#maintOv')) && await wl.isVisible('#maintOv'), 'a forced update locks old web copies but never the itch.io copy');
  // v67: itch.io copies show "What's new" once after an update (they get no update notice)
  const nctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await nctx.route(LB + '/**', handle); await nctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await nctx.addInitScript(() => { try { if (!localStorage.getItem('keksfabrik-save-v1')) localStorage.setItem('keksfabrik-save-v1', JSON.stringify({ name: 'Itch', b: [3], cookies: 100, run: 100, all: 100, t: Date.now(), opt: { lang: 'en', news: 60 } })); } catch (e) {} });
  const np = await nctx.newPage(); await np.goto(url + 'dist/portal/'); await np.click('#stGo').catch(() => {});
  await np.waitForSelector('#newsOv:not([hidden])', { timeout: 8000 }).catch(() => {});
  check(await np.isVisible('#newsOv'), 'after an update the itch.io copy shows "What\'s new" once');
  await nctx.close();
  await pctx.close();

  // 5f. Player version has no admin code; account bans (v52)
  check(!(await a.evaluate(() => !!document.querySelector('[data-sp=admin]') || !!document.getElementById('admin') || typeof window.buildAdmin !== 'undefined')), 'the player version has no admin tab or panel');
  check(!/admin_mod|admin_bans|ADM_HASH|admSrvLogin/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')), 'the player file contains no admin code');
  check(await d.evaluate(() => !!document.querySelector('[data-sp=admin]')), 'admin.html has the admin tab');
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="mod"]');
  await d.waitForSelector('#admBanF', { timeout: 10000 });
  await d.fill('#admBanF [name=user]', 'gamma_ci'); await d.selectOption('#admBanF [name=hours]', '0'); await d.fill('#admBanF [name=reason]', 'spam in chat');
  await d.click('#admBanF button[type=submit]'); await d.click('#admBanF button[type=submit]'); await d.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_bans where username = 'gamma_ci' and until is null")).rows[0].n === 1, 'admin bans an account from the Moderation tab');
  check(/gamma_ci/.test(await text(d, '#admMod')) && await d.isVisible('[data-ban="unban:gamma_ci"]'), 'the ban shows in the ban list');
  await goals(c); await c.click('#clubBar'); await c.waitForSelector('#banOv', { timeout: 10000 }).catch(() => {});
  check(/spam in chat/.test(await text(c, '#banOv')), 'the banned player sees the ban and the reason');
  check(!(await c.evaluate(() => !!localStorage.getItem('keksfabrik-session'))), 'the banned player is signed out');
  await c.click('#banOk'); await c.click('#clubClose').catch(() => {});
  await d.click('[data-ban="unban:gamma_ci"]'); await d.waitForTimeout(1200);
  check((await pool.query('select count(*)::int n from kf_bans')).rows[0].n === 0, 'admin unbans the account');
  // 5g. Moderators, appeals, two-step sign-in, weekly summary, portal ads (v53)
  const totp = (b32, off = 0) => {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
    for (const ch of b32.replace(/\s/g, '')) bits += A.indexOf(ch).toString(2).padStart(5, '0');
    const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + off));
    const h = require('crypto').createHmac('sha1', key).update(msg).digest(), o = h[19] & 15;
    return String(((h.readUInt32BE(o) & 0x7fffffff) % 1000000)).padStart(6, '0');
  };
  await d.waitForSelector('#admModAddF', { timeout: 10000 });
  await d.fill('#admModAddF [name=name]', 'mod_ci'); await d.fill('#admModAddF [name=pass]', 'mod-pass-ci-1'); await d.click('#admModAddF button[type=submit]');
  await d.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_mods where name = 'mod_ci'")).rows[0].n === 1, 'the owner adds a moderator in admin.html');
  const mo = await device('Mod Device', '10.0.0.7', {}, false, 'admin.html');
  await settings(mo, 'admin'); await mo.click('.modlock summary');
  await mo.fill('#modLoginF [name=mname]', 'mod_ci'); await mo.fill('#modLoginF [name=mpass]', 'mod-pass-ci-1'); await mo.click('#modLoginF button[type=submit]');
  await mo.waitForSelector('#modBox .admcard', { timeout: 10000 }).catch(() => {});
  check(await mo.isVisible('#modBox') && !(await mo.isVisible('#admSeg')), 'a moderator signs in and sees only the moderator panel');
  await mo.fill('#modMuteF [name=user]', 'gamma_ci'); await mo.fill('#modMuteF [name=hours]', '500'); await mo.click('#modMuteF button[type=submit]'); await mo.waitForTimeout(1500);
  const mrow = (await pool.query("select until from kf_mutes m join kf_accounts a on a.id = m.account where a.username = 'gamma_ci'")).rows[0];
  check(mrow && Date.parse(mrow.until) - Date.now() < 7 * 86400000 + 60000, 'a moderator mutes a player (at most 7 days)');
  check((await pool.query("select count(*)::int n from kf_admin_log where who = 'mod_ci'")).rows[0].n >= 2, 'moderator actions are logged with their name');
  await mo.click('[data-moda="unmute:gamma_ci"]'); await mo.waitForTimeout(1000);
  await mo.click('#modOutBtn'); await mo.waitForTimeout(500);
  check(await mo.isVisible('#admLockF'), 'the moderator signs out');
  await mo.context().close();
  // appeal: ban gamma again, gamma signs in, sees the ban and appeals; the owner accepts
  await d.fill('#admBanF [name=user]', 'gamma_ci'); await d.fill('#admBanF [name=reason]', 'second warning');
  await d.click('#admBanF button[type=submit]'); await d.click('#admBanF button[type=submit]'); await d.waitForTimeout(1500);
  await settings(c, 'save'); await c.fill('#accF [name=user]', 'gamma_ci'); await c.fill('#accF [name=pass]', 'cookies123'); await c.click('#accF button[type=submit]');
  await c.waitForSelector('#banOv', { timeout: 10000 }).catch(() => {});
  check(/second warning/.test(await text(c, '#banOv')), 'signing in to a banned account shows the ban');
  await c.click('#banOv .banfold summary'); await c.fill('#banApF [name=pass]', 'cookies123'); await c.fill('#banApF [name=body]', 'Sorry, it will not happen again.');
  await c.click('#banApF button[type=submit]'); await c.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_appeals where status = 'open'")).rows[0].n === 1 && /reviewed/.test(await text(c, '#banAp')), 'a banned player sends an appeal');
  await c.click('#banOk'); await c.click('#setClose').catch(() => {});
  await d.click('[data-mda=reload]'); await d.waitForSelector('[data-apa^="yes:"]', { timeout: 10000 }).catch(() => {});
  await d.fill('[data-apans]', 'OK, welcome back.'); await d.click('[data-apa^="yes:"]'); await d.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_bans")).rows[0].n === 0 && (await pool.query("select status from kf_appeals")).rows[0].status === 'accepted', 'the owner accepts the appeal and the ban ends');
  // weekly summary and two-step sign-in
  await d.click('#admSeg [data-ap="srv"]'); await d.waitForSelector('.admweek', { timeout: 10000 }).catch(() => {});
  check(await d.isVisible('.admweek'), 'the Server tab shows the weekly summary');
  await d.click('[data-tfa=setup]'); await d.waitForSelector('#adm2faKey', { timeout: 10000 });
  const key = (await text(d, '#adm2faKey')).replace(/\s/g, '');
  await d.fill('#adm2faOnF [name=code]', totp(key)); await d.click('#adm2faOnF button[type=submit]'); await d.waitForTimeout(1500);
  check((await pool.query('select totp_on from kf_admin_auth')).rows[0].totp_on === true, 'the owner turns on two-step sign-in');
  await d.click('[data-sva=logout]'); await d.waitForSelector('#admSrvPwF', { timeout: 8000 });
  await d.fill('#admSrvPwF [name=spw]', ADMIN_PASS); await d.click('#admSrvPwF button[type=submit]');
  await d.waitForSelector('#admSrvPwF [autocomplete=one-time-code]', { timeout: 8000 }).catch(() => {});
  check(await d.isVisible('#admSrvPwF [autocomplete=one-time-code]'), 'server sign-in asks for the code');
  await d.fill('#admSrvPwF [name=spw]', totp(key, 1)); await d.click('#admSrvPwF button[type=submit]');
  await d.waitForSelector('.admweek', { timeout: 10000 }).catch(() => {});
  check(await d.isVisible('.admweek'), 'password plus code unlocks the server tools');
  await pool.query('update kf_admin_auth set totp_on = false, totp_secret = null');
  await d.click('#setClose');
  // portal ads: only in the CrazyGames / GameDistribution builds, with a fake SDK here
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'tools/portal.js'), '--sdk', 'crazygames']);
  const actx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  await actx.route(LB + '/**', handle); await actx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await actx.route('https://sdk.crazygames.com/**', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__adCalls=0;window.CrazyGames={SDK:{init:async()=>{},game:{loadingStop(){}},ad:{requestAd(t,cb){window.__adCalls++;cb.adStarted&&cb.adStarted();setTimeout(()=>cb.adFinished&&cb.adFinished(),300);}}}};' }));
  const ap = await actx.newPage(); ap.on('pageerror', x => errors.push('ads: ' + x.message));
  await ap.goto(url + 'dist/portal-crazygames/'); await firstPlay(ap, 'Ad Bakery');
  await ap.addStyleTag({ content: '#introOv{display:none!important}' });
  await ap.waitForSelector('#adBtn:not([hidden])', { timeout: 10000 }).catch(() => {});
  check(await ap.isVisible('#adBtn'), 'the CrazyGames version shows the optional ad button');
  const before = await text(ap, '#count'); await ap.click('#adBtn'); await ap.waitForTimeout(1200);
  check(await ap.evaluate(() => window.__adCalls) === 1 && await ap.isDisabled('#adBtn') && (await text(ap, '#count')) !== before, 'watching an ad gives the reward, then waits');
  await actx.close();
  check(!(await a.isVisible('#adBtn')), 'the normal game shows no ads');

  await d.click('#setClose').catch(() => {});

  // 5h. Privacy page, feedback, club levels, admin feedback and alerts (v54)
  await settings(a, 'game');
  check(await a.isVisible('#fbSetBtn') && (await a.getAttribute('#privSetBtn', 'href')) === 'privacy.html', 'Settings has "Send feedback" and the privacy link');
  check((await a.getAttribute('#itchSetBtn', 'href')) === 'https://destinyx350.itch.io/cookie-factory' && /itch\.io/.test(await text(a, '#itchSetBtn')), 'Settings links to the itch.io page');
  const pv = await a.context().newPage(); await pv.goto(url + 'privacy.html');
  check(/In short/.test(await text(pv, '#en')) && /Kurz gesagt/.test(await text(pv, '#de')), 'the privacy page has English and German'); await pv.close();
  await a.click('#fbSetBtn'); await a.waitForSelector('#fbF', { timeout: 5000 });
  await a.click('#fbF label:nth-child(2)'); await a.fill('#fbF [name=body]', 'Please add more cookie skins'); await a.click('#fbF button[type=submit]');
  await a.waitForTimeout(1500);
  const fbr = (await pool.query("select kind, username from kf_feedback")).rows;
  check(fbr.length === 1 && fbr[0].kind === 'idea' && fbr[0].username === 'alpha_ci' && !(await a.isVisible('#fbOv')), 'a player sends feedback from Settings');
  await goals(a); await a.click('#clubBar'); await a.click('#clubBody [data-clt=mine]'); await a.waitForSelector('.clublv', { timeout: 8000 }).catch(() => {});
  check(await a.isVisible('.clublv') && /Level \d/.test(await text(a, '.clublv')), 'the club page shows the club level');
  await a.click('#clubBody [data-clt=list]'); await a.waitForTimeout(1200);
  check(/Level \d/.test(await text(a, '#clubBody .lblist')), 'the club list shows levels');
  await a.click('#clubClose');
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="srv"]');
  await d.waitForSelector('[data-fba^="done:"]', { timeout: 10000 }).catch(() => {});
  check(/more cookie skins/.test(await text(d, '#admSrv')), 'the owner sees player feedback');
  await d.click('[data-fba^="done:"]'); await d.waitForTimeout(1200);
  check((await pool.query("select status from kf_feedback")).rows[0].status === 'done', 'the owner marks feedback done');
  check(await d.isVisible('[data-alrt]') && /Alerts on your phone/.test(await text(d, '#admSrv')), 'the Server tab offers alerts on the phone');
  await d.click('#setClose');

  // 5i. Soundtrack and 3D graphics (v55)
  await settings(a, 'snd');
  const trkTxt = await text(a, '#trkList');
  check(['Morning Bakery', 'Factory Groove', 'Night Shift', 'Great Adventure', 'Showdown', 'Starry Ascension', 'Cookie Festival'].every(n => trkTxt.includes(n)), 'Settings lists the 7 new music tracks');
  await a.click('#setClose');
  {
    const src = fs.readFileSync(path.join(ROOT, 'src/js', fs.readdirSync(path.join(ROOT, 'src/js')).find(f => f.startsWith('13-'))), 'utf8');
    const eng = 'const mHz=m=>440*Math.pow(2,(m-69)/12);\n' + src.slice(src.indexOf('/*MUSIC-START*/'), src.indexOf('/*MUSIC-END*/'));
    const mp = await browser.newPage(); await mp.setContent('<html><body></body></html>');
    await mp.addScriptTag({ content: eng + '\nwindow.__m={TRK,mxGraph,mxPlayer};' });
    const lv = await mp.evaluate(async () => {
      const out = {};
      for (const id of Object.keys(window.__m.TRK)) {
        const C = new OfflineAudioContext(2, 44100 * 6, 44100), o = C.createGain(); o.connect(C.destination);
        const P = window.__m.mxPlayer(window.__m.mxGraph(C, o)); P.start(id, .05); P.I = .8; while (P.t < 5.7) P.run(5.8);
        const d = (await C.startRendering()).getChannelData(0); let pk = 0, ss = 0; for (const x of d) { pk = Math.max(pk, Math.abs(x)); ss += x * x; }
        out[id] = { pk, rms: Math.sqrt(ss / d.length) };
      }
      return out;
    });
    await mp.close();
    check(Object.keys(lv).length === 7 && Object.values(lv).every(v => v.rms > .01 && v.pk < .99), 'all 7 music tracks play, without silence or clipping', lv);
  }
  const has3d = await a.evaluate(() => !!document.querySelector('#cookie canvas.c3d'));
  const flatOk = await a.evaluate(() => { const s = document.querySelector('#cookie svg'); return !!s && getComputedStyle(s).display !== 'none'; });
  check(has3d || flatOk, 'the big cookie shows (3D with WebGL, flat without)', { has3d, flatOk });
  await settings(a, 'disp');
  check(await a.isVisible('#g3dChk'), 'Settings → Display has the 3D graphics switch');
  await a.uncheck('#g3dChk'); await a.waitForTimeout(200);
  check(await a.evaluate(() => !document.querySelector('#cookie canvas.c3d') && !document.documentElement.hasAttribute('data-g3d') && getComputedStyle(document.querySelector('#cookie svg')).display !== 'none'), 'turning 3D off brings back the flat cookie and icons');
  await a.check('#g3dChk'); await a.waitForTimeout(200);
  check(await a.evaluate(() => document.documentElement.hasAttribute('data-g3d')), 'turning 3D on again works');
  await a.click('#setClose');

  // 5j. Simpler saving and server care (v56)
  await settings(a, 'save');
  check(await a.evaluate(() => !document.getElementById('exportBox') && !document.getElementById('importBox') && !/transfer code/i.test(document.getElementById('setOv').textContent)), 'the transfer code and save text are gone from Settings');
  check(await a.evaluate(() => !!document.getElementById('fileDl') && !!document.getElementById('fileUp')), 'the save file is still there');
  await a.click('#setClose');
  await pool.query("delete from kf_save_flags; delete from kf_schedule; delete from kf_jobs");
  await pool.query("insert into kf_save_flags (account, username, old_baked, new_baked, hours) select id, username, 1e10, 1e40, 0.2 from kf_accounts where username = 'alpha_ci'");
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="mod"]');
  await d.click('[data-mda="reload"]').catch(() => {});
  await d.waitForSelector('[data-sfa^="ok:"]', { timeout: 10000 }).catch(() => {});
  check(/Suspicious saves/.test(await text(d, '#admMod')) && await d.isVisible('[data-sfa^="ok:"]') && await d.isVisible('#admMod [data-ban="pick:alpha_ci"]'), 'the owner sees suspicious saves with OK and Ban');
  await d.click('[data-sfa^="ok:"]'); await d.waitForTimeout(1200);
  check((await pool.query("select status from kf_save_flags")).rows[0].status === 'ok', 'the owner marks a suspicious save as OK');
  await d.click('#admSeg [data-ap="srv"]'); await d.waitForSelector('[data-offa=newkey]', { timeout: 10000 }).catch(() => {});
  check(/Database & cleanup/.test(await text(d, '#admSrv')) && /of 500 MB/.test(await text(d, '#admSrv')), 'the Server tab shows how full the database is');
  await d.click('[data-usea=cleanup]'); await d.waitForTimeout(1500);
  check((await pool.query("select count(*)::int n from kf_jobs where k = 'cleanup'")).rows[0].n === 1 && /Last cleanup: (?!never)/.test(await text(d, '#admSrv')), 'the owner runs the cleanup');
  await pool.query('delete from kf_offsite');
  await d.click('#admSeg [data-ap="mod"]'); await d.click('#admSeg [data-ap="srv"]');
  await d.click('[data-offa=newkey]'); await d.waitForSelector('#admOffKeyIn', { timeout: 8000 }).catch(() => {});
  const offKey = await d.inputValue('#admOffKeyIn').catch(() => '');
  check(/^[0-9a-f]{48}$/.test(offKey) && /KF_BACKUP_KEY/.test(await text(d, '#admSrv')), 'the owner creates the off-site key and sees the GitHub steps');
  check((await pool.query('select key_hash from kf_offsite')).rows[0].key_hash.length === 64, 'only the hash of the key is stored');
  await d.click('#admSeg [data-ap="online"]'); await d.waitForSelector('#admPlanF', { timeout: 10000 }).catch(() => {});
  await d.selectOption('#admPlanF [name=kind]', 'news');
  check(!(await d.isVisible('#admPlanF [name=mult]')) && await d.isVisible('#admPlanF [name=body]'), 'the plan form shows only what an announcement needs');
  await d.fill('#admPlanF [name=title]', 'CI weekly news'); await d.selectOption('#admPlanF [name=repeat]', 'weekly'); await d.selectOption('#admPlanF [name=hours]', '24');
  await d.click('#admPlanF button[type=submit]'); await d.waitForTimeout(1500);
  const pl = (await pool.query("select kind, repeat, hours, next_at from kf_schedule where title = 'CI weekly news'")).rows;
  check(pl.length === 1 && pl[0].kind === 'news' && pl[0].repeat === 'weekly' && pl[0].hours === 24 && new Date(pl[0].next_at) > Date.now(), 'the owner plans a weekly announcement', pl);
  check(/CI weekly news/.test(await text(d, '#admOn')) && /every week/.test(await text(d, '#admOn')), 'planned items are listed');
  // the form's default start is the next full hour: move it out so it can't pop up over later tests when a run crosses the hour
  await pool.query("update kf_schedule set next_at = now() + interval '1 day' where title = 'CI weekly news'");
  await d.click('#setClose');

  // 5k. Live dashboard, weekly report and landing page (v57)
  await ping(b); await b.waitForTimeout(1200);
  const dd = (await pool.query("select lang, dev, src from kf_days where dev = 'phone' and src = 'web'")).rows;
  check(dd.length >= 1 && /^[a-z]{2}$/.test(dd[0].lang), 'the minute ping tells the dashboard language, device and source', dd);
  await pool.query("delete from kf_week_reports");
  await pool.query("insert into kf_week_reports (week, data) select '2026-W01', kf_week_data()");
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="srv"]');
  await d.waitForSelector('.dchart', { timeout: 10000 }).catch(() => {});
  check(await d.locator('#admSrv .dchart:not([data-src])').count() === 4 && /Live dashboard/.test(await text(d, '#admSrv')) && /Devices/.test(await text(d, '#admSrv')), 'the Server tab shows the live dashboard with 4 charts');
  await d.waitForFunction(() => !!document.querySelector('#admSrv .ftable tbody tr'), null, { timeout: 8000 }).catch(() => {});
  check(/New players/.test(await text(d, '#admSrv')) && await d.locator('#admSrv .ftable tbody tr').count() === 10 && /Version 68 and later/.test(await text(d, '#admSrv .ftable')), 'v68: the Server tab shows the new-player funnel before and after version 68');
  await d.click('#admSrv [data-fun="s:web"]'); await d.waitForTimeout(800);
  check(await d.evaluate(() => document.querySelector('#admSrv [data-fun="s:web"]').getAttribute('aria-pressed') === 'true'), 'v68: the funnel can be filtered by source');
  await d.waitForFunction(() => /Per player per day/.test(document.getElementById('admSrv').textContent), null, { timeout: 8000 }).catch(() => {});
  check(/Play time/.test(await text(d, '#admSrv')) && /Per player per day/.test(await text(d, '#admSrv')) && /First day of new players/.test(await text(d, '#admSrv')), 'v69: the Server tab shows play time from the minute pings');
  await d.evaluate(() => document.getElementById('newsBtn').click()); await d.waitForTimeout(400);
  check(await d.locator('#newsBody .ntag.k-adm').count() >= 20 && /Play time/.test(await text(d, '#newsBody')) && /New admin panel/.test(await text(d, '#newsBody')), 'v69: admin.html shows the admin changes in What\'s New, marked Admin');
  await d.click('#newsClose'); await d.waitForTimeout(300);
  check(await d.locator('#admSrv .dchart[data-chart=players] .dcols i').count() === 30, 'the dashboard shows 30 days');
  await d.click('[data-dash="7"]'); await d.waitForTimeout(1200);
  check(await d.locator('#admSrv .dchart[data-chart=players] .dcols i').count() === 7, 'the dashboard switches to 7 days');
  // the Server tab redraws every few seconds, so measure and hover again if a redraw came in between
  let tipOk = false;
  for (let k = 0; k < 5 && !tipOk; k++) {
    // Playwright's hover waits until nothing (like a toast) covers the chart
    const pl = d.locator('#admSrv .dchart[data-chart=players] .dplot');
    const plot = await pl.boundingBox();
    if (plot) { await d.mouse.move(plot.x + 5, plot.y + 5); await pl.hover({ position: { x: Math.max(1, plot.width - 3), y: Math.max(1, plot.height - 10) }, timeout: 6000 }).catch(() => {}); }
    await d.waitForTimeout(200);
    tipOk = await d.isVisible('#admSrv .dchart[data-chart=players] .dtip');
  }
  check(tipOk, 'hovering a day shows its number', tipOk ? '' : await d.evaluate(() => { const c = document.querySelector('#admSrv .dchart[data-chart=players]'), pl = c && c.querySelector('.dplot'), r = pl && pl.getBoundingClientRect(), card = c && c.closest('.admcard'); return { sec: (document.getElementById('admSrv') || {}).dataset, ic: card && card.dataset.ic, disp: card && getComputedStyle(card).display, rect: r && [r.x, r.y, r.width, r.height].map(Math.round), vh: innerHeight, tips: c && c.querySelectorAll('.dtip').length, tipHidden: c && c.querySelector('.dtip') && c.querySelector('.dtip').hidden, pane: (document.querySelector('.admpane[data-ap=srv]') || {}).hidden, tab: document.querySelector('#admSeg [aria-pressed=true]') && document.querySelector('#admSeg [aria-pressed=true]').dataset.ap }; }));
  check(/Weekly report/.test(await text(d, '#admSrv')) && await d.locator('#admSrv .rep').count() >= 1, 'the Server tab lists weekly reports');
  await d.click('[data-repa="prev"]'); await d.waitForTimeout(1200);
  check(/Right now/.test(await text(d, '#admSrv')) && /To do/.test(await text(d, '#admSrv')), 'the owner sees this week\'s numbers and to-dos right now');
  await d.click('#setClose');
  {
    const w = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const werr = []; w.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) werr.push(m.text()); }); w.on('pageerror', e => werr.push(e.message));
    await w.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await w.goto(url + 'welcome.html'); await w.waitForTimeout(500);
    check(await w.locator('a[href="https://destinyx350.itch.io/cookie-factory"]').count() >= 2, 'the landing page links to itch.io');
    check((await w.getAttribute('.hero .btn.play', 'href')) === './' && await w.isVisible('.video video') && (await w.getAttribute('.video video', 'src')) === 'docs/trailer.mp4', 'the landing page has the trailer and a Play button');
    await w.click('.lang [data-l=de]');
    check(await w.evaluate(() => document.documentElement.lang === 'de' && /Jetzt spielen/.test(document.querySelector('.hero .btn.play').innerText)), 'the landing page switches to German');
    check(await w.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1 && werr.length === 0, 'the landing page fits a phone and has no errors (its script matches the page\'s security rule)', werr);
    await w.close();
  }
  for (const f of ['docs/trailer.mp4', 'docs/trailer.jpg', 'docs/trailer.gif'])
    check(fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).size > 50000, f + ' is there');

  // 5l. Recovery codes, devices, live club chat, server health (v58)
  await settings(a, 'save');
  await a.click('#accBox details[data-sec="rec"] summary'); await a.waitForSelector('[data-rec="new"]', { timeout: 8000 }).catch(() => {});
  check(/Set up on/.test(await text(a, '#accBox')), 'a new account already has its recovery code from sign-up');
  await a.click('[data-rec="new"]'); await a.waitForTimeout(200);
  check(/Sure\? The old code stops working/.test(await text(a, '#accBox')), 'making a new code asks first');
  await a.evaluate(() => { const c = document.getElementById('recCode'); if (c) c.remove(); });
  await a.click('[data-rec="new"]'); await a.waitForSelector('#recCode', { timeout: 8000 }).catch(() => {});
  const shownCode = await text(a, '#recCode');
  check(/^[A-Z2-7]{4}(-[A-Z2-7]{4}){3}$/.test(shownCode) && !(await a.isVisible('#accNo')), 'a player creates a recovery code and sees it once', shownCode);
  await a.click('#accYes'); await a.waitForTimeout(300);
  check(/Set up on/.test(await text(a, '#accBox')) && await a.isVisible('#accNo') === false, 'the account shows the code is set up');
  const tmpTok = (await rpc('acc_login', { p_user: 'alpha_ci', p_pass: 'cookies123' }, '10.9.9.9')).token;
  await rpc('acc_devices', { p_token: tmpTok, p_action: 'name', p_data: { label: 'CI temp device' } });
  await a.click('#accBox details[data-sec="dev"] summary'); await a.waitForSelector('.devrow', { timeout: 8000 }).catch(() => {});
  check(/this device/.test(await text(a, '.devlist')) && /CI temp device/.test(await text(a, '.devlist')), 'the account lists the signed-in devices');
  await a.locator('.devrow', { hasText: 'CI temp device' }).locator('[data-dev]').click(); await a.waitForTimeout(1200);
  check(!/CI temp device/.test(await text(a, '.devlist')) && await rpc('acc_me', { p_token: tmpTok }).then(() => false, () => true), 'a player signs out one other device');
  await a.click('#setClose');
  {
    const su = await rpc('acc_signup', { p_user: 'recov_ci', p_pass: 'secret123' }, '10.7.7.1');
    const code = (await rpc('acc_recovery', { p_token: su.token, p_action: 'new' })).code;
    const r = await device('Recovery Bakery', '10.7.7.2');
    await settings(r, 'save'); await r.click('#accForgot summary');
    await r.fill('#accRecF [name=ruser]', 'recov_ci'); await r.fill('#accRecF [name=rcode]', code.toLowerCase().replace(/(.{4})(?!$)/g, '$1 '));
    await r.fill('#accRecF [name=rpass]', 'brandnew123'); await r.click('#accRecF button[type=submit]');
    await r.waitForSelector('#accBox .accme', { timeout: 8000 }).catch(() => {});
    check(/recov_ci/.test(await text(r, '#accBox .accme')), 'a forgotten password is reset with the recovery code from the sign-in page');
    await r.waitForSelector('#recCode', { timeout: 8000 }).catch(() => {});
    check(/^[A-Z2-7]{4}(-[A-Z2-7]{4}){3}$/.test(await text(r, '#recCode')) && (await text(r, '#recCode')).replace(/-/g, '') !== code, 'after using it the player gets a new recovery code');
    check((await rpc('acc_login', { p_user: 'recov_ci', p_pass: 'brandnew123' }, '10.7.7.3')).token, 'the new password works');
    await r.context().close();
  }
  await pool.query("create schema if not exists realtime; create table if not exists public.t_rt (topic text, event text, payload jsonb, at timestamptz default now()); create or replace function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void language sql as $f$ insert into public.t_rt (topic, event, payload) values (topic, event, payload) $f$");
  await goals(a); await a.click('#clubBar'); await a.click('#clubBody [data-clt=mine]');
  await a.waitForSelector('#clubOv[data-rt="1"]', { timeout: 10000 }).catch(() => {});
  check(await a.evaluate(() => document.getElementById('clubOv').dataset.rt === '1'), 'the club chat connects to the live signal');
  await a.waitForTimeout(3500);
  const liveTok = (await rpc('acc_login', { p_user: 'alpha_ci', p_pass: 'cookies123' }, '10.9.9.8')).token;
  await rpc('club_post', { p_token: liveTok, p_body: 'live via socket' });
  rtPush(); await a.waitForTimeout(1500);
  check(/live via socket/.test(await text(a, '#clubBody')), 'a new chat message shows at once through the live signal');
  await a.click('#clubClose'); await a.waitForTimeout(1800);
  check(await a.evaluate(() => !document.getElementById('clubOv').dataset.rt), 'closing the club disconnects the live signal');
  await settings(d, 'admin'); await d.click('#admGrp [data-ag=online]'); await d.click('#admSeg [data-ap="srv"]');
  await d.waitForSelector('[data-hlth]', { timeout: 10000 }).catch(() => {});
  check(/Server health/.test(await text(d, '#admSrv')) && /Server parts 1–21 installed/.test(await text(d, '#admSrv')) && /Live chat on/.test(await text(d, '#admSrv')), 'the Server tab shows server health with all 21 parts');
  await d.click('#setClose');

  // 5m. Tab bar, building cards, transitions, bakery start screen, vibration, history, welcome back (v59)
  {
    const ctx = await browser.newContext(Object.assign({ extraHTTPHeaders: { 'x-test-ip': '10.59.0.1' } }, PHONE));
    await ctx.route(LB + '/**', handle); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await ctx.addInitScript(() => {
      window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; };
      const off = +(sessionStorage.getItem('dtoff') || 0);
      if (off) { const D = Date, n = D.now.bind(D); class FD extends D { constructor(...a) { super(...(a.length ? a : [n() + off])); } static now() { return n() + off; } } window.Date = FD; }
    });
    const v = await ctx.newPage();
    v.on('pageerror', e => errors.push('v59: ' + e.message)); v.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push('v59: ' + m.text()); });
    await v.goto(url); await v.waitForTimeout(600);
    check(!(await v.isVisible('#startOv')) && !(await v.isVisible('#nameOv')) && (await text(v, '#plName')).length >= 2, 'a first visit goes straight into the game: no start screen, no name window, the bakery already has a name');
    await firstPlay(v, 'Vibe Bakery');
    await v.addStyleTag({ content: '#introOv,#tutBox{display:none!important}' });
    const ck = await v.locator('#cookie').boundingBox();
    for (let k = 0; k < 25; k++) { await v.touchscreen.tap(ck.x + ck.width / 2, ck.y + ck.height / 2); await v.waitForTimeout(80); }
    check(await v.evaluate(() => window.__vib.length > 0), 'phones vibrate on taps and achievements');
    await settings(v, 'snd'); await v.uncheck('#vibChk'); await v.click('#setClose');
    await v.evaluate(() => { window.__vib = []; });
    for (let k = 0; k < 3; k++) { await v.touchscreen.tap(ck.x + ck.width / 2, ck.y + ck.height / 2); await v.waitForTimeout(90); }
    check(await v.evaluate(() => window.__vib.length === 0), 'vibration can be turned off');
    await v.evaluate(() => { const r = document.querySelector('#buildList .row.can'); if (r) r.click(); });
    await v.waitForTimeout(300);
    check(await v.evaluate(() => { const i = document.querySelector('#buildList .row.owned .msbar i'); return !!i && parseFloat(i.style.width) > 0; }) && /Milestone 0\/13 → 25 \(\d+ to go\)/.test(await text(v, '#buildList .row.owned')), 'building cards show progress to the next milestone');
    await v.click('#bviewSeg [data-bv=grid]');
    check(await v.evaluate(() => document.getElementById('buildList').classList.contains('bgrid')), 'buildings can be shown as a grid');
    await v.click('#bviewSeg [data-bv=list]');
    check(await v.evaluate(() => { const t = document.querySelector('.tab[data-tab="ach"]'); t.click(); return document.querySelector('.pane[data-pane="ach"]').classList.contains('panein'); }), 'switching tabs fades the new tab in');
    await v.evaluate(() => document.querySelector('.tab[data-tab="build"]').click());
    await settings(v, 'disp'); await v.waitForSelector('#tabCfgList .tabcfg', { timeout: 5000 }).catch(() => {});
    const ord = () => v.evaluate(() => [...document.querySelectorAll('.tab')].filter(t => !t.hidden).sort((a, b) => (+a.style.order) - (+b.style.order)).map(t => t.dataset.tab).join(','));
    const before = await ord();
    await v.click('#tabCfgList [data-tc="ach"] [data-tcm="up"]'); await v.waitForTimeout(200);
    const after = await ord();
    check(after !== before && after.indexOf('ach') < before.indexOf('ach'), 'a tab can be moved in the tab bar', { before, after });
    await v.uncheck('#tabCfgList [data-tc="ach"] [data-tch]'); await v.waitForTimeout(200);
    check(await v.evaluate(() => document.querySelector('.tab[data-tab="ach"]').classList.contains('tabhid')) && !(await v.$('#tabCfgList [data-tc="build"] [data-tch]')), 'a tab can be hidden, but Build always stays');
    await v.click('#tabReset'); await v.waitForTimeout(200);
    check(!(await v.evaluate(() => document.querySelector('.tab[data-tab="ach"]').classList.contains('tabhid'))) && (await ord()) === before, 'the tab bar can be reset');
    await v.click('#setSeg [data-sp=save]'); await v.click('#saveBtn'); await v.click('#setClose');
    await v.evaluate(() => sessionStorage.setItem('dtoff', String(3 * 3600e3)));
    await v.reload(); await v.locator('#startOv [data-lang=en]').click().catch(() => {});
    check(await v.isVisible('#stLogo svg.stbake') && (await text(v, '#stSign')) === 'Vibe Bakery', 'the next visit shows the start screen with a bakery and its name on the sign');
    await v.click('#stGo'); await v.addStyleTag({ content: '#introOv,#tutBox{display:none!important}' });
    await v.waitForSelector('#awayOv:not([hidden])', { timeout: 8000 }).catch(() => {});
    check(await v.isVisible('#awayOv') && /\+\d/.test(await text(v, '#awayBody .awhero b')), 'the welcome-back screen counts up the cookies baked while away');
    if (await v.isVisible('[data-aw2="all"]')) { await v.click('[data-aw2="all"]'); await v.waitForTimeout(300); check(/Collected/.test(await text(v, '[data-aw2="all"]')), '"Collect all" collects everything that is ready'); }
    else check(false, 'the welcome-back screen offers "Collect all"');
    await v.click('#awayClose');
    await v.evaluate(() => document.querySelector('[data-tab="ach"]').click()); await v.click('button[data-g="stats"]'); await v.waitForTimeout(2500);
    check(await v.locator('#histBox .hchart').count() === 2 && await v.isVisible('#histBox .hline'), 'statistics show a history chart for cookies and production');
    await v.click('#histBox [data-hr="a"]'); await v.waitForTimeout(300);
    check(await v.evaluate(() => document.querySelector('#histBox [data-hr="a"]').getAttribute('aria-pressed') === 'true'), 'the history range can be switched');
    check(await v.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'phone: the history chart fits without sideways scrolling');
    await ctx.close();
  }

  // 5n. Balance and anti-cheat (v63): only real clicks count, at most 20 a second
  {
    const k = await device('Click Bakery', '10.0.63.1');
    await k.addStyleTag({ content: '#tutBox,#rwOv{display:none!important}' });
    const clicks = async () => { await goals(k); await k.click('button[data-g="stats"]'); await k.waitForTimeout(400); const t = await text(k, '[data-l="s_clicks"]'); await k.evaluate(() => document.querySelector('.tab[data-tab="build"]').click()); return +t.replace(/\D/g, '') || 0; };
    const c0 = await clicks();
    await k.evaluate(() => { const ck = document.getElementById('cookie'); for (let i = 0; i < 30; i++) ck.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 })); });
    check((await clicks()) === c0, 'clicks made by a script don\'t count');
    const box = await k.locator('#cookie').boundingBox(), t0 = Date.now();
    for (let i = 0; i < 80; i++) await k.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const secs = (Date.now() - t0) / 1000, n = (await clicks()) - c0;
    check(n > 0 && n <= 20 * (Math.ceil(secs) + 1) && (secs > 3 || n < 80), 'clicks are limited to 20 a second', { n, secs });
    await k.context().close();
  }

  // 6. Layout: nothing sticks out sideways on a phone
  for (const tab of ['build', 'up', 'ach', 'world', 'shop', 'orders']) {
    await b.evaluate(t => { const e = document.querySelector('[data-tab="' + t + '"]'); if (e) e.click(); }, tab); await b.waitForTimeout(200);
    const over = await b.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(over <= 1, 'phone: no sideways scrolling on the ' + tab + ' tab', over);
  }
  check(errors.length === 0, 'no errors in the browser console', errors);
  await browser.close();
};

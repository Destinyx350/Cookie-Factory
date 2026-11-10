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
    if (admin) await ctx.addInitScript(h => { try { sessionStorage.setItem('keksfabrik-admin', h); } catch (e) {} }, ADM_HASH);
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(name + ': ' + m.text()); });
    await p.goto(page ? url + page : admin ? url + 'admin.html' : url);
    await p.locator('#startOv [data-lang=en]').click();
    await p.click('#stGo');
    if (await p.isVisible('#nameOv')) { await p.fill('#nameIn', name); await p.click('#nameOk'); }
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
  await goals(a); await a.click('#lbBar'); await a.click('[data-lb=join]'); await a.waitForTimeout(3500);
  const link = (await pool.query("select lb_id from kf_accounts where username = 'alpha_ci'")).rows[0].lb_id;
  check(!!link, 'joining the leaderboard links the spot to the account');
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
  check(st.length === 1 && st[0].clicks >= 40, 'the score send also sends clicks, golden cookies and ascensions', st);
  await pool.query("update lb_stats set fast = 125, fast_wk = kf_week_key(), fast_at = now() where id = $1", [st[0] && st[0].id]);
  await goals(a); await a.click('#lbBar'); await a.waitForSelector('#lbBody [data-lbc="clicks"]', { timeout: 8000 }).catch(() => {});
  check(await a.locator('#lbBody [data-lbc]').count() === 5, 'the leaderboard has five categories');
  await a.click('#lbBody [data-lbc="clicks"]'); await a.waitForSelector('#lbBody [data-prof]', { timeout: 8000 }).catch(() => {});
  check(/clicked the big cookie/.test(await text(a, '#lbBody')) && /Alpha/.test(await text(a, '#lbBody .lblist')) && await a.evaluate(() => document.querySelector('#lbBody [data-lbc="clicks"]').getAttribute('aria-pressed') === 'true'), 'the clicks board lists players', await text(a, '#lbBody'));
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
  await e.locator('#startOv [data-lang=en]').click(); await e.click('#stGo');
  if (await e.isVisible('#nameOv')) { await e.fill('#nameIn', 'Invited Bakery'); await e.click('#nameOk'); }
  await e.addStyleTag({ content: '#introOv{display:none!important}' });
  await signup(e, 'epsilon_ci'); await e.waitForTimeout(1200);
  check((await pool.query("select count(*)::int n from kf_referrals r join kf_accounts a on a.id = r.inviter where a.username = 'alpha_ci'")).rows[0].n === 1, 'signing up through an invite link records the invite');
  await ectx.close();

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
  await ap.goto(url + 'dist/portal-crazygames/'); await ap.locator('#startOv [data-lang=en]').click(); await ap.click('#stGo');
  if (await ap.isVisible('#nameOv')) { await ap.fill('#nameIn', 'Ad Bakery'); await ap.click('#nameOk'); }
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
  check(await d.locator('#admSrv .dchart').count() === 4 && /Live dashboard/.test(await text(d, '#admSrv')) && /Devices/.test(await text(d, '#admSrv')), 'the Server tab shows the live dashboard with 4 charts');
  check(await d.locator('#admSrv .dchart[data-chart=players] .dcols i').count() === 30, 'the dashboard shows 30 days');
  await d.click('[data-dash="7"]'); await d.waitForTimeout(1200);
  check(await d.locator('#admSrv .dchart[data-chart=players] .dcols i').count() === 7, 'the dashboard switches to 7 days');
  const plot = await d.locator('#admSrv .dchart[data-chart=players] .dplot').boundingBox();
  if (plot) await d.mouse.move(plot.x + plot.width - 3, plot.y + plot.height - 10);
  await d.waitForTimeout(200);
  check(await d.isVisible('#admSrv .dchart[data-chart=players] .dtip'), 'hovering a day shows its number');
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
  check(/Server health/.test(await text(d, '#admSrv')) && /Server parts 1–17 installed/.test(await text(d, '#admSrv')) && /Live chat on/.test(await text(d, '#admSrv')), 'the Server tab shows server health with all 17 parts');
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
    await v.goto(url); await v.locator('#startOv [data-lang=en]').click();
    check(await v.isVisible('#stLogo svg.stbake') && (await text(v, '#stSign')) === 'Cookie Factory', 'the start screen shows a bakery with a name sign');
    await v.click('#stGo'); if (await v.isVisible('#nameOv')) { await v.fill('#nameIn', 'Vibe Bakery'); await v.click('#nameOk'); }
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
    check((await text(v, '#stSign')) === 'Vibe Bakery', 'the sign shows the bakery name');
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

  // 6. Layout: nothing sticks out sideways on a phone
  for (const tab of ['build', 'up', 'ach', 'world', 'shop', 'orders']) {
    await b.evaluate(t => { const e = document.querySelector('[data-tab="' + t + '"]'); if (e) e.click(); }, tab); await b.waitForTimeout(200);
    const over = await b.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(over <= 1, 'phone: no sideways scrolling on the ' + tab + ' tab', over);
  }
  check(errors.length === 0, 'no errors in the browser console', errors);
  await browser.close();
};

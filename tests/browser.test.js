// Browser tests: the real game in Chromium, on desktop and phone, talking to the test database.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { pool, handle, check, ADMIN_PASS, LB, ROOT } = require('./lib');
const ADM_HASH = /ADM_HASH='([0-9a-f]+)'/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'))[1];
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

module.exports = async function browserTests(url) {
  console.log('\nBrowser');
  await pool.query("delete from kf_backups; delete from kf_accounts; delete from kf_clubs; delete from leaderboard; delete from lb_period; delete from kf_rate; delete from kf_admin_fails; delete from kf_reports; delete from kf_mail; delete from kf_news; delete from kf_events; update kf_config set v = '{\"on\":false,\"de\":\"\",\"en\":\"\"}' where k = 'maint'");
  const browser = await chromium.launch();
  const errors = [];
  async function device(name, ip, opts = {}, admin = false) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 820 }, extraHTTPHeaders: { 'x-test-ip': ip }, acceptDownloads: true }, opts));
    await ctx.route(LB + '/**', handle);
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    if (admin) await ctx.addInitScript(h => { try { sessionStorage.setItem('keksfabrik-admin', h); } catch (e) {} }, ADM_HASH);
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errors.push(name + ': ' + m.text()); });
    await p.goto(url);
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
    await p.waitForSelector('#accBox .accme', { timeout: 8000 }).catch(() => {}); await p.click('#setClose');
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
  await b.reload(); await b.locator('#startOv [data-lang=en]').click(); await b.click('#stGo'); await b.waitForTimeout(4500);
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
  await c.waitForTimeout(18000); await goals(c); await c.click('#clubBar');
  await c.waitForSelector('#rwOv:not([hidden])', { timeout: 10000 }).catch(() => {});
  check(/Welcome!/.test(await text(c, '#rwOv')), 'player gets the admin message as a popup');

  // 5b. Clean layout (v47): settings order, admin groups, accessibility
  await settings(b, 'save');
  const order = await b.evaluate(() => [...document.querySelectorAll('#setOv .optsec[data-sc="save"]:not([hidden])')].map(x => x.querySelector('#accBox') ? 'account' : x.querySelector('#saveBtn') ? 'save' : x.classList.contains('savemore') ? 'more' : 'other').slice(0, 3).join(','));
  check(order === 'account,save,more', 'saving page shows the account first and tucks the rest under "More options"', order);
  await b.fill('#setQ', 'transfer'); await b.waitForTimeout(200);
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

  // 6. Layout: nothing sticks out sideways on a phone
  for (const tab of ['build', 'up', 'ach', 'world', 'shop', 'orders']) {
    await b.evaluate(t => { const e = document.querySelector('[data-tab="' + t + '"]'); if (e) e.click(); }, tab); await b.waitForTimeout(200);
    const over = await b.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(over <= 1, 'phone: no sideways scrolling on the ' + tab + ' tab', over);
  }
  check(errors.length === 0, 'no errors in the browser console', errors);
  await browser.close();
};

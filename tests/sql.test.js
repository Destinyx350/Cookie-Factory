// Database tests: every rule the server enforces, called the way the game calls it (as the "anon" role).
const { pool, rpc, asAnon, check, expectError, ADMIN_PASS } = require('./lib');
const q = (sql, a) => pool.query(sql, a);
const SAVE = 'x'.repeat(40);
// Server jobs run on the server's own clock (pg_cron) since v58 and are closed to players, so tests start them directly.
const job = async f => (await q('select public.' + f + '() as r')).rows[0].r;

module.exports = async function sqlTests() {
  console.log('\nDatabase');
  await q("delete from kf_accounts; delete from kf_clubs; delete from leaderboard; delete from lb_period; delete from kf_rate; delete from kf_admin_fails; delete from kf_backups; delete from kf_reports; delete from kf_mail; delete from kf_mutes; delete from kf_club_closed; delete from kf_club_rewards");

  // Players may not read tables or call internal helpers.
  for (const t of ['kf_accounts', 'kf_sessions', 'kf_gifts', 'kf_admin_auth', 'kf_backups'])
    await expectError(asAnon('select * from public.' + t + ' limit 1'), /permission denied/, 'players cannot read ' + t);
  for (const f of ['kf_ip', 'kf_text_ok', 'kf_backup_make', 'acc_new_session', 'lb_admin_ok'])
    await expectError(rpc(f, f === 'kf_text_ok' ? { p: 'x' } : f === 'kf_backup_make' ? { p_kind: 'manual' } : f === 'acc_new_session' ? { p_account: '00000000-0000-0000-0000-000000000000' } : f === 'lb_admin_ok' ? { p_pass: 'x' } : {}), /permission denied/, 'players cannot call ' + f);

  // Accounts
  const a = await rpc('acc_signup', { p_user: 'test_alpha', p_pass: 'secret123' }, '1.1.1.1');
  check(a && a.token && a.token.length === 64, 'sign up gives a session token');
  await expectError(rpc('acc_signup', { p_user: 'Test_Alpha', p_pass: 'secret123' }, '1.1.1.2'), /username taken/, 'usernames are unique (any case)');
  await expectError(rpc('acc_signup', { p_user: 'Wichser_1', p_pass: 'secret123' }, '1.1.1.2'), /blocked word/, 'rude usernames are blocked');
  for (let i = 0; i < 4; i++) await rpc('acc_signup', { p_user: 'test_lim' + i, p_pass: 'secret123' }, '9.9.9.9');
  await rpc('acc_signup', { p_user: 'test_lim4', p_pass: 'secret123' }, '9.9.9.9');
  await expectError(rpc('acc_signup', { p_user: 'test_lim5', p_pass: 'secret123' }, '9.9.9.9'), /too many requests/, 'one device can make at most 5 accounts an hour');
  const bad = await rpc('acc_login', { p_user: 'test_alpha', p_pass: 'nope' });
  check(bad.error === 'wrong username or password', 'wrong password is refused');
  const a2 = await rpc('acc_login', { p_user: 'TEST_ALPHA', p_pass: 'secret123' });
  check(a2.token && a2.username === 'test_alpha', 'login ignores upper/lower case');
  await rpc('acc_password', { p_token: a.token, p_old: 'secret123', p_new: 'secret456' });
  await expectError(rpc('acc_me', { p_token: a2.token }), /not signed in/, 'changing the password signs out other devices');
  const a3 = await rpc('acc_login', { p_user: 'test_alpha', p_pass: 'secret456' });
  check((await rpc('acc_logout_all', { p_token: a.token })) === 1, 'sign out other devices');
  await expectError(rpc('acc_me', { p_token: a3.token }), /not signed in/, 'other device is signed out');

  // Saves count for the club only above the highest saved total.
  const b = await rpc('acc_signup', { p_user: 'test_beta', p_pass: 'secret123' }, '2.2.2.2');
  await rpc('acc_save', { p_token: a.token, p_data: SAVE, p_baked: 1e9 });
  const club = await rpc('club_create', { p_token: a.token, p_name: 'Test Club', p_emoji: '🧁', p_descr: '' }, '1.1.1.1');
  check(club.role === 'owner', 'create a club');
  await expectError(rpc('club_create', { p_token: b.token, p_name: 'Arschloch Club', p_emoji: '', p_descr: '' }), /blocked word/, 'rude club names are blocked');
  const cid = club.club.id;
  check((await rpc('club_join', { p_token: b.token, p_club: cid })).role === 'member', 'join a club');
  await q("update kf_accounts set save_at = now() - interval '10 minutes' where username = 'test_alpha'");
  await rpc('acc_save', { p_token: a.token, p_data: SAVE, p_baked: 5e9 });
  await q("update kf_accounts set save_at = now() - interval '1 minute' where username = 'test_alpha'");
  await rpc('acc_save', { p_token: a.token, p_data: SAVE, p_baked: 1e9 });
  await q("update kf_accounts set save_at = now() - interval '1 minute' where username = 'test_alpha'");
  await rpc('acc_save', { p_token: a.token, p_data: SAVE, p_baked: 5e9 });
  const gain = (await q("select sum(gain) g from kf_club_week")).rows[0].g;
  check(gain === 4e9, 'club gain counts each cookie once (no old/new save flipping)', gain);

  // Chat, filter, reports, mutes, switches
  await expectError(rpc('club_post', { p_token: b.token, p_body: 'du arschl0ch' }), /blocked word/, 'chat filter catches tricks like 0 for o');
  const m = await rpc('club_post', { p_token: b.token, p_body: 'hello class assassin' });
  check(m.msgs.length === 1, 'normal words like "class" pass the filter');
  await expectError(rpc('club_report', { p_token: b.token, p_msg: m.msgs[0].id }), /cannot report yourself/, 'you cannot report yourself');
  check((await rpc('club_report', { p_token: a.token, p_msg: m.msgs[0].id })).ok, 'report a message');

  // Admin sign-in and lockout
  for (let i = 0; i < 5; i++) await rpc('admin_login', { p_pass: 'wrong' }, '7.7.7.7');
  check((await rpc('admin_login', { p_pass: ADMIN_PASS }, '7.7.7.7')).error === 'locked', 'admin sign-in locks after 5 wrong tries');
  const tok = (await rpc('admin_login', { p_pass: ADMIN_PASS }, '8.8.8.8')).token;
  check(tok && tok.length === 64, 'another device can still sign in');
  await expectError(rpc('admin_lb', { p_pass: ADMIN_PASS, p_action: 'list' }), /wrong admin password/, 'the password itself is not a session');
  const reps = await rpc('admin_mod', { p_pass: tok, p_action: 'reports' });
  check(reps.length === 1 && reps[0].reported === 'test_beta', 'admin sees the report');
  await rpc('admin_mod', { p_pass: tok, p_action: 'mute', p_data: { user: 'test_beta', hours: 1 } });
  await expectError(rpc('club_post', { p_token: b.token, p_body: 'hi' }), /muted/, 'muted players cannot chat');
  await rpc('admin_mod', { p_pass: tok, p_action: 'unmute', p_data: { user: 'test_beta' } });
  await rpc('admin_mod', { p_pass: tok, p_action: 'set', p_data: { k: 'feat', v: { chat: false, gifts: true, clubs: true, lb: true } } });
  await expectError(rpc('club_post', { p_token: b.token, p_body: 'hi' }), /chat is off/, 'chat switch turns chat off');
  check((await rpc('kf_live', {})).cfg.feat.chat === false, 'players get the switches with the live ping');
  await rpc('admin_mod', { p_pass: tok, p_action: 'set', p_data: { k: 'feat', v: { chat: true, gifts: true, clubs: true, lb: true } } });

  // Gifts
  await expectError(rpc('gift_send', { p_token: a.token, p_to: 'test_beta', p_kind: 'gems', p_amount: 5 }), /account too new/, 'new accounts cannot send gifts');
  await q("update kf_accounts set created_at = now() - interval '2 days' where username = 'test_alpha'");
  const g = await rpc('gift_send', { p_token: a.token, p_to: 'test_beta', p_kind: 'gems', p_amount: 30 });
  check(g.gems_left === 20, 'send a gift', g);
  await expectError(rpc('gift_send', { p_token: a.token, p_to: 'test_beta', p_kind: 'gems', p_amount: 21 }), /daily gem limit/, 'daily gem limit');
  await rpc('admin_mod', { p_pass: tok, p_action: 'mail', p_data: { to: 'test_beta', title: 'Hi', gems: 10 } });
  const cl = await rpc('social_claim', { p_token: b.token });
  check(cl.gifts.length === 1 && cl.mail.length === 1, 'gift and admin mail arrive');
  check((await rpc('social_claim', { p_token: b.token })).gifts.length === 0, 'they arrive only once');

  // Weekly club prize
  await q("update kf_club_week set week = lb_week(now() - interval '7 days')");
  const w = await rpc('social_claim', { p_token: a.token });
  check(w.rewards.length === 1 && w.rewards[0].place === 1, 'top club gets its weekly prize');

  // Leaderboard: unique names, growth limit, account link
  const L1 = '11111111-1111-1111-1111-111111111111', L2 = '22222222-2222-2222-2222-222222222222';
  // v64: the leaderboard is for accounts only and always shows the username
  await expectError(rpc('submit_score', { p_id: L2, p_name: 'Guest Bakery', p_score: 5 }), /account needed/, 'guests cannot join the leaderboard');
  await rpc('submit_score', { p_id: L1, p_name: 'Test Bakery', p_score: 1e9, p_token: a.token });
  check((await q('select name from leaderboard where id = $1', [L1])).rows[0].name === 'test_alpha', 'the leaderboard shows the username, not the bakery name');
  await expectError(rpc('submit_score', { p_id: L2, p_name: 'Other', p_score: 5, p_token: a.token }), /another spot/, 'one leaderboard spot per account');
  await q("update leaderboard set updated_at = now() - interval '5 minutes' where id = $1", [L1]);
  await rpc('submit_score', { p_id: L1, p_name: 'Test Bakery', p_score: 1e12 });
  check((await q('select score from leaderboard where id = $1', [L1])).rows[0].score <= 1.0001e9, 'a score that jumps too fast is held back (v67: clamped, not refused)');
  const link = await rpc('acc_lb_link', { p_token: a.token, p_lb: L1 });
  check(link.lb_id === L1 && Math.abs(link.score - 1e9) < 1e7, 'leaderboard spot is linked to the account');
  check((await rpc('acc_lb_link', { p_token: a.token, p_lb: L2 })).lb_id === L1, 'a second device gets the same spot');
  check((await rpc('acc_lb_link', { p_token: b.token, p_lb: L1 })).lb_id === null, 'another account cannot take a linked spot');

  // Backups
  check((await job('kf_backup_tick')).made === true, 'weekly backup is made when due');
  check((await job('kf_backup_tick')).made === false, 'and only once a week');
  const list = await rpc('admin_backup', { p_pass: tok, p_action: 'make' });
  check(list.backups.length === 2, 'admin can back up now', list.backups.length);
  const bid = list.backups[0].id;
  const full = await rpc('admin_backup', { p_pass: tok, p_action: 'get', p_data: { id: bid } });
  check(full.data.kf_accounts.length >= 2 && !full.data.kf_sessions, 'backup holds accounts but no sessions');
  await rpc('acc_delete', { p_token: a.token, p_pass: 'secret456' });
  check((await rpc('admin_backup', { p_pass: tok, p_action: 'restore_account', p_data: { id: bid, user: 'test_alpha' } })).restored === 1, 'restore a deleted account');
  check(!!(await rpc('acc_login', { p_user: 'test_alpha', p_pass: 'secret456' })).token, 'restored account signs in with its old password');
  await expectError(rpc('admin_backup', { p_pass: 'nope', p_action: 'list' }), /wrong admin password/, 'backups need an admin session');

  // Profiles, friends, invites, club wars (v48)
  const c1 = await rpc('acc_signup', { p_user: 'test_gamma', p_pass: 'secret123' }, '3.3.3.3');
  await rpc('acc_profile', { p_token: c1.token, p_data: { ach: 12, asc: 2, title: 'Baker <b>', bakery: 'Gamma Bakes', evil: 'x' } });
  const pr = await rpc('player_profile', { p_name: 'TEST_GAMMA' });
  check(pr.username === 'test_gamma' && pr.stats.ach === 12 && !pr.stats.evil && !pr.stats.title, 'profile shows only safe public numbers', pr.stats);
  check((await rpc('player_profile', { p_name: 'test_alpha' })).rank === 1, 'the profile shows the leaderboard place');
  await expectError(rpc('player_profile', { p_name: 'nobody_here' }), /player not found/, 'unknown profile');
  const fl = await rpc('friend_request', { p_token: c1.token, p_user: 'test_beta' });
  check(fl.outgoing[0] === 'test_beta', 'send a friend request');
  check((await rpc('friend_list', { p_token: b.token })).incoming[0] === 'test_gamma', 'the other player sees the request');
  check((await rpc('social_claim', { p_token: b.token })).friend_requests === 1, 'friend requests are counted for the badge');
  const ok = await rpc('friend_answer', { p_token: b.token, p_user: 'test_gamma', p_accept: true });
  check(ok.friends.length === 1 && ok.friends[0].username === 'test_gamma', 'accept a friend request');
  await expectError(rpc('friend_request', { p_token: c1.token, p_user: 'test_gamma' }), /cannot add yourself/, 'you cannot add yourself');
  check((await rpc('friend_remove', { p_token: c1.token, p_user: 'test_beta' })).friends.length === 0, 'remove a friend');
  check((await rpc('ref_claim', { p_token: c1.token, p_ref: 'test_beta' })).ok, 'a new account can name who invited it');
  await rpc('social_claim', { p_token: c1.token });
  check((await q("select count(*)::int n from kf_mail m join kf_accounts a on a.id = m.to_acc where a.username = 'test_gamma' and not m.claimed")).rows[0].n === 0, 'no invite bonus before baking a million cookies');
  await q("update kf_accounts set club_hw = 2e6 where username = 'test_gamma'");
  const rc = await rpc('social_claim', { p_token: c1.token });
  check(rc.mail.some(m => /Welcome bonus/.test(m.title)), 'invite bonus for the new player');
  check((await rpc('social_claim', { p_token: b.token })).mail.some(m => /test_gamma/.test(m.title)), 'invite bonus for the inviter');
  // Club wars: two clubs bake on a weekend, the winner gets a trophy and prizes
  await q('delete from kf_club_members; delete from kf_clubs; delete from kf_club_week; delete from kf_wars');
  const c2 = await rpc('acc_signup', { p_user: 'test_delta', p_pass: 'secret123' }, '4.4.4.4');
  const A = await rpc('club_create', { p_token: c1.token, p_name: 'War Club A', p_emoji: '🍩', p_descr: '' }, '3.3.3.3');
  await rpc('club_create', { p_token: c2.token, p_name: 'War Club B', p_emoji: '🍪', p_descr: '' }, '4.4.4.4');
  await q("insert into kf_club_week (week, account, club, gain) select lb_week(now()), a.id, m.club, case when a.username = 'test_gamma' then 5e8 else 3e8 end from kf_accounts a join kf_club_members m on m.account = a.id");
  const W = async (sql, args, weekend = true) => { const cl = await pool.connect(); try { await cl.query('begin'); await cl.query("select set_config('kf.test_weekend', $1, true)", [String(weekend)]); await cl.query('set local role anon'); const r = await cl.query(sql, args); await cl.query('commit'); return r.rows[0] && r.rows[0].v; } finally { cl.release(); } };
  const mine = await W('select club_mine($1) v', [c1.token]);
  check(mine.war && mine.war.vs === 'War Club B' && mine.war.current, 'clubs are paired for the weekend war', mine.war);
  await q("update kf_accounts set save_at = now() - interval '10 minutes', club_hw = 1e9 where username in ('test_gamma', 'test_delta')");
  await W('select acc_save($1, $2, $3) v', [c2.token, SAVE, 5e9]);
  const mid = await W('select club_mine($1) v', [c1.token]);
  check(mid.war.them > 0 && mid.war.me === 0, 'weekend baking counts for the war', mid.war);
  await q("update kf_wars set wk = lb_week(now() - interval '7 days')");
  const after = await W('select club_mine($1) v', [c2.token], false);
  check(after.war.closed && after.war.won && after.club.trophies === 1, 'the winning club gets a trophy', after.war);
  check((await W('select social_claim($1) v', [c2.token], false)).mail.some(m => /War Club B/.test(m.title)), 'winning members get a prize');
  check((await rpc('club_list', {})).some(c => c.name === 'War Club B' && c.trophies === 1), 'trophies show in the club list');

  // Push notifications (v49)
  const sub = { endpoint: 'https://push.example.com/abc123', keys: { p256dh: 'BPk', auth: 'xyz' } };
  check((await rpc('push_subscribe', { p_token: b.token, p_sub: sub, p_lang: 'de' })).ok, 'a device can turn push on');
  await expectError(rpc('push_subscribe', { p_token: b.token, p_sub: { endpoint: 'http://evil', keys: {} } }), /invalid subscription/, 'bad push subscriptions are refused');
  await q('delete from kf_push_queue');
  await q("update kf_accounts set created_at = now() - interval '2 days', club_hw = 1e9 where username = 'test_gamma'");
  await rpc('gift_send', { p_token: c1.token, p_to: 'test_beta', p_kind: 'stars', p_amount: 1, p_note: '' });
  await rpc('friend_request', { p_token: c1.token, p_user: 'test_beta' });
  const qd = (await q("select t_en from kf_push_queue order by id")).rows.map(r => r.t_en);
  check(qd.some(t => /Gift from test_gamma/.test(t)) && qd.some(t => /Friend request/.test(t)), 'gifts and friend requests queue a push', qd);
  await rpc('gift_send', { p_token: b.token, p_to: 'test_gamma', p_kind: 'stars', p_amount: 1, p_note: '' }).catch(() => {});
  check((await q("select count(*)::int n from kf_push_queue q join kf_accounts a on a.id = q.account where a.username = 'test_gamma'")).rows[0].n === 0, 'no push is queued for players without push');
  await expectError(rpc('push_take', { p_secret: 'guess' }), /forbidden/, 'only the push sender can take notifications');
  check((await q('select count(*)::int n from kf_push_cfg where length(secret) = 48')).rows[0].n === 1, 'the database makes its own push secret');
  check((await rpc('push_pubkey', {})) === null, 'no public push key before the sender has run');
  await expectError(asAnon('select vapid_priv from public.kf_push_cfg'), /permission denied/, 'players cannot read the push keys');
  await q("update kf_push_cfg set vapid_pub = 'BTestPublicKey'");
  check((await rpc('push_pubkey', {})) === 'BTestPublicKey', 'players get the public push key');
  await q("insert into kf_push_cfg (k, url, secret) values (1, 'https://example.invalid/kf-push', 'test-secret') on conflict (k) do update set secret = excluded.secret");
  const taken = await rpc('push_take', { p_secret: 'test-secret' });
  check(taken.length >= 2 && taken[0].subs[0].lang === 'de' && /Geschenk/.test(taken[0].t_de), 'the push sender gets the notifications with the device', taken.length);
  check((await rpc('push_take', { p_secret: 'test-secret' })).length === 0, 'each notification is sent once');
  await rpc('admin_online', { p_pass: tok, p_action: 'event_add', p_data: { kind: 'prod', mult: 2, hours: 1 } });
  const bc = await rpc('push_take', { p_secret: 'test-secret' });
  check(bc.length === 1 && bc[0].subs.length >= 1, 'a new global event notifies every device');
  await rpc('push_gone', { p_secret: 'test-secret', p_endpoints: [sub.endpoint] });
  check((await q('select count(*)::int n from kf_push_subs')).rows[0].n === 0, 'dead devices are removed');

  // Crash reports, player journey, comeback reminders, chat extras (v51)
  await rpc('kf_report_error', { p_msg: 'TypeError: x is undefined', p_stack: 'at foo (index.html:1:2)', p_src: 'index.html:1', p_ver: 51, p_ua: 'Test' }, '6.6.6.1');
  await rpc('kf_report_error', { p_msg: 'TypeError: x is undefined', p_stack: '', p_src: 'index.html:1', p_ver: 51, p_ua: 'Test' }, '6.6.6.1');
  const errs = await rpc('admin_insights', { p_pass: tok, p_action: 'errors' });
  check(errs.length === 1 && errs[0].count === 2 && /foo/.test(errs[0].stack), 'crash reports are grouped and counted', errs);
  await expectError(asAnon('select * from public.kf_errors'), /permission denied/, 'players cannot read crash reports');
  check((await rpc('admin_insights', { p_pass: tok, p_action: 'error_done', p_data: { fp: errs[0].fp } })).length === 0, 'admin marks a crash as fixed');
  const pid = '33333333-3333-3333-3333-333333333333';
  await rpc('kf_ping', { p_id: pid, p_baked: 10 });
  for (const st of ['open', 'build1', 'build1', 'nonsense']) await rpc('kf_track', { p_id: pid, p_step: st });
  check((await q('select count(*)::int n from kf_steps where id = $1', [pid])).rows[0].n === 2, 'journey steps are stored once and only known steps');
  await q("update kf_presence set first_seen = now() - interval '9 days' where id = $1", [pid]);
  await q("insert into kf_days (id, day) values ($1, current_date - 1) on conflict do nothing", [pid]);
  const j = await rpc('admin_insights', { p_pass: tok, p_action: 'journey' });
  check(j.steps.open >= 1 && j.cohort >= 1 && j.back1 >= 1 && j.back7 >= 1 && j.daily.length === 14, 'admin sees the player journey and who came back', j);
  await q("update kf_accounts set save_at = now() - interval '5 days', last_login = now() - interval '5 days', reminded_at = null where username = 'test_beta'");
  await rpc('push_subscribe', { p_token: b.token, p_sub: { endpoint: 'https://push.example.com/back', keys: { p256dh: 'x', auth: 'y' } } });
  await q('delete from kf_push_queue');
  check((await job('kf_reminders')).sent >= 1, 'players away for 3+ days get a comeback reminder');
  check((await job('kf_reminders')).sent === 0, 'only one reminder per absence');
  check((await q("select count(*)::int n from kf_push_queue where t_en like '%misses you%'")).rows[0].n >= 1, 'the reminder is queued as a push');
  // chat: reactions and pin
  const own = await rpc('club_mine', { p_token: c2.token });
  const posted = await rpc('club_post', { p_token: c2.token, p_body: 'hello war club' });
  const mid2 = posted.msgs[posted.msgs.length - 1].id;
  const r1 = await rpc('club_react', { p_token: c2.token, p_msg: mid2, p_emoji: '🎉' });
  check(r1.msgs.find(m => m.id === mid2).reacts[0].n === 1 && r1.msgs.find(m => m.id === mid2).reacts[0].mine, 'react to a chat message');
  const r2 = await rpc('club_react', { p_token: c2.token, p_msg: mid2, p_emoji: '🎉' });
  check(r2.msgs.find(m => m.id === mid2).reacts.length === 0, 'tapping the same reaction again removes it');
  await expectError(rpc('club_react', { p_token: c2.token, p_msg: mid2, p_emoji: '💩' }), /invalid emoji/, 'only the 5 reaction emojis are allowed');
  check((await rpc('club_pin', { p_token: c2.token, p_msg: mid2 })).pinned.body === 'hello war club', 'the club leader pins a message');
  check((await rpc('club_pin', { p_token: c2.token, p_msg: null })).pinned === null, 'and can unpin it');
  check(!!own.club, 'club page still loads');

  // Account bans (v52)
  const e1 = await rpc('acc_signup', { p_user: 'test_eps', p_pass: 'secret123' }, '5.5.5.5');
  const elb = '55555555-5555-5555-5555-555555555555';
  await q("insert into leaderboard (id, name, score, updated_at) values ($1, 'Eps Bakery', 100, now())", [elb]);
  await q("update kf_accounts set lb_id = $1 where username = 'test_eps'", [elb]);
  await expectError(asAnon('select * from public.kf_bans'), /permission denied/, 'players cannot read the ban list');
  await expectError(rpc('kf_unban', { p_acc: e1.token ? '00000000-0000-0000-0000-000000000000' : null }), /permission denied/, 'players cannot unban themselves');
  await expectError(rpc('admin_bans', { p_pass: 'wrong', p_action: 'list' }), /wrong admin password/, 'ban tools need the admin session');
  const bl = await rpc('admin_bans', { p_pass: tok, p_action: 'ban', p_data: { user: 'test_eps', hours: 0, reason: 'cheating', device: true } });
  check(bl.length === 1 && bl[0].username === 'test_eps' && bl[0].until === null && bl[0].devices === 1, 'admin bans an account forever, with its device', bl);
  await expectError(rpc('acc_me', { p_token: e1.token }), /banned: .*cheating/, 'a banned player is stopped with the reason');
  await expectError(rpc('club_list', { p_search: '' }).then(() => rpc('club_create', { p_token: e1.token, p_name: 'Ban Club', p_emoji: '🍪', p_descr: '' })), /banned/, 'a banned player cannot use clubs');
  const bl2 = await rpc('acc_login', { p_user: 'test_eps', p_pass: 'secret123' }, '5.5.5.9');
  check(bl2.error === 'banned' && bl2.reason === 'cheating' && !bl2.token, 'a banned player cannot sign in', bl2);
  await expectError(rpc('acc_signup', { p_user: 'test_eps2', p_pass: 'secret123' }, '5.5.5.5'), /banned/, 'a blocked device cannot make a new account');
  check((await rpc('acc_signup', { p_user: 'test_zeta', p_pass: 'secret123' }, '6.6.6.6')).token, 'other devices still can');
  check((await q('select count(*)::int n from lb_banned where id = $1', [elb])).rows[0].n === 1, 'the ban also bans the leaderboard spot');
  check((await q("select count(*)::int n from kf_admin_log where action = 'ban account'")).rows[0].n === 1, 'the ban is in the admin log');
  check((await rpc('admin_bans', { p_pass: tok, p_action: 'unban', p_data: { user: 'test_eps' } })).length === 0, 'admin unbans the account');
  check((await rpc('acc_me', { p_token: e1.token })).username === 'test_eps', 'an unbanned player can play online again');
  check((await q('select count(*)::int n from lb_banned where id = $1', [elb])).rows[0].n === 0, 'unbanning frees the leaderboard spot');
  check((await rpc('acc_signup', { p_user: 'test_eps3', p_pass: 'secret123' }, '5.5.5.5')).token, 'unbanning frees the device');
  await rpc('admin_bans', { p_pass: tok, p_action: 'ban', p_data: { user: 'test_eps', hours: 0.0003, reason: 'cool down' } });
  await expectError(rpc('acc_me', { p_token: e1.token }), /banned/, 'a timed ban works');
  await new Promise(r => setTimeout(r, 1500));
  check((await rpc('acc_me', { p_token: e1.token })).username === 'test_eps', 'a timed ban ends by itself');
  check((await rpc('admin_bans', { p_pass: tok, p_action: 'list' })).length === 0, 'ended bans leave the list');
  await expectError(rpc('admin_bans', { p_pass: tok, p_action: 'ban', p_data: { user: 'nobody_here' } }), /player not found/, 'banning an unknown name fails');

  // Moderators, appeals, two-step sign-in, weekly summary (v53)
  const totp = (b32, off = 0) => {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
    for (const ch of b32) bits += A.indexOf(ch).toString(2).padStart(5, '0');
    const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + off));
    const h = require('crypto').createHmac('sha1', key).update(msg).digest(), o = h[19] & 15;
    return String(((h.readUInt32BE(o) & 0x7fffffff) % 1000000)).padStart(6, '0');
  };
  await expectError(rpc('admin_mods', { p_pass: 'x', p_action: 'list' }), /wrong admin password/, 'only the owner manages moderators');
  await expectError(rpc('admin_mods', { p_pass: tok, p_action: 'add', p_data: { name: 'mod_anna', pass: 'short' } }), /invalid password/, 'moderator passwords need 8+ characters');
  check((await rpc('admin_mods', { p_pass: tok, p_action: 'add', p_data: { name: 'mod_anna', pass: 'mod-pass-123' } }))[0].name === 'mod_anna', 'the owner adds a moderator');
  check((await rpc('mod_login', { p_user: 'mod_anna', p_pass: 'nope' }, '7.1.1.1')).error === 'wrong password', 'a wrong moderator password is refused');
  const ml = await rpc('mod_login', { p_user: 'MOD_ANNA', p_pass: 'mod-pass-123' }, '7.1.1.2');
  check(ml.token && ml.name === 'mod_anna', 'a moderator signs in', ml);
  const mt = ml.token;
  await expectError(rpc('admin_mod', { p_pass: mt, p_action: 'stats' }), /wrong admin password/, 'moderators cannot use the owner tools');
  await expectError(rpc('admin_bans', { p_pass: mt, p_action: 'list' }), /wrong admin password/, 'moderators cannot ban');
  check((await rpc('mod_tools', { p_pass: mt, p_action: 'me' })).name === 'mod_anna', 'moderator tools know who is signed in');
  check(Array.isArray(await rpc('mod_tools', { p_pass: mt, p_action: 'reports' })), 'moderators see the reports');
  const mm = await rpc('mod_tools', { p_pass: mt, p_action: 'mute', p_data: { user: 'test_beta', hours: 9999, reason: 'spam' } });
  const mu = mm.find(x => x.username === 'test_beta');
  check(mu && Date.parse(mu.until) - Date.now() < 7 * 86400000 + 60000, 'moderators can mute for at most 7 days');
  check((await q("select count(*)::int n from kf_admin_log where who = 'mod_anna' and action like '👮 mod_anna%mute%'")).rows[0].n === 1, 'moderator actions are logged with their name');
  check((await rpc('mod_tools', { p_pass: mt, p_action: 'search', p_data: { q: 'test_b' } })).some(x => x.username === 'test_beta'), 'moderators can find players');
  await rpc('mod_tools', { p_pass: mt, p_action: 'unmute', p_data: { user: 'test_beta' } });
  check((await rpc('admin_mods', { p_pass: tok, p_action: 'list' }))[0].actions >= 2, 'the owner sees how much each moderator did');
  await rpc('admin_mods', { p_pass: tok, p_action: 'remove', p_data: { name: 'mod_anna' } });
  await expectError(rpc('mod_tools', { p_pass: mt, p_action: 'me' }), /wrong admin password/, 'removing a moderator ends their session');
  // appeals
  await rpc('admin_bans', { p_pass: tok, p_action: 'ban', p_data: { user: 'test_eps', hours: 0, reason: 'cheating' } });
  await expectError(rpc('ban_appeal', { p_user: 'test_eps', p_pass: 'wrong', p_body: 'please' }), /wrong username or password/, 'an appeal needs the account password');
  await expectError(rpc('ban_appeal', { p_user: 'test_beta', p_pass: 'secret123', p_body: 'hi' }), /not banned/, 'only banned players can appeal');
  check((await rpc('ban_appeal', { p_user: 'test_eps', p_pass: 'secret123', p_body: 'I did not cheat, sorry if it looked like it' })).status === 'open', 'a banned player sends an appeal');
  await expectError(rpc('ban_appeal', { p_user: 'test_eps', p_pass: 'secret123', p_body: 'again' }), /appeal already open/, 'one open appeal at a time');
  const lgA = await rpc('acc_login', { p_user: 'test_eps', p_pass: 'secret123' }, '5.5.6.6');
  check(lgA.error === 'banned' && lgA.appeal && lgA.appeal.status === 'open', 'sign-in shows the appeal is waiting', lgA);
  const apl = await rpc('admin_appeals', { p_pass: tok, p_action: 'list' });
  check(apl.length === 1 && apl[0].ban.reason === 'cheating', 'the owner sees the appeal with the ban reason');
  await expectError(rpc('admin_appeals', { p_pass: mt, p_action: 'list' }), /wrong admin password/, 'moderators cannot answer appeals');
  await rpc('admin_appeals', { p_pass: tok, p_action: 'answer', p_data: { id: apl[0].id, accept: false, answer: 'Sorry, the ban stays.' } });
  const lgR = await rpc('acc_login', { p_user: 'test_eps', p_pass: 'secret123' }, '5.5.6.6');
  check(lgR.appeal.status === 'rejected' && /stays/.test(lgR.appeal.answer), 'a rejected player sees the answer');
  await expectError(rpc('ban_appeal', { p_user: 'test_eps', p_pass: 'secret123', p_body: 'pls' }), /one appeal per day/, 'one appeal per day');
  await q("update kf_appeals set created_at = now() - interval '2 days'");
  await rpc('ban_appeal', { p_user: 'test_eps', p_pass: 'secret123', p_body: 'second try' });
  const ap2 = (await rpc('admin_appeals', { p_pass: tok, p_action: 'list' })).find(x => x.status === 'open');
  await rpc('admin_appeals', { p_pass: tok, p_action: 'answer', p_data: { id: ap2.id, accept: true, answer: 'OK, welcome back.' } });
  check((await rpc('acc_login', { p_user: 'test_eps', p_pass: 'secret123' }, '5.5.6.6')).token, 'accepting an appeal lifts the ban');
  // two-step sign-in
  check((await rpc('admin_2fa', { p_pass: tok, p_action: 'status' })).on === false, 'two-step sign-in starts off');
  const su2 = await rpc('admin_2fa', { p_pass: tok, p_action: 'setup' });
  check(/^[A-Z2-7]{32}$/.test(su2.secret) && /^otpauth:\/\/totp\//.test(su2.uri), 'setup gives a key for the authenticator app');
  await expectError(rpc('admin_2fa', { p_pass: tok, p_action: 'confirm', p_data: { code: '000000' } }), /wrong code/, 'a wrong code does not turn it on');
  check((await rpc('admin_2fa', { p_pass: tok, p_action: 'confirm', p_data: { code: totp(su2.secret) } })).on === true, 'the right code turns two-step sign-in on');
  check((await rpc('admin_login', { p_pass: ADMIN_PASS }, '8.2.2.2')).error === 'code needed', 'sign-in now asks for the code');
  check((await rpc('admin_login', { p_pass: ADMIN_PASS, p_code: '123456' }, '8.2.2.3')).error === 'wrong code', 'a wrong code is refused');
  const tok2 = (await rpc('admin_login', { p_pass: ADMIN_PASS, p_code: totp(su2.secret, 1) }, '8.2.2.4')).token;
  check(tok2 && tok2.length === 64, 'password plus code signs in');
  check((await rpc('admin_login', { p_pass: ADMIN_PASS, p_code: totp(su2.secret, 1) }, '8.2.2.5')).error === 'wrong code', 'a code works only once');
  check((await rpc('mod_login', { p_user: 'nobody', p_pass: 'x' }, '8.2.2.6')).error === 'wrong password', 'moderator sign-in still works without codes');
  await rpc('admin_2fa', { p_pass: tok2, p_action: 'disable', p_data: { code: totp(su2.secret, -1) } }).catch(() => null);
  if ((await rpc('admin_2fa', { p_pass: tok2, p_action: 'status' })).on) await q('update kf_admin_auth set totp_on = false, totp_secret = null');
  check((await rpc('admin_login', { p_pass: ADMIN_PASS }, '8.2.2.7')).token, 'with two-step sign-in off, the password alone works again');
  // weekly summary
  const sm = await rpc('admin_summary', { p_pass: tok });
  check(sm.this && sm.last && sm.this.accounts >= 5 && 'players' in sm.this && 'crashes' in sm.last, 'the weekly summary compares this week with last week', sm);
  await expectError(rpc('admin_summary', { p_pass: mt }), /wrong admin password/, 'the summary is for the owner only');

  {
  // Club levels, feedback, admin alerts (v54)
  const lvClub = await rpc('club_mine', { p_token: c2.token });
  check(lvClub.club.level && lvClub.club.level.level >= 1 && 'next' in lvClub.club.level, 'my club shows its level', lvClub.club.level);
  const lvCid = lvClub.club.id;
  await q("insert into kf_club_week (week, club, account, gain) select 'W2000-0' || g, $1, (select id from kf_accounts where username = 'test_delta'), 100 from generate_series(1, 9) g on conflict do nothing", [lvCid]).catch(e => console.log('club_week insert', e.message));
  const lv2 = (await rpc('club_mine', { p_token: c2.token })).club.level;
  check(lv2.xp >= 900 && lv2.level >= 3, 'baking members raise the club level', lv2);
  check((await rpc('club_list', { p_search: '' })).every(c => c.level >= 1), 'the club list shows levels');
  await expectError(rpc('kf_club_xp', { p_club: lvCid }), /permission denied/, 'players cannot call the level helpers');
  // feedback
  const pidF = '44444444-4444-4444-4444-444444444444';
  await expectError(rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'rant', p_body: 'hello there' }), /invalid kind/, 'feedback needs a known kind');
  await expectError(rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'bug', p_body: 'hi' }), /invalid message/, 'feedback needs at least 5 characters');
  check((await rpc('kf_feedback_send', { p_id: pidF, p_token: c2.token, p_kind: 'idea', p_body: 'Please add a dark chocolate building', p_ver: 54 }, '9.8.7.6')).ok, 'a player sends feedback');
  for (let i = 0; i < 4; i++) await rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'bug', p_body: 'bug report ' + i }, '9.8.7.6');
  await expectError(rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'bug', p_body: 'one too many' }, '9.8.7.6'), /too many requests/, 'feedback is limited to 5 a day per device');
  await expectError(asAnon('select * from public.kf_feedback'), /permission denied/, 'players cannot read feedback');
  const fb = await rpc('admin_feedback', { p_pass: tok, p_action: 'list' });
  check(fb.length === 5 && fb.some(f => f.username === 'test_delta' && f.kind === 'idea'), 'the owner sees feedback with the username', fb.length);
  check((await rpc('admin_feedback', { p_pass: tok, p_action: 'done', p_data: { id: fb[0].id } })).find(f => f.id === fb[0].id).status === 'done', 'the owner marks feedback done');
  check((await rpc('admin_feedback', { p_pass: tok, p_action: 'delete', p_data: { id: fb[0].id } })).length === 4, 'the owner deletes feedback');
  // admin alerts
  await q('delete from kf_push_queue');
  await rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'other', p_body: 'no one listens yet' }, '9.8.7.7');
  check((await q("select count(*)::int n from kf_push_queue where target is not null")).rows[0].n === 0, 'no alert is queued when no admin device listens');
  await expectError(rpc('admin_push', { p_pass: 'x', p_action: 'status', p_data: {} }), /wrong admin password/, 'alert settings need a sign-in');
  const ap1 = await rpc('admin_push', { p_pass: tok, p_action: 'subscribe', p_data: { sub: { endpoint: 'https://push.example.com/owner', keys: { p256dh: 'x', auth: 'y' } }, lang: 'de' } });
  check(ap1.on && ap1.devices === 1, 'the owner turns on alerts for a device');
  await rpc('admin_mods', { p_pass: tok, p_action: 'add', p_data: { name: 'mod_bob', pass: 'mod-pass-456' } });
  const mt2 = (await rpc('mod_login', { p_user: 'mod_bob', p_pass: 'mod-pass-456' }, '7.3.3.3')).token;
  await rpc('admin_push', { p_pass: mt2, p_action: 'subscribe', p_data: { sub: { endpoint: 'https://push.example.com/mod', keys: { p256dh: 'x', auth: 'y' } } } });
  await rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'bug', p_body: 'the button is broken' }, '9.8.7.8');
  await rpc('kf_feedback_send', { p_id: pidF, p_token: null, p_kind: 'bug', p_body: 'and another one' }, '9.8.7.9');
  check((await q("select count(*)::int n from kf_push_queue where kind = 'feedback'")).rows[0].n === 1, 'new feedback alerts the owner, at most once every 10 minutes');
  const m3 = (await rpc('club_mine', { p_token: c2.token })).msgs; const other = await rpc('acc_signup', { p_user: 'test_rep', p_pass: 'secret123' }, '9.1.1.1');
  await rpc('club_join', { p_token: other.token, p_club: lvCid });
  await rpc('club_report', { p_token: other.token, p_msg: m3[m3.length - 1].id });
  check((await q("select count(*)::int n from kf_push_queue where kind = 'report' and target = 'staff'")).rows[0].n === 1, 'a new report alerts the owner and moderators');
  await rpc('kf_report_error', { p_msg: 'brand new crash', p_src: 'x.js:1:1', p_ver: 54 }, '9.2.2.2');
  await rpc('kf_report_error', { p_msg: 'brand new crash', p_src: 'x.js:1:1', p_ver: 54 }, '9.2.2.2');
  check((await q("select count(*)::int n from kf_push_queue where kind = 'crash'")).rows[0].n === 1, 'a new kind of crash alerts the owner once');
  const sec = (await q('select secret from kf_push_cfg where k = 1')).rows[0].secret;
  const taken = await rpc('push_take', { p_secret: sec });
  const rep = taken.find(t => /report/i.test(t.t_en)), fbk = taken.find(t => /feedback/i.test(t.t_en));
  check(rep && rep.subs.length === 2 && rep.url === 'admin.html', 'report alerts go to the owner and moderator devices and open admin.html', rep);
  check(fbk && fbk.subs.length === 1 && fbk.subs[0].endpoint.endsWith('/owner') && fbk.subs[0].lang === 'de', 'feedback alerts go only to the owner');
  check(!taken.some(t => t.subs.some(s2 => s2.endpoint.includes('/back') && /report|feedback|crash/i.test(t.t_en))), 'players never get admin alerts');
  await rpc('push_gone', { p_secret: sec, p_endpoints: ['https://push.example.com/mod'] });
  check((await q('select count(*)::int n from kf_admin_push')).rows[0].n === 1, 'dead admin devices are removed');
  check((await rpc('admin_push', { p_pass: tok, p_action: 'unsubscribe', p_data: { endpoint: 'https://push.example.com/owner' } })).on === false, 'the owner turns alerts off');
  }
  {
  // Server care (v56): no transfer codes, save checks, planned events, off-site backups, cleanup and usage
  for (const t of ['kf_save_flags', 'kf_schedule', 'kf_offsite', 'kf_jobs'])
    await expectError(asAnon('select * from public.' + t + ' limit 1'), /permission denied/, 'players cannot read ' + t);
  await expectError(rpc('kf_cleanup_run', {}), /permission denied/, 'players cannot run the cleanup directly');
  await expectError(rpc('save_upload', { p_data: 'x'.repeat(40) }), /does not exist|function/, 'transfer codes are gone from the server');
  check((await q("select to_regclass('public.kf_saves') t")).rows[0].t === null, 'the transfer code table is removed');
  // save checks
  const sf = await rpc('acc_signup', { p_user: 'test_jump', p_pass: 'secret123' }, '6.1.1.1');
  await rpc('acc_save', { p_token: sf.token, p_data: SAVE, p_baked: 1e30 });
  check((await q("select count(*)::int n from kf_save_flags where username = 'test_jump'")).rows[0].n === 0, 'the first account save is never flagged (any size)');
  await q("update kf_accounts set save_at = now() - interval '10 minutes' where username = 'test_jump'");
  await rpc('acc_save', { p_token: sf.token, p_data: SAVE, p_baked: 1e31 });
  check((await q("select count(*)::int n from kf_save_flags where username = 'test_jump'")).rows[0].n === 0, 'normal growth is not flagged');
  await q("update kf_accounts set save_at = now() - interval '10 minutes' where username = 'test_jump'");
  await rpc('acc_save', { p_token: sf.token, p_data: SAVE, p_baked: 1e45 });
  await q("update kf_accounts set save_at = now() - interval '1 minute' where username = 'test_jump'");
  await rpc('acc_save', { p_token: sf.token, p_data: SAVE, p_baked: 1e60 });
  check((await q("select count(*)::int n from kf_save_flags where username = 'test_jump'")).rows[0].n === 1, 'an impossible jump is flagged once an hour');
  check((await q("select save_baked from kf_accounts where username = 'test_jump'")).rows[0].save_baked === 1e60, 'a flagged save is still kept');
  await q("update kf_accounts set save_at = now() - interval '3 days' where username = 'test_jump'");
  await rpc('acc_save', { p_token: sf.token, p_data: SAVE, p_baked: 1e70 });
  check((await q("select count(*)::int n from kf_save_flags where username = 'test_jump'")).rows[0].n === 1, 'days away allow more growth');
  await expectError(rpc('admin_saveflags', { p_pass: mt, p_action: 'list' }), /wrong admin password/, 'save flags are for the owner only');
  const fl = await rpc('admin_saveflags', { p_pass: tok, p_action: 'list' });
  check(fl.length === 1 && fl[0].username === 'test_jump' && fl[0].old === 1e31 && fl[0].new === 1e45 && fl[0].banned === false, 'the owner sees the suspicious save', fl);
  check((await rpc('admin_saveflags', { p_pass: tok, p_action: 'ok', p_data: { id: fl[0].id } })).length === 0, 'the owner marks it as OK');
  // planned events and announcements
  await q('delete from kf_schedule');
  await expectError(rpc('admin_schedule', { p_pass: mt, p_action: 'list' }), /wrong admin password/, 'planning is for the owner only');
  const inH = new Date(Date.now() + 3600e3).toISOString(), ago = new Date(Date.now() - 60e3).toISOString();
  await expectError(rpc('admin_schedule', { p_pass: tok, p_action: 'add', p_data: { kind: 'event', ev_kind: 'prod', mult: 20, hours: 2, at: inH } }), /invalid multiplier/, 'event multipliers stay 1–10');
  await expectError(rpc('admin_schedule', { p_pass: tok, p_action: 'add', p_data: { kind: 'news', title: 'Hi', hours: 24, at: new Date(Date.now() - 600e3).toISOString() } }), /time in the past/, 'a one-time plan cannot be in the past');
  await expectError(rpc('admin_schedule', { p_pass: tok, p_action: 'add', p_data: { kind: 'news', title: ' ', hours: 24, at: inH } }), /title missing/, 'an announcement needs a title');
  const evBefore = (await q('select count(*)::int n from kf_events')).rows[0].n;
  let sc = await rpc('admin_schedule', { p_pass: tok, p_action: 'add', p_data: { kind: 'event', title: 'Plan test', ev_kind: 'gold', mult: 3, hours: 2, at: inH } });
  check(sc.length === 1 && sc[0].active && (await q('select count(*)::int n from kf_events')).rows[0].n === evBefore, 'a planned event waits for its time');
  sc = await rpc('admin_schedule', { p_pass: tok, p_action: 'add', p_data: { kind: 'news', title: 'Weekly news', body: 'Every week', hours: 24, repeat: 'weekly', at: ago } });
  const wk = sc.find(x => x.repeat === 'weekly');
  check((await q("select count(*)::int n from kf_news where title = 'Weekly news'")).rows[0].n === 1, 'a weekly plan that is due starts at once');
  check(wk.active && new Date(wk.next_at) > Date.now() + 6.9 * 864e5, 'a weekly plan moves on by a week', wk.next_at);
  await q("update kf_schedule set next_at = now() - interval '1 second' where kind = 'event'");
  check((await job('kf_schedule_tick')) === 1, 'the minute tick starts what is due');
  check((await q("select count(*)::int n from kf_events where title = 'Plan test' and kind = 'gold' and mult = 3 and ends_at > now() + interval '119 minutes'")).rows[0].n === 1, 'the planned event runs with its multiplier and length');
  check((await job('kf_schedule_tick')) === 0, 'nothing starts twice');
  const lv = await rpc('kf_ping', { p_id: '56565656-5656-5656-5656-565656565656', p_baked: 1 });
  check(lv && 'cfg' in lv, 'the minute ping still works');
  sc = await rpc('admin_schedule', { p_pass: tok, p_action: 'toggle', p_data: { id: wk.id } });
  check(sc.find(x => x.id === wk.id).active === false, 'a weekly plan can be paused');
  sc = await rpc('admin_schedule', { p_pass: tok, p_action: 'delete', p_data: { id: wk.id } });
  check(!sc.some(x => x.id === wk.id), 'a plan can be deleted');
  check((await q("select count(*)::int n from kf_admin_log where action like 'schedule:%'")).rows[0].n >= 4, 'planning is written to the admin log');
  // off-site backups
  await expectError(rpc('backup_offsite', { p_key: 'nope' }), /forbidden/, 'off-site backup needs the key');
  await expectError(rpc('admin_offsite', { p_pass: mt, p_action: 'newkey' }), /wrong admin password/, 'only the owner makes the key');
  const ok1 = await rpc('admin_offsite', { p_pass: tok, p_action: 'newkey' });
  check(/^[0-9a-f]{48}$/.test(ok1.key) && ok1.on, 'the owner gets a new key once');
  check((await rpc('admin_offsite', { p_pass: tok, p_action: 'status' })).key === null, 'the key is never shown again');
  check(!(await q('select key_hash from kf_offsite')).rows[0].key_hash.includes(ok1.key), 'only a hash of the key is stored');
  const bk = await rpc('backup_offsite', { p_key: ok1.key });
  check(bk.id && bk.data && bk.data.kf_accounts && bk.counts, 'the key fetches the newest backup', Object.keys(bk));
  await expectError(rpc('backup_offsite', { p_key: ok1.key }), /too soon/, 'off-site copies are limited');
  await rpc('admin_offsite', { p_pass: tok, p_action: 'remove' });
  await q('update kf_offsite set last_export = null');
  await expectError(rpc('backup_offsite', { p_key: ok1.key }), /forbidden/, 'a removed key stops working');
  // cleanup and usage
  await q("delete from kf_jobs");
  await q("insert into kf_rate (kind, key, at) values ('t56', 'k', now() - interval '5 days'), ('t56', 'k', now())");
  await q("insert into kf_presence (id, baked, seen_at) values ('57575757-5757-5757-5757-575757575757', 1, now() - interval '400 days')");
  await q("insert into kf_admin_log (at, action, detail) values (now() - interval '200 days', 'old t56', '')");
  const cl = await job('kf_cleanup');
  check(cl.ran && cl.removed.limits >= 1 && cl.removed.players >= 1 && cl.removed.admin_log >= 1, 'the cleanup removes old data', cl);
  check((await q("select count(*)::int n from kf_rate where kind = 't56'")).rows[0].n === 1, 'the cleanup keeps recent data');
  check((await job('kf_cleanup')).ran === false, 'the cleanup runs at most every 6 hours');
  await expectError(rpc('admin_usage', { p_pass: mt }), /wrong admin password/, 'usage is for the owner only');
  const us = await rpc('admin_usage', { p_pass: tok, p_action: 'usage' });
  check(us.db_bytes > 0 && us.limit_bytes === 524288000 && us.tables.length > 0 && typeof us.mau === 'number' && us.cleanup && us.cleanup.at, 'the owner sees database size, players and the last cleanup', Object.keys(us));
  check((await rpc('admin_usage', { p_pass: tok, p_action: 'cleanup' })).cleanup.at, 'the owner can run the cleanup now');
  // the off-site copy opens with tools/decrypt-backup.js (same steps as the GitHub job)
  try {
    const { execFileSync } = require('child_process'), zlib = require('zlib');
    const { decrypt } = require('../tools/decrypt-backup.js'), keyO = 'ab'.repeat(24);
    const enc = execFileSync('openssl', ['enc', '-aes-256-cbc', '-pbkdf2', '-iter', '200000', '-md', 'sha256', '-salt', '-pass', 'env:KEY'], { input: zlib.gzipSync(JSON.stringify(bk)), env: { ...process.env, KEY: keyO } });
    check(JSON.parse(decrypt(enc, keyO)).id === bk.id, 'an encrypted off-site copy opens with the key');
    let wrong = ''; try { decrypt(enc, 'cd'.repeat(24)); } catch (e) { wrong = e.message; }
    check(/wrong key/.test(wrong), 'a wrong key cannot open it');
  } catch (e) { check(false, 'off-site decrypt test', e.message); }
  }
  {
  // Live dashboard and weekly report (v57)
  for (const t of ['kf_week_reports', 'kf_err_days'])
    await expectError(asAnon('select * from public.' + t + ' limit 1'), /permission denied/, 'players cannot read ' + t);
  await expectError(rpc('kf_week_data', {}), /permission denied/, 'players cannot call the report helper');
  const pidD = '58585858-5858-5858-5858-585858585858';
  await rpc('kf_ping', { p_id: pidD, p_baked: 5, p_lang: 'fr', p_dev: 'phone', p_src: 'app' });
  let dr = (await q("select lang, dev, src from kf_days where id = $1", [pidD])).rows[0];
  check(dr && dr.lang === 'fr' && dr.dev === 'phone' && dr.src === 'app', 'the minute ping notes language, device and source', dr);
  const pidE = '59595959-5959-5959-5959-595959595959';
  check('cfg' in (await rpc('kf_ping', { p_id: pidE, p_baked: 5 })), 'older games can still ping without the new fields');
  await rpc('kf_ping', { p_id: pidE, p_baked: 5, p_lang: 'english', p_dev: 'fridge', p_src: 'x' });
  dr = (await q("select lang, dev, src from kf_days where id = $1", [pidE])).rows[0];
  check(dr.lang === null && dr.dev === null && dr.src === null, 'unknown values are not stored', dr);
  await rpc('kf_ping', { p_id: pidE, p_baked: 5, p_lang: 'es', p_dev: 'desktop', p_src: 'web' });
  check((await q("select lang from kf_days where id = $1", [pidE])).rows[0].lang === 'es', 'a later ping fills in the day once');
  const errBefore = +((await q("select n from kf_err_days where day = (now() at time zone 'UTC')::date")).rows[0] || { n: 0 }).n;
  await rpc('kf_report_error', { p_msg: 'dash crash', p_src: 'd.js:1:1', p_ver: 57 }, '9.3.3.3');
  await rpc('kf_report_error', { p_msg: 'dash crash', p_src: 'd.js:1:1', p_ver: 57 }, '9.3.3.3');
  check(+(await q("select n from kf_err_days where day = (now() at time zone 'UTC')::date")).rows[0].n === errBefore + 2, 'crashes are counted per day');
  await expectError(rpc('admin_dash', { p_pass: mt }), /wrong admin password/, 'the dashboard is for the owner only');
  const dash = await rpc('admin_dash', { p_pass: tok, p_days: 30 });
  check(dash.days.length === 30 && dash.days[29].players >= 2 && dash.days[29].crashes >= 2 && typeof dash.online === 'number', 'the dashboard has 30 days of players and crashes', dash.days[29]);
  check(dash.langs.some(l => l.k === 'fr') && dash.devs.some(d => d.k === 'phone') && dash.srcs.some(x => x.k === 'app'), 'the dashboard shows languages, devices and sources');
  check((await rpc('admin_dash', { p_pass: tok, p_days: 7 })).days.length === 7, 'the dashboard can show 7 days');
  // weekly report
  await q("delete from kf_week_reports; delete from kf_push_queue where kind = 'week'");
  await rpc('admin_push', { p_pass: tok, p_action: 'subscribe', p_data: { sub: { endpoint: 'https://push.example.com/owner2', keys: { p256dh: 'x', auth: 'y' } }, lang: 'en' } });
  const wr = await job('kf_week_report');
  check(wr.made === true && /^\d{4}-W\d{2}$/.test(wr.week), 'the weekly report is made once a week', wr);
  check((await job('kf_week_report')).made === false, 'it is not made twice in the same week');
  const wp = (await q("select b_en, target from kf_push_queue where kind = 'week'")).rows;
  check(wp.length === 1 && wp[0].target === 'owner' && /players .* new accounts/.test(wp[0].b_en), 'the owner gets the weekly report as a push', wp);
  await expectError(rpc('admin_reports', { p_pass: mt, p_action: 'list' }), /wrong admin password/, 'reports are for the owner only');
  const reps = await rpc('admin_reports', { p_pass: tok, p_action: 'list' });
  check(reps.length === 1 && reps[0].data.this && 'players' in reps[0].data.this && reps[0].data.todo && 'db_pct' in reps[0].data.todo, 'the owner reads past weekly reports', reps[0] && Object.keys(reps[0].data));
  check((await rpc('admin_reports', { p_pass: tok, p_action: 'preview' })).data.last, 'the owner can preview the numbers right now');
  await rpc('admin_push', { p_pass: tok, p_action: 'unsubscribe', p_data: { endpoint: 'https://push.example.com/owner2' } });
  }
  {
  // Backend care (v58): closed jobs, indexes, fake-count limit, recovery codes, devices, live chat signal, health
  for (const f of ['kf_schedule_tick', 'kf_cleanup', 'kf_backup_tick', 'kf_week_report', 'kf_reminders', 'kf_health_check', 'kf_rt_ok'])
    await expectError(rpc(f, {}), /permission denied/, 'players cannot start the server job ' + f);
  await expectError(asAnon('select * from public.kf_schema'), /permission denied/, 'players cannot read kf_schema');
  check((await q("select to_regclass('public.lb_admin') t")).rows[0].t === null, 'the old leaderboard password table is gone');
  check((await q("select count(*)::int n from pg_indexes where schemaname = 'public' and indexname in ('kf_sessions_account','kf_wars_club_a_idx','kf_wars_club_b_idx','kf_gifts_from','kf_club_week_club','kf_presence_seen')")).rows[0].n === 6, 'the missing indexes are there');
  check((await q("select count(*)::int n from pg_indexes where indexname = 'kf_rate_lookup'")).rows[0].n === 0, 'no duplicate index on kf_rate');
  check((await q("select count(*)::int n from pg_constraint where contype = 'p' and conrelid in ('public.kf_rate'::regclass, 'public.kf_login_fails'::regclass, 'public.kf_admin_fails'::regclass)")).rows[0].n === 3, 'the log tables have primary keys');
  check((await q("select array_agg(part order by part) a from kf_schema")).rows[0].a.slice(0, 16).join() === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16', 'server parts 1–16 are listed');
  // made-up player ids
  const crypto = require('crypto');
  for (let i = 0; i < 30; i++) await rpc('kf_ping', { p_id: crypto.randomUUID(), p_baked: 1 }, '6.6.6.6');
  const fake = crypto.randomUUID();
  await rpc('kf_ping', { p_id: fake, p_baked: 1 }, '6.6.6.6');
  check((await q('select count(*)::int n from kf_presence where id = $1', [fake])).rows[0].n === 0, 'one device cannot add more than 30 new players an hour');
  check('cfg' in (await rpc('kf_ping', { p_id: crypto.randomUUID(), p_baked: 1 }, '6.6.6.7')), 'other devices still count');
  // recovery codes
  const rc = await rpc('acc_signup', { p_user: 'test_rec', p_pass: 'secret123' }, '6.2.2.2');
  check((await rpc('acc_recovery', { p_token: rc.token, p_action: 'status' })).on === false, 'a new account has no recovery code yet');
  const code = (await rpc('acc_recovery', { p_token: rc.token, p_action: 'new' })).code;
  check(/^[A-Z2-7]{16}$/.test(code) && (await rpc('acc_recovery', { p_token: rc.token, p_action: 'status' })).on === true, 'a player gets a 16-letter recovery code once');
  check((await rpc('acc_recovery', { p_token: rc.token, p_action: 'status' })).code === null, 'the code is never shown again');
  check((await rpc('acc_recover', { p_user: 'test_rec', p_code: 'AAAAAAAAAAAAAAAA', p_pass: 'newpass123' }, '6.2.2.3')).error === 'wrong username or code', 'a wrong code is refused');
  check((await rpc('acc_recover', { p_user: 'test_rec', p_code: code, p_pass: 'x' }, '6.2.2.3')).error === 'invalid password', 'the new password needs 6 characters');
  const pretty = code.toLowerCase().replace(/(.{4})(?!$)/g, '$1-');
  const rr = await rpc('acc_recover', { p_user: 'TEST_REC', p_code: pretty, p_pass: 'newpass123' }, '6.2.2.3');
  check(rr.token && rr.recovered && rr.username === 'test_rec', 'the code (with dashes, any case) sets a new password and signs in');
  await expectError(rpc('acc_me', { p_token: rc.token }), /not signed in/, 'recovering signs out every other device');
  check((await rpc('acc_login', { p_user: 'test_rec', p_pass: 'newpass123' }, '6.2.2.4')).token, 'the new password works');
  check((await rpc('acc_recover', { p_user: 'test_rec', p_code: code, p_pass: 'another123' }, '6.2.2.5')).error === 'wrong username or code', 'a recovery code works only once');
  for (let i = 0; i < 8; i++) await rpc('acc_recover', { p_user: 'test_rec', p_code: 'BBBBBBBBBBBBBBBB', p_pass: 'another123' }, '6.2.3.' + i);
  check((await rpc('acc_recover', { p_user: 'test_rec', p_code: 'BBBBBBBBBBBBBBBB', p_pass: 'another123' }, '6.2.4.1')).error === 'too many tries', 'guessing codes locks the name like wrong passwords');
  await q("delete from kf_login_fails where username = 'test_rec'");
  // devices
  const d1 = rr.token, d2 = (await rpc('acc_login', { p_user: 'test_rec', p_pass: 'newpass123' }, '6.2.5.1')).token;
  let dv = await rpc('acc_devices', { p_token: d1, p_action: 'name', p_data: { label: 'Chrome · Android <b>' } });
  check(dv.length >= 2 && dv[0].current && dv[0].label === 'Chrome · Android b', 'a player sees their devices and names this one (no HTML)', dv);
  const other = (await rpc('acc_devices', { p_token: d1, p_action: 'list' })).find(x => !x.current);
  dv = await rpc('acc_devices', { p_token: d1, p_action: 'remove', p_data: { id: dv[0].id } });
  check(dv.some(x => x.current), 'you cannot remove the device you are using');
  dv = await rpc('acc_devices', { p_token: d1, p_action: 'remove', p_data: { id: other.id } });
  check(!dv.some(x => x.id === other.id), 'a player signs out one other device');
  const stillOk = await rpc('acc_me', { p_token: d2 }).then(() => true, () => false), cnt = (await q("select count(*)::int n from kf_sessions s join kf_accounts a on a.id = s.account where a.username = 'test_rec'")).rows[0].n;
  check(cnt === dv.length && (dv.length === 1 ? !stillOk : true), 'the removed device is signed out', { cnt, len: dv.length });
  // live chat signal
  const rt0 = await rpc('club_rt', { p_token: c2.token });
  check(/^kf-club-[0-9a-f]{24}$/.test(rt0.topic) && rt0.on === false, 'club members get a secret chat topic (off without Realtime)', rt0);
  check((await rpc('club_rt', { p_token: d1 })).topic === null, 'players outside a club get no topic');
  await q("create schema if not exists realtime; create table if not exists public.t_rt (topic text, event text, payload jsonb, at timestamptz default now()); create or replace function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void language sql as $f$ insert into public.t_rt (topic, event, payload) values (topic, event, payload) $f$; delete from public.t_rt");
  check((await rpc('club_rt', { p_token: c2.token })).on === true, 'with Realtime the live chat is on');
  await rpc('club_post', { p_token: c2.token, p_body: 'live hello' });
  const sig = (await q('select topic, event, payload from public.t_rt')).rows;
  check(sig.length === 1 && sig[0].topic === rt0.topic && sig[0].event === 'chat' && !JSON.stringify(sig[0].payload).includes('hello'), 'a new message sends only a signal, never the text', sig);
  // health checks
  await q("delete from kf_jobs where k like 'alert:%' or k = 'health'; delete from kf_push_queue");
  await rpc('admin_push', { p_pass: tok, p_action: 'subscribe', p_data: { sub: { endpoint: 'https://push.example.com/owner3', keys: { p256dh: 'x', auth: 'y' } }, lang: 'en' } });
  await q("insert into kf_push_queue (t_de, t_en, created_at) values ('x', 'x', now() - interval '30 minutes')");
  const hc = await job('kf_health_check');
  check(hc.push_stuck === 1 && 'db_pct' in hc && 'crashes_today' in hc, 'the health check finds stuck push messages', hc);
  check((await q("select count(*)::int n from kf_push_queue where kind = 'health_push' and target = 'owner'")).rows[0].n === 1, 'the owner gets a health alarm');
  await q("delete from kf_push_queue where kind = 'health_push'");
  await job('kf_health_check');
  check((await q("select count(*)::int n from kf_push_queue where kind = 'health_push'")).rows[0].n === 0, 'the same alarm comes at most every 6 hours');
  await expectError(rpc('admin_health', { p_pass: mt }), /wrong admin password/, 'server health is for the owner only');
  const ah = await rpc('admin_health', { p_pass: tok });
  check(ah.schema.length >= 16 && ah.cron === false && ah.realtime === true && ah.checks && ah.checks.r.push_stuck === 1 && ah.alerts.some(a => a.k === 'push'), 'the owner sees server parts, jobs, checks and alarms', Object.keys(ah));
  await q("delete from kf_push_queue");
  await rpc('admin_push', { p_pass: tok, p_action: 'unsubscribe', p_data: { endpoint: 'https://push.example.com/owner3' } });
  }
  {
  // Category leaderboards and profile style (v61)
  const crypto = require('crypto');
  await expectError(asAnon('select * from public.lb_stats limit 1'), /permission denied/, 'players cannot read lb_stats');
  const u1 = crypto.randomUUID(), u2 = crypto.randomUUID(), u3 = crypto.randomUUID();
  await expectError(rpc('submit_stats', { p_id: u1, p_clicks: 5, p_gold: 1, p_asc: 0 }), /not on the leaderboard/, 'category numbers need a leaderboard spot');
  await q("insert into kf_accounts (username, pass_hash, lb_id) values ('Board_One', 'x', $1), ('Board_Two', 'x', $2), ('Board_Three', 'x', $3)", [u1, u2, u3]);
  for (const u of [u1, u2, u3]) await rpc('submit_score', { p_id: u, p_name: 'ignored', p_score: 1000 });
  let r1 = await rpc('submit_stats', { p_id: u1, p_clicks: 5e8, p_gold: 5e6, p_asc: 3 });
  check(r1.clicks === 1e8 && r1.gold === 1e6 && r1.asc === 3, 'the first numbers are capped to sensible maximums', r1);
  r1 = await rpc('submit_stats', { p_id: u1, p_clicks: 1e9, p_gold: 2e6, p_asc: 500 });
  check(r1.clicks < 1e8 + 2000 && r1.gold < 1e6 + 10 && r1.asc < 6, 'numbers can only grow at a human speed', r1);
  await q("update lb_stats set updated_at = now() - interval '1 hour' where id = $1", [u1]);
  r1 = await rpc('submit_stats', { p_id: u1, p_clicks: 1e8 + 50000, p_gold: 1e6 + 100, p_asc: 20 });
  check(r1.clicks === 1e8 + 50000 && r1.gold === 1e6 + 100 && r1.asc === 20, 'honest growth over time counts in full', r1);
  r1 = await rpc('submit_stats', { p_id: u1, p_clicks: 10, p_gold: 1, p_asc: 1 });
  check(r1.clicks === 1e8 + 50000, 'numbers never go down');
  await rpc('submit_stats', { p_id: u2, p_clicks: 500, p_gold: 40, p_asc: 1, p_fast: 3 });
  await rpc('submit_stats', { p_id: u3, p_clicks: 800, p_gold: 2, p_asc: 0, p_fast: 95 });
  let r2 = await rpc('submit_stats', { p_id: u2, p_clicks: 500, p_gold: 40, p_asc: 1, p_fast: 200 });
  check(r2.fast === 10, 'the fastest run counts from 10 seconds and only gets better', r2);
  await rpc('submit_stats', { p_id: u1, p_clicks: 1e8 + 50000, p_gold: 1e6 + 100, p_asc: 20, p_fast: 60 });
  const bc = await rpc('lb_board', { p_kind: 'clicks', p_id: u3 });
  check(bc.top[0].name === 'Board_One' && bc.top[1].name === 'Board_Three' && bc.me.rank === 2 && bc.me.v === 800, 'the clicks board is sorted and shows your place', bc);
  const bf = await rpc('lb_board', { p_kind: 'fast', p_id: u1 });
  check(bf.top.map(x => x.name).join() === 'Board_Two,Board_One,Board_Three' && bf.me.rank === 2 && bf.me.v === 60, 'the fastest-to-a-billion board is sorted from fastest', bf);
  check((await rpc('lb_board', { p_kind: 'asc', p_id: null })).top[0].v === 20, 'the ascension board works');
  await q("update lb_stats set fast_wk = '2000-W01' where id = $1", [u2]);
  check(!(await rpc('lb_board', { p_kind: 'fast' })).top.some(x => x.name === 'Board_Two'), 'the fastest board only shows this week');
  await expectError(rpc('lb_board', { p_kind: 'cookies' }), /unknown board/, 'unknown boards are refused');
  await q('insert into lb_banned (id, name) values ($1, $2)', [u3, 'Board_Three']);
  check(!(await rpc('lb_board', { p_kind: 'clicks' })).top.some(x => x.name === 'Board_Three'), 'banned spots are not shown');
  await expectError(rpc('submit_stats', { p_id: u3, p_clicks: 900, p_gold: 2, p_asc: 0 }), /banned/, 'banned spots cannot send numbers');
  await q('delete from leaderboard where id = $1', [u2]);
  check((await q('select count(*)::int n from lb_stats where id = $1', [u2])).rows[0].n === 0, 'leaving the leaderboard removes the numbers too');
  // profile style
  await expectError(rpc('acc_style', { p_token: c2.token, p_data: { motto: 'du arschloch' } }), /blocked word/, 'mottos go through the word filter');
  await expectError(rpc('acc_style', { p_token: c2.token, p_data: { motto: 'x'.repeat(61) } }), /invalid motto/, 'mottos are at most 60 characters');
  const sty = await rpc('acc_style', { p_token: c2.token, p_data: { av: '🦊', col: 'teal', motto: 'Baking since breakfast', show: ['clk100', 'all1000', 'clk100', 'bad id!', 'gold1', 'own0'] } });
  check(sty.av === '🦊' && sty.col === 'teal' && sty.motto === 'Baking since breakfast' && JSON.stringify(sty.show) === '["clk100","all1000","gold1"]', 'a player sets avatar, color, motto and up to 3 showcase achievements', sty);
  check(!('av' in (await rpc('acc_style', { p_token: c2.token, p_data: { av: '<b>', col: 'neon' } }))), 'only known avatars and colors are stored');
  await rpc('acc_style', { p_token: c2.token, p_data: { av: '🦊', col: 'teal', motto: 'Baking since breakfast', show: ['clk100'] } });
  await q('update kf_accounts set lb_id = null where lb_id = $1', [u1]);
  await rpc('acc_lb_link', { p_token: c2.token, p_lb: u1 }).catch(() => null);
  const pr = await rpc('player_profile', { p_name: 'test_delta' });
  check(pr.style.av === '🦊' && pr.style.motto === 'Baking since breakfast', 'profiles show the style', pr.style);
  check(pr.ranks && pr.ranks.clicks === 1 && pr.ranks.asc === 1 && pr.ranks.fast >= 1 && pr.ranks.fast_s === 60, 'profiles show the place in every board', pr.ranks);
  check((await q("select count(*)::int n from kf_schema where part = 17")).rows[0].n === 1, 'server part 17 is listed');
  }
  {
  // One name, warnings with strikes, player history, player card, to-do list (v64)
  const crypto = require('crypto');
  for (const t of ['kf_name_hist', 'kf_player_log']) await expectError(asAnon('select * from public.' + t + ' limit 1'), /permission denied/, 'players cannot read ' + t);
  for (const [f, b] of [['kf_name_apply', { p_acc: '00000000-0000-0000-0000-000000000000', p_new: 'x' }], ['kf_name_free', { p_name: 'x', p_acc: null }], ['kf_strikes', { p_acc: '00000000-0000-0000-0000-000000000000' }]])
    await expectError(rpc(f, b), /permission denied|not exist|Could not find/, 'players cannot call ' + f);
  const n1 = await rpc('acc_signup', { p_user: 'name_old', p_pass: 'secret123' }, '6.4.0.1');
  const s1 = crypto.randomUUID();
  await rpc('submit_score', { p_id: s1, p_name: 'Fancy Bakery', p_score: 500, p_token: n1.token });
  check((await q('select lb_id from kf_accounts where username = $1', ['name_old'])).rows[0].lb_id === s1, 'the first score with a token links the spot to the account');
  const ri = await rpc('acc_rename', { p_token: n1.token, p_new: 'name_new' }, '6.4.0.1');
  check(ri.username === 'name_new' && ri.old[0] === 'name_old' && new Date(ri.next_at) - Date.now() > 29 * 86400e3, 'a player changes the username and waits 30 days for the next change', ri);
  check((await q('select name from leaderboard where id = $1', [s1])).rows[0].name === 'name_new', 'the leaderboard shows the new name');
  await expectError(rpc('acc_rename', { p_token: n1.token, p_new: 'name_third' }, '6.4.0.1'), /rename wait/, 'only one username change every 30 days');
  check((await rpc('acc_rename', { p_token: n1.token, p_new: 'Name_New' }, '6.4.0.1')).username === 'Name_New', 'changing only upper and lower case is always allowed');
  await expectError(rpc('acc_rename', { p_token: n1.token, p_new: 'a b' }, '6.4.0.1'), /invalid username/, 'usernames keep their rules');
  await expectError(rpc('acc_rename', { p_token: 'not-a-session', p_new: 'zz_zz' }), /session|token|sign/i, 'renaming needs a session');
  const n2 = await rpc('acc_signup', { p_user: 'name_other', p_pass: 'secret123' }, '6.4.0.3');
  await q("update kf_accounts set renamed_at = null where username = 'name_other'");
  await expectError(rpc('acc_rename', { p_token: n2.token, p_new: 'name_old' }, '6.4.0.3'), /username taken/, 'a given-up name stays reserved for 90 days');
  const lg = await rpc('acc_login', { p_user: 'name_old', p_pass: 'secret123' }, '6.4.0.1');
  check(lg.token && lg.username === 'Name_New', 'signing in with the old name still works and gives the new name', lg);
  check((await rpc('player_profile', { p_name: 'name_old' })).username === 'Name_New', 'old names still open the profile');
  // warnings and strikes
  await expectError(rpc('admin_players', { p_pass: 'nope', p_action: 'find', p_data: { q: 'name' } }), /wrong admin password/, 'the player tools are for the owner');
  const fd = await rpc('admin_players', { p_pass: tok, p_action: 'find', p_data: { q: 'name_old' } });
  check(fd.length === 1 && fd[0].username === 'Name_New' && fd[0].old.includes('name_old'), 'the admin finds a player by an old name', fd);
  await expectError(rpc('admin_players', { p_pass: tok, p_action: 'warn', p_data: { user: 'Name_New', reason: '' } }), /reason needed/, 'a warning needs a reason');
  let w = await rpc('admin_players', { p_pass: tok, p_action: 'warn', p_data: { user: 'Name_New', reason: 'Rude chat' } });
  check(w.strike === 1 && w.hours === null && (await q("select count(*)::int n from kf_bans b join kf_accounts a on a.id = b.account where a.username = 'Name_New'")).rows[0].n === 0, 'the first strike is only a warning', w);
  const nt = await rpc('acc_notices', { p_token: n1.token });
  check(nt.notices.length === 1 && nt.notices[0].kind === 'warn' && nt.notices[0].reason === 'Rude chat' && nt.notices[0].strike === 1, 'the player sees the warning', nt);
  check((await rpc('acc_notices', { p_token: n1.token })).notices.length === 0, 'each warning is shown only once');
  w = await rpc('admin_players', { p_pass: tok, p_action: 'warn', p_data: { user: 'Name_New', reason: 'Spam' } });
  const b2 = (await q("select until from kf_bans b join kf_accounts a on a.id = b.account where a.username = 'Name_New'")).rows[0];
  check(w.strike === 2 && w.hours === 24 && b2 && Math.abs(new Date(b2.until) - Date.now() - 24 * 3600e3) < 120e3, 'the second strike bans for 24 hours', w);
  w = await rpc('admin_players', { p_pass: tok, p_action: 'warn', p_data: { user: 'name_old', reason: 'Spam again' } });
  check(w.strike === 3 && w.hours === 168, 'the third strike bans for 7 days', w);
  w = await rpc('admin_players', { p_pass: tok, p_action: 'warn', p_data: { user: 'Name_New', reason: 'Cheating' } });
  const b4 = (await q("select until from kf_bans b join kf_accounts a on a.id = b.account where a.username = 'Name_New'")).rows[0];
  check(w.strike === 4 && w.hours === 0 && b4 && b4.until === null, 'the fourth strike bans forever', w);
  const lgk = (await q("select string_agg(l.kind, ',' order by l.id) k from kf_player_log l join kf_accounts a on a.id = l.account where a.username = 'Name_New'")).rows[0].k;
  check(lgk === 'warn,warn,ban,warn,ban,warn,ban', 'the history lists every warning and ban, without fake unbans between bans', lgk);
  await rpc('admin_bans', { p_pass: tok, p_action: 'unban', p_data: { user: 'Name_New' } });
  await rpc('admin_mod', { p_pass: tok, p_action: 'mute', p_data: { user: 'Name_New', hours: 2 } });
  const card = await rpc('admin_players', { p_pass: tok, p_action: 'card', p_data: { user: 'name_old' } });
  check(card.account.username === 'Name_New' && card.names.some(x => x.name === 'name_old') && card.strikes === 4 && card.lb && card.lb.score === 500
    && card.log[0].kind === 'mute' && card.log[1].kind === 'unban' && card.mute && !card.ban, 'the player card shows names, strikes, leaderboard and the full history', { names: card.names, log: card.log.map(x => x.kind) });
  // forced rename
  const fr = await rpc('admin_players', { p_pass: tok, p_action: 'rename', p_data: { user: 'name_other', reason: 'Bad name' } });
  check(/^baker_\d{5}$/.test(fr.username) && fr.old === 'name_other', 'the admin can force a new name', fr);
  const nt2 = await rpc('acc_notices', { p_token: n2.token });
  check(nt2.username === fr.username && nt2.notices[0].kind === 'rename' && nt2.notices[0].reason === 'Bad name', 'the player is told about the new name', nt2);
  check((await rpc('acc_rename', { p_token: n2.token, p_new: 'nice_name' }, '6.4.0.3')).username === 'nice_name', 'after a forced rename the player may choose a name right away');
  await expectError(rpc('acc_rename', { p_token: n2.token, p_new: 'nice_name2' }, '6.4.0.3'), /rename wait/, 'then the 30-day wait applies again');
  // to-do list
  await expectError(rpc('admin_todo', { p_pass: 'nope' }), /wrong admin password/, 'the to-do list is for the owner');
  await q("insert into kf_reports (reported, body, reporter_name, status) values ('Name_New', 'bad words', 'ci', 'open')");
  const td = await rpc('admin_todo', { p_pass: tok });
  check(td.reports.n >= 1 && td.reports.top[0].who === 'Name_New' && 'appeals' in td && 'flags' in td && 'feedback' in td && 'crashes' in td && Array.isArray(td.alarms), 'the to-do list collects reports, appeals, suspicious saves, feedback, crashes and alarms', Object.keys(td));
  check((await rpc('admin_players', { p_pass: tok, p_action: 'card', p_data: { user: 'Name_New' } })).reports.open >= 1, 'the card counts reports under every name');
  await q("delete from kf_accounts where username = 'Name_New'");
  check((await q("select count(*)::int n from kf_accounts where username = 'Name_New'")).rows[0].n === 0, 'an account with a mute and history can still be deleted');
  check((await q("select count(*)::int n from kf_schema where part = 18")).rows[0].n === 1, 'server part 18 is listed');
  }
  {
  // Fair play: server time, score limit by play time, 20 clicks a second (v67)
  const crypto = require('crypto');
  const srv = await rpc('kf_now', {}), db = (await q('select extract(epoch from now()) * 1000 as t')).rows[0].t;
  check(Math.abs(srv - db) < 5000, 'the game can ask the server for the time', { srv, db });
  const f1 = await rpc('acc_signup', { p_user: 'fair_new', p_pass: 'secret123' }, '6.7.0.1');
  const fs = crypto.randomUUID();
  await rpc('submit_score', { p_id: fs, p_name: 'x', p_score: 1e14, p_token: f1.token });
  check((await q('select score from leaderboard where id = $1', [fs])).rows[0].score <= 1.0001e9, 'a brand-new spot starts at most at 1 billion');
  await q("update leaderboard set created_at = now() - interval '2 hours', updated_at = now() - interval '1 hour' where id = $1", [fs]);
  await rpc('submit_score', { p_id: fs, p_name: 'x', p_score: 1e14 });
  const sc2 = (await q('select score from leaderboard where id = $1', [fs])).rows[0].score;
  check(sc2 > 0.9e12 && sc2 < 1.1e12, 'after 2 hours a spot can be at most about 1 trillion', sc2);
  await q("update leaderboard set created_at = now() - interval '30 days', updated_at = now() - interval '1 hour' where id = $1", [fs]);
  await rpc('submit_score', { p_id: fs, p_name: 'x', p_score: 1e14 });
  check((await q('select score from leaderboard where id = $1', [fs])).rows[0].score === 1e14, 'older spots are not held back by their age');
  await rpc('submit_stats', { p_id: fs, p_clicks: 100, p_gold: 0, p_asc: 0 });
  await q("update lb_stats set updated_at = now() - interval '10 seconds' where id = $1", [fs]);
  const cs = await rpc('submit_stats', { p_id: fs, p_clicks: 100000, p_gold: 0, p_asc: 0 });
  check(cs.clicks <= 100 + 20 * 11 + 200 && cs.clicks > 300, 'the clicks board allows at most 20 clicks a second', cs);
  check((await q("select count(*)::int n from kf_schema where part = 19")).rows[0].n === 1, 'server part 19 is listed');
  }
};

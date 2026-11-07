// Database tests: every rule the server enforces, called the way the game calls it (as the "anon" role).
const { pool, rpc, asAnon, check, expectError, ADMIN_PASS } = require('./lib');
const q = (sql, a) => pool.query(sql, a);
const SAVE = 'x'.repeat(40);

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
  await rpc('submit_score', { p_id: L1, p_name: 'Test Bakery', p_score: 1e9 });
  await expectError(rpc('submit_score', { p_id: L2, p_name: 'test bakery', p_score: 5 }), /name taken/, 'leaderboard names are unique');
  await q("update leaderboard set updated_at = now() - interval '5 minutes' where id = $1", [L1]);
  await expectError(rpc('submit_score', { p_id: L1, p_name: 'Test Bakery', p_score: 1e12 }), /grew too fast/, 'scores cannot jump too fast');
  await expectError(rpc('submit_score', { p_id: L2, p_name: 'Hitler', p_score: 5 }), /not allowed/, 'rude leaderboard names are blocked');
  const link = await rpc('acc_lb_link', { p_token: a.token, p_lb: L1 });
  check(link.lb_id === L1 && link.score === 1e9, 'leaderboard spot is linked to the account');
  check((await rpc('acc_lb_link', { p_token: a.token, p_lb: L2 })).lb_id === L1, 'a second device gets the same spot');
  check((await rpc('acc_lb_link', { p_token: b.token, p_lb: L1 })).lb_id === null, 'another account cannot take a linked spot');

  // Backups
  check((await rpc('kf_backup_tick', {})).made === true, 'weekly backup is made when due');
  check((await rpc('kf_backup_tick', {})).made === false, 'and only once a week');
  const list = await rpc('admin_backup', { p_pass: tok, p_action: 'make' });
  check(list.backups.length === 2, 'admin can back up now', list.backups.length);
  const bid = list.backups[0].id;
  const full = await rpc('admin_backup', { p_pass: tok, p_action: 'get', p_data: { id: bid } });
  check(full.data.kf_accounts.length >= 2 && !full.data.kf_sessions, 'backup holds accounts but no sessions');
  await rpc('acc_delete', { p_token: a.token, p_pass: 'secret456' });
  check((await rpc('admin_backup', { p_pass: tok, p_action: 'restore_account', p_data: { id: bid, user: 'test_alpha' } })).restored === 1, 'restore a deleted account');
  check(!!(await rpc('acc_login', { p_user: 'test_alpha', p_pass: 'secret456' })).token, 'restored account signs in with its old password');
  await expectError(rpc('admin_backup', { p_pass: 'nope', p_action: 'list' }), /wrong admin password/, 'backups need an admin session');
};

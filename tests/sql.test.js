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

  // Profiles, friends, invites, club wars (v48)
  const c1 = await rpc('acc_signup', { p_user: 'test_gamma', p_pass: 'secret123' }, '3.3.3.3');
  await rpc('acc_profile', { p_token: c1.token, p_data: { ach: 12, asc: 2, title: 'Baker <b>', bakery: 'Gamma Bakes', evil: 'x' } });
  const pr = await rpc('player_profile', { p_name: 'TEST_GAMMA' });
  check(pr.username === 'test_gamma' && pr.stats.ach === 12 && !pr.stats.evil && !pr.stats.title, 'profile shows only safe public numbers', pr.stats);
  check((await rpc('player_profile', { p_name: 'Test Bakery' })).rank === 1, 'profile works by leaderboard name');
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
  check((await rpc('kf_reminders', {})).sent >= 1, 'players away for 3+ days get a comeback reminder');
  check((await rpc('kf_reminders', {})).sent === 0, 'only one reminder per absence');
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
};

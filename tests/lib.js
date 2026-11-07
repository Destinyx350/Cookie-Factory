// Shared helpers for the Cookie Factory tests: a PostgREST stand-in backed by the test database,
// a tiny static web server, browser helpers and a small assertion collector.
const { Pool } = require('pg');
const http = require('http'), fs = require('fs'), path = require('path');

const pool = new Pool({
  host: process.env.PGHOST || '/var/tmp', port: +(process.env.PGPORT || 5433), user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || undefined, database: process.env.PGDATABASE || 'kfci', max: 6
});
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'ci-test-admin-pass';
const LB = 'https://nmmlemtljjvfurlrvuvm.supabase.co';
const ROOT = path.join(__dirname, '..');

// Runs SQL as the "anon" role like Supabase does, with request headers (the player's address).
async function asAnon(sql, args, ip) {
  const c = await pool.connect();
  try {
    await c.query('begin'); await c.query('set local role anon');
    await c.query("select set_config('request.headers', $1, true)", [JSON.stringify({ 'x-forwarded-for': ip || '127.0.0.1' })]);
    const r = await c.query(sql, args); await c.query('commit'); return r;
  } catch (e) { await c.query('rollback').catch(() => {}); throw e; } finally { c.release(); }
}
// Calls a database function as a player. Returns its value or throws with the database's message.
async function rpc(fn, body, ip) {
  const keys = Object.keys(body || {});
  const r = await asAnon('select ' + fn + '(' + keys.map((k, i) => k + ' => $' + (i + 1)).join(',') + ') as v', keys.map(k => body[k]), ip);
  return r.rows[0].v;
}
// Playwright route handler that answers the game's Supabase requests from the test database.
async function handle(route) {
  const req = route.request(), u = new URL(req.url()), p = u.pathname.replace('/rest/v1/', '');
  const send = (st, body) => route.fulfill({ status: st, contentType: 'application/json', body: body === undefined ? '' : JSON.stringify(body) });
  const ip = req.headers()['x-test-ip'] || '127.0.0.1';
  try {
    if (p.startsWith('rpc/')) {
      const fn = p.slice(4); if (!/^[a-z0-9_]+$/.test(fn)) return send(400, { message: 'bad fn' });
      const exists = (await pool.query("select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname = $1", [fn])).rowCount;
      if (!exists) return send(404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' });
      const v = await rpc(fn, JSON.parse(req.postData() || '{}'), ip);
      return v === null || v === '' ? send(204) : send(200, v);
    }
    if (!/^[a-z_]+$/.test(p)) return send(400, {});
    const sel = u.searchParams.get('select') || '*'; if (!/^[a-z_,*]+$/.test(sel)) return send(400, {});
    const where = [], args = [];
    for (const [k, v] of u.searchParams) { if (['select', 'order', 'limit'].includes(k)) continue; const m = /^eq\.(.*)$/.exec(v); if (m && /^[a-z_]+$/.test(k)) { args.push(m[1]); where.push(k + ' = $' + args.length); } }
    const order = (u.searchParams.get('order') || '').split(',').filter(Boolean).map(o => { const [c, d] = o.split('.'); return /^[a-z_]+$/.test(c) ? c + (d === 'desc' ? ' desc' : ' asc') : null; }).filter(Boolean);
    const lim = Math.min(1000, +u.searchParams.get('limit') || 1000);
    const r = await asAnon('select ' + sel + ' from public.' + p + (where.length ? ' where ' + where.join(' and ') : '') + (order.length ? ' order by ' + order.join(',') : '') + ' limit ' + lim, args, ip);
    return send(200, r.rows);
  } catch (e) { return send(/permission denied/.test(e.message) ? 401 : 400, { code: e.code, message: e.message }); }
}
// Serves the game folder so the browser loads the real index.html.
function serve(port) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
  const srv = http.createServer((q, s) => {
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html';
    const full = path.join(ROOT, path.normalize(f));
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'Content-Type': types[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(full).pipe(s);
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}
// Assertions: collect failures, keep running, report at the end.
const results = [];
function check(ok, name, detail) { results.push({ ok: !!ok, name, detail }); console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok || detail === undefined ? '' : ' → ' + JSON.stringify(detail))); }
async function expectError(promise, re, name) {
  try { const v = await promise; check(false, name, { expected: String(re), got: v }); }
  catch (e) { check(re.test(e.message), name, e.message); }
}
module.exports = { pool, rpc, asAnon, handle, serve, check, expectError, results, ADMIN_PASS, LB, ROOT };

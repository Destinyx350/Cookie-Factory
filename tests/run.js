// Runs all Cookie Factory tests. Exit code 1 if anything failed.
// Needs the test database from tests/setup-db.sh (see tests/README.md).
const { serve, results, pool } = require('./lib');
(async () => {
  const port = +(process.env.TEST_PORT || 8770);
  const srv = await serve(port);
  const only = process.argv[2];
  try {
    if (!only || only === 'sql') await require('./sql.test')();
    if (!only || only === 'browser') await require('./browser.test')('http://localhost:' + port + '/');
  } catch (e) { results.push({ ok: false, name: 'test run crashed', detail: e.stack }); console.error(e); }
  srv.close(); await pool.end();
  const bad = results.filter(r => !r.ok);
  console.log('\n' + (results.length - bad.length) + ' passed, ' + bad.length + ' failed');
  process.exit(bad.length ? 1 : 0);
})();

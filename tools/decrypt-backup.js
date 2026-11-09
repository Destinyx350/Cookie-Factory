#!/usr/bin/env node
// Opens an off-site backup made by .github/workflows/offsite-backup.yml.
//
//   1. Download the artifact from GitHub (Actions → Off-site backup → a run → Artifacts) and unzip it.
//   2. KF_BACKUP_KEY=<your key> node tools/decrypt-backup.js kf-backup-YYYY-MM-DD.json.gz.enc
//      (without the variable it asks for the key)
//
// Writes kf-backup-YYYY-MM-DD.json next to it: {id, at, kind, counts, data: {table: rows…}}.
// The format is OpenSSL's "Salted__" (aes-256-cbc, PBKDF2-SHA256, 200000 rounds), so this works too:
//   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -md sha256 -in <file> -pass env:KF_BACKUP_KEY | gunzip > backup.json
// How to put data back: docs/LEADERBOARD.md ("Off-site backups").
const fs = require('fs'), crypto = require('crypto'), zlib = require('zlib'), readline = require('readline');

function decrypt(buf, pass) {
  if (buf.subarray(0, 8).toString('latin1') !== 'Salted__') throw new Error('not an encrypted backup (no "Salted__" header)');
  const salt = buf.subarray(8, 16), km = crypto.pbkdf2Sync(pass, salt, 200000, 48, 'sha256');
  const d = crypto.createDecipheriv('aes-256-cbc', km.subarray(0, 32), km.subarray(32, 48));
  try { return zlib.gunzipSync(Buffer.concat([d.update(buf.subarray(16)), d.final()])); }
  catch (e) { throw new Error('wrong key (or the file is damaged)'); }
}
module.exports = { decrypt };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error('Usage: KF_BACKUP_KEY=<key> node tools/decrypt-backup.js <file.json.gz.enc>'); process.exit(2); }
  const run = key => {
    try {
      const json = decrypt(fs.readFileSync(file), key.trim()), out = file.replace(/(\.json)?\.gz\.enc$|\.enc$/, '') + '.json';
      const b = JSON.parse(json);
      fs.writeFileSync(out, json, { mode: 0o600 });
      console.log('Backup ' + b.id + ' from ' + b.at + ' (' + b.kind + ') → ' + out);
      if (b.counts) console.log(Object.entries(b.counts).map(([k, v]) => '  ' + k + ': ' + v).join('\n'));
    } catch (e) { console.error('Could not open it: ' + e.message); process.exit(1); }
  };
  if (process.env.KF_BACKUP_KEY) run(process.env.KF_BACKUP_KEY);
  else { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question('Key: ', k => { rl.close(); run(k); }); }
}

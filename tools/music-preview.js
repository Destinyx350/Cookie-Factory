#!/usr/bin/env node
// Renders listenable previews of the in-game music, exactly as the game plays it.
//
//   node tools/music-preview.js                 every track, 45 s each → dist/music/<track>.wav (+ .mp3 if ffmpeg exists)
//   node tools/music-preview.js bake 60         one track, 60 s
//
// It takes the music engine from src/js/13-audio-engine-…js (between /*MUSIC-START*/ and /*MUSIC-END*/), runs it
// in Chromium with an OfflineAudioContext and prints peak and loudness, so you can check levels without listening.
// Needs the test tools (cd tests && npm install). Set PW_CHROMIUM if Playwright can't find its browser.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tests/node_modules/playwright'));
const src = fs.readFileSync(path.join(ROOT, 'src/js', fs.readdirSync(path.join(ROOT, 'src/js')).find(f => f.startsWith('13-'))), 'utf8');
const a = src.indexOf('/*MUSIC-START*/'), b = src.indexOf('/*MUSIC-END*/');
if (a < 0 || b < 0) throw new Error('music markers not found in src/js/13-…');
const engine = 'const mHz=m=>440*Math.pow(2,(m-69)/12);\n' + src.slice(a, b);
const only = process.argv[2], secs = +(process.argv[3] || 45), out = path.join(ROOT, 'dist/music');
fs.mkdirSync(out, { recursive: true });
let ffmpeg = true; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }
(async () => {
  const br = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const p = await br.newPage();
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ content: engine + '\nwindow.__m={TRK,mxGraph,mxPlayer};' });
  const ids = only ? [only] : await p.evaluate(() => Object.keys(window.__m.TRK));
  for (const id of ids) {
    const r = await p.evaluate(async ({ id, secs }) => {
      const { mxGraph, mxPlayer } = window.__m, sr = 44100, C = new OfflineAudioContext(2, sr * secs, sr);
      const o = C.createGain(); o.gain.value = .9; const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4;
      o.connect(comp); comp.connect(C.destination);
      const P = mxPlayer(mxGraph(C, o)); P.start(id, .05); P.I = .75; while (P.t < secs - .3) P.run(secs - .2);
      const buf = await C.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
      let pk = 0, ss = 0; for (let i = 0; i < n; i++) { pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); ss += (L[i] * L[i] + R[i] * R[i]) / 2; }
      const wav = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, s) => { for (let i = 0; i < s.length; i++) wav.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); wav.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 2, true);
      wav.setUint32(24, sr, true); wav.setUint32(28, sr * 4, true); wav.setUint16(32, 4, true); wav.setUint16(34, 16, true); w(36, 'data'); wav.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) { wav.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); wav.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
      let s = ''; const u = new Uint8Array(wav.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
      return { pk, rms: Math.sqrt(ss / n), b64: btoa(s) };
    }, { id, secs });
    const f = path.join(out, id + '.wav'); fs.writeFileSync(f, Buffer.from(r.b64, 'base64'));
    if (ffmpeg) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', f, '-codec:a', 'libmp3lame', '-b:a', '128k', f.replace(/\.wav$/, '.mp3')]);
    console.log(id.padEnd(8) + ' peak ' + r.pk.toFixed(2) + '  loudness ' + (20 * Math.log10(r.rms)).toFixed(1) + ' dB' + (r.pk > .98 ? '  ← clipping!' : ''));
  }
  await br.close();
  console.log('Written to ' + path.relative(ROOT, out) + '/');
})().catch(e => { console.error(e); process.exit(1); });

// Keksfabrik / Cookie Factory push sender (Supabase Edge Function "kf-push").
// The database wakes it (pg_net) whenever a notification is queued. It checks the shared secret, takes the waiting
// notifications, sends them with Web Push and removes devices that no longer exist.
// Nothing to configure: it reads its settings from the locked table kf_push_cfg with Supabase's built-in service key,
// and on its first run it creates the push key pair and stores it there.
// Deploy with "Verify JWT" turned off: the database calls it with the shared secret instead.
import webpush from "npm:web-push@3.6.7";

const SB = Deno.env.get("SUPABASE_URL") ?? "";
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GAME = "https://destinyx350.github.io/Cookie-Factory/";
const H = { apikey: SRK, Authorization: "Bearer " + SRK, "Content-Type": "application/json" };

type Cfg = { secret: string; vapid_pub: string | null; vapid_priv: string | null };
type Sub = { endpoint: string; p256dh: string; auth: string; lang: string };
type Item = { id: number; t_de: string; t_en: string; b_de: string; b_en: string; subs: Sub[] };

async function getCfg(): Promise<Cfg> {
  const r = await fetch(SB + "/rest/v1/kf_push_cfg?k=eq.1&select=secret,vapid_pub,vapid_priv", { headers: H });
  if (!r.ok) throw new Error("config " + r.status);
  return (await r.json())[0];
}
async function rpc(fn: string, body: unknown) {
  const r = await fetch(SB + "/rest/v1/rpc/" + fn, { method: "POST", headers: H, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(fn + " " + r.status + " " + t);
  return t ? JSON.parse(t) : null;
}

Deno.serve(async (req) => {
  const cfg = await getCfg();
  if (!cfg || req.headers.get("x-kf-secret") !== cfg.secret) return new Response("forbidden", { status: 403 });
  if (!cfg.vapid_pub || !cfg.vapid_priv) {
    const k = webpush.generateVAPIDKeys();
    const r = await fetch(SB + "/rest/v1/kf_push_cfg?k=eq.1", { method: "PATCH", headers: H, body: JSON.stringify({ vapid_pub: k.publicKey, vapid_priv: k.privateKey }) });
    if (!r.ok) throw new Error("save keys " + r.status);
    cfg.vapid_pub = k.publicKey; cfg.vapid_priv = k.privateKey;
  }
  webpush.setVapidDetails(GAME, cfg.vapid_pub, cfg.vapid_priv);
  let sent = 0;
  const gone = new Set<string>();
  for (let round = 0; round < 5; round++) {
    const items: Item[] = (await rpc("push_take", { p_secret: cfg.secret })) ?? [];
    if (!items.length) break;
    await Promise.all(items.flatMap((it) => it.subs.map(async (s) => {
      const de = s.lang === "de";
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: de ? it.t_de : it.t_en, body: de ? it.b_de : it.b_en, url: GAME }), { TTL: 86400 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.add(s.endpoint);
      }
    })));
  }
  if (gone.size) await rpc("push_gone", { p_secret: cfg.secret, p_endpoints: [...gone] });
  return Response.json({ ready: true, sent, gone: gone.size });
});

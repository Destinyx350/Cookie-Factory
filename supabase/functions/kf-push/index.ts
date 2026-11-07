// Keksfabrik / Cookie Factory push sender (Supabase Edge Function "kf-push").
// The database wakes it (pg_net) whenever a notification is queued. It takes the waiting notifications with the
// shared secret, sends them with Web Push, and removes devices that no longer exist.
// Secrets (set in Supabase → Edge Functions → Secrets, never in this repo): VAPID_PUBLIC, VAPID_PRIVATE, KF_PUSH_SECRET.
// Deploy with "Verify JWT" turned off: the database calls it with the shared secret instead.
import webpush from "npm:web-push@3.6.7";

const API = (Deno.env.get("SUPABASE_URL") ?? "https://nmmlemtljjvfurlrvuvm.supabase.co") + "/rest/v1/rpc/";
const KEY = "sb_publishable_STHuGWpHxg6efQhuvc_sQQ_xO5AvI5J"; // public key, same as in index.html
const SECRET = Deno.env.get("KF_PUSH_SECRET") ?? "";
const GAME = "https://destinyx350.github.io/Cookie-Factory/";

webpush.setVapidDetails(GAME, Deno.env.get("VAPID_PUBLIC") ?? "", Deno.env.get("VAPID_PRIVATE") ?? "");

async function rpc(fn: string, body: unknown) {
  const r = await fetch(API + fn, {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(fn + " " + r.status + " " + t);
  return t ? JSON.parse(t) : null;
}

type Sub = { endpoint: string; p256dh: string; auth: string; lang: string };
type Item = { id: number; t_de: string; t_en: string; b_de: string; b_en: string; subs: Sub[] };

Deno.serve(async (req) => {
  if (!SECRET || req.headers.get("x-kf-secret") !== SECRET) return new Response("forbidden", { status: 403 });
  let items: Item[] = [], sent = 0;
  const gone = new Set<string>();
  // Up to 5 rounds so a burst of notifications goes out in one wake-up.
  for (let round = 0; round < 5; round++) {
    items = (await rpc("push_take", { p_secret: SECRET })) ?? [];
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
  if (gone.size) await rpc("push_gone", { p_secret: SECRET, p_endpoints: [...gone] });
  return Response.json({ sent, gone: gone.size });
});

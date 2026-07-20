// Serverless function: store & serve visitor reviews (Upstash Redis REST).
// Connect an Upstash Redis (or Vercel KV) store in the Vercel dashboard —
// it auto-injects the env vars below. Until then, POST returns 501 and the
// site falls back to email; GET returns an empty list.

const URL_ =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const KEY = 'reviews';
const MAX = 60; // keep newest 60

async function redis(path) {
  const r = await fetch(`${URL_}/${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json();
}

function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // strip control chars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export default async function handler(req, res) {
  if (!URL_ || !TOKEN) {
    if (req.method === 'GET') return res.status(200).json({ reviews: [] });
    return res.status(501).json({ error: 'store_not_connected' });
  }

  try {
    if (req.method === 'GET') {
      const data = await redis(`lrange/${KEY}/0/${MAX - 1}`);
      const reviews = (data.result || [])
        .map((x) => { try { return JSON.parse(x); } catch { return null; } })
        .filter(Boolean);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (b.hp) return res.status(200).json({ ok: true }); // honeypot: silently drop bots
      const rating = Math.round(Number(b.rating));
      const name = clean(b.name, 60);
      const role = clean(b.role, 80);
      const message = clean(b.message, 600);
      if (!(rating >= 1 && rating <= 5) || !name || message.length < 4) {
        return res.status(400).json({ error: 'invalid' });
      }
      const review = { rating, name, role, message, at: Date.now() };
      const val = encodeURIComponent(JSON.stringify(review));
      await redis(`lpush/${KEY}/${val}`);
      await redis(`ltrim/${KEY}/0/${MAX - 1}`);
      return res.status(200).json({ ok: true, review });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
}

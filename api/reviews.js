// Reviews with moderation, stored in Vercel Edge Config.
//   'reviews'         -> approved list (shown publicly)
//   'reviews_pending' -> awaiting approval (private)
// Public: GET returns approved; POST (submit) adds to pending.
// Admin (needs REVIEW_ADMIN_KEY): list pending, approve, reject, delete.

const CONFIG_ID = process.env.EDGE_CONFIG_ID || 'ecfg_v7eafmjnzewnnac1rvmglrdviphy';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_MUQrMKzLWvMuvXrYELxgGQW2';
const TOKEN = process.env.VERCEL_API_TOKEN || '';
const ADMIN = process.env.REVIEW_ADMIN_KEY || '';
const LIVE = 'reviews';
const PEND = 'reviews_pending';
const MAX = 30;
const api = (p) => `https://api.vercel.com/v1/edge-config/${CONFIG_ID}${p}?teamId=${TEAM_ID}`;

function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
async function read(key) {
  const r = await fetch(api(`/item/${key}`), { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (r.status === 404 || r.status === 204) return [];
  if (!r.ok) throw new Error('read ' + r.status);
  const t = await r.text();
  if (!t) return [];
  let d; try { d = JSON.parse(t); } catch (e) { return []; }
  const v = d && typeof d === 'object' && !Array.isArray(d) && 'value' in d ? d.value : d;
  return Array.isArray(v) ? v : [];
}
async function write(items) {
  const r = await fetch(api('/items'), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!r.ok) throw new Error('write ' + r.status + ' ' + (await r.text()));
}
function isAdmin(req) {
  const k = req.headers['x-admin-key'] || (req.query && req.query.key) || '';
  return ADMIN && k === ADMIN;
}

export default async function handler(req, res) {
  if (!TOKEN) {
    if (req.method === 'GET') return res.status(200).json({ reviews: [] });
    return res.status(501).json({ error: 'store_not_connected' });
  }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      if (req.query && req.query.admin !== undefined) {
        if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
        return res.status(200).json({ pending: await read(PEND), approved: await read(LIVE) });
      }
      return res.status(200).json({ reviews: await read(LIVE) });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const action = b.action || 'submit';

      if (action === 'submit') {
        if (b.hp) return res.status(200).json({ ok: true }); // honeypot
        const rating = Math.round(Number(b.rating));
        const name = clean(b.name, 60);
        const role = clean(b.role, 80);
        const message = clean(b.message, 400);
        if (!(rating >= 1 && rating <= 5) || !name || message.length < 4) {
          return res.status(400).json({ error: 'invalid' });
        }
        const review = { rating, name, role, message, at: Date.now() };
        const pending = [review, ...(await read(PEND))].slice(0, 100);
        await write([{ operation: 'upsert', key: PEND, value: pending }]);
        return res.status(200).json({ ok: true, pending: true });
      }

      // ---- admin actions ----
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const at = Number(b.at);

      if (action === 'approve') {
        const pending = await read(PEND);
        const item = pending.find((r) => r.at === at);
        if (!item) return res.status(404).json({ error: 'not_found' });
        const approved = [item, ...(await read(LIVE))].slice(0, MAX);
        await write([
          { operation: 'upsert', key: LIVE, value: approved },
          { operation: 'upsert', key: PEND, value: pending.filter((r) => r.at !== at) },
        ]);
        return res.status(200).json({ ok: true });
      }
      if (action === 'reject') {
        const pending = await read(PEND);
        await write([{ operation: 'upsert', key: PEND, value: pending.filter((r) => r.at !== at) }]);
        return res.status(200).json({ ok: true });
      }
      if (action === 'delete') {
        const approved = await read(LIVE);
        await write([{ operation: 'upsert', key: LIVE, value: approved.filter((r) => r.at !== at) }]);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'bad_action' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
}

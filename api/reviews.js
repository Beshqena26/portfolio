// Reviews (with moderation + show/hide) and lightweight view stats,
// stored in Vercel Edge Config.
//   'reviews'         -> approved list (each may have hidden:true)
//   'reviews_pending' -> awaiting approval
//   'stats'           -> { views: {home, multipay, ...}, reviewsSubmitted }
// Public: GET -> approved & not hidden; POST submit -> pending; POST track -> stats++
// Admin (REVIEW_ADMIN_KEY): list all, approve, reject, delete, hide, unhide.

const CONFIG_ID = process.env.EDGE_CONFIG_ID || 'ecfg_v7eafmjnzewnnac1rvmglrdviphy';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_MUQrMKzLWvMuvXrYELxgGQW2';
const TOKEN = process.env.VERCEL_API_TOKEN || '';
const ADMIN = process.env.REVIEW_ADMIN_KEY || '';
const LIVE = 'reviews';
const PEND = 'reviews_pending';
const STATS = 'stats';
const MAX = 40;
const PAGES = ['home', 'multipay', 'generato', 'nemora', 'hvpn', 'chkari', 'resume'];
const api = (p) => `https://api.vercel.com/v1/edge-config/${CONFIG_ID}${p}?teamId=${TEAM_ID}`;

// Fast read path via the EDGE_CONFIG connection string (high throughput, NOT the
// 20-reads/minute-limited management API that was causing intermittent 500s).
let EC_ID = '', EC_TOKEN = '';
try { const u = new URL(process.env.EDGE_CONFIG || ''); EC_ID = u.pathname.replace(/^\//, ''); EC_TOKEN = u.searchParams.get('token') || ''; } catch (e) {}
const readUrl = (key) => `https://edge-config.vercel.com/${EC_ID}/item/${key}?token=${EC_TOKEN}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
async function read(key) {
  // Primary: fast edge endpoint (effectively unlimited reads, returns the raw value).
  if (EC_ID && EC_TOKEN) {
    try {
      const r = await fetch(readUrl(key), { cache: 'no-store' });
      if (r.status === 404 || r.status === 204) return null;
      if (r.ok) { const t = await r.text(); if (!t) return null; try { return JSON.parse(t); } catch (e) { return null; } }
      // any other status: fall through to management API
    } catch (e) { /* fall through */ }
  }
  // Fallback: management API (rate-limited to ~20/min — only used if the fast path fails).
  const r = await fetch(api(`/item/${key}`), { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (r.status === 404 || r.status === 204) return null;
  if (!r.ok) throw new Error('read ' + r.status);
  const t = await r.text();
  if (!t) return null;
  try { const d = JSON.parse(t); return d && typeof d === 'object' && !Array.isArray(d) && 'value' in d ? d.value : d; }
  catch (e) { return null; }
}
async function list(key) { const v = await read(key); return Array.isArray(v) ? v : []; }
async function write(items) {
  // Retry on transient failures (e.g. management-API write rate limit) so submits/approvals aren't lost.
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(250 * attempt);
    const r = await fetch(api('/items'), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (r.ok) return;
    lastErr = 'write ' + r.status + ' ' + (await r.text());
    if (r.status !== 429 && r.status < 500) break; // don't retry a genuine client error
  }
  throw new Error(lastErr || 'write failed');
}
function isAdmin(req) {
  const k = req.headers['x-admin-key'] || (req.query && req.query.key) || '';
  return ADMIN && String(k).trim().toLowerCase() === ADMIN.trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!TOKEN) {
    if (req.method === 'GET') return res.status(200).json({ reviews: [] });
    return res.status(501).json({ error: 'store_not_connected' });
  }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      if (req.query && req.query.admin !== undefined) {
        if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
        const stats = (await read(STATS)) || { views: {}, reviewsSubmitted: 0 };
        return res.status(200).json({ pending: await list(PEND), approved: await list(LIVE), stats });
      }
      const approved = (await list(LIVE)).filter((r) => !r.hidden);
      return res.status(200).json({ reviews: approved });
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const action = b.action || 'submit';

      // ---- public: page-view tracking ----
      if (action === 'track') {
        const page = String(b.page || '');
        if (!PAGES.includes(page)) return res.status(200).json({ ok: true });
        const stats = (await read(STATS)) || { views: {}, reviewsSubmitted: 0 };
        stats.views = stats.views || {};
        stats.views[page] = (stats.views[page] || 0) + 1;
        await write([{ operation: 'upsert', key: STATS, value: stats }]);
        return res.status(200).json({ ok: true });
      }

      // ---- public: submit review ----
      if (action === 'submit') {
        if (b.hp) return res.status(200).json({ ok: true }); // honeypot
        const rating = Math.round(Number(b.rating));
        const name = clean(b.name, 60);
        const role = clean(b.role, 80);
        const message = clean(b.message, 400);
        if (!(rating >= 1 && rating <= 5) || !name || message.length < 4) {
          return res.status(400).json({ error: 'invalid' });
        }
        const review = { id: 'r' + Date.now(), rating, name, role, message, at: Date.now(), hidden: false };
        const pending = [review, ...(await list(PEND))].slice(0, 100);
        const stats = (await read(STATS)) || { views: {}, reviewsSubmitted: 0 };
        stats.reviewsSubmitted = (stats.reviewsSubmitted || 0) + 1;
        await write([
          { operation: 'upsert', key: PEND, value: pending },
          { operation: 'upsert', key: STATS, value: stats },
        ]);
        return res.status(200).json({ ok: true, pending: true });
      }

      // ---- admin actions ----
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const id = b.id;
      const at = Number(b.at);
      const match = (r) => (id && r.id === id) || (at && r.at === at);

      if (action === 'approve') {
        const pending = await list(PEND);
        const item = pending.find(match);
        if (!item) return res.status(404).json({ error: 'not_found' });
        item.hidden = false;
        const approved = [item, ...(await list(LIVE))].slice(0, MAX);
        await write([
          { operation: 'upsert', key: LIVE, value: approved },
          { operation: 'upsert', key: PEND, value: pending.filter((r) => !match(r)) },
        ]);
        return res.status(200).json({ ok: true });
      }
      if (action === 'reject') {
        const pending = await list(PEND);
        await write([{ operation: 'upsert', key: PEND, value: pending.filter((r) => !match(r)) }]);
        return res.status(200).json({ ok: true });
      }
      if (action === 'delete') {
        const approved = await list(LIVE);
        await write([{ operation: 'upsert', key: LIVE, value: approved.filter((r) => !match(r)) }]);
        return res.status(200).json({ ok: true });
      }
      if (action === 'hide' || action === 'unhide') {
        const approved = await list(LIVE);
        const item = approved.find(match);
        if (!item) return res.status(404).json({ error: 'not_found' });
        item.hidden = action === 'hide';
        await write([{ operation: 'upsert', key: LIVE, value: approved }]);
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

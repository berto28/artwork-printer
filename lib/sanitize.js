// Cart properties come from the customer's browser, so treat every value as untrusted.

export function str(v, max = 200) {
  return String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
}

export function oneOf(v, list, fallback) {
  return list.includes(v) ? v : fallback;
}

export function hex(v, fallback) {
  v = String(v || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

export function num(v, min, max, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

// Only images from Shopify's CDN or from this store's own domain are fetched. Without this,
// a customer could make the server request any address by editing the hidden property.
// Modern themes output image links like //your-store.com/cdn/shop/files/..., so a leading //
// is accepted and the order's own store host is allowed (see process.js). Add more hosts with
// the IMAGE_HOSTS environment variable (comma separated).
export function cdnUrl(v, extraHosts = []) {
  try {
    let s = String(v || '').trim();
    if (s.startsWith('//')) s = 'https:' + s;
    const u = new URL(s);
    const hosts = new Set(['cdn.shopify.com']);
    if (process.env.SHOPIFY_SHOP) hosts.add((process.env.SHOPIFY_SHOP + '.myshopify.com').toLowerCase());
    String(process.env.IMAGE_HOSTS || '').split(',').forEach((h) => { h = h.trim().toLowerCase(); if (h) hosts.add(h); });
    (extraHosts || []).forEach((h) => { if (h) hosts.add(String(h).toLowerCase()); });
    const okPath = u.pathname.startsWith('/s/files/') || u.pathname.startsWith('/cdn/');
    if (u.protocol === 'https:' && hosts.has(u.hostname.toLowerCase()) && okPath) return u.href;
  } catch (e) { /* not a URL */ }
  return null;
}

export async function fetchImageBuffer(url) {
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error('Image download failed (' + res.status + ')');
  const len = Number(res.headers.get('content-length') || 0);
  if (len > 40 * 1024 * 1024) throw new Error('Image is too large');
  return Buffer.from(await res.arrayBuffer());
}

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

// Only Shopify CDN images are fetched. Without this, a customer could make the
// server request any address by editing the hidden property.
export function cdnUrl(v) {
  try {
    const u = new URL(String(v));
    if (u.protocol === 'https:' && u.hostname === 'cdn.shopify.com') return u.href;
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

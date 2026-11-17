import crypto from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import { processOrder } from '../lib/process.js';

function validSignature(rawBody, header) {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret || !header) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  const a = Buffer.from(header), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  // The signature is calculated on the raw body, so read it as text before parsing.
  const raw = await request.text();

  if (!validSignature(raw, request.headers.get('x-shopify-hmac-sha256'))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (request.headers.get('x-shopify-shop-domain') !== process.env.SHOPIFY_SHOP + '.myshopify.com') {
    return new Response('Unknown shop', { status: 401 });
  }

  let order;
  try { order = JSON.parse(raw); } catch (e) { return new Response('Bad JSON', { status: 400 }); }

  // Shopify wants an answer within 5 seconds, so reply now and keep working in the background.
  waitUntil(
    processOrder(order).catch((err) => console.error('Order', order.name, 'failed:', err.message))
  );
  return new Response('ok', { status: 200 });
}

export function GET() {
  return new Response('Artwork webhook is running.', { status: 200 });
}

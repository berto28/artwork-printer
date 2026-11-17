import { createCanvas, loadImage } from '@napi-rs/canvas';
import { registerFonts } from './fonts.js';
import { renderPoster } from './poster.js';
import { renderCard } from './card.js';
import { uploadPng, getOrderState, attachToOrder } from './shopify.js';

const DONE_TAG = 'print-file-ready';
const MAX_BYTES = Number(process.env.MAX_FILE_MB || 19) * 1024 * 1024; // Shopify's limit is 20 MB per file
const MAX_PIXELS = Number(process.env.MAX_PIXELS || 20000000);          // and 20 megapixels for images
const START_DPI = Number(process.env.PRINT_DPI || 300);

function toObject(properties) {
  const out = {};
  for (const p of properties || []) out[p.name] = p.value;
  return out;
}

// Render at the target resolution; if the PNG is too big for Shopify, lower the resolution a little and retry.
async function renderWithinLimits(deps, kind, props) {
  const render = kind === 'poster' ? renderPoster : renderCard;
  let dpi = START_DPI;
  for (let i = 0; i < 6; i++) {
    const out = await render(deps, props, { dpi, maxPixels: MAX_PIXELS });
    if (out.png.length <= MAX_BYTES) return out;
    dpi *= 0.85;
  }
  throw new Error('Could not get the PNG under ' + MAX_BYTES / 1024 / 1024 + ' MB');
}

export async function processOrder(order) {
  const jobs = [];
  for (const li of order.line_items || []) {
    const props = toObject(li.properties);
    const kind = props['Artwork template'] ? 'poster' : props['Card size'] ? 'card' : null;
    if (kind) jobs.push({ li, props, kind });
  }
  if (!jobs.length) return; // an order without custom artwork

  if (registerFonts() === 0) throw new Error('No fonts found in the /fonts folder. See fonts/README.txt');

  const gid = order.admin_graphql_api_id || 'gid://shopify/Order/' + order.id;
  const current = await getOrderState(gid);
  if (current.tags.includes(DONE_TAG)) {
    console.log('Order', order.name, 'already has its print files. Skipping.');
    return;
  }

  const orderName = String(order.name || order.order_number || order.id).replace(/[^\w-]/g, '');
  const deps = { createCanvas, loadImage, cache: new Map() };
  const files = [];

  for (const job of jobs) {
    const out = await renderWithinLimits(deps, job.kind, job.props);
    const filename = orderName + '-' + job.li.id + '-' + out.label + '.png';
    const file = await uploadPng(out.png, filename, 'Print file for order ' + order.name);
    files.push({
      title: (job.kind === 'poster' ? 'Poster ' : 'Business card ') + out.label + ' x' + job.li.quantity + ' (' + out.width + 'x' + out.height + ' px)',
      url: file.url
    });
    console.log('Created', filename, out.width + 'x' + out.height, Math.round(out.png.length / 1024) + ' KB');
  }

  await attachToOrder(gid, current.note, files, DONE_TAG);
  console.log('Order', order.name, 'done');
}

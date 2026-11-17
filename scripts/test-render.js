// Draws sample posters and a business card to the /out folder so you can check them by eye.
//   npm run test:render
//   npm run test:render -- --image=https://cdn.shopify.com/s/files/....jpg   (optional product image)
import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { registerFonts } from '../lib/fonts.js';
import { renderPoster, TEMPLATES, propName } from '../lib/poster.js';
import { renderCard, cardPropName } from '../lib/card.js';

const imageArg = (process.argv.find((a) => a.startsWith('--image=')) || '').slice(8);

const count = registerFonts();
if (count === 0) {
  console.error('No fonts found in /fonts. Add the font files listed in fonts/README.txt first.');
  process.exit(1);
}
console.log('Registered', count, 'font files');
fs.mkdirSync('out', { recursive: true });

const SAMPLE_TEXT = {
  title: 'Summer Collection', badge: 'Mega sale', subtitle: 'Limited time only', caption: 'Saturday, 14 December',
  price: '$29.99', oldPrice: '$49.99', cta: 'Shop now', contact: '+00 000 000 0000|hello@yourstore.com|123 Main Street'
};

const deps = { createCanvas, loadImage, cache: new Map() };
const opts = { dpi: 100, maxPixels: 4000000 }; // small and fast, just for checking

for (const t of TEMPLATES) {
  const props = {
    'Artwork template': t.name, 'Artwork size': 'A4', 'Artwork orientation': 'portrait',
    'Artwork composition': 'balanced', 'Artwork alignment': 'center', 'Artwork image side': 'top',
    'Artwork colors': '#f7f5f0 / #1d2b3a / #2b6cb0', 'Artwork font': 'serif',
    '_Artwork zoom': '1', '_Artwork pan x': '0', '_Artwork pan y': '0'
  };
  if (imageArg) props['_Artwork image'] = imageArg;
  for (const f of t.uses) props[propName(t.key, f)] = SAMPLE_TEXT[f];
  const out = await renderPoster(deps, props, opts);
  fs.writeFileSync('out/poster-' + t.key + '.png', out.png);
  console.log('out/poster-' + t.key + '.png', out.width + 'x' + out.height);
}

const cardProps = {
  'Card size': '90 × 55 mm', 'Card orientation': 'landscape', 'Card text alignment': 'left',
  'Card arrangement': 'stacked', 'Card details position': 'middle', 'Card logo': 'product image (left)',
  'Card colors': '#ffffff / #1a1a1a / #009677', 'Card font': 'sans', '_Card logo scale': '1', '_Card caps': 'yes', '_Card one line': 'yes',
  [cardPropName('name')]: 'Name Surname', [cardPropName('title')]: 'Title here', [cardPropName('capability')]: 'Capability here',
  [cardPropName('qualifications')]: 'Qualifications here', [cardPropName('email')]: 'name@company.com',
  [cardPropName('cell')]: '+27 (0)82 123 4567', [cardPropName('tel')]: '+27 (0)21 509 0000',
  [cardPropName('address')]: 'Street name, Suburb, City 0000', [cardPropName('website')]: 'company.com'
};
if (imageArg) cardProps['_Card logo image'] = imageArg;
const card = await renderCard(deps, cardProps, { dpi: 200, maxPixels: 4000000 });
fs.writeFileSync('out/business-card.png', card.png);
console.log('out/business-card.png', card.width + 'x' + card.height);

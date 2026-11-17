// GENERATED from businesscard.liquid (the drawing code of the business card editor).
// If you change how the editor draws, copy the matching code here too, or ask for it to be regenerated.
import * as S from './sanitize.js';
import { FONT_STACKS_CARD } from './fonts.js';

let W = 1050, H = 642, ctx = null, state = null;

    var FONTS = {
      sans: '"Montserrat", "Helvetica Neue", Helvetica, Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      condensed: '"Arial Narrow", "Roboto Condensed", Impact, sans-serif',
      mono: '"Courier New", Courier, monospace'
    };
    // [long edge mm, short edge mm]
    var DIM = { '90x55': [90, 55], '85x55': [85, 55], '35x20': [88.9, 50.8] };
    var LONG = 1050;      // logical pixels on the long edge
    var DPI = 300;        // download resolution
    var MARGIN = 60;

Object.assign(FONTS, FONT_STACKS_CARD);

    var TEXT_FIELDS = ['name', 'title', 'capability', 'qualifications', 'email', 'cell', 'tel', 'address', 'website', 'footer'];
    var FIELD_LABELS = { name: 'Name', title: 'Title', capability: 'Capabilities', qualifications: 'Qualifications', email: 'Email', cell: 'Cellphone', tel: 'Telephone', address: 'Address', website: 'Website', footer: 'Footer note' };

    function setFont(size, weight) { ctx.font = (weight || 400) + ' ' + size + 'px ' + FONTS[state.font]; }
    function rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function wrap(text, maxW) {
      var words = String(text).split(/\s+/), lines = [], line = '';
      words.forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else { line = test; }
      });
      if (line) lines.push(line);
      return lines;
    }

    // Stacks items inside rect and shrinks them until they fit.
    // item: { t, size, weight, color, maxLines, lh, gap, alpha } or { rule: true, pad, th, color }
    // Returns { y: top of drawn block, h: block height }.
    function stack(rect, items, o) {
      o = o || {};
      items = items.filter(function (i) { return i.rule || i.t; });
      if (!items.length || rect.w < 20 || rect.h < 10) return { y: rect.y, h: 0 };
      var k = 1, blocks, total;
      for (;;) {
        blocks = []; total = 0;
        items.forEach(function (it) {
          if (it.rule) { var rh = (it.pad * 2 + it.th) * k; blocks.push({ it: it, rule: true, h: rh }); total += rh; return; }
          var size = Math.max(9, it.size * k);
          setFont(size, it.weight);
          var ls = wrap(it.t, rect.w), lh = size * (it.lh || 1.2), gap = (it.gap || 0) * k;
          blocks.push({ it: it, size: size, ls: ls, lh: lh, gap: gap });
          total += ls.length * lh + gap;
        });
        var many = blocks.some(function (b) { return !b.rule && b.ls.length > (b.it.maxLines || 2); });
        if ((total <= rect.h && !many) || k <= 0.35) break;
        k -= 0.05;
      }
      var y = o.valign === 'top' ? rect.y : o.valign === 'bottom' ? rect.y + rect.h - total : rect.y + (rect.h - total) / 2;
      if (y < rect.y) y = rect.y;
      var y0 = y, al = state.align;
      var x = al === 'left' ? rect.x : al === 'right' ? rect.x + rect.w : rect.x + rect.w / 2;
      blocks.forEach(function (b) {
        if (b.rule) {
          ctx.fillStyle = b.it.color; ctx.fillRect(rect.x, y + b.it.pad * (b.h / (b.it.pad * 2 + b.it.th)), rect.w, b.it.th * (b.h / (b.it.pad * 2 + b.it.th)));
          y += b.h; return;
        }
        setFont(b.size, b.it.weight);
        ctx.fillStyle = b.it.color || state.ink; ctx.textAlign = al; ctx.textBaseline = 'top';
        ctx.globalAlpha = b.it.alpha || 1;
        b.ls.forEach(function (l, i) { ctx.fillText(l, x, y + i * b.lh); });
        ctx.globalAlpha = 1;
        y += b.ls.length * b.lh + b.gap;
      });
      return { y: y0, h: total };
    }

    /* ---------- card drawing ---------- */
    function draw(isPreview) {
      ctx.fillStyle = state.bg; ctx.fillRect(0, 0, W, H);
      var m = MARGIN, innerW = W - 2 * m;

      // logo
      var hasLogo = state.logoPos !== 'none';
      var lh = hasLogo ? Math.min(W, H) * 0.2 * state.logoScale : 0;
      if (hasLogo) {
        var maxW = Math.min(innerW, innerW * 0.6 * state.logoScale);
        if (state.logo) {
          var s = Math.min(maxW / state.logo.width, lh / state.logo.height);
          var lw = state.logo.width * s, lhh = state.logo.height * s;
          var lx = state.logoPos === 'left' ? m : state.logoPos === 'right' ? W - m - lw : (W - lw) / 2;
          ctx.drawImage(state.logo, lx, m, lw, lhh);
        } else if (isPreview) {
          var pw = Math.min(maxW, lh * 2.4), px = state.logoPos === 'left' ? m : state.logoPos === 'right' ? W - m - pw : (W - pw) / 2;
          ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = state.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
          rr(px, m, pw, lh, 10); ctx.stroke(); ctx.globalAlpha = 0.5; ctx.fillStyle = state.ink;
          setFont(Math.max(14, lh * 0.18), 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('Product image', px + pw / 2, m + lh / 2); ctx.restore();
        }
      }

      // footer note
      var fh = state.footer ? 40 : 0;
      if (fh) stack({ x: m, y: H - m - fh, w: innerW, h: fh }, [{ t: state.footer, size: 17, maxLines: 2, alpha: 0.85 }], { valign: 'bottom' });

      // details area
      var top = m + lh + (hasLogo ? 30 : 0);
      var area = { x: m, y: top, w: innerW, h: H - m - top - (fh ? fh + 16 : 0) };
      var caps = function (t) { return state.caps ? String(t).toUpperCase() : t; };

      var identity = [
        { t: caps(state.name), size: 38, weight: 700, color: state.accent, maxLines: 2, lh: 1.12, gap: 3 },
        { t: caps(state.title), size: 30, weight: 400, color: state.accent, maxLines: 2, gap: 3 },
        { t: state.capability, size: 30, maxLines: 2, gap: 3 },
        { t: state.qualifications, size: 30, weight: 600, maxLines: 2 }
      ];
      var cell = state.cell ? 'C. ' + state.cell : '', tel = state.tel ? 'T. ' + state.tel : '';
      var phones = state.oneLine ? [[cell, tel].filter(Boolean).join(', ')] : [cell, tel];
      var contact = [{ t: state.email, size: 29, maxLines: 1, gap: 4 }];
      phones.forEach(function (p) { contact.push({ t: p, size: 29, maxLines: 2, gap: 4 }); });
      contact.push({ t: state.address, size: 29, maxLines: 2, gap: 4 });
      contact.push({ t: state.website, size: 29, weight: 600, maxLines: 1 });

      var hasId = identity.some(function (i) { return i.t; }), hasContact = contact.some(function (i) { return i.t; });

      if (state.arrange === 'side') {
        var gap = 44, colW = (area.w - gap) / 2;
        var a = stack({ x: area.x, y: area.y, w: colW, h: area.h }, identity, { valign: state.vpos });
        var b = stack({ x: area.x + colW + gap, y: area.y, w: colW, h: area.h }, contact, { valign: state.vpos });
        var y1 = Math.min(a.h ? a.y : 1e9, b.h ? b.y : 1e9), y2 = Math.max(a.h ? a.y + a.h : 0, b.h ? b.y + b.h : 0);
        if (hasId && hasContact && y2 > y1) { ctx.fillStyle = state.accent; ctx.fillRect(area.x + colW + gap / 2 - 2, y1, 4, y2 - y1); }
      } else {
        var items = identity.slice();
        if (hasId && hasContact) items.push({ rule: true, pad: 24, th: 4, color: state.accent });
        stack(area, items.concat(contact), { valign: state.vpos });
      }
    }


/* ---------------- server glue ---------------- */
export function cardPropName(field) { return 'Card ' + FIELD_LABELS[field].toLowerCase(); }

function parseProps(props) {
  const sizeMap = { '90': '90x55', '85': '85x55', '3.5': '35x20' };
  const m = String(props['Card size'] || '').match(/^\s*(\d+(?:\.\d+)?)/);
  const size = sizeMap[m && m[1]] || '90x55';
  const c = String(props['Card colors'] || '').split('/').map(function (s) { return s.trim(); });
  const lp = String(props['Card logo'] || '').match(/\((left|center|right)\)/);
  const s = {
    font: S.oneOf(props['Card font'], Object.keys(FONTS), 'sans'),
    caps: props['_Card caps'] !== 'no',
    oneLine: props['_Card one line'] !== 'no',
    bg: S.hex(c[0], '#ffffff'), ink: S.hex(c[1], '#1a1a1a'), accent: S.hex(c[2], '#009677'),
    align: S.oneOf(props['Card text alignment'], ['left', 'center', 'right'], 'left'),
    arrange: S.oneOf(props['Card arrangement'], ['stacked', 'side'], 'stacked'),
    vpos: S.oneOf(props['Card details position'], ['top', 'middle', 'bottom'], 'middle'),
    logoPos: lp ? lp[1] : (String(props['Card logo'] || '').startsWith('none') ? 'none' : 'left'),
    logoScale: S.num(props['_Card logo scale'], 0.5, 1.6, 1),
    size: size,
    orient: S.oneOf(props['Card orientation'], ['landscape', 'portrait'], 'landscape'),
    logo: null
  };
  TEXT_FIELDS.forEach(function (f) { s[f] = S.str(props[cardPropName(f)], 200); });
  return { s: s, logoUrl: S.cdnUrl(props['_Card logo image']) };
}

export async function renderCard(deps, props, opts) {
  opts = opts || {};
  const parsed = parseProps(props);
  let logo = null;
  if (parsed.logoUrl) {
    deps.cache = deps.cache || new Map();
    if (!deps.cache.has(parsed.logoUrl)) deps.cache.set(parsed.logoUrl, await deps.loadImage(await S.fetchImageBuffer(parsed.logoUrl)));
    logo = deps.cache.get(parsed.logoUrl);
  }
  state = parsed.s; state.logo = logo;
  const d = DIM[state.size], landscape = state.orient === 'landscape';
  const short = Math.round(LONG * d[1] / d[0]);
  W = landscape ? LONG : short; H = landscape ? short : LONG;
  const dpi = opts.dpi || 300, maxPixels = opts.maxPixels || 20000000;
  let pxW = (landscape ? d[0] : d[1]) / 25.4 * dpi, pxH = (landscape ? d[1] : d[0]) / 25.4 * dpi;
  if (pxW * pxH > maxPixels) { const f = Math.sqrt(maxPixels / (pxW * pxH)); pxW *= f; pxH *= f; }
  pxW = Math.round(pxW); pxH = Math.round(pxH);
  const canvas = deps.createCanvas(pxW, pxH);
  ctx = canvas.getContext('2d');
  const scale = pxW / W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  draw(false);
  return { png: canvas.toBuffer('image/png'), width: pxW, height: pxH, label: 'card-' + state.size + '-' + state.orient };
}

// GENERATED from artwork.liquid (the drawing code of the poster editor).
// If you change how the editor draws, copy the matching code here too, or ask for it to be regenerated.
import * as S from './sanitize.js';
import { FONT_STACKS_POSTER } from './fonts.js';

let W = 800, H = 1131, P = {}, photoBoxes = [], ctx = null, state = null;

    var FONTS = {
      serif: 'Georgia, "Times New Roman", serif',
      sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      condensed: '"Arial Narrow", "Roboto Condensed", Impact, sans-serif',
      mono: '"Courier New", Courier, monospace'
    };
    // [short edge mm, long edge mm]
    var DIM = { a5: [148, 210], a4: [210, 297], a3: [297, 420], a2: [420, 594], a1: [594, 841], card: [55, 90] };
    var COMP = { balanced: 0.6, image: 0.76, text: 0.44 };

Object.assign(FONTS, FONT_STACKS_POSTER);

    function readable(hex) {
      var c = String(hex).replace('#', '');
      if (c.length === 3) c = c.replace(/./g, '$&$&');
      var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#111111' : '#ffffff';
    }
    function num(s) {
      s = String(s || '').replace(/[^0-9.,]/g, '');
      if (!s) return NaN;
      var i = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
      if (i > -1 && s.length - i - 1 <= 2) return parseFloat(s.slice(0, i).replace(/[.,]/g, '') + '.' + s.slice(i + 1));
      return parseFloat(s.replace(/[.,]/g, ''));
    }
    function discount() {
      var a = num(state.price), b = num(state.oldPrice);
      return (b > a && a > 0) ? Math.round((b - a) / b * 100) : 0;
    }
    function inset(r, m) { return { x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m }; }
    function full() { return { x: 0, y: 0, w: W, h: H }; }

    /* ---------- canvas helpers ---------- */
    function setFont(size, weight, fam) { ctx.font = (weight || 400) + ' ' + size + 'px ' + (fam || FONTS[state.font]); }
    function fillBg(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
    function rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
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
    function alignX(rect, w) {
      if (state.align === 'left') return rect.x;
      if (state.align === 'right') return rect.x + rect.w - w;
      return rect.x + (rect.w - w) / 2;
    }

    // Stacks text items inside a rect, shrinking everything until it fits.
    // item: { t, size, weight, color, spacing, upper, maxLines, lh, gap, strike, alpha, fam, align }
    function stack(rect, items, o) {
      o = o || {};
      items = items.filter(function (i) { return i.t; });
      if (!items.length || rect.w < 20 || rect.h < 20) return rect.y;
      var k = 1, blocks, total;
      for (;;) {
        blocks = []; total = 0;
        items.forEach(function (it) {
          var size = Math.max(10, it.size * k);
          setFont(size, it.weight, it.fam);
          var sp = (it.spacing || 0) * k;
          ctx.letterSpacing = sp + 'px';
          var txt = it.upper ? String(it.t).toUpperCase() : String(it.t);
          var ls = wrap(txt, rect.w);
          ctx.letterSpacing = '0px';
          var lh = size * (it.lh || 1.15), gap = (it.gap || 0) * k;
          blocks.push({ it: it, size: size, ls: ls, lh: lh, sp: sp, gap: gap });
          total += ls.length * lh + gap;
        });
        var many = blocks.some(function (b) { return b.ls.length > (b.it.maxLines || 3); });
        if ((total <= rect.h && !many) || k <= 0.3) break;
        k -= 0.05;
      }
      var y = o.valign === 'top' ? rect.y : o.valign === 'bottom' ? rect.y + rect.h - total : rect.y + (rect.h - total) / 2;
      if (y < rect.y) y = rect.y;
      blocks.forEach(function (b) {
        var al = b.it.align || state.align;
        var x = al === 'left' ? rect.x : al === 'right' ? rect.x + rect.w : rect.x + rect.w / 2;
        setFont(b.size, b.it.weight, b.it.fam);
        ctx.fillStyle = b.it.color || P.ink;
        ctx.textAlign = al; ctx.textBaseline = 'top';
        ctx.letterSpacing = b.sp + 'px';
        ctx.globalAlpha = b.it.alpha || 1;
        b.ls.forEach(function (l, i) {
          var txt = b.it.upper ? l.toUpperCase() : l;
          ctx.fillText(txt, x, y + i * b.lh);
          if (b.it.strike) {
            var w = ctx.measureText(txt).width;
            var sx = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
            ctx.strokeStyle = b.it.color || P.ink;
            ctx.lineWidth = Math.max(3, b.size / 14);
            ctx.beginPath(); ctx.moveTo(sx, y + i * b.lh + b.size * 0.55); ctx.lineTo(sx + w, y + i * b.lh + b.size * 0.55); ctx.stroke();
          }
        });
        ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
        y += b.ls.length * b.lh + b.gap;
      });
      return y;
    }

    function pill(rect, text, bg, fg, hMax, weight) {
      if (!text) return 0;
      var h = Math.min(hMax || 60, rect.h * 0.25), size = h * 0.48;
      var up = String(text).toUpperCase(), tw;
      do { setFont(size, weight || 800); ctx.letterSpacing = '2px'; tw = ctx.measureText(up).width; ctx.letterSpacing = '0px'; size -= 1; }
      while (tw + h * 1.1 > rect.w && size > 10);
      var w = Math.min(rect.w, tw + h * 1.1), x = alignX(rect, w);
      ctx.fillStyle = bg; rr(x, rect.y, w, h, h / 2); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.letterSpacing = '2px'; ctx.fillText(up, x + w / 2, rect.y + h / 2 + 1); ctx.letterSpacing = '0px';
      return h + 18;
    }

    function burst(cx, cy, r, text, bg, fg) {
      if (!text) return;
      var n = 18;
      ctx.fillStyle = bg; ctx.beginPath();
      for (var i = 0; i < n * 2; i++) {
        var rad = i % 2 ? r * 0.86 : r, a = Math.PI * i / n;
        ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.fill();
      var size = r * 0.62;
      do { setFont(size, 900, FONTS.sans); size -= 2; } while (ctx.measureText(text).width > r * 1.5 && size > 10);
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, cy + 1);
    }

    function reserveCta(t) {
      if (!state.cta) return { body: t, cta: null };
      var h = Math.max(44, Math.min(72, t.h * 0.2));
      return { body: { x: t.x, y: t.y, w: t.w, h: t.h - h - 22 }, cta: { x: t.x, y: t.y + t.h - h, w: t.w, h: h } };
    }
    function drawCta(r, bg, fg) {
      if (!r || !state.cta) return;
      var up = state.cta.toUpperCase(), size = r.h * 0.38, tw;
      do { setFont(size, 800); ctx.letterSpacing = '2px'; tw = ctx.measureText(up).width; ctx.letterSpacing = '0px'; size -= 1; }
      while (tw + r.h * 1.2 > r.w && size > 10);
      var w = Math.min(r.w, tw + r.h * 1.2), x = alignX(r, w);
      ctx.fillStyle = bg; rr(x, r.y, w, r.h, r.h / 2); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.letterSpacing = '2px'; ctx.fillText(up, x + w / 2, r.y + r.h / 2 + 1); ctx.letterSpacing = '0px';
    }

    /* ---------- photo ---------- */
    function photoGeom(box) {
      var iw = state.img.width, ih = state.img.height;
      var s = Math.max(box.w / iw, box.h / ih) * state.zoom;
      var dw = iw * s, dh = ih * s;
      return { dw: dw, dh: dh, mx: Math.max(0, (dw - box.w) / 2), my: Math.max(0, (dh - box.h) / 2) };
    }
    function photo(box) {
      ctx.save();
      ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
      if (state.img) {
        var g = photoGeom(box);
        ctx.drawImage(state.img, box.x + (box.w - g.dw) / 2 + state.px * g.mx, box.y + (box.h - g.dh) / 2 + state.py * g.my, g.dw, g.dh);
      } else {
        ctx.fillStyle = 'rgba(128,128,128,0.18)'; ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = 'rgba(128,128,128,0.35)'; ctx.lineWidth = 2;
        for (var i = -box.h; i < box.w; i += 36) { ctx.beginPath(); ctx.moveTo(box.x + i, box.y + box.h); ctx.lineTo(box.x + i + box.h, box.y); ctx.stroke(); }
        ctx.fillStyle = 'rgba(60,60,60,0.8)'; setFont(Math.min(30, box.w / 9), 600, FONTS.sans);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Product image', box.x + box.w / 2, box.y + box.h / 2);
      }
      ctx.restore();
      photoBoxes.push(box);
    }

    // Splits an area into photo + text rects, following Composition and Image side.
    function split(area, gap) {
      var f = COMP[state.comp], s = state.side, p, t;
      if (s === 'top' || s === 'bottom') {
        var ph = area.h * f;
        if (s === 'top') {
          p = { x: area.x, y: area.y, w: area.w, h: ph - gap / 2 };
          t = { x: area.x, y: area.y + ph + gap / 2, w: area.w, h: area.h - ph - gap / 2 };
        } else {
          t = { x: area.x, y: area.y, w: area.w, h: area.h - ph - gap / 2 };
          p = { x: area.x, y: area.y + area.h - ph + gap / 2, w: area.w, h: ph - gap / 2 };
        }
      } else {
        var pw = area.w * f;
        if (s === 'left') {
          p = { x: area.x, y: area.y, w: pw - gap / 2, h: area.h };
          t = { x: area.x + pw + gap / 2, y: area.y, w: area.w - pw - gap / 2, h: area.h };
        } else {
          t = { x: area.x, y: area.y, w: area.w - pw - gap / 2, h: area.h };
          p = { x: area.x + area.w - pw + gap / 2, y: area.y, w: pw - gap / 2, h: area.h };
        }
      }
      return { p: p, t: t };
    }
    // Colored strip on the edge of the text panel that touches the photo.
    function edgeStrip(t, th, color) {
      ctx.fillStyle = color;
      if (state.side === 'top') ctx.fillRect(t.x, t.y, t.w, th);
      else if (state.side === 'bottom') ctx.fillRect(t.x, t.y + t.h - th, t.w, th);
      else if (state.side === 'left') ctx.fillRect(t.x, t.y, th, t.h);
      else ctx.fillRect(t.x + t.w - th, t.y, th, t.h);
    }

    /* ---------- templates ---------- */
    var TPL = {
      gallery: {
        name: 'Gallery', side: true, comp: true,
        uses: ['title', 'subtitle', 'caption'],
        defs: { badge: '', subtitle: 'Limited edition print', caption: '', cta: '' },
        draw: function () {
          fillBg(P.bg);
          var s = split(inset(full(), 60), 36);
          photo(s.p);
          ctx.strokeStyle = P.ink; ctx.globalAlpha = 0.25; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48); ctx.globalAlpha = 1;
          stack(s.t, [
            { t: state.title, size: 64, weight: 700, maxLines: 2, lh: 1.05, gap: 12 },
            { t: state.subtitle, size: 28, maxLines: 2, gap: 18 },
            { t: state.caption, size: 18, upper: true, spacing: 3, maxLines: 2, alpha: 0.8 }
          ]);
        }
      },
      bleed: {
        name: 'Full bleed', side: false, comp: true,
        uses: ['title', 'subtitle', 'caption'],
        defs: { badge: '', subtitle: 'Now in store', caption: '', cta: '' },
        draw: function () {
          fillBg('#000');
          photo(full());
          var oh = H * (1.1 - COMP[state.comp]) * 0.75 + 140;
          var g = ctx.createLinearGradient(0, H - oh, 0, H);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.82)');
          ctx.fillStyle = g; ctx.fillRect(0, H - oh, W, oh);
          stack({ x: 60, y: H - oh * 0.8, w: W - 120, h: oh * 0.8 - 56 }, [
            { t: state.title, size: 84, weight: 700, maxLines: 2, lh: 1.05, gap: 12, color: '#ffffff' },
            { t: state.subtitle, size: 30, maxLines: 2, gap: 16, color: '#ffffff' },
            { t: state.caption, size: 20, upper: true, spacing: 3, maxLines: 1, color: '#ffffffcc' }
          ], { valign: 'bottom' });
        }
      },
      banner: {
        name: 'Banner', side: true, comp: true,
        uses: ['title', 'subtitle', 'caption'],
        defs: { badge: '', subtitle: 'Limited edition print', caption: '', cta: '' },
        draw: function () {
          fillBg(P.bg);
          var s = split(full(), 0);
          photo(s.p);
          ctx.fillStyle = P.ink; ctx.fillRect(s.t.x, s.t.y, s.t.w, s.t.h);
          edgeStrip(s.t, 14, P.accent);
          stack(inset(s.t, 48), [
            { t: state.title, size: 78, weight: 700, maxLines: 3, lh: 1.05, gap: 14, color: P.bg },
            { t: state.subtitle, size: 28, maxLines: 2, gap: 16, color: P.bg },
            { t: state.caption, size: 18, upper: true, spacing: 3, maxLines: 2, color: P.bg, alpha: 0.8 }
          ]);
        }
      },
      type: {
        name: 'Type only', side: false, comp: false,
        uses: ['title', 'subtitle', 'caption'],
        defs: { badge: '', subtitle: 'Designed to be noticed', caption: '', cta: '' },
        draw: function () {
          fillBg(P.bg);
          var a = inset(full(), 70);
          var bx = alignX({ x: a.x, w: a.w }, 90);
          ctx.fillStyle = P.accent; ctx.fillRect(bx, a.y, 90, 10);
          stack({ x: a.x, y: a.y + 50, w: a.w, h: a.h - 150 }, [
            { t: state.title, size: 160, weight: 800, maxLines: 5, lh: 1.0, gap: 26 },
            { t: state.subtitle, size: 36, maxLines: 3 }
          ], { valign: 'top' });
          stack({ x: a.x, y: a.y + a.h - 80, w: a.w, h: 80 }, [
            { t: state.caption, size: 22, upper: true, spacing: 3, maxLines: 2, color: P.accent }
          ], { valign: 'bottom' });
        }
      },
      promo: {
        name: 'Promo poster', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'price', 'oldPrice', 'cta'],
        labels: { badge: 'Headline tag' },
        defs: { badge: 'Mega sale', subtitle: 'Limited time only', caption: '', cta: 'Shop now' },
        draw: function () {
          fillBg(P.accent);
          var s = split(inset(full(), 50), 40);
          ctx.fillStyle = P.bg; ctx.fillRect(s.p.x - 10, s.p.y - 10, s.p.w + 20, s.p.h + 20);
          photo(s.p);
          var r = reserveCta(s.t), on = P.onAccent;
          stack(r.body, [
            { t: state.badge, size: 120, weight: 900, upper: true, maxLines: 2, lh: 0.95, gap: 14, color: on },
            { t: state.title, size: 46, weight: 700, maxLines: 2, gap: 8, color: on },
            { t: state.subtitle, size: 26, maxLines: 2, gap: 10, color: on },
            { t: state.price, size: 52, weight: 800, maxLines: 1, color: on }
          ]);
          drawCta(r.cta, P.ink, readable(P.ink));
          var d = discount(), br = Math.min(s.p.w, s.p.h) * 0.2;
          if (d) burst(s.p.x + s.p.w - br * 0.6, s.p.y + br * 0.6, br, '-' + d + '%', P.ink, readable(P.ink));
        }
      },
      pricedrop: {
        name: 'Price drop', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'price', 'oldPrice', 'cta'],
        defs: { badge: 'Price drop', subtitle: 'While stocks last', caption: '', cta: 'Grab the deal' },
        draw: function () {
          fillBg(P.bg);
          var bandH = 120;
          ctx.fillStyle = P.accent; ctx.fillRect(0, 0, W, bandH);
          stack({ x: 30, y: 10, w: W - 60, h: bandH - 20 }, [
            { t: state.badge, size: 62, weight: 900, upper: true, spacing: 5, maxLines: 1, color: P.onAccent, align: 'center' }
          ]);
          var s = split({ x: 44, y: bandH + 44, w: W - 88, h: H - bandH - 88 }, 34);
          photo(s.p);
          var r = reserveCta(s.t);
          stack(r.body, [
            { t: state.title, size: 44, weight: 700, maxLines: 2, gap: 6 },
            { t: state.subtitle, size: 24, maxLines: 2, gap: 14, alpha: 0.85 },
            { t: state.oldPrice, size: 44, maxLines: 1, strike: true, alpha: 0.6, gap: 0 },
            { t: state.price, size: 140, weight: 900, maxLines: 1, color: P.accent, lh: 1.0 }
          ]);
          drawCta(r.cta, P.accent, P.onAccent);
        }
      },
      combo: {
        name: 'Combo deal', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'price', 'oldPrice', 'cta'],
        defs: { badge: 'Combo deal', subtitle: 'Buy two, save more', caption: '', cta: 'Order now' },
        draw: function () {
          fillBg(P.bg);
          var s = split(inset(full(), 50), 34), p = s.p, a, b;
          if (p.w >= p.h) {
            a = { x: p.x, y: p.y, w: (p.w - 20) / 2, h: p.h };
            b = { x: p.x + (p.w + 20) / 2, y: p.y, w: (p.w - 20) / 2, h: p.h };
          } else {
            a = { x: p.x, y: p.y, w: p.w, h: (p.h - 20) / 2 };
            b = { x: p.x, y: p.y + (p.h + 20) / 2, w: p.w, h: (p.h - 20) / 2 };
          }
          photo(a); photo(b);
          var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
          ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = P.onAccent; setFont(48, 800, FONTS.sans); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', cx, cy + 3);
          var r = reserveCta(s.t), used = pill(r.body, state.badge, P.accent, P.onAccent);
          stack({ x: r.body.x, y: r.body.y + used, w: r.body.w, h: r.body.h - used }, [
            { t: state.title, size: 56, weight: 700, maxLines: 2, gap: 8, lh: 1.05 },
            { t: state.subtitle, size: 26, maxLines: 2, gap: 12 },
            { t: state.oldPrice, size: 34, maxLines: 1, strike: true, alpha: 0.6 },
            { t: state.price, size: 96, weight: 900, maxLines: 1, color: P.accent, lh: 1.0 }
          ]);
          drawCta(r.cta, P.accent, P.onAccent);
        }
      },
      fresh: {
        name: 'New product', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'price', 'cta'],
        labels: { badge: 'Badge' },
        defs: { badge: 'New', subtitle: 'Just landed', caption: '', cta: 'Discover' },
        draw: function () {
          fillBg(P.bg);
          var s = split(inset(full(), 50), 34);
          photo(s.p);
          var br = Math.min(s.p.w, s.p.h) * 0.2;
          var r = reserveCta(s.t);
          stack(r.body, [
            { t: state.title, size: 64, weight: 700, maxLines: 2, gap: 10, lh: 1.05 },
            { t: state.subtitle, size: 28, maxLines: 2, gap: 14 },
            { t: state.price, size: 56, weight: 800, maxLines: 1, color: P.accent }
          ]);
          drawCta(r.cta, P.accent, P.onAccent);
          burst(s.p.x + s.p.w - br * 0.55, s.p.y + br * 0.55, br, String(state.badge || '').toUpperCase(), P.accent, P.onAccent);
        }
      },
      card: {
        name: 'Business card', side: true, comp: true,
        uses: ['title', 'subtitle', 'caption', 'contact'],
        labels: { title: 'Name', subtitle: 'Role or company', caption: 'Website', contact: 'Contact lines (separate with |)' },
        defs: { badge: '', subtitle: 'Founder', caption: 'www.yourstore.com', contact: '+00 000 000 0000|hello@yourstore.com|123 Main Street', cta: '' },
        draw: function () {
          fillBg(P.bg);
          var s = split(full(), 0);
          photo(s.p);
          edgeStrip(s.t, 14, P.accent);
          var items = [
            { t: state.title, size: 56, weight: 700, maxLines: 2, lh: 1.05, gap: 8 },
            { t: state.subtitle, size: 26, weight: 600, maxLines: 2, color: P.accent, gap: 26 }
          ];
          String(state.contact || '').split('|').forEach(function (l) {
            l = l.trim(); if (l) items.push({ t: l, size: 22, maxLines: 1, gap: 8 });
          });
          items.push({ t: state.caption, size: 22, weight: 700, maxLines: 1, color: P.accent });
          stack(inset(s.t, 44), items);
        }
      },
      event: {
        name: 'Event', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'caption', 'cta'],
        labels: { caption: 'Date & place' },
        defs: { badge: 'Join us', subtitle: 'Doors open at 6 PM', caption: 'Saturday, 14 December', cta: 'Reserve a seat' },
        draw: function () {
          fillBg(P.ink);
          var s = split(inset(full(), 50), 36);
          ctx.fillStyle = P.accent; ctx.fillRect(s.p.x - 8, s.p.y - 8, s.p.w + 16, s.p.h + 16);
          photo(s.p);
          var r = reserveCta(s.t), used = pill(r.body, state.badge, P.accent, P.onAccent);
          stack({ x: r.body.x, y: r.body.y + used, w: r.body.w, h: r.body.h - used }, [
            { t: state.title, size: 76, weight: 800, maxLines: 3, lh: 1.02, gap: 14, color: P.bg },
            { t: state.subtitle, size: 28, maxLines: 2, gap: 14, color: P.bg },
            { t: state.caption, size: 28, weight: 700, maxLines: 2, color: P.accent }
          ]);
          drawCta(r.cta, P.accent, P.onAccent);
        }
      },
      coupon: {
        name: 'Coupon', side: true, comp: true,
        uses: ['title', 'badge', 'subtitle', 'caption', 'cta'],
        labels: { badge: 'Offer', caption: 'Coupon code' },
        defs: { badge: '20% off', subtitle: 'On your next order', caption: 'CODE: WELCOME20', cta: 'Redeem today' },
        draw: function () {
          fillBg(P.bg);
          ctx.save(); ctx.setLineDash([18, 12]); ctx.strokeStyle = P.accent; ctx.lineWidth = 5;
          rr(34, 34, W - 68, H - 68, 28); ctx.stroke(); ctx.restore();
          var s = split(inset(full(), 90), 30);
          photo(s.p);
          var r = reserveCta(s.t);
          stack(r.body, [
            { t: state.badge, size: 130, weight: 900, upper: true, maxLines: 1, color: P.accent, lh: 1.0, gap: 8 },
            { t: state.title, size: 44, weight: 700, maxLines: 2, gap: 8 },
            { t: state.subtitle, size: 26, maxLines: 2, gap: 16 },
            { t: state.caption, size: 30, weight: 800, upper: true, spacing: 3, maxLines: 2, color: P.accent }
          ]);
          drawCta(r.cta, P.accent, P.onAccent);
        }
      }
    };
    var ORDER = ['gallery', 'bleed', 'banner', 'type', 'promo', 'pricedrop', 'combo', 'fresh', 'card', 'event', 'coupon'];
    var LABELS = { title: 'Title', badge: 'Label', subtitle: 'Subtitle', caption: 'Caption', cta: 'Button text', contact: 'Contact lines' };
    var TEXT_KEYS = ['title', 'badge', 'subtitle', 'caption', 'price', 'oldPrice', 'cta', 'contact'];

    function pal() { return { bg: state.bg, ink: state.ink, accent: state.accent, onAccent: readable(state.accent) }; }

/* ---------------- server glue ---------------- */
export const TEMPLATES = ORDER.map(function (k) {
  return { key: k, name: TPL[k].name, uses: TPL[k].uses, labels: TPL[k].labels || {} };
});

// Name of the cart property that holds a given text field for a template.
export function propName(key, field) {
  const T = TPL[key];
  return 'Artwork ' + ((T.labels && T.labels[field]) || LABELS[field] || field).toLowerCase();
}

function parseProps(props) {
  const byName = {};
  ORDER.forEach(function (k) { byName[TPL[k].name] = k; });
  const key = byName[props['Artwork template']];
  if (!key) throw new Error('Unknown artwork template: ' + props['Artwork template']);
  const T = TPL[key];
  const sz = String(props['Artwork size'] || 'A4');
  let size = sz === 'Business card' ? 'card' : sz.toLowerCase();
  if (!DIM[size]) size = 'a4';
  const c = String(props['Artwork colors'] || '').split('/').map(function (s) { return s.trim(); });
  const s = {
    template: key,
    font: S.oneOf(props['Artwork font'], Object.keys(FONTS), 'serif'),
    comp: S.oneOf(props['Artwork composition'], Object.keys(COMP), 'balanced'),
    align: S.oneOf(props['Artwork alignment'], ['left', 'center', 'right'], 'center'),
    side: S.oneOf(props['Artwork image side'], ['top', 'bottom', 'left', 'right'], 'top'),
    size: size,
    orient: S.oneOf(props['Artwork orientation'], ['portrait', 'landscape'], 'portrait'),
    bg: S.hex(c[0], '#ffffff'), ink: S.hex(c[1], '#111111'), accent: S.hex(c[2], '#2b6cb0'),
    zoom: S.num(props['_Artwork zoom'], 1, 3, 1),
    px: S.num(props['_Artwork pan x'], -1, 1, 0),
    py: S.num(props['_Artwork pan y'], -1, 1, 0),
    img: null,
    title: '', badge: '', subtitle: '', caption: '', contact: '', cta: '', price: '', oldPrice: ''
  };
  T.uses.forEach(function (f) { s[f] = S.str(props[propName(key, f)], 200); });
  return { s: s, imageUrl: S.cdnUrl(props['_Artwork image']) };
}

export async function renderPoster(deps, props, opts) {
  opts = opts || {};
  const parsed = parseProps(props);
  let img = null;
  if (parsed.imageUrl) {
    deps.cache = deps.cache || new Map();
    if (!deps.cache.has(parsed.imageUrl)) deps.cache.set(parsed.imageUrl, await deps.loadImage(await S.fetchImageBuffer(parsed.imageUrl)));
    img = deps.cache.get(parsed.imageUrl);
  }
  // Everything below is synchronous, so the shared drawing state cannot be mixed up between orders.
  state = parsed.s; state.img = img;
  const d = DIM[state.size], portrait = state.orient === 'portrait';
  const l = Math.round(800 * d[1] / d[0]);
  W = portrait ? 800 : l; H = portrait ? l : 800;
  const dpi = opts.dpi || 300, maxPixels = opts.maxPixels || 20000000;
  let pxW = (portrait ? d[0] : d[1]) / 25.4 * dpi, pxH = (portrait ? d[1] : d[0]) / 25.4 * dpi;
  if (pxW * pxH > maxPixels) { const f = Math.sqrt(maxPixels / (pxW * pxH)); pxW *= f; pxH *= f; }
  pxW = Math.round(pxW); pxH = Math.round(pxH);
  const canvas = deps.createCanvas(pxW, pxH);
  ctx = canvas.getContext('2d');
  const scale = pxW / W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  P = pal(); photoBoxes = [];
  TPL[state.template].draw();
  return { png: canvas.toBuffer('image/png'), width: pxW, height: pxH, label: (state.size === 'card' ? 'card' : state.size.toUpperCase()) + '-' + state.orient };
}

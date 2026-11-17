import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GlobalFonts } from '@napi-rs/canvas';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');

// The server has no system fonts, so the editor's font names are mapped to open fonts that
// have the same letter widths (Gelasio ~ Georgia, Arimo ~ Arial, Cousine ~ Courier New,
// Liberation Sans Narrow ~ Arial Narrow). Same widths means text wraps like it did in the preview.
export const FONT_STACKS_POSTER = {
  serif: 'Gelasio, Georgia, "Times New Roman", serif',
  sans: 'Arimo, "Helvetica Neue", Helvetica, Arial, sans-serif',
  condensed: '"Liberation Sans Narrow", "Arial Narrow", "Roboto Condensed", sans-serif',
  mono: 'Cousine, "Courier New", Courier, monospace'
};
export const FONT_STACKS_CARD = {
  sans: 'Montserrat, Arimo, "Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: FONT_STACKS_POSTER.serif,
  condensed: FONT_STACKS_POSTER.condensed,
  mono: FONT_STACKS_POSTER.mono
};

let registered = null;

// Registers every .ttf / .otf in /fonts. The family name is the start of the file name:
// Montserrat-Bold.ttf and Montserrat[wght].ttf both become "Montserrat".
export function registerFonts() {
  if (registered !== null) return registered;
  let count = 0;
  if (fs.existsSync(FONT_DIR)) {
    for (const file of fs.readdirSync(FONT_DIR)) {
      if (!/\.(ttf|otf)$/i.test(file)) continue;
      const family = file.replace(/\.(ttf|otf)$/i, '').split(/[-\[]/)[0].replace(/([a-z])([A-Z])/g, '$1 $2');
      if (GlobalFonts.registerFromPath(path.join(FONT_DIR, file), family)) count++;
    }
  }
  registered = count;
  return count;
}

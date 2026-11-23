// The kit compositor: the kit's base colour texture from kit_mask.png, four colours and the glyph atlases, composed
// the way the build composes it (art\tex2d\kit: kit_design.paint_prints, kit_glyphs.text_coverage,
// kit_design.quantise_mask, and the contract's kit_base_colour).
//
//   1. The four text prints (name_bar, back_number, sleeve_number_l, sleeve_number_r of layout_kit.json) are cleared:
//      inside each print's box the ink weight of the shipped text goes back to the island's ground channel. Under
//      every text print of the shipped mask there is nothing but that ground and the ink (measured: G = B = 0 and
//      R + A = 255 there), so a cleared print is plain jersey again. The crest is not a text print: it stays, unless
//      a logo is set (setLogo), and then its square goes back to the island's ground channel too (the whole disc,
//      ink and accent alike) and the logo is painted over the coloured result (step 4).
//   2. The new text is stamped where the build stamps it. The build draws each print in the island's cloth frame on
//      a grid four times finer than the texture, in a box of round(width x 4 x px_per_cm) by round(height x 4 x
//      px_per_cm) fine pixels whose top-left corner is rounded to that grid; the cap (or glyph) height is the
//      layout's; the glyphs are set on their own advances plus a tracking of 0.06 cap heights; the line is cut to
//      its ink, squeezed horizontally to the box less a side margin of 0.02 box heights when it is too long,
//      centred in the width (floor) with its baseline on round(0.5 x (box height + cap)) (half to even, as Python
//      rounds). Each fine pixel takes the glyph's coverage from the atlas's signed distance field; each texel is the
//      mean of its 4 x 4 fine pixels. Painted "over" the cleared mask and quantised to channels that sum to 255.
//   3. The base colour: per texel, the four colours turned sRGB -> linear, weighted by the mask, summed, clipped,
//      turned back to sRGB, x 255, rounded half up. Done in float32 steps as the contract's numpy code does, once per
//      distinct mask value (a kit mask has a few hundred) and looked up per texel.
//   4. A logo (any picture with straight alpha) is fitted whole into the crest's box (contain: as large as fits, its
//      shape kept, centred), sampled bilinearly at each texel centre in the island's cloth frame (upright as the text
//      is) and laid "over" the base colour in sRGB bytes. Its transparent parts show the cleared jersey. It is laid
//      again after every colour change, so it follows the kit.
//
// The atlas is not the font, so the edges of a glyph differ a little from the build's; everything else is the same
// bytes. build\customizer\test_compose.py holds the page to the shipped textures and to the build's own code.
import { base64ToBytes, decodePNG } from './png.js';

export const CHANNELS = ['field', 'accent1', 'accent2', 'ink'];
export const TEXT_PRINTS = ['name_bar', 'back_number', 'sleeve_number_l', 'sleeve_number_r'];
export const NAME_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ.-' ";
const SS = 4;                                   // kit_design.PRINT_SUPERSAMPLE
const SIDE_MARGIN_OF_HEIGHT = 0.02;             // kit_glyphs.SIDE_MARGIN_OF_HEIGHT
const F = Math.fround;

// ------------------------------------------------------------------ text rules (kit_glyphs.clean_name / clean_number)
export function cleanName(name, maxGlyphs = 10) {
  const up = String(name ?? '').toUpperCase().replace(/[^A-Z.\-' ]/g, '');
  return up.split(' ').filter(Boolean).join(' ').slice(0, maxGlyphs).trimEnd();
}

export function cleanNumber(n) {
  const v = Math.trunc(Number(n));
  return Number.isFinite(v) ? Math.min(99, Math.max(0, v)) : 0;
}

function roundHalfEven(x) {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

// ------------------------------------------------------------------ colour (A.kit_base_colour in float32 steps)
function srgbToLinear(v) { return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
const C_THRESH = F(0.0031308), C_LIN = F(12.92), C_A = F(1.055), C_B = F(0.055), C_EXP = F(1 / 2.4), C_MIN = F(1e-12);

function colourTable(colours) {
  return CHANNELS.map((ch) => colours[ch].map((v) => F(srgbToLinear(v / 255))));
}

// mask bytes (r, g, b, a) -> sRGB bytes packed as 0xAABBGGRR (little-endian RGBA, alpha 255)
function baseColour32(m0, m1, m2, m3, table) {
  const w = [F(m0 / 255), F(m1 / 255), F(m2 / 255), F(m3 / 255)];
  let packed = 0xff000000 >>> 0;
  for (let j = 0; j < 3; j++) {
    let lin = 0;
    for (let i = 0; i < 4; i++) lin = F(lin + F(w[i] * table[i][j]));
    lin = Math.min(Math.max(lin, 0), 1);
    let s = lin <= C_THRESH ? F(C_LIN * lin) : F(F(C_A * F(Math.pow(Math.max(lin, C_MIN), C_EXP))) - C_B);
    s = Math.min(Math.max(s, 0), 1);
    const byte = Math.floor(F(F(s * 255) + 0.5));
    packed = (packed | (byte << (8 * j))) >>> 0;
  }
  return packed;
}

// ------------------------------------------------------------------ the mask's quantiser (kit_design.quantise_mask)
const qScaled = new Float64Array(4), qBase = new Int32Array(4);
function quantiseInto(w, out, o) {
  let sum = 0;
  for (let i = 0; i < 4; i++) { qScaled[i] = Math.min(Math.max(w[i], 0), 1); sum += qScaled[i]; }
  const k = 255 / Math.max(sum, 1e-12);
  let total = 0;
  for (let i = 0; i < 4; i++) { qScaled[i] *= k; qBase[i] = Math.floor(qScaled[i] + 1e-9); total += qBase[i]; }
  let left = Math.round(255 - total);
  if (left > 0) {
    const order = [0, 1, 2, 3].sort((a, b) => (qScaled[b] - qBase[b]) - (qScaled[a] - qBase[a]) || a - b);
    for (let r = 0; r < left && r < 4; r++) qBase[order[r]] += 1;
  }
  for (let i = 0; i < 4; i++) out[o + i] = qBase[i];
}

// ------------------------------------------------------------------ glyph atlases
// The zero level of the distance field, found with sub-pixel care: [L, R] across and [T, B] down, in atlas pixels.
function shapeExtents(sdf, W, cell) {
  const [x0, y0, x1, y1] = cell;
  let L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
  const at = (x, y) => sdf[y * W + x];
  for (let y = y0; y < y1; y++) {
    let first = -1, last = -1;
    for (let x = x0; x < x1; x++) if (at(x, y) >= 128) { if (first < 0) first = x; last = x; }
    if (first < 0) continue;
    const u = first > x0 ? at(first - 1, y) : 0, v = at(first, y);
    L = Math.min(L, first - 0.5 + (127.5 - u) / Math.max(1, v - u));
    const p = at(last, y), q = last + 1 < x1 ? at(last + 1, y) : 0;
    R = Math.max(R, last + 0.5 + (p - 127.5) / Math.max(1, p - q));
  }
  for (let x = x0; x < x1; x++) {
    let first = -1, last = -1;
    for (let y = y0; y < y1; y++) if (at(x, y) >= 128) { if (first < 0) first = y; last = y; }
    if (first < 0) continue;
    const u = first > y0 ? at(x, first - 1) : 0, v = at(x, first);
    T = Math.min(T, first - 0.5 + (127.5 - u) / Math.max(1, v - u));
    const p = at(x, last), q = last + 1 < y1 ? at(x, last + 1) : 0;
    B = Math.max(B, last + 0.5 + (p - 127.5) / Math.max(1, p - q));
  }
  return { L, R, T, B };
}

function prepareAtlas(img, doc) {
  const n = img.width * img.height;
  const sdf = new Uint8Array(n);
  for (let i = 0; i < n; i++) sdf[i] = img.data[i * 4 + 3];
  const atlas = { w: img.width, h: img.height, sdf, spread: doc.spread_px, cap: doc.cap_height_px, glyphs: {} };
  for (const [ch, e] of Object.entries(doc.glyphs)) {
    if (!e.ink_px) continue;
    atlas.glyphs[ch] = { ch, cell: e.cell_px, ox: e.origin_px[0], oy: e.origin_px[1], adv: e.advance_px,
      ...shapeExtents(sdf, img.width, e.cell_px) };
  }
  return atlas;
}

// Signed distance (atlas pixels, + inside) at a point of the atlas, bilinear between pixel centres, nothing
// read outside the glyph's own cell.
function sdfDistance(atlas, g, xa, ya) {
  const [cx0, cy0, cx1, cy1] = g.cell;
  const fx = xa - 0.5, fy = ya - 0.5;
  const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const W = atlas.w, s = atlas.sdf;
  const v = (x, y) => (x < cx0 || y < cy0 || x >= cx1 || y >= cy1 ? 0 : s[y * W + x]);
  const top = v(ix, iy) * (1 - tx) + v(ix + 1, iy) * tx;
  const bot = v(ix, iy + 1) * (1 - tx) + v(ix + 1, iy + 1) * tx;
  const val = top * (1 - ty) + bot * ty;
  return (val / 255 - 0.5) * 2 * atlas.spread;
}

// ------------------------------------------------------------------ the compositor
export class KitComposer {
  // data: { mask, digits, letters (decoded PNGs), glyphs (glyphs.json), layout (atlas, islands, prints) }
  constructor({ mask, digits, letters, glyphs, layout }) {
    if (mask.width !== mask.height) throw new Error('the kit mask must be square');
    this.S = mask.width;
    this.layout = layout;
    this.glyphDoc = glyphs;
    this.digits = prepareAtlas(digits, glyphs.atlases.digits);
    this.letters = prepareAtlas(letters, glyphs.atlases.letters);
    this.spaceOfCap = glyphs.space_advance_of_cap;
    this.trackOfCap = glyphs.tracking_of_cap;
    this.shipped = mask.data;
    this.work = new Uint8Array(mask.data);                          // the mask as composed now
    this.work32 = new Uint32Array(this.work.buffer);
    this.out = new Uint8Array(this.S * this.S * 4);                  // the base colour, RGBA, row 0 at the top
    this.out32 = new Uint32Array(this.out.buffer);
    this.prints = TEXT_PRINTS.map((name) => this._printGeometry(name));
    for (const p of this.prints) this._clear(p);
    // the crest: the one print that is not text; a logo takes its place
    this.crest = layout.prints.crest && layout.islands[layout.prints.crest.island] ? this._printGeometry('crest') : null;
    this.logo = null;
    this.logoDirty = false;
    this._buildIndex();
    this.texts = null;
    this.colours = null;
    this.table = null;
    this.ms = {};
  }

  static async fromBase64({ mask, digits, letters, glyphs, layout }) {
    const [m, d, l] = await Promise.all([mask, digits, letters].map((b64) => decodePNG(base64ToBytes(b64))));
    return new KitComposer({ mask: m, digits: d, letters: l, glyphs, layout });
  }

  // ---------------------------------------------------------------- geometry of a print
  _printGeometry(name) {
    const pr = this.layout.prints[name];
    const isl = this.layout.islands[pr.island];
    if (!pr || !isl) throw new Error(`layout has no print ${name} on its island`);
    const S = this.S, atlas = this.layout.atlas;
    const ppc = atlas.px_per_cm * S / atlas.size_px;                 // texels per centimetre (kit_frame.render_px_per_cm)
    const [u0, v0, u1, v1] = isl.rect_uv;
    const rot = ((isl.rotation % 360) + 360) % 360;
    // (a, b) cloth centimetres of an atlas point (x right, y down, in texels): A.island_uv_to_cm
    const cloth = (x, y) => {
      const u = x / S, v = 1 - y / S, k = S / ppc;                  // centimetres per unit of UV
      if (rot === 0) return [(u - u0) * k, (v - v0) * k];
      if (rot === 90) return [(v - v0) * k, (u1 - u) * k];
      if (rot === 180) return [(u1 - u) * k, (v1 - v) * k];
      return [(v1 - v) * k, (u - u0) * k];
    };
    // the cloth-oriented texel grid (kit_frame.IslandFrame arrays): x along +a, y along -b, texel edges on integers
    const toCloth = (x, y) => (rot === 0 ? [x, y] : rot === 90 ? [-y, x] : rot === 180 ? [-x, -y] : [y, -x]);
    const fromCloth = (tx, ty) => (rot === 0 ? [tx, ty] : rot === 90 ? [ty, -tx] : rot === 180 ? [-tx, -ty] : [-ty, tx]);
    const [ta, tb] = toCloth(0, 0), [a00, b00] = cloth(0, 0);
    const offA = ta - a00 * ppc, offB = tb + b00 * ppc;              // tx = a * ppc + offA, ty = offB - b * ppc
    const [a0, b0, a1, b1] = pr.rect_cm;
    const boxX = roundHalfEven(SS * (a0 * ppc + offA)) / SS;         // fine.px(a0, b1), rounded to the fine grid
    const boxY = roundHalfEven(SS * (offB - b1 * ppc)) / SS;
    const wF = roundHalfEven((a1 - a0) * ppc * SS), hF = roundHalfEven((b1 - b0) * ppc * SS);
    const capF = (pr.cap_height_cm ?? pr.glyph_height_cm ?? (b1 - b0)) * ppc * SS;
    // the texels the box touches, in the atlas
    const corners = [[boxX, boxY], [boxX + wF / SS, boxY], [boxX, boxY + hF / SS], [boxX + wF / SS, boxY + hF / SS]].map(([x, y]) => fromCloth(x, y));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    const c0 = Math.max(0, Math.floor(Math.min(...xs))), c1 = Math.min(S, Math.ceil(Math.max(...xs)));
    const r0 = Math.max(0, Math.floor(Math.min(...ys))), r1 = Math.min(S, Math.ceil(Math.max(...ys)));
    const ground = CHANNELS.indexOf(isl.ground);
    return { name, island: pr.island, rot, toCloth, fromCloth, boxX, boxY, wF, hF, capF, ppc, ground,
      digits: name !== 'name_bar', maxGlyphs: pr.max_glyphs, region: [c0, r0, c1, r1], cleared: null,
      rectAtlas: [pr.rect_uv[0] * S, (1 - pr.rect_uv[3]) * S, pr.rect_uv[2] * S, (1 - pr.rect_uv[1]) * S] };
  }

  // Give the ink inside the print's box back to the ground channel; keep the cleared bytes of the region.
  _clear(p) {
    const S = this.S, [c0, r0, c1, r1] = p.region, w = c1 - c0;
    p.cleared = new Uint8Array(w * (r1 - r0) * 4);
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const i = (r * S + c) * 4, o = ((r - r0) * w + (c - c0)) * 4;
      const px = [this.shipped[i], this.shipped[i + 1], this.shipped[i + 2], this.shipped[i + 3]];
      if (p.ground !== 3) { px[p.ground] += px[3]; px[3] = 0; }
      p.cleared.set(px, o);
      this.work.set(px, i);
    }
  }

  // ---------------------------------------------------------------- text layout (kit_glyphs._line, text_coverage)
  glyphOf(ch, digits) {
    const atlas = digits ? this.digits : this.letters;
    return atlas.glyphs[ch] ? { atlas, g: atlas.glyphs[ch] } : null;
  }

  // One line of text with cap height capF (pixels): glyph items with pen positions, and the ink's columns.
  layoutLine(text, capF, digits) {
    const track = this.trackOfCap * capF;
    const items = [];
    let x = 0, left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (const ch of text) {
      const pen = x;
      // the build's pen steps are the font's advances at its size in whole pixels (PIL's basic layout): rounded here too
      if (ch === ' ') { x += Math.round(this.spaceOfCap * capF) + track; continue; }
      const hit = this.glyphOf(ch, digits);
      if (!hit) continue;
      const s = capF / hit.atlas.cap;
      items.push({ atlas: hit.atlas, g: hit.g, s, pen });
      left = Math.min(left, pen + (hit.g.L - hit.g.ox) * s);
      right = Math.max(right, pen + (hit.g.R - hit.g.ox) * s);
      top = Math.min(top, (hit.g.T - hit.g.oy) * s);
      bottom = Math.max(bottom, (hit.g.B - hit.g.oy) * s);
      x += Math.round(hit.g.adv * s) + track;
    }
    if (!items.length) return null;
    const lineLeft = Math.floor(left);
    return { items, lineLeft, lineW: Math.ceil(right) - lineLeft, top, bottom };
  }

  // The text in a box of wF x hF fine pixels, as text_coverage places it.
  layoutBox(text, wF, hF, capF, digits) {
    if (!text || !text.trim() || wF < 2 || hF < 2) return null;
    const line = this.layoutLine(text, capF, digits);
    if (!line) return null;
    const room = Math.max(1, Math.floor(wF - 2 * SIDE_MARGIN_OF_HEIGHT * hF));
    let xs = 1, lw = line.lineW;
    if (lw > room) { xs = room / lw; lw = room; }
    const x0 = Math.floor((wF - lw) / 2);
    const baseRow = roundHalfEven(0.5 * (hF + capF));
    return { ...line, xs, lw, x0, baseRow, wF, hF,
      ink: [x0 - 2, baseRow + line.top - 2, x0 + lw + 2, baseRow + line.bottom + 2] };   // fine pixels, padded
  }

  // Coverage 0..1 of the fine pixel whose centre is (px, py) in box pixels.
  coverageAt(lay, px, py) {
    const xl = px - lay.x0;
    if (xl < 0 || xl >= lay.lw) return 0;
    const X = lay.lineLeft + xl / lay.xs;
    const yRel = py - lay.baseRow;
    let keep = 1;
    for (const it of lay.items) {
      const g = it.g, pad = 1.5 / (it.s * lay.xs) + 0.5;
      const xa = g.ox + (X - it.pen) / it.s;
      if (xa < g.L - pad || xa > g.R + pad) continue;
      const ya = g.oy + yRel / it.s;
      if (ya < g.T - pad || ya > g.B + pad) continue;
      const d = sdfDistance(it.atlas, g, xa, ya) * it.s * lay.xs;
      const c = d >= 0.5 ? 1 : d <= -0.5 ? 0 : d + 0.5;
      keep *= 1 - c;
      if (keep === 0) break;
    }
    return 1 - keep;
  }

  // Signed distance in fine pixels (+ inside) from (px, py) to the nearest glyph of the line, as coverageAt measures it.
  distanceAt(lay, px, py) {
    const xl = px - lay.x0;
    if (xl < -8 || xl >= lay.lw + 8) return -99;
    const X = lay.lineLeft + xl / lay.xs;
    const yRel = py - lay.baseRow;
    let best = -99;
    for (const it of lay.items) {
      const g = it.g, reach = 8 / (it.s * lay.xs) + 1;
      const xa = g.ox + (X - it.pen) / it.s;
      if (xa < g.L - reach || xa > g.R + reach) continue;
      const ya = g.oy + yRel / it.s;
      if (ya < g.T - reach || ya > g.B + reach) continue;
      best = Math.max(best, sdfDistance(it.atlas, g, xa, ya) * it.s * lay.xs);
    }
    return best;
  }

  // ---------------------------------------------------------------- stamping
  _stamp(p, text) {
    const S = this.S, [c0, r0, c1, r1] = p.region, w = c1 - c0;
    const lay = this.layoutBox(text, p.wF, p.hF, p.capF, p.digits);
    p.layout = lay;
    p.text = text;
    const wts = new Float64Array(4);
    let inked = 0;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const i = (r * S + c) * 4, o = ((r - r0) * w + (c - c0)) * 4;
      let cov = 0;
      if (lay) {
        // the texel's centre in the box's fine pixels, for a quick test against the ink's box
        const [tx, ty] = p.toCloth(c + 0.5, r + 0.5);
        const bx = (tx - p.boxX) * SS, by = (ty - p.boxY) * SS;
        // A texel whose centre is over 3 fine pixels inside or outside every glyph has its 16 samples all at 1 or all
        // at 0 (they lie within 2.2 fine pixels of the centre, and a sample's ramp is 1 fine pixel wide): no sampling.
        // The box's own border is excluded from the shortcut, since the box clips the samples there.
        if (bx > lay.ink[0] - SS && bx < lay.ink[2] + SS && by > lay.ink[1] - SS && by < lay.ink[3] + SS) {
          const inBox = bx > SS && by > SS && bx < p.wF - SS && by < p.hF - SS;
          const dc = inBox ? this.distanceAt(lay, bx, by) : 0;
          if (inBox && dc <= -3) cov = 0;
          else if (inBox && dc >= 3) cov = 1;
          else {
            let sum = 0;
            for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
              const [sx, sy] = p.toCloth(c + (si + 0.5) / SS, r + (sj + 0.5) / SS);
              const fi = Math.floor((sx - p.boxX) * SS), fj = Math.floor((sy - p.boxY) * SS);
              if (fi < 0 || fj < 0 || fi >= p.wF || fj >= p.hF) continue;
              sum += this.coverageAt(lay, fi + 0.5, fj + 0.5);
            }
            cov = sum / (SS * SS);
          }
        }
      }
      if (cov <= 0) { this.work.set(p.cleared.subarray(o, o + 4), i); continue; }
      inked++;
      const keep = 1 - cov;
      for (let k = 0; k < 4; k++) wts[k] = (p.cleared[o + k] / 255) * keep;
      wts[3] += cov;
      quantiseInto(wts, this.work, i);
    }
    p.inkedTexels = inked;
  }

  // ---------------------------------------------------------------- the palette of mask values
  _buildIndex() {
    const n = this.S * this.S;
    this.pal = new Map();
    this.palVals = [];
    this.palRGBA = new Uint32Array(1024);
    this.palColoured = 0;
    this.index = new Uint16Array(n);
    let last = -1, lastIdx = 0;
    for (let i = 0; i < n; i++) {
      const v = this.work32[i];
      if (v !== last) { last = v; lastIdx = this._palOf(v); }
      this.index[i] = lastIdx;
    }
  }

  _palOf(v) {
    let k = this.pal.get(v);
    if (k === undefined) {
      k = this.palVals.length;
      if (k >= 65535) throw new Error('too many distinct mask values');
      this.pal.set(v, k);
      this.palVals.push(v);
    }
    return k;
  }

  _indexRegion(p) {
    const S = this.S, [c0, r0, c1, r1] = p.region;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const i = r * S + c;
      this.index[i] = this._palOf(this.work32[i]);
    }
  }

  _colourPalette() {
    if (this.palRGBA.length < this.palVals.length) {
      const grown = new Uint32Array(Math.max(this.palVals.length, this.palRGBA.length * 2));
      grown.set(this.palRGBA.subarray(0, this.palColoured));
      this.palRGBA = grown;
    }
    for (let k = this.palColoured; k < this.palVals.length; k++) {
      const v = this.palVals[k];
      this.palRGBA[k] = baseColour32(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24, this.table);
    }
    this.palColoured = this.palVals.length;
  }

  // ---------------------------------------------------------------- the logo in place of the crest
  // img: { width, height, data: RGBA bytes with straight (not premultiplied) alpha, row 0 at the top }, or null for
  // the crest again. Takes effect at the next compose().
  setLogo(img) {
    const p = this.crest;
    if (!p) throw new Error('the layout has no crest print');
    if (img && !(img.width > 0 && img.height > 0 && img.data && img.data.length >= img.width * img.height * 4)) throw new Error('a logo needs width, height and RGBA data');
    this.logo = img ? { width: img.width, height: img.height, data: img.data } : null;
    const S = this.S, [c0, r0, c1, r1] = p.region, sh = this.shipped, wk = this.work;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const i = (r * S + c) * 4;
      if (img) {
        const sum = sh[i] + sh[i + 1] + sh[i + 2] + sh[i + 3];
        wk[i] = wk[i + 1] = wk[i + 2] = wk[i + 3] = 0;
        wk[i + p.ground] = Math.min(255, sum);
      } else wk.set(sh.subarray(i, i + 4), i);
    }
    this._indexRegion(p);
    this.logoDirty = true;
  }

  // The logo's place in the crest's box, in cloth texels: [x0, y0, x1, y1] and texels per logo pixel.
  _logoFit() {
    const p = this.crest, L = this.logo;
    const bw = p.wF / SS, bh = p.hF / SS;
    const k = Math.min(bw / L.width, bh / L.height);
    const x0 = p.boxX + (bw - L.width * k) / 2, y0 = p.boxY + (bh - L.height * k) / 2;
    return { k, fit: [x0, y0, x0 + L.width * k, y0 + L.height * k] };
  }

  _paintLogo() {
    const p = this.crest, L = this.logo, S = this.S, out = this.out, src = L.data, LW = L.width, LH = L.height;
    const { k, fit } = this._logoFit();
    const [c0, r0, c1, r1] = p.region;
    const px = [0, 0, 0, 0];
    // one logo pixel, premultiplied, 0 outside the picture (so its edges fade over one pixel)
    const tap = (x, y, w) => {
      if (w <= 0 || x < 0 || y < 0 || x >= LW || y >= LH) return;
      const o = (y * LW + x) * 4, a = src[o + 3] / 255;
      px[0] += w * src[o] * a; px[1] += w * src[o + 1] * a; px[2] += w * src[o + 2] * a; px[3] += w * a;
    };
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const [tx, ty] = p.toCloth(c + 0.5, r + 0.5);
      const u = (tx - fit[0]) / k - 0.5, v = (ty - fit[1]) / k - 0.5;
      if (u <= -1 || v <= -1 || u >= LW || v >= LH) continue;
      const ix = Math.floor(u), iy = Math.floor(v), fx = u - ix, fy = v - iy;
      px[0] = px[1] = px[2] = px[3] = 0;
      tap(ix, iy, (1 - fx) * (1 - fy)); tap(ix + 1, iy, fx * (1 - fy)); tap(ix, iy + 1, (1 - fx) * fy); tap(ix + 1, iy + 1, fx * fy);
      const a = px[3];
      if (a <= 0) continue;
      const o = (r * S + c) * 4;
      for (let j = 0; j < 3; j++) out[o + j] = Math.min(255, Math.max(0, Math.round(px[j] + (1 - a) * out[o + j])));
    }
  }

  // Where the crest is and what holds it, in atlas pixels (x right, y down), for tools and tests.
  crestInfo() {
    const p = this.crest;
    if (!p) return null;
    const info = { rect: p.rectAtlas, region: p.region, box: [p.boxX, p.boxY, p.boxX + p.wF / SS, p.boxY + p.hF / SS],
      island: p.island, ground: CHANNELS[p.ground], logo: null };
    if (this.logo) info.logo = { width: this.logo.width, height: this.logo.height, fit: this._logoFit().fit.map((v) => +v.toFixed(3)) };
    return info;
  }

  // ---------------------------------------------------------------- the public step
  // texts: { number: 0..99, name: string }; colours: { field, accent1, accent2, ink: [r, g, b] sRGB 8-bit }.
  // Returns what changed: { texts, colours, logo } (all false when nothing did).
  compose({ number, name }, colours) {
    const t0 = performance.now();
    const logoChanged = this.logoDirty;
    const num = String(cleanNumber(number));
    const nm = cleanName(name, this.layout.prints.name_bar.max_glyphs || 10);
    const textKey = `${num}|${nm}`;
    const colourKey = CHANNELS.map((ch) => colours[ch].join(',')).join('|');
    const textsChanged = textKey !== this.texts, coloursChanged = colourKey !== this.colours;
    if (textsChanged) {
      for (const p of this.prints) {
        const text = p.name === 'name_bar' ? nm : num;
        if (p.text === text && p.layout !== undefined) continue;
        this._stamp(p, text);
        this._indexRegion(p);
        p.dirty = true;
      }
      this.texts = textKey;
    }
    const t1 = performance.now();
    if (coloursChanged) {
      this.table = colourTable(colours);
      this.palColoured = 0;
      this.colours = colourKey;
    }
    this._colourPalette();
    const recolour = (region) => {
      const [c0, r0, c1, r1] = region;
      for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
        const i = r * this.S + c;
        this.out32[i] = this.palRGBA[this.index[i]];
      }
    };
    let crestPainted = false;
    if (coloursChanged || this.out32[0] === 0) {
      const n = this.S * this.S, idx = this.index, pal = this.palRGBA, out = this.out32;
      for (let i = 0; i < n; i++) out[i] = pal[idx[i]];
      crestPainted = true;
    } else {
      if (textsChanged) for (const p of this.prints) if (p.dirty) recolour(p.region);
      if (logoChanged && this.crest) { recolour(this.crest.region); crestPainted = true; }
    }
    if (crestPainted && this.logo) this._paintLogo();
    for (const p of this.prints) p.dirty = false;
    this.logoDirty = false;
    this.ms = { stamp: Math.round(t1 - t0), colour: Math.round(performance.now() - t1), palette: this.palVals.length };
    return { texts: textsChanged, colours: coloursChanged, logo: logoChanged };
  }

  // Where each print is and what it holds, in atlas pixels (x right, y down), for tools and tests.
  info() {
    return this.prints.map((p) => {
      const lay = p.layout;
      let ink = null;
      if (lay) {
        const pts = [[lay.ink[0], lay.ink[1]], [lay.ink[2], lay.ink[3]]].map(([bx, by]) => p.fromCloth(p.boxX + bx / SS, p.boxY + by / SS));
        ink = [Math.min(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1]), Math.max(pts[0][0], pts[1][0]), Math.max(pts[0][1], pts[1][1])];
      }
      return { name: p.name, island: p.island, text: p.text, rect: p.rectAtlas, region: p.region,
        box: [p.boxX, p.boxY, p.boxX + p.wF / SS, p.boxY + p.hF / SS], fine: [p.wF, p.hF], capFine: p.capF,
        xScale: lay ? +lay.xs.toFixed(4) : 1, inkBox: ink, inkedTexels: p.inkedTexels || 0,
        line: lay ? { lineLeft: lay.lineLeft, lineW: lay.lineW, width: lay.lw, x0: lay.x0, baseRow: lay.baseRow,
          pens: lay.items.map((it) => +it.pen.toFixed(3)) } : null };
    });
  }
}

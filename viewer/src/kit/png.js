// A small PNG decoder: 8-bit greyscale, grey + alpha, RGB or RGBA, not interlaced.
//
// Why not an <img> and a canvas: a 2D canvas stores premultiplied alpha. kit_mask.png keeps the ink weight in its
// alpha channel, and where the ink is 0 a canvas would throw the other three channels away. The glyph atlases keep a
// distance field in alpha the same way. So the bytes are decoded here, exactly as they are in the file. The zlib
// stream is inflated by the browser's own DecompressionStream; nothing is fetched.

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

export function base64ToBytes(b64) {
  if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(b64);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function inflate(bytes) {
  if (typeof DecompressionStream !== 'function') throw new Error('this browser cannot inflate PNG data (no DecompressionStream)');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// -> { width, height, data: Uint8Array RGBA, row 0 at the top }
export async function decodePNG(bytes) {
  for (let i = 0; i < 8; i++) if (bytes[i] !== SIGNATURE[i]) throw new Error('not a PNG file');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 8, width = 0, height = 0, depth = 0, type = -1, interlace = 0, total = 0;
  const parts = [];
  while (pos + 8 <= bytes.length) {
    const len = view.getUint32(pos);
    const name = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (name === 'IHDR') {
      width = view.getUint32(pos + 8); height = view.getUint32(pos + 12);
      depth = bytes[pos + 16]; type = bytes[pos + 17]; interlace = bytes[pos + 20];
    } else if (name === 'IDAT') { parts.push(bytes.subarray(pos + 8, pos + 8 + len)); total += len; }
    else if (name === 'IEND') break;
    pos += 12 + len;
  }
  const channels = CHANNELS[type];
  if (depth !== 8 || !channels || interlace !== 0) throw new Error(`unsupported PNG (bit depth ${depth}, colour type ${type}, interlace ${interlace})`);
  const zipped = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { zipped.set(p, at); at += p.length; }
  const raw = await inflate(zipped);
  const stride = width * channels;
  if (raw.length < height * (stride + 1)) throw new Error('PNG data is short');
  const out = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride), line = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const off = y * (stride + 1), filter = raw[off];
    const src = raw.subarray(off + 1, off + 1 + stride);
    switch (filter) {
      case 0: line.set(src); break;
      case 1: for (let i = 0; i < stride; i++) line[i] = (src[i] + (i >= channels ? line[i - channels] : 0)) & 255; break;
      case 2: for (let i = 0; i < stride; i++) line[i] = (src[i] + prev[i]) & 255; break;
      case 3: for (let i = 0; i < stride; i++) line[i] = (src[i] + (((i >= channels ? line[i - channels] : 0) + prev[i]) >> 1)) & 255; break;
      case 4: for (let i = 0; i < stride; i++) {
        const a = i >= channels ? line[i - channels] : 0, c = i >= channels ? prev[i - channels] : 0;
        line[i] = (src[i] + paeth(a, prev[i], c)) & 255;
      } break;
      default: throw new Error(`bad PNG filter ${filter} on row ${y}`);
    }
    const o = y * width * 4;
    if (channels === 4) out.set(line, o);
    else for (let x = 0; x < width; x++) {
      const s = x * channels, d = o + x * 4;
      if (channels === 3) { out[d] = line[s]; out[d + 1] = line[s + 1]; out[d + 2] = line[s + 2]; out[d + 3] = 255; }
      else if (channels === 1) { out[d] = out[d + 1] = out[d + 2] = line[s]; out[d + 3] = 255; }
      else { out[d] = out[d + 1] = out[d + 2] = line[s]; out[d + 3] = line[s + 1]; }
    }
    const t = prev; prev = line; line = t;
  }
  return { width, height, data: out };
}

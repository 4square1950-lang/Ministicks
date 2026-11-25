import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const runtime = new URL('runtime/', root);
await mkdir(runtime, { recursive: true });
await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ['rink-tour.js'],
  nodePaths: [fileURLToPath(new URL('node_modules/', import.meta.url))],
  outfile: 'runtime/rink-tour.bundle.js',
  platform: 'browser',
  format: 'esm',
  bundle: true,
  minify: true,
  legalComments: 'inline',
  banner: { js: '/* Ministicks web runtime. Rebuild after npm ci in viewer with node viewer/build-rink-web.mjs. Three.js is MIT-licensed; see THREE-LICENSE.txt. */' },
});
await copyFile(new URL('node_modules/three/LICENSE', import.meta.url), new URL('THREE-LICENSE.txt', runtime));

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { campaignRoutes } = require('./district-online.cjs');
const campaign = campaignRoutes({allowedOrigin:process.env.MINISTICKS_CAMPAIGN_ORIGIN});

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.webp': 'image/webp',
  '.png': 'image/png',
};
const rootFiles = new Set(['index.html', 'rink-tour.js', 'rink-tour.css', 'sport-shell.css', 'credits-roll.js', 'credits-roll.css', 'rink-campaign.js', 'team-match.js', 'tour-land.json', 'rink-broadcast.js', 'runtime/rink-tour.bundle.js']);
const port = Number(process.env.MINISTICKS_PORT || 8096);
const server = http.createServer(async (request, response) => {
  let urlPath,url;
  try { url = new URL(request.url, 'http://localhost');urlPath = decodeURIComponent(url.pathname); }
  catch { response.writeHead(400).end(); return; }
  if (await campaign(request,response,url)) return;
  const name = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const file = path.resolve(__dirname, name);
  const relative = path.relative(__dirname, file).split(path.sep).join('/');
  const permitted = rootFiles.has(relative) || relative.startsWith('dist/') || relative.startsWith('viewer/node_modules/three/') || relative.startsWith('viewer/src/kit/') || relative === 'build/menu/menu_stand_anim.glb' || /^assets\/emblems\/[a-z-]+(?:\.webp|-mask\.png)$/.test(relative);
  const type = mime[path.extname(file)];
  if (!permitted || !type || !['HEAD', 'GET'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).on('error', () => response.destroy()).pipe(response);
  });
});
server.listen(port, process.env.MINISTICKS_HOST || '127.0.0.1', () => process.stdout.write('Ministicks: http://localhost:' + server.address().port + '\n'));

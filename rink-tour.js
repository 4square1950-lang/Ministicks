import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const $ = (id) => document.getElementById(id);
const canvasHost = $('homePreview');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
catch { canvasHost.textContent = 'Enable WebGL to open the 3D rink.'; }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, .1, 80);
const world = new THREE.Group();
scene.add(world, new THREE.HemisphereLight(0xe8f3ff, 0x8a6f5c, 2.1));
const lights = new THREE.DirectionalLight(0xffe7ce, 2.25);
lights.position.set(-3, 7, -2);
scene.add(lights);
scene.fog = new THREE.FogExp2(0x17232d, .036);
const floorMat = new THREE.MeshStandardMaterial({ roughness: .8 });
const wallMat = new THREE.MeshStandardMaterial();
const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e0 });
const blue = new THREE.MeshStandardMaterial({ color: 0x255475 });
const red = new THREE.MeshStandardMaterial({ color: 0xb43639 });
const addBox = (w, h, d, x, y, z, material) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  world.add(mesh);
  return mesh;
};
addBox(12, .15, 17, 0, -.075, 0, floorMat);
for (const side of [-1, 1]) {
  addBox(.17, .64, 17, side * 6, .32, 0, white);
  addBox(.19, .07, 17, side * 6, .67, 0, blue);
  addBox(.28, 4.8, 23, side * 9, 2.4, 1, wallMat);
  for (let z = -7; z <= 8; z += 2.5) {
    addBox(.31, .86, 1.6, side * 8.9, 3.1, z, blue);
    addBox(.35, .045, 1.65, side * 8.9, 2.65, z, white);
  }
}
addBox(18, 4.8, .25, 0, 2.4, 11, wallMat);
addBox(12, .68, .17, 0, .34, 8.5, white);
addBox(12, .68, .17, 0, .34, -8.5, white);
addBox(11.95, .014, .065, 0, .007, 0, red);
addBox(11.95, .014, .06, 0, .007, 6, blue);
const goalZ = 6.25;
const goalParts = world.children.length;
for (const x of [-1.65, 1.65]) {
  addBox(.069, 1.16, .069, x, .58, goalZ, red);
  addBox(.055, .055, .85, x, .025, goalZ+.42, red);
}
addBox(3.37, .07, .07, 0, 1.16, goalZ, red);
addBox(3.37, .04, .04, 0, .025, goalZ+.85, red);
for (let x = -1.6; x <= 1.61; x += .16) addBox(.009, 1.08, .009, x, .54, goalZ+.85, white);
for (let y = .06; y < 1.15; y += .12) addBox(3.25, .009, .009, 0, y, goalZ+.85, white);
for (const item of world.children.slice(goalParts)) {
  const reflected = item.clone();
  reflected.position.z *= -1;
  world.add(reflected);
}
const accent = (color) => new THREE.MeshStandardMaterial({ color, roughness: .73 });
const oak = accent(0x9f6b3d), concrete = accent(0x8a939a), maroon = accent(0x7c343b), navy = accent(0x243e55);
const basement = [
  ...[-7, -3.5, 0, 3.5, 7].map((x) => addBox(.18, 4.3, .24, x, 2.15, 10.8, oak)),
  addBox(3.4, .4, .65, 5.8, .19, 9.7, oak),
  addBox(2.4, .11, .34, -5.7, 2.45, 10.64, oak),
];
const recCentre = [
  ...[-4.5, 0, 4.5].map((x) => addBox(2.5, 2.6, .17, x, 2.01, 10.78, concrete)),
  addBox(4, .17, .62, -2.4, .25, 9.56, navy),
  addBox(4, .17, .62, 2.4, .25, 9.56, navy),
];
const gym = [
  ...[-6, -3, 3, 6].map((x) => addBox(.52, 1.47, .12, x, 3.14, 10.75, maroon)),
  addBox(2.1, 1.16, .12, 0, 3.17, 10.75, white),
  addBox(6, .34, .8, -4.6, .17, 9.69, oak),
];
const hall = [
  ...[-6.8, -5.1, -3.4, 3.4, 5.1, 6.8].map((x) => addBox(1.23, 3, .15, x, 2.43, 10.76, navy)),
  addBox(4.3, .49, 1.7, 0, .245, 9.95, concrete),
];
const championship = [];
for (let row = 0; row < 4; row++) {
  const y = .2 + row * .46;
  championship.push(
    addBox(13.7, .31, .44, 0, y, 8.88 + row * .48, concrete),
    addBox(13.4, .09, .23, 0, y + .2, 8.88 + row * .48, navy),
  );
}
const venueDetails = [basement, recCentre, gym, hall, championship];
const ball = new THREE.Mesh(new THREE.SphereGeometry(.045, 24, 14), new THREE.MeshStandardMaterial({color: 0xffb147, emissive: 0x653300, emissiveIntensity: .33}));
const target = new THREE.Mesh(new THREE.RingGeometry(.108, .133, 30), new THREE.MeshBasicMaterial({ color: 0xffd985, side: THREE.DoubleSide }));
scene.add(ball, target);



import { cities, setupTourMap } from './rink-campaign.js';
import { attackDirection, callTimeout, createTeamMatch, switchSkater, tapFaceoff, teamAction, tickTeamMatch } from './team-match.js';
import { buildBroadcastSet, buildHighlightReel, clubFor, clubs, divisions, makeSurface } from './rink-broadcast.js';
import { KitComposer } from './viewer/src/kit/compose.js';

const cap = (value, min, max) => Math.max(min, Math.min(max, value));
const key = 'ministicks.rink-tour.v1';
const mascots = ['🦊','🐼','🐯','🦁','🐸','🐷','🐨','🐰','🐲','🦄','🦉','🐺','🐻','🐧','🦋','🐙','🦕','🐠','🦜','🦩','🐬','🦈','🐢','🦝','🐭','🐱','🐶','🐮','🦅','🐴','🐘','🦔'];
const career = { name: 'Player', handle: 'player', bio: '', youtube: '', mascot: -1, nameChanged: 0, xp: 0,
  wins: [], matches: [], photos: [], champion: false, following: [], encountered: [], kit: { color: '#37688f', number: 9, name: 'PLAYER', height: 183, build: 0 } };
try { Object.assign(career, JSON.parse(localStorage.getItem(key) || '{}')); } catch {}
function save() {
  try { localStorage.setItem(key, JSON.stringify(career)); }
  catch { $('feedback').textContent = 'Storage is full. Progress may be lost when you close the page.'; }
}
const postseason = () => career.wins.length === cities.length || career.champion;
let page = 'home', selected = 0, mode = 'single', match, actors = [], leagueTab = 'standings', profileTab = 'summary', backFromProfile = 'home';
let kitDraft = { ...career.kit }, composer, kitTexture, district, dialogue;
const keys = new Set();
const aim = [0, 0];
const map = setupTourMap({ map: $('tourMap'), caption: $('mapCaption'), onSelect: selectCity });
const defaultClub = 'Toronto Titans';
const cityOpponents = ['Boston Huskies','Montreal Royals','Buffalo Beacons','Detroit Freighters','Winnipeg Warriors',
  'Saskatchewan Sovereigns','Edmonton Condors','Ottawa Outlaws','Thunder Bay T-Wolves','Minnesota Stars'];
const npcColors = [0x354c69, 0xe1b77b, 0xdd835f, 0x477864, 0xb05d58, 0xb98b50, 0x6d7e79, 0x386865, 0x4f6284, 0x786182];
const floorTextures = renderer ? makeSurface(renderer) : {};
const animateCrowd = buildBroadcastSet(world);
const reel = buildHighlightReel();
let reelTime=0, reelPaused=matchMedia('(prefers-reduced-motion: reduce)').matches, floorKey;
let commentary=false, heardEvent=0, commentaryUntil=0, crowdUntil=0;
const trackers = [0x80d8ff, 0xff8c65].map((color) => {
  const ring = new THREE.Mesh(new THREE.RingGeometry(.37,.43,36),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  return ring;
});
ball.scale.setScalar(1.45);

function material(color) { return new THREE.MeshStandardMaterial({ color, roughness: .84 }); }
const street = new THREE.Group();
scene.add(street);
function streetBox(mat, size, position, solid) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  street.add(mesh);
  if (solid) district.blockers.push({ x: position[0], z: position[2], w: size[0] / 2, d: size[2] / 2 });
  return mesh;
}
function label(text, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#13212b'; ctx.fillRect(0, 0, 512, 96);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fae5b6';
  ctx.font = 'bold 34px system-ui'; ctx.fillText(text, 256, 48, 475);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  sign.position.set(x, y, z); sign.scale.set(4.9, .92, 1); street.add(sign);
}
function buildDistrict() {
  for (const child of [...street.children]) {
    child.geometry?.dispose(); child.material?.map?.dispose();
    if (child.isSprite) child.material.dispose();
    street.remove(child);
  }
  for (const mat of district?.materials || []) mat.dispose();
  const stop = cities[selected];
  district = { x: 0, z: -9, yaw: 0, blockers: [], materials: [], targets: [], phase: 0 };
  const mat = (value) => { const item = material(value); district.materials.push(item); return item; };
  const ground = mat(0x596662), road = mat(0x353e46), sidewalk = mat(0xa2a29a);
  const building = mat(npcColors[selected]), trim = mat(0xd9cfc0), glass = mat(0x3e596e), dark = mat(0x1a2c39), park = mat(0x617b5f);
  streetBox(ground, [58, .15, 58], [0, -.12, 0]);
  streetBox(road, [49, .045, 4.4], [0, -.04, -3]);
  for (const z of [-6.25, .06]) streetBox(sidewalk, [49, .05, 2], [0, -.032, z]);
  for (let x = -24; x <= 24; x += 3) streetBox(trim, [1.37, .015, .065], [x, -.012, -3]);
  for (let index = 0; index < 9; index++) streetBox(trim, [.17, .018, 4.25], [(index - 4) * .28, -.008, -3]);
  const height = 4.8 + (selected % 4) * .83;
  const width = 10.5 + (selected % 3) * 1.15;
  const front = 6.4;
  streetBox(building, [width, height, 6], [0, height/2, front+3], true);
  streetBox(trim, [width+.35, .18, .09], [0, height-.27, front-.04]);
  streetBox(dark, [2.15, 2.5, .09], [0, 1.25, front-.07]);
  streetBox(trim, [.09, 2.48, .12], [0, 1.24, front-.13]);
  for (let side of [-1, 1]) {
    for (let index = 1; index <= 3; index++) streetBox(glass, [.76, 1.47, .13], [side * (.9 + index * 1.1), height*.52, front-.07]);
    for (let index = 0; index < 3; index++) {
      const h = 2.7 + ((selected * 3 + index + (side+1)) % 6) * .54;
      const x = side * (8.4 + index * 4.6);
      const z = 5.3 + (index % 2) * 2.6;
      streetBox(index % 2 ? sidewalk : building, [3.6, h, 4.2], [x, h/2, z], true);
      for (let offset of [-.95, .95]) streetBox(glass, [.72, 1.16, .08], [x + offset, h*.63, z-2.14]);
      streetBox(park, [1.4, .48, .68], [x, .24, z-2.8], true);
    }
  }
  streetBox(trim, [3.7, .16, .76], [0, 2.67, front-.36]);
  label(stop.arena, 0, 3.48, front-.52);
  label(stop.coach, -3.1, 2.16, 2.25);
  label('Arena staff', 3.3, 2.16, 3.7);
  district.targets = [
    { kind: 'arena', x: 0, z: front-.75 },
    { kind: 'coach', x: -3.1, z: 2.25, name: stop.coach, line: stop.tips, id: stop.id },
    { kind: 'staff', x: 3.3, z: 3.7, name: 'Arena staff', line: 'The arena entrance is under the sign. Head inside when you’re ready.' },
  ];
  district.blockers.push({ x: -3.1, z: 2.25, w: .31, d: .31 }, { x: 3.3, z: 3.7, w: .31, d: .31 });
}

function actor(asset, index, standing) {
  const model = clone(asset.scene);
  model.traverse((object) => {
    if (object.isSkinnedMesh) object.frustumCulled = false;
    if (!object.isMesh || object.material.name !== 'M_kit') return;
    object.material = object.material.clone();
    object.material.color.set(index < 3 ? (index ? 0x9ac4ef : 0xffffff) : 0xec8465);
  });
  scene.add(model);
  const clips = new Map([...asset.animations, ...standing].map((clip) => {
    const copy = clip.clone();
    copy.tracks = copy.tracks.filter((track) => !/^root\.(?:position|quaternion)$/.test(track.name));
    return [copy.name, copy];
  }));
  const legs = [];
  for (const name of ['thigh_l','thigh_r','calf_l','calf_r']) { const bone = model.getObjectByName(name); if (bone) legs.push(bone); }
  return { model, mixer: new THREE.AnimationMixer(model), clips, clip: '', action: null, legs, stride: 0 };
}
function pose(who, name, loop = true) {
  if (!who.clips.has(name) || who.clip === name) return;
  const next = who.mixer.clipAction(who.clips.get(name));
  next.reset().setEffectiveWeight(1).setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
  next.clampWhenFinished = !loop;
  next.play();
  if (who.action && who.action !== next) next.crossFadeFrom(who.action, .16);
  who.clip = name; who.action = next;
}
function applyKit(draft) {
  const who = actors[0];
  if (!who) return;
  who.model.scale.setScalar(draft.height / 183);
  if (composer) {
    const data = window.CUSTOMIZER_DATA;
    const rgb = (hex) => [1,3,5].map((i) => parseInt(hex.slice(i,i+2),16));
    const palette = Object.fromEntries(['field','accent1','accent2','ink'].map((channel) => [channel, rgb(channel === 'field' ? draft.color : ({accent1:'#efd29a',accent2:'#243140',ink:'#f4f1eb'})[channel])]));
    composer.compose({ number: draft.number, name: draft.name }, palette);
    if (!kitTexture) {
      kitTexture = new THREE.DataTexture(composer.out, composer.S, composer.S, THREE.RGBAFormat, THREE.UnsignedByteType);
      kitTexture.colorSpace = THREE.SRGBColorSpace; kitTexture.flipY = false;
      kitTexture.magFilter = THREE.LinearFilter; kitTexture.minFilter = THREE.LinearMipmapLinearFilter; kitTexture.generateMipmaps = true;
    }
    kitTexture.needsUpdate = true;
  }
  who.model.traverse((object) => {
    if (object.isMesh && object.material.name === 'M_kit') {
      object.material.color.set(kitTexture ? '#ffffff' : draft.color);
      if (kitTexture) object.material.map = kitTexture;
    }
    const dictionary = object.morphTargetDictionary;
    if (dictionary?.body_slim !== undefined) object.morphTargetInfluences[dictionary.body_slim] = Math.max(0, -draft.build);
    if (dictionary?.body_strong !== undefined) object.morphTargetInfluences[dictionary.body_strong] = Math.max(0, draft.build);
  });
}
async function initActors() {
  if (!renderer) return;
  $('startChallenge').disabled = true;
  try {
    const loader = new GLTFLoader();
    const [asset, standing] = await Promise.all([
      loader.loadAsync('./dist/lod/player_LOD1.glb'),
      loader.loadAsync('./build/menu/menu_stand_anim.glb').then((gltf) => gltf.animations).catch(() => []),
    ]);
    actors = Array.from({ length: 6 }, (_, index) => actor(asset, index, standing));
    actors.forEach((who) => { pose(who, 'knee_idle'); who.mixer.update(0); });
    applyKit(page === 'studio' ? kitDraft : career.kit);
    $('startChallenge').disabled = false;
    if (page === 'rink') $('feedback').textContent = 'Press Start match when ready.';
    if (window.CUSTOMIZER_DATA) {
      const data = window.CUSTOMIZER_DATA;
      composer = await KitComposer.fromBase64({ ...data.images, glyphs: data.glyphs, layout: data.layout });
      applyKit(page === 'studio' ? kitDraft : career.kit);
    }
  } catch (error) {
    if (!actors.length) $('feedback').textContent = 'The player rig could not load.';
    console.error(error);
  }
}

function show(next) {
  if (next === 'credits' && !postseason()) return;
  if (page === 'credits') $('creditsFilm').creditsCleanup?.();
  if (page === 'studio' && next !== 'studio') applyKit(career.kit);
  if (next === 'profile' && page !== 'studio' && page !== 'profile') backFromProfile = page;
  if (page === 'rink' && next !== 'rink') match = undefined;
  if (page === 'rink' && next !== 'rink') {
    window.speechSynthesis?.cancel();
    $('commentaryCaption').hidden=true;
  }
  page = next; keys.clear();
  document.body.dataset.gamePage=next;
  for (const section of document.querySelectorAll('.page')) section.hidden = section.id !== next;
  const host = { home:'homePreview', district:'districtPreview', rink:'playPreview', profile:'profilePreview', studio:'studioPreview' }[next];
  if (renderer && host) $(host).append(renderer.domElement);
  if (next === 'tour') selectCity(selected);
  if (next === 'profile') renderProfile();
  if (next === 'studio') openStudio();
  if (next === 'results') renderRecords();
  if (next === 'credits') window.bindCreditsRoll($('creditsFilm'), { photos: career.photos,
    actual: [['Player and animation assets','Ministicks-Player project'], ['3D renderer','Three.js contributors'], ['World outlines','Natural Earth']] });
  window.scrollTo(0,0);
}
function selectCity(index) {
  selected = index;
  map.setCity(index);
  $('tourProgress').textContent = career.wins.length + ' / ' + cities.length + ' cities won';
  $('venueCity').textContent = cities[index].city + ' · ' + cities[index].country;
  $('venueName').textContent = cities[index].arena;
  const opponent = clubFor(cityOpponents[index]);
  setClubEmblem($('tourClubEmblem'), opponent);
  $('tourClubName').textContent = opponent.name;
  $('stops').replaceChildren(...cities.map(({city, id}, i) => {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-pressed', String(i === index));
    const status = document.createElement('small'); status.textContent = career.wins.includes(id) ? 'Won' : 'Open';
    button.append(city, status); button.onclick = () => { selectCity(i); $('stops').children[i].focus(); };
    return button;
  }));
}
function openDistrict() {
  buildDistrict();
  $('districtName').textContent = cities[selected].city;
  show('district');
}
function nearestTarget() {
  return district.targets.find((target) => Math.hypot(district.x-target.x,district.z-target.z) < 1.7);
}
function interact() {
  if (page !== 'district' || $('conversation').open) return;
  const target = nearestTarget();
  if (!target) return;
  if (target.kind === 'arena') { openRink('campaign'); return; }
  dialogue = target;
  if (target.kind === 'coach' && !career.encountered.includes(target.id)) { career.encountered.push(target.id); save(); }
  $('npcName').textContent = target.name; $('npcLine').textContent = target.line;
  $('npcFollow').hidden = !target.id;
  $('npcFollow').textContent = career.following.includes(target.id) ? 'Unfollow' : 'Follow';
  keys.clear(); $('conversation').showModal();
}
function openRink(nextMode) {
  mode = nextMode; match = undefined;
  const stop = cities[selected];
  $('modeName').textContent = { campaign:'Campaign · ' + stop.city, single:'Single player', local:'Local multiplayer', training:'Training' }[mode];
  $('rinkName').textContent = mode === 'campaign' ? stop.arena : 'Club Arena';
  $('startChallenge').hidden = false;
  $('matchSetup').hidden=false;
  $('matchPrompt').hidden=true;
  $('commentaryCaption').hidden=true;
  $('homeClub').value=clubFor(career.club)?.name ?? defaultClub;
  $('awayClub').value=mode==='campaign'?cityOpponents[selected]:'Minnesota Stars';
  $('rinkSurface').value=mode==='campaign'&&selected%2?'plastic':'carpet';
  updateClubSetup();
  $('score').textContent = 'Ready';
  $('attempts').textContent = '2 skaters + 1 goalie per side';
  $('feedback').textContent = actors.length ? 'Press Start match when ready.' : 'Loading players…';
  $('localControls').hidden = mode !== 'local';
  show('rink');
}
function setOptions(select, entries) {
  select.replaceChildren(...entries.map(([value,label])=>new Option(label,value)));
}
function setClubEmblem(image, club) {
  image.src = club.emblem;
  image.style.maskImage = `url("${club.emblem.replace(/\.webp$/, '-mask.png')}")`;
}
function updateClubSetup() {
  const home=$('homeClub'), away=$('awayClub');
  if(mode==='campaign'){
    const opponent=cityOpponents[selected];
    away.value=opponent;
    if(home.value===opponent)home.value=clubs.find(club=>club.name!==opponent).name;
  }else if(home.value===away.value){
    away.value=clubs.find(club=>club.name!==home.value).name;
  }
  away.disabled=mode==='campaign';
  for(const option of home.options)option.disabled=mode==='campaign'&&option.value===away.value;
  for(const option of away.options)option.disabled=option.value===home.value;
  const homeClub = clubFor(home.value);
  const awayClub = clubFor(away.value);
  setClubEmblem($('setupHomeEmblem'), homeClub);
  setClubEmblem($('scoreHomeEmblem'), homeClub);
  setClubEmblem($('setupAwayEmblem'), awayClub);
  setClubEmblem($('scoreAwayEmblem'), awayClub);
  $('scoreHomeEmblem').title = homeClub.name;
  $('scoreAwayEmblem').title = awayClub.name;
}
function startMatch() {
  if (!actors.length || match) return;
  const home=$('homeClub').value, away=$('awayClub').value;
  if (home===away) return;
  career.club=home; save();
  match = createTeamMatch({ home, away, playerName: career.name, local: mode === 'local', training: mode === 'training', surface:$('rinkSurface').value });
  actors.forEach((who,index)=>{
    if(!index)return;
    who.model.traverse(object=>{
      if(object.isMesh&&object.material.name==='M_kit')object.material.color.set(clubFor(index<3?home:away).color);
    });
  });
  heardEvent=0; commentaryUntil=0; crowdUntil=0;
  aim.fill(0);
  $('startChallenge').hidden = true;
  $('matchSetup').hidden=true;
  $('playPreview').tabIndex=0;
  $('playPreview').focus({preventScroll:true});
}
function still(caption) {
  try {
    renderer.render(scene, camera);
    const canvas = document.createElement('canvas'); canvas.width = 700;
    canvas.height = Math.round(700 * renderer.domElement.height / renderer.domElement.width);
    canvas.getContext('2d').drawImage(renderer.domElement,0,0,canvas.width,canvas.height);
    return {src:canvas.toDataURL('image/jpeg',.83),caption};
  } catch { return null; }
}
function finishMatch() {
  const won = match.scores[0] > match.scores[1], draw = match.scores[0] === match.scores[1], stop = cities[selected];
  career.matches.push({ teams: match.teams, scores: match.scores, date: Date.now(), mode, wentOvertime:match.period===4, city: mode === 'campaign' ? stop.city : '',
    players: match.players.map(({ id, name, side, stats }) => ({ id, name, side, stats })) });
  career.matches = career.matches.slice(-400);
  career.xp += won ? 230 : draw ? 135 : 90;
  if (mode === 'campaign' && won) {
    if (!career.wins.includes(stop.id)) { career.wins.push(stop.id); career.xp += 400; }
    const photo = still(stop.city + ' · ' + match.scores.join('–'));
    if (photo) career.photos = [photo, ...career.photos.filter((item) => !item.caption.startsWith(stop.city + ' ·'))].slice(0, 8);
  }
  career.champion = postseason();
  $('creditsButton').hidden = !postseason(); $('resultCredits').hidden = !postseason();
  $('resultLabel').textContent = $('rinkName').textContent;
  $('resultTitle').textContent = draw ? 'Draw' : match.teams[won ? 0 : 1] + ' wins';
  $('resultDetail').textContent = match.scores.join(' – ') + (match.period===4?' · Overtime':'');
  save();
  $('matchResult').showModal();
}

function updateDistrict(dt) {
  if ($('conversation').open) return false;
  const x = Number(keys.has('KeyA') || keys.has('ArrowLeft')) - Number(keys.has('KeyD') || keys.has('ArrowRight'));
  const z = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  const length = Math.hypot(x,z);
  const move = (p,q) => !district.blockers.some((rect) => Math.abs(p-rect.x)<rect.w+.28 && Math.abs(q-rect.z)<rect.d+.28);
  if (length) {
    const nextX = cap(district.x+x*4.1*dt/length,-18,18), nextZ = cap(district.z+z*4.1*dt/length,-12,13);
    if (move(nextX,district.z)) district.x = nextX;
    if (move(district.x,nextZ)) district.z = nextZ;
    district.yaw = Math.atan2(x,z);
  }
  const target = nearestTarget();
  $('districtDot').setAttribute('cx',60-district.x*3.3);
  $('districtDot').setAttribute('cy',48-district.z*3.1);
  $('interact').disabled = !target;
  $('interact').textContent = target ? (target.kind === 'arena' ? 'Enter arena' : 'Talk to ' + target.name) + ' · E' : 'Interact · E';
  $('districtHint').textContent = target ? '' : 'Cross the street to reach the arena and meet the local coach.';
  return length > 0;
}
const motion = (left,right,up,down,shift) => ({x:Number(keys.has(left))-Number(keys.has(right)),
  z:Number(keys.has(up))-Number(keys.has(down)), standing:keys.has(shift)});
function updateRink(dt) {
  if (!match || match.ended || $('pauseMenu').open) return;
  const input = [motion('KeyA','KeyD','KeyW','KeyS','ShiftLeft'), motion('ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftRight')];
  aim[1] = cap(aim[1] + (Number(keys.has('KeyK')) - Number(keys.has('KeyL'))) * dt * 2.1, -2.3, 2.3);
  tickTeamMatch(match,input,dt);
  const seconds = Math.ceil(match.remaining);
  $('score').textContent = clubFor(match.teams[0]).code + ' ' + match.scores[0] + ' – ' + match.scores[1] + ' ' + clubFor(match.teams[1]).code;
  const clock = Math.floor(seconds/60) + ':' + String(seconds%60).padStart(2,'0');
  $('attempts').textContent = (match.training ? 'Practice' : (match.period===4?'OT':'P'+match.period) + ' · ' + clock) +
    ' · P1 steps ' + match.players[match.controls[0]].steps + '/3';
  $('feedback').textContent = match.message + ' · Controlling ' + match.players[match.controls[0]].name;
  updatePresentation();
  if (match.ended) finishMatch();
}

function updatePresentation() {
  const now=performance.now();
  const event=match.event;
  if(event && event.id!==heardEvent){
    heardEvent=event.id;
    if(event.type==='goal'||event.type==='save')crowdUntil=now+3900;
    if(commentary && ['goal','save','travel','horn'].includes(event.type)){
      const line=event.type==='goal'?match.teams[event.side]+' score! '+event.text.slice(7):
        event.type==='save'?event.text+'. Watch for the outlet pass.':event.text;
      $('commentaryText').textContent=line;
      commentaryUntil=now+4800;
      if(window.speechSynthesis && typeof SpeechSynthesisUtterance==='function'){
        const speech=new SpeechSynthesisUtterance(line); speech.rate=1.12;
        const voices=window.speechSynthesis.getVoices().filter(voice=>voice.lang.startsWith('en'));
        if(voices.length)speech.voice=voices[event.id%Math.min(2,voices.length)];
        try { window.speechSynthesis.speak(speech); } catch {}
      }
    }
  }
  $('commentaryCaption').hidden=!commentary||now>=commentaryUntil;
  const box=$('matchPrompt'), meter=$('promptMeter'), text=$('promptTitle'), help=$('promptHelp');
  box.hidden=!(match.timeout || match.intermission || match.faceoff || match.freeze);
  meter.hidden=!match.faceoff||Boolean(match.timeout);
  if(match.timeout){text.textContent='Timeout · '+Math.ceil(match.timeout)+'s';help.textContent='Play resumes automatically.';}
  else if(match.intermission){text.textContent='Intermission · '+Math.ceil(match.intermission*4)+'s';help.textContent=match.period===4?'Sudden-death overtime next.':'Teams change ends.';}
  else if(match.faceoff){
    const {stage,elapsed,locked}=match.faceoff;
    meter.value=Math.min(1,elapsed/[1.4,3,3][stage]);
    text.textContent=['Faceoff · Timing','Faceoff · Power','Faceoff · Direction'][stage];
    help.textContent=locked[0]?'Locked':match.local?'P1 Space · P2 Enter · lock near halfway':'Press Space near halfway.';
  } else if(match.freeze){text.textContent='Goalie freeze · '+Math.ceil(match.freeze.left);help.textContent='Retreat for the goalie’s outlet.';}
}

function walkPose(who, dt, moving) {
  pose(who, who.clips.has('menu_stand_idle') ? 'menu_stand_idle' : 'ref_bind');
  who.mixer.update(dt);
  who.stride += moving ? dt * 18 : 0;
  const swing = moving ? Math.sin(who.stride) : 0;
  for (let i=0;i<who.legs.length;i++) who.legs[i].rotateX(i<2 ? (i ? -1 : 1)*swing*.25 : Math.max(0,(i===2 ? -1 : 1)*swing)*.26);
}
const motionClips = {shot:'knee_wrist_shot',pass:'knee_pass',poke:'knee_poke_check',save:'goalie_glove_save',goal:'emote_goal_celebrate'};
let last = performance.now();
function frame(time) {
  requestAnimationFrame(frame);
  const realDt = Math.max(0,(time-last)/1000);
  const dt = Math.min(.04,realDt); last=time;
  if (!renderer || !['home','district','rink','profile','studio'].includes(page)) return;
  const parent = renderer.domElement.parentElement;
  if (!parent?.clientWidth || !parent.clientHeight) return;
  if (renderer.domElement.width!==parent.clientWidth || renderer.domElement.height!==parent.clientHeight) {
    renderer.setSize(parent.clientWidth,parent.clientHeight,false);
    camera.aspect=parent.clientWidth/parent.clientHeight; camera.updateProjectionMatrix();
  }
  street.visible = page === 'district'; world.visible = !street.visible;
  if (!scene.background) scene.background = new THREE.Color();
  scene.background.set(street.visible ? 0x8eabb9 : 0x222b36);
  scene.fog.color.copy(scene.background);
  const rinkStyle = page === 'rink' && mode === 'campaign' ? selected % venueDetails.length : 0;
  if(page==='home' && !reelPaused)reelTime=(reelTime+realDt)%120;
  const highlight=page==='home' && actors.length ? reel(reelTime) : null;
  const chosenFloor=page==='rink' ? $('rinkSurface').value : highlight?.replay?'plastic':'carpet';
  if(chosenFloor!==floorKey){
    floorKey=chosenFloor; floorMat.map=floorTextures[floorKey];
    floorMat.color.setHex(floorKey==='plastic'?0xc2d4dd:0x97a9af);
    floorMat.roughness=floorKey==='plastic'?.28:.95; floorMat.needsUpdate=true;
  }
  wallMat.color.setHex(npcColors[selected]);
  venueDetails.forEach((items,index)=>{for(const item of items)item.visible=index===rinkStyle;});
  ball.visible = Boolean(highlight || page==='rink' && match);
  target.visible = !!(page==='rink' && match && !match.faceoff && match.owner === match.controls[0]);
  trackers.forEach((ring,index)=>{ring.visible=page==='rink' && match?.controls[index]!==undefined;});
  actors.forEach((who,index) => { who.model.visible = Boolean(highlight || page==='rink' || (street.visible ? index<3 : index===0)); });
  if(highlight && !reelPaused || page==='rink')animateCrowd(time/1000,Boolean(highlight?.crowd || time<crowdUntil));
  if (street.visible && district) {
    const moving = updateDistrict(dt);
    actors.forEach((who,index) => {
      if (index>=3) return;
      const coords = index ? district.targets[index] : district;
      who.model.position.set(coords.x,0,coords.z);
      who.model.rotation.y = index ? Math.PI : district.yaw;
      walkPose(who,dt,!index && moving);
    });
    camera.position.set(district.x-1.7,3.75,district.z-5.9);
    camera.lookAt(district.x,.95,district.z+1.25);
  } else if (page==='rink' || highlight) {
    if(!highlight)updateRink(dt);
    const states = highlight?.players ?? match?.players ?? [{x:-.55,z:-.85},{x:2.15,z:-1.7},{x:0,z:-5.82,goalie:true},
      {x:.55,z:.85,side:1},{x:-2.15,z:1.7,side:1},{x:0,z:5.82,side:1,goalie:true}];
    actors.forEach((who,index) => {
      const state=states[index];
      who.model.position.set(state.x,0,state.z); who.model.rotation.y=state.yaw ?? (state.side ? Math.PI : 0);
      if ($('pauseMenu').open || highlight && reelPaused) return;
      if (state.onFeet) walkPose(who,dt,state.walking);
      else {
        const clip = state.action ? motionClips[state.action.kind] : state.goalie ? 'goalie_idle' :
          Math.hypot(state.vx||0,state.vz||0)>.08 ? 'knee_shuffle_fwd' : 'knee_idle';
        pose(who,clip,!state.action); who.mixer.update(highlight?.replay?dt*.55:dt);
      }
    });
    if (highlight) {
      ball.position.set(highlight.ball.x,highlight.ball.y+.019,highlight.ball.z);
      $('reelCaption').textContent=highlight.label;
      camera.position.set(...highlight.camera[0]); camera.lookAt(...highlight.camera[1]);
    } else {
      camera.position.set(0,8.8,-12.6); camera.lookAt(0,.05,.4);
    }
    if (!highlight && match) {
      ball.position.set(match.ball.x,match.ball.y+.019,match.ball.z);
      target.position.set(aim[0],.49,6.16*attackDirection(match,0));
      match.controls.forEach((id,index)=>{const state=match.players[id];trackers[index].position.set(state.x,.013,state.z);});
    }
  } else {
    const who=actors[0];
    if (who) {
      who.model.position.set(0,0,.25); who.model.rotation.y=page==='studio' ? studioYaw : 0;
      pose(who,page==='studio' ? $('studioPose').value : 'knee_idle');
      who.mixer.update(dt);
    }
    camera.position.set(1.15,1.37,3.4); camera.lookAt(0,.65,.25);
  }
  renderer.render(scene,camera);
}

function rowsToTable(head, body, headers, rows) {
  const row=document.createElement('tr');
  for (const title of headers) { const th=document.createElement('th'); th.scope='col'; th.textContent=title; row.append(th); }
  head.replaceChildren(row);
  body.replaceChildren(...rows.map((values) => {
    const line=document.createElement('tr');
    values.forEach((value) => {
      const cell=line.insertCell(), club=clubFor(value);
      if(club){
        const identity = document.createElement('span');
        identity.className = 'club-identity';
        const emblem = new Image();
        emblem.className = 'club-emblem';
        emblem.alt = '';
        setClubEmblem(emblem, club);
        identity.append(emblem, club.name);
        cell.append(identity);
      }else cell.textContent=value;
    });
    return line;
  }));
}
function aggregate() {
  const players=new Map(), teams=new Map();
  const teamLine=(name)=>({name,played:0,wins:0,losses:0,otl:0,draws:0,goals:0,against:0,shots:0,saves:0});
  for(const club of clubs)teams.set(club.name,teamLine(club.name));
  for (const game of career.matches) {
    for (let side=0;side<2;side++) {
      const name=game.teams[side], goals=game.scores[side], against=game.scores[1-side];
      const team=teams.get(name) ?? teamLine(name);
      const otl=goals<against&&game.wentOvertime;
      team.played++;team.wins+=Number(goals>against);team.losses+=Number(goals<against&&!otl);team.draws+=Number(goals===against);team.otl+=Number(Boolean(otl));
      team.goals+=goals;team.against+=against;
      for (const event of game.players.filter((item)=>item.side===side)) {
        const goalie=event.id%3===2;
        team.shots+=(event.stats.onTarget??0); team.saves+=event.stats.saves;
        const id=event.id===0 ? 'profile' : name+'/'+event.name;
        const player=players.get(id) ?? {name:event.id===0 ? career.name : event.name,team:name,goalie,games:0,wins:0,losses:0,
          goals:0,assists:0,shots:0,onTarget:0,saves:0,steals:0,passes:0,travels:0,freezes:0,against:0};
        player.games++;
        player.team=name;player.wins+=Number(goals>against);player.losses+=Number(goals<against);
        for (const stat of ['goals','assists','shots','onTarget','saves','steals','passes','travels','freezes','against']) player[stat]+=event.stats[stat]??0;
        players.set(id,player);
      }
      teams.set(name,team);
    }
  }
  return {players,teams};
}
function renderRecords() {
  const {players,teams}=aggregate();
  const clubView=leagueTab==='standings';
  const filter=$('recordFilter'), value=filter.value;
  const options=clubView?divisions:clubs.map(club=>club.name);
  setOptions(filter, [['',clubView?'All divisions':'All clubs'],...options.map(value=>[value,value])]);
  filter.value=options.includes(value)?value:'';
  $('recordFilterLabel').textContent=clubView?'Division':'Club';
  const points=(team)=>team.wins*2+team.otl;
  const perc=(value,total)=>total?(100*value/total).toFixed(1)+'%':'—';
  const eligible=[...players.values()].filter(p=>!filter.value||p.team===filter.value);
  const standings=[...teams.values()].filter(t=>{
    const club=clubFor(t.name);
    return club&&(!filter.value||club.division===filter.value);
  }).sort((a,b)=>points(b)-points(a)||b.wins-a.wins||(b.goals-b.against)-(a.goals-a.against)||a.name.localeCompare(b.name));
  const [headers,rows,title] = clubView
    ? [['Rank','Club','Division','GP','W','L','OTL','PTS','GF','GA','Diff','PTS%'], standings.map((t,i)=>[i+1,t.name,clubFor(t.name).division,t.played,t.wins,t.losses,t.otl,points(t),t.goals,t.against,t.goals-t.against,perc(points(t),t.played*2)]),'Team standings']
    : leagueTab==='individual'
      ? [['Runner','Club','GP','G','A','PTS','SOG','Shooting %','TI','Passes'],eligible.filter(p=>!p.goalie).sort((a,b)=>(b.goals+b.assists)-(a.goals+a.assists)).map(p=>[p.name,p.team,p.games,p.goals,p.assists,p.goals+p.assists,p.onTarget,perc(p.goals,p.onTarget),p.travels,p.passes]),'Runner stats']
      : [['Goalie','Club','GP','W','L','SA','SV','GA','SV%','Freezes'],eligible.filter(p=>p.goalie).sort((a,b)=>b.saves-a.saves).map(p=>[p.name,p.team,p.games,p.wins,p.losses,p.saves+p.against,p.saves,p.against,perc(p.saves,p.saves+p.against),p.freezes]),'Goalie stats'];
  rowsToTable($('recordsHead'),$('recordsBody'),headers,rows);
  $('recordsTitle').textContent=title; $('noRecords').textContent=rows.length?'':'Finish a match to record your first result.';
}

function levelAt(total) {
  let level=0;
  while (total >= (level+1)*1000) { total-=(level+1)*1000; level++; }
  return {level, total, next:(level+1)*1000};
}
function renderProfile() {
  const info=levelAt(career.xp);
  $('displayHandle').textContent=career.handle;
  $('displayName').textContent=career.name;
  $('displayBio').textContent=career.bio;
  $('profileMascot').textContent=mascots[career.mascot] || '🏒';
  $('youtubeLink').hidden=!career.youtube;
  if (career.youtube) $('youtubeLink').href=career.youtube;
  $('levelTitle').textContent='Level ' + info.level;
  $('xpBar').max=info.next; $('xpBar').value=info.total;
  $('xpProgress').textContent=info.total+' / '+info.next+' XP';
  const following=cities.filter((item)=>career.following.includes(item.id));
  const followers=cities.filter((item)=>career.encountered.includes(item.id));
  const friends=following.filter((item)=>career.encountered.includes(item.id));
  for (const [type,list] of Object.entries({friends,followers,following})) {
    $(type+'Count').textContent=list.length;
    const names=list.map((stop)=>{
      const button=document.createElement('button');
      button.textContent=stop.coach+' · '+stop.city;
      button.onclick=()=>{selected=cities.indexOf(stop);openDistrict();};
      return button;
    });
    $(type+'List').replaceChildren(...(names.length?names:[document.createTextNode('No '+type+' yet.')]));
  }
  renderProfileTab();
}
function renderProfileTab() {
  const content=$('profileTabContent');
  content.replaceChildren();
  if (profileTab==='summary') {
    const {players}=aggregate();
    const player=players.get('profile');
    const wins=career.matches.filter(match=>match.scores[0]>match.scores[1]).length;
    const list=document.createElement('dl'); list.className='profile-stat-grid';
    const items=[['Matches',player?.games??0],['Wins',wins],['Goals',player?.goals??0],['Assists',player?.assists??0],
      ['Shots',player?.shots??0],['Steals',player?.steals??0],['City wins',career.wins.length+' / '+cities.length]];
    for(const [label,value] of items) {
      const card=document.createElement('div'); const dt=document.createElement('dt'); const dd=document.createElement('dd');
      dt.textContent=label;dd.textContent=value;card.append(dt,dd);list.append(card);
    }
    content.append(list);
  } else if(profileTab==='items') {
    const trophies=document.createElement('ul'); trophies.className='profile-stat-grid';
    for (const [label,earned] of [
      ['First win',career.matches.some(match=>match.scores[0]>match.scores[1])],['Road win',career.wins.length>0],['Tour champion',career.wins.length===cities.length],
    ]) {
      const item=document.createElement('li'); item.textContent=(earned?'✓ ':'')+label;
      if(!earned)item.setAttribute('data-locked','');
      trophies.append(item);
    }
    content.append(trophies);
  } else if(profileTab==='progress') {
    const note=document.createElement('p'); note.textContent=career.wins.length+' of '+cities.length+' cities won';
    const button=document.createElement('button'); button.textContent='Open world tour'; button.className='primary';
    button.onclick=()=>show('tour');content.append(note,button);
  } else {
    const gallery=document.createElement('div');gallery.className='profile-stat-grid';
    for (const photo of career.photos) {
      const figure=document.createElement('figure'), image=new Image(), caption=document.createElement('figcaption');
      image.src=photo.src; image.alt=photo.caption; caption.textContent=photo.caption; figure.append(image,caption); gallery.append(figure);
    }
    if(!gallery.children.length)gallery.textContent='Win a campaign match to save a match still.';
    content.append(gallery);
  }
}
let mascotDraft=-1;
function editProfile() {
  $('playerHandle').value=career.handle;
  $('playerName').value=career.name;
  $('bio').value=career.bio;
  $('youtube').value=career.youtube;
  $('savedProfile').textContent='';
  mascotDraft=career.mascot;
  $('mascotOptions').replaceChildren(...mascots.map((icon,i)=>{
    const button=document.createElement('button'); button.type='button';
    button.textContent=icon; button.setAttribute('aria-label','Mascot '+(i+1)); button.setAttribute('aria-pressed',String(i===mascotDraft));
    button.onclick=()=>{mascotDraft=i;for(const entry of $('mascotOptions').children)entry.setAttribute('aria-pressed',String(entry===button));};
    return button;
  }));
  $('profileEditor').showModal();
}
function saveProfile(event) {
  event.preventDefault();
  const handle=$('playerHandle').value.trim(), name=$('playerName').value.trim(), youtube=$('youtube').value.trim();
  if (!handle || !name) { $('savedProfile').textContent='Enter a username and a display name.'; return; }
  const changed=handle!==career.handle;
  if(changed && Date.now()-career.nameChanged<7*24*60*60*1000){$('savedProfile').textContent='You can change your username once every seven days.';return;}
  if(youtube && !/^https:\/\/(?:www\.)?youtube\.com\/(?:@[^/?#]+|(?:channel|c|user)\/[^/?#]+)\/?$/i.test(youtube)){
    $('savedProfile').textContent='Enter a YouTube channel link.';return;
  }
  Object.assign(career,{handle,name,youtube,bio:$('bio').value.trim(),mascot:mascotDraft});
  if(changed)career.nameChanged=Date.now();
  save();$('profileEditor').close();renderProfile();
}
let studioYaw=0;
function openStudio() {
  kitDraft={...career.kit}; studioYaw=0;
  for (const [id,key] of [['kitColor','color'],['kitNumber','number'],['kitName','name'],['playerHeight','height'],['playerBuild','build']]) $(id).value=kitDraft[key];
  $('studioPose').value='knee_idle'; $('studioStatus').textContent='Drag to rotate your player.';
}
function updateStudio() {
  kitDraft={color:$('kitColor').value, number:cap($('kitNumber').valueAsNumber||0,0,99),
    name:$('kitName').value, height:cap($('playerHeight').valueAsNumber||183,150,205), build:$('playerBuild').valueAsNumber||0};
  applyKit(kitDraft);
}

function openPause() {
  if(page==='rink'&&!$('pauseMenu').open&&!$('matchResult').open){keys.clear();$('pauseMenu').showModal();}
}
document.querySelectorAll('[data-page]').forEach((button)=>button.onclick=()=>{
  if(page==='rink' && match && !match.ended){openPause();return;}
  show(button.dataset.page);
});
document.querySelectorAll('[data-start]').forEach((button)=>button.onclick=()=>openRink(button.dataset.start));
document.querySelector('[data-profile-back]').onclick=()=>show(backFromProfile);
for (const button of $('profileTabs').children) button.onclick=()=>{
  profileTab=button.dataset.profileTab;
  for (const entry of $('profileTabs').children) entry.setAttribute('aria-pressed',String(entry===button));
  renderProfileTab();
};
for (const button of $('recordTabs').children) button.onclick=()=>{
  leagueTab=button.dataset.recordTab;
  for (const entry of $('recordTabs').children) entry.setAttribute('aria-pressed',String(entry===button));
  renderRecords();
};
$('recordFilter').onchange=renderRecords;
function mapMode(satellite) {
  map.setMode(satellite?'satellite':'world');
  $('worldMapButton').setAttribute('aria-pressed',String(!satellite));
  $('satelliteButton').setAttribute('aria-pressed',String(satellite));
  $('mapZoomIn').hidden=$('mapZoomOut').hidden=!satellite;
}
$('worldMapButton').onclick=()=>mapMode(false);$('satelliteButton').onclick=()=>mapMode(true);
$('mapZoomOut').onclick=()=>map.changeZoom(-1);$('mapZoomIn').onclick=()=>map.changeZoom(1);
$('enterVenue').onclick=openDistrict;$('interact').onclick=interact;
$('npcClose').onclick=()=>$('conversation').close();
$('npcFollow').onclick=()=>{
  if(!dialogue?.id)return;
  const followed=career.following.includes(dialogue.id);
  career.following=followed?career.following.filter((id)=>id!==dialogue.id):[...career.following,dialogue.id];
  $('npcFollow').textContent=followed?'Follow':'Unfollow';save();
};
$('editProfile').onclick=editProfile;$('closeProfileEditor').onclick=()=>$('profileEditor').close();$('profileForm').onsubmit=saveProfile;
$('studioForm').oninput=updateStudio;
$('studioForm').onsubmit=(event)=>{event.preventDefault();updateStudio();career.kit={...kitDraft};save();$('studioStatus').textContent='Character saved.';};
let drag;
$('studioPreview').onpointerdown=(event)=>{drag=event.clientX;$('studioPreview').setPointerCapture(event.pointerId);};
$('studioPreview').onpointermove=(event)=>{if(drag===undefined)return;studioYaw+=(event.clientX-drag)*.012;drag=event.clientX;};
$('studioPreview').onlostpointercapture=()=>{drag=undefined;};
$('startChallenge').onclick=startMatch;$('pause').onclick=openPause;
$('homeClub').onchange=updateClubSetup;
$('awayClub').onchange=updateClubSetup;
$('reelPause').onclick=()=>{
  reelPaused=!reelPaused;
  $('reelPause').textContent=reelPaused?'Play highlights':'Pause highlights';
};
$('reelPause').textContent=reelPaused?'Play highlights':'Pause highlights';
$('commentaryToggle').onclick=()=>{
  commentary=!commentary;
  $('commentaryToggle').setAttribute('aria-pressed',String(commentary));
  $('commentaryToggle').textContent=commentary?'Commentary on':'Commentary off';
  if(!commentary){window.speechSynthesis?.cancel();$('commentaryCaption').hidden=true;}
};
$('resume').onclick=()=>$('pauseMenu').close();
const returnFromRink=()=>show(mode==='campaign'?'district':'home');
$('leaveRink').onclick=()=>{$('pauseMenu').close();returnFromRink();};
$('resultContinue').onclick=()=>{$('matchResult').close();returnFromRink();};
$('resultCredits').onclick=()=>{$('matchResult').close();show('credits');};
$('matchResult').addEventListener('cancel',(event)=>event.preventDefault());
const ground = new THREE.Plane(new THREE.Vector3(0,1,0),-.45);
const raycaster = new THREE.Raycaster();
$('playPreview').onpointermove=(event)=>{
  if(!match)return;
  const rect=$('playPreview').getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height),camera);
  const hit=raycaster.ray.intersectPlane(ground,new THREE.Vector3());
  if(hit)aim[0]=cap(hit.x,-2.6,2.6);
};
function passOrPoke(seat) {
  const id=match.controls[seat];
  teamAction(match,id,match.owner===id?'pass':'poke');
}
$('playPreview').onclick=()=>{if(match&&!match.faceoff)teamAction(match,match.controls[0],'shot',aim[0]);};
$('playPreview').oncontextmenu=(event)=>{
  if(!match)return;
  event.preventDefault();
  passOrPoke(0);
};
window.addEventListener('keydown',(event)=>{
  if(!['district','rink'].includes(page)||document.querySelector('dialog[open]'))return;
  const code=event.code;
  if (/^(Arrow|Space)/.test(code) && !(event.target instanceof HTMLButtonElement && code==='Space'))event.preventDefault();
  keys.add(code);
  if(event.repeat)return;
  if(page==='district'){if(code==='KeyE')interact();return;}
  if(code==='Escape'){openPause();return;}
  if(!match)return;
  if(code==='KeyT'||code==='KeyP'&&match.local){callTimeout(match,code==='KeyT'?0:1);return;}
  if(match.faceoff){
    if(code==='Space'||code==='Enter'&&match.local){event.preventDefault();tapFaceoff(match,code==='Space'?0:1);}
    return;
  }
  if(code==='KeyQ'||code==='Tab'&&event.target===$('playPreview')){if(code==='Tab')event.preventDefault();switchSkater(match,0);return;}
  if(code==='KeyU' && match.local){switchSkater(match,1);return;}
  if(code==='Space' && !(event.target instanceof HTMLButtonElement))teamAction(match,match.controls[0],'shot',aim[0]);
  if(code==='Enter' && match.local && !(event.target instanceof HTMLButtonElement))teamAction(match,match.controls[1],'shot',aim[1]);
  if(code==='KeyE'||code==='KeyO'&&match.local)passOrPoke(code==='KeyE'?0:1);
});
window.addEventListener('keyup',(event)=>keys.delete(event.code));
window.addEventListener('blur',()=>keys.clear());
$('creditsButton').hidden=!postseason();
setOptions($('homeClub'),clubs.map(club=>[club.name,club.name]));
setOptions($('awayClub'),clubs.map(club=>[club.name,club.name]));
show('home');
initActors();
requestAnimationFrame(frame);

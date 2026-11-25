import * as THREE from 'three';
import { settingsView } from './sport-settings.js';
import { districtChat } from './district-chat.js';
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
const previewPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.04,1.09,.12,64),
  new THREE.MeshStandardMaterial({color:0x434f53,roughness:.87}));
previewPlinth.position.set(0,-.061,.23);
scene.add(previewPlinth);



import { cities, setupTourMap } from './rink-campaign.js';
import { districtClear, moveDistrictBody } from './district-motion.js';
import { attackDirection, callTimeout, createTeamMatch, switchSkater, tapFaceoff, teamAction, tickTeamMatch } from './team-match.js';
import { buildBroadcastSet, buildHighlightReel, clubFor, clubs, divisions, makeSurface } from './rink-broadcast.js';
import { bakeSpectator, skaterLooks, stripeOfficial, styleSkater } from './rink-characters.js';
import { KitComposer } from './viewer/src/kit/compose.js';

const cap = (value, min, max) => Math.max(min, Math.min(max, value));
const key = 'ministicks.rink-tour.v1';
const mascots = ['🦊','🐼','🐯','🦁','🐸','🐷','🐨','🐰','🐲','🦄','🦉','🐺','🐻','🐧','🦋','🐙','🦕','🐠','🦜','🦩','🐬','🦈','🐢','🦝','🐭','🐱','🐶','🐮','🦅','🐴','🐘','🦔'];
const career = { name: 'Player', handle: 'player', bio: '', youtube: '', mascot: -1, nameChanged: 0, xp: 0,
  wins: [], matches: [], photos: [], champion: false, following: [], encountered: [], kit: { color: '#37688f', number: 9, name: 'PLAYER', height: 183, build: 0 } };
try { Object.assign(career, JSON.parse(localStorage.getItem(key) || '{}')); } catch {}
const preferenceDefaults={surface:'carpet',camera:'broadcast',commentary:false,voiceVolume:75,stillHome:matchMedia('(prefers-reduced-motion: reduce)').matches};
const preferences={...preferenceDefaults,...career.preferences};
career.preferences=preferences;
function save() {
  try { localStorage.setItem(key, JSON.stringify(career)); }
  catch { $('feedback').textContent = 'Storage is full. Progress may be lost when you close the page.'; }
}
const postseason = () => career.wins.length === cities.length || career.champion;
let page = 'home', selected = 0, mode = 'single', match, actors = [], leagueTab = 'standings', profileTab = 'summary', backFromProfile = 'home';
let kitDraft = { ...career.kit }, composer, kitTexture, district, dialogue, maria, arrival, official, alternateSkater;
const districtCamera = new THREE.Vector3();
const districtLook = new THREE.Vector3();
const districtBounds = { x: 27, z: 21 };
const remoteActors=new Map(), districtRigs={};
let groundContactMaterial;
let nextDistrictSend=0;
const online=districtChat({
  receive:receiveDistrictMessage,
  notice:(message)=>{
    $('chatStatus').textContent=message;
    if(message==='Voice ended.'){
      $('districtAccept').hidden=true;$('districtCall').hidden=false;
    }
  },
  state:(connected,status)=>{
    $('roomStatus').textContent=status;
    $('campaignLeave').hidden=!connected;
    $('districtRoomOpen').textContent=connected?status:'Join room';
    if(connected){
      if(district && [...online.players.values()].some(person=>person.city===selected&&Math.hypot(person.x-district.x,person.z-district.z)<.8)&&districtPositionClear(district.x+1.25,district.z,district.yaw,'walk'))district.x+=1.25;
      $('campaignRoom').close();
    }
  },
});
const keys = new Set();
const aim = [0, 0];
const map = setupTourMap({ map: $('tourMap'), caption: $('mapCaption'), onSelect: selectCity });
const defaultClub = 'Toronto Titans';
const cityOpponents = ['Boston Huskies','Montreal Royals','Buffalo Beacons','Detroit Freighters','Winnipeg Warriors',
  'Saskatchewan Sovereigns','Edmonton Condors','Ottawa Outlaws','Thunder Bay T-Wolves','Minnesota Stars'];
const npcColors = [0x354c69, 0xe1b77b, 0xdd835f, 0x477864, 0xb05d58, 0xb98b50, 0x6d7e79, 0x386865, 0x4f6284, 0x786182];
const floorTextures = renderer ? makeSurface(renderer) : {};
const broadcast = buildBroadcastSet(world);
const reel = buildHighlightReel();
let reelTime=0, reelPaused=preferences.stillHome, floorKey;
let commentary=preferences.commentary, heardEvent=0, commentaryUntil=0, crowdUntil=0;
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
  if (solid) district.blockers.push({ x: position[0], z: position[2], w: size[0] / 2, d: size[2] / 2, h:position[1]+size[1]/2, mesh });
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
  return sign;
}
function buildDistrict() {
  street.traverse((child) => {
    child.geometry?.dispose();
    if (child.isSprite) { child.material.map?.dispose(); child.material.dispose(); }
  });
  street.clear();
  for (const mat of district?.materials || []) mat.dispose();
  const stop = cities[selected];
  district = { x: 0, z: -8.5, yaw: 0, vx: 0, vz: 0, blockers: [], materials: [], targets: [],
    people: [], rooms: [], vehicles: [], cameraReady: false, cameraYaw:0, cameraPitch:.45, speed: 0 };
  const mat = (value) => { const item = material(value); district.materials.push(item); return item; };
  const ground = mat(0x596662), road = mat(0x353e46), sidewalk = mat(0xa2a29a);
  const building = mat(npcColors[selected]), trim = mat(0xd9cfc0), glass = mat(0x3e596e), dark = mat(0x1a2c39), park = mat(0x617b5f);
  const roadWidth = [5.6, 5, 6.4][selected % 3];
  const roadZ = -3;
  streetBox(ground, [90, .15, 90], [0, -.12, 0]);
  streetBox(road, [64, .045, roadWidth], [0, -.04, roadZ]);
  for (const side of [-1, 1]) streetBox(sidewalk, [57, .05, 1.8], [0, -.032, roadZ + side * (roadWidth / 2 + .9)]);
  for (let x = -26; x <= 26; x += 3) streetBox(trim, [1.37, .015, .065], [x, -.012, roadZ]);
  for (let index = 0; index < 8; index++) streetBox(trim, [.18, .018, roadWidth-.14], [(index - 3.5) * .3, -.008, roadZ]);
  for (const z of [-20.8, 20.8]) streetBox(dark, [54, .52, .24], [0, .26, z], true);
  for (const x of [-26.8, 26.8]) {
    streetBox(dark, [.24, .52, 15], [x, .26, -13.3], true);
    streetBox(dark, [.24, .52, 20], [x, .26, 10.4], true);
  }
  function room(name, x, front, width, depth, height, facade) {
    const gap = 2.7, wing = (width-gap)/2;
    const frontage = [];
    streetBox(sidewalk, [width, .095, depth], [x, -.048, front+depth/2]);
    for (const side of [-1, 1]) {
      frontage.push(streetBox(facade, [wing, height, .27], [x+side*(gap+wing)/2, height/2, front], true));
      streetBox(facade, [.28, height, depth], [x+side*width/2, height/2, front+depth/2], true);
      frontage.push(streetBox(glass, [wing*.7, .96, .09], [x+side*(gap+wing)/2, height*.57, front-.16]));
      frontage.push(streetBox(trim, [wing*.73, .09, .13], [x+side*(gap+wing)/2, height*.57-.49, front-.16]));
    }
    streetBox(facade, [width, height, .27], [x, height/2, front+depth], true);
    frontage.push(streetBox(facade, [gap, height-2.35, .27], [x, (height+2.35)/2, front]));
    frontage.push(streetBox(trim, [width+.16, .12, .28], [x, height, front-.12]));
    frontage.push(label(name, x, 2.86, front-.28));
    district.rooms.push({ x,front,width,depth,frontage });
    streetBox(dark, [width*.47, .92, .76], [x-width*.12, .46, front+depth-1.05], true);
    streetBox(trim, [width*.49, .065, .85], [x-width*.12, .95, front+depth-1.05]);
    streetBox(dark, [.64, .37, 1.5], [x-width*.38, .185, front+1.8], true);
    streetBox(park, [.75, .095, 1.56], [x-width*.38, .415, front+1.8]);
    return { x: x+width*.25, z: front+depth-1.75 };
  }
  room(stop.arena, 0, 6.5, 10.2 + selected%3, 7, 4.5, building);
  const cafe = room(['Corner Café','Café du Parc','Harbor Café','Motor City Diner','Prairie Café','Foothills Café','Pacific Coffee','Fika House','Harbour Café','Corner Kavárna'][selected],
    -11, 4.8 + selected%2, 7.4, 5.8, 3.7, trim);
  room(['Pro Shop','Clubhouse','Equipment Shop'][selected%3], 11, 5.7, 7, 6.2, 3.9, building);
  room('Community centre', selected%2 ? 14 : -14, -19, 8.4, 6.5, 3.8, trim);
  streetBox(park, [3.2, .39, 1.1], [17, .195, 2.8], true);
  district.people = [
    { kind: 'coach', x: -3.1, z: 2.25, yaw: Math.PI, name: stop.coach, line: stop.tips, id: stop.id, voice: selected },
    { kind: 'staff', x: 3.85, z: 10.6, yaw: Math.PI, name: 'Arena attendant', line: 'Welcome to the club. The match desk is just inside this lobby.', voice: 1 },
    { ...cafe, kind: 'staff', yaw: Math.PI, name: 'Café host', line: 'Taking a break between matches? The coach is out by the arena.', voice: 2 },
    { kind: 'staff', x: 9, z: .9, yaw: 0, route: [6, 12], direction: 1, name: 'Local player', line: 'I take the bike when traffic gets busy. There’s usually one parked near the crosswalk.', voice: 3 },
  ].map((person) => ({...person,w:.31,d:.31}));
  district.targets = [{ kind: 'arena', x: 0, z: 11.2, prompt: 'Start arena match' }, ...district.people,
    { kind: 'travel', x: -24.2, z: roadZ, prompt: 'Choose next city' },
    { kind: 'travel', x: 24.2, z: roadZ, prompt: 'Choose next city' }];
  label('Tour route', -24.2, 1.5, roadZ-2.8);
  label('Tour route', 24.2, 1.5, roadZ-2.8);
  makeDistrictVehicle('car', -4.9, -7.5, Math.PI/2, building, dark, glass, trim);
  makeDistrictVehicle('bike', 3.65, -7.55, Math.PI/2, building, dark, glass, trim);
  makeDistrictVehicle('car', 13.9, -4.34, -Math.PI/2, trim, dark, glass, trim, true);
  makeDistrictVehicle('car', -14.3, -1.68, Math.PI/2, building, dark, glass, trim, true);
  if (arrival) {
    const [x, z, yaw] = arrival.kind === 'car' ? [17.5, -7.5, -Math.PI/2] : [10, -8.6, -Math.PI/2];
    const vehicle = makeDistrictVehicle(arrival.kind, x, z, yaw, building, dark, glass, trim);
    Object.assign(district, { x, z, yaw, ride: vehicle });
    arrival = null;
  }
  renderDistrictMap();
}

function makeDistrictVehicle(kind, x, z, yaw, paint, rubber, glass, metal, traffic = false) {
  const model = new THREE.Group();
  street.add(model);
  const part = (geometry, mat, px, py, pz) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(px, py, pz);
    model.add(mesh);
    return mesh;
  };
  const box = (w,h,d,x,y,z,mat) => part(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const wheels = [];
  let crank;
  if (kind === 'car') {
    box(1.48,.52,3.25,0,.59,0,paint);
    box(1.32,.50,1.70,0,1.06,-.16,glass);
    box(1.35,.11,1.72,0,1.36,-.16,paint);
    for (const side of [-1,1]) {
      for (const axle of [-1.04,1.04]) wheels.push(part(new THREE.CylinderGeometry(.32,.32,.20,18),rubber,side*.72,.32,axle));
      box(.36,.13,.07,side*.49,.67,1.64,metal);
      box(.35,.13,.07,side*.49,.64,-1.64,metal);
    }
    box(1.52,.11,.12,0,.39,1.61,metal);
    box(1.52,.11,.12,0,.39,-1.61,metal);
  } else {
    for (const axle of [-.66,.66]) {
      const wheel = part(new THREE.TorusGeometry(.32,.047,8,20),rubber,0,.37,axle);
      wheel.rotation.y = Math.PI/2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(.027,.59,.02),metal);
      const cross = spoke.clone();
      cross.rotation.z = Math.PI/2;
      wheel.add(spoke,cross);
      wheels.push(wheel);
    }
    const bar = (ay,az,by,bz) => {
      const tube = part(new THREE.CylinderGeometry(.035,.035,Math.hypot(by-ay,bz-az),8),paint,0,(ay+by)/2,(az+bz)/2);
      tube.rotation.x = Math.atan2(bz-az,by-ay);
    };
    bar(.37,-.66,.94,-.25); bar(.94,-.25,.85,.53); bar(.85,.53,.37,-.05); bar(.37,-.05,.37,-.66);
    bar(.37,.66,1.1,.49);
    box(.53,.055,.06,0,1.11,.49,metal);
    box(.22,.08,.24,0,.94,-.25,rubber);
    crank = new THREE.Group();
    crank.position.set(0,.46,-.05);
    model.add(crank);
    for (const side of [-1,1]) {
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(.16,.035,.08),metal);
      pedal.position.set(side*.18,side*.13,0);
      crank.add(pedal);
    }
  }
  if (kind === 'car') wheels.forEach((wheel) => { wheel.rotation.z = Math.PI/2; });
  const vehicle = { kind, x, z, yaw, model, wheels, crank, traffic };
  model.position.set(x,0,z);
  model.rotation.y = yaw;
  district.vehicles.push(vehicle);
  return vehicle;
}

function actor(asset, index, standing, look = skaterLooks[index]) {
  const model = clone(asset.scene);
  model.traverse((object) => {
    if (object.isSkinnedMesh) object.frustumCulled = false;
    if (!object.isMesh || object.material.name !== 'M_kit') return;
    object.material = object.material.clone();
    object.material.color.set(index < 3 ? (index ? 0x9ac4ef : 0xffffff) : 0xec8465);
  });
  if (look) styleSkater(model,look);
  scene.add(model);
  const clips = new Map([...asset.animations, ...standing].map((clip) => {
    const copy = clip.clone();
    copy.tracks = copy.tracks.filter((track) => !/^root\.(?:position|quaternion)$/.test(track.name));
    return [copy.name, copy];
  }));
  const limbs = ['thigh_l','thigh_r','calf_l','calf_r','upperarm_l','upperarm_r','lowerarm_l','lowerarm_r']
    .map((name) => model.getObjectByName(name));
  const contacts = ['foot_l','foot_r','hand_l','hand_r'].map((name) => model.getObjectByName(name));
  return { model, mixer: new THREE.AnimationMixer(model), clips, clip: '', action: null,
    limbs, contacts, pelvis:model.getObjectByName('pelvis'), stick:model.getObjectByName('Stick'), stride: 0, walkWeight: 0 };
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
    Object.assign(districtRigs,{player:asset,standing});
    actors = Array.from({ length: 6 }, (_, index) => actor(asset, index, standing));
    actors.forEach((who) => { pose(who, 'knee_idle'); who.mixer.update(0); });
    applyKit(page === 'studio' ? kitDraft : career.kit);
    $('startChallenge').disabled = false;
    if (page === 'rink') $('feedback').textContent = 'Press Start match when ready.';
    official = actor(asset,1,standing,{ height:.97,build:-.12,skin:0xd4a88d,face:{nose_big:.39,chin_strong:.48} });
    stripeOfficial(official.model);
    if (official.stick) official.stick.visible = false;
    official.model.visible = false;
    const mariaAsset = new Promise((resolve) => {
      // The rink loads with its existing rig while Maria's optional model downloads.
      loader.load('./dist/girl/lod/player_LOD1.glb', resolve, undefined, () => resolve(null));
    });
    mariaAsset.then((gltf) => {
      if (!gltf) { $('districtAvatarStatus').textContent = 'Maria’s model could not load.'; return; }
      districtRigs.maria=gltf;
      maria = actor(gltf,2,standing,{height:.945,build:0,skin:0xffe6d3,face:{}});
      maria.model.visible = false;
      alternateSkater = actor(gltf,4,standing);
      alternateSkater.model.visible = false;
      $('districtAvatar').querySelector('[value=maria]').disabled = false;
      if (career.districtAvatar === 'maria') $('districtAvatar').value = 'maria';
    });
    mariaAsset.then((gltf) => {
      const templates = [asset,gltf || asset,asset,gltf || asset].map((model,index) => seatedFan(model,index,standing));
      broadcast.mount(templates);
    }).catch((error) => console.error('Could not build rinkside spectators.',error));
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

function seatedFan(asset,index,standing) {
  const look = { ...skaterLooks[[1,3,2,4][index]], height:1 };
  const who = actor(asset,index,standing,look);
  pose(who,who.clips.has('menu_stand_idle')?'menu_stand_idle':'ref_bind');
  who.mixer.update(0);
  const seat = new THREE.Vector3(0,.12,-.065);
  if (who.pelvis) who.model.position.add(seat.sub(who.pelvis.getWorldPosition(new THREE.Vector3())));
  for (let i=0;i<2;i++) {
    const hip = who.limbs[i]?.getWorldPosition(new THREE.Vector3());
    if (!hip) continue;
    const handSide = Math.sign(hip.x);
    placeLimb(who.limbs[i],who.limbs[i+2],who.contacts[i],new THREE.Vector3(hip.x,-.37,.53),new THREE.Vector3(0,0,1));
    const hands = [
      [.19,.12,.41],
      [.24,.22,.34],
      [.15,.38,.47],
      [.29,.84,.51],
    ][index];
    placeLimb(who.limbs[i+4],who.limbs[i+6],who.contacts[i+2],new THREE.Vector3(handSide*hands[0],hands[1],hands[2]),new THREE.Vector3(handSide,-.65,0));
  }
  const parts = bakeSpectator(who.model);
  for (const part of parts) if (part.clothing) {
    // Separate darker trousers from each fan's shirt while sharing geometry across seats.
    part.material.onBeforeCompile = (shader) => {
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float seatedY;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nseatedY = position.y;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float seatedY;')
        .replace('#include <color_fragment>','#include <color_fragment>\nif (seatedY < 0.105) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025,0.032,0.04),0.85);');
    };
  }
  scene.remove(who.model);
  return parts;
}

function show(next) {
  if (next === 'credits' && !postseason()) return;
  if (page === 'credits') $('creditsFilm').creditsCleanup?.();
  if (page === 'studio' && next !== 'studio') applyKit(career.kit);
  if (page === 'district' && next !== 'district') {
    window.speechSynthesis?.cancel();
    if (maria) maria.model.visible = false;
    online.endCall();
    if(online.connected())online.away();
    for(const who of [...actors,maria,...[...remoteActors.values()].map(peer=>peer.who)]){
      if(who?.groundContact)who.groundContact.visible=false;
    }
    for (const peer of remoteActors.values()) peer.who.model.visible=false;
    if($('conversation').open)$('conversation').close();
  }
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
  if (next === 'profile') {
    if(actors[0]){actors[0].mixer.stopAllAction();actors[0].clip='';actors[0].action=null;}
    renderProfile();
  }
  if (next === 'studio') openStudio();
  if (next === 'settings') openSettings();
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
function selectDistrictAvatar() {
  $('districtAvatar').value = maria && career.districtAvatar === 'maria' ? 'maria' : 'player';
}
function openTravelMap() {
  arrival = district.ride ? { kind:district.ride.kind } : null;
  show('tour');
  $('enterVenue').textContent = arrival ? 'Travel by ' + arrival.kind : 'Explore district';
}
const districtAngles = {
  overview: { eye: [24, 25, -25], target: [0, 0, 0] },
  entrance: { eye: [-8, 5, -4], target: [0, 2, 7] },
  lobby: { eye: [0, 2.2, 7.5], target: [0, 1.5, 12] }
};
function openDistrict(angle = 'walk') {
  buildDistrict();
  $('districtAngle').value = angle;
  $('districtName').textContent = cities[selected].city;
  $('enterVenue').textContent = 'Explore district';
  selectDistrictAvatar();
  show('district');
}
function nearestTarget() {
  const { ride, x, z, speed } = district;
  const distance = (target) => Math.hypot(x-target.x,z-target.z);
  if (ride) {
    if (Math.abs(speed) > 1.2) return null;
    return district.targets.find((target) => target.kind === 'travel' && distance(target) < 3.1)
      ?? { kind: 'dismount', prompt: ride.kind === 'car' ? 'Exit car' : 'Get off bike' };
  }
  return [...district.targets, ...district.vehicles.filter((vehicle) => !vehicle.traffic)]
    .filter((target) => distance(target) < (target.kind === 'car' ? 2.45 : 1.8))
    .sort((a,b) => distance(a)-distance(b))[0];
}
function districtSpeech(line, character = '') {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance !== 'function') return;
  const voices = synth.getVoices().filter((voice) => /^en\b/i.test(voice.lang));
  const ranked = [...voices].sort((a,b) => +/natural|premium|enhanced|neural/i.test(b.name) - +/natural|premium|enhanced|neural/i.test(a.name));
  const preferred = character === 'maria' ? /aria|jenny|sonia|samantha|zira|serena|ava/i
    : character === 'player' ? /guy|ryan|alex|david|daniel|andrew/i : null;
  const speech = new SpeechSynthesisUtterance(line);
  speech.voice = (preferred && ranked.find((voice) => preferred.test(voice.name))) || ranked[Number(character) % ranked.length] || ranked[0] || null;
  speech.lang = speech.voice?.lang ?? 'en-CA';
  speech.rate = character === 'maria' ? .99 : .94;
  speech.pitch = character === 'maria' ? 1.07 : 1;
  synth.speak(speech);
}
function speakConversation() {
  window.speechSynthesis?.cancel();
  districtSpeech($('npcGreeting').textContent, $('districtAvatar').value);
  districtSpeech(dialogue.line, dialogue.voice);
}
function dismountDistrict() {
  const vehicle = district.ride;
  const clearance = vehicle.kind === 'car' ? 1.33 : .86;
  for (const angle of [Math.PI/2,-Math.PI/2,Math.PI]) {
    const distance = angle === Math.PI ? clearance + 1.08 : clearance;
    const x = vehicle.x + Math.sin(vehicle.yaw+angle)*distance;
    const z = vehicle.z + Math.cos(vehicle.yaw+angle)*distance;
    if (!districtPositionClear(x,z,vehicle.yaw,'walk')) continue;
    Object.assign(district,{ x,z,ride:null,speed:0,vx:0,vz:0,exitBlocked:false });
    return;
  }
  district.exitBlocked = true;
}
function interact(target=nearestTarget()) {
  if (page !== 'district' || $('conversation').open) return;
  if (!target) return;
  if (target.kind === 'arena') { openRink('campaign'); return; }
  if (target.kind === 'travel') { openTravelMap(); return; }
  if (target.kind === 'dismount') { dismountDistrict(); return; }
  if (target.kind === 'bike' || target.kind === 'car') {
    Object.assign(district,{ ride:target, x:target.x, z:target.z, yaw:target.yaw, speed:0, vx:0, vz:0 });
    return;
  }
  openDistrictConversation(target);
}
function openDistrictConversation(target) {
  dialogue=target;
  const real=target.kind==='remote';
  $('npcName').textContent=target.name;
  $('npcIntro').hidden=real;
  $('npcChatActions').hidden=real;
  $('playerChatActions').hidden=!real;
  $('districtAccept').hidden=online.incoming()?.id!==target.id;
  $('districtCall').hidden=!$('districtAccept').hidden;
  $('chatStatus').textContent='';
  $('districtText').value='';
  $('districtChatNotice').hidden=true;
  keys.clear();district.vx=district.vz=0;
  if(!$('conversation').open)$('conversation').showModal();
  if(real){drawChat(online.histories.get(target.id)||[]);return;}
  if (target.kind === 'coach' && !career.encountered.includes(target.id)) { career.encountered.push(target.id); save(); }
  $('npcLine').textContent = target.line;
  $('npcGreeting').textContent = target.kind === 'coach' ? 'Do you have any advice for my next match?' : 'Hi there. How’s it going?';
  $('npcFollow').hidden = !target.id;
  $('npcFollow').textContent = career.following.includes(target.id) ? 'Unfollow' : 'Follow';
  target.history=[];
  drawChat(target.history);
  speakConversation();
}
function drawChat(history) {
  const rows=history.map(({name,text})=>{
    const row=document.createElement('p');
    const author=document.createElement('strong');
    author.textContent=name+': ';
    row.append(author,document.createTextNode(text));
    return row;
  });
  const log=$('chatHistory');log.replaceChildren(...rows);log.scrollTop=log.scrollHeight;
}
function receiveDistrictMessage(packet) {
  if(page!=='district')return;
  if($('conversation').open&&dialogue?.kind==='remote'&&dialogue.id===packet.id){
    if(packet.type==='text')drawChat(online.histories.get(packet.id)||[]);
    else{$('districtAccept').hidden=false;$('districtCall').hidden=true;$('chatStatus').textContent='Incoming voice call.';}
    return;
  }
  const notification=$('districtChatNotice'),open=document.createElement('button');
  open.textContent=(packet.type==='text'?'Message from ':'Voice call from ')+packet.name;
  open.onclick=()=>openDistrictConversation({kind:'remote',id:packet.id,name:packet.name});
  notification.replaceChildren(open);notification.hidden=false;
}
function pickDistrictPerson(px,py) {
  const view=$('districtPreview').getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((px-view.left)/view.width*2-1,1-(py-view.top)/view.height*2),camera);
  const wallHits=raycaster.intersectObjects(district.blockers.filter(box=>box.mesh.visible).map(box=>box.mesh),false);
  let depth=wallHits[0]?.distance??Infinity, candidate;
  for (const person of [...district.people,...[...remoteActors.values()].filter(peer=>peer.who.model.visible).map(peer=>peer.person)]){
    const spot=new THREE.Vector3(person.x,.94,person.z);
    const hit=raycaster.ray.intersectSphere(new THREE.Sphere(spot,.63),new THREE.Vector3());
    if(!hit)continue;
    const distance=hit.distanceTo(raycaster.ray.origin);
    if(distance<depth){depth=distance;candidate=person;}
  }
  if(candidate)openDistrictConversation(candidate);
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
  $('rinkSurface').value=mode==='campaign'?(selected%2?'plastic':'carpet'):preferences.surface;
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

function districtPositionClear(x,z,yaw,kind,ignored) {
  return districtClear(x,z,yaw,kind,districtBounds,district.blockers.concat(district.people),district.vehicles,ignored);
}
function renderDistrictMap() {
  const map = $('districtLayout');
  const svg = (tag, attributes) => {
    const item = document.createElementNS('http://www.w3.org/2000/svg',tag);
    for (const [name,value] of Object.entries(attributes)) item.setAttribute(name,value);
    return item;
  };
  const buildings = district.blockers.filter((box) => Math.abs(box.x)<24 && Math.abs(box.z)<20);
  map.replaceChildren(svg('path',{d:'M0 54H120',class:'mini-road'}), ...buildings.map((box) => svg('rect',{
    x:60-(box.x+box.w)*2.2,y:48-(box.z+box.d)*2,
    width:Math.max(.8,box.w*4.4),height:Math.max(.8,box.d*4),class:'mini-building',
  })), ...district.targets.filter((target) => target.kind==='arena' || target.kind==='travel').map((target) => svg('circle',{
    cx:60-target.x*2.2,cy:48-target.z*2,r:2.6,class:'mini-coach',
  })));
}
function updateDistrict(dt) {
  if ($('conversation').open || $('campaignRoom').open) return 0;
  const x = Number(keys.has('KeyA') || keys.has('ArrowLeft')) - Number(keys.has('KeyD') || keys.has('ArrowRight'));
  const z = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  const { ride } = district;
  if (x || z) $('districtAngle').value = 'walk';
  let distance = 0;
  if (ride) {
    const braking = keys.has('Space');
    const isBike = ride.kind === 'bike';
    const goal = braking ? 0 : z > 0 ? (isBike ? 7 : 12) : z < 0 ? (isBike ? -2 : -3.4) : 0;
    const acceleration = braking ? 16 : z ? (isBike ? 5 : 7) : 2.6;
    district.speed += cap(goal-district.speed,-acceleration*dt,acceleration*dt);
    const yaw = district.yaw+x*Math.sign(district.speed)*Math.min(1,Math.abs(district.speed))*(isBike ? 1.85 : 1.36)*dt;
    const result = moveDistrictBody(district,Math.sin(yaw)*district.speed*dt,Math.cos(yaw)*district.speed*dt,yaw,
      (px,pz,angle) => districtPositionClear(px,pz,angle,ride.kind,ride));
    if (result.blocked) district.speed = 0;
    if (result.distance > .003) district.exitBlocked = false;
    Object.assign(ride,{x:district.x,z:district.z,yaw:district.yaw});
    distance = result.distance;
  } else {
    const scale = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3.85 : 2.15) / Math.max(1,Math.hypot(x,z));
    const heading=district.cameraYaw;
    const forwardX=x*Math.cos(heading)+z*Math.sin(heading);
    const forwardZ=z*Math.cos(heading)-x*Math.sin(heading);
    const blend = 1-Math.exp(-dt*(x||z?13:22));
    district.vx += (forwardX*scale-district.vx)*blend;
    district.vz += (forwardZ*scale-district.vz)*blend;
    const angle = x||z ? Math.atan2(forwardX,forwardZ) : district.yaw;
    const turn = Math.atan2(Math.sin(angle-district.yaw),Math.cos(angle-district.yaw));
    distance = moveDistrictBody(district,district.vx*dt,district.vz*dt,district.yaw+turn*(1-Math.exp(-14*dt)),
      (px,pz,yaw) => districtPositionClear(px,pz,yaw,'walk'),true).distance;
  }
  for (const person of district.people) {
    person.walking = false;
    if (!person.route) continue;
    const next = person.x + person.direction * .85 * dt;
    if (next < person.route[0] || next > person.route[1] || Math.hypot(next-district.x,person.z-district.z)<1
      || !districtClear(next,person.z,person.yaw,'walk',districtBounds,district.blockers,district.vehicles)) {
      person.direction *= -1;
      continue;
    }
    person.x=next; person.yaw=person.direction*Math.PI/2; person.walking=true;
  }
  const occupants = ride ? district.people : [...district.people,{x:district.x,z:district.z,w:.38,d:.38}];
  for (const vehicle of district.vehicles) {
    let travel = vehicle === ride ? Math.sign(district.speed)*distance : 0;
    if (vehicle.traffic) {
      const next = vehicle.x + Math.sin(vehicle.yaw)*3.2*dt;
      if (districtClear(next,vehicle.z,vehicle.yaw,'car',districtBounds,district.blockers.concat(occupants),district.vehicles,vehicle)) {
        travel = 3.2 * dt; vehicle.x = next;
      } else if (vehicle.x * Math.sin(vehicle.yaw) > 24.8) {
        const incoming = -Math.sign(vehicle.x)*24.3;
        if (districtClear(incoming,vehicle.z,vehicle.yaw,'car',districtBounds,district.blockers.concat(occupants),district.vehicles,vehicle)) vehicle.x = incoming;
      }
    }
    vehicle.model.position.set(vehicle.x,0,vehicle.z);
    vehicle.model.rotation.y = vehicle.yaw;
    for (const wheel of vehicle.wheels) {
      if (vehicle.kind === 'bike') wheel.rotateZ(-travel/.32);
      else wheel.rotateY(travel/.32);
    }
    if (vehicle.crank) vehicle.crank.rotation.x -= travel/.46;
  }
  const nearby = nearestTarget();
  $('districtDot').setAttribute('cx',60-district.x*2.2);
  $('districtDot').setAttribute('cy',48-district.z*2);
  $('interact').disabled = !nearby;
  const prompt = nearby?.prompt || (nearby?.name ? 'Talk to '+nearby.name : nearby?.kind === 'car' ? 'Drive car' : 'Ride bike');
  $('interact').textContent = (nearby ? prompt : 'Interact')+' · E';
  $('districtHint').textContent = district.exitBlocked ? 'Move away from the obstacle before getting out.'
    : ride ? Math.round(Math.abs(district.speed)*3.6)+' km/h' : '';
  $('districtControls').textContent = ride ? 'W/S Accelerate or reverse · A/D Steer · Space Brake · E Interact when stopped'
    : 'WASD Move · Shift Run · Click to talk · Drag either mouse button to look';
  return distance/dt || 0;
}
function updateRemoteWalkers(dt,time,speed){
  if(online.connected()&&time>=nextDistrictSend){
    nextDistrictSend=time+100;
    const {x,z,yaw,ride}=district;
    online.move({x,z,yaw,speed:cap(speed,0,13),city:selected,avatar:$('districtAvatar').value,ride:ride?.kind});
  }
  for(const [id,peer] of remoteActors){
    const player=online.players.get(id);
    if(player?.city===selected&&peer.avatar===player.avatar)continue;
    scene.remove(peer.who.model);
    if(peer.who.groundContact){scene.remove(peer.who.groundContact);peer.who.groundContact.geometry.dispose();}
    peer.who.model.traverse(item=>{
      if(item.isSprite){item.material.map.dispose();item.material.dispose();}
      else if(['M_kit','M_skin'].includes(item.material?.name))item.material.dispose();
    });
    peer.marker.remove();
    remoteActors.delete(id);
  }
  if(!districtRigs.player)return;
  for(const player of online.players.values()){
    if(player.city!==selected)continue;
    let peer=remoteActors.get(player.id);
    if(!peer){
      const who=actor(districtRigs[player.avatar]||districtRigs.player,1,districtRigs.standing);
      if(who.stick)who.stick.visible=false;
      const nameTag=label(player.name,0,0,0);
      who.model.add(nameTag);nameTag.position.set(0,2.02,0);nameTag.scale.set(1.44,.27,1);
      const marker=document.createElementNS('http://www.w3.org/2000/svg','circle');
      marker.setAttribute('class','mini-peer');marker.setAttribute('r','2.8');$('districtPeers').append(marker);
      peer={who,marker,avatar:player.avatar,person:{kind:'remote',id:player.id,name:player.name,x:player.x,z:player.z,yaw:player.yaw}};
      remoteActors.set(player.id,peer);
    }
    const who=peer.who, ready=peer.person;
    const blend=1-Math.exp(-dt*13);
    ready.x+= (player.x-ready.x)*blend;ready.z+=(player.z-ready.z)*blend;
    ready.yaw+=Math.atan2(Math.sin(player.yaw-ready.yaw),Math.cos(player.yaw-ready.yaw))*blend;
    who.model.visible=true;who.model.position.set(ready.x,0,ready.z);who.model.rotation.y=ready.yaw;
    districtGait(who,dt,player.ride?0:Math.min(player.speed,3.85));
    groundWalker(who,ready,!player.ride);
    peer.marker.setAttribute('cx',60-ready.x*2.2);peer.marker.setAttribute('cy',48-ready.z*2);
  }
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
        const speech=new SpeechSynthesisUtterance(line); speech.rate=1.12; speech.volume=preferences.voiceVolume/100;
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

function walkPose(who, dt, speed) {
  pose(who, who.clips.has('menu_stand_idle') ? 'menu_stand_idle' : 'ref_bind');
  // Remove the last additive pose before sampling, including bones the idle clip leaves unkeyed.
  if (who.walkBase) who.limbs.forEach((bone,index) => bone?.quaternion.copy(who.walkBase[index]));
  who.mixer.update(dt);
  who.walkBase ??= who.limbs.map((bone) => bone?.quaternion.clone());
  who.limbs.forEach((bone,index) => { if (bone) who.walkBase[index].copy(bone.quaternion); });
  who.walkWeight += (Math.min(speed/.9,1)-who.walkWeight)*(1-Math.exp(-12*dt));
  who.stride += dt*Math.min(18,speed*3.7);
  const swing = Math.sin(who.stride)*who.walkWeight;
  const knee = Math.cos(who.stride)*who.walkWeight;
  const angles = [swing*.35,-swing*.35,Math.max(0,knee)*.38,Math.max(0,-knee)*.38,-swing*.24,swing*.24,-.10,-.10];
  who.limbs.forEach((bone,index) => bone?.rotateX(angles[index]));
}
function districtGait(who,dt,speed) {
  // Evaluate the idle rig first, then use ankle targets to keep the stance foot at floor height.
  if(who.gaitFeet)who.contacts.slice(0,2).forEach((foot,i)=>foot?.quaternion.copy(who.gaitFeet[i]));
  walkPose(who,dt,0);
  who.gaitFeet??=who.contacts.slice(0,2).map(foot=>foot?.quaternion.clone());
  who.contacts.slice(0,2).forEach((foot,i)=>{if(foot)who.gaitFeet[i].copy(foot.quaternion);});
  who.gaitBlend=THREE.MathUtils.damp(who.gaitBlend??0,cap(speed/.75,0,1),12,dt);
  if(who.gaitBlend<.015)return;
  const run=cap((speed-2.2)/1.7,0,1), cycle=1.52+run*.57, stance=.62-run*.11;
  who.gaitPhase=((who.gaitPhase??0)+speed*dt/cycle)%1;
  const phase=who.gaitPhase;
  const span=cycle*stance*.5;
  const blend=who.gaitBlend;
  const model=who.model;
  const position=model.position.clone();
  model.position.y+=(-.056+Math.cos(phase*4*Math.PI)*.018)*blend;
  const ahead=new THREE.Vector3(Math.sin(model.rotation.y),0,Math.cos(model.rotation.y));
  for(let i=0;i<2;i++){
    const foot=who.contacts[i], hip=who.limbs[i];
    if(!foot||!hip)continue;
    const t=(phase+i*.5)%1;
    const swing=cap((t-stance)/(1-stance),0,1);
    const offset=t<stance ? span-cycle*t : THREE.MathUtils.lerp(-span,span,swing*swing*(3-2*swing));
    const clearance=t<stance?0:Math.sin(swing*Math.PI)*(.15+run*.12);
    const local=model.worldToLocal(foot.getWorldPosition(new THREE.Vector3()));
    const floorY=cap(local.y*model.scale.y,.055,.125);
    const target=model.localToWorld(new THREE.Vector3(local.x,0,offset*blend+local.z));
    target.y=position.y+THREE.MathUtils.lerp(local.y*model.scale.y,floorY+clearance,blend);
    const flat=foot.getWorldQuaternion(new THREE.Quaternion());
    placeLimb(hip,who.limbs[i+2],foot,target,ahead.clone());
    foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(flat));
    const arm=-Math.cos(t*Math.PI*2)*(.24+run*.23)*blend;
    who.limbs[i+4]?.rotateX(arm);
    who.limbs[i+6]?.rotateX(-(.13+run*.26)*blend);
  }
}
function groundWalker(who,position,visible) {
  if(!who.groundContact){
    if(!groundContactMaterial){
      const mask=document.createElement('canvas');mask.width=mask.height=64;
      const ctx=mask.getContext('2d');
      const edge=ctx.createRadialGradient(32,32,4,32,32,32);
      edge.addColorStop(0,'rgba(12,24,22,.56)');edge.addColorStop(.62,'rgba(12,24,22,.28)');edge.addColorStop(1,'rgba(12,24,22,0)');
      ctx.fillStyle=edge;ctx.fillRect(0,0,64,64);
      groundContactMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(mask),transparent:true,depthWrite:false});
    }
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.88,.78),groundContactMaterial);
    shadow.rotation.x=-Math.PI/2;scene.add(shadow);
    who.groundContact=shadow;
  }
  who.groundContact.position.set(position.x,.008,position.z);
  who.groundContact.visible=visible;
}
function aimBone(bone, from, toward) {
  const worldTurn = new THREE.Quaternion().setFromUnitVectors(from.normalize(),toward.normalize());
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.premultiply(parent.clone().invert().multiply(worldTurn).multiply(parent));
}
function placeLimb(upper, lower, end, target, bend) {
  if (!upper || !lower || !end) return;
  const start = upper.getWorldPosition(new THREE.Vector3());
  const joint = lower.getWorldPosition(new THREE.Vector3());
  const tip = end.getWorldPosition(new THREE.Vector3());
  const a = start.distanceTo(joint), b = joint.distanceTo(tip);
  const direction = target.clone().sub(start);
  if (a < .005 || b < .005 || direction.lengthSq() < .00001) return;
  const distance = cap(direction.length(),Math.abs(a-b)+.001,a+b-.001);
  direction.normalize();
  const side = bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const leg = (a*a-b*b+distance*distance)/(2*distance);
  const towardJoint = direction.clone().multiplyScalar(leg).addScaledVector(side,Math.sqrt(Math.max(0,a*a-leg*leg)));
  aimBone(upper,joint.sub(start),towardJoint);
  lower.getWorldPosition(joint);
  end.getWorldPosition(tip);
  aimBone(lower,tip.sub(joint),target.clone().sub(joint));
}
function bikePose(who, ride) {
  const local = (x,y,z) => ride.model.localToWorld(new THREE.Vector3(x,y,z));
  const seat = local(0,1.00,-.25);
  if (who.pelvis) who.model.position.add(seat.sub(who.pelvis.getWorldPosition(new THREE.Vector3())));
  for (let index=0;index<2;index++) {
    const side = index ? -1 : 1;
    const forward = new THREE.Vector3(Math.sin(ride.yaw),0,Math.cos(ride.yaw));
    const pedalY = .49+side*.13*Math.cos(ride.crank.rotation.x);
    const pedalZ = -.05+side*.13*Math.sin(ride.crank.rotation.x);
    placeLimb(who.limbs[index],who.limbs[index+2],who.contacts[index],local(side*.18,pedalY,pedalZ),forward);
    placeLimb(who.limbs[index+4],who.limbs[index+6],who.contacts[index+2],local(side*.22,1.11,.49),new THREE.Vector3(0,-1,0));
  }
}
function updateOfficial(dt, puck, game) {
  const who = official;
  const spot = who.model.position;
  const call = game?.event;
  if (who.lastCall !== call) {
    who.lastCall = call;
    who.callTime = call ? 1.2 : 0;
  }
  who.callTime = Math.max(0,(who.callTime ?? 0)-dt);
  const atDraw = game?.faceoff;
  const desiredZ = atDraw ? (atDraw.side ? 1.2 : -1.2) : cap(puck.z,-6.1,6.1);
  const motion = cap(desiredZ-spot.z,-dt*2.15,dt*2.15);
  spot.set(-5.52,0,spot.z+motion);
  who.model.rotation.y = Math.atan2(puck.x-spot.x,puck.z-spot.z);
  const running = Math.abs(motion)/(dt || 1);
  walkPose(who,dt,running);
  const active = who.callTime>0 ? call?.type : '';
  if (active !== 'goal' && active !== 'travel' && !atDraw) return;
  const z = active === 'travel' ? (call.side ? -1 : 1) : 0;
  const aim = new THREE.Vector3(active==='goal'?.51:.59,active==='goal'?1.23:atDraw?.96:1.38,z*.38);
  aim.add(spot);
  placeLimb(who.limbs[4],who.limbs[6],who.contacts[2],aim,new THREE.Vector3(0,-1,0));
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
  const characterView=page==='profile'||page==='studio';
  street.visible = page === 'district';
  world.visible = !street.visible&&!characterView;
  previewPlinth.visible=characterView;
  if (!scene.background) scene.background = new THREE.Color();
  scene.background.set(street.visible ? 0x8eabb9 : page==='profile'?0x26312c:page==='studio'?0x141d2e:0x222b36);
  scene.fog.color.copy(scene.background);
  const rinkStyle = page === 'rink' && mode === 'campaign' ? selected % venueDetails.length : 0;
  if(page==='home' && !reelPaused)reelTime=(reelTime+realDt)%120;
  const highlight=page==='home' && actors.length ? reel(reelTime) : null;
  if (alternateSkater && (highlight || page === 'rink' && !match)) {
    if(actors[4].groundContact){scene.remove(actors[4].groundContact);actors[4].groundContact.geometry.dispose();}
    scene.remove(actors[4].model);
    actors[4] = alternateSkater;
    alternateSkater = null;
  }
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
  actors.forEach((who,index) => {
    who.model.visible = Boolean(highlight || page==='rink' || (street.visible ? index<=district.people.length : index===0));
    if (who.stick) who.stick.visible = !street.visible;
  });
  if(highlight && !reelPaused || page==='rink')broadcast.update(time/1000,Boolean(highlight?.crowd || time<crowdUntil));
  if (official) {
    official.model.visible = Boolean(highlight || page==='rink');
    if (official.model.visible && !$('pauseMenu').open && (!highlight || !reelPaused)) {
      updateOfficial(dt,highlight?.ball || match?.ball || {x:0,z:0},highlight ? null : match);
    }
  }
  if (street.visible && district) {
    const speed = updateDistrict(dt);
    const { x,z,yaw,ride } = district;
    const avatar = $('districtAvatar').value === 'maria' && maria ? maria : actors[0];
    if (maria) maria.model.visible = false;
    if (actors[0]) actors[0].model.visible = false;
    if(maria?.groundContact)maria.groundContact.visible=false;
    if(actors[0]?.groundContact)actors[0].groundContact.visible=false;
    if (avatar) {
      avatar.model.visible = ride?.kind !== 'car';
      avatar.model.position.set(x,0,z);
      avatar.model.rotation.y = yaw;
      if (avatar.stick) avatar.stick.visible = false;
      if (avatar.model.visible) {
        if (ride?.kind === 'bike') {walkPose(avatar,dt,0);bikePose(avatar,ride);}
        else districtGait(avatar,dt,speed);
      }
      groundWalker(avatar,{x,z},!ride);
    }
    district.people.forEach((person,index) => {
      const who = actors[index+1];
      if (!who) return;
      who.model.position.set(person.x,0,person.z);
      who.model.rotation.y = person.yaw;
      districtGait(who,dt,person.walking ? .85 : 0);
      groundWalker(who,person,true);
    });
    updateRemoteWalkers(dt,time,speed);
    const heading = district.cameraYaw+(ride?yaw:0);
    let inside = false;
    for (const room of district.rooms) {
      const isInside = z >= room.front-.1 && z < room.front+room.depth && Math.abs(x-room.x)<room.width/2;
      for (const part of room.frontage) part.visible = !isInside;
      inside ||= isInside;
    }
    const venueAngle = districtAngles[$('districtAngle').value];
    if (venueAngle) {
      districtCamera.set(...venueAngle.eye);
      districtLook.set(...venueAngle.target);
      camera.position.lerp(districtCamera, 1 - Math.exp(-12 * dt));
      camera.lookAt(districtLook);
    } else {
    const viewDistance = ride ? 6.5 : inside ? 3.8 : 5.4;
    const range=viewDistance*Math.cos(district.cameraPitch);
    districtCamera.set(x-Math.sin(heading)*range,1.05+viewDistance*Math.sin(district.cameraPitch),z-Math.cos(heading)*range);
    districtLook.set(x,1.02,z);
    const sight=districtCamera.clone().sub(districtLook), length=sight.length();
    const ray=new THREE.Ray(districtLook,sight.normalize());
    let visible=length;
    for(const box of district.blockers){
      if(!box.mesh.visible)continue;
      const bounds=new THREE.Box3(new THREE.Vector3(box.x-box.w,0,box.z-box.d),new THREE.Vector3(box.x+box.w,box.h,box.z+box.d));
      const hit=ray.intersectBox(bounds,new THREE.Vector3());
      if(hit)visible=Math.min(visible,Math.max(.6,hit.distanceTo(districtLook)-.25));
    }
    if(visible<length)districtCamera.copy(districtLook).addScaledVector(sight,visible);
    if (!district.cameraReady) { camera.position.copy(districtCamera); district.cameraReady=true; }
    else camera.position.lerp(districtCamera,1-Math.exp(-9*dt));
    camera.lookAt(districtLook);
    }
  } else if (page==='rink' || highlight) {
    if(!highlight)updateRink(dt);
    const states = highlight?.players ?? match?.players ?? [{x:-.55,z:-.85},{x:2.15,z:-1.7},{x:0,z:-5.82,goalie:true},
      {x:.55,z:.85,side:1},{x:-2.15,z:1.7,side:1},{x:0,z:5.82,side:1,goalie:true}];
    actors.forEach((who,index) => {
      const state=states[index];
      who.model.position.set(state.x,0,state.z); who.model.rotation.y=state.yaw ?? (state.side ? Math.PI : 0);
      if ($('pauseMenu').open || highlight && reelPaused) return;
      if (state.onFeet) walkPose(who,dt,state.walking ? 2 : 0);
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
      const zoom=preferences.camera==='close'?.88:1;
      camera.position.set(0,8.8*zoom,-12.6*zoom); camera.lookAt(0,.05,.4);
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
      if(page==='studio'){
        if(studioRotate)studioYaw+=dt*.55;
        if(studioAutoplay && time>=studioNext){
          const choices=$('studioPose');
          choices.selectedIndex=(choices.selectedIndex+1)%choices.length;
          studioNext=time+4100;
        }
        pose(who,$('studioPose').value);
      } else pose(who,'knee_idle');
      who.mixer.update(page==='studio'?dt:0);
    }
    const fit=Math.max(1,.72/camera.aspect);
    camera.position.set(.47,1.25,2.95*fit); camera.lookAt(0,.66,.25);
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
  $('displayHandle').textContent='@'+career.handle;
  $('profileKitName').textContent=career.kit.name || career.name;
  $('displayName').textContent=career.name;
  $('displayBio').textContent=career.bio;
  $('profileMascot').textContent=mascots[career.mascot] || '🏒';
  $('youtubeLink').hidden=!career.youtube;
  if (career.youtube) $('youtubeLink').href=career.youtube;
  $('levelTitle').textContent='Level ' + info.level;
  $('xpLevel').textContent='Level ' + info.level;
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
    const title=document.createElement('h3');title.textContent='Trophy case';
    const trophies=document.createElement('ul'); trophies.className='profile-stat-grid';
    for (const [label,earned] of [
      ['First win',career.matches.some(match=>match.scores[0]>match.scores[1])],['Road win',career.wins.length>0],['Tour champion',career.wins.length===cities.length],
    ]) {
      const item=document.createElement('li'); item.textContent=(earned?'✓ ':'')+label;
      if(!earned)item.setAttribute('data-locked','');
      trophies.append(item);
    }
    content.append(list,title,trophies);
  } else if(profileTab==='items') {
    const kit=document.createElement('p');kit.textContent='Equipped jersey · '+(career.kit.name||career.name)+' #'+career.kit.number;
    content.append(kit);
  } else if(profileTab==='marketplace') {
    const empty=document.createElement('p');empty.textContent='No marketplace activity.';
    content.append(empty);
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
let studioYaw=0,studioAutoplay=true,studioRotate=false,studioNext=0;
function openStudio() {
  kitDraft={...career.kit}; studioYaw=0;
  for (const [id,key] of [['kitColor','color'],['kitNumber','number'],['kitName','name'],['playerHeight','height'],['playerBuild','build']]) $(id).value=kitDraft[key];
  studioAutoplay=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  studioRotate=false;studioNext=performance.now()+4100;
  $('studioPose').value='knee_idle'; $('studioStatus').textContent='';
  $('studioAutoPlay').setAttribute('aria-pressed',String(studioAutoplay));
  $('studioAutoRotate').setAttribute('aria-pressed','false');
}
function updateStudio() {
  kitDraft={color:$('kitColor').value, number:cap($('kitNumber').valueAsNumber||0,0,99),
    name:$('kitName').value, height:cap($('playerHeight').valueAsNumber||183,150,205), build:$('playerBuild').valueAsNumber||0};
  applyKit(kitDraft);
}

function openPause() {
  if(page==='rink'&&!$('pauseMenu').open&&!$('matchResult').open){keys.clear();$('pauseMenu').showModal();}
}
function openSettings() {
  $('settings').replaceChildren(settingsView([
    {title:'Gameplay',rows:[{key:'surface',title:'Default surface',help:'The surface selected when a match opens.',options:[['carpet','Carpet'],['plastic','Plastic']]}]},
    {title:'Camera & display',rows:[{key:'camera',title:'Match camera',help:'Change how closely you view the rink.',options:[['broadcast','Broadcast'],['close','Close']]}]},
    {title:'Audio',rows:[{key:'commentary',title:'Commentary',help:'Play voice commentary on goals, saves, and calls.'},{key:'voiceVolume',title:'Commentary volume',help:'Set the volume of the announcer.',range:true}]},
    {title:'Accessibility',rows:[{key:'stillHome',title:'Pause home highlights',help:'Keep the main menu background still.'}]},
  ],preferences,(key,value)=>{
    preferences[key]=value;
    if(key==='commentary')commentary=value;
    if(key==='stillHome')reelPaused=value;
    updatePresentationButtons();save();
  },()=>show('home'),preferenceDefaults));
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
$('enterVenue').onclick=()=>openDistrict();
$('previewVenue').onclick=()=>openDistrict('overview');
$('districtAngle').onchange=()=>{ district.cameraReady=false; };
$('interact').onclick=()=>interact();
$('districtTravelMap').onclick=openTravelMap;
$('npcClose').onclick=()=>$('conversation').close();
$('npcReplay').onclick=()=>{
  const line=dialogue?.history?.at(-1)?.text||dialogue?.line;
  if(line){window.speechSynthesis?.cancel();districtSpeech(line,dialogue.voice);}
};
let currentSpeechInput;
$('conversation').addEventListener('close',()=>{
  window.speechSynthesis?.cancel();
  currentSpeechInput?.abort();
  if(dialogue?.kind==='remote')online.endCall();
});
$('districtRoomOpen').onclick=()=>{keys.clear();$('campaignRoom').showModal();};
$('campaignClose').onclick=()=>$('campaignRoom').close();
$('campaignLeave').onclick=()=>{online.disconnect();$('campaignRoom').close();};
$('campaignNewCode').onclick=()=>{
  $('campaignCode').value=[...crypto.getRandomValues(new Uint8Array(4))].map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase();
};
$('campaignJoin').onsubmit=(event)=>{
  event.preventDefault();
  online.connect($('campaignCode').value.trim().toUpperCase(),career.name);
};
$('districtMessage').onsubmit=async (event)=>{
  event.preventDefault();
  const target=dialogue, text=$('districtText').value.trim();
  if(!target||!text)return;
  $('districtText').value='';
  try{
    if(target.kind==='remote'){
      await online.message(target.id,text);
      if(dialogue===target)drawChat(online.histories.get(target.id)||[]);
    }else{
      const reply=/arena|match|play|rink/i.test(text)?'Head to the arena lobby to start a match.'
        : /car|bike|ride/i.test(text)?'There’s a car and a bike beside the crosswalk.'
        : /hello|^hi\b|^hey\b/i.test(text)?'Hi! Welcome to '+cities[selected].city+'.':target.line;
      target.history.push({name:'You',text},{name:target.name,text:reply});
      target.history=target.history.slice(-50);
      drawChat(target.history);window.speechSynthesis?.cancel();districtSpeech(reply,target.voice);
    }
  } catch(error) {if(dialogue===target){$('districtText').value=text;$('chatStatus').textContent=error.message;}}
};
const SpeechInput=window.SpeechRecognition||window.webkitSpeechRecognition;
$('npcDictate').hidden=!SpeechInput;
$('npcDictate').onclick=()=>{
  if(currentSpeechInput)return;
  const input=new SpeechInput();currentSpeechInput=input;input.lang='en-CA';input.interimResults=false;
  const target=dialogue;
  input.onresult=(event)=>{if($('conversation').open&&target===dialogue)$('districtText').value=event.results[0][0].transcript.slice(0,500);};
  input.onerror=()=>{$('chatStatus').textContent='Voice input unavailable. You can type a message.';};
  input.onend=()=>{currentSpeechInput=null;};
  try{input.start();}catch{currentSpeechInput=null;$('chatStatus').textContent='Voice input unavailable.';}
};
function tryVoice(operation){
  operation.catch((error)=>{
    online.endCall();
    $('chatStatus').textContent=error.name==='NotAllowedError'?'Microphone permission was denied.':error.message;
  });
}
$('districtCall').onclick=()=>{if(dialogue?.kind==='remote')tryVoice(online.voice(dialogue.id));};
$('districtAccept').onclick=()=>{
  $('districtAccept').hidden=true;$('districtCall').hidden=false;
  tryVoice(online.accept());
};
$('districtEnd').onclick=()=>{online.endCall();$('districtAccept').hidden=true;$('districtCall').hidden=false;};
$('districtHear').onclick=online.enableAudio;
$('districtAvatar').onchange=()=>{
  career.districtAvatar=$('districtAvatar').value;
  $('districtAvatar').blur();
  save();
};
$('npcFollow').onclick=()=>{
  if(!dialogue?.id)return;
  const followed=career.following.includes(dialogue.id);
  career.following=followed?career.following.filter((id)=>id!==dialogue.id):[...career.following,dialogue.id];
  $('npcFollow').textContent=followed?'Follow':'Unfollow';save();
};
$('editProfile').onclick=editProfile;$('closeProfileEditor').onclick=()=>$('profileEditor').close();$('profileForm').onsubmit=saveProfile;
$('studioForm').oninput=updateStudio;
$('studioPose').onchange=()=>{studioAutoplay=false;$('studioAutoPlay').setAttribute('aria-pressed','false');};
$('studioAutoPlay').onclick=()=>{
  studioAutoplay=!studioAutoplay;studioNext=performance.now()+4100;
  $('studioAutoPlay').setAttribute('aria-pressed',String(studioAutoplay));
};
$('studioAutoRotate').onclick=()=>{
  studioRotate=!studioRotate;$('studioAutoRotate').setAttribute('aria-pressed',String(studioRotate));
};
document.querySelectorAll('[data-kit-tab]').forEach((button)=>button.onclick=()=>{
  document.querySelectorAll('[data-kit-tab]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  document.querySelectorAll('[data-kit-panel]').forEach(item=>{item.hidden=item.dataset.kitPanel!==button.dataset.kitTab;});
});
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
  preferences.stillHome=reelPaused;updatePresentationButtons();save();
};
function updatePresentationButtons(){
  $('reelPause').textContent=reelPaused?'Play highlights':'Pause highlights';
  $('commentaryToggle').setAttribute('aria-pressed',String(commentary));
  $('commentaryToggle').textContent=commentary?'Commentary on':'Commentary off';
  if(!commentary){window.speechSynthesis?.cancel();$('commentaryCaption').hidden=true;}
}
updatePresentationButtons();
$('commentaryToggle').onclick=()=>{
  commentary=!commentary;preferences.commentary=commentary;updatePresentationButtons();save();
};
$('resume').onclick=()=>$('pauseMenu').close();
const returnFromRink=()=>show(mode==='campaign'?'district':'home');
$('leaveRink').onclick=()=>{$('pauseMenu').close();returnFromRink();};
$('resultContinue').onclick=()=>{$('matchResult').close();returnFromRink();};
$('resultCredits').onclick=()=>{$('matchResult').close();show('credits');};
$('matchResult').addEventListener('cancel',(event)=>event.preventDefault());
const ground = new THREE.Plane(new THREE.Vector3(0,1,0),-.45);
const raycaster = new THREE.Raycaster();
const districtView=$('districtPreview');
let orbitDrag;
districtView.onpointerdown=(event)=>{
  if(![0,2].includes(event.button)||page!=='district')return;
  orbitDrag={id:event.pointerId,button:event.button,x:event.clientX,y:event.clientY,travel:0};
  districtView.setPointerCapture(event.pointerId);
};
districtView.onpointermove=(event)=>{
  if(orbitDrag?.id!==event.pointerId)return;
  const dx=event.clientX-orbitDrag.x,dy=event.clientY-orbitDrag.y;
  orbitDrag.travel+=Math.hypot(dx,dy);
  orbitDrag.x=event.clientX;orbitDrag.y=event.clientY;
  if(orbitDrag.travel<5)return;
  $('districtAngle').value='walk';
  district.cameraYaw-=dx*.009;district.cameraPitch=cap(district.cameraPitch+dy*.007,.18,1.12);
  districtView.classList.add('is-dragging');
};
districtView.onpointerup=(event)=>{
  if(orbitDrag?.id!==event.pointerId)return;
  const click=orbitDrag.button===0&&orbitDrag.travel<5;
  orbitDrag=null;districtView.classList.remove('is-dragging');
  if(click)pickDistrictPerson(event.clientX,event.clientY);
};
districtView.onlostpointercapture=()=>{orbitDrag=null;districtView.classList.remove('is-dragging');};
districtView.oncontextmenu=(event)=>event.preventDefault();
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
  if (event.target instanceof HTMLSelectElement) return;
  if (/^(Arrow|Space)/.test(code) && (!(event.target instanceof HTMLButtonElement && code==='Space') || page==='district' && district.ride))event.preventDefault();
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

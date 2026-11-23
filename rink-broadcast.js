import * as THREE from 'three';
import { createTeamMatch, tickTeamMatch } from './team-match.js';

export const divisions = ['Northeast Division', 'Great Lakes Division', 'Western Division'];
export const clubs = [
  ['Minnesota Stars','MIN',2,'#cbb75c'], ['Toronto Titans','TOR',0,'#5c9ac4'],
  ['Detroit Freighters','DET',1,'#b28369'], ['Ottawa Outlaws','OTT',0,'#ca5758'],
  ['Winnipeg Warriors','WPG',2,'#5d9cbe'], ['Chicago Chiefs','CHI',1,'#bc705e'],
  ['Montreal Royals','MTL',0,'#9295d0'], ['Buffalo Beacons','BUF',1,'#e3b663'],
  ['Saskatchewan Sovereigns','SSK',2,'#6ab48b'], ['Boston Huskies','BOS',0,'#70979d'],
  ['Thunder Bay T-Wolves','TBW',1,'#7ab4aa'], ['Edmonton Condors','EDM',2,'#d68558'],
].map(([name,code,division,color])=>({
  name, code, division: divisions[division], color,
  emblem: './assets/emblems/' + name.toLowerCase().replaceAll(' ', '-') + '.webp',
}));
export const clubFor = (name) => clubs.find((club)=>club.name===name);

function rng(seed) {
  let state = seed;
  return () => ((state = (Math.imul(state,1664525)+1013904223) >>> 0) / 2 ** 32);
}

export function makeSurface(renderer) {
  const surface = (plastic) => {
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=384;
    const ctx=canvas.getContext('2d');
    const random=rng(plastic?31:77);
    if (plastic) {
      for (let row=0;row<4;row++) for(let col=0;col<4;col++) {
        const tone=152+Math.floor(random()*13);
        ctx.fillStyle='rgb('+[tone,tone+12,tone+18].join(',')+')';
        ctx.fillRect(col*96,row*96,96,96);
        ctx.strokeStyle='#526371';
        ctx.strokeRect(col*96+.5,row*96+.5,95,95);
        ctx.strokeStyle='#c5d2d7';
        ctx.strokeRect(col*96+2.5,row*96+2.5,91,91);
      }
    } else { ctx.fillStyle='#637586';ctx.fillRect(0,0,384,384); }
    const pixels=ctx.getImageData(0,0,384,384), data=pixels.data;
    for(let i=0;i<data.length;i+=4) {
      const fleck=(random()-.5)*(plastic?14:64);
      data[i]+=fleck;data[i+1]+=fleck;data[i+2]+=fleck;
    }
    ctx.putImageData(pixels,0,0);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(plastic?9:5,plastic?13:8);
    texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return texture;
  };
  return {carpet:surface(false),plastic:surface(true)};
}

export function buildBroadcastSet(world) {
  const group = new THREE.Group();
  world.add(group);
  const neutral = new THREE.MeshStandardMaterial({ color:0xffffff,roughness:.86 });
  const paint=(color,roughness=.74)=>new THREE.MeshStandardMaterial({color,roughness});
  const beam=paint(0x2a3540), desk=paint(0x172938), trim=paint(0xe8c77e);
  const box=(w,h,d,x,y,z,mat)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);group.add(mesh);return mesh;
  };
  for(const side of [-1,1]) {
    for(let row=0;row<3;row++)box(.95,.34+row*.52,14.7,side*(6.7+row*.88),(.34+row*.52)/2,.1,beam);
    box(.12,.15,15.6,side*6.28,.86,0,trim);
  }
  box(.85,.72,3.2,6.82,.36,-5.23,desk);
  box(.92,.09,3.33,6.80,.77,-5.23,trim);
  const sign=document.createElement('canvas');
  sign.width=512;sign.height=120;
  const ink=sign.getContext('2d');ink.fillStyle='#172938';ink.fillRect(0,0,512,120);
  ink.font='bold 49px system-ui';ink.textAlign='center';ink.textBaseline='middle';ink.fillStyle='#f0d69a';
  ink.fillText('RINKSIDE',256,60);
  const print=new THREE.CanvasTexture(sign);print.colorSpace=THREE.SRGBColorSpace;
  const deskFront=new THREE.Mesh(new THREE.PlaneGeometry(1.42,.34),new THREE.MeshBasicMaterial({map:print}));
  deskFront.rotation.y=-Math.PI/2;deskFront.position.set(6.389,.47,-5.23);group.add(deskFront);
  for(const z of [-5.94,-4.53]){
    box(.3,.12,.62,6.83,.87,z,beam);
    box(.055,.27,.06,6.59,1.01,z+.22,beam);
  }
  const kit = [
    new THREE.InstancedMesh(new THREE.CapsuleGeometry(.18,.32,4,8),neutral,86),
    new THREE.InstancedMesh(new THREE.SphereGeometry(.132,9,7),neutral,86),
    new THREE.InstancedMesh(new THREE.SphereGeometry(.134,9,6,0,Math.PI*2,0,Math.PI*.49),neutral,86),
    new THREE.InstancedMesh(new THREE.CapsuleGeometry(.063,.20,3,6),neutral,172),
    new THREE.InstancedMesh(new THREE.CapsuleGeometry(.074,.22,3,6),neutral,172),
  ];
  kit.forEach(mesh=>{mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);});
  const cast=[];
  const schedule=rng(49);
  const skin=[0x94634a,0xc59069,0xe0ad83,0x724b3e,0xf0c5a0];
  const shirt=[0x605e68,0x265881,0x536b61,0x97654e,0x747489,0x826055,0x9d8259,0x3a536f];
  for(const side of [-1,1]) for(let row=0;row<3;row++) for(let seat=0;seat<14;seat++) {
    const z=(seat-6.5)*1.01+(schedule()-.5)*.15;
    if(side===1&&row===0&&z<-3.5)continue;
    cast.push({x:side*(6.67+row*.88),y:.31+row*.52,z,yaw:-side*Math.PI/2,angle:schedule()*Math.PI*2,
      size:.82+schedule()*.27, shirt:shirt[Math.floor(schedule()*shirt.length)],skin:skin[Math.floor(schedule()*skin.length)],
      hair:[0x2c211d,0x482d20,0x93674d,0x302925][Math.floor(schedule()*4)], active:schedule()<.44});
  }
  cast.push({x:7.32,y:.16,z:-5.94,yaw:-Math.PI/2,angle:1,size:1.08,shirt:0x1e2c41,skin:0xc59069,hair:0x2b232c,host:true},
    {x:7.32,y:.16,z:-4.53,yaw:-Math.PI/2,angle:4,size:1.12,shirt:0x2e3848,skin:0x94634a,hair:0x322828,host:true});
  const colors = new THREE.Color();
  cast.forEach((person,index)=>{
    kit.forEach((mesh,i)=>{
      const double=i>=3;
      if (double) mesh.setColorAt(index*2+1,colors.setHex(i===3?person.shirt:0x232c3a));
      mesh.setColorAt(index*(double?2:1),colors.setHex([person.shirt,person.skin,person.hair,person.shirt,0x232c3a][i]));
      mesh.count=cast.length*(double?2:1);
    });
  });
  const base=new THREE.Object3D(), part=new THREE.Object3D();
  function draw(mesh,index,x,y,z,rx,rz) {
    part.position.set(x,y,z);part.rotation.set(rx,0,rz);part.updateMatrix();
    part.matrix.premultiply(base.matrix);mesh.setMatrixAt(index,part.matrix);
  }
  function update(time,reaction) {
    cast.forEach((person,index)=>{
      const pulse=person.active?Math.sin(time*(reaction?6.1:2.1)+person.angle):0;
      base.position.set(person.x,person.y+(reaction&&!person.host&&person.active?Math.max(0,pulse)*.15:0),person.z);
      base.rotation.set(0,person.yaw,0);
      base.scale.setScalar(person.size);base.updateMatrix();
      draw(kit[0],index,0,.57,0,.12,0);
      draw(kit[1],index,0,.95,.04,0,0);
      draw(kit[2],index,0,.974,.034,0,0);
      for(const [i,side] of [[0,-1],[1,1]]){
        const clap=person.host ? .57 : reaction&&person.active ? 1.15+pulse*.48 : .26+pulse*.16;
        draw(kit[3],index*2+i,side*.209,.55+clap*.06,.10,clap,-side*clap*.6);
        draw(kit[4],index*2+i,side*.105,.23,.14,-1.03,0);
      }
    });
    kit.forEach((mesh)=>{mesh.instanceMatrix.needsUpdate=true;});
  }
  update(0,false);
  return update;
}

export function buildHighlightReel() {
  const game=createTeamMatch({home:'Toronto Titans',away:'Minnesota Stars',playerName:'Titans captain',demo:true});
  const fps=30, frames=[], cues=[];
  let id=0;
  for(let i=0;i<fps*126;i++){
    tickTeamMatch(game,[],1/fps);
    const {x,y,z}=game.ball;
    frames.push({ball:{x,y,z},players:game.players.map(({x,z,yaw,vx,vz,goalie,action})=>({x,z,yaw,vx,vz,goalie,action:action&&{kind:action.kind}}))});
    if(game.event && game.event.id!==id){
      id=game.event.id;
      if (i>fps*5 && ['save','goal'].includes(game.event.type)) cues.push({i,type:game.event.type});
    }
  }
  const goals=cues.filter(c=>c.type==='goal'), saves=cues.filter(c=>c.type==='save');
  const asReplay=(cue,label)=>({start:Math.max(0,(cue?.i??fps*8)-fps*5),speed:.55,label});
  const scenes=[
    {start:0,speed:1,label:'Broadcast · Opening rush'},
    asReplay(goals[0],'Replay · Scoring chance'),
    {start:fps*31,speed:1,label:'Broadcast · From the bench'},
    asReplay(saves[2]??saves[0],'Replay · Goalie cam'),
    {start:fps*58,speed:1,label:'Broadcast · Rinkside'},
    asReplay(goals[3]??goals.at(-1),'Replay · In the slot'),
    {start:fps*97,speed:1,label:'Broadcast · End-to-end'},
    asReplay(goals.at(-1)??saves.at(-1),'Replay · Final look'),
  ];
  const shots=[
    [[-11,6.2,-1.1],[0,.2,0]], [[3.5,3.35,9.6],[0,.48,2.5]],
    [[9.9,5.8,-1.4],[0,.35,0]], [[-3.6,3.5,9.2],[0,.45,1.2]],
    [[-8.8,5.2,3.2],[0,.4,0]], [[5.3,3.35,-9.5],[0,.5,-2.1]],
    [[-.4,9.2,-11.4],[0,.1,1]], [[-5.4,4.35,9.4],[0,.4,1.5]],
  ];
  return (time) => {
    const offset=time%120;
    const index=Math.floor(offset/15);
    const part=scenes[index];
    const at=Math.min(frames.length-1,part.start+(offset%15)*part.speed*fps);
    const current=frames[Math.floor(at)], next=frames[Math.min(frames.length-1,Math.ceil(at))];
    const blend=(a,b)=>a+(b-a)*(at%1);
    const ball={x:blend(current.ball.x,next.ball.x),y:blend(current.ball.y,next.ball.y),z:blend(current.ball.z,next.ball.z)};
    const players=current.players.map((a,i)=>{
      const b=next.players[i];
      if(Math.hypot(a.x-b.x,a.z-b.z)>1.2)return a;
      return {...a,x:blend(a.x,b.x),z:blend(a.z,b.z)};
    });
    return {ball,players,label:part.label,camera:shots[index],replay:part.speed<1,crowd:part.speed<1};
  };
}

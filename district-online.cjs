const { randomUUID } = require('node:crypto');

function campaignRoutes({ allowedOrigin = '' } = {}) {
  const rooms = new Map();
  const send = (client,data) => {
    if(client.response.destroyed)return;
    if(client.response.writableLength>96000){client.response.destroy();return;}
    if(data.type==='move'&&client.response.writableLength>16000)return;
    client.response.write('data: '+JSON.stringify(data)+'\n\n');
  };
  const tell = (room,data,except) => {
    for (const client of room.values()) if (client!==except) send(client,data);
  };
  return async function route(request,response,url) {
    if (!['/campaign/events','/campaign/send'].includes(url.pathname)) return false;
    const origin = request.headers.origin;
    if (origin && origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin',allowedOrigin);
      response.setHeader('Vary','Origin');
    }
    if (request.method==='OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods','GET, POST');
      response.setHeader('Access-Control-Allow-Headers','Content-Type');
      response.writeHead(204).end();
      return true;
    }
    const code=(url.searchParams.get('room')||'').toUpperCase();
    if(!/^[A-Z0-9]{6,16}$/.test(code)){ response.writeHead(400).end(); return true; }
    if(url.pathname==='/campaign/events' && request.method==='GET'){
      const room=rooms.get(code)||new Map();
      if(rooms.size>=128&&!rooms.has(code)||room.size>=12){response.writeHead(429).end();return true;}
      const id=randomUUID(), token=randomUUID();
      const name=(url.searchParams.get('name')||'Player').trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,32)||'Player';
      const client={id,token,name,response,lastMove:0,window:Date.now(),sent:0};
      rooms.set(code,room);
      response.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});
      send(client,{type:'welcome',id,token,players:[...room.values()].filter(other=>other.state).map(other=>other.state)});
      room.set(id,client);
      const heartbeat=setInterval(()=>response.write(': heartbeat\n\n'),15000);
      response.on('close',()=>{
        clearInterval(heartbeat);room.delete(id);
        tell(room,{type:'leave',id});
        if(!room.size)rooms.delete(code);
      });
      return true;
    }
    if(url.pathname!=='/campaign/send'||request.method!=='POST'){response.writeHead(405).end();return true;}
    let size=0;
    const chunks=[];
    try {
      for await(const chunk of request){
        size+=chunk.length;
        if(size<=24576)chunks.push(chunk);
      }
    } catch { return true; }
    if(size>24576){response.writeHead(413).end();return true;}
    let packet;
    try{packet=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{}
    const room=rooms.get(code);
    const client=room?.get(packet?.id);
    if(!client||packet.token!==client.token){response.writeHead(403).end();return true;}
    const now=Date.now();
    if(now-client.window>=1000){client.window=now;client.sent=0;}
    if(++client.sent>30){response.writeHead(429).end();return true;}
    if(packet.type==='move'){
      if(![packet.x,packet.z,packet.yaw,packet.speed].every(Number.isFinite)||!Number.isInteger(packet.city)||
        packet.city<0||packet.city>9||Math.abs(packet.x)>27||Math.abs(packet.z)>21||packet.speed<0||packet.speed>13){
        response.writeHead(400).end();return true;
      }
      if(now-client.lastMove>=55){
        client.lastMove=now;
        client.state={type:'move',id:client.id,name:client.name,city:packet.city,x:packet.x,z:packet.z,
          yaw:Math.atan2(Math.sin(packet.yaw),Math.cos(packet.yaw)),speed:packet.speed,
          avatar:packet.avatar==='maria'?'maria':'player',ride:['car','bike'].includes(packet.ride)?packet.ride:null};
        tell(room,client.state,client);
      }
    } else if(packet.type==='away') {
      client.state=null;
      tell(room,{type:'leave',id:client.id},client);
    } else {
      const target=room.get(packet.to);
      if(!target||target===client||!client.state||client.state.city!==target.state?.city){response.writeHead(404).end();return true;}
      if(packet.type==='text'&&typeof packet.text==='string'&&packet.text.trim()){
        send(target,{type:'text',id:client.id,name:client.name,text:packet.text.trim().slice(0,500)});
      } else if(packet.type==='signal'&&packet.signal&&['offer','answer','ice','hangup'].includes(packet.signal.kind)){
        send(target,{type:'signal',id:client.id,name:client.name,signal:packet.signal});
      } else { response.writeHead(400).end();return true; }
    }
    response.writeHead(204).end();
    return true;
  };
}

module.exports={campaignRoutes};

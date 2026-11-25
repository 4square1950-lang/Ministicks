export function districtChat({ receive, state, notice }) {
  const base = new URL(document.querySelector('meta[name=campaign-server]')?.content || location.origin,location.href);
  const players = new Map();
  const histories = new Map();
  const earlyIce = new Map();
  let stream, id, token, room, call, pending, attempt=0;
  const url = (path) => {
    const endpoint=new URL('/campaign/'+path,base);
    endpoint.searchParams.set('room',room);
    return endpoint;
  };
  async function send(packet) {
    if(!id)throw Error('Join a campaign room first.');
    const response=await fetch(url('send'),{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,token,...packet}),
    });
    if(!response.ok)throw Error('The player may have left the room or moved to another city.');
  }
  function disconnect() {
    endCall(true);
    stream?.close();stream=null;token=null;id=null;pending=null;
    players.clear();histories.clear();earlyIce.clear();state(false,'Offline');
  }
  function connect(code,name) {
    disconnect();
    if(location.hostname.endsWith('.github.io')&&base.origin===location.origin){
      state(false,'Open the hosted campaign server to join a room.');
      return;
    }
    room=code;
    const endpoint=url('events');endpoint.searchParams.set('name',name);
    const connection=new EventSource(endpoint);stream=connection;
    state(false,'Connecting…');
    connection.onmessage=(event)=>{
      const packet=JSON.parse(event.data);
      if(packet.type==='welcome'){
        ({id,token}=packet);
        packet.players.forEach(player=>players.set(player.id,player));
        state(true,'Room '+code);
      } else if(packet.type==='move'){
        if(players.get(packet.id)?.city!==packet.city&&call?.to===packet.id)endCall(false);
        players.set(packet.id,packet);
      } else if(packet.type==='leave'){
        players.delete(packet.id);
        earlyIce.delete(packet.id);
        if(call?.to===packet.id||pending?.id===packet.id)endCall(false);
      } else if(packet.type==='text'){
        addMessage(packet.id,packet.name,packet.text);
        receive(packet);
      } else if(packet.type==='signal'){
        handleSignal(packet).catch(()=>{endCall(true);notice('The voice connection could not be established.');});
      }
    };
    connection.onerror=()=>{
      if(stream!==connection)return;
      // A static site has no campaign endpoint. Stop retries and keep offline play available.
      disconnect();state(false,'Campaign server unavailable');
    };
  }
  function addMessage(to,name,text) {
    const history=histories.get(to)||[];
    history.push({name,text});
    histories.set(to,history.slice(-50));
  }
  async function message(to,text) {
    await send({type:'text',to,text});
    addMessage(to,'You',text);
  }
  function signal(to,kind,value) { return send({type:'signal',to,signal:{kind,value}}); }
  function endCall(tellPeer=true) {
    attempt++;
    const to=call?.to||pending?.id;
    if(tellPeer&&to&&id)signal(to,'hangup').catch(()=>{});
    if(call){
      call.pc.close();call.local?.getTracks().forEach(track=>track.stop());call.audio.srcObject=null;
    }
    const ended=Boolean(call||pending);
    call=null;pending=null;
    if(ended)notice('Voice ended.');
  }
  async function openVoice(to) {
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('Voice needs microphone access on HTTPS or localhost.');
    const current=++attempt;
    const local=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    if(current!==attempt){local.getTracks().forEach(track=>track.stop());return null;}
    let services = [{urls:'stun:stun.l.google.com:19302'}];
    try {
      const configured=JSON.parse(document.querySelector('meta[name=campaign-ice-servers]')?.content||'null');
      if(Array.isArray(configured)&&configured.length)services=configured;
    } catch {}
    const pc=new RTCPeerConnection({iceServers:services});
    const audio=new Audio();
    call={to,pc,audio,local,ice:[]};
    local.getTracks().forEach(track=>pc.addTrack(track,local));
    pc.ontrack=(event)=>{
      audio.srcObject=event.streams[0]||new MediaStream([event.track]);
      audio.play().catch(()=>notice('Use Enable audio to hear the call.'));
    };
    pc.onicecandidate=({candidate})=>{if(candidate)signal(to,'ice',candidate.toJSON()).catch(()=>{});};
    pc.onconnectionstatechange=()=>{
      if(call?.pc!==pc)return;
      if(pc.connectionState==='connected')notice('Voice connected.');
      if(pc.connectionState==='failed'){endCall(true);notice('Voice could not connect on this network.');}
    };
    return call;
  }
  async function flushIce(current) {
    for(const datum of current.ice.splice(0))await current.pc.addIceCandidate(datum).catch(()=>{});
  }
  async function voice(to) {
    if(call||pending)endCall(true);
    notice('Requesting microphone…');
    const current=await openVoice(to);if(!current)return;
    await current.pc.setLocalDescription(await current.pc.createOffer());
    await signal(to,'offer',current.pc.localDescription.sdp);
    notice('Waiting for the player to accept…');
  }
  async function accept() {
    if(!pending)return;
    const incoming=pending;
    const current=await openVoice(incoming.id);if(!current)return;
    pending=null;
    current.ice.push(...incoming.ice);
    await current.pc.setRemoteDescription({type:'offer',sdp:incoming.signal.value});await flushIce(current);
    await current.pc.setLocalDescription(await current.pc.createAnswer());
    await signal(incoming.id,'answer',current.pc.localDescription.sdp);
    notice('Connecting voice…');
  }
  async function handleSignal(packet) {
    const {signal:message,id:from}=packet;
    if(message.kind==='offer'&&typeof message.value==='string'){
      if(call||pending){await signal(from,'hangup');return;}
      pending={...packet,ice:earlyIce.get(from)||[]};
      earlyIce.delete(from);receive(packet);
    } else if(message.kind==='hangup'&&(call?.to===from||pending?.id===from)){
      endCall(false);
    } else if(message.kind==='ice'&&pending?.id===from&&!call){
      if(pending.ice.length<64)pending.ice.push(message.value);
    } else if(call?.to===from){
      if(message.kind==='answer'){
        await call.pc.setRemoteDescription({type:'answer',sdp:message.value});
        if(call?.to===from)await flushIce(call);
      }
      if(message.kind==='ice'){
        if(call.pc.remoteDescription)await call.pc.addIceCandidate(message.value).catch(()=>{});
        else if(call.ice.length<64)call.ice.push(message.value);
      }
    } else if(message.kind==='ice'&&!call&&!pending){
      const queued=earlyIce.get(from)||[];
      if(queued.length<32)queued.push(message.value);
      earlyIce.set(from,queued);
    }
  }
  return { players,histories,connect,disconnect,message,voice,accept,endCall,
    enableAudio:()=>call?.audio.play().catch(()=>{}), connected:()=>Boolean(id), incoming:()=>pending,
    move:(snapshot)=>send({type:'move',...snapshot}).catch(()=>{}),
    away:()=>send({type:'away'}).catch(()=>{}),
  };
}

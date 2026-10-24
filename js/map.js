// ================= MAP =================
const NODE_INFO={fight:"Fight",elite:"Elite",boss:"Boss",chest:"Chest",shrine:"Shrine",peddler:"Peddler",camp:"Camp",mystery:"Mystery"};
function nodeType(r){if(r===MAP_ROWS-1)return"boss";if(r===MAP_ROWS-2)return"camp";if(r===0)return"fight";
  const x=Math.random();if(r>=2&&x<.13)return"elite";if(x<.52)return"fight";if(x<.7)return"mystery";if(x<.79)return"chest";if(x<.88)return"shrine";return"peddler"}
function genMap(){
  const rows=[];
  for(let r=0;r<MAP_ROWS;r++){
    const n=r===MAP_ROWS-1?1:r===0?3:2+Math.floor(Math.random()*2)+(Math.random()<.2?1:0),row=[];
    for(let i=0;i<n;i++)row.push({t:nodeType(r),x:n===1?50:Math.round(14+72*(i/(n-1))+(Math.random()*8-4)),next:[],done:false});
    rows.push(row)}
  for(let r=0;r<MAP_ROWS-1;r++){const a=rows[r],b=rows[r+1];
    a.forEach(nd=>{const near=b.map((m,j)=>[Math.abs(m.x-nd.x),j]).sort((p,q)=>p[0]-q[0]);nd.next=[near[0][1]];if(near[1]&&near[1][0]<45&&Math.random()<.55)nd.next.push(near[1][1])});
    b.forEach((m,j)=>{if(!a.some(nd=>nd.next.includes(j))){const i=a.map((nd,i)=>[Math.abs(nd.x-m.x),i]).sort((p,q)=>p[0]-q[0])[0][1];a[i].next.push(j)}})}
  return{rows,pos:null,path:[],cleared:false,seed:Math.floor(Math.random()*1e9)};
}
function curMap(){return S.maps[S.zone]||(S.maps[S.zone]=genMap())}
function openNodes(m){if(m.cleared)return[];if(!m.pos)return m.rows[0].map((_,i)=>[0,i]);const nd=m.rows[m.pos.r][m.pos.i];
  return m.pos.r>=MAP_ROWS-1?[]:nd.next.map(j=>[m.pos.r+1,j])}
const busy=()=>!!((S.battle&&!S.battle.over)||(S.event&&S.event.choices.length));
function visit(r,i){
  const m=curMap();if(busy()||!openNodes(m).some(([a,b])=>a===r&&b===i))return;
  m.pos={r,i};m.path.push([r,i]);const nd=m.rows[r][i];nd.done=true;S.battle=null;S.event=null;
  let t=nd.t;
  if(t==="mystery"){const x=Math.random();t=x<.25?"ambush":x<.45?"shrine":x<.65?"pack":x<.85?"chest":"peddler"}
  const P=pstats();
  if(t==="fight")return startBattle(null,{row:r});
  if(t==="ambush")return startBattle(null,{row:r,ambush:true});
  if(t==="elite")return startBattle(null,{row:r,elite:true});
  if(t==="boss")return startBattle(ZONES[zoneIdx(S.zone)][2]);
  if(t==="shrine"){const got=healYou(Math.round(P.maxHp*.35));
    S.event={type:"shrine",icon:"shrine",title:"A quiet shrine",text:got?`Moss-covered stones hum softly. You rest a moment and recover ${got} HP.`:"Moss-covered stones hum softly. You're already in good shape, so you just enjoy the quiet.",loot:[],choices:[]}}
  if(t==="pack"){const pool=zonePool(S.zone),got=[pick(pool)];if(Math.random()<.5)got.push(pick(pool));got.forEach(id=>addItem(id));
    S.event={type:"pack",icon:"chest",title:"An abandoned pack",text:"Someone left in a hurry. You help yourself.",loot:got,choices:[]}}
  if(t==="chest")S.event={type:"chest",icon:"chest",title:"A lone chest",text:"An iron-banded chest sits in the open, unattended. Suspiciously unattended.",loot:[],choices:[["open","Open it"],["leave","Walk past"]]};
  if(t==="peddler"){const o=makeOffer();
    S.event=o?{type:"merchant",icon:"peddler",title:"A travelling peddler",text:`"Fine wares for fine folk. I'll take your ${S.items[o.give].name} for this ${S.items[o.get].name}. Fair's fair."`,offer:o,loot:[],choices:[["trade",`Trade for ${S.items[o.get].name}`],["inspect","Inspect the offer"],["leave","No thanks"]]}
      :{type:"done",icon:"peddler",title:"A travelling peddler",text:"\"Nothing to trade? Come back with pockets full.\" The peddler wanders off.",loot:[],choices:[]}}
  if(t==="camp")S.event={type:"camp",icon:"camp",title:"A sheltered camp",text:"A ring of stones and dry wood, out of the wind. The boss lies just ahead.",loot:[],choices:[["rest",`Rest (+${Math.round(P.maxHp*.4)} HP)`],["embers","Bank the embers (+1 campfire charge)"]]};
  save();render();
}
function newExpedition(){S.maps[S.zone]=genMap();S.battle=null;S.event=null;save();render()}
function makeOffer(){
  const free=Object.keys(S.inv).filter(id=>(S.inv[id]-eqCount(id)-benchCount(id))>0&&!S.items[id].legendary);if(!free.length)return null;
  const give=pick(free),zi=zoneIdx(S.zone),next=ZONES[Math.min(zi+1,ZONES.length-1)][0];
  const get=Math.random()<.3?essence(pick([...ESS_POOL,"Radiant","Tempered","Frost"])):pick([...zonePool(S.zone),...zonePool(next),...zonePool(next)]);
  return get===give?null:{give,get};
}
function eventChoice(c){
  const ev=S.event;
  if(c==="leave"){S.event=null;save();return render()}
  if(c==="inspect")return openSheet(ev.offer.get,false,true);
  if(ev.type==="camp"){
    if(c==="rest"){const g=healYou(Math.round(pstats().maxHp*.4));S.event={type:"done",icon:"camp",title:"Well rested",text:`You sleep by the fire and recover ${g} HP.`,loot:[],choices:[]}}
    else{const had=S.camp;S.camp=Math.min(3,S.camp+1);S.event={type:"done",icon:"camp",title:"Embers banked",text:S.camp>had?"You pack glowing embers for later. One more campfire charge.":"Your ember pouch is already full. At least it's warm.",loot:[],choices:[]}}}
  if(ev.type==="chest"&&c==="open"){
    if(Math.random()<.25){S.event=null;return startBattle("mimic")}
    const p=zonePool(S.zone),got=[pick(p),pick(p)];if(Math.random()<.5)got.push(essence(pick(ESS_POOL)));got.forEach(id=>addItem(id));
    S.event={type:"done",icon:"chest",title:"Treasure!",text:"It was just a chest. A very generous chest.",loot:got,choices:[]}}
  if(ev.type==="merchant"&&c==="trade"){const {give,get}=ev.offer;
    if((S.inv[give]||0)-eqCount(give)<=0){toast("You no longer have that item.");S.event=null}
    else{S.inv[give]--;trimBench();addItem(get);S.event={type:"done",icon:"peddler",title:"A fair trade",text:`The peddler pockets your ${S.items[give].name} and hands over the ${S.items[get].name}.`,loot:[get],choices:[]}}}
  save();render();
}

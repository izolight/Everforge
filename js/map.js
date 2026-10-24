// ================= MAP =================
const NODE_INFO={fight:"Fight",elite:"Elite",boss:"Boss",chest:"Chest",shrine:"Shrine",peddler:"Peddler",camp:"Camp",mystery:"Mystery"};
const MYSTERY=[[.14,"ambush"],[.26,"shrine"],[.38,"pack"],[.5,"chest"],[.6,"peddler"],[.68,"altar"],[.76,"alchemist"],[.84,"traveller"],[.92,"forge"],[1,"riddle"]],mystery=x=>MYSTERY.find(([p])=>x<p)[1];
function nodeType(r,R,h,tw){if(r===MAP_ROWS-1)return"boss";if(r===MAP_ROWS-2)return tw==="nocamp"?"fight":"camp";if(r===0)return"fight";
  const x=R();if(r>=2&&x<.13*(h>=2?HEAT_T.elite:1))return"elite";if(x<.52)return"fight";if(x<.7)return"mystery";if(x<.79)return"chest";if(x<.88)return"shrine";return"peddler"}
// o: {seed (reproducible map and enemy picks, else Math.random), heat, zone, twist}
function genMap(o){
  o=o||{};const sd=o.seed!=null,R=sd?rng(o.seed):Math.random,h=o.heat||0,rows=[];
  for(let r=0;r<MAP_ROWS;r++){
    const n=r===MAP_ROWS-1?1:r===0?3:2+Math.floor(R()*2)+(R()<.2?1:0),row=[];
    for(let i=0;i<n;i++)row.push({t:nodeType(r,R,h,o.twist),x:n===1?50:Math.round(14+72*(i/(n-1))+(R()*8-4)),next:[],done:false});
    rows.push(row)}
  for(let r=0;r<MAP_ROWS-1;r++){const a=rows[r],b=rows[r+1];
    a.forEach(nd=>{const near=b.map((m,j)=>[Math.abs(m.x-nd.x),j]).sort((p,q)=>p[0]-q[0]);nd.next=[near[0][1]];if(near[1]&&near[1][0]<45&&R()<.55)nd.next.push(near[1][1])});
    b.forEach((m,j)=>{if(!a.some(nd=>nd.next.includes(j))){const i=a.map((nd,i)=>[Math.abs(nd.x-m.x),i]).sort((p,q)=>p[0]-q[0])[0][1];a[i].next.push(j)}})}
  if(o.twist==="elites")rows.forEach((row,r)=>{if(r>0)row.forEach(nd=>{if(nd.t==="fight")nd.t="elite"})});
  if(h>=2){const c=rows.flatMap((row,r)=>r>=2&&r<MAP_ROWS-2?row.filter(nd=>nd.t==="fight"):[]);if(c.length)c[Math.floor(R()*c.length)].t="elite"}
  if(sd)rows.forEach((row,r)=>{if(r<MAP_ROWS-1)row.forEach((nd,i)=>{const rn=rng(hash(o.seed+":"+r+":"+i));nd.e=pickEnemy(o.zone,rn);if(nd.t==="mystery")nd.my=mystery(rn());
    // pre-rolled so the same day plays out alike: elite upgrade, affix, chest (mimic, loot, scroll), pack loot and four rolls (rv) for choice events and six (sh) for the peddler's stock (the one-for-one offer, what you can sell and satchel-based event choices depend on you, so they vary)
    const zp=zonePool(o.zone),pk=a=>a[Math.floor(rn()*a.length)];nd.up=rn()<eliteCh(h);nd.af=Math.floor(rn()*AFFIXES.length);
    nd.ch={m:rn()<.25,l:[pk(zp),pk(zp)],e:rn()<.5?pk(ESS_POOL):null,s:rn()<.15,sx:rn()};nd.pk=[pk(zp),...rn()<.5?[pk(zp)]:[]];nd.rv=[rn(),rn(),rn(),rn()];nd.sh=[rn(),rn(),rn(),rn(),rn(),rn()]})});
  return{rows,pos:null,path:[],cleared:false,seed:sd?o.seed:Math.floor(Math.random()*1e9),heat:h};
}
const eliteCh=h=>h>=3?HEAT_T.affix:.08*(h>=2?HEAT_T.elite:1),heatOf=z=>S.heat[z]||{max:0,sel:0},newMap=z=>genMap({heat:heatOf(z).sel});
const curMap=()=>S.run==="daily"&&S.daily?S.daily.map:S.maps[S.zone]||(S.maps[S.zone]=newMap(S.zone));
const heatNow=()=>curMap().heat||0,twistNow=()=>S.run==="daily"&&S.daily?S.daily.twist:null,campFrac=()=>heatNow()>=5?HEAT_T.rest:.4;
function setHeat(n){ // pick the heat for new expeditions here; an untouched map is rerolled at once
  const hz=heatOf(S.zone);if(busy()||S.run==="daily"||!(n>=0&&n<=hz.max))return;
  S.heat[S.zone]={max:hz.max,sel:n};const m=curMap();
  if(!m.pos&&(m.heat||0)!==n)S.maps[S.zone]=newMap(S.zone);else if((m.heat||0)!==n)toast(`Heat ${n} starts with your next expedition here.`);
  save();render();
}
function openNodes(m){if(m.cleared)return[];if(!m.pos)return m.rows[0].map((_,i)=>[0,i]);const nd=m.rows[m.pos.r][m.pos.i];
  return m.pos.r>=MAP_ROWS-1?[]:nd.next.map(j=>[m.pos.r+1,j])}
const busy=()=>!!((S.battle&&!S.battle.over)||(S.event&&S.event.choices.length));
function visit(r,i){
  const m=curMap();if(busy()||!openNodes(m).some(([a,b])=>a===r&&b===i))return;
  m.pos={r,i};m.path.push([r,i]);const nd=m.rows[r][i];nd.done=true;S.battle=null;S.event=null;
  let t=nd.t;
  if(t==="mystery")t=nd.my||mystery(Math.random());
  const P=pstats(),hl=m.heat||0,amb=!!m.amb&&["fight","elite"].includes(t); // m.amb: a robbed traveller's friends make your next fight an ambush; it ends with the next node whatever it is
  m.amb=false;
  if(t==="fight")return startBattle(null,{row:r,ambush:amb,e:nd.e,up:nd.up,af:nd.af});
  if(t==="ambush")return startBattle(null,{row:r,ambush:true,e:nd.e,up:nd.up,af:nd.af});
  if(t==="elite")return startBattle(null,{row:r,elite:true,ambush:amb,e:nd.e,af:nd.af});
  if(t==="boss")return startBattle(ZONES[zoneIdx(S.zone)][2]);
  if(ENC[t])S.event=ENC[t].make(nd.rv||[0,0,0,0].map(()=>Math.random()),hl);
  if(t==="pack"){const pool=zonePool(S.zone),got=nd.pk?[...nd.pk]:[pick(pool)];if(!nd.pk&&Math.random()<.5)got.push(pick(pool));got.forEach(id=>addItem(id));
    S.event={type:"pack",icon:"chest",title:"An abandoned pack",text:"Someone left in a hurry. You help yourself.",loot:got,choices:[]}}
  if(t==="chest")S.event={type:"chest",icon:"chest",title:"A lone chest",text:"An iron-banded chest sits in the open, unattended. Suspiciously unattended.",loot:[],choices:[["open","Open it"],["leave","Walk past"]],pre:nd.ch};
  if(t==="peddler")S.event=merchant(nd.sh);
  if(t==="camp")S.event={type:"camp",icon:"camp",title:"A sheltered camp",text:"A ring of stones and dry wood, out of the wind. The boss lies just ahead.",loot:[],choices:[["rest",`Rest (+${Math.round(P.maxHp*campFrac())} HP)`],...hl>=5?[]:[["embers","Bank the embers (+1 campfire charge)"]]]};
  save();render();
}
function newExpedition(){if(S.run==="daily")return;S.maps[S.zone]=newMap(S.zone);S.battle=null;S.event=null;save();render()}
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
  if(ev.type==="merchant"&&/^(buy|sell):/.test(c))return shopPick(c,ev);
  if(ENC[ev.type]){ENC[ev.type].pick(c,ev);save();return render()}
  if(ev.type==="camp"){
    if(c==="rest"){const g=healYou(Math.round(pstats().maxHp*campFrac()));S.event={type:"done",icon:"camp",title:"Well rested",text:`You sleep by the fire and recover ${g} HP.`,loot:[],choices:[]}}
    else{const had=S.camp;S.camp=Math.min(3,S.camp+1);S.event={type:"done",icon:"camp",title:"Embers banked",text:S.camp>had?"You pack glowing embers for later. One more campfire charge.":"Your ember pouch is already full. At least it's warm.",loot:[],choices:[]}}}
  if(ev.type==="chest"&&c==="open"){
    const pre=ev.pre;if(pre?pre.m:Math.random()<.25){S.event=null;return startBattle("mimic")}
    const p=zonePool(S.zone),got=pre?[...pre.l]:[pick(p),pick(p)];if(pre?pre.e:Math.random()<.5)got.push(essence(pre?pre.e:pick(ESS_POOL)));got.forEach(id=>addItem(id));
    endEv("chest","Treasure!","It was just a chest. A very generous chest.",got,(pre?pre.s:Math.random()<.15)?giveHint(pre?pre.sx:undefined):"")}
  if(ev.type==="merchant"&&c==="trade"){const {give,get}=ev.offer;
    if((S.inv[give]||0)-eqCount(give)<=0){toast("You no longer have that item.");S.event=null}
    else{S.inv[give]--;trimBench();addItem(get);S.event={type:"done",icon:"peddler",title:"A fair trade",text:`The peddler pockets your ${S.items[give].name} and hands over the ${S.items[get].name}.`,loot:[get],choices:[]}}}
  save();render();
}

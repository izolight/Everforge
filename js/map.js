// ================= MAP =================
const NODE_INFO={fight:"Fight",elite:"Elite",boss:"Boss",chest:"Chest",shrine:"Shrine",peddler:"Peddler",camp:"Camp",mystery:"Mystery"};
const MYSTERY=[[.14,"ambush"],[.26,"shrine"],[.38,"pack"],[.5,"chest"],[.6,"peddler"],[.68,"altar"],[.76,"alchemist"],[.84,"traveller"],[.92,"forge"],[1,"riddle"]],mystery=x=>MYSTERY.find(([p])=>x<p)[1];
// ---- grid helpers: m.g = tile rows ("." floor, "," brush, "#" rock/tree, "~" water), m.pois = things on tiles, m.sn = seen flags, m.mem = last-seen POI types
const inb=(m,x,y)=>x>=0&&y>=0&&x<m.w&&y<m.h,walk=(m,x,y)=>inb(m,x,y)&&!"#~".includes(m.g[y][x]),poiAt=(m,x,y)=>m.pois.find(p=>p.x===x&&p.y===y),DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
function bfs(m,x,y){const d=Array(m.w*m.h).fill(-1),q=[[x,y]];d[y*m.w+x]=0;
  for(let k=0;k<q.length;k++){const [a,b]=q[k];DIRS.forEach(([dx,dy])=>{const u=a+dx,v=b+dy;if(walk(m,u,v)&&d[v*m.w+u]<0){d[v*m.w+u]=d[b*m.w+a]+1;q.push([u,v])}})}return d}
const depthOf=(m,x,y)=>x===m.lair.x&&y===m.lair.y?MAP_ROWS-1:Math.max(0,Math.min(MAP_ROWS-2,Math.floor((MAP_ROWS-1)*m.d[y*m.w+x]/m.D)));
const lightR=m=>m.torch>0?TORCH.rad:TORCH.dim,litAt=(m,x,y)=>Math.max(Math.abs(x-m.pos.x),Math.abs(y-m.pos.y))<=lightR(m); // Chebyshev radius
function reveal(m){
  for(let y=Math.max(0,m.pos.y-TORCH.rad);y<=Math.min(m.h-1,m.pos.y+TORCH.rad);y++)for(let x=Math.max(0,m.pos.x-TORCH.rad);x<=Math.min(m.w-1,m.pos.x+TORCH.rad);x++)if(litAt(m,x,y)){
    const k=x+","+y,p=poiAt(m,x,y);m.sn[y*m.w+x]=1;if(p&&!p.done)m.mem[k]=p.t;else delete m.mem[k]}}
// o: {seed (reproducible map and enemy picks, else Math.random), heat, zone, twist}
function genMap(o){
  o=o||{};const sd=o.seed!=null,R=sd?rng(o.seed):Math.random,h=o.heat||0,W=GRID.w,H=GRID.h,sx=W>>1,key=(x,y)=>x+","+y;
  const m={w:W,h:H,g:[],pois:[],pos:{x:sx,y:H-1},prev:null,start:{x:sx,y:H-1},lair:{x:sx,y:0},gate:{x:sx,y:1},sn:Array(W*H).fill(0),mem:{},d:[],D:1,torch:0,tmax:TORCH.max+(o.twist==="nocamp"?TORCH.nocamp:0),steps:0,dp:0,cleared:false,amb:false,sd,seed:sd?o.seed:Math.floor(Math.random()*1e9),heat:h};
  for(let tries=0;tries<30;tries++){
    const keep=new Set([key(sx,H-1),key(sx,H-2),key(sx-1,H-1),key(sx+1,H-1),key(sx,0),key(sx,1),key(sx-1,1),key(sx-1,2),key(sx,2)]);
    const go=[sx,H-2]; // a winding path from the start up to the lair's gate always stays open
    while(go[1]>2){const x=go[0],dx=R()<.5?-1:1;if(R()<.55||x+dx<1||x+dx>W-2)go[1]--;else go[0]+=dx;keep.add(key(...go))}
    while(go[0]!==sx){go[0]+=go[0]<sx?1:-1;keep.add(key(...go))}
    let g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>keep.has(key(x,y))?".":R()<.3?"#":"."));
    for(let p=0;p<2;p++)g=g.map((row,y)=>row.map((t,x)=>{if(keep.has(key(x,y)))return t;let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const u=x+dx,v=y+dy;if(u<0||v<0||u>=W||v>=H||g[v][u]==="#")n++}return n>=5?"#":n<=3?".":t}));
    for(let x=0;x<W;x++)if(x!==sx)g[0][x]="#";g[1][sx+1]="#";
    for(const by of [4,8]){const gaps=new Set([...Array(W).keys()].filter(x=>keep.has(key(x,by))));gaps.add(Math.floor(R()*W));for(let x=0;x<W;x++)if(!gaps.has(x))g[by][x]="#"} // two wall bands with a gap each force detours
    g[0][sx]=".";
    m.g=g.map(r=>r.join(""));const d=bfs(m,sx,H-1);
    g=g.map((row,y)=>row.map((t,x)=>d[y*W+x]<0?"#":t));m.g=g.map(r=>r.join(""));
    const fl=g.flat().filter(t=>t!=="#").length;if(fl>=60&&fl<=92)break}
  // flavour: some rock is water, some floor is brush (walkable)
  m.g=m.g.map((row,y)=>[...row].map((t,x)=>t==="#"&&y>1&&R()<.2?"~":t==="."&&!(x===sx&&y>=H-2)&&y>1&&R()<.12?",":t).join(""));
  m.d=bfs(m,sx,H-1);m.D=m.d[sx];
  const dist=(x,y)=>m.d[y*W+x],depth=(x,y)=>depthOf(m,x,y);
  const cand=[];for(let y=2;y<H;y++)for(let x=0;x<W;x++)if(walk(m,x,y)&&dist(x,y)>=3&&!(x===sx-1&&y===1)&&!(x===sx&&y===2))cand.push([x,y]);
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
  const add=(t,x,y)=>{const p={t,x,y,r:depth(x,y),done:false};if(t==="fight"||t==="elite")p.mv="still";m.pois.push(p);return p};
  add("boss",sx,0);add("fight",sx,1);add(o.twist==="nocamp"?"fight":"camp",sx-1,1);
  const place=(t,minR)=>{const ok=(c,sp)=>depth(...c)>=minR&&(!sp||m.pois.every(p=>Math.max(Math.abs(p.x-c[0]),Math.abs(p.y-c[1]))>=2)),i=[cand.findIndex(c=>ok(c,1)),cand.findIndex(c=>ok(c,0)),0].find(i=>i>=0);
    if(cand.length)add(t,...cand.splice(i,1)[0])};
  const ne=Math.round((POI_N.elite[0]+Math.floor(R()*POI_N.elite[1]))*(h>=2?HEAT_T.elite:1)),nf=POI_N.fight[0]+Math.floor(R()*POI_N.fight[1]);
  for(let i=0;i<ne;i++)place("elite",2);
  place("peddler",1);for(let i=0;i<POI_N.shrine;i++)place("shrine",1);for(let i=0;i<POI_N.chest;i++)place("chest",0);for(let i=0;i<POI_N.mystery;i++)place("mystery",0);for(let i=0;i<nf;i++)place("fight",0);
  if(o.twist==="elites")m.pois.forEach(p=>{if(p.t==="fight"&&p.r>0)p.t="elite"});
  if(h>=2){const c=m.pois.filter(p=>p.t==="fight"&&p.r>=2&&p.r<MAP_ROWS-2);if(c.length)c[Math.floor(R()*c.length)].t="elite"}
  if(sd)m.pois.forEach(nd=>{if(nd.t==="boss")return;const rn=rng(hash(o.seed+":"+nd.x+","+nd.y));nd.e=pickEnemy(o.zone,rn);if(nd.t==="mystery")nd.my=mystery(rn());
    // pre-rolled so the same day plays out alike: elite upgrade, affix, chest (mimic, loot, scroll), pack loot and four rolls (rv) for choice events and six (sh) for the peddler's stock (the one-for-one offer, what you can sell and satchel-based event choices depend on you, so they vary)
    const zp=zonePool(o.zone),pk=a=>a[Math.floor(rn()*a.length)];nd.up=rn()<eliteCh(h);nd.af=Math.floor(rn()*AFFIXES.length);
    nd.ch={m:rn()<.25,l:[pk(zp),pk(zp)],e:rn()<.5?pk(ESS_POOL):null,s:rn()<.15,sx:rn()};nd.pk=[pk(zp),...rn()<.5?[pk(zp)]:[]];nd.rv=[rn(),rn(),rn(),rn()];nd.sh=[rn(),rn(),rn(),rn(),rn(),rn()];nd.gr=Array.from({length:8},rn);nd.ch.g=nd.gr}); // gr: grade rolls for chest, pack and event finds
  m.torch=m.tmax;m.mem[key(sx,0)]="boss";m.sn[sx]=1;reveal(m);
  return m;
}
const eliteCh=h=>h>=3?HEAT_T.affix:.08*(h>=2?HEAT_T.elite:1),heatOf=z=>S.heat[z]||{max:0,sel:0},newMap=z=>genMap({heat:heatOf(z).sel});
const curMap=()=>S.run==="daily"&&S.daily?S.daily.map:S.maps[S.zone]||(S.maps[S.zone]=newMap(S.zone));
const heatNow=()=>curMap().heat||0,twistNow=()=>S.run==="daily"&&S.daily?S.daily.twist:null,campFrac=()=>heatNow()>=5?HEAT_T.rest:.4;
function setHeat(n){ // pick the heat for new expeditions here; an untouched map is rerolled at once
  const hz=heatOf(S.zone);if(busy()||S.run==="daily"||!(n>=0&&n<=hz.max))return;
  S.heat[S.zone]={max:hz.max,sel:n};const m=curMap();
  if(!m.steps&&(m.heat||0)!==n)S.maps[S.zone]=newMap(S.zone);else if((m.heat||0)!==n)toast(`Heat ${n} starts with your next expedition here.`);
  save();render();
}
const adjTiles=m=>m.cleared?[]:DIRS.map(([dx,dy])=>[m.pos.x+dx,m.pos.y+dy]).filter(([x,y])=>walk(m,x,y));
const busy=()=>!!((S.battle&&!S.battle.over)||(S.event&&S.event.choices.length));
const torchUp=n=>{const m=curMap(),b=m.torch;m.torch=Math.min(m.tmax,m.torch+n);reveal(m);return m.torch-b},drain=m=>m.heat>=5?Math.floor(m.steps*TORCH.h5)-Math.floor((m.steps-1)*TORCH.h5):1;
// one tap on a neighbouring tile: the torch burns down, the light moves, whatever stands there is met, and in the dark something may find you
function step(x,y){
  const m=curMap();if(busy()||m.cleared||Math.abs(x-m.pos.x)+Math.abs(y-m.pos.y)!==1||!walk(m,x,y))return;
  sfx("step");m.prev=m.pos;m.pos={x,y};m.steps++;m.dp=Math.max(m.dp,depthOf(m,x,y));S.battle=null;S.event=null;
  const was=m.torch>0;m.torch=Math.max(0,m.torch-drain(m));reveal(m);
  if(was&&m.torch<=0)toast("Your torch gutters out. The dark presses close.");
  const nd=poiAt(m,x,y);if(nd&&!nd.done)return enter(nd);
  if(m.torch<=0){const ra=m.sd?rng(hash(m.seed+":a:"+m.steps)):Math.random; // a seeded map rolls the dark's ambush by step number, so the same path meets the same things
    if(ra()<TORCH.amb){const e=pickEnemy(S.zone,ra),up=ra()<eliteCh(m.heat||0),af=Math.floor(ra()*AFFIXES.length);return startBattle(null,{row:depthOf(m,x,y),ambush:true,amsg:"Ambush! Something finds you in the dark.",e,up,af})}}
  save();render();
}
function enter(nd){ // the one place a POI is resolved into a battle or an event
  const m=curMap();nd.done=true;delete m.mem[nd.x+","+nd.y];S.battle=null;S.event=null;
  let t=nd.t;
  if(t==="mystery")t=nd.my||mystery(Math.random());
  const P=pstats(),hl=m.heat||0,amb=!!m.amb&&["fight","elite"].includes(t),r=nd.r; // m.amb: a robbed traveller's friends make your next fight an ambush; it ends with the next stop whatever it is
  m.amb=false;
  if(t==="fight")return startBattle(null,{row:r,ambush:amb,e:nd.e,up:nd.up,af:nd.af});
  if(t==="ambush")return startBattle(null,{row:r,ambush:true,e:nd.e,up:nd.up,af:nd.af});
  if(t==="elite")return startBattle(null,{row:r,elite:true,ambush:amb,e:nd.e,af:nd.af});
  if(t==="boss")return startBattle(ZONES[zoneIdx(S.zone)][2]);
  if(ENC[t])S.event=ENC[t].make([...nd.rv||[0,0,0,0].map(()=>Math.random()),...(nd.gr||[]).slice(0,4)],hl); // rv[4..7] roll the grades of what the event gives
  if(t==="pack"){const pool=zonePool(S.zone),got=(nd.pk?[...nd.pk]:[pick(pool)]).map((id,k)=>dropNow(id,nd.gr&&nd.gr[k]));if(!nd.pk&&Math.random()<.5)got.push(dropNow(pick(pool)));got.forEach(id=>addItem(id));sfx("loot");
    S.event={type:"pack",icon:"chest",title:"An abandoned pack",text:"Someone left in a hurry. You help yourself.",loot:got,choices:[]}}
  if(t==="chest")S.event={type:"chest",icon:"chest",title:"A lone chest",text:"An iron-banded chest sits in the open, unattended. Suspiciously unattended.",loot:[],choices:[["open","Open it"],["leave","Walk past"]],pre:nd.ch};
  if(t==="peddler")S.event=merchant(nd.sh);
  if(t==="camp"){torchUp(m.tmax);S.event={type:"camp",icon:"camp",title:"A sheltered camp",text:"A ring of stones and dry wood, out of the wind. The fire relights your torch. The boss lies just ahead.",loot:[],choices:[["rest",`Rest (+${Math.round(P.maxHp*campFrac())} HP)`],...hl>=5?[]:[["embers","Bank the embers (+1 campfire charge)"]]]}}
  save();render();
}
function fallBack(m){ // fleeing the boss: back one tile (to where you came from), the lair stays open
  m.pois.forEach(p=>{if(p.t==="boss"){p.done=false;m.mem[p.x+","+p.y]="boss"}});m.pos=m.prev&&!(m.prev.x===m.lair.x&&m.prev.y===m.lair.y)?m.prev:{...m.gate};reveal(m)}
function newExpedition(){if(S.run==="daily")return;S.maps[S.zone]=newMap(S.zone);S.battle=null;S.event=null;save();render()}
function makeOffer(){
  const free=Object.keys(S.inv).filter(id=>(S.inv[id]-eqCount(id)-benchCount(id))>0&&!S.items[id].legendary&&gradeOf(id)<4);if(!free.length)return null;
  const give=pick(free),zi=zoneIdx(S.zone),next=ZONES[Math.min(zi+1,ZONES.length-1)][0];
  const get=Math.random()<.3?essNow(pick([...ESS_POOL,"Radiant","Tempered","Frost"])):dropNow(pick([...zonePool(S.zone),...zonePool(next),...zonePool(next)]));
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
    const p=zonePool(S.zone),got=(pre?[...pre.l]:[pick(p),pick(p)]).map((id,k)=>dropNow(id,pre&&pre.g?pre.g[k]:undefined));if(pre?pre.e:Math.random()<.5)got.push(essNow(pre?pre.e:pick(ESS_POOL),pre&&pre.g?pre.g[2]:undefined));got.forEach(id=>addItem(id));
    endEv("chest","Treasure!","It was just a chest. A very generous chest.",got,(pre?pre.s:Math.random()<.15)?giveHint(pre?pre.sx:undefined):"")}
  if(ev.type==="merchant"&&c==="trade"){const {give,get}=ev.offer;
    if((S.inv[give]||0)-eqCount(give)<=0){toast("You no longer have that item.");S.event=null}
    else{S.inv[give]--;trimBench();addItem(get);ev.offer=null;ev.choices=[["leave","Move on"]];ev.loot=[get];ev.text=`The peddler pockets your ${S.items[give].name} and hands over the ${S.items[get].name}. "Anything else?"`;ev.sells=sellList().map(x=>({...x}))}}
  save();render();
}

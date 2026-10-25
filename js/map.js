// ================= MAP =================
const NODE_INFO={get fight(){return tx("Fight")},get elite(){return tx("Elite")},get boss(){return tx("Boss")},get chest(){return tx("Chest")},get shrine(){return tx("Shrine")},get peddler(){return tx("Peddler")},get camp(){return tx("Camp")},get mystery(){return tx("Mystery")}};
const MYSTERY=[[.14,"ambush"],[.26,"shrine"],[.38,"pack"],[.5,"chest"],[.6,"peddler"],[.68,"altar"],[.76,"alchemist"],[.84,"traveller"],[.92,"forge"],[1,"riddle"]],mystery=x=>MYSTERY.find(([p])=>x<p)[1];
// ---- grid helpers: m.g = tile rows ("." floor, "," brush, "#" rock/tree, "~" water), m.pois = things on tiles, m.sn = seen flags, m.mem = last-seen POI types
const inb=(m,x,y)=>x>=0&&y>=0&&x<m.w&&y<m.h,walk=(m,x,y)=>inb(m,x,y)&&!"#~".includes(m.g[y][x]),poiAt=(m,x,y)=>m.pois.find(p=>p.x===x&&p.y===y&&!p.done)||m.pois.find(p=>p.x===x&&p.y===y),DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
function bfs(m,x,y,ok=walk){const d=Array(m.w*m.h).fill(-1),q=[[x,y]];d[y*m.w+x]=0;
  for(let k=0;k<q.length;k++){const [a,b]=q[k];DIRS.forEach(([dx,dy])=>{const u=a+dx,v=b+dy;if(ok(m,u,v)&&d[v*m.w+u]<0){d[v*m.w+u]=d[b*m.w+a]+1;q.push([u,v])}})}return d}
const depthOf=(m,x,y)=>x===m.lair.x&&y===m.lair.y?MAP_ROWS-1:Math.max(0,Math.min(MAP_ROWS-2,Math.floor((MAP_ROWS-1)*m.d[y*m.w+x]/m.D)));
const lightR=m=>m.torch>0?TORCH.rad:TORCH.dim,litAt=(m,x,y)=>Math.max(Math.abs(x-m.pos.x),Math.abs(y-m.pos.y))<=lightR(m); // Chebyshev radius
function reveal(m){
  for(let y=Math.max(0,m.pos.y-TORCH.rad);y<=Math.min(m.h-1,m.pos.y+TORCH.rad);y++)for(let x=Math.max(0,m.pos.x-TORCH.rad);x<=Math.min(m.w-1,m.pos.x+TORCH.rad);x++)if(litAt(m,x,y)){
    const k=x+","+y,p=poiAt(m,x,y);m.sn[y*m.w+x]=1;if(p&&!p.done)m.mem[k]=p.t;else delete m.mem[k]}}
// o: {seed (reproducible map and enemy picks, else Math.random), heat, zone, twist}
function genMap(o){
  o=o||{};const sd=o.seed!=null,R=sd?rng(o.seed):Math.random,h=o.heat||0,W=GRID.w,H=GRID.h,key=(x,y)=>x+","+y;
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a},cols=Array.from({length:(W-1)/2},(_,i)=>i*2+1),sx=cols[Math.floor(R()*cols.length)];
  const m={w:W,h:H,g:[],pois:[],pos:{x:sx,y:H-1},prev:null,start:{x:sx,y:H-1},lair:{x:1,y:0},gate:{x:1,y:1},sn:Array(W*H).fill(0),mem:{},d:[],D:1,torch:0,tmax:TORCH.max+(o.twist==="nocamp"?TORCH.nocamp:0),steps:0,dp:0,cleared:false,amb:false,sd,seed:sd?o.seed:Math.floor(Math.random()*1e9),heat:h};
  const g=Array.from({length:H},()=>Array(W).fill("#")),active=[[sx,H-2]];g[H-2][sx]=".";
  // A growing-tree maze first connects every region. Mixing frontier and depth-first
  // carving gives different branch lengths instead of one prescribed northward path.
  while(active.length){const i=R()<.6?active.length-1:Math.floor(R()*active.length),[x,y]=active[i],next=shuffle(DIRS.map(([dx,dy])=>[x+dx*2,y+dy*2]).filter(([u,v])=>u>0&&v>0&&u<W-1&&v<H-1&&g[v][u]==="#"));
    if(!next.length){active.splice(i,1);continue}const [u,v]=next[0];g[(y+v)/2][(x+u)/2]=".";g[v][u]=".";active.push([u,v])}
  // Rooms open out the maze; braiding its remaining walls adds alternate routes.
  // Every carving touches connected ground, so there are no inaccessible pockets.
  for(let i=0,n=4+Math.floor(R()*4);i<n;i++){const cx=cols[Math.floor(R()*cols.length)],cy=1+2*Math.floor(R()*((H-1)/2)),rw=2+Math.floor(R()*3),rh=2+Math.floor(R()*3),rx=Math.max(1,Math.min(W-1-rw,cx-(rw>>1))),ry=Math.max(1,Math.min(H-1-rh,cy-(rh>>1)));
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)g[y][x]="."}
  const links=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]==="#"&&((g[y][x-1]==="."&&g[y][x+1]===".")||(g[y-1][x]==="."&&g[y+1][x]===".")))links.push([x,y]);
  shuffle(links).slice(0,10+Math.floor(R()*9)).forEach(([x,y])=>g[y][x]=".");
  g[H-1][sx]=".";g[H-1][sx-1]=".";g[H-1][sx+1]=".";
  m.g=g.map(r=>r.join(""));const initial=bfs(m,sx,H-1),farTop=cols.filter(x=>initial[W+x]>=24),bx=(farTop.length?farTop:cols)[Math.floor(R()*(farTop.length||cols.length))];
  m.lair={x:bx,y:0};m.gate={x:bx,y:1};g[0][bx]=".";
  // A reachable camp beside the gate, without cutting another compulsory corridor.
  const camp=shuffle(DIRS.map(([dx,dy])=>[bx+dx,1+dy]).filter(([x,y])=>y>0&&g[y][x]==="."))[0];
  m.g=g.map((row,y)=>row.map((t,x)=>t==="#"&&y>0&&R()<.2?"~":t==="."&&Math.abs(x-sx)+Math.abs(y-(H-1))>1&&R()<.12?",":t).join(""));
  m.d=bfs(m,sx,H-1);m.D=m.d[bx];
  const dist=(x,y)=>m.d[y*W+x],depth=(x,y)=>depthOf(m,x,y);
  const cand=[];for(let y=1;y<H;y++)for(let x=0;x<W;x++)if(walk(m,x,y)&&dist(x,y)>=3&&!(x===bx&&y===1)&&!(x===camp[0]&&y===camp[1]))cand.push([x,y]);
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[cand[i],cand[j]]=[cand[j],cand[i]]}
  const add=(t,x,y)=>{const p={t,x,y,r:depth(x,y),done:false};m.pois.push(p);return p};
  add("boss",bx,0);add("fight",bx,1);add(o.twist==="nocamp"?"fight":"camp",...camp);
  const fe=t=>t==="fight"||t==="elite",far=c=>dist(...c)>3&&Math.max(Math.abs(c[0]-sx),Math.abs(c[1]-(H-1)))>3; // enemies never start within 3 tiles of the start
  const place=(t,minR)=>{const ok=(c,sp)=>depth(...c)>=minR&&(!fe(t)||far(c))&&(!sp||m.pois.every(p=>Math.max(Math.abs(p.x-c[0]),Math.abs(p.y-c[1]))>=2)),i=[cand.findIndex(c=>ok(c,1)),cand.findIndex(c=>ok(c,0)),fe(t)?cand.findIndex(far):0].find(i=>i>=0);
    if(i>=0&&cand.length)add(t,...cand.splice(i,1)[0])};
  const ok=t=>sd||isUnl(t); // a POI type that is not unlocked yet is not placed (a seeded daily map always has them all); the rolls below are made either way, so the layout of the rest does not shift
  const ne=Math.round((POI_N.elite[0]+Math.floor(R()*POI_N.elite[1]))*(h>=2?HEAT_T.elite:1)),nf=POI_N.fight[0]+Math.floor(R()*POI_N.fight[1]);
  if(ok("elite"))for(let i=0;i<ne;i++)place("elite",2);
  if(ok("peddler"))place("peddler",1);if(ok("shrine"))for(let i=0;i<POI_N.shrine;i++)place("shrine",1);for(let i=0;i<POI_N.chest;i++)place("chest",0);if(ok("mystery"))for(let i=0;i<POI_N.mystery;i++)place("mystery",0);for(let i=0;i<nf;i++)place("fight",0);
  if(o.twist==="elites")m.pois.forEach(p=>{if(p.t==="fight"&&p.r>0)p.t="elite"});
  if(h>=2&&ok("elite")){const c=m.pois.filter(p=>p.t==="fight"&&p.r>=2&&p.r<MAP_ROWS-2);if(c.length)c[Math.floor(R()*c.length)].t="elite"}
  if(sd)m.pois.forEach(nd=>{if(nd.t==="boss")return;const rn=rng(hash(o.seed+":"+nd.x+","+nd.y));nd.e=pickEnemy(o.zone,rn);if(nd.t==="mystery")nd.my=mystery(rn());
    // pre-rolled so the same day plays out alike: rarity and affixes (their own seeded rng per tile), chest (mimic, loot, scroll), pack loot and four rolls (rv) for choice events and six (sh) for the peddler's stock (the one-for-one offer, what you can sell and satchel-based event choices depend on you, so they vary)
    const zp=zonePool(o.zone),pk=a=>a[Math.floor(rn()*a.length)];
    nd.ch={m:rn()<.25,l:[pk(zp),pk(zp)],e:rn()<.5?pk(ESS_POOL):null,s:rn()<.15,sx:rn()};nd.pk=[pk(zp),...rn()<.5?[pk(zp)]:[]];nd.rv=[rn(),rn(),rn(),rn()];nd.sh=[rn(),rn(),rn(),rn(),rn(),rn()];nd.gr=Array.from({length:8},rn);nd.ch.g=nd.gr;
    if(fe(nd.t)||nd.t==="mystery")Object.assign(nd,rollFoe(rng(hash(o.seed+":r:"+nd.x+","+nd.y)),{elite:nd.t==="elite"||(o.twist==="elites"&&nd.t==="mystery"),heat:h,row:nd.r,mv:nd.x===bx&&nd.y===1?"still":ENEMIES[nd.e].mv}))}); // gr: grade rolls for chest, pack and event finds
  m.pois.forEach(p=>{if(!fe(p.t))return;if(o.zone&&!p.e)p.e=pickEnemy(o.zone); // each enemy is picked now (so its way of moving is known); the gate guard never moves, elites stalk slowly
    p.mv=!o.zone||(p.x===bx&&p.y===1)?"still":ENEMIES[p.e].mv||"still";
    if(p.rar==null)Object.assign(p,rollFoe(R,{elite:p.t==="elite",heat:h,row:p.r,mv:p.mv}))}); // rarity and affixes are rolled once, so fleeing and coming back meets the same foe (elites keep their species' way of moving, only slower)
  m.torch=m.tmax;m.mem[key(bx,0)]="boss";m.sn[bx]=1;reveal(m);
  return m;
}
const heatOf=z=>S.heat[z]||{max:0,sel:0},newMap=z=>(checkUnl(),genMap({heat:heatOf(z).sel,zone:z})); // unlocks are checked first, so a defeat or a boss kill opens its POIs on the very next map
const curMap=()=>S.run==="daily"&&S.daily?S.daily.map:S.maps[S.zone]||(S.maps[S.zone]=newMap(S.zone));
const heatNow=()=>curMap().heat||0,twistNow=()=>S.run==="daily"&&S.daily?S.daily.twist:null,campFrac=()=>heatNow()>=5?HEAT_T.rest:.4;
function setHeat(n){ // pick the heat for new expeditions here; an untouched map is rerolled at once
  const hz=heatOf(S.zone);if(busy()||S.run==="daily"||!(n>=0&&n<=hz.max))return;
  S.heat[S.zone]={max:hz.max,sel:n};const m=curMap();
  if(!m.steps&&(m.heat||0)!==n)S.maps[S.zone]=newMap(S.zone);else if((m.heat||0)!==n)toast(tx("Heat {n} starts with your next expedition here.",{n}));
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
  if(was&&m.torch<=0)toast(tx("Your torch gutters out. The dark presses close."));
  const nd=poiAt(m,x,y);if(nd&&!nd.done)return enter(nd);
  if(m.torch<=0){const ra=m.sd?rng(hash(m.seed+":a:"+m.steps)):Math.random; // a seeded map rolls the dark's ambush by step number, so the same path meets the same things
    if(ra()<TORCH.amb){const e=pickEnemy(S.zone,ra),f=rollFoe(ra,{elite:twistNow()==="elites",heat:m.heat||0,row:depthOf(m,x,y),mv:ENEMIES[e].mv});return startBattle(null,{row:depthOf(m,x,y),ambush:true,amsg:tx("Ambush! Something finds you in the dark."),e,...f})}}
  if(foesAct(m))return;
  save();render();
}
// ---- roaming enemies: after each step that met nothing, every live mover acts once, in map order
const isFoe=p=>p.t==="fight"||p.t==="elite",roamer=p=>isFoe(p)&&p.mv&&p.mv!=="still"&&!p.done,mlog=(m,t)=>{m.ls=m.steps;(m.log||(m.log=[])).push(t);if(m.log.length>20)m.log.shift()};
const fixed=(m,x,y)=>[m.start,m.gate,m.lair].some(q=>q.x===x&&q.y===y);
// a tile no enemy may ever stand on: rock, water, the start, the gate, the lair, any POI that is not an enemy (dead or alive) or a defeated one's corpse
const hard=(m,x,y)=>!walk(m,x,y)||fixed(m,x,y)||m.pois.some(p=>p.x===x&&p.y===y&&!(isFoe(p)&&(p.done||roamer(p))));
const vacant=(m,x,y,me)=>!hard(m,x,y)&&!m.pois.some(p=>p!==me&&p.x===x&&p.y===y&&!p.done); // ... and one nobody stands on
function foesAct(m){
  if(m.steps<2||!isUnl("roam"))return false; // the first step of an expedition is safe; before your first win nothing moves
  const rs=m.pois.filter(roamer);if(!rs.length)return false;
  const R=m.sd?rng(hash(m.seed+":e:"+m.steps)):Math.random,dp=bfs(m,m.pos.x,m.pos.y),dm=bfs(m,m.pos.x,m.pos.y,(m,x,y)=>!hard(m,x,y)),W=m.w,dark=m.torch<=0;
  for(const p of rs){
    if(p.dz>0){p.dz--;continue}
    const el=p.t==="elite",d=dp[p.y*W+p.x]<0?99:dp[p.y*W+p.x],nm=ENEMIES[p.e]?tx(ENEMIES[p.e].name):tx("hunter");
    if(p.mv==="chase"){const rg=el?ROAM.elite:ROAM.aw+(dark?ROAM.dark-ROAM.aw:0)+(m.heat>=3?ROAM.heat:0);
      if(!p.aw&&d<=rg){p.aw=1;unlock("hunt");mlog(m,tx("The {nm} catches your scent.",{nm}))}else if(p.aw&&d>ROAM.lose){p.aw=0;mlog(m,tx("The {nm} loses you.",{nm}))}}
    if(el){p.pa=p.pa?0:1;if(p.pa)continue} // elites move on every other step
    const at=(x,y)=>x===m.pos.x&&y===m.pos.y;
    for(let k=0,n=(p.afx||[]).includes("swiftfoot")?AFX_T.swift.moves:1;k<n;k++){ // a Swift-footed enemy takes several tiles per turn, each by the same rules
      const nb=DIRS.map(([a,b])=>[p.x+a,p.y+b]).filter(([x,y])=>walk(m,x,y)&&(at(x,y)?!hard(m,x,y):vacant(m,x,y,p)));
      let to=null;
      if(p.aw&&dm[p.y*W+p.x]>0)to=nb.find(([x,y])=>dm[y*W+x]===dm[p.y*W+p.x]-1)||null;
      else if(nb.length&&R()>=ROAM.stay)to=nb[Math.floor(R()*nb.length)];
      if(!to)break;
      const from=[p.x,p.y];p.x=to[0];p.y=to[1];p.ms=m.steps;
      if(at(p.x,p.y)){reveal(m);unlock("hunt");mlog(m,tx("The {nm} lunges out of the dark!",{nm}));enter(p,"it",from);return true}}}
  reveal(m);return false}
function slip(B){ // you fled a map enemy: it stays and is dazed; you step back, or stay put if it walked into you
  const m=curMap(),nd=m.pois[B.pi];if(!nd||!isFoe(nd)||!nd.done)return;
  nd.done=false;nd.aw=0;const mv=nd.mv&&nd.mv!=="still";if(mv)nd.dz=ROAM.daze; // it loses your trail too, and must notice you again
  if(B.by==="it"&&B.ef&&walk(m,B.ef[0],B.ef[1])){nd.x=B.ef[0];nd.y=B.ef[1]}
  else if(m.prev&&walk(m,m.prev.x,m.prev.y)){m.pos=m.prev;m.prev=null}
  mlog(m,mv?tx("You slip away. The {name} is dazed and stays put for {n} steps.",{name:tx(ENEMIES[B.id].name),n:ROAM.daze}):tx("You slip away. The {name} lets you go.",{name:tx(ENEMIES[B.id].name)}));if(mv)blog(tx("The {name} is dazed. It will not follow for {n} steps.",{name:bname(B),n:ROAM.daze}),"good");reveal(m)}
function enter(nd,by,from){ // the one place a POI is resolved into a battle or an event; by "it": the enemy walked into you (from = the tile it left)
  const m=curMap();nd.done=true;delete m.mem[nd.x+","+nd.y];S.battle=null;S.event=null;
  let t=nd.t;
  if(t==="mystery")t=nd.my||mystery(Math.random());
  if(isFoe(nd)){if(!nd.e)nd.e=pickEnemy(S.zone);if(nd.rar==null)Object.assign(nd,rollFoe(Math.random,{elite:nd.t==="elite",heat:m.heat||0,row:nd.r,mv:nd.mv}))} // an older map: pick once and keep
  const src=isFoe(nd)?{pi:m.pois.indexOf(nd),by:by||"you",ef:from,...by==="it"?{amsg:tx("The {nm} lunges out of the dark!",{nm:tx(ENEMIES[nd.e].name)}),lunge:1}:{}}:{},P=pstats(),hl=m.heat||0,amb=!!m.amb&&["fight","elite"].includes(t),r=nd.r; // m.amb: a robbed traveller's friends make your next fight an ambush; it ends with the next stop whatever it is
  m.amb=false;
  if(t==="fight")return startBattle(null,{row:r,ambush:amb,e:nd.e,rar:nd.rar,afx:nd.afx,...src});
  if(t==="ambush")return startBattle(null,{row:r,ambush:true,e:nd.e,rar:nd.rar,afx:nd.afx});
  if(t==="elite")return startBattle(null,{row:r,ambush:amb,e:nd.e,rar:nd.rar,afx:nd.afx,...src});
  if(t==="boss")return startBattle(ZONES[zoneIdx(S.zone)][2]);
  if(ENC[t])S.event=ENC[t].make([...nd.rv||[0,0,0,0].map(()=>Math.random()),...(nd.gr||[]).slice(0,4)],hl); // rv[4..7] roll the grades of what the event gives
  if(t==="pack"){const pool=zonePool(S.zone),got=(nd.pk?[...nd.pk]:[pick(pool)]).map((id,k)=>dropNow(id,nd.gr&&nd.gr[k]));if(!nd.pk&&Math.random()<.5)got.push(dropNow(pick(pool)));got.forEach(id=>addItem(id));sfx("loot");
    S.event={type:"pack",icon:"chest",title:tx("An abandoned pack"),text:tx("Someone left in a hurry. You help yourself."),loot:got,choices:[]}}
  if(t==="chest")S.event={type:"chest",icon:"chest",title:tx("A lone chest"),text:tx("An iron-banded chest sits in the open, unattended. Suspiciously unattended."),loot:[],choices:[["open",tx("Open it")],["leave",tx("Walk past")]],pre:nd.ch};
  if(t==="peddler")S.event=merchant(nd.sh);
  if(t==="camp"){torchUp(m.tmax);S.event={type:"camp",icon:"camp",title:tx("A sheltered camp"),text:tx("A ring of stones and dry wood, out of the wind. The fire relights your torch. The boss lies just ahead."),loot:[],choices:[["rest",tx("Rest (+{n} HP)",{n:Math.round(P.maxHp*campFrac())})],...hl>=5?[]:[["embers",tx("Bank the embers (+1 campfire charge)")]]]}}
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
    if(c==="rest"){const g=healYou(Math.round(pstats().maxHp*campFrac()));S.event={type:"done",icon:"camp",title:tx("Well rested"),text:tx("You sleep by the fire and recover {n} HP.",{n:g}),loot:[],choices:[]}}
    else{const had=S.camp;S.camp=Math.min(3,S.camp+1);S.event={type:"done",icon:"camp",title:tx("Embers banked"),text:S.camp>had?tx("You pack glowing embers for later. One more campfire charge."):tx("Your ember pouch is already full. At least it's warm."),loot:[],choices:[]}}}
  if(ev.type==="chest"&&c==="open"){
    const pre=ev.pre;if(pre?pre.m:Math.random()<.25){S.event=null;return startBattle("mimic")}
    const p=zonePool(S.zone),got=(pre?[...pre.l]:[pick(p),pick(p)]).map((id,k)=>dropNow(id,pre&&pre.g?pre.g[k]:undefined));if(pre?pre.e:Math.random()<.5)got.push(essNow(pre?pre.e:pick(ESS_POOL),pre&&pre.g?pre.g[2]:undefined));got.forEach(id=>addItem(id));
    endEv("chest",tx("Treasure!"),tx("It was just a chest. A very generous chest."),got,(pre?pre.s:Math.random()<.15)?giveHint(pre?pre.sx:undefined):"")}
  if(ev.type==="merchant"&&c==="trade"){const {give,get}=ev.offer;
    if((S.inv[give]||0)-eqCount(give)<=0){toast(tx("You no longer have that item."));S.event=null}
    else{S.inv[give]--;trimBench();addItem(get);ev.offer=null;ev.choices=[["leave",tx("Move on")]];ev.loot=[get];ev.text=tx('The peddler pockets your {give} and hands over the {get}. "Anything else?"',{give:iname(S.items[give]),get:iname(S.items[get])});ev.sells=sellList().map(x=>({...x}))}}
  save();render();
}

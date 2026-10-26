// ================= STATE =================
const KEY="everforge-v18";
function baseItem(id){const [b,a]=id.split("~"),[name,form,traits,kind]=BASE[b],A=a&&AFX[a],it={id,name,form,noun:name.split(" ").pop(),traits,tier:1,crafted:false,...(kind?{kind}:{})};
  return A?{...it,name:`${A.n} ${name}`,traits:{...traits,[A.tr]:Math.round(((traits[A.tr]||0)+AFX_RAW)*10)/10},afx:a}:it} // an affixed variant (boar_hide~vamp) carries its affix's trait on top
function mkGraded(b,g){ // the item for base id b at grade g (pure: loadSave rebuilds graded items with it)
  const es=/^ess_([A-Za-z]+)$/.exec(b),it=es?{id:b,name:`${es[1]} Essence`,form:"material",kind:"essence",noun:"Essence",traits:{[es[1]]:ESS_VALUE},tier:1,crafted:false}:baseItem(b);
  return g===3?it:{...it,id:gradedId(b,g),name:`${GRADES[g-1][0]} ${it.name}`,traits:Object.fromEntries(Object.entries(it.traits).map(([t,v])=>[t,Math.round(v*GRADE_M[g-1]*10)/10])),grade:g}}
// lifetime counters (S.stats); a missing counter takes the statsDef() default. kills per zone come from S.zoneKills
const statsDef=()=>({salvaged:0,studied:0,dealt:0,taken:0,big:0,bigW:"",crits:0,parries:0,abil:0,sufd:0,cured:0,elites:0,bosses:0,deaths:0,exped:0,heatBest:{},fast:{},forged:0,legend:0,mishaps:0,fizzles:0,earned:0,spent:0,refined:0,shaped:0,dailies:0,dailyWins:0,dBest:null});
function freshState(){
  const items={};Object.keys(BASE).forEach(id=>items[id]=baseItem(id));
  return {v:18,onboarding:0,pinned:null,bountyChoices:[],locked:[],recent:[],inventory:{layout:"list",sort:"type",gear:{category:"all",filter:"all"},forge:{category:"all",filter:"craftable"}},embers:0,afx:{},unl:{},rp:0,techs:{},tpaid:{},rpd:{},rxh:{},infCredit:0,skills:{},maps:{},heat:{},daily:null,run:null,infuse:{},items,inv:{iron_sword:1},eq:{main:"iron_sword",off:null,head:null,body:null,hands:null,feet:null,charm:null},
    hp:999,camp:2,campProg:0,xp:0,journal:[],knownR:[],hints:[0,1,2],bench:[],act:"forge",last:null,tab:"all",rtab:"all",view:"battle",zone:"woods",rift:{depth:1,best:0,seed:0,biome:"",name:"",pal:null,cleared:0},
    wins:0,kills:{},seen:{},codex:{},unlocked:["woods"],zoneKills:{},quest:0,bounty:null,stats:statsDef(),fresh:[],battle:null,event:null};
}
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const DEFAULTED=["maps","infuse","eq","kills","seen","codex","zoneKills","stats","journal","knownR","bench","unlocked","fresh","hp","xp","zone","heat","daily","run","hints","embers","skills","infCredit","afx","unl","rp","techs","tpaid","rpd","rxh","rift"];
// Shape check for loaded or imported saves, so a malformed one is rejected instead of breaking every render.
function sane(s){
  return ["maps","heat","infuse","items","inv","eq","kills","seen","codex","zoneKills","stats","unl"].every(k=>isObj(s[k]))
    &&["journal","knownR","bench","unlocked","fresh"].every(k=>Array.isArray(s[k]))
    &&Number.isFinite(s.hp)&&Number.isFinite(s.xp)&&ZONES.some(z=>z[0]===s.zone)
    &&Object.keys(s.inv).every(id=>isObj(s.items[id])&&isObj(s.items[id].traits)&&typeof s.items[id].name==="string"&&FORMS[s.items[id].form])
    &&s.bench.every(id=>isObj(s.items[id]))&&s.journal.every(j=>isObj(j)&&isObj(s.items[j.id]));
}
// Saves are latest-only: a save of another version is not loaded at all (the game starts fresh). loadSave() only validates and clamps a current save.
function loadSave(s){
  if(!isObj(s)||s.v!==18)return null;
  if(!isObj(s.items)||!isObj(s.inv))return null;
  const dflt=freshState();DEFAULTED.forEach(k=>{if(s[k]===undefined)s[k]=dflt[k]});if(!isObj(s.afx))s.afx={};
  Object.keys(BASE).forEach(id=>s.items[id]=baseItem(id));
  if(!sane(s))return null;
  Object.keys(s.items).forEach(id=>{const b=baseIdOf(id),g=gradeOf(id);if(gradable(b)&&gradedId(b,g)===id)s.items[id]=mkGraded(b,g)}); // essences and graded materials are rebuilt from their fixed values
  s.embers=Math.max(0,Math.floor(Number(s.embers))||0);s.infCredit=Math.max(0,Math.floor(Number(s.infCredit))||0);
  // Additive timing ranks need no save bump; old known specials imply rank I at read time.
  Object.values(s.codex).forEach(k=>{if(isObj(k)&&k.timing!==undefined){const t=isObj(k.timing)?k.timing:{};k.timing=Object.fromEntries(["sp","sp2"].map(key=>[key,Number.isFinite(t[key])?Math.max(0,Math.min(PARRY_T.levels,Math.floor(t[key]))):0]))}});
  // Codex facts follow the creature: an enemy that changed its element (the Woods' stag and briarling) leaves stale weaknesses behind, and know() counts them, which inflates mastery and shows the wrong weakness. Pruning is idempotent, so no save bump is needed.
  Object.entries(s.codex).forEach(([id,k])=>{const E=ENEMIES[id];if(!isObj(k)||!E)return;
    const facts=key=>[...(E[key]||[]),...(E.phase&&E.phase.to?E.phase.to[key]:[])],keep=(key,list)=>{const ok=new Set(list);k[key]=Array.isArray(k[key])?k[key].filter(x=>ok.has(x)):[]};
    keep("weak",facts("weak"));keep("resist",facts("resist"));
    const ids=new Set((E.drops||[]).map(d=>d[0]));k.drops=Array.isArray(k.drops)?k.drops.filter(d=>ids.has(d)):[];
    const infs=new Set([E.inf&&E.inf.s,E.phase&&E.phase.to&&E.phase.to.inf&&E.phase.to.inf.s].filter(Boolean));k.inf=Array.isArray(k.inf)?k.inf.filter(s=>infs.has(s)):[];});
  s.skills=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,isObj(s.skills)?Math.max(0,Math.floor(Number(s.skills[k]))||0):0]));
  if(!isObj(s.rift))s.rift={depth:1,best:0,seed:0,biome:"",name:"",pal:null,cleared:0}; // the Rift: depth, best depth, and the seed of the region (the seed rebuilds its creatures)
  s.rift.depth=Math.max(1,Math.floor(Number(s.rift.depth)||1));s.rift.best=Math.max(0,Math.floor(Number(s.rift.best)||0));s.rift.seed=Math.floor(Number(s.rift.seed)||0);s.rift.cleared=s.rift.cleared?1:0;
  if(!isObj(s.rift.pal))s.rift.pal=null;
  const st0=s.stats,sd=statsDef(),had=k=>st0[k]!==undefined;
  Object.keys(sd).forEach(k=>{const v=st0[k],d=sd[k];const ok=typeof d==="number"?Number.isFinite(v)&&v>=0:typeof d==="string"?typeof v==="string":k==="dBest"?v===null||(isObj(v)&&Number.isFinite(v.rows)&&Number.isFinite(v.turns)):isObj(v);
    st0[k]=had(k)&&ok?v:d});
  ["heatBest","fast"].forEach(k=>Object.keys(st0[k]).forEach(x=>{if(!Number.isFinite(st0[k][x]))delete st0[k][x]}));
  Object.keys(s.heat).forEach(z=>{const h=s.heat[z];if(!ZONES.some(x=>x[0]===z)||!isObj(h))delete s.heat[z];else{h.max=Math.max(0,Math.min(HEAT_MAX,h.max|0));h.sel=Math.max(0,Math.min(h.max,h.sel|0))}});
  const d=s.daily;
  const okMap=m=>{ // dimensions belong to the saved expedition, not today's generator
    if(!isObj(m)||!Number.isInteger(m.w)||!Number.isInteger(m.h)||m.w<5||m.h<5||m.w>31||m.h>31)return false;
    const N=m.w*m.h,pt=p=>isObj(p)&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<m.w&&p.y<m.h;
    return Array.isArray(m.g)&&m.g.length===m.h&&m.g.every(r=>typeof r==="string"&&r.length===m.w&&/^[.,#~]+$/.test(r))&&[m.pos,m.start,m.lair,m.gate].every(pt)&&(m.prev===null||pt(m.prev))
    &&Array.isArray(m.pois)&&m.pois.every(p=>pt(p)&&typeof p.t==="string"&&Number.isFinite(p.r)&&!"#~".includes(m.g[p.y][p.x]))&&Array.isArray(m.sn)&&m.sn.length===N&&Array.isArray(m.d)&&m.d.length===N&&isObj(m.mem)&&Number.isFinite(m.torch)&&Number.isFinite(m.tmax)&&Number.isFinite(m.steps)&&Number.isFinite(m.dp)&&Number.isFinite(m.D)&&m.D>0&&m.pois.some(p=>p.t==="boss")&&!"#~".includes(m.g[m.pos.y][m.pos.x]);
  };
  Object.keys(s.maps).forEach(z=>{if(!okMap(s.maps[z])){delete s.maps[z];migNote=true}});
  if(d&&!(isObj(d)&&(d.state==="done"||okMap(d.map))&&["run","done"].includes(d.state)&&(d.state!=="done"||isObj(d.result))&&Number.isFinite(d.turns)&&Number.isFinite(d.seed)&&ZONES.some(z=>z[0]===d.zone)&&ZONES.some(z=>z[0]===d.back)&&DAILY_TWISTS[d.twist]))s.daily=null;
  if(s.run!=="daily"||!s.daily||s.daily.state!=="run")s.run=null;else s.zone=s.daily.zone;
  s.hints=Array.isArray(s.hints)?s.hints.filter(i=>Number.isInteger(i)&&SECRETS[i]):[0,1,2];
  if(!VIEWS.includes(s.view))s.view="battle";
  s.rp=Math.max(0,Math.floor(Number(s.rp))||0);if(!isObj(s.rpd))s.rpd={};
  {const tk=isObj(s.techs)?s.techs:{},tp=isObj(s.tpaid)?s.tpaid:{};s.techs=Object.fromEntries(TECHS.filter(t=>Number.isFinite(tk[t.id])).map(t=>[t.id,tk[t.id]]));s.tpaid=Object.fromEntries(Object.keys(s.techs).map(id=>[id,Number.isFinite(tp[id])?Math.max(0,tp[id]):TECH[id].cost]))}
  s.rxh=Object.fromEntries(Object.entries(isObj(s.rxh)?s.rxh:{}).filter(([k,v])=>REACTIONS.some(r=>r[0]+"+"+r[1]===k)&&Array.isArray(v)).map(([k,v])=>[k,v.filter(t=>k.split("+").includes(t))]));
  s.onboarding=Number.isInteger(s.onboarding)&&s.onboarding>=0&&s.onboarding<=5?s.onboarding:null;
  const pin=s.pinned;
  s.pinned=isObj(pin)&&((pin.kind==="recipe"&&s.journal.some(j=>j.id===pin.id))||(pin.kind==="rumor"&&Number.isInteger(pin.id)&&SECRETS[pin.id]&&s.hints.includes(pin.id)))?{kind:pin.kind,id:pin.id}:null;
  s.bountyChoices=Array.isArray(s.bountyChoices)?s.bountyChoices.filter(b=>isObj(b)&&["hunt","forge"].includes(b.kind)&&Number.isInteger(b.need)&&b.need>0&&(b.kind==="forge"||typeof b.enemy==="string")&&isObj(b.reward)&&Array.isArray(b.reward.items)&&b.reward.items.every(id=>typeof id==="string"&&(s.items[id]||(/^ess:[A-Za-z]+(?:@[1-5])?$/.test(id)&&TRAITS[id.slice(4).split("@")[0]])))).slice(0,3):[];
  s.locked=Array.isArray(s.locked)?[...new Set(s.locked.filter(id=>s.items[id]))]:[];
  s.recent=Array.isArray(s.recent)?[...new Set(s.recent.filter(id=>s.items[id]))]:[];
  const ip=isObj(s.inventory)?s.inventory:{},validFilter=f=>["all","new","equipped","craftable"].includes(f)?f:"all",validCat=c=>["all","weapon","armor","charm","consumable","material"].includes(c)?c:"all";
  // v18 saves used one shared filter and S.tab for both Satchels. Seed both contexts from those values.
  const legacyFilter=validFilter(ip.filter),legacyCategory=validCat(s.tab);
  const context=k=>{const old=isObj(ip[k])?ip[k]:{};return{category:validCat(old.category??legacyCategory),filter:validFilter(old.filter??legacyFilter)}};
  s.inventory={layout:ip.layout==="grid"?"grid":"list",sort:["type","recent","grade"].includes(ip.sort)?ip.sort:"type",gear:context("gear"),forge:context("forge")};
  return s;
}
let migNote=false,S=null; // migNote: a map was dropped at load (shown once as a toast after load)
try{S=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){S=null}
try{S=loadSave(S)}catch(e){S=null}
S=S||freshState();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
// The save code (Settings): the state is encoded as one text blob, and a pasted code is decoded and validated by loadSave().
function exportSave(){return btoa(unescape(encodeURIComponent(JSON.stringify({...S,battle:null,event:null}))))}
function importSave(code){const s=loadSave(JSON.parse(decodeURIComponent(escape(atob(code)))));return s?keepDaily(s):null} // keepDaily: an older code cannot hand back today's daily

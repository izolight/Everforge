// ================= STATE =================
const KEY="everforge-v7",OLD_KEYS=["everforge-v6","everforge-v5","everforge-v4","everforge-v3"];
function baseItem(id){const [name,form,traits,kind]=BASE[id];return {id,name,form,noun:name.split(" ").pop(),traits,tier:1,crafted:false,...(kind?{kind}:{})}}
function freshState(){
  const items={};Object.keys(BASE).forEach(id=>items[id]=baseItem(id));
  return {v:7,maps:{},heat:{},daily:null,run:null,infuse:{},items,inv:{iron_sword:1},eq:{main:"iron_sword",off:null,head:null,body:null,hands:null,feet:null,charm:null},
    hp:999,camp:2,campProg:0,xp:0,journal:[],knownR:[],bench:[],last:null,tab:"all",rtab:"all",view:"battle",zone:"woods",
    wins:0,kills:{},seen:{},codex:{},unlocked:["woods"],zoneKills:{},quest:0,bounty:null,stats:{salvaged:0,studied:0},fresh:[],battle:null,event:null};
}
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const DEFAULTED=["maps","infuse","eq","kills","seen","codex","zoneKills","stats","journal","knownR","bench","unlocked","fresh","hp","xp","zone","heat","daily","run"];
// Shape check for loaded or imported saves, so a malformed one is rejected instead of breaking every render.
function sane(s){
  return ["maps","heat","infuse","items","inv","eq","kills","seen","codex","zoneKills","stats"].every(k=>isObj(s[k]))
    &&["journal","knownR","bench","unlocked","fresh"].every(k=>Array.isArray(s[k]))
    &&Number.isFinite(s.hp)&&Number.isFinite(s.xp)&&ZONES.some(z=>z[0]===s.zone)
    &&Object.keys(s.inv).every(id=>isObj(s.items[id])&&isObj(s.items[id].traits)&&typeof s.items[id].name==="string"&&FORMS[s.items[id].form])
    &&s.bench.every(id=>isObj(s.items[id]))&&s.journal.every(j=>isObj(j)&&isObj(s.items[j.id]));
}
function migrate(s){
  if(!isObj(s))return null;
  if(s.v===3){
    s.v=4;s.knownR=[];s.rtab="all";
    const byName=n=>Object.values(s.items).find(i=>i.name===n);
    Object.values(s.items).forEach(it=>{if(it.crafted&&!it.recipeIds)it.recipeIds=(it.recipe||[]).map(n=>byName(n)?.id).filter(Boolean)});
    Object.values(s.items).forEach(it=>{if(it.crafted&&it.form==="material"&&!it.kind)it.kind=s.items[it.recipeIds?.[0]]?.kind||"ore"});
    s.journal=s.journal.map(j=>({...j,id:Object.values(s.items).find(i=>i.crafted&&i.name===j.name)?.id})).filter(j=>j.id);
  }
  if(s.v===4){
    s.v=5;s.codex={};s.stats={salvaged:0,studied:0};s.fresh=[];s.quest=0;s.bounty=null;
    if(s.view==="journal")s.view="codex";
    s.unlocked=["woods",...(s.wins>=5?["pass"]:[]),...(s.wins>=14?["hollow"]:[])];
    s.zoneKills={};Object.entries(s.kills||{}).forEach(([id,n])=>{const e=ENEMIES[id];if(e&&!e.boss)s.zoneKills[e.zone]=(s.zoneKills[e.zone]||0)+n});
    Object.keys(s.seen||{}).forEach(id=>{if(ENEMIES[id])s.codex[id]={weak:[],resist:[],sp:false,stats:(s.kills[id]||0)>0,drops:[]}});
    s.battle=null;s.event=null;
  }
  if(s.v===5){s.v=6;s.maps={};s.infuse={};s.battle=null;s.event=null;if(s.quest>=6&&!(s.kills.gnarlhorn>0))s.quest=5}
  if(s.v===6){s.v=7;s.heat={};s.daily=null;s.run=null;ZONES.forEach(z=>{if((s.kills?.[z[2]]||0)>0)s.heat[z[0]]={max:1,sel:0}})}
  if(s.v!==7||!isObj(s.items)||!isObj(s.inv))return null;
  const dflt=freshState();DEFAULTED.forEach(k=>{if(s[k]===undefined)s[k]=dflt[k]});
  Object.keys(BASE).forEach(id=>s.items[id]=baseItem(id));
  if(!sane(s))return null;
  Object.values(s.items).forEach(it=>{if(it.id.startsWith("ess_")){it.kind="essence";const t=Object.keys(it.traits)[0];it.traits={[t]:ESS_VALUE}}});
  Object.keys(s.heat).forEach(z=>{const h=s.heat[z];if(!ZONES.some(x=>x[0]===z)||!isObj(h))delete s.heat[z];else{h.max=Math.max(0,Math.min(HEAT_MAX,h.max|0));h.sel=Math.max(0,Math.min(h.max,h.sel|0))}});
  const d=s.daily;if(d&&!(isObj(d)&&isObj(d.map)&&Array.isArray(d.map.rows)&&ZONES.some(z=>z[0]===d.zone)&&DAILY_TWISTS[d.twist]))s.daily=null;
  if(s.run!=="daily"||!s.daily||s.daily.state!=="run")s.run=null;else s.zone=s.daily.zone;
  if(!VIEWS.includes(s.view))s.view="battle";
  return s;
}
let S=null;
try{S=JSON.parse(localStorage.getItem(KEY)||"null");if(!S)for(const k of OLD_KEYS){S=JSON.parse(localStorage.getItem(k)||"null");if(S)break}}catch(e){S=null}
const hotS=window.claude?.hot?.data?.S;if(hotS)S=hotS;
try{S=migrate(S)}catch(e){S=null}
S=S||freshState();
window.claude?.hot?.snapshot?.(()=>({S}));
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

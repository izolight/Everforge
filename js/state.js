// ================= STATE =================
const KEY="everforge-v10",OLD_KEYS=["everforge-v9","everforge-v8","everforge-v7","everforge-v6","everforge-v5","everforge-v4","everforge-v3"];
function baseItem(id){const [name,form,traits,kind]=BASE[id];return {id,name,form,noun:name.split(" ").pop(),traits,tier:1,crafted:false,...(kind?{kind}:{})}}
// lifetime counters (S.stats); migrate() merges these into older saves. kills per zone come from S.zoneKills
const statsDef=()=>({salvaged:0,studied:0,dealt:0,taken:0,big:0,bigW:"",crits:0,parries:0,abil:0,sufd:0,cured:0,elites:0,bosses:0,deaths:0,exped:0,heatBest:{},fast:{},forged:0,legend:0,mishaps:0,fizzles:0,earned:0,spent:0,refined:0,dailies:0,dailyWins:0,dBest:null});
function freshState(){
  const items={};Object.keys(BASE).forEach(id=>items[id]=baseItem(id));
  return {v:10,embers:0,skills:{},maps:{},heat:{},daily:null,run:null,infuse:{},items,inv:{iron_sword:1},eq:{main:"iron_sword",off:null,head:null,body:null,hands:null,feet:null,charm:null},
    hp:999,camp:2,campProg:0,xp:0,journal:[],knownR:[],hints:[0,1,2],bench:[],last:null,tab:"all",rtab:"all",view:"battle",zone:"woods",
    wins:0,kills:{},seen:{},codex:{},unlocked:["woods"],zoneKills:{},quest:0,bounty:null,stats:statsDef(),fresh:[],battle:null,event:null};
}
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const DEFAULTED=["maps","infuse","eq","kills","seen","codex","zoneKills","stats","journal","knownR","bench","unlocked","fresh","hp","xp","zone","heat","daily","run","hints","embers","skills"];
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
  if(s.v===7){s.v=8;s.hints=[0,1,2]} // the three original rumors stay visible
  if(s.v===8){s.v=9;s.embers=Math.min(60,2*(s.wins|0))} // a small grant for progress made before embers existed
  if(s.v===9){s.v=10;s.skills={}; // veterans keep their craft: each crafted piece in the journal trains its category, refining trains alchemy
    if(isObj(s.items)&&Array.isArray(s.journal))s.journal.forEach(j=>{const it=isObj(s.items[j.id])&&s.items[j.id],k=it&&FORMS[it.form]&&skillOf(it);if(k){const n=20+10*(it.tier|0)+(it.legendary?40:0);s.skills[k]=(s.skills[k]||0)+n;if(k!=="alchemy")s.skills.alchemy=(s.skills.alchemy||0)+Math.round(n*SK_XP.input)}});
    if(isObj(s.stats))s.skills.alchemy=(s.skills.alchemy||0)+10*(s.stats.refined|0)
    if(isObj(s.items)&&isObj(s.inv)&&isObj(s.eq)){
      // pre-v10 flawed crafts share the clean id; move them to their own mishap id so the clean recipe can be forged again
      const ren={};Object.values(s.items).forEach(it=>{if(!it.crafted||!Array.isArray(it.recipeIds)||it.recipeIds.length<2||!isObj(it.traits))return;
        const key=it.recipeIds.slice().sort().join("+");if(it.id!=="c_"+hash(key).toString(36))return;
        const mk=it.mishap==="Weakened"?"Weakened":["Cursed","Brittle"].find(m=>it.traits[m]>0&&!it.recipeIds.some(r=>s.items[r]&&isObj(s.items[r].traits)&&s.items[r].traits[m]>0));
        if(mk)ren[it.id]="c_"+hash(key+"|"+mk).toString(36)});
      Object.entries(ren).forEach(([o,n])=>{const it=s.items[o];if(s.items[n]){}else s.items[n]={...it,id:n,clean:o};delete s.items[o];
        if(s.inv[o]!==undefined){s.inv[n]=(s.inv[n]||0)+s.inv[o];delete s.inv[o]}});
      const fix=id=>ren[id]||id;
      Object.keys(s.eq).forEach(k=>{s.eq[k]=s.eq[k]?fix(s.eq[k]):s.eq[k]});
      if(Array.isArray(s.bench))s.bench=s.bench.map(fix);if(Array.isArray(s.fresh))s.fresh=s.fresh.map(fix);
      if(Array.isArray(s.journal))s.journal.forEach(j=>{if(isObj(j))j.id=fix(j.id)});
      if(isObj(s.last)&&s.last.id)s.last.id=fix(s.last.id);
      Object.values(s.items).forEach(it=>{if(Array.isArray(it.recipeIds))it.recipeIds=it.recipeIds.map(fix)});
      // floor: a skill is never below what the best piece you own in its category needs (cap >= tier+1)
      const own=new Set([...Object.keys(s.inv).filter(id=>s.inv[id]>0),...Object.values(s.eq).filter(Boolean),...(Array.isArray(s.journal)?s.journal.map(j=>j.id):[])]),top={};
      own.forEach(id=>{const it=s.items[id],k=it&&it.crafted&&FORMS[it.form]&&skillOf(it);if(k)top[k]=Math.max(top[k]||0,it.tier|0)});
      Object.entries(top).forEach(([k,t])=>{const l=SK_CAP.findIndex(c=>c>=Math.min(9,t+1));s.skills[k]=Math.max(s.skills[k]||0,SK_LV[l<0?SK_LV.length-1:l])})}}
  if(s.v!==10||!isObj(s.items)||!isObj(s.inv))return null;
  const dflt=freshState();DEFAULTED.forEach(k=>{if(s[k]===undefined)s[k]=dflt[k]});
  Object.keys(BASE).forEach(id=>s.items[id]=baseItem(id));
  if(!sane(s))return null;
  ZONES.forEach((z,i)=>{if(i&&(s.kills[ZONES[i-1][2]]||0)>0&&!s.unlocked.includes(z[0]))s.unlocked.push(z[0])}); // zones added later open for saves that already beat the boss before them
  Object.values(s.items).forEach(it=>{const m=it.id.match(/^ess_([A-Za-z]+)(_2)?$/);if(m){it.kind="essence";it.traits={[m[1]]:m[2]?REFINE_VALUE:ESS_VALUE}}}); // plain and refined essences are reset to their fixed values
  s.embers=Math.max(0,Math.floor(Number(s.embers))||0);
  s.skills=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,isObj(s.skills)?Math.max(0,Math.floor(Number(s.skills[k]))||0):0]));
  const st0=s.stats,sd=statsDef(),had=k=>st0[k]!==undefined;
  const dv={forged:s.journal.length,legend:s.journal.filter(j=>j.legendary).length,bosses:ZONES.reduce((n,z)=>n+(s.kills[z[2]]|0),0),
    heatBest:Object.fromEntries(ZONES.filter(z=>s.kills[z[2]]>0).map(z=>[z[0],Math.max(0,((s.heat[z[0]]||{}).max|0)-1)])),dailies:s.daily&&s.daily.result?1:0,dailyWins:s.daily&&s.daily.result&&s.daily.result.boss?1:0,exped:Math.max(0,ZONES.reduce((n,z)=>n+(s.kills[z[2]]|0),0)-(s.daily&&s.daily.result&&s.daily.result.boss?1:0)),dBest:s.daily&&s.daily.result?{...s.daily.result,boss:!!s.daily.result.boss}:null}; // old saves keep what can be derived; the rest start at 0. Derived heatBest is a lower bound at the Heat cap
  Object.keys(sd).forEach(k=>{const v=st0[k],d=sd[k];const ok=typeof d==="number"?Number.isFinite(v)&&v>=0:typeof d==="string"?typeof v==="string":k==="dBest"?v===null||(isObj(v)&&Number.isFinite(v.rows)&&Number.isFinite(v.turns)):isObj(v);
    st0[k]=had(k)&&ok?v:k in dv?dv[k]:d});
  ["heatBest","fast"].forEach(k=>Object.keys(st0[k]).forEach(x=>{if(!Number.isFinite(st0[k][x]))delete st0[k][x]}));
  Object.values(s.items).forEach(it=>{const sc=it.legendary&&SECRETS.find(x=>x.name===it.name&&x.bonus);if(sc&&!(it.traits[sc.bonus.trait]>0))it.traits[sc.bonus.trait]=sc.bonus.v}); // a legendary that lost its bonus to the trait-slot trim gets it back
  Object.keys(s.heat).forEach(z=>{const h=s.heat[z];if(!ZONES.some(x=>x[0]===z)||!isObj(h))delete s.heat[z];else{h.max=Math.max(0,Math.min(HEAT_MAX,h.max|0));h.sel=Math.max(0,Math.min(h.max,h.sel|0))}});
  const d=s.daily,okMap=m=>isObj(m)&&Array.isArray(m.rows)&&m.rows.length===MAP_ROWS&&m.rows.every(r=>Array.isArray(r)&&r.length&&r.every(n=>isObj(n)&&Number.isFinite(n.x)&&Array.isArray(n.next)&&typeof n.t==="string"));
  if(d&&!(isObj(d)&&okMap(d.map)&&["run","done"].includes(d.state)&&(d.state!=="done"||isObj(d.result))&&Number.isFinite(d.turns)&&Number.isFinite(d.seed)&&ZONES.some(z=>z[0]===d.zone)&&ZONES.some(z=>z[0]===d.back)&&DAILY_TWISTS[d.twist]))s.daily=null;
  if(s.run!=="daily"||!s.daily||s.daily.state!=="run")s.run=null;else s.zone=s.daily.zone;
  s.hints=Array.isArray(s.hints)?s.hints.filter(i=>Number.isInteger(i)&&SECRETS[i]):[0,1,2];
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

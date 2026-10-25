// ================= STATE =================
const KEY="everforge-v17",OLD_KEYS=["everforge-v16","everforge-v15","everforge-v14","everforge-v13","everforge-v12","everforge-v11","everforge-v10","everforge-v9","everforge-v8","everforge-v7","everforge-v6","everforge-v5","everforge-v4","everforge-v3"];
function baseItem(id){const [b,a]=id.split("~"),[name,form,traits,kind]=BASE[b],A=a&&AFX[a],it={id,name,form,noun:name.split(" ").pop(),traits,tier:1,crafted:false,...(kind?{kind}:{})};
  return A?{...it,name:`${A.n} ${name}`,traits:{...traits,[A.tr]:Math.round(((traits[A.tr]||0)+AFX_RAW)*10)/10},afx:a}:it} // an affixed variant (boar_hide~vamp) carries its affix's trait on top
function mkGraded(b,g){ // the item for base id b at grade g (pure: migrate rebuilds graded items with it)
  const es=/^ess_([A-Za-z]+)$/.exec(b),it=es?{id:b,name:`${es[1]} Essence`,form:"material",kind:"essence",noun:"Essence",traits:{[es[1]]:ESS_VALUE},tier:1,crafted:false}:baseItem(b);
  return g===3?it:{...it,id:gradedId(b,g),name:`${GRADES[g-1][0]} ${it.name}`,traits:Object.fromEntries(Object.entries(it.traits).map(([t,v])=>[t,Math.round(v*GRADE_M[g-1]*10)/10])),grade:g}}
// lifetime counters (S.stats); migrate() merges these into older saves. kills per zone come from S.zoneKills
const statsDef=()=>({salvaged:0,studied:0,dealt:0,taken:0,big:0,bigW:"",crits:0,parries:0,abil:0,sufd:0,cured:0,elites:0,bosses:0,deaths:0,exped:0,heatBest:{},fast:{},forged:0,legend:0,mishaps:0,fizzles:0,earned:0,spent:0,refined:0,shaped:0,dailies:0,dailyWins:0,dBest:null});
function freshState(){
  const items={};Object.keys(BASE).forEach(id=>items[id]=baseItem(id));
  return {v:17,locked:[],recent:[],inventory:{layout:"grid",filter:"all",sort:"type"},embers:0,afx:{},unl:{},rp:0,techs:{bind:1},rpd:{},rxh:{},infCredit:0,skills:{},maps:{},heat:{},daily:null,run:null,infuse:{},items,inv:{iron_sword:1},eq:{main:"iron_sword",off:null,head:null,body:null,hands:null,feet:null,charm:null},
    hp:999,camp:2,campProg:0,xp:0,journal:[],knownR:[],hints:[0,1,2],bench:[],last:null,tab:"all",rtab:"all",view:"battle",zone:"woods",rift:{depth:1,best:0,seed:0,biome:"",name:"",pal:null,cleared:0},
    wins:0,kills:{},seen:{},codex:{},unlocked:["woods"],zoneKills:{},quest:0,bounty:null,stats:statsDef(),fresh:[],battle:null,event:null};
}
const isObj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const DEFAULTED=["maps","infuse","eq","kills","seen","codex","zoneKills","stats","journal","knownR","bench","unlocked","fresh","hp","xp","zone","heat","daily","run","hints","embers","skills","infCredit","afx","unl","rp","techs","rpd","rxh","rift"];
// Shape check for loaded or imported saves, so a malformed one is rejected instead of breaking every render.
function sane(s){
  return ["maps","heat","infuse","items","inv","eq","kills","seen","codex","zoneKills","stats","unl"].every(k=>isObj(s[k]))
    &&["journal","knownR","bench","unlocked","fresh"].every(k=>Array.isArray(s[k]))
    &&Number.isFinite(s.hp)&&Number.isFinite(s.xp)&&ZONES.some(z=>z[0]===s.zone)
    &&Object.keys(s.inv).every(id=>isObj(s.items[id])&&isObj(s.items[id].traits)&&typeof s.items[id].name==="string"&&FORMS[s.items[id].form])
    &&s.bench.every(id=>isObj(s.items[id]))&&s.journal.every(j=>isObj(j)&&isObj(s.items[j.id]));
}
// v13 -> v14: a save keeps every system it already reached or used (UNLOCKS: `when` holds, or `used` finds proof), and those intros count as read. Runs last, on a sanitized save.
// Reusable: grandfather(s) opens every UNLOCKS entry the save already reached or used; grandfather(s,ids) only those ids (a later migration that adds entries passes its new ids). Map exposure is not proof (every old map held every POI type).
const isVet=s=>boss1(s)||s.wins>=10||s.journal.length>=3||!!s.daily||s.stats.dailies>0; // someone who has really played the old game, where everything was open from the start, keeps all of it
function grandfather(s,ids){
  if(!isObj(s.unl))s.unl={};let n=Math.max(0,...Object.values(s.unl)),ch=true;
  const list=UNLOCKS.filter(u=>!ids||ids.includes(u.id)),vet=isVet(s);
  while(ch){ch=false;list.forEach(u=>{if(!s.unl[u.id]&&(vet||(u.when&&u.when(s))||(u.used&&u.used(s)))){s.unl[u.id]=++n;ch=true}})}
  list.forEach(u=>{if(s.unl[u.id])s.seen["i:"+u.id]=true});
  if(s.unl.ability)Object.keys(ABILITIES).forEach(k=>s.seen["a:"+k]=true);
  return vet;
}
// v14 -> v15: the techniques an older save has evidently used (TECHS `used`: its journal and stats are the proof), prerequisites included; a veteran knows them all. A save that is not a veteran also gets the research points its past discoveries would have paid (RP sources), less what those techniques cost.
function grantTechs(s){
  const vet=isVet(s),has={bind:1};
  TECHS.forEach(t=>{if(vet||t.used(s))has[t.id]=1});
  for(let ch=true;ch;){ch=false;TECHS.forEach(t=>{if(has[t.id])t.pre.forEach(p=>{if(!has[p]){has[p]=1;ch=true}})})}
  s.techs=Object.fromEntries(TECHS.filter(t=>has[t.id]).map((t,i)=>[t.id,i+1]));s.rpd={};s.rxh={};s.rp=0;
  if(vet)return;
  const add=(k,n)=>{if(!s.rpd[k]){s.rpd[k]=1;s.rp+=n}},cs=crafts(s);
  cs.forEach(it=>add("form:"+it.form,RP.form));s.journal.slice(0,RP.recCap).forEach(j=>add("rec:"+j.id,RP.rec));s.journal.forEach(j=>{if(j.legendary)add("leg:"+j.name,RP.leg)});
  s.knownR.forEach(k=>add("rx:"+k,RP.rx));ZONES.forEach((z,i)=>{if(s.kills[z[2]]>0)add("boss:"+z[2],RP.boss[i])});Object.keys(s.afx).forEach(a=>{if(s.afx[a].s>0)add("afx:"+a,RP.afx)});
  s.rp=Math.max(0,s.rp-TECHS.reduce((n,t)=>n+(has[t.id]?t.cost:0),0));
}
// v16 -> v17: gear stopped dropping. A save keeps the blueprints of the named gear it already holds or forged with, and of every creature it has fully known; Codex drop facts for gear that no longer drops are dropped.
function grantBp(s){
  const own=new Set([...Object.keys(s.inv).filter(id=>s.inv[id]>0),...Object.values(s.eq).filter(Boolean),...Object.values(s.items).flatMap(it=>isObj(it)&&Array.isArray(it.recipeIds)?it.recipeIds:[])].map(id=>String(id).replace(/@[1-5]$/,"")));
  Object.entries(BLUEPRINTS).forEach(([b,x])=>{const E=ENEMIES[x.e],K=isObj(s.codex[x.e])?s.codex[x.e]:null;
    const full=K&&Array.isArray(K.weak)&&Array.isArray(K.resist)&&Array.isArray(K.drops)&&[...new Set([...E.weak,...(E.phase?E.phase.to.weak:[])])].every(f=>K.weak.includes(f))&&[...new Set([...E.resist,...(E.phase?E.phase.to.resist:[])])].every(f=>K.resist.includes(f))&&K.stats&&(!E.sp||K.sp);
    if(own.has(b)||full){const k=s.codex[x.e]=isObj(s.codex[x.e])?s.codex[x.e]:{weak:[],resist:[],sp:false,stats:false,drops:[]};k.bp=[...new Set([...(Array.isArray(k.bp)?k.bp:[]),b])]}});
  Object.entries(s.codex).forEach(([id,k])=>{const E=ENEMIES[id];if(E&&isObj(k)&&Array.isArray(k.drops))k.drops=k.drops.filter(d=>E.drops.some(x=>x[0]===d))});
}
function migrate(s){
  if(!isObj(s))return null;
  let up14=false,up15=false,up17=false;
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
  if(s.v===10){s.v=11; // refined essences ess_<T>_2 become Greater ones (ess_<T>@4)
    if(isObj(s.items)&&isObj(s.inv)&&isObj(s.eq)){
      const RE=/^(ess_[A-Za-z]+)_2$/,ren={};Object.keys(s.items).forEach(id=>{if(RE.test(id))ren[id]=id.replace(RE,"$1@4")});
      // a clean craft's id hashes its inputs: crafts made with a refined essence (and crafts of those...) move to the id the same recipe has now
      const orig={};Object.values(s.items).forEach(it=>{if(isObj(it)&&it.crafted&&Array.isArray(it.recipeIds))orig[it.id]=it.recipeIds.slice()});
      for(let pass=0;pass<5;pass++){let ch=false;Object.values(s.items).forEach(it=>{const o=isObj(it)&&orig[it.id];if(!o||ren[it.id]||o.length<2||!o.some(r=>ren[r]))return;
        const ok=o.slice().sort().join("+"),nk=o.map(r=>ren[r]||r).sort().join("+"),mk=[null,"Cursed","Weakened","Brittle"].find(m=>it.id==="c_"+hash(m?ok+"|"+m:ok).toString(36));
        if(mk!==undefined){ren[it.id]="c_"+hash(mk?nk+"|"+mk:nk).toString(36);ch=true}});if(!ch)break}
      // a flawed craft's clean recipe item may never have been made: re-hash that recipe key directly
      const cleanFix={};Object.values(s.items).forEach(it=>{const o=isObj(it)&&orig[it.id];if(!o||!it.clean||!o.some(r=>ren[r]))return;
        if(it.clean==="c_"+hash(o.slice().sort().join("+")).toString(36))cleanFix[it.clean]="c_"+hash(o.map(r=>ren[r]||r).sort().join("+")).toString(36)});
      const fix=id=>ren[id]||cleanFix[id]||id;
      Object.entries(ren).forEach(([o,n])=>{if(!s.items[n])s.items[n]={...s.items[o],id:n};delete s.items[o];if(s.inv[o]!==undefined){s.inv[n]=(s.inv[n]||0)+s.inv[o];delete s.inv[o]}});
      Object.keys(s.eq).forEach(k=>{s.eq[k]=s.eq[k]?fix(s.eq[k]):s.eq[k]});
      if(Array.isArray(s.bench))s.bench=s.bench.map(fix);if(Array.isArray(s.fresh))s.fresh=s.fresh.map(fix);
      if(Array.isArray(s.journal))s.journal.forEach(j=>{if(isObj(j))j.id=fix(j.id)});
      const nm=a=>Array.isArray(a)?a.map(x=>typeof x==="string"?x.replace(/^Refined (\w+ Essence)$/,"Greater $1"):x):a;
      Object.values(s.items).forEach(it=>{if(!isObj(it))return;if(it.clean)it.clean=fix(it.clean);if(Array.isArray(it.recipeIds))it.recipeIds=it.recipeIds.map(fix);if(it.recipe)it.recipe=nm(it.recipe)});
      if(isObj(s.last)){if(s.last.id)s.last.id=fix(s.last.id);if(s.last.baseId)s.last.baseId=fix(s.last.baseId);s.last.recipe=nm(s.last.recipe);if(isObj(s.last.item)){s.last.item.id=fix(s.last.item.id);if(Array.isArray(s.last.item.recipeIds))s.last.item.recipeIds=s.last.item.recipeIds.map(fix);s.last.item.recipe=nm(s.last.item.recipe)}}}}
  if(s.v===11){s.v=12; // node maps become tile grids: old maps can't convert, so they are dropped (new ones generate on demand)
    s.maps={};s.battle=null;s.event=null;migNote=true;
    const d=s.daily;if(isObj(d)&&d.state==="run"){ // a daily in progress keeps no replay: it ends with what it had reached
      const r=isObj(d.map)&&Array.isArray(d.map.rows)&&isObj(d.map.pos)?Math.max(0,Math.min(MAP_ROWS-1,(d.map.pos.r|0)+1)):0;
      d.state="done";d.result={rows:r,boss:false,turns:d.turns|0};s.run=null;if(ZONES.some(z=>z[0]===d.back))s.zone=d.back;if(isObj(s.stats)){s.stats.dailies=(s.stats.dailies|0)+1;if(!isObj(s.stats.dBest))s.stats.dBest={...d.result}}}
    if(isObj(d))d.map=null}
  if(s.v===12){s.v=13; // map enemies' up/af become a rarity plus an affix list (an old elite is a magic enemy with its one elemental affix); a battle in progress does the same
    const conv=m=>{if(isObj(m)&&Array.isArray(m.pois))m.pois.forEach(p=>{if(!isObj(p)||(p.up===undefined&&p.af===undefined))return;
      if(p.t==="elite"||p.up){p.rar="magic";p.afx=[AFX_EL[p.af|0]||AFX_EL[0]]}else{p.rar="normal";p.afx=[]}delete p.up;delete p.af})};
    Object.values(isObj(s.maps)?s.maps:{}).forEach(conv);if(isObj(s.daily))conv(s.daily.map);
    const b=s.battle;if(isObj(b)&&b.afx===undefined){const a=b.elite&&AFX_EL.find(x=>AFX[x].tr===b.elite);b.rar=a?"magic":"normal";b.afx=a?[a]:[];delete b.elite;if(a){if(!isObj(s.afx))s.afx={};s.afx[a]=s.afx[a]||{s:1,b:0}}}} // an open elite battle counts as met
  if(s.v===13){s.v=14;up14=true} // grandfather() fills s.unl once the save is sanitized
  if(s.v===14){s.v=15;up15=true;if(Number.isInteger(s.quest)){if(up14&&s.quest>=7)s.quest=TUTORIAL.length;else if(s.quest>=3)s.quest++}} // v14 -> v15: a goal step ("Learn a technique") now sits at 3, so quests from 3 move up one; a v13 save past its 7 steps was at the end of that chain
  if(s.v===15){s.v=16;s.rift={depth:1,best:0,seed:0,biome:"",name:"",pal:null,cleared:0}} // v15 -> v16: the Rift (a random region past the Spire) and the wild creatures of every region
  if(s.v===16){s.v=17;up17=true} // v16 -> v17: gear no longer drops (patterns and blueprints), see grantBp
  if(s.v!==17||!isObj(s.items)||!isObj(s.inv))return null;
  const dflt=freshState();DEFAULTED.forEach(k=>{if(s[k]===undefined)s[k]=dflt[k]});if(!isObj(s.afx))s.afx={};
  Object.keys(BASE).forEach(id=>s.items[id]=baseItem(id));
  if(!sane(s))return null;
  ZONES.forEach((z,i)=>{if(i&&(s.kills[ZONES[i-1][2]]||0)>0&&!s.unlocked.includes(z[0]))s.unlocked.push(z[0])}); // zones added later open for saves that already beat the boss before them
  Object.keys(s.items).forEach(id=>{const b=baseIdOf(id),g=gradeOf(id);if(gradable(b)&&gradedId(b,g)===id)s.items[id]=mkGraded(b,g)}); // essences and graded materials are rebuilt from their fixed values
  s.embers=Math.max(0,Math.floor(Number(s.embers))||0);s.infCredit=Math.max(0,Math.floor(Number(s.infCredit))||0);
  // Additive timing ranks need no save bump; old known specials imply rank I at read time.
  Object.values(s.codex).forEach(k=>{if(isObj(k)&&k.timing!==undefined){const t=isObj(k.timing)?k.timing:{};k.timing=Object.fromEntries(["sp","sp2"].map(key=>[key,Number.isFinite(t[key])?Math.max(0,Math.min(PARRY_T.levels,Math.floor(t[key]))):0]))}});
  s.skills=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,isObj(s.skills)?Math.max(0,Math.floor(Number(s.skills[k]))||0):0]));
  if(!isObj(s.rift))s.rift={depth:1,best:0,seed:0,biome:"",name:"",pal:null,cleared:0}; // the Rift: depth, best depth, and the seed of the region (the seed rebuilds its creatures)
  s.rift.depth=Math.max(1,Math.floor(Number(s.rift.depth)||1));s.rift.best=Math.max(0,Math.floor(Number(s.rift.best)||0));s.rift.seed=Math.floor(Number(s.rift.seed)||0);s.rift.cleared=s.rift.cleared?1:0;
  if(!isObj(s.rift.pal))s.rift.pal=null;
  const st0=s.stats,sd=statsDef(),had=k=>st0[k]!==undefined;
  const dv={forged:s.journal.length,legend:s.journal.filter(j=>j.legendary).length,bosses:ZONES.reduce((n,z)=>n+(s.kills[z[2]]|0),0),
    heatBest:Object.fromEntries(ZONES.filter(z=>s.kills[z[2]]>0).map(z=>[z[0],Math.max(0,((s.heat[z[0]]||{}).max|0)-1)])),dailies:s.daily&&s.daily.result?1:0,dailyWins:s.daily&&s.daily.result&&s.daily.result.boss?1:0,exped:Math.max(0,ZONES.reduce((n,z)=>n+(s.kills[z[2]]|0),0)-(s.daily&&s.daily.result&&s.daily.result.boss?1:0)),dBest:s.daily&&s.daily.result?{...s.daily.result,boss:!!s.daily.result.boss}:null}; // old saves keep what can be derived; the rest start at 0. Derived heatBest is a lower bound at the Heat cap
  Object.keys(sd).forEach(k=>{const v=st0[k],d=sd[k];const ok=typeof d==="number"?Number.isFinite(v)&&v>=0:typeof d==="string"?typeof v==="string":k==="dBest"?v===null||(isObj(v)&&Number.isFinite(v.rows)&&Number.isFinite(v.turns)):isObj(v);
    st0[k]=had(k)&&ok?v:k in dv?dv[k]:d});
  ["heatBest","fast"].forEach(k=>Object.keys(st0[k]).forEach(x=>{if(!Number.isFinite(st0[k][x]))delete st0[k][x]}));
  Object.values(s.items).forEach(it=>{const sc=it.legendary&&SECRETS.find(x=>x.name===it.name&&x.bonus);if(sc&&!(it.traits[sc.bonus.trait]>0))it.traits[sc.bonus.trait]=sc.bonus.v}); // a legendary that lost its bonus to the trait-slot trim gets it back
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
  {const tk=isObj(s.techs)?s.techs:{};s.techs=Object.fromEntries(TECHS.filter(t=>t.id==="bind"||Number.isFinite(tk[t.id])).map(t=>[t.id,Number.isFinite(tk[t.id])?tk[t.id]:1]))}
  s.rxh=Object.fromEntries(Object.entries(isObj(s.rxh)?s.rxh:{}).filter(([k,v])=>REACTIONS.some(r=>r[0]+"+"+r[1]===k)&&Array.isArray(v)).map(([k,v])=>[k,v.filter(t=>k.split("+").includes(t))]));
  if(up15)grantTechs(s);
  if(up17)grantBp(s);
  if(up14){ // v13 -> v14
    s.unl={};if(!grandfather(s))Object.keys(s.maps).forEach(z=>{if(!s.maps[z].steps)delete s.maps[z]}); // an untouched map made before the gates is redrawn under them
  }else if(up15||up17){ // v14 -> v15, v16 -> v17: the new systems open for what the save has reached or used (a veteran: all); grade upgrades now wait for Refining
    const ids=[...up15?["research",...TECHS.filter(t=>t.i).map(t=>"t:"+t.id)]:[],"patterns","blueprints"];
    if(!grandfather(s,ids))ids.forEach(id=>{if(!UNL[id].used(s))delete s.seen["i:"+id]}); // a veteran has read them all; otherwise only what the save used (a new system it merely qualifies for still gets its card)
    if(!s.techs.refine&&s.unl.upgrade){delete s.unl.upgrade;delete s.seen["i:upgrade"];s.seen["m:upg"]=true} // m:upg: the Research card says why
  }
  s.locked=Array.isArray(s.locked)?[...new Set(s.locked.filter(id=>s.items[id]))]:[];
  s.recent=Array.isArray(s.recent)?[...new Set(s.recent.filter(id=>s.items[id]))]:[];
  const ip=isObj(s.inventory)?s.inventory:{};
  s.inventory={layout:ip.layout==="list"?"list":"grid",filter:["all","new","equipped","craftable"].includes(ip.filter)?ip.filter:"all",sort:["type","recent","grade"].includes(ip.sort)?ip.sort:"type"};
  return s;
}
let migNote=false,S=null; // migNote: a migration redrew the maps (shown once as a toast after load)
try{S=JSON.parse(localStorage.getItem(KEY)||"null");if(!S)for(const k of OLD_KEYS){S=JSON.parse(localStorage.getItem(k)||"null");if(S)break}}catch(e){S=null}
const hotS=window.claude?.hot?.data?.S;if(hotS)S=hotS;
try{S=migrate(S)}catch(e){S=null}
S=S||freshState();
window.claude?.hot?.snapshot?.(()=>({S}));
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

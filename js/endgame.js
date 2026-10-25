// ================= DAILY EXPEDITION =================
// One seeded run per UTC day: same map, POIs and enemy picks for everyone. S.daily={date,seed,zone,heat,twist,map,state:"run"|"done",turns,back,result}; S.run==="daily" while it is being played (curMap() then returns S.daily.map).
const today=()=>new Date().toISOString().slice(0,10),dailyReady=()=>isUnl("daily");
function dailyPlan(date){ // zone, heat (1-3) and twist all come from the date; a zone you haven't opened falls back to the highest one you have
  const DZ=ZONES.filter(z=>z[0]!==RIFT_ZONE),seed=hash(date),R=rng(seed),want=DZ[Math.floor(R()*DZ.length)][0],heat=1+Math.floor(R()*3),tw=Object.keys(DAILY_TWISTS),twist=tw[Math.floor(R()*tw.length)];
  const open=DZ.filter(z=>S.unlocked.includes(z[0]));
  return{date,seed,want,zone:S.unlocked.includes(want)?want:(open.pop()||DZ[0])[0],heat,twist};
}
// "run" (any day's, until it ends), "done" (today's attempt is used up) or "ready"
const dailyState=()=>S.daily&&S.daily.state==="run"?"run":S.daily&&S.daily.date===today()?"done":"ready";
function startDaily(){
  if(busy()||S.run||!dailyReady()||dailyState()!=="ready")return;
  const p=dailyPlan(today());
  S.daily={...p,map:genMap({seed:p.seed,heat:p.heat,zone:p.zone,twist:p.twist}),state:"run",turns:0,back:S.zone,result:null};
  S.run="daily";S.zone=p.zone;S.battle=null;S.event=null;
  toast(tx("Daily expedition: {name}.",{name:DAILY_TWISTS[p.twist].name}));save();render();
}
function finishDaily(rows,boss){
  const d=S.daily,st=S.stats,r={rows,boss:!!boss,turns:d.turns},b=st.dBest;d.state="done";d.result={rows,boss,turns:d.turns};S.run=null;S.zone=d.back;
  st.dailies++;if(boss)st.dailyWins++;
  if(!b||(r.boss&&!b.boss)||(r.boss===!!b.boss&&(r.boss?r.turns<b.turns:r.rows>b.rows||(r.rows===b.rows&&r.turns<b.turns))))st.dBest=r; // best daily: a boss kill beats any fall, then fewer turns / more rows
}
let dArmed=false;
function abandonDaily(){
  if(S.run!=="daily"||busy())return;
  if(!dArmed){dArmed=true;render();setTimeout(()=>{dArmed=false;render()},3000);return}
  dArmed=false;const m=S.daily.map;finishDaily(m.steps?m.dp:0,false);toast(tx("You abandon the expedition. Tomorrow brings another."));save();render();
}
// a rare find (the daily boss, the grateful traveller): one of the region's raws with an affix, a grade better than usual. x, y, g are 0-1 rolls (the creature, the affix, the grade) so seeded runs agree
const zoneRare=z=>Object.keys(ENEMIES).filter(e=>ENEMIES[e].zone===z&&!ENEMIES[e].boss&&afxRawOf(ENEMIES[e]));
function rareFind(z,heat,x,y,g){const r=zoneRare(z);if(!r.length)return null;const ax=Object.keys(AFX);return gradedItem(afxRawOf(ENEMIES[at(r,x)])+"~"+at(ax,y),rollGrade(z,heat,g,1))}
function dailyBundle(got){ // boss kill: essences + one rare drop (same for everyone) + smith XP
  const d=S.daily,R=rng(d.seed^0x5bd1e995);
  const gh=d.heat+GRADE_BOSS; // grades come from the seeded stream too, so the reward is the same for everyone
  for(let i=0;i<DAILY_REWARD.ess;i++){const t=ESS_POOL[Math.floor(R()*ESS_POOL.length)];got.push(gess(t,d.zone,gh,R()))}
  {const f=rareFind(d.zone,gh,R(),R(),R());if(f)got.push(f)}
  const hm=giveHint(R());S.xp+=DAILY_REWARD.xp;blog(hm?tx("Daily reward: {n} essences, a rare find, a hint scroll and {xp} smith XP.",{n:DAILY_REWARD.ess,xp:DAILY_REWARD.xp}):tx("Daily reward: {n} essences, a rare find and {xp} smith XP.",{n:DAILY_REWARD.ess,xp:DAILY_REWARD.xp}),"big");if(hm)blog(hm,"good");
}
const dailyResult=r=>`${r.boss?tx("Boss beaten"):tx("Fell at depth {n} of {m}",{n:r.rows,m:MAP_ROWS-1})} · ${tx("{n} turns",{n:r.turns})}`;

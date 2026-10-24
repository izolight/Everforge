// ================= DAILY EXPEDITION =================
// One seeded run per UTC day: same map, node types and enemy picks for everyone. S.daily={date,seed,zone,heat,twist,map,state:"run"|"done",turns,back,result}; S.run==="daily" while it is being played (curMap() then returns S.daily.map).
const today=()=>new Date().toISOString().slice(0,10),dailyReady=()=>(S.kills[ZONES[0][2]]||0)>0;
function dailyPlan(date){ // zone, heat (1-3) and twist all come from the date; a zone you haven't opened falls back to the highest one you have
  const seed=hash(date),R=rng(seed),want=ZONES[Math.floor(R()*ZONES.length)][0],heat=1+Math.floor(R()*3),tw=Object.keys(DAILY_TWISTS),twist=tw[Math.floor(R()*tw.length)];
  const open=ZONES.filter(z=>S.unlocked.includes(z[0]));
  return{date,seed,want,zone:S.unlocked.includes(want)?want:(open.pop()||ZONES[0])[0],heat,twist};
}
// "run" (any day's, until it ends), "done" (today's attempt is used up) or "ready"
const dailyState=()=>S.daily&&S.daily.state==="run"?"run":S.daily&&S.daily.date===today()?"done":"ready";
function startDaily(){
  if(busy()||S.run||!dailyReady()||dailyState()!=="ready")return;
  const p=dailyPlan(today());
  S.daily={...p,map:genMap({seed:p.seed,heat:p.heat,zone:p.zone,twist:p.twist}),state:"run",turns:0,back:S.zone,result:null};
  S.run="daily";S.zone=p.zone;S.battle=null;S.event=null;
  toast(`Daily expedition: ${DAILY_TWISTS[p.twist].name}.`);save();render();
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
  dArmed=false;const m=S.daily.map;finishDaily(m.steps?m.dp+1:0,false);toast("You abandon the expedition. Tomorrow brings another.");save();render();
}
const zoneRare=z=>[...new Set(Object.values(ENEMIES).filter(e=>e.zone===z&&!e.boss).flatMap(e=>e.drops.filter(d=>d[1]<=.2).map(d=>d[0])))];
function dailyBundle(got){ // boss kill: essences + one rare drop (same for everyone) + smith XP
  const d=S.daily,R=rng(d.seed^0x5bd1e995),rare=zoneRare(d.zone);
  const gh=d.heat+GRADE_BOSS; // grades come from the seeded stream too, so the reward is the same for everyone
  for(let i=0;i<DAILY_REWARD.ess;i++){const t=ESS_POOL[Math.floor(R()*ESS_POOL.length)];got.push(gess(t,d.zone,gh,R()))}
  if(rare.length){const r=rare[Math.floor(R()*rare.length)];got.push(gdrop(r,d.zone,gh,R()))}
  const hm=giveHint(R());S.xp+=DAILY_REWARD.xp;blog(`Daily reward: ${DAILY_REWARD.ess} essences, a rare find${hm?", a hint scroll":""} and ${DAILY_REWARD.xp} smith XP.`,"big");if(hm)blog(hm,"good");
}
const dailyResult=r=>`${r.boss?"Boss beaten":`Fell at depth ${r.rows} of ${MAP_ROWS-1}`} · ${r.turns} turns`;

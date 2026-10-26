// ================= DAILY EXPEDITION =================
// One seeded run per UTC day: same map, POIs and enemy picks for everyone. S.daily={date,seed,zone,heat,twist,map,state:"run"|"done",turns,back,result}; S.run==="daily" while it is being played (curMap() then returns S.daily.map).
const today=()=>new Date().toISOString().slice(0,10),dailyReady=()=>isUnl("daily");
function dailyPlan(date){ // zone, heat (1-3) and twist all come from the date; a zone you haven't opened falls back to the highest one you have
  const DZ=ZONES.filter(z=>z[0]!==RIFT_ZONE),seed=hash(date),R=rng(seed),want=DZ[Math.floor(R()*DZ.length)][0],heat=1+Math.floor(R()*3),tw=Object.keys(DAILY_TWISTS),twist=tw[Math.floor(R()*tw.length)];
  const open=DZ.filter(z=>S.unlocked.includes(z[0]));
  return{date,seed,want,zone:S.unlocked.includes(want)?want:(open.pop()||DZ[0])[0],heat,twist};
}
// "run" (any day's, until it ends), "done" (today's attempt is used up) or "ready"
// today's attempt is also logged outside the save, so importing an older save code cannot hand it back (see keepDaily)
const DAILY_KEY="everforge-daily",dailyLog=()=>{try{return JSON.parse(localStorage.getItem(DAILY_KEY)||"null")}catch(e){return null}};
const logDaily=(d,done)=>{try{const{map,...rec}=d;localStorage.setItem(DAILY_KEY,JSON.stringify({date:d.date,done,rec}))}catch(e){}};
// an imported save gets today's attempt as used when this browser already played it (an attempt left running counts as abandoned)
function keepDaily(s){
  const u=dailyLog();if(!u||u.date!==today()||!u.rec)return s;
  const d=s.daily;if(d&&d.date===u.date&&(d.state==="done"||!u.done))return s; // the code already knows today's attempt
  if(d&&d.state==="run"&&d.date!==u.date)return s; // an older day's run still in progress: leave it to finish
  if(s.run==="daily"){s.run=null;s.zone=d&&d.back||s.zone}
  s.daily={...u.rec,state:"done",result:u.done&&u.rec.result||{rows:0,boss:false,turns:0}};return s;
}
const dailyState=()=>S.daily&&S.daily.state==="run"?"run":S.daily&&S.daily.date===today()?"done":"ready";
function startDaily(){
  if(busy()||S.run||!dailyReady()||dailyState()!=="ready")return;
  const p=dailyPlan(today());
  S.daily={...p,map:genMap({seed:p.seed,heat:p.heat,zone:p.zone,twist:p.twist}),state:"run",turns:0,back:S.zone,result:null};
  S.run="daily";S.zone=p.zone;S.battle=null;S.event=null;logDaily(S.daily,0);
  toast(tx("Daily expedition: {name}.",{name:DAILY_TWISTS[p.twist].name}));save();render();
}
function finishDaily(rows,boss){
  const d=S.daily,st=S.stats,r={rows,boss:!!boss,turns:d.turns},b=st.dBest;d.state="done";d.result={rows,boss,turns:d.turns};S.run=null;S.zone=d.back;
  st.dailies++;if(boss)st.dailyWins++;logDaily(d,1);
  if(!b||(r.boss&&!b.boss)||(r.boss===!!b.boss&&(r.boss?r.turns<b.turns:r.rows>b.rows||(r.rows===b.rows&&r.turns<b.turns))))st.dBest=r; // best daily: a boss kill beats any fall, then fewer turns / more rows
}
function abandonDaily(){
  if(S.run!=="daily"||busy())return;
  if(!armTap("daily",3000,()=>render()))return render(); // the first tap only arms it
  const m=S.daily.map;finishDaily(m.steps?m.dp:0,false);toast(tx("You abandon the expedition. Tomorrow brings another."));save();render();
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

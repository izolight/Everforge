// ================= GOALS =================
function rewardIds(r){return (r.items||[]).map(x=>x.startsWith("ess:")?essence(x.slice(4)):x)}
function rewardText(r){const p=rewardIds(r).map(id=>S.items[id].name);if(r.xp)p.push(`${r.xp} smith XP`);if(r.camp)p.push("a campfire charge");return p.join(", ")}
function newBounty(){
  if(Math.random()<.3)return{kind:"forge",need:2,base:S.journal.length,reward:{items:[`ess:${pick(ESS_POOL)}`,`ess:${pick(ESS_POOL)}`],xp:20}};
  const pool=Object.entries(ENEMIES).filter(([,e])=>!e.boss&&e.zone!=="any"&&S.unlocked.includes(e.zone));
  const [id]=pick(pool),need=2+Math.floor(Math.random()*3);
  return{kind:"hunt",enemy:id,need,base:S.kills[id]||0,reward:{items:[`ess:${pick(ESS_POOL)}`,`ess:${pick(ESS_POOL)}`],xp:15,camp:Math.random()<.35?1:0}};
}
function goal(){
  if(S.quest<TUTORIAL.length){const q=TUTORIAL[S.quest];
    let prog="";if(S.quest===5&&!S.kills.gnarlhorn){const m=S.maps.woods;prog=`map row ${m&&m.pos?m.pos.r+1:0}/${MAP_ROWS}`}
    return{step:`Step ${S.quest+1} of ${TUTORIAL.length}`,text:q.text,tab:q.tab,done:q.done(S),reward:q.reward,prog}}
  if(!S.bounty){S.bounty=newBounty();save()}
  const b=S.bounty;
  if(b.kind==="hunt"){const n=Math.min(b.need,(S.kills[b.enemy]||0)-b.base),E=ENEMIES[b.enemy];
    return{step:"Bounty",text:`Defeat ${b.need} ${b.need>1?E.plural:E.name} in ${zoneName(E.zone)}.`,tab:"battle",done:n>=b.need,reward:b.reward,prog:`${n}/${b.need}`,zone:E.zone}}
  const n=Math.min(b.need,S.journal.length-b.base);
  return{step:"Bounty",text:`Forge ${b.need} new recipes.`,tab:"forge",done:n>=b.need,reward:b.reward,prog:`${n}/${b.need}`};
}
function claimGoal(){
  const g=goal();if(!g.done)return;
  rewardIds(g.reward).forEach(id=>addItem(id));if(g.reward.xp)S.xp+=g.reward.xp;if(g.reward.camp)S.camp=Math.min(3,S.camp+g.reward.camp);
  if(S.quest<TUTORIAL.length)S.quest++;else S.bounty=null;
  save();render();toast(`Reward: ${rewardText(g.reward)}.`);
}

// ================= GOALS =================
// Hint scrolls: S.hints holds secret indexes; level = how many times one appears (1 = the rumor, +1 per extra scroll = one more ingredient, up to all but one).
const found=s=>S.journal.some(j=>S.items[j.id]?.legendary&&S.items[j.id].name===s.name),hintLv=i=>Math.min(SECRETS[i].ids.length,S.hints.filter(x=>x===i).length);
const idName=id=>S.items[id]?.name||(isEss(id)?`${essTrait(id)} Essence`:BASE[id][0]);
function giveHint(x){ // reveals something about a secret you haven't forged; x (0-1) picks among the candidates. Returns a log line, or "" if there is nothing left to learn
  const open=SECRETS.map((s,i)=>i).filter(i=>!found(SECRETS[i])&&hintLv(i)<SECRETS[i].ids.length),fresh=open.filter(i=>!hintLv(i)),c=fresh.length?fresh:open;
  if(!c.length)return"";const i=c[Math.floor((x==null?Math.random():x)*c.length)];S.hints.push(i);const s=SECRETS[i],lv=hintLv(i);
  return lv===1?`A hint scroll: "${s.hint}"`:`A hint scroll sharpens a rumor ("${s.hint.split(/[.,]/)[0]}"): one ingredient is ${idName(s.ids[lv-2])}.`;
}
function rewardIds(r){return (r.items||[]).map(x=>{if(!x.startsWith("ess:"))return x;const [t,g]=x.slice(4).split("@");return essG(t,+g||3)})} // "ess:Fire" is Plain, "ess:Fire@4" Greater
function rewardText(r){const p=rewardIds(r).map(id=>S.items[id].name);if(r.xp)p.push(`${r.xp} smith XP`);if(r.camp)p.push("a campfire charge");return p.join(", ")}
function newBounty(){
  const rew=z=>`ess:${pick(ESS_POOL)}@${rollGrade(z)}`,top=S.unlocked[S.unlocked.length-1]; // reward essences roll a grade for the zone the bounty is in
  if(Math.random()<.3)return{kind:"forge",need:2,base:S.journal.length,reward:{items:[rew(top),rew(top)],xp:20,hint:Math.random()<.3?1:0}};
  const pool=Object.entries(ENEMIES).filter(([,e])=>!e.boss&&e.zone!=="any"&&S.unlocked.includes(e.zone));
  const [id]=pick(pool),need=2+Math.floor(Math.random()*3);
  return{kind:"hunt",enemy:id,need,base:S.kills[id]||0,reward:{items:[rew(ENEMIES[id].zone),rew(ENEMIES[id].zone)],xp:15,camp:Math.random()<.35?1:0,hint:Math.random()<.3?1:0}};
}
function goal(){
  if(S.quest<TUTORIAL.length){const q=TUTORIAL[S.quest];
    let prog="";if(S.quest===5&&!S.kills.gnarlhorn){const m=S.maps.woods;prog=`map depth ${m&&m.steps?m.dp+1:0}/${MAP_ROWS}`}
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
  const hm=g.reward.hint?giveHint():"";
  if(S.quest<TUTORIAL.length)S.quest++;else S.bounty=null;
  save();render();toast(`Reward: ${[rewardText(g.reward),hm?"a hint scroll":""].filter(Boolean).join(", ")}.${hm?" "+hm:""}`);
}

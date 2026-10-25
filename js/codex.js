// ================= CODEX =================
function cx(id){return S.codex[id]||(S.codex[id]={weak:[],resist:[],sp:false,stats:false,drops:[]})}
// every weak/resist family a creature can show, across its forms
const allFacts=(E,k)=>[...new Set([...E[k],...(E.phase?E.phase.to[k]:[])])];
function know(id){const E=ENEMIES[id],K=S.codex[id]||{weak:[],resist:[],drops:[]};
  const tot=allFacts(E,"weak").length+allFacts(E,"resist").length+2+E.drops.length,have=K.weak.length+K.resist.length+(K.sp?1:0)+(K.stats?1:0)+K.drops.length;
  return{have,tot,pct:have/tot,mastered:have>=tot}}
function learn(id,type,val){
  const K=cx(id),was=know(id).mastered;let fresh=false,text="";const nm=shortName(id);
  if(type==="inf"){K.inf=K.inf||[];if(!K.inf.includes(val)){K.inf.push(val);fresh=true}}
  else if(type==="weak"||type==="resist"||type==="drops"){if(!K[type].includes(val)){K[type].push(val);fresh=true}}
  else if(!K[type]){K[type]=true;fresh=true}
  if(!fresh)return false;
  if(type==="weak")text=`Codex: ${nm} is weak to ${val}.`;
  else if(type==="resist")text=`Codex: ${nm} resists ${val}.`;
  else if(type==="sp")text=`Codex: you learned ${nm}'s special move, ${(S.battle&&S.battle.id===id?foeOf(S.battle):ENEMIES[id]).sp.name}.`;
  else if(type==="inf")text=`Codex: ${nm} can inflict ${STATUS[val].n.toLowerCase()}.`;
  else if(type==="sp2")text=`Codex: you learned ${nm}'s second-form special, ${foeOf(S.battle).sp.name}.`;
  else if(type==="ph")text=`Codex: ${nm} changes form below half health.`;
  else if(type==="stats")text=`Codex: ${nm}'s strength is now recorded.`;
  else text=`Codex: ${nm} can drop ${S.items[val].name}.`;
  if(S.battle&&S.battle.id===id)blog(text,"lore");
  if(!was&&know(id).mastered){setTimeout(()=>toast(`${nm} mastered! You deal 15% more damage to it.`),50);rpGain("mast:"+id,RP.mast,`${nm} mastered`)}
  return true;
}
function unknownFacts(id){const E=S.battle&&S.battle.id===id?foeOf(S.battle):ENEMIES[id],K=cx(id),out=[];
  E.weak.filter(f=>!K.weak.includes(f)).forEach(f=>out.push(["weak",f]));E.resist.filter(f=>!K.resist.includes(f)).forEach(f=>out.push(["resist",f]));
  if(!K.sp)out.push(["sp",1]);if(!K.stats)out.push(["stats",1]);return out}

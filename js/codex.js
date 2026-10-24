// ================= CODEX =================
function cx(id){return S.codex[id]||(S.codex[id]={weak:[],resist:[],sp:false,stats:false,drops:[]})}
function know(id){const E=ENEMIES[id],K=S.codex[id]||{weak:[],resist:[],drops:[]};
  const tot=E.weak.length+E.resist.length+2+E.drops.length,have=K.weak.length+K.resist.length+(K.sp?1:0)+(K.stats?1:0)+K.drops.length;
  return{have,tot,pct:have/tot,mastered:have>=tot}}
function learn(id,type,val){
  const K=cx(id),was=know(id).mastered;let fresh=false,text="";const nm=shortName(id);
  if(type==="weak"||type==="resist"||type==="drops"){if(!K[type].includes(val)){K[type].push(val);fresh=true}}
  else if(!K[type]){K[type]=true;fresh=true}
  if(!fresh)return false;
  if(type==="weak")text=`Codex: ${nm} is weak to ${val}.`;
  else if(type==="resist")text=`Codex: ${nm} resists ${val}.`;
  else if(type==="sp")text=`Codex: you learned ${nm}'s special move, ${ENEMIES[id].sp.name}.`;
  else if(type==="stats")text=`Codex: ${nm}'s strength is now recorded.`;
  else text=`Codex: ${nm} can drop ${S.items[val].name}.`;
  if(S.battle&&S.battle.id===id)blog(text,"lore");
  if(!was&&know(id).mastered)setTimeout(()=>toast(`${nm} mastered! You deal 15% more damage to it.`),50);
  return true;
}
function unknownFacts(id){const E=ENEMIES[id],K=cx(id),out=[];
  E.weak.filter(f=>!K.weak.includes(f)).forEach(f=>out.push(["weak",f]));E.resist.filter(f=>!K.resist.includes(f)).forEach(f=>out.push(["resist",f]));
  if(!K.sp)out.push(["sp",1]);if(!K.stats)out.push(["stats",1]);return out}

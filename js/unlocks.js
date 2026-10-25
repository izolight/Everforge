// ================= UNLOCKS =================
// Progressive unlocks and one-time introductions (the UNLOCKS table is in data.js). S.unl[id] = order the system opened in; S.seen["i:"+id] = its intro was read; S.seen["a:"+form] = that weapon's ability was introduced.
// checkUnl() runs at the start of every render() and when a map is made, so a condition over S opens a system as soon as it holds; unlock(id) is for hooks (parry, hunt).
const isUnl=id=>!!S.unl[id];
function unlock(id,quiet){
  const u=UNL[id];if(!u||S.unl[id])return false;
  S.unl[id]=Math.max(0,...Object.values(S.unl))+1;
  if(!u.q&&!quiet){sfx("unlock");setTimeout(()=>toast(`Unlocked: ${u.name}.${u.w?" "+u.w:""}`,1),0)} // after whatever toast the same action raises
  return true;
}
function checkUnl(quiet){let any=false,ch=true;while(ch){ch=false;UNLOCKS.forEach(u=>{if(!S.unl[u.id]&&u.when&&u.when(S)&&unlock(u.id,quiet))ch=any=true})}return any}
// ---- intros: the unlocked, unread ones in the order they opened, then a card for each weapon ability that has not been introduced. Shown one at a time.
const introKey=id=>id.startsWith("a:")?id:"i:"+id;
function pendingIntros(){
  const l=UNLOCKS.filter(u=>u.i&&S.unl[u.id]&&!S.seen["i:"+u.id]).sort((a,b)=>S.unl[a.id]-S.unl[b.id]).map(u=>({id:u.id,ic:u.ic,tab:"battle",...u.i}));
  const ab=l.find(c=>c.id==="ability");
  if(ab){const k=abKeys(pstats()),W=pstats().main;if(k.length)ab.l=[`${k[0]==="shield"||!W?"Your shield":`Your ${W.name}`} gives you ${ABILITIES[k[0]].name}.`,...ab.l]}
  if(S.unl.ability&&S.seen["i:ability"])abKeys(pstats()).filter(k=>!S.seen["a:"+k]).forEach(k=>l.push({id:"a:"+k,ic:ABILITIES[k].icon,t:ABILITIES[k].name,l:[ABILITIES[k].desc],ctx:"battle",sel:`[data-ability="${k}"]`}));
  return l;
}
// the one intro on show: in a fight only battle ones (above the action grid), otherwise those for the tab you are on
const curIntro=inFight=>pendingIntros().find(c=>inFight?c.ctx==="battle":c.ctx!=="battle"&&c.tab===S.view)||null;
const abOn=k=>S.unl.ability&&!!S.seen["a:"+k]; // a weapon's ability button only shows once its form has been introduced
function dismissIntro(id){
  S.seen[introKey(id)]=true;
  if(id==="ability")abKeys(pstats()).forEach(k=>S.seen["a:"+k]=true); // the first card covers what you carry now
  save();render();
}
// pulse what an intro points at, briefly (reduced motion: a still outline for the same time)
function nudge(sel){if(!sel)return;document.querySelectorAll(sel).forEach(e=>e.classList.add("nudge"));setTimeout(()=>document.querySelectorAll(".nudge").forEach(e=>e.classList.remove("nudge")),2600)}
// a locked system drawn as a small teaser: lock icon, name, how to open it (the same words are in its tip)
const lockRow=id=>{const u=UNL[id];return `<div class="lockrow" ${tt(`${u.name} (locked)`,u.txt)}>${ic("lock","s")}<b>${u.name}</b><small>${u.txt}</small></div>`};

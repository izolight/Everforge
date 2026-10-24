// ================= EVENTS =================
let toastT;function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),3000)}
function go(view){
  if(view==="gear"||view==="forge"){freshShown=new Set([...freshShown,...S.fresh]);S.fresh=[]}else freshShown=new Set();
  S.view=view;save();render();window.scrollTo({top:0});
}
$("nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)go(b.dataset.view)});
$("goal").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="claim")claimGoal();else if(b.id==="goGoal"){const g=goal();if(g.zone&&g.zone!==S.zone&&S.run==="daily")return toast("Finish or abandon the daily first.");if(g.zone&&zoneOpen(g.zone)&&!busy()){S.zone=g.zone;if(S.battle?.over)S.battle=null}go(g.tab)}});
$("zones").addEventListener("scroll",zoneFade);
$("zones").addEventListener("click",e=>{const b=e.target.closest("[data-zone]");if(!b||b.disabled)return;S.zone=b.dataset.zone;S.battle=null;S.event=null;save();render()});
$("arena").addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.codex)return openCodex(t.dataset.codex);
  if(t.dataset.item)return openSheet(t.dataset.item,false,!S.inv[t.dataset.item]);
  if(t.dataset.choice)return eventChoice(t.dataset.choice);
  if(t.dataset.use)return useItem(t.dataset.use);
  if(t.dataset.ability)return ability(t.dataset.ability);
  if(t.dataset.heat)return setHeat(+t.dataset.heat);
  if(t.dataset.node){const [r,i]=t.dataset.node.split(",").map(Number);return visit(r,i)}
  if(t.dataset.zone){S.zone=t.dataset.zone;S.battle=null;S.event=null;save();render();return window.scrollTo({top:0})}
  ({rest,atk:attack,guard,parry,study,flee,again:newExpedition,dailyStart:startDaily,dailyAbandon:abandonDaily,toforge:()=>go("forge"),
    cont:()=>{S.battle=null;S.event=null;logOpen=false;save();render()}})[t.id]?.();
});
$("arena").addEventListener("toggle",e=>{if(e.target.id==="heatd")heatOpen=e.target.open;
  if(e.target.id==="logd"){logOpen=e.target.open;const m=e.target.querySelector(".more");if(m)m.textContent=`${logOpen?"Hide":"Show"} full log`;const bl=$("blog");if(bl)bl.scrollTop=bl.scrollHeight}},true);
$("gear").addEventListener("click",e=>{const b=e.target.closest("[data-gear]");if(!b)return;const s=b.dataset.gear,it=gearOf(s);
  if(it)return openSheet(it.id);
  S.tab=s==="main"?"weapon":s==="charm"?"charm":s==="off"?"all":"armor";save();render();
  toast(s==="off"?"Equip a second weapon or a shield in your off hand.":`Tap a ${SLOTS.find(x=>x[0]===s)[1].toLowerCase()} item below to equip it.`)});
document.querySelectorAll("#gtabs,#ftabs").forEach(el=>el.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;S.tab=b.dataset.tab;save();renderSatchels()}));
$("ginv").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)openSheet(b.dataset.id)});
$("refbtns").addEventListener("click",e=>{const b=e.target.closest("[data-refine]");if(b)refine(b.dataset.refine)});
$("infbtns").addEventListener("click",e=>{const b=e.target.closest("[data-infuse]");if(b&&!inBattle())infuse(b.dataset.infuse)});
$("finv").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(!b)return;
  if(b.dataset.can==="1"&&!inBattle()){S.bench.push(b.dataset.id);save();render()}else openSheet(b.dataset.id)});
$("slots").addEventListener("click",e=>{const b=e.target.closest("[data-slot]");if(!b)return;S.bench.splice(+b.dataset.slot,1);save();render()});
$("result").addEventListener("click",e=>{const b=e.target.closest("[data-open]");if(b)openSheet(b.dataset.open)});
$("rtabs").addEventListener("click",e=>{const b=e.target.closest("[data-rtab]");if(!b)return;S.rtab=b.dataset.rtab;save();renderRecipes()});
$("rlist").addEventListener("click",e=>{const b=e.target.closest("[data-load]");if(!b)return;const it=S.items[b.dataset.load];
  S.bench=[...it.recipeIds];go("forge");toast(`Loaded the recipe for ${it.name}.`)});
$("cxlist").addEventListener("click",e=>{const b=e.target.closest("[data-codex]");if(b&&!b.disabled)openCodex(b.dataset.codex)});
$("clear").onclick=()=>{S.bench=[];save();render()};
$("scrim").onclick=closeSheet;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet.mode)closeSheet()});
$("sheet").addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const id=sheet.id,it=S.items[id],a=b.dataset.act;
  if(a==="close")return closeSheet();
  if(a==="equip"){equip(id,b.dataset.slot);toast(`${it.name} equipped.`)}
  if(a==="unequip"){S.eq[b.dataset.slot]=null;clampHp();toast(`${it.name} unequipped.`)}
  if(a==="eat"){S.inv[id]--;trimBench();const g=healYou(statsOf(it).heal);toast(`You use ${it.name} and recover ${g} HP.`)}
  if(a==="add"){S.bench.push(id);closeSheet();go("forge");toast(`${it.name} added to the crucible.`);return}
  if(a==="salvage"){
    if(!salvageArmed){salvageArmed=true;return openSheet(id,true)}
    const ys=salvageYield(it);S.inv[id]--;trimBench();settleGear(null);S.stats.salvaged++;
    ys.forEach(t=>addItem(essence(t)));const em=gainEmbers(salvageEmbers(it));closeSheet();toast(`Salvaged into ${ys.join(" and ")} Essence${em?` and ${em} embers`:""}.`)}
  if(a==="reforge")return reforge(id);
  save();render()});
$("combine").onclick=()=>{
  const items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  if(items.length<2)return;if(!chk.ok){toast(chk.reason);return}
  if(inBattle()){toast("Finish the fight first.");return}
  const lvBefore=level(),{item,log,inst,mishap,baseId,rxKeys}=combine(items);
  S.bench.forEach(id=>S.inv[id]--);S.bench=[];
  const isNew=!S.items[item.id];
  if(isNew){S.items[item.id]=item;S.journal.push({id:item.id,name:item.name,legendary:item.legendary})}
  S.inv[item.id]=(S.inv[item.id]||0)+1;
  const newRx=rxKeys.filter(k=>!S.knownR.includes(k));S.knownR.push(...newRx);
  settleGear(S.items[item.id]);
  const gain=10+(isNew?25:0)+(isNew&&item.legendary?100:0)+newRx.length*10;S.xp+=gain;
  S.last={id:item.id,item,log,inst,mishap,isNew,xpGain:gain,baseId};
  save();
  playForge(items,S.items[item.id],()=>{
    render(true);
    if(level()>lvBefore)toast(lvMsg());
    else if(newRx.length)toast("New reaction discovered! It's in your recipe book.");
    $("result").scrollIntoView({behavior:"smooth",block:"nearest"});
  });
};
$("exportBtn").onclick=()=>{
  const code=btoa(unescape(encodeURIComponent(JSON.stringify({...S,battle:null,event:null}))));
  const box=$("exportBox");box.value=code;box.hidden=false;
  const done=()=>toast("Save code copied. Keep it somewhere safe.");
  const fallback=()=>{box.focus();box.select();toast("Select the code below and copy it.")};
  try{navigator.clipboard.writeText(code).then(done,fallback)}catch(e){fallback()}
};
let importArmed=false;$("importBtn").onclick=e=>{
  const code=$("importBox").value.trim();if(!code){toast("Paste a save code first.");return}
  if(!importArmed){importArmed=true;e.target.textContent="Tap again to replace your current save";setTimeout(()=>{importArmed=false;e.target.textContent="Load save code"},3500);return}
  importArmed=false;e.target.textContent="Load save code";
  try{const s=migrate(JSON.parse(decodeURIComponent(escape(atob(code)))));if(!s)throw 0;S=s;S.battle=null;S.event=null;save();$("importBox").value="";go("battle");toast("Save loaded.")}
  catch(err){toast("That code didn't work. Make sure you copied all of it.")}
};
let armed=false;$("reset").onclick=e=>{
  if(!armed){armed=true;e.target.textContent="Tap again to erase all progress";setTimeout(()=>{armed=false;e.target.textContent="Start a new game"},3000);return}
  S=freshState();armed=false;e.target.textContent="Start a new game";save();go("battle");toast("A new journey begins.")};

try{render()}catch(e){ // a bad stored run should not cost the whole save: drop the transient parts first
  try{S.daily=null;S.run=null;S.battle=null;S.event=null;render()}catch(e2){S=freshState();save();render()}}

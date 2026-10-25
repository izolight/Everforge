// ================= EVENTS =================
let toastT,toastQ=[];
function toast(m,later){ // later: wait behind a toast that is still showing (unlock notices), instead of replacing it
  const t=$("toast");if(later&&t.classList.contains("show")){toastQ.push(m);return}
  t.textContent=m;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove("show");if(toastQ.length)setTimeout(()=>toast(toastQ.shift(),1),350)},3000)}
function go(view){
  if(view==="gear"||view==="forge"){freshShown=new Set([...freshShown,...S.fresh]);S.fresh=[]}else freshShown=new Set();
  S.view=view;save();render();window.scrollTo({top:0});
}
$("nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)go(b.dataset.view)});
$("goal").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="claim")claimGoal();else if(b.id==="goGoal"){const g=goal();if(g.zone&&g.zone!==S.zone&&S.run==="daily")return toast(tx("Finish or abandon the daily first."));if(g.zone&&zoneOpen(g.zone)&&!busy()){S.zone=g.zone;if(S.battle?.over)S.battle=null}go(g.tab)}});
$("intro").addEventListener("click",e=>{const b=e.target.closest("[data-intro]");if(b)dismissIntro(b.dataset.intro)});
$("gdlist").addEventListener("click",e=>{const b=e.target.closest("[data-guide]");if(!b)return;const u=UNL[b.dataset.guide];if(!u.i)return;
  go(u.i.tab||"battle");nudge(u.i.sel)}); // Show me: open the tab and pulse the thing
$("zones").addEventListener("scroll",zoneFade);
addEventListener("scroll",()=>placeIntro(),{passive:true});addEventListener("resize",()=>placeIntro());
$("zones").addEventListener("click",e=>{const b=e.target.closest("[data-zone]");if(!b||b.disabled)return;S.zone=b.dataset.zone;S.battle=null;S.event=null;save();render()});
$("arena").addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t||t.getAttribute("aria-disabled")==="true")return;
  if(t.dataset.intro)return dismissIntro(t.dataset.intro);
  if(t.dataset.codex)return openCodex(t.dataset.codex);
  if(t.dataset.item)return openSheet(t.dataset.item,false,!S.inv[t.dataset.item]);
  if(t.dataset.choice)return eventChoice(t.dataset.choice);
  if(t.dataset.use)return useItem(t.dataset.use);
  if(t.dataset.ability)return ability(t.dataset.ability);
  if(t.dataset.heat)return setHeat(+t.dataset.heat);
  if(t.id==="heatBtn"){heatOpen=!heatOpen;return render()}
  if(t.dataset.tile){const [x,y]=t.dataset.tile.split(",").map(Number);return step(x,y)}
  if(t.dataset.zone){S.zone=t.dataset.zone;S.battle=null;S.event=null;save();render();return window.scrollTo({top:0})}
  ({rest,atk:attack,guard,parry,study,flee,again:newExpedition,dailyStart:startDaily,dailyAbandon:abandonDaily,toforge:()=>go("forge"),
    cont:()=>{S.battle=null;S.event=null;logOpen=false;save();render()}})[t.id]?.();
});
$("arena").addEventListener("toggle",e=>{if(e.target.id==="legend")legendOpen=e.target.open;
  if(e.target.id==="logd"){logOpen=e.target.open;const bl=$("blog");if(bl)bl.scrollTop=bl.scrollHeight}},true);
addEventListener("resize",()=>{if(S.view==="battle"&&!S.battle&&!S.event){fitMap();heroView()}});document.fonts&&document.fonts.ready.then(()=>{if(S.view==="battle"&&!S.battle&&!S.event){fitMap();heroView()}});
$("gear").addEventListener("click",e=>{const b=e.target.closest("[data-gear]");if(!b)return;const s=b.dataset.gear,it=gearOf(s);
  if(it)return openSheet(it.id);
  S.tab=s==="main"?"weapon":s==="charm"?"charm":s==="off"?"all":"armor";save();render();
  toast(s==="off"?tx("Equip a second weapon or a shield in your off hand."):tx("Tap a {slot} item below to equip it.",{slot:lc(tx(SLOTS.find(x=>x[0]===s)[1]))}))});
document.querySelectorAll("#gtabs,#ftabs").forEach(el=>el.addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;S.tab=b.dataset.tab;save();renderSatchels()}));
$("ginv").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)openSheet(b.dataset.id)});
$("upgrows").addEventListener("click",e=>{const b=e.target.closest("[data-upgrade]");if(b)upgrade(b.dataset.upgrade)});
$("infbtns").addEventListener("click",e=>{const b=e.target.closest("[data-infuse]");if(b&&!inBattle())infuse(b.dataset.infuse)});
$("finv").addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(!b)return;
  if(b.dataset.can==="1"&&!inBattle()){S.bench.push(b.dataset.id);save();render()}else openSheet(b.dataset.id)});
$("slots").addEventListener("click",e=>{const b=e.target.closest("[data-slot]");if(!b)return;S.bench.splice(+b.dataset.slot,1);save();render()});
$("result").addEventListener("click",e=>{const b=e.target.closest("[data-open]");if(b)openSheet(b.dataset.open)});
$("rtabs").addEventListener("click",e=>{const b=e.target.closest("[data-rtab]");if(!b)return;S.rtab=b.dataset.rtab;save();renderRecipes()});
$("rlist").addEventListener("click",e=>{const b=e.target.closest("[data-load]");if(!b)return;const it=S.items[b.dataset.load];
  S.bench=[...it.recipeIds];go("forge");toast(tx("Loaded the recipe for {item}.",{item:iname(it)}))});
$("cxlist").addEventListener("click",e=>{const b=e.target.closest("[data-codex]");if(b&&!b.disabled)openCodex(b.dataset.codex)});
$("clear").onclick=()=>{S.bench=[];save();render()};
$("scrim").onclick=closeSheet;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet.mode)closeSheet()});
$("sheet").addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const id=sheet.id,it=S.items[id],a=b.dataset.act;
  if(a==="close")return closeSheet();
  if(a==="equip"){equip(id,b.dataset.slot);toast(tx("{item} equipped.",{item:iname(it)}))}
  if(a==="unequip"){S.eq[b.dataset.slot]=null;clampHp();toast(tx("{item} unequipped.",{item:iname(it)}))}
  if(a==="eat"){S.inv[id]--;trimBench();const g=healYou(medHeal(it));toast(tx("You use {item} and recover {n} HP.",{item:iname(it),n:g}))}
  if(a==="add"){S.bench.push(id);closeSheet();go("forge");toast(tx("{item} added to the crucible.",{item:iname(it)}));return}
  if(a==="salvage"){
    if(!salvageArmed){salvageArmed=true;return openSheet(id,true)}
    const ys=salvageYield(it),sg=salvGrade(it);S.inv[id]--;trimBench();settleGear(null);S.stats.salvaged++;
    ys.forEach(t=>addItem(essG(t,sg)));const em=gainEmbers(salvageEmbers(it));closeSheet();{const list=ys.map(t=>iname(S.items[gradedId("ess_"+t,sg)])).join(tx(" and "));toast(em&&isUnl("peddler")?tx("Salvaged into {list} and {n} embers.",{list,n:em}):tx("Salvaged into {list}.",{list}))}}
  if(a==="reforge")return reforge(id);
  save();render()});
$("combine").onclick=()=>{
  const items=S.bench.map(id=>S.items[id]),chk=checkMix(items);
  if(items.length<2)return;if(!chk.ok){toast(chk.reason);return}
  if(inBattle()){toast(tx("Finish the fight first."));return}
  const bl=combine(items,{roll:100}).blocked;if(bl){toast(blockText(bl));return}
  if(equippedRisk(items).length&&forgeArmed!==S.bench.join()){forgeArmed=S.bench.join();renderBench();setTimeout(()=>{forgeArmed="";if(S.view==="forge")renderBench()},3500);return} // a fizzle would destroy something you wear: tap twice
  forgeArmed="";
  const lvBefore=level(),sk0=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,skLv(k)])),{item,log,inst,mishap,fizzle,cleanId,skill,diff,baseId,rxKeys}=combine(items);
  const worthSum=items.reduce((n,i)=>n+worth(i),0);
  S.bench.forEach(id=>S.inv[id]--);S.bench=[];
  const st=S.stats,known=S.journal.some(j=>j.id===cleanId),isNew=!fizzle&&!mishap&&!known,newRx=fizzle?[]:rxKeys.filter(k=>!S.knownR.includes(k));
  const firstLeg=!fizzle&&item.legendary&&!S.journal.some(j=>j.legendary&&j.name===item.name);
  if(fizzle)st.fizzles++;else{st.forged++;if(firstLeg)st.legend++;if(mishap)st.mishaps++}
  let gain=10,refund=0;
  if(fizzle){gain=Math.round(gain*SK_XP.fizzle);refund=gainEmbers(Math.max(1,Math.round(worthSum*FIZ.refund)));settleGear(null)}
  else{
    if(!S.items[item.id])S.items[item.id]=item;
    const fr=isNew?S.journal.findIndex(j=>S.items[j.id]&&S.items[j.id].clean===cleanId):-1; // a flawed copy was journaled: the clean recipe takes over its row
    if(isNew){if(fr>=0)S.journal[fr]={...S.journal[fr],id:item.id,name:item.name};else S.journal.push({id:item.id,name:item.name,legendary:item.legendary})}
    else if(mishap&&firstLeg)S.journal.push({id:item.id,name:item.name,legendary:true}); // a flawed secret still counts as found
    S.inv[item.id]=(S.inv[item.id]||0)+1;S.knownR.push(...newRx);
    settleGear(S.items[item.id]);
    gain+=(isNew?25:0)+(firstLeg?100:0)+newRx.length*10}
  S.xp+=gain; // smith XP is not scaled by difficulty: it only gates slots, the skills gate tiers
  const sx={},add=(k,sh)=>{if(!(k in sx))sx[k]=Math.max(1,Math.round(gain*sh*skFactor(diff,skLv(k))*(known?.5:1)))};
  add(skill,SK_XP.self);items.forEach(i=>add(skillOf(i),SK_XP.input)); // the result's skill, then each other input category once
  const scaled=Object.keys(sx).some(k=>skFactor(diff,skLv(k))<1)||known;
  Object.entries(sx).forEach(([k,n])=>S.skills[k]=skXp(k)+n);
  const ups=Object.keys(sx).filter(k=>skLv(k)>sk0[k]);
  S.last={id:fizzle?null:item.id,item,log:fizzle?log.filter(l=>l.k==="Fizzle"):log,inst,mishap,fizzle,refund,isNew,xpGain:gain,sx,scaled,baseId,recipe:items.map(i=>i.name),recipeIds:items.map(i=>i.id)};
  save();
  const after=()=>{
    render(true);
    if(level()>lvBefore||ups.length)toast([level()>lvBefore?lvMsg():"",...ups.map(k=>skMsg(k,sk0[k]))].filter(Boolean).join(" "));
    else if(newRx.length)toast(tx("New reaction discovered! It's in your recipe book."));
    $("result").scrollIntoView({behavior:"smooth",block:"nearest"});
  };
  if(fizzle){sfx("clang");after()}else playForge(items,S.items[item.id],after);
};
$("exportBtn").onclick=()=>{
  const code=btoa(unescape(encodeURIComponent(JSON.stringify({...S,battle:null,event:null}))));
  const box=$("exportBox");box.value=code;box.hidden=false;
  const done=()=>toast(tx("Save code copied. Keep it somewhere safe."));
  const fallback=()=>{box.focus();box.select();toast(tx("Select the code below and copy it."))};
  try{navigator.clipboard.writeText(code).then(done,fallback)}catch(e){fallback()}
};
let importArmed=false;$("importBtn").onclick=e=>{
  const code=$("importBox").value.trim();if(!code){toast(tx("Paste a save code first."));return}
  if(!importArmed){importArmed=true;e.target.textContent=tx("Tap again to replace your current save");setTimeout(()=>{importArmed=false;e.target.textContent=tx("Load save code")},3500);return}
  importArmed=false;e.target.textContent=tx("Load save code");
  try{const s=migrate(JSON.parse(decodeURIComponent(escape(atob(code)))));if(!s)throw 0;S=s;S.battle=null;S.event=null;save();$("importBox").value="";go("battle");toast(tx("Save loaded."))}
  catch(err){toast(tx("That code didn't work. Make sure you copied all of it."))}
};
let armed=false;$("reset").onclick=e=>{
  if(!armed){armed=true;e.target.textContent=tx("Tap again to erase all progress");setTimeout(()=>{armed=false;e.target.textContent=tx("Start a new game")},3000);return}
  S=freshState();armed=false;e.target.textContent=tx("Start a new game");save();go("battle");toast(tx("A new journey begins."))};

try{const ud=$("upgd");ud.open=localStorage.getItem("everforge-upgopen")==="1";ud.addEventListener("toggle",()=>{try{localStorage.setItem("everforge-upgopen",ud.open?"1":"0")}catch(e){}})}catch(e){}
try{const sd=$("statsd");sd.open=localStorage.getItem("everforge-statsopen")==="1";sd.addEventListener("toggle",()=>{try{localStorage.setItem("everforge-statsopen",sd.open?"1":"0")}catch(e){}})}catch(e){}
// static markup: icons in headers, and the numbers in the How to play text (run again after a language change, which rewrites that text)
function fillStatic(){
  document.querySelectorAll("[data-ic]").forEach(e=>e.innerHTML=ic(e.dataset.ic,"s"));
  const RV={defk:DEF_K,hitmax:Math.round((1-HIT_MIN)*100),magw:MAG_W,gcut:pcn(GUARD_T.cut),braced:pcn(GUARD_T.braced),pbase:pcn(PARRY_T.base),pcap:pcn(PARRY_T.cap),pranks:PARRY_T.levels};document.querySelectorAll("[data-k]").forEach(e=>e.textContent=RV[e.dataset.k]);
}
// language: the choice is kept outside the save (a save code moves between devices, the language does not have to)
function setLang(l){
  if(!LANGS[l])return;LANG=l;try{localStorage.setItem(LANG_KEY,l)}catch(e){}
  applyStatic();fillStatic();sndUi();$("lang").value=l;render();
}
$("lang").innerHTML=Object.entries(LANGS).map(([k,n])=>`<option value="${k}">${n}</option>`).join("");$("lang").value=LANG;
$("lang").addEventListener("change",e=>setLang(e.target.value));
applyStatic();fillStatic();sndUi();
try{render()}catch(e){ // a bad stored run should not cost the whole save: drop the transient parts first
  try{S.daily=null;S.run=null;S.battle=null;S.event=null;render()}catch(e2){S=freshState();save();render()}}
if(migNote){migNote=false;toast(tx("A map was redrawn. Your expedition there starts fresh."))}

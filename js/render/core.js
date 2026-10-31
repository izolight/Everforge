// ================= RENDER: SHELL =================
// Header, nav, goal bar, intro cards, the touch hint, focus keeping and render() itself (loaded last of the render files)
let freshShown=new Set(),logOpen=false,heatOpen=false,legendOpen=false;
function renderHeader(){
  const l=level(),cur=XP_LV[l-1],nxt=XP_LV[l];clampHp();
  const lt=`${tx("Smith Lv {l}",{l})}\n${nxt?tx("{a}/{b} XP to Lv {n}.",{a:S.xp-cur,b:nxt-cur,n:l+1}):tx("Highest level reached.")}${LV_PERK[l]?` ${tx(LV_PERK[l])}`:""}\n${tx("Smith XP comes from forging and unlocks crucible slots, trait slots and appraisal.")}`;
  $("lvl").innerHTML=`${ic("smith","l")}<b>${l}</b>`;$("lvl").dataset.tip=lt;$("xpbar").parentNode.dataset.tip=lt;
  $("xpbar").style.width=nxt?`${Math.min(100,(S.xp-cur)/(nxt-cur)*100)}%`:"100%";
  $("emb").hidden=!isUnl("peddler");$("emb").innerHTML=`${icon("ember")}${S.embers}`;$("emb").dataset.tip=tx("Embers")+"\n"+tx("The currency of the forge. Fights, salvage and selling earn it; the peddler, grade upgrades and reforging spend it.");
  $("rp").hidden=!isUnl("research");$("rp").innerHTML=`${ic("research")}${S.rp}`;$("rp").dataset.tip=tx("Research points")+"\n"+tx("Earned by discoveries: a first craft of each kind, a new reaction, a new essence, a studied creature, a boss down, a smith or skill level. Spend them in the Forge on techniques.")+"\n"+tx("You have {n}.",{n:S.rp});
  $("disc").innerHTML=`<span class="mi" ${tt(tx("Renown"),tx("Battles you have won."))}>${ic("renown")}${S.wins}</span><span class="mi" ${tt(tx("Recipes forged"),tx("Different things you have forged. Each is saved in the Recipes tab."))}>${ic("hammer")}${S.journal.length}</span>`;
}
const viewName=v=>v==="battle"?tx("Explore"):tx(cap(v));
function renderNav(){
  $("nav").innerHTML=VIEWS.filter(v=>v!=="settings").map(v=>{
    let badge="";
    if(v==="battle"&&inBattle()&&S.view!=="battle")badge=`<i class="badge-dot pulse" role="img" aria-label="${esc(tx("battle in progress"))}"></i>`;
    if(v==="gear"&&S.fresh.length&&S.view!=="gear"&&S.view!=="forge")badge=`<i class="badge-dot" role="img" aria-label="${esc(tx("{n} new items",{n:S.fresh.length}))}">${S.fresh.length}</i>`;
    if(!badge&&S.view!==v&&!inBattle()&&pendingIntros().some(c=>c.ctx!=="battle"&&c.tab===v))badge=`<i class="badge-dot pulse" role="img" aria-label="${esc(tx("new introduction"))}"></i>`;
    return `<button data-view="${v}" aria-current="${S.view===v?"page":"false"}">${icon(v)}<span>${viewName(v)}</span>${badge}</button>`}).join("");
  VIEWS.forEach(v=>$("v-"+v).hidden=S.view!==v);
}
function renderGoal(){
  const g=goal(),el=$("goal"),st=g.short||g.step;
  el.hidden=inBattle();
  el.className="goal"+(g.done?" done":"");
  const btn=g.choose?`<button class="btn sm" id="chooseBounty">${tx("Choose bounty")}</button>`:g.done?`<button class="btn primary sm" id="claim">${tx("Claim")}</button>`:S.view!==g.tab?`<button class="btn sm" id="goGoal">${tx("Go to {tab}",{tab:viewName(g.tab)})}</button>`:"";
  const html=`<div class="gt" ${tt(g.step+(g.prog?` · ${g.prog}`:""),g.text,g.done?tx("Reward: {list}",{list:rewardText(g.reward)}):"")}><small>${st}</small> ${g.text}${g.prog?` <em>${g.prog}</em>`:""}</div>${btn}`;
  const sig=st+g.text+(g.prog||"")+(g.done?tx("Reward: {list}",{list:rewardText(g.reward)}):"")+btn;
  if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=html} // the live region is only rewritten when its text changes, like the intro card
}
const lockAct=id=>`<button class="btn act lk" id="${id}" aria-disabled="true" data-tap aria-label="${esc(tx("{name}, locked. {txt}",{name:tx(UNL[id].name),txt:tx(UNL[id].txt)}))}" ${tt(tx("{name} (locked)",{name:tx(UNL[id].name)}),tx(UNL[id].txt))}>${ic("lock")}<span>${tx(UNL[id].name)}</span></button>`; // an action-grid button that is not open yet
const introIn=c=>`<span class="ii" aria-hidden="true">${ic(c.ic,"l")}</span><div class="it"><b>${c.t}</b>${c.l.map(x=>`<p>${x}</p>`).join("")}</div><button class="btn sm" id="introOk" data-intro="${c.id}">${tx("Got it")}</button>`; // a one-time intro card (non-modal; Got it marks it read)
const introHtml=c=>c?`<div class="intro">${introIn(c)}</div>`:"";
function renderIntro(){const el=$("intro"),c=inBattle()?null:curIntro(false),id=c?c.id:"";el.hidden=!c;el.className="intro"+(S.view==="battle"?" fl":"");
  if(el.dataset.cid!==id+LANG){el.dataset.cid=id+LANG;el.innerHTML=c?introIn(c):""} // rewritten only when the card changes, so the live region does not announce it again
  placeIntro()}
function placeIntro(){ // the floating card sits under the goal bar (so Claim stays tappable) and moves to the bottom if it would cover you on the map
  const el=$("intro");el.style.top=el.style.bottom="";if(el.hidden||!el.classList.contains("fl"))return;
  const g=$("goal");el.style.top=Math.max(8,g.hidden?0:g.getBoundingClientRect().bottom+6)+"px";
  const h=document.querySelector(".tl.here");if(h){const a=el.getBoundingClientRect(),b=h.getBoundingClientRect();if(a.bottom>b.top&&a.top<b.bottom&&a.right>b.left&&a.left<b.right){el.style.top="auto";el.style.bottom=$("nav").offsetHeight+8+"px"}}} // the card at the top of a tab; over the map it floats, so the map never shifts (a fight shows its own above the action grid)
// ---- one-time hint: on a touch screen a tip opens on a long press, which nothing says
const HOLD_KEY="everforge-holdhint";
const touchOnly=()=>!!(window.matchMedia&&matchMedia("(hover: none) and (pointer: coarse)").matches);
function holdHint(){
  if(!touchOnly())return;
  try{if(localStorage.getItem(HOLD_KEY))return;localStorage.setItem(HOLD_KEY,"1")}catch(e){return}
  setTimeout(()=>toast(tx("Hold any button for details")),900);
}
let lastIntro=null;
// ---- keep the keyboard focus across a re-render: the nav, the arena and the zone chips are rebuilt every time
const FOCUS_ATTRS=["data-view","data-zone","data-item","data-id","data-use","data-ability","data-act","data-slot","data-heat","data-choice","data-load","data-tech","data-study","data-upgrade","data-infuse","data-pat","data-pslot","data-pm","data-tab","data-rtab","data-codex","data-tile","data-pin-rumor","data-pin-recipe","data-bulk","data-open","data-source-zone","data-goal-tab","data-gores","data-intro","data-result-equip","data-target","data-target-cycle"];
const focusPath=el=>{ // no id and no data attribute: the place in the tree is the key
  const parts=[];let n=el;
  while(n&&n.nodeType===1&&n!==document.body){
    if(n.id){parts.unshift("#"+n.id);break}
    const p=n.parentElement;if(!p||!p.children.length)break;
    parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${[...p.children].indexOf(n)+1})`);
    n=p;
  }
  return parts.length?parts.join(">"):null;
};
const focusKey=el=>{
  if(!el||el===document.body||el===document.documentElement||el.nodeType!==1)return null;
  if(el.id)return "#"+el.id;
  const a=FOCUS_ATTRS.filter(x=>el.hasAttribute(x));
  if(a.length)return a.map(x=>`[${x}=${JSON.stringify(el.getAttribute(x))}]`).join("");
  return focusPath(el);
};
const restoreFocus=key=>{
  if(!key)return; // nothing in the app was focused: do not steal it
  let el=null;try{el=document.querySelector(key)}catch(e){return}
  if(!el||!el.getClientRects().length)return;
  el.focus({preventScroll:true});
  if(document.activeElement!==el)queueMicrotask(()=>{ // a tip-only element gets its tabindex a tick later (tip.js watches the DOM)
    if(el.isConnected&&el.getClientRects().length&&document.activeElement!==el)el.focus({preventScroll:true});
  });
};
function render(fresh){
  const motion=captureMotion(),focus=focusKey(document.activeElement);
  if(checkUnl())save();
  renderHeader();renderNav();renderGoal();renderPinnedGoal();renderIntro();
  if(S.view==="battle")renderBattle();
  if(S.view==="gear")renderGear();
  if(S.view==="forge"){renderActs();renderPatterns();renderBench();renderResearch();renderUpgrade();renderSkills();renderResult(fresh)}
  renderSatchels();
  if(S.view==="recipes")renderRecipes();
  if(S.view==="codex")renderCodex();
  if(sheet.mode==="item"&&sheet.id)openSheet(sheet.id,true,sheet.preview);else if(sheet.mode==="codex")openCodex(sheet.id,true);
  animateRender(motion);flushFx();syncMusic();
  applyNudge();placeIntro();const cur=curIntro(inBattle());if(cur&&cur.id!==lastIntro)nudge(cur.sel);lastIntro=cur?cur.id:null; // a new card pulses what it points at
  rpFlush();
  restoreFocus(focus);
  if(S.view==="battle")holdHint();
}

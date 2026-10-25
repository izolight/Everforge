// ================= GAME MOTION =================
// Transient presentation only: no save fields, timers that hold up actions, or game RNG.
const motionActive=new Set();
let motionScene=null;
function animateMotion(el,frames,options){
  if(!el||reduced()||typeof el.animate!=="function")return null;
  const a=el.animate(frames,{duration:300,easing:"cubic-bezier(.2,.7,.3,1)",...options});
  motionActive.add(a);
  a.finished.then(()=>motionActive.delete(a),()=>motionActive.delete(a));
  return a;
}
const combatMarks={
  slash:'<path class="trace" pathLength="1" d="M20 89 Q38 29 101 22" stroke-width="7"/><path d="M29 94 L38 100 M18 68 L8 65 M91 32 L103 43" stroke-width="2"/>',
  thrust:'<path class="trace" pathLength="1" d="M15 104 L99 20 M78 23 L101 18 L96 41" stroke-width="5"/><path d="M27 72 L13 72 M44 95 L44 109" stroke-width="2"/>',
  claws:'<path class="trace" pathLength="1" d="M21 84 Q35 38 73 20 M40 98 Q51 49 91 29 M62 104 Q70 61 106 45" stroke-width="4"/>',
  arc:'<circle cx="60" cy="60" r="35" stroke-width="2"/><path class="trace" pathLength="1" d="M60 15 L75 45 L105 60 L75 75 L60 105 L45 75 L15 60 L45 45 Z" stroke-width="3"/><circle cx="60" cy="60" r="8" fill="currentColor" stroke="none"/>',
  guard:'<path class="trace" pathLength="1" d="M60 15 L92 28 V58 Q91 82 60 104 Q29 82 28 58 V28 Z" stroke-width="4"/><path d="M44 58 L55 69 L78 43" stroke-width="4"/>',
  parry:'<circle cx="60" cy="60" r="35" stroke-width="2"/><path class="trace" pathLength="1" d="M30 90 L90 30 M30 30 L90 90" stroke-width="5"/><path d="M60 8 V20 M60 100 V112 M8 60 H20 M100 60 H112" stroke-width="3"/>',
  heal:'<circle cx="60" cy="60" r="32" stroke-width="2"/><path d="M60 42 V78 M42 60 H78 M30 17 V31 M23 24 H37 M94 84 V100 M86 92 H102" stroke-width="4"/>',
  dodge:'<path class="trace" pathLength="1" d="M24 40 H78 L63 25 M16 60 H68 M25 80 H83 L68 95" stroke-width="3"/>'
};
function combatFx(target,kind,color){
  const el=$(target);if(!el||reduced()||!combatMarks[kind]||typeof el.animate!=="function")return;
  const mark=document.createElement("span");
  mark.className="combat-fx fx-"+kind;mark.setAttribute("aria-hidden","true");
  if(color)mark.style.color=color;
  mark.innerHTML=`<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${combatMarks[kind]}</svg>`;
  el.appendChild(mark);
  const heal=kind==="heal",a=animateMotion(mark,[
    {opacity:0,transform:`translateY(${heal?12:0}px) scale(.65)`},
    {opacity:1,transform:"translateY(0) scale(1)",offset:.25},
    {opacity:0,transform:`translateY(${heal?-18:0}px) scale(1.16)`}
  ],{duration:heal?650:420});
  mark.querySelectorAll(".trace").forEach(p=>{
    p.style.strokeDasharray="1";
    animateMotion(p,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:180});
  });
  if(a)a.finished.then(()=>mark.remove(),()=>mark.remove());else mark.remove();
}
function strikeFx(W,tr){
  const form=W&&W.form,kind=form==="claws"?"claws":["staff","spellblade"].includes(form)?"arc":["spear","lance"].includes(form)?"thrust":"slash";
  const trait=topTraits(tr).find(([t])=>["fire","ice","poison","holy","shadow","arcane"].includes(TRAITS[t].f));
  vfx("foeArt",kind,trait?FAM[TRAITS[trait[0]].f]:undefined);
}
function captureMotion(){
  if(reduced())return null;
  const bars={};
  for(const sel of ["#youHud .bar i","#enemyHud .bar i",".torchb .tbar i"]){
    const el=document.querySelector(sel);
    if(el){const width=parseFloat(getComputedStyle(el.parentElement).width);if(width)bars[sel]=100*parseFloat(getComputedStyle(el).width)/width}
  }
  const hero=document.querySelector(".tl.here .hero"),tile=hero&&hero.parentElement;
  return{bars,hero:hero?{x:hero.getBoundingClientRect().left-tile.getBoundingClientRect().left,y:hero.getBoundingClientRect().top-tile.getBoundingClientRect().top}:null};
}
function animateRender(before){
  const prev=motionScene,B=S.battle,ev=S.event,m=S.view==="battle"&&!B&&!ev?curMap():null;
  const next={view:S.view,battle:B,over:B&&B.over,phased:B&&B.phased,event:ev,map:m,steps:m&&m.steps,pos:m?{...m.pos}:null};
  motionScene=next;
  if(!prev||!before||reduced())return;
  const changed=prev.view!==next.view,enter=[{opacity:.2,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}];
  if(changed)animateMotion($("v-"+S.view),enter,{duration:220});
  const encounter=S.view==="battle"&&(changed||B!==prev.battle||ev!==prev.event);
  if(encounter)animateMotion(document.querySelector("#arena .stage,#arena .event"),enter);
  if(S.view==="battle"&&(encounter||(B&&B.over==="won"&&prev.over!=="won"))){
    document.querySelectorAll("#arena .loot>button,#arena .loot>.emb").forEach((el,i)=>animateMotion(el,[
      {opacity:0,transform:"translateY(10px) scale(.8)"},{opacity:1,transform:"translateY(0) scale(1)"}
    ],{duration:280,delay:Math.min(i,5)*55,fill:"backwards"}));
  }
  if(B&&B===prev.battle&&B.phased!==prev.phased)animateMotion($("foeArt"),[
    {opacity:.2,filter:"brightness(2)",transform:"scale(.85)"},{opacity:1,filter:"none",transform:"scale(1)"}
  ],{duration:500});
  if(!changed){
    for(const [sel,width] of Object.entries(before.bars)){
      if(sel.startsWith("#enemyHud")&&B!==prev.battle)continue;
      const el=document.querySelector(sel);
      if(el&&Math.abs(parseFloat(el.style.width)-width)>.5)animateMotion(el,[{width:width+"%"},{width:el.style.width}],{duration:340});
    }
    if(m&&m===prev.map&&m.steps===prev.steps+1&&before.hero&&Math.abs(m.pos.x-prev.pos.x)+Math.abs(m.pos.y-prev.pos.y)===1){
      const hero=document.querySelector(".tl.here .hero"),tile=hero&&hero.parentElement;
      if(hero){const dx=(prev.pos.x-m.pos.x)*(tile.offsetWidth+1)+before.hero.x,dy=(prev.pos.y-m.pos.y)*(tile.offsetHeight+1)+before.hero.y;
        animateMotion(hero,[{transform:`translate(${dx}px,${dy}px)`},{transform:"translate(0,0)"}],{duration:180})}
    }
  }
}
// Also stop effects already playing when the OS preference changes mid-session.
if(window.matchMedia){const mq=matchMedia("(prefers-reduced-motion: reduce)");
  const stop=()=>{if(mq.matches){motionActive.forEach(a=>a.cancel());document.querySelectorAll(".combat-fx").forEach(el=>el.remove())}};
  if(mq.addEventListener)mq.addEventListener("change",stop);
}

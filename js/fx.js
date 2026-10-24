// ================= FX QUEUE =================
let fxQ=[];
function fx(target,text,cls){fxQ.push({target,text,cls})}
function flushFx(){
  const counts={},sk=fxQ.some(f=>f.cls==="shake");let k=0;
  fxQ.forEach(f=>{const y=f.target==="youHud",s=f.cls==="crit"?"crit":f.cls==="ember"?"ember":f.cls==="shake"?"ouch":f.cls==="heal"?(y?"heal":""):f.cls==="hurt"?(y&&sk?"":"tick"):f.target==="enemyHud"&&f.text?"hit":"";
    if(s)sfx(s,Math.min(k++,3)*.09)}); // sounds for the floaters; a multi-hit turn is spread out, and sfx() rate-limits each kind
  fxQ.forEach(f=>{const el=$(f.target);if(!el)return;
    if(["shake","hit","on"].includes(f.cls)){el.classList.remove(f.cls);void el.offsetWidth;el.classList.add(f.cls);return}
    const n=counts[f.target]=(counts[f.target]||0)+1,s=document.createElement("span");
    s.className="floater "+(f.cls||"");s.textContent=f.text;s.style.right=`${12+(n-1)*46}px`;s.style.animationDelay=`${(n-1)*.12}s`;
    el.appendChild(s);setTimeout(()=>s.remove(),1500)});
  fxQ=[];
}

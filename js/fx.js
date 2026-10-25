// ================= FX QUEUE =================
let fxQ=[];
function fx(target,text,cls,detail){fxQ.push({target,text,cls,detail})}
function vfx(target,kind,color){fx(target,"","visual",{kind,color})}
function flushFx(){
  const counts={},sk=fxQ.some(f=>f.cls==="shake");let k=0,ky=0;
  fxQ.forEach(f=>{const y=f.target==="youHud",s=f.text==="miss"?"dodge":f.text==="ward"?"block":f.cls==="crit"?"crit":f.cls==="ember"?"ember":f.cls==="shake"?"ouch":f.cls==="heal"?(y?"heal":""):f.cls==="hurt"?(y&&sk?"":"tick"):f.target==="enemyHud"&&f.text?"hit":"";
    if(s)sfx(s,Math.min(s==="ouch"?ky++:k++,3)*.09,f.detail)}); // sounds for the floaters; a multi-hit turn is spread out, and sfx() rate-limits each kind
  const shown=new Set();
  const visual=(target,kind,color)=>{const key=target+kind;if(shown.has(key))return;shown.add(key);combatFx(target,kind,color)};
  fxQ.forEach(f=>{const el=$(f.target);if(!el)return;
    if(f.cls==="visual"){visual(f.target,f.detail.kind,f.detail.color);return}
    if(f.cls==="heal")visual(f.target==="enemyHud"?"foeArt":f.target,"heal");
    if(f.text==="ward")visual(f.target==="enemyHud"?"foeArt":f.target,"guard");
    if(["shake","hit","on"].includes(f.cls)){el.classList.remove(f.cls);void el.offsetWidth;el.classList.add(f.cls);return}
    const n=counts[f.target]=(counts[f.target]||0)+1,s=document.createElement("span");
    s.className="floater "+(f.cls||"");s.textContent=/^[a-z]/i.test(f.text)?tx(f.text):f.text;s.style.right=`${12+(n-1)*46}px`;s.style.animationDelay=`${(n-1)*.12}s`;
    el.appendChild(s);setTimeout(()=>s.remove(),1500)});
  fxQ=[];
}

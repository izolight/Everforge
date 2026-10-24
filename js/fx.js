// ================= FX QUEUE =================
let fxQ=[];
function fx(target,text,cls){fxQ.push({target,text,cls})}
function flushFx(){
  const counts={};
  fxQ.forEach(f=>{const el=$(f.target);if(!el)return;
    if(["shake","hit","on"].includes(f.cls)){el.classList.remove(f.cls);void el.offsetWidth;el.classList.add(f.cls);return}
    const n=counts[f.target]=(counts[f.target]||0)+1,s=document.createElement("span");
    s.className="floater "+(f.cls||"");s.textContent=f.text;s.style.right=`${12+(n-1)*46}px`;s.style.animationDelay=`${(n-1)*.12}s`;
    el.appendChild(s);setTimeout(()=>s.remove(),1500)});
  fxQ=[];
}

// ================= TIPS =================
// One global popover for every [data-tip="Title\nline\nline"]. It is plain text (set with textContent; lines split on a newline, the first one bold). Build the attribute with tt(...lines).
// Tap a non-interactive element (a chip, a stat) to toggle it. On a button, link or summary, whose tap already does something, press and hold instead (the tap still acts); mouse users get hover, keyboard users focus.
// A [data-tap] element (helpBtn, the "?") toggles on a plain tap even though it is a button. Outside tap, scroll or Escape dismisses it.
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const tt=(...l)=>`data-tip="${esc(l.filter(Boolean).join("\n"))}"`;
const helpBtn=(...l)=>`<button type="button" class="qm" data-tap ${tt(...l)} aria-label="Help: ${esc(l[0])}">?</button>`;
(()=>{
  const el=document.createElement("div");el.id="tip";el.setAttribute("role","tooltip");el.hidden=true;document.body.appendChild(el);
  let cur=null,hold=0,hov=0,lp=false,sx=0,sy=0;
  const A=t=>t&&t.closest?t.closest("[data-tip]"):null,act=a=>!a.hasAttribute("data-tap")&&!!a.closest("button,a,summary,input,select,textarea,label,[role=button]");
  function place(a){
    const r=a.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=innerHeight,m=8;
    el.style.left="0px";el.style.top="0px";const w=el.offsetWidth,h=el.offsetHeight;
    const x=Math.max(m,Math.min(vw-w-m,r.left+r.width/2-w/2));
    let y=r.top-h-9,b=0;if(y<m&&vh-r.bottom>r.top){y=r.bottom+9;b=1} // flip below when there is no room above
    y=Math.max(m,Math.min(vh-h-m,y));
    el.style.left=x+"px";el.style.top=y+"px";el.dataset.pos=b?"b":"t";el.style.setProperty("--ax",Math.max(12,Math.min(w-12,r.left+r.width/2-x))+"px");
  }
  function show(a){
    const L=(a.dataset.tip||"").split("\n").filter(Boolean);if(!L.length)return;hide();
    el.textContent="";L.forEach((s,i)=>{const d=document.createElement("div");d.textContent=s;if(!i&&L.length>1)d.className="th";el.appendChild(d)});
    el.hidden=false;cur=a;a.setAttribute("aria-describedby","tip");place(a);
  }
  function hide(){clearTimeout(hov);if(cur){cur.removeAttribute("aria-describedby");cur=null}el.hidden=true}
  window.hideTip=hide;
  document.addEventListener("pointerdown",e=>{
    const a=A(e.target);lp=false;clearTimeout(hold);
    if(cur&&a!==cur&&!el.contains(e.target))hide();
    if(a&&e.pointerType!=="mouse"&&act(a)){sx=e.clientX;sy=e.clientY;hold=setTimeout(()=>{show(a);lp=true},420)}
  },true);
  document.addEventListener("pointermove",e=>{if(hold&&Math.hypot(e.clientX-sx,e.clientY-sy)>10){clearTimeout(hold);hold=0}},true);
  ["pointerup","pointercancel"].forEach(n=>document.addEventListener(n,()=>{clearTimeout(hold);hold=0},true));
  document.addEventListener("click",e=>{
    if(lp){lp=false;e.preventDefault();e.stopPropagation();return} // the press that opened a tip must not also act
    const a=A(e.target);if(!a||act(a))return;
    e.preventDefault();e.stopPropagation();cur===a?hide():show(a);
  },true);
  document.addEventListener("contextmenu",e=>{if(A(e.target))e.preventDefault()});
  document.addEventListener("pointerover",e=>{if(e.pointerType!=="mouse")return;const a=A(e.target);if(a&&a!==cur){clearTimeout(hov);hov=setTimeout(()=>show(a),250)}},true);
  document.addEventListener("pointerout",e=>{if(e.pointerType!=="mouse")return;clearTimeout(hov);const a=A(e.target);if(a&&a===cur&&!a.contains(e.relatedTarget))hide()},true);
  document.addEventListener("focusin",e=>{const a=A(e.target);if(a&&e.target.matches(":focus-visible"))show(a)});
  document.addEventListener("focusout",e=>{if(cur&&A(e.target)===cur)hide()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&cur){hide();e.stopPropagation()}},true);
  addEventListener("scroll",()=>{if(cur)hide()},true);addEventListener("resize",hide);
  const prep=n=>{if(n.nodeType!==1)return;[n,...n.querySelectorAll("[data-tip]")].forEach(x=>{ // tip-only elements become focusable and get a name
    if(!x.matches("[data-tip]")||x.matches("button,a,summary,input,select,textarea"))return;
    if(!x.hasAttribute("tabindex"))x.tabIndex=0;
    if(!x.hasAttribute("aria-label")||x.dataset.tl){x.setAttribute("role","note");x.dataset.tl=1;x.setAttribute("aria-label",x.dataset.tip.split("\n").join(". "))}})};
  new MutationObserver(ms=>{ms.forEach(m=>m.type==="attributes"?prep(m.target):m.addedNodes.forEach(prep));if(cur&&!cur.isConnected)hide()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-tip"]});
  prep(document.body);
})();

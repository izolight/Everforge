// ================= FORGE ANIMATION =================
function playForge(inputs,item,cb){
  if(reduced()){cb();return}
  const o=$("forgefx"),[rn,rc]=rarity(item);
  o.className="forgefx";o.hidden=false;o.style.setProperty("--rc",rc);
  $("fxin").innerHTML=inputs.map((it,i)=>`<div style="animation-delay:${i*.12}s">${art(it)}</div>`).join("");
  $("fxres").innerHTML=art(item);$("fxres").style.setProperty("--rc",rc);
  $("fxname").innerHTML=`<small>${rn}${item.legendary?"":""}</small>${item.name}`;$("fxname").style.color=rc;
  $("fxsparks").innerHTML=Array.from({length:16},()=>`<i style="--dx:${Math.round(Math.random()*180-90)}px;--dy:${Math.round(-40-Math.random()*110)}px;animation-delay:${(Math.random()*.4).toFixed(2)}s"></i>`).join("");
  let done=false;const timers=[];
  const finish=()=>{if(done)return;done=true;timers.forEach(clearTimeout);o.hidden=true;o.onclick=null;cb()};
  requestAnimationFrame(()=>o.classList.add("drop"));
  timers.push(setTimeout(()=>o.classList.add("melt"),780));
  timers.push(setTimeout(()=>o.classList.add("reveal"),1450));
  timers.push(setTimeout(finish,3600));
  o.onclick=()=>{if(o.classList.contains("reveal"))finish()};
}

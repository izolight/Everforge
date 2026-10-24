// ================= AMBIENT EMBERS =================
(function(){
  const c=$("embers");if(!c||reduced())return;const x=c.getContext("2d");let W=0,H=0,dpr=1;const ps=[];
  function rs(){dpr=Math.min(2,window.devicePixelRatio||1);W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr;c.style.width=innerWidth+"px";c.style.height=innerHeight+"px"}
  function np(init){return{x:Math.random()*W,y:init?Math.random()*H:H+10,v:(.15+Math.random()*.45)*dpr,r:(.6+Math.random()*1.5)*dpr,a:.15+Math.random()*.45,w:Math.random()*6.28}}
  rs();addEventListener("resize",rs);for(let i=0;i<24;i++)ps.push(np(true));
  (function tick(){if(!document.hidden){x.clearRect(0,0,W,H);
    ps.forEach((p,i)=>{p.y-=p.v;p.w+=.015;p.x+=Math.sin(p.w)*.25*dpr;if(p.y<-10)ps[i]=np(false);
      x.fillStyle=`rgba(255,${130+Math.floor(p.a*120)},60,${p.a})`;x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill()})}
    requestAnimationFrame(tick)})();
})();

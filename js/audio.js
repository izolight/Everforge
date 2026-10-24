// ================= AUDIO =================
// Synthesized sound effects (Web Audio only, no files). The preference lives in its own localStorage key, not in S, so saves never carry it. Every call is a safe no-op when audio is unavailable or not yet unlocked by a gesture.
const SND_KEY="everforge-sound",VOLS=[.35,.65,1],VOL_N=["Low","Medium","High"];
let snd={on:true,vol:1};try{const o=JSON.parse(localStorage.getItem(SND_KEY)||"null");if(isObj(o))snd={on:o.on!==false,vol:Math.max(0,Math.min(2,o.vol|0))}}catch(e){}
function sndSave(){try{localStorage.setItem(SND_KEY,JSON.stringify(snd))}catch(e){}}
let AC=null,master=null,noiseBuf=null,base=0,gesture=false;const lastAt={};
function actx(){
  if(AC)return AC;if(!gesture)return null;
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
    master=AC.createGain();const lp=AC.createBiquadFilter();lp.type="lowpass";lp.frequency.value=7000;master.connect(lp);lp.connect(AC.destination);master.gain.value=VOLS[snd.vol]*.8;
    noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){AC=null;gesture=false}
  return AC;
}
// one voice: source (oscillator or noise) -> optional filter -> envelope -> master. o: type, to (slide to Hz), g (gain), a (attack), at (start offset), f (filter type), hz (filter Hz), fto (filter slide)
function voice(d,o,src){
  const t=AC.currentTime+base+(o.at||0),g=AC.createGain();let n=src;
  if(o.f){const f=AC.createBiquadFilter();f.type=o.f;f.frequency.setValueAtTime(o.hz,t);if(o.fto)f.frequency.exponentialRampToValueAtTime(o.fto,t+d);n.connect(f);n=f}
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.g||.3,t+(o.a||.004));g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(g);g.connect(master);src.start(t);src.stop(t+d+.05);
}
function osc(fr,d,o){o=o||{};const s=AC.createOscillator();s.type=o.type||"sine";const t=AC.currentTime+base+(o.at||0);s.frequency.setValueAtTime(fr,t);if(o.to)s.frequency.exponentialRampToValueAtTime(o.to,t+d);voice(d,o,s)}
function noise(d,o){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;voice(d,{f:"lowpass",hz:1000,...o},s)}
const note=(fr,at,d,g,type)=>osc(fr,d||.3,{at,g:g||.12,type:type||"triangle",a:.01});
const thud=(at,fr,g)=>{osc(fr||140,.16,{at,to:50,g:g||.4,type:"triangle"});noise(.07,{at,hz:700,g:(g||.4)*.6})};
const ting=(fr,at,g)=>{osc(fr,.35,{at,g:g||.1});osc(fr*1.51,.22,{at,g:(g||.1)*.55})};
const SND={
  hit:()=>thud(0,170,.38),
  crit:()=>{thud(0,200,.45);ting(1180,.02,.12);ting(1760,.05,.06)},
  ouch:()=>{osc(120,.22,{to:55,g:.4,type:"sawtooth",f:"lowpass",hz:420});noise(.1,{hz:500,g:.3})},
  tick:()=>noise(.05,{f:"bandpass",hz:1800,g:.07}),
  block:()=>{ting(900,0,.13);noise(.04,{f:"highpass",hz:3000,g:.07})},
  dodge:()=>noise(.2,{f:"bandpass",hz:1400,fto:380,g:.13,a:.05}),
  parry:()=>{ting(1100,0,.14);ting(1650,.07,.1);thud(.03,150,.25)},
  heal:()=>{note(523,0,.28,.1,"sine");note(659,.08,.28,.1,"sine");note(784,.16,.4,.1,"sine")},
  status:()=>{osc(340,.35,{to:190,g:.14,type:"sawtooth",f:"lowpass",hz:600});noise(.2,{f:"bandpass",hz:2200,g:.08,at:.05})},
  warn:()=>osc(78,.7,{g:.22,a:.25,to:70}),
  win:()=>{thud(0,110,.3);[262,330,392,523].forEach((f,i)=>note(f,.12+i*.11,.4,.11))},
  lose:()=>{osc(196,1,{to:90,g:.2,type:"sawtooth",f:"lowpass",hz:480,a:.05});osc(147,1.2,{to:65,g:.16,type:"triangle",at:.15})},
  // forge: ingredients drop, hammer, sizzle while it melts (0.8s), a clang at the reveal (1.45s)
  forge:()=>{thud(.05,120,.3);thud(.5,150,.4);ting(1400,.52,.08);noise(.7,{f:"highpass",hz:2600,g:.1,at:.8,a:.15});osc(70,1.3,{g:.12,a:.4,at:.2});ting(980,1.45,.14)},
  legend:()=>{[392,523,659,784,1047].forEach((f,i)=>note(f,i*.1,.9,.1));ting(2093,.5,.07);noise(.9,{f:"highpass",hz:5000,g:.04,at:.3,a:.3})},
  level:()=>[392,523,659].forEach((f,i)=>note(f,i*.1,.35,.1)),
  loot:()=>{ting(880,0,.08);ting(1320,.07,.07)},
  ember:()=>{noise(.07,{f:"bandpass",hz:2800,g:.08});osc(1500,.08,{g:.04,at:.02})},
  tap:()=>osc(260,.04,{g:.035}),
  step:()=>{noise(.07,{hz:420,g:.1});osc(95,.08,{g:.1})},
};
const GAP={tick:.12,tap:.05,warn:.5,forge:1.5,legend:1,win:.8,lose:.8};
// play a sound, dl seconds from now; ignored if muted, locked, unsupported or the same sound played within its gap (stops multi-hit and DoT pile-ups)
function sfx(n,dl){
  if(!snd.on||!SND[n])return;
  try{const a=actx();if(!a)return;if(a.state==="suspended")a.resume();
    base=dl||0;const w=a.currentTime+base;if(w<(lastAt[n]||-1)+(GAP[n]||.06))return;lastAt[n]=w;SND[n]()}catch(e){}
}
function sndUi(){
  const b=$("snd");if(b){b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fill-opacity=".3"/>${snd.on?'<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>':'<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`;
    b.setAttribute("aria-pressed",String(snd.on));b.setAttribute("aria-label",snd.on?"Sound on":"Sound off");b.title=snd.on?"Sound on":"Sound off"}
  document.querySelectorAll("[data-vol]").forEach(x=>x.classList.toggle("sel",snd.on&&+x.dataset.vol===snd.vol));
}
function setSnd(o){Object.assign(snd,o);sndSave();if(master)master.gain.value=VOLS[snd.vol]*.8;sndUi()}
["pointerdown","keydown","touchend"].forEach(ev=>addEventListener(ev,()=>{gesture=true;if(snd.on){const a=actx();if(a&&a.state==="suspended")a.resume().catch(()=>{})}},{capture:true,passive:true}));
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="snd"){setSnd({on:!snd.on});if(snd.on)sfx("tap");return}
  if(b.dataset.vol){setSnd({on:true,vol:+b.dataset.vol});sfx("hit");return}
  if(!b.disabled&&!["atk","combine"].includes(b.id))sfx("tap")});
sndUi();

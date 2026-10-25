// ================= AUDIO =================
// Original Web Audio instruments. Preferences stay outside the game save; nothing
// plays until a gesture. The audio RNG never consumes a combat or daily-map roll.
const SND_KEY="everforge-sound",VOLS=[.35,.65,1],VOL_N=["Off","Low","Medium","High"];
let snd={on:true,vol:1,music:true,musicVol:0};
try{const o=JSON.parse(localStorage.getItem(SND_KEY)||"null");if(isObj(o))snd={on:o.on!==false,vol:Math.max(0,Math.min(2,o.vol|0)),music:typeof o.music==="boolean"?o.music:o.on!==false,musicVol:Math.max(0,Math.min(2,o.musicVol|0))}}catch(e){}
function sndSave(){try{localStorage.setItem(SND_KEY,JSON.stringify(snd))}catch(e){}}
let AC=null,master=null,fxBus=null,musicBus=null,musicDuck=null,noiseBuf=null,base=0,gesture=false;
const lastAt={},audioVoices=new Set();
let audioSeed=0x6e624eb7;
function audioRand(){audioSeed^=audioSeed<<13;audioSeed^=audioSeed>>>17;audioSeed^=audioSeed<<5;return(audioSeed>>>0)/4294967296}
function actx(){
  if(AC)return AC;if(!gesture)return null;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
    master=AC.createGain();master.gain.value=.85;
    const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=16;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.18;
    master.connect(comp);comp.connect(AC.destination);
    fxBus=AC.createGain();fxBus.gain.value=snd.on?VOLS[snd.vol]*.8:0;
    musicBus=AC.createGain();musicBus.gain.value=snd.music?VOLS[snd.musicVol]*.65:0;
    musicDuck=AC.createGain();musicBus.connect(musicDuck);
    const room=AC.createConvolver(),impulse=AC.createBuffer(2,Math.ceil(AC.sampleRate*1.6),AC.sampleRate);
    for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);let smooth=0;for(let i=0;i<d.length;i++){smooth=(smooth+(audioRand()*2-1))*.5;d[i]=smooth*Math.pow(1-i/d.length,3)*.4}}
    room.buffer=impulse;room.connect(master);
    [[fxBus,8200,.12],[musicDuck,4200,.3]].forEach(([bus,hz,wet])=>{
      const lp=AC.createBiquadFilter(),send=AC.createGain();lp.type="lowpass";lp.frequency.value=hz;send.gain.value=wet;
      bus.connect(lp);lp.connect(master);lp.connect(send);send.connect(room);
    });
    noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=audioRand()*2-1;
    AC.addEventListener("statechange",()=>{if(typeof syncMusic!=="function")return;if(AC.state==="running")syncMusic();else stopMusic()});
  }catch(e){if(AC)AC.close().catch(()=>{});AC=null;gesture=false}
  return AC;
}
// source -> optional filter/pan -> envelope -> effects or music bus. Explicit
// times let the music scheduler share these instruments without moving SFX time.
function voice(d,o,src){
  const bus=o.bus||fxBus;if(audioVoices.size>=128){src.disconnect();return}
  const t=o.time??AC.currentTime+base+(o.at||0),g=AC.createGain(),nodes=[src,g];let n=src;
  if(o.f){const f=AC.createBiquadFilter();f.type=o.f;f.frequency.setValueAtTime(o.hz,t);f.Q.value=o.q??.7;if(o.fto)f.frequency.exponentialRampToValueAtTime(o.fto,t+d);n.connect(f);n=f;nodes.push(f)}
  if(o.pan&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=o.pan;n.connect(p);n=p;nodes.push(p)}
  const a=Math.min(o.a??.004,d*.45),peak=o.g??.2;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak),t+a);
  if(o.hold)g.gain.setValueAtTime(Math.max(.0001,peak),t+Math.min(o.hold,d*.8));
  g.gain.exponentialRampToValueAtTime(.0001,t+d);
  n.connect(g);g.connect(bus);
  const v={src,g,bus};audioVoices.add(v);
  src.onended=()=>{nodes.forEach(n=>n.disconnect());audioVoices.delete(v)};
  if(src.buffer)src.start(t,audioRand()*.8);else src.start(t);src.stop(t+d+.03);
}
function osc(fr,d,o={}){
  const s=AC.createOscillator(),t=o.time??AC.currentTime+base+(o.at||0);s.type=o.type||"sine";s.frequency.setValueAtTime(fr,t);
  if(o.detune)s.detune.value=o.detune;if(o.to)s.frequency.exponentialRampToValueAtTime(o.to,t+d);voice(d,o,s);
}
function noise(d,o={}){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;voice(d,{f:"lowpass",hz:1000,...o},s)}
function holdAudio(param,t){const value=param.value;if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{param.cancelScheduledValues(t);param.setValueAtTime(value,t)}}
function fadeAudio(param,value,seconds=.035){const t=AC.currentTime;holdAudio(param,t);param.setTargetAtTime(value,t,seconds)}
function stopVoices(bus,fade=.04){
  if(!AC)return;const t=AC.currentTime;
  audioVoices.forEach(v=>{if(v.bus!==bus)return;holdAudio(v.g.gain,t);v.g.gain.setTargetAtTime(.0001,t,fade/4);try{v.src.stop(t+fade)}catch(e){}});
}
const note=(fr,at,d=.3,g=.1,type="triangle")=>osc(fr,d,{at,g,type,a:.01});
const thud=(at=0,fr=140,g=.3)=>{osc(fr,.19,{at,to:42,g,type:"triangle"});osc(fr*.5,.22,{at,to:34,g:g*.45});noise(.065,{at,hz:780,fto:180,g:g*.55})};
function ting(fr,at=0,g=.1){[1,2.76,4.07].forEach((r,i)=>osc(fr*r,.55/(1+i*.65),{at,g:g/[1,3.8,7][i],pan:(i-1)*.18}))}
function metal(fr,at=0,g=.13){noise(.035,{at,f:"highpass",hz:3600,g:g*.65});[1,1.483,2.137,3.61].forEach((r,i)=>osc(fr*r,.55/(1+i*.35),{at,g:g/(1+i*2.5),pan:i%2?.2:-.2}))}
function swoosh(at=0,g=.1){noise(.14,{at,f:"bandpass",hz:2900,fto:480,g,a:.025,pan:-.18})}
function weaponHit(heavy=false){
  const w=typeof gearOf==="function"?gearOf("main"):null,f=w&&w.form,pitch=.94+audioRand()*.12;
  if(f==="staff"){osc(420*pitch,.3,{to:145,g:.14,type:"triangle",f:"lowpass",hz:1700,pan:.15});ting(1046*pitch,.035,.06);noise(.12,{f:"bandpass",hz:2000,fto:600,g:.09});return}
  swoosh(0,heavy?.17:.1);thud(.035,(heavy?155:180)*pitch,heavy?.4:.25);
  if(["blade","spear","lance","spellblade","claws","warstaff"].includes(f))metal((heavy?470:650)*pitch,.035,heavy?.15:.08);
  if(f==="spellblade"||f==="warstaff")ting(784*pitch,.045,.055);
}
const SND={
  hit:()=>weaponHit(),
  crit:()=>{weaponHit(true);noise(.15,{f:"highpass",hz:2400,fto:600,g:.12,at:.035});metal(1175,.05,.09)},
  ouch:()=>{thud(0,95,.36);noise(.16,{hz:650,fto:120,g:.17});osc(88,.24,{to:44,g:.12,type:"sawtooth",f:"lowpass",hz:240})},
  tick:()=>{noise(.07,{f:"bandpass",hz:1600,g:.065});osc(185,.075,{to:140,g:.035})},
  block:()=>{thud(0,210,.16);metal(740,0,.105)},
  dodge:()=>swoosh(0,.16),
  parry:()=>{metal(880,0,.16);metal(1320,.065,.09);thud(.025,145,.23)},
  heal:()=>{[523.25,659.25,783.99].forEach((f,i)=>{note(f,i*.1,.6,.08,"sine");ting(f*2,i*.1,.025)});noise(.4,{f:"bandpass",hz:2400,g:.035,a:.12})},
  status:()=>{osc(310,.38,{to:165,g:.1,type:"sawtooth",f:"lowpass",hz:650});noise(.25,{f:"bandpass",hz:2100,fto:400,g:.085,at:.03})},
  warn:()=>{osc(73.42,.8,{g:.16,a:.18,to:65.41});osc(77.78,.7,{g:.06,a:.2,type:"triangle",f:"lowpass",hz:280});thud(.32,85,.12)},
  win:()=>{thud(0,110,.22);[293.66,349.23,440,587.33].forEach((f,i)=>{note(f,.1+i*.12,.75,.085);ting(f*2,.1+i*.12,.03)})},
  lose:()=>{[293.66,261.63,220,146.83].forEach((f,i)=>osc(f,.8,{at:i*.17,to:f*.985,g:.09,type:"triangle",f:"lowpass",hz:650,a:.04}));noise(.7,{hz:250,g:.09,a:.1})},
  // Match the ingredient drop, hammer, melt and 1.45-second reveal animation.
  forge:()=>{thud(.05,125,.24);metal(730,.055,.08);thud(.5,155,.38);metal(585,.505,.2);noise(.72,{f:"highpass",hz:2200,fto:900,g:.13,at:.78,a:.12});osc(62,1.1,{g:.12,a:.3,at:.25});metal(1175,1.45,.14);ting(1760,1.49,.07)},
  legend:()=>{[293.66,440,587.33,698.46,880,1174.66].forEach((f,i)=>{note(f,i*.11,1.25,.075);ting(f*2,i*.11,.025)});noise(.95,{f:"highpass",hz:4000,g:.045,at:.25,a:.28})},
  level:()=>[440,587.33,698.46,880].forEach((f,i)=>{note(f,i*.1,.5,.075);ting(f*2,i*.1,.02)}),
  loot:()=>{ting(1175,0,.075);ting(1760,.075,.06);noise(.04,{f:"highpass",hz:5000,g:.025})},
  unlock:()=>[587.33,880,1174.66].forEach((f,i)=>ting(f,i*.12,.085)),
  research:()=>{ting(1175,0,.07);ting(1760,.09,.055)},
  tech:()=>[523.25,659.25,783.99,1046.5].forEach((f,i)=>{note(f,i*.09,.5,.085,"sine");ting(f*2,i*.09,.02)}),
  ember:()=>{noise(.075,{f:"bandpass",hz:2700,g:.065});osc(1760,.12,{to:1175,g:.035,at:.025})},
  clang:()=>{thud(0,160,.16);metal(785,0,.14)},
  tap:()=>{osc(420,.045,{to:320,g:.035});noise(.018,{f:"bandpass",hz:2400,g:.018})},
  step:()=>{const grass=typeof S==="object"&&S.zone==="woods",p=.9+audioRand()*.2;noise(.09,{hz:grass?680:1200,fto:220,g:grass?.095:.08,pan:audioRand()*.3-.15});osc(82*p,.09,{to:55,g:.075});if(!grass)noise(.025,{f:"highpass",hz:2400,g:.045,at:.025})},
};
const GAP={research:.5,tech:.6,unlock:.6,tick:.12,tap:.05,step:.1,warn:.5,forge:1.5,legend:1,win:.8,lose:.8};
function sfx(n,dl){
  if(!snd.on||!SND[n]||document.hidden)return;
  try{const a=actx();if(!a)return;if(a.state!=="running")wakeAudio();
    base=Math.max(0,Number(dl)||0)+.012;const w=a.currentTime+base;if(w<(lastAt[n]??-Infinity)+(GAP[n]||.06))return;lastAt[n]=w;SND[n]();
    if(["forge","legend","win","lose","warn"].includes(n)&&musicDuck){const g=musicDuck.gain;g.cancelScheduledValues(w);g.setTargetAtTime(.5,w,.025);g.setTargetAtTime(1,w+(n==="forge"?1.8:.8),.25)}
  }catch(e){}
}
function sndUi(){
  const b=$("snd"),l=snd.on?snd.vol+1:0;
  if(b){b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fill-opacity=".3"/>${l?['<path d="M15 10a3 3 0 0 1 0 4"/>','<path d="M15 10a3 3 0 0 1 0 4M17.5 7.5a6.5 6.5 0 0 1 0 9"/>','<path d="M15 10a3 3 0 0 1 0 4M17.5 7.5a6.5 6.5 0 0 1 0 9M20 5a10 10 0 0 1 0 14"/>'][l-1]:'<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg>`;
    const label=tx("Sound effects: {vol}",{vol:tx(VOL_N[l])});b.setAttribute("aria-pressed",String(snd.on));b.setAttribute("aria-label",label);b.dataset.tip=label+"\n"+tx("Tap to change the volume.")}
  const m=$("music"),ml=snd.music?snd.musicVol+1:0;
  if(m){m.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="17.5" rx="3" ry="2.5" fill="currentColor" fill-opacity=".3"/><ellipse cx="17" cy="15.5" rx="3" ry="2.5" fill="currentColor" fill-opacity=".3"/>${ml?"":'<path d="M3 3l18 18"/>'}</svg><span class="audio-level" aria-hidden="true">${[1,2,3].map(i=>`<i${i<=ml?' class="on"':""}></i>`).join("")}</span>`;
    const label=tx("Music: {vol}",{vol:tx(VOL_N[ml])});m.setAttribute("aria-pressed",String(snd.music));m.setAttribute("aria-label",label);m.dataset.tip=label+"\n"+tx("Tap to change the volume.")+"\n"+tx("An original score that changes with your adventure.")}
}
function setSnd(o){
  Object.assign(snd,o);sndSave();
  if(AC){fadeAudio(fxBus.gain,snd.on?VOLS[snd.vol]*.8:0);fadeAudio(musicBus.gain,snd.music?VOLS[snd.musicVol]*.65:0);if(!snd.on)stopVoices(fxBus)}
  sndUi();if(typeof syncMusic==="function")syncMusic();
  if(AC&&!snd.on&&!snd.music)AC.suspend().catch(()=>{});else wakeAudio();
}
function wakeAudio(){
  if(!gesture||document.hidden||(!snd.on&&!snd.music))return;
  const a=actx();if(!a)return;
  if(a.state!=="running")a.resume().then(()=>{if(typeof syncMusic==="function")syncMusic()}).catch(()=>{});
  else if(typeof syncMusic==="function")syncMusic();
}
["pointerdown","keydown","touchend"].forEach(ev=>addEventListener(ev,()=>{gesture=true;wakeAudio()},{capture:true,passive:true}));
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){if(typeof stopMusic==="function")stopMusic();if(AC){stopVoices(fxBus);AC.suspend().catch(()=>{})}}
  else wakeAudio();
});
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="snd"||b.id==="music"){const music=b.id==="music",l=music?(snd.music?snd.musicVol+1:0):(snd.on?snd.vol+1:0),n=(l+1)%4;
    setSnd(music?{music:n>0,...(n?{musicVol:n-1}:{})}:{on:n>0,...(n?{vol:n-1}:{})});if(!music&&n)sfx("tap");return}
  if(!b.disabled&&b.getAttribute("aria-disabled")!=="true"&&!b.dataset.tile&&!b.dataset.ability&&!b.dataset.use&&!["atk","combine"].includes(b.id))sfx("tap");
});
sndUi();

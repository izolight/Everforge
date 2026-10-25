// ================= GENERATED SCORE =================
// "Embers on the Road": an original D-minor theme, composed in the browser.
// Eight-bar harmony, four answering motifs and restrained phrase variations keep
// it musical without an audio download, an external service or an endless drone.
const MUSIC_CHORDS=[[0,3,7,14],[-4,0,3,7],[-9,-5,0,7],[-2,2,5,12],[0,3,7,10],[-9,-5,0,7],[-7,-4,0,7],[-5,2,7,14]];
const MUSIC_MELODY=[
  [7,null,12,14,15,null,14,12],
  [10,null,7,null,3,7,null,10],
  [12,null,7,5,null,7,3,null],
  [2,null,5,7,14,null,12,null],
];
const MUSIC_SCENES={
  woods:{bpm:80,root:50,pad:1450,lead:"flute",space:1},
  pass:{bpm:76,root:50,pad:1000,lead:"bell",space:1},
  hollow:{bpm:80,root:45,pad:780,lead:"pluck",space:2},
  spire:{bpm:84,root:50,pad:2000,lead:"bell",space:1},
  forge:{bpm:84,root:50,pad:1250,lead:"pluck",space:1},
  battle:{bpm:108,root:50,pad:1650,lead:"pluck",space:1,drums:true},
  boss:{bpm:116,root:50,pad:2200,lead:"bell",space:1,drums:true,boss:true},
};
const musicState={timer:null,next:0,step:0,bar:0,scene:"",wanted:"",seed:0x3a8f27b1};
function musicRand(){let x=musicState.seed;x^=x<<13;x^=x>>>17;x^=x<<5;musicState.seed=x;return(x>>>0)/4294967296}
const midiHz=n=>440*Math.pow(2,(n-69)/12);
function musicScene(){
  if(typeof S!=="object"||!S)return "woods";
  if(S.battle&&!S.battle.over)return ENEMIES[S.battle.id].boss?"boss":"battle";
  return S.view==="forge"?"forge":MUSIC_SCENES[S.zone]?S.zone:"woods";
}
function musicTone(n,t,d,g,o={}){osc(midiHz(n),d,{time:t,bus:musicBus,g,...o})}
function musicPad(chord,t,bar,p){
  chord.forEach((n,i)=>{
    const o={type:"triangle",f:"lowpass",hz:p.pad,a:.35,hold:bar*.55,pan:(i-1.5)*.35};
    musicTone(p.root+n,t+i*.024,bar*1.24,.028,{...o,detune:i%2?4:-4});
    if(i===0||i===2)musicTone(p.root+n+12,t+.03,bar*1.3,.012,{...o,type:"sine",detune:i%2?-3:3});
  });
  musicTone(p.root+chord[0]-12,t,bar*.94,.095,{a:.045,hold:bar*.45,f:"lowpass",hz:380});
}
function musicLead(n,t,d,p,pan=0){
  if(p.lead==="bell"){
    musicTone(n,t,d*1.8,.075,{pan});musicTone(n+12,t,d,.017,{pan:-pan});
    osc(midiHz(n)*2.756,d*.55,{time:t,bus:musicBus,g:.012,pan});
  }else if(p.lead==="flute"){
    musicTone(n,t,d,.095,{a:.065,hold:d*.3,pan});musicTone(n+12,t,d*.75,.012,{a:.06,pan});
    noise(d*.65,{time:t,bus:musicBus,g:.009,a:.06,f:"bandpass",hz:midiHz(n)*2,pan});
  }else{
    musicTone(n,t,d,.09,{type:"triangle",a:.005,f:"lowpass",hz:2500,fto:650,pan});
    musicTone(n+12,t,d*.5,.018,{pan:-pan});
  }
}
function musicBeat(t,p,k,chord,bar){
  const beat=60/p.bpm,half=beat/2,root=p.root,phrase=Math.floor(bar/8);
  if(k===0)musicPad(chord,t,beat*4,p);
  // A quiet, moving harp sits between the lead phrases; alternate eight-bar
  // phrases leave more air. Combat introduces an eighth-note string ostinato.
  if(p.drums||p.lead==="pluck"||((k%2===1)&&phrase%2===1)){
    const n=chord[[0,2,1,2,0,3,2,1][k]];
    musicTone(root+n+12,t,half*1.8,p.drums?.055:.032,{type:"triangle",f:"lowpass",hz:p.drums?1900:1500,fto:550,pan:k%2?.3:-.3});
  }
  const motif=MUSIC_MELODY[bar%4],mel=motif[k],rest=bar%8===7&&k>3;
  if(mel!==null&&!rest&&k%p.space===0&&(!p.drums||k%2===0)){
    const variation=phrase%3===2&&bar%4===2?12:0;
    musicLead(root+12+mel+variation,t+.008+musicRand()*.012,beat*(p.drums?.8:1.2),p,(musicRand()-.5)*.4);
  }
  if(p.drums){
    if(k===0||k===4||(p.boss&&k===6)){
      osc(105,.24,{time:t,bus:musicBus,to:43,g:.17});noise(.06,{time:t,bus:musicBus,hz:450,g:.065});
    }
    if(k===2||k===6){noise(.13,{time:t,bus:musicBus,f:"bandpass",hz:1300,fto:650,g:.08,pan:.15});musicTone(root-5,t,.16,.06,{type:"triangle"})}
    if(k%2===1)noise(.045,{time:t,bus:musicBus,f:"highpass",hz:5200,g:p.boss?.033:.02,pan:-.25});
    if(k===0||k===4)musicTone(root+chord[0]-12,t,beat*1.7,.05,{type:"triangle",f:"lowpass",hz:500});
  }else if(p===MUSIC_SCENES.forge&&(k===0||k===4)){
    // A distant, tuned anvil and soft low pulse tie the workshop to its score.
    musicTone(root+19,t,.65,.023);osc(midiHz(root+19)*2.137,.28,{time:t,bus:musicBus,g:.008,pan:-.35});
    musicTone(root-12,t,.18,.065,{to:midiHz(root-24)});
  }
}
function scheduleMusic(){
  if(!AC||AC.state!=="running"||document.hidden||!snd.music){stopMusic();return}
  const m=musicState,now=AC.currentTime;
  if(m.next<now-.15){stopVoices(musicBus,.1);m.next=now+.06;m.step=0}
  while(m.next<now+.22){
    // Scene changes land on a bar line, keeping harmony and percussion together.
    if(m.step===0&&m.scene!==m.wanted){stopVoices(musicBus,.28);m.scene=m.wanted;m.bar=0}
    const p=MUSIC_SCENES[m.scene],chord=MUSIC_CHORDS[m.bar%8];
    musicBeat(m.next,p,m.step,chord,m.bar);m.next+=30/p.bpm;
    if(++m.step===8){m.step=0;m.bar++}
  }
}
function stopMusic(){
  if(musicState.timer!==null)clearInterval(musicState.timer);
  musicState.timer=null;musicState.scene="";musicState.next=0;musicState.step=0;
  if(AC){stopVoices(musicBus,.1);fadeAudio(musicDuck.gain,1)}
}
function syncMusic(){
  musicState.wanted=musicScene();
  if(!snd.music||document.hidden){if(musicState.timer!==null)stopMusic();return}
  if(!AC||AC.state!=="running"||musicState.timer!==null)return;
  musicState.next=AC.currentTime+.06;musicState.step=0;
  musicState.timer=setInterval(scheduleMusic,80);scheduleMusic();
}

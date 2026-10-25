#!/usr/bin/env node
// Real Web Audio regression checks, including rendered samples, not just mocks.
// Usage: node tools/audio-check.js [--preview /tmp/everforge-audio]
const {chromium}=require("playwright"),path=require("path"),fs=require("fs"),assert=require("assert/strict");
const URL="file://"+path.resolve(__dirname,"..","index.html");
const previewArg=process.argv.indexOf("--preview"),preview=previewArg<0?null:process.argv[previewArg+1];
if(previewArg>=0&&!preview)throw Error("--preview needs an output directory");
const ok=(v,m)=>{assert.ok(v,m);console.log("ok  "+m)};
(async()=>{
  const browser=await chromium.launch(),errors=[];
  try{
    const page=await browser.newPage({viewport:{width:360,height:800},reducedMotion:"reduce"});
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(URL);
    ok(await page.evaluate(()=>{sfx("hit");return AC===null&&musicState.timer===null}),"no AudioContext or music before a gesture");
    await page.locator("#music").click();
    await page.waitForFunction(()=>AC&&AC.state==="running"&&musicState.timer!==null);
    ok(await page.evaluate(()=>musicState.scene==="woods"&&audioVoices.size>0),"a real gesture starts generated music");
    await page.evaluate(()=>setSnd({on:false,music:true}));
    await page.waitForFunction(()=>fxBus.gain.value<.003);
    ok(await page.evaluate(()=>fxBus.gain.value<.005&&musicBus.gain.value>.05&&musicState.timer!==null),"effects can be muted while music continues");
    await page.evaluate(()=>setSnd({on:true,music:false}));
    await page.waitForFunction(()=>musicState.timer===null&&![...audioVoices].some(v=>v.bus===musicBus));
    ok(await page.evaluate(()=>musicState.timer===null&&![...audioVoices].some(v=>v.bus===musicBus)&&fxBus.gain.value>.1),"music can be muted while effects remain available");
    await page.evaluate(()=>{setSnd({music:true});go("forge")});
    await page.waitForFunction(()=>musicState.scene==="forge");
    await page.evaluate(()=>{S.battle=null;S.view="battle";S.zone="pass";syncMusic()});
    await page.waitForFunction(()=>musicState.scene==="pass");
    await page.evaluate(()=>startBattle("boar",{rar:"normal",afx:[]}));
    await page.waitForFunction(()=>musicState.scene==="battle");
    await page.evaluate(()=>startBattle(ZONES[0][2],{rar:"normal",afx:[]}));
    await page.waitForFunction(()=>musicState.scene==="boss");
    ok(true,"forge, region, battle and boss arrangements switch during playback");
    for(const zone of await page.evaluate(()=>ZONES.map(z=>z[0]))){
      await page.evaluate(z=>{S.battle=null;S.view="battle";S.zone=z;syncMusic()},zone);
      await page.waitForFunction(z=>musicState.scene===z,zone);
    }
    ok(true,"travelling between regions switches to each region's own track");
    ok(await page.evaluate(()=>{
      const scenes=Object.values(MUSIC_SCENES),pieces=scenes.map(p=>JSON.stringify([p.chords,p.melody]));
      return ZONES.every(([z])=>MUSIC_SCENES[z])&&new Set(pieces).size===scenes.length&&
        scenes.every(p=>p.chords.length===8&&p.chords.every(c=>c.length===4)&&8%p.melody.length===0&&p.melody.every(m=>m.length===8));
    }),"every region, the forge, battles and bosses have their own eight-bar composition");
    const timer=await page.evaluate(()=>{const timer=musicState.timer;for(let i=0;i<20;i++)syncMusic();return timer===musicState.timer});
    ok(timer,"repeated renders keep a single scheduler");
    await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))});
    await page.waitForFunction(()=>AC.state==="suspended"&&musicState.timer===null);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))});
    await page.waitForFunction(()=>AC.state==="running"&&musicState.timer!==null);
    ok(true,"hiding the tab suspends audio; returning resumes it");
    await page.evaluate(()=>{setSnd({on:false,music:false});sfx("forge")});
    await page.waitForFunction(()=>AC.state==="suspended");
    await page.evaluate(()=>setSnd({on:true,vol:0,music:true,musicVol:2}));
    await page.waitForFunction(()=>AC.state==="running");
    ok(true,"muting both channels suspends the context and enabling a channel resumes it");
    await page.reload();
    ok(await page.evaluate(()=>snd.on&&snd.vol===0&&snd.music&&snd.musicVol===2&&AC===null),"independent volume preferences survive reload without autoplay");
    const musicLevels=[];
    for(let i=0;i<4;i++){
      await page.locator("#music").click();
      musicLevels.push(await page.locator("#music").getAttribute("aria-label"));
    }
    ok(new Set(musicLevels).size===4,"music button cycles all four volume levels");
    const effectsLevels=[];
    for(let i=0;i<4;i++){
      await page.locator("#snd").click();
      effectsLevels.push(await page.locator("#snd").getAttribute("aria-label"));
    }
    ok(new Set(effectsLevels).size===4,"effects button cycles all four volume levels");
    for(const lang of ["en","de","ko"]){
      await page.evaluate(l=>setLang(l),lang);
      for(const width of [320,360,720]){
        await page.setViewportSize({width,height:800});
        ok(await page.evaluate(()=>{
          const a=$("snd").getBoundingClientRect(),b=$("music").getBoundingClientRect(),title=document.querySelector("h1").getBoundingClientRect();
          return a.width>=36&&b.width>=36&&a.left>=b.right&&b.left>=title.right&&a.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth;
        }),`${lang} audio controls fit a ${width}px viewport`);
      }
    }
    await page.evaluate(()=>localStorage.setItem(SND_KEY,JSON.stringify({on:false,vol:1})));
    await page.reload();
    ok(await page.evaluate(()=>!snd.on&&!snd.music&&AC===null),"an older muted preference also mutes new music");
    await page.evaluate(()=>localStorage.setItem(SND_KEY,"broken json"));await page.reload();
    ok(await page.evaluate(()=>snd.on&&snd.music&&snd.musicVol===0),"malformed preferences recover to quiet defaults");
    // Effects must not perturb any seeded/unseeded gameplay randomness.
    await page.evaluate(()=>{
      const random=Math.random;Math.random=()=>{throw Error("audio consumed a game roll")};
      try{gesture=true;actx();SND.hit();SND.step();Object.values(MUSIC_SCENES).forEach(p=>{for(let k=0;k<8;k++)musicBeat(AC.currentTime+.1,p,k,p.chords[0],0)})}finally{Math.random=random}
    });
    ok(true,"audio synthesis does not use gameplay's Math.random");
    const cues=await page.evaluate(()=>{
      const original=sfx,seen=[];sfx=(n,d,o)=>seen.push({n,d,o});
      try{fxQ=[];fx("enemyHud","-5","",{el:"fire",form:"staff"});fx("enemyHud","miss","");fx("enemyHud","ward","");fx("youHud","","shake",{el:"ice"});flushFx();return seen}finally{sfx=original}
    });
    ok(cues.map(c=>c.n).join(",")==="hit,dodge,block,ouch","strikes, misses, wards and hits on you play their own cues");
    ok(cues[0].o?.el==="fire"&&cues[0].o?.form==="staff"&&cues[3].o?.el==="ice","strike and hurt cues carry their weapon form and element");
    await page.close();

    const unsupported=await browser.newPage();unsupported.on("pageerror",e=>errors.push(e.message));
    await unsupported.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined});
    await unsupported.goto(URL);await unsupported.locator("#music").click();await unsupported.locator("#snd").click();
    ok(await unsupported.evaluate(()=>{sfx("forge");go("forge");return AC===null&&S.view==="forge"}),"unsupported Web Audio leaves the game and controls usable");
    await unsupported.close();

    // OfflineAudioContext uses Chromium's real oscillators, envelopes, filters,
    // convolution and compressor. Render every cue and a full eight-bar phrase
    // of every arrangement, checking for silence, clipping, NaNs and leaked tails.
    const renderPage=await browser.newPage();renderPage.on("pageerror",e=>errors.push(e.message));await renderPage.goto(URL);
    const rendered=await renderPage.evaluate(async wantWav=>{
      syncMusic=()=>{};stopMusic=()=>{};gesture=true;snd.on=true;snd.vol=2;snd.music=true;snd.musicVol=2;
      const out=[],rate=22050;
      function wav(b){
        const data=new ArrayBuffer(44+b.length*4),v=new DataView(data),str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
        str(0,"RIFF");v.setUint32(4,36+b.length*4,true);str(8,"WAVE");str(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);v.setUint32(28,rate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,"data");v.setUint32(40,b.length*4,true);
        for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<d.length;i++)v.setInt16(44+i*4+ch*2,Math.round(Math.max(-1,Math.min(1,d[i]))*32767),true)}
        let s="";const bytes=new Uint8Array(data);for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);
      }
      async function render(name,scene,opt,label){
        const p=MUSIC_SCENES[name],bar=p?240/p.bpm:0,seconds=scene?bar*8+3:4;
        window.AudioContext=function(){return new OfflineAudioContext(2,Math.ceil(rate*seconds),rate)};
        AC=null;audioVoices.clear();base=.05;actx();const ctx=AC,pauses=[];
        if(scene){
          const schedule=b=>{for(let k=0;k<8;k++)musicBeat(.05+b*bar+k*bar/8,p,k,p.chords[b%p.chords.length],b)};
          schedule(0);
          for(let b=1;b<8;b++)pauses.push(ctx.suspend(b*bar-.05).then(()=>{schedule(b);return ctx.resume()}));
        }else SND[name](opt);
        const result=ctx.startRendering();await Promise.all(pauses);const b=await result;
        let peak=0,energy=0,tail=0,finite=true,stereo=0;
        for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<d.length;i++){finite=finite&&Number.isFinite(d[i]);peak=Math.max(peak,Math.abs(d[i]));energy+=d[i]*d[i];if(i>d.length-rate*.1)tail+=d[i]*d[i]}}
        const left=b.getChannelData(0),right=b.getChannelData(1);for(let i=0;i<b.length;i++)stereo+=Math.abs(left[i]-right[i]);
        out.push({name:(scene?"music-":"sfx-")+(label||name),peak,rms:Math.sqrt(energy/(b.length*2)),tail:Math.sqrt(tail/(rate*.2)),finite,stereo:stereo/b.length,voices:audioVoices.size,wav:wantWav?wav(b):null});
      }
      for(const name of Object.keys(SND))await render(name,false);
      for(const form of ["blade","spear","staff","lance","spellblade","warstaff","claws","shield"])await render("ability",false,{form},"ability-"+form);
      for(const el of ["fire","ice","poison","holy","shadow","arcane"]){
        await render("hit",false,{el,form:"staff"},"hit-"+el);
        await render("crit",false,{el,form:"claws"},"crit-"+el);
        await render("status",false,{el},"status-"+el);
      }
      for(const el of ["fire","ice","poison","holy","shadow","arcane","wood","metal","stone","swift"]){
        await render("ouch",false,{el},"ouch-"+el);
        await render("tick",false,{el},"tick-"+el);
      }
      for(const name of Object.keys(MUSIC_SCENES))await render(name,true);
      return out;
    },!!preview);
    for(const r of rendered){
      ok(r.finite&&r.peak>.0005&&r.peak<.95&&r.tail<.001&&r.voices===0,`${r.name}: audible, no clipping, finite samples, clean release (peak ${r.peak.toFixed(3)})`);
      if(r.name.startsWith("music-"))ok(r.stereo>.0001,`${r.name}: stereo arrangement`);
      if(preview){fs.mkdirSync(preview,{recursive:true});fs.writeFileSync(path.join(preview,r.name+".wav"),Buffer.from(r.wav,"base64"))}
    }
    ok(errors.length===0,"no browser errors: "+errors.join("; "));
    console.log("AUDIO CHECK OK"+(preview?" · previews in "+preview:""));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

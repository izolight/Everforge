#!/usr/bin/env node
// Targeted check of the affix system (Playwright + Chromium): every affix's HUD chip, hook and essence drop, splitting and volatile deaths, drop grades, roll rules, daily determinism and the v12 -> v13 migration.
// Usage: node tools/affix-check.js   (prints ok/FAIL lines and ALL OK; exits 1 on a failure)
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log("FAIL",m)}else console.log("ok  ",m)};
(async()=>{
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/fonts|net::/.test(m.text()))errs.push(m.text())});
  await p.goto(URL);
  const E=(f,a)=>p.evaluate(f,a);
  const {AFX_T,EMB}=await E(()=>({AFX_T,EMB}));
  // helpers inside the page
  await E(()=>{
    window.R=(v,fn)=>{const r=Math.random;Math.random=typeof v==="function"?v:()=>v;try{return fn()}finally{Math.random=r}};
    window.fresh=(zone="woods")=>{S=freshState();S.zone=zone;S.unlocked=ZONES.map(z=>z[0]);S.maps[zone]=genMap({heat:0,zone});S.hp=pstats().maxHp};
    window.fight=(e,afx,rar="magic",row=3)=>{S.battle=null;S.hp=pstats().maxHp;startBattle(e,{row,rar,afx});return S.battle};
    window.logs=B=>B.log.map(l=>l.t);
    window.plainRand=()=>.5;
  });
  // ---- 1. every affix: HUD chip, name, essence drop
  for(const a of await E(()=>Object.keys(AFX))){
    await E(a=>{fresh("pass");window.B1=fight("wolf",[a])},a);
    await p.waitForTimeout(20);
    const r=await E(a=>{const B=window.B1;const chip=document.querySelector("#enemyHud .chips.afx .chip");const out={tip:chip.dataset.tip,aria:chip.getAttribute("aria-label"),nm:document.querySelector("#enemyHud .fn").textContent,n:document.querySelectorAll("#enemyHud .chips.afx .chip").length,tr:AFX[a].tr,an:AFX[a].n};
      let g=0;R(.5,()=>{while(S.battle===B&&!B.over&&g++<200){S.hp=pstats().maxHp;B.turn>40&&(B.hp=1);attack()}});
      out.over=B.over;out.ess=B.loot.filter(isEss);return out},a);
    ok(r.n===1&&r.tip.split("\n")[0]===r.an&&r.tip.includes(r.tr+" Essence"),`${a}: one chip, tip names the affix and its ${r.tr} Essence`);
    ok(r.nm.includes("Frost Wolf")&&r.aria&&r.aria.includes(r.tr),`${a}: HUD name "${r.nm}" and an aria-label`);
    ok(r.over==="won"&&r.ess.some(id=>essTraitOf(id)===r.tr),`${a}: won and dropped a ${r.tr} essence (${r.ess.join(",")})`);
  }
  function essTraitOf(id){return id.slice(4).replace(/@.*/,"")}
  // ---- 2. hooks
  let r;
  r=await E(()=>{fresh();const B=fight("bandit",["vamp"]);B.hp=Math.round(B.max/2);const h0=B.hp;R(.5,()=>enemyTurn());return{h0,h1:B.hp,lg:logs(B).some(t=>/drinks in/.test(t))}});
  ok(r.lg&&r.h1>r.h0,`vampiric heals (${r.h0} -> ${r.h1}) and logs`);
  r=await E(()=>{fresh();const B=fight("bandit",["thorn"]);const h=S.hp;R(.5,()=>strike(null,30,"Test blow",false));const lost=h-S.hp;S.hp=1;R(.5,()=>strike(null,30,"Test blow",false));return{lost,cap:Math.round(pstats().maxHp*AFX_T.thorn.cap),lg:logs(B).some(t=>/thorns bite/.test(t)),still:S.hp}});
  ok(r.lg&&r.lost>=1&&r.lost<=r.cap&&r.still===1,`thorned reflects ${r.lost} (cap ${r.cap}) and never kills (hp ${r.still})`);
  r=await E(()=>{fresh();const B=fight("bandit",["regen"]);B.hp=Math.round(B.max/2);const h0=B.hp;R(.5,()=>enemyTurn());return{h0,h1:B.hp,exp:Math.round(B.max*AFX_T.regen),lg:logs(B).some(t=>/regrows/.test(t))}});
  ok(r.lg&&r.h1-r.h0===r.exp,`regenerating heals ${r.h1-r.h0} (= ${r.exp})`);
  r=await E(()=>{fresh();const B=fight("bandit",["frenzy"]);const a0=B.atk;B.hp=Math.floor(B.max*AFX_T.frenzy.at)+3;R(.5,()=>strike(null,16,"Test blow",false));const a1=B.atk;R(.5,()=>strike(null,16,"Test blow",false));return{a0,a1,a2:B.atk,lg:logs(B).filter(t=>/frenzy/.test(t)).length,hp:B.hp,max:B.max}});
  ok(r.lg===1&&r.a1===Math.round(r.a0*AFX_T.frenzy.x)&&r.a2===r.a1,`frenzied: atk ${r.a0} -> ${r.a1}, once, log line ${r.lg}`);
  r=await E(()=>{fresh();const B=fight("bandit",["ward"]);const w0=B.wd,h0=B.hp;const chip=document.querySelector("#enemyHud .chips.afx .chip b").textContent;
    R(.5,()=>strike(null,40,"Test blow",false));const afterHit=B.wd;const hpLoss=h0-B.hp;
    R(.5,()=>strike(null,4000,"Test blow",false));const broke=B.wd===0&&B.wb===B.turn;
    // ward returns `every` turns after it breaks (enemyTurn only ticks while the foe lives)
    B.hp=B.max;const t0=B.turn;let back=0;for(let i=0;i<6&&!back;i++){R(.5,()=>{S.hp=pstats().maxHp;enemyTurn()});if(B.wd>0)back=B.turn-t0}
    return{w0,exp:Math.round(B.max*AFX_T.ward.x),chip,afterHit,hpLoss,broke,back,lg:logs(B)}});
  ok(r.chip==String(r.w0)&&r.w0===r.exp&&r.afterHit<r.w0,`warded: shield ${r.w0} shown on the HUD (${r.chip}), absorbs`);
  ok(r.lg.some(t=>/ward absorbs/.test(t))&&r.lg.some(t=>/shatters/.test(t))&&r.broke,"warded: absorb and shatter log lines");
  ok(r.back===AFX_T.ward.every+1&&r.lg.some(t=>/flares back/.test(t)),`warded: ward is down for ${AFX_T.ward.every} of our attacks, back in the enemy phase of turn +${AFX_T.ward.every}`);
  // elusive
  r=await E(()=>{fresh();S.eq.main=null;const B=fight("bandit",["elusive"]);const d0=dodgeNow(B);const chip0=document.querySelector("#enemyHud .chips.afx .chip b").textContent;
    // sharp weapon
    S.items.t_sh={id:"t_sh",name:"Test Blade",form:"blade",noun:"Blade",traits:{Sharp:2},tier:1,crafted:true};addItem("t_sh");equip("t_sh","main");const d1=dodgeNow(B);
    S.items.t_sh.traits.Sharp=20;const d1b=dodgeNow(B);S.items.t_sh.traits.Sharp=2;
    R(.5,()=>study());const d2=dodgeNow(B);R(.5,()=>study());R(.5,()=>study());R(.5,()=>study());const d3=dodgeNow(B);
    const hp0=B.hp;R(0,()=>strike(S.items.t_sh,100,"Test blow",true));const slipped=B.hp===hp0&&logs(B).some(t=>/slips aside/.test(t));
    const hp1=B.hp;R(.99,()=>strike(S.items.t_sh,100,"Test blow",true));
    return{d0,chip0,d1,d1b,d2,d3,slipped,hit:B.hp<hp1,sty:B.sty}});
  ok(r.d0===AFX_T.dodge.base&&r.chip0===r.d0+"%",`elusive: base dodge ${r.d0}% shown (${r.chip0})`);
  ok(r.d1===r.d0-2*AFX_T.dodge.sharp,`elusive: Sharp 2 lowers it to ${r.d1}%`);
  ok(r.d1b===r.d0-AFX_T.dodge.sharpCap,`elusive: Sharp cap -> ${r.d1b}%`);
  ok(r.d2===r.d1-AFX_T.dodge.study&&r.d3===r.d1-AFX_T.dodge.study*AFX_T.dodge.studyMax&&r.sty===AFX_T.dodge.studyMax,`elusive: each Study lowers it (${r.d1} -> ${r.d2} -> ${r.d3}, capped at ${r.sty} uses)`);
  ok(r.slipped&&r.hit,"elusive: a low roll slips aside ('It slips aside.'), a high roll lands");
  // splitting
  r=await E(()=>{fresh();const B=fight("bandit",["split"]);const max0=B.max,atk0=B.atk;B.hp=1;R(.5,()=>attack());
    const mid={split:B.split,over:B.over,hp:B.hp,max:B.max,name:B.name,atk:B.atk,chips:document.querySelectorAll("#enemyHud .chips.afx .chip").length,el:B.el};
    const exp={hp:Math.max(1,Math.round(max0*AFX_T.split.hp)),atk:Math.max(1,Math.round(atk0*AFX_T.split.atk))};
    const t0=B.turn;let g=0;R(.5,()=>{while(S.battle===B&&!B.over&&g++<50){S.hp=pstats().maxHp;B.hp=Math.min(B.hp,1);attack()}});
    return{mid,exp,over:B.over,splits:logs(B).filter(t=>/splits in two/.test(t)).length,ess:B.loot.filter(isEss),kills:S.kills.bandit,turns:B.turn-t0}});
  ok(r.mid.split&&!r.mid.over&&r.mid.hp===r.exp.hp&&r.mid.atk===r.exp.atk&&/remnant/.test(r.mid.name)&&r.mid.chips===0,`splitting: remnant ${r.mid.hp} HP, atk ${r.mid.atk}, no affix chips (${r.mid.name})`);
  ok(r.over==="won"&&r.splits===1&&r.kills===1&&r.turns<5,`splitting: only one split, then won in ${r.turns} turns (kills=${r.kills})`);
  ok(r.ess.some(id=>essTraitOf(id)==="Water"),"splitting: drops Water essence only after the remnant dies");
  // volatile: survive, die, guard
  const boom=(hp,fn)=>E(([hp,fn])=>{fresh();const B=fight("bandit",["boom"]);S.hp=hp===100?pstats().maxHp:hp;const hp0=S.hp;B.hp=1;const blast=blastOf(B);const dBefore=S.stats.deaths;R(.5,()=>{if(fn==="guard"){B.burn={d:99,t:3};guard()}else attack()});
    return{blast,hp0,hp:S.hp,over:B.over,loot:B.loot.length,deaths:S.stats.deaths-dBefore,lg:logs(B),kills:S.kills.bandit||0,max:pstats().maxHp,wins:S.wins}},[hp,fn]);
  r=await boom(100);
  ok(r.over==="won"&&r.hp===r.hp0-r.blast&&r.loot>0&&r.lg.some(t=>/blast hits you for/.test(t)),`volatile: survive the blast (-${r.blast}), then win with loot`);
  r=await boom(3);
  ok(r.over==="lost"&&r.deaths===1&&r.loot===0&&r.kills===0&&r.lg.some(t=>/tears through you/.test(t))&&r.hp>0&&r.wins===0,`volatile: dying to the blast is a defeat (no loot, no kill), you wake with ${r.hp} HP`);
  r=await boom(100,"guard");
  ok(r.over==="won"&&r.hp===r.hp0-Math.round(r.blast*AFX_T.boom.guard)&&r.lg.some(t=>/through your guard/.test(t)),`volatile: Guard cuts the blast (${r.hp0-r.hp} instead of ${r.blast})`);
  r=await E(()=>{fresh();const B=fight("bandit",["boom"]);const row=()=>document.querySelector(".intent .chips,.intent");const none=!/Blast/.test(document.querySelector(".intent").innerHTML.replace(/<[^>]+data-tip="Blast/,"Blast"))&&!document.querySelector('.intent [data-tip^="Blast"]');
    B.hp=Math.floor(B.max*AFX_T.boom.warn);render();const tip=document.querySelector('.intent [data-tip^="Blast"]');return{none,tip:tip&&tip.dataset.tip}});
  ok(r.none&&r.tip&&/Guard/.test(r.tip),"volatile: the NEXT row shows the blast only when it is low (tip mentions Guard)");
  // swift-footed battle follow-up
  r=await E(()=>{fresh("pass");const B=fight("wolf",["swiftfoot"]);const a0=ENEMIES.wolf.atk;R(.01,()=>enemyTurn());return{lg:logs(B).some(t=>/follows up swiftly/.test(t)),hits:logs(B).filter(t=>/bites for/.test(t)).length,atkOk:B.atk>Math.round(ENEMIES.wolf.atk*1.0*(1+0)*1.35*0.99)}});
  ok(r.lg&&r.hits===2,`swift-footed: quick follow-up hit (${r.hits} hits)`);
  // swift-footed on the map: two tiles per step, legal tiles, contact
  r=await E(()=>{fresh("pass");const z="pass",m=genMap({heat:0,zone:z});m.pois=m.pois.filter(p=>p.t==="boss"||p.t==="camp"||(p.x===m.gate.x&&p.y===m.gate.y));S.maps[z]=m;
    let pl,en,found=false;for(let y=4;y<m.h&&!found;y++)for(let x=0;x<m.w&&!found;x++){if(!walk(m,x,y)||fixed(m,x,y)||m.d[y*m.w+x]<6)continue;const d=bfs(m,x,y,(mm,a,b)=>!hard(mm,a,b));
      for(let b=0;b<m.h&&!found;b++)for(let a=0;a<m.w;a++)if(d[b*m.w+a]===4&&!hard(m,a,b)){pl=[x,y];en=[a,b];found=true;break}}
    const e=Object.keys(ENEMIES).find(k=>ENEMIES[k].zone===z&&ENEMIES[k].mv==="chase");
    const mk=(af)=>({t:"fight",x:en[0],y:en[1],r:2,done:false,e,mv:"chase",rar:"magic",afx:af,aw:1});
    const run=(af)=>{const mm=JSON.parse(JSON.stringify(m));mm.pois.push(mk(af));S.maps[z]=mm;mm.pos={x:pl[0],y:pl[1]};mm.prev=null;mm.steps=5;reveal(mm);S.battle=null;
      const p=mm.pois[mm.pois.length-1],d0=bfs(mm,pl[0],pl[1])[p.y*mm.w+p.x];
      // tap a tile that moves us, not towards the enemy: the first free neighbour that is not the enemy's tile
      const nb=adjTiles(mm).find(([x,y])=>!(x===p.x&&y===p.y));const before=[p.x,p.y];R(.5,()=>step(...nb));
      const moved=Math.abs(p.x-before[0])+Math.abs(p.y-before[1]);const bad=!walk(mm,p.x,p.y)||fixed(mm,p.x,p.y)||mm.pois.some(q=>q!==p&&q.x===p.x&&q.y===p.y&&!q.done);
      return{moved,bad,contact:!!S.battle,by:S.battle&&S.battle.by}};
    return{plain:run([]),swift:run(["swiftfoot"]),d:null}});
  ok(r.plain.moved<=1&&r.swift.moved>=1&&(r.swift.moved===2||r.swift.contact)&&!r.plain.bad&&!r.swift.bad,`swift-footed on the map: normal moved ${r.plain.moved}, swift moved ${r.swift.moved} (contact ${r.swift.contact}), tiles legal`);
  // a still species never rolls swift-footed
  r=await E(()=>{let bad=0;for(let i=0;i<500;i++){const a=rollAfx(Math.random,"rare",{mv:"still",heat:4});if(a.includes("swiftfoot"))bad++}let good=0;for(let i=0;i<500;i++)if(rollAfx(Math.random,"magic",{mv:"chase",heat:0}).includes("swiftfoot"))good++;return{bad,good}});
  ok(r.bad===0&&r.good>0,`swiftfoot: never on still species (${r.bad}), rolled on movers (${r.good}/500)`);
  // ---- 3. rolls: compatibility, counts, chances
  r=await E(()=>{let viol=0,n2=0,n3=0,bad3=0;const ids=Object.keys(AFX);for(let i=0;i<4000;i++){const h=i%2?4:2,a=rollAfx(Math.random,"rare",{mv:"chase",heat:h});if(a.length!==(h>=4?3:2))bad3++;for(const x of a)for(const y of a)if(x!==y&&!afxOk(x,y))viol++;if(new Set(a).size!==a.length)viol++}
    const f={magic:0,rare:0,normal:0};for(let i=0;i<20000;i++)f[rollFoe(Math.random,{elite:true,heat:2,row:3,mv:"chase"}).rar]++;
    const g={magic:0,normal:0};for(let i=0;i<20000;i++)g[rollFoe(Math.random,{elite:false,heat:3,row:3,mv:"chase"}).rar]++;const z=rollFoe(Math.random,{elite:false,heat:1,row:3,mv:"chase"});
    return{viol,bad3,rareShare:f.rare/20000,exp:rareCh(2,3),fm:g.magic/20000,expm:magicCh(3),z,h0:magicCh(0),h1:magicCh(1),cap:rareCh(5,5)}});
  ok(r.viol===0&&r.bad3===0,"rolls: no conflicting or duplicate affixes; rares carry 2 (3 from Heat 4)");
  ok(Math.abs(r.rareShare-r.exp)<.02&&Math.abs(r.fm-r.expm)<.02&&r.h0===0&&r.h1===0&&r.cap<=.6,`rolls: elite rare share ${r.rareShare.toFixed(3)} (exp ${r.exp.toFixed(2)}), fight magic share at Heat 3 ${r.fm.toFixed(3)} (exp ${r.expm}), cap ${r.cap}`);
  // ---- 4. grades: one step per magic, two per rare, capped by the zone table
  r=await E(()=>{const avg=(z,up)=>{let s=0,mx=0;for(let i=0;i<4000;i++){const g=rollGrade(z,0,undefined,up);s+=g;mx=Math.max(mx,g)}return[s/4000,mx]};return{w0:avg("woods",0),w1:avg("woods",1),w2:avg("woods",2),s2:avg("spire",2),p2:avg("pass",2)}});
  ok(r.w1[0]>r.w0[0]+.6&&r.w2[0]>r.w1[0]&&r.w2[1]===4&&r.p2[1]===4&&r.s2[1]===5,`grades: woods avg ${r.w0[0].toFixed(2)} -> ${r.w1[0].toFixed(2)} (magic) -> ${r.w2[0].toFixed(2)} (rare), capped at ${r.w2[1]} in woods/pass, ${r.s2[1]} in spire`);
  // real drop through enemyDown: rare, 2 affixes -> 2 essences
  r=await E(()=>{fresh("pass");const B=fight("wolf",["shadow","vamp"],"rare");B.hp=1;R(.5,()=>attack());return{ess:B.loot.filter(isEss),emb:B.emb,over:B.over,rar:B.rar,name:document.querySelector("#enemyHud .fn").textContent}});
  ok(r.over==="won"&&r.ess.length===2&&r.emb>=EMB.rar.rare&&/the Bloodthirsty/.test(r.name),`rare drop: ${r.ess.join(",")} and ${r.emb} embers; name "${r.name}"`);
  // ---- 5. daily determinism: two different Math.random streams, same map affixes and rarities, same dark ambush
  r=await E(()=>{const mul=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const run=(sd)=>{Math.random=mul(sd);const out=[];for(const tw of [null,"elites"]){const m=genMap({seed:20260101,heat:4,zone:"hollow",twist:tw});out.push(JSON.stringify(m.pois.filter(p=>p.rar!=null).map(p=>[p.x,p.y,p.t,p.e,p.rar,p.afx])))}
      S=freshState();S.zone="hollow";const m=genMap({seed:777,heat:5,zone:"hollow"});S.maps.hollow=m;S.run=null;m.torch=0;const amb=[];
      for(let k=0;k<30;k++){S.battle=null;S.event=null;m.steps=k+1;const t0=m.steps;
        const ra=rng(hash(m.seed+":a:"+m.steps));if(ra()<TORCH.amb){const e=pickEnemy("hollow",ra),f=rollFoe(ra,{elite:false,heat:5,row:3,mv:ENEMIES[e].mv});amb.push([e,f.rar,f.afx])}}
      out.push(JSON.stringify(amb));return out};
    const a=run(1),b=run(99999);Math.random=Math.random;const n=JSON.parse(a[0]).length,r=JSON.parse(a[0]).filter(x=>x[4]==="rare").length,mg=JSON.parse(a[0]).filter(x=>x[4]==="magic").length;
    return{same:JSON.stringify(a)===JSON.stringify(b),n,r,mg,amb:JSON.parse(a[2]).length}});
  ok(r.same&&r.n>5&&r.r+r.mg>0,`daily determinism: ${r.n} rolled POIs (${r.mg} magic, ${r.r} rare) and ${r.amb} dark ambushes identical under two Math.random streams`);
  // a full seeded map compared whole (every field, incl. pois), plus step() ambush through the real function
  r=await E(()=>{const mul=a=>()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    const run=sd=>{Math.random=mul(sd);const m=genMap({seed:4242,heat:3,zone:"pass"});S=freshState();S.zone="pass";S.maps.pass=m;m.torch=0;const seen=[];
      for(let k=0;k<60;k++){const nb=adjTiles(m);if(!nb.length||busy())break;const t=nb.find(([x,y])=>{const q=poiAt(m,x,y);return !q||q.done})||nb[0];step(...t);if(S.battle){seen.push([S.battle.rar,S.battle.afx,S.battle.id,S.battle.name]);if(!S.battle.over)S.battle.over="fled";S.battle=null}if(S.event)S.event=null}
      return JSON.stringify([m.pois.map(p=>[p.x,p.y,p.rar,p.afx]),seen])};
    const a=run(5),b=run(8);return{same:a===b,len:a.length}});
  ok(r.same,"daily determinism: a walked seeded map meets the same rarities and affixes");
  // ---- 6. save migration
  const fx=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures","save-v12.json"),"utf8"));
  const sv=JSON.parse(fx.save);
  // synthetic v12: an open elite battle plus old up/af on map POIs
  const zone="pass";const bt={id:"wolf",name:"Umbral Frost Wolf",el:"shadow",hp:60,max:115,atk:19,def:4,weak:["fire"],resist:["ice","shadow"],turn:3,burn:null,poison:0,bleed:null,stun:0,open:false,cd:{},you:{},off:0,parry:false,shred:0,ward:null,frozen:false,guard:false,reborn:false,phased:false,elite:"Shadow",log:[{t:"old",c:""}],over:null,loot:[],heat:0};
  sv.zone=zone;sv.battle=bt;sv.hp=60;sv.view="battle";
  const mp=sv.maps.pass;const fi=mp.pois.findIndex(q=>q.t==="fight"),ei=mp.pois.findIndex(q=>q.t==="elite");mp.pois[fi].up=true;mp.pois[fi].af=3;mp.pois[ei].af=4;
  const pg=await b.newPage({viewport:{width:390,height:844}});const perrs=[];pg.on("pageerror",e=>perrs.push(e.message));
  await pg.goto(URL);await pg.evaluate(([k,s])=>{localStorage.clear();localStorage.setItem("everforge-v12",s)},[fx.key,JSON.stringify(sv)]);await pg.reload();
  r=await pg.evaluate(([fi,ei])=>{const m=S.maps.pass;const f=m.pois[fi],e=m.pois[ei];const B=S.battle;const out={v:S.v,key:KEY,afxState:typeof S.afx,fo:[f.rar,f.afx,f.up,f.af],el:[e.rar,e.afx,e.up,e.af],b:[B.rar,B.afx,B.elite],stored:!!localStorage.getItem("everforge-v13")||true};
    // the old battle finishes
    let g=0;R=(v,fn)=>{const r=Math.random;Math.random=()=>v;try{return fn()}finally{Math.random=r}};R(.5,()=>{while(S.battle===B&&!B.over&&g++<100){S.hp=pstats().maxHp;attack()}});
    out.over=B.over;out.ess=B.loot.filter(isEss);out.emb=B.emb;out.hud=null;render();
    const bad=Object.values(S.maps).some(m=>m.pois.some(p=>p.up!==undefined||p.af!==undefined));out.bad=bad;return out},[fi,ei]);
  ok(r.v===13&&r.key==="everforge-v13","migration: v12 -> v13");
  ok(r.fo[0]==="magic"&&r.fo[1][0]==="holy"&&r.fo[2]===undefined&&r.fo[3]===undefined,`migration: fight up:true af:3 -> magic ${r.fo[1]}`);
  ok(r.el[0]==="magic"&&r.el[1][0]==="shadow","migration: elite af:4 -> magic Umbral (shadow)");
  ok(r.b[0]==="magic"&&r.b[1][0]==="shadow"&&r.b[2]===undefined,"migration: the open elite battle keeps its affix");
  ok(r.over==="won"&&r.ess.some(id=>essTraitOf(id)==="Shadow")&&!r.bad,`migration: old battle finishes (${r.over}), drops Shadow essence, no up/af left`);
  ok(perrs.length===0,"migration: no page errors "+perrs.join("|"));
  // plain v12 fixture loads too
  const pg2=await b.newPage();const e2=[];pg2.on("pageerror",e=>e2.push(e.message));await pg2.goto(URL);await pg2.evaluate(([k,s])=>{localStorage.clear();localStorage.setItem(k,s)},[fx.key,fx.save]);await pg2.reload();
  r=await pg2.evaluate(()=>({v:S.v,afx:S.afx,pois:Object.values(S.maps).reduce((n,m)=>n+m.pois.length,0)}));
  ok(r.v===13&&typeof r.afx==="object"&&e2.length===0,"migration: the v12 fixture loads (S.afx ready)");
  ok(errs.length===0,"no page errors in the main page: "+errs.join("|"));
  await b.close();
  console.log(fails?`${fails} FAILED`:"ALL OK");process.exit(fails?1:0);
})();

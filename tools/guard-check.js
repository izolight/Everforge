#!/usr/bin/env node
// Targeted Guard/Parry regression checks through the real game in Chromium.
// Usage: node tools/guard-check.js (requires Playwright + Chromium, like smoke.js).
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;
const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
const near=(a,b)=>Math.abs(a-b)<1e-9;
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));
    await p.goto(URL);
    const E=(f,a)=>p.evaluate(f,a);
    const setup=()=>E(()=>{
      window.R=(v,fn)=>{const r=Math.random;Math.random=()=>v;try{return fn()}finally{Math.random=r}};
      window.fresh=(id="boar")=>{
        S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));
        UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);
        S.zone=ENEMIES[id].zone;S.maps[S.zone]=genMap({zone:S.zone,heat:0});S.unlocked=ZONES.map(z=>z[0]);
        Object.keys(S.eq).forEach(s=>S.eq[s]=null);S.hp=pstats().maxHp;
        startBattle(id,{rar:"normal",afx:[]});return S.battle;
      };
      window.weapon=(id,form,traits={})=>{
        S.items[id]={id,name:"Test weapon",form,noun:"Weapon",traits,tier:1,crafted:true};S.inv[id]=1;return S.items[id];
      };
      window.prepareAttack=(form="blade",off=false)=>{
        const B=fresh();S.eq.main=weapon("test_main",form,{Iron:50,Swift:20}).id;
        if(off)S.eq.off=weapon("test_off","blade",{Iron:50}).id;
        B.max=B.hp=10000;B.atk=0;B.def=0;B.log=[];return B;
      };
      window.playerDamage=B=>B.log.filter(l=>l.c==="you"||l.c==="big").map(l=>/for (\d+)/.exec(l.t)).filter(Boolean).map(m=>+m[1]);
    });
    await setup();
    let r=await E(()=>{
      const B=fresh(),P={spd:0,main:null},base=parryChance(B,P);
      cx(B.id).sp=true;const known=parryChance(B,P);
      cx(B.id).timing={sp:3};const trained=parryChance(B,P);
      const light=parryChance(B,{spd:0,main:{form:"blade"}}),heavy=parryChance(B,{spd:0,main:{form:"lance"}});
      const cap=parryChance(B,{spd:1000,main:{form:"spellblade"}});
      B.off=1;return{base,known,trained,light,heavy,cap,off:parryChance(B,P)};
    });
    ok(near(r.base,.65)&&near(r.known,.7)&&near(r.trained,.8),`parry: 65% base, 70% known, 80% trained (${JSON.stringify(r)})`);
    ok(near(r.light,.85)&&near(r.heavy,.75)&&near(r.cap,.9)&&r.off===0,"weapon form, capped speed bonus and off-balance affect parry chance");
    r=await E(()=>{
      const B=fresh("harpy");B.turn=ENEMIES.harpy.sp.every;B.atk=20;
      const h=S.hp;R(.5,()=>guard());
      return{lost:h-S.hp,expected:4*Math.round(20*.55*.4),status:Object.keys(B.you),braced:B.braced,guard:B.guard};
    });
    ok(r.lost===r.expected&&r.status.length===0&&r.braced&&!r.guard,`guard cuts every multi-hit, blocks chill, grants Braced (${r.lost} damage)`);
    r=await E(()=>{
      const B=fresh("imp");B.atk=1;B.you.burn={t:3,d:4};const h=S.hp;
      R(.5,()=>guard());return{lost:h-S.hp,burn:B.you.burn,braced:B.braced};
    });
    ok(r.lost===5&&r.burn.d===4&&r.burn.t===2&&r.braced,"guard blocks new statuses but existing burn still ticks");
    r=await E(()=>{
      const out=[];
      for(const [id,status] of [["imp","burn"],["wolf","chill"],["witch","poison"],["acolyte","curse"]]){
        const B=fresh(id),P=pstats();B.guard=true;R(0,()=>inflict(B,P,true));out.push(!B.you[status]);
        B.guard=false;R(0,()=>inflict(B,P,true));out.push(!!B.you[status]);
      }
      return out;
    });
    ok(r.every(Boolean),"guard prevents each new status; the same unguarded hit can inflict it");
    r=await E(()=>{
      const B=fresh();B.off=1;B.atk=1;R(.5,()=>guard());
      return{braced:!!B.braced,off:B.off,log:B.log.some(l=>/guard falters/.test(l.t))};
    });
    ok(!r.braced&&r.log,"an off-balance guard fails and grants no Braced bonus");
    for(const action of ["attack","blade","shield"]){
      r=await E(action=>{
        const run=braced=>{
          const B=prepareAttack("blade",action==="attack");
          if(action==="shield")S.eq.off=weapon("test_shield","shield",{Iron:50}).id;
          B.braced=braced;R(.2,()=>action==="attack"?attack():ability(action));
          return{hits:playerDamage(B),braced:!!B.braced};
        };
        return{plain:run(false),boost:run(true)};
      },action);
      ok(r.plain.hits.length>0&&r.plain.hits.length===r.boost.hits.length&&r.plain.hits.every((n,i)=>r.boost.hits[i]>n&&Math.abs(r.boost.hits[i]-n*1.3)<=1)&&!r.boost.braced,
        `Braced boosts the entire ${action} action once (${r.plain.hits} -> ${r.boost.hits})`);
      if(action==="attack")ok(r.boost.hits.length===3,"normal attack includes a swift follow-up and off-hand strike in the same Braced action");
    }
    r=await E(()=>{
      const B=prepareAttack();B.braced=true;R(.5,()=>strike(pstats().main,100,"Direct",true));
      const direct=playerDamage(B)[0],kept=B.braced;B.braced=false;B.log=[];R(.5,()=>strike(pstats().main,100,"Direct",true));
      return{direct,plain:playerDamage(B)[0],kept};
    });
    ok(r.kept&&r.direct===r.plain,"a direct strike/riposte does not receive or consume Braced");
    r=await E(()=>{
      const B=fresh("boar");B.atk=0;B.braced=true;S.inv.bread=2;
      R(.5,()=>useItem("bread"));const kept=B.braced;
      R(.5,()=>guard());const one=B.braced;R(.5,()=>guard());
      const repeated=B.braced;B.turn=ENEMIES.boar.sp.every;R(0,()=>parry());
      return{kept,one,repeated,afterParry:B.braced};
    });
    ok(r.kept&&r.one===true&&r.repeated===true&&r.afterParry,"consumables, repeated guards and parry preserve a single Braced bonus");
    r=await E(()=>{
      const run=delta=>{
        const B=fresh();B.max=B.hp=1000;B.atk=1;B.turn=ENEMIES[B.id].sp.every;const ch=parryChance(B);
        R(ch+delta,()=>parry());return{parries:S.stats.parries,off:B.off};
      };
      return{success:run(-.0001),fail:run(.0001)};
    });
    ok(r.success.parries===1&&r.success.off===0&&r.fail.parries===0&&r.fail.off===1,"parry success/failure uses the displayed chance boundary and failure leaves off balance");
    r=await E(()=>{
      const B=fresh("witch");B.hp=Math.round(B.max/2);B.turn=ENEMIES.witch.sp.every;
      const hp=B.hp;R(0,()=>parry());return{hp,after:B.hp,off:B.off,known:cx("witch").sp};
    });
    ok(r.after===r.hp&&r.off===0&&r.known,"a successful parry interrupts an enemy heal");
    r=await E(()=>{
      const B=fresh("archon");B.atk=0;B.max=B.hp=10000;
      const levels=[];for(let i=0;i<5;i++){R(.5,()=>study());levels.push(parryLevel(B))}
      const first=cx(B.id).timing.sp;B.phased=true;B.spEvery=ENEMIES.archon.phase.to.sp.every;
      const secondBefore=parryLevel(B);R(.5,()=>study());
      const second=parryLevel(B);B.braced=true;save();
      return{levels,first,secondBefore,second,timing:cx(B.id).timing,key:KEY};
    });
    ok(r.levels.at(-1)===3&&r.levels.every(n=>n>=1&&n<=3)&&r.first===3,"Study trains special timing persistently and caps at three ranks");
    ok(r.secondBefore===0&&r.second>=1&&r.timing.sp===3,"a boss's second-form special has separate training");
    await p.reload();
    await setup(); // the page is fresh: the helpers are gone
    r=await E(()=>({timing:cx("archon").timing,level:parryLevel(S.battle),braced:S.battle.braced,phase:S.battle.phased}));
    ok(r.timing.sp===3&&r.level>=1&&r.braced&&r.phase,"reload preserves special training, current boss form and Braced");
    r=await E(()=>{
      const old=freshState();old.codex.boar={weak:[],resist:[],drops:[],sp:true,stats:false};S=loadSave(old);
      startBattle("boar",{rar:"normal",afx:[]});const level=parryLevel(S.battle);render();
      return{level,button:document.querySelector("#parry")?.textContent};
    });
    ok(r.level===1,"an existing save with a known special starts at training rank one");
    r=await E(()=>{
      S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));const B=S.battle;
      const K=cx(B.id),En=ENEMIES[B.id];K.weak=[...En.weak];K.resist=[...En.resist];K.stats=true;K.sp=true;
      K.timing={sp:1};render();const enabled=!document.querySelector("#study").hasAttribute("aria-disabled");
      const normal=document.querySelector("#parry").textContent,expected=Math.round(parryChance(B)*100)+"%";
      B.off=1;render();return{enabled,normal,expected,off:document.querySelector("#parry").textContent};
    });
    ok(r.enabled,"Study stays available after all facts are known while timing can improve");
    ok(r.normal.includes(r.expected)&&r.off.includes("0%"),"parry button always shows the current percentage, including off-balance 0%");
    r=await E(()=>{
      const B=fresh("sprite");B.max=B.hp=1000;B.def=0;
      weapon("t_main","blade",{Iron:1});S.eq.main="t_main";weapon("t_sh","shield",{Brittle:1});S.eq.off="t_sh";
      const P=pstats(),def=statsOf(P.shield).def,pow=P.atk*ABILITIES.shield.x+def,before=B.hp;
      R(.5,()=>ability("shield"));
      return{pow,def,atk:P.atk,before,after:B.hp,finite:Number.isFinite(B.hp),logs:B.log.map(l=>l.t)};
    });
    ok(r.pow<=0&&r.finite&&r.after>0&&r.after<r.before,`a brittle shield bash (power ${r.pow}, shield DEF ${r.def}) never makes NaN and still lands a hit (${r.before} -> ${r.after})`);
    ok(errs.length===0,"no page errors: "+errs.join(" | "));
  }finally{await browser.close()}
  console.log(fails?`${fails} FAILED`:"ALL OK");process.exitCode=fails?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});

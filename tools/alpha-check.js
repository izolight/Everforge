// V-16 authored-region alpha invariants and map marker (requires Playwright + Chromium).
const {chromium}=require("playwright"),path=require("path");
const URL="file://"+path.resolve(__dirname,"..","index.html");
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log(c?"ok  ":"FAIL",m)};
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errs=[];
    p.on("pageerror",e=>errs.push(e.message));await p.goto(URL);await p.waitForFunction(()=>typeof S==="object"&&typeof genRoster==="function");
    const r=await p.evaluate(()=>{
      const zones=Object.keys(GEN_T).sort(),rows={};let deterministic=true,drawSafe=true,affixes=true,names=true,rewards=true,unchanged=true;
      for(const zone of zones){
        const old=Math.random;Math.random=()=>{throw Error("authored roster used ambient Math.random")};
        let a,b;try{a=genRoster(zone);b=genRoster(zone)}finally{Math.random=old}
        deterministic=deterministic&&JSON.stringify(a)===JSON.stringify(b);
        const alphaAt=a.findIndex(e=>e.alpha),label=WILD_ALPHA[zone];delete WILD_ALPHA[zone];const base=genRoster(zone);WILD_ALPHA[zone]=label;
        unchanged=unchanged&&alphaAt>=0&&a.every((e,i)=>i===alphaAt?e.id===base[i].id&&e.hp===Math.round(base[i].hp*1.3)&&e.atk===Math.round(base[i].atk*1.1)&&e.def===base[i].def+2&&e.w===base[i].w&&JSON.stringify(e.drops)===JSON.stringify(base[i].drops):JSON.stringify(e)===JSON.stringify(base[i]));
        const alphas=a.filter(e=>e.alpha);drawSafe=drawSafe&&a.length===GEN_N;
        const E=alphas[0],unique=E&&new Set(E.afx).size===3&&E.afx.every((x,i)=>E.afx.slice(i+1).every(y=>afxOk(x,y)));
        affixes=affixes&&alphas.length===1&&E.rar==="rare"&&unique&&JSON.stringify(E.afx)===JSON.stringify(WILD_ALPHA_AFX[zone]);
        names=names&&!!E&&E.name.endsWith(" Alpha");
        rewards=rewards&&!!E&&E.gen===1&&Array.isArray(E.drops)&&E.drops.length>0&&speciesAfx(E)?.afx.length===3;
        rows[zone]={size:a.length,alpha:E&&E.id,name:E&&E.name,affixes:E&&E.afx,hp:E&&E.hp,atk:E&&E.atk,drops:E&&E.drops.length};
      }
      names=names&&new Set(Object.values(rows).map(x=>x.name)).size===zones.length;
      return{zones,rows,rosterSize:GEN_N,deterministic,drawSafe,affixes,names,rewards,unchanged};
    });
    ok(r.zones.length===4&&r.drawSafe&&Object.values(r.rows).every(x=>x.size===r.rosterSize),"exactly four authored rosters; alpha promotion preserves roster size");
    ok(r.deterministic,"authored alpha selection and affixes repeat without ambient RNG");
    ok(r.unchanged,"alpha promotion leaves all other entries and base generation draws unchanged; boosts HP/Attack/Defense by the authored mini-boss band");
    ok(r.affixes,"one rare alpha per roster has exactly three mutually compatible affixes");
    ok(r.names,"each promoted creature has a stable authored alpha name");
    ok(r.rewards,"alphas keep their generated regional drops and use intrinsic affixes (no essence reward path)");
    const combat=await p.evaluate(()=>{
      const rows={};for(const zone of Object.keys(GEN_T)){const roster=genRoster(zone);regMon(roster);const E=roster.find(e=>e.alpha);
        S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));S.zone=zone;S.unlocked=ZONES.map(z=>z[0]);S.hp=pstats().maxHp;
        startBattle(E.id,{row:3,rar:"normal",afx:[]});const B=S.battle;rows[zone]={rar:B.rar,afx:[...B.afx],intr:B.intr,boss:!!E.boss,max:B.max,base:E.hp,band0:m12WildBand(E,0),bandStage:m12WildBand(E,99)};S.battle=null;
      }return rows;
    });
    ok(Object.values(combat).every(x=>x.rar==="rare"&&x.afx.length===3&&x.intr&&!x.boss&&x.max>x.base),"battle forces the fixed three-affix rare species profile, keeps intrinsic/no-essence rewards, and leaves alphas out of the Rift-master path");
    ok(Object.entries(combat).every(([z,x])=>x.band0.hp===1&&x.bandStage.hp===(z==="woods"?4.5:2)),"M-12 tutorial and stage-kit wild bands remain intact for alpha foes");
    const art=await p.evaluate(()=>{
      const zone="woods",roster=genRoster(zone);regMon(roster);const E=roster.find(e=>e.alpha),m=genMap({zone,heat:0,seed:713});
      const n=m.pois.find(p=>p.t==="fight"||p.t==="elite");n.e=E.id;Object.assign(n,speciesAfx(E));
      S=freshState();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));S.zone=zone;S.unlocked=ZONES.map(z=>z[0]);S.maps[zone]=m;m.sn.fill(1);const near=[[n.x+1,n.y],[n.x-1,n.y],[n.x,n.y+1],[n.x,n.y-1]].find(([x,y])=>walk(m,x,y));m.pos={x:near[0],y:near[1]};
      const host=document.createElement("div");host.id="v16-alpha-mobile-review";host.innerHTML=mapHtml();document.body.append(host);
      document.querySelectorAll(".toast,[role=alert]").forEach(e=>e.remove());
      const cell=host.querySelector(".tl.alpha");return{found:!!cell,marker:!!cell?.querySelector(".alpha-mark"),width:cell&&Math.round(cell.getBoundingClientRect().width),height:cell&&Math.round(cell.getBoundingClientRect().height),label:cell&&cell.getAttribute("aria-label")};
    });
    ok(art.found&&art.marker&&art.width<=48&&art.height<=48,"alpha uses a visible star and distinct frame on a mobile size tile");
    await p.locator("#v16-alpha-mobile-review").screenshot({path:path.resolve(__dirname,"../art-evidence/v16-alpha-map-mobile.png")});
    ok(!errs.length,"no browser errors: "+errs.join("; "));
    console.log(JSON.stringify({rows:r.rows,combat,mobile:art},null,2));
  }finally{await browser.close()}
  process.exitCode=fails?1:0;
})();

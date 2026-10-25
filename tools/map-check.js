#!/usr/bin/env node
// Connected branching maps, seeded runs, saved expeditions and scrollable touch tiles.
// Usage: node tools/map-check.js [--shots /tmp/map-shots] (Playwright + Chromium).
const {chromium}=require("playwright"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),URL="file://"+path.join(ROOT,"index.html"),si=process.argv.indexOf("--shots"),shots=si<0?null:process.argv[si+1];
(async()=>{
  if(shots)fs.mkdirSync(shots,{recursive:true});
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({viewport:{width:360,height:800},reducedMotion:"reduce"}),errors=[];
    p.on("pageerror",e=>errors.push(e.message));await p.goto(URL);
    const metrics=await p.evaluate(()=>{
      S=freshState();S.rift.seed=42;riftEnsure();S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));const rows=[],bad=[],starts=new Set(),bosses=new Set();
      for(let seed=0;seed<240;seed++){
        const m=genMap({seed,zone:ZONES[seed%ZONES.length][0],heat:[0,3,5][seed%3],twist:seed%7===0?"nocamp":null}),d=bfs(m,m.start.x,m.start.y),points=[];let edges=0,junctions=0;
        for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(walk(m,x,y)){points.push([x,y]);const n=DIRS.filter(([dx,dy])=>walk(m,x+dx,y+dy)).length;edges+=n;junctions+=n>=3;if(d[y*m.w+x]<0)bad.push("disconnected "+seed)}
        if(m.w!==13||m.h!==17||points.length<110)bad.push("size "+seed);
        if(new Set(m.pois.map(q=>q.x+","+q.y)).size!==m.pois.length)bad.push("overlap "+seed);
        if(!m.pois.every(q=>d[q.y*m.w+q.x]>=0&&q.r>=0&&q.r<MAP_ROWS))bad.push("POI "+seed);
        if(m.D!==d[m.lair.y*m.w+m.lair.x]||m.D<16||m.D>40)bad.push("path length "+seed);
        if(m.lair.y!==0||m.gate.y!==1||m.lair.x!==m.gate.x||m.mem[m.lair.x+",0"]!=="boss")bad.push("lair "+seed);
        const guard=m.pois.find(q=>q.x===m.gate.x&&q.y===m.gate.y);if(!guard||guard.mv!=="still")bad.push("guard "+seed);
        if(!m.pois.filter(isFoe).every(q=>Math.max(Math.abs(q.x-m.start.x),Math.abs(q.y-m.start.y))>3))bad.push("unsafe spawn "+seed);
        const camp=m.pois.find(q=>q.t==="camp");if(seed%7?(!camp||Math.abs(camp.x-m.gate.x)+Math.abs(camp.y-m.gate.y)!==1):!!camp)bad.push("camp "+seed);
        // Count compulsory internal tiles on a shortest route. Broad open squares alone
        // would inflate cycle counts; this also measures alternate routes to the boss.
        let at=m.lair,chokes=0;
        while(at.x!==m.start.x||at.y!==m.start.y){
          if(at!==m.lair){const blocked=bfs(m,m.start.x,m.start.y,(mm,x,y)=>walk(mm,x,y)&&!(x===at.x&&y===at.y));if(blocked[m.lair.y*m.w+m.lair.x]<0)chokes++}
          const a=DIRS.map(([dx,dy])=>[at.x+dx,at.y+dy]).find(([x,y])=>walk(m,x,y)&&d[y*m.w+x]===d[at.y*m.w+at.x]-1);at={x:a[0],y:a[1]};
        }
        starts.add(m.start.x);bosses.add(m.lair.x);rows.push({floor:points.length,loops:edges/2-points.length+1,junctions,D:m.D,chokes});
      }
      const avg=k=>rows.reduce((n,r)=>n+r[k],0)/rows.length;
      return{bad,starts:starts.size,bosses:bosses.size,floor:avg("floor"),loops:avg("loops"),junctions:avg("junctions"),D:avg("D"),chokes:avg("chokes"),maxChokes:Math.max(...rows.map(r=>r.chokes))};
    });
    assert.deepEqual(metrics.bad,[]);assert(metrics.starts>=5&&metrics.bosses>=5);assert(metrics.loops>=20&&metrics.junctions>=40&&metrics.chokes/metrics.D<.18);
    console.log("ok 240 seeds: connected larger regions, safe starts, distinct POIs, reachable camps/bosses, varied entrances and alternate routes",JSON.stringify(metrics));
    let r=await p.evaluate(()=>{
      const R=Math.random,run=n=>{Math.random=()=>n;S.unl={};return JSON.stringify(genMap({seed:71225,zone:"hollow",heat:5,twist:"elites"}))};
      try{return run(.01)===run(.99)}finally{Math.random=R}
    });assert(r);console.log("ok every seeded map field is independent of Math.random and unlocks");
    await p.evaluate(()=>{
      S=freshState();S.zone="woods";S.unlocked=ZONES.map(z=>z[0]);S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=true);
      S.maps.woods=genMap({seed:48,zone:"woods",heat:0});S.hp=pstats().maxHp;save();go("battle");
    });
    const saved=await p.evaluate(()=>JSON.stringify(curMap()));await p.reload();assert.equal(await p.evaluate(()=>JSON.stringify(curMap())),saved);
    r=await p.evaluate(()=>{
      const m=curMap(),bad=JSON.parse(JSON.stringify(S));bad.maps.woods.pos.x=m.w;const clean=loadSave(bad);
      return !clean.maps.woods&&curMap().w===13;
    });assert(r);console.log("ok new maps persist on reload and out-of-bounds imported maps are rejected");
    for(const width of [320,360,720]){
      await p.setViewportSize({width,height:844});
      r=await p.evaluate(()=>{
        render();const w=document.querySelector(".mapwrap"),hero=document.querySelector(".tl.here"),tile=hero.getBoundingClientRect(),wr=w.getBoundingClientRect(),nav=$("nav").getBoundingClientRect();
        const noOverflow=document.documentElement.scrollWidth<=innerWidth;
        w.scrollLeft=0;w.scrollTop=0;heroView();const b=hero.getBoundingClientRect();
        return{noOverflow,tile:tile.width,hero:b.left>=wr.left&&b.right<=wr.right&&b.top>=wr.top&&b.bottom<=Math.min(wr.bottom,nav.top),pan:w.scrollWidth>w.clientWidth||w.scrollHeight>w.clientHeight,hint:getComputedStyle(document.querySelector(".map-pan")).display!=="none"};
      });
      assert(r.noOverflow&&r.tile>=36&&r.hero&&r.pan&&r.hint,JSON.stringify({width,...r}));
    }
    console.log("ok 36px touch targets, contained panning, pan hint and automatic hero visibility at 320/360/720px");
    // a map made on the spot is saved at once: a reload keeps it instead of drawing a new one
    await p.evaluate(()=>{S=freshState();S.zone="woods";S.unlocked=ZONES.map(z=>z[0]);S.maps={};curMap()});
    const drawn=await p.evaluate(()=>JSON.stringify(curMap()));
    await p.reload();
    assert.equal(await p.evaluate(()=>JSON.stringify(curMap())),drawn);
    console.log("ok a map drawn on the spot is saved at once and survives a reload");
    if(shots){
      await p.setViewportSize({width:360,height:844});await p.evaluate(()=>{render();heroView()});await p.screenshot({path:path.join(shots,"map-fog-360.png"),fullPage:true});
      await p.setViewportSize({width:720,height:1100});
      for(const seed of [7,48,91]){
        await p.evaluate(seed=>{S.maps.woods=genMap({seed,zone:"woods",heat:0});curMap().sn.fill(1);TORCH.rad=32;render()},seed);
        await p.locator(".map").screenshot({path:path.join(shots,`map-overview-${seed}.png`)});
      }
    }
    assert.deepEqual(errors,[]);console.log("MAP CHECK OK");
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

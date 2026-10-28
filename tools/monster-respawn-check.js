#!/usr/bin/env node
// Regular map foes return after 30 map steps when their tile is dark and clear.
const {chromium}=require("playwright"),path=require("path"),assert=require("node:assert/strict");
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"}),errors=[];
 page.on("pageerror",e=>errors.push(e.message));await page.goto("file://"+path.resolve(__dirname,"../index.html"));
 const out=await page.evaluate(()=>{
   S=freshState();S.onboarding=null;S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));S.zone="woods";S.unlocked=ZONES.map(z=>z[0]);
   let m=genMap({seed:48,zone:"woods",heat:0});S.maps.woods=m;S.hp=pstats().maxHp;
   const n=m.pois.find(p=>p.t==="fight"),ni=m.pois.indexOf(n);n.afx=[];Object.assign(n,{done:true,rd:30,st:{hp:2},aw:1,dz:3,pa:1});
   // A victory on a regular map fight stores the deadline on its node.
   m.pos={...m.start};enter(n);S.battle.hp=1;enemyDown();const deadline=n.rd,originalIdentity=JSON.stringify({e:n.e,rar:n.rar,afx:n.afx,mv:n.mv});
   // Exercise respawn directly at exact boundary in darkness.
   m.steps=deadline-1;m.pos={x:m.start.x,y:m.start.y};m.torch=0;reveal(m);
   step(m.pos.x,m.pos.y);const invalid=m.steps===deadline-1&&n.done;
   const early=respawnFoes(m).has(n);m.steps=deadline;m.pos={x:m.start.x,y:m.start.y};m.torch=0;reveal(m);
   const at=respawnFoes(m).has(n),identity={e:n.e,rar:n.rar,afx:n.afx,mv:n.mv},clean=!n.done&&!n.rd&&!n.st&&!n.aw&&!n.dz&&!n.pa&&!n.ms;
   // Exercise the real empty-step hook at the exact threshold; the revived mover waits until next step.
   const oldmv=n.mv;n.done=true;n.rd=m.steps+1;n.mv="chase";m.pos={...m.start};m.steps=n.rd-1;m.torch=1;
   const far=[];for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(walk(m,x,y)&&!m.pois.some(q=>q.x===x&&q.y===y)&&Math.max(Math.abs(x-m.start.x),Math.abs(y-m.start.y))>TORCH.dim+2)far.push([x,y]);
   n.x=far[0][0];n.y=far[0][1];const move=adjTiles(m).find(([x,y])=>!m.pois.some(q=>q.x===x&&q.y===y));
   const oldPos=[n.x,n.y],amb=TORCH.amb;TORCH.amb=0;step(...move);TORCH.amb=amb;const throughStep=!n.done&&!Number.isFinite(n.rd),waited=n.x===oldPos[0]&&n.y===oldPos[1];n.mv=oldmv;
   // A returned foe starts at full health and pays normal rewards again.
   S.battle=null;enter(n);const full=S.battle.hp===S.battle.max,k0=S.kills[n.e]||0,w0=S.wins;enemyDown();
   const rewarded=(S.kills[n.e]||0)===k0+1&&S.wins===w0+1&&S.battle.loot.length>0&&n.rd===m.steps+FOE_RESPAWN_STEPS;
   // Re-deadline for each exclusion: light, player, any POI, map cleared, daily, elite, missing legacy deadline.
   const excluded=kind=>{n.done=true;n.rd=m.steps;n.x=m.start.x+2;n.y=m.start.y-2;m.cleared=false;S.run="normal";
     if(kind==="lit")m.torch=m.tmax;else m.torch=0;
     if(kind==="player")n.x=m.pos.x,n.y=m.pos.y;
     if(kind==="poi"){const q=m.pois.find(p=>p!==n);q.x=n.x;q.y=n.y;q.done=true}
     if(kind==="cleared")m.cleared=true;if(kind==="daily")S.run="daily";
     if(kind==="elite")n.t="elite";if(kind==="legacy")delete n.rd;
     reveal(m);const result=respawnFoes(m).has(n);if(kind==="poi"){const q=m.pois.find(p=>p!==n&&p.x===n.x&&p.y===n.y);q.x=m.start.x+1;q.y=m.start.y-2}
     m.cleared=false;S.run="normal";n.t="fight";delete n.rd;return result};
   const originalMap=JSON.stringify(m),excludes=Object.fromEntries(["lit","player","poi","cleared","daily","elite","legacy"].map(k=>[k,excluded(k)]));
   S.maps.woods=JSON.parse(originalMap);m=S.maps.woods;
   // A successful flee restores the wounded enemy without assigning a respawn deadline.
   const fleeNode=S.maps.woods.pois.find((p,i)=>p.t==="fight"&&i!==ni);m.pos={x:fleeNode.x,y:fleeNode.y};enter(fleeNode);S.battle.hp=Math.round(S.battle.max/2);const R=Math.random,fo=FLEE_T.ok,kills=S.kills[S.battle.id]||0;FLEE_T.ok=1;Math.random=()=>.1;flee();Math.random=R;FLEE_T.ok=fo;
   return{deadline,full,rewarded,invalid,originalIdentity,n:{rd:deadline,e:n.e,rar:n.rar,afx:n.afx,mv:n.mv},early,at,clean,identity,throughStep,waited,excludes,flee:{done:fleeNode.done,rd:fleeNode.rd,st:!!fleeNode.st,killsBefore:kills,killsAfter:S.kills[S.battle.id]||0}};
 });
 assert.equal(out.deadline,30);assert.equal(out.early,false);assert.equal(out.at,true);assert(out.clean&&out.throughStep&&out.waited&&out.full&&out.rewarded&&out.invalid);assert.equal(JSON.stringify(out.identity),out.originalIdentity);assert.deepEqual(out.identity,{e:out.n.e,rar:out.n.rar,afx:out.n.afx,mv:out.n.mv});
 assert(Object.values(out.excludes).every(v=>v===false),JSON.stringify(out.excludes));assert(!out.flee.done&&out.flee.rd==null&&out.flee.st&&out.flee.killsBefore===out.flee.killsAfter);
 await page.evaluate(()=>save());const saved=await page.evaluate(()=>S.maps.woods.pois.find(p=>Number.isFinite(p.rd))?.rd);assert.equal(typeof saved,"number","a real pending deadline is saved");await page.reload();assert.equal(await page.evaluate(()=>S.maps.woods.pois.find(p=>Number.isFinite(p.rd))?.rd),saved);
 assert.deepEqual(errors,[]);console.log("MONSTER RESPAWN CHECK OK: victory deadline, boundary, exclusions, saved deadline and flee/wounds");
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

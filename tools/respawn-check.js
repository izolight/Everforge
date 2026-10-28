#!/usr/bin/env node
// Defeats restore full HP while keeping their ordinary, daily and tutorial consequences.
const {chromium}=require("playwright"),assert=require("node:assert/strict"),{URL}=require("./lib");
(async()=>{
  const browser=await chromium.launch();
  try{
    const p=await browser.newPage({reducedMotion:"reduce"}),errors=[];p.on("pageerror",e=>errors.push(e.message));await p.goto(URL);
    const normal=await p.evaluate(()=>{
      S=freshState();S.eq.main=null;S.inv.iron_sword=2;S.hp=1;S.stats.deaths=0;S.onboarding=7;
      S.maps.woods=genMap({seed:1,zone:"woods",heat:0});const old=S.maps.woods;
      startBattle("boar");S.battle.opening=1;const R=Math.random;Math.random=()=>0;youFall();Math.random=R;
      return{hp:S.hp,max:pstats().maxHp,deaths:S.stats.deaths,inv:S.inv.iron_sword,onboarding:S.onboarding,mapChanged:S.maps.woods!==old,over:S.battle.over};
    });
    assert.equal(normal.hp,normal.max,"a standard defeat restores full max HP");assert.equal(normal.deaths,1);assert.equal(normal.inv,1,"scavenger penalty still removes one unequipped item");assert.equal(normal.onboarding,0,"tutorial opening defeat behavior remains intact");assert(normal.mapChanged,"standard defeat still creates a fresh map");assert.equal(normal.over,"lost");
    const daily=await p.evaluate(()=>{
      S=freshState();S.run="daily";S.daily={date:new Date().toISOString().slice(0,10),seed:1,zone:"woods",heat:1,twist:"",map:genMap({seed:9,zone:"woods",heat:1}),state:"run",turns:5,back:"pass",result:null};
      S.zone="woods";S.hp=1;const dmap=S.daily.map;startBattle("boar");youFall();
      return{hp:S.hp,max:pstats().maxHp,run:S.run,state:S.daily.state,back:S.zone,dailyMapKept:S.daily.map===dmap,deaths:S.stats.deaths};
    });
    assert.equal(daily.hp,daily.max,"daily defeat also restores full max HP");assert.equal(daily.run,null);assert.equal(daily.state,"done");assert.equal(daily.back,"pass");assert(daily.dailyMapKept,"daily defeat keeps its completed run map");assert.equal(daily.deaths,1);
    assert.deepEqual(errors,[]);console.log("RESPAWN CHECK OK: full HP, scavenger penalty, fresh standard map, tutorial opening, and daily completion");
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

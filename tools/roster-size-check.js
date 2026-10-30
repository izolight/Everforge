#!/usr/bin/env node
// Seeded wild roster sizes and encounter weight. Fen is authored; the Rift keeps
// its independent ten-wild roster.
const {chromium}=require("playwright"),path=require("path"),assert=require("node:assert/strict");
const URL="file://"+path.resolve(__dirname,"../index.html");
(async()=>{const b=await chromium.launch();try{const p=await b.newPage();await p.goto(URL);const r=await p.evaluate(()=>{
  const zones=["woods","pass","hollow","spire","fen"],out={};
  for(const z of zones){
    const foes=Object.values(ENEMIES).filter(e=>e.zone===z&&!e.boss),wild=foes.filter(e=>e.gen),auth=foes.filter(e=>!e.gen);
    const roster=z==="fen"?[]:genRoster(z),again=z==="fen"?[]:genRoster(z),sig=xs=>xs.map(e=>({id:e.id,name:e.name,el:e.el,hp:e.hp,atk:e.atk,afx:e.afx,art:e.art}));
    const alpha=wild.filter(e=>e.alpha),weight=wild.reduce((n,e)=>n+e.w,0),authWeight=auth.reduce((n,e)=>n+e.w,0),share=weight/(weight+authWeight);
    const R=rng(hash("roster-size-check:"+z));let draws=100000,drawWild=0;
    for(let i=0;i<draws;i++)if(ENEMIES[pickEnemy(z,R)].gen)drawWild++;
    S=freshState();S.unlocked=ZONES.map(q=>q[0]);S.unl=Object.fromEntries(UNLOCKS.map((q,i)=>[q.id,i+1]));let mapFoes=0,mapWild=0;
    for(let seed=0;seed<500;seed++)for(const q of genMap({seed,zone:z,heat:0}).pois)if(q.t==="fight"||q.t==="elite"){mapFoes++;if(ENEMIES[q.e]?.gen)mapWild++}
    out[z]={roster:roster.length,ids:wild.map(e=>e.id).sort(),names:wild.map(e=>e.name),authored:auth.length,alpha:alpha.length,alphaSlot:alpha[0]?.id,legacyAlphaSlot:"w_"+z+"_"+(hash("wild-alpha-slot:"+z)%10),alphaAffixes:alpha.map(e=>e.afx.length),nonAlpha:wild.filter(e=>!e.alpha).length,deterministic:JSON.stringify(sig(roster))===JSON.stringify(sig(again)),authoredWeight:authWeight,generatedWeight:weight,share,weightedSelections:{n:draws,wild:drawWild,share:drawWild/draws},maps:{n:500,foes:mapFoes,wild:mapWild,share:mapWild/mapFoes}};
  }
  const rift=riftMake(123456,1),riftWild=Object.keys(ENEMIES).filter(id=>/^w_rift_\d+$/.test(id));
  return{genN:GEN_N,riftN:RIFT_N,riftBiome:rift.biome,riftWild:riftWild.length,zones:out};
});
  assert.equal(r.genN,12);assert.equal(r.riftN,10);assert.equal(r.riftWild,10);
  for(const z of ["woods","pass","hollow","spire"]){const q=r.zones[z],expected={woods:10/26,pass:10/25,hollow:10/25,spire:10/24}[z];
    assert.equal(q.roster,12,`${z} roster count`);assert.equal(new Set(q.ids).size,12,`${z} generated IDs`);assert.equal(new Set(q.names).size,12,`${z} unique names`);assert(q.deterministic,`${z} seeded roster repeat`);
    assert.equal(q.alpha,1,`${z} must retain exactly one alpha`);assert.equal(q.alphaSlot,q.legacyAlphaSlot,`${z} alpha keeps its old seeded slot`);assert.equal(q.nonAlpha,11);assert.deepEqual(q.alphaAffixes,[3]);assert(Math.abs(q.share-expected)<1e-12,`${z} expected encounter share ${expected}, got ${q.share}`);
    assert(Math.abs(q.weightedSelections.share-expected)<.01,`${z} weighted draw share ${q.weightedSelections.share}`);
    assert(Math.abs(q.maps.share-expected)<.025,`${z} seeded-map share ${q.maps.share}`);
  }
  assert.equal(r.zones.fen.roster,0);assert.equal(r.zones.fen.generatedWeight,0);assert.equal(r.zones.fen.authored,6);
  console.log("ROSTER SIZE CHECK OK",JSON.stringify(r));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});

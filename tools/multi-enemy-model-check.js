#!/usr/bin/env node
// V-18 isolated contract model. This exercises pack/state invariants before
// shared battle/map integration is released from the concurrent V-20 workstream.
const assert=require("node:assert/strict");
const PACKS=require("../js/packs.js");
assert.deepEqual(PACKS.encounterPolicy({depth:1,elite:false}),{size:undefined,elite:false});
assert.deepEqual(PACKS.encounterPolicy({depth:9,elite:true}),{size:2,elite:true});
{
  const saved=PACKS.normalizeBattle({target:"w_rift_0",foes:[{id:"w_rift_0",slot:0,hp:10,max:10,atk:5,def:1,alive:true},{id:"w_rift_1",slot:1,hp:8,max:8,atk:3,def:1,alive:true}]});
  assert.equal(PACKS.validateCatalog(saved,{w_rift_0:{},w_rift_1:{}}),true,"catalog validation follows roster generation");
  saved.foes[1].id="removed_enemy";
  assert.equal(PACKS.validateCatalog(saved,{w_rift_0:{}}),false,"unknown active-pack member is deferred for safe recovery");
}

const rng=PACKS.rng;
const packFor=(seed,eligible)=>{
  const R=rng(seed),pool=[...eligible],size=2+(R()<.35?1:0),foes=[];
  for(let i=0;i<size;i++){const j=Math.floor(R()*pool.length),id=pool.splice(j,1)[0];foes.push({id,slot:i,hp:10,max:10,turns:0,status:{poison:0},alive:true})}
  return{round:1,target:foes[0].id,foes};
};
const living=PACKS.living;
const selectTarget=PACKS.selectTarget;
const playerAction=(pack,{kind="single",damage=1,target=pack.target}={})=>{
  const hits=kind==="aoe"?PACKS.areaTargets(pack).map(id=>pack.foes.find(f=>f.id===id)):pack.foes.filter(f=>f.id===target&&f.alive);
  hits.forEach(f=>{f.hp=Math.max(0,f.hp-damage);if(f.hp===0)PACKS.defeat(pack,f.id)});
  if(!living(pack).some(f=>f.id===pack.target))PACKS.nextTarget(pack);
  return hits.map(f=>f.id);
};
const enemyRound=pack=>{
  const acted=[];
  PACKS.orderedEnemyIds(pack).forEach(id=>{const f=pack.foes.find(x=>x.id===id);f.turns++;acted.push(f.id)});
  pack.round++;
  return acted;
};
const resolveDefense=(pack,kind,telegraphs)=>{
  let parried=false;const result=[];
  for(const foe of living(pack)){
    const isTell=telegraphs.includes(foe.id);
    if(kind==="parry"&&!parried&&isTell){parried=true;result.push({id:foe.id,parried:true,damage:0});continue}
    result.push({id:foe.id,parried:false,damage:kind==="guard"?4:10});
  }
  return result;
};
const normalizeSavedBattle=PACKS.normalizeBattle;
const eligible=Array.from({length:16},(_,i)=>`foe_${i}`);
const fixedPack=ids=>({round:1,target:ids[0],foes:ids.map((id,slot)=>({id,slot,hp:10,max:10,atk:4,def:1,turns:0,status:{poison:0},alive:true}))});

// Stable, unique, two-to-three member packs across a seeded sample.
for(let seed=1;seed<=500;seed++){
  const a=packFor(seed,eligible),b=packFor(seed,eligible);
  assert.deepEqual(a,b,`pack seed ${seed} is reproducible`);
  assert.ok(a.foes.length===2||a.foes.length===3,`pack seed ${seed} has 2–3 foes`);
  assert.equal(new Set(a.foes.map(f=>f.id)).size,a.foes.length,`pack seed ${seed} has unique members`);
}

// Production resolver preserves the primary species, derives stable member
// roll seeds, prefers a distinct role/faction, and never doubles an alpha.
{
  const roster=Array.from({length:8},(_,i)=>({id:`m${i}`,role:["bruiser","caster","support","skirmisher"][i%4],faction:i<4?"raiders":"cult",w:i+1,alpha:i===0||i===4}));
  const node={x:8,y:11};
  assert.equal(PACKS.seedFor(91,node,"woods"),PACKS.seedFor(91,{...node},"woods"),"same node seed is stable");
  assert.notEqual(PACKS.seedFor(91,node,"woods"),PACKS.seedFor(91,node,"rift"),"zone domain separates pack seeds");
  assert.notEqual(PACKS.seedFor(91,node,"woods"),PACKS.seedFor(91,{x:9,y:11},"woods"),"neighbor nodes get independent pack seeds");
  for(let seed=1;seed<=500;seed++){
    const primary=roster[0],at={x:seed%17,y:seed%11},derived=PACKS.seedFor(seed,at,"woods");
    const a=PACKS.makePack({seed:derived,primary,candidates:roster.slice(1)}),b=PACKS.makePack({seed:derived,primary,candidates:roster.slice(1)});
    assert.deepEqual(a,b,`resolved pack ${seed} is deterministic`);
    assert.equal(a.members[0].id,primary.id,"map's original foe remains member one");
    assert.ok(a.members.length===2||a.members.length===3);
    assert.ok(a.members.filter(member=>member.alpha).length<=1,"pack has at most one alpha");
    assert.equal(new Set(a.members.map(member=>member.variantSeed)).size,a.members.length,"each foe has a distinct variant sub-seed");
    assert.equal(new Set(a.members.map(member=>member.role)).size,a.members.length,"selection prefers a different role for each slot");
    assert.ok(a.members.every(member=>member.faction==="raiders"),"selection prefers the primary faction when a complete pack is available");
  }
  const capped=PACKS.makePack({seed:1,primary:roster[1],candidates:[roster[2]],size:3});
  assert.equal(capped.size,2,"insufficient candidates downgrade a triple to a valid pair");
  assert.throws(()=>PACKS.makePack({seed:1,primary:roster[0],candidates:[roster[4]],size:2}),/eligible members/,
    "an alpha cannot be paired with a second alpha when no other companion exists");
}

// Target changes cost no round, dead targets are rejected, and a defeated foe
// is skipped when the ordered enemy phase reaches its slot.
{
  const p=fixedPack(["bruiser","caster","support"]),before=p.round;
  assert.equal(selectTarget(p,"support"),true);assert.equal(p.round,before);
  assert.deepEqual(playerAction(p,{damage:10}),["support"]);
  assert.equal(p.target,"bruiser","target advances to the first living member");
  assert.equal(selectTarget(p,"support"),false,"dead members cannot be targeted");
  assert.deepEqual(enemyRound(p),["bruiser","caster"],"dead member skips its turn; remaining slots keep order");
  assert.equal(p.round,before+1,"enemy phase advances the round once, not once per foe");
}

// AoE resolves once per living foe, does not hit a dead member, and never
// repeats an enemy phase as a side effect.
{
  const p=fixedPack(["bruiser","caster","support"]);
  p.foes[1].alive=false;p.foes[1].hp=0;
  const round=p.round,hits=playerAction(p,{kind:"aoe",damage:3});
  assert.deepEqual(hits,[p.foes[0].id,p.foes[2].id]);
  assert.equal(p.round,round);assert.equal(p.foes[0].hp,7);assert.equal(p.foes[2].hp,7);
}

// Guard protects against each ordered member action; one Parry cancels only
// the first queued telegraph and leaves later members' attacks intact.
{
  const p=fixedPack(["bruiser","caster","support"]),guard=resolveDefense(p,"guard",[]);
  assert.deepEqual(guard.map(x=>x.damage),[4,4,4]);
  const parry=resolveDefense(p,"parry",["bruiser","caster"]);
  assert.deepEqual(parry,[{id:"bruiser",parried:true,damage:0},{id:"caster",parried:false,damage:10},{id:"support",parried:false,damage:10}]);
}

// Each foe owns independent statuses and saved wounds/turn state; JSON reload
// preserves target and stable turn order.
{
  const p=fixedPack(["bruiser","caster","support"]);
  p.foes[0].status.poison=3;p.foes[1].status.poison=0;p.foes[2].hp=6;p.foes[2].turns=4;
  selectTarget(p,p.foes[2].id);
  const restored=JSON.parse(JSON.stringify(p));
  assert.deepEqual(restored,p);
  assert.equal(restored.foes[0].status.poison,3);
  assert.equal(restored.foes[1].status.poison,0);
  assert.equal(restored.target,p.foes[2].id);
  const hydrated=PACKS.normalizeBattle(restored);
  assert.equal(hydrated.hp,6,"active-foe adapter follows the saved target");
  hydrated.target="bruiser";
  assert.equal(hydrated.hp,10,"switching targets reads that member's own HP");
  hydrated.hp=8;
  assert.equal(hydrated.foes[0].hp,8,"legacy combat writes update the canonical member array");
  assert.equal(hydrated.foes[2].hp,6,"target writes do not leak to other members");
  assert.deepEqual(enemyRound(hydrated),["bruiser","caster","support"]);
}

// Current single-foe saves normalize without losing battle-local state.
{
  const legacy={id:"boar",name:"Boar",hp:7,max:12,atk:4,def:1,turn:3,afx:["ward"],poison:2,pi:4,log:[{t:"old log"}]};
  const migrated=normalizeSavedBattle(JSON.parse(JSON.stringify(legacy)));
  assert.equal(migrated.target,"boar");assert.equal(migrated.foes.length,1);
  assert.equal(migrated.hp,7);assert.equal(migrated.foes[0].hp,7);
  assert.equal(migrated.log[0].t,"old log","shared battle log remains outside foe state");
  migrated.hp=5;assert.equal(migrated.foes[0].hp,5,"legacy root mutations write through the active foe adapter");
  const reloaded=normalizeSavedBattle(JSON.parse(JSON.stringify(migrated)));
  assert.equal(reloaded.hp,5);assert.equal(reloaded.foes[0].hp,5);
  const invalid={foes:[{id:"a",hp:5,max:8,atk:4,def:1},{id:"a",hp:4,max:8,atk:3,def:0}],target:"a"};
  assert.equal(normalizeSavedBattle(invalid),null,"duplicate pack identities are rejected");
  assert.equal(normalizeSavedBattle({id:"boar",hp:5,max:8}),null,"malformed legacy saves are rejected safely");
}

console.log("Multi-enemy model OK: 500 deterministic resolver packs, isolated seeds, unique 2–3 members, free targeting, ordered turns/AoE, isolated member state, active-foe save adapter, and legacy single-foe normalization.");

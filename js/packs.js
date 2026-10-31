// Deterministic multi-enemy pack selection. This module is deliberately
// independent of map/combat state so it can be reviewed and tested before its
// shared call sites are integrated.
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.PACKS=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const hash32=value=>{
    let h=2166136261;
    for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const rng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
  const weightOf=foe=>Number.isFinite(foe.w)&&foe.w>0?foe.w:1;
  const weighted=(pool,R)=>{
    const total=pool.reduce((sum,foe)=>sum+weightOf(foe),0);let roll=R()*total;
    for(const foe of pool){roll-=weightOf(foe);if(roll<0)return foe}
    return pool[pool.length-1];
  };
  const seedFor=(mapSeed,node,zone="")=>{
    if(!node||!Number.isInteger(node.x)||!Number.isInteger(node.y))throw new TypeError("pack seed requires integer node coordinates");
    return hash32(`pack:v18:${mapSeed>>>0}:${zone}:${node.x},${node.y}`);
  };
  const makePack=({seed,primary,candidates,size,preferFaction=true})=>{
    if(!primary||typeof primary.id!=="string")throw new TypeError("pack requires a primary foe id");
    const pool=(candidates||[]).filter(e=>e&&typeof e.id==="string"&&e.id!==primary.id);
    if(new Set(pool.map(e=>e.id)).size!==pool.length)throw new Error("pack candidate ids must be unique");
    if(pool.length<1)throw new RangeError("a pack needs at least one distinct companion");
    const R=rng(seed>>>0);let count=size==null?2+(R()<.35?1:0):Math.floor(size);
    if(count<2||count>3)throw new RangeError("pack size must be 2 or 3");
    const nonAlphaPool=pool.filter(e=>!primary.alpha||!e.alpha);
    if(nonAlphaPool.length<1)throw new RangeError("not enough distinct eligible members for a pack");
    count=Math.min(count,nonAlphaPool.length+1); // prefer a two-member encounter over an invalid three-member draw
    const members=[primary],used=new Set([primary.id]),roles=new Set([primary.role].filter(Boolean));
    let hasAlpha=!!primary.alpha;
    while(members.length<count){
      let available=pool.filter(e=>!used.has(e.id)&&(!hasAlpha||!e.alpha));
      if(!available.length)throw new RangeError("not enough distinct non-alpha candidates for this pack");
      if(preferFaction&&primary.faction){const same=available.filter(e=>e.faction===primary.faction);if(same.length)available=same}
      const distinct=available.filter(e=>e.role&&!roles.has(e.role));
      const choice=weighted(distinct.length?distinct:available,R);
      members.push(choice);used.add(choice.id);if(choice.role)roles.add(choice.role);if(choice.alpha)hasAlpha=true;
    }
    return{seed:seed>>>0,size:members.length,members:members.map((foe,slot)=>({id:foe.id,slot,role:foe.role||null,faction:foe.faction||null,alpha:!!foe.alpha,variantSeed:hash32(`${seed>>>0}:${slot}:${foe.id}`)}))};
  };
  const living=pack=>(pack&&Array.isArray(pack.foes)?pack.foes:[]).filter(f=>f&&f.alive!==false&&f.hp>0);
  const selectTarget=(pack,id)=>{
    const foe=living(pack).find(f=>f.id===id);
    if(!foe)return false;
    pack.target=id;return true;
  };
    // Keep a selected member active until defeat handling advances the target.
    // A live-only lookup would redirect proxy reads midway through that member's
    // lethal damage/status tick, applying the remainder to another foe.
    const active=pack=>(pack&&pack.foes||[]).find(f=>f.id===pack.target)||living(pack)[0]||(pack&&pack.foes||[])[0]||null;
  const nextTarget=pack=>{
    const live=living(pack);if(!live.length)return null;
    const current=pack.foes.findIndex(f=>f.id===pack.target),next=live.find(f=>f.slot>=(current<0?0:current+1))||live[0];
    pack.target=next.id;return next;
  };
  const defeat=(pack,id)=>{
    const foe=(pack&&pack.foes||[]).find(f=>f.id===id);
    if(!foe||foe.alive===false||foe.hp>0)return false;
    foe.hp=0;foe.alive=false;
    if(pack.target===id)nextTarget(pack);
    return true;
  };
  const orderedEnemyIds=pack=>living(pack).sort((a,b)=>a.slot-b.slot).map(f=>f.id);
  const areaTargets=pack=>orderedEnemyIds(pack);
  const encounterPolicy=({depth=1,elite=false,size}={})=>({size:size==null?(depth>=9?2:undefined):size,elite:!!elite});
  const validateCatalog=(battle,catalog)=>!battle||!!(Array.isArray(battle.foes)&&battle.foes.length>=1&&battle.foes.length<=3&&battle.foes.every(f=>f&&typeof f.id==="string"&&catalog&&catalog[f.id])&&battle.foes.some(f=>f.id===battle.target&&f.alive!==false&&f.hp>0)&&catalog[battle.foes[0].id]);
  const FOE_FIELDS=["id","name","role","faction","el","hp","max","atk","a0","def","weak","resist","turn","burn","poison","bleed","stun","open","shred","spWard","spWardTurns","enraged","enrageX","burrowed","frozen","reborn","phased","rar","afx","intr","title","wd","wm","wb","fz","spEvery","split","boom","sty","thT","fireShown"];
  const normalizeBattle=battle=>{
    if(!battle||typeof battle!=="object")return battle;
    if(!Array.isArray(battle.foes)){
      const foe={};FOE_FIELDS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(battle,k))foe[k]=battle[k]});
      if(typeof foe.id!=="string"||!Number.isFinite(foe.hp)||!Number.isFinite(foe.max)||!Number.isFinite(foe.atk)||!Number.isFinite(foe.def))return null;
      foe.slot=0;foe.alive=foe.hp>0;battle.foes=[foe];battle.target=foe.id;
    }
    if(battle.foes.length<1||battle.foes.length>3)return null;
    const ids=new Set();
    for(let i=0;i<battle.foes.length;i++){
      const foe=battle.foes[i];
      if(!foe||typeof foe.id!=="string"||ids.has(foe.id)||!Number.isFinite(foe.hp)||!Number.isFinite(foe.max)||foe.max<=0||!Number.isFinite(foe.atk)||!Number.isFinite(foe.def))return null;
      ids.add(foe.id);foe.slot=Number.isInteger(foe.slot)?foe.slot:i;
      if(typeof foe.alive!=="boolean")foe.alive=foe.hp>0;
    }
    if(!battle.foes.some(f=>f.id===battle.target&&f.alive&&f.hp>0))battle.target=living(battle)[0]?.id||battle.foes[0].id;
    for(const field of FOE_FIELDS){
      const descriptor=Object.getOwnPropertyDescriptor(battle,field);
      if(descriptor&&!descriptor.configurable)continue;
      const legacy=descriptor&&Object.prototype.hasOwnProperty.call(descriptor,"value")?descriptor.value:undefined;
      if(!Array.isArray(battle.foes)&&legacy!==undefined)battle.foes[0][field]=legacy;
      delete battle[field];
      Object.defineProperty(battle,field,{enumerable:true,configurable:true,get(){return active(this)?.[field]},set(value){const foe=active(this);if(foe)foe[field]=value}});
    }
    return battle;
  };
  return Object.freeze({hash32,rng,seedFor,makePack,encounterPolicy,living,selectTarget,active,nextTarget,defeat,orderedEnemyIds,areaTargets,FOE_FIELDS,normalizeBattle,validateCatalog});
});

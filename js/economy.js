// ================= EMBERS ECONOMY =================
// Embers (S.embers) come from fights, salvage and selling; they buy peddler stock, refine essences and reforge mishaps. Tunables live in EMB (data.js).
const worth=it=>Math.round(3+power(it)*.6+2*(it.tier-1));
const buyPrice=id=>isEss(id)?EMB.ess:Math.round(worth(S.items[id])*EMB.buy),sellPrice=id=>Math.max(1,Math.round(worth(S.items[id])*EMB.sell));
const salvageEmbers=it=>isEss(it.id)||isRefined(it.id)?0:Math.max(1,Math.round(worth(it)*EMB.salv));
function gainEmbers(n){if(n>0){S.embers+=n;fx("emb","+"+n,"ember")}return n}
function fightEmbers(E,B){const base=E.boss?EMB.boss:B.elite||B.id==="mimic"?EMB.elite:EMB.fight;return gainEmbers(Math.round(base*(1+(B.heat||0)*EMB.heat)))}
// Peddler stock: EMB.stock items from this zone's and the next zone's drops plus one or two essences. rv = six 0-1 rolls (pre-rolled per node on the seeded daily map), so the same day shows the same shop.
function shopStock(rv){
  const next=ZONES[Math.min(zoneIdx(S.zone)+1,ZONES.length-1)][0],pool=[...new Set([...zonePool(S.zone),...zonePool(next)])],ids=[];
  for(let k=0;k<EMB.stock&&pool.length;k++)ids.push(pool.splice(Math.floor(rv[k]*pool.length),1)[0]);
  ids.push(essence(at(ESS_POOL,rv[3])));if(rv[4]<.5)ids.push(essence(at(ESS_POOL,rv[5])));
  return ids.map(id=>({id,price:buyPrice(id)}));
}
// What you could sell: the cheapest few spares (never equipped, in the crucible, legendary or a wanted secret ingredient; essences are kept)
const sellList=()=>Object.keys(S.inv).filter(id=>spare(id)&&!id.startsWith("ess_")&&!wanted(id)).sort((a,b)=>power(S.items[a])-power(S.items[b])||(a<b?-1:1)).slice(0,EMB.sells).map(id=>({id,price:sellPrice(id)}));
function merchant(sh){
  const o=makeOffer(),stock=shopStock(sh||Array.from({length:6},Math.random));
  return{type:"merchant",icon:"peddler",title:"A travelling peddler",text:`"Fine wares for fine folk. Buy, sell or swap${o?`: I'll take your ${S.items[o.give].name} for this ${S.items[o.get].name}`:""}. Fair's fair."`,offer:o,stock,sells:sellList(),loot:[],
    choices:[...o?[["trade",`Trade for ${S.items[o.get].name}`],["inspect","Inspect the offer"]]:[],["leave","Move on"]]};
}
function shopPick(c,ev){
  const [k,n]=c.split(":"),e=(k==="buy"?ev.stock:ev.sells)[+n];if(!e||e.done)return;
  if(k==="buy"){if(S.embers<e.price)return toast("Not enough embers.");S.embers-=e.price;addItem(e.id);toast(`Bought ${S.items[e.id].name} for ${e.price} embers.`)}
  else{if(!S.inv[e.id]||!spare(e.id)){e.done=true;save();render();return toast("You no longer have that item.")}takeOne(e.id);gainEmbers(e.price);toast(`Sold ${S.items[e.id].name} for ${e.price} embers.`)}
  e.done=true;save();render();
}
// Refining: REFINE_N plain essences + EMB.refine embers -> one refined essence (stronger trait, takes one crucible slot)
function refine(t){
  const b="ess_"+t;if(inBattle()||avail(b)<REFINE_N||S.embers<EMB.refine)return;
  S.inv[b]-=REFINE_N;trimBench();S.embers-=EMB.refine;const r=refined(t);addItem(r);save();render();toast(`${REFINE_N} ${t} Essences refined into a ${S.items[r].name}.`);
}
// Reforge: pay embers to strip a mishap (Cursed, Brittle, Rust, or the Weakened flag) from a crafted or tempered piece. Like the old forge's tempering it makes a new c_ item, keeps the legendary flag and bonus, and takes over the equip slot.
const mishapOf=it=>!it.crafted?null:MISHAP_TRAITS.find(t=>it.traits[t]>0)||(it.mishap==="Weakened"?"Weakened":null),reforgeCost=it=>EMB.reforge[0]+EMB.reforge[1]*it.tier;
function reforge(id){
  const it=S.items[id],m=it&&mishapOf(it),cost=m&&reforgeCost(it);if(!m||inBattle()||!S.inv[id]||S.embers<cost)return;
  const nid="c_"+hash(id+":reforge").toString(36);
  if(!S.items[nid]){const tr={...it.traits};if(m==="Weakened")Object.keys(tr).forEach(t=>tr[t]=r1(tr[t]/.7));else delete tr[m];
    S.items[nid]={...it,id:nid,recipe:undefined,recipeIds:undefined,mishap:undefined,traits:tr,name:it.name.replace(/\b(Cursed|Cracked|Rusted) /,"")}}
  S.embers-=cost;takeOne(id);addItem(nid);
  for(const [s] of SLOTS)if(S.eq[s]===id&&eqCount(id)>(S.inv[id]||0)){S.eq[s]=nid;break}
  clampHp();save();render();closeSheet();toast(`${S.items[nid].name} reforged. ${m==="Weakened"?"Its strength returns":m+" is gone"}.`);
}

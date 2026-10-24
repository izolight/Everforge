// ================= EMBERS ECONOMY =================
// Embers (S.embers) come from fights, salvage and selling; they buy peddler stock, refine essences and reforge mishaps. Tunables live in EMB (data.js).
const worth=it=>Math.round(3+power(it)*.6+2*(it.tier-1));
const buyPrice=id=>{if(isEss(id))return EMB.ess;const it=S.items[id];return Math.max(Math.round(worth(it)*EMB.buy),Math.ceil(EMB.floor*(salvageYield(it).length*EMB.val+salvageEmbers(it))))},sellPrice=id=>Math.max(1,Math.round(worth(S.items[id])*EMB.sell));
const salvageEmbers=it=>isEss(it.id)||isRefined(it.id)?0:Math.max(1,Math.round(worth(it)*EMB.salv));
function spendEmbers(n){S.embers-=n;S.stats.spent+=n}
function gainEmbers(n){if(n>0){S.embers+=n;S.stats.earned+=n;fx("emb","+"+n,"ember")}return n}
function fightEmbers(E,B){const base=E.boss?EMB.boss:B.elite||B.id==="mimic"?EMB.elite:EMB.fight;return gainEmbers(Math.round(base*(1+(B.heat||0)*EMB.heat)))}
// Peddler stock: EMB.stock items from this zone's and the next zone's drops plus one or two essences. rv = six 0-1 rolls (pre-rolled per node on the seeded daily map), so the same day shows the same shop.
function shopStock(rv){
  const next=ZONES[Math.min(zoneIdx(S.zone)+1,ZONES.length-1)][0],pool=[...new Set([...zonePool(S.zone),...zonePool(next)])],ids=[];
  for(let k=0;k<EMB.stock&&pool.length;k++)ids.push(pool.splice(Math.floor(rv[k]*pool.length),1)[0]);
  ids.push(essence(at(ESS_POOL,rv[3])));if(rv[4]<.5)ids.push(essence(at(ESS_POOL,rv[5])));
  return ids.map(id=>({id,price:buyPrice(id)}));
}
// What you could sell: the cheapest few spares (never equipped, in the crucible, legendary or a wanted secret ingredient; essences are kept)
const sellList=()=>spareList().slice(0,EMB.sells).map(id=>({id,price:sellPrice(id)}));
function merchant(sh){
  const o=makeOffer(),stock=shopStock(sh||Array.from({length:6},Math.random));
  return{type:"merchant",icon:"peddler",title:"A travelling peddler",text:`"Fine wares for fine folk. Buy, sell or swap${o?`: I'll take your ${S.items[o.give].name} for this ${S.items[o.get].name}`:""}. Fair's fair."`,offer:o,stock,sells:sellList(),loot:[],
    choices:[...o?[["trade",`Trade for ${S.items[o.get].name}`],["inspect","Inspect the offer"]]:[],["leave","Move on"]]};
}
function shopPick(c,ev){
  const [k,n]=c.split(":"),e=(k==="buy"?ev.stock:ev.sells)[+n];if(!e||e.done)return;
  if(k==="buy"){if(S.embers<e.price)return toast("Not enough embers.");spendEmbers(e.price);addItem(e.id);toast(`Bought ${S.items[e.id].name} for ${e.price} embers.`)}
  else{if(!S.inv[e.id]||!spare(e.id)){e.done=true;save();render();return toast("You no longer have that item.")}takeOne(e.id);gainEmbers(e.price);toast(`Sold ${S.items[e.id].name} for ${e.price} embers.`)}
  e.done=true;save();render();
}
// Refining: REFINE_N plain essences + EMB.refine embers -> one refined essence (stronger trait, takes one crucible slot)
function refine(t){
  const b="ess_"+t;if(inBattle()||avail(b)<REFINE_N||S.embers<EMB.refine)return;
  S.inv[b]-=REFINE_N;trimBench();spendEmbers(EMB.refine);S.stats.refined++;const r=refined(t);addItem(r);sfx("loot");save();render();toast(`${REFINE_N} ${t} Essences refined into a ${S.items[r].name}.`);
}
// Reforge: pay embers to strip every mishap (Cursed, Brittle, Rust, and a Weakened flag, which restores the traits from before the fizzle) from a crafted or tempered piece. Like the old forge's tempering it makes a new c_ item (a flawed craft turns back into its clean recipe item), keeps the legendary flag and bonus, and takes over the equip slot.
const mishapsOf=it=>!it.crafted?[]:[...MISHAP_TRAITS.filter(t=>it.traits[t]>0),...it.mishap==="Weakened"?["Weakened"]:[]],reforgeCost=it=>EMB.reforge[0]+EMB.reforge[1]*it.tier;
function reforge(id){
  const it=S.items[id],ms=it?mishapsOf(it):[],cost=ms.length&&reforgeCost(it);if(!ms.length||inBattle()||!S.inv[id]||S.embers<cost)return;
  const back=it.clean&&!it.temper&&ms.length===1&&!(it.recipeIds||[]).some(r=>MISHAP_TRAITS.some(t=>S.items[r]?.traits[t]>0)),nid=back?it.clean:"c_"+hash(id+":reforge").toString(36); // a mended mishap turns back into the clean recipe item, so it stacks with copies forged cleanly
  if(!S.items[nid]){let tr={...it.traits},name=it.name;
    ms.forEach(m=>{if(m!=="Weakened"){delete tr[m];name=name.replace(TRAITS[m].adj+" ","")}});
    if(ms.includes("Weakened"))tr=it.unweak?{...it.unweak}:Object.fromEntries(Object.entries(tr).map(([t,v])=>[t,r1(v/.7)])); // old Weakened items without a snapshot fall back to undoing the 30%
    S.items[nid]={...it,id:nid,...back?{}:{recipe:undefined,recipeIds:undefined},clean:undefined,mishap:undefined,unweak:undefined,traits:tr,name}}
  if(back){const ji=S.journal.findIndex(j=>j.id===id),have=S.journal.some(j=>j.id===nid);if(have){if(ji>=0)S.journal.splice(ji,1)}else if(ji>=0)S.journal[ji]={...S.journal[ji],id:nid,name:S.items[nid].name};else S.journal.push({id:nid,name:S.items[nid].name,legendary:!!S.items[nid].legendary})}
  spendEmbers(cost);sfx("forge");takeOne(id);addItem(nid);
  for(const [s] of SLOTS)if(S.eq[s]===id&&eqCount(id)>(S.inv[id]||0)){S.eq[s]=nid;break}
  clampHp();save();render();closeSheet();toast(`${S.items[nid].name} reforged. ${ms.join(" and ")} gone.`);
}

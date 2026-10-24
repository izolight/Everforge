// ================= EMBERS ECONOMY =================
// Embers (S.embers) come from fights, salvage and selling; they buy peddler stock, upgrade essence grades and reforge mishaps. Tunables live in EMB (data.js).
const worth=it=>Math.round((3+power(it)*.6+2*(it.tier-1))*GRADE_W[(it.grade||3)-1]);
const plainEq=g=>INF_W[g-1]/INF_W[2],salvGrade=it=>it.grade||it.sg||3; // plain essences a grade is worth; the grade of essence an item salvages into
const buyPrice=id=>{if(isEss(id))return Math.max(1,Math.round(EMB.ess*plainEq(gradeOf(id))));const it=S.items[id];return Math.max(Math.round(worth(it)*EMB.buy),Math.ceil(EMB.floor*(salvageYield(it).length*EMB.val*plainEq(salvGrade(it))+salvageEmbers(it))))},sellPrice=id=>Math.max(1,Math.round(worth(S.items[id])*EMB.sell));
const salvageEmbers=it=>isEss(it.id)?0:Math.max(1,Math.round(worth(it)*EMB.salv));
function spendEmbers(n){S.embers-=n;S.stats.spent+=n}
function gainEmbers(n){if(n>0){S.embers+=n;S.stats.earned+=n;fx("emb","+"+n,"ember")}return n}
function fightEmbers(E,B){const base=E.boss?EMB.boss:B.elite||B.id==="mimic"?EMB.elite:EMB.fight;return gainEmbers(Math.round(base*(1+(B.heat||0)*EMB.heat)))}
// Peddler stock: EMB.stock items from this zone's and the next zone's drops plus one or two essences. rv = six 0-1 rolls (pre-rolled per POI on the seeded daily map), so the same day shows the same shop.
function shopStock(rv){
  const next=ZONES[Math.min(zoneIdx(S.zone)+1,ZONES.length-1)][0],pool=[...new Set([...zonePool(S.zone),...zonePool(next)])],ids=[];
  const fr=(x,n)=>x*n%1; // the fraction of a roll left after picking an index is a fresh roll for the grade
  for(let k=0;k<EMB.stock&&pool.length;k++){const n=pool.length;ids.push(dropNow(pool.splice(Math.floor(rv[k]*n),1)[0],fr(rv[k],n)))}
  ids.push(essNow(at(ESS_POOL,rv[3]),fr(rv[3],ESS_POOL.length)));if(rv[4]<.5)ids.push(essNow(at(ESS_POOL,rv[5]),fr(rv[5],ESS_POOL.length)));
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
// Upgrading: UP.n of a graded essence or material + embers -> 1 of the next grade (see UP in data.js). A miss costs the embers and 1 of the UP.n, never all.
const upChance=tg=>Math.max(UP.min,Math.min(UP.max,UP.base+UP.slope*(skLv("alchemy")-GRADE_LV[tg-1])));
const upgradable=()=>Object.keys(S.inv).filter(id=>gradable(baseIdOf(id))&&gradeOf(id)<5&&avail(id)>=UP.n).sort((a,b)=>(S.items[baseIdOf(a)].name<S.items[baseIdOf(b)].name?-1:S.items[baseIdOf(a)].name>S.items[baseIdOf(b)].name?1:0)||gradeOf(a)-gradeOf(b));
function upgrade(id){
  const g=gradeOf(id),tg=g+1,b=baseIdOf(id);if(inBattle()||!gradable(b)||g>=5||avail(id)<UP.n||S.embers<UP.emb[g-1])return;
  const lv=skLv("alchemy"),need=GRADE_LV[tg-1];if(lv<need)return toast(`${GRADES[tg-1][0]} needs Alchemy Lv ${need}. You are Lv ${lv}.`);
  const ok=Math.random()*100<upChance(tg);spendEmbers(UP.emb[g-1]);S.inv[id]-=ok?UP.n:1;trimBench();
  const x=Math.max(1,Math.round(UP.xp[tg-1]*(ok?1:.5)*skFactor(need,lv)));S.skills.alchemy=skXp("alchemy")+x;
  const nid=gradedItem(b,tg),nm=S.items[nid].name;if(ok){S.stats.refined++;addItem(nid)}
  sfx(ok?"loot":"clang");const up=skLv("alchemy")>lv;save();render();
  toast(ok?`${UP.n}× ${S.items[id].name} combine into a ${nm}.${up?" "+skMsg("alchemy",lv):""}`:`The mix slumps. One ${S.items[id].name} is lost; ${UP.n-1} remain.${up?" "+skMsg("alchemy",lv):""}`);
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
  if(back){const ji=S.journal.findIndex(j=>j.id===id),have=S.journal.some(j=>j.id===nid);if(have){if(ji>=0)S.journal.splice(ji,1)}else if(ji>=0)S.journal[ji]={...S.journal[ji],id:nid,name:S.items[nid].name}}
  spendEmbers(cost);sfx("forge");takeOne(id);addItem(nid);
  for(const [s] of SLOTS)if(S.eq[s]===id&&eqCount(id)>(S.inv[id]||0)){S.eq[s]=nid;break}
  clampHp();save();render();closeSheet();toast(`${S.items[nid].name} reforged. ${ms.join(" and ")} gone.`);
}

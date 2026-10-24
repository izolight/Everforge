// ================= ENCOUNTERS =================
// Choice-driven map events. ENC[type]={make(rv,hl) -> S.event, pick(choice,ev)}. rv = four 0-1 rolls, pre-rolled per node on the seeded daily map (see genMap)
// so the same day plays out alike. What depends on your satchel or gear (the item asked for, the healing item, the piece to temper) varies per player, like the peddler.
// Every event ends in a "done" event with no choices (or a leave), so none can trap you.
const evt=(type,icon,title,text,choices,x)=>({type,icon,title,text,loot:[],choices,sc:"",...x});
const endEv=(icon,title,text,loot,sc)=>{S.event={type:"done",icon,title,text,loot:loot||[],choices:[],sc:sc||""}};
const at=(a,x)=>a[Math.floor(x*a.length)];
const spare=id=>avail(id)-eqCount(id)>0&&!S.items[id].legendary;
const cheapest=ids=>ids.slice().sort((a,b)=>power(S.items[a])-power(S.items[b])||(a<b?-1:1))[0];
const spareGoods=()=>cheapest(Object.keys(S.inv).filter(id=>spare(id)&&!id.startsWith("ess_")));
const takeOne=id=>{S.inv[id]--;trimBench()};
const hurtYou=n=>{S.hp=Math.max(1,S.hp-n)};
const RIDDLES=[["What is born in flame, sleeps in water, and wakes as a blade?","Steel",["Ash","Smoke"]],["The more you take from me, the larger I grow. What am I?","A hole",["A shadow","A fire"]],
  ["I am struck and never complain, and everything you make begins on me.","An anvil",["A bellows","A hammer"]],["Light as a feather, yet no hero can hold me for long.","Breath",["A grudge","A sword"]]];
const ALTAR_ESS=["Arcane","Shadow","Holy","Fire"];
const ENC={
  shrine:{make:(rv,hl)=>{const n=Math.round(pstats().maxHp*.35*(hl>=5?HEAT_T.shrine:1)),g=spareGoods();
      return evt("shrine","shrine","A quiet shrine",`Moss-covered stones hum softly.${hl>=5?" The Inferno has scorched them, so they offer less.":""} Pray for strength, or give the stones something of yours.`,
        [["pray",`Pray (+${n} HP)`],...g?[["offer",`Offer your ${S.items[g].name}`]]:[],["leave","Leave"]],{rv,give:g,n})},
    pick:(c,ev)=>{
      if(c==="pray"){const got=healYou(ev.n);return endEv("shrine","Answered prayer",got?`The stones warm under your hands. You recover ${got} HP.`:"You're already in good shape, so you just enjoy the quiet.")}
      if(!ev.give||!spare(ev.give)||!S.inv[ev.give]){toast("You no longer have that item.");return endEv("shrine","The quiet shrine","The stones stay silent.")}
      const nm=S.items[ev.give].name,sc=ev.rv[0]<.6?giveHint(ev.rv[1]):"";takeOne(ev.give);
      if(sc)return endEv("shrine","The stones answer",`The moss swallows your ${nm}. A scroll unrolls where it lay.`,[],sc);
      const e=essence(at(ESS_POOL,ev.rv[2]));addItem(e);endEv("shrine","The stones answer",`The moss swallows your ${nm}. A bead of light is left behind.`,[e])}},
  altar:{make:rv=>{const a=Math.round(pstats().maxHp*.15),b=Math.round(pstats().maxHp*.4);
      return evt("altar","altar","A cursed altar","A black slab, slick with old offerings. Something that isn't quite a voice says: \"Blood buys power.\"",
        [...S.hp>a?[["small",`Prick a finger (-${a} HP, 1 essence)`]]:[],...S.hp>b?[["deep",`Open a vein (-${b} HP, 3 essences)`]]:[],["leave","Back away"]],{rv,a,b})},
    pick:(c,ev)=>{const cost=c==="deep"?ev.b:ev.a,n=c==="deep"?3:1;if(S.hp<=cost){toast("You're too weak for that.");return endEv("altar","The altar waits","You hesitate, and the moment passes.")}
      hurtYou(cost);const k=Math.floor(ev.rv[0]*4),got=Array.from({length:n},(_,i)=>essence(ALTAR_ESS[(k+i)%4]));got.forEach(id=>addItem(id));
      endEv("altar","The altar drinks",`Your blood runs black across the stone. You lose ${cost} HP. The slab gives back what it owes.`,got)}},
  alchemist:{make:rv=>{const g=spareGoods(),nm=g&&S.items[g].name,unk=REACTIONS.some(([a,b])=>!S.knownR.includes(a+"+"+b));
      return evt("alchemist","alchemist","A wandering alchemist","A hooded alchemist stirs a pot that smells of three different weathers. \"Knowledge or essence, friend. Both cost something.\"",
        [...unk?[["lesson",g?`Trade your ${nm} for a lesson`:"Hear a free lesson (you've nothing to trade)"]]:[],...g?[["swap",`Trade your ${nm} for 2 essences`]]:[],["leave","Decline"]],{rv,give:g})},
    pick:(c,ev)=>{if(ev.give&&(!spare(ev.give)||!S.inv[ev.give])){toast("You no longer have that item.");return endEv("alchemist","The alchemist shrugs","\"Come back with something to trade.\"")}
      if(c==="swap"){takeOne(ev.give);const got=[essence(at(ESS_POOL,ev.rv[1])),essence(at(ESS_POOL,ev.rv[2]))];got.forEach(id=>addItem(id));return endEv("alchemist","A fair swap",`The alchemist pockets your ${S.items[ev.give].name} and counts out two vials.`,got)}
      const unk=REACTIONS.filter(([a,b])=>!S.knownR.includes(a+"+"+b));if(!unk.length)return endEv("alchemist","Nothing left to teach","\"You know all I know. Almost.\"");
      const [a,b,res,cons]=at(unk,ev.rv[0]);if(ev.give)takeOne(ev.give);S.knownR.push(a+"+"+b);
      endEv("alchemist","A lesson learned",`"Mark this," she says. ${a} and ${b} make ${res}${cons.length?"":", and keep both"}. It's in your recipe book now.`)}},
  traveller:{make:rv=>{const med=cheapest(Object.keys(S.inv).filter(id=>spare(id)&&grp(S.items[id])==="consumable"&&statsOf(S.items[id]).heal>0));
      return evt("traveller","traveller","A wounded traveller","A traveller slumps against a milestone, one hand pressed to his side. \"Please,\" he whispers. \"Anything that heals.\" His pack looks full.",
        [...med?[["tend",`Give him your ${S.items[med].name}`]]:[],["rob","Rob him (loot, but your next fight is an ambush)"],["leave","Walk on"]],{rv,give:med})},
    pick:(c,ev)=>{
      if(c==="rob"){const p=zonePool(S.zone),got=[at(p,ev.rv[0]),at(p,ev.rv[1]),essence(at(ESS_POOL,ev.rv[2]))];got.forEach(id=>addItem(id));curMap().amb=true;
        return endEv("traveller","Ill-gotten gains","You take his pack while he's too weak to stop you. Somewhere behind you, a whistle. Your next fight starts with an ambush.",got)}
      if(!ev.give||!spare(ev.give)||!S.inv[ev.give]){toast("You no longer have that item.");return endEv("traveller","The traveller sighs","He closes his eyes.")}
      const nm=S.items[ev.give].name,rare=zoneRare(S.zone),got=[rare.length?at(rare,ev.rv[0]):at(zonePool(S.zone),ev.rv[0])];takeOne(ev.give);got.forEach(id=>addItem(id));
      endEv("traveller","Kindness repaid",`He drinks your ${nm}, and the colour returns to his face. "The road remembers." He presses something into your hands.`,got,giveHint(ev.rv[1]))}},
  forge:{make:rv=>{const sl=[["main",gearOf("main")],...["off","head","body","hands","feet","charm"].map(s=>[s,gearOf(s)])].filter(([,it])=>it&&it.tier<9).slice(0,2),n=Math.round(pstats().maxHp*.15);
      return evt("forge","forge","An old forge","A roofless forge, its coals still glowing. Whoever built it left the tongs.",
        [...sl.map(([s,it])=>[`temper:${s}`,`Temper your ${it.name} (+1 tier and strongest trait +1, 25% it cracks)`]),["warm",`Warm your hands (+${n} HP)`],["leave","Leave"]],{rv,n})},
    pick:(c,ev)=>{
      if(c==="warm"){const got=healYou(ev.n);return endEv("forge","Warm coals",got?`You sit by the coals and recover ${got} HP.`:"The coals are warm. You're already in good shape.")}
      const sl=c.slice(7),it=gearOf(sl);if(!it||it.tier>=9){toast("Nothing to temper there.");return endEv("forge","Cold coals","The fire has gone out.")}
      const bad=ev.rv[0]<.25,base=it.name.replace(/ \+\d+$/,""),n=(it.temper||0)+(bad?0:1),id="c_"+hash(it.id+":temper:"+(bad?"x":"y")).toString(36);
      if(!S.items[id]){const tr={...it.traits},top=topTraits(tr)[0];if(bad)tr.Brittle=1.5;else if(top)tr[top[0]]=r1(top[1]+1);
        S.items[id]={...it,id,crafted:true,temper:n,tier:bad?it.tier:it.tier+1,traits:tr,name:bad?`Cracked ${base}`:`${base} +${n}`}}
      takeOne(it.id);addItem(id);S.eq[sl]=id;clampHp();
      endEv("forge",bad?"It cracks":"Tempered",bad?`You strike too hard. Your ${base} cracks along its length (Brittle). The tier holds.`:`The metal rings true. Your ${base} is now tier ${S.items[id].tier}, with a stronger edge.`,[id])}},
  riddle:{make:rv=>{const [q,ans,bad]=at(RIDDLES,rv[0]),k=Math.floor(rv[1]*3),o=[ans,...bad],opts=o.map((_,i)=>o[(i+k)%3]);
      return evt("riddle","mystery","A riddle stone",`A standing stone, its face worn smooth, speaks in gravel: "${q}"`,[...opts.map((a,i)=>[`ans:${i}`,a]),["leave","Walk away"]],{rv,ok:opts.indexOf(ans),ans})},
    pick:(c,ev)=>{const ans=ev.ans;
      if(+c.slice(4)!==ev.ok){const n=Math.round(pstats().maxHp*.1);hurtYou(n);return endEv("mystery","Wrong","The stone groans, and a shard of it cracks against your shoulder. You lose "+n+` HP. The answer was "${ans}".`)}
      const e=essence(at(ESS_POOL,ev.rv[2])),sc=giveHint(ev.rv[3]),got=sc?[e]:[e,at(zonePool(S.zone),ev.rv[3])];got.forEach(id=>addItem(id));
      endEv("mystery","Correct",`"${ans}." The stone rumbles and opens like a hand.`,got,sc)}}
};

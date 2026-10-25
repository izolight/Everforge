// ================= ENCOUNTERS =================
// Choice-driven map events. ENC[type]={make(rv,hl) -> S.event, pick(choice,ev)}. rv = four 0-1 rolls (+ four more, rv[4..7], that roll the grades of what it gives), pre-rolled per POI on the seeded daily map (see genMap)
// so the same day plays out alike. What depends on your satchel or gear (the item asked for, the healing item, the piece to temper) varies per player, like the peddler.
// Every event ends in a "done" event with no choices (or a leave), so none can trap you.
const evt=(type,icon,title,text,choices,x)=>({type,icon,title,text,loot:[],choices,sc:"",...x});
const endEv=(icon,title,text,loot,sc)=>{if(loot&&loot.length)sfx("loot");S.event={type:"done",icon,title,text,loot:loot||[],choices:[],sc:sc||""}};
const at=(a,x)=>a[Math.floor(x*a.length)];
const spare=id=>!itemLocked(id)&&avail(id)-eqCount(id)>0&&!S.items[id].legendary;
const cheapest=ids=>ids.slice().sort((a,b)=>power(S.items[a])-power(S.items[b])||(a<b?-1:1))[0];
const wanted=id=>SECRETS.some(s=>!found(s)&&s.ids.includes(id)),spareList=()=>Object.keys(S.inv).filter(id=>spare(id)&&!isEss(id)&&!wanted(id)).sort((a,b)=>power(S.items[a])-power(S.items[b])||(a<b?-1:1)),spareGoods=()=>spareList()[0];
const takeOne=id=>{S.inv[id]--;trimBench()};
const hurtYou=n=>{S.hp=Math.max(1,S.hp-n)};
const RIDDLES=[["What is born in flame, sleeps in water, and wakes as a blade?","Steel",["Ash","Smoke"]],["The more you take from me, the larger I grow. What am I?","A hole",["A shadow","A fire"]],
  ["I am struck and never complain, and everything you make begins on me.","An anvil",["A bellows","A hammer"]],["Light as a feather, yet no hero can hold me for long.","Breath",["A grudge","A sword"]]];
const ALTAR_ESS=["Arcane","Shadow","Holy","Fire"];
const ENC={
  shrine:{make:(rv,hl)=>{const n=Math.round(pstats().maxHp*.35*(hl>=5?HEAT_T.shrine:1)),g=spareGoods();
      return evt("shrine","shrine",tx("A quiet shrine"),tx("Moss-covered stones hum softly.")+(hl>=5?" "+tx("The Inferno has scorched them, so they offer less."):"")+" "+tx("Pray for strength, or give the stones something of yours."),
        [["pray",tx("Pray (+{n} HP, +{t} torch)",{n,t:TORCH.shrine})],...g?[["offer",tx("Offer your {item}",{item:iname(S.items[g])})]]:[],["leave",tx("Leave")]],{rv,give:g,n})},
    pick:(c,ev)=>{
      if(c==="pray"){const got=healYou(ev.n),lit=torchUp(TORCH.shrine);return endEv("shrine",tx("Answered prayer"),(got?tx("The stones warm under your hands. You recover {n} HP.",{n:got}):tx("You're already in good shape, so you just enjoy the quiet."))+(lit?" "+tx("Your torch flares back to life (+{n}).",{n:lit}):""))}
      if(!ev.give||!spare(ev.give)||!S.inv[ev.give]){toast(tx("You no longer have that item."));return endEv("shrine",tx("The quiet shrine"),tx("The stones stay silent."))}
      const nm=iname(S.items[ev.give]),sc=ev.rv[0]<.6?giveHint(ev.rv[1]):"";takeOne(ev.give);
      if(sc)return endEv("shrine",tx("The stones answer"),tx("The moss swallows your {item}. A scroll unrolls where it lay.",{item:nm}),[],sc);
      const e=essNow(at(ESS_POOL,ev.rv[2]),ev.rv[4]);addItem(e);endEv("shrine",tx("The stones answer"),tx("The moss swallows your {item}. A bead of light is left behind.",{item:nm}),[e])}},
  altar:{make:rv=>{const a=Math.round(pstats().maxHp*.15),b=Math.round(pstats().maxHp*.4);
      return evt("altar","altar",tx("A cursed altar"),tx("A black slab, slick with old offerings. Something that isn't quite a voice says: \"Blood buys power.\""),
        [...S.hp>a?[["small",tx("Prick a finger (-{n} HP, 1 essence)",{n:a})]]:[],...S.hp>b?[["deep",tx("Open a vein (-{n} HP, 3 essences)",{n:b})]]:[],["leave",tx("Back away")]],{rv,a,b})},
    pick:(c,ev)=>{const cost=c==="deep"?ev.b:ev.a,n=c==="deep"?3:1;if(S.hp<=cost){toast(tx("You're too weak for that."));return endEv("altar",tx("The altar waits"),tx("You hesitate, and the moment passes."))}
      hurtYou(cost);const k=Math.floor(ev.rv[0]*4),got=Array.from({length:n},(_,i)=>essNow(ALTAR_ESS[(k+i)%4],ev.rv[4+i]));got.forEach(id=>addItem(id));
      endEv("altar",tx("The altar drinks"),tx("Your blood runs black across the stone. You lose {n} HP. The slab gives back what it owes.",{n:cost}),got)}},
  alchemist:{make:rv=>{const g=spareGoods(),nm=g&&iname(S.items[g]),unk=REACTIONS.some(([a,b])=>!S.knownR.includes(a+"+"+b));
      return evt("alchemist","alchemist",tx("A wandering alchemist"),tx("A hooded alchemist stirs a pot that smells of three different weathers. \"Knowledge or essence, friend. Both cost something.\""),
        [...unk?[["lesson",g?tx("Trade your {item} for a lesson",{item:nm}):tx("Hear a free lesson (you've nothing to trade)")]]:[],...g?[["swap",tx("Trade your {item} for 2 essences",{item:nm})]]:[],["leave",tx("Decline")]],{rv,give:g})},
    pick:(c,ev)=>{if(ev.give&&(!spare(ev.give)||!S.inv[ev.give])){toast(tx("You no longer have that item."));return endEv("alchemist",tx("The alchemist shrugs"),tx("\"Come back with something to trade.\""))}
      if(c==="swap"){takeOne(ev.give);const got=[essNow(at(ESS_POOL,ev.rv[1]),ev.rv[4]),essNow(at(ESS_POOL,ev.rv[2]),ev.rv[5])];got.forEach(id=>addItem(id));return endEv("alchemist",tx("A fair swap"),tx("The alchemist pockets your {item} and counts out two vials.",{item:iname(S.items[ev.give])}),got)}
      const unk=REACTIONS.filter(([a,b])=>!S.knownR.includes(a+"+"+b));if(!unk.length)return endEv("alchemist",tx("Nothing left to teach"),tx("\"You know all I know. Almost.\""));
      const [a,b,res,cons]=at(unk,ev.rv[0]);if(ev.give)takeOne(ev.give);learnReaction(a+"+"+b);
      endEv("alchemist",tx("A lesson learned"),cons.length?tx("\"Mark this,\" she says. {a} and {b} make {r}. It's in your recipe book now.",{a:trn(a),b:trn(b),r:trn(res)}):tx("\"Mark this,\" she says. {a} and {b} make {r}, and keep both. It's in your recipe book now.",{a:trn(a),b:trn(b),r:trn(res)}))}},
  traveller:{make:rv=>{const med=cheapest(Object.keys(S.inv).filter(id=>spare(id)&&grp(S.items[id])==="consumable"&&statsOf(S.items[id]).heal>0));
      return evt("traveller","traveller",tx("A wounded traveller"),tx("A traveller slumps against a milestone, one hand pressed to his side. \"Please,\" he whispers. \"Anything that heals.\" His pack looks full."),
        [...med?[["tend",tx("Give him your {item}",{item:iname(S.items[med])})]]:[],["rob",tx("Rob him (loot, but the next fight is an ambush)")],["leave",tx("Walk on")]],{rv,give:med})},
    pick:(c,ev)=>{
      if(c==="rob"){const p=zonePool(S.zone),got=[dropNow(at(p,ev.rv[0]),ev.rv[4]),dropNow(at(p,ev.rv[1]),ev.rv[5]),essNow(at(ESS_POOL,ev.rv[2]),ev.rv[6])];got.forEach(id=>addItem(id));curMap().amb=true;
        return endEv("traveller",tx("Ill-gotten gains"),tx("You take his pack while he's too weak to stop you. Somewhere behind you, a whistle. If your next stop is a fight, it starts with an ambush."),got)}
      if(!ev.give||!spare(ev.give)||!S.inv[ev.give]){toast(tx("You no longer have that item."));return endEv("traveller",tx("The traveller sighs"),tx("He closes his eyes."))}
      const nm=iname(S.items[ev.give]),f=rareFind(S.zone,heatNow(),ev.rv[0],ev.rv[3],ev.rv[4]),got=[f||dropNow(at(zonePool(S.zone),ev.rv[0]),ev.rv[4])];takeOne(ev.give);got.forEach(id=>addItem(id));
      endEv("traveller",tx("Kindness repaid"),tx("He drinks your {item}, and the colour returns to his face. \"The road remembers.\" He presses something into your hands.",{item:nm}),got,giveHint(ev.rv[1]))}},
  forge:{make:rv=>{const sl=[["main",gearOf("main")],...["off","head","body","hands","feet","charm"].map(s=>[s,gearOf(s)])].filter(([,it])=>it&&it.tier<9).slice(0,2),n=Math.round(pstats().maxHp*.15);
      return evt("forge","forge",tx("An old forge"),tx("A roofless forge, its coals still glowing. Whoever built it left the tongs."),
        [...sl.map(([s,it])=>[`temper:${s}`,tx("Temper your {item} (+1 tier and strongest trait +1, 25% it cracks)",{item:iname(it)})]),["warm",tx("Warm your hands (+{n} HP)",{n})],["leave",tx("Leave")]],{rv,n})},
    pick:(c,ev)=>{
      if(c==="warm"){const got=healYou(ev.n);return endEv("forge",tx("Warm coals"),got?tx("You sit by the coals and recover {n} HP.",{n:got}):tx("The coals are warm. You're already in good shape."))}
      const sl=c.slice(7),it=gearOf(sl);if(!it||it.tier>=9){toast(tx("Nothing to temper there."));return endEv("forge",tx("Cold coals"),tx("The fire has gone out."))}
      const bad=ev.rv[0]<.25,base=it.name.replace(/ \+\d+$/,"").replace(/^Cracked /,""),n=(it.temper||0)+(bad?0:1),id="c_"+hash(it.id+":temper:"+(bad?"x":"y")).toString(36);
      if(!S.items[id]){const tr={...it.traits},top=topTraits(tr)[0];if(bad)tr.Brittle=Math.max(tr.Brittle||0,1.5);else if(top)tr[top[0]]=r1(top[1]+1);
        S.items[id]={...it,...it.unweak&&top&&!bad?{unweak:{...it.unweak,[top[0]]:r1((it.unweak[top[0]]||0)+1)}}:{},id,crafted:true,recipe:undefined,recipeIds:undefined,clean:undefined,temper:n,tier:bad?it.tier:it.tier+1,traits:tr,name:bad?`Cracked ${base}`:`${base} +${n}`}}
      takeOne(it.id);addItem(id);S.eq[sl]=id;clampHp();
      endEv("forge",bad?tx("It cracks"):tx("Tempered"),bad?tx("You strike too hard. Your {base} cracks along its length (Brittle). The tier holds.",{base:craftedName(base)}):tx("The metal rings true. Your {base} is now tier {n}, with a stronger edge.",{base:craftedName(base),n:S.items[id].tier}),[id])}},
  riddle:{make:rv=>{const [q,ans,bad]=at(RIDDLES,rv[0]),k=Math.floor(rv[1]*3),o=[ans,...bad],opts=o.map((_,i)=>o[(i+k)%3]);
      return evt("riddle","mystery",tx("A riddle stone"),tx("A standing stone, its face worn smooth, speaks in gravel: \"{q}\"",{q:tx(q)}),[...opts.map((a,i)=>[`ans:${i}`,tx(a)]),["leave",tx("Walk away")]],{rv,ok:opts.indexOf(ans),ans:tx(ans)})},
    pick:(c,ev)=>{const ans=ev.ans;
      if(+c.slice(4)!==ev.ok){const n=Math.round(pstats().maxHp*.1);hurtYou(n);return endEv("mystery",tx("Wrong"),tx("The stone groans, and a shard of it cracks against your shoulder. You lose {n} HP. The answer was \"{ans}\".",{n,ans}))}
      const e=essNow(at(ESS_POOL,ev.rv[2]),ev.rv[4]),sc=giveHint(ev.rv[3]),got=sc?[e]:[e,dropNow(at(zonePool(S.zone),ev.rv[3]),ev.rv[5])];got.forEach(id=>addItem(id));
      endEv("mystery",tx("Correct"),tx("\"{ans}.\" The stone rumbles and opens like a hand.",{ans}),got,sc)}}
};

// ================= BATTLE =================
const vary=()=>.85+Math.random()*.3;
const zoneOpen=z=>S.unlocked.includes(z);
function blog(t,c){S.battle.log.push({t,c:c||""});if(S.battle.log.length>50)S.battle.log.shift()}
function pickEnemy(zone){const pool=Object.entries(ENEMIES).filter(([,e])=>e.zone===zone&&!e.boss);let r=Math.random()*pool.reduce((s,[,e])=>s+e.w,0);
  for(const [id,e] of pool){r-=e.w;if(r<=0)return id}return pool[0][0]}
function startBattle(forced,opt){
  opt=opt||{};const id=forced||pickEnemy(S.zone),E=ENEMIES[id],sc=1+.06*(opt.row||0);
  const B={id,name:E.name,el:E.el,hp:Math.round(E.hp*sc),max:Math.round(E.hp*sc),atk:Math.round(E.atk*sc),def:E.def,weak:[...E.weak],resist:[...E.resist],turn:1,
    burn:null,poison:0,you:{},off:0,parry:false,shred:0,ward:null,frozen:false,guard:false,reborn:false,elite:null,log:[],over:null,loot:[]};
  if(id==="mimic"){const zi=zoneIdx(S.zone);B.max=B.hp=Math.round(E.hp*[1,1.9,2.8][zi]);B.atk=Math.round(E.atk*[1,1.6,2.1][zi]);B.def=E.def+zi*2}
  if(opt.ambush)B.log.push({t:"Ambush! Something leaps out at you.",c:"big"});
  if(!E.boss&&id!=="mimic"&&(opt.elite||Math.random()<.08)){const [adj,trait]=pick(AFFIXES),f=TRAITS[trait].f;
    B.elite=trait;B.name=`${adj} ${E.name}`;B.el=f;B.max=B.hp=Math.round(B.max*1.5);B.atk=Math.round(B.atk*1.25);B.def=E.def+1;
    if(!B.resist.includes(f))B.resist.push(f);B.weak=B.weak.filter(x=>x!==f)}
  S.battle=B;S.event=null;S.seen[id]=true;cx(id);
  blog(B.elite?`${E.intro} It crackles with ${B.elite.toLowerCase()}. An elite!`:E.intro,B.elite||E.boss?"big":"");
  const P=pstats(),rp=P.rs[B.el];if(rp)blog(`${RES_MSG[B.el]} (-${rp}% damage)`,"good");
  if(P.ward){B.ward=P.ward;blog(`A rune ward flares around you (${P.ward}).`,"good")}
  save();render();
}
const isSpecial=B=>{const sp=ENEMIES[B.id].sp;return sp&&B.turn%sp.every===0};
function eff(traits,B){
  const ent=topTraits(traits).filter(([t])=>TRAITS[t].f!=="bad");
  const w=ent.find(([t])=>B.weak.includes(TRAITS[t].f));if(w)return{m:1.5,t:w[0],f:TRAITS[w[0]].f,k:"weak"};
  if(ent[0]&&B.resist.includes(TRAITS[ent[0][0]].f))return{m:.6,t:ent[0][0],f:TRAITS[ent[0][0]].f,k:"resist"};
  return{m:1};
}
function noteEff(ef){const B=S.battle,E=ENEMIES[B.id];if(ef.k==="weak")learn(B.id,"weak",ef.f);if(ef.k==="resist"&&E.resist.includes(ef.f))learn(B.id,"resist",ef.f)}
const stOf=()=>S.battle.you||(S.battle.you={});
const cures=tr=>[...new Set(Object.keys(tr).filter(t=>tr[t]>0&&CURES[t]).flatMap(t=>CURES[t]))];
function inflict(B,P,sp){ // enemy hit landed: maybe afflict you; your element resist lowers the odds
  const Y=stOf(),E=ENEMIES[B.id],l=E.inf?[E.inf]:[];if(B.elite&&ELITE_INF[B.elite]&&!(E.inf&&E.inf.s===ELITE_INF[B.elite]))l.push({s:ELITE_INF[B.elite],ch:ELITE_INF_CH});
  l.forEach(({s,ch})=>{const T=STATUS[s];if(Math.random()>=Math.min(1,ch*(sp?2:1))*(1-(P.rs[T.el]||0)/100))return;
    if(s==="poison"){const o=Y.poison||{n:0};Y.poison={n:Math.min(POISON_STACK,o.n+1),t:T.t,d:Math.max(1,Math.round(B.atk*.12))}}
    else Y[s]={t:T.t,d:Math.max(1,Math.round(B.atk*.2))};
    blog(INF_MSG[s]+(s==="poison"&&Y.poison.n>1?` (x${Y.poison.n})`:""),"foe");learn(B.id,"inf",s)})}
function tickYou(B,P){
  const Y=stOf();
  ["burn","poison"].forEach(s=>{const x=Y[s];if(!x||S.hp<=0)return;const d=s==="poison"?x.d*x.n:x.d;S.hp-=d;fx("youHud","-"+d,"hurt");
    blog(s==="burn"?`Flames lick you for ${d}.`:`Venom burns in your veins for ${d}.`,"foe")});
  const live=Object.keys(Y);
  if(P.cleanse&&live.length&&S.hp>0&&Math.random()*100<Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER)){const s=pick(live);delete Y[s];blog(`Your gear helps you shake off the ${STATUS[s].n.toLowerCase()}.`,"good")}
  Object.keys(Y).forEach(s=>{if(--Y[s].t<=0){delete Y[s];blog(`The ${STATUS[s].n.toLowerCase()} fades.`,"good")}})}
function healYou(n,why){const P=pstats(),b=S.hp;if(S.battle&&!S.battle.over&&stOf().curse)n=Math.ceil(n/2);S.hp=Math.min(P.maxHp,S.hp+n);const got=S.hp-b;if(got>0){fx("youHud","+"+got,"heal");if(why&&S.battle&&!S.battle.over)blog(`${why} (+${got} HP).`,"good")}return got}
function strike(W,pow,label,inn){
  const B=S.battle,E=ENEMIES[B.id],tr=inn?withInnate(W?W.traits:{}):(W?W.traits:{}),v=t=>tr[t]||0,mast=know(B.id).mastered?1.15:1;
  let ef=eff(tr,B);const arc=ef.k==="resist"&&v("Arcane")&&Math.random()*100<Math.min(ARC_CAP,v("Arcane")*ARC_PER);if(arc){ef={m:1};blog("Arcane power cuts through its resistance.","you")}
  const crit=Math.random()*100<Math.min(CRIT_CAP,5+v("Sharp")*3),pierce=v("Heavy")?.4:1;
  const dmg=Math.max(1,Math.round((pow*.5-Math.max(0,B.def-(B.shred||0))*pierce)*ef.m*mast*(crit?1.75:1)*vary()));
  B.hp-=dmg;fx("enemyHud","-"+dmg,crit?"crit":"");fx("foeArt","","hit");
  const note=ef.k==="weak"?` ${ef.t} cuts deep!`:ef.k==="resist"?` It resists the ${ef.t.toLowerCase()}.`:"";
  blog(`${label} for ${dmg}${crit?", a critical hit":""}.${note}`,crit?"big":"you");noteEff(ef);
  if(B.hp<=0)return;
  if(v("Tempered")&&B.def>0){const c=Math.min(SHRED_CAP,Math.round(v("Tempered")*SHRED_PER)),s=Math.min(c,B.def,(B.shred||0)+1);if(s>(B.shred||0)){B.shred=s;blog(`Its armor cracks (-${s} DEF).`,"you")}}
  const fire=v("Fire")+v("Sunfire"),ice=v("Ice")+v("Frost"),poi=v("Poison")+v("Venomous"),holy=v("Holy")+v("Radiant"),sha=v("Shadow")+v("Twilight");
  const immune=(f,msg)=>{blog(msg,"");if(E.resist.includes(f))learn(B.id,"resist",f)};
  if(fire){if(B.resist.includes("fire"))immune("fire",`The ${B.name} won't burn.`);else{const d=Math.max(1,Math.round(fire*.8));if(!B.burn)blog(`The ${B.name} catches fire.`,"you");B.burn={d,t:3}}}
  if(ice){if(B.resist.includes("ice"))immune("ice","The cold slides right off it.");else if(!B.frozen&&Math.random()*100<Math.min(FREEZE_CAP,6+ice*4)){B.frozen=true;blog(`The ${B.name} is frozen solid!`,"big")}}
  if(poi){if(B.resist.includes("poison"))immune("poison","The poison has no effect.");else B.poison=Math.min(15,B.poison+Math.round(poi))}
  if(holy)healYou(Math.round(holy),"Holy light mends you");
  if(sha)healYou(Math.round(dmg*Math.min(.4,.07*sha)),"You drain its life");
}
function attack(){
  const P=pstats(),B=S.battle;
  strike(P.main,P.atk+P.mag*.7,P.main?`You strike with ${P.main.name}`:"You punch",true);
  if(B.hp>0&&!stOf().chill&&Math.random()*100<Math.min(35,P.spd*3))strike(P.main,P.atk+P.mag*.7,"A swift follow-up hits",true);
  if(B.hp>0&&P.offW)strike(P.offW,P.offPow*2,`Your off-hand ${P.offW.name} adds`);
  afterPlayer();
}
function guard(){const B=S.battle;if(B.off>0)blog("You're off balance. Your guard falters.","foe");else{B.guard=true;blog("You raise your guard.","you")}enemyTurn()}
function parry(){const B=S.battle;if(B.off>0)blog("You're off balance. Your parry falters.","foe");else{B.parry=true;blog("You wait for an opening...","you")}enemyTurn()}
function study(){
  const B=S.battle,u=unknownFacts(B.id);S.stats.studied++;
  if(!u.length){blog("You already know everything about it.","");return enemyTurn()}
  const [type,val]=pick(u);blog(`You study the ${B.name} closely...`,"you");learn(B.id,type,val);enemyTurn();
}
function useItem(id){
  const B=S.battle,it=S.items[id],st=statsOf(it);
  S.inv[id]--;trimBench();
  let did=false;const Y=stOf(),cu=cures(it.traits).filter(s=>Y[s]);
  if(cu.length){cu.forEach(s=>delete Y[s]);blog(`${it.name} clears your ${cu.map(s=>STATUS[s].n.toLowerCase()).join(" and ")}.`,"good");did=true}
  if(st.heal>0){healYou(medHeal(it),`You use ${it.name}`);did=true}
  const d=Math.round((st.atk+st.mag)*.6);
  if(d>=3){const ef=eff(it.traits,B),dmg=Math.max(1,Math.round(d*ef.m*vary()));B.hp-=dmg;fx("enemyHud","-"+dmg,"");fx("foeArt","","hit");
    blog(`${it.name} bursts against the ${B.name} for ${dmg}.${ef.k==="weak"?" Super effective!":""}`,"you");noteEff(ef);did=true}
  if(!did)blog(`You use ${it.name}. Nothing happens.`);
  afterPlayer();
}
function flee(){
  const B=S.battle;
  if(ENEMIES[B.id].boss&&Math.random()<.5){blog("There's no escaping it!","foe");return enemyTurn()}
  if(Math.random()<.7){B.over="fled";blog("You slip away into cover.");
    if(ENEMIES[B.id].boss){const m=curMap();m.path.pop();const prev=m.path[m.path.length-1];m.pos=prev?{r:prev[0],i:prev[1]}:null;
      m.rows[MAP_ROWS-1].forEach(nd=>nd.done=false);blog("You fall back to the camp. The way to the boss is still open.","good")}
    save();return render()}
  blog("You try to run, but it cuts you off.");enemyTurn();
}
function afterPlayer(){if(S.battle.hp<=0)return enemyDown();enemyTurn()}
function enemyTurn(){
  const B=S.battle,E=ENEMIES[B.id],P=pstats(),Y=stOf();
  if(B.burn){B.hp-=B.burn.d;fx("enemyHud","-"+B.burn.d,"hurt");blog(`Flames lick the ${B.name} for ${B.burn.d}.`,"you");if(--B.burn.t<=0)B.burn=null}
  if(B.poison&&B.hp>0){B.hp-=B.poison;fx("enemyHud","-"+B.poison,"hurt");blog(`Poison eats at the ${B.name} for ${B.poison}.`,"you")}
  if(B.hp<=0)return enemyDown();
  const sp=isSpecial(B)?E.sp:null;
  if(B.frozen){B.frozen=false;blog(`The ${B.name} is frozen and can't act.`,"good")}
  else if(sp&&sp.kind==="heal"&&B.parry){blog(`You break the ${B.name}'s concentration. ${sp.name} fizzles!`,"good");learn(B.id,"sp",1)}
  else if(sp&&sp.kind==="heal"){const h=Math.min(B.max-B.hp,Math.round(B.max*sp.x));B.hp+=h;if(h)fx("enemyHud","+"+h,"heal");blog(`The ${B.name} uses ${sp.name} and recovers ${h} HP.`,"foe");learn(B.id,"sp",1)}
  else{
    const hits=sp&&sp.kind==="multi"?sp.n:1,mult=sp?sp.x:1,perfect=B.parry&&sp,dg=Y.chill?Math.round(P.dodge/2):P.dodge;
    if(sp){blog(`The ${B.name} uses ${sp.name}!`,"foe");learn(B.id,"sp",1)}
    if(perfect){blog(`Perfect parry! You turn ${sp.name} aside.`,"big");strike(P.main,(P.atk+P.mag*.7)*PARRY_X,"You riposte",true)}
    else if(B.parry){blog("Your parry is mistimed! You're left open.","foe");B.off=2}
    for(let i=0;i<hits&&S.hp>0&&!perfect&&B.hp>0;i++){
      if(P.blind&&Math.random()<Math.min(.4,.08*P.blind)){blog("Steam clouds its eyes. It misses.","good");continue}
      if(P.shield&&!B.guard&&Math.random()<.15+(P.shield.traits.Heavy||0)*.03){blog(`You block with ${P.shield.name}.`,"good");continue}
      if(dg&&Math.random()*100<dg){blog("You dodge aside. It misses.","good");continue}
      let dmg=Math.max(1,Math.round(B.atk*mult*vary()*(1-P.red)*(B.guard?.4:1)*(B.parry?PARRY_FAIL:1)*(1-(P.rs[B.el]||0)/100)));
      if(P.dr)dmg=Math.max(1,Math.round(dmg-P.dr));
      if(B.ward==null)B.ward=P.ward; // old battles start unwarded
      const tot=dmg,ab=Math.min(B.ward,dmg);B.ward-=ab;dmg-=ab;S.hp-=dmg;
      fx("youHud",dmg?"-"+dmg:"","hurt");fx("youHud","","shake");fx("vig","","on");
      blog(sp?`It hits you for ${tot}${B.guard?" through your guard":""}.`:`The ${B.name} ${E.verb} for ${tot}${B.guard?" through your guard":""}.`,"foe");
      if(dmg>0&&S.hp>0)inflict(B,P,sp);
      if(ab)blog(`Your rune ward absorbs ${ab}${B.ward?"":" and shatters"}.`,"good");
      if(P.thorns&&dmg>0&&S.hp>0){const th=Math.max(1,Math.round(dmg*P.thorns/100));B.hp-=th;fx("enemyHud","-"+th,"hurt");blog(`Your iron barbs bite it for ${th}.`,"you");if(B.hp<=0)break}
      if(sp&&sp.kind==="drain"){B.hp=Math.min(B.max,B.hp+dmg);blog(`It drinks ${dmg} HP from you.`,"foe")}
    }
    if(S.hp<=0)return youFall();
    if(B.hp<=0)return enemyDown();
  }
  tickYou(B,P);if(S.hp<=0)return youFall();
  if(P.regen&&S.hp<P.maxHp)healYou(P.regen,"Your gear mends you");
  if(P.root&&S.hp<P.maxHp*.5)healYou(P.root,"Roots knit your wounds");
  B.guard=false;B.parry=false;if(B.off>0)B.off--;B.turn++;save();render();
}
function enemyDown(){
  const B=S.battle,E=ENEMIES[B.id];
  if(E.rebirth&&!B.reborn){B.reborn=true;B.hp=Math.round(B.max*.4);B.burn=null;B.poison=0;B.guard=false;B.parry=false;blog(`The ${B.name} bursts into flame and rises from its ashes!`,"big");B.turn++;save();return render()}
  const P=pstats();
  B.hp=0;B.over="won";S.kills[B.id]=(S.kills[B.id]||0)+1;S.wins+=E.boss?3:1;
  if(!E.boss&&B.id!=="mimic")S.zoneKills[E.zone]=(S.zoneKills[E.zone]||0)+1;
  const mult=1+P.lure*.15;let got;
  if(B.id==="mimic"){const p=zonePool(S.zone);got=[pick(p),pick(p),essence(pick(ESS_POOL))]}
  else{got=E.drops.filter(([,p])=>Math.random()<p*mult).map(([id])=>id);if(!got.length)got=[E.drops[0][0]]}
  if(B.elite)got.push(essence(B.elite));
  blog(`The ${B.name} falls.${P.lure?" Your Lure gear draws in extra scraps.":""}`,"good");
  learn(B.id,"stats",1);
  got.forEach(id=>{addItem(id);if(E.drops.some(d=>d[0]===id))learn(B.id,"drops",id)});B.loot=got;
  S.campProg++;let msg="";if(S.campProg>=3){S.campProg=0;if(S.camp<3){S.camp++;msg="You earned a campfire charge."}}
  if(E.boss){const next=ZONES[zoneIdx(E.zone)+1];if(S.maps[E.zone])S.maps[E.zone].cleared=true;
    if(next&&!S.unlocked.includes(next[0])){S.unlocked.push(next[0]);msg=`${next[1]} is now open!`}
    else if(!next&&S.kills[B.id]===1)msg="You've conquered the realm. The forge never sleeps, though."}
  save();render();if(msg)toast(msg);
}
function youFall(){
  const B=S.battle,P=pstats();S.hp=0;B.over="lost";
  const pool=[];Object.keys(S.inv).forEach(id=>{const free=(S.inv[id]||0)-eqCount(id);for(let i=0;i<free;i++)pool.push(id)});
  let lost=null;if(pool.length){lost=pick(pool);S.inv[lost]--;trimBench()}
  S.hp=Math.round(P.maxHp*.3);S.maps[S.zone]=genMap();
  blog(`You collapse and wake at the edge of ${zoneName(S.zone)} with ${S.hp} HP. The paths have shifted.${lost?` A scavenger made off with your ${S.items[lost].name}.`:""}`,"foe");
  save();render();
}
function rest(){const P=pstats();if(S.camp<=0||S.hp>=P.maxHp)return;S.camp--;const g=healYou(Math.round(P.maxHp*.5));save();render();toast(`You rest by the fire and recover ${g} HP.`)}
function trimBench(){const seen={};S.bench=S.bench.filter(id=>{seen[id]=(seen[id]||0)+1;return seen[id]<=(S.inv[id]||0)})}

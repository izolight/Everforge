// ================= BATTLE =================
const vary=()=>.85+Math.random()*.3;
const zoneOpen=z=>S.unlocked.includes(z);
function blog(t,c){S.battle.log.push({t,c:c||""});if(S.battle.log.length>50)S.battle.log.shift()}
function pickEnemy(zone,R=Math.random){const pool=Object.entries(ENEMIES).filter(([,e])=>e.zone===zone&&!e.boss);let r=R()*pool.reduce((s,[,e])=>s+e.w,0);
  for(const [id,e] of pool){r-=e.w;if(r<=0)return id}return pool[0][0]}
function startBattle(forced,opt){
  opt=opt||{};const id=forced||opt.e||pickEnemy(S.zone),E=ENEMIES[id],sc=1+.06*(opt.row||0),h=heatNow(),tw=twistNow();
  const B={id,name:E.name,el:E.el,hp:Math.round(E.hp*sc),max:Math.round(E.hp*sc),atk:Math.round(E.atk*sc),def:E.def,weak:[...E.weak],resist:[...E.resist],turn:1,
    burn:null,poison:0,bleed:null,stun:0,open:false,cd:{},you:{},off:0,parry:false,shred:0,ward:null,frozen:false,guard:false,reborn:false,phased:false,elite:null,log:[],over:null,loot:[]};
  if(id==="mimic"){const zi=zoneIdx(S.zone),at=(a,i)=>a[Math.min(i,a.length-1)];B.max=B.hp=Math.round(E.hp*at(MIMIC_HP,zi));B.atk=Math.round(E.atk*at(MIMIC_ATK,zi));B.def=E.def+zi*2}
  B.heat=h;
  if(h){const k=1+HEAT_T.hp;B.max=B.hp=Math.round(B.max*k);B.atk=Math.round(B.atk*k)}
  if(h>=4&&E.boss){B.max=B.hp=Math.round(B.max*HEAT_T.boss);if(E.sp)B.spEvery=spEvery(E,h)}
  if(tw==="double")B.atk*=2;
  if(opt.ambush)B.log.push({t:"Ambush! Something leaps out at you.",c:"big"});
  if(!E.boss&&id!=="mimic"&&(opt.elite||tw==="elites"||(opt.up!=null?opt.up:Math.random()<eliteCh(h)))){const [adj,trait]=AFFIXES[opt.af!=null?opt.af:Math.floor(Math.random()*AFFIXES.length)],f=TRAITS[trait].f;
    B.elite=trait;B.name=`${adj} ${E.name}`;B.el=f;B.max=B.hp=Math.round(B.max*1.5);B.atk=Math.round(B.atk*1.25);B.def=E.def+1;
    if(!B.resist.includes(f))B.resist.push(f);B.weak=B.weak.filter(x=>x!==f)}
  S.battle=B;S.event=null;S.seen[id]=true;cx(id);
  blog(B.elite?`${E.intro} It crackles with ${B.elite.toLowerCase()}. An elite!`:E.intro,B.elite||E.boss?"big":"");
  if(h)blog(`The heat is on: Heat ${h}, ${HEAT[h-1].name}.`,"foe");
  const P=pstats(),rp=P.rs[B.el];if(rp)blog(`${RES_MSG[B.el]} (-${rp}% damage)`,"good");
  if(P.ward){B.ward=P.ward;blog(`A rune ward flares around you (${P.ward}).`,"good")}
  if(P.main&&P.main.form==="spear"&&!opt.ambush){blog("Your spear darts out before it can move.","you");strike(P.main,(P.atk+P.mag*.7)*ABILITIES.spear.open,"Opening jab",true);if(B.hp<=0)return enemyDown()}
  save();render();
}
const spEvery=(E,h)=>E.boss&&h>=4?Math.max(2,E.sp.every-1):E.sp.every;
// the enemy as it fights now: a phased boss swaps in its second form's fields
const foeOf=B=>{const E=ENEMIES[B.id];return B.phased&&E.phase?{...E,...E.phase.to}:E};
const isSpecial=B=>{const sp=foeOf(B).sp;return sp&&B.turn%(B.spEvery||sp.every)===0};
function eff(traits,B){
  const ent=topTraits(traits).filter(([t])=>TRAITS[t].f!=="bad");
  const w=ent.find(([t])=>B.weak.includes(TRAITS[t].f));if(w)return{m:1.5,t:w[0],f:TRAITS[w[0]].f,k:"weak"};
  if(ent[0]&&B.resist.includes(TRAITS[ent[0][0]].f))return{m:.6,t:ent[0][0],f:TRAITS[ent[0][0]].f,k:"resist"};
  return{m:1};
}
function noteEff(ef){const B=S.battle,E=foeOf(B);if(ef.k==="weak")learn(B.id,"weak",ef.f);if(ef.k==="resist"&&E.resist.includes(ef.f))learn(B.id,"resist",ef.f)}
const dealt=(B,n)=>{S.stats.dealt+=Math.max(0,Math.min(n,B.hp))}; // damage dealt counts HP actually removed (no overkill); call before subtracting
const stOf=()=>S.battle.you||(S.battle.you={});
const cures=tr=>[...new Set(Object.keys(tr).filter(t=>tr[t]>0&&CURES[t]).flatMap(t=>CURES[t]))];
function inflict(B,P,sp){ // enemy hit landed: maybe afflict you; your element resist lowers the odds
  const Y=stOf(),E=foeOf(B);let l=E.inf?[E.inf]:[];if(B.elite&&ELITE_INF[B.elite]&&!(E.inf&&E.inf.s===ELITE_INF[B.elite]))l.push({s:ELITE_INF[B.elite],ch:ELITE_INF_CH});
  const hot=twistNow()==="cinder",hm=B.heat>=3?HEAT_T.inf:1;
  if(hot)l=l.some(x=>x.s==="burn")?l.map(x=>x.s==="burn"?{...x,ch:x.ch*2}:x):[...l,{s:"burn",ch:.3}];
  l.forEach(({s,ch})=>{const T=STATUS[s];if(Math.random()>=Math.min(1,ch*hm*(sp?2:1))*(1-(P.rs[T.el]||0)/100))return;
    if(s==="poison"){const o=Y.poison||{n:0};Y.poison={n:Math.min(POISON_STACK,o.n+1),t:T.t,d:Math.max(1,Math.round(B.atk*.12))}}
    else Y[s]={t:T.t,d:Math.max(1,Math.round(B.atk*.2*(hot&&s==="burn"?1.5:1)))};
    S.stats.sufd++;sfx("status");blog(`${INF_MSG[s]} (${s==="burn"||s==="poison"?`${s==="poison"?Y.poison.d*Y.poison.n:Y[s].d} damage per turn${s==="poison"&&Y.poison.n>1?`, x${Y.poison.n}`:""}`:STATUS[s].tip}).`,"foe");if(E.inf&&E.inf.s===s)learn(B.id,"inf",s)})}
function tickYou(B,P){
  const Y=stOf();
  ["burn","poison"].forEach(s=>{const x=Y[s];if(!x||S.hp<=0)return;const d=s==="poison"?x.d*x.n:x.d;S.stats.taken+=Math.min(d,S.hp);S.hp-=d;fx("youHud","-"+d,"hurt");
    blog(s==="burn"?`Flames lick you for ${d}.`:`Venom burns in your veins for ${d}.`,"foe")});
  const live=Object.keys(Y);
  if(P.cleanse&&live.length&&S.hp>0&&Math.random()*100<Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER)){const s=pick(live);delete Y[s];S.stats.cured++;blog(`Your gear helps you shake off the ${STATUS[s].n.toLowerCase()}.`,"good")}
  Object.keys(Y).forEach(s=>{if(--Y[s].t<=0){delete Y[s];blog(`The ${STATUS[s].n.toLowerCase()} fades.`,"good")}})}
function healYou(n,why){const P=pstats(),b=S.hp;if(S.battle&&!S.battle.over&&stOf().curse)n=Math.ceil(n/2);S.hp=Math.min(P.maxHp,S.hp+n);const got=S.hp-b;if(got>0){fx("youHud","+"+got,"heal");if(why&&S.battle&&!S.battle.over)blog(`${why} (+${got} HP).`,"good")}return got}
function strike(W,pow,label,inn,o){
  o=o||{};
  const B=S.battle,E=foeOf(B),tr=inn?withInnate(W?W.traits:{}):(W?W.traits:{}),v=t=>tr[t]||0,mast=know(B.id).mastered?1.15:1;
  let ef=eff(tr,B);const arc=ef.k==="resist"&&v("Arcane")&&Math.random()*100<Math.min(ARC_CAP,v("Arcane")*ARC_PER);if(arc){ef={m:1};blog("Arcane power cuts through its resistance.","you")}
  const crit=Math.random()*100<Math.min(CRIT_CAP,5+v("Sharp")*3),pierce=Math.min(v("Heavy")?.4:1,1-(o.pen||0));
  const dmg=Math.max(1,Math.round((pow*.5-Math.max(0,B.def-(B.shred||0))*pierce)*ef.m*mast*(crit?1.75:1)*vary()));
  const st=S.stats;dealt(B,dmg);B.hp-=dmg;if(crit)st.crits++;if(dmg>st.big){st.big=dmg;st.bigW=W?W.name:/bash/.test(label)?"Shield bash":"Fists"}
  fx("enemyHud","-"+dmg,crit?"crit":"");fx("foeArt","","hit");
  const note=ef.k==="weak"?` ${ef.t} cuts deep!`:ef.k==="resist"?` It resists the ${ef.t.toLowerCase()}.`:"";
  blog(`${label} for ${dmg}${crit?", a critical hit":""}.${note}`,crit?"big":"you");noteEff(ef);
  const R={dmg,crit};if(B.hp<=0)return R;
  if(v("Tempered")&&B.def>0){const c=Math.min(SHRED_CAP,Math.round(v("Tempered")*SHRED_PER)),s=Math.min(c,B.def,(B.shred||0)+1);if(s>(B.shred||0)){B.shred=s;blog(`Its armor cracks (-${s} DEF).`,"you")}}
  const fire=v("Fire")+v("Sunfire"),ice=v("Ice")+v("Frost"),poi=v("Poison")+v("Venomous"),holy=v("Holy")+v("Radiant"),sha=v("Shadow")+v("Twilight");
  const immune=(f,msg)=>{blog(msg,"");if(E.resist.includes(f))learn(B.id,"resist",f)};
  if(fire){if(B.resist.includes("fire"))immune("fire",`The ${B.name} won't burn.`);else{const d=Math.max(1,Math.round(fire*.8));if(!B.burn)blog(`The ${B.name} catches fire.`,"you");B.burn={d,t:3}}}
  if(ice){if(B.resist.includes("ice"))immune("ice","The cold slides right off it.");else if(!B.frozen&&(o.force==="ice"||Math.random()*100<Math.min(FREEZE_CAP,6+ice*4))){B.frozen=true;blog(`The ${B.name} is frozen solid!`,"big")}}
  if(poi){if(B.resist.includes("poison"))immune("poison","The poison has no effect.");else B.poison=Math.min(15,B.poison+Math.round(poi))}
  if(holy)healYou(Math.round(holy),"Holy light mends you");
  if(sha)healYou(Math.round(dmg*Math.min(.4,.07*sha)),"You drain its life");
  return R;
}
function attack(){
  const P=pstats(),B=S.battle;
  strike(P.main,P.atk+P.mag*.7,P.main?`You strike with ${P.main.name}`:"You punch",true);
  if(B.hp>0&&!stOf().chill&&Math.random()*100<Math.min(35,P.spd*3))strike(P.main,P.atk+P.mag*.7,"A swift follow-up hits",true);
  if(B.hp>0&&P.offW)strike(P.offW,P.offPow*2,`Your off-hand ${P.offW.name} adds`);
  afterPlayer();
}
const abKeys=P=>[P.main&&ABILITIES[P.main.form]&&P.main.form,P.shield&&"shield"].filter(Boolean);
const ELS={fire:["Fire","Sunfire"],ice:["Ice","Frost"],poison:["Poison","Venomous"],holy:["Holy","Radiant"],shadow:["Shadow","Twilight"]};
function ability(key){
  const B=S.battle,P=pstats(),A=ABILITIES[key],boss=ENEMIES[B.id].boss,W=P.main,n=P.atk+P.mag*.7,cd=B.cd||(B.cd={});
  if(!A||cd[key]>0||!abKeys(P).includes(key))return;
  S.stats.abil++;
  let bonus=0;
  if(key==="blade"){for(let i=0;i<A.hits&&B.hp>0;i++)strike(W,n*A.x,i?"A second cut lands":"Flurry! You cut",true)}
  else if(key==="spear")strike(W,n*A.x,"You lunge",true,{pen:A.pen});
  else if(key==="staff"){const tr=withInnate(W.traits),el=Object.entries(ELS).map(([e,l])=>[e,l.reduce((a,t)=>a+(tr[t]||0),0)]).sort((a,b)=>b[1]-a[1])[0];
    strike(W,Math.max(n,P.atk*.5+P.mag*1.2)*A.x,el[1]>0?`You channel ${el[0]} through ${W.name}`:"You loose a bolt of raw magic",true,{pen:A.pen,force:el[1]>0?el[0]:""})}
  else if(key==="lance"){strike(W,n*A.x,"You charge",true);B.open=true;if(B.hp>0)blog("You're exposed after the charge.","foe")}
  else if(key==="spellblade"){const r=strike(W,(P.atk+P.mag)*A.x,"Arc Slash tears",true);if(r.crit){bonus=1;blog("The arc sings. Your cooldown eases.","good")}}
  else if(key==="warstaff"){strike(W,n*A.x,"Your sweep crashes into it",true);
    if(B.hp>0&&Math.random()<(boss?A.bossStun:A.stun)){B.stun=1;blog(`The ${B.name} is stunned!`,"big")}}
  else if(key==="claws"){strike(W,n*A.x,"You rend",true);
    if(B.hp>0){const b=B.bleed||{n:0},d=Math.max(1,Math.round(P.atk*BLEED_PER));B.bleed={n:Math.min(BLEED_STACK,b.n+1),d,t:BLEED_T};blog(`It bleeds for ${d*B.bleed.n} per turn${B.bleed.n>1?`, x${B.bleed.n}`:""}.`,"you")}}
  else if(key==="shield"){strike(null,P.atk*A.x+statsOf(P.shield).def,`You bash with ${P.shield.name}`,false);
    if(B.hp>0){const sp=isSpecial(B)?foeOf(B).sp:null,E0=ENEMIES[B.id],shift=E0.phase&&!B.phased&&B.hp<=B.max*E0.phase.at; // a form change eats the turn anyway
      if(sp&&!shift&&Math.random()<(boss?A.bossInt:A.int)){B.stun=2;blog(`The bash throws the ${B.name} off ${sp.name}!`,"big");learn(B.id,B.phased?"sp2":"sp",1)}
      else if(!sp&&Math.random()<(boss?A.bossStun:A.stun)){B.stun=1;blog(`The ${B.name} is rattled!`,"big")}}}
  cd[key]=A.cd+1-bonus;afterPlayer();
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
  if(cu.length){S.stats.cured+=cu.length;cu.forEach(s=>delete Y[s]);blog(`${it.name} clears your ${cu.map(s=>STATUS[s].n.toLowerCase()).join(" and ")}.`,"good");did=true}
  if(st.heal>0){healYou(medHeal(it),`You use ${it.name}`);did=true}
  const d=Math.round((st.atk+st.mag)*.6);
  if(d>=3){const ef=eff(it.traits,B),dmg=Math.max(1,Math.round(d*ef.m*vary())),st=S.stats;dealt(B,dmg);B.hp-=dmg;if(dmg>st.big){st.big=dmg;st.bigW=it.name}fx("enemyHud","-"+dmg,"");fx("foeArt","","hit");
    blog(`${it.name} bursts against the ${B.name} for ${dmg}.${ef.k==="weak"?" Super effective!":""}`,"you");noteEff(ef);did=true}
  if(!did)blog(`You use ${it.name}. Nothing happens.`);
  afterPlayer();
}
function flee(){
  const B=S.battle;
  if(ENEMIES[B.id].boss&&Math.random()<.5){blog("There's no escaping it!","foe");return enemyTurn()}
  if(Math.random()<.7){B.over="fled";if(S.run==="daily")S.daily.turns+=B.turn;blog("You slip away into cover.");
    if(ENEMIES[B.id].boss){const m=curMap();m.path.pop();const prev=m.path[m.path.length-1];m.pos=prev?{r:prev[0],i:prev[1]}:null;
      m.rows[MAP_ROWS-1].forEach(nd=>nd.done=false);blog("You fall back to the camp. The way to the boss is still open.","good")}
    save();return render()}
  blog("You try to run, but it cuts you off.");enemyTurn();
}
function afterPlayer(){if(S.battle.hp<=0)return enemyDown();enemyTurn()}
// one enemy hit after resist, armor, Stone and guard/parry (vf = damage variance)
const foeHit=(B,P,mult,vf)=>Math.max(1,Math.round(Math.max(1,Math.round(B.atk*mult*vf*(1-P.red)*(B.guard?.4:1)*(B.open?1+ABILITIES.lance.open:1)*(B.parry?PARRY_FAIL:1)*(1-(P.rs[B.el]||0)/100)))-(P.dr||0)));
// end-of-turn bookkeeping: guard/parry/exposure lapse, off-balance and ability cooldowns tick, next turn
function endTurn(B){B.guard=false;B.parry=false;B.open=false;if(B.off>0)B.off--;Object.keys(B.cd||{}).forEach(k=>{if(B.cd[k]>0)B.cd[k]--});B.turn++}
const endShift=B=>{endTurn(B);save();render()};
function enemyTurn(){
  const B=S.battle,P=pstats(),Y=stOf();
  if(B.burn){dealt(B,B.burn.d);B.hp-=B.burn.d;fx("enemyHud","-"+B.burn.d,"hurt");blog(`Flames lick the ${B.name} for ${B.burn.d}.`,"you");if(--B.burn.t<=0)B.burn=null}
  if(B.poison&&B.hp>0){dealt(B,B.poison);B.hp-=B.poison;fx("enemyHud","-"+B.poison,"hurt");blog(`Poison eats at the ${B.name} for ${B.poison}.`,"you")}
  if(B.bleed&&B.hp>0){const d=B.bleed.d*B.bleed.n;dealt(B,d);B.hp-=d;fx("enemyHud","-"+d,"hurt");blog(`The ${B.name} bleeds for ${d}.`,"you");if(--B.bleed.t<=0)B.bleed=null}
  if(B.hp<=0)return enemyDown();
  if(ENEMIES[B.id].phase&&!B.phased&&B.hp<=B.max*ENEMIES[B.id].phase.at){ // second form: it spends the turn changing
    const ph=ENEMIES[B.id].phase;B.phased=true;B.el=ph.to.el;B.weak=[...ph.to.weak];B.resist=[...ph.to.resist];B.stun=0;B.frozen=false;B.guard=false;B.parry=false;B.burn=null;B.poison=0;B.bleed=null;
    B.spEvery=spEvery(foeOf(B),B.heat||0);blog(ph.msg,"big");learn(B.id,"ph",1);return endShift(B)}
  const E=foeOf(B),sp=isSpecial(B)?E.sp:null;
  if(B.frozen){B.frozen=false;B.stun=0;blog(`The ${B.name} is frozen and can't act.`,"good")}
  else if(B.stun){blog(B.stun===2&&sp?`${sp.name} is cancelled. The ${B.name} can't act.`:`The ${B.name} is stunned and can't act.`,"good");B.stun=0}
  else if(sp&&sp.kind==="heal"&&B.parry){blog(`You break the ${B.name}'s concentration. ${sp.name} fizzles!`,"good");learn(B.id,B.phased?"sp2":"sp",1)}
  else if(sp&&sp.kind==="heal"){const h=Math.min(B.max-B.hp,Math.round(B.max*sp.x));B.hp+=h;if(h)fx("enemyHud","+"+h,"heal");blog(`The ${B.name} uses ${sp.name} and recovers ${h} HP.`,"foe");learn(B.id,B.phased?"sp2":"sp",1)}
  else{
    const hits=sp&&sp.kind==="multi"?sp.n:1,mult=sp?sp.x:1,perfect=B.parry&&sp,dg=Y.chill?Math.round(P.dodge/2):P.dodge;
    if(sp){blog(`The ${B.name} uses ${sp.name}!`,"foe");learn(B.id,B.phased?"sp2":"sp",1)}
    if(perfect){S.stats.parries++;sfx("parry");blog(`Perfect parry! You turn ${sp.name} aside.`,"big");strike(P.main,(P.atk+P.mag*.7)*PARRY_X,"You riposte",true)}
    else if(B.parry){blog("Your parry is mistimed! You're left open.","foe");B.off=2}
    for(let i=0;i<hits&&S.hp>0&&!perfect&&B.hp>0;i++){
      if(P.blind&&Math.random()<Math.min(.4,.08*P.blind)){blog("Steam clouds its eyes. It misses.","good");sfx("dodge");continue}
      if(P.shield&&!B.guard&&Math.random()<.15+(P.shield.traits.Heavy||0)*.03){blog(`You block with ${P.shield.name}.`,"good");sfx("block");continue}
      if(dg&&Math.random()*100<dg){blog("You dodge aside. It misses.","good");sfx("dodge");continue}
      let dmg=foeHit(B,P,mult,vary());
      if(B.ward==null)B.ward=0; // battles saved before wards have none
      const tot=dmg,ab=Math.min(B.ward,dmg);B.ward-=ab;dmg-=ab;S.stats.taken+=Math.min(dmg,S.hp);S.hp-=dmg;
      fx("youHud",dmg?"-"+dmg:"","hurt");fx("youHud","","shake");fx("vig","","on");
      blog(sp?`It hits you for ${tot}${B.guard?" through your guard":""}.`:`The ${B.name} ${E.verb} for ${tot}${B.guard?" through your guard":""}.`,"foe");
      if(dmg>0&&S.hp>0)inflict(B,P,sp);
      if(ab)blog(`Your rune ward absorbs ${ab}${B.ward?"":" and shatters"}.`,"good");
      if(P.thorns&&dmg>0&&S.hp>0){const th=Math.max(1,Math.round(dmg*P.thorns/100));dealt(B,th);B.hp-=th;fx("enemyHud","-"+th,"hurt");blog(`Your iron barbs bite it for ${th}.`,"you");if(B.hp<=0)break}
      if(sp&&sp.kind==="drain"&&dmg>0){B.hp=Math.min(B.max,B.hp+dmg);blog(`It drinks ${dmg} HP from you.`,"foe")}
    }
    if(S.hp<=0)return youFall();
    if(B.hp<=0)return enemyDown();
  }
  tickYou(B,P);if(S.hp<=0)return youFall();
  if(P.regen&&S.hp<P.maxHp)healYou(P.regen,"Your gear mends you");
  if(P.root&&S.hp<P.maxHp*.5)healYou(P.root,"Roots knit your wounds");
  endTurn(B);if(isSpecial(B)&&!B.frozen)sfx("warn",.25);save();render();
}
function enemyDown(){
  const B=S.battle,E=ENEMIES[B.id];
  if(E.rebirth&&!B.reborn){B.reborn=true;B.hp=Math.round(B.max*.4);B.burn=null;B.poison=0;B.bleed=null;B.stun=0;B.frozen=false;blog(`The ${B.name} bursts into flame and rises from its ashes!`,"big");endTurn(B);save();return render()}
  const P=pstats(),dl=S.run==="daily",h=B.heat||0,lv0=level();
  if(dl)S.daily.turns+=B.turn;
  const st=S.stats;if(E.boss){st.bosses++;st.fast[B.id]=Math.min(st.fast[B.id]||1e9,B.turn);st.heatBest[E.zone]=Math.max(st.heatBest[E.zone]??-1,h);if(!dl)st.exped++}else if(B.elite)st.elites++;
  sfx("win",.3);sfx("loot",.9);
  B.hp=0;B.over="won";S.kills[B.id]=(S.kills[B.id]||0)+1;S.wins+=E.boss?3:1;
  if(!E.boss&&B.id!=="mimic")S.zoneKills[E.zone]=(S.zoneKills[E.zone]||0)+1;
  const mult=1+P.lure*.15+h*HEAT_T.loot;let got;
  if(B.id==="mimic"){const p=zonePool(S.zone);got=[pick(p),pick(p),essence(pick(ESS_POOL))]}
  else{got=E.drops.filter(([,p])=>Math.random()<p*mult).map(([id])=>id);if(!got.length)got=[E.drops[0][0]]}
  if(twistNow()==="double")got=[...got,...got];
  if(B.elite)got.push(essence(B.elite));
  blog(`The ${B.name} falls.${P.lure?" Your Lure gear draws in extra scraps.":""}`,"good");
  if(E.boss&&h&&!dl){const n=h*HEAT_T.ess,xp=h*HEAT_T.xp;for(let i=0;i<n;i++)got.push(essence(pick(ESS_POOL)));S.xp+=xp;blog(`Heat ${h} spoils: ${n} extra essence and ${xp} smith XP.`,"good")}
  if(E.boss&&dl)dailyBundle(got);
  learn(B.id,"stats",1);B.emb=fightEmbers(E,B);blog(`You rake ${B.emb} embers from the ashes.`,"good");
  got.forEach(id=>{addItem(id);if(E.drops.some(d=>d[0]===id))learn(B.id,"drops",id)});B.loot=got;
  S.campProg++;let msg="";if(S.campProg>=3){S.campProg=0;if(S.camp<3){S.camp++;msg="You earned a campfire charge."}}
  if(E.boss&&dl){finishDaily(MAP_ROWS,true);const next=ZONES[zoneIdx(E.zone)+1];if(next&&!S.unlocked.includes(next[0])){S.unlocked.push(next[0]);msg=`${next[1]} is now open!`}} // a daily boss kill unlocks like a normal one, matching the load-time fix-up in migrate
  else if(E.boss){const next=ZONES[zoneIdx(E.zone)+1],nh=Math.min(HEAT_MAX,h+1),hz=heatOf(E.zone);if(S.maps[E.zone])S.maps[E.zone].cleared=true;
    if(next&&!S.unlocked.includes(next[0])){S.unlocked.push(next[0]);msg=`${next[1]} is now open!`}
    else if(!next&&hz.max===0)msg="You've conquered the realm. Now turn up the Heat.";
    if(nh>hz.max){S.heat[E.zone]={max:nh,sel:hz.sel};msg=(msg?msg+" ":"")+`Heat ${nh} unlocked in ${zoneName(E.zone)}: ${HEAT[nh-1].name}.`}}
  if(E.boss&&S.kills[B.id]===1){const hm=giveHint();if(hm){blog(hm,"big");msg=(msg?msg+" ":"")+"A hint scroll joins your Recipes."}}
  if(level()>lv0)msg=(msg?msg+" ":"")+lvMsg();
  save();render();if(msg)toast(msg);
}
function youFall(){
  const B=S.battle,P=pstats();S.hp=0;B.over="lost";S.stats.deaths++;sfx("lose",.25);
  const pool=[];Object.keys(S.inv).forEach(id=>{const free=(S.inv[id]||0)-eqCount(id);for(let i=0;i<free;i++)pool.push(id)});
  let lost=null;if(pool.length){lost=pick(pool);S.inv[lost]--;trimBench()}
  S.hp=Math.round(P.maxHp*.3);const dl=S.run==="daily",zn=zoneName(S.zone);
  if(dl){S.daily.turns+=B.turn;finishDaily(S.daily.map.pos?S.daily.map.pos.r:0,false)}else S.maps[S.zone]=newMap(S.zone);
  blog(`You collapse and wake at the edge of ${zn} with ${S.hp} HP. ${dl?"Your daily expedition is over.":"The paths have shifted."}${lost?` A scavenger made off with your ${S.items[lost].name}.`:""}`,"foe");
  save();render();
}
function rest(){const P=pstats();if(twistNow()==="nocamp")return toast("No campfires on this expedition.");if(S.camp<=0||S.hp>=P.maxHp)return;S.camp--;const g=healYou(Math.round(P.maxHp*.5));save();render();toast(`You rest by the fire and recover ${g} HP.`)}
function trimBench(){const seen={};S.bench=S.bench.filter(id=>{seen[id]=(seen[id]||0)+1;return seen[id]<=(S.inv[id]||0)})}

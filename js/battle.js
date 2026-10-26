// ================= BATTLE =================
const vary=()=>.85+Math.random()*.3;
const zoneOpen=z=>S.unlocked.includes(z);
function blog(t,c){S.battle.log.push({t,c:c||""});if(S.battle.log.length>50)S.battle.log.shift()}
function pickEnemy(zone,R=Math.random,fresh=false){const pool=Object.entries(ENEMIES).filter(([,e])=>e.zone===zone&&!e.boss),wt=([id,e])=>e.w*(fresh&&!know(id).mastered?SPAWN_NEW:1);let r=R()*pool.reduce((s,x)=>s+wt(x),0);
  for(const x of pool){r-=wt(x);if(r<=0)return x[0]}return pool[0][0]} // fresh: a kind you have not mastered is more likely (the map's fights)
function startBattle(forced,opt){
  opt=opt||{};const id=forced||opt.e||pickEnemy(S.zone),E=ENEMIES[id],sc=1+.06*(opt.row||0),h=heatNow(),tw=twistNow();
  const B={opening:opt.opening||0,id,name:E.name,el:E.el,hp:Math.round(E.hp*sc),max:Math.round(E.hp*sc),atk:Math.round(E.atk*sc),def:E.def,weak:[...E.weak],resist:[...E.resist],turn:1,
    burn:null,poison:0,bleed:null,stun:0,open:false,cd:{},you:{},off:0,parry:false,shred:0,ward:null,frozen:false,guard:false,reborn:false,phased:false,rar:"normal",afx:[],intr:false,title:"",log:[],over:null,loot:[]};
  if(id==="mimic"){const zi=zoneIdx(S.zone),at=(a,i)=>a[Math.min(i,a.length-1)];B.max=B.hp=Math.round(E.hp*at(MIMIC_HP,zi));B.atk=Math.round(E.atk*at(MIMIC_ATK,zi));B.def=E.def+zi*2}
  B.heat=h;if(opt.pi!=null){B.pi=opt.pi;B.by=opt.by;B.ef=opt.ef} // a map enemy: which one, who moved, where it came from (see slip)
  if(h){B.max=B.hp=Math.round(B.max*(1+h*HEAT_T.hp));B.atk=Math.round(B.atk*(1+h*HEAT_T.atk))}
  if(h>=4&&E.boss){B.max=B.hp=Math.round(B.max*HEAT_T.boss);if(E.sp)B.spEvery=spEvery(E,h)}
  if(tw==="double")B.atk*=2;
  const first=!!(opt.ambush||opt.lunge); // the foe strikes before your first action (an ambush, or a hunter that lunges at you)
  if(first)B.log.push({t:opt.amsg||tx("Ambush! Something leaps out at you."),c:"big"});
  if(!E.boss&&id!=="mimic"){ // a map enemy brings its rolled rarity and affixes; a wild creature brings its own
    const sa=speciesAfx(E);
    const f=sa||(opt.rar!=null?{rar:opt.rar,afx:opt.afx||rollAfx(Math.random,opt.rar,{mv:E.mv,heat:h})}:rollFoe(Math.random,{elite:opt.elite||tw==="elites",heat:h,row:opt.row,mv:E.mv}));
    applyAfx(B,E,f.rar,f.afx);B.intr=!!sa}
  const nd=foeNode(opt.pi,E.boss);if(nd&&nd.st)restoreFoe(B,nd.st); // a foe you fled from keeps its wounds
  S.battle=B;S.event=null;S.seen[id]=true;cx(id);
  blog(tx(E.intro),E.boss||B.afx.length?"big":"");
  if(B.afx.length){blog(tx("{rarity}: {name}.",{rarity:RARITIES[B.rar].name,name:fullName(B)}),"big");noteAfx(B);if(B.wd)blog(tx("A ward shimmers around it ({n}).",{n:B.wd}),"foe")}
  if(h)blog(tx("The heat is on: Heat {h}, {name}.",{h,name:HEAT[h-1].name}),"foe");
  if(h>=5)blog(tx("Its blows bite through {p}% of your Defense.",{p:Math.round(HEAT_T.bite*100)}),"foe");
  const P=pstats(),rp=P.rs[B.el];if(rp)blog(tx("{msg} (-{p}% damage)",{msg:tx(RES_MSG[B.el]),p:rp}),"good");
  if(P.ward){B.ward=P.ward;blog(tx("A rune ward flares around you ({n}).",{n:P.ward}),"good")}
  if(P.main&&P.main.form==="spear"&&!first){blog(tx("Your spear darts out before it can move."),"you");strike(P.main,strikePower(P)*ABILITIES.spear.open,tx("Opening jab"),true);if(B.hp<=0)return enemyDown()}
  if(first){blog(tx("It strikes before you can react!"),"foe");enemyTurn();return} // the ambush: the foe gets a free attack (and a defeat goes through the normal path)
  save();render();
}
// a foe you come back to keeps what it was carrying: its wounds, and the form it had changed into
function restoreFoe(B,st){
  if(!st)return;const E=ENEMIES[B.id];
  if(st.sp&&E&&!B.split)splitFoe(B,E,1);
  if(st.ph&&E&&E.phase&&!B.phased)phaseShift(B);
  if(Number.isFinite(st.hp))B.hp=Math.max(1,Math.min(B.max,Math.round(st.hp)));
}
const spEvery=(E,h)=>E.boss&&h>=4?Math.max(2,E.sp.every-1):E.sp.every;
// the enemy as it fights now: a phased boss swaps in its second form's fields
const foeOf=B=>{const E=ENEMIES[B.id];return B.phased&&E.phase?{...E,...E.phase.to}:E};
const isSpecial=B=>{const sp=foeOf(B).sp;return sp&&B.turn%(B.spEvery||sp.every)===0};
// a boss's second form: the fields the fight shifts to when it changes
function phaseShift(B){const E=ENEMIES[B.id],ph=E&&E.phase;if(!ph)return;B.phased=true;B.el=ph.to.el;B.weak=[...ph.to.weak];B.resist=[...ph.to.resist];B.spEvery=spEvery(foeOf(B),B.heat||0)}
// Keep the displayed percentage and the actual roll identical (whole percentage points).
const parryChance=(B,P=pstats())=>B.off>0?0:Math.round(Math.min(PARRY_T.cap,Math.max(0,PARRY_T.base+parryLevel(B)*PARRY_T.study+Math.min(PARRY_T.spdCap,P.spd*PARRY_T.spd)+(PARRY_T.form[P.main&&P.main.form]||0)))*100)/100;
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
  if(B.guard)return; // Guard prevents new statuses, but does not cleanse existing ones.
  const Y=stOf(),E=foeOf(B);let l=E.inf?[E.inf]:[];const et=elTr(B);if(et&&ELITE_INF[et]&&!(E.inf&&E.inf.s===ELITE_INF[et]))l.push({s:ELITE_INF[et],ch:ELITE_INF_CH});
  const hot=twistNow()==="cinder",hm=B.heat>=3?HEAT_T.inf:1;
  if(hot)l=l.some(x=>x.s==="burn")?l.map(x=>x.s==="burn"?{...x,ch:x.ch*2}:x):[...l,{s:"burn",ch:.3}];
  l.forEach(({s,ch})=>{const T=STATUS[s];if(Math.random()>=Math.min(1,ch*hm*(sp?2:1))*(1-(P.rs[T.el]||0)/100))return;
    if(s==="poison"){const o=Y.poison||{n:0};Y.poison={n:Math.min(POISON_STACK,o.n+1),t:T.t,d:Math.max(1,Math.round(B.atk*.12))}}
    else Y[s]={t:T.t,d:Math.max(1,Math.round(B.atk*.2*(hot&&s==="burn"?1.5:1)))};
    S.stats.sufd++;sfx("status",0,{el:T.el});blog(tx("{msg} ({detail}).",{msg:tx(INF_MSG[s]),detail:s==="burn"||s==="poison"?tx("{n} damage per turn",{n:s==="poison"?Y.poison.d*Y.poison.n:Y[s].d})+(s==="poison"&&Y.poison.n>1?`, x${Y.poison.n}`:""):STATUS[s].tip}),"foe");if(E.inf&&E.inf.s===s)learn(B.id,"inf",s)})}
function tickYou(B,P){
  const Y=stOf();
  ["burn","poison"].forEach(s=>{const x=Y[s];if(!x||S.hp<=0)return;const d=s==="poison"?x.d*x.n:x.d;S.stats.taken+=Math.min(d,S.hp);S.hp-=d;floatFx("youHud","-"+d,"hurt",{el:STATUS[s].el});
    blog(s==="burn"?tx("Flames lick you for {n}.",{n:d}):tx("Venom burns in your veins for {n}.",{n:d}),"foe")});
  const live=Object.keys(Y);
  if(P.cleanse&&live.length&&S.hp>0&&Math.random()*100<Math.min(CLEANSE_CAP,P.cleanse*CLEANSE_PER)){const s=pick(live);delete Y[s];S.stats.cured++;blog(tx("Your gear helps you shake off the {status}.",{status:lc(STATUS[s].n)}),"good")}
  Object.keys(Y).forEach(s=>{if(--Y[s].t<=0){delete Y[s];blog(tx("The {status} fades.",{status:lc(STATUS[s].n)}),"good")}})}
function healYou(n,why){const P=pstats(),b=S.hp;if(S.battle&&!S.battle.over&&stOf().curse)n=Math.ceil(n/2);S.hp=Math.min(P.maxHp,S.hp+n);const got=S.hp-b;if(got>0){floatFx("youHud","+"+got,"heal");if(why&&S.battle&&!S.battle.over)blog(tx("{why} (+{n} HP).",{why,n:got}),"good")}return got}
function celebrateBuild(text){const B=S.battle;B.buildMoment={text,turn:B.turn};blog(text,"good")}
let strikeBonus=0;
function bracedAttack(B,fn){ // scoped to this action: all its strikes, never the enemy's turn or a riposte
  const prev=strikeBonus,before=S.stats.dealt;strikeBonus=B.braced?GUARD_T.braced:0;B.braced=false;
  try{return fn()}finally{if(strikeBonus&&S.stats.dealt>before)celebrateBuild(tx("Guard paid off: your empowered strike dealt +{p}% damage.",{p:pcn(GUARD_T.braced)}));strikeBonus=prev}
}
function strike(W,pow,label,inn,o){
  o=o||{};
  const B=S.battle,E=foeOf(B),tr=inn?withInnate(W?W.traits:{}):(W?W.traits:{}),v=t=>tr[t]||0,mast=know(B.id).mastered?MASTERY_X:1;
  if(!o.sure&&hasAfx(B,"elusive")&&Math.random()*100<dodgeOf(B,tr)){blog(tx("It slips aside."),"foe");floatFx("enemyHud","miss","");vfx("foeArt","dodge");return{dmg:0,crit:false,miss:true}} // Elusive: a visible dodge chance (a riposte always lands)
  let ef=eff(tr,B);const arc=ef.k==="resist"&&v("Arcane")&&Math.random()*100<Math.min(ARC_CAP,v("Arcane")*ARC_PER);if(arc){ef={m:1};blog(tx("Arcane power cuts through its resistance."),"you")}
  const crit=Math.random()*100<Math.min(CRIT_CAP,CRIT_T.base+v("Sharp")*CRIT_T.sharp),pierce=Math.min(v("Heavy")?.4:1,1-(o.pen||0));
  const base=Math.max(0,Number.isFinite(pow)?pow:0)*.5,arm=Math.max(0,B.def-(B.shred||0))*pierce,dmg=Math.max(1,Math.round((base+arm>0?base*base/(base+arm):0)*ef.m*mast*(crit?1.75:1)*vary()*(1+strikeBonus))); // armor takes a share of a blow, never all of it; a zero power still lands 1 damage (no 0/0)
  const st=S.stats,ab=wardCut(B,dmg),real=dmg-ab; // a Warded foe's shield soaks the blow first
  dealt(B,real);B.hp-=real;if(crit)st.crits++;if(dmg>st.big){st.big=dmg;st.bigW=W?W.id:o.bw||"Fists"}
  floatFx("enemyHud",real?"-"+real:"ward",crit?"crit":"",{el:strikeFamily(tr),form:W?W.form:o.bw==="Shield bash"?"shield":""});floatFx("foeArt","","hit");
  if(real)strikeFx(W,tr);
  const note=ef.k==="weak"?" "+tx("{trait} cuts deep!",{trait:trn(ef.t)}):ef.k==="resist"?" "+tx("It resists the {trait}.",{trait:lc(trn(ef.t))}):"";
  blog((crit?tx("{label} for {dmg}, a critical hit.",{label,dmg}):tx("{label} for {dmg}.",{label,dmg}))+note,crit?"big":"you");noteEff(ef);if(ab)blog(wardMsg(B,ab),"you");
  const R={dmg,crit};if(B.hp<=0)return R;
  frenzy(B);thornBack(B,real);
  if(v("Tempered")&&B.def>0){const c=shredVal(v("Tempered")),s=Math.min(c,B.def,(B.shred||0)+1);if(s>(B.shred||0)){B.shred=s;blog(tx("Its armor cracks (-{n} DEF).",{n:s}),"you")}}
  const fire=v("Fire")+v("Sunfire"),ice=v("Ice")+v("Frost"),poi=v("Poison")+v("Venomous"),holy=v("Holy")+v("Radiant"),sha=v("Shadow")+v("Twilight");
  const immune=(f,msg)=>{blog(msg,"");if(E.resist.includes(f))learn(B.id,"resist",f)};
  if(fire){if(B.resist.includes("fire"))immune("fire",tx("The {name} won't burn.",{name:bname(B)}));else{const d=Math.max(1,Math.round(fire*.8));if(!B.burn)blog(tx("The {name} catches fire.",{name:bname(B)}),"you");B.burn={d,t:3}}}
  if(ice){if(B.resist.includes("ice"))immune("ice",tx("The cold slides right off it."));else if(!B.frozen&&(o.force==="ice"||Math.random()*100<Math.min(FREEZE_CAP,6+ice*4))){B.frozen=true;blog(tx("The {name} is frozen solid!",{name:bname(B)}),"big")}}
  if(poi){if(B.resist.includes("poison"))immune("poison",tx("The poison has no effect."));else B.poison=Math.min(POISON_FOE_CAP,B.poison+Math.round(poi))}
  if(holy)healYou(Math.round(holy),tx("Holy light mends you"));
  if(sha)healYou(Math.round(dmg*Math.min(.4,.07*sha)),tx("You drain its life"));
  return R;
}
function attack(){
  const P=pstats(),B=S.battle;
  bracedAttack(B,()=>{
  strike(P.main,strikePower(P),P.main?tx("You strike with {weapon}",{weapon:iname(P.main)}):tx("You punch"),true);
  if(B.hp>0&&!stOf().chill&&Math.random()*100<Math.min(FOLLOW_T.cap,P.spd*FOLLOW_T.spd))strike(P.main,strikePower(P),tx("A swift follow-up hits"),true);
  if(B.hp>0&&P.offW)strike(P.offW,P.offPow*2,tx("Your off-hand {weapon} adds",{weapon:iname(P.offW)}));
  });
  afterPlayer();
}
const abKeys=P=>[P.main&&ABILITIES[P.main.form]&&P.main.form,P.shield&&"shield"].filter(Boolean);
const ELS={fire:["Fire","Sunfire"],ice:["Ice","Frost"],poison:["Poison","Venomous"],holy:["Holy","Radiant"],shadow:["Shadow","Twilight"]};
function ability(key){
  const B=S.battle,P=pstats(),A=ABILITIES[key],boss=ENEMIES[B.id].boss,W=P.main,n=strikePower(P),cd=B.cd||(B.cd={});
  if(!A||cd[key]>0||!abKeys(P).includes(key))return;
  S.stats.abil++;sfx("ability",0,{form:key});
  let bonus=0;
  bracedAttack(B,()=>{
  if(key==="blade"){for(let i=0;i<A.hits&&B.hp>0;i++)strike(W,n*A.x,i?tx("A second cut lands"):tx("Flurry! You cut"),true)}
  else if(key==="spear")strike(W,n*A.x,tx("You lunge"),true,{pen:A.pen});
  else if(key==="staff"){const tr=withInnate(W.traits),el=Object.entries(ELS).map(([e,l])=>[e,l.reduce((a,t)=>a+(tr[t]||0),0)]).sort((a,b)=>b[1]-a[1])[0];
    strike(W,n*A.x,el[1]>0?tx("You channel {el} through {weapon}",{el:famL(el[0]),weapon:iname(W)}):tx("You loose a bolt of raw magic"),true,{pen:A.pen,force:el[1]>0?el[0]:""})}
  else if(key==="lance"){const r=strike(W,n*A.x,tx("You charge"),true);if(!r.miss){B.open=true;if(B.hp>0)blog(tx("You're exposed after the charge."),"foe")}}
  else if(key==="spellblade"){const r=strike(W,n*A.x,tx("Arc Slash tears"),true);if(r.crit){bonus=1;blog(tx("The arc sings. Your cooldown eases."),"good")}}
  else if(key==="warstaff"){const r=strike(W,n*A.x,tx("Your sweep crashes into it"),true);
    if(!r.miss&&B.hp>0&&Math.random()<(boss?A.bossStun:A.stun)){B.stun=1;blog(tx("The {name} is stunned!",{name:bname(B)}),"big")}}
  else if(key==="claws"){const r=strike(W,n*A.x,tx("You rend"),true);
    if(!r.miss&&B.hp>0){const b=B.bleed||{n:0},d=Math.max(1,Math.round(P.atk*BLEED_PER));B.bleed={n:Math.min(BLEED_STACK,b.n+1),d,t:BLEED_T};blog(B.bleed.n>1?tx("It bleeds for {n} per turn, x{k}.",{n:d*B.bleed.n,k:B.bleed.n}):tx("It bleeds for {n} per turn.",{n:d*B.bleed.n}),"you")}}
  else if(key==="shield"){const r=strike(null,P.atk*A.x+statsOf(P.shield).def,tx("You bash with {shield}",{shield:iname(P.shield)}),false,{bw:"Shield bash"});
    if(!r.miss&&B.hp>0){const sp=isSpecial(B)?foeOf(B).sp:null,E0=ENEMIES[B.id],shift=E0.phase&&!B.phased&&B.hp<=B.max*E0.phase.at; // a form change eats the turn anyway
      if(sp&&!shift&&Math.random()<(boss?A.bossInt:A.int)){B.stun=2;blog(tx("The bash throws the {name} off {sp}!",{name:bname(B),sp:tx(sp.name)}),"big");learn(B.id,B.phased?"sp2":"sp",1)}
      else if(!sp&&Math.random()<(boss?A.bossStun:A.stun)){B.stun=1;blog(tx("The {name} is rattled!",{name:bname(B)}),"big")}}}
  });
  cd[key]=A.cd+1-bonus;afterPlayer();
}
function guard(){const B=S.battle;if(B.off>0)blog(tx("You're off balance. Your guard falters."),"foe");else{B.guard=true;B.braced=true;vfx("youHud","guard");blog(tx("You raise your guard."),"you");blog(tx("You brace yourself. Your next attack deals {p}% more damage.",{p:Math.round(GUARD_T.braced*100)}),"good")}enemyTurn()}
function parry(){const B=S.battle;if(B.off>0)blog(tx("You're off balance. Your parry falters."),"foe");else{B.parry=true;blog(tx("You wait for an opening..."),"you")}enemyTurn()}
function study(){
  const B=S.battle,u=unknownFacts(B.id);S.stats.studied++;
  const train=canTrainParry(B);
  if(train){const K=cx(B.id),n=parryLevel(B)+1;K.timing=K.timing||{};K.timing[parryKey(B)]=n;blog(tx("You practise its special. Parry training {n}/{max}.",{n,max:PARRY_T.levels}),"you")}
  if(hasAfx(B,"elusive")&&(B.sty||0)<AFX_T.dodge.studyMax){B.sty=(B.sty||0)+1;blog(tx("You read the {name}'s movements. It slips aside less often ({n}%).",{name:bname(B),n:dodgeNow(B)}),"you")}
  if(!u.length){if(!train)blog(tx("You already know everything about it."),"");return enemyTurn()}
  const [type,val]=pick(u);blog(tx("You study the {name} closely...",{name:bname(B)}),"you");learn(B.id,type,val);enemyTurn();
}
function useItem(id){
  const B=S.battle,it=S.items[id],st=statsOf(it);
  S.inv[id]--;trimBench();
  let did=false;const Y=stOf(),cu=cures(it.traits).filter(s=>Y[s]);
  if(cu.length){S.stats.cured+=cu.length;cu.forEach(s=>delete Y[s]);blog(tx("{item} clears your {list}.",{item:iname(it),list:cu.map(s=>lc(STATUS[s].n)).join(tx(" and "))}),"good");did=true}
  if(st.heal>0){healYou(medHeal(it),tx("You use {item}",{item:iname(it)}));did=true}
  const d=Math.max(0,Math.round(((st.atk||0)+(st.mag||0))*WEAK_X));
  if(d>=3){const ef=eff(it.traits,B),dmg=Math.max(1,Math.round(d*ef.m*vary())),st=S.stats,ab=wardCut(B,dmg);dealt(B,dmg-ab);B.hp-=dmg-ab;if(dmg>st.big){st.big=dmg;st.bigW=it.id}floatFx("enemyHud",dmg-ab?"-"+(dmg-ab):"ward","",{el:strikeFamily(it.traits)});floatFx("foeArt","","hit");
    blog(tx("{item} bursts against the {name} for {dmg}.",{item:iname(it),name:bname(B),dmg})+(ef.k==="weak"?" "+tx("Super effective!"):""),"you");noteEff(ef);if(ab)blog(wardMsg(B,ab),"you");if(B.hp>0)frenzy(B);did=true}
  if(!did)blog(tx("You use {item}. Nothing happens.",{item:iname(it)}));
  afterPlayer();
}
function flee(){
  const B=S.battle;
  if(ENEMIES[B.id].boss&&Math.random()<FLEE_T.boss){blog(tx("There's no escaping it!"),"foe");return enemyTurn()}
  if(Math.random()<FLEE_T.ok){B.over="fled";if(B.opening)S.onboarding=B.opening===1?0:3;if(S.run==="daily")S.daily.turns+=B.turn;blog(tx("You slip away into cover."));
    storeFoe(B); // it keeps its wounds: you cannot chip it and meet it at full HP again
    if(ENEMIES[B.id].boss){fallBack(curMap());blog(tx("You fall back from the lair. The way to the boss is still open."),"good")}else if(B.pi!=null)slip(B);
    save();return render()}
  blog(tx("You try to run, but it cuts you off."));enemyTurn();
}
function afterPlayer(){if(S.battle.hp<=0)return enemyDown();enemyTurn()}
// the line for a plain enemy hit: English splices the species' verb ("gores you"), other languages have one template per verb with {name}, {n} and {g} (the guard note)
const hitMsg=(B,E,n)=>LANG==="en"?`The ${bname(B)} ${E.verb} for ${n}${B.guard?" through your guard":""}.`:fmt(txc("hit",E.verb),{name:bname(B),n,g:B.guard?" "+tx("through your guard"):""});
// one enemy hit after resist, armor, Stone and guard/parry (vf = damage variance)
const foeHit=(B,P,mult,vf)=>{const raw=B.atk*mult*vf*(B.guard?1-GUARD_T.cut:1)*(B.open?1+ABILITIES.lance.open:1)*(B.parry?PARRY_FAIL:1),red=heatRed(P,B);
  return Math.max(1,Math.round(raw*HIT_MIN),Math.round(raw*(1-(P.rs[B.el]||0)/100)*(1-red)-(P.dr||0)))}; // resist, armor and Stone together never take more than 1-HIT_MIN of a hit; Heat 5 bites through part of your Defense
// true when this zone's regular enemies (at map row 3) already hit you for the HIT_MIN floor, so more Defense, resist or Stone would change nothing here
const atFloor=P=>{const es=Object.values(ENEMIES).filter(e=>e.zone===S.zone&&!e.boss);return es.length>0&&es.every(e=>{const a=Math.round(e.atk*ATK_FLOOR);return foeHit({atk:a,heat:0,el:e.el},P,1,1)<=Math.max(1,Math.round(a*HIT_MIN))})};
// end-of-turn bookkeeping: guard/parry/exposure lapse, off-balance and ability cooldowns tick, next turn
function endTurn(B){B.thT=0;B.guard=false;B.parry=false;B.open=false;if(B.off>0)B.off--;Object.keys(B.cd||{}).forEach(k=>{if(B.cd[k]>0)B.cd[k]--});B.turn++}
const endShift=B=>{endTurn(B);save();render()};
function enemyTurn(){
  const B=S.battle,P=pstats(),Y=stOf();
  if(B.burn){if(B.opening===2&&!B.fireShown){B.fireShown=true;celebrateBuild(tx("Your forged Fire is working: {n} extra burn damage this turn.",{n:B.burn.d}))}dealt(B,B.burn.d);B.hp-=B.burn.d;floatFx("enemyHud","-"+B.burn.d,"hurt",{el:"fire"});blog(tx("Flames lick the {name} for {n}.",{name:bname(B),n:B.burn.d}),"you");if(--B.burn.t<=0)B.burn=null}
  if(B.poison&&B.hp>0){dealt(B,B.poison);B.hp-=B.poison;floatFx("enemyHud","-"+B.poison,"hurt",{el:"poison"});blog(tx("Poison eats at the {name} for {n}.",{name:bname(B),n:B.poison}),"you")}
  if(B.bleed&&B.hp>0){const d=B.bleed.d*B.bleed.n;dealt(B,d);B.hp-=d;floatFx("enemyHud","-"+d,"hurt");blog(tx("The {name} bleeds for {n}.",{name:bname(B),n:d}),"you");if(--B.bleed.t<=0)B.bleed=null}
  if(B.hp<=0)return enemyDown();
  afxTick(B);
  if(ENEMIES[B.id].phase&&!B.phased&&B.hp<=B.max*ENEMIES[B.id].phase.at){ // second form: it spends the turn changing
    const ph=ENEMIES[B.id].phase;phaseShift(B);B.stun=0;B.frozen=false;B.guard=false;B.parry=false;B.burn=null;B.poison=0;B.bleed=null;
    blog(tx(ph.msg),"big");learn(B.id,"ph",1);return endShift(B)}
  const E=foeOf(B),sp=isSpecial(B)?E.sp:null,pr=B.parry&&sp&&Math.random()<parryChance(B,P); // roll before learning this special, using the chance shown on the button
  if(B.frozen){B.frozen=false;B.stun=0;blog(tx("The {name} is frozen and can't act.",{name:bname(B)}),"good")}
  else if(B.stun){blog(B.stun===2&&sp?tx("{sp} is cancelled. The {name} can't act.",{sp:tx(sp.name),name:bname(B)}):tx("The {name} is stunned and can't act.",{name:bname(B)}),"good");B.stun=0}
  else if(sp&&sp.kind==="heal"&&pr){vfx("youHud","parry");blog(tx("You break the {name}'s concentration. {sp} fizzles!",{name:bname(B),sp:tx(sp.name)}),"good");learn(B.id,B.phased?"sp2":"sp",1)}
  else if(sp&&sp.kind==="heal"){if(B.parry){blog(tx("Your parry is mistimed! The spell goes off."),"foe");B.off=2}const h=Math.min(B.max-B.hp,Math.round(B.max*sp.x));B.hp+=h;if(h)floatFx("enemyHud","+"+h,"heal");blog(tx("The {name} uses {sp} and recovers {n} HP.",{name:bname(B),sp:tx(sp.name),n:h}),"foe");learn(B.id,B.phased?"sp2":"sp",1)}
  else{
    const hits=sp&&sp.kind==="multi"?sp.n:1,mult=sp?sp.x:1,perfect=pr,dg=Y.chill?Math.round(P.dodge/2):P.dodge,ml=Array(hits).fill(mult);
    if(!sp&&hasAfx(B,"swiftfoot")&&Math.random()<AFX_T.swift.fol)ml.push(AFX_T.swift.fx); // Swift-footed: now and then a quick follow-up
    if(sp){blog(tx("The {name} uses {sp}!",{name:bname(B),sp:tx(sp.name)}),"foe");learn(B.id,B.phased?"sp2":"sp",1)}
    if(perfect){S.stats.parries++;sfx("parry");vfx("youHud","parry");blog(tx("Perfect parry! You turn {sp} aside.",{sp:tx(sp.name)}),"big");strike(P.main,strikePower(P)*PARRY_X,tx("You riposte"),true,{sure:1})}
    else if(B.parry){blog(tx("Your parry is mistimed! You're left open."),"foe");B.off=2}
    for(let i=0;i<ml.length&&S.hp>0&&!perfect&&B.hp>0;i++){
      if(i>=hits)blog(tx("The {name} follows up swiftly.",{name:bname(B)}),"foe");
      if(P.blind&&Math.random()<Math.min(STEAM_T.cap,STEAM_T.per*P.blind)/100){blog(tx("Steam clouds its eyes. It misses."),"good");sfx("dodge");continue}
      if(P.shield&&!B.guard&&Math.random()<(BLOCK_T.base+(P.shield.traits.Heavy||0)*BLOCK_T.per)/100){blog(tx("You block with {shield}.",{shield:iname(P.shield)}),"good");sfx("block");vfx("youHud","guard");continue}
      if(dg&&Math.random()*100<dg){blog(tx("You dodge aside. It misses."),"good");sfx("dodge");vfx("youHud","dodge");continue}
      let dmg=foeHit(B,P,ml[i],vary());
      if(B.ward==null)B.ward=0; // battles saved before wards have none
      const tot=dmg,ab=Math.min(B.ward,dmg);B.ward-=ab;dmg-=ab;S.stats.taken+=Math.min(dmg,S.hp);S.hp-=dmg;
      floatFx("youHud",dmg?"-"+dmg:"","hurt",{el:E.el});floatFx("youHud","","shake",{el:E.el});floatFx("vig","","on");
      if(ab)vfx("youHud","guard");
      blog(sp?(B.guard?tx("It hits you for {n} through your guard.",{n:tot}):tx("It hits you for {n}.",{n:tot})):hitMsg(B,E,tot),"foe");
      leech(B,dmg);if(dmg>0&&S.hp>0)inflict(B,P,sp);
      if(ab)blog(B.ward?tx("Your rune ward absorbs {n}.",{n:ab}):tx("Your rune ward absorbs {n} and shatters.",{n:ab}),"good");
      if(P.thorns&&dmg>0&&S.hp>0){const th=Math.max(1,Math.round(dmg*P.thorns/100));dealt(B,th);B.hp-=th;floatFx("enemyHud","-"+th,"hurt");blog(tx("Your iron barbs bite it for {n}.",{n:th}),"you");if(B.hp<=0)break}
      if(sp&&sp.kind==="drain"&&dmg>0){B.hp=Math.min(B.max,B.hp+dmg);blog(tx("It drinks {n} HP from you.",{n:dmg}),"foe")}
    }
    if(S.hp<=0)return youFall();
    if(B.hp<=0)return enemyDown();
  }
  tickYou(B,P);if(S.hp<=0)return youFall();
  if(P.regen&&S.hp<P.maxHp)healYou(P.regen,tx("Your gear mends you"));
  if(P.root&&S.hp<P.maxHp*.5)healYou(P.root,tx("Roots knit your wounds"));
  endTurn(B);if(isSpecial(B)&&!B.frozen){sfx("warn",.25);if(unlock("parry"))blog(tx("It's winding up! Parry to turn it aside."),"big")}save();render();
}
function enemyDown(){
  const B=S.battle,E=ENEMIES[B.id];
  if(E.rebirth&&!B.reborn){B.reborn=true;B.hp=Math.round(B.max*.4);B.burn=null;B.poison=0;B.bleed=null;B.stun=0;B.frozen=false;blog(tx("The {name} bursts into flame and rises from its ashes!",{name:bname(B)}),"big");endTurn(B);save();return render()}
  if(hasAfx(B,"split")&&!B.split){splitFoe(B,E);endTurn(B);save();return render()} // Splitting: once; the remnant has no affixes, so this cannot repeat
  if(hasAfx(B,"boom")&&!B.boom){B.boom=1;if(!blast(B))return youFall()} // Volatile: you can die to the blast (a defeat, no loot); if you live the fight is won as usual
  const P=pstats(),dl=S.run==="daily",h=B.heat||0,lv0=level();
  if(dl)S.daily.turns+=B.turn;
  const st=S.stats;if(E.boss){st.bosses++;st.fast[B.id]=Math.min(st.fast[B.id]||1e9,B.turn);if(!dl){if(E.zone!==RIFT_ZONE)st.heatBest[E.zone]=Math.max(st.heatBest[E.zone]??-1,h);st.exped++}}else if(B.afx.length){st.elites++;noteAfx(B,true)}
  sfx("win",.3);sfx("loot",.9);
  B.hp=0;B.over="won";S.kills[B.id]=(S.kills[B.id]||0)+1;S.wins+=E.boss?3:1;
  if(!E.boss&&B.id!=="mimic")S.zoneKills[E.zone]=(S.zoneKills[E.zone]||0)+1;
  const mult=1+P.lure*.15+h*HEAT_T.loot;let got;
  const gh=h+(E.boss?GRADE_BOSS:0),gz=E.zone==="any"?S.zone:E.zone; // finds roll a grade for the zone and Heat (bosses a little hotter)
  if(B.id==="mimic"){const p=zonePool(S.zone);got=[gdrop(pick(p),gz,gh),gdrop(pick(p),gz,gh),gess(pick(ESS_POOL),gz,gh)]}
  else{const rw=E.boss?1:DENSITY_RW;got=E.drops.filter(([,p])=>Math.random()<p*mult*rw).map(([id])=>id);if(!got.length&&Math.random()<rw)got=[E.drops[0][0]];got=got.map(id=>gdrop(id,gz,gh))}
  if(B.opening===1){got=["coal","bread"];S.onboarding=2;blog(tx("Deconstruct the Ember Coal. Then research a technique to put the Fire essence into your sword."),"good")}
  if(B.opening===2){S.onboarding=5;blog(tx("Your first enchanted weapon has proved itself. The Woods are yours to explore."),"good")}
  if(twistNow()==="double")got=[...got,...got];
  if(!B.intr)B.afx.forEach(a=>got.push(afxDrop(E,a,gz,gh,RARITIES[B.rar].gs))); // each affix drops an affixed raw that deconstructs into its essence, a grade or two better by rarity (a wild creature's own affixes drop none)
  blog(tx("The {name} falls.",{name:bname(B)})+(P.lure?" "+tx("Your Lure gear draws in extra scraps."):""),"good");
  if(E.boss&&h&&!dl){const n=h*HEAT_T.ess,xp=h*HEAT_T.xp;for(let i=0;i<n;i++)got.push(gess(pick(ESS_POOL),gz,gh));S.xp+=xp;blog(txn("Heat {h} spoils: {n} extra essence and {xp} smith XP.","Heat {h} spoils: {n} extra essences and {xp} smith XP.",n,{h,xp}),"good")}
  if(E.boss&&dl)dailyBundle(got);
  learn(B.id,"stats",1);B.emb=fightEmbers(E,B);if(isUnl("peddler"))blog(tx("You rake {n} embers from the ashes.",{n:B.emb}),"good");
  got.forEach(id=>{addItem(id);const b=plainId(id);if(E.drops.some(d=>d[0]===b))learn(B.id,"drops",b)});B.loot=got;
  S.campProg++;let msg="";if(S.campProg>=3){S.campProg=0;if(S.camp<3){S.camp++;msg=tx("You earned a campfire charge.")}}
  if(E.boss&&dl){finishDaily(MAP_ROWS,true);const next=ZONES[zoneIdx(E.zone)+1];if(next&&!S.unlocked.includes(next[0])){S.unlocked.push(next[0]);msg=tx("{zone} is now open!",{zone:tx(next[1])})}} // a daily boss kill unlocks like a normal one, matching the load-time fix-up in loadSave
  else if(E.boss){const next=ZONES[zoneIdx(E.zone)+1],nh=Math.min(HEAT_MAX,h+1),hz=heatOf(E.zone);if(S.maps[E.zone])S.maps[E.zone].cleared=true;
    if(E.zone===RIFT_ZONE){const r=S.rift;r.cleared=1;r.best=Math.max(r.best||0,r.depth||1);msg=tx("The master of {name} falls. Go deeper when you are ready.",{name:r.name?tx(r.name):tx("the region")})}
    else if(next&&!S.unlocked.includes(next[0])){S.unlocked.push(next[0]);msg=tx("{zone} is now open!",{zone:tx(next[1])})}
    else if(!next&&hz.max===0)msg=tx("You've conquered the realm. Now turn up the Heat.");
    if(E.zone!==RIFT_ZONE&&nh>hz.max){S.heat[E.zone]={max:nh,sel:hz.sel};msg=(msg?msg+" ":"")+tx("Heat {h} unlocked in {zone}: {name}.",{h:nh,zone:zoneName(E.zone),name:HEAT[nh-1].name})}}
  if(E.boss&&S.kills[B.id]===1){rpGain("boss:"+B.id,RP.boss[Math.max(0,zoneIdx(E.zone))]||RP.boss[0],tx("{name} defeated",{name:shortName(B.id)}));const hm=giveHint();if(hm){blog(hm,"big");msg=(msg?msg+" ":"")+tx("A hint scroll joins your Recipes.")}}
  if(level()>lv0)msg=(msg?msg+" ":"")+lvMsg();
  save();render();if(msg)toast(msg);
}
function youFall(){
  const B=S.battle,P=pstats();if(B.opening)S.onboarding=B.opening===1?0:3;S.hp=0;B.over="lost";S.stats.deaths++;sfx("lose",.25);
  const pool=[];Object.keys(S.inv).forEach(id=>{const free=(S.inv[id]||0)-eqCount(id);for(let i=0;i<free;i++)pool.push(id)});
  let lost=null;if(pool.length){lost=pick(pool);S.inv[lost]--;trimBench()}
  S.hp=Math.round(P.maxHp*.3);const dl=S.run==="daily",zn=zoneName(S.zone);
  if(dl){S.daily.turns+=B.turn;finishDaily(S.daily.map.steps?S.daily.map.dp:0,false)}else S.maps[S.zone]=newMap(S.zone);
  blog(tx("You collapse and wake at the edge of {zone} with {hp} HP.",{zone:zn,hp:S.hp})+" "+(dl?tx("Your daily expedition is over."):tx("The paths have shifted."))+(lost?" "+tx("A scavenger made off with your {item}.",{item:iname(S.items[lost])}):""),"foe");
  save();render();
}

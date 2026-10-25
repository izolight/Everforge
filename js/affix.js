// ================= AFFIXES =================
// Rarity tiers and affixes (tables in data.js: RARITIES, RAR_CH, AFX, AFX_T). A map enemy is normal, magic (1 affix) or rare (2, or 3 from Heat RAR_CH.k3). A battle stores B.rar and B.afx (affix ids); the hooks run from battle.js (strike, enemyTurn, enemyDown, study, useItem) and map.js (foesAct) and call the helpers below. A Splitting remnant (B.split) has no live affixes, but keeps B.rar/B.afx for the rewards.
const afxOn=B=>B.split?[]:B.afx||[],hasAfx=(B,a)=>afxOn(B).includes(a),rarOf=B=>B.split?"normal":B.rar||"normal";
const rareCh=(h,row)=>Math.min(RAR_CH.rare.cap,RAR_CH.rare.base+RAR_CH.rare.heat*h+RAR_CH.rare.row*row),magicCh=h=>h>=RAR_CH.magic.from?RAR_CH.magic.base+RAR_CH.magic.heat*(h-RAR_CH.magic.from):0;
// two affixes combine unless they share a group (one elemental; one of Warded/Regenerating/Elusive; one of Vampiric/Regenerating/Warded; one of Splitting/Volatile) or drop the same essence
const grpOf=a=>(AFX[a].g||"").split(" ").filter(Boolean),afxOk=(a,b)=>!grpOf(a).some(g=>grpOf(b).includes(g))&&AFX[a].tr!==AFX[b].tr;
function rollAfx(R,rar,o){ // o: {mv: the species' way of moving, heat}; R is the seeded rng on the daily
  const k=rar==="rare"&&(o.heat|0)>=RAR_CH.k3?3:RARITIES[rar]?RARITIES[rar].k:0,pool=Object.keys(AFX).filter(a=>!AFX[a].roam||(o.mv&&o.mv!=="still")),out=[];
  for(let i=0;i<k;i++){const c=pool.filter(a=>!out.includes(a)&&out.every(b=>afxOk(a,b)));if(!c.length)break;out.push(c[Math.floor(R()*c.length)])}
  return out}
function rollFoe(R,o){ // rarity and affixes of one regular enemy: o {elite (an elite tile: magic or rare), heat, row (depth), mv}
  const h=o.heat||0,rar=o.elite?(R()<rareCh(h,o.row||0)?"rare":"magic"):R()<magicCh(h)?"magic":"normal";
  return{rar,afx:rollAfx(R,rar,{mv:o.mv,heat:h})}}
const afxCol=a=>AFX[a].col||FAM[TRAITS[AFX[a].tr].f],afxIc=(a,c)=>AFX[a].t==="el"?famIc(TRAITS[AFX[a].tr].f,c):ic(AFX[a].ic,c);
const elTr=B=>{const a=afxOn(B).find(x=>AFX[x].t==="el");return a?AFX[a].tr:null}; // the trait of its elemental affix, if any
const bname=B=>{const E=ENEMIES[B.id];if(B.split)return tx("{name} remnant",{name:tx(E.name)});return B.afx&&B.afx.length?tx("{affix} {name}",{affix:tx(AFX[B.afx[0]].n),name:tx(E.name)}):tx(E.name)}; // the name shown: an affix prefix, a remnant after a split (B.name keeps the English)
const btitle=B=>B.title&&!B.split?tx("the {title}",{title:tx(B.title)}):"";
const fullName=B=>bname(B)+(B.title&&!B.split?" "+btitle(B):"");
// the battle's stats, element, name and ward for a rarity + affix list (startBattle)
function applyAfx(B,E,rar,afx){
  B.rar=rar;B.afx=afx;if(!afx.length)return;
  const R=RARITIES[rar],a=afx.map(x=>AFX[x]),mul=k=>a.reduce((n,x)=>n*(x.m&&x.m[k]||1),1);
  B.max=B.hp=Math.round(B.max*R.hp*mul("hp"));B.atk=Math.round(B.atk*R.atk*mul("atk"));B.a0=B.atk;B.def=E.def+R.def+a.reduce((n,x)=>n+(x.m&&x.m.def||0),0);
  const el=a.find(x=>x.t==="el");if(el){const f=TRAITS[el.tr].f;B.el=f;if(!B.resist.includes(f))B.resist.push(f);B.weak=B.weak.filter(x=>x!==f)}
  B.name=`${a[0].n} ${E.name}`;B.title=rar==="rare"&&a[1]?a[1].ti:"";
  if(afx.includes("ward"))B.wm=B.wd=Math.max(1,Math.round(B.max*AFX_T.ward.x));
}
// ---- numbers shown on the enemy HUD, the map and the Codex
const dodgeOf=(B,tr)=>{const D=AFX_T.dodge;return Math.max(D.min,D.base-Math.min(D.sharpCap,(tr.Sharp||0)*D.sharp)-Math.min(D.studyMax,B.sty||0)*D.study)};
const dodgeNow=B=>{const P=pstats();return dodgeOf(B,withInnate(P.main?P.main.traits:{}))};
const blastOf=B=>Math.max(1,Math.round(B.max*AFX_T.boom.x));
// an affixed enemy drops its first raw material (DECON) carrying each affix: deconstructing it always gives that affix's essence (FRAG.afx fragments and an FRAG.afxCh chance of a full one). One without such a raw drops the essence itself.
const afxRawOf=E=>E.drops.map(d=>d[0]).find(id=>DECON[id]);
function afxDrop(E,a,zone,heat,up){const raw=afxRawOf(E);return raw?gradedItem(raw+"~"+a,rollGrade(zone,heat,undefined,up)):gess(AFX[a].tr,zone,heat,undefined,up)}
const gsTxt=gs=>gs>=1?(gs===1?tx("one grade better"):tx("{n} grades better",{n:gs})):tx("a {p}% chance of one grade better",{p:pcn(gs)});
const dropLine=(a,B)=>{const ess=tx("{trait} Essence",{trait:trn(AFX[a].tr)});return B?tx("Drops an affixed material that deconstructs into {ess}, {gs} than usual.",{ess,gs:gsTxt((RARITIES[B.rar]||{gs:1}).gs)}):tx("Drops an affixed material that deconstructs into {ess}. Magic enemies: {m}. Rare: {r}.",{ess,m:gsTxt(RARITIES.magic.gs),r:gsTxt(RARITIES.rare.gs)})};
const afxTip=(a,B)=>[tx(AFX[a].n),AFX[a].d(B),dropLine(a,B)];
function afxVal(a,B){ // the number on an affix chip
  if(!B)return"";
  return{vamp:()=>pcn(AFX_T.vamp)+"%",thorn:()=>pcn(AFX_T.thorn.x)+"%",regen:()=>"+"+pcn(AFX_T.regen)+"%",frenzy:()=>B.fz?"!":"",ward:()=>Math.max(0,B.wd),elusive:()=>dodgeNow(B)+"%",boom:()=>B.hp<=B.max*AFX_T.boom.warn?"~"+blastOf(B):""}[a]?.()??""}
const afxChip=(a,B)=>ci(afxCol(a),afxIc(a,"s"),afxVal(a,B),...afxTip(a,B));
// first sight of an affix fills its Codex entry (S.afx[id]={s: fights met in, b: enemies beaten})
function noteAfx(B,won){(B.afx||[]).forEach(a=>{const o=S.afx[a]||(S.afx[a]={s:0,b:0});if(won){o.b++;o.s=Math.max(o.s,1)}else{if(!o.s){blog(tx("Codex: new affix, {name}.",{name:tx(AFX[a].n)}),"lore");rpGain("afx:"+a,RP.afx,tx("a new affix"))}o.s++}})}
// ---- hooks (called from the combat flow)
function wardCut(B,n){const w=hasAfx(B,"ward")?Math.min(B.wd||0,n):0;if(w){B.wd-=w;if(!B.wd)B.wb=B.turn}return w}
const wardMsg=(B,ab)=>B.wd?tx("Its ward absorbs {n}.",{n:ab}):tx("Its ward absorbs {n} and shatters.",{n:ab});
function frenzy(B){if(hasAfx(B,"frenzy")&&!B.fz&&B.hp>0&&B.hp<B.max*AFX_T.frenzy.at){B.fz=1;B.atk=Math.round(B.atk*AFX_T.frenzy.x);blog(tx("The {name} flies into a frenzy! (+{p}% Attack)",{name:bname(B),p:pcn(AFX_T.frenzy.x-1)}),"foe")}}
function thornBack(B,dealtHp){ // Thorned: part of the blow that landed bites back, but never kills you
  if(!hasAfx(B,"thorn")||dealtHp<=0||S.hp<=1)return;
  const left=Math.max(0,Math.max(1,Math.round(pstats().maxHp*AFX_T.thorn.cap))-(B.thT||0)),t=Math.min(Math.max(1,Math.round(dealtHp*AFX_T.thorn.x)),left,S.hp-1); // the cap is per round (until its turn ends)
  if(t<=0)return;B.thT=(B.thT||0)+t;S.stats.taken+=t;S.hp-=t;fx("youHud","-"+t,"hurt");blog(tx("Its thorns bite you back for {n}.",{n:t}),"foe")}
function leech(B,dmg){ // Vampiric
  if(!hasAfx(B,"vamp")||dmg<=0||B.hp<=0)return;const h=Math.min(B.max-B.hp,Math.max(1,Math.round(dmg*AFX_T.vamp)));
  if(h>0){B.hp+=h;fx("enemyHud","+"+h,"heal");blog(tx("The {name} drinks in {n} HP.",{name:bname(B),n:h}),"foe")}}
function afxTick(B){ // start of its turn: Regenerating mends it, a broken ward comes back, Frenzied checks its health
  if(hasAfx(B,"regen")&&B.hp<B.max){const h=Math.min(B.max-B.hp,Math.max(1,Math.round(B.max*AFX_T.regen)));B.hp+=h;fx("enemyHud","+"+h,"heal");blog(tx("The {name} regrows {n} HP.",{name:bname(B),n:h}),"foe")}
  if(hasAfx(B,"ward")&&B.wd<=0&&B.wb!=null&&B.turn-B.wb>=AFX_T.ward.every){B.wd=B.wm;B.wb=null;blog(tx("Its ward flares back ({n}).",{n:B.wd}),"foe")}
  frenzy(B)}
function blast(B){ // Volatile: it bursts as it dies. Guard cuts the blast, your rune ward soaks it. Returns false if it kills you
  const raw=Math.max(1,Math.round(blastOf(B)*(B.guard?AFX_T.boom.guard:1))),ab=Math.min(B.ward||0,raw),n=raw-ab;
  B.ward=(B.ward||0)-ab;S.stats.taken+=Math.min(n,S.hp);S.hp-=n;
  blog(B.guard?tx("The {name} bursts apart! The blast hits you for {n} through your guard.",{name:bname(B),n:raw}):tx("The {name} bursts apart! The blast hits you for {n}.",{name:bname(B),n:raw}),"foe");
  if(ab)blog(B.ward?tx("Your rune ward absorbs {n}.",{n:ab}):tx("Your rune ward absorbs {n} and shatters.",{n:ab}),"good");
  fx("youHud",n?"-"+n:"","hurt");fx("youHud","","shake");fx("vig","","on");
  if(S.hp<=0)blog(tx("The blast tears through you."),"foe");
  return S.hp>0}
function splitFoe(B,E){ // Splitting: its first death leaves a weaker remnant with no affixes; B.split makes it happen once
  const T=AFX_T.split,was=bname(B);B.split=1;B.name=`${E.name} remnant`;B.title="";
  B.max=B.hp=Math.max(1,Math.round(B.max*T.hp));B.atk=Math.max(1,Math.round((B.a0||B.atk)*T.atk));B.fz=0;B.def=E.def;B.el=E.el;B.weak=[...E.weak];B.resist=[...E.resist];
  B.burn=null;B.poison=0;B.bleed=null;B.stun=0;B.frozen=false;B.wd=0;B.wm=0;
  blog(tx("The {was} splits in two! A weaker {name} lunges out of it.",{was,name:tx(E.name)}),"big")}

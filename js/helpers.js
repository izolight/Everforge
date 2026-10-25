// ================= HELPERS =================
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const r1=v=>Math.round(v*10)/10;
const cap=s=>s[0].toUpperCase()+s.slice(1);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const $=id=>document.getElementById(id);
// Tap-again confirmation: the first tap arms an action, a second tap inside the window carries it out.
const armTaps={};
function armClear(key){clearTimeout(armTaps[key+":t"]);delete armTaps[key]}
function armTap(key,ms,expire){const now=Date.now();
  if(armTaps[key]&&now-armTaps[key]<ms){armClear(key);return true}
  armTaps[key]=now;clearTimeout(armTaps[key+":t"]);
  armTaps[key+":t"]=setTimeout(()=>{delete armTaps[key];expire&&expire()},ms);
  return false;
}
const isArmed=key=>!!armTaps[key];
const reduced=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function level(){let l=1;XP_LV.forEach((t,i)=>{if(S.xp>=t)l=i+1});return l}
const skXp=k=>S.skills[k]||0;
function skLv(k){let l=1;SK_LV.forEach((t,i)=>{if(skXp(k)>=t)l=i+1});return l}
// skill XP fades when a recipe is easy for the skill: full from difficulty lv-1, down to a 10% floor at lv-4
const skFactor=(d,l)=>Math.max(.1,Math.min(1,(d-l+4)/3));
const skMsg=(k,l0)=>(sfx("level",.6),SK_CAP[skLv(k)-1]>SK_CAP[l0-1]?tx("{skill} Lv {lv}! Tier {tier} is within reach.",{skill:SKILLS[k].name,lv:skLv(k),tier:SK_CAP[skLv(k)-1]}):tx("{skill} Lv {lv}! Your forges fail less often.",{skill:SKILLS[k].name,lv:skLv(k)}));
const blockText=b=>tx("Your {skill} (Lv {lv}) can't reach tier {tier} yet. It needs Lv {need}.",{skill:SKILLS[b.skill].name,lv:b.lv,tier:b.tier,need:b.need});
const lvMsg=()=>(sfx("level",.6),tx("Smith level {lv}! {perk}",{lv:level(),perk:tx(LV_PERK[level()]||"Your mixtures grow steadier.")}));
const maxInputs=()=>2+INPUT_LV.filter(l=>level()>=l).length;
const infSlots=()=>INF_SLOTS+(level()>=9?1:0);
const traitSlots=()=>Math.min(7,4+Math.floor((level()-1)/2))+(level()>=10?1:0);
const tColor=t=>FAM[(TRAITS[t]||{f:"stone"}).f];
const topTraits=tr=>Object.entries(tr).sort((a,b)=>b[1]-a[1]);
const grp=it=>FORMS[it.form].g;
const isGear=it=>!!FORMS[it.form].slots;
const benchCount=id=>S.bench.filter(x=>x===id).length;
const avail=id=>(S.inv[id]||0)-benchCount(id);
const eqCount=id=>Object.values(S.eq).filter(x=>x===id).length;
const inBattle=()=>!!(S.battle&&!S.battle.over);
const rarity0=it=>it.grade||(!it.crafted&&gradable(baseIdOf(it.id)))?GRADES[(it.grade||3)-1]:it.legendary?["Legendary","#f2a54a"]:RARITY[Math.min(4,it.tier-1)]; // graded essences and materials show their grade instead
const rarity=it=>{const r=rarity0(it);return[tx(r[0]),r[1]]},gradeN=g=>tx(GRADES[g-1][0]);
const formEn=f=>FORMS[f].label.toLowerCase(),formName=f=>lc(txc("form",FORMS[f].label)); // formEn is for logic, formName is shown
const shortName=id=>tx(ENEMIES[id].short||ENEMIES[id].name);
function kindOf(it){const g=grp(it);if(g==="material")return it.kind||"ore";if(g==="consumable")return it.form==="food"?"food":"potion";return g}
function labelOf(it){return grp(it)==="material"?txc("kind",cap(kindOf(it))):(grp(it)==="weapon"?tx("Weapon")+" · ":"")+txc("form",FORMS[it.form].label)}
// Graded items (see GRADES in data.js): gradedItem makes the item for base id b at grade g in S.items on demand; essence(t) is the Plain one
function gradedItem(b,g){const id=gradedId(b,g);if(g!==3)gradedItem(b,3);if(!S.items[id])S.items[id]=mkGraded(b,g);return id}
const essence=trait=>gradedItem("ess_"+trait,3),essG=(trait,g)=>gradedItem("ess_"+trait,g);
const isEss=id=>/^ess_[A-Za-z]+(@[1-5])?$/.test(id),essTrait=id=>id.slice(4).replace(/@.*/,"");
// The grade a drop rolls in zone at heat: x (0-1) picks it, so the seeded daily can pre-roll it
// up = grade steps better (an affix essence from a magic or rare enemy; a fraction is the chance of one step), never above the best grade this zone's odds table can roll
function rollGrade(zone,heat,x,up){const h=Math.max(0,heat|0),o=GRADE_ODDS[zone]||GRADE_ODDS.woods,w=o.map((v,i)=>Math.max(0,v*(1+h*GRADE_HEAT[i]))),t=w.reduce((a,b)=>a+b,0);let r=(x??Math.random())*t,g=3;for(let i=0;i<5;i++){if(r<w[i]){g=i+1;break}r-=w[i]}
  if(up)g=Math.min(g+Math.floor(up)+(Math.random()<up%1?1:0),o.map(v=>v>0).lastIndexOf(true)+1,5); // a fractional `up` is the chance of one more step
  return g}
const gdrop=(id,zone,heat,x)=>gradable(id)?gradedItem(id,rollGrade(zone,heat,x)):id,gess=(t,zone,heat,x,up)=>essG(t,rollGrade(zone,heat,x,up));
const dropNow=(id,x)=>gdrop(id,S.zone,heatNow(),x),essNow=(t,x)=>gess(t,S.zone,heatNow(),x); // map finds and rewards in the zone you are in
const itemLocked=id=>(S.locked||[]).includes(id);
function recordPickup(id){S.recent=[id,...(S.recent||[]).filter(x=>x!==id)]}
function addItem(id,n){recordPickup(id);S.inv[id]=(S.inv[id]||0)+(n||1);if(!S.fresh.includes(id))S.fresh.push(id);if(isEss(id))rpGain("fam:"+essTrait(id),RP.fam,tx("a new essence ({t})",{t:trn(essTrait(id))}))}
const sortInputs=raw=>raw.slice().sort((a,b)=>FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||(a.id<b.id?-1:1));
const isFusion=(a,b)=>FUSIONS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
const recipeNames=it=>it.recipeIds&&it.recipeIds.length&&it.recipeIds.every(id=>S.items[id])?it.recipeIds.map(id=>iname(S.items[id])).join(" + "):(it.recipe||[]).map(n=>tx(n)).join(" + "); // a crafted item's ingredients, in the shown language
const zoneIdx=z=>ZONES.findIndex(x=>x[0]===z);
const zoneName=z=>tx(z==="any"?"Anywhere":ZONES[zoneIdx(z)][1]);
const zonePool=z=>Object.values(ENEMIES).filter(e=>e.zone===z&&!e.boss).flatMap(e=>e.drops.map(d=>d[0]));
function shade(h,a){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,p=Math.abs(a);
  r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}

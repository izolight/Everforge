// ================= HELPERS =================
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const r1=v=>Math.round(v*10)/10;
const cap=s=>s[0].toUpperCase()+s.slice(1);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const $=id=>document.getElementById(id);
const reduced=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function level(){let l=1;XP_LV.forEach((t,i)=>{if(S.xp>=t)l=i+1});return l}
const skXp=k=>S.skills[k]||0;
function skLv(k){let l=1;SK_LV.forEach((t,i)=>{if(skXp(k)>=t)l=i+1});return l}
const skMsg=k=>(sfx("level",.6),`${SKILLS[k].name} Lv ${skLv(k)}! Tier ${SK_CAP[skLv(k)-1]} is within reach.`);
const blockText=b=>`Your ${SKILLS[b.skill].name} (Lv ${b.lv}) can't reach tier ${b.tier} yet. It needs Lv ${b.need}.`;
const lvMsg=()=>(sfx("level",.6),`Smith level ${level()}! ${LV_PERK[level()]||"Your mixtures grow steadier."}`);
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
const rarity=it=>it.legendary?["Legendary","#f2a54a"]:RARITY[Math.min(4,it.tier-1)];
const formName=f=>FORMS[f].label.toLowerCase();
const shortName=id=>ENEMIES[id].short||ENEMIES[id].name;
function kindOf(it){const g=grp(it);if(g==="material")return it.kind||"ore";if(g==="consumable")return it.form==="food"?"food":"potion";return g}
function labelOf(it){return grp(it)==="material"?cap(kindOf(it)):(grp(it)==="weapon"?"Weapon · ":"")+FORMS[it.form].label}
function essence(trait){const id="ess_"+trait;if(!S.items[id])S.items[id]={id,name:`${trait} Essence`,form:"material",kind:"essence",noun:"Essence",traits:{[trait]:ESS_VALUE},tier:1,crafted:false};return id}
function refined(trait){const id=`ess_${trait}_2`;essence(trait);if(!S.items[id])S.items[id]={id,name:`Refined ${trait} Essence`,form:"material",kind:"essence",noun:"Essence",traits:{[trait]:REFINE_VALUE},tier:1,crafted:false};return id}
const isEss=id=>/^ess_[A-Za-z]+$/.test(id),isRefined=id=>/^ess_[A-Za-z]+_2$/.test(id);
function addItem(id,n){S.inv[id]=(S.inv[id]||0)+(n||1);if(!S.fresh.includes(id))S.fresh.push(id)}
const sortInputs=raw=>raw.slice().sort((a,b)=>FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||(a.id<b.id?-1:1));
const isFusion=(a,b)=>FUSIONS.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
const zoneIdx=z=>ZONES.findIndex(x=>x[0]===z);
const zoneName=z=>z==="any"?"Anywhere":ZONES[zoneIdx(z)][1];
const zonePool=z=>Object.values(ENEMIES).filter(e=>e.zone===z&&!e.boss).flatMap(e=>e.drops.map(d=>d[0]));
function shade(h,a){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=a<0?0:255,p=Math.abs(a);
  r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}

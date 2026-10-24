// ================= PLAYER =================
function gearOf(s){const id=S.eq[s];return id&&S.inv[id]>0?S.items[id]:null}
function innate(){const t={};Object.entries(S.infuse||{}).forEach(([k,r])=>t[k]=r*1.5);return t}
function innateStats(only){const out={atk:0,def:0,mag:0,heal:0,spd:0};Object.entries(S.infuse||{}).forEach(([k,r])=>{if(only&&k!==only)return;
  Object.entries(TRAITS[k].s).forEach(([s,w])=>out[s]+=w*r*1.5*.8)});Object.keys(out).forEach(s=>out[s]=Math.round(out[s]));return out}
function withInnate(tr){const out={...tr};Object.entries(innate()).forEach(([k,v])=>out[k]=r1((out[k]||0)+v));return out}
function resRaw(tr,out){out=out||{};Object.entries(tr).forEach(([t,v])=>{(RES_ALT[t]||[[(TRAITS[t]||{}).f,1]]).forEach(([el,w])=>{if(el&&el!=="bad"&&el!=="heal")out[el]=(out[el]||0)+v*w})});return out}
const resPct=v=>Math.round(Math.min(RES_CAP,v*RES_PER));
const medHeal=it=>Math.round(statsOf(it).heal*(1+Math.min(MED_CAP,MED_PER*(it.traits.Medicine||0))));
function pstats(){
  const g={};SLOTS.forEach(([s])=>g[s]=gearOf(s));
  const main=g.main,offW=g.off&&grp(g.off)==="weapon"?g.off:null,shield=g.off&&!offW?g.off:null;
  const armor=[g.head,g.body,g.hands,g.feet,g.charm,shield].filter(Boolean),Z={atk:0,def:0,mag:0,heal:0,spd:0},sum={...Z};
  armor.forEach(it=>{const st=statsOf(it);for(const k in sum)sum[k]+=st[k]});
  const inn=innate(),ist=innateStats();for(const k in sum)sum[k]+=ist[k];
  const ms=main?statsOf(main):Z,os=offW?statsOf(offW):Z;
  const all=[main,offW,...armor].filter(Boolean),tsum=t=>all.reduce((a,it)=>a+(it.traits[t]||0),0)+(inn[t]||0);
  const asum=t=>armor.reduce((a,it)=>a+(it.traits[t]||0),0)+(inn[t]||0),rr={},rs={};
  armor.forEach(it=>resRaw(it.traits,rr));resRaw(inn,rr);Object.keys(rr).forEach(k=>{const p=resPct(rr[k]);if(p)rs[k]=p});
  const med=tsum("Medicine"),def=Math.max(0,Math.round(sum.def+(ms.def+os.def)*.5));
  return {main,offW,shield,def,red:def/(def+30),
    atk:Math.max(1,Math.round(4+ms.atk+sum.atk*.5)),mag:Math.max(0,Math.round(ms.mag+sum.mag*.5)),
    offPow:offW?Math.max(1,Math.round((os.atk+os.mag*.7)*.6)):0,
    spd:Math.max(0,Math.round(sum.spd+ms.spd+os.spd*.5)),
    regen:Math.max(0,Math.round((sum.heal+ms.heal+os.heal)*.2+med*MED_REGEN)),
    maxHp:50+Math.round(def*.6),lure:tsum("Lure"),blind:tsum("Steam"),rs,
    ward:Math.min(WARD_CAP,Math.round(tsum("Runic")*WARD_PER)),thorns:Math.min(THORN_CAP,Math.round(asum("Iron")*THORN_PER)),dr:Math.min(STONE_CAP,r1(asum("Stone")*STONE_DR)),
    dodge:Math.min(DODGE_CAP,Math.round(tsum("Swift")*DODGE_PER)),root:Math.min(ROOT_CAP,Math.round(tsum("Wood")*ROOT_PER)),cleanse:med}; // cleanse: hook for status effects
}
function clampHp(){const m=pstats().maxHp;if(S.hp>m)S.hp=m}
// Infusion: an essence counts INF_W ninths of a plain one; a trait needs INF_COST plain ones' worth (INF_NEED ninths), paid with the cheapest essences that cover it
const INF_NEED=INF_COST*INF_W[2],essIds=t=>Object.keys(S.items).filter(id=>isEss(id)&&essTrait(id)===t&&avail(id)>0);
const infHave=t=>essIds(t).reduce((n,id)=>n+avail(id)*INF_W[gradeOf(id)-1],0);
function infPay(t,need=INF_NEED){
  const p=[];let sum=0;
  for(const id of essIds(t).sort((a,b)=>gradeOf(a)-gradeOf(b))){for(let i=avail(id);i>0&&sum<need;i--){p.push(id);sum+=INF_W[gradeOf(id)-1]}if(sum>=need)break}
  if(sum<need)return null;
  for(let i=p.length-1;i>=0;i--){const w=INF_W[gradeOf(p[i])-1];if(sum-w>=need){sum-=w;p.splice(i,1)}} // drop what the total does not need, dearest first
  return p;
}
const payText=ids=>{const c={};ids.forEach(id=>c[gradeOf(id)]=(c[gradeOf(id)]||0)+1);return Object.keys(c).sort().map(g=>`${c[g]} ${GRADES[g-1][0]}`).join(" + ")};
function infusable(){
  return [...new Set(Object.keys(S.items).filter(isEss).map(essTrait))].filter(t=>{
    const r=S.infuse[t]||0;
    return infHave(t)+S.infCredit>=INF_NEED&&r<INF_MAX&&(r>0||Object.keys(S.infuse).length<infSlots())})}
// surplus from an infusion (a Pure paying for one rank) is kept as credit (S.infCredit, ninths) and spent first on the next
const creditTxt=c=>{const w=Math.floor(c/9),r=c%9;return `${w?w+" ":""}${r?(r%3?r+"/9":r/3+"/3"):""}`.trim()||"0"};
function infuse(t){if(!infusable().includes(t))return;const pay=infPay(t,Math.max(0,INF_NEED-S.infCredit)),sum=pay.reduce((n,id)=>n+INF_W[gradeOf(id)-1],0);pay.forEach(id=>S.inv[id]--);S.infCredit=S.infCredit+sum-INF_NEED;trimBench();S.infuse[t]=(S.infuse[t]||0)+1;clampHp();save();render();
  toast(`${t} infused into you. Rank ${["I","II","III"][S.infuse[t]-1]}.`)}

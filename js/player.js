// ================= PLAYER =================
function gearOf(s){const id=S.eq[s];return id&&S.inv[id]>0?S.items[id]:null}
function innate(){const t={};Object.entries(S.infuse||{}).forEach(([k,r])=>t[k]=r*1.5);return t}
function innateStats(only){const out={atk:0,def:0,mag:0,heal:0,spd:0};Object.entries(S.infuse||{}).forEach(([k,r])=>{if(only&&k!==only)return;
  Object.entries(TRAITS[k].s).forEach(([s,w])=>out[s]+=w*r*1.5*.8)});Object.keys(out).forEach(s=>out[s]=Math.round(out[s]));return out}
function withInnate(tr){const out={...tr};Object.entries(innate()).forEach(([k,v])=>out[k]=r1((out[k]||0)+v));return out}
function pstats(){
  const g={};SLOTS.forEach(([s])=>g[s]=gearOf(s));
  const main=g.main,offW=g.off&&grp(g.off)==="weapon"?g.off:null,shield=g.off&&!offW?g.off:null;
  const armor=[g.head,g.body,g.hands,g.feet,g.charm,shield].filter(Boolean),Z={atk:0,def:0,mag:0,heal:0,spd:0},sum={...Z};
  armor.forEach(it=>{const st=statsOf(it);for(const k in sum)sum[k]+=st[k]});
  const inn=innate(),ist=innateStats();for(const k in sum)sum[k]+=ist[k];
  const ms=main?statsOf(main):Z,os=offW?statsOf(offW):Z;
  const all=[main,offW,...armor].filter(Boolean),tsum=t=>all.reduce((a,it)=>a+(it.traits[t]||0),0)+(inn[t]||0);
  const def=Math.max(0,Math.round(sum.def+(ms.def+os.def)*.5));
  return {main,offW,shield,def,red:def/(def+30),
    atk:Math.max(1,Math.round(4+ms.atk+sum.atk*.5)),mag:Math.max(0,Math.round(ms.mag+sum.mag*.5)),
    offPow:offW?Math.max(1,Math.round((os.atk+os.mag*.7)*.6)):0,
    spd:Math.max(0,Math.round(sum.spd+ms.spd+os.spd*.5)),
    regen:Math.max(0,Math.round((sum.heal+ms.heal+os.heal)*.2)),
    maxHp:50+Math.round(def*.6),lure:tsum("Lure"),blind:tsum("Steam")};
}
function clampHp(){const m=pstats().maxHp;if(S.hp>m)S.hp=m}
function infusable(){
  return Object.keys(S.items).filter(id=>id.startsWith("ess_")).map(id=>id.slice(4)).filter(t=>{
    const have=(S.inv["ess_"+t]||0)-benchCount("ess_"+t),r=S.infuse[t]||0;
    return have>=INF_COST&&r<INF_MAX&&(r>0||Object.keys(S.infuse).length<INF_SLOTS)})}
function infuse(t){if(!infusable().includes(t))return;S.inv["ess_"+t]-=INF_COST;trimBench();S.infuse[t]=(S.infuse[t]||0)+1;clampHp();save();render();
  toast(`${t} infused into you. Rank ${["I","II","III"][S.infuse[t]-1]}.`)}

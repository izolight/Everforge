// ================= ART: MAP =================
const riftPal=()=>{const r=S&&S.rift&&S.rift.pal;return r&&r.tf?r:{tf:"#1d1a33",tl:"#2d2a52",tb:"#7468b8"}}; // the Rift's palette, rolled with its region
function terrain(zone,H,seed){
  const R=rng(seed),W=400;let s="";
  if(zone==="woods"){for(let k=0;k<26;k++){const x=R()*W,y=R()*H,sz=8+R()*10;s+=`<path d="M${x} ${y-sz*1.8} L${x-sz} ${y} H${x+sz} Z" fill="#1f3322"/><path d="M${x} ${y-sz*1.2} L${x-sz*.8} ${y+sz*.5} H${x+sz*.8} Z" fill="#26402a"/>`}}
  if(zone==="pass"){for(let k=0;k<12;k++){const x=R()*W,y=R()*H+20,w=24+R()*26;s+=`<path d="M${x-w} ${y} L${x} ${y-w*1.1} L${x+w} ${y} Z" fill="#26313a"/><path d="M${x-w*.3} ${y-w*.77} L${x} ${y-w*1.1} L${x+w*.3} ${y-w*.77} Z" fill="#cfe3ec" opacity=".55"/>`}
    for(let k=0;k<40;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.8+R()*1.4}" fill="#dbeef6" opacity=".35"/>`}
  if(zone==="hollow"){for(let k=0;k<16;k++){const x=R()*W,y=R()*H;s+=`<path d="M${x} ${y} l${8+R()*8} ${5+R()*6} l${-4+R()*4} ${6+R()*8} l${10+R()*8} ${4+R()*6}" stroke="#ff6b2c" stroke-width="1.6" fill="none" opacity=".35"/>`}
    for(let k=0;k<26;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.8+R()*1.6}" fill="#ffb15c" opacity=".35"/>`}
  if(zone==="spire"){for(let k=0;k<9;k++)s+=`<ellipse cx="${R()*W}" cy="${R()*H}" rx="${30+R()*40}" ry="${7+R()*8}" fill="#8a9bd6" opacity=".12"/>`;
    for(let k=0;k<5;k++){const x=R()*W,y=R()*H;s+=`<path d="M${x} ${y} l${-5+R()*10} 9 l${-6+R()*12} 8 l${-5+R()*10} 10" stroke="#b892f2" stroke-width="1.6" fill="none" opacity=".35"/>`}
    for(let k=0;k<34;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.7+R()*1.5}" fill="#e8e4ff" opacity=".4"/>`}
  if(zone===RIFT_ZONE){const p=riftPal(); // a random region: rings and motes in its own colours
    for(let k=0;k<16;k++){const x=R()*W,y=R()*H,r=8+R()*22;s+=`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.32}" fill="none" stroke="${p.tb}" stroke-width="1.4" opacity=".22"/>`}
    for(let k=0;k<38;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.7+R()*1.7}" fill="${p.tb}" opacity=".38"/>`}
  return `<svg class="terrain" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
// per-zone tile look: floor / rock-or-tree / water art, drawn on a 24x24 tile (the zone's terrain() palette)
const TILE_ART={
  woods:{rock:'<path d="M12 3 L5 14 H19 Z" fill="#2c5a35"/><path d="M12 8 L4 20 H20 Z" fill="#23472b"/><path d="M11 19 H13 V22 H11 Z" fill="#4a3624"/>',water:'<ellipse cx="12" cy="13" rx="10" ry="6" fill="#1d3b44"/><path d="M5 13 q3-2 5 0 t5 0" stroke="#6fb0c0" stroke-width="1" fill="none"/>'},
  pass:{rock:'<path d="M2 21 L9 6 L13 13 L16 9 L22 21 Z" fill="#3b4a56"/><path d="M9 6 L11 10 L7.5 10 Z M16 9 L17.5 12 L14.5 12 Z" fill="#cfe3ec"/>',water:'<path d="M3 8 L12 4 L21 9 L19 19 L7 20 Z" fill="#8fbcd0" opacity=".55"/><path d="M8 10 L14 13 M11 8 L10 16" stroke="#e8f6fb" stroke-width=".8"/>'},
  hollow:{rock:'<path d="M5 21 L7 9 L11 4 L15 9 L19 21 Z" fill="#2a1c18" stroke="#ff6b2c" stroke-width=".8"/><path d="M11 6 L10 13 L12 21" stroke="#ff6b2c" stroke-width=".9" fill="none" opacity=".8"/>',water:'<ellipse cx="12" cy="13" rx="10" ry="6" fill="#b53c0c"/><ellipse cx="12" cy="13" rx="6" ry="3" fill="#ffb15c" opacity=".7"/>'},
  spire:{rock:'<path d="M12 2 L17 10 L14 22 H10 L7 10 Z" fill="#3a3f78" stroke="#b892f2" stroke-width=".8"/><path d="M12 2 L12 22" stroke="#b892f2" stroke-width=".5" opacity=".6"/>',water:'<ellipse cx="12" cy="13" rx="10" ry="6" fill="#161129" stroke="#8a9bd6" stroke-width=".8"/><circle cx="9" cy="12" r=".8" fill="#e8e4ff"/><circle cx="14" cy="14" r=".6" fill="#e8e4ff"/>'}
};
const riftTileArt=()=>{const p=riftPal();return{rock:`<path d="M12 2 L18 9 L15 21 H9 L6 9 Z" fill="${p.tb}" opacity=".75"/><path d="M12 5 V19" stroke="${p.tl}" stroke-width="1"/>`,water:`<ellipse cx="12" cy="13" rx="10" ry="6" fill="${p.tl}" opacity=".8"/><circle cx="9" cy="12" r="1" fill="${p.tb}"/><circle cx="14" cy="14" r=".7" fill="${p.tb}"/>`}};
const tileSvg=(z,c,x,y)=>`<svg class="tart" viewBox="0 0 24 24" aria-hidden="true">${(z===RIFT_ZONE?riftTileArt():TILE_ART[z])[c==="~"?"water":"rock"]}</svg>`;
const DIR_N=["north","east","south","west"];
// Read the POI's actual movement (old maps and the gate guard stay still), never the species.
const mapMove=p=>isUnl("roam")&&(p.mv==="wander"||p.mv==="chase")?p.mv:"still";
const MOVE_INFO={
  still:{ic:"fight",get name(){return tx("Stationary enemy")},get tip(){return tx("Waits on its tile.")}},
  wander:{ic:"wander",get name(){return tx("Wandering enemy")},get tip(){return tx("Roams between nearby tiles.")}},
  chase:{ic:"chase",get name(){return tx("Chasing enemy")},get tip(){return tx("Follows you after noticing you.")}}
};
function mapHtml(){
  const m=curMap(),z=S.zone,adj=busy()?[]:adjTiles(m),H=Math.round(400*m.h/m.w),boss=shortName(ZONES[zoneIdx(z)][2]);
  let cells="";
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
    const i=y*m.w+x,c=m.g[y][x],seen=m.sn[i],lit=litAt(m,x,y),here=m.pos.x===x&&m.pos.y===y,p=poiAt(m,x,y),t=!seen?null:lit?(p&&!p.done?p.t:null):m.mem[x+","+y]||null,k=adj.findIndex(a=>a[0]===x&&a[1]===y),en=lit&&p&&!p.done&&isFoe(p)?p:null,gh=!lit&&(t==="fight"||t==="elite"),ra=en&&RARITIES[en.rar]?RARITIES[en.rar]:null; // en: an enemy in the light now; gh: only where one was last seen; ra: its rarity, shown as a frame and affix pips
    const rumor=!seen&&p&&!p.done&&!isFoe(p)&&p.t!=="boss"&&Math.abs(x-m.pos.x)+Math.abs(y-m.pos.y)<=4;
    const cls=`tl ${rumor?"rumor ":""}${!seen?"unk":lit?"lit":"seen"}${c==="#"||c==="~"?" blk":""}${c===","?" brush":""}${t?" p-"+t:""}${here?" here":""}${k>=0?" adj":""}${t==="boss"?" lair":""}${gh?" ghost":""}${en&&en.aw?" aware":""}${en&&en.dz>0?" dazed":""}${en&&en.ms===m.steps?" moved":""}${ra?" r-"+en.rar:""}`;
    const move=en?MOVE_INFO[mapMove(en)]:null;
    const inner=`${rumor?`<span aria-label="${esc(tx("Unexplored landmark"))}">?</span>`:""}${seen&&(c==="#"||c==="~")?tileSvg(z,c):""}${t?icon(move?move.ic:gh?"fight":t):""}${en&&en.aw?`<b class="bdg bang" aria-hidden="true">!</b>`:""}${en&&en.dz>0?`<b class="bdg zz" aria-hidden="true">z</b>`:""}${ra?`<span class="afp" aria-hidden="true">${en.afx.map(a=>`<i style="background:${afxCol(a)}"></i>`).join("")}</span>`:""}${here?`<span class="hero">${heroMini()}</span>`:""}`;
    const lbl=t?`${gh?tx("Last seen: "):""}${ra?ra.name+" ":""}${NODE_INFO[t]}${move?", "+move.name:""}${ra?` (${en.afx.map(a=>tx(AFX[a].n)).join(", ")})`:""}${en&&en.aw?", "+tx("hunting"):""}${en&&en.dz>0?", "+tx("dazed"):""}`:"",tp=move?" "+tt(lbl,move.tip,...ra?[...en.afx.map(a=>`${tx(AFX[a].n)}: ${AFX[a].d()}`),tx("Drops: {list} essence. {rar}: {gs} than usual.",{list:en.afx.map(a=>trn(AFX[a].tr)).join(", "),rar:ra.name,gs:gsTxt(RARITIES[en.rar].gs)})]:[]):"";
    cells+=k>=0?`<button class="${cls}" data-tile="${x},${y}" aria-label="${esc(tx("Step {dir}",{dir:tx(DIR_N[DIRS.findIndex(d=>d[0]===x-m.pos.x&&d[1]===y-m.pos.y)])})+(t?`: ${lbl}${t==="boss"?`, ${boss}`:""}`:""))}"${tp}>${inner}</button>`:`<div class="${cls}"${t||here?` aria-label="${esc([here?tx("You"):"",lbl].filter(Boolean).join(", "))}"`:""}${tp}>${inner}</div>`}
  const foes=(isUnl("roam")?Object.values(MOVE_INFO):[MOVE_INFO.still]).map(move=>`<span ${tt(move.name,move.tip)}>${icon(move.ic)}${move.name}</span>`).join("");
  const legend=foes+Object.entries(NODE_INFO).filter(([t])=>t!=="fight"&&t!=="elite"&&(!UNL[t]||isUnl(t))).map(([t,l])=>`<span>${icon(t)}${l}</span>`).join("")+`<span>${heroMini()}${tx("You")}</span><span class="lg-fog"><i></i>${tx("Unseen")}</span>${isUnl("roam")?`<span><b class="bdg bang">!</b>${tx("hunting")}</span><span><b class="bdg zz">z</b>${tx("dazed")}</span>`:""}${isUnl("elite")?`<span class="lg-r m"><i></i>${RARITIES.magic.name}</span><span class="lg-r r"><i></i>${RARITIES.rare.name}</span>`:""}<span class="lg-gh">${icon("fight")}${tx("seen")}</span>`;
  const ml=(m.log||[]).slice(-3),fresh=m.ls===m.steps,lg=ml.slice(0,-1).map(l=>`<li>${esc(l)}</li>`).join(""); // the newest line sits in the status strip; the two before it show here; the screen reader hears the newest
  const dx=Math.sign(m.lair.x-m.pos.x),dy=Math.sign(m.lair.y-m.pos.y),dir=dy<0?(dx<0?"↖":dx>0?"↗":"↑"):dy>0?(dx<0?"↙":dx>0?"↘":"↓"):dx<0?"←":dx>0?"→":"•";
  return `<div class="map-tools"><span>${tx("Boss direction")}: <b>${dir}</b></span><button class="btn sm" id="recenter">${tx("Recenter")}</button></div><div class="mapwrap" tabindex="0" role="region" aria-label="${esc(tx("Expedition map"))}"><div class="map z-${z}" style="--w:${m.w}${z===RIFT_ZONE?`;--tf:${riftPal().tf};--tl:${riftPal().tl};--tb:${riftPal().tb}`:""}">${terrain(z,H,m.seed||7)}<div class="tls">${cells}</div></div></div><p class="map-pan">↔ ${tx("Swipe to explore the map.")}</p>${lg?`<ul class="mlog">${lg}</ul>${fresh?`<p class="sr" role="status">${esc(ml[ml.length-1])}</p>`:""}`:""}<details class="legend" id="legend"${legendOpen?" open":""}><summary>${ic("list","s")} ${tx("Map key")}</summary><div>${legend}</div></details>`;
}

// ================= ART: CREATURES (composition) =================
function compose(A,c,afx,R){
  const sk=A.skin||"#cfa784",B=BODY[A.b](c,{skin:sk,glow:A.glow}),parts=[...(A.p||[])],rest=[],els=[];
  (afx||[]).forEach(id=>{const X=AFX_ART[id];if(X&&X.tat)els.push(id);else if(X&&X.p&&!parts.includes(X.p)&&!(X.p==="halo"&&parts.includes("hood")))parts.push(X.p);else rest.push(id)});
  const L=z=>parts.filter(p=>PART[p]&&PART[p].z===z).map(p=>PART[p].f(c,B.a)).join("");
  const pat=A.pat&&PAT[A.pat]?`<mask id="${c.id}k" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><g filter="url(#${c.id}w)">${B.s}</g></mask><g mask="url(#${c.id}k)" opacity="${A.po||.6}">${PAT[A.pat](c,R)}</g>`:"";
  return{s:L(-1)+B.s+pat+B.f+tattoo(els,B.a.tt)+L(1),rest,fly:B.a.fly}; // the tattoo sits on the body, inside its bob and breath
}

// the glow filters: e = bloom on eyes, cores and runes; w = the silhouette as a white mask (eroded so patterns stay inside the outline); r = rim light for magic, rare and bosses
const glowF=(id,col)=>`<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="a"/><feGaussianBlur in="a" stdDeviation="2.6" result="b"/><feFlood flood-color="${col}"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const BD_SLOT={burn:0,poison:1,frozen:2,stun:3,weak:4,bleed:5,shield:6}; // each status keeps its own badge slot in the bottom-right corner
function portrait(id,o){
  o=o||{};const E=ENEMIES[id],A=!PORTRAITS[id]&&E.art,el=o.el||E.el,own=el===E.el,base0=A&&A.c&&own?A.c:FAM[el],base=o.weak?tint(base0,0,-.55):base0,gidp="p"+(gid++),X=EL_FX[el]||EL_FX.heal;
  const acc=A&&A.a&&own?A.a:X.a,R=rng(hash(id+":"+el));
  const c={id:gidp,o:"#0d0a08",d:`url(#${gidp}d)`,m:`url(#${gidp}m)`,D:shade(base,-.62),M:shade(base,-.32),l:shade(tint(base,8),.38),g:base,e:X.e,a:acc,p:A&&A.pc||acc,b:shade(tint(acc,0,-.2),.1),ph:o.phased};
  let body,rest=o.afx||[],fly=FLOATS[id];
  if(A){const r=compose(A,c,rest,R);body=r.s;rest=r.rest;fly=fly||r.fly}else body=PORTRAITS[id](c);
  body=body.replace(new RegExp(`(fill|stroke)="${c.e}"`,"g"),`$1="${c.e}" filter="url(#${gidp}e)"`); // eyes, cores and runes bloom
  const tats=rest.filter(a=>AFX_ART[a]&&AFX_ART[a].tat);let over=tattoo(tats,[60,68,14])+rest.filter(a=>!tats.includes(a)).map(a=>AFX_ART[a]&&AFX_ART[a].f?AFX_ART[a].f(c):"").join(""); // affix marks the body could not wear (a hand-drawn portrait takes its tattoo here)
  const ghost=rest.includes("elusive")?`<g opacity=".32" transform="translate(11 -4)">${body}</g>`:""; // Elusive: an afterimage
  if(o.frozen)over+=`<g><rect x="4" y="4" width="112" height="112" rx="20" fill="#bfeaff" opacity=".22"/><g stroke="#effbff" stroke-width="2.2" stroke-linecap="round"><path d="M16 14 v14 M9 21 h14 M11 16 l10 10 M21 16 l-10 10"/><path d="M98 92 v12 M92 98 h12"/><path d="M100 18 v8 M96 22 h8"/></g></g>`;
  if(o.burn)over+=`<g fill="#ff8a3d" opacity=".9"><path class="flick" d="M14 116 q4 -18 10 -6 q3 -14 8 0 q3 -10 8 2 Z"/><path class="flick" d="M80 116 q4 -16 9 -4 q4 -14 9 0 q3 -10 8 4 Z"/></g>`;
  if(o.poison)over+=`<g fill="${FAM.poison}"><circle class="flt" cx="22" cy="40" r="3"/><circle class="flt" cx="100" cy="56" r="2.5"/><circle class="flt" cx="94" cy="30" r="2"/></g>`;
  if(o.stun)over+=`<g class="amb-spin" style="transform-box:view-box;transform-origin:60px 24px">${[0,1,2].map(i=>`<path d="${star4(60+Math.cos(i*2.09)*15,24+Math.sin(i*2.09)*4,3.2)}" fill="#ffe08a" stroke="#0d0a08" stroke-width=".6"/>`).join("")}</g>`; // stunned: stars circle the head
  if(o.bleed)over+=`<g fill="#c43c4f" stroke="#0d0a08" stroke-width=".8">${[[30,104],[46,110],[84,106]].map(([x,y])=>`<path class="flt" d="M${x} ${y-6} q3 4 2.5 6 q-.5 2 -2.5 2 q-2 0 -2.5 -2 q-.5 -2 2.5 -6Z"/>`).join("")}</g>`; // bleeding: drops fall off the body
  if(o.shield)over+=`<circle cx="60" cy="62" r="57" fill="none" stroke="#bff3ff" stroke-width="3"/>`; // shielded: a solid bright ring (a ward is a dashed hexagon)
  const bd=[["burn",o.burn,"#ff8a3d",`<path d="M0 -3.6 Q3 0 1.2 3 Q-3 1.2 -1 -2 Q-2 1 -3 1 Q-4 -1 0 -3.6Z" fill="#ff8a3d"/>`],["poison",o.poison,FAM.poison,`<path d="M0 -3.6 Q3 1 2.5 2.5 Q0 4 -2.5 2.5 Q-3 1 0 -3.6Z" fill="${FAM.poison}"/>`],
    ["frozen",o.frozen,"#bfeaff",`<path d="M0 -3.4 V3.4 M-2.9 -1.7 L2.9 1.7 M-2.9 1.7 L2.9 -1.7" stroke="#effbff" stroke-width="1.4" stroke-linecap="round"/>`],
    ["stun",o.stun,"#ffe08a",`<path d="${star4(0,0,3.8)}" fill="#ffe08a"/>`],["weak",o.weak,"#ffb142",`<path d="M0 -3.5 V2.5 M-3 -.5 L0 3 L3 -.5" fill="none" stroke="#ffb142" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`],
    ["bleed",o.bleed,"#c43c4f",`<path d="M0 -3.6 Q3 1 2.5 2.5 Q0 4 -2.5 2.5 Q-3 1 0 -3.6Z" fill="#c43c4f"/>`],["shield",o.shield,"#bff3ff",`<circle r="3.2" fill="none" stroke="#bff3ff" stroke-width="1.6"/>`]].filter(b=>b[1]);
  if(bd.length)over+=`<g class="sbadge">${bd.map(b=>`<g transform="translate(${110-15*BD_SLOT[b[0]]} 108)"><circle r="6.5" fill="#0d0a08" stroke="${b[2]}" stroke-width="1.4"/>${b[3]}</g>`).join("")}</g>`; // status badges: a fixed corner, one slot per status
  const aura=o.aura?`<circle cx="60" cy="62" r="56" fill="none" stroke="${o.aura}" stroke-width="${o.rare?3:2}" stroke-dasharray="${o.rare?"7 3":"3 6"}" opacity=".9"/>`:""; // magic: blue dashes, rare: gold, heavier
  const rim=o.aura||(E.boss?base:null),amb=o.lite?{b:"",f:""}:(AMB[el]||AMB.heal)(c,R); // lite: a small tile (the Codex grid) skips the ambience
  const boss=E.boss&&!o.lite?`<circle class="amb-pulse" cx="60" cy="62" r="50" fill="none" stroke="${base}" stroke-width="2"/><circle class="amb-pulse" style="animation-delay:-1.2s" cx="60" cy="62" r="50" fill="none" stroke="${acc}" stroke-width="1.2"/>`:"";
  const spark=o.rare?pts(R,6,(i,x,y,z)=>`<path ${an("amb-tw",1.4+z*1.4,y)} d="${star4(60+Math.cos(i*1.05)*50,62+Math.sin(i*1.05)*50,2.2+z*1.6)}" fill="#ffe08a"/>`):"";
  const L1=shade(tint(base,14,.06),-.08),M1=shade(base,-.34),D1=shade(tint(base,-16),-.58);
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
    <radialGradient id="${gidp}"><stop offset="0" stop-color="${base}" stop-opacity=".45"/><stop offset=".55" stop-color="${acc}" stop-opacity=".12"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${gidp}v"><stop offset=".5" stop-color="#07050c" stop-opacity="0"/><stop offset="1" stop-color="#07050c" stop-opacity=".7"/></radialGradient>
    <radialGradient id="${gidp}c" cy=".4"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".45" stop-color="${acc}" stop-opacity=".55"/><stop offset="1" stop-color="${c.l}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${gidp}m" gradientUnits="userSpaceOnUse" x1="30" y1="4" x2="80" y2="118"><stop offset="0" stop-color="${L1}"/><stop offset=".5" stop-color="${M1}"/><stop offset="1" stop-color="${shade(tint(base,-14),-.52)}"/></linearGradient>
    <linearGradient id="${gidp}d" gradientUnits="userSpaceOnUse" x1="30" y1="4" x2="80" y2="118"><stop offset="0" stop-color="${shade(tint(base,8),-.45)}"/><stop offset="1" stop-color="${D1==="#000000"?"#0d0a08":shade(D1,-.3)}"/></linearGradient>
    <filter id="${gidp}e" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${gidp}w" x="0" y="0" width="1" height="1"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/><feMorphology operator="erode" radius="1.5"/></filter>
    ${rim?glowF(gidp+"r",rim):""}</defs>
    <circle cx="60" cy="62" r="58" fill="url(#${gidp})"/>${amb.b}${boss}${aura}<ellipse class="${fly?"amb-shadow":""}" cx="60" cy="113" rx="${fly?24:36}" ry="${fly?3.5:5}" fill="#000" opacity="${fly?.25:.4}"/>
    <g class="${fly?"amb-hover":"amb-breathe"}"${rim?` filter="url(#${gidp}r)"`:""}>${ghost}${body}</g>${amb.f}${spark}${over}</svg>`;
}

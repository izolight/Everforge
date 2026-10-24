// ================= ART: ITEMS =================
const G={
  blade:'<path d="M12 2 L14 5 L14 15 L10 15 L10 5 Z"/><path d="M6 15 H18 V16.6 H6 Z"/><path d="M11 16.6 H13 V20 H11 Z"/><circle cx="12" cy="21" r="1.4"/>',
  spear:'<path d="M12 1.5 L14.8 7 L12 9.5 L9.2 7 Z"/><path d="M11.2 9.5 H12.8 V22.5 H11.2 Z"/>',
  staff:'<circle cx="12" cy="5" r="3.2"/><path d="M11.1 8 H12.9 V22.5 H11.1 Z"/><path d="M8.5 3 Q12 -1 15.5 3" fill="none"/>',
  shield:'<path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z"/><path d="M12 6 V18 M7 11 H17" fill="none"/>',
  helm:'<path d="M5 13 C5 6 8 3 12 3 C16 3 19 6 19 13 V18 H15 V13 H9 V18 H5 Z"/><path d="M12 3 V9" fill="none"/>',
  chest:'<path d="M8 3 L4 6 L5 11 L7 10 V21 H17 V10 L19 11 L20 6 L16 3 Q12 7 8 3 Z"/><path d="M12 9 V21" fill="none"/>',
  gloves:'<path d="M7 21 V10 Q7 4 12 4 Q17 4 17 10 V21 Z"/><path d="M7 12 L4 9 Q3 7 5 7 L7 9 Z"/><path d="M7 17 H17" fill="none"/>',
  boots:'<path d="M7 3 H14 V13 L19 15 Q21 16 21 18 V21 H7 Z"/><path d="M7 17 H21" fill="none"/>',
  charm:'<path d="M8 3 Q12 8 16 3" fill="none"/><circle cx="12" cy="14" r="6"/><circle cx="12" cy="14" r="2.5"/>',
  food:'<path d="M4 12 H20 C20 17 16 20 12 20 C8 20 4 17 4 12 Z"/><path d="M8 9 Q9 6 8 4 M12 9 Q13 6 12 4 M16 9 Q17 6 16 4" fill="none"/>',
  potion:'<path d="M10 2 H14 V2.5 H13.5 V8 L19 18 C20 20 19 22 17 22 H7 C5 22 4 20 5 18 L10.5 8 V2.5 H10 Z"/><path d="M7 15 H17" fill="none"/>',
  ore:'<path d="M12 2 L20 8 L17 20 H7 L4 8 Z"/><path d="M4 8 H20 M12 2 L9 8 L12 20 L15 8 Z" fill="none"/>',
  material:'<path d="M12 2 L20 8 L17 20 H7 L4 8 Z"/><path d="M4 8 H20 M12 2 L9 8 L12 20 L15 8 Z" fill="none"/>',
  relic:'<path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 16.5 L5.5 21 L8 13.5 L2 9 L9.5 9 Z"/>',
  essence:'<path d="M12 2 C16 8 19 11 19 15 A7 7 0 0 1 5 15 C5 11 8 8 12 2 Z"/><circle cx="10" cy="14" r="2"/>',
  hide:'<path d="M5 5 Q12 2 19 5 L18 10 L21 14 L17 15 L16 20 Q12 18 8 20 L7 15 L3 14 L6 10 Z"/>',
  herb:'<path d="M11.4 10 H12.6 V22 H11.4 Z"/><path d="M12 14 Q6 13 5 7 Q11 7 12 12 Z"/><path d="M12 11 Q18 10 19 4 Q13 4 12 9 Z"/>',
  lance:'<path d="M12 1 L13.6 5 L12 6.2 L10.4 5 Z"/><path d="M11.3 6 H12.7 V22.5 H11.3 Z"/><path d="M7 12 L12 9 L17 12 L16 17 L12 19 L8 17 Z"/>',
  spellblade:'<path d="M12 2 L14 5 L14 15 L10 15 L10 5 Z"/><path d="M6 15 H18 V16.6 H6 Z"/><path d="M11 16.6 H13 V20 H11 Z"/><circle cx="12" cy="21" r="1.4"/><path d="M18.5 2 L19.5 4.5 L22 5.5 L19.5 6.5 L18.5 9 L17.5 6.5 L15 5.5 L17.5 4.5 Z"/>',
  warstaff:'<circle cx="12" cy="6" r="3.2"/><path d="M11.1 9 H12.9 V22.5 H11.1 Z"/><path d="M11 0.8 H13 V3 H11 Z"/><path d="M8 19.5 H16 V21 H8 Z"/>',
  claws:'<path d="M6 21 V12 Q6 8 12 8 Q18 8 18 12 V21 Z"/><path d="M7.4 8.6 L6.2 1.5 L9 8 Z M11.2 8 L12 0.5 L12.8 8 Z M15 8 L17.8 1.5 L16.6 8.6 Z"/>',
  bulwark:'<path d="M5 4 H19 V12 C19 17 15 20 12 22 C9 20 5 17 5 12 Z"/><path d="M5 9 H19 M9 4 V14 M15 4 V14" fill="none"/>',
  elixir:'<path d="M10 2 H14 V7 C18 9 19 12 19 15 C19 19 16 22 12 22 C8 22 5 19 5 15 C5 12 6 9 10 7 Z"/><path d="M8 15 Q12 13 16 15" fill="none"/>',
  fists:'<path d="M6 10 V6 Q6 4 8 4 Q10 4 10 6 V9 M10 8 V5 Q10 3 12 3 Q14 3 14 5 V9 M14 8 V6 Q14 4 16 4 Q18 4 18 6 V14 Q18 21 12 21 Q6 21 6 14 Z"/>'
};
const SLOT_GLYPH={main:"fists",off:"shield",head:"helm",body:"chest",hands:"gloves",feet:"boots",charm:"charm"};
const MAT={metal:["#f1f4f5","#9aa6ab","#4a5458"],wood:["#e0b07a","#93653a","#4a2f18"],stone:["#d4cec1","#857f72","#454139"],hide:["#e2b88b","#9c6e43","#55391f"],
  glass:["#e8f8fb","#8fc6d4","#336170"],food:["#f8d28c","#cc8a44","#6a3f1c"],herbal:["#bde4a2","#62a24d","#2a5124"]};
let gid=0;
function matOf(it){
  const k=grp(it)==="material"?kindOf(it):it.form,tr=topTraits(it.traits).map(x=>x[0]);
  if(k==="essence"||k==="relic")return null;
  if(k==="potion"||k==="elixir")return"glass";
  if(k==="food")return"food";if(k==="herb")return"herbal";if(k==="hide")return"hide";if(k==="ore")return tr.some(t=>TRAITS[t].f==="metal")?"metal":"stone";
  for(const t of tr){const f=TRAITS[t].f;if(f==="metal")return"metal";if(f==="wood")return t==="Fur"||t==="Insulated"?"hide":"wood";if(f==="stone")return"stone"}
  return{blade:"metal",spear:"wood",staff:"wood",shield:"wood",helm:"metal",chest:"hide",gloves:"hide",boots:"hide",charm:"metal",lance:"metal",spellblade:"metal",warstaff:"wood",claws:"metal",bulwark:"metal"}[k]||"stone";
}
// layered item art: base form + material gradient, then trait overlays (glow, frost, embers, drips, runes...)
function art(it){
  const id="a"+(gid++),tr=topTraits(it.traits),k=grp(it)==="material"?kindOf(it):it.form,top=tr[0]?tr[0][0]:null;
  const m=matOf(it);let pal=m?MAT[m]:null;
  if(!pal){const c=top?tColor(top):"#9c998c";pal=[shade(c,.6),c,shade(c,-.55)]}
  const has=f=>tr.filter(([t,v])=>TRAITS[t].f===f&&v>=1.5).length>0;
  const fire=has("fire"),ice=has("ice"),holy=has("holy"),shadow=has("shadow"),poison=has("poison"),arc=has("arcane"),swift=has("swift"),heal=has("heal")&&k!=="food",bad=tr.some(([t])=>TRAITS[t].f==="bad");
  const sharp=(it.traits.Sharp||0)+(it.traits.Tempered||0);
  let defs=`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset=".5" stop-color="${pal[1]}"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient>`,back="",front="";
  if(fire){defs+=`<radialGradient id="${id}f"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".6"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`;back+=`<circle cx="32" cy="34" r="30" fill="url(#${id}f)"/>`}
  if(shadow){defs+=`<radialGradient id="${id}s"><stop offset=".3" stop-color="#4a2c72" stop-opacity=".75"/><stop offset="1" stop-color="#4a2c72" stop-opacity="0"/></radialGradient>`;back+=`<circle cx="32" cy="34" r="31" fill="url(#${id}s)"/>`}
  if(heal)back+=`<circle cx="32" cy="34" r="26" fill="#e893ab" opacity=".14"/>`;
  if(ice)back+=`<circle cx="32" cy="34" r="27" fill="#bfeaff" opacity=".1"/>`;
  if(arc)back+=`<circle cx="32" cy="32" r="28" fill="none" stroke="${FAM.arcane}" stroke-width="1.3" stroke-dasharray="1.5 3 6 3" opacity=".85"/>`;
  if(holy)back+=`<ellipse cx="32" cy="8" rx="13" ry="3.6" fill="none" stroke="${FAM.holy}" stroke-width="2" opacity=".95"/>`;
  if(swift)front+=`<path d="M2 26 H12 M0 33 H10 M3 40 H11" stroke="${FAM.swift}" stroke-width="2" stroke-linecap="round" opacity=".9"/>`;
  if(ice)front+=`<g stroke="#e6f9ff" stroke-width="1.4" stroke-linecap="round"><path d="M51 9 v9 M46.5 13.5 h9 M47.8 10.3 l6.4 6.4 M54.2 10.3 l-6.4 6.4"/><path d="M11 50 v6 M8 53 h6"/></g>`;
  if(fire)front+=`<g fill="#ffd27a" class="emb"><circle cx="22" cy="13" r="1.7"/><circle cx="41" cy="9" r="1.3"/><circle cx="47" cy="17" r="1.5"/></g>`;
  if(poison)front+=`<g fill="${FAM.poison}"><path d="M24 55 q2.4 4 0 6.5 q-2.4 -2.5 0 -6.5Z"/><path d="M39 57 q2.4 4 0 6.5 q-2.4 -2.5 0 -6.5Z"/></g>`;
  if(sharp>=3&&grp(it)==="weapon")front+=`<path d="M49 4 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5Z" fill="#fff" opacity=".95"/>`;
  if(bad)front+=`<path d="M25 21 l5 6 -3 5 6 7 -2 5" stroke="#e2593f" stroke-width="1.7" fill="none"/>`;
  if(it.legendary)back+=`<circle cx="32" cy="32" r="30" fill="none" stroke="#f2a54a" stroke-width="1.2" opacity=".7"/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs>${defs}</defs>${back}<g transform="translate(6 6) scale(2.1667)" fill="url(#${id})" stroke="${shade(pal[2],-.55)}" stroke-width=".8" stroke-linejoin="round" stroke-linecap="round">${G[k]||G.material}</g>${front}</svg>`;
}
function glyph(item,kind){
  if(item)return art(item);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#4d4137" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true">${G[kind]}</svg>`;
}

// ================= ART: CREATURES =================
const PORTRAITS={
  boar:c=>`<path d="M104 64 q9 -2 6 9" stroke="${c.o}" stroke-width="2.5" fill="none"/><g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M40 54 L46 34 L52 50 L58 28 L64 48 L70 30 L76 48 L82 34 L88 54 Z" fill="${c.d}"/>
    <ellipse cx="68" cy="72" rx="38" ry="25" fill="${c.m}"/>
    <rect x="44" y="86" width="10" height="20" rx="4" fill="${c.d}"/><rect x="62" y="90" width="10" height="18" rx="4" fill="${c.d}"/><rect x="84" y="86" width="10" height="20" rx="4" fill="${c.d}"/>
    <path d="M40 56 Q18 58 12 74 Q12 88 26 90 Q42 90 46 74 Z" fill="${c.m}"/><ellipse cx="13" cy="79" rx="6" ry="7" fill="${c.d}"/></g>
    <path d="M58 64 q12 -6 26 0" stroke="${c.l}" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M22 88 Q15 100 28 102" stroke="#f0e6d2" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="31" cy="70" r="3.4" fill="${c.e}"/>`,
  sprite:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"><path d="M46 64 Q42 96 50 106 H72 Q80 96 74 64 Z" fill="#ebdfc4"/>
    <path d="M12 66 Q20 12 60 10 Q100 12 108 66 Q60 78 12 66 Z" fill="${c.m}"/></g>
    <g fill="${c.l}"><circle cx="38" cy="38" r="6.5"/><circle cx="64" cy="26" r="5"/><circle cx="84" cy="46" r="7.5"/><circle cx="56" cy="52" r="4"/></g>
    <ellipse cx="54" cy="83" rx="3.6" ry="5" fill="#2a1f14"/><ellipse cx="68" cy="83" rx="3.6" ry="5" fill="#2a1f14"/><path d="M56 95 q5 4 10 0" stroke="#2a1f14" stroke-width="2" fill="none"/>
    <g fill="${c.g}"><circle class="flt" cx="16" cy="88" r="2.6"/><circle class="flt" cx="104" cy="84" r="2.2"/><circle class="flt" cx="96" cy="106" r="1.8"/></g>`,
  bandit:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"><path d="M60 10 Q96 20 98 62 L106 112 H14 L22 62 Q24 20 60 10 Z" fill="${c.d}"/>
    <path d="M60 24 Q84 32 84 58 Q72 74 60 74 Q48 74 36 58 Q36 32 60 24 Z" fill="#0b0907"/>
    <path d="M34 66 Q60 82 86 66 L88 78 Q60 94 32 78 Z" fill="${c.m}"/>
    <path d="M88 94 L110 70 L113 73 L91 97 Z" fill="#d9e0e3"/><path d="M82 92 L94 104" stroke-width="5" stroke="#6b4a2b"/></g>
    <ellipse cx="51" cy="52" rx="4.2" ry="2.6" fill="${c.e}"/><ellipse cx="69" cy="52" rx="4.2" ry="2.6" fill="${c.e}"/>`,
  wolf:c=>wolfArt(c),
  rimeclaw:c=>`<g fill="#e3f7ff" stroke="${c.o}" stroke-width="2"><path d="M30 50 L18 18 L42 42Z"/><path d="M44 34 L44 2 L56 34Z"/><path d="M62 30 L74 2 L74 36Z"/><path d="M84 46 L104 20 L96 54Z"/></g>${wolfArt(c,true)}`,
  wraith:c=>`<path d="M60 8 Q100 12 96 60 L102 110 L88 98 L76 112 L62 98 L50 112 L40 98 L20 110 L24 60 Q20 12 60 8 Z" fill="${c.m}" opacity=".9" stroke="${c.o}" stroke-width="2.5"/>
    <path d="M36 28 Q60 16 84 28" stroke="${c.l}" stroke-width="2" fill="none" opacity=".6"/>
    <ellipse cx="47" cy="50" rx="8.5" ry="11" fill="#0b0907"/><ellipse cx="73" cy="50" rx="8.5" ry="11" fill="#0b0907"/>
    <circle cx="47" cy="52" r="3.2" fill="${c.e}"/><circle cx="73" cy="52" r="3.2" fill="${c.e}"/><ellipse cx="60" cy="78" rx="7" ry="11" fill="#0b0907"/>
    <path d="M10 72 q-6 -14 6 -26 M110 72 q6 -14 -6 -26" stroke="${c.l}" stroke-width="2" fill="none" opacity=".5"/>`,
  golem:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <rect x="8" y="44" width="24" height="46" rx="10" fill="${c.d}"/><rect x="88" y="44" width="24" height="46" rx="10" fill="${c.d}"/>
    <rect x="38" y="90" width="17" height="22" rx="5" fill="${c.d}"/><rect x="65" y="90" width="17" height="22" rx="5" fill="${c.d}"/>
    <rect x="26" y="40" width="68" height="56" rx="13" fill="${c.m}"/><rect x="40" y="8" width="40" height="34" rx="10" fill="${c.m}"/></g>
    <rect x="46" y="21" width="10" height="4.5" rx="2" fill="${c.e}"/><rect x="64" y="21" width="10" height="4.5" rx="2" fill="${c.e}"/>
    <path d="M51 60 l9 -7 9 7 -9 7 Z M60 67 v12" stroke="${c.e}" stroke-width="2.2" fill="none"/>
    <path d="M32 52 l8 6 -4 9 M86 72 l-7 4 2 9 M46 12 l5 6" stroke="${c.o}" stroke-width="1.6" fill="none"/>`,
  gnarlhorn:c=>`<g transform="translate(4 4) scale(.94)">${PORTRAITS.boar(c)}</g>
    <path d="M30 60 Q14 34 34 20" stroke="#ece0c6" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M22 54 L25 40 L31 48 L37 36 L42 50 Z" fill="#f0d77a" stroke="${c.o}" stroke-width="2"/>
    <path d="M52 52 q8 -6 16 0 q8 -6 16 0 q6 -4 12 0" stroke="#6f9f4f" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  imp:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M36 62 Q6 40 4 72 Q20 62 26 78 Q30 66 40 72 Z" fill="${c.d}"/><path d="M84 62 Q114 40 116 72 Q100 62 94 78 Q90 66 80 72 Z" fill="${c.d}"/>
    <path d="M78 92 Q104 98 100 114" fill="none"/><circle cx="60" cy="72" r="28" fill="${c.m}"/>
    <path d="M42 50 L35 28 L51 45 Z" fill="${c.d}"/><path d="M78 50 L85 28 L69 45 Z" fill="${c.d}"/></g>
    <path class="flick" d="M60 42 Q50 28 60 12 Q64 24 71 22 Q69 36 60 42Z" fill="${c.l}"/>
    <ellipse cx="50" cy="68" rx="5" ry="3.6" fill="${c.e}"/><ellipse cx="70" cy="68" rx="5" ry="3.6" fill="${c.e}"/>
    <path d="M45 82 Q60 95 75 82 L71 84 L67 80 L63 85 L59 80 L55 85 L51 80 Z" fill="#160d08"/>`,
  witch:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M30 112 L42 64 H78 L90 112 Z" fill="${c.d}"/><ellipse cx="60" cy="56" rx="16" ry="18" fill="#93b07c"/>
    <ellipse cx="60" cy="40" rx="37" ry="7" fill="${c.d}"/><path d="M37 40 L66 2 L62 22 L83 40 Z" fill="${c.d}"/>
    <path d="M22 96 Q22 117 46 117 H74 Q98 117 98 96 Z" fill="#2c2926"/></g>
    <path d="M60 57 l6 7 -6 0" fill="#6f8c5c"/><ellipse cx="53" cy="53" rx="3.2" ry="2.4" fill="${c.e}"/><ellipse cx="67" cy="53" rx="3.2" ry="2.4" fill="${c.e}"/>
    <ellipse cx="60" cy="96" rx="36" ry="5.5" fill="${c.l}"/>
    <g fill="${c.g}"><circle class="flt" cx="46" cy="90" r="4"/><circle class="flt" cx="62" cy="86" r="3"/><circle class="flt" cx="74" cy="91" r="2.6"/></g>`,
  phoenix:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M60 62 Q34 16 2 24 Q24 40 26 52 Q8 54 4 70 Q30 62 40 72 Q28 78 24 90 Q46 78 60 76 Z" fill="${c.m}"/>
    <path d="M60 62 Q86 16 118 24 Q96 40 94 52 Q112 54 116 70 Q90 62 80 72 Q92 78 96 90 Q74 78 60 76 Z" fill="${c.m}"/>
    <path class="flick" d="M50 80 Q46 106 60 118 Q74 106 70 80 Z" fill="${c.g}"/>
    <ellipse cx="60" cy="66" rx="11" ry="20" fill="${c.l}"/><circle cx="60" cy="42" r="9" fill="${c.l}"/></g>
    <path class="flick" d="M60 34 Q54 20 62 10 Q62 22 71 20 Q65 30 60 34Z" fill="${c.g}"/>
    <path d="M66 42 l8 3 -8 3 Z" fill="#f2c94c"/><circle cx="62" cy="40" r="2.2" fill="#1a0f08"/>
    <path d="M14 30 Q30 34 40 46 M106 30 Q90 34 80 46" stroke="${c.g}" stroke-width="2" fill="none" opacity=".7"/>`,
  mimic:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M18 46 L30 16 H90 L102 46 Z" fill="#8f6238"/><rect x="16" y="58" width="88" height="46" rx="6" fill="#8f6238"/>
    <path d="M18 46 H102 L104 60 H16 Z" fill="#2a120c"/><rect x="16" y="76" width="88" height="7" fill="#9aa3a7"/><rect x="54" y="72" width="12" height="14" rx="2" fill="#c9a24a"/></g>
    <path d="M20 47 l6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8" fill="#f2ece0"/>
    <path d="M20 60 l6 -7 6 7 6 -7 6 7 6 -7 6 7 6 -7 6 7 6 -7 6 7 6 -7 6 7 6 -7 6 7" fill="#f2ece0"/>
    <path d="M50 58 Q60 78 70 58 Z" fill="#d9536b"/><circle cx="44" cy="31" r="3.4" fill="${c.e}"/><circle cx="76" cy="31" r="3.4" fill="${c.e}"/>`
};
function wolfArt(c,big){return `<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
  <path d="M16 76 L32 44 L36 16 L52 38 L64 34 L72 14 L80 42 Q102 52 110 74 Q108 84 96 86 L78 88 Q66 106 40 104 Q22 98 16 76 Z" fill="${c.m}"/>
  <path d="M39 20 L48 40 L37 44 Z" fill="${c.d}"/><path d="M71 18 L77 42 L66 38 Z" fill="${c.d}"/><ellipse cx="108" cy="74" rx="5.5" ry="4.5" fill="#15110d"/></g>
  <path d="M97 86 l2.5 8 3 -8 M87 87 l2 7 3 -7" fill="#f2ece0"/><path d="M57 54 l15 4 -13 5 Z" fill="${c.e}"${big?' stroke="#fff" stroke-width=".8"':""}/>
  <path d="M28 88 q10 7 22 2 M26 72 q8 5 15 2" stroke="${c.l}" stroke-width="2" fill="none" opacity=".6"/>`}
function portrait(id,o){
  o=o||{};const el=o.el||ENEMIES[id].el,base=FAM[el],gidp="p"+(gid++);
  const eye=el==="ice"?"#d8f6ff":el==="shadow"?"#d6bcff":el==="holy"?"#fff2b8":"#ffcf5c";
  const c={o:"#0d0a08",d:shade(base,-.62),m:shade(base,-.32),l:shade(base,.38),g:base,e:eye};
  let over="";
  if(o.frozen)over+=`<g><rect x="4" y="4" width="112" height="112" rx="20" fill="#bfeaff" opacity=".22"/><g stroke="#effbff" stroke-width="2.2" stroke-linecap="round"><path d="M16 14 v14 M9 21 h14 M11 16 l10 10 M21 16 l-10 10"/><path d="M98 92 v12 M92 98 h12"/><path d="M100 18 v8 M96 22 h8"/></g></g>`;
  if(o.burn)over+=`<g fill="#ff8a3d" opacity=".9"><path class="flick" d="M14 116 q4 -18 10 -6 q3 -14 8 0 q3 -10 8 2 Z"/><path class="flick" d="M80 116 q4 -16 9 -4 q4 -14 9 0 q3 -10 8 4 Z"/></g>`;
  if(o.poison)over+=`<g fill="${FAM.poison}"><circle class="flt" cx="22" cy="40" r="3"/><circle class="flt" cx="100" cy="56" r="2.5"/><circle class="flt" cx="94" cy="30" r="2"/></g>`;
  const aura=o.elite?`<circle cx="60" cy="62" r="56" fill="none" stroke="${FAM[TRAITS[o.elite]?.f||el]}" stroke-width="2" stroke-dasharray="3 6" opacity=".9"/>`:"";
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="${gidp}"><stop offset="0" stop-color="${base}" stop-opacity=".35"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="60" cy="62" r="58" fill="url(#${gidp})"/>${aura}${PORTRAITS[id](c)}${over}</svg>`;
}

// ================= ART: MAP + ICONS =================
const NODE_G={
  fight:'<path d="M4 4 L14 14 M20 4 L10 14 M11 17 L7 13 M13 17 L17 13 M6 18 L8 16 M18 18 L16 16"/>',
  elite:'<path d="M7 10 A5 5 0 0 1 17 10 V13 L15 15 V18 H9 V15 L7 13 Z"/><path d="M7 9 L3 4 M17 9 L21 4"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="11" r="1"/>',
  boss:'<path d="M3 18 L5 7 L9 12 L12 5 L15 12 L19 7 L21 18 Z"/><path d="M3 21 H21"/>',
  chest:'<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 9 Q12 2 21 9 M3 13 H21"/><rect x="10.5" y="11.5" width="3" height="4"/>',
  shrine:'<path d="M4 21 V10 L12 4 L20 10 V21"/><path d="M9 21 V14 Q12 11 15 14 V21"/>',
  peddler:'<path d="M9 4 H15 L13 8 Q20 11 19 17 Q18 21 12 21 Q6 21 5 17 Q4 11 11 8 Z"/><path d="M14 12.5 Q12 11.5 10.5 12.5 Q10 14 12 14.5 Q14 15 13.5 16.5 Q12 17.5 10 16.5"/>',
  camp:'<path d="M12 3 C15 8 18 10 18 14 A6 6 0 0 1 6 14 C6 11 8 9 9 7 C10 10 11 11 12 11 C12 8 11 6 12 3 Z"/><path d="M4 21 L20 18 M4 18 L20 21"/>',
  hidden:'<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  mystery:'<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5 A2.6 2.6 0 1 1 13 11.9 C12.3 12.3 12 12.8 12 13.6 V14.4"/><path d="M12 17.6 V17.7"/>',
  // tab + action icons
  battle:'<path d="M4 4 L14 14 M20 4 L10 14 M11 17 L7 13 M13 17 L17 13 M6 18 L8 16 M18 18 L16 16"/>',
  gear:'<path d="M5 13 C5 6 8 3 12 3 C16 3 19 6 19 13 V18 H15 V13 H9 V18 H5 Z"/><path d="M12 3 V9"/>',
  forge:'<path d="M3 8 H17 Q21 8 21 11 H15 Q14 14 11 14 V17 H15 V20 H6 V17 H9 V14 Q5 14 4 11 Z"/>',
  recipes:'<path d="M4 5 Q8 3 12 6 Q16 3 20 5 V19 Q16 17 12 20 Q8 17 4 19 Z"/><path d="M12 6 V20"/>',
  codex:'<path d="M2 12 Q12 3 22 12 Q12 21 2 12 Z"/><circle cx="12" cy="12" r="3.5"/>',
  parry:'<path d="M5 19 L19 5 M5 5 L19 19 M3 21 L6 18 M21 21 L18 18"/>',
  guard:'<path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5 Z"/>',
  study:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 L21 21"/>',
  flee:'<path d="M4 12 H16 M11 7 L16 12 L11 17"/><path d="M20 5 V19"/>',
  attack:'<path d="M5 19 L17 7 M14 4 H20 V10 M4 16 L8 20"/>'
};
const icon=t=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${NODE_G[t]}</svg>`;
function terrain(zone,H,seed){
  const R=rng(seed),W=400;let s="";
  if(zone==="woods"){for(let k=0;k<26;k++){const x=R()*W,y=R()*H,sz=8+R()*10;s+=`<path d="M${x} ${y-sz*1.8} L${x-sz} ${y} H${x+sz} Z" fill="#1f3322"/><path d="M${x} ${y-sz*1.2} L${x-sz*.8} ${y+sz*.5} H${x+sz*.8} Z" fill="#26402a"/>`}}
  if(zone==="pass"){for(let k=0;k<12;k++){const x=R()*W,y=R()*H+20,w=24+R()*26;s+=`<path d="M${x-w} ${y} L${x} ${y-w*1.1} L${x+w} ${y} Z" fill="#26313a"/><path d="M${x-w*.3} ${y-w*.77} L${x} ${y-w*1.1} L${x+w*.3} ${y-w*.77} Z" fill="#cfe3ec" opacity=".55"/>`}
    for(let k=0;k<40;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.8+R()*1.4}" fill="#dbeef6" opacity=".35"/>`}
  if(zone==="hollow"){for(let k=0;k<16;k++){const x=R()*W,y=R()*H;s+=`<path d="M${x} ${y} l${8+R()*8} ${5+R()*6} l${-4+R()*4} ${6+R()*8} l${10+R()*8} ${4+R()*6}" stroke="#ff6b2c" stroke-width="1.6" fill="none" opacity=".35"/>`}
    for(let k=0;k<26;k++)s+=`<circle cx="${R()*W}" cy="${R()*H}" r="${.8+R()*1.6}" fill="#ffb15c" opacity=".35"/>`}
  return `<svg class="terrain" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
function mapHtml(){
  const m=curMap(),R=MAP_ROWS,H=R*62+8,open=busy()?[]:openNodes(m),y=r=>r*62+35;
  const isOpen=(r,i)=>open.some(([a,b])=>a===r&&b===i),walked=new Set(),adj=new Set(openNodes(m).map(x=>x.join()));
  for(let k=1;k<m.path.length;k++)walked.add(m.path[k-1].join()+">"+m.path[k].join());
  let lines="";
  m.rows.forEach((row,r)=>row.forEach((nd,i)=>nd.next.forEach(j=>{const nx=m.rows[r+1][j],k=`${r},${i}>${r+1},${j}`;
    const cls=walked.has(k)?"walked":(m.pos&&m.pos.r===r&&m.pos.i===i&&!m.cleared)?"open":"";
    lines+=`<line x1="${nd.x}" y1="${y(r)}" x2="${nx.x}" y2="${y(r+1)}" class="${cls}"/>`})));
  const nodes=m.rows.map((row,r)=>row.map((nd,i)=>{const here=m.pos&&m.pos.r===r&&m.pos.i===i,op=isOpen(r,i);
    const seen=m.cleared||nd.done||here||adj.has(r+","+i)||nd.t==="boss",t=seen?nd.t:"hidden";
    return `<button class="node ${t==="boss"?"boss":""} ${t==="hidden"?"fog":""} ${here?"here":nd.done?"done":""} ${op?"open":""}" style="left:${nd.x}%;top:${y(r)}px" data-node="${r},${i}" ${op?"":"disabled"} aria-label="${seen?NODE_INFO[nd.t]:"Unexplored"}${t==="boss"?`: ${shortName(ZONES[zoneIdx(S.zone)][2])}`:""}${here?", you are here":op?", reachable":""}">${icon(t)}</button>`}).join("")).join("");
  const legend=Object.entries(NODE_INFO).map(([t,l])=>`<span>${icon(t)}${l}</span>`).join("")+`<span>${icon("hidden")}Unexplored</span>`;
  return `<div class="mapwrap"><div class="map" style="height:${H}px">${terrain(S.zone,H,m.seed||7)}<svg class="edges" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div></div><div class="legend">${legend}</div>`;
}

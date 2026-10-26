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
  feather:'<path d="M19 2 C9 3 4 9 4 17 L3 22 L5 22 L7 19 C15 19 20 13 19 2 Z"/><path d="M5 20 L14 9" fill="none"/>',
  shard:'<path d="M9 2 L17 6 L19 15 L12 22 L5 16 L6 7 Z"/><path d="M12 7 V16 M9 11 H15" fill="none"/>',
  crystal:'<path d="M12 1 L18 8 L15 22 H9 L6 8 Z"/><path d="M6 8 H18 M12 1 V22" fill="none"/>',
  starheart:'<path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z"/><circle cx="12" cy="12" r="2.2"/>',
  ingot:'<path d="M5 9 H19 L22 18 H2 Z"/><path d="M5 9 L7 13 H17 L19 9" fill="none"/>',
  timber:'<path d="M3 8 H17 A4 5 0 0 1 17 18 H3 A4 5 0 0 1 3 8 Z"/><ellipse cx="17" cy="13" rx="2.6" ry="3.4" fill="none"/>',
  bough:'<path d="M5 21 L16 4 L18 5 L8 22 Z"/><path d="M12 11 Q17 10 20 12 Q16 14 12 12 Z M9 15 Q4 13 3 9 Q8 10 10 13 Z"/>',
  cloth:'<path d="M4 6 Q4 3 7 3 H17 V18 H7 Q4 18 4 21 Z"/><path d="M4 6 V21 M17 18 Q20 18 20 15 V6 Q20 3 17 3" fill="none"/>',
  block:'<path d="M3 8 L12 4 L21 8 V17 L12 21 L3 17 Z"/><path d="M3 8 L12 12 L21 8 M12 12 V21" fill="none"/>',
  leather:'<path d="M4 6 Q12 3 20 6 V18 Q12 21 4 18 Z"/><path d="M7 9 Q12 8 17 9 M7 15 Q12 16 17 15" fill="none"/>',
  dust:'<path d="M8 8 H16 L18 19 Q12 22 6 19 Z"/><path d="M8 8 Q12 5 16 8 M10 4 L11 6 M14 3 L13.5 5.5" fill="none"/>',
  fists:'<path d="M6 10 V6 Q6 4 8 4 Q10 4 10 6 V9 M10 8 V5 Q10 3 12 3 Q14 3 14 5 V9 M14 8 V6 Q14 4 16 4 Q18 4 18 6 V14 Q18 21 12 21 Q6 21 6 14 Z"/>'
};
const ART_ID={storm_feather:"feather",rune_shard:"shard",void_crystal:"crystal",star_heart:"starheart",scrap_iron:"ore",slag_iron:"ore",sentinel_plate:"shard",sprite_dust:"dust",oak_bough:"bough",witchwood:"bough",
  boar_leather:"leather",frost_leather:"leather",shroudcloth:"cloth",stormsilk:"cloth",iron_ingot:"ingot",slagsteel:"ingot",runesteel:"ingot",oak_timber:"timber",hexwood:"timber",golem_stone:"block",cinderstone:"block",glowglass:"crystal",rune_crystal:"crystal",void_shard:"shard"};
const artKey=it=>ART_ID[plainId(it.id)]||(grp(it)==="material"?kindOf(it):it.form);
const SLOT_GLYPH={main:"fists",off:"shield",head:"helm",body:"chest",hands:"gloves",feet:"boots",charm:"charm"};
const MAT={metal:["#f1f4f5","#9aa6ab","#4a5458"],wood:["#e0b07a","#93653a","#4a2f18"],stone:["#d4cec1","#857f72","#454139"],hide:["#e2b88b","#9c6e43","#55391f"],
  glass:["#e8f8fb","#8fc6d4","#336170"],food:["#f8d28c","#cc8a44","#6a3f1c"],herbal:["#bde4a2","#62a24d","#2a5124"]};
let gid=0;
function matOf(it){
  const k=artKey(it),tr=topTraits(it.traits).map(x=>x[0]);
  if(k==="essence"||k==="relic"||k==="starheart"||k==="crystal"||k==="shard"||k==="feather"||k==="cloth"||k==="dust")return null;
  if(k==="ingot")return"metal";if(k==="timber"||k==="bough")return"wood";if(k==="block")return"stone";if(k==="leather")return"hide";
  if(k==="potion"||k==="elixir")return"glass";
  if(k==="food")return"food";if(k==="herb")return"herbal";if(k==="hide")return"hide";if(k==="ore")return tr.some(t=>TRAITS[t].f==="metal")?"metal":"stone";
  for(const t of tr){const f=TRAITS[t].f;if(f==="metal")return"metal";if(f==="wood")return t==="Fur"||t==="Insulated"?"hide":"wood";if(f==="stone")return"stone"}
  return{blade:"metal",spear:"wood",staff:"wood",shield:"wood",helm:"metal",chest:"hide",gloves:"hide",boots:"hide",charm:"metal",lance:"metal",spellblade:"metal",warstaff:"wood",claws:"metal",bulwark:"metal"}[k]||"stone";
}
// layered item art: base form + material gradient, then trait overlays (glow, frost, embers, drips, runes...)
function art(it){
  const id="a"+(gid++),tr=topTraits(it.traits),k=artKey(it),top=tr[0]?tr[0][0]:null;
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
  const gr=itemGrade(it);if(gr){const gc=GRADES[gr-1][1],pips=[0,1,2,3,4]; // grade: five pips, the first `gr` filled in the grade colour (Plain is 3); Pure's pips glow (CSS, off under reduced motion)
    if(gr===5)front+=`<g fill="${gc}" class="pip-glow">${pips.map(i=>`<circle cx="${17+i*7.5}" cy="59" r="4.6"/>`).join("")}</g>`;
    front+=pips.map(i=>i<gr?`<circle cx="${17+i*7.5}" cy="59" r="3" fill="${gc}" stroke="#14100c" stroke-width=".8"/>`:`<circle cx="${17+i*7.5}" cy="59" r="3" fill="#0d0a08" stroke="#4a3f35" stroke-width=".8"/>`).join("")}
  if(it.legendary)back+=`<circle cx="32" cy="32" r="30" fill="none" stroke="#f2a54a" stroke-width="1.2" opacity=".7"/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><defs>${defs}</defs>${back}<g transform="translate(6 6) scale(2.1667)" fill="url(#${id})" stroke="${shade(pal[2],-.55)}" stroke-width=".8" stroke-linejoin="round" stroke-linecap="round">${G[k]||G.material}</g>${front}</svg>`;
}
function glyph(item,kind){
  if(item)return art(item);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#4d4137" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true">${G[kind]}</svg>`;
}

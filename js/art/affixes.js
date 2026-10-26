// ================= ART: CREATURES (affix marks) =================
// Where an affix is drawn is fixed by what it does, so two affixes on one rare never share a spot:
// elemental = a tattoo on the body (one emblem per elemental affix, side by side on the flank or chest, in the element's light shade);
// defence = on the body (iron plates on the shoulders, ward hexagon round the whole body, regen cross on the upper body, thorn spikes at the sides);
// aggression = the head (frenzy red eyes and steam, vamp fangs and drip); on-death = cracks (boom orange cracks low, under the tattoo's reach; split a pale seam down the middle);
// movement = behind or under (swift speed lines on the left, swiftfoot dust at the feet, elusive afterimage).
const flame=(x,y,s)=>`M${x} ${y-s} C${x+s*.55} ${y-s*.25} ${x+s*.5} ${y+s*.35} ${x} ${y+s*.5} C${x-s*.5} ${y+s*.35} ${x-s*.55} ${y-s*.25} ${x} ${y-s} Z`; // a flame tongue, tip up
// an emblem line drawn with a dark under-stroke, so it reads on any body
const ink=(d,col,w)=>`<path d="${d}" fill="none" stroke="#14100c" stroke-width="${w+2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const TATS={ // each emblem sits in a 30-unit box centred on (0,0); a tattoo scales it onto the body
  fire:()=>`<path d="${flame(0,0,15)}" fill="${ELPAL.fire[0]}" stroke="#14100c" stroke-width="1.2"/><path d="${flame(0,3,8)}" fill="#ffe08a" stroke="#14100c" stroke-width=".8"/>`,
  ice:()=>{let d="";for(let k=0;k<6;k++){const a=k*Math.PI/3,u=Math.cos(a),v=Math.sin(a);d+=`M0 0 L${P2(u*14,v*14)} `;for(const t of [.55,.8])for(const g of [-1,1]){const b=a+g*Math.PI/4,x=u*14*t,y=v*14*t;d+=`M${P2(x,y)} L${P2(x+Math.cos(b)*4.5,y+Math.sin(b)*4.5)} `}}return ink(d,ELPAL.ice[0],2.4)},
  poison:()=>`<path d="M0 -15 C4 -8 9 -2 9 4 A9 9 0 0 1 -9 4 C-9 -2 -4 -8 0 -15 Z" fill="${ELPAL.poison[0]}" stroke="#14100c" stroke-width="1.2" stroke-linejoin="round"/><circle cx="-3.4" cy="3.6" r="2.4" fill="#14100c"/><circle cx="3.4" cy="3.6" r="2.4" fill="#14100c"/><path d="M-3 8.2 H3" stroke="#14100c" stroke-width="1.4" stroke-linecap="round"/>`,
  holy:()=>{const k=ELPAL.holy[0];let d="";for(let i=0;i<8;i++){const a=i*Math.PI/4;d+=`M${P2(Math.cos(a)*9,Math.sin(a)*9)} L${P2(Math.cos(a)*14.5,Math.sin(a)*14.5)} `}return ink(d,k,2.6)+`<circle r="6.4" fill="${k}" stroke="#14100c" stroke-width="1.2"/>`},
  shadow:()=>`<path d="M-14 0 Q0 -11.5 14 0 Q0 11.5 -14 0 Z" fill="#c4a8ff" stroke="#14100c" stroke-width="1.2" stroke-linejoin="round"/><circle r="5" fill="#14100c"/><circle cx="1.8" cy="-1.8" r="1.4" fill="#fff"/>`,
  arcane:()=>{const k=ELPAL.arcane[0];return `<circle r="13" fill="none" stroke="#14100c" stroke-width="3.6"/><circle r="13" fill="none" stroke="${k}" stroke-width="2.2"/><circle r="9.5" fill="none" stroke="${k}" stroke-width="1"/>`+ink("M-5 -5 L5 5 M5 -5 L-5 5 M0 -6.5 V6.5",k,1.6)}
};
// one composed creature: parts behind, the silhouette, its pattern (masked to the silhouette), details, the tattoo, parts in front; affixes the body cannot wear are returned for frame marks
// tattoo(ids,t): the elemental emblems side by side on the tattoo anchor t=[x,y,r] (r = the emblem's radius on a single-affix creature; 2 or 3 shrink to fit). A dark disc fades the pattern under them and the emblems glow slowly.
function tattoo(ids,t){
  const n=ids.length;if(!n)return "";
  const[x,y,r]=t,s=r/12.5*(n===1?1:n===2?.8:.62),sp=30*s+1.5,half=(n-1)*sp/2,ex=half+15*s+2.5;
  return `<ellipse cx="${x}" cy="${y}" rx="${P2(ex)}" ry="${P2(15*s+2.5)}" fill="#0d0a08" opacity=".42"/>`+ids.map((id,i)=>`<g transform="translate(${P2(x-half+i*sp,y)}) scale(${P2(s)})"><g class="amb-glow">${TATS[id]()}</g></g>`).join("");
}
const AFX_ART={
  fire:{tat:1},ice:{tat:1},poison:{tat:1},holy:{tat:1},shadow:{tat:1},arcane:{tat:1},
  iron:{p:"armor"},
  swift:{f:c=>`<path d="M2 48 H16 M4 55 H22 M2 62 H14" stroke="${FAM.swift}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`},
  vamp:{f:c=>`<path d="M44 44 l4 9 l4 -9 Z M54 44 l4 9 l4 -9 Z" fill="#f2ece0" stroke="#0d0a08" stroke-width="1.2" stroke-linejoin="round"/><path d="M55 53 q-1 4 0 7" stroke="#c43c4f" stroke-width="2" fill="none" stroke-linecap="round"/><circle class="flt" cx="55" cy="63" r="2.2" fill="#c43c4f"/>`},
  thorn:{f:c=>`<path d="M2 78 L14 82 L4 90 M118 78 L106 82 L116 90" fill="#b8a45a" stroke="#0d0a08" stroke-width="1.8" stroke-linejoin="round"/>`},
  regen:{p:"regen",f:c=>PART.regen.f(c,{g:[34,60]})},
  frenzy:{f:c=>`<g><circle cx="50" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/><circle cx="68" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/></g><g fill="#e9e4dc" opacity=".7">${[[46,14,4],[58,8,5],[72,14,4]].map(([x,y,r],i)=>`<circle ${an("amb-rise",2.4+i*.4,i/3)} cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`},
  ward:{f:c=>`<path d="M100 62 L80 96.6 L40 96.6 L20 62 L40 27.4 L80 27.4 Z" fill="none" stroke="#6fb5c4" stroke-width="2.6" stroke-dasharray="7 4" stroke-linejoin="round" opacity=".85"/>`},
  elusive:{ghost:1},
  split:{f:c=>`<path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#0d0a08" stroke-width="3.2" opacity=".75"/><path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#c39cf7" stroke-width="1.4"/>`},
  boom:{f:c=>{const b="M48 86 L40 78 L42 70 M48 86 L58 78 L56 70 M48 86 L46 97 L36 101 M48 86 L60 93 L70 91 M48 86 L38 89 L27 84";return `<g transform="translate(60 108) scale(.78) translate(-48 -86)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${b}" stroke="#ff8a2a" stroke-width="7" opacity=".4"/><path class="flick" d="${b}" stroke="#14100c" stroke-width="4" opacity=".75"/><path class="flick" d="${b}" stroke="#ffc65a" stroke-width="2.2"/></g>`}},
  swiftfoot:{f:c=>`<g fill="#8ff0d0" opacity=".9"><circle cx="26" cy="109" r="6"/><circle cx="19" cy="113" r="4.2"/><circle cx="33" cy="113" r="3.6"/><circle cx="90" cy="109" r="6"/><circle cx="98" cy="113" r="4.2"/><circle cx="85" cy="113" r="3.6"/></g><path d="M12 102 h-8 M10 110 h-7 M108 102 h8 M110 110 h7" stroke="#8ff0d0" stroke-width="2.2" stroke-linecap="round"/>`}
};

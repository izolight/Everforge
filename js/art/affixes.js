// ================= ART: CREATURES (affix marks) =================
// Where an affix is drawn is fixed by what it does, so two affixes on one rare never share a spot:
// elemental = particles around the creature in the element's colour (fire top-left edge, ice right edge, holy top-left corner,
// arcane top-right corner, poison bottom-left, shadow bottom-right); defence = on the body (iron plates, ward hexagon, regen cross
// on the chest, thorn spikes at the sides); aggression = the head (frenzy red eyes and steam, vamp fangs and drip); on-death =
// cracks (boom orange cracks low on the body, split a pale seam down the middle); movement = behind or under (swift speed lines
// on the left, swiftfoot dust at the feet, elusive afterimage).
const snow=(x,y)=>`<path d="M${x} ${y-5} v10 M${x-5} ${y} h10 M${x-3.5} ${y-3.5} l7 7 M${x+3.5} ${y-3.5} l-7 7"/>`;
const flame=(x,y,s)=>`M${x} ${y-s} C${x+s*.55} ${y-s*.25} ${x+s*.5} ${y+s*.35} ${x} ${y+s*.5} C${x-s*.5} ${y+s*.35} ${x-s*.55} ${y-s*.25} ${x} ${y-s} Z`; // a flame tongue, tip up
const AFX_ART={
  fire:{f:c=>`<g fill="#ff8a2a" stroke="#14100c" stroke-width=".8">${[[9,40,10],[17,30,8],[4,28,7]].map(([x,y,s],i)=>`<path class="flick" style="animation-delay:-${(i*.3).toFixed(1)}s" d="${flame(x,y,s)}"/>`).join("")}<circle class="flt" cx="16" cy="42" r="3.4" fill="#ffd04a"/></g>`},
  ice:{f:c=>`<g stroke="#effbff" stroke-width="2" stroke-linecap="round">${snow(106,26)}${snow(111,44)}${snow(102,56)}</g>`},
  poison:{f:c=>`<g fill="#b8f04a" stroke="#14100c" stroke-width=".8">${[[12,104,6],[24,114,4],[7,114,3.4],[24,98,2.8]].map(([x,y,r],i)=>`<g class="flt" style="animation-delay:-${(i*.6).toFixed(1)}s"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x-r*.35}" cy="${y-r*.35}" r="${r*.28}" fill="#f4ffd0" stroke="none"/></g>`).join("")}</g>`},
  holy:{f:c=>`<g fill="#fff0a0" stroke="#14100c" stroke-width=".8">${[[12,11,7.5],[26,6,4.8],[28,19,3.6]].map(([x,y,r],i)=>`<path class="flt" style="animation-delay:-${(i*.8).toFixed(1)}s" d="${star4(x,y,r)}"/>`).join("")}</g>`},
  shadow:{f:c=>{const w=["M90 118 C82 110 96 106 92 96","M104 118 C98 110 112 106 110 96","M115 118 C108 112 118 108 114 102"];return `<g fill="none" stroke-linecap="round" class="flt">${w.map(d=>`<path d="${d}" stroke="#14100c" stroke-width="4.4" opacity=".8"/>`).join("")}${w.map(d=>`<path d="${d}" stroke="#c4a8ff" stroke-width="2.6"/>`).join("")}</g>`}},
  iron:{p:"armor"},
  swift:{f:c=>`<path d="M2 48 H16 M4 55 H22 M2 62 H14" stroke="${FAM.swift}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`},
  arcane:{f:c=>`<g fill="#d8b8ff" stroke="#14100c" stroke-width="1">${[[104,10,6],[115,20,3.8],[95,17,3]].map(([x,y,s],i)=>`<path class="flt" style="animation-delay:-${(i*.7).toFixed(1)}s" d="M${x} ${y-s} L${x+s*.6} ${y} L${x} ${y+s} L${x-s*.6} ${y} Z"/>`).join("")}</g>`},
  vamp:{f:c=>`<path d="M44 44 l4 9 l4 -9 Z M54 44 l4 9 l4 -9 Z" fill="#f2ece0" stroke="#0d0a08" stroke-width="1.2" stroke-linejoin="round"/><path d="M55 53 q-1 4 0 7" stroke="#c43c4f" stroke-width="2" fill="none" stroke-linecap="round"/><circle class="flt" cx="55" cy="63" r="2.2" fill="#c43c4f"/>`},
  thorn:{f:c=>`<path d="M2 78 L14 82 L4 90 M118 78 L106 82 L116 90" fill="#b8a45a" stroke="#0d0a08" stroke-width="1.8" stroke-linejoin="round"/>`},
  regen:{f:c=>`<path class="amb-tw" d="M31 50 h6 v6 h6 v8 h-6 v6 h-6 v-6 h-6 v-8 h6 Z" fill="#b6ff9a" stroke="#0d0a08" stroke-width="1.6"/>`},
  frenzy:{f:c=>`<g><circle cx="50" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/><circle cx="68" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/></g><g fill="#e9e4dc" opacity=".7">${[[46,14,4],[58,8,5],[72,14,4]].map(([x,y,r],i)=>`<circle ${an("amb-rise",2.4+i*.4,i/3)} cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`},
  ward:{f:c=>`<path d="M100 62 L80 96.6 L40 96.6 L20 62 L40 27.4 L80 27.4 Z" fill="none" stroke="#6fb5c4" stroke-width="2.6" stroke-dasharray="7 4" stroke-linejoin="round" opacity=".85"/>`},
  elusive:{ghost:1},
  split:{f:c=>`<path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#0d0a08" stroke-width="3.2" opacity=".75"/><path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#c39cf7" stroke-width="1.4"/>`},
  boom:{f:c=>{const b="M48 86 L40 78 L42 70 M48 86 L58 78 L56 70 M48 86 L46 97 L36 101 M48 86 L60 93 L70 91 M48 86 L38 89 L27 84";return `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${b}" stroke="#ff8a2a" stroke-width="7" opacity=".4"/><path class="flick" d="${b}" stroke="#14100c" stroke-width="4" opacity=".75"/><path class="flick" d="${b}" stroke="#ffc65a" stroke-width="2.2"/></g>`}},
  swiftfoot:{f:c=>`<g fill="#8ff0d0" opacity=".9"><circle cx="26" cy="109" r="6"/><circle cx="19" cy="113" r="4.2"/><circle cx="33" cy="113" r="3.6"/><circle cx="90" cy="109" r="6"/><circle cx="98" cy="113" r="4.2"/><circle cx="85" cy="113" r="3.6"/></g><path d="M12 102 h-8 M10 110 h-7 M108 102 h8 M110 110 h7" stroke="#8ff0d0" stroke-width="2.2" stroke-linecap="round"/>`}
};
// one composed creature: parts behind, the silhouette, its pattern (masked to the silhouette), details, parts in front; affixes the body cannot wear are returned for frame marks

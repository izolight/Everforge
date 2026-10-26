// ================= ART: CREATURES (affix marks) =================
// Where an affix is drawn is fixed by what it does, so two affixes on one rare never share a spot:
// elemental = particles around the creature in the element's colour (fire top-left edge, ice right edge, holy top-left corner,
// arcane top-right corner, poison bottom-left, shadow bottom-right); defence = on the body (iron plates, ward hexagon, regen cross
// on the chest, thorn spikes at the sides); aggression = the head (frenzy red eyes and steam, vamp fangs and drip); on-death =
// cracks (boom orange cracks low on the body, split a pale seam down the middle); movement = behind or under (swift speed lines
// on the left, swiftfoot dust at the feet, elusive afterimage).
const snow=(x,y)=>`<path d="M${x} ${y-5} v10 M${x-5} ${y} h10 M${x-3.5} ${y-3.5} l7 7 M${x+3.5} ${y-3.5} l-7 7"/>`;
const AFX_ART={
  fire:{f:c=>`<g fill="#ffd04a" stroke="#0d0a08" stroke-width=".8">${[[9,40,2.8],[14,26,2.2],[6,22,1.6],[16,34,1.8]].map(([x,y,r],i)=>`<circle ${an("amb-rise",2.2+i*.5,i/4)} cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`},
  ice:{f:c=>`<g stroke="#effbff" stroke-width="2" stroke-linecap="round">${snow(106,26)}${snow(111,44)}${snow(102,56)}</g>`},
  poison:{f:c=>`<g fill="${FAM.poison}" fill-opacity=".3" stroke="${FAM.poison}" stroke-width="1.2">${[[10,106,3.2],[20,114,2],[5,116,1.6],[22,100,1.6]].map(([x,y,r],i)=>`<circle ${an("amb-rise",2.6+i*.4,i/4)} cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`},
  holy:{f:c=>`<g fill="#fff2b8">${[[9,10,4],[22,7,2.6],[18,21,2]].map(([x,y,r],i)=>`<path ${an("amb-tw",1.8+i*.3,i/3)} d="${star4(x,y,r)}"/>`).join("")}</g>`},
  shadow:{f:c=>`<g fill="none" stroke="#a385dc" stroke-width="2.2" stroke-linecap="round" opacity=".75"><path class="flt" d="M96 116 q-2 -10 8 -16 q-6 10 2 16"/><path class="flt" d="M110 116 q2 -9 -6 -14 q5 8 1 14"/></g>`},
  iron:{p:"armor"},
  swift:{f:c=>`<path d="M2 48 H16 M4 55 H22 M2 62 H14" stroke="${FAM.swift}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`},
  arcane:{f:c=>`<g fill="${FAM.arcane}" stroke="#0d0a08" stroke-width="1.2"><path class="flt" d="M100 12 l3 -5 3 5 -3 5 Z"/><path class="flt" d="M110 28 l3 -5 3 5 -3 5 Z"/></g>`},
  vamp:{f:c=>`<path d="M44 44 l4 9 l4 -9 Z M54 44 l4 9 l4 -9 Z" fill="#f2ece0" stroke="#0d0a08" stroke-width="1.2" stroke-linejoin="round"/><path d="M55 53 q-1 4 0 7" stroke="#c43c4f" stroke-width="2" fill="none" stroke-linecap="round"/><circle class="flt" cx="55" cy="63" r="2.2" fill="#c43c4f"/>`},
  thorn:{f:c=>`<path d="M2 78 L14 82 L4 90 M118 78 L106 82 L116 90" fill="#b8a45a" stroke="#0d0a08" stroke-width="1.8" stroke-linejoin="round"/>`},
  regen:{f:c=>`<path class="amb-tw" d="M31 50 h6 v6 h6 v8 h-6 v6 h-6 v-6 h-6 v-8 h6 Z" fill="#b6ff9a" stroke="#0d0a08" stroke-width="1.6"/>`},
  frenzy:{f:c=>`<g><circle cx="50" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/><circle cx="68" cy="36" r="3.2" fill="#e8573b" stroke="#0d0a08" stroke-width="1.2"/></g><g fill="#e9e4dc" opacity=".7">${[[46,14,4],[58,8,5],[72,14,4]].map(([x,y,r],i)=>`<circle ${an("amb-rise",2.4+i*.4,i/3)} cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`},
  ward:{f:c=>`<path d="M100 62 L80 96.6 L40 96.6 L20 62 L40 27.4 L80 27.4 Z" fill="none" stroke="#6fb5c4" stroke-width="2.6" stroke-dasharray="7 4" stroke-linejoin="round" opacity=".85"/>`},
  elusive:{ghost:1},
  split:{f:c=>`<path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#0d0a08" stroke-width="3.2" opacity=".75"/><path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#c39cf7" stroke-width="1.4"/>`},
  boom:{f:c=>`<g stroke="#ffb142" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path class="flick" d="M50 80 l-6 7 l7 4 l-5 9"/><path class="flick" d="M40 90 l4 -2"/></g>`},
  swiftfoot:{f:c=>`<g fill="#6fd8b6" opacity=".55"><circle cx="30" cy="110" r="3.4"/><circle cx="24" cy="112" r="2.4"/><circle cx="86" cy="110" r="3.4"/><circle cx="94" cy="112" r="2.4"/></g>`}
};
// one composed creature: parts behind, the silhouette, its pattern (masked to the silhouette), details, parts in front; affixes the body cannot wear are returned for frame marks

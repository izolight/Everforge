// ================= ART: CREATURES (affix marks) =================
const AFX_ART={
  fire:{p:"flames",f:c=>`<g fill="#ffb347"><path class="flick" d="M10 44 q-4 -8 2 -14 q0 6 5 7 q-1 5 -7 7 Z"/><path class="flick" d="M110 40 q4 -8 -2 -14 q0 6 -5 7 q1 5 7 7 Z"/></g>`},
  ice:{p:"frost",f:c=>`<g stroke="#effbff" stroke-width="2" stroke-linecap="round"><path d="M12 30 v12 M6 36 h12 M8 32 l8 8 M16 32 l-8 8"/><path d="M106 24 v10 M101 29 h10"/></g>`},
  poison:{f:c=>`<g fill="${FAM.poison}" stroke="#0d0a08" stroke-width="1.4"><path class="flt" d="M14 18 q-6 9 0 13 q6 -4 0 -13 Z"/><path class="flt" d="M104 14 q-6 9 0 13 q6 -4 0 -13 Z"/><path class="flt" d="M110 42 q-4 7 0 10 q4 -3 0 -10 Z"/></g>`},
  holy:{p:"halo",f:c=>`<ellipse cx="60" cy="8" rx="20" ry="5" fill="none" stroke="#f6e7a6" stroke-width="3" opacity=".9"/>`},
  shadow:{f:c=>`<g fill="none" stroke="#a385dc" stroke-width="2.2" stroke-linecap="round" opacity=".75"><path class="flt" d="M8 60 q-2 -12 8 -18 q-6 10 2 16"/><path class="flt" d="M112 70 q2 -12 -8 -18 q6 10 -2 16"/><path class="flt" d="M98 14 q8 4 6 12"/></g>`},
  iron:{p:"armor",f:c=>`<g fill="#8d989c" stroke="#0d0a08" stroke-width="2" stroke-linejoin="round"><path d="M4 92 L14 86 L18 100 L8 108 Z"/><path d="M116 92 L106 86 L102 100 L112 108 Z"/></g><g fill="#d6dde0"><circle cx="11" cy="97" r="1.6"/><circle cx="109" cy="97" r="1.6"/></g>`},
  swift:{f:c=>`<path d="M2 50 H18 M4 60 H22 M2 70 H16" stroke="${FAM.swift}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`},
  arcane:{p:"runes",f:c=>`<g fill="${FAM.arcane}" stroke="#0d0a08" stroke-width="1.2"><path class="flt" d="M12 22 l4 -6 4 6 -4 6 Z"/><path class="flt" d="M104 30 l4 -6 4 6 -4 6 Z"/></g>`},
  vamp:{f:c=>`<g fill="#c43c4f" stroke="#0d0a08" stroke-width="1.4"><path class="flt" d="M16 12 q-6 9 0 13 q6 -4 0 -13 Z"/><path class="flt" d="M104 8 q-6 9 0 13 q6 -4 0 -13 Z"/><path class="flt" d="M111 32 q-4 7 0 10 q4 -3 0 -10 Z"/></g>`},
  thorn:{p:"spikes",f:c=>`<path d="M6 116 L12 100 L18 116 M100 116 L108 98 L114 116 M2 84 L14 88 L4 96 M118 80 L106 86 L116 94" fill="#b8a45a" stroke="#0d0a08" stroke-width="1.8" stroke-linejoin="round"/>`},
  regen:{p:"vines",f:c=>`<g fill="#7cc47c" stroke="#0d0a08" stroke-width="1.2"><path class="flt" d="M10 96 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 Z"/><path class="flt" d="M98 104 q2 -8 10 -8 q-1 8 -10 8 Z"/></g>`},
  frenzy:{f:c=>`<g stroke="#e8573b" stroke-width="2.6" stroke-linecap="round"><path d="M98 12 l4 6 M106 10 l0 8 M112 14 l-4 5"/><path d="M8 18 l5 4 M14 12 l2 7"/></g>`},
  ward:{f:c=>`<path d="M60 4 A58 58 0 0 1 116 50 M60 4 A58 58 0 0 0 4 50" fill="none" stroke="#6fb5c4" stroke-width="3" stroke-dasharray="12 4" opacity=".8"/>`},
  elusive:{ghost:1},
  split:{f:c=>`<path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#0d0a08" stroke-width="3.2" opacity=".75"/><path d="M74 6 L66 26 L76 34 L62 56 L72 66 L58 92" fill="none" stroke="#c39cf7" stroke-width="1.4"/>`},
  boom:{f:c=>`<g stroke="#ffb142" stroke-width="2" stroke-linecap="round"><path class="flick" d="M100 98 l6 -6 M106 104 l8 0 M100 106 l4 6"/><path class="flick" d="M14 102 l-6 -6 M12 110 l-8 2"/></g><circle class="flick" cx="104" cy="102" r="3" fill="#ffb142"/>`},
  swiftfoot:{f:c=>`<path d="M2 82 H20 M6 92 H24 M2 102 H18" stroke="#6fd8b6" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`}
};
// one composed creature: parts behind, the silhouette, its pattern (masked to the silhouette), details, parts in front; affixes the body cannot wear are returned for frame marks

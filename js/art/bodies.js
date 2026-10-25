// ================= ART: CREATURES (bodies) =================
// ---- composable creatures: a body per family plus overlay parts, tinted by the element (or an elemental affix).
// An enemy without a PORTRAITS entry is drawn from ENEMIES[id].art={b:body,p:[parts],c:base colour,a:accent (both used while it fights as its own element),pat:a PAT pattern,pc:pattern colour (default the accent),po:pattern opacity,skin,glow}.
// Parts are {z:-1 behind the body | 1 in front, f(c,a)}; affixes add a part on a composed body (AFX_ART[id].p) or a frame effect anywhere (AFX_ART[id].f).
// Every portrait (hand-drawn too) gets the shared look in portrait(): c.m/c.d are top-lit gradients that drift in hue, c.e blooms, an element ambience (AMB) plays around it, and magic, rare and boss foes get a rim light.
// Each body returns {s,f,a}: s = the silhouette shapes (a pattern is masked to them), f = face and details drawn over the pattern, a = anchors:
// h=[x,y,r] head, s=[x,y,w] shoulders/back line (w = half width), c=[x,y] chest, k=[x,y] weapon hand, t=[x,y] tail root, side=1 for a side view, fly=1 floats.
const BODY={
  beast:c=>({a:{h:[26,60,17],s:[70,44,28],c:[70,68],k:[18,86],t:[104,62],side:1},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M80 86 L80 108 H90 L92 86 Z M44 84 L42 106 H52 L56 86 Z" fill="${c.d}"/>
    <path d="M36 58 Q44 40 70 40 Q104 40 108 64 Q108 90 80 92 Q48 94 38 82 Z" fill="${c.m}"/>
    <path d="M92 84 L96 110 H106 L104 78 Z M54 86 L56 110 H66 L66 88 Z" fill="${c.d}"/>
    <path d="M48 54 Q42 38 26 42 Q8 46 6 62 Q6 76 16 80 L34 80 Q48 74 48 54 Z" fill="${c.m}"/>
    <path d="M30 44 L26 28 L40 42 Z" fill="${c.d}"/></g>`,f:`<path d="M44 82 Q70 96 100 82 Q96 90 78 91 Q54 93 44 82 Z M18 78 Q30 82 40 74 Q36 80 26 81 Z" fill="${c.b}" opacity=".55"/>
    <path d="M6 62 Q1 70 8 76 L18 79 Q12 70 6 62 Z" fill="${c.D}" stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"/><path d="M31 41 L29 33 L36 40 Z" fill="${c.a}" opacity=".5"/>
    <path d="M52 50 Q74 44 98 52 M30 70 q6 4 12 0" stroke="${c.l}" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M11 77 l3 6 3 -5 M19 79 l3 6 3 -5" fill="#f2ece0"/><ellipse cx="24" cy="57" rx="3.6" ry="3.2" fill="${c.e}"/><circle cx="23" cy="56" r="1" fill="#fff"/>`}),
  undead:c=>({a:{h:[60,32,16],s:[60,50,24],c:[60,72],k:[102,94]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M38 50 Q16 62 14 94 L23 96 Q26 72 44 62 Z M82 50 Q104 62 106 94 L97 96 Q94 72 76 62 Z" fill="${c.d}"/>
    <path d="M46 94 L42 114 H52 L55 96 Z M74 94 L78 114 H68 L65 96 Z" fill="${c.d}"/>
    <path d="M38 48 Q60 40 82 48 L86 102 L78 95 L71 104 L64 95 L56 104 L49 95 L40 102 Z" fill="${c.m}"/></g>`,f:`
    <path d="M50 60 Q60 64 70 60 M48 68 Q60 72 72 68 M50 76 Q60 80 70 76 M60 55 V86" stroke="${c.D}" stroke-width="2" fill="none"/>
    <path d="M14 96 l-3 6 M18 97 l0 7 M22 96 l3 6 M106 96 l3 6 M102 97 l0 7 M98 96 l-3 6" stroke="${c.o}" stroke-width="2" stroke-linecap="round"/>
    <path d="M44 32 Q44 13 60 13 Q76 13 76 32 Q76 42 70 47 V52 H50 V47 Q44 42 44 32 Z" fill="${c.l}" stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 22 Q54 16 62 16" stroke="#fff" stroke-width="1.6" fill="none" opacity=".45"/>
    <ellipse cx="53" cy="31" rx="5" ry="6" fill="#0b0907"/><ellipse cx="67" cy="31" rx="5" ry="6" fill="#0b0907"/><circle cx="53" cy="32" r="2.2" fill="${c.e}"/><circle cx="67" cy="32" r="2.2" fill="${c.e}"/>
    <path d="M58 40 L60 37 L62 40 Z" fill="#0b0907"/><path d="M52 47 H68 M55 45 V49 M60 45 V49 M65 45 V49" stroke="#0b0907" stroke-width="1.6"/>`}),
  construct:c=>({a:{h:[60,26,16],s:[60,44,30],c:[60,68],k:[100,90]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <rect x="38" y="92" width="16" height="20" rx="4" fill="${c.d}"/><rect x="66" y="92" width="16" height="20" rx="4" fill="${c.d}"/>
    <rect x="10" y="46" width="20" height="34" rx="6" fill="${c.d}"/><rect x="90" y="46" width="20" height="34" rx="6" fill="${c.d}"/>
    <rect x="7" y="78" width="26" height="18" rx="5" fill="${c.m}"/><rect x="87" y="78" width="26" height="18" rx="5" fill="${c.m}"/>
    <path d="M28 42 H92 L84 98 H36 Z" fill="${c.m}"/><rect x="52" y="38" width="16" height="6" fill="${c.d}"/><rect x="44" y="10" width="32" height="30" rx="6" fill="${c.m}"/></g>`,f:`
    <rect x="48" y="20" width="24" height="9" rx="3" fill="#0b0907" stroke="${c.o}" stroke-width="2"/><rect x="53" y="23" width="14" height="3.6" rx="1.5" fill="${c.e}"/>
    <circle cx="60" cy="66" r="11" fill="${c.a}" stroke="${c.o}" stroke-width="2"/><circle cx="60" cy="66" r="8" fill="#0b0907"/><circle class="flick" cx="60" cy="66" r="5" fill="${c.e}"/>
    <path d="M34 54 H86 M38 84 H82" stroke="${c.D}" stroke-width="2"/><path d="M32 46 H88" stroke="${c.l}" stroke-width="1.6" opacity=".7"/><g fill="${c.a}" stroke="${c.o}" stroke-width="1"><circle cx="34" cy="48" r="2.2"/><circle cx="86" cy="48" r="2.2"/><circle cx="40" cy="92" r="2.2"/><circle cx="80" cy="92" r="2.2"/></g>`}),
  elemental:c=>({a:{h:[60,56,22],s:[60,34,22],c:[60,72],k:[100,58],fly:1},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M48 90 Q48 106 62 116 Q60 104 72 94 Z" fill="${c.d}"/>
    <path class="flt" d="M12 56 L22 46 L30 58 L20 66 Z" fill="${c.d}"/><path class="flt" d="M108 56 L98 46 L90 58 L100 66 Z" fill="${c.d}"/>
    <path d="M60 12 Q92 30 92 62 Q92 90 60 98 Q28 90 28 62 Q28 30 60 12 Z" fill="${c.m}"/></g>`,f:`
    <ellipse cx="60" cy="62" rx="22" ry="27" fill="url(#${c.id}c)"/><path d="M60 22 Q74 34 72 46" stroke="${c.l}" stroke-width="2" fill="none" opacity=".7"/>
    <ellipse cx="52" cy="56" rx="4.2" ry="5.4" fill="${c.e}" stroke="${c.o}" stroke-width="1.6"/><ellipse cx="68" cy="56" rx="4.2" ry="5.4" fill="${c.e}" stroke="${c.o}" stroke-width="1.6"/>
    <path d="M53 72 Q60 77 67 72" stroke="${c.o}" stroke-width="2" fill="none" stroke-linecap="round"/>`}),
  humanoid:(c,o)=>({a:{h:[60,30,14],s:[60,52,28],c:[60,74],k:[90,88]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M60 44 Q86 46 88 64 L98 114 H22 L32 64 Q34 46 60 44 Z" fill="${c.d}"/><path d="M46 52 H74 L78 108 H42 Z" fill="${c.m}"/>
    <path d="M34 58 Q22 74 26 92 L35 92 Q35 76 43 66 Z M86 58 Q98 74 94 90 L85 90 Q85 76 77 66 Z" fill="${c.d}"/></g>`,f:`
    <path d="M24 112 H96 M46 52 L42 108 M74 52 L78 108" stroke="${c.a}" stroke-width="1.8" opacity=".75"/>
    <g stroke="${c.o}" stroke-width="2.5"><circle cx="30" cy="94" r="5" fill="${o.skin}"/><circle cx="90" cy="90" r="5" fill="${o.skin}"/><circle cx="60" cy="30" r="14" fill="${o.skin}"/></g>
    <path d="M51 22 Q56 18 62 18" stroke="#fff" stroke-width="1.6" fill="none" opacity=".4"/><ellipse cx="54" cy="35" rx="3" ry="1.8" fill="#e0707a" opacity=".35"/><ellipse cx="66" cy="35" rx="3" ry="1.8" fill="#e0707a" opacity=".35"/>
    <rect x="44" y="80" width="32" height="5" fill="${c.o}"/><rect x="57" y="79" width="6" height="7" rx="1" fill="${c.a}"/><path d="M50 56 L60 66 L70 56" stroke="${c.l}" stroke-width="2" fill="none" opacity=".6"/>
    <ellipse cx="55" cy="29" rx="2.4" ry="2" fill="${o.glow?c.e:"#1a120c"}"/><ellipse cx="65" cy="29" rx="2.4" ry="2" fill="${o.glow?c.e:"#1a120c"}"/><path d="M56 37 Q60 39 64 37" stroke="#1a120c" stroke-width="1.6" fill="none"/>`})
};

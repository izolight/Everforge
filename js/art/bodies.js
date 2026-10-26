// ================= ART: CREATURES (bodies) =================
// ---- composable creatures: a body per family plus overlay parts, tinted by the element (or an elemental affix).
// An enemy without a PORTRAITS entry is drawn from ENEMIES[id].art={b:body,p:[parts],c:base colour,a:accent (both used while it fights as its own element),pat:a PAT pattern,pc:pattern colour (default the accent),po:pattern opacity,skin,glow}.
// Parts are {z:-1 behind the body | 1 in front, f(c,a)}; affixes add a part on a composed body (AFX_ART[id].p) or a frame effect anywhere (AFX_ART[id].f).
// Every portrait (hand-drawn too) gets the shared look in portrait(): c.m/c.d are top-lit gradients that drift in hue, c.e blooms, an element ambience (AMB) plays around it, and magic, rare and boss foes get a rim light.
// Each body returns {s,f,a}: s = the silhouette shapes (a pattern is masked to them), f = face and details drawn over the pattern, a = anchors:
// h=[x,y,r] head, s=[x,y,w] shoulders/back line (w = half width), c=[x,y] chest, k=[x,y] weapon hand, t=[x,y] tail root, side=1 for a side view, fly=1 floats,
// tt=[x,y,r] where the elemental tattoo sits on the flank or chest (r = the emblem's radius), g=[x,y] where the regen cross sits on the upper body.
const BODY={
  beast:c=>({a:{h:[26,60,17],s:[70,44,28],c:[70,68],k:[18,86],t:[104,62],side:1,tt:[72,72,15],g:[49,74]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M80 86 L80 108 H90 L92 86 Z M44 84 L42 106 H52 L56 86 Z" fill="${c.d}"/>
    <path d="M36 58 Q44 40 70 40 Q104 40 108 64 Q108 90 80 92 Q48 94 38 82 Z" fill="${c.m}"/>
    <path d="M92 84 L96 110 H106 L104 78 Z M54 86 L56 110 H66 L66 88 Z" fill="${c.d}"/>
    <path d="M48 54 Q42 38 26 42 Q8 46 6 62 Q6 76 16 80 L34 80 Q48 74 48 54 Z" fill="${c.m}"/>
    <path d="M30 44 L26 28 L40 42 Z" fill="${c.d}"/></g>`,f:`<path d="M44 82 Q70 96 100 82 Q96 90 78 91 Q54 93 44 82 Z M18 78 Q30 82 40 74 Q36 80 26 81 Z" fill="${c.b}" opacity=".55"/>
    <path d="M6 62 Q1 70 8 76 L18 79 Q12 70 6 62 Z" fill="${c.D}" stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"/><path d="M31 41 L29 33 L36 40 Z" fill="${c.a}" opacity=".5"/>
    <path d="M52 50 Q74 44 98 52 M30 70 q6 4 12 0" stroke="${c.l}" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M11 77 l3 6 3 -5 M19 79 l3 6 3 -5" fill="#f2ece0"/><ellipse cx="24" cy="57" rx="3.6" ry="3.2" fill="${c.e}"/><circle cx="23" cy="56" r="1" fill="#fff"/>`}),
  canine:c=>({a:{h:[25,52,15],s:[68,49,30],c:[68,70],k:[18,88],t:[105,64],side:1,tt:[73,74,14],g:[50,76]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M42 78 L38 110 H48 L54 80 M76 78 L78 110 H89 L88 76" fill="${c.d}"/><path d="M36 54 Q48 39 75 43 Q102 46 108 65 Q108 82 91 88 L50 88 Q34 82 36 54Z" fill="${c.m}"/>
    <path d="M45 52 Q28 34 15 42 Q7 49 10 60 L31 67 Z" fill="${c.m}"/><path d="M19 43 L10 30 L28 40 Z" fill="${c.d}"/><path d="M40 60 L7 65 L20 78 L42 74 Z" fill="${c.m}"/></g>`,f:`<path d="M8 65 Q20 67 31 63 L39 70 Q30 78 19 77Z" fill="${c.D}" stroke="${c.o}" stroke-width="2"/><path d="M15 71 l8 1" stroke="${c.b}" stroke-width="2"/><ellipse cx="22" cy="51" rx="2.8" ry="3.2" fill="${c.e}"/><circle cx="21" cy="50" r=".9" fill="#fff"/><path d="M49 49 Q76 43 97 54" stroke="${c.l}" stroke-width="2" fill="none" opacity=".55"/>`}),
  feline:c=>({a:{h:[27,49,15],s:[68,50,27],c:[69,70],k:[18,88],t:[105,62],side:1,tt:[74,73,13],g:[50,76]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M42 77 L40 110 H49 L54 79 M79 76 L82 108 H91 L89 74" fill="${c.d}"/><path d="M37 54 Q49 40 77 43 Q105 46 108 65 Q106 81 89 86 L50 85 Q35 78 37 54Z" fill="${c.m}"/>
    <path d="M42 54 Q27 39 12 48 Q8 57 18 65 L39 67 Z" fill="${c.m}"/><path d="M17 51 L14 32 L31 45 Z" fill="${c.d}"/><path d="M30 55 L25 35 L42 48 Z" fill="${c.m}"/></g>`,f:`<path d="M17 61 Q25 66 38 62 L43 68 Q31 76 20 70Z" fill="${c.D}" stroke="${c.o}" stroke-width="2"/><path d="M14 62 L4 58 M18 66 L5 68 M34 65 L45 61" stroke="${c.l}" stroke-width="1.4"/><ellipse cx="23" cy="52" rx="2.7" ry="3.4" fill="${c.e}"/><path d="M52 47 Q76 41 98 51" stroke="${c.l}" stroke-width="2" fill="none" opacity=".55"/>`}),
  bear:c=>({a:{h:[27,53,17],s:[69,45,34],c:[69,70],k:[17,89],t:[104,66],side:1,tt:[73,73,15],g:[49,76]},s:`<g stroke="${c.o}" stroke-width="2.8" stroke-linejoin="round">
    <path d="M39 72 L35 108 Q42 116 55 110 L59 80 M76 77 L79 111 Q90 117 98 108 L91 70" fill="${c.d}"/><path d="M29 51 Q35 34 69 35 Q104 35 111 58 L108 79 Q99 94 73 91 L43 88 Q27 78 29 51Z" fill="${c.m}"/>
    <path d="M44 51 Q32 39 17 46 Q8 52 12 66 Q19 77 40 73Z" fill="${c.m}"/><circle cx="17" cy="47" r="5" fill="${c.d}"/><path d="M13 64 Q25 69 41 62 L45 72 Q29 82 14 73Z" fill="${c.D}"/></g>`,f:`<path d="M43 46 Q73 38 101 49 M43 53 Q70 47 103 57 M45 61 Q72 57 106 65" stroke="${c.l}" stroke-width="2.2" opacity=".7" fill="none"/><ellipse cx="23" cy="54" rx="2.8" ry="3.2" fill="${c.e}"/><path d="M13 66 Q24 72 39 65" stroke="${c.o}" stroke-width="1.5" fill="none"/>`}),
  reptile:c=>({a:{h:[25,65,14],s:[69,55,31],c:[70,75],k:[18,92],t:[105,74],side:1,tt:[73,79,13],g:[52,83]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M42 80 L38 103 L50 105 L56 82 M77 80 L81 104 L93 102 L90 76" fill="${c.d}"/><path d="M36 57 Q48 45 78 48 Q103 51 109 67 Q106 84 89 88 L49 89 Q33 82 36 57Z" fill="${c.m}"/>
    <path d="M42 58 Q27 49 13 58 L5 68 L16 77 L42 74Z" fill="${c.m}"/><path d="M12 69 L3 68 L11 64Z" fill="${c.D}"/><path d="M33 53 L27 42 L39 49Z" fill="${c.d}"/></g>`,f:`<path d="M20 76 Q50 67 87 75 M35 55 L41 60 M48 51 L54 56 M62 50 L68 55 M76 52 L82 57 M47 84 L51 88 M64 85 L68 89 M81 84 L85 88" stroke="${c.l}" stroke-width="1.8" fill="none" opacity=".7"/><ellipse cx="18" cy="61" rx="2.6" ry="2.2" fill="${c.e}"/><circle cx="17" cy="61" r=".8" fill="#fff"/>`}),
  undead:c=>({a:{h:[60,32,16],s:[60,50,24],c:[60,72],k:[102,94],tt:[60,74,14],g:[42,62]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M38 50 Q16 62 14 94 L23 96 Q26 72 44 62 Z M82 50 Q104 62 106 94 L97 96 Q94 72 76 62 Z" fill="${c.d}"/>
    <path d="M46 94 L42 114 H52 L55 96 Z M74 94 L78 114 H68 L65 96 Z" fill="${c.d}"/>
    <path d="M38 48 Q60 40 82 48 L86 102 L78 95 L71 104 L64 95 L56 104 L49 95 L40 102 Z" fill="${c.m}"/></g>`,f:`
    <path d="M50 60 Q60 64 70 60 M48 68 Q60 72 72 68 M50 76 Q60 80 70 76 M60 55 V86" stroke="${c.D}" stroke-width="2" fill="none"/>
    <path d="M14 96 l-3 6 M18 97 l0 7 M22 96 l3 6 M106 96 l3 6 M102 97 l0 7 M98 96 l-3 6" stroke="${c.o}" stroke-width="2" stroke-linecap="round"/>
    <path d="M44 32 Q44 13 60 13 Q76 13 76 32 Q76 42 70 47 V52 H50 V47 Q44 42 44 32 Z" fill="${c.l}" stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 22 Q54 16 62 16" stroke="#fff" stroke-width="1.6" fill="none" opacity=".45"/>
    <ellipse cx="53" cy="31" rx="5" ry="6" fill="#0b0907"/><ellipse cx="67" cy="31" rx="5" ry="6" fill="#0b0907"/><circle cx="53" cy="32" r="2.2" fill="${c.e}"/><circle cx="67" cy="32" r="2.2" fill="${c.e}"/>
    <path d="M58 40 L60 37 L62 40 Z" fill="#0b0907"/><path d="M52 47 H68 M55 45 V49 M60 45 V49 M65 45 V49" stroke="#0b0907" stroke-width="1.6"/>`}),
  construct:c=>({a:{h:[60,26,16],s:[60,44,30],c:[60,68],k:[100,90],tt:[60,82,14],g:[40,62]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <rect x="38" y="92" width="16" height="20" rx="4" fill="${c.d}"/><rect x="66" y="92" width="16" height="20" rx="4" fill="${c.d}"/>
    <rect x="10" y="46" width="20" height="34" rx="6" fill="${c.d}"/><rect x="90" y="46" width="20" height="34" rx="6" fill="${c.d}"/>
    <rect x="7" y="78" width="26" height="18" rx="5" fill="${c.m}"/><rect x="87" y="78" width="26" height="18" rx="5" fill="${c.m}"/>
    <path d="M28 42 H92 L84 98 H36 Z" fill="${c.m}"/><rect x="52" y="38" width="16" height="6" fill="${c.d}"/><rect x="44" y="10" width="32" height="30" rx="6" fill="${c.m}"/></g>`,f:`
    <rect x="48" y="20" width="24" height="9" rx="3" fill="#0b0907" stroke="${c.o}" stroke-width="2"/><rect x="53" y="23" width="14" height="3.6" rx="1.5" fill="${c.e}"/>
    <circle cx="60" cy="54" r="11" fill="${c.a}" stroke="${c.o}" stroke-width="2"/><circle cx="60" cy="54" r="8" fill="#0b0907"/><circle class="flick" cx="60" cy="54" r="5" fill="${c.e}"/>
    <path d="M34 54 H86 M38 84 H82" stroke="${c.D}" stroke-width="2"/><path d="M32 46 H88" stroke="${c.l}" stroke-width="1.6" opacity=".7"/><g fill="${c.a}" stroke="${c.o}" stroke-width="1"><circle cx="34" cy="48" r="2.2"/><circle cx="86" cy="48" r="2.2"/><circle cx="40" cy="92" r="2.2"/><circle cx="80" cy="92" r="2.2"/></g>`}),
  elemental:c=>({a:{h:[60,56,22],s:[60,34,22],c:[60,72],k:[100,58],fly:1,tt:[60,90,10],g:[38,82]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M48 90 Q48 106 62 116 Q60 104 72 94 Z" fill="${c.d}"/>
    <path class="flt" d="M12 56 L22 46 L30 58 L20 66 Z" fill="${c.d}"/><path class="flt" d="M108 56 L98 46 L90 58 L100 66 Z" fill="${c.d}"/>
    <path d="M60 12 Q92 30 92 62 Q92 90 60 98 Q28 90 28 62 Q28 30 60 12 Z" fill="${c.m}"/></g>`,f:`
    <ellipse cx="60" cy="62" rx="22" ry="27" fill="url(#${c.id}c)"/><path d="M60 22 Q74 34 72 46" stroke="${c.l}" stroke-width="2" fill="none" opacity=".7"/>
    <ellipse cx="52" cy="56" rx="4.2" ry="5.4" fill="${c.e}" stroke="${c.o}" stroke-width="1.6"/><ellipse cx="68" cy="56" rx="4.2" ry="5.4" fill="${c.e}" stroke="${c.o}" stroke-width="1.6"/>
    <path d="M53 72 Q60 77 67 72" stroke="${c.o}" stroke-width="2" fill="none" stroke-linecap="round"/>`}),
  humanoid:(c,o)=>({a:{h:[60,30,14],s:[60,52,28],c:[60,74],k:[90,88],tt:[60,74,14],g:[40,94]},s:`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M60 44 Q86 46 88 64 L98 114 H22 L32 64 Q34 46 60 44 Z" fill="${c.d}"/><path d="M46 52 H74 L78 108 H42 Z" fill="${c.m}"/>
    <path d="M34 58 Q22 74 26 92 L35 92 Q35 76 43 66 Z M86 58 Q98 74 94 90 L85 90 Q85 76 77 66 Z" fill="${c.d}"/></g>`,f:`
    <path d="M24 112 H96 M46 52 L42 108 M74 52 L78 108" stroke="${c.a}" stroke-width="1.8" opacity=".75"/>
    <g stroke="${c.o}" stroke-width="2.5"><circle cx="30" cy="94" r="5" fill="${o.skin}"/><circle cx="90" cy="90" r="5" fill="${o.skin}"/><circle cx="60" cy="30" r="14" fill="${o.skin}"/></g>
    <path d="M51 22 Q56 18 62 18" stroke="#fff" stroke-width="1.6" fill="none" opacity=".4"/><ellipse cx="54" cy="35" rx="3" ry="1.8" fill="#e0707a" opacity=".35"/><ellipse cx="66" cy="35" rx="3" ry="1.8" fill="#e0707a" opacity=".35"/>
    <rect x="44" y="80" width="32" height="5" fill="${c.o}"/><rect x="57" y="79" width="6" height="7" rx="1" fill="${c.a}"/><path d="M50 56 L60 66 L70 56" stroke="${c.l}" stroke-width="2" fill="none" opacity=".6"/>
    <ellipse cx="55" cy="29" rx="2.4" ry="2" fill="${o.glow?c.e:"#1a120c"}"/><ellipse cx="65" cy="29" rx="2.4" ry="2" fill="${o.glow?c.e:"#1a120c"}"/><path d="M56 37 Q60 39 64 37" stroke="#1a120c" stroke-width="1.6" fill="none"/>`})
};

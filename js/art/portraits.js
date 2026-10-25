// ================= ART: CREATURES (hand-drawn) =================
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
  slag:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M14 110 L24 92 L43 96 L60 88 L78 96 L98 92 L108 110 Z" fill="${c.d}"/>
    <path d="M32 40 L22 59 L12 54 L7 71 L25 82 L40 67 Z M88 40 L98 59 L108 54 L113 71 L95 82 L80 67 Z" fill="${c.m}"/>
    <path d="M36 33 H84 L92 96 Q60 110 28 96 Z" fill="${c.m}"/>
    <path d="M42 34 V16 L51 8 H69 L78 16 V34 Z" fill="${c.d}"/>
    <path d="M43 57 Q60 43 77 57 L80 89 Q60 99 40 89 Z" fill="#160d08"/>
    <path class="flick" d="M48 85 Q42 73 54 63 Q52 75 60 70 Q65 54 67 60 Q82 77 72 88 Q60 93 48 85 Z" fill="${c.e}"/>
    <path d="M48 55 L46 91 M60 51 V94 M72 55 L74 91 M40 73 H80" stroke="${c.d}" stroke-width="5"/>
    <path d="M35 36 H85 M32 96 Q60 106 88 96" fill="none" stroke="${c.l}"/>
    <path d="M48 21 H72 L68 28 H52 Z" fill="${c.e}"/>
    <path d="M27 105 L36 100 M87 105 L79 99 M17 65 L25 69 M103 65 L95 69" fill="none" stroke="${c.l}" stroke-width="2"/>
    </g>`,
  phoenix:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M60 62 Q34 16 2 24 Q24 40 26 52 Q8 54 4 70 Q30 62 40 72 Q28 78 24 90 Q46 78 60 76 Z" fill="${c.m}"/>
    <path d="M60 62 Q86 16 118 24 Q96 40 94 52 Q112 54 116 70 Q90 62 80 72 Q92 78 96 90 Q74 78 60 76 Z" fill="${c.m}"/>
    <path class="flick" d="M50 80 Q46 106 60 118 Q74 106 70 80 Z" fill="${c.g}"/>
    <ellipse cx="60" cy="66" rx="11" ry="20" fill="${c.l}"/><circle cx="60" cy="42" r="9" fill="${c.l}"/></g>
    <path class="flick" d="M60 34 Q54 20 62 10 Q62 22 71 20 Q65 30 60 34Z" fill="${c.g}"/>
    <path d="M66 42 l8 3 -8 3 Z" fill="#f2c94c"/><circle cx="62" cy="40" r="2.2" fill="#1a0f08"/>
    <path d="M14 30 Q30 34 40 46 M106 30 Q90 34 80 46" stroke="${c.g}" stroke-width="2" fill="none" opacity=".7"/>`,
  harpy:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M58 56 Q30 22 3 30 Q18 40 20 48 Q8 50 4 62 Q24 56 34 66 Q24 72 22 84 Q44 74 58 76 Z" fill="${c.m}"/><path d="M62 56 Q90 22 117 30 Q102 40 100 48 Q112 50 116 62 Q96 56 86 66 Q96 72 98 84 Q76 74 62 76 Z" fill="${c.m}"/>
    <path d="M48 70 Q60 62 72 70 L68 100 Q60 108 52 100 Z" fill="${c.d}"/><path d="M52 102 L45 115 M57 105 L54 117 M68 102 L75 115 M63 105 L66 117" fill="none" stroke-width="2.2"/>
    <path d="M47 42 L42 22 L55 35 Z M73 42 L78 22 L65 35 Z" fill="${c.d}"/><circle cx="60" cy="48" r="13" fill="${c.l}"/></g>
    <ellipse cx="54" cy="46" rx="3" ry="2.4" fill="${c.e}"/><ellipse cx="66" cy="46" rx="3" ry="2.4" fill="${c.e}"/><path d="M55 52 L65 52 L60 63 Z" fill="#e8c35a" stroke="${c.o}" stroke-width="1.5" stroke-linejoin="round"/>
    <path class="flick" d="M96 6 L86 24 H94 L87 40 L102 19 H94 Z" fill="${c.e}"/><path d="M16 80 q-6 8 0 14 M104 80 q6 8 0 14" stroke="${c.l}" stroke-width="2" fill="none" opacity=".6"/>`,
  sentinel:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <rect x="8" y="48" width="24" height="46" rx="7" fill="${c.d}"/><rect x="88" y="48" width="24" height="46" rx="7" fill="${c.d}"/>
    <rect x="38" y="92" width="18" height="22" rx="4" fill="${c.d}"/><rect x="64" y="92" width="18" height="22" rx="4" fill="${c.d}"/>
    <rect x="28" y="44" width="64" height="52" rx="8" fill="${c.m}"/><path d="M38 42 V18 Q38 6 60 6 Q82 6 82 18 V42 Z" fill="${c.m}"/><path d="M46 20 H74 V30 H46 Z" fill="#0b0907"/></g>
    <rect x="50" y="23" width="8" height="3.6" rx="1.5" fill="${c.e}"/><rect x="62" y="23" width="8" height="3.6" rx="1.5" fill="${c.e}"/>
    <path class="flick" d="M60 52 V86 M46 62 H74 M50 80 L60 68 L70 80" stroke="${c.e}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M14 58 h12 M14 68 h12 M14 78 h8 M94 58 h12 M98 68 h8 M94 78 h12" stroke="${c.l}" stroke-width="1.8" opacity=".6"/>
    <g fill="${c.g}"><circle class="flt" cx="6" cy="30" r="2.6"/><circle class="flt" cx="114" cy="36" r="2.2"/><circle class="flt" cx="108" cy="108" r="1.8"/></g>`,
  acolyte:c=>`<g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round"><path d="M60 8 Q92 14 94 54 L110 112 H10 L26 54 Q28 14 60 8 Z" fill="${c.d}"/>
    <path d="M60 22 Q80 28 80 52 Q70 66 60 66 Q50 66 40 52 Q40 28 60 22 Z" fill="#07050c"/></g>
    <ellipse cx="52" cy="46" rx="3.4" ry="4.6" fill="${c.e}"/><ellipse cx="68" cy="46" rx="3.4" ry="4.6" fill="${c.e}"/>
    <path d="M26 100 Q60 114 94 100" stroke="${c.m}" stroke-width="3" fill="none"/><path d="M22 98 Q12 88 22 78 M98 98 Q108 88 98 78" stroke="${c.l}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="60" cy="90" rx="24" ry="6" fill="none" stroke="${c.l}" stroke-width="1.6" opacity=".55"/><circle cx="60" cy="90" r="11" fill="#07050c" stroke="${c.l}" stroke-width="2"/>
    <g fill="${c.g}"><circle class="flt" cx="18" cy="40" r="2.6"/><circle class="flt" cx="104" cy="30" r="2.2"/><circle class="flt" cx="96" cy="70" r="1.8"/></g>`,
  archon:c=>`<circle cx="60" cy="58" r="46" fill="none" stroke="${c.l}" stroke-width="2" stroke-dasharray="3 6" opacity=".7"/><g stroke="${c.o}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M58 54 L8 18 L22 52 L2 70 L34 66 L26 90 L58 74 Z" fill="${c.m}"/><path d="M62 54 L112 18 L98 52 L118 70 L86 66 L94 90 L62 74 Z" fill="${c.m}"/>
    <path d="M44 52 Q60 40 76 52 L84 112 Q60 120 36 112 Z" fill="${c.d}"/><circle cx="60" cy="36" r="13" fill="${c.l}"/>
    <path d="M46 28 L43 6 L54 21 L60 2 L66 21 L77 6 L74 28 Z" fill="${c.g}"/></g>
    ${c.ph?`<circle cx="60" cy="38" r="7" fill="#07050c"/><circle cx="60" cy="38" r="2.6" fill="${c.e}"/><circle cx="60" cy="76" r="20" fill="#07050c" opacity=".6"/><path d="M60 76 m-20 0 a20 20 0 0 1 40 0" stroke="${c.l}" stroke-width="1.6" fill="none" class="flick"/>`
    :`<path d="M52 36 l6 2 M68 36 l-6 2" stroke="${c.e}" stroke-width="3" stroke-linecap="round"/><path class="flick" d="M60 62 L64 72 L74 74 L66 80 L68 90 L60 85 L52 90 L54 80 L46 74 L56 72 Z" fill="${c.e}"/>`}
    <path class="flick" d="M12 6 l8 10 h-6 l8 12 M104 4 l-8 10 h6 l-8 12" stroke="${c.e}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`,
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

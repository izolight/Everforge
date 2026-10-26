// ================= HERO ART =================
// Equipment is read through gearOf(), so consumed, sold or missing items never linger.
const heroGear=()=>Object.fromEntries(SLOTS.map(([s])=>[s,gearOf(s)]));
function heroColors(it){
  const mat=it&&matOf(it),tr=it?topTraits(it.traits).filter(([t])=>TRAITS[t].f!=="bad"):[],a=tr.length?tColor(tr[0][0]):"#bca78a";
  const cloth=it&&["chest","gloves","boots","helm"].includes(it.form)&&tr.length&&["shadow","arcane","holy"].includes(TRAITS[tr[0][0]].f)&&!tr.some(([t])=>["Iron","Stone","Heavy","Fur","Wood","Insulated"].includes(t));
  const p=(!cloth&&MAT[mat])||[shade(a,.5),shade(a,-.15),shade(a,-.65)];
  return{light:p[0],mid:p[1],dark:p[2],accent:a,mat};
}
function heroWorn(slot,it,draw,box){
  if(!it)return"";
  const c=heroColors(it),id="hw"+(gid++),fill=`url(#${id})`;
  const families=new Set(Object.entries(it.traits).filter(([,v])=>v>=1.5).map(([t])=>TRAITS[t].f));
  let fx="";
  for(const [x,y,w,h] of Array.isArray(box[0])?box:[box]){
  if(families.has("fire"))fx+=`<g fill="#ffc477"><circle class="emb" cx="${x+w*.16}" cy="${y+h*.2}" r="1.8"/><circle class="emb" cx="${x+w*.8}" cy="${y+h*.6}" r="1.4"/></g>`;
  if(families.has("ice"))fx+=`<path d="M${x+w*.82} ${y+4} v10 m-5 -5 h10 m-8 -3 l6 6 m0 -6 l-6 6" fill="none" stroke="#d9f5ff" stroke-width="1.3"/>`;
  if(families.has("arcane"))fx+=`<path d="M${x+w*.5} ${y+h*.4} l4 6 -4 6 -4 -6 Z" fill="none" stroke="${FAM.arcane}" stroke-width="1.7"/>`;
  if(families.has("holy"))fx+=`<path d="M${x+w*.2} ${y+h*.4} v8 m-4 -4 h8" fill="none" stroke="${FAM.holy}" stroke-width="1.6"/>`;
  if(families.has("poison"))fx+=`<path d="M${x+w*.25} ${y+h*.85} q-4 7 0 8 q4 -1 0 -8" fill="${FAM.poison}"/>`;
  if(families.has("swift"))fx+=`<path d="M${x+w*.12} ${y+h*.45} l-5 -3 m6 7 l-5 -1" fill="none" stroke="${FAM.swift}" stroke-width="1.5" stroke-linecap="round"/>`;
  if(Object.keys(it.traits).some(t=>TRAITS[t].f==="bad"))fx+=`<path d="M${x+w*.4} ${y+h*.3} l4 5 -3 4 5 5" fill="none" stroke="#b66d54" stroke-width="1.3"/>`;
  }
  const trim=it.legendary?"#f2a54a":c.light; // gear is never graded (only essences and basic materials are), so the trim is rarity's: gold for legendary, else the material's light tone
  return `<g class="hero-worn" data-hero-slot="${slot}" data-item="${esc(it.id)}" data-form="${it.form}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.light}"/><stop offset=".45" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient></defs>${draw(c,fill,trim)}${fx}</g>`;
}
function heroHeld(it,slot){
  if(!it)return"";
  const off=slot==="off",shield=grp(it)!=="weapon",pole=["spear","staff","warstaff","lance"].includes(it.form),claw=it.form==="claws";
  const dagger=it.noun==="Dagger"||baseIdOf(it.id)==="dagger";
  const x=off?170:70,y=173,scale=shield?1.45:pole?2.35:claw?1:dagger?1.1:1.65,grip=shield?32:pole?36:claw?40:49;
  // Reuse the actual inventory art: every form, material, grade and trait overlay stays in sync.
  const arc=(it.traits.Arcane||0)+(it.traits.Runic||0),shadow=(it.traits.Shadow||0)+(it.traits.Twilight||0);
  const rune=arc>=1.5?`<path d="M29 27 L32 23 L35 27 L32 31 Z M32 31 V36" fill="none" stroke="${FAM.arcane}" stroke-width="1.4"/>${["staff","warstaff"].includes(it.form)?`<circle cx="32" cy="17" r="4" fill="${FAM.arcane}"/><circle cx="31" cy="16" r="1.2" fill="#f1ddff"/>`:""}`:"";
  const mote=shadow>=1.5?`<path d="M38 25 q6 -5 2 -9 m-14 27 q-5 -3 -3 -7" fill="none" stroke="${FAM.shadow}" stroke-width="1.5"/>`:"";
  const svg=art(it).replace("<svg ",`<svg x="-32" y="-${grip}" width="64" height="64" overflow="visible" `).replace("</svg>",rune+mote+"</svg>");
  return `<g class="hero-held" data-hero-slot="${slot}" data-item="${esc(it.id)}" data-form="${it.form}" transform="translate(${x} ${y}) rotate(${off?shield?-8:18:pole?-9:-18}) scale(${scale})">${svg}</g>`;
}
function heroArt(g=heroGear()){
  const cape=heroColors(g.body),skin="#bd8e6d",edge="#17110e";
  const body=heroWorn("body",g.body,(c,f,trim)=>{
    const robe=g.body.form!=="bulwark"&&(baseIdOf(g.body.id)==="void_robe"||((g.body.traits.Shadow||0)+(g.body.traits.Arcane||0)>=3&&!Object.keys(g.body.traits).some(t=>["Iron","Stone","Heavy","Fur"].includes(t))));
    if(robe)return `<path d="M94 91 L81 111 L73 225 Q120 246 167 225 L159 111 L146 91 Z" fill="${f}" stroke="${edge}" stroke-width="2.5"/><path d="M120 99 V233 M98 103 L120 125 L142 103 M91 210 L94 160 M149 210 L146 160" fill="none" stroke="${trim}" stroke-width="2"/><path d="M86 149 Q120 160 154 149" fill="none" stroke="${c.dark}" stroke-width="6"/>`;
    const plate=["metal","stone"].includes(c.mat)||g.body.form==="bulwark";
    return `<path d="M94 91 L80 107 L86 161 L99 187 H141 L154 161 L160 107 L146 91 Z" fill="${f}" stroke="${edge}" stroke-width="2.5"/>${plate?`<path d="M84 109 L96 102 L105 119 L91 127 Z M156 109 L144 102 L135 119 L149 127 Z M100 130 L120 119 L140 130 L135 154 H105 Z M104 162 H136 L140 179 H100 Z" fill="${c.mid}" stroke="${trim}" stroke-width="1.5"/>`:`<path d="M100 100 L111 112 L100 141 L89 122 M140 100 L129 112 L140 141 L151 122 M120 110 V178" fill="none" stroke="${trim}" stroke-width="1.8"/>`}<path d="M91 154 H149 V164 H91 Z" fill="${c.dark}"/><rect x="115" y="154" width="10" height="10" rx="1" fill="none" stroke="#d5ad68" stroke-width="2"/>`;
  },[80,91,80,106]);
  const gloves=heroWorn("hands",g.hands,(c,f,trim)=>`<path d="M61 160 L78 163 L80 178 Q76 188 68 184 L60 179 Z M162 163 L179 160 L180 179 Q172 188 164 182 Z" fill="${f}" stroke="${edge}" stroke-width="2"/><path d="M62 166 L77 169 M163 169 L178 166 M64 173 L76 176 M164 176 L176 173" fill="none" stroke="${trim}" stroke-width="1.5"/>`,[[59,159,22,25],[160,159,22,25]]);
  const boots=heroWorn("feet",g.feet,(c,f,trim)=>`<path d="M97 222 H115 L114 247 L108 259 H85 Q84 250 94 247 Z M125 222 H143 L146 247 Q156 250 155 259 H132 L126 247 Z" fill="${f}" stroke="${edge}" stroke-width="2.5"/><path d="M96 228 H114 M126 228 H144 M95 236 L111 240 M129 240 L145 236 M87 255 H111 M129 255 H153" fill="none" stroke="${trim}" stroke-width="1.7"/>`,[[85,223,30,37],[125,223,30,37]]);
  const helm=heroWorn("head",g.head,(c,f,trim)=>{
    const soft=["hide","wood"].includes(c.mat);
    return soft?`<path d="M98 58 Q94 30 120 29 Q146 30 142 58 L134 49 H106 Z" fill="${f}" stroke="${edge}" stroke-width="2.5"/><path d="M99 47 Q120 38 141 47" fill="none" stroke="${trim}" stroke-width="4"/>`:`<path d="M97 55 Q94 27 120 25 Q146 27 143 55 L139 76 L129 71 V53 H111 V71 L101 76 Z" fill="${f}" stroke="${edge}" stroke-width="2.5"/><path d="M120 28 V47 M100 46 Q120 38 140 46 M104 57 V65 M136 57 V65" fill="none" stroke="${trim}" stroke-width="2"/>`;
  },[97,25,46,50]);
  const charm=heroWorn("charm",g.charm,(c,f,trim)=>{
    const base=baseIdOf(g.charm.id),pendant=base==="sprite_lantern"?`<path d="M114 120 H126 V135 H114 Z" fill="${f}" stroke="${trim}" stroke-width="1.5"/><path d="M120 123 V132" stroke="${FAM.holy}" stroke-width="3"/>`:base==="fang_charm"?`<path d="M115 120 L126 122 Q123 138 115 137 Q120 130 115 120" fill="${f}" stroke="${trim}"/>`:`<circle cx="120" cy="127" r="7" fill="${f}" stroke="${trim}" stroke-width="1.5"/><circle cx="120" cy="127" r="3" fill="${c.accent}"/>`;
    return `<path d="M105 93 Q105 112 120 123 Q135 112 135 93" fill="none" stroke="#bb955b" stroke-width="1.6"/>${pendant}`;
  },[111,116,18,22]);
  return `<svg class="hero-art" viewBox="0 0 240 290" aria-hidden="true"><ellipse cx="120" cy="265" rx="70" ry="9" fill="#070605" opacity=".65"/>
    <circle cx="120" cy="128" r="87" fill="none" stroke="#6d5134" stroke-width=".8" opacity=".5"/><path d="M120 28 V20 M120 224 V232 M24 128 H16 M216 128 H224" stroke="#9f784a" stroke-width="1.5"/>
    <g stroke="${edge}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M98 84 Q68 102 68 150 L58 234 Q85 244 93 230 L120 242 L148 230 Q157 244 182 234 L171 150 Q172 101 142 84 Z" fill="${shade(cape.mid,-.48)}"/><path d="M85 121 L74 221 M155 121 L166 221" fill="none" stroke="${shade(cape.mid,-.12)}" stroke-width="2"/>
    <path d="M94 175 L96 247 H114 L120 199 L126 247 H144 L146 175 Z" fill="#443a30"/><path d="M98 200 L107 217 M142 200 L133 217" stroke="#76634e" fill="none" stroke-width="1.5"/>
    <path d="M96 242 H114 V258 H88 Q86 250 96 249 Z M126 242 H144 V249 Q154 250 152 258 H126 Z" fill="#30271f"/>
    <path d="M96 91 Q81 91 77 112 L64 163 L79 169 L97 127 Z M144 91 Q159 91 163 112 L176 163 L161 169 L143 127 Z" fill="#6d5940"/>
    <path d="M97 94 L87 110 L94 154 L99 185 H141 L146 154 L153 110 L143 94 Z" fill="#8b7353"/><path d="M91 154 H149 V164 H91 Z" fill="#3c2a1d"/><rect x="115" y="154" width="10" height="10" fill="#bb955b"/>
    <path d="M108 76 V95 Q120 107 132 95 V76" fill="${skin}"/>
    <path d="M92 59 Q91 24 120 22 Q149 24 148 59 L140 85 Q120 96 100 85 Z" fill="#4b4236"/><path d="M102 47 Q120 34 138 47 L136 71 Q120 92 104 71 Z" fill="${skin}"/><path d="M103 45 Q111 34 127 38 L138 48 L138 37 Q118 22 103 37 Z" fill="#38251c"/>
    <path d="M107 57 H113 M127 57 H133" stroke="#2b201b" stroke-width="2"/><path d="M120 59 L117 67 H121 M115 74 Q120 77 125 74" fill="none" stroke="#80533e" stroke-width="1.5"/>
    </g>${boots}${body}${helm}${charm}${heroHeld(g.main,"main")}
    <g fill="${skin}" stroke="${edge}" stroke-width="2"><path d="M64 164 L77 167 L78 179 Q71 188 63 178 Z M163 167 L176 164 L177 178 Q169 188 162 179 Z"/></g>${gloves}${heroHeld(g.off,"off")}</svg>`;
}
// A separate silhouette stays readable on a 36px map tile; no tiny portrait squeezed down.
function heroMini(g=heroGear()){
  const c=heroColors(g.body),main=g.main,off=g.off,pole=main&&["staff","spear","warstaff","lance"].includes(main.form),shield=off&&grp(off)!=="weapon",a=main?heroColors(main).accent:"#bca78a";
  const held=main?pole?`<path d="M7 8 V29" stroke="${a}" stroke-width="2"/>${main.form==="staff"||main.form==="warstaff"?`<circle cx="7" cy="7" r="3" fill="${a}"/>`:`<path d="M7 2 L10 8 L7 10 L4 8 Z" fill="${a}"/>`}`:`<path d="M5 14 L9 10 L11 14 V24 H7 Z M5 23 H13" fill="${a}" stroke="#ead9bb" stroke-width="1"/>`:"";
  return `<svg class="hero-mini" viewBox="0 0 32 32" aria-hidden="true"><path d="M11 13 L7 29 L16 27 L25 29 L21 13 Z" fill="${shade(c.mid,-.25)}" stroke="#b8d4b8" stroke-width="1.2"/>
    <path d="M12 25 V30 M20 25 V30" stroke="${g.feet?heroColors(g.feet).light:"#bca78a"}" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 15 Q16 11 22 15 L21 25 H11 Z" fill="${g.body?c.mid:"#7cc4a6"}"/>
    <path d="M10 10 Q9 2 16 2 Q23 2 22 10 L21 13 H11 Z" fill="${g.head?heroColors(g.head).mid:"#5a5142"}" stroke="#e5d2b0" stroke-width="1"/><path d="M12 8 H20 V12 H12 Z" fill="#d1a27d"/><path d="M14 9 H18" stroke="#3d2b21"/>
    ${held}${off?shield?`<path d="M22 16 L29 18 V23 Q28 27 25 29 Q21 26 21 22 Z" fill="${heroColors(off).mid}" stroke="${heroColors(off).light}" stroke-width="1.3"/>`:`<path d="M26 14 V27 M23 23 H29" stroke="${heroColors(off).light}" stroke-width="2"/>`:""}</svg>`;
}

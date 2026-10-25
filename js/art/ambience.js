// ================= ART: CREATURES (ambience) =================
// per element: a = accent (patterns, background bloom, trims), e = eye and glow colour
const EL_FX={fire:{a:"#ffd04a",e:"#ffe08a"},ice:{a:"#effbff",e:"#d8f6ff"},poison:{a:"#d9f26a",e:"#e6ff7a"},holy:{a:"#fff6cf",e:"#fff2b8"},shadow:{a:"#ff5fa2",e:"#e8d0ff"},wood:{a:"#e8c86a",e:"#ffd36b"},
  metal:{a:"#7fd6e8",e:"#a6f2ff"},arcane:{a:"#7fe8ff",e:"#f2d6ff"},swift:{a:"#f4f27a",e:"#fffbb0"},stone:{a:"#e3a35f",e:"#ffb35c"},heal:{a:"#fff",e:"#ffd6e2"}};
const FLOATS={sprite:1,wraith:1,harpy:1,phoenix:1,archon:1,imp:1};
// a particle: class an (amb-rise, amb-fall, amb-tw, amb-drift), a random phase so the field never pulses in step
const an=(k,d,r)=>`class="${k}" style="animation-duration:${d}s;animation-delay:-${(r*d).toFixed(2)}s"`;
const pts=(R,n,f)=>{let s="";for(let i=0;i<n;i++)s+=f(i,R(),R(),R());return s};
const star4=(x,y,r)=>`M${P2(x,y-r)} Q${P2(x+r*.2,y-r*.2)} ${P2(x+r,y)} Q${P2(x+r*.2,y+r*.2)} ${P2(x,y+r)} Q${P2(x-r*.2,y+r*.2)} ${P2(x-r,y)} Q${P2(x-r*.2,y-r*.2)} ${P2(x,y-r)} Z`;
// element ambience: b behind the creature, f in front
const AMB={
  fire:(c,R)=>({b:`<ellipse cx="60" cy="110" rx="46" ry="12" fill="#ff6a1f" opacity=".22"/>`+pts(R,10,(i,x,y,z)=>`<circle ${an("amb-rise",2.4+z*2,y)} cx="${P2(8+x*104)}" cy="${P2(84+y*30)}" r="${P2(.8+z*1.8)}" fill="${z>.5?"#ffd04a":"#ff7a2a"}"/>`),
    f:pts(R,4,(i,x,y,z)=>`<circle ${an("amb-rise",2+z*1.5,x)} cx="${P2(10+x*100)}" cy="${P2(96+y*18)}" r="${P2(.8+z)}" fill="#fff0a0"/>`)}),
  ice:(c,R)=>({b:pts(R,9,(i,x,y,z)=>{const p=8+x*104,q=4+y*50,r=1.6+z*2;return `<path ${an("amb-fall",5+z*4,y)} d="M${P2(p-r,q)} H${P2(p+r)} M${P2(p,q-r)} V${P2(q+r)} M${P2(p-r*.7,q-r*.7)} L${P2(p+r*.7,q+r*.7)} M${P2(p+r*.7,q-r*.7)} L${P2(p-r*.7,q+r*.7)}" stroke="#effbff" stroke-width=".9" stroke-linecap="round" opacity=".85"/>`}),
    f:pts(R,3,(i,x,y,z)=>`<path ${an("amb-tw",1.6+z*2,y)} d="${star4(10+x*100,10+y*100,2.4)}" fill="#ffffff"/>`)}),
  poison:(c,R)=>({b:`<ellipse cx="60" cy="112" rx="44" ry="9" fill="#7fbf3a" opacity=".22"/>`+pts(R,9,(i,x,y,z)=>`<circle ${an("amb-rise",3+z*3,y)} cx="${P2(8+x*104)}" cy="${P2(80+y*34)}" r="${P2(1.4+z*2.6)}" fill="${c.a}" fill-opacity=".18" stroke="${c.a}" stroke-width=".9"/>`),f:""}),
  holy:(c,R)=>({b:`<g class="amb-spin" opacity=".16" fill="#fff6cf">${pts(R,8,i=>{const t=i*Math.PI/4,u=t+.12;return `<path d="M60 62 L${P2(60+Math.cos(t)*64,62+Math.sin(t)*64)} L${P2(60+Math.cos(u)*64,62+Math.sin(u)*64)} Z"/>`})}</g>`,
    f:pts(R,6,(i,x,y,z)=>`<path ${an("amb-tw",1.8+z*2,y)} d="${star4(8+x*104,8+y*104,1.8+z*2.2)}" fill="${z>.5?"#fffbe6":"#ffe58a"}"/>`)}),
  shadow:(c,R)=>({b:`<circle cx="60" cy="62" r="58" fill="url(#${c.id}v)"/>`+pts(R,6,(i,x,y,z)=>`<path ${an("amb-drift",4+z*3,y)} d="M${P2(10+x*90,16+y*92)} q8 -8 16 0 t16 0" stroke="${z>.5?"#a385dc":"#5a2f7c"}" stroke-width="${P2(1.4+z*1.4)}" fill="none" stroke-linecap="round" opacity=".7"/>`),
    f:pts(R,4,(i,x,y,z)=>`<circle ${an("amb-tw",2+z*2,y)} cx="${P2(8+x*104)}" cy="${P2(8+y*104)}" r="${P2(.8+z*1.2)}" fill="${c.a}"/>`)}),
  wood:(c,R)=>({b:pts(R,7,(i,x,y,z)=>{const p=10+x*100,q=2+y*40;return `<path ${an("amb-fall",6+z*4,y)} d="M${P2(p,q)} q4 -5 8 0 q-4 5 -8 0 Z" fill="${["#7fb35a","#c9a24a","#a7c95a"][i%3]}" stroke="#0d0a08" stroke-width=".6"/>`}),
    f:pts(R,4,(i,x,y,z)=>`<circle ${an("amb-tw",2+z*2,y)} cx="${P2(8+x*104)}" cy="${P2(8+y*104)}" r="${P2(.8+z)}" fill="#f6e7a6"/>`)}),
  metal:(c,R)=>({b:`<circle class="amb-spin" cx="60" cy="62" r="54" fill="none" stroke="${c.l}" stroke-width="5" stroke-dasharray="3 6" opacity=".12"/>`,
    f:pts(R,6,(i,x,y,z)=>{const p=8+x*104,q=8+y*104;return `<path ${an("amb-tw",1.2+z*1.6,y)} d="M${P2(p-3,q)} H${P2(p+3)} M${P2(p,q-3)} V${P2(q+3)}" stroke="#fff1b0" stroke-width="1.2" stroke-linecap="round"/>`})}),
  arcane:(c,R)=>({b:`<g class="amb-spin">${pts(R,6,(i,x,y,z)=>{const t=i*Math.PI/3,p=60+Math.cos(t)*52,q=62+Math.sin(t)*52;return `<path d="M${P2(p,q-4)} L${P2(p+3,q)} L${P2(p,q+4)} L${P2(p-3,q)} Z" fill="none" stroke="${c.a}" stroke-width="1.2" opacity=".7"/>`})}</g><circle cx="60" cy="62" r="52" fill="none" stroke="${c.a}" stroke-width=".8" stroke-dasharray="1 5" opacity=".5"/>`,
    f:pts(R,5,(i,x,y,z)=>`<path ${an("amb-tw",1.6+z*2,y)} d="${star4(8+x*104,8+y*104,1.6+z*2)}" fill="${z>.5?c.a:"#f2d6ff"}"/>`)}),
  swift:(c,R)=>({b:pts(R,7,(i,x,y,z)=>`<path ${an("amb-drift",1.8+z*1.6,y)} d="M${P2(6+x*80,10+y*100)} h${P2(14+z*18)}" stroke="${z>.4?"#c9fff0":c.a}" stroke-width="${P2(1+z)}" stroke-linecap="round" opacity=".75"/>`),
    f:`<path class="flick" d="M106 8 L100 20 H105 L99 32" stroke="${c.a}" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".9"/>`}),
  stone:(c,R)=>({b:`<ellipse cx="60" cy="112" rx="44" ry="8" fill="#6f655b" opacity=".3"/>`+pts(R,7,(i,x,y,z)=>`<path ${an("amb-fall",5+z*4,y)} d="M${P2(10+x*100,2+y*40)} l2.4 -1.2 2 1.6 -1 2.2 -2.6 .2 Z" fill="${z>.5?"#b9ad98":"#8a8070"}" stroke="#0d0a08" stroke-width=".6"/>`),f:""}),
  heal:(c,R)=>({b:"",f:""})
};

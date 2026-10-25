// ================= ART: CREATURES (patterns) =================
// patterns for composed bodies (ENEMIES[id].art.pat), drawn over the whole frame and masked to the silhouette
const PAT={
  stripes:c=>{let s="";for(let x=-6;x<126;x+=13)s+=`M${x} 0 q-7 30 0 60 t0 60 `;return `<path d="${s}" stroke="${c.p}" stroke-width="4.5" fill="none"/>`},
  spots:(c,R)=>pts(R,26,(i,x,y,z)=>`<circle cx="${P2(4+x*112)}" cy="${P2(8+y*108)}" r="${P2(1.4+z*3)}" fill="${c.p}"/>`),
  scales:c=>{let s="";for(let y=6,r=0;y<120;y+=7,r++)for(let x=(r%2)*4-4;x<124;x+=8)s+=`M${x} ${y} q4 4 8 0 `;return `<path d="${s}" stroke="${c.p}" stroke-width="1.3" fill="none"/>`},
  cracks:(c,R)=>`<g filter="url(#${c.id}e)">${pts(R,7,(i,x,y,z)=>{let p=8+x*104,q=10+y*96,d=`M${P2(p,q)}`;for(let k=0;k<4;k++){p+=(R()-.5)*20;q+=6+R()*8;d+=` L${P2(p,q)}`}return `<path class="amb-glow" d="${d}" stroke="${c.p}" stroke-width="${P2(1.2+z)}" fill="none" stroke-linejoin="round"/>`})}</g>`,
  stars:(c,R)=>pts(R,30,(i,x,y,z)=>z>.85?`<path ${an("amb-tw",1.6+z*2,y)} d="${star4(4+x*112,6+y*110,2.6)}" fill="#fff"/>`:`<circle cx="${P2(4+x*112)}" cy="${P2(6+y*110)}" r="${P2(.5+z*1.1)}" fill="${z>.5?"#fff":c.p}"/>`),
  rot:(c,R)=>pts(R,12,(i,x,y,z)=>`<ellipse cx="${P2(8+x*104)}" cy="${P2(10+y*104)}" rx="${P2(3+z*5)}" ry="${P2(2+z*3)}" fill="${z>.6?"#1a120c":c.p}" transform="rotate(${Math.round(x*180)} ${P2(8+x*104,10+y*104)})"/>`),
  facets:(c,R)=>`<path d="${pts(R,14,(i,x,y,z)=>{const p=6+x*108,q=6+y*108;return `M${P2(p,q)} L${P2(p+8+z*10,q+4)} L${P2(p+3,q+10+z*8)} Z `})}" fill="${c.p}" fill-opacity=".3" stroke="${c.p}" stroke-width="1"/>`,
  bands:c=>{let s="";for(let y=14;y<120;y+=14)s+=`<rect x="0" y="${y}" width="120" height="3" fill="${c.p}"/><rect x="0" y="${y+3}" width="120" height="1.2" fill="#0d0a08" opacity=".4"/>`;return s},
  swirl:c=>`<path d="M60 62 m-34 0 a34 34 0 1 1 34 34 a24 24 0 1 1 -24 -24 a14 14 0 1 1 14 14 a6 6 0 1 1 -6 -6" stroke="${c.p}" stroke-width="2.6" fill="none"/>`
};

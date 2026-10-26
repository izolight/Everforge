// ================= ART: COLOUR =================
// ---- colour: hex <-> hsl, so a palette can shift hue as well as lightness
function toHsl(x){const n=parseInt(x.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,s,l]}
function fromHsl(h,s,l){s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return "#"+((1<<24)+(f(0)<<16)+(f(8)<<8)+f(4)).toString(16).slice(1)}
const tint=(x,dh,ds=0,dl=0)=>{const[h,s,l]=toHsl(x);return fromHsl((h+dh+360)%360,s+ds,l+dl)};
// ---- CIE Lab and the colour difference (dE76): tools/color-check.js and the biome accent fallback use them
const lab=x=>{const n=parseInt(x.slice(1),16),f=v=>{v/=255;return (v>.04045?((v+.055)/1.055)**2.4:v/12.92)*100},r=f(n>>16),g=f(n>>8&255),b=f(n&255),
  X=(r*.4124+g*.3576+b*.1805)/95.047,Y=(r*.2126+g*.7152+b*.0722)/100,Z=(r*.0193+g*.1192+b*.9505)/108.883,q=t=>t>.008856?Math.cbrt(t):7.787*t+16/116,
  fx=q(X),fy=q(Y),fz=q(Z);return[116*fy-16,500*(fx-fy),200*(fy-fz)]};
const dE=(a,b)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])};
// ---- element palette: each element's hue at a light, mid and dark lightness (light and dark are the mid +/-12 L*, chroma kept or raised; shadow's dark is lifted to stay indigo); a generated creature rolls one of the three as its body (the mids are the colour checks' reference)
const ELPAL={fire:["#ff5f3f","#e0452b","#ba1e0e"],stone:["#d6984f","#b07a3a","#8e5c1d"],holy:["#ffea5d","#f2c94c","#cea829"],poison:["#d4fc4a","#b5d83a","#93b70a"],
  wood:["#57bc61","#3f9a4a","#177a2d"],swift:["#53f4d0","#3fd0b0","#00ae90"],ice:["#baffff","#9fe0ff","#7dbfdd"],shadow:["#5d55b2","#3f3a8a","#2b2a77"],
  arcane:["#d864fc","#b04ad0","#8e27af"],metal:["#b9c5d2","#9aa4b0","#7b8590"]};

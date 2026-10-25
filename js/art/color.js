// ================= ART: COLOUR =================
// ---- colour: hex <-> hsl, so a palette can shift hue as well as lightness
function toHsl(x){const n=parseInt(x.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,s,l]}
function fromHsl(h,s,l){s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return "#"+((1<<24)+(f(0)<<16)+(f(8)<<8)+f(4)).toString(16).slice(1)}
const tint=(x,dh,ds=0,dl=0)=>{const[h,s,l]=toHsl(x);return fromHsl((h+dh+360)%360,s+ds,l+dl)};

// ================= ART: GEOMETRY HELPERS =================
// Small helpers the drawing code shares: mirror a shape, round coordinates.
const mir=(x,f)=>f(1,x)+f(-1,x),P2=(...n)=>n.map(v=>+v.toFixed(1)).join(" ");

// Loads the art3d modules into Node (same files, same order as art3d/index.html) and writes PNGs.
// No browser needed: the renderer and compositor are pure JS.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),zlib=require("node:zlib");
const ART=path.resolve(__dirname,"..","art3d");
function scripts(){const html=fs.readFileSync(path.join(ART,"index.html"),"utf8");return[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1])}
// Runs in this process's own global context: a vm sandbox would route every global lookup (Math, ...)
// through a slow proxy and make rendering several times slower. Loads once per process.
function load(){
  if(globalThis.H3&&globalThis.H3.hero)return globalThis.H3;
  for(const s of scripts())vm.runInThisContext(fs.readFileSync(path.join(ART,s),"utf8"),{filename:"art3d/"+s});
  return globalThis.H3;
}
// ---------- PNG ----------
const CRC=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c}return t})();
const crc=b=>{let c=-1;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return(c^-1)>>>0};
function chunk(type,data){const l=Buffer.alloc(4);l.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]),c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])}
function png(W,H,rgba){
  const raw=Buffer.alloc((W*4+1)*H),src=Buffer.from(rgba.buffer,rgba.byteOffset,rgba.byteLength);
  for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;src.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4)}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",zlib.deflateSync(raw,{level:6})),chunk("IEND",Buffer.alloc(0))]);
}
// grid of equally sized frames -> one image (with a thin gutter)
function sheet(frames,cols,gap){
  gap=gap==null?4:gap;const w=frames[0].W,h=frames[0].H,rows=Math.ceil(frames.length/cols),W=cols*w+(cols-1)*gap,H=rows*h+(rows-1)*gap;
  const out=new Uint8ClampedArray(W*H*4);for(let i=0;i<out.length;i+=4){out[i]=10;out[i+1]=9;out[i+2]=8;out[i+3]=255}
  frames.forEach((f,k)=>{const ox=(k%cols)*(w+gap),oy=Math.floor(k/cols)*(h+gap);
    for(let y=0;y<h;y++)out.set(f.rgba.subarray(y*w*4,(y+1)*w*4),((oy+y)*W+ox)*4)});
  return{W,H,rgba:out};
}
const write=(file,img)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,png(img.W,img.H,img.rgba))};
module.exports={load,png,sheet,write,scripts,ART};

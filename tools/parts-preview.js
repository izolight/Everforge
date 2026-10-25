// Renders every biome pool part on every body of that biome and writes a PNG sheet.
// Run: node tools/parts-preview.js [out.png]   (default: out/parts-preview.png, out/ is git-ignored)
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
(async()=>{
  const out=process.argv[2]||path.join(__dirname,"..","out","parts-preview.png");fs.mkdirSync(path.dirname(out),{recursive:true});
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1});
  const errs=[];
  p.on("pageerror",e=>errs.push(String(e)));
  await p.goto("file://"+path.join(__dirname,"..","index.html"));
  await p.waitForTimeout(1200);
  const n=await p.evaluate(()=>{
    const host=document.createElement("div");
    host.id="ppv";host.style.cssText="position:absolute;left:0;top:0;z-index:99999;background:#141018;padding:8px;font:11px system-ui;color:#ddd";
    document.body.appendChild(host);
    let count=0;
    for(const [bn,B] of Object.entries(BIOMES)){
      const h=document.createElement("div");h.style.cssText="margin:6px 0 2px;font-size:13px;color:#ffd36b";
      h.textContent=bn+" ("+B.parts.join(", ")+")";host.appendChild(h);
      const rows=[];
      for(const body of B.bodies){
        const row=document.createElement("div");row.style.cssText="display:flex;gap:4px;align-items:center;margin-bottom:4px";
        const lab=document.createElement("div");lab.style.cssText="width:70px;color:#9a9";lab.textContent=body;row.appendChild(lab);
        for(const part of B.parts){
          const id="pp_"+bn+"_"+body+"_"+part;
          ENEMIES[id]={el:B.els[0],art:{b:body,p:[part],c:B.cols[0],a:B.cols[1],pat:B.pats[0],po:.5,skin:B.skins[0],glow:false}};
          const cell=document.createElement("div");
          cell.style.cssText="width:96px;height:96px;background:#1c1720;border:1px solid #332c3a;border-radius:8px;position:relative";
          cell.innerHTML=portrait(id,{lite:true});
          cell.firstElementChild.style.cssText="width:96px;height:96px";
          const cap=document.createElement("div");cap.style.cssText="position:absolute;left:2px;bottom:1px;font-size:9px;color:#bbb;text-shadow:0 0 3px #000";
          cap.textContent=part;cell.appendChild(cap);
          row.appendChild(cell);count++;
        }
        rows.push(row);
      }
      rows.forEach(r=>host.appendChild(r));
    }
    return count;
  });
  const el=await p.$("#ppv");
  await el.screenshot({path:out});
  console.log("rendered",n,"creatures ->",out,errs.length?("page errors: "+errs.join(" | ")):"no page errors");
  await b.close();
})();

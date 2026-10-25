// Renders the head-slot combinations the new pools can produce (hood/halo with horns, antlers, crown).
// Run: node tools/parts-combos.js [out.png]   (default: out/parts-combos.png, out/ is git-ignored)
const {chromium}=require("playwright"),fs=require("fs"),path=require("path");
(async()=>{
  const out=process.argv[3]||process.argv[2]||path.join(__dirname,"..","out","parts-combos.png");fs.mkdirSync(path.dirname(out),{recursive:true});
  const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:900}});
  const errs=[];p.on("pageerror",e=>errs.push(String(e)));
  await p.goto("file://"+path.join(__dirname,"..","index.html"));
  await p.waitForTimeout(1200);
  const COMBOS=[
    ["tundra",["hood","horns"]],["tundra",["hood","antlers"]],["tundra",["hood","horns","antlers"]],
    ["bone",["hood","horns"]],["bone",["hood","antlers"]],["bone",["hood","crown"]],
    ["forest",["hood","horns"]],["forest",["hood","wings"]],["forest",["hood","shell"]],
    ["fen",["hood","antlers"]],["ash",["hood","crystals"]],["ash",["hood","wings"]],
    ["ember",["wings","shell"]],["ember",["runes","wings"]],["astral",["mane","armor"]],
    ["astral",["chains","mane"]],["deep",["shell","spikes"]],["deep",["hood","chains"]]];
  const n=await p.evaluate(COMBOS=>{
    const host=document.createElement("div");
    host.id="ppv";host.style.cssText="position:absolute;left:0;top:0;z-index:99999;background:#141018;padding:8px;font:12px system-ui;color:#ddd";
    document.body.appendChild(host);
    let count=0;
    for(const [bn,parts] of COMBOS){
      const B=BIOMES[bn];
      const h=document.createElement("div");h.style.cssText="margin:6px 0 2px;color:#ffd36b";
      h.textContent=bn+" · "+parts.join("+");host.appendChild(h);
      const row=document.createElement("div");row.style.cssText="display:flex;gap:4px";
      for(const body of B.bodies){
        const id="pc_"+bn+"_"+body+"_"+parts.join("_");
        ENEMIES[id]={el:B.els[0],art:{b:body,p:parts,c:B.cols[0],a:B.cols[1],pat:B.pats[0],po:.5,skin:B.skins[0],glow:false}};
        const cell=document.createElement("div");
        cell.style.cssText="width:96px;height:96px;background:#1c1720;border:1px solid #332c3a;border-radius:8px;position:relative";
        cell.innerHTML=portrait(id,{lite:true});
        cell.firstElementChild.style.cssText="width:96px;height:96px";
        const cap=document.createElement("div");cap.style.cssText="position:absolute;left:2px;bottom:1px;font-size:9px;color:#bbb;text-shadow:0 0 3px #000";
        cap.textContent=body;cell.appendChild(cap);
        row.appendChild(cell);count++;
      }
      host.appendChild(row);
    }
    return count;
  },COMBOS);
  await (await p.$("#ppv")).screenshot({path:out});
  console.log("rendered",n,"combo creatures ->",out,errs.length?("page errors: "+errs.join(" | ")):"no page errors");
  await b.close();
})();

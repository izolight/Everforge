#!/usr/bin/env node
// Translation coverage check (js/i18n.js, js/lang/*.js). English is the source text: every tx()/txn() key in the code, every data string the game displays through tx(),
// every static [data-t] / [data-ta] in index.html and every contextual word (trait, adjective, noun, family, form, kind, enemy hit line) needs an entry in each language dictionary.
// Also checks that a translation keeps the placeholders of its key, that plural pairs have both forms, and that no dictionary entry is dead (unused).
// Usage: node tools/i18n-check.js [--tour]   (--tour also plays a scripted tour of every screen in each language and reports any key that was looked up and missing; needs Playwright)
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),LANGS=["de","ko"];
let fails=0;const unusedList=[];const bad=m=>{fails++;console.error("FAIL: "+m)};

// ---- load the dictionaries the way the browser does
const DICT={};
const sandbox={DICT};
for(const l of LANGS){
  // in index.html's <script> order (de.js before de-data.js), so a key defined twice resolves as it does in the game
  for(const f of [...fs.readFileSync(path.join(ROOT,"index.html"),"utf8").matchAll(/src="js\/lang\/([^"]+)"/g)].map(m=>m[1]).filter(f=>f.startsWith(l))){
    new Function("DICT",fs.readFileSync(path.join(ROOT,"js","lang",f),"utf8"))(sandbox.DICT);
  }
}

// ---- keys used by the code: the first argument of tx()/txn() (also each branch of a ternary), by a small tokenizer
function literals(expr){ // the string literals that ARE the key: the whole expression, or a branch of a top-level ternary
  expr=expr.trim();
  const m=/^"((?:[^"\\]|\\.)*)"$/.exec(expr);if(m)return[JSON.parse('"'+m[1]+'"')];
  const sq=/^'((?:[^'\\]|\\.)*)'$/.exec(expr);if(sq)return[sq[1].replace(/\\(.)/g,"$1")];
  const b=/^`([^`$]*)`$/.exec(expr);if(b)return[b[1]];
  let d=0,q=null,qi=-1,ci=-1;
  for(let i=0;i<expr.length;i++){const c=expr[i];
    if(q){if(c==="\\"){i++;continue}if(c===q)q=null;continue}
    if(c==='"'||c==="'"||c==="`"){q=c;continue}
    if("([{".includes(c))d++;else if(")]}".includes(c))d--;
    else if(d===0&&c==="?"&&qi<0)qi=i;
    else if(d===0&&c===":"&&qi>=0&&ci<0)ci=i}
  if(qi>=0&&ci>qi)return[...literals(expr.slice(qi+1,ci)),...literals(expr.slice(ci+1))];
  return[];
}
function args(src,i){ // the top-level arguments of the call whose "(" is at src[i]
  const out=[];let d=0,q=null,s=i+1;
  for(let k=i+1;k<src.length;k++){const c=src[k];
    if(q){if(c==="\\"){k++;continue}if(c===q)q=null;continue}
    if(c==='"'||c==="'"||c==="`"){q=c;continue}
    if("([{".includes(c))d++;
    else if(")]}".includes(c)){if(d===0){out.push(src.slice(s,k));return out}d--}
    else if(c===","&&d===0){out.push(src.slice(s,k));s=k+1}}
  return out;
}
const used=new Map(); // key -> where
const note=(k,where)=>{if(!used.has(k))used.set(k,where)};
const plural=new Set();
// every .js under js/ (the art lives in js/art/), except the dictionaries in js/lang and i18n.js itself
function jsFiles(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.isDirectory()){if(e.name!=="lang")out.push(...jsFiles(path.join(dir,e.name)))}
  else if(e.name.endsWith(".js")&&e.name!=="i18n.js")out.push(path.join(dir,e.name))}return out}
for(const f of jsFiles(path.join(ROOT,"js"))){
  const src=fs.readFileSync(f,"utf8"),re=/(?<![\w$.])(tx|txn)\(/g;let m;
  while((m=re.exec(src))){
    const a=args(src,m.index+m[0].length-1);
    literals(a[0]||"").forEach(k=>note(k,f));
    if(m[1]==="txn")literals(a[0]).forEach(k=>plural.add(k))}
}
// ---- static markup
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const unent=s=>s.replace(/&#10;/g,"\n").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
for(const m of html.matchAll(/<([a-z0-9]+)\b([^>]*\bdata-t(?![\w-])(?:=("[^"]*"))?[^>]*)>([\s\S]*?)<\/\1>/g)){
  const key=m[3]?m[3].slice(1,-1):m[4].trim();note(key,"index.html")}
for(const m of html.matchAll(/<[a-z0-9]+\b[^>]*\bdata-ta="([^"]*)"[^>]*>/g)){
  for(const a of m[1].split(" ")){const v=new RegExp("\\b"+a+'="([^"]*)"').exec(m[0]);if(v)note(unent(v[1]),"index.html")}}

// ---- data the game shows through tx()/txc() with a dynamic key: read it from the running game
function dataKeys(G){
  const k=new Set(),add=(...s)=>s.forEach(x=>{if(x)k.add(x)}),ctx=new Set();
  Object.values(G.ENEMIES).forEach(E=>{
    if(E.gen){if(E.alpha)add(E.name);if(E.sp)add(E.sp.name,E.sp.tell);ctx.add("hit|"+E.verb);return} // generated names are checked through token dictionaries; generated lore stays outside this finite check
    add(E.name,E.plural,E.short,E.intro,E.lore);if(E.sp)add(E.sp.name,E.sp.tell);ctx.add("hit|"+E.verb);
    if(E.phase){add(E.phase.label,E.phase.msg);if(E.phase.to.sp)add(E.phase.to.sp.name,E.phase.to.sp.tell);if(E.phase.to.verb)ctx.add("hit|"+E.phase.to.verb)}});
  G.BASE.forEach(b=>add(b));Object.values(G.SECRETS).forEach(s=>add(s.name,s.hint));
  G.TUTORIAL.forEach(t=>add(t.text,t.wait));G.ZONES.forEach(z=>add(z[1]));add("Anywhere");
  G.UNLOCKS.forEach(u=>{add(u.name,u.txt,u.w);if(u.i)add(u.i.t,...u.i.l)});
  G.GRADES.forEach(g=>add(g[0]));G.RARITY.forEach(r=>add(r[0]));add("Legendary");Object.values(G.LV_PERK).forEach(v=>add(v));add("Your mixtures grow steadier.");
  Object.values(G.RES_MSG).forEach(v=>add(v));Object.values(G.INF_MSG).forEach(v=>add(v));
  G.SLOTS.forEach(s=>add(s[1]));G.TABS.forEach(t=>add(t[1]));G.VIEWS.forEach(v=>add(v[0].toUpperCase()+v.slice(1)));
  G.RIDDLES.forEach(r=>add(r[0],r[1],...r[2]));["Off","Low","Medium","High"].forEach(v=>add(v));
  Object.values(G.AFX).forEach(a=>add(a.n,a.ti));
  G.TECHS.forEach(t=>add(t.name,t.d,t.gate,t.rq));Object.values(G.VAGUE).forEach(v=>add(v));add("something");
  G.traits.forEach(t=>{ctx.add("trait|"+t);ctx.add("adj|"+t)});ctx.add("trait|Weakened");
  G.nouns.forEach(n=>{ctx.add("noun|"+n);ctx.add("gender|"+n)});
  G.procPrefixes.forEach(x=>ctx.add("proc-prefix|"+x));G.procNouns.forEach(x=>{ctx.add("proc-noun|"+x);ctx.add("gender|"+x)});
  G.fams.forEach(f=>ctx.add("fam|"+f));G.forms.forEach(f=>ctx.add("form|"+f));G.kinds.forEach(f=>ctx.add("kind|"+f));
  return{keys:k,ctx};
}

(async()=>{
  const {chromium}=require("playwright"),URL="file://"+path.join(ROOT,"index.html");
  const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>typeof S==="object"&&S);
  const G=await page.evaluate(()=>({
    ENEMIES,BASE:Object.values(BASE).map(b=>b[0]),SECRETS,TUTORIAL:TUTORIAL.map(t=>({text:t.text,wait:t.wait})),ZONES,UNLOCKS:UNLOCKS.map(u=>({name:u.name,txt:u.txt,w:u.w,i:u.i&&{t:u.i.t,l:u.i.l}})),
    TECHS:TECHS.map(t=>({name:t.name,d:t.d,gate:t.gate,rq:t.rq})),VAGUE,
    GRADES,RARITY,LV_PERK,RES_MSG,INF_MSG,SLOTS,TABS,VIEWS,RIDDLES,AFX:Object.fromEntries(Object.entries(AFX).map(([k,a])=>[k,{n:a.n,ti:a.ti}])),
    traits:Object.keys(TRAITS),fams:[...Object.keys(FAM)],forms:[...new Set(Object.values(FORMS).map(f=>f.label))],
    nouns:[...new Set([...Object.values(BASE).map(b=>b[0].split(" ").pop()),...Object.values(FORMS).map(f=>f.noun).filter(Boolean),"Essence"])],
    procPrefixes:[...new Set(Object.values(BIOMES).flatMap(b=>b.pre.map(x=>x[0].toUpperCase()+x.slice(1))))],procNouns:[...new Set([...Object.values(BIOMES).flatMap(b=>b.suf),...Object.values(BODY_NOUNS).flat()])],
    kinds:["Ore","Hide","Herb","Essence","Relic","Food","Potion",...Object.values(KIND_LABEL)]}));
  const D=dataKeys(G);D.keys.forEach(k=>note(k,"data"));
  // getters and functions (HEAT, DAILY_TWISTS, ABILITIES, STATUS, SKILLS, STAT_NAMES, RARITIES, NODE_INFO, AFX descriptions) report their misses when read in a language
  const tourKeys={};
  for(const l of LANGS){
    await page.evaluate(l=>{LANG=l;window.__miss=new Set();
      const touch=o=>Object.values(o).forEach(v=>{if(v&&typeof v==="object")Object.values(v).forEach(x=>{typeof x==="function"&&x.length===0?x():x})});
      [HEAT,DAILY_TWISTS,ABILITIES,STATUS,SKILLS,RARITIES,NODE_INFO,STAT_NAMES].forEach(o=>(Array.isArray(o)?o:Object.values(o)).forEach(v=>{if(v&&typeof v==="object")Object.keys(v).forEach(k=>v[k])}));
      Object.values(AFX).forEach(a=>a.d());Object.keys(STAT_NAMES).forEach(k=>STAT_NAMES[k]);elTxt("Fire");
    },l);
    tourKeys[l]=new Set((await page.evaluate(()=>[...window.__miss].filter(k=>!(typeof PROC!=="undefined"&&PROC.has(k)))))); // a procedural creature's own strings stay English
  }
  // ---- a scripted tour of every screen
  if(process.argv.includes("--tour")){
    for(const l of LANGS){
      await page.evaluate(l=>{localStorage.setItem("everforge-lang",l)},l);await page.reload();await page.waitForFunction(()=>typeof S==="object"&&S);
      await page.evaluate(async()=>{
        window.__miss=new Set();window.__txt=new Set();
        const proc=(typeof PROC!=="undefined"?PROC:new Set()); // a procedural creature's own strings stay English
        const hit=t=>{for(const p of proc)if(p&&t.includes(p))return true;return false};
        const grab=()=>{document.querySelectorAll("body *").forEach(e=>{if(e.id==="embers"||e.closest("svg"))return;
            if(!e.children.length&&e.textContent.trim()&&!hit(e.textContent.trim()))window.__txt.add(e.textContent.trim());
            ["data-tip","aria-label","placeholder"].forEach(a=>{const v=e.getAttribute(a);if(v)v.split("\n").forEach(x=>{if(!hit(x))window.__txt.add(x)})})})};
        const r0=render;render=function(f){r0(f);grab()};const t0=toast;toast=function(m,l){window.__txt.add(m);return t0(m,l)};
        S.unl=Object.fromEntries(UNLOCKS.map((u,i)=>[u.id,i+1]));UNLOCKS.forEach(u=>S.seen["i:"+u.id]=false);S.quest=TUTORIAL.length;S.embers=500;S.xp=5000;S.unlocked=ZONES.map(z=>z[0]);S.camp=3;
        ZONES.forEach(z=>S.heat[z[0]]={max:5,sel:2});Object.keys(ENEMIES).forEach(id=>{S.seen[id]=true;S.kills[id]=2;S.codex[id]={weak:[...ENEMIES[id].weak],resist:[...ENEMIES[id].resist],sp:true,sp2:true,ph:true,stats:true,inf:["burn","chill","poison","curse"],drops:ENEMIES[id].drops.map(d=>d[0])}});
        Object.keys(AFX).forEach(a=>S.afx[a]={s:2,b:1});S.stats.big=40;S.stats.bigW="iron_sword";S.stats.heatBest={woods:1};S.stats.fast={gnarlhorn:5};S.stats.dBest={rows:3,boss:false,turns:30};S.hints=[0,1,2,3,3,3,4];
        const sleep=ms=>new Promise(r=>setTimeout(r,ms)),tryit=f=>{try{f()}catch(e){window.__tourErr=(window.__tourErr||"")+e.message+"; "}};
        // every base item and a crafted one: sheets, tips, effects
        Object.keys(BASE).forEach(id=>{addItem(id);if(gradable(id))[1,2,4,5].forEach(g=>addItem(gradedItem(id,g)))});
        ESS_POOL.concat(["Radiant","Tempered","Frost","Steam","Lure","Runic","Heavy"]).forEach(t=>{[1,3,5].forEach(g=>addItem(essG(t,g)))});
        const c=combine([S.items.iron_sword,S.items.chili,S.items.holy_water].map(x=>x),{roll:100});
        ["Weakened","Cursed"].forEach((m,i)=>{const it={...c.item,id:"t_m"+i,crafted:true,mishap:m==="Weakened"?m:undefined,traits:{...c.item.traits,[m==="Cursed"?"Cursed":"Fire"]:2},unweak:m==="Weakened"?{...c.item.traits}:undefined,recipeIds:["iron_sword","chili","holy_water"]};S.items[it.id]=it;addItem(it.id)});
        S.items[c.item.id]=c.item;addItem(c.item.id);S.journal.push({id:c.item.id,name:c.item.name});SECRETS.forEach((s,i)=>{const id="t_s"+i;S.items[id]={...c.item,id,name:s.name,legendary:true};S.journal.push({id,name:s.name,legendary:true})});
        S.knownR=REACTIONS.slice(0,4).map(r=>r[0]+"+"+r[1]);
        for(const v of VIEWS){go(v);render()}
        go("gear");for(const id of Object.keys(S.inv)){tryit(()=>openSheet(id,false,false));closeSheet()}
        go("forge");S.bench=["iron_sword","chili"];render();S.bench=["iron_sword","holy_water","phoenix"];render();S.bench=["iron_sword","boar_hide"];render();S.bench=[];
        // forge results: clean, mishap, fizzle
        [100,0,2].forEach(r=>{const it=[S.items.iron_sword,S.items.chili];const cc=combine(it,{roll:r,full:true});S.last={id:cc.fizzle?null:cc.item.id,item:cc.item,log:cc.log,inst:cc.inst,mishap:cc.mishap,fizzle:cc.fizzle,refund:3,isNew:true,xpGain:10,sx:{weapon:3},scaled:true,baseId:"iron_sword",recipe:["a"],recipeIds:["iron_sword","chili"]};if(!cc.fizzle)S.items[cc.item.id]=cc.item;render(true)});
        // recipes, codex, stats, guide
        for(const t of TABS.map(t=>t[0])){S.rtab=t;go("recipes")}
        go("codex");document.querySelectorAll("#statsd,#saved").forEach(d=>d.open=true);render();for(const id of Object.keys(ENEMIES)){tryit(()=>openCodex(id));closeSheet()}
        // battles: every enemy with a rare affix mix, the actions, the aftermath
        go("battle");const ids=Object.keys(ENEMIES),afx=Object.keys(AFX);
        for(let i=0;i<ids.length;i++){
          S.battle=null;S.event=null;S.hp=pstats().maxHp;S.run=null;
          tryit(()=>startBattle(ids[i],{row:2,rar:i%2?"rare":"magic",afx:[afx[i%afx.length],afx[(i+5)%afx.length]].filter((a,k,arr)=>k===0||afxOk(arr[0],a)),ambush:i%3===0}));
          for(let k=0;k<25&&S.battle&&!S.battle.over;k++){S.hp=pstats().maxHp;const B=S.battle;B.turn=k%2?B.turn:3;
            tryit(()=>{const r=k%6;if(r===0)attack();else if(r===1)guard();else if(r===2)parry();else if(r===3)study();else if(r===4){const ab=abKeys(pstats())[0];ab?ability(ab):attack()}else{S.inv.spring_water=1;useItem("spring_water")}});
            render()}
          if(S.battle&&!S.battle.over){S.battle.hp=0;tryit(()=>enemyDown());render()}
          else if(S.battle){render()}
        }
        S.battle=null;S.hp=1;tryit(()=>startBattle("boar",{row:2}));tryit(()=>{S.battle.hp=999;S.hp=1;enemyTurn();enemyTurn()});render();
        // heat panel, daily card, flee
        S.battle=null;S.event=null;heatOpen=true;render();heatOpen=false;S.daily=null;render();
        tryit(()=>{startBattle("wolf",{row:1});flee();flee();flee()});S.battle=null;
        // events: every encounter, the peddler (with an offer), chests, camps
        for(const t of Object.keys(ENC)){for(const hl of[0,5]){S.event=null;tryit(()=>{S.event=ENC[t].make([.1,.3,.5,.7,.2,.4,.6,.8],hl);render();for(const ch of S.event.choices.map(c=>c[0])){const save=JSON.stringify(S);tryit(()=>{if(ch==="leave")return;ENC[t].pick(ch,JSON.parse(JSON.stringify(S.event)));render()});S=JSON.parse(save)}})}}
        S.event=null;tryit(()=>{S.event=merchant();render();eventChoice("trade");render()});
        ["pack","chest","camp"].forEach(t=>{S.event=null;S.battle=null;const m=curMap(),nd={t,x:m.pos.x,y:m.pos.y,done:false,r:2,my:t};tryit(()=>{m.pois.push(nd);enter(nd);render();const cs=(S.event&&S.event.choices.map(c=>c[0]))||[];cs.forEach(c=>{const save=JSON.stringify(S);tryit(()=>{eventChoice(c);render()});S=JSON.parse(save)})})});
        S.event=null;S.battle=null;
        // map: torch out, steps, ambushes
        tryit(()=>{const m=curMap();m.torch=0;m.amb=true;mlog(m,"x");render()});
        // forging, upgrade, reforge toasts
        tryit(()=>{S.embers=500;[1,2].forEach(g=>{for(let i=0;i<3;i++)addItem(essG("Fire",g));upgrade(essG("Fire",g))})});
        tryit(()=>{reforge("t_m1")});tryit(()=>{infuse(infusable()[0])});tryit(()=>{rest()});tryit(()=>{abandonDaily()});
        for(let i=0;i<6;i++)tryit(()=>giveHint());
        tryit(()=>{S.quest=0;for(let i=0;i<TUTORIAL.length;i++){S.quest=i;goal();renderGoal()}S.quest=TUTORIAL.length;S.bounty=null;goal();S.bounty={kind:"forge",need:2,base:0,reward:{items:["ess:Fire"],xp:20,camp:1,hint:1}};renderGoal();S.bounty={kind:"hunt",enemy:"boar",need:3,base:0,reward:{items:["ess:Fire"],xp:20}};renderGoal()});
        tryit(()=>{pendingIntros();UNLOCKS.forEach(u=>{if(u.i){S.seen["i:"+u.id]=false}});S.view="battle";render();S.view="gear";render();S.view="forge";render()});
        tryit(()=>{sndUi()});
        await sleep(50);
        const dailyP=dailyPlan(today());tryit(()=>{startDaily&&0;dailyResult({boss:false,rows:3,turns:5});dailyResult({boss:true,rows:6,turns:9})});
        tryit(()=>{S.battle=null;S.event=null;S.run=null;S.daily=null;S.kills.gnarlhorn=1;render()});
      });
      tourKeys[l]=new Set([...tourKeys[l],...(await page.evaluate(()=>[...window.__miss].filter(k=>!(typeof PROC!=="undefined"&&PROC.has(k)))))]); // a procedural creature's own strings stay English
      const txt=await page.evaluate(()=>[...window.__txt]);
      const IGN=new Set(["Everforge","English","Deutsch","Language · Sprache · 언어"]),eng0=l==="ko"?(t=>/[A-Za-z]{4,}/.test(t.replace(/\b(HP|XP|Lv|UTC|ATK|DEF|PWR|NEXT|DEF\/\(DEF\+|x\d|[a-z]\d)\b/g,"").replace(/<[^>]*>/g,""))):(t=>/\b(the|your|you|and|with|for|from|its|this|that|are|will|has|have|not|but|can|each|every)\b/.test(t)),eng=t=>!IGN.has(t)&&eng0(t);
      txt.filter(eng).forEach(t=>bad(`${l}: looks untranslated: ${t.slice(0,140)}`));
      const te=await page.evaluate(()=>window.__tourErr||"");if(te)console.log(`[${l}] tour errors: ${te}`);
    }
  }
  await browser.close();
  if(errs.length)bad("page errors: "+errs.join(" | "));

  // ---- compare
  const need=[...used.keys()];
  for(const l of LANGS){
    const d=DICT[l]||{},miss=[];
    need.forEach(k=>{if(d[k]==null)miss.push(`${k.length>110?k.slice(0,107)+"…":k}   [${used.get(k)}]`)});
    D.ctx.forEach(k=>{if(d[k]==null&&!(l==="ko"&&k.startsWith("gender|")))miss.push(k)});
    tourKeys[l].forEach(k=>{if(d[k]==null&&!miss.some(m=>m.startsWith(k.slice(0,60))))miss.push(k+"   [runtime]")});
    miss.forEach(m=>bad(`${l} is missing: ${m}`));
    // placeholders: a translation keeps every {name} of its key and adds none
    const ph=s=>[...s.matchAll(/\{(\w+)(?:\|[^}]*)?\}/g)].map(x=>x[1]).sort().join();
    Object.entries(d).forEach(([k,v])=>{
      if(k.includes("|")&&/^[a-z]+\|/.test(k))return;
      const ks=k.split("¦"),vs=v.split("¦");
      if(plural.has(k)&&l==="de"&&vs.length!==2)bad(`${l}: plural entry needs "one¦many": ${k.slice(0,70)}`);
      const want=ph(k),got=ph(vs[0]),got2=vs[1]!=null?ph(vs[1]):got;
      if(want!==got||want!==got2)bad(`${l}: placeholders differ for ${k.slice(0,80)} -> {${want}} vs {${got}}`);
      if(!used.has(k)&&!/^(howto\.|hit\||trait\||adj\||noun\||gender\||fam\||form\||kind\||proc-)/.test(k)&&!tourKeys[l].has(k))unusedList.push(`${l}: ${k.slice(0,80)}`);
    });
    D.ctx.forEach(k=>{if(k.startsWith("hit|")&&d[k]&&!/\{name[^}]*\}/.test(d[k]))bad(`${l}: ${k} needs {name}, {n} and {g}`)});
    ["howto.loop","howto.map","howto.torch","howto.health","howto.defeat","howto.abilities","howto.traits","howto.moves","howto.armor","howto.statuses","howto.knowledge","howto.gear","howto.mixing","howto.infusions","howto.previews"].forEach(k=>{if(!d[k])bad(`${l} is missing ${k}`)});
  }
  if(unusedList.length&&process.argv.includes("--unused"))console.log("Unused entries:\n  "+unusedList.join("\n  "));
  console.log(fails?`I18N CHECK FAILED (${fails})`:"I18N CHECK OK");process.exit(fails?1:0);
})();

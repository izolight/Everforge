// ================= RENDER: SATCHEL, RECIPES, STATS, CODEX =================
const TABS=[["all","All"],["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["consumable","Consumables"],["material","Materials"]];
const baseName=it=>(S.items[baseIdOf(it.id)]||it).name; // graded items sort next to their Plain kin, by grade
const TAB_IC={all:()=>ic("bag"),weapon:()=>gIc("blade"),armor:()=>gIc("chest"),charm:()=>ic("amulet"),consumable:()=>gIc("potion"),material:()=>gIc("ore")};
const tabBtn=(attr,k,l,on)=>`<button class="tab ti" data-${attr}="${k}" aria-pressed="${on}" aria-label="${esc(tx(l))}" ${tt(tx(l))}>${TAB_IC[k]()}${on?`<span>${tx(l)}</span>`:""}</button>`; // icon filter chip: the active one shows its name, the rest have a tip
function satchel(mode){
  const tabs=TABS.map(([k,l])=>tabBtn("tab",k,l,S.tab===k)).join("");
  const list=Object.keys(S.inv).filter(id=>S.inv[id]>0).map(id=>S.items[id]).filter(it=>S.tab==="all"||grp(it)===S.tab)
    .filter(it=>inventoryMatch(it,mode))
    .sort((a,b)=>inventorySort(a,b));
  const benchItems=S.bench.map(id=>S.items[id]);
  const tiles=list.length?list.map(it=>{const eq=eqCount(it.id)>0,left=avail(it.id),isNew=freshShown.has(it.id)||S.fresh.includes(it.id);
    let note="",no=false;
    if(mode==="forge"&&CRUCIBLE_ACTS.includes(S.act)){if(itemLocked(it.id)){no=true;note=tx("Unlock these items before crafting.")}else if(left<=0){no=true;note=tx("All in the crucible.")}else{note=actFit(S.act,it,benchItems);no=!!note}} // a satchel item the chosen action does not take is dimmed, and says where it goes
    return `<button class="sq${salvageMode&&mode==="gear"&&salvageSelection.has(it.id)?" selected":""}${it.legendary?" legend":""}${eq?" eq":""}${no?" no":""}" style="${rcol(it)}" data-id="${it.id}" data-can="${no||mode==="forge"&&!CRUCIBLE_ACTS.includes(S.act)?0:1}" aria-label="${esc(iname(it)+(left!==1?`, ${left}`:"")+(eq?", "+tx("worn"):"")+(isNew?", "+tx("new"):"")+(note?`, ${note}`:""))}. ${itemAria(it)}" ${itemTip(it,left>1?tx("You hold {n}.",{n:left}):"",eq?tx("Worn."):"",note)}>
      ${glyph(it)}${itemLocked(it.id)?`<span class="item-lock">${ic("lock","xs")}</span>`:""}${S.inventory?.layout==="list"?`<span class="item-caption"><b>${esc(iname(it))}</b><small>${esc(itemLines(it)[2])}</small></span>`:""}${left!==1?`<span class="sq-n">${left}</span>`:""}${eq?`<span class="sq-w">${ic("equip","xs")}</span>`:""}${isGear(it)?`<span class="sq-p">${power(it)}</span>`:""}${isNew?'<i class="sq-d"></i>':""}</button>`}).join("")
    :`<p class="empty">${tx("Nothing here yet.")}</p>`;
  return [tabs,tiles];
}
function renderSatchels(){
  renderInventoryTools();
  if(S.view==="gear"){const [t,i]=satchel("gear");$("gtabs").innerHTML=t;$("ginv").innerHTML=i;
    const dl=deconList(),n=dl.reduce((a,id)=>a+avail(id),0);$("gdecon").hidden=!n||inBattle();
    if(n)$("gdecon").innerHTML=`<button class="btn sm${isArmed("decon")?" danger":""}" id="deconAll" ${tt(tx("Deconstruct all"),tx("Breaks every raw hide, ore and wood in your satchel into base materials and essence fragments. Food, potions, relics and anything a secret still needs stay."))}>${ic("salvage","s")} ${isArmed("decon")?tx("Tap again to deconstruct {n}",{n}):tx("Deconstruct all raw finds ({n})",{n})}</button>`}
  if(S.view==="forge"){const [t,i]=satchel("forge");$("ftabs").innerHTML=t;$("finv").innerHTML=i}
}
function haveFor(ids){const need={};ids.forEach(id=>need[id]=(need[id]||0)+1);return ids.map(id=>(S.inv[id]||0)>=need[id])}
const REC_IC={weapon:"blade",armor:"chest",charm:"charm",food:"food",potion:"potion",hide:"hide",ore:"ore",timber:"timber",herb:"herb",essence:"essence",relic:"relic"};
const kic=(k,tip)=>`<span class="kic" ${tt(...tip)}>${gIc(REC_IC[k]||k,"")}</span>`;
const kindCap=a=>LANG==="en"?cap(KIND_LABEL[a]):txc("kind",KIND_LABEL[a]);
function renderRecipes(){
  $("rtabs").innerHTML=TABS.map(([k,l])=>tabBtn("rtab",k,l,S.rtab===k)).join("");
  const recs=S.journal.slice().reverse().map(j=>S.items[j.id]).filter(it=>it&&(S.rtab==="all"||grp(it)===S.rtab));
  $("rlabel").innerHTML=`${ic("recipes","s")} ${tx("Your recipes")} · ${S.journal.length}${helpBtn(tx("Recipes"),tx("Every combination you forge is saved here. Tap the anvil to load its ingredients into the crucible."),tx("Ingredients you don't have are crossed out."))}`;
  $("rlist").innerHTML=recs.length?recs.map(it=>{const ids=it.recipeIds||[],have=haveFor(ids),all=have.every(Boolean)&&ids.length<=maxInputs()&&!inBattle(),lv=ids.length>maxInputs();
    const why=all?tx("Load the ingredients into the crucible."):lv?tx("Needs Smith Lv {n} for {k} slots.",{n:INPUT_LV[ids.length-3],k:ids.length}):inBattle()?tx("Finish the fight first."):tx("You are missing ingredients.");
    return `<div class="rr${all?" ok":""}"><span class="rg" style="${rcol(it)}" ${itemTip(it,tx("Recipe"))}>${glyph(it)}</span><div class="rm"><span class="rn">${nameHtml(it)}</span><span class="ris">${ids.map((id,i)=>{const x=S.items[id];return `<span class="ri1 ${have[i]?"have":"miss"}" ${tt(x?iname(x):"?",have[i]?tx("You have it."):tx("You are out of it."))}>${x?glyph(x):ic("mystery")}</span>`}).join('<i>+</i>')}</span></div>
      <button class="btn sm pin-recipe" data-pin-recipe="${it.id}" aria-pressed="${S.pinned?.kind==="recipe"&&S.pinned.id===it.id}">${tx("Pin goal")}</button>
      ${all?`<button class="ibt load" data-load="${it.id}" aria-label="${esc(tx("Load the recipe for {item}",{item:iname(it)}))}" ${tt(tx("Load"),why)}>${icon("forge")}</button>`
        :`<button class="ibt load off" data-tap aria-label="${esc(tx("Cannot load {item}: {why}",{item:iname(it),why}))}" ${tt(lv?tx("Needs Lv {n}",{n:INPUT_LV[ids.length-3]}):tx("Missing"),why)}>${lv?ic("lock"):ic("bag")}</button>`}</div>`}).join("")
    :`<p class="empty">${S.journal.length?tx("No recipes in this category yet."):tx("Every combination you forge is saved here so you can make it again.")}</p>`;
  $("mixsum").innerHTML=`${ic("filter","s")} ${tx("What mixes with what")}${helpBtn(tx("What mixes"),tx("Each row lists what that kind of item takes, besides its own type. Essences mix with everything; deconstruct raw finds to get them."))}`;
  $("mixrules").innerHTML=[["weapon","Weapons"],["armor","Armor"],["charm","Trinkets"],["food","Food"],["potion","Potions"]]
    .map(([k,l0])=>{const l=tx(l0);return `<div class="mx">${kic(k,[l])}<span class="ar">${tx("takes")}</span>${ACCEPTS[k].map(a=>kic(a,[kindCap(a)])).join("")}<span class="kic same" ${tt(tx("The same type"),tx("{kind} also take other {kindl}.",{kind:l,kindl:lc(l)}))}>${ic("plus","s")}</span></div>`}).join("")
    +`<div class="mx">${kic("ore",[tx("Materials"),tx("Hides, ores, timber and herbs.")])}<span class="ar">${tx("takes")}</span>${["hide","ore","timber","herb","essence","relic"].map(a=>kic(a,[kindCap(a),a==="hide"||a==="ore"||a==="timber"||a==="herb"?tx("Only their own kind."):""])).join("")}</div>
      <div class="mx">${kic("essence",[tx("Essences")])}<span class="ar">${tx("takes")}</span><span class="kic" ${tt(tx("Everything"),tx("Deconstruct raw finds to get essences."))}>${ic("bag")}</span></div>`;
  $("fusions").innerHTML=!hasTech("fuse")?`<div class="lockrow" ${tt(tx("Fusing (locked)"),isUnl("research")?tx("Learn Fusing in Research (the Forge tab) to merge two kinds of gear."):tx("Something to learn later."))}>${ic("lock","s")}<b>${tx("Fusing")}</b><small>${isUnl("research")?tx("Learn it in Research."):tx("Not yet known.")}</small></div>`:FUSIONS.filter(fusionOk).map(([a,b,f])=>`<span class="fu" ${tt(tx("{a} + {b} → {c}",{a:cap(formName(a)),b:formName(b),c:txc("noun",FORMS[f].noun)}),tx("A fusion: two kinds that merge into a new one."))}>${gIc(a)}<i>+</i>${gIc(b)}<i>→</i><b>${gIc(f)}</b></span>`).join("");
  const known=new Set(S.knownR),rd=REACTIONS.filter(([a,b])=>known.has(a+"+"+b));
  $("rxlabel").innerHTML=`${ic("infuse","s")} ${tx("Trait reactions")} · ${rd.length}/${REACTIONS.length}${helpBtn(tx("Trait reactions"),tx("Some pairs of traits react when they meet in the crucible and become a new trait. Discover one by forging it."),...isUnl("research")?[tx("Studying a material in Research, or an insight while forging, shows part of a reaction first.")]:[])}`;
  $("reactions").innerHTML=[...rd.map(([a,b,res,cons])=>`<span class="rx1" ${tt(`${trn(a)} + ${trn(b)} → ${trn(res)}`,cons.length?"":tx("Keeps both traits."))}>${ci(tColor(a),traitIc(a,"s"))}<i>+</i>${ci(tColor(b),traitIc(b,"s"))}<i>→</i>${ci(tColor(res),traitIc(res,"s"))}</span>`),
    ...REACTIONS.filter(r=>!known.has(rxKey(r))&&rxHint(rxKey(r)).length).map(r=>{const k=rxKey(r),hs=rxHint(k),side=t=>hs.includes(t)?ci(tColor(t),traitIc(t,"s"),trn(t)):`<span class="chip unk"><b>?</b></span>`,one=hs.length<2?hs[0]:null;
      return `<span class="rx1 part" ${tt(`${hs.includes(r[0])?trn(r[0]):"???"} + ${hs.includes(r[1])?trn(r[1]):"???"} → ???`,one?tx("A hint: {t} reacts with {v}.",{t:trn(one),v:tx(VAGUE[one===r[0]?r[1]:r[0]]||"something")}):tx("You know both sides. Forge them together to see what they make."))}>${side(r[0])}<i>+</i>${side(r[1])}<i>→</i><span class="chip unk"><b>?</b></span></span>`}),
    ...REACTIONS.filter(r=>!known.has(rxKey(r))&&!rxHint(rxKey(r)).length).map(()=>`<span class="rx1 unk" ${tt(tx("Undiscovered reaction"),tx(isUnl("research")?"Forge the right pair of traits to find it, or study a material and keep an eye out for insights.":"Forge the right pair of traits to find it."))}>?</span>`)].join("");
  const fd=SECRETS.filter(found).length;
  $("seclabel").innerHTML=`${ic("renown","s")} ${tx("Legendary secrets")} · ${fd}/${SECRETS.length}${helpBtn(tx("Legendary secrets"),tx("Hint scrolls from chests, shrines, riddles, bosses, bounties and the daily reveal a rumor, then its ingredients."))}`;
  $("secrets").innerHTML=SECRETS.map((sc,i)=>{const ok=found(sc),lv=hintLv(i),jr=ok&&S.journal.find(j=>S.items[j.id]?.legendary&&S.items[j.id].name===sc.name);
    const ing=sc.ids.map((id,k)=>k<lv-1?idName(id):"?").join(" + ");
    return ok?`<span class="sq sec ok" style="--rc:var(--accent)" ${tt(tx(sc.name),tx("Discovered."),sc.ids.map(idName).join(" + "))}>${jr?glyph(S.items[jr.id]):ic("renown")}</span>`
      :lv?`<button class="sq sec" data-pin-rumor="${i}" aria-label="${esc(tx("Pin rumor: {hint}",{hint:tx(sc.hint)}))}" aria-pressed="${S.pinned?.kind==="rumor"&&S.pinned.id===i}" ${tt(tx("A rumor"),tx(sc.hint),tx("Ingredients: {list}",{list:ing}))}><b>?</b><span class="sq-p">${Math.max(0,lv-1)}/${sc.ids.length}</span><span class="rumor-pin">${tx("Pin goal")}</span></button>`
      :`<span class="sq sec lock" ${tt(tx("Undiscovered"),tx("A hint scroll would reveal a rumor."))}>${ic("lock")}</span>`}).join("");
}
const sn=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,"")+"M":n>=1e4?(n/1e3).toFixed(n>=1e5?0:1).replace(/\.0$/,"")+"k":String(n);
function renderStats(){
  const st=S.stats,zn=Object.fromEntries(ZONES.map(z=>[z[0],tx(z[1])])),cell=(v,l)=>`<div class="sc"><b>${v}</b><span>${l}</span></div>`,grp=(t,h)=>`<p class="label">${t}</p><div class="sgrid">${h}</div>`;
  const kz=ZONES.map(z=>S.zoneKills[z[0]]|0),bossIds=ZONES.map(z=>z[2]);
  const heat=ZONES.filter(z=>st.heatBest[z[0]]!==undefined).map(z=>`${zn[z[0]].split(" ").pop()} ${st.heatBest[z[0]]}`).join(" · ")||tx("none yet");
  const fast=bossIds.filter(id=>st.fast[id]).map(id=>`<li><span>${tx(ENEMIES[id].name)}</span><b>${txn("{n} turn","{n} turns",st.fast[id])}</b></li>`).join("")||`<li><span>${tx("No boss beaten yet")}</span></li>`;
  const bigW=S.items[st.bigW]?iname(S.items[st.bigW]):st.bigW?tx(st.bigW):"";
  $("stats").innerHTML=grp(tx("Combat"),cell(sn(st.dealt),tx("damage dealt"))+cell(sn(st.taken),tx("damage taken in battle"))+cell(st.big?`${st.big}`:"-",st.big?tx("biggest hit · {w}",{w:esc(bigW)}):tx("biggest hit"))+cell(st.crits,tx("critical hits"))
      +cell(st.parries,tx("perfect parries"))+cell(st.abil,tx("abilities used"))+cell(st.sufd,tx("statuses suffered"))+cell(st.cured,tx("statuses cured"))+cell(st.deaths,tx("defeats"))+cell(st.studied,tx("creatures studied")))
    +grp(tx("Exploration"),cell(kz.reduce((a,b)=>a+b,0),tx("creatures slain"))+cell(st.elites,tx("magic & rare slain"))+cell(st.bosses,tx("bosses slain"))+cell(st.exped,tx("expeditions done"))
      +`<div class="sc wide"><b>${kz.join(" / ")}</b><span>${tx("kills by region ({list})",{list:ZONES.map(z=>zn[z[0]].split(" ").pop()).join(" / ")})}</span></div>`
      +`<div class="sc wide"><b>${heat}</b><span>${tx("highest Heat cleared")}</span></div>`)
    +grp(tx("Forge"),cell(st.forged,tx("items forged"))+cell(S.journal.length,tx("recipes found"))+cell(st.legend,tx("legendaries forged"))+cell(st.mishaps,tx("mishaps"))+cell(st.fizzles,tx("fizzles"))+cell(st.salvaged,tx("items broken down"))+cell(st.refined,tx("grades upgraded")))
    +grp(tx("Economy"),cell(sn(st.earned),tx("embers earned"))+cell(sn(st.spent),tx("embers spent"))+cell(S.embers,tx("embers now")))
    +`<p class="label">${tx("Records")}</p><ul class="rec2">${fast}<li><span>${tx("Dailies played / won")}</span><b>${st.dailies} / ${st.dailyWins}</b></li><li><span>${tx("Best daily")}</span><b>${st.dBest?dailyResult(st.dBest):tx("none yet")}</b></li><li><span>${tx("Best Rift depth")}</span><b>${(S.rift&&S.rift.best)||0}</b></li></ul>`;
}
function renderAfx(){ // the Codex list of affixes: an entry opens when you first meet an enemy that carries it
  const ids=Object.keys(AFX),n=ids.filter(a=>(S.afx[a]||{}).s>0).length;
  $("aflabel").innerHTML=`${ic("elite","s")} ${tx("Affixes")} · ${n}/${ids.length}${helpBtn(tx("Affixes"),tx("Magic enemies carry one affix, rare ones two (three from Heat 4). Each affix changes how the fight plays and drops its own essence when you win, better grades than usual (a rare more reliably than a magic one)."),tx("Meet an enemy that carries an affix to record it here."))}`;
  const row=a=>{const o=S.afx[a],A=AFX[a];return `<li class="af" style="--ac:${afxCol(a)}"><span class="afi">${afxIc(a)}</span><div><b>${tx(A.n)}</b><small>${tx("met {s}, beaten {b}",{s:o.s,b:o.b})}</small><p>${A.d()}</p><p class="drop">${traitIc(A.tr,"s")} ${tx("{trait} Essence",{trait:trn(A.tr)})}</p></div></li>`},
    lock=ids.filter(a=>!(S.afx[a]&&S.afx[a].s>0));
  $("aflist").innerHTML=`${n?`<ul class="afl">${ids.filter(a=>!lock.includes(a)).map(row).join("")}</ul>`:""}${lock.length?`<div class="chips aflock">${lock.map(()=>`<span class="chip unk" ${tt(tx("Unknown affix"),tx("Meet a magic or rare enemy that carries it."))}>${ic("lock","s")}<b>???</b></span>`).join("")}</div>`:""}`}
function renderGuide(){ // every unlocked intro, to read again; what is still locked sits in a collapsed list
  const op=UNLOCKS.filter(u=>u.i&&S.unl[u.id]),shut=UNLOCKS.filter(u=>u.txt&&!S.unl[u.id]),pt=u=>!u.i.ctx&&u.i.sel&&!/^\.tl/.test(u.i.sel); // Show me only where there is something to point at
  $("gdlabel").innerHTML=`${ic("list","s")} ${tx("Guide")} · ${op.length}/${UNLOCKS.filter(u=>u.i&&(u.txt||S.unl[u.id])).length}${helpBtn(tx("Guide"),tx("Every introduction you have unlocked, to read again."),tx("New systems open as you play. The locked ones say how to open them."))}`;
  $("gdlist").innerHTML=`<div class="gdl">${op.map(u=>`<details class="gd"><summary><span class="gi">${ic(u.ic,"s")}</span>${tx(u.i.t)}${S.seen["i:"+u.id]?"":` <b class="rdy">${tx("new")}</b>`}</summary><div class="gdb">${u.i.l.map(x=>`<p>${tx(x,u.i.v)}</p>`).join("")}${pt(u)?`<button class="btn sm" data-guide="${u.id}">${ic("hero","s")} ${tx("Show me")}</button>`:""}</div></details>`).join("")}</div>${shut.length?`<details class="gd lockd"><summary><span class="gi">${ic("lock","s")}</span>${tx("Still locked · {n}",{n:shut.length})}</summary><div class="gdl">${shut.map(u=>lockRow(u.id)).join("")}</div></details>`:""}`;
}
let cxSection="creatures",cxQuery="",cxZone="all",cxState="discovered";
function showCxSection(key){cxSection=key;document.querySelectorAll("[data-cxpanel]").forEach(p=>p.hidden=p.dataset.cxpanel!==key);document.querySelectorAll("[data-cxsection]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.cxsection===key)))}
function renderCodex(){
  document.querySelectorAll("[data-unl]").forEach(e=>e.hidden=!isUnl(e.dataset.unl)); // How to play: only what is open
  showCxSection(cxSection);renderGuide();
  if(isUnl("afx"))renderAfx();else{$("aflabel").innerHTML=`${ic("elite","s")} ${tx("Affixes")}`;$("aflist").innerHTML=lockRow("afx")}
  $("cx-records").innerHTML=isUnl("stats")?`<details id="statsd"><summary class="label"><span data-ic="renown"></span> <span data-t>Lifetime stats</span></summary><div id="stats"></div></details>`:`<p class="empty">${tx("Lifetime stats unlock as you play.")}</p>`;
  if(isUnl("stats"))renderStats();
  const ids=Object.keys(ENEMIES),seenN=ids.filter(id=>S.seen[id]).length,mast=ids.filter(id=>S.seen[id]&&know(id).mastered).length;
  $("cxlabel").innerHTML=`${ic("codex","s")} ${tx("Creature codex")} · ${seenN}/${ids.length}${ic("renown","xs")}${mast}/${seenN} ${tx("mastered")}${helpBtn(tx("Creature codex"),tx("{a} of {b} met, {m} mastered.",{a:seenN,b:ids.length,m:mast}),tx("Fight, study and hunt creatures to fill in their pages. A fully known creature takes {p}% more damage from you.",{p:MASTERY_PCT}),tx("Tap one to open its page."))}`;
  const regions=[...ZONES.map(z=>[z[0],tx(z[1])]),["any",tx("Anywhere")]], known=Object.entries(ENEMIES).filter(([id])=>S.seen[id]&&(cxState!=="mastered"||know(id).mastered));
  $("cxcontrols").innerHTML=`<div class="cxfilters"><label>${tx("Search creatures")}<input id="cxsearch" type="search" value="${esc(cxQuery)}" placeholder="${esc(tx("Search creatures"))}" data-ta="placeholder" aria-label="${esc(tx("Search creatures"))}"></label><label>${tx("Region")}<select id="cxzone" aria-label="${esc(tx("Region"))}"><option value="all">${tx("All regions")}</option>${regions.map(([z,n])=>`<option value="${z}" ${cxZone===z?"selected":""}>${n}</option>`).join("")}</select></label><label>${tx("Knowledge")}<select id="cxstate" aria-label="${esc(tx("Knowledge"))}"><option value="discovered" ${cxState==="discovered"?"selected":""}>${tx("Discovered")}</option><option value="mastered" ${cxState==="mastered"?"selected":""}>${tx("Mastered")}</option></select></label>${cxQuery||cxZone!=="all"||cxState!=="discovered"?`<button class="btn sm" data-cxreset>${tx("Reset filters")}</button>`:""}</div>`;
  const q=cxQuery.trim().toLocaleLowerCase(),matches=known.filter(([id,E])=>(cxZone==="all"||E.zone===cxZone)&&(!q||tx(E.name).toLocaleLowerCase().includes(q)));
  const zones=cxZone==="all"?regions:regions.filter(([z])=>z===cxZone);
  $("cxlist").innerHTML=matches.length?zones.map(([z,zn])=>{const list=matches.filter(([,E])=>E.zone===z),unknown=Object.entries(ENEMIES).filter(([id,E])=>E.zone===z&&!S.seen[id]).length;if(!list.length)return "";return `<p class="zonehead">${zn}</p><div class="cxg">`+list.map(([id,E])=>{
    const seen=true,k=know(id),pct=Math.round(k.pct*100),tp=tt(tx(E.name),(E.boss?tx("Boss.")+" ":"")+tx("Defeated {n}",{n:S.kills[id]||0}),k.mastered?tx("Mastered: you deal {p}% more damage.",{p:MASTERY_PCT}):tx("Knowledge {a}/{b} ({p}%)",{a:k.have,b:k.tot,p:pct}));
    const bd=`${seen&&E.boss?`<span class="sq-w cb" aria-hidden="true">${ic("boss","xs")}</span>`:""}`;
    return seen?`<button class="cxt${k.mastered?" mst":""}" data-codex="${id}" aria-label="${esc(tx(E.name)+(E.boss?", "+lc(tx("Boss")):"")+". "+(k.mastered?tx("Mastered"):tx("Knowledge {p}%",{p:pct}))+". "+tx("Open its page."))}" ${tp}>${portrait(id,{lite:1})}<span class="cxname">${tx(E.name)}</span><span class="cxprogress">${k.mastered?tx("Mastered"):tx("Knowledge {p}%",{p:pct})}</span>${bd}</button>`
      :""}).join("")+`</div>${unknown?`<p class="cxunknown">${tx("{n} creatures undiscovered in this region",{n:unknown})}</p>`:""}`}).join(""):`<div class="cxempty"><p>${known.length?tx("No creatures match these filters."):tx("No creatures discovered yet. Explore the map and win your first fight to reveal creature names and knowledge.")}</p>${cxQuery||cxZone!=="all"||cxState!=="discovered"?`<button class="btn sm" data-cxreset>${tx("Reset filters")}</button>`:""}</div>`;
}

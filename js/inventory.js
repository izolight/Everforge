// Inventory preferences live in the save; bulk selection is temporary and explicit.
let salvageMode=false,salvageSelection=new Set(),salvageReview=null;
const inventoryPrefs=()=>S.inventory||(S.inventory={layout:"grid",filter:"all",sort:"type"});
function inventoryMatch(it,mode){
  const f=inventoryPrefs().filter;
  if(f==="new")return freshShown.has(it.id)||S.fresh.includes(it.id);
  if(f==="equipped")return eqCount(it.id)>0;
  if(f==="craftable"){
    if(itemLocked(it.id)||avail(it.id)<=0||S.bench.length>=maxInputs())return false;
    const can=parts=>checkMix(parts).ok&&!actionOk(parts).length&&!combine(parts,{roll:100}).blocked;
    return S.bench.length?can([...S.bench.map(id=>S.items[id]),it]):Object.keys(S.inv).some(id=>!itemLocked(id)&&avail(id)>(id===it.id?1:0)&&can([it,S.items[id]]));
  }
  return true;
}
function inventorySort(a,b){
  const sort=inventoryPrefs().sort,recent=id=>{const n=(S.recent||[]).indexOf(id);return n<0?Number.MAX_SAFE_INTEGER:n};
  if(sort==="recent"&&recent(a.id)!==recent(b.id))return recent(a.id)-recent(b.id);
  if(sort==="grade"&&gradeOf(a.id)!==gradeOf(b.id))return gradeOf(b.id)-gradeOf(a.id);
  return FORMS[b.form].p-FORMS[a.form].p||b.tier-a.tier||baseName(a).localeCompare(baseName(b))||a.name.localeCompare(b.name);
}
function renderInventoryTools(){
  if(!["gear","forge"].includes(S.view))return;
  const gear=S.view==="gear",pre=gear?"g":"f",prefs=inventoryPrefs(),select=(key,label,options)=>`<label>${label}<select data-invpref="${key}" aria-label="${label}">${options.map(([v,l])=>`<option value="${v}"${prefs[key]===v?" selected":""}>${l}</option>`).join("")}</select></label>`;
  $(pre+"tools").innerHTML=`<div class="inventory-tools">${select("layout",tx("Inventory layout"),[["grid",tx("Grid")],["list",tx("List")]])}${select("filter",tx("Inventory filter"),[["all",tx("All")],["new",tx("New")],["equipped",tx("Equipped")],["craftable",tx("Craftable")]])}${select("sort",tx("Inventory order"),[["type",tx("Type")],["recent",tx("Recent")],["grade",tx("Grade")]])}</div>${gear?`<div class="actions"><button class="btn sm" data-bulk="toggle" ${inBattle()?"disabled":""}>${tx(salvageMode?"Cancel selection":"Select salvage")}</button>${salvageMode?`<button class="btn sm" data-bulk="review" ${salvageSelection.size?"":"disabled"}>${tx("Review salvage ({n})",{n:salvageSelection.size})}</button>`:""}</div>${salvageMode?`<p class="foot">${tx("Equipped, locked and legendary items are protected. Items in the crucible are reserved.")}</p>`:""}`:""}`;
  $(pre+"inv").classList.toggle("inventory-list",prefs.layout==="list");
}
const salvageCount=id=>!S.items[id]||itemLocked(id)||eqCount(id)||S.items[id].legendary||!canSalvage(S.items[id])?0:Math.max(0,avail(id));
function toggleSalvage(id){
  if(inBattle()||!salvageCount(id))return toast(tx("Choose spare items to salvage."));
  if(salvageSelection.has(id))salvageSelection.delete(id);else salvageSelection.add(id);
  renderSatchels();
}
function salvagePlan(){return [...salvageSelection].map(id=>({id,n:salvageCount(id)})).filter(x=>x.n>0)}
function showSalvageReview(){
  if(inBattle())return;const plan=salvagePlan();if(!plan.length)return;
  const ys={};let embers=0;
  plan.forEach(({id,n})=>{const it=S.items[id];salvageMats(it).forEach(m=>{const k=gradedItem(baseIdOf(m),gradeOf(m));ys[k]=(ys[k]||0)+n});salvageYield(it).forEach(t=>{const k=essG(t,salvGrade(it));ys[k]=(ys[k]||0)+n});embers+=salvageEmbers(it)*n});
  salvageReview=JSON.stringify(plan);Object.assign(sheet,{mode:"salvage",id:null});
  $("sheetIn").innerHTML=`<h2>${tx("Salvage preview")}</h2><ul>${plan.map(({id,n})=>`<li>${esc(iname(S.items[id]))} ×${n}</li>`).join("")}</ul><p class="label">${tx("You will receive")}</p><ul>${Object.entries(ys).map(([id,n])=>`<li>${esc(iname(S.items[id]))} ×${n}</li>`).join("")}${isUnl("peddler")?`<li>${tx("Embers")}: ${embers}</li>`:""}</ul><p class="foot">${tx("Equipped, locked and legendary items are protected. Items in the crucible are reserved.")}</p><div class="actions"><button class="btn danger" data-act="bulk-confirm">${tx("Salvage selected items")}</button><button class="btn" data-act="close">${tx("Close")}</button></div>`;
  showSheet();
}
function confirmSalvage(){
  if(inBattle())return;const plan=salvagePlan();
  if(!plan.length)return closeSheet();
  if(JSON.stringify(plan)!==salvageReview)return showSalvageReview();
  let count=0;plan.forEach(({id,n})=>{for(let i=0;i<n;i++)if(salvageItem(id))count++});
  salvageSelection.clear();salvageMode=false;salvageReview=null;closeSheet();save();render();toast(tx("Salvaged {n} items.",{n:count}));
}
for(const id of ["gtools","ftools"]){
  $(id).addEventListener("change",e=>{const k=e.target.dataset.invpref;if(!k)return;inventoryPrefs()[k]=e.target.value;save();renderSatchels()});
  $(id).addEventListener("click",e=>{const b=e.target.closest("[data-bulk]");if(!b)return;if(b.dataset.bulk==="review")return showSalvageReview();salvageMode=!salvageMode;salvageSelection.clear();renderSatchels()});
}

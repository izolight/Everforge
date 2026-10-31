// ================= LOCALISATION =================
// English is the source language: every shown string is written once in the code as English and looked up here, so a missing translation shows English and never breaks. Game data (names, lore, saves) stays English; text is translated where it is drawn, which is why the language can change without a reload.
// tx(text, vars)         text with {name} placeholders; Korean particles are picked from the value before them: {name|은|는}, {name|이|가}, {name|을|를}, {name|으로|로}
// txn(one, many, n, vars) plural pair; a translation is "singular¦plural" (one form for a language without plural)
// txc(ctx, word)         one word in a context ("trait", "fam", "stat", "adj", "noun", "gender"), stored as "ctx|word"
// The dictionaries are DICT.de and DICT.ko (js/lang/*.js). Static markup uses data-t (inner HTML) and data-ta (attributes); see applyStatic.
const LANGS={en:"English",de:"Deutsch",ko:"한국어"},DICT={en:{}},LANG_KEY="everforge-lang";
function pickLang(){
  const q=/[?&]lang=(\w+)/.exec(location.search); // ?lang=de opens the game in German (and keeps that choice)
  if(q&&LANGS[q[1]]){try{localStorage.setItem(LANG_KEY,q[1])}catch(e){}return q[1]}
  try{const s=localStorage.getItem(LANG_KEY);if(LANGS[s])return s}catch(e){}
  const n=String((navigator.languages&&navigator.languages[0])||navigator.language||"en").slice(0,2).toLowerCase();
  return LANGS[n]?n:"en";
}
let LANG=pickLang();
const missed=k=>{(window.__miss||(window.__miss=new Set())).add(k)}; // keys with no translation, for tools/i18n-check.js
// Korean: does the last character of s end in a final consonant (batchim)? Digits are read aloud (1 il, 3 sam, 6 yuk, 7 chil, 8 pal). rieul: the final ㄹ counts as none (으로/로).
function batchim(s,rieul){
  s=String(s).replace(/<[^>]*>/g,"").trim();const ch=s.slice(-1),c=ch.charCodeAt(0);
  if(c>=0xAC00&&c<=0xD7A3){const f=(c-0xAC00)%28;return f>0&&!(rieul&&f===8)}
  return /[013678]/.test(ch);
}
const fmt=(s,v)=>s.replace(/\{(\w+)(?:\|([^|}]*)\|([^|}]*))?\}/g,(m,n,a,b)=>{
  if(!v||!(n in v))return m;const x=v[n];if(a===undefined)return x;return x+(batchim(x,a==="으로")?a:b)});
function tx(k,v){
  let s;
  if(LANG==="en")s=k;
  else{
    const parts=typeof PROC_NAME_PARTS!=="undefined"&&PROC_NAME_PARTS.get(k),plural=typeof PROC_PLURAL_PARTS!=="undefined"&&PROC_PLURAL_PARTS.get(k),short=typeof PROC_SHORT_PARTS!=="undefined"&&PROC_SHORT_PARTS.get(k);
    const exact=DICT[LANG]&&DICT[LANG][k];
    if(exact!=null)s=exact; // a canonical authored translation wins if a generated English name collides with it
    else if(parts||plural){const p=parts||plural,pre=txc("proc-prefix",p.prefix),forms=txc("proc-noun",p.noun).split("¦"),noun=forms[plural?1:0]||forms[0];s=LANG==="de"?pre+noun:`${pre} ${noun}`;if(p.tail)s+=LANG==="de"?` Nr. ${p.tail}`:` ${p.tail}호`}
    else if(short){const forms=txc("proc-noun",short.noun).split("¦"),noun=forms[0];s=LANG==="de"?`${({m:"der",f:"die",n:"das"}[txc("gender",short.noun)]||"das")} ${noun}`:noun}
    else s=exact}
  if(s==null){s=k;if(LANG!=="en")missed(k)}
  return v?fmt(s,v):s;
}
function txn(one,many,n,v){
  let s=LANG==="en"?null:DICT[LANG]&&DICT[LANG][one];
  if(s==null){if(LANG!=="en")missed(one);s=n===1?one:many}
  else if(s.includes("¦"))s=s.split("¦")[n===1?0:1];
  return fmt(s,{n,...v});
}
function txc(c,k){
  if(LANG==="en")return k;
  const d=DICT[LANG]||{},s=d[c+"|"+k]??d[k];
  if(s==null){missed(c+"|"+k);return k}
  return s;
}
const lc=s=>LANG==="de"?s:String(s).toLowerCase(); // German nouns keep their capital
const trn=t=>txc("trait",t),famN=f=>txc("fam",LANG==="en"?f[0].toUpperCase()+f.slice(1):f),famL=f=>LANG==="en"?f:txc("fam",f); // a family (fire, ice...) as a capitalised name; famL is the lower-case sentence form in English
// ---- names of items. The stored name stays English (it is an identity: saves, secrets, recipes); iname() is what is shown.
let ADJ_REV=null;
function adjRev(){if(!ADJ_REV){ADJ_REV={};Object.entries(TRAITS).forEach(([k,t])=>ADJ_REV[t.adj]=k)}return ADJ_REV}
function craftedName(en){ // "Smoldering Keen Blade", "Keen Blade +2": adjectives, then the noun
  if(LANG==="en")return en;
  const m=/ \+\d+$/.exec(en),body=en.replace(/ \+\d+$/,""),sfx=m?m[0]:"",d=DICT[LANG]||{};
  if(d[body]!=null)return d[body]+sfx; // a base item name ("Iron Sword +1") is in the dictionary whole
  const w=body.split(" "),noun=w.pop(),R=adjRev();
  if(!w.length||w.some(a=>!R[a]))return tx(body)+sfx;
  let adjs=w.map(a=>txc("adj",R[a])),n=txc("noun",noun);
  if(LANG==="de"){const g=DICT.de["gender|"+noun],e={m:"er",f:"e",n:"es"}[g]||"es";adjs=adjs.map((a,i)=>(i?a[0].toLowerCase()+a.slice(1):a)+e)}
  return [...adjs,n].join(" ")+sfx;
}
function iname(it){
  if(!it)return "";
  if(LANG==="en")return it.name;
  if(it.grade&&!it.crafted){const b=S.items[baseIdOf(it.id)];return tx("{grade} {name}",{grade:tx(GRADES[it.grade-1][0]),name:b?iname(b):it.name})}
  if(!it.crafted&&isEss(it.id))return tx("{trait} Essence",{trait:trn(essTrait(it.id))});
  if(!it.crafted&&it.afx&&AFX[it.afx])return tx("{affix} {name}",{affix:tx(AFX[it.afx].n),name:iname(S.items[plainId(it.id)])}); // an affixed variant: the affix prefix on the translated base name
  if(!it.crafted||it.legendary)return tx(it.name);
  return craftedName(it.name);
}
// ---- static markup: [data-t] replaces the element's HTML (the key is data-t, else the English HTML it started with), [data-ta="attr attr"] translates those attributes (the key is the English value)
function applyStatic(){
  document.documentElement.lang=LANG;
  document.querySelectorAll("[data-t]").forEach(e=>{
    if(e._en===undefined)e._en=e.innerHTML.trim();
    const k=e.dataset.t||e._en,v=LANG==="en"?null:DICT[LANG]&&DICT[LANG][k];
    if(LANG!=="en"&&v==null)missed(k);
    e.innerHTML=v==null?e._en:v});
  document.querySelectorAll("[data-ta]").forEach(e=>{
    if(!e._ta)e._ta={};
    e.dataset.ta.split(" ").forEach(a=>{
      if(e._ta[a]===undefined)e._ta[a]=e.getAttribute(a)||"";
      const en=e._ta[a],v=LANG==="en"?null:DICT[LANG]&&DICT[LANG][en];
      if(LANG!=="en"&&v==null)missed(en);
      e.setAttribute(a,v==null?en:v)})});
  const t=document.querySelector("title");if(t){if(t._en===undefined)t._en=t.textContent;t.textContent=t._en}
  if(LANG==="ko"&&!document.getElementById("kofont")){ // Hangul is not in the Latin web fonts
    const l=document.createElement("link");l.id="kofont";l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap";document.head.appendChild(l)}
}

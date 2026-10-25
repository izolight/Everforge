// ================= BIOMES, WILD CREATURES, RANDOM REGIONS =================
// A biome is a theme: the elements, bodies, parts, colours and words its creatures are built from.
// Every region gets ten wild creatures (genRoster): composed from the biome's parts, carrying affixes of their
// own, and the same in every playthrough (the seed is the region's id). They are rare-grade creatures, so the map
// shows them with a frame, but their own affixes drop no extra essence: the economy of a region does not move.
// The Rift (riftMake) is a random region: a biome, a palette, a name, ten wild creatures and a master, all rolled
// from one seed. The seed is kept in the save, so a reloaded game rebuilds exactly the same region.
const BIOMES={
forest:{n:"Whispering Woods",els:["wood","poison","fire","swift","metal"],bodies:["beast","undead","humanoid","elemental"],parts:["mane","antlers","horns","tail","vines","spikes"],pats:["spots","stripes","rot","scales"],
  cols:["#7f9a5c","#c9a24a","#5f8a3a","#a3604a","#6f8c7c"],skins:["#c99b78","#b78a63"],verbs:["bites you","claws you","rakes you","slashes at you","lashes you","gores you"],
  pre:["Briar","Moss","Thorn","Fern","Oak","Rowan","Hazel","Grove","Bramble","Alder"],suf:["Stalker","Crawler","Watcher","Gnawer","Runner","Warden","Lurker","Creeper","Slasher","Hound"],
  regions:["The Old Grove","The Rootless Wood","Whispering Thicket"],lore:["It hunts where the light ends and the roots begin.","The forest grew it, and the forest keeps it.","It wears moss like a coat and never takes it off.","Old tracks end at it. Nothing else lives here."]},
tundra:{n:"Frostfang Pass",els:["ice","swift","stone","arcane","metal"],bodies:["beast","elemental","construct","humanoid"],parts:["frost","mane","horns","tail","spikes","armor"],pats:["facets","bands","swirl","scales"],
  cols:["#b9d6e2","#8fbcd0","#6c8ea0","#dbeef6","#5f7f8f"],skins:["#c99b78","#a8846a"],verbs:["bites you","claws you","mauls you","buffets you","hacks at you","slams you"],
  pre:["Rime","Frost","Glacier","Snow","Wind","Pale","Bitter","Hail"],suf:["Stalker","Razor","Howler","Drifter","Warden","Shredder","Lurker","Runner","Biter","Crusher"],
  regions:["The White Silence","The Grey Shelf","The Frostfang Expanse"],lore:["The cold got into it first; the rest is habit.","It waits where the wind funnels between the rocks.","Snow covers its tracks, but not for long.","It was born in a blizzard and never warmed up."]},
ember:{n:"Cinder Hollow",els:["fire","poison","metal","stone"],bodies:["elemental","construct","humanoid","undead"],parts:["flames","spikes","armor","chains","horns","crown"],pats:["cracks","bands","facets","swirl"],
  cols:["#b8402a","#ffb347","#d6c83a","#8a3a22","#e8793b"],skins:["#c99b78","#9c6e43"],verbs:["scorches you","hammers you","scalds you","rakes you","claws you","strikes you"],
  pre:["Cinder","Ember","Slag","Ash","Forge","Molten","Kiln","Scoria"],suf:["Hound","Sentinel","Warden","Drake","Creeper","Tender","Hammer","Wretch","Thief","Creecher"],
  regions:["The Cinder Wastes","The Slag Flats","The Vent Fields"],lore:["It was forged, and then let go.","The Hollow's heat made it, and the Hollow forgets it.","Everything it touches keeps a little warmth.","It smells of coal and of old, old iron."]},
astral:{n:"Starfall Spire",els:["arcane","holy","swift","shadow"],bodies:["construct","elemental","humanoid","beast"],parts:["orbit","runes","halo","wings","crown","crystals"],pats:["stars","bands","swirl","scales"],
  cols:["#4e3a96","#a9f0ff","#7468b8","#f0dca8","#c9a65a"],skins:["#e9e0cf","#c9b9a8"],verbs:["strikes you","smites you","rakes you","touches you","chills you","hacks at you"],
  pre:["Star","Void","Astral","Rune","Halo","Fallen","Gilded","Umbral"],suf:["Watcher","Sentinel","Warden","Acolyte","Construct","Lynx","Seer","Wraith","Scribe","Herald"],
  regions:["The Starless Gallery","The Ossuary of Glass","The Vault of Falling Light"],lore:["It was a star that learned to walk.","Something up here rewrote it.","It keeps the hour it was made for.","The stars moved; it did not."]},
fen:{n:"Mirewood Fen",els:["poison","wood","shadow","swift"],bodies:["beast","undead","elemental","humanoid"],parts:["vines","mane","tail","horns","spikes","shell"],pats:["rot","spots","swirl","stripes"],
  cols:["#5f8a3a","#7a8f5c","#3f6b48","#8f9f5c","#6f8c7c"],skins:["#a89b7a","#8f9f5c"],verbs:["lashes you","claws you","bites you","strikes you","scalds you","hacks at you"],
  pre:["Mire","Fen","Silt","Reed","Bog","Moss","Weeping","Drowned"],suf:["Crawler","Leech","Lurker","Drowner","Watcher","Warden","Slimer","Gnawer","Wretch","Drifter"],
  regions:["The Weeping Fen","The Silt Marches","Rotmire Hollow"],lore:["The bog keeps what it takes.","It surfaces only when the water is still.","Half of it is moss, and the moss is hungry.","It was a traveller once. The fen kept it."]},
ash:{n:"The Cinder Wastes",els:["fire","metal","stone","poison"],bodies:["construct","humanoid","elemental","beast"],parts:["armor","spikes","flames","chains","horns","shell"],pats:["bands","cracks","facets","stripes"],
  cols:["#a86a3a","#e0a060","#7a5a44","#c9a24a","#8a4a30"],skins:["#b08a63","#8a6a4a"],verbs:["hammers you","strikes you","scorches you","rakes you","gores you","claws you"],
  pre:["Dune","Cinder","Brass","Glass","Salt","Iron","Ashen","Scrap"],suf:["Raider","Sentinel","Golem","Drifter","Reaver","Warden","Hound","Creeper","Wretch","Hulk"],
  regions:["The Glass Desert","The Rust Flats","The Salt Reach"],lore:["It was made to work in the sun, and never stopped.","Glass underfoot, and something that drinks the heat.","Nothing grows here; it grows anyway.","The wastes are full of things that were once people."]},
bone:{n:"Ossuary Barrens",els:["shadow","holy","stone","poison"],bodies:["undead","beast","humanoid","construct"],parts:["horns","antlers","mane","chains","armor","tail"],pats:["rot","cracks","scales","bands"],
  cols:["#d8d0bb","#8a8070","#b9ad98","#5a4a3a","#9c998c"],skins:["#c9b9a8","#a89880"],verbs:["claws you","gores you","smites you","hacks at you","lashes you","strikes you"],
  pre:["Bone","Ossuary","Marrow","Grave","Pallid","Riven","Silent","Hollow"],suf:["Warden","Crawler","Hound","Sexton","Ritual","Thrall","Watcher","Gnawer","Wretch","Choir"],
  regions:["The Pallid Fields","The Ossuary Gate","The Long Barrows"],lore:["It was buried with something it did not forgive.","The dead here do not lie down.","It wears the bones of better fighters.","Something keeps the barrows tidy."]},
deep:{n:"The Weeping Deep",els:["arcane","ice","shadow","poison"],bodies:["elemental","construct","beast","undead"],parts:["crystals","runes","vines","tail","frost","hood"],pats:["stars","swirl","cracks","facets"],
  cols:["#2f6f7a","#7fe8ff","#3a5f8a","#a9f0ff","#6f4f8a"],skins:["#9fb0b8","#7f8f98"],verbs:["chills you","touches you","strikes you","claws you","scalds you","rakes you"],
  pre:["Deep","Weeping","Glass","Abyss","Silent","Pale","Vault","Drowned"],suf:["Warden","Sentinel","Watcher","Husk","Seeker","Lurker","Chorus","Creeper","Thrall","Drifter"],
  regions:["The Weeping Vaults","The Glass Deeps","The Drowned Gallery"],lore:["It came up from a place that has no floor.","The water there keeps its shape.","It remembers a door that no longer exists.","Every sound in the deep answers itself."]}
};
// the element a creature is born to: what it is weak to, what it shrugs off, and what it inflicts on a hit
const EL_NAT={fire:{w:["ice"],r:["fire"],i:"burn"},ice:{w:["fire"],r:["ice"],i:"chill"},poison:{w:["fire"],r:["poison"],i:"poison"},holy:{w:["shadow"],r:["holy"],i:null},
  shadow:{w:["holy"],r:["shadow"],i:"curse"},wood:{w:["fire"],r:["wood"],i:null},metal:{w:["arcane"],r:["metal"],i:null},arcane:{w:["holy"],r:["arcane"],i:null},
  swift:{w:["stone"],r:["swift"],i:null},stone:{w:["arcane"],r:["stone"],i:null}};
// the biome of each hand-made region, and its element pool: every element of the pool needs an authored (non-boss) enemy of that region, or a documented exception (tools/sim.js checks it). The enemies outside their pool are additions, not gaps: Woods holy (Glowcap Sprite) and shadow (Barrow Ghoul), Pass and Hollow shadow (Ice Wraith, Ash Revenant), Spire metal (Orrery Construct).
const ZONE_BIOME={woods:"forest",pass:"tundra",hollow:"ember",spire:"astral"},GEN_N=10,RIFT_N=10,RIFT_ZONE="rift";
// the stat band of a region's wild creatures (the rarity multiplier is put back when they are rolled)
const GEN_T={woods:{hp:30,atk:6,def:2},pass:{hp:58,atk:11,def:4},hollow:{hp:92,atk:14,def:5},spire:{hp:120,atk:21,def:6}};
// six specials the wild creatures share; their names and tells are translated like any other
const GEN_SP=[
  {every:3,name:"Wild Rush",kind:"multi",n:2,x:.85,tell:"coiling to spring"},
  {every:3,name:"Heavy Slam",kind:"heavy",x:1.9,tell:"raising itself to strike"},
  {every:4,name:"Mend",kind:"heal",x:.22,tell:"knitting itself back together"},
  {every:3,name:"Soul Drain",kind:"drain",x:1.1,tell:"reaching for your life"},
  {every:4,name:"Savage Charge",kind:"heavy",x:2.1,tell:"lowering its head"},
  {every:3,name:"Bolt",kind:"multi",n:3,x:.6,tell:"drawing power together"}];
// what a wild creature can carry: the region's own materials, so a region's economy does not move
const GEN_DROP={
  woods:{any:["boar_hide","mushroom","honey","bread","dagger"],fire:["chili","boar_hide"],poison:["mushroom","honey"],wood:["boar_hide","honey"],swift:["trail_boots","hunter_spear"],metal:["iron_sword","dagger"],holy:["sprite_lantern","bread"],shadow:["jerkin","bread"],arcane:["oak_staff","sprite_lantern"],ice:["boar_hide","bread"],stone:["boar_hide","bread"]},
  pass:{any:["pelt","spring_water","holy_water","bread"],ice:["pelt","spring_water"],swift:["trail_boots","fang_charm"],stone:["golem_core","stone_plate"],arcane:["rune_shard","holy_water"],metal:["iron_helmet","stone_plate"],fire:["holy_water","bread"],poison:["shroud","holy_water"],wood:["pelt","bread"],holy:["holy_water","spring_water"],shadow:["shroud","holy_water"]},
  hollow:{any:["coal","nightshade","holy_water","bread"],fire:["coal","chili"],poison:["nightshade","coal"],metal:["golem_core","ember_treads"],stone:["golem_core","stone_plate"],shadow:["witch_eye","holy_water"],arcane:["oak_staff","witch_eye"],swift:["ember_treads","fang_charm"],holy:["holy_water","coal"],wood:["coal","bread"],ice:["coal","holy_water"]},
  spire:{any:["rune_shard","holy_water","void_crystal","bread"],arcane:["rune_shard","void_crystal"],holy:["holy_water","storm_feather"],swift:["storm_feather","gale_boots"],shadow:["void_crystal","void_robe"],metal:["sentinel_aegis","golem_core"],stone:["golem_core","rune_shard"],ice:["storm_feather","holy_water"],fire:["storm_feather","holy_water"],poison:["witch_eye","void_crystal"],wood:["rune_shard","bread"]},
  rift:{any:["rune_shard","void_crystal","storm_feather","star_heart","bread"],arcane:["rune_shard","void_crystal","star_heart"],holy:["holy_water","storm_feather"],swift:["storm_feather","gale_boots"],shadow:["void_crystal","void_robe"],metal:["sentinel_aegis","golem_core"],stone:["golem_core","rune_shard"],ice:["storm_feather","holy_water"],fire:["storm_feather","star_heart"],poison:["witch_eye","void_crystal"],wood:["rune_shard","bread"]}};
// every string a generated creature shows (the translation check skips them: a procedural name has no dictionary entry)
const PROC=new Set(),proc=s=>{PROC.add(s);return s};
const pluralOf=n=>/(s|x|z|ch|sh)$/.test(n)?n+"es":/[^aeiou]y$/.test(n)?n.slice(0,-1)+"ies":n+"s";
function genName(B,R,used){ // a name from the biome's words, unique inside its roster
  for(let i=0;i<60;i++){const n=B.pre[Math.floor(R()*B.pre.length)]+" "+B.suf[Math.floor(R()*B.suf.length)];if(!used.has(n)){used.add(n);return n}}
  const n=B.pre[0]+" "+B.suf[0]+" the "+used.size;used.add(n);return n}
function genDrops(zone,el,R){ // one to three of the region's own materials
  const t=GEN_DROP[zone]||GEN_DROP.spire,list=t[el]&&t[el].length?t[el]:t.any,n=1+Math.floor(R()*2.6),out=[],seen=new Set();
  for(let i=0;i<n;i++){const id=list[Math.floor(R()*list.length)];if(seen.has(id))continue;seen.add(id);out.push([id,.35+R()*.45])}
  if(!out.length)out.push([t.any[0],.6]);
  return out}
// one wild creature: a body and parts from the biome, an element, a rarity with affixes of its own, and stats
// that land on the region's band once the rarity multiplier is applied (the affix multipliers still count).
function genCreature(o){ // o:{id,zone,biome,tier,R,used,boss,where,seed}
  const B=BIOMES[o.biome],R=o.R,rar=o.boss?"rare":(R()<.3?"rare":"magic"),rm=RARITIES[rar];
  const el=B.els[Math.floor(R()*B.els.length)],nat=EL_NAT[el]||{w:[],r:[]};
  const mv=["still","wander","chase"][Math.floor(R()*3)],body=B.bodies[Math.floor(R()*B.bodies.length)];
  const nparts=1+Math.floor(R()*3),parts=[];while(parts.length<nparts){const p=B.parts[Math.floor(R()*B.parts.length)];if(!parts.includes(p))parts.push(p)}
  const col=B.cols[Math.floor(R()*B.cols.length)],acc=B.cols[Math.floor(R()*B.cols.length)];
  const name=o.boss?proc(cap(B.pre[Math.floor(R()*B.pre.length)])+" "+cap(B.suf[Math.floor(R()*B.suf.length)])):genName(B,R,o.used);
  const sp=GEN_SP[Math.floor(R()*GEN_SP.length)];
  const boss=o.boss?1.9:1,atkm=o.boss?1.25:1;
  const hp=Math.max(3,Math.round(o.tier.hp*(.8+R()*.45)*boss/rm.hp)),atk=Math.max(1,Math.round(o.tier.atk*(.85+R()*.3)*atkm/rm.atk));
  const def=Math.max(0,o.tier.def+Math.floor(R()*2)+(o.boss?2:0));
  const afx=rollAfx(R,rar,{mv,heat:o.boss?RAR_CH.k3:0}); // a master carries three affixes
  const verb=B.verbs[Math.floor(R()*B.verbs.length)],place="the "+(o.where||B.n).toLowerCase().replace(/^the /,""),drops=genDrops(o.zone,el,R);
  const E={id:o.id,name:proc(name),plural:proc(pluralOf(name)),zone:o.zone,mv,el,hp,atk,def,weak:[...nat.w],resist:[...nat.r],w:1,verb,
    intro:proc(o.boss?`${name} waits for you in ${place}.`:`${name} steps out of ${place}.`),
    lore:proc(B.lore[Math.floor(R()*B.lore.length)]),
    sp:{...sp},drops,
    art:{b:body,p:parts,c:col,a:acc,pat:B.pats[Math.floor(R()*B.pats.length)],pc:acc,po:.5+R()*.4,skin:B.skins[Math.floor(R()*B.skins.length)]},
    afx,rar,gen:1,seed:o.seed};
  if(o.boss){E.boss=true;E.short=proc("the "+name.split(" ").pop());E.w=3;E.drops=[...drops,["star_heart",.3]]}
  if(nat.i)E.inf={s:nat.i,ch:.25};
  return E}
// the ten wild creatures of a region: the same in every playthrough (the seed is the region's id)
function genRoster(zone){const bi=ZONE_BIOME[zone],R=rng(hash("wild:"+zone)),used=new Set(),t=GEN_T[zone],out=[];
  for(let i=0;i<GEN_N;i++)out.push(genCreature({id:"w_"+zone+"_"+i,zone,biome:bi,tier:t,R,used,seed:zone}));
  return out}
const regMon=list=>list.forEach(E=>{ENEMIES[E.id]=E});
function buildRoster(){ // the wild creatures of the four hand-made regions
  ZONES.forEach(z=>{if(z[0]===RIFT_ZONE)return;regMon(genRoster(z[0]))})}
// ---- the Rift: a random region, rolled from one seed
const RIFT_BIOMES=["fen","ash","bone","deep","forest","tundra","ember","astral"];
function riftMake(seed,depth){ // a random region: biome, palette, name, ten wild creatures and a master
  const R=rng(seed),bi=RIFT_BIOMES[Math.floor(R()*RIFT_BIOMES.length)],B=BIOMES[bi];
  const reg=B.regions[Math.floor(R()*B.regions.length)];
  const tier={hp:Math.round(GEN_T.spire.hp*(1+.18*(depth-1))),atk:Math.round(GEN_T.spire.atk*(1+.12*(depth-1))),def:GEN_T.spire.def+Math.floor((depth-1)/2)};
  const cols=B.cols.slice(),pal={tf:cols[0],tl:cols[1],tb:cols[2]};
  const used=new Set(),list=[];
  for(let i=0;i<RIFT_N;i++)list.push(genCreature({id:"w_rift_"+i,zone:RIFT_ZONE,biome:bi,tier,R:rng(hash(seed+":w"+i)),used,where:reg,seed}));
  list.push(genCreature({id:"rift_boss",zone:RIFT_ZONE,biome:bi,tier,R:rng(hash(seed+":boss")),used,boss:1,where:reg,seed}));
  regMon(list);
  return{seed,depth,biome:bi,name:reg,pal,tier}}
function riftEnsure(){ // the Rift's region is rebuilt from the save (its seed) on every load
  const r=S&&S.rift;if(!r)return null;
  if(!r.seed){if(S.zone!==RIFT_ZONE)return null;r.seed=hash("rift:"+(r.depth||1)+":"+Math.floor(Math.random()*1e9));r.depth=r.depth||1}
  if(ENEMIES.rift_boss&&ENEMIES.rift_boss.seed===r.seed)return r;
  const sp=riftMake(r.seed,r.depth);r.biome=sp.biome;r.name=sp.name;r.pal=sp.pal;r.tier=sp.tier;return r}
function riftDescend(){ // one region deeper: the depth goes up, a new region is rolled, a new map is drawn
  const r=S.rift;if(!r||S.zone!==RIFT_ZONE)return;
  r.depth=(r.depth||1)+1;r.best=Math.max(r.best||0,r.depth);r.cleared=0;r.seed=hash("rift:"+r.depth+":"+Math.floor(Math.random()*1e9));
  riftEnsure();S.maps[RIFT_ZONE]=newMap(RIFT_ZONE);S.battle=null;S.event=null;save();render();
  toast(tx("You descend to depth {n}: {name}.",{n:r.depth,name:r.name||tx("unknown")}))}
buildRoster(); // the four regions get their wild creatures as the game loads
riftEnsure();  // a Rift run in progress is rebuilt from its seed

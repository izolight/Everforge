// ================= BIOMES, WILD CREATURES, RANDOM REGIONS =================
// A biome is a theme: the elements, bodies, parts, accents and words its creatures are built from. A creature's body takes its
// element's colour (ELPAL) and its accent the biome's (acc), so an element reads the same in every biome.
// Every region gets ten wild creatures (genRoster): composed from the biome's parts, carrying affixes of their
// own, and the same in every playthrough (the seed is the region's id). They are rare-grade creatures, so the map
// shows them with a frame, but their own affixes drop no extra essence: the economy of a region does not move.
// The Rift (riftMake) is a random region: a biome, a palette, a name, ten wild creatures and a master, all rolled
// from one seed. The seed is kept in the save, so a reloaded game rebuilds exactly the same region.
const BIOMES={
forest:{n:"Whispering Woods",els:["wood","poison","fire","swift","metal"],bodies:["beast","canine","feline","undead","humanoid","elemental","construct"],parts:["mane","antlers","horns","tail","vines","spikes","hood","wings","shell","tusks"],pats:["bands","stripes","rot","scales","cracks","swirl"],
  acc:["#b5b04a","#6e8a3a"],skins:["#c99b78","#b78a63"],verbs:["bites you","claws you","rakes you","slashes at you","lashes you","gores you"],
  pre:["Briar","Moss","Thorn","Fern","Oak","Rowan","Hazel","Grove","Bramble","Alder"],suf:["Stalker","Crawler","Watcher","Gnawer","Runner","Warden","Lurker","Creeper","Slasher","Hound"],
  regions:["The Old Grove","The Rootless Wood","Whispering Thicket","The Thornbriar Glade","The Canopy Deep","The Mossbound Copse"],lore:["It hunts where the light ends and the roots begin.","The forest grew it, and the forest keeps it.","It wears moss like a coat and never takes it off.","Old tracks end at it. Nothing else lives here."]},
tundra:{n:"Frostfang Pass",els:["ice","swift","stone","arcane","metal"],bodies:["beast","canine","feline","bear","elemental","construct","humanoid","undead"],parts:["frost","mane","horns","tail","spikes","armor","crystals","antlers","hood","tusks","staff"],pats:["facets","bands","swirl","scales","stars","stripes"],
  acc:["#f4fbff","#bfe0ea"],skins:["#c99b78","#a8846a"],verbs:["bites you","claws you","mauls you","buffets you","hacks at you","slams you"],
  pre:["Rime","Frost","Glacier","Snow","Wind","Pale","Bitter","Hail"],suf:["Stalker","Razor","Howler","Drifter","Warden","Shredder","Lurker","Runner","Biter","Crusher"],
  regions:["The White Silence","The Grey Shelf","The Frostfang Expanse","The Rimebound Steppe","The Howling Drifts","The Glacier Teeth"],lore:["The cold got into it first; the rest is habit.","It waits where the wind funnels between the rocks.","Snow covers its tracks, but not for long.","It was born in a blizzard and never warmed up."]},
ember:{n:"Cinder Hollow",els:["fire","poison","metal","stone"],bodies:["elemental","construct","humanoid","undead","beast","reptile"],parts:["flames","spikes","armor","chains","horns","crown","runes","wings","shell","blade"],pats:["cracks","bands","facets","swirl","stars","stripes"],
  acc:["#ff8a3d","#ff5a1f"],skins:["#c99b78","#9c6e43"],verbs:["scorches you","hammers you","scalds you","rakes you","claws you","strikes you"],
  pre:["Cinder","Ember","Slag","Ash","Forge","Molten","Kiln","Scoria"],suf:["Hound","Sentinel","Warden","Drake","Creeper","Tender","Hammer","Wretch","Thief","Creecher"],
  regions:["The Ashen Kilns","The Slag Flats","The Vent Fields","The Magma Shelf","The Smoulder Fields","The Brimstone Gorge"],lore:["It was forged, and then let go.","The Hollow's heat made it, and the Hollow forgets it.","Everything it touches keeps a little warmth.","It smells of coal and of old, old iron."]},
astral:{n:"Starfall Spire",els:["arcane","holy","swift","shadow"],bodies:["construct","elemental","humanoid","beast","feline","undead"],parts:["orbit","runes","halo","wings","crown","crystals","armor","chains","mane","staff","blade"],pats:["stars","bands","swirl","scales","facets","cracks"],
  acc:["#f6d36b","#fff3c4"],skins:["#e9e0cf","#c9b9a8"],verbs:["strikes you","smites you","rakes you","touches you","chills you","hacks at you"],
  pre:["Star","Void","Astral","Rune","Halo","Fallen","Gilded","Umbral"],suf:["Watcher","Sentinel","Warden","Acolyte","Construct","Lynx","Seer","Wraith","Scribe","Herald"],
  regions:["The Starless Gallery","The Ossuary of Glass","The Vault of Falling Light","The Orrery Ring","The Comet Reach","The Dimming Sky"],lore:["It was a star that learned to walk.","Something up here rewrote it.","It keeps the hour it was made for.","The stars moved; it did not."]},
fen:{n:"Mirewood Fen",els:["poison","wood","shadow","swift"],bodies:["beast","undead","elemental","humanoid","construct"],parts:["vines","mane","tail","horns","spikes","shell","hood","antlers","wings","tusks"],pats:["rot","scales","swirl","stripes","bands","stars"],
  acc:["#4d5a2a","#2e3420"],skins:["#a89b7a","#8f9f5c"],verbs:["lashes you","claws you","bites you","strikes you","scalds you","hacks at you"],
  pre:["Mire","Fen","Silt","Reed","Bog","Moss","Weeping","Drowned"],suf:["Crawler","Leech","Lurker","Drowner","Watcher","Warden","Slimer","Gnawer","Wretch","Drifter"],
  regions:["The Weeping Fen","The Silt Marches","Rotmire Hollow","The Sunken Reeds","The Leech Shallows","The Black Mere"],lore:["The bog keeps what it takes.","It surfaces only when the water is still.","Half of it is moss, and the moss is hungry.","It was a traveller once. The fen kept it."]},
ash:{n:"The Cinder Wastes",els:["fire","metal","stone","poison"],bodies:["construct","humanoid","elemental","beast","undead"],parts:["armor","spikes","flames","chains","horns","shell","hood","crystals","wings","blade","axe"],pats:["bands","cracks","facets","stripes","scales","swirl"],
  acc:["#4a4643","#8a847c"],skins:["#b08a63","#8a6a4a"],verbs:["hammers you","strikes you","scorches you","rakes you","gores you","claws you"],
  pre:["Dune","Cinder","Brass","Glass","Salt","Iron","Ashen","Scrap"],suf:["Raider","Sentinel","Golem","Drifter","Reaver","Warden","Hound","Creeper","Wretch","Hulk"],
  regions:["The Glass Desert","The Rust Flats","The Salt Reach","The Dune Sea","The Brass Wastes","The Scrapheap"],lore:["It was made to work in the sun, and never stopped.","Glass underfoot, and something that drinks the heat.","Nothing grows here; it grows anyway.","The wastes are full of things that were once people."]},
bone:{n:"Ossuary Barrens",els:["shadow","holy","stone","poison"],bodies:["undead","beast","humanoid","construct","elemental"],parts:["horns","antlers","mane","chains","armor","tail","hood","runes","wings","axe"],pats:["rot","cracks","scales","bands","swirl","stars"],
  acc:["#e4dccb","#c9b48a"],skins:["#c9b9a8","#a89880"],verbs:["claws you","gores you","smites you","hacks at you","lashes you","strikes you"],
  pre:["Bone","Ossuary","Marrow","Grave","Pallid","Riven","Silent","Hollow"],suf:["Warden","Crawler","Hound","Sexton","Ritual","Thrall","Watcher","Gnawer","Wretch","Choir"],
  regions:["The Pallid Fields","The Ossuary Gate","The Long Barrows","The Charnel Moors","The Hushed Cairns","The Ribcage Vale"],lore:["It was buried with something it did not forgive.","The dead here do not lie down.","It wears the bones of better fighters.","Something keeps the barrows tidy."]},
deep:{n:"The Weeping Deep",els:["arcane","ice","shadow","poison"],bodies:["elemental","construct","beast","undead","humanoid"],parts:["crystals","runes","vines","tail","frost","hood","shell","spikes","chains","staff"],pats:["stars","swirl","cracks","facets","bands","rot"],
  acc:["#3ff0ff","#7fe8ff"],skins:["#9fb0b8","#7f8f98"],verbs:["chills you","touches you","strikes you","claws you","scalds you","rakes you"],
  pre:["Deep","Weeping","Glass","Abyss","Silent","Pale","Vault","Drowned"],suf:["Warden","Sentinel","Watcher","Husk","Seeker","Lurker","Chorus","Creeper","Thrall","Drifter"],
  regions:["The Weeping Vaults","The Glass Deeps","The Drowned Gallery","The Sunless Sump","The Lightless Shelf","The Abyssal Choir"],lore:["It came up from a place that has no floor.","The water there keeps its shape.","It remembers a door that no longer exists.","Every sound in the deep answers itself."]},
  tidewrack:{n:"The Tidewrack",els:["ice","poison","shadow","swift"],bodies:["beast","undead","elemental","humanoid"],parts:["shell","frost","tail","vines","hood","crystals"],pats:["bands","cracks","scales","stripes","rot","swirl"],
  acc:["#426f7d","#75a6a8"],skins:["#b7b19f","#788e91"],verbs:["chills you","claws you","strikes you","rakes you","lashes you","bites you"],
  pre:["Saltwind","Tidewrack","Drowned","Brine","Silt","Shoal","Wreck","Rime"],suf:["Watcher","Warden","Hound","Wraith","Lurker","Creeper","Gnawer","Drifter"],
  regions:["The Drowned Coast","Saltwind Cliffs","The Tidewrack","The Wreck Shoals","The Silt Reach","The Frosted Shoals"],lore:["The tide took the village, then came back for the bones.","A salt wind worries every name off the stones.","The wrecks drift with no water beneath them.","Something patient waits where the tide turns."]},
  windcut:{n:"Windcut Crags",els:["stone","metal","swift","arcane"],bodies:["beast","humanoid","construct","elemental"],parts:["armor","horns","chains","crystals","wings","tail"],pats:["facets","cracks","bands","stars","stripes","scales"],
  acc:["#8296a2","#c29b62"],skins:["#b99a7c","#897866"],verbs:["buffets you","hammers you","slashes at you","rakes you","strikes you","slams you"],
  pre:["Windcut","Ironwind","Crag","Gale","Highland","Skyshard","Chainfall","Ridge"],suf:["Warden","Sentinel","Stalker","Runner","Razor","Watcher","Golem","Drifter"],
  regions:["The Windcut Crags","The Iron Highlands","The Skyward Pass","The Shattered Ridge","The Chainwind Shelf","The Highstone Reach"],lore:["The wind carved the ridges and left the hardest things standing.","Iron chains sing between cliffs when the gale turns.","The high pass belongs to whatever can keep its footing.","Crystals ring beneath the stone whenever the sky breaks open."]},
  garden:{n:"Radiant Garden",els:["holy","wood","poison","swift"],bodies:["beast","humanoid","elemental","undead"],parts:["antlers","vines","halo","wings","crown","mane"],pats:["bands","swirl","stars","veins","stripes","cracks"],
  acc:["#dc91c7","#79c86e"],skins:["#e5c79c","#b9a37d"],verbs:["lashes you","strikes you","rakes you","smites you","bites you","claws you","slams you"],
  pre:["Sunlit","Gilded","Briar","Honeyed","Dewfall","Orchard","Crownleaf","Pollen"],suf:["Warden","Stalker","Watcher","Hound","Wraith","Herald","Creeper","Choir"],
  regions:["The Sunken Garden","The Gilded Grove","The Orchard of Bones","The Amber Conservatory","The Haloed Bower","The Briar Crown"],lore:["Sunlight pools here where no sky can reach.","The garden keeps every bloom that ever fell.","A bright halo circles the oldest roots.","The orchard bears fruit that remembers its pickers."]},
  geyser:{n:"Geyser Field",els:["fire","ice","stone","arcane"],bodies:["elemental","construct","beast","humanoid"],parts:["flames","frost","crystals","armor","horns","runes"],pats:["cracks","facets","swirl","scales","bands","stars"],
  acc:["#e9874e","#83cfd3"],skins:["#c18c68","#899397"],verbs:["scalds you","chills you","strikes you","hammers you","rakes you","cracks against you"],
  pre:["Geyser","Steam","Basalt","Fumarole","Boiling","Caldera","Sinter","Whitecap"],suf:["Warden","Sentinel","Watcher","Stalker","Wraith","Golem","Hulk","Drifter"],
    regions:["The Steam Vents","The Boiling Shelf","The White Caldera","The Sinter Fields","The Fumarole Reach","The Glasscone Basin"],lore:["The mountain breathes through every crack.","Steam hides the paths and gives away the hunters.","Basalt cools only after the next eruption.","A thin crust covers water hot enough to melt stone."]},

};
// Optional element weights: common entries receive weight 3, rare entries weight 1.
// The Rift-only signatures from M-05 use the same field: their signature element
// has weight 2 and peers weight 1, so the old 2:1 bias is represented once.
const BIOME_ELW={
  forest:{wood:3,poison:3,swift:3,fire:1,metal:1},
  tundra:{ice:3,swift:3,stone:3,arcane:1,metal:1},
  ember:{fire:3,poison:3,metal:3,stone:1},
  astral:{arcane:3,holy:3,swift:3,shadow:1},
  fen:{poison:2,wood:1,shadow:1,swift:1},
  ash:{fire:2,metal:1,stone:1,poison:1},
  bone:{shadow:2,holy:1,stone:1,poison:1},
  deep:{ice:2,arcane:1,shadow:1,poison:1},
  tidewrack:{ice:3,poison:3,shadow:1,swift:1},
  windcut:{stone:3,metal:3,swift:3,arcane:1},
  garden:{holy:3,wood:3,poison:1,swift:1},
  geyser:{fire:3,ice:3,stone:3,arcane:1},
};
Object.keys(BIOME_ELW).forEach(k=>BIOMES[k].elW=BIOME_ELW[k]);
// the element a creature is born to: what it is weak to, what it shrugs off, and what it inflicts on a hit
const EL_NAT={fire:{w:["ice"],r:["fire"],i:"burn"},ice:{w:["fire"],r:["ice"],i:"chill"},poison:{w:["fire"],r:["poison"],i:"poison"},holy:{w:["shadow"],r:["holy"],i:null},
  shadow:{w:["holy"],r:["shadow"],i:"curse"},wood:{w:["fire"],r:["wood"],i:null},metal:{w:["arcane"],r:["metal"],i:null},arcane:{w:["holy"],r:["arcane"],i:null},
  swift:{w:["stone"],r:["swift"],i:null},stone:{w:["arcane"],r:["stone"],i:null}};
// the biome of each hand-made region, and its element pool: every element of the pool needs an authored (non-boss) enemy of that region, or a documented exception (tools/sim.js checks it). The enemies outside their pool are additions, not gaps: Woods holy (Glowcap Sprite) and shadow (Barrow Ghoul), Pass and Hollow shadow (Ice Wraith, Ash Revenant), Spire metal (Orrery Construct).
const ZONE_BIOME={woods:"forest",pass:"tundra",hollow:"ember",spire:"astral"},GEN_N=10,RIFT_N=10,RIFT_ZONE="rift";
// authored wilds are deliberately stronger than regulars; their affix rarity is still normalized out
const GEN_T={woods:{hp:30,atk:6,def:2},pass:{hp:58,atk:11,def:4},hollow:{hp:92,atk:14,def:5},spire:{hp:120,atk:21,def:6}};
// six specials the wild creatures share; their names and tells are translated like any other
const GEN_SP=[
  {every:3,name:"Wild Rush",kind:"multi",n:2,x:.85,tell:"coiling to spring"},
  {every:3,name:"Heavy Slam",kind:"heavy",x:1.9,tell:"raising itself to strike"},
  {every:4,name:"Mend",kind:"heal",x:.22,tell:"knitting itself back together"},
  {every:3,name:"Soul Drain",kind:"drain",x:1.1,tell:"reaching for your life"},
  {every:4,name:"Savage Charge",kind:"heavy",x:2.1,tell:"lowering its head"},
  {every:3,name:"Bolt",kind:"multi",n:3,x:.6,tell:"drawing power together"}];
// Each biome carries signature specials for ordinary wild creatures. Unknown
// keys and generated masters keep the shared pool to protect the accepted
// generated-master profile; each selection still consumes exactly one draw.
const BIOME_SP={
  fen:[
    {every:3,name:"Mire Leech",kind:"drain",x:1.05,tell:"pulling at your warmth"},
    {every:4,name:"Silt Snare",kind:"heavy",x:1.8,tell:"drawing back from the mud"},
    {every:4,name:"Reedstorm",kind:"multi",n:3,x:.56,tell:"gathering reeds in a spinning ring"}],
  ash:[
    {every:3,name:"Glassfall",kind:"heavy",x:1.9,tell:"cracking the scorched earth"},
    {every:4,name:"Cinder Shards",kind:"multi",n:3,x:.58,tell:"spinning a ring of hot grit"},
    {every:4,name:"Cinder Mend",kind:"heal",x:.2,tell:"drawing heat back into its core"}],
  bone:[
    {every:3,name:"Grave Rattle",kind:"multi",n:2,x:.82,tell:"shaking its loose bones"},
    {every:4,name:"Ossuary Crush",kind:"heavy",x:1.9,tell:"lifting a cairn stone"},
    {every:4,name:"Marrow Knit",kind:"heal",x:.2,tell:"pulling its broken bones together"}],
  deep:[
    {every:4,name:"Undertow",kind:"drain",x:1.05,tell:"drawing water through its grasp"},
    {every:5,name:"Pressure Wave",kind:"heavy",x:1.9,tell:"compressing the water around it"},
    {every:4,name:"Rifted Wake",kind:"multi",n:2,x:.8,tell:"rolling a wave toward you"}],
  forest:[
    {every:3,name:"Briar Flurry",kind:"multi",n:2,x:.82,tell:"drawing back thorned vines"},
    {every:4,name:"Stag Crash",kind:"heavy",x:1.9,tell:"lowering its antlers"},
    {every:4,name:"Barkskin Mend",kind:"heal",x:.2,tell:"drawing sap into its wounds"}],
  tundra:[
    {every:3,name:"Rime Volley",kind:"multi",n:3,x:.58,tell:"gathering a fan of ice"},
    {every:4,name:"Glacier Drop",kind:"heavy",x:1.9,tell:"raising a slab of ice"},
    {every:4,name:"Snowdrift Mend",kind:"heal",x:.2,tell:"sealing its cracks with snow"}],
  ember:[
    {every:3,name:"Kiln Flurry",kind:"multi",n:2,x:.82,tell:"spinning up its furnace"},
    {every:4,name:"Foundry Blow",kind:"heavy",x:1.9,tell:"drawing back a molten fist"},
    {every:4,name:"Coalheart Drain",kind:"drain",x:1.05,tell:"siphoning warmth from the air"}],
  astral:[
    {every:3,name:"Void Leech",kind:"drain",x:1.05,tell:"reaching through the dark"},
    {every:4,name:"Starfall Burst",kind:"multi",n:3,x:.58,tell:"drawing power from above"},
    {every:4,name:"Starless Crush",kind:"heavy",x:1.9,tell:"folding the dark around you"}],
  tidewrack:[
    {every:3,name:"Undertow Grasp",kind:"drain",x:1.05,tell:"pulling you into the surf"},
    {every:4,name:"Brine Volley",kind:"multi",n:3,x:.56,tell:"gathering salt spray"},
    {every:4,name:"Breakwater Slam",kind:"heavy",x:1.9,tell:"lifting a cresting wave"}],
  windcut:[
    {every:3,name:"Crosswind Rend",kind:"multi",n:2,x:.82,tell:"sweeping its wings through the gale"},
    {every:4,name:"Cragfall Crush",kind:"heavy",x:1.9,tell:"heaving a slab of the ridge"},
    {every:4,name:"Chainlash",kind:"drain",x:1.05,tell:"drawing the iron chains taut"}],
  garden:[
    {every:3,name:"Briarwheel",kind:"multi",n:2,x:.8,tell:"drawing thorned vines into a shining ring"},
    {every:4,name:"Crownfall",kind:"heavy",x:1.8,tell:"raising its crown of branches"},
    {every:4,name:"Sunward Mend",kind:"heal",x:.2,tell:"turning its halo to gather light"}],
  geyser:[
    {every:3,name:"Fumarole Burst",kind:"multi",n:3,x:.56,tell:"drawing heat from below"},
    {every:4,name:"Basalt Quake",kind:"heavy",x:1.9,tell:"raising a slab of heated stone"},
    {every:4,name:"Steam Mend",kind:"heal",x:.2,tell:"drawing vapor through its cracks"}],

};
// Four Rift-only biomes lean on one element, material, and natural status trait.
// These reuse existing elements/items/status rules and do not add RNG calls.
const RIFT_IDENTITY={
  fen:{el:"poison",drop:"witchwood",trait:"Mire Venom",inf:{s:"poison",ch:.25}},
  ash:{el:"fire",drop:"storm_feather",trait:"Cinder Brand",inf:{s:"burn",ch:.25}},
  bone:{el:"shadow",drop:"void_crystal",trait:"Grave Curse",inf:{s:"curse",ch:.25}},
  deep:{el:"ice",drop:"holy_water",trait:"Undertow Chill",inf:{s:"chill",ch:.25}}
};
const biomeSpecialFor=(biome,R)=>{const pool=BIOME_SP[biome]||GEN_SP;return pool[Math.floor(R()*pool.length)]};
function biomeElement(zone,biome,B,R,elW=B.elW,rollInfo){
  const roll=R();if(rollInfo)rollInfo.uniform=B.els[Math.min(B.els.length-1,Math.floor(roll*B.els.length))];
  const identity=zone===RIFT_ZONE&&RIFT_IDENTITY[biome],weights=B.els.map(el=>{
    const configured=elW&&Number.isFinite(elW[el])&&elW[el]>0?elW[el]:1;
    return identity ? (identity.el===el?Math.max(configured,2):configured) : configured;
  }),total=weights.reduce((a,w)=>a+w,0);
  let n=roll*total;
  for(let i=0;i<B.els.length;i++){n-=weights[i];if(n<0)return B.els[i]}
  return B.els[B.els.length-1];
}
// what a wild creature can carry: the region's own materials, so a region's economy does not move
const GEN_DROP={
  woods:{any:["boar_hide","mushroom","honey","bread","scrap_iron"],fire:["chili","boar_hide"],poison:["mushroom","honey"],wood:["boar_hide","honey"],swift:["boar_hide","oak_bough"],metal:["scrap_iron"],holy:["sprite_dust","bread"],shadow:["boar_hide","bread"],arcane:["oak_bough","sprite_dust"],ice:["boar_hide","bread"],stone:["boar_hide","bread"]},
  pass:{any:["pelt","spring_water","holy_water","bread"],ice:["pelt","spring_water"],swift:["spring_water","pelt"],stone:["golem_core","scrap_iron"],arcane:["rune_shard","holy_water"],metal:["scrap_iron"],fire:["holy_water","bread"],poison:["shroud","holy_water"],wood:["oak_bough","pelt"],holy:["holy_water","spring_water"],shadow:["shroud","holy_water"]},
  hollow:{any:["coal","nightshade","holy_water","bread"],fire:["coal","chili"],poison:["nightshade","coal"],metal:["golem_core","slag_iron"],stone:["golem_core","slag_iron"],shadow:["witchwood","holy_water"],arcane:["witchwood"],swift:["slag_iron","coal"],holy:["holy_water","coal"],wood:["coal","bread"],ice:["coal","holy_water"]},
  spire:{any:["rune_shard","holy_water","void_crystal","bread"],arcane:["rune_shard","void_crystal"],holy:["holy_water","storm_feather"],swift:["storm_feather"],shadow:["void_crystal"],metal:["sentinel_plate","golem_core"],stone:["golem_core","rune_shard"],ice:["storm_feather","holy_water"],fire:["storm_feather","holy_water"],poison:["witchwood","void_crystal"],wood:["rune_shard","bread"]},
  rift:{any:["rune_shard","void_crystal","storm_feather","star_heart","bread"],arcane:["rune_shard","void_crystal","star_heart"],holy:["holy_water","storm_feather"],swift:["storm_feather"],shadow:["void_crystal"],metal:["sentinel_plate","golem_core"],stone:["golem_core","rune_shard"],ice:["storm_feather","holy_water"],fire:["storm_feather","star_heart"],poison:["witchwood","void_crystal"],wood:["rune_shard","bread"]}};
// every string a generated creature shows (the translation check skips them: a procedural name has no dictionary entry)
const PROC=new Set(),proc=s=>{PROC.add(s);return s};
const pluralOf=n=>/(s|x|z|ch|sh)$/.test(n)?n+"es":/[^aeiou]y$/.test(n)?n.slice(0,-1)+"ies":n+"s";
const BODY_NOUNS={
  beast:["Stalker","Crawler","Watcher","Gnawer","Runner","Lurker","Creeper","Slasher","Hound","Wolf","Lynx","Bear","Drake","Salamander"],
  canine:["Hound","Wolf","Stalker","Runner","Howler","Biter"],
  feline:["Lynx","Cat","Stalker","Prowler","Runner"],
  bear:["Bear","Hulk","Crusher","Warden","Stalker"],
  reptile:["Drake","Salamander","Crawler","Lurker","Stalker"],
  construct:["Construct","Sentinel","Warden","Watcher","Golem","Crawler","Hulk"],
  undead:["Wraith","Thrall","Watcher","Warden","Choir","Crawler","Gnawer"],
  elemental:["Spirit","Wraith","Watcher","Warden","Crawler","Herald"],
  humanoid:["Raider","Warden","Watcher","Sentinel","Acolyte","Seer","Herald","Scribe"]
};
const nameWords=(B,body)=>{const allowed=BODY_NOUNS[body];const filtered=allowed?B.suf.filter(n=>allowed.includes(n)):B.suf;return filtered.length?filtered:(allowed||B.suf)};
function genName(B,R,used,body){ // biome vocabulary stays intact while animal and construct nouns follow the selected anatomy
  const words=nameWords(B,body);
  for(let i=0;i<60;i++){const n=B.pre[Math.floor(R()*B.pre.length)]+" "+words[Math.floor(R()*words.length)];if(!used.has(n)){used.add(n);return n}}
  const n=B.pre[0]+" "+words[0]+" the "+used.size;used.add(n);return n}
function accFor(B,body,R){ // a biome accent at dE 25 or more from the body; else the accent moved in lightness until it is (the best seen)
  const n=B.acc.length,k=Math.floor(R()*n);
  for(let i=0;i<n;i++){const a=B.acc[(k+i)%n];if(dE(a,body)>=25)return a}
  const[h,s,l]=toHsl(B.acc[k]);let best=B.acc[k],bd=dE(best,body);
  for(const dir of[1,-1])for(let i=1;i<=12;i++){const c=fromHsl(h,s,l+dir*i*.04),d=dE(c,body);if(d>=25)return c;if(d>bd){best=c;bd=d}}
  return best}
function genDrops(zone,el,R,biome){ // one to three of the region's own materials
  const t=GEN_DROP[zone]||GEN_DROP.spire,list=t[el]&&t[el].length?t[el]:t.any,n=1+Math.floor(R()*2.6),out=[],seen=new Set();
  const identity=zone===RIFT_ZONE&&RIFT_IDENTITY[biome];
  for(let i=0;i<n;i++){
    const id=list[Math.floor(R()*list.length)];if(seen.has(id))continue;seen.add(id);
    const p=.35+R()*.45,bonus=identity&&id===identity.drop ? .12 : 0;
    out.push([id,Math.min(.9,p+bonus)]);
  }
  if(!out.length)out.push([t.any[0],.6]);
  return out}
// the parts each body can wear, from the anchors in js/art/bodies.js: weapons need a hand on a torso (humanoid, construct), tusks and antlers a beast's head,
// tail only a beast (its tail root t), hood and crown a head, halo a head that is not hooded, wings a body that can carry them. A part outside its body's list is never drawn.
const BODY_PARTS={
  beast:["mane","antlers","horns","tail","tusks","spikes","armor","shell","vines","wings","flames","frost","crystals"],
  canine:["mane","horns","tail","spikes","armor","vines","wings","flames","frost","crystals"],
  feline:["mane","horns","tail","spikes","armor","vines","wings","flames","frost","crystals"],
  bear:["mane","horns","tail","spikes","armor","shell","vines","wings","flames","frost","crystals"],
  reptile:["horns","tail","spikes","armor","shell","vines","wings","flames","frost","crystals"],
  undead:["horns","crown","hood","chains","vines","spikes","wings","crystals"],
  humanoid:["blade","axe","staff","horns","crown","hood","halo","orbit","wings","armor","vines","runes","chains","crystals","frost","flames"],
  elemental:["horns","crown","halo","orbit","wings","armor","spikes","chains","shell","vines","flames","frost","crystals","runes"],
  construct:["blade","axe","staff","horns","crown","halo","orbit","armor","spikes","chains","shell","runes","crystals"]};
// Headwear occupies the same silhouette space; allow at most one major head shape per generated creature.
const PART_CONFLICTS={hood:["horns","antlers","crown","halo"],horns:["hood","antlers","crown","halo"],antlers:["hood","horns","crown","halo"],crown:["hood","horns","antlers","halo"],halo:["hood","horns","antlers","crown"]};
// one wild creature: a body and parts from the biome, an element, a rarity with affixes of its own, and stats
// at its region tier after rarity normalization (affix multipliers still count).
function genCreature(o){ // o:{id,zone,biome,tier,R,used,boss,where,seed}
  const B=BIOMES[o.biome],R=o.R,rar=o.boss?"rare":(R()<.3?"rare":"magic"),rm=RARITIES[rar],identity=o.zone===RIFT_ZONE?RIFT_IDENTITY[o.biome]:null;
  const elementPick={},el=biomeElement(o.zone,o.biome,B,R,B.elW,elementPick),nat=EL_NAT[el]||{w:[],r:[]};
  const mv=["still","wander","chase"][Math.floor(R()*3)],body=B.bodies[Math.floor(R()*B.bodies.length)];
  const pool=B.parts.filter(p=>BODY_PARTS[body].includes(p)),nparts=Math.min(1+Math.floor(R()*3),pool.length),parts=[]; // a body too bare for three parts wears what it can
  while(parts.length<nparts){const available=pool.filter(p=>!parts.includes(p)&&!parts.some(q=>(PART_CONFLICTS[q]||[]).includes(p)));if(!available.length)break;parts.push(available[Math.floor(R()*available.length)])}
  const col=ELPAL[el][Math.floor(R()*3)],acc=accFor(B,col,R); // body: the element's light, mid or dark; accent: the biome's
  const nouns=nameWords(B,body),name=o.boss?proc(cap(B.pre[Math.floor(R()*B.pre.length)])+" "+cap(nouns[Math.floor(R()*nouns.length)])):genName(B,R,o.used,body);
  const sp=biomeSpecialFor(o.boss?null:o.biome,R);
  // The region tier already climbs by depth; taper the master's bonus so it doesn't compound the whole HP/ATK ramp again.
  const depth=Math.max(1,o.depth||1),boss=o.boss?Math.max(3.2,4.4-.6*(depth-1)):1,atkm=o.boss?Math.max(.95,1-.025*(depth-1)):1;
  const wildHp=o.boss?boss:1,wildAtk=o.boss?atkm:1;
  const hp=Math.max(3,Math.round(o.tier.hp*(.8+R()*.45)*wildHp/rm.hp)),atk=Math.max(1,Math.round(o.tier.atk*(.85+R()*.3)*wildAtk/rm.atk));
  const def=Math.max(0,o.tier.def+Math.floor(R()*2)+(o.boss?2:0));
  // Keep the wild generation pool unchanged: filtering here would shift its seeded roster and Rift masters.
  const afx=rollAfx(R,rar,{mv,heat:o.boss?RAR_CH.k3:0,boss:!!o.boss,sp}); // masters use the full rare count with boss/special compatibility rules
  const verb=B.verbs[Math.floor(R()*B.verbs.length)],place="the "+(o.where||B.n).toLowerCase().replace(/^the /,""),dropEl=identity?el:elementPick.uniform,drops=genDrops(o.zone,dropEl,R,o.biome);
  const E={id:o.id,name:proc(name),plural:proc(pluralOf(name)),zone:o.zone,mv,el,hp,atk,def,weak:[...nat.w],resist:[...nat.r],w:1,verb,
    intro:proc(o.boss?`${name} waits for you in ${place}.`:`${name} steps out of ${place}.`),
    lore:proc(B.lore[Math.floor(R()*B.lore.length)]),
    sp:{...sp},drops,biomeTrait:identity?.trait||null,
    art:{b:body,p:parts,c:col,a:acc,pat:B.pats[Math.floor(R()*B.pats.length)],pc:acc,po:.5+R()*.4,skin:B.skins[Math.floor(R()*B.skins.length)]},
    afx,rar,gen:1,seed:o.seed};
  if(o.boss){E.boss=true;E.short=proc("the "+name.split(" ").pop());E.w=3;E.drops=[...drops,["star_heart",.3]]}
  if(identity?.inf)E.inf={...identity.inf};else if(nat.i)E.inf={s:nat.i,ch:.25};
  return E}
// the ten wild creatures of a region: the same in every playthrough (the seed is the region's id)
const WILD_ALPHA={woods:"Thornheart Alpha",pass:"Frosthorn Alpha",hollow:"Cinderback Alpha",spire:"Starcrown Alpha"};
const WILD_ALPHA_AFX={woods:["swiftfoot","elusive","shadow"],pass:["iron","split","frenzy"],hollow:["shadow","boom","regen"],spire:["vamp","thorn","swiftfoot"]};
function alphaAfx(E,zone){ // curated deterministic trio; register the species so the shared compatibility filter sees its special
  const old=ENEMIES[E.id];ENEMIES[E.id]=E;
  try{const ids=WILD_ALPHA_AFX[zone],pool=afxPool(E,E.mv,false,E.sp);if(!ids||ids.length!==3||ids.some(a=>!pool.includes(a))||ids.some((a,i)=>ids.slice(i+1).some(b=>!afxOk(a,b))))throw Error("invalid alpha affix profile: "+zone);return [...ids]}
  finally{if(old)ENEMIES[E.id]=old;else delete ENEMIES[E.id]}}
function genRoster(zone){const bi=ZONE_BIOME[zone],R=rng(hash("wild:"+zone)),used=new Set(),t=GEN_T[zone],out=[];
  for(let i=0;i<GEN_N;i++)out.push(genCreature({id:"w_"+zone+"_"+i,zone,biome:bi,tier:t,R,used,seed:zone}));
  // Promote an existing deterministic roster slot. This post-generation pass
  // leaves all other names, body parts, specials, stats and roster size stable.
  if(WILD_ALPHA[zone]&&out.length){const E=out[hash("wild-alpha-slot:"+zone)%out.length];
    E.alpha=true;E.name=WILD_ALPHA[zone];E.plural=E.name;E.rar="rare";E.afx=alphaAfx(E,zone);
    E.hp=Math.round(E.hp*1.3);E.atk=Math.round(E.atk*1.1);E.def+=2;}
  return out}
// Wild foes use a tutorial profile below the zone's stage-kit's Smith level,
// then a stronger combat-only band when the player reaches that progression.
// This is deterministic and does not rewrite the seeded roster or consume RNG.
const WILD_STAGE_LV={woods:3,pass:5,hollow:7,spire:9,fen:10};
function m12WildBand(E,smithLevel){
  const stage=WILD_STAGE_LV[E&&E.zone];
  if(!E||!E.gen||E.boss||E.zone===RIFT_ZONE||!stage||smithLevel<stage)return{hp:1,atk:1};
  return{hp:E.zone==="woods"?4.5:2,atk:1};
}
const regMon=list=>list.forEach(E=>{ENEMIES[E.id]=E});
function buildRoster(){ // authored regions use their fixed rosters; Fen is not Rift Fen
  ZONES.forEach(z=>{if(z[0]===RIFT_ZONE||z[0]==="fen")return;regMon(genRoster(z[0]))})}
// ---- the Rift: a random region, rolled from one seed
const RIFT_BIOMES=["fen","ash","bone","deep","forest","tundra","ember","astral","tidewrack","windcut","garden","geyser"];
function riftMake(seed,depth){ // a random region: biome, palette, name, ten wild creatures and a master
  const R=rng(seed),bi=RIFT_BIOMES[Math.floor(R()*RIFT_BIOMES.length)],B=BIOMES[bi];
  const reg=B.regions[Math.floor(R()*B.regions.length)];
  const tier={hp:Math.round(GEN_T.spire.hp*(1+.18*(depth-1))),atk:Math.round(GEN_T.spire.atk*(1+.12*(depth-1))),def:GEN_T.spire.def+Math.floor((depth-1)/2)};
  const[ph,ps]=toHsl(B.acc[0]),pal={tf:fromHsl(ph,ps*.6,.09),tl:fromHsl(ph,ps*.6,.17),tb:B.acc[0]}; // the map's floor, lit floor and border, from the biome accent
  const used=new Set(),list=[];
  for(let i=0;i<RIFT_N;i++)list.push(genCreature({id:"w_rift_"+i,zone:RIFT_ZONE,biome:bi,tier,R:rng(hash(seed+":w"+i)),used,where:reg,seed}));
  list.push(genCreature({id:"rift_boss",zone:RIFT_ZONE,biome:bi,tier,R:rng(hash(seed+":boss")),used,boss:1,depth,where:reg,seed}));
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
  toast(tx("You descend to depth {n}: {name}.",{n:r.depth,name:r.name?tx(r.name):tx("unknown")}))}
// The wild roster (buildRoster) and the Rift's region (riftEnsure) are built in boot(), once every script has loaded.


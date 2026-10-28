// ================= DATA =================
const FAM={fire:"#ec7d4c",ice:"#82c9e4",poison:"#93c252",holy:"#f0d77a",shadow:"#a385dc",wood:"#b48b5c",metal:"#aab6ba",heal:"#e893ab",arcane:"#b892f2",swift:"#6fd8b6",stone:"#9c998c",bad:"#d9644e"};
const TRAITS={
  Sharp:{f:"metal",adj:"Keen",s:{atk:3}}, Heavy:{f:"stone",adj:"Weighty",s:{atk:1,def:2,spd:-1.5}},
  Fire:{f:"fire",adj:"Smoldering",s:{atk:2,mag:1}}, Ice:{f:"ice",adj:"Frozen",s:{atk:1.5,def:.5}},
  Steam:{f:"ice",adj:"Steaming",s:{mag:2,atk:1}}, Frost:{f:"ice",adj:"Rimed",s:{atk:2,mag:1}},
  Water:{f:"ice",adj:"Dewy",s:{heal:2.5}}, Poison:{f:"poison",adj:"Toxic",s:{atk:2,heal:-1}},
  Venomous:{f:"poison",adj:"Venomous",s:{atk:3}}, Nourishing:{f:"heal",adj:"Hearty",s:{heal:3}},
  Medicine:{f:"heal",adj:"Healing",s:{heal:4}}, Sweet:{f:"heal",adj:"Honeyed",s:{heal:1,spd:.5}},
  Light:{f:"holy",adj:"Glowing",s:{mag:1}}, Radiant:{f:"holy",adj:"Radiant",s:{mag:3}},
  Holy:{f:"holy",adj:"Blessed",s:{mag:2,heal:1.5}}, Sunfire:{f:"fire",adj:"Sunforged",s:{atk:3,mag:3}},
  Shadow:{f:"shadow",adj:"Shadowed",s:{mag:2,atk:1}}, Twilight:{f:"shadow",adj:"Twilit",s:{mag:3.5}},
  Iron:{f:"metal",adj:"Iron",s:{def:2.5,atk:1}}, Tempered:{f:"metal",adj:"Tempered",s:{atk:2.5,def:1.5}},
  Stone:{f:"stone",adj:"Stone",s:{def:2}}, Wood:{f:"wood",adj:"Oaken",s:{def:1,mag:.5}},
  Fur:{f:"wood",adj:"Furred",s:{def:1.5}}, Insulated:{f:"wood",adj:"Fur-lined",s:{def:1.5}},
  Arcane:{f:"arcane",adj:"Arcane",s:{mag:2.5}}, Runic:{f:"arcane",adj:"Runic",s:{mag:2,def:2}},
  Swift:{f:"swift",adj:"Swift",s:{spd:3}}, Lure:{f:"holy",adj:"Buzzing",s:{spd:-.5}},
  Rust:{f:"bad",adj:"Rusted",s:{def:-2}}, Cursed:{f:"bad",adj:"Cursed",s:{mag:1,atk:-1}}, Brittle:{f:"bad",adj:"Cracked",s:{def:-2}}
};
const ESS_POOL=["Fire","Ice","Holy","Shadow","Arcane","Swift","Sharp","Iron","Poison","Nourishing","Stone","Water"];
const SLOTS=[["main","Main hand"],["off","Off hand"],["head","Head"],["body","Body"],["hands","Hands"],["feet","Feet"],["charm","Trinket"]];
const WS=["main","off"];
const FORMS={
  material:{p:1,g:"material",label:"Material",m:{atk:.5,def:.5,mag:.5,heal:.5,spd:.5}},
  food:{p:2,g:"consumable",label:"Food",m:{atk:.3,def:.3,mag:.5,heal:2.5,spd:.5}},
  potion:{p:3,g:"consumable",label:"Potion",m:{atk:.5,def:.4,mag:1.2,heal:2,spd:.7}},
  elixir:{p:3,g:"consumable",label:"Elixir",m:{atk:.5,def:.4,mag:1.3,heal:2.5,spd:.8},noun:"Elixir"},
  charm:{p:4,g:"charm",slots:["charm"],label:"Trinket",m:{atk:.5,def:.5,mag:1.2,heal:.8,spd:1.2}},
  helm:{p:5,g:"armor",slots:["head"],label:"Head armor",m:{atk:.3,def:1.2,mag:.6,heal:.3,spd:.6}},
  chest:{p:5,g:"armor",slots:["body"],label:"Body armor",m:{atk:.3,def:1.6,mag:.5,heal:.4,spd:.5}},
  gloves:{p:5,g:"armor",slots:["hands"],label:"Gloves",m:{atk:.6,def:.9,mag:.5,heal:.3,spd:.8}},
  boots:{p:5,g:"armor",slots:["feet"],label:"Boots",m:{atk:.3,def:.9,mag:.4,heal:.3,spd:1.2}},
  shield:{p:5,g:"armor",slots:["off"],label:"Shield",m:{atk:.4,def:1.4,mag:.5,heal:.3,spd:.6}},
  bulwark:{p:5,g:"armor",slots:["body"],label:"Bulwark",m:{atk:.3,def:2,mag:.5,heal:.4,spd:.4},noun:"Bulwark"},
  blade:{p:6,g:"weapon",slots:WS,label:"Blade",m:{atk:1.4,def:.4,mag:.7,heal:.3,spd:1}},
  spear:{p:6,g:"weapon",slots:WS,label:"Spear",m:{atk:1.25,def:.4,mag:.6,heal:.3,spd:1.2}},
  staff:{p:6,g:"weapon",slots:WS,label:"Staff",m:{atk:.7,def:.4,mag:1.5,heal:.6,spd:.9}},
  lance:{p:6,g:"weapon",slots:WS,label:"Lance",m:{atk:1.3,def:.9,mag:.5,heal:.3,spd:.8},noun:"Lance"},
  spellblade:{p:6,g:"weapon",slots:WS,label:"Spellblade",m:{atk:1.2,def:.4,mag:1.3,heal:.3,spd:1},noun:"Spellblade"},
  warstaff:{p:6,g:"weapon",slots:WS,label:"Warstaff",m:{atk:1.1,def:.5,mag:1.1,heal:.4,spd:1.1},noun:"Warstaff"},
  claws:{p:6,g:"weapon",slots:WS,label:"Claws",m:{atk:1.3,def:.5,mag:.5,heal:.3,spd:1.3},noun:"Claws"}
};
const FUSIONS=[["spear","shield","lance"],["blade","staff","spellblade"],["spear","staff","warstaff"],["blade","gloves","claws"],["chest","shield","bulwark"],["food","potion","elixir"]];
const ACCEPTS={weapon:["ore","timber","herb","potion","essence","relic"],armor:["hide","ore","timber","essence","relic"],charm:["ore","essence","relic"],food:["food","herb","essence"],potion:["potion","herb","essence"]};
const KIND_LABEL={weapon:"weapons",armor:"armor",charm:"trinkets",food:"food",potion:"potions",hide:"hides",ore:"ores",timber:"timber",herb:"herbs",essence:"essences",relic:"relics"};
const REACTIONS=[
  ["Fire","Ice","Steam",["Fire","Ice"]],["Fire","Water","Steam",["Fire","Water"]],["Ice","Water","Frost",["Ice","Water"]],
  ["Poison","Nourishing","Medicine",["Poison","Nourishing"]],["Sweet","Light","Lure",["Sweet"]],
  ["Holy","Shadow","Twilight",["Holy","Shadow"]],["Fire","Holy","Sunfire",["Fire","Holy"]],
  ["Iron","Fire","Tempered",[]],["Arcane","Light","Radiant",["Light"]],["Stone","Arcane","Runic",["Arcane"]],
  ["Fur","Ice","Insulated",[]],["Poison","Sharp","Venomous",["Poison"]],["Steam","Iron","Rust",["Steam"]]
];
const CONFLICTS=[["Fire","Ice"],["Fire","Water"],["Holy","Shadow"],["Poison","Nourishing"],["Swift","Heavy"],["Light","Shadow"]];
const BASE={
  iron_sword:["Iron Sword","blade",{Sharp:4,Iron:3}],
  dagger:["Bandit's Dagger","blade",{Sharp:2,Swift:2}],
  oak_staff:["Oak Staff","staff",{Wood:3,Arcane:2}],
  hunter_spear:["Hunter's Spear","spear",{Sharp:3,Wood:2,Swift:1}],
  wood_shield:["Wooden Shield","shield",{Wood:3,Heavy:1}],
  leather_cap:["Leather Cap","helm",{Fur:2,Swift:1}],
  iron_helmet:["Iron Helmet","helm",{Iron:3,Heavy:2}],
  jerkin:["Bandit's Jerkin","chest",{Fur:3,Shadow:1}],
  stone_plate:["Stone Plate","chest",{Stone:3,Heavy:2}],
  hide_gloves:["Hide Gloves","gloves",{Fur:2,Sharp:1}],
  wraith_wraps:["Wraith Wraps","gloves",{Shadow:2,Ice:1}],
  trail_boots:["Trail Boots","boots",{Swift:2,Fur:1}],
  ember_treads:["Ember Treads","boots",{Fire:2,Stone:1}],
  sprite_lantern:["Sprite Lantern","charm",{Light:2,Arcane:1}],
  fang_charm:["Wolf Fang Charm","charm",{Sharp:1,Ice:1,Swift:1}],
  witch_eye:["Witch's Eye","charm",{Shadow:2,Arcane:2}],
  chili:["Chili Pepper","food",{Fire:2,Nourishing:1}],
  honey:["Honey","food",{Sweet:3,Nourishing:2}],
  bread:["Bread","food",{Nourishing:3}],
  mushroom:["Glowing Mushroom","food",{Light:2,Nourishing:1,Arcane:1}],
  boar_hide:["Boar Hide","material",{Fur:2,Heavy:2},"hide"],
  pelt:["Frost Wolf Pelt","material",{Ice:3,Fur:2},"hide"],
  shroud:["Wraith Shroud","material",{Shadow:3,Ice:1},"hide"],
  nightshade:["Nightshade","material",{Poison:3,Shadow:1},"herb"],
  coal:["Ember Coal","material",{Fire:3,Stone:1},"ore"],
  golem_core:["Golem Core","material",{Stone:3,Heavy:3},"ore"],
  holy_water:["Holy Water","potion",{Holy:3,Water:2}],
  spring_water:["Spring Water","potion",{Water:2}],
  phoenix:["Phoenix Feather","material",{Fire:3,Holy:2,Swift:2},"relic"],
  gnarl_tusk:["Gnarlhorn Tusk","material",{Sharp:3,Heavy:2,Wood:2},"relic"],
  rime_fang:["Rimeclaw Fang","material",{Ice:3,Sharp:2,Swift:2},"relic"],
  storm_feather:["Storm Feather","material",{Swift:3,Arcane:1},"hide"],
  rune_shard:["Rune Shard","material",{Arcane:3,Stone:2},"ore"],
  void_crystal:["Void Crystal","material",{Shadow:3,Arcane:2},"ore"],
  star_heart:["Starheart Fragment","material",{Arcane:3,Holy:2,Shadow:2},"relic"],
  gale_boots:["Galewing Boots","boots",{Swift:3,Arcane:1}],
  sentinel_aegis:["Sentinel's Aegis","shield",{Runic:3,Iron:1}],
  void_robe:["Voidweave Robe","chest",{Shadow:2,Arcane:2,Swift:1}],
  storm_draught:["Stormdraught","potion",{Swift:2,Water:2,Arcane:1}],
  glass_pendant:["Glass Pendant","charm",{Arcane:2,Light:1,Iron:1}],
  // raw finds that only exist to be deconstructed (DECON)
  scrap_iron:["Scrap Iron","material",{Iron:3,Sharp:1},"ore"],
  oak_bough:["Oak Bough","material",{Wood:3,Arcane:1},"timber"],
  sprite_dust:["Sprite Dust","material",{Light:2,Arcane:2},"ore"],
  slag_iron:["Slag Iron","material",{Iron:3,Fire:2},"ore"],
  witchwood:["Witchwood Twig","material",{Wood:2,Poison:2,Shadow:1},"timber"],
  sentinel_plate:["Sentinel Plate","material",{Iron:3,Runic:2},"ore"],
  // base materials (MATS): what patterns are forged from. Each type's base trait at 3 (Cloth 2) plus a zone trait at 1
  boar_leather:["Boar Leather","material",{Fur:3,Heavy:1},"hide"],
  frost_leather:["Frost Leather","material",{Fur:3,Ice:1},"hide"],
  shroudcloth:["Shroudcloth","material",{Swift:2,Shadow:1},"hide"],
  stormsilk:["Stormsilk","material",{Swift:2,Arcane:1},"hide"],
  iron_ingot:["Iron Ingot","material",{Iron:3,Sharp:1},"ore"],
  slagsteel:["Slagsteel Ingot","material",{Iron:3,Fire:1},"ore"],
  runesteel:["Runesteel Ingot","material",{Iron:3,Runic:1},"ore"],
  oak_timber:["Oak Timber","material",{Wood:3,Arcane:1},"timber"],
  hexwood:["Hexwood Timber","material",{Wood:3,Poison:1},"timber"],
  golem_stone:["Golem Stone","material",{Stone:3,Heavy:1},"ore"],
  cinderstone:["Cinderstone","material",{Stone:3,Fire:1},"ore"],
  glowglass:["Glowglass","material",{Arcane:3,Light:1},"ore"],
  rune_crystal:["Rune Crystal","material",{Arcane:3,Stone:1},"ore"],
  void_shard:["Void Shard","material",{Arcane:3,Shadow:1},"ore"]
};
// ---- Materials, deconstructing and patterns (crafting.js: deconYield, shape; economy.js: deconstruct)
// Base material types: tr = the base trait every material of the type carries (deconstructing never returns it as fragments), label = the shown name. MATS: base material id -> type.
const MAT_T={leather:{tr:"Fur",label:"Leather"},cloth:{tr:"Swift",label:"Cloth"},ingot:{tr:"Iron",label:"Ingot"},timber:{tr:"Wood",label:"Timber"},stone:{tr:"Stone",label:"Stone"},crystal:{tr:"Arcane",label:"Crystal"}};
const MATS={boar_leather:"leather",frost_leather:"leather",shroudcloth:"cloth",stormsilk:"cloth",iron_ingot:"ingot",slagsteel:"ingot",runesteel:"ingot",oak_timber:"timber",hexwood:"timber",golem_stone:"stone",cinderstone:"stone",glowglass:"crystal",rune_crystal:"crystal",void_shard:"crystal"};
// DECON: raw id -> [base material, how many]. Anything else that is not gear, an essence or a base material (food, potions, herbs, relics) deconstructs into essence fragments only.
const DECON={boar_hide:["boar_leather",2],pelt:["frost_leather",2],shroud:["shroudcloth",2],storm_feather:["stormsilk",2],scrap_iron:["iron_ingot",2],slag_iron:["slagsteel",2],sentinel_plate:["runesteel",2],
  oak_bough:["oak_timber",2],witchwood:["hexwood",2],golem_core:["golem_stone",2],coal:["cinderstone",1],sprite_dust:["glowglass",1],rune_shard:["rune_crystal",2],void_crystal:["void_shard",2]};
// Fragments: every trait a deconstructed item carries (except its material's base trait) gives that many Faint essences per point at Plain (FRAG grade steps below the item's grade, never under Faint), plus a ch-per-point chance (capped) of one essence at the item's own grade. An affixed raw always gives afx fragments of its affix's essence and an afxCh chance of a full one; its material keeps the affix trait at AFX_RAW.
const FRAG={step:2,ch:.2,cap:.75,afx:3},AFX_RAW=1;
// Patterns (known from the start) shape base materials into plain gear. slots = [allowed material types, weight]: the result's traits are the materials' traits x their slot weight, plus the pattern's tr; traits under FRAG_MIN are dropped. std = standard recipes: those exact (Plain) materials make that BASE item instead, so secrets and old saves keep their ids; graded materials make it at the lowest grade among them (iron_sword@4), an affixed one adds its affix (iron_sword~vamp). noun = the noun of any other result, by the first slot's material type.
const PAT_MIN=.5,SHAPE={xp:4,sk:4}; // SHAPE: smith XP and skill XP for one pattern forge
const PATTERNS={
  blade:{form:"blade",slots:[[["ingot"],.5],[["ingot"],.5],[["leather","cloth"],.25]],tr:{Sharp:3},std:[[["iron_ingot","iron_ingot","boar_leather"],"iron_sword"]],noun:"Sword"},
  spear:{form:"spear",slots:[[["timber"],.5],[["timber"],.5],[["ingot"],.5]],tr:{Sharp:2,Swift:1},std:[[["oak_timber","oak_timber","iron_ingot"],"hunter_spear"]],noun:"Spear"},
  staff:{form:"staff",slots:[[["timber"],.5],[["timber"],.5],[["crystal"],.5]],tr:{Arcane:1},std:[[["oak_timber","oak_timber","glowglass"],"oak_staff"]],noun:"Staff"},
  shield:{form:"shield",slots:[[["timber","ingot","stone"],.5],[["timber","ingot","stone"],.5],[["leather"],.25]],tr:{Heavy:1},std:[[["oak_timber","oak_timber","boar_leather"],"wood_shield"]],noun:"Shield"},
  helm:{form:"helm",slots:[[["leather","ingot","stone"],.5],[["leather","ingot","stone"],.5]],tr:{},std:[[["boar_leather","boar_leather"],"leather_cap"],[["iron_ingot","iron_ingot"],"iron_helmet"]],noun:{leather:"Cap",_:"Helmet"}},
  chest:{form:"chest",slots:[[["leather","cloth","ingot","stone"],.4],[["leather","cloth","ingot","stone"],.4],[["leather","cloth","ingot","stone"],.4]],tr:{},std:[[["golem_stone","golem_stone","golem_stone"],"stone_plate"]],noun:{leather:"Jerkin",cloth:"Jerkin",_:"Plate"}},
  gloves:{form:"gloves",slots:[[["leather","cloth"],.5],[["leather","cloth"],.5]],tr:{},std:[[["boar_leather","boar_leather"],"hide_gloves"]],noun:"Gloves"},
  boots:{form:"boots",slots:[[["leather","cloth"],.5],[["leather","cloth"],.5]],tr:{Swift:1},std:[[["boar_leather","boar_leather"],"trail_boots"]],noun:"Boots"},
  charm:{form:"charm",slots:[[["crystal"],.75],[["ingot"],.75]],tr:{},std:[[["glowglass","iron_ingot"],"glass_pendant"]],noun:"Charm"}
};
// Blueprints: named gear, learned by studying the creature in `e` (a Codex fact, see codex.js; mastering it teaches them too). slots = the material type each slot takes, m = the materials it is usually made from (salvage gives half of them back). A blueprint always makes its item (at the lowest grade among the materials, with the first affixed material's affix).
const BLUEPRINTS={
  dagger:{e:"bandit",slots:[["ingot"],["leather"]],m:["iron_ingot","boar_leather"]},
  jerkin:{e:"bandit",slots:[["leather"],["leather"],["leather"]],m:["boar_leather","boar_leather","boar_leather"]},
  sprite_lantern:{e:"sprite",slots:[["crystal"],["crystal"],["ingot"]],m:["glowglass","glowglass","iron_ingot"]},
  fang_charm:{e:"wolf",slots:[["leather"],["ingot"]],m:["frost_leather","iron_ingot"]},
  wraith_wraps:{e:"wraith",slots:[["cloth"],["cloth"]],m:["shroudcloth","shroudcloth"]},
  ember_treads:{e:"imp",slots:[["stone"],["leather"]],m:["cinderstone","boar_leather"]},
  witch_eye:{e:"witch",slots:[["timber"],["crystal"]],m:["hexwood","glowglass"]},
  gale_boots:{e:"harpy",slots:[["cloth"],["cloth"],["leather"]],m:["stormsilk","stormsilk","frost_leather"]},
  sentinel_aegis:{e:"sentinel",slots:[["ingot"],["ingot"],["crystal"]],m:["runesteel","runesteel","rune_crystal"]},
  void_robe:{e:"acolyte",slots:[["cloth"],["cloth"],["crystal"]],m:["stormsilk","stormsilk","void_shard"]}
};
const bpOf=e=>Object.keys(BLUEPRINTS).filter(id=>BLUEPRINTS[id].e===e);
const ZONES=[["woods","Whispering Woods","gnarlhorn"],["pass","Frostfang Pass","rimeclaw"],["hollow","Cinder Hollow","phoenix"],["spire","Starfall Spire","archon"],["fen","The Sinking Fen","fen_matriarch"],["rift","The Wanderer's Rift","rift_boss"]];
const ENEMIES={
  boar:{name:"Thornback Boar",plural:"Thornback Boars",zone:"woods",mv:"chase",el:"wood",hp:30,atk:6,def:2,weak:["fire"],resist:[],w:3,verb:"gores you",intro:"A Thornback Boar bursts out of the brush.",
    lore:"Bristled forest boars that sharpen their tusks on oak bark. They charge when cornered, and often when not.",
    sp:{every:3,name:"Tusk Charge",kind:"heavy",x:2,tell:"lowering its tusks"},drops:[["boar_hide",.6],["chili",.4],["oak_bough",.2]]},
  sprite:{name:"Glowcap Sprite",plural:"Glowcap Sprites",zone:"woods",mv:"wander",el:"holy",hp:26,atk:5,def:0,weak:["fire","shadow"],resist:["holy"],w:3,verb:"flings spores at you",intro:"A Glowcap Sprite drifts out from between the roots.",
    lore:"Mushroom spirits that glow brighter when frightened. They knit their caps back together with spores.",
    sp:{every:3,name:"Mend",kind:"heal",x:.3,tell:"gathering glowing spores around itself"},drops:[["mushroom",.75],["honey",.45],["sprite_dust",.45]]},
  bandit:{name:"Woods Bandit",plural:"Woods Bandits",zone:"woods",mv:"still",el:"metal",hp:34,atk:7,def:3,weak:["arcane"],resist:[],w:2,verb:"slashes at you",intro:"A Woods Bandit steps onto the path, blade drawn.",
    lore:"Deserters and debtors who work the woods road. They carry whatever they last stole.",
    sp:{every:3,name:"Poisoned Edge",kind:"inflict",x:1,status:"poison",tell:"coating its blade with venom"},drops:[["bread",.55],["scrap_iron",.45],["oak_bough",.3]]},
  stag:{name:"Mossback Stag",plural:"Mossback Stags",zone:"woods",mv:"wander",el:"swift",hp:34,atk:6,def:2,weak:["stone","fire"],resist:["swift"],w:2,verb:"rakes you",intro:"A Mossback Stag lowers its antlers between the birches.",
    lore:"Old stags grow moss on their backs and lose their fear with it. A fleet stag outruns anything in the brush, but its antlers strip bark like a drawknife.",art:{b:"beast",p:["antlers","tail"],c:"#5c9f90",a:"#b5b04a",pat:"scales",po:.35},
    sp:{every:3,name:"Root Dive",kind:"burrow",tell:"folding into the roots"},drops:[["boar_hide",.45],["honey",.4],["oak_bough",.2]]},
  briar:{name:"Briarling",plural:"Briarlings",zone:"woods",mv:"still",el:"poison",hp:34,atk:5,def:3,weak:["fire"],resist:["wood","poison"],w:2,verb:"lashes you",intro:"The brambles knot themselves into a Briarling and stand up.",
    lore:"Thickets that learned to walk, then forgot why. Their thorns carry a stinging sap that closes the wound it opens.",art:{b:"elemental",p:["mane","vines"],c:"#788a3a",a:"#cdc984",pat:"stripes",po:.35},
    sp:{every:3,name:"Take Root",kind:"heal",x:.25,tell:"sinking its roots into the soil"},drops:[["mushroom",.5],["honey",.35],["oak_bough",.35]]},
  ghoul:{name:"Barrow Ghoul",plural:"Barrow Ghouls",zone:"woods",mv:"chase",el:"shadow",hp:28,atk:7,def:1,weak:["holy","fire"],resist:["shadow"],w:2,verb:"claws you",intro:"A Barrow Ghoul crawls out from under a mossy cairn.",
    lore:"Old barrows dot the woods, and not all of their sleepers stayed asleep. Slow to die and quick to eat.",art:{b:"undead",p:["mane"],c:"#716f8c",a:"#b5b04a",pc:"#3b4a2a",pat:"rot",po:.35},
    sp:{every:3,name:"Grave Hunger",kind:"drain",x:1.1,tell:"baring its yellow teeth"},drops:[["bread",.4],["scrap_iron",.3]]},
  kindlefox:{name:"Kindle Fox",plural:"Kindle Foxes",zone:"woods",mv:"chase",el:"fire",hp:30,atk:6,def:1,weak:["ice"],resist:["fire"],w:2,verb:"rakes you",intro:"A Kindle Fox slips out of the brush, its tail trailing smoke.",
    lore:"A fox whose tail smoulders like a torch. It runs ahead of you and lights the dry grass behind it.",art:{b:"canine",p:["tail","flames"],c:"#c8442e",a:"#b5b04a",pat:"stripes",po:.35},
    sp:{every:3,name:"Tail Flare",kind:"heavy",x:1.8,tell:"curling its tail overhead"},drops:[["chili",.5],["boar_hide",.35],["oak_bough",.2]]},
  gnarlhorn:{name:"Gnarlhorn, the Boar King",short:"Gnarlhorn",zone:"woods",el:"wood",boss:true,hp:66,atk:8,def:4,weak:["fire"],resist:["wood"],verb:"tramples you",intro:"The ground shakes. Gnarlhorn, the Boar King, crashes through the trees.",
    lore:"The old king of the boar herds, his hide grown thick as bark. The woods go quiet when he walks.",
    sp:{every:3,name:"Stampede",kind:"heavy",x:2.2,tell:"pawing the ground"},drops:[["gnarl_tusk",1],["boar_hide",.8],["oak_bough",.5]]},
  wolf:{name:"Frost Wolf",plural:"Frost Wolves",zone:"pass",mv:"chase",el:"ice",hp:60,atk:11,def:3,weak:["fire"],resist:["ice"],w:3,verb:"bites",intro:"A Frost Wolf circles you through the snow.",
    lore:"Pack hunters with frost in their fur. They test you from the sides before they commit.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Pounce",kind:"heavy",x:1.8,tell:"crouching low"},drops:[["pelt",.75],["spring_water",.35]]},
  wraith:{name:"Ice Wraith",plural:"Ice Wraiths",zone:"pass",mv:"wander",el:"shadow",hp:50,atk:11,def:1,weak:["holy","fire"],resist:["ice","metal"],w:2,verb:"chills you",intro:"The air freezes as an Ice Wraith takes shape.",
    lore:"Travellers who froze on the pass and never stopped walking. They feed on warmth.",
    inf:{s:"curse",ch:0.35},
    sp:{every:3,name:"Soul Siphon",kind:"drain",x:1.2,tell:"reaching toward your chest"},drops:[["shroud",.55],["spring_water",.4],["holy_water",.25]]},
  golem:{name:"Stone Golem",plural:"Stone Golems",zone:"pass",mv:"still",el:"stone",hp:76,atk:10,def:7,weak:["arcane","ice"],resist:["metal","poison"],w:2,verb:"slams you",intro:"A boulder unfolds into a Stone Golem.",
    lore:"Boulders woken by old runes. Slow to anger and slower to stop.",
    sp:{every:4,name:"Rune Aegis",kind:"guard",ward:.2,turns:2,tell:"tracing a warding rune across its chest"},drops:[["golem_core",.85],["scrap_iron",.25]]},
  bear:{name:"Rimehide Bear",plural:"Rimehide Bears",zone:"pass",mv:"wander",el:"ice",hp:72,atk:10,def:4,weak:["fire"],resist:["ice"],w:2,verb:"mauls you",intro:"A Rimehide Bear shoulders out of a snowdrift.",
    lore:"Their fur freezes into plates over the winter. They do not hibernate on the pass; they patrol it.",art:{b:"bear",p:["frost","spikes"],c:"#b9d5e2",a:"#65c7ff",pat:"facets",po:.35},
    inf:{s:"chill",ch:0.25},
    sp:{every:3,name:"Rime Fury",kind:"enrage",x:1.3,at:.5,tell:"gathering strength as it weakens"},drops:[["pelt",.6],["honey",.3]]},
  raider:{name:"Pass Raider",plural:"Pass Raiders",zone:"pass",mv:"chase",el:"metal",hp:58,atk:11,def:4,weak:["arcane","fire"],resist:["ice"],w:2,verb:"hacks at you",intro:"A Pass Raider drops from a ledge, axe already swinging.",
    lore:"Mountain clans who tax the pass with axes. They wear horned helms so the snow-blind can still tell who robbed them.",art:{b:"humanoid",p:["horns","armor","axe"],skin:"#c99b78",c:"#3a70b0",a:"#f4fbff",pc:"#2a3f6a",pat:"stripes",po:.35},
    sp:{every:3,name:"Axe Flurry",kind:"multi",n:2,x:.9,tell:"hefting its axe in both hands"},drops:[["bread",.5],["scrap_iron",.4],["oak_bough",.25]]},
  squall:{name:"Squall Spirit",plural:"Squall Spirits",zone:"pass",mv:"still",el:"swift",hp:62,atk:11,def:3,weak:["stone"],resist:["swift"],w:2,verb:"buffets you",intro:"The wind stops moving and starts watching. A Squall Spirit hangs in the gap.",
    lore:"Gusts that circled the same crag for so long they grew a face. They hate anything that walks through them.",art:{b:"elemental",p:["orbit"],c:"#5fd6bc",a:"#f4fbff",pat:"swirl",po:.35},
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Hailstorm",kind:"multi",n:3,x:.6,tell:"spinning faster and faster"},drops:[["spring_water",.6],["holy_water",.25],["storm_feather",.15]]},
  seer:{name:"Cairn Seer",plural:"Cairn Seers",zone:"pass",mv:"still",el:"arcane",hp:60,atk:10,def:4,weak:["holy"],resist:["arcane","ice"],w:2,verb:"chills you",intro:"A hooded figure sits among the cairns, tracing runes in the frost.",
    lore:"A hermit who reads the frost-runes the pass cuts into its cairns. He mends what the cold breaks, for a price.",art:{b:"humanoid",p:["hood","staff","runes"],skin:"#c99b78",c:"#955aa8",a:"#f4fbff",pat:"bands",po:.35},
    sp:{every:3,name:"Glyph Mend",kind:"heal",x:.15,tell:"tracing a glyph in the frost"},drops:[["spring_water",.5],["rune_shard",.3],["holy_water",.2]]},
  rimeclaw:{name:"Rimeclaw, the Pack Mother",short:"Rimeclaw",zone:"pass",el:"ice",boss:true,hp:140,atk:14,def:5,weak:["fire"],resist:["ice","shadow"],verb:"mauls you",intro:"A howl splits the air. Rimeclaw, the Pack Mother, blocks the pass.",
    lore:"Mother of every pack on the pass. Her howl turns the air to needles.",
    inf:{s:"chill",ch:0.35},
    sp:{every:3,name:"Blizzard Howl",kind:"multi",n:3,x:.75,tell:"drawing a long breath"},drops:[["rime_fang",1],["pelt",.8]]},
  imp:{name:"Ember Imp",plural:"Ember Imps",zone:"hollow",mv:"wander",el:"fire",hp:88,atk:14,def:4,weak:["ice"],resist:["fire"],w:3,verb:"scorches you",intro:"An Ember Imp cackles from a vent of smoke.",
    lore:"Small, spiteful fire spirits that nest in the vents of the Hollow.",
    inf:{s:"burn",ch:0.3},
    sp:{every:3,name:"Fireball",kind:"heavy",x:2,tell:"cupping a glow between its hands"},drops:[["coal",.75],["chili",.4]]},
  witch:{name:"Nightshade Witch",plural:"Nightshade Witches",zone:"hollow",mv:"chase",el:"poison",hp:95,atk:15,def:5,weak:["holy","metal"],resist:["shadow","poison"],w:2,verb:"hexes you",intro:"A Nightshade Witch rises from her bubbling cauldron.",
    lore:"Herbalists who stayed too long among the nightshade. Their brews heal them and only them.",
    inf:{s:"poison",ch:0.35},
    sp:{every:3,name:"Hex Brew",kind:"heal",x:.25,tell:"stirring her cauldron"},drops:[["nightshade",.7],["witchwood",.35],["holy_water",.3]]},
  slag:{name:"Slag Sentry",plural:"Slag Sentries",zone:"hollow",mv:"still",el:"stone",hp:104,atk:14,def:6,weak:["ice","arcane"],resist:["fire"],w:2,verb:"hammers you",intro:"A furnace eye opens in a mound of slag. Its iron arms rise.",
    lore:"Abandoned forge guardians fused to the Hollow's floor. A coal still burns behind each iron rib; cold and magic fracture their shells.",
    sp:{every:4,name:"Crucible Hammer",kind:"heavy",x:2.2,tell:"locking its iron arms together overhead"},drops:[["coal",.55],["golem_core",.45],["slag_iron",.4]]},
  salamander:{name:"Magma Salamander",plural:"Magma Salamanders",zone:"hollow",mv:"chase",el:"fire",hp:92,atk:14,def:5,weak:["ice"],resist:["fire"],w:2,verb:"bites",intro:"A Magma Salamander slides out of a lava seam.",
    lore:"They swim in molten rock and come out only to hunt. Their skin cools to a crust that cracks when they run.",art:{b:"reptile",p:["spikes","tail"],c:"#b83e2a",a:"#ff8a3d",pat:"cracks",po:.35},
    inf:{s:"burn",ch:0.3},
    sp:{every:3,name:"Lava Spit",kind:"heavy",x:2,tell:"its throat glowing white-hot"},drops:[["coal",.6],["chili",.4],["slag_iron",.2]]},
  revenant:{name:"Ash Revenant",plural:"Ash Revenants",zone:"hollow",mv:"wander",el:"shadow",hp:90,atk:15,def:4,weak:["holy","ice"],resist:["shadow","fire"],w:2,verb:"claws you",intro:"Ash gathers into a shape and walks toward you. An Ash Revenant.",
    lore:"Smiths who died at the Hollow's forges, still bound to the work. The chains were theirs; they forget why.",art:{b:"undead",p:["chains","flames"],c:"#595866",a:"#ff8a3d",pat:"cracks",po:.35},
    inf:{s:"curse",ch:0.3},
    sp:{every:3,name:"Ashen Grasp",kind:"drain",x:1.3,tell:"reaching out with smouldering fingers"},drops:[["coal",.45],["holy_water",.3],["slag_iron",.25]]},
  brimstone:{name:"Brimstone Elemental",plural:"Brimstone Elementals",zone:"hollow",mv:"still",el:"poison",hp:100,atk:13,def:6,weak:["ice","holy"],resist:["poison","fire"],w:2,verb:"scalds you",intro:"A vent coughs, and the cloud does not drift away. A Brimstone Elemental.",
    lore:"Sulphur fumes that pooled in a hollow and woke. Crystals grow on them like frost on a window.",art:{b:"elemental",p:["crystals"],c:"#b3d63a",a:"#ff8a3d",pc:"#fff6a0",pat:"facets",po:.35},
    inf:{s:"poison",ch:0.35},
    sp:{every:3,name:"Sulphur Burst",kind:"multi",n:3,x:.65,tell:"swelling with yellow fumes"},drops:[["nightshade",.5],["coal",.55]]},
  anvil:{name:"Anvil Crawler",plural:"Anvil Crawlers",zone:"hollow",mv:"wander",el:"metal",hp:100,atk:14,def:6,weak:["arcane","ice"],resist:["fire"],w:2,verb:"strikes you",intro:"A forge construct scuttles between the cold anvils.",
    lore:"A construct built to haul anvils between forges. Left to crawl the Hollow's floor, it still hammers, and it still keeps count.",art:{b:"construct",p:["shell","spikes","armor"],c:"#7a7f86",a:"#ff8a3d",pat:"bands",po:.35},
    sp:{every:3,name:"Pincer Clamp",kind:"multi",n:2,x:.9,tell:"snapping its pincers shut"},drops:[["golem_core",.5],["coal",.4],["slag_iron",.3]]},
  phoenix:{name:"Cinder Phoenix",short:"the Phoenix",zone:"hollow",el:"fire",boss:true,rebirth:true,hp:150,atk:17,def:7,weak:["ice"],resist:["fire","holy"],verb:"rakes you with burning talons",intro:"The sky ignites. A Cinder Phoenix descends.",
    lore:"The Hollow's heart. It has died many times and seems to have enjoyed none of them.",
    inf:{s:"burn",ch:0.35},
    sp:{every:3,name:"Inferno",kind:"heavy",x:2.2,tell:"spreading its burning wings"},drops:[["phoenix",1],["holy_water",.6]]},
  harpy:{name:"Storm Harpy",plural:"Storm Harpies",zone:"spire",mv:"wander",el:"swift",hp:105,atk:21,def:3,weak:["stone","ice"],resist:["swift"],w:3,verb:"rakes you",intro:"A Storm Harpy shrieks out of the cloud bank.",
    lore:"Wind-spirits in the shape of birds, forever circling the spire. Each wingbeat carries a little thunder.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Call Squall Spirit",kind:"summon",summon:"squall",x:.65,tell:"calling a weaker Squall Spirit to strike"},drops:[["storm_feather",.75],["storm_draught",.5]]},
  sentinel:{name:"Runebound Sentinel",plural:"Runebound Sentinels",zone:"spire",mv:"still",el:"arcane",hp:155,atk:22,def:8,weak:["metal","poison"],resist:["arcane","stone"],w:2,verb:"strikes you",intro:"A Runebound Sentinel grinds to life, its glyphs flaring.",
    lore:"Guardians carved before the spire fell. Their armor shrugs off blows, but rust and venom still find the seams.",
    sp:{every:4,name:"Rune Slam",kind:"heavy",x:2.5,tell:"its runes flaring white"},drops:[["rune_shard",.7],["golem_core",.3],["sentinel_plate",.55]]},
  acolyte:{name:"Void Acolyte",plural:"Void Acolytes",zone:"spire",mv:"chase",el:"shadow",hp:112,atk:22,def:4,weak:["holy","arcane"],resist:["shadow"],w:3,verb:"touches you",intro:"A Void Acolyte steps out of a seam in the air.",
    lore:"Scholars who read one page too many of what lies between the stars. They feed the emptiness in them with your warmth.",
    inf:{s:"curse",ch:0.4},
    sp:{every:3,name:"Soul Tithe",kind:"drain",x:1.4,tell:"opening its hollow hands"},drops:[["void_crystal",.85],["holy_water",.4]]},
  seraph:{name:"Fallen Seraph",plural:"Fallen Seraphs",zone:"spire",mv:"wander",el:"holy",hp:120,atk:20,def:5,weak:["shadow","stone"],resist:["holy","swift"],w:2,verb:"smites you",intro:"Feathers fall like snow. A Fallen Seraph turns its blade toward you.",
    lore:"Guardians of the spire's upper halls who followed the star down. Their halos still burn; their mercy does not.",art:{b:"humanoid",p:["wings","halo","blade"],skin:"#e9e0cf",glow:1,c:"#f0dea8",a:"#f6d36b",pc:"#f6c64a",pat:"scales",po:.35},
    sp:{every:3,name:"Judgement",kind:"heavy",x:2.2,tell:"raising its blade toward the sky"},drops:[["holy_water",.5],["storm_feather",.5]]},
  lynx:{name:"Astral Lynx",plural:"Astral Lynxes",zone:"spire",mv:"chase",el:"arcane",hp:110,atk:22,def:4,weak:["stone","metal"],resist:["arcane"],w:2,verb:"rakes you",intro:"Something with starlight for eyes pads along the stair. An Astral Lynx.",
    lore:"Cats that slipped through a seam in the sky and came back speckled with stars. They hunt by the light of whatever you are thinking.",art:{b:"feline",p:["crystals","tail"],c:"#803a96",a:"#f6d36b",pat:"stars",po:.35},
    sp:{every:3,name:"Starfall Pounce",kind:"multi",n:3,x:.65,tell:"its eyes going white"},drops:[["rune_shard",.5],["void_crystal",.35]]},
  orrery:{name:"Orrery Construct",plural:"Orrery Constructs",zone:"spire",mv:"still",el:"metal",hp:140,atk:20,def:7,weak:["fire","arcane"],resist:["stone","swift"],w:2,verb:"strikes you",intro:"Brass rings click into alignment. An Orrery Construct turns its eye on you.",
    lore:"Star-charts built to walk the spire and correct its course. The stars have moved; the orreries have not forgiven them.",art:{b:"construct",p:["orbit","armor"],c:"#5a8cc9",a:"#f6d36b",pat:"bands",po:.35},
    sp:{every:4,name:"Recalibrate",kind:"heal",x:.15,tell:"spinning its rings back into line"},drops:[["rune_shard",.55],["golem_core",.4],["sentinel_plate",.3]]},
  archon:{name:"Starfallen Archon",short:"the Archon",zone:"spire",el:"swift",boss:true,hp:260,atk:25,def:9,weak:["stone"],resist:["swift","arcane"],verb:"strikes you with lightning",intro:"Lightning stitches the clouds shut. The Starfallen Archon unfolds above the spire.",
    lore:"A star that fell upward. Hurt enough, it stops being a storm and becomes the dark behind the storm.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Chain Lightning",kind:"multi",n:4,x:.65,tell:"crackling with stored lightning"},
    // generic boss twist: at `at` of max HP it loses a turn shifting form; `to` overrides element, weak, resist, special, inf and verb
    phase:{at:.5,label:"VOID FORM",msg:"The storm collapses inward. The Archon turns to the dark behind it!",
      to:{el:"shadow",weak:["holy","metal"],resist:["shadow","arcane"],inf:{s:"curse",ch:0.4},verb:"unmakes you",sp:{every:3,name:"Void Collapse",kind:"drain",x:1.5,tell:"folding the air around a black point"}}},
    drops:[["star_heart",1],["storm_feather",.8]]},
  fen_reedstalker:{name:"Reedstalker",plural:"Reedstalkers",zone:"fen",mv:"chase",el:"poison",hp:112,atk:23,def:6,weak:["fire"],resist:["poison"],w:3,verb:"lashes you",intro:"A Reedstalker slips between the reeds and strikes.",
    lore:"It follows the channels beneath the water, where footsteps cannot be heard.",art:{b:"beast",p:["vines","tail","spikes"],c:"#6d8540",a:"#bdcd69",pat:"stripes",po:.35},inf:{s:"poison",ch:.25},
    sp:{every:3,name:"Reed Snare",kind:"heavy",x:1.9,tell:"coiling its vines around the reeds"},drops:[["witchwood",.7],["nightshade",.35]]},
  fen_mirewitch:{name:"Mire Witch",plural:"Mire Witches",zone:"fen",mv:"still",el:"shadow",hp:92,atk:24,def:4,weak:["holy","fire"],resist:["shadow","poison"],w:2,verb:"hexes you",intro:"A Mire Witch raises its mask from the black water.",
    lore:"The Fen's old paths still know her name. The living do not.",art:{b:"humanoid",p:["hood","staff","runes"],skin:"#a89b7a",c:"#46563a",a:"#a4c76b",pat:"bands",po:.35},inf:{s:"curse",ch:.25},
    sp:{every:3,name:"Silt Hex",kind:"drain",x:1.2,tell:"drawing a circle in the silt"},drops:[["witch_eye",.55],["nightshade",.45]]},
  fen_peatbrute:{name:"Peatback Brute",plural:"Peatback Brutes",zone:"fen",mv:"wander",el:"wood",hp:150,atk:22,def:10,weak:["fire","ice"],resist:["wood","poison"],w:2,verb:"slams you",intro:"A mound of peat and roots pulls itself upright.",
    lore:"A fallen tree can keep walking here long after its roots have drowned.",art:{b:"construct",p:["armor","vines","horns"],c:"#594b32",a:"#9e8750",pat:"cracks",po:.4},
    sp:{every:4,name:"Rooted Guard",kind:"guard",ward:.18,turns:2,tell:"sinking its roots deep"},drops:[["witchwood",.65],["golem_core",.3]]},
  fen_murk_wisp:{name:"Murk Wisp",plural:"Murk Wisps",zone:"fen",mv:"wander",el:"poison",hp:84,atk:25,def:3,weak:["fire","holy"],resist:["poison","shadow"],w:2,verb:"spores you",intro:"A green light drifts low over the water. It turns toward you.",
    lore:"The glow marks a place where something sank and did not stay dead.",art:{b:"elemental",p:["orbit","spikes"],c:"#729447",a:"#d3ef7a",pat:"swirl",po:.45},inf:{s:"poison",ch:.3},
    sp:{every:3,name:"Spore Burst",kind:"multi",n:2,x:.75,tell:"swelling with pale green light"},drops:[["nightshade",.6],["spring_water",.3]]},
  fen_drowned_guard:{name:"Drowned Guard",plural:"Drowned Guards",zone:"fen",mv:"still",el:"shadow",hp:136,atk:21,def:9,weak:["arcane","swift"],resist:["shadow","poison"],w:2,verb:"hammers you",intro:"A rusted helm rises from the shallows, then its owner follows.",
    lore:"The old causeway was guarded once. The guard has forgotten the road is gone.",art:{b:"undead",p:["armor","hood","chains"],c:"#59675a",a:"#9fb89a",pat:"bands",po:.35},
    sp:{every:4,name:"Sunk Aegis",kind:"guard",ward:.2,turns:2,tell:"locking its shield into the mud"},drops:[["shroud",.55],["spring_water",.35]]},
  fen_antlerwolf:{name:"Fen Antlerwolf",plural:"Fen Antlerwolves",zone:"fen",mv:"chase",el:"swift",hp:118,atk:26,def:5,weak:["stone"],resist:["wood","swift"],w:2,verb:"gores you",intro:"A many-antlered wolf leaps from the cattails.",
    lore:"It hunts the paths between islands, where the water is deep enough to hide a whole pack.",art:{b:"beast",p:["antlers","mane","tail"],c:"#77765c",a:"#c8ca83",pat:"stripes",po:.35},
    sp:{every:3,name:"Cattail Rush",kind:"multi",n:2,x:.85,tell:"lowering its crown of antlers"},drops:[["pelt",.5],["witchwood",.35]]},
  fen_matriarch:{name:"The Drowned Matriarch",short:"the Matriarch",zone:"fen",el:"poison",boss:true,hp:390,atk:34,def:12,weak:["fire","ice"],resist:["poison","wood"],verb:"drowns you in spore-cloud",intro:"The reeds part. The Drowned Matriarch rises from the Fen's deepest pool.",
    lore:"The Fen remembers every name given to the water. She remembers who gave them.",art:{b:"humanoid",p:["hood","staff","runes"],skin:"#a89b7a",c:"#33472f",a:"#c5d879",pat:"bands",po:.35},inf:{s:"poison",ch:.35},
    sp:{every:3,name:"Flood of Spores",kind:"multi",n:3,x:.75,tell:"drawing a slow breath through the reeds"},drops:[["witchwood",1],["nightshade",.8],["witch_eye",.4]]},
  mimic:{name:"Mimic",zone:"any",el:"metal",hp:36,atk:6,def:3,weak:["arcane"],resist:["metal"],verb:"bites you",intro:"The lid creaks open into a mouth. It's a Mimic!",
    lore:"A chest with teeth. It has learned that travellers cannot resist opening things.",
    sp:{every:3,name:"Chomp",kind:"heavy",x:2.2,tell:"opening its lid very wide"},drops:[]}
};
// Affix system (affix.js). A map enemy has a rarity: normal (no affix), magic (1 affix) or rare (2, 3 from Heat RAR_CH.k3). RARITIES: stat multipliers (hp, atk, def added), k = affixes, gs = grade steps its affix essences roll better (a fraction is the chance of one step; a full step per rarity made essence income jump 40% or more at Heat 3, see README). RAR_CH: the rare share of elite tiles (base + heat x Heat + row x depth row, capped) and the magic share of ordinary fights from Heat magic.from. Rarity colours match the Greater (blue) and Pure (gold) grades.
const RARITIES={magic:{get name(){return tx("Magic")},col:"#6eb1f0",hp:1.35,atk:1.15,def:0,k:1,gs:.5},rare:{get name(){return tx("Rare")},col:"#f2a54a",hp:1.45,atk:1.2,def:0,k:2,gs:1}};
const RAR_CH={rare:{base:.15,heat:.05,row:.03,cap:.6},magic:{from:2,base:.1,heat:.05},k3:6};
// Affix tunables: vamp = share of the damage it deals that it heals; thorn = share of your blow reflected, capped at cap of your max HP (never lethal); regen = share of max HP per turn; frenzy = Attack x below `at` of its HP; ward = shield as a share of max HP, back `every` turns after it breaks; dodge = base % to dodge your strikes, less sharp per point of Sharp (up to sharpCap) and study per Study used on it (up to studyMax), never under min; split = remnant HP share and Attack x; boom = blast as a share of its max HP (Guard x guard), shown in the NEXT row below `warn` of its HP; swift = Attack x, chance of a follow-up hit of fx x damage, tiles per map turn.
const AFX_T={vamp:.4,thorn:{x:.15,cap:.06},regen:.03,regenRareHeat5:.005,frenzy:{at:.4,x:1.4},ward:{x:.2,every:3},dodge:{base:20,sharp:2,sharpCap:8,study:4,studyMax:3,min:4},split:{hp:.35,atk:.6},boom:{x:.15,warn:.35,guard:.4},swift:{atk:1.05,fol:.15,fx:.5,moves:2}};
// AFX: n = prefix, ti = the rare title ("the Bloodthirsty"), tr = the trait whose essence it drops, t "el" = elemental (fights as that family), g = groups, space-separated (an enemy never rolls two affixes that share one; the same essence is never rolled twice), m = stat multipliers (hp, atk) and flat def, roam = needs a species that moves on the map, d(B) = effect text (B adds live numbers). Elemental affixes keep the old elite behaviour.
const pcn=x=>Math.round(x*100);
const elTxt=tr=>{const s=ELITE_INF[tr];return tx("Fights as {fam}: resists it and has no weakness to it. +1 Defense.",{fam:famL(TRAITS[tr].f)})+(s?" "+tx("Its hits can inflict {status} ({p}%).",{status:lc(STATUS[s].n),p:pcn(ELITE_INF_CH)}):"")};
const AFX={
  fire:{t:"el",g:"el",n:"Burning",ti:"Cinderborn",tr:"Fire",m:{def:1},d:()=>elTxt("Fire")},
  ice:{t:"el",g:"el",n:"Frostbound",ti:"Rimeheart",tr:"Ice",m:{def:1},d:()=>elTxt("Ice")},
  poison:{t:"el",g:"el",n:"Venomous",ti:"Plaguebringer",tr:"Poison",m:{def:1},d:()=>elTxt("Poison")},
  holy:{t:"el",g:"el",n:"Hallowed",ti:"Radiant",tr:"Holy",m:{def:1},d:()=>elTxt("Holy")},
  shadow:{t:"el",g:"el",n:"Umbral",ti:"Gloomcaller",tr:"Shadow",m:{def:1},d:()=>elTxt("Shadow")},
  iron:{t:"el",g:"el",n:"Ironclad",ti:"Unbroken",tr:"Iron",m:{def:1},d:()=>elTxt("Iron")},
  swift:{t:"el",g:"el",n:"Fleet",ti:"Windrunner",tr:"Swift",m:{def:1},d:()=>elTxt("Swift")},
  arcane:{t:"el",g:"el",n:"Arcane",ti:"Spellwoven",tr:"Arcane",m:{def:1},d:()=>elTxt("Arcane")},
  vamp:{n:"Vampiric",ti:"Bloodthirsty",tr:"Nourishing",ic:"a_vamp",col:"#d4607c",g:"sustain",d:()=>tx("Heals for {p}% of the damage it deals you.",{p:pcn(AFX_T.vamp)})},
  thorn:{n:"Thorned",ti:"Barbed",tr:"Sharp",ic:"a_thorn",col:"#b8a45a",d:()=>tx("Reflects {p}% of your blows back at you (at most {c}% of your max HP per round, and never enough to kill you).",{p:pcn(AFX_T.thorn.x),c:pcn(AFX_T.thorn.cap)})},
  regen:{n:"Regenerating",ti:"Undying",tr:"Wood",ic:"a_regen",col:"#7cc47c",g:"tank sustain",m:{hp:.9},d:B=>tx("Heals {p}% of its max HP every turn. Burn and poison keep it in check.",{p:B&&B.rar==="rare"&&B.heat>=5?"0.5":pcn(AFX_T.regen)})},
  frenzy:{n:"Frenzied",ti:"Savage",tr:"Heavy",ic:"a_frenzy",col:"#e8793b",d:()=>tx("Below {at}% HP its Attack rises {p}%.",{at:pcn(AFX_T.frenzy.at),p:pcn(AFX_T.frenzy.x-1)})},
  ward:{n:"Warded",ti:"Shieldbound",tr:"Runic",ic:"ward",col:"#6fb5c4",g:"tank sustain",d:B=>tx("A shield of {amt} absorbs your blows{left}. It returns {n} turns after it breaks. Burn and poison pass through it.",{amt:B&&B.wm?B.wm:tx("{p}% of its HP",{p:pcn(AFX_T.ward.x)}),left:B&&B.wm?" "+tx("({n} left)",{n:Math.max(0,B.wd)}):"",n:AFX_T.ward.every})},
  elusive:{n:"Elusive",ti:"Slippery",tr:"Light",ic:"a_elusive",col:"#b9c4d8",g:"tank",m:{hp:.85},d:B=>tx("Dodges {d}% of your strikes. Sharp lowers it by {s}% per point (up to {sc}%), and each Study by {st}% (up to {sm} times). A dodged blow applies nothing (no bleed, stun or status); burn and poison already on it keep ticking.",{d:B?dodgeNow(B):AFX_T.dodge.base,s:AFX_T.dodge.sharp,sc:AFX_T.dodge.sharpCap,st:AFX_T.dodge.study,sm:AFX_T.dodge.studyMax})},
  split:{n:"Splitting",ti:"Fractured",tr:"Water",ic:"a_split",col:"#c39cf7",g:"death",m:{hp:.85},d:()=>tx("The first time it falls it splits into a remnant with {hp}% of its HP, {atk}% less Attack and no affixes.",{hp:pcn(AFX_T.split.hp),atk:pcn(1-AFX_T.split.atk)})},
  boom:{n:"Volatile",ti:"Unstable",tr:"Steam",ic:"a_boom",col:"#ffb142",g:"death",d:()=>tx("Explodes when it dies for {p}% of its max HP. Guard cuts the blast by {g}% when it dies on its own turn. Your rune ward soaks it.",{p:pcn(AFX_T.boom.x),g:pcn(1-AFX_T.boom.guard)})},
  swiftfoot:{n:"Swift-footed",ti:"Quicksilver",tr:"Swift",ic:"a_swift",col:"#6fd8b6",roam:1,m:{atk:AFX_T.swift.atk},d:()=>tx("Covers {n} tiles per step on the map. In a fight, +{a}% Attack and a {f}% chance each turn of a quick follow-up hit ({x}% damage).",{n:AFX_T.swift.moves,a:pcn(AFX_T.swift.atk-1),f:pcn(AFX_T.swift.fol),x:pcn(AFX_T.swift.fx)})}
};
const AFX_EL=Object.keys(AFX).filter(a=>AFX[a].t==="el"); // the old AFFIXES order: a save's `af` index maps into it
// Legendary secrets: ids = exact inputs (sorted match), hint = cryptic clue, bonus = extra trait merged into the result (on top of the +20% stats).
// Hints come from scrolls (S.hints lists secret indexes; each repeat reveals one more ingredient, see hintLv). The first three start revealed.
const SECRETS=[
  {ids:["ess_Light","ess_Sweet","iron_helmet"],name:"Lantern Helm",hint:"A helmet that lights caves, though the bugs adore it. Distilled, not cooked."},
  {ids:["holy_water","iron_sword","phoenix"],name:"Dawnbringer",hint:"A sword reborn in sacred fire."},
  {ids:["bread","chili","honey"],name:"Hearthfire Loaf",hint:"Sweet, spicy, and baked for a long winter march."},
  {ids:["oak_staff","rune_shard","ess_Swift"],name:"Stormcaller",hint:"A staff of the Spire, taught to answer to the wind.",bonus:{trait:"Arcane",v:2}},
  {ids:["iron_sword","rime_fang","spring_water"],name:"Glacier's Tooth",hint:"A blade quenched in meltwater, edged with the Pack Mother's bite.",bonus:{trait:"Frost",v:2}},
  {ids:["hunter_spear","gnarl_tusk","nightshade"],name:"Briar Widow",hint:"The Boar King's tusk, a hunter's point, and something that grows in the dark.",bonus:{trait:"Venomous",v:2}},
  {ids:["dagger","wraith_wraps","void_crystal","ess_Swift"],name:"Nightfang Claws",hint:"Four things, one skulking: a thief's edge and a ghost's grip, fed with the void, made quick. (Smith level 8.)",bonus:{trait:"Shadow",v:2}},
  {ids:["void_robe","star_heart","storm_feather"],name:"Mantle of Falling Stars",hint:"Woven darkness, a fallen star's heart, and the feather of a thing that flies above it all.",bonus:{trait:"Radiant",v:2}},
  {ids:["sentinel_aegis","golem_core","ess_Holy"],name:"Oathkeeper's Aegis",hint:"A guardian's shield taught to hold like a mountain, and sworn on something holy.",bonus:{trait:"Runic",v:2}},
  {ids:["ember_treads","gale_boots","coal"],name:"Cinderwind Treads",hint:"One boot walks in fire, the other on the gale. A coal binds the pair.",bonus:{trait:"Swift",v:2}},
  {ids:["sprite_lantern","star_heart","ess_Holy"],name:"Beacon of the Fallen",hint:"A small light from the woods, a great one fallen from the sky, and a blessing between.",bonus:{trait:"Holy",v:2}},
  {ids:["holy_water","spring_water","honey"],name:"Tears of Dawn",hint:"Two clear waters and a drop of sweetness, in a bottle that is somehow also a meal.",bonus:{trait:"Medicine",v:2}},
  {ids:["honey","mushroom","ess_Arcane"],name:"Starlit Honeycake",hint:"Glowing from the woods, sweet from the hive, with a pinch of the unseen.",bonus:{trait:"Radiant",v:1.5}}
];
const TUTORIAL=[
  {text:"Win your first battle.",tab:"battle",done:s=>s.wins>=1,reward:{items:["bread"]}},
  {text:"Deconstruct a raw find into materials and essence. Open Gear and tap a hide, ore or loaf.",tab:"gear",done:s=>s.stats.salvaged>=1,reward:{items:["spring_water"]}},
  {text:"Learn Weaponcraft or Armorcraft in Research (the Forge tab) and spend your research points.",tab:"forge",need:"research",done:s=>Object.keys(s.techs).some(id=>TECH[id].group),reward:{items:["ess:Ice"],xp:20}},
  {text:"Learn a slot technique under your group, then forge a piece from its pattern in the Forge.",tab:"forge",done:s=>s.stats.shaped>=1,reward:{items:["ess:Fire"],xp:20}},
  {text:"Use Study during a fight to learn something about an enemy.",tab:"battle",done:s=>s.stats.studied>=1,reward:{items:["ess:Sharp"]}},
  {text:"Learn an armor technique, forge a piece of armor from its pattern, then equip it.",tab:"gear",done:s=>["off","head","body","hands","feet"].some(k=>s.eq[k]&&s.items[s.eq[k]]&&FORMS[s.items[s.eq[k]].form].g==="armor"),reward:{camp:1}},
  {text:"Cross the Woods map and defeat Gnarlhorn at the end of it.",tab:"battle",done:s=>(s.kills.gnarlhorn||0)>=1,reward:{items:["ess:Swift","ess:Holy"],xp:30}},
  {text:"Infuse an essence into yourself in the Gear tab.",tab:"gear",done:s=>Object.keys(s.infuse||{}).length>0,reward:{camp:1,xp:20}},
  // steps 9-16 walk through the unlocks (see UNLOCKS). A step with need:"id" (an unlock) or ok(s) waits, showing how to open it (UNLOCKS txt, or wait), until its system is open
  {text:"Parry a telegraphed special: when a creature glows red, tap Parry.",tab:"battle",done:s=>s.stats.parries>=1,reward:{items:["ess:Iron"],xp:15}},
  {text:"Use your weapon's ability in a fight (the extra button by Attack).",tab:"battle",done:s=>s.stats.abil>=1,reward:{items:["ess:Swift"]}},
  {text:"Defeat a magic or rare enemy. A coloured frame marks them on the map.",tab:"battle",done:s=>s.stats.elites>=1,reward:{items:["ess:Arcane","ess:Shadow"],xp:25}},
  {text:"Set the Heat to 1 with the flame on the map strip, then start a new expedition.",tab:"battle",done:s=>Object.values(s.heat||{}).some(h=>h.sel>=1),reward:{camp:1,xp:20}},
  {text:"Train a crafting skill to level 2. Each forge trains the skill of what it makes.",tab:"forge",done:s=>Object.values(s.skills||{}).some(x=>x>=SK_LV[1]),reward:{items:["ess:Water"],xp:25}},
  {text:"Travel to Frostfang Pass and defeat a creature there.",tab:"battle",ok:s=>s.unlocked.includes("pass"),wait:"Defeat Gnarlhorn to open Frostfang Pass.",done:s=>(s.zoneKills.pass||0)>=1,reward:{items:["ess:Ice@4"],xp:40}},
  {text:"Spend some embers: buy from a peddler on the map, or upgrade a grade in the Forge.",tab:"battle",need:"peddler",done:s=>s.stats.spent>=1,reward:{items:["ess:Nourishing"],camp:1}},
  {text:"Play the daily expedition, under the map.",tab:"battle",need:"daily",done:s=>s.stats.dailies>=1,reward:{items:["ess:Holy@4","ess:Stone"],xp:60}}
];
// the map is a GRID.w x GRID.h tile grid; MAP_ROWS is its depth scale (0..5 by distance from the start, 6 = the lair) that sets enemy scaling and the daily's "depth reached"
const MAP_ROWS=7,GRID={w:13,h:17},POI_N={fight:[10,4],elite:[2,2],chest:2,shrine:2,peddler:1,mystery:3}; // denser maps; [min,spread]: fights 10-13, elites 2-3 (doubled at Heat 2+)
// DENSITY_RW: what a map fight pays against the old maps (embers, material drop chance), so a whole expedition keeps about its old loot with more fights (the sim's expedition meets about 1.3x the old count). Bosses and mimics are not scaled. SPAWN_NEW: the weight of a kind you have not mastered when a map picks its fights, against 1 for a mastered one.
const DENSITY_RW=.65,SPAWN_NEW=2;
// torchlight: the torch drains 1 per step (Heat 5: h5 per step); at 0 light drops to dim and every step risks an ambush (amb); shrine/rest refill
const TORCH={max:40,rad:2,dim:1,amb:.3,shrine:20,rest:15,h5:1.5,nocamp:20};
// roaming enemies: aw = path steps at which a chaser notices you (dark = torch out, heat = extra at Heat 3+, elite = elites), lose = steps at which it loses you, daze = steps a fled-from enemy stays idle, stay = a wanderer's chance to hold still
const ROAM={aw:4,dark:6,heat:1,elite:2,lose:8,daze:3,stay:.4};
// the peddler's one-for-one offer, and what a chest holds: a mimic, an extra essence, a hint scroll. The daily map pre-rolls the same chances (map.js genMap), so they live here.
const OFFER_T={ess:.3},CHEST_T={mimic:.25,ess:.5,scroll:.15};
// a bounty pays smith XP (a forge job, a hunt) and sometimes a campfire charge
const BOUNTY_T={forgeXp:20,huntXp:15,camp:.35};
const INF_SLOTS=3,INF_COST=3,INF_MAX=3,CRIT_CAP=75,FREEZE_CAP=60;
// mastery = the damage multiplier against a mastered creature (shown as a percentage); weak = the share a weaker second source counts for (an off-hand strike, an item's battle damage)
const MASTERY_X=1.15,MASTERY_PCT=pcn((MASTERY_X-1)*100),WEAK_X=.6;
const DEF_K=50,HIT_MIN=.2,MAG_W=1.3,redOf=d=>d/(d+DEF_K);
// trait combat tunables: res = elemental defense from armor traits, ward = Runic, pierce = Arcane, shred = Tempered
const RES_PER=5,RES_CAP=40,RES_ALT={Fur:[["ice",1],["wood",1]],Insulated:[["ice",2.5]]},RES_MSG={ice:"Your fur-lined gear blunts the cold.",fire:"Your gear turns aside the heat.",poison:"Your gear keeps the venom at bay.",holy:"Your gear dulls the glare.",shadow:"Your gear holds the gloom back.",wood:"Your gear shrugs off the thorns.",metal:"Your gear turns the blades.",stone:"Your gear absorbs the crushing blows.",arcane:"Your gear scatters the stray magic.",swift:"Your gear slows the flurry."};
const ARC_PER=12,ARC_CAP=60,WARD_PER=4,WARD_CAP=40,THORN_PER=4,THORN_CAP=30,STONE_DR=.6,STONE_CAP=6,SHRED_PER=1.5,SHRED_CAP=6,ROOT_PER=1.5,ROOT_CAP=8,DODGE_PER=4,DODGE_CAP=25,MED_PER=.1,MED_CAP=.5,MED_REGEN=.5;
// statuses enemies inflict on you: el = resisting element (P.rs), t = turns; cures = traits on consumables that clear them
const STATUS={burn:{get n(){return tx("Burn")},el:"fire",t:3,get tip(){return tx("damage each turn")}},chill:{get n(){return tx("Chill")},el:"ice",t:3,get tip(){return tx("no swift follow-ups, half dodge")}},poison:{get n(){return tx("Poison")},el:"poison",t:4,get tip(){return tx("stacking damage each turn")}},curse:{get n(){return tx("Curse")},el:"shadow",t:4,get tip(){return tx("healing you receive is halved")}}};
const INF_MSG={burn:"You catch fire",chill:"A numbing chill sets in",poison:"Venom seeps into your blood",curse:"A curse withers you"};
const ELITE_INF={Fire:"burn",Ice:"chill",Poison:"poison",Shadow:"curse"},ELITE_INF_CH=.25,POISON_STACK=3,POISON_FOE_CAP=15,CLEANSE_PER=6,CLEANSE_CAP=50,PARRY_X=1.5,PARRY_FAIL=1.25;
const GUARD_T={cut:.6,braced:.3}; // all hits in the enemy action; Braced boosts the next Attack or ability, once
const PARRY_T={base:.65,study:.05,levels:3,spd:.005,spdCap:.05,cap:.9,form:{blade:.05,spellblade:.05,claws:.05,lance:-.05,warstaff:-.05}};
// battle tunables: follow = the chance of a swift follow-up strike; crit = the base crit chance and the points per Sharp; atk = the attack of a zone's regular enemies, as the damage floor is judged; steam = the chance a Steam-blinded enemy misses; block = the chance a shield blocks; flee = the chance a boss stops you and the chance a flee works
const FOLLOW_T={cap:35,spd:3},CRIT_T={base:5,sharp:3},ATK_FLOOR=1.18,STEAM_T={cap:40,per:8},BLOCK_T={base:15,per:3},FLEE_T={boss:.5,ok:.7};
// signature abilities by weapon form (+ shield): cd = turns before reuse, x = power vs a normal attack
const ABILITIES={
  blade:{get name(){return tx("Flurry")},icon:"flurry",cd:3,hits:2,x:.7,get desc(){return tx("Two quick strikes at 0.7x each. Each can crit.")}},
  spear:{get name(){return tx("Lunge")},icon:"lunge",cd:3,x:1.2,pen:.7,open:.5,get desc(){return tx("1.2x strike that ignores 70% of armor. A spear also jabs first at 0.5x when a battle starts.")}},
  staff:{get name(){return tx("Channel")},icon:"channel",cd:3,x:1.3,pen:.5,get desc(){return tx("1.3x a normal attack that ignores half of armor. The weapon's top element effect always lands.")}},
  lance:{get name(){return tx("Charge")},icon:"charge",cd:4,x:2,open:.25,get desc(){return tx("2.0x heavy strike, but the enemy's reply hits you 25% harder.")}},
  spellblade:{get name(){return tx("Arc Slash")},icon:"arcslash",cd:3,x:1.2,get desc(){return tx("1.2x a normal attack. A crit refunds 1 turn of cooldown.")}},
  warstaff:{get name(){return tx("Sweep")},icon:"sweep",cd:3,x:1,stun:.35,bossStun:.15,get desc(){return tx("1.0x strike with a 35% chance to stun (15% on bosses). A stunned enemy loses its turn.")}},
  claws:{get name(){return tx("Rend")},icon:"rend",cd:3,x:.9,get desc(){return tx("0.9x strike that opens a bleed: 20% of Attack per turn for 5 turns (ignores armor). Rending again before it ends adds a stack, up to 3, and refreshes it.")}},
  shield:{get name(){return tx("Shield Bash")},icon:"bash",cd:3,x:.6,int:.85,bossInt:.6,stun:.2,bossStun:.08,get desc(){return tx("0.6x Attack plus your shield's defense. Cancels a telegraphed special (85%, 60% on bosses), otherwise 20% to stun (8% on bosses).")}}
},BLEED_STACK=3,BLEED_PER=.2,BLEED_T=5;
const CURES={Medicine:["burn","chill","poison","curse"],Holy:["curse","poison"],Water:["burn","chill"],Nourishing:["poison"]};
const RARITY=[["Common","#b3aa9e"],["Uncommon","#88d7a1"],["Rare","#7cb6f2"],["Epic","#c39cf7"],["Mythic","#ff8a50"]];
const XP_LV=[0,60,160,320,560,900,1400,2100,3000,4200];
// smith level perks: level-up toast text (lvMsg) and what maxInputs, infSlots and traitSlots read
const LV_PERK={2:"Third crucible slot unlocked.",3:"Another trait slot, and you can appraise a forge.",5:"Another trait slot.",7:"Another trait slot.",8:"Fourth crucible slot unlocked.",9:"Fourth infusion slot unlocked.",10:"Master smith: an eighth trait slot."},INPUT_LV=[2,8],MIMIC_HP=[1,2.1,3.1,4.1],MIMIC_ATK=[1,2.1,2.8,3.5];
// Crafting skills (S.skills[key]=xp): every category of thing levels on its own. A craft trains the result's skill (SK_XP.self of the craft's XP) and each other input category (SK_XP.input); a fizzle teaches SK_XP.fizzle of the base XP. Levels 1-10 come from SK_LV; SK_CAP[lv-1] is the highest result tier that skill can reach (the craft is blocked above it).
const SKILLS={weapon:{get name(){return tx("Weaponsmithing")},g:"blade",forms:["blade","spear","staff","lance","spellblade","warstaff","claws"],get cats(){return tx("all weapons")}},shield:{get name(){return tx("Shieldwright")},g:"shield",forms:["shield"],get cats(){return tx("shields")}},helm:{get name(){return tx("Helmsmithing")},g:"helm",forms:["helm"],get cats(){return tx("head armor")}},
  body:{get name(){return tx("Armorsmithing")},g:"chest",forms:["chest","bulwark"],get cats(){return tx("body armor, bulwarks")}},gloves:{get name(){return tx("Glovemaking")},g:"gloves",forms:["gloves"],get cats(){return tx("gloves")}},boots:{get name(){return tx("Bootmaking")},g:"boots",forms:["boots"],get cats(){return tx("boots")}},
  trinket:{get name(){return tx("Trinketry")},g:"charm",forms:["charm"],get cats(){return tx("trinkets")}},cooking:{get name(){return tx("Cooking")},g:"food",forms:["food"],get cats(){return tx("food")}},brewing:{get name(){return tx("Brewing")},g:"potion",forms:["potion","elixir"],get cats(){return tx("potions, elixirs")}},
  alchemy:{get name(){return tx("Alchemy")},g:"shard",forms:["material"],get cats(){return tx("essences, materials")}},
  salvage:{get name(){return tx("Salvaging")},g:"shard",forms:[],get cats(){return tx("anything salvaged")}}};
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0} // also needed by loadSave(), which runs before helpers.js loads
const skillOf=it=>Object.keys(SKILLS).find(k=>SKILLS[k].forms.includes(it.form));
const SK_LV=[0,30,80,160,280,450,680,980,1350,1800],SK_CAP=[3,4,5,6,7,8,9,9,9,9],SK_XP={self:1,input:.3,fizzle:.5};
// Salvaging (SKILLS.salvage) is never blocked; its level sets the output (crafting.js). xp: skill XP per salvage (over: times that above the cap); ess: chance of an affix essence at Lv 1, rising by essStep a level (100% at Lv 6); mat: levels that add a base material.
const SALV={xp:10,over:2,ess:.4,essStep:.12,mat:[3,6]};
// Difficulty of a recipe, in skill levels: CRAFT.base + CRAFT.tier per result tier above 1 + the raw instability (conflicts, reactions, extra inputs) / CRAFT.inst + CRAFT.up per tier above CRAFT.upFrom of a crafted input of the result's own form (upgrading again). The failure chance is FAIL.base + FAIL.slope x (difficulty - skill level), kept between FAIL.min and FAIL.max, and the share of failures that fizzle (lose everything, FIZ.refund of the ingredients' worth back in embers) instead of becoming a mishap is FIZ.base + FIZ.slope x the gap (FIZ.min..FIZ.max). Trait merges gain half as much above SOFT.
const CRAFT={base:1,tier:.8,inst:12,up:.5,upFrom:3},FAIL={base:10,slope:10,min:3,max:85},FIZ={base:.05,slope:.2,min:.05,max:.85,refund:.25},SOFT=8;
const STAT_NAMES={get atk(){return tx("Attack")},get def(){return tx("Defense")},get mag(){return tx("Magic")},get heal(){return tx("Heal")},get spd(){return tx("Speed")}};
const DECAY=[1,.5,.3,.2,.15,.1,.1,.1];
const ESS_VALUE=2.5;
// Embers: a currency from fights, salvage and selling; it buys peddler stock, upgrades grades and reforges mishaps (economy.js).
// worth(it) = 3 + 0.6 x power + 2 per tier above 1. Fights pay fight/elite/boss (+20% per heat level), salvage pays salv x worth, selling pays sell x worth, shop prices are buy x worth (essences: ess) but never below floor x the salvage value of the item (val per essence it yields + its embers), so buying to salvage never beats buying the essence.
// Reforge costs reforge[0] + reforge[1] x tier. Upgrading grades costs UP.emb (below).
const EMB={fight:2,elite:5,rar:{magic:5,rare:8},boss:15,heat:.2,salv:.15,sell:.5,buy:4.5,ess:36,val:12,floor:1.3,reforge:[10,4],stock:3,sells:4};
const MISHAP_TRAITS=["Cursed","Brittle","Rust"];
// Quality grades of essences and basic materials (ores, hides, herbs): 1 Faint, 2 Lesser, 3 Plain, 4 Greater, 5 Pure. A graded item has the id `<base>@<g>` (ess_Fire@4, golem_core@2); Plain keeps the bare id and no grade field, so secrets, recipes and old saves are unchanged (itemGrade in helpers.js reads it as 3). Its traits are the base's x GRADE_M (an essence: ESS_VALUE x GRADE_M). worth() is x GRADE_W. The grade shows only as pips (art/items.js: five, the grade filled, Pure glows); frame and stripe are rarity's, so grade colours never clash with RARITY.
// Infusion: an essence counts INF_W ninths of a plain one (3 of a grade make 1 of the next, so the weights are powers of 3). Drops roll a grade from GRADE_ODDS (weights per zone); each Heat level scales every weight by 1 + GRADE_HEAT, bosses roll as if GRADE_BOSS levels hotter. Salvaged gear gives essences of the lowest grade among the essences and materials it was crafted from (`sg` on the item, Plain if none), never above; a graded material salvages into its own grade.
// Upgrade: UP.n of a grade + UP.emb[grade-1] embers -> 1 of the next. Making a grade needs Alchemy GRADE_LV[grade-1]. Success = UP.base + UP.slope per Alchemy level above that need (UP.min..UP.max); a miss costs the embers and 1 of the UP.n. Alchemy XP is UP.xp[target-1] (half on a miss), faded by skFactor.
const GRADES=[["Faint","#8a7f72"],["Lesser","#9a7a52"],["Plain","#c9cdd2"],["Greater","#e0a83a"],["Pure","#ffe066"]],GRADE_M=[.6,.8,1,1.4,2],GRADE_W=[.5,.75,1,1.6,2.5],INF_W=[1,3,9,27,81];
const GRADE_ODDS={woods:[40,40,19,1,0],pass:[18,38,38,6,0],hollow:[8,28,50,13,1],spire:[6,18,52,21,3],rift:[6,18,52,21,3]},GRADE_HEAT=[-.08,-.04,0,.12,.25],GRADE_BOSS=1;
const INF_EQ=["⅑","⅓","1","3","9"]; // INF_W as plain essences, for text
const GRADE_LV=[1,1,1,3,6],UP={n:3,emb:[4,8,12,30],base:80,slope:6,min:80,max:98,xp:[3,4,6,14,30]};
const gradeOf=id=>{const m=/@([1-5])$/.exec(id);return m?+m[1]:3},baseIdOf=id=>id.replace(/@[1-5]$/,""),gradedId=(b,g)=>g===3?b:`${b}@${g}`; // pure id helpers (loadSave needs them before helpers.js loads)
const gradable=b=>{if(/^ess_[A-Za-z]+$/.test(b))return true;const [p,a,x]=b.split("~"),B=BASE[p];return !!B&&x===undefined&&(!a||!!AFX[a])&&B[1]==="material"&&["ore","hide","herb","timber"].includes(B[3])};
// an affixed variant (`boar_hide~vamp`, `iron_sword~vamp@4`): afxOfId gives the affix, plainId the BASE id under grade and affix
const afxOfId=id=>{const m=/~([a-z]+)(@[1-5])?$/.exec(id);return m&&AFX[m[1]]?m[1]:null},plainId=id=>baseIdOf(id).replace(/~[a-z]+$/,""),isBaseMat=id=>!!MATS[plainId(id)];
const VIEWS=["battle","gear","forge","recipes","codex","settings"];
// Heat: harder expeditions in a cleared zone, cumulative per level: every level adds hp/atk to all enemies (it ramps, 1.0x at Heat 0), and Heat 5 enemies bite through `bite` of your Defense. Beating the boss at heat h unlocks h+1.
const HEAT_MAX=5,HEAT_T={hp:.1,atk:.1,bite:.4,elite:2,inf:1.5,boss:1.2,rest:.25,shrine:.5,loot:.15,ess:1,xp:20};
const heatTot=h=>tx("enemies get +{hp}% HP and +{atk}% Attack",{hp:Math.round(h*HEAT_T.hp*100),atk:Math.round(h*HEAT_T.atk*100)});
const HEAT=[
  {get name(){return tx("Kindled")},get desc(){return tx("Enemies have +{hp}% HP and +{atk}% Attack. Every Heat level adds the same again.",{hp:Math.round(HEAT_T.hp*100),atk:Math.round(HEAT_T.atk*100)})}},
  {get name(){return tx("Smoldering")},get desc(){return tx("Maps hide twice as many elites and one more besides, and ordinary fights can turn magic ({b}%, +{h}% per further Heat). Elites turn rare more often at every Heat.",{b:pcn(RAR_CH.magic.base),h:pcn(RAR_CH.magic.heat)})}},
  {get name(){return tx("Blazing")},get desc(){return tx("Enemy status effects land 1.5x as often. Hunters notice you from one step further away.")}},
  {get name(){return tx("Searing")},get desc(){return tx("Bosses use their special one turn sooner (at least every 2) and have +20% HP. Rare enemies carry a third affix.")}},
  {get name(){return tx("Inferno")},get desc(){return tx("Enemy blows bite through {b}% of your Defense. Camps only offer rest, and it heals less (25%). Shrines heal half as much.",{b:Math.round(HEAT_T.bite*100)})}}
];
// Rewards at heat h: +15% per level on drop rolls, +1 essence and 20 smith XP per level on a boss kill.
// Daily expedition: seeded by the UTC date; one attempt a day, one twist.
const DAILY_TWISTS={
  elites:{get name(){return tx("Elites everywhere")},get desc(){return tx("Every fight is an elite.")}},
  cinder:{get name(){return tx("Everything burns")},get desc(){return tx("Every enemy can set you alight (30%, doubled if it already burns), and burns hurt 50% more.")}},
  nocamp:{get name(){return tx("No campfires")},get desc(){return tx("Camps become fights, and you can't rest at the fire.")}},
  double:{get name(){return tx("Double loot, double damage")},get desc(){return tx("Enemies hit twice as hard. Every drop is doubled.")}}
};
// Rift passives are selected by the region's saved biome, never by a map/combat random draw.
// Forest is deliberately the neutral biome. Status effects use ordinary Guard/Parry/resistance rules.
const RIFT_BIOME_MODS={
  fen:{name:"Poison fog",desc:"A landed foe hit adds one Poison stack (up to three). Guard blocks it; a successful Parry interrupts a telegraphed special; Poison resistance shortens it.",status:"poison",turns:3,damage:.06},
  tundra:{name:"Killing chill",desc:"A landed foe hit applies Chill for up to two turns. Guard blocks it; a successful Parry interrupts a telegraphed special; Ice resistance shortens it.",status:"chill",turns:2},
  ember:{name:"Cinder air",desc:"A landed foe hit applies Burn for up to two turns. Guard blocks it; a successful Parry interrupts a telegraphed special; Fire resistance shortens it.",status:"burn",turns:2,damage:.06},
  astral:{name:"Arcane surge",desc:"On every third enemy turn, its next attack (if any) has 25% more power and uses Arcane. Guard and Parry work as usual; Arcane resistance reduces it.",surgeEvery:3,surge:1.25},
  ash:{name:"Blinding sand",desc:"Your attacks deal 20% less damage on every third turn. The cadence is fixed by the battle turn.",strikeEvery:3,strike:.8},
  bone:{name:"Grave fear",desc:"A landed, unguarded foe hit leaves you off balance for your next action. Guard blocks it; a successful Parry interrupts a telegraphed special.",fear:1},
  deep:{name:"Drowning pressure",desc:"At the end of every third enemy turn, pressure deals 4% of your maximum HP, reduced by Stone resistance. It bypasses Defense and Guard, even if the attack was parried.",pressureEvery:3,pressure:.04}
};
// A Rift depth modifier is derived from the saved seed and depth, without drawing
// from the region/roster RNG stream. Forest and biome passives remain independent.
const RIFT_DEPTH_MODS=[
  {id:"burning_air",name:"Burning air",desc:"Fire attacks deal 15% more damage. Fire resistance, Defense and Guard still apply; enemy damage boosts combine multiplicatively.",fire:1.15},
  {id:"thin_wards",name:"Thin wards",desc:"Your rune ward can absorb at most half of each enemy hit; the rest of its ward points remain for later hits.",ward:.5},
  {id:"fast_foes",name:"Fast foes",desc:"Enemy specials recur one turn sooner, to a minimum interval of two turns; their tells and Parry windows remain intact.",fast:1}
];
function riftDepthModFor(seed,depth){
  if(seed==null)return null;
  const d=Math.max(1,Math.floor(Number(depth)||1)),i=hash("rift-depth:"+seed+":"+d)%RIFT_DEPTH_MODS.length;
  return RIFT_DEPTH_MODS[i];
}
const DAILY_REWARD={ess:3,xp:80};

// ================= UNLOCKS =================
// Systems open as you play. S.unl={id:order} (order = when it opened, which sets the order intros queue in); S.seen["i:"+id] marks a read intro, S.seen["a:"+form] an introduced weapon ability.
// Each entry: id, name, ic (icon in NODE_G), when(s) (a pure test over the state; omit for hooks that call unlock(id) themselves),
// txt (teaser: how to unlock it), w (toast hint), q (quiet: no toast or sound), i ({t,l:[1-3 short lines],tab,sel,ctx}: the one-time intro; tab = where it shows, sel = what gets pulsed, ctx "battle" = shown above the action grid in a fight; omit i for a system with no card).
// Order matters: it is the order of the Codex Guide. To gate something new add an entry here, test isUnl(id) where it is drawn (lockRow(id) draws the teaser), and add a step to TUTORIAL if it deserves one.
const lvOf=xp=>XP_LV.filter(t=>xp>=t).length,exps=s=>s.stats.exped+s.stats.deaths,has_=(s,...ids)=>ids.every(i=>s.unl[i]); // exps: finished expeditions (a boss down or a defeat)
const boss1=s=>(s.kills[ZONES[0][2]]|0)>0,abOf=s=>[s.eq.main,s.eq.off].some(id=>id&&s.items[id]&&ABILITIES[s.items[id].form]);
// ================= RESEARCH =================
// Research points (S.rp) come from discoveries: each source in RP pays once (S.rpd keeps which). They buy techniques (S.techs={id:order}, S.tpaid={id:RP paid}); what you can craft depends on them (actionOk in research.js).
// A technique: id, name, ic, cost (RP), pre (all needed), or (any one of these, if given), rq/ok (a requirement over a state: Smith level or a skill), pos [column, row] in the tree, d (what it is), gate (what it opens, shown in tips) and i (the intro card, queued when learned).
// Gear: a group technique (weaponcraft, armorcraft: gr, group) makes the slot techniques of its group (gr: weapon or armor) cost half, and the first one after it is free (techCost). Each slot technique is the pattern (and blueprints) of one kind of gear: SLOT_TECH.
// The forge actions: infuse (essences), improve (materials), fuse (two forms), refine (grades, see UP), mend (reforge), precision and masterwork. KITCHEN_TECH: food, potions and materials need cooking, brewing and alchemy. actionOk (research.js) reads these.
const GROUP_TECH={weapon:"weaponcraft",armor:"armorcraft"},SLOT_TECH={blade:"blade",spear:"spear",staff:"staff",helm:"helm",chest:"body",bulwark:"body",gloves:"gloves",boots:"boots",shield:"shield",charm:"trinketry"},KITCHEN_TECH={food:"cooking",potion:"brewing",elixir:"brewing",material:"alchemy"};
const SLOT_ALL=["blade","spear","staff","helm","body","gloves","boots","shield"];
const RP={form:2,rec:1,recCap:10,fam:1,rx:4,study:1,mast:2,boss:[4,8,12,16,20],afx:1,leg:4,lv:2,lvMax:9,sk:2,skLv:[3,5,7,9],bp:2,salv:3},PREC=[5,5],INSIGHT={ch:35}; // INSIGHT.ch: % chance a craft with one side of an unseen reaction hints at it; RP.salv: the first salvage pays this much (a first step toward a group technique)
const skLvOf=(s,k)=>SK_LV.filter(t=>((s.skills||{})[k]|0)>=t).length,smLv=n=>({rq:"Smith Lv {l}",rv:{l:n},ok:s=>lvOf(s.xp)>=n});
const TECHS=[
  {id:"weaponcraft",name:"Weaponcraft",ic:"attack",cost:14,pre:[],gr:"weapon",group:1,pos:[0,0],d:"Weapon slot techniques cost half. The first one you learn after this is free.",gate:"Blade, spear and staff: half price, and one free.",
    i:{t:"Weaponcraft",l:["Weapon slot techniques cost half now. Your next weapon technique is free: pick the blade, spear or staff you want most."],tab:"forge",sel:"#resd"}},
  {id:"blade",name:"Bladecraft",ic:"smith",cost:6,pre:["weaponcraft"],gr:"weapon",pos:[0,1],d:"The blade pattern and its blueprints in the Forge.",gate:"Blades.",
    i:{t:"Bladecraft",l:["Blades can be forged from the blade pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"spear",name:"Spearcraft",ic:"smith",cost:6,pre:["weaponcraft"],gr:"weapon",pos:[0,2],d:"The spear pattern and its blueprints in the Forge.",gate:"Spears.",
    i:{t:"Spearcraft",l:["Spears can be forged from the spear pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"staff",name:"Staffcraft",ic:"smith",cost:6,pre:["weaponcraft"],gr:"weapon",pos:[0,3],d:"The staff pattern and its blueprints in the Forge.",gate:"Staves.",
    i:{t:"Staffcraft",l:["Staves can be forged from the staff pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"armorcraft",name:"Armorcraft",ic:"guard",cost:14,pre:[],gr:"armor",group:1,pos:[1,0],d:"Armor slot techniques cost half. The first one you learn after this is free.",gate:"Helm, body, gloves, boots and shield: half price, and one free.",
    i:{t:"Armorcraft",l:["Armor slot techniques cost half now. Your next armor technique is free: pick the piece you need most."],tab:"forge",sel:"#resd"}},
  {id:"helm",name:"Helmcraft",ic:"smith",cost:6,pre:["armorcraft"],gr:"armor",pos:[1,1],d:"The helm pattern and its blueprints in the Forge.",gate:"Head armor.",
    i:{t:"Helmcraft",l:["Helms can be forged from the helm pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"body",name:"Bodycraft",ic:"smith",cost:6,pre:["armorcraft"],gr:"armor",pos:[1,2],d:"The body pattern (jerkins, plate and bulwarks) in the Forge.",gate:"Body armor and bulwarks.",
    i:{t:"Bodycraft",l:["Body armor and bulwarks can be forged from the body pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"gloves",name:"Glovecraft",ic:"smith",cost:6,pre:["armorcraft"],gr:"armor",pos:[1,3],d:"The gloves pattern and its blueprints in the Forge.",gate:"Gloves.",
    i:{t:"Glovecraft",l:["Gloves can be forged from the gloves pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"boots",name:"Bootcraft",ic:"smith",cost:6,pre:["armorcraft"],gr:"armor",pos:[1,4],d:"The boots pattern and its blueprints in the Forge.",gate:"Boots.",
    i:{t:"Bootcraft",l:["Boots can be forged from the boots pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"shield",name:"Shieldcraft",ic:"smith",cost:6,pre:["armorcraft"],gr:"armor",pos:[1,5],d:"The shield pattern and its blueprints in the Forge.",gate:"Shields.",
    i:{t:"Shieldcraft",l:["Shields can be forged from the shield pattern in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"trinketry",name:"Trinketry",ic:"amulet",cost:6,pre:[],or:["weaponcraft","armorcraft"],pos:[0,4],d:"Charms: trinkets made from crystal and ingots.",gate:"Trinkets (charms).",
    i:{t:"Trinketry",l:["Trinkets are made from crystal and ingots. The charm pattern is in the Forge."],tab:"forge",sel:"#pats"}},
  {id:"infuse",name:"Infusing",ic:"infuse",cost:8,pre:[],or:SLOT_ALL,pos:[2,0],d:"Infuse: one item and one essence. The essence's trait joins the item's traits.",gate:"An item and an essence.",
    i:{t:"Infusing",l:["Put one item and one essence in the crucible: the essence's trait joins the item's traits."],tab:"forge",sel:"#cacts"}},
  {id:"infuse2",name:"Infusing II",ic:"infuse",cost:14,pre:["infuse"],...smLv(3),pos:[2,1],d:"Two essences go into one infusion.",gate:"Two essences at once.",
    i:{t:"Infusing II",l:["Two essences can go into one infusion now."],tab:"forge",sel:"#cacts"}},
  {id:"infuse3",name:"Infusing III",ic:"infuse",cost:24,pre:["infuse2"],...smLv(5),pos:[2,2],d:"Infuse an item that is already infused: the traits stack.",gate:"An infused item, infused again.",
    i:{t:"Infusing III",l:["An item that already holds essences can take another one. The traits stack."],tab:"forge",sel:"#cacts"}},
  {id:"improve",name:"Improving",ic:"bag",cost:10,pre:[],or:SLOT_ALL,pos:[3,0],d:"Improve: an item and materials (ore, hide, herb, relic). The item keeps its form.",gate:"An item and materials.",
    i:{t:"Improving",l:["Ore, hide, herb and relics can go into an item in the crucible, and the item keeps its form."],tab:"forge",sel:"#cacts"}},
  {id:"improve2",name:"Improving II",ic:"bag",cost:18,pre:["improve"],...smLv(3),pos:[3,1],d:"More materials in one go, as far as the crucible has slots.",gate:"Several materials at once.",
    i:{t:"Improving II",l:["Several materials can go into one improvement, as far as the crucible has slots."],tab:"forge",sel:"#cacts"}},
  {id:"fuse",name:"Fusing",ic:"alloy",cost:20,pre:["improve"],pos:[3,2],d:"Merge two kinds of gear into a new form, like a spear and a shield into a lance.",gate:"Form fusions, once both forms are known.",
    i:{t:"Fusing",l:["Two kinds of gear can now merge into a new form, such as a spear and a shield into a lance.","The Recipes tab lists every fusion."],tab:"forge",sel:"#cacts"}},
  {id:"refine",name:"Refining",ic:"upgrade",cost:12,pre:[],rq:"Salvaging Lv {l}",rv:{l:2},ok:s=>skLvOf(s,"salvage")>=2,pos:[2,3],d:"Raise a grade: three essences or materials of one grade become one of the next.",gate:"The grade upgrade panel.",
    i:{t:"Refining",l:["{n} essences or materials of one grade, plus some embers, make one of the next grade: stronger traits in one slot.","The Refine tab holds the panel once you have embers and crafting skills."],v:{n:UP.n},tab:"forge",sel:"#cacts"}},
  {id:"mend",name:"Mending",ic:"cleanse",cost:12,pre:[],or:["infuse","improve"],pos:[2,4],d:"Mend a flawed craft (Cursed, Brittle, Rust or Weakened) by reforging it.",gate:"Reforging flawed items.",
    i:{t:"Mending",l:["Open a flawed item and tap Reforge to strip its flaws. It costs embers, so it shows once you have some."],tab:"forge",sel:"#finv"}},
  {id:"prec1",name:"Precision I",ic:"weak",cost:20,pre:["mend"],...smLv(3),pos:[3,4],d:"A steadier hand: {n} points fewer failures in every forge.",v:{n:PREC[0]},gate:"Lower failure odds.",
    i:{t:"Precision I",l:["Your hand is steadier: every forge fails {n} points less often (never under {min}%)."],v:{n:PREC[0],min:FAIL.min},tab:"forge",sel:"#cacts"}},
  {id:"prec2",name:"Precision II",ic:"weak",cost:30,pre:["prec1"],...smLv(6),pos:[3,5],d:"Steadier still: another {n} points fewer failures.",v:{n:PREC[1]},gate:"Lower failure odds.",
    i:{t:"Precision II",l:["Another {n} points off every forge's failure chance, {t} in all (never under {min}%)."],v:{n:PREC[1],t:PREC[0]+PREC[1],min:FAIL.min},tab:"forge",sel:"#cacts"}},
  {id:"master",name:"Masterwork",ic:"renown",cost:40,pre:["fuse","infuse2"],...smLv(5),pos:[3,3],d:"Legendary secrets can succeed: the exact ingredients forge a legendary.",gate:"Legendary secrets.",
    i:{t:"Masterwork",l:["Legendary secrets can succeed now: forge the exact ingredients a rumor names and the result is legendary.","Until now the right ingredients only made an ordinary piece."],tab:"forge",sel:"#cacts"}},
  {id:"cooking",name:"Cooking",ic:"heal_hit",cost:4,pre:[],pos:[4,0],d:"Food: ingredients only, in its own simple crucible.",gate:"Food, from herbs and essences.",
    i:{t:"Cooking",l:["Food is cooked from herbs and essences. Eating it in a fight heals you."],tab:"forge",sel:"#cacts"}},
  {id:"brewing",name:"Brewing",ic:"water",cost:6,pre:[],pos:[4,1],d:"Potions and elixirs.",gate:"Potions and elixirs.",
    i:{t:"Brewing",l:["Potions and elixirs are brewed from herbs and potions in the crucible."],tab:"forge",sel:"#cacts"}},
  {id:"alchemy",name:"Alchemy",ic:"ember",cost:8,pre:[],or:["brewing","infuse"],pos:[4,2],d:"Make essences and materials in the crucible.",gate:"Essences and materials.",
    i:{t:"Alchemy",l:["Essences and materials can be made in the crucible from other essences and materials."],tab:"forge",sel:"#cacts"}}
].map(t=>({ok:()=>true,rq:"",...t}));
const TECH=Object.fromEntries(TECHS.map(t=>[t.id,t]));
// the branch columns of the tree (research.js): a name and the first and last column (pos[0]) it spans
const BRANCHES=[{name:"Gear",c:[0,1]},{name:"Forge actions",c:[2,3]},{name:"Kitchen",c:[4,4]}];
// the action tabs of the Forge tab (forge-view.js): tech is the technique that opens it (null: always). Forge is the pattern panel and Refine the grade panel; the rest are crucible actions (actFit, crafting.js).
const ACTIONS=[{id:"forge",name:"Forge",ic:"forge",tech:null},{id:"infuse",name:"Infuse",ic:"infuse",tech:"infuse"},{id:"improve",name:"Improve",ic:"bag",tech:"improve"},{id:"fuse",name:"Fuse",ic:"alloy",tech:"fuse"},{id:"refine",name:"Refine",ic:"upgrade",tech:"refine"},{id:"cook",name:"Cook",ic:"heal_hit",tech:"cooking"},{id:"brew",name:"Brew",ic:"water",tech:"brewing"},{id:"alchemy",name:"Alchemy",ic:"ember",tech:"alchemy"}];
const CRUCIBLE_ACTS=["infuse","improve","fuse","cook","brew","alchemy"];
// one vague word per trait that takes part in a reaction: an insight says "X reacts with <this>" without naming the partner
const VAGUE={Fire:"something hot",Ice:"something freezing",Water:"something wet",Poison:"something venomous",Nourishing:"something wholesome",Sweet:"something sweet",Light:"something bright",Holy:"something sacred",Shadow:"something dark",Iron:"something forged",Arcane:"something uncanny",Stone:"something heavy",Fur:"something warm",Sharp:"something keen",Steam:"something misty"};
const UNLOCKS=[
  {id:"start",name:"The map",ic:"hero",q:1,when:()=>true,i:{t:"Your first expedition",l:["Tap a glowing tile next to you to step. Fights drop loot, and a camp waits before the boss.","In a fight: Attack, Guard or Flee. Your torch burns down as you walk."],tab:"battle",sel:".tl.adj"}},
  {id:"salvage",name:"Salvage",ic:"salvage",when:s=>Object.keys(s.inv).some(id=>s.inv[id]>0&&canDecon(s.items[id])),txt:"Pick up a raw find: a hide, an ore or a herb.",w:"Open the Gear tab.",
    i:{t:"Salvage",l:["Deconstruct a raw find for base materials, embers and sometimes an essence.","Salvaging trains its own skill, and a higher level gives better materials."],tab:"gear",sel:"#ginv"}},
  {id:"blueprints",name:"Blueprints",ic:"scroll",when:s=>Object.values(s.codex).some(k=>k&&Array.isArray(k.bp)&&k.bp.length>0),txt:"Study a creature in a fight.",w:"Open the Forge tab.",
    i:{t:"Blueprints",l:["A blueprint forges a creature's named gear from base materials. It waits beside the patterns in the Forge.","Study creatures in a fight, or master them, to learn more."],tab:"forge",sel:"#pats .bpb"}},
  {id:"study",name:"Study",ic:"study",when:s=>s.wins>=1,txt:"Win your first battle.",w:"It joins the action buttons.",
    i:{t:"Study",l:["Spend a turn to learn one fact about a foe: a weakness, a resistance or its strength.","Study also improves your parry timing against this special, up to three ranks."],ctx:"battle",sel:"#study"}},
  {id:"parry",name:"Parry",ic:"parry",txt:"Meet a creature that winds up a special move.",w:"It joins the action buttons.",
    i:{t:"It's winding up",l:["Parry a telegraphed special to negate it and riposte. Your chance is shown on the button.","Study, Speed and weapon form improve your odds. Guard blocks new statuses and strengthens your next attack."],ctx:"battle",sel:"#parry"}},
  {id:"ability",name:"Weapon abilities",ic:"attack",when:s=>(lvOf(s.xp)>=2||s.wins>=3)&&abOf(s),txt:"Equip a weapon with a signature move at Smith Lv 2, or after 3 wins.",w:"It joins the action buttons in your next fight.",
    i:{t:"Weapon abilities",l:["Every weapon form has one signature move, and a shield can bash.","It takes your turn, then needs a few turns to cool down."],ctx:"battle",sel:".ab"}},
  {id:"roam",name:"Roaming enemies",ic:"fight",q:1,when:s=>s.wins>=1},
  {id:"hunt",name:"Hunters",ic:"warn",txt:"Let a creature catch your scent.",w:"",
    i:{t:"It's hunting you",l:["Some creatures catch your scent and follow, a step behind. A ! marks them.","Fight when you choose, or Flee: it stays behind, dazed, for a few steps."],tab:"battle",sel:".tl.aware"}},
  {id:"shrine",name:"Shrines",ic:"shrine",when:s=>exps(s)>=1,txt:"Finish your first expedition.",w:"Look for them on your next expedition.",
    i:{t:"Shrines",l:["Pray to mend yourself and relight your torch, or give the stones something for a hint scroll.","Look for the shrine on the map."],tab:"battle",sel:".tl.p-shrine"}},
  {id:"peddler",name:"Peddlers and embers",ic:"peddler",when:s=>exps(s)>=2,txt:"Finish two expeditions.",w:"Look for one on your next expedition.",
    i:{t:"Peddlers and embers",l:["Fights, salvage and selling earn embers. A peddler on the map trades them for wares, buys your spares or swaps goods."],tab:"battle",sel:"#emb,.tl.p-peddler"}},
  {id:"mystery",name:"Mystery events",ic:"mystery",when:s=>exps(s)>=2,txt:"Finish two expeditions.",w:"Look for ? tiles on your next expedition.",
    i:{t:"Mystery tiles",l:["A ? tile can hold anything: an ambush, a stranger with a bargain, a riddle, an old forge.","Read the choices. Walking away is always allowed."],tab:"battle",sel:".tl.p-mystery"}},
  {id:"elite",name:"Magic and rare foes",ic:"elite",when:s=>lvOf(s.xp)>=3||ZONES.some(z=>s.seen[z[2]]),txt:"Face a region boss, or reach Smith Lv 3.",w:"They show up on your next expedition.",
    i:{t:"Magic and rare foes",l:["Some creatures carry affixes: tricks that change the fight. A coloured frame marks them on the map.","Each drops an affixed material in a better grade. Deconstruct it for that affix's essence."],tab:"battle",sel:".tl.p-elite"}},
  {id:"infuse",name:"Infusions",ic:"infuse",when:s=>boss1(s)||s.quest>=7,txt:"Defeat Gnarlhorn.",w:"Open the Gear tab.",
    i:{t:"Infusions",l:["Essences worth {cost} plain ones can be infused into you. The trait stays whatever you wield.","Feed it the same essence again to deepen it, up to {max}."],v:{cost:INF_COST,max:["I","II","III"][INF_MAX-1]},tab:"gear",sel:"#inflabel"}},
  {id:"skills",name:"Crafting skills",ic:"hammer",when:s=>s.journal.length>0||s.stats.forged>0,txt:"Forge something.",w:"Open the Forge tab.",
    i:{t:"Crafting skills",l:["Every kind of thing has its own skill, and forging it trains it.","A higher skill reaches higher tiers and fails less often."],tab:"forge",sel:"#skd"}},
  {id:"research",name:"Research",ic:"research",when:s=>s.stats.salvaged>0||lvOf(s.xp)>=2,txt:"Salvage something, or reach Smith Lv 2.",w:"Open the Forge tab.",
    i:{t:"Research",l:["Forging, salvaging, studying and meeting new things teach you something. Each first discovery earns research points, and so do reaching new smith and skill levels and defeating bosses.","Spend them in the Forge on techniques: they decide what you can craft. Salvaging gave you your first points: Weaponcraft or Armorcraft is a good start, and each unlocks the slot techniques of its group."],tab:"forge",sel:"#resd"}},
  ...TECHS.filter(t=>t.i).map(t=>({id:"t:"+t.id,name:t.name,ic:t.ic,q:1,when:s=>!!s.techs[t.id],i:t.i})), // a technique's intro is queued when it is learned (the toast and sound come from learnTech)
  {id:"upgrade",name:"Grade upgrades",ic:"upgrade",when:s=>has_(s,"peddler","skills")&&!!s.techs.refine,txt:"Unlock embers and crafting skills, and learn Refining in Research.",w:"Open the Forge tab.",
    i:{t:"Grade upgrades",l:["{n} essences or materials of one grade and some embers make one of the next grade: stronger traits in one slot.","A miss costs the embers and one of the {n}."],v:{n:UP.n},tab:"forge",sel:"#upgd"}},
  {id:"heat",name:"Heat",ic:"heat",when:s=>Object.values(s.heat).some(h=>h.max>0)||boss1(s),txt:"Defeat a region boss.",w:"Find the flame on the map strip.",
    i:{t:"Heat",l:["Pick a Heat level with the flame on the map strip. Enemies grow tougher and loot gets richer.","Beat a region's boss at your highest Heat to unlock the next."],tab:"battle",sel:"#heatBtn"}},
  {id:"daily",name:"Daily expedition",ic:"daily",when:s=>((s.kills[ZONES[1][2]]|0)>0||lvOf(s.xp)>=5)&&has_(s,"shrine","peddler","mystery","elite","roam"),txt:"Clear Frostfang Pass or reach Smith Lv 5, after meeting shrines, peddlers and mysteries.",w:"It waits under the map.",
    i:{t:"The daily expedition",l:["One run a day on a map everyone shares. Beat the boss for essences, a rare find and smith XP.","You get a single attempt."],tab:"battle",sel:".dcard"}},
  {id:"rift",name:"The Wanderer's Rift",ic:"mystery",when:s=>(s.kills[ZONES[3][2]]|0)>0,txt:"Defeat the Starfallen Archon.",w:"A crack in the world waits past the Spire.",
    i:{t:"The Wanderer's Rift",l:["Past the Spire the world frays. Every expedition there is a new region, rolled at random: a biome, ten wild creatures and a master.","Wild creatures carry affixes of their own, and the master carries three. Beat it to go one depth deeper.","Your deepest run is your record."],tab:"battle",sel:"#zones"}},
  {id:"bounty",name:"Bounties",ic:"list",when:s=>s.quest>=TUTORIAL.length,txt:"Finish the goal chain.",w:"The goal bar offers them now.",
    i:{t:"Bounties",l:["With the first steps behind you, the goal bar offers bounties: hunts and forging jobs that pay in essences.","Claim one to get the next."],tab:"battle"}},
  {id:"afx",name:"Affixes",ic:"elite",when:s=>Object.keys(s.afx).length>0,txt:"Meet a magic or rare enemy.",w:"See the Codex tab.",
    i:{t:"Affixes",l:["The Codex now records every affix you meet: what it does and which essence it drops."],tab:"codex",sel:"#aflabel"}},
  {id:"stats",name:"Lifetime stats",ic:"renown",q:1,when:s=>s.wins>=3,txt:"Win 3 battles."},
  {id:"fen_intro",name:"The Sinking Fen",ic:"shrine",q:1,when:s=>s.unlocked.includes("fen"),
    i:{t:"The Sinking Fen",l:["The old road ends in black water. Follow the reed-markers to the far bank; the Drowned Matriarch waits beyond them.","The Fen is open because you brought down the Starfallen Archon. Its boss guards the next descent."],tab:"battle"}}
];
const UNL=Object.fromEntries(UNLOCKS.map(u=>[u.id,u]));

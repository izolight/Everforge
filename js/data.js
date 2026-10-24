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
const ACCEPTS={weapon:["ore","herb","potion","essence","relic"],armor:["hide","ore","essence","relic"],charm:["ore","essence","relic"],food:["food","herb","essence"],potion:["potion","herb","essence"]};
const KIND_LABEL={weapon:"weapons",armor:"armor",charm:"trinkets",food:"food",potion:"potions",hide:"hides",ore:"ores",herb:"herbs",essence:"essences",relic:"relics"};
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
  storm_draught:["Stormdraught","potion",{Swift:2,Water:2,Arcane:1}]
};
const ZONES=[["woods","Whispering Woods","gnarlhorn"],["pass","Frostfang Pass","rimeclaw"],["hollow","Cinder Hollow","phoenix"],["spire","Starfall Spire","archon"]];
const ENEMIES={
  boar:{name:"Thornback Boar",plural:"Thornback Boars",zone:"woods",el:"wood",hp:30,atk:6,def:2,weak:["fire"],resist:[],w:3,verb:"gores you",intro:"A Thornback Boar bursts out of the brush.",
    lore:"Bristled forest boars that sharpen their tusks on oak bark. They charge when cornered, and often when not.",
    sp:{every:3,name:"Tusk Charge",kind:"heavy",x:2,tell:"lowering its tusks"},drops:[["boar_hide",.6],["chili",.4],["hide_gloves",.15]]},
  sprite:{name:"Glowcap Sprite",plural:"Glowcap Sprites",zone:"woods",el:"holy",hp:22,atk:4,def:0,weak:["fire","shadow"],resist:["holy"],w:3,verb:"flings spores at you",intro:"A Glowcap Sprite drifts out from between the roots.",
    lore:"Mushroom spirits that glow brighter when frightened. They knit their caps back together with spores.",
    sp:{every:3,name:"Mend",kind:"heal",x:.3,tell:"gathering glowing spores around itself"},drops:[["mushroom",.75],["honey",.45],["sprite_lantern",.12]]},
  bandit:{name:"Woods Bandit",plural:"Woods Bandits",zone:"woods",el:"metal",hp:34,atk:7,def:3,weak:["arcane"],resist:[],w:2,verb:"slashes at you",intro:"A Woods Bandit steps onto the path, blade drawn.",
    lore:"Deserters and debtors who work the woods road. They carry whatever they last stole.",
    sp:{every:3,name:"Flurry",kind:"multi",n:3,x:.6,tell:"shifting into a low, quick stance"},drops:[["bread",.55],["dagger",.25],["wood_shield",.2],["leather_cap",.2],["jerkin",.18],["trail_boots",.18],["hunter_spear",.1],["oak_staff",.1],["iron_sword",.07]]},
  gnarlhorn:{name:"Gnarlhorn, the Boar King",short:"Gnarlhorn",zone:"woods",el:"wood",boss:true,hp:75,atk:9,def:4,weak:["fire"],resist:["wood"],verb:"tramples you",intro:"The ground shakes. Gnarlhorn, the Boar King, crashes through the trees.",
    lore:"The old king of the boar herds, his hide grown thick as bark. The woods go quiet when he walks.",
    sp:{every:3,name:"Stampede",kind:"heavy",x:2.2,tell:"pawing the ground"},drops:[["gnarl_tusk",1],["boar_hide",.8]]},
  wolf:{name:"Frost Wolf",plural:"Frost Wolves",zone:"pass",el:"ice",hp:60,atk:11,def:3,weak:["fire"],resist:["ice"],w:3,verb:"bites",intro:"A Frost Wolf circles you through the snow.",
    lore:"Pack hunters with frost in their fur. They test you from the sides before they commit.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Pounce",kind:"heavy",x:1.8,tell:"crouching low"},drops:[["pelt",.75],["spring_water",.35],["fang_charm",.18]]},
  wraith:{name:"Ice Wraith",plural:"Ice Wraiths",zone:"pass",el:"shadow",hp:50,atk:11,def:1,weak:["holy","fire"],resist:["ice","metal"],w:2,verb:"chills you",intro:"The air freezes as an Ice Wraith takes shape.",
    lore:"Travellers who froze on the pass and never stopped walking. They feed on warmth.",
    inf:{s:"curse",ch:0.35},
    sp:{every:3,name:"Soul Siphon",kind:"drain",x:1.2,tell:"reaching toward your chest"},drops:[["shroud",.55],["spring_water",.4],["holy_water",.25],["wraith_wraps",.18]]},
  golem:{name:"Stone Golem",plural:"Stone Golems",zone:"pass",el:"stone",hp:90,atk:10,def:8,weak:["arcane","ice"],resist:["metal","poison"],w:2,verb:"slams you",intro:"A boulder unfolds into a Stone Golem.",
    lore:"Boulders woken by old runes. Slow to anger and slower to stop.",
    sp:{every:4,name:"Earthquake",kind:"heavy",x:2.5,tell:"raising both fists overhead"},drops:[["golem_core",.7],["iron_helmet",.3],["stone_plate",.2]]},
  rimeclaw:{name:"Rimeclaw, the Pack Mother",short:"Rimeclaw",zone:"pass",el:"ice",boss:true,hp:140,atk:14,def:5,weak:["fire"],resist:["ice","shadow"],verb:"mauls you",intro:"A howl splits the air. Rimeclaw, the Pack Mother, blocks the pass.",
    lore:"Mother of every pack on the pass. Her howl turns the air to needles.",
    inf:{s:"chill",ch:0.35},
    sp:{every:3,name:"Blizzard Howl",kind:"multi",n:3,x:.75,tell:"drawing a long breath"},drops:[["rime_fang",1],["pelt",.8]]},
  imp:{name:"Ember Imp",plural:"Ember Imps",zone:"hollow",el:"fire",hp:80,atk:14,def:4,weak:["ice"],resist:["fire"],w:3,verb:"scorches you",intro:"An Ember Imp cackles from a vent of smoke.",
    lore:"Small, spiteful fire spirits that nest in the vents of the Hollow.",
    inf:{s:"burn",ch:0.3},
    sp:{every:3,name:"Fireball",kind:"heavy",x:2,tell:"cupping a glow between its hands"},drops:[["coal",.75],["chili",.4],["ember_treads",.18]]},
  witch:{name:"Nightshade Witch",plural:"Nightshade Witches",zone:"hollow",el:"poison",hp:95,atk:15,def:5,weak:["holy","metal"],resist:["shadow","poison"],w:2,verb:"hexes you",intro:"A Nightshade Witch rises from her bubbling cauldron.",
    lore:"Herbalists who stayed too long among the nightshade. Their brews heal them and only them.",
    inf:{s:"poison",ch:0.35},
    sp:{every:3,name:"Hex Brew",kind:"heal",x:.25,tell:"stirring her cauldron"},drops:[["nightshade",.7],["oak_staff",.25],["holy_water",.3],["witch_eye",.18]]},
  phoenix:{name:"Cinder Phoenix",short:"the Phoenix",zone:"hollow",el:"fire",boss:true,rebirth:true,hp:170,atk:18,def:7,weak:["ice"],resist:["fire","holy"],verb:"rakes you with burning talons",intro:"The sky ignites. A Cinder Phoenix descends.",
    lore:"The Hollow's heart. It has died many times and seems to have enjoyed none of them.",
    inf:{s:"burn",ch:0.35},
    sp:{every:3,name:"Inferno",kind:"heavy",x:2.2,tell:"spreading its burning wings"},drops:[["phoenix",1],["holy_water",.6]]},
  harpy:{name:"Storm Harpy",plural:"Storm Harpies",zone:"spire",el:"swift",hp:105,atk:21,def:3,weak:["stone","ice"],resist:["swift"],w:3,verb:"rakes you",intro:"A Storm Harpy shrieks out of the cloud bank.",
    lore:"Wind-spirits in the shape of birds, forever circling the spire. Each wingbeat carries a little thunder.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Gale Rush",kind:"multi",n:4,x:.55,tell:"wheeling overhead, wings drawn tight"},drops:[["storm_feather",.75],["storm_draught",.35],["gale_boots",.16]]},
  sentinel:{name:"Runebound Sentinel",plural:"Runebound Sentinels",zone:"spire",el:"arcane",hp:155,atk:22,def:9,weak:["metal","poison"],resist:["arcane","stone"],w:2,verb:"strikes you",intro:"A Runebound Sentinel grinds to life, its glyphs flaring.",
    lore:"Guardians carved before the spire fell. Their armor shrugs off blows, but rust and venom still find the seams.",
    sp:{every:4,name:"Rune Slam",kind:"heavy",x:2.5,tell:"its runes flaring white"},drops:[["rune_shard",.7],["golem_core",.3],["sentinel_aegis",.16]]},
  acolyte:{name:"Void Acolyte",plural:"Void Acolytes",zone:"spire",el:"shadow",hp:112,atk:22,def:4,weak:["holy","arcane"],resist:["shadow"],w:3,verb:"touches you",intro:"A Void Acolyte steps out of a seam in the air.",
    lore:"Scholars who read one page too many of what lies between the stars. They feed the emptiness in them with your warmth.",
    inf:{s:"curse",ch:0.4},
    sp:{every:3,name:"Soul Tithe",kind:"drain",x:1.4,tell:"opening its hollow hands"},drops:[["void_crystal",.7],["holy_water",.3],["void_robe",.16]]},
  archon:{name:"Starfallen Archon",short:"the Archon",zone:"spire",el:"swift",boss:true,hp:260,atk:25,def:9,weak:["stone"],resist:["swift","arcane"],verb:"strikes you with lightning",intro:"Lightning stitches the clouds shut. The Starfallen Archon unfolds above the spire.",
    lore:"A star that fell upward. Hurt enough, it stops being a storm and becomes the dark behind the storm.",
    inf:{s:"chill",ch:0.3},
    sp:{every:3,name:"Chain Lightning",kind:"multi",n:4,x:.65,tell:"crackling with stored lightning"},
    // generic boss twist: at `at` of max HP it loses a turn shifting form; `to` overrides element, weak, resist, special, inf and verb
    phase:{at:.5,label:"VOID FORM",msg:"The storm collapses inward. The Archon turns to the dark behind it!",
      to:{el:"shadow",weak:["holy","metal"],resist:["shadow","arcane"],inf:{s:"curse",ch:0.4},verb:"unmakes you",sp:{every:3,name:"Void Collapse",kind:"drain",x:1.5,tell:"folding the air around a black point"}}},
    drops:[["star_heart",1],["storm_feather",.8]]},
  mimic:{name:"Mimic",zone:"any",el:"metal",hp:40,atk:8,def:3,weak:["arcane"],resist:["metal"],verb:"bites you",intro:"The lid creaks open into a mouth. It's a Mimic!",
    lore:"A chest with teeth. It has learned that travellers cannot resist opening things.",
    sp:{every:2,name:"Chomp",kind:"heavy",x:2.3,tell:"opening its lid very wide"},drops:[]}
};
const AFFIXES=[["Burning","Fire"],["Frostbound","Ice"],["Venomous","Poison"],["Hallowed","Holy"],["Umbral","Shadow"],["Ironclad","Iron"],["Fleet","Swift"],["Arcane","Arcane"]];
const SECRETS=[
  {ids:["ess_Light","ess_Sweet","iron_helmet"],name:"Lantern Helm",hint:"A helmet that lights caves, though the bugs adore it. Distilled, not cooked."},
  {ids:["holy_water","iron_sword","phoenix"],name:"Dawnbringer",hint:"A sword reborn in sacred fire."},
  {ids:["bread","chili","honey"],name:"Hearthfire Loaf",hint:"Sweet, spicy, and baked for a long winter march."}
];
const TUTORIAL=[
  {text:"Win your first battle.",tab:"battle",done:s=>s.wins>=1,reward:{items:["bread"]}},
  {text:"Salvage a piece of loot into essence. Open Gear and tap an item.",tab:"gear",done:s=>s.stats.salvaged>=1,reward:{items:["spring_water"]}},
  {text:"Forge your sword with an essence in the Forge.",tab:"forge",done:s=>s.journal.length>=1,reward:{xp:20,items:["ess:Fire"]}},
  {text:"Use Study during a fight to learn something about an enemy.",tab:"battle",done:s=>s.stats.studied>=1,reward:{items:["ess:Sharp"]}},
  {text:"Equip a piece of armor or a shield.",tab:"gear",done:s=>["off","head","body","hands","feet"].some(k=>s.eq[k]&&s.items[s.eq[k]]&&FORMS[s.items[s.eq[k]].form].g==="armor"),reward:{camp:1}},
  {text:"Cross the Woods map and defeat Gnarlhorn at the end of it.",tab:"battle",done:s=>(s.kills.gnarlhorn||0)>=1,reward:{items:["ess:Swift","ess:Holy"],xp:30}},
  {text:"Infuse an essence into yourself in the Gear tab.",tab:"gear",done:s=>Object.keys(s.infuse||{}).length>0,reward:{camp:1,xp:20}}
];
const MAP_ROWS=7,INF_SLOTS=3,INF_COST=3,INF_MAX=3,CRIT_CAP=75,FREEZE_CAP=60;
// trait combat tunables: res = elemental defense from armor traits, ward = Runic, pierce = Arcane, shred = Tempered
const RES_PER=5,RES_CAP=40,RES_ALT={Fur:[["ice",1],["wood",1]],Insulated:[["ice",2.5]]},RES_MSG={ice:"Your fur-lined gear blunts the cold.",fire:"Your gear turns aside the heat.",poison:"Your gear keeps the venom at bay.",holy:"Your gear dulls the glare.",shadow:"Your gear holds the gloom back.",wood:"Your gear shrugs off the thorns.",metal:"Your gear turns the blades.",stone:"Your gear absorbs the crushing blows.",arcane:"Your gear scatters the stray magic.",swift:"Your gear slows the flurry."};
const ARC_PER=12,ARC_CAP=60,WARD_PER=4,WARD_CAP=40,THORN_PER=4,THORN_CAP=30,STONE_DR=.75,STONE_CAP=8,SHRED_PER=1.5,SHRED_CAP=6,ROOT_PER=1.5,ROOT_CAP=8,DODGE_PER=4,DODGE_CAP=25,MED_PER=.1,MED_CAP=.5,MED_REGEN=.5;
// statuses enemies inflict on you: el = resisting element (P.rs), t = turns; cures = traits on consumables that clear them
const STATUS={burn:{n:"Burn",el:"fire",t:3,tip:"damage each turn"},chill:{n:"Chill",el:"ice",t:3,tip:"no swift follow-ups, half dodge"},poison:{n:"Poison",el:"poison",t:4,tip:"stacking damage each turn"},curse:{n:"Curse",el:"shadow",t:4,tip:"healing you receive is halved"}};
const INF_MSG={burn:"You catch fire",chill:"A numbing chill sets in",poison:"Venom seeps into your blood",curse:"A curse withers you"};
const ELITE_INF={Fire:"burn",Ice:"chill",Poison:"poison",Shadow:"curse"},ELITE_INF_CH=.25,POISON_STACK=3,CLEANSE_PER=6,CLEANSE_CAP=50,PARRY_X=1.5,PARRY_FAIL=1.25;
// signature abilities by weapon form (+ shield): cd = turns before reuse, x = power vs a normal attack
const ABILITIES={
  blade:{name:"Flurry",icon:"flurry",cd:3,hits:2,x:.7,desc:"Two quick strikes at 0.7x each. Each can crit."},
  spear:{name:"Lunge",icon:"lunge",cd:3,x:1.2,pen:.7,open:.5,desc:"1.2x strike that ignores 70% of armor. A spear also jabs first at 0.5x when a battle starts."},
  staff:{name:"Channel",icon:"channel",cd:3,x:1.3,pen:.5,desc:"At least 1.3x a normal attack, more on Magic-heavy staffs. Ignores half of armor; the weapon's top element effect always lands."},
  lance:{name:"Charge",icon:"charge",cd:4,x:2,open:.25,desc:"2.0x heavy strike, but the enemy's reply hits you 25% harder."},
  spellblade:{name:"Arc Slash",icon:"arcslash",cd:3,x:1,desc:"About 1-1.3x a normal attack, scaling fully with Magic. A crit refunds 1 turn of cooldown."},
  warstaff:{name:"Sweep",icon:"sweep",cd:3,x:1,stun:.35,bossStun:.15,desc:"1.0x strike with a 35% chance to stun (15% on bosses). A stunned enemy loses its turn."},
  claws:{name:"Rend",icon:"rend",cd:3,x:.9,desc:"0.9x strike that opens a bleed: 20% of Attack per turn for 5 turns (ignores armor). Rending again before it ends adds a stack, up to 3, and refreshes it."},
  shield:{name:"Shield Bash",icon:"bash",cd:3,x:.6,int:.85,bossInt:.6,stun:.2,bossStun:.08,desc:"0.6x Attack plus your shield's defense. Cancels a telegraphed special (85%, 60% on bosses), otherwise 20% to stun (8% on bosses)."}
},BLEED_STACK=3,BLEED_PER=.2,BLEED_T=5;
const CURES={Medicine:["burn","chill","poison","curse"],Holy:["curse","poison"],Water:["burn","chill"],Nourishing:["poison"]};
const RARITY=[["Common","#b3aa9e"],["Uncommon","#88d7a1"],["Rare","#7cb6f2"],["Epic","#c39cf7"],["Mythic","#ff8a50"]];
const XP_LV=[0,60,160,320,560,900,1400,2100,3000,4200];
// smith level perks: level-up toast text (lvMsg) and what maxInputs, infSlots and traitSlots read
const LV_PERK={2:"Third crucible slot unlocked.",3:"Another trait slot, and you can appraise a forge.",5:"Another trait slot and steadier mixtures.",7:"Another trait slot and steadier mixtures.",8:"Fourth crucible slot unlocked.",9:"Fourth infusion slot unlocked.",10:"Master smith: an eighth trait slot."},INPUT_LV=[2,8],MIMIC_HP=[1,1.9,2.8,3.7],MIMIC_ATK=[1,1.6,2.1,2.6];
const STAT_NAMES={atk:"Attack",def:"Defense",mag:"Magic",heal:"Heal",spd:"Speed"};
const DECAY=[1,.5,.3,.2,.15,.1,.1,.1];
const ESS_VALUE=2.5;
const VIEWS=["battle","gear","forge","recipes","codex"];
// Heat: harder expeditions in a cleared zone, cumulative per level. Beating the boss at heat h unlocks h+1.
const HEAT_MAX=5,HEAT_T={hp:.15,elite:2,inf:1.5,affix:.2,boss:1.2,rest:.25,shrine:.5,loot:.15,ess:1,xp:20};
const HEAT=[
  {name:"Kindled",desc:"Enemies have +15% HP and Attack."},
  {name:"Smoldering",desc:"Elite nodes and random elites are twice as likely, and each map hides one extra elite."},
  {name:"Blazing",desc:"Enemy status effects land 1.5x as often, and random elemental elites turn up far more often."},
  {name:"Searing",desc:"Bosses use their special one turn sooner (at least every 2) and have +20% HP."},
  {name:"Inferno",desc:"Camps only offer rest, and it heals less (25%). Shrines heal half as much."}
];
// Rewards at heat h: +15% per level on drop rolls, +1 essence and 20 smith XP per level on a boss kill.
// Daily expedition: seeded by the UTC date; one attempt a day, one twist.
const DAILY_TWISTS={
  elites:{name:"Elites everywhere",desc:"Every fight is an elite."},
  cinder:{name:"Everything burns",desc:"Every enemy can set you alight (30%, doubled if it already burns), and burns hurt 50% more."},
  nocamp:{name:"No campfires",desc:"Camps become fights, and you can't rest at the fire."},
  double:{name:"Double loot, double damage",desc:"Enemies hit twice as hard. Every drop is doubled."}
};
const DAILY_REWARD={ess:3,xp:80};

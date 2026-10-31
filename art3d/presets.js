// ================= ART 3D: PRESET LOADOUTS =================
// Named loadouts for the viewer and evidence shots. Unknown ids are skipped with a warning.
(function(){
const P=H3.hero.presets;
P.base={};
P.wanderer={head:"hood",body:"tunic",back:"cape",feet:"boots",main:"iron_sword"};   // the 2D portrait's default look
P.adventurer={head:"hood",body:"tunic",back:{id:"cape",colors:{main:"#2f4a3e",fold:"#253b31",hem:"#1f3229"}},hands:"hide_gloves",feet:"boots",charm:"pendant",main:"iron_sword",off:"wood_shield"};   // every slot filled, with a recoloured cape
})();

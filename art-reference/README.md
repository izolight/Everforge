# Prismatic Adventure art references

Current direction: adapt the original Prismatic style to the 2D game. Preserve its proportions, expressive faces, layered costumes and palette; reduce fine detail at small display sizes. Modeling notes below record the original generation context.

The 3D prototype and simplified alternatives are preserved in [the archive](../archive/3d/README.md).


`prismatic-wanderer-female-v1.png` is the aspirational female character target for the next modeling pass, generated with the built-in imagegen tool. It is concept art, not a render of the current model.

Prompt direction: production character reference sheet in the Prismatic Adventure style; aligned front, side and back adult female A-pose turnarounds; face close-ups; sword and palette; smaller front/back clothing views without the cape. Sculptural copper hair, expressive green eyes, faceted teal tunic with gold compass embroidery, violet hood-down cape, indigo trousers, leather baldric, left shoulder guard, left belt pouch, gloves/bracers and practical boots. Neutral pale blue-gray studio background, clear construction and consistent proportions, no environment or action pose.

For modeling, use the large front view as costume authority. Generated views may differ in small strap, embroidery and accessory details; resolve those against the front view rather than treating the sheet as exact CAD geometry. Preserve the existing modular gear slots and shared animation rig when translating this target into geometry.

`prismatic-wanderer-male-v1.png` is the matching male target, generated with built-in imagegen using the female sheet as the visual reference.

Male prompt direction: preserve the female board's layout, costume construction and Prismatic Adventure rendering; create a distinct athletic adult male with broader shoulders, defined jaw, expressive green eyes and short swept copper hair. Same aligned front/side/back A-pose views, male face close-ups, sword/sheath, palette and smaller cape-free clothing views. Preserve left shoulder guard and left hip pouch, teal embroidered tunic, violet cape, leather equipment and practical boots. Neutral studio lighting and background; no action pose or scenery. Resolve small cross-view discrepancies against the large front view.

## Equipment sheets

Generated with built-in imagegen, matching the character sheets. These cover all 20 named equipment items in `BASE` in `js/data.js`, plus prototype clothing and a bracer detail. Consumables, materials, crafted form families and legendary recipe results are outside this equipment set.

| Sheet | Game item IDs | Additional prototype details |
| --- | --- | --- |
| `prismatic-weapons-shields-v1.png` | iron_sword, dagger, oak_staff, hunter_spear, wood_shield, sentinel_aegis | — |
| `prismatic-armor-clothing-v1.png` | leather_cap, iron_helmet, jerkin, stone_plate, void_robe | hood, tunic, cape |
| `prismatic-gloves-boots-v1.png` | hide_gloves, wraith_wraps, trail_boots, ember_treads, gale_boots | wanderer bracers |
| `prismatic-charms-v1.png` | sprite_lantern, fang_charm, witch_eye, glass_pendant | — |

Prompt set: four landscape production equipment boards, pale blue-gray background and controlled studio light; angular stylized 3D assets with broad faceted planes, teal/indigo cloth, warm leather, silver iron, antique gold and violet shadows. Each named item gets a large main view and a smaller reverse/side construction view. No characters, scenery or inventory UI. Weapon board emphasizes grips, crossguards, shield backs and straps. Armor board emphasizes wearable openings, closures, thickness and cape/tunic embroidery. Glove/boot board emphasizes wraps, finger openings, cuffs, straps, soles and distinct frost/ember/wind material identities. Charm board emphasizes mounting loops, bezels, glass thickness and small contained light sources. Exact item names supplied from game data.

Modeling notes: primary view is the design authority; alternate views may vary in small generated details. Stone Plate is illustrated with a polished metallic-looking surface: model it as gray stone plates per its game traits. Hood/tunic/cape sheet includes overlapping accessories for context; keep shoulder guard, belt, pouch and baldric modular rather than baking duplicates into each piece. Standardize object scale and mounting points against the character sheets before building meshes.

## Base anatomy

`prismatic-base-bodies-v1.png`: adult male and female front/side/back body reference in neutral athletic underwear, generated with built-in imagegen. Prompt direction: mature adult athletic bodies, approximately 7.5-head proportions, neutral A-pose, aligned orthographic turnarounds, bare feet, unobstructed neck/shoulders, copper hair (female tied up), charcoal shorts and female athletic top, subtle anatomical landmarks and joint guides, pale blue-gray studio board, nonsexual modeling reference.

Use this sheet for base proportions and gear clearance, and the clothed sheets for costume design. This is generated visual guidance, not anatomically measured geometry: verify joint placement, five-finger hands, orthographic consistency and rig proportions in 3D. Side-view arms are shown lowered for silhouette clarity rather than reproducing the front-view A-pose; derive rig rest positions from front/back and use side views for torso/limb depth. Keep separate body shape profiles on the same named skeleton, with gear fit derived from each profile's actual dimensions.

### Revised base bodies — use v2

`prismatic-base-bodies-v2.png` supersedes v1 for art direction and base clothing. Generated with built-in imagegen using the male and female clothed character sheets as explicit style/identity references. Prompt: preserve the original heroes' faces, copper hair, stylized proportions and angular painterly planes; show adult male/female front, side and back neutral turnarounds in medieval-fantasy ivory linen drawstring braies, plus a simple side-laced linen underbodice for the female. No modern sportswear, armor, weapons or accessories; retain pale blue-gray board and serif labels. This is the current base-body concept target. As with other sheets, validate anatomy and cross-view consistency during modeling, especially side-view arm positions and hair arrangement.


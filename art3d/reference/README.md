# Prismatic Adventure modeling reference

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

## Simplified direction exploration

Two matching boards generated with built-in imagegen:

- `prismatic-simplified-bases-v1.png`: male/female front, side and back base bodies in fantasy linen underclothes, using base-bodies-v2 as reference.
- `prismatic-simplified-heroes-v1.png`: same two characters in simplified modular adventuring outfits, using the simplified base sheet as reference.

Prompt set: preserve Prismatic colors and angular shapes while simplifying to approximately six-head adult stylization, broad torso/limb forms without sculpted muscle detail, 5–8 hair masses, single four-finger hand block plus thumb, minimal linen folds, neutral A-pose and orthographic turnarounds. Outfit board adds teal two-panel tunic, indigo trousers, one shoulder plate, diagonal baldric, belt/pouch, simple cuffed gloves/boots and a three-fold violet cape; compass and trim are painted decoration, not geometry. No dense embroidery, tiny buckles, filigree or scenery. Pale blue-gray board, restrained guides and serif labels. These are alternatives for review; no model changes have been made to adopt them. As before, side-view arms are lowered by the generator; use front/back for rig rest pose.

## Simplified equipment references

Built-in imagegen generated four matching simplified boards using `prismatic-simplified-heroes-v1.png` as the explicit style reference. These cover the same 20 named equipment items as the detailed set, plus the prototype hood/tunic/cape and a bracer detail:

- `prismatic-simple-weapons-v1.png`: Iron Sword, Bandit's Dagger, Oak Staff, Hunter's Spear, Wooden Shield, Sentinel's Aegis.
- `prismatic-simple-armor-v1.png`: Leather Cap, Iron Helmet, Bandit's Jerkin, Stone Plate, Voidweave Robe, Leather Hood, Wanderer Tunic, Wanderer Cape.
- `prismatic-simple-gloves-boots-v1.png`: Hide Gloves, Wraith Wraps, Trail Boots, Ember Treads, Galewing Boots, Wanderer Bracers.
- `prismatic-simple-charms-v1.png`: Sprite Lantern, Wolf Fang Charm, Witch's Eye, Glass Pendant.

Prompt set: pale blue-gray production boards with navy serif titles; broad clean low-poly planes, 3–4 shading bands, violet shadows, teal/indigo cloth, warm leather and gold. Each labeled item has a main view and smaller side/reverse construction view. Simplify to approximately 3–6 primary masses, thicken weapon grips and rims, use mitten gloves with separate thumbs, boots with one broad cuff/strap, robes/capes with only a few folds, charms with a single defining feature. Paint runes/compasses instead of modeling them; omit tiny stitching, filigree, micro-rivets, chains and dense layers. Clothing shown separately for modular assembly. No people, scenery or UI. Preserve item identity, prioritize modeling economy and readability at game scale.

Use these with the simplified hero/base sheets if adopting the simplified direction. The detailed boards remain available as design history. Derive actual dimensions and socket positions from the chosen 3D bodies rather than scaling independently from each illustration; small alternate-view differences remain generated concept approximations. No game models were changed by this reference generation task.

## Separate simplified base sheets

- `prismatic-simple-male-base-v1.png`
- `prismatic-simple-female-base-v1.png`

Generated with built-in imagegen, using the combined simplified bases as the explicit reference. Prompt set: one character per landscape sheet, large aligned front/left-side/back orthographic views, preserve adult identities and simplified six-head proportions, broad planar anatomy, chunky copper hair, mitten hands, neutral A-pose and medieval ivory linen underclothes, pale blue-gray background and sparse alignment guides. No equipment or modern sportswear. Requested identical A-pose across views; generated side views still approximate the arm pose, so validate shoulder/hand heights against front/back during modeling. These are visual references, not measured turnarounds. Three views suffice for initial modeling; resolve ambiguous volumes in 3D.

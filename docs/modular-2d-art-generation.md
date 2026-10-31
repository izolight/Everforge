# Modular 2D art generation checklist

## Direction and scope

Use the original [Prismatic references](../art-reference/README.md): expressive faces, fixed adult proportions, copper/teal/violet palette, angular painterly shading and layered fantasy clothing. Simplified references and the 3D experiment are archived.

Build reusable components, not named-item illustrations. Item identities are recipes combining shape, material, trim, ornament and effects. Hero identities combine face, hair and colors. Keep hero height, width, pose and attachment positions fixed. Male/female face presentations can share this body; separate fitted body silhouettes are outside this initial scope.

This is a production checklist, not a request to generate every asset at once. Counts below are proposed starter quantities, except where explicitly described as existing game coverage.

## Formats and views

| Deliverable | Format | Views / layout | Purpose |
| --- | --- | --- | --- |
| Style and design exploration | PNG, opaque neutral background | Clearly spaced contact sheet; front/side/back only when useful | Choose shapes and establish appearance; not loaded by the game |
| Hero master | Transparent RGBA PNG; proposed 1024 × 1536 canvas | One full-body, front-facing relaxed equipment pose, both hands visible and clear of torso | Registration template for every wearable and appearance layer |
| Hero face/hair layers | Transparent RGBA PNG on the same full hero canvas | Exactly the master view and position | Drop-in replacement without realigning |
| Worn gear components | Transparent RGBA PNG on the same full hero canvas | Exactly the master pose; front/back occlusion layers where necessary | Fit equipment to the shared body |
| Inventory/weapon components | Transparent RGBA PNG; proposed 1024 × 1024 assembly canvas | One consistent near-front display view; shared assembly positions within each family | Compose inventory icons and, where the angle matches, held weapons |
| Creature bodies | Transparent RGBA PNG; proposed 1024 × 1024 canvas | One approved view per body family | Shared battle and Codex source art |
| Creature attachments | Transparent RGBA PNG in the corresponding body coordinates | Match each compatible body's view | Attach at head, back, hand, flank or tail |
| Masks | Grayscale PNG, same dimensions and alignment as source layer | One file per independently recolorable region | Recolor materials, skin, eyes, hair, cloth and trim |
| Runtime images | Lossless WebP or PNG exported from approved masters | Same registration; trim only with recorded offsets | Optimize delivery without changing source artwork |
| Assembly definitions | JSON authored in code | Layer order, anchors, masks, compatibility, hidden parts, asset IDs | Reproduce hero/item/creature recipes |
| Small symbols and UI | Existing SVG, extended as necessary | Single clear view | Statuses, rarity frames, map markers and interface icons |

**Multiple angles:** do not request turnarounds for every production asset. The current game needs one hero view and one view per creature family. A three-angle hero reference can help settle a design, but only the approved gameplay view becomes fitted layers. Inventory and worn art may require two representations of the same component; these are different uses, not a full turnaround. No animation frame sheets are required for current coverage.

Proposed source dimensions must be checked with the first batch before bulk production. Use sRGB, clean alpha, consistent upper-left lighting, no text, watermark, background, floor, cast shadow from another part, or neighboring equipment baked into production layers. Save a separate shared ground shadow. Do not crop individual wearables tightly if that loses registration.

Generation produces artwork, not guaranteed production-ready layers or masks. Isolate parts, clean alpha, register them against the master, and author/validate masks after generation. Request one component or one tightly related family at a time; contact-sheet cells need extraction and alignment before use. Never treat an automatically traced SVG as an editable substitute for the painterly source.

## 1. Hero appearance kit

One shared body silhouette and pose. Do not vary height, width or limb proportions.

| Asset group | Starter target | Required layers / treatment |
| --- | --- | --- |
| Master body | 1 | Fully drawn beneath equipment; separate exposed skin from underclothes; no baked gear |
| Default clothing | 1 neutral outfit | Torso/sleeves, trousers, simple footwear; hide or replace beneath equipped pieces |
| Faces | 6 cohesive presets | Same skull boundary, eye line and neck join; varied features and masculine/feminine presentation within shared fit |
| Eyes | Eye-color mask per face | Recolor irises while preserving pupils, whites, highlights and eyelids |
| Hairstyles | 8 | Short, swept, curly, cropped, bob, long, braid, ponytail; separate front/back masses where they cross equipment |
| Helmet hair | Per hairstyle where needed | Hidden crown / shortened fringe variants, with explicit helmet rules |
| Facial hair | 4 optional styles | Stubble, moustache, short beard, fuller beard; fit masks for compatible faces |
| Face details | Small reusable set | Freckles and scars; face-specific placement where necessary |
| Colors | Palette definitions + masks | Skin, eyes and hair; preserve luminance/shading instead of tinting the whole image |
| Shadow | 1 | Separate from body and clothing |
| Map miniature | 1 compact template | Readable around 32–36 px; simplified color/gear cues, not a shrunken portrait |

Default neutral expressions first. Extra expressions are optional later. Hair/face combination compatibility must be explicit where hairlines, jaw shapes or beards do not fit.

## 2. Modular weapon and shield kit

Start with 3 visibly distinct variants for each major silhouette component and 2 for minor fittings. Reuse components across compatible forms. A single component can supply many colors/materials; do not generate every combination.

| Family | Components to generate | View / assembly requirements |
| --- | --- | --- |
| Blade / dagger / spellblade | Short, standard and broad blades; guards, grips, pommels; optional rune/gem inset | Common blade-root and handle anchors; dagger gets a genuinely short silhouette; spellblade can add magical fittings |
| Spear / lance | Spearheads, heavier lance heads, shaft sections, sockets, grips, butt caps | Common shaft axis; defined head/shaft connection and hand grip |
| Staff / warstaff | Shafts, forks/head frames, crystals/orbs, wraps, reinforced caps | Warstaff supports a heavier head and reinforcement |
| Claws | Short/long/curved blades, hand mounts, cuffs | Fingers and hand position remain clear; fitted left/right representations as needed |
| Shields | Round/kite/broad bodies, matching rims, bosses, emblems, optional spikes | Rim must match body silhouette; shield fits off-hand; separate hand/forearm occlusion where required |

Existing gameplay requires all seven weapon forms: blade, spear, staff, lance, spellblade, warstaff and claws. Weapons can occupy either hand, including dual wielding. Record the grip pivot and rotation for both hands. Reuse an inventory assembly on the hero only when its perspective works; otherwise generate a fitted counterpart. Mirroring is acceptable only when lighting, handedness and asymmetric details remain correct.

## 3. Modular armor and charm kit

| Family | Starter components | Worn representation |
| --- | --- | --- |
| Headgear | Soft cap/hood, open helmet, enclosed helmet; optional brow/nose/cheek guards, crest, trim | Registered to the head; front/back pieces; face and hair hiding rules |
| Body clothing | 3 torso shapes: tunic, fitted jerkin, long robe; sleeve and waist-panel options | Continuous coverage at shoulders/waist; shared belt and neck joins |
| Armor / bulwark | Chest panels, pauldrons, heavier bulwark plates, waist protection | Compatible with torso templates; thickness/coverage must fit the same body |
| Gloves | Wrap, leather glove, gauntlet bases; cuffs, plates, straps | Left/right fitted layers; preserve grip visibility |
| Boots | Soft, cuffed, armored bases; shin panels, straps, trim | Left/right fitted layers; hide default shoes and covered trouser sections |
| Charms | Pendant bodies, settings, fang/eye/crystal/light inserts, cord/chain | Small chest-mounted assembly; inventory view can show more detail |
| Cosmetic outfit parts | Cape rear, cape clasp/front, belt, pouch, baldric | Supporting parts from the reference outfit; currently not additional gameplay slots |

Start with 3 base silhouettes per family, then a small set of compatible trim/attachment choices. Each family needs an inventory representation and fitted hero representation where visible. Sleeves, collars, pauldrons, gloves and long robes need explicit overlap rules. Paint full underlying shapes; do not cut layers out of a finished dressed portrait with missing areas beneath overlaps.

## 4. Shared material, ornament and effect library

- [ ] Recolor masks: primary surface, secondary surface, trim, grip/strap, gem and emissive regions. Supply only regions relevant to that component.
- [ ] Material treatments: iron/steel, stone, wood, leather/fur, cloth, glass/crystal. Use material-specific highlights/texture overlays or alternate component art where necessary; color alone cannot convincingly turn cloth into metal.
- [ ] Broad palette sets: neutral metals, warm leather/wood, teal/indigo/violet cloth, skin/hair palettes, elemental accent colors.
- [ ] Decoration set: compass, runes, simple border, stitched border, rivets, gem setting; scaled for legibility.
- [ ] Wear set: clean, worn, cracked/rusted; compatibility masks prevent damage spilling outside a component.
- [ ] Effect families: fire, ice, water, steam, poison, holy/light, shadow, arcane, wind/swift, wood/nature, metal and stone. Share effects across related traits; no separate art for every numerical trait value.
- [ ] Affix coverage: retain all 19 existing affix behaviors/visual identifiers through reusable marks, overlays or code effects; do not generate 19 full copies of each creature or item.
- [ ] Rarity, material grade, selection, equipped state and status badges remain separate code/SVG overlays.

Masks and texture/effect layers must be authored against component boundaries. Some light/glow effects can remain procedural rather than becoming generated images.

## 5. Other inventory coverage

These are reusable families, not 40 separate named illustrations. The existing data has 60 base items, of which 20 are equipment; procedural items extend beyond that list.

| Family | Component / shape coverage | Format |
| --- | --- | --- |
| Raw finds | Hide/pelt, shroud, feather, dust, scrap, bough/twig, herb, coal, core, shard/crystal, tusk/fang, relic fragment | Transparent square icon masters; palette/material/effect variants |
| Refined materials | Leather, folded cloth, ingot, timber, stone, crystal | Shared templates with independently recolorable surfaces/details |
| Food | Bread/loaf, cake, pepper, honey container, mushroom; fallback food dish | Transparent icons with optional ingredients/glow details |
| Potions / elixirs | Several bottle silhouettes, stopper, liquid, label/charm | Separate liquid mask and optional effect layer |
| Essences | Shared vessel/crystal/mote template + family symbol | Reuse across traits and grades; code draws grade treatment |
| Other UI rewards/items | Scrolls, currency/research symbols, containers as used by the UI | Retain existing SVG initially; generate only if a larger illustrated version is needed |

Secret recipes use these same construction rules and optional ornament/effect parts. Dedicated unique illustrations are not a prerequisite.

## 6. Modular creatures

Keep the procedural creature system. Do not generate a separate image for every rolled enemy or every affix combination.

- [ ] Nine existing body families: beast, canine, feline, bear, reptile, undead, construct, elemental, humanoid.
- [ ] One fixed approved pose/view and anchor map per family. Quadrupeds may use a side/three-quarter view; humanoids can face forward. Attachments must match that family's perspective.
- [ ] Body masks for main color, underside/secondary surface, armor, eyes/glow and pattern placement.
- [ ] Existing 23 attachment types: horns, antlers, mane, spikes, armor, regeneration growth, crown, halo, wings, tail, flames, frost, crystals, vines, runes, hood, blade, axe, staff, chains, orbiting objects, shell and tusks.
- [ ] Fitted attachment variants by compatible family; a crown or wing pair is not automatically usable across every head/body.
- [ ] Pattern masks for spots, stripes, mottling and other currently used patterns; keep markings separate from facial features.
- [ ] Coverage for authored silhouettes that the nine generic bodies cannot reproduce: e.g. boar, mushroom sprite, wraith, imp, witch, phoenix and harpy. Build reusable family extensions rather than unique pieces per enemy ID.
- [ ] Boss size, ornaments, eyes and effects assembled from the kit where possible.
- [ ] Check every existing enemy definition (39 entries) and generated body/part combination against the kit. Existing bespoke portraits can remain as fallbacks during conversion.

Creature outputs are shared between battle and Codex. Inspect composites at approximately 76 px and 96 px, not only at source resolution.

## 7. Map and interface coverage

Keep existing SVG symbols initially. These do not block hero/equipment generation.

If terrain is restyled later, generate single-view transparent tile motifs for obstacle and water/hazard in the five authored regions (woods, pass, hollow, spire, fen) and eight Rift biomes (fen, ash, bone, deep, forest, tundra, ember, astral). Use proposed 256 × 256 masters; verify at 24–37 px. Floor textures are optional; any repeating texture must be seamless and subordinate to markers.

Retain readable symbols for fights/elites/bosses, treasure, shrine, peddler, mystery, camp, goals and navigation. Rarity frames, status chips, trait symbols and action icons remain SVG/code unless explicitly redesigned.

## First generation batches

1. **Lock the master:** one full-body hero master in the original style, plus a close-up of the approved face. Validate actual UI proportions and hand/gear clearance before extracting layers.
2. **Prove appearance swaps:** three face presets and three hairstyles, eye/hair/skin masks. Use the same body and canvas registration. Render several combinations.
3. **Prove a weapon kit:** three blade shapes, two guards, two grips, two pommels; metal/wood/crystal treatments. Assemble distinctly different weapons and test both hands.
4. **Prove clothing and occlusion:** tunic, robe and plate components; one glove, boot and helmet kit; a shield and charm. Test hair hiding, long hems, gloves gripping weapons and dual wielding.
5. **Expand equipment:** remaining forms and component variants only after assembly succeeds.
6. **Expand creatures and inventory:** reuse the established palette, lighting and materials.

## Current appearance proof

The first registered appearance kit and its preparation/preview workflow are in
[assets/hero/README.md](../assets/hero/README.md). It contains three faces and three
hairstyles on a fixed 1024 × 1536 canvas, separate body/underclothes layers,
skin/iris/hair masks, assembly metadata, and nine-combination review sheets.
The proof runs separately from the live SVG equipment renderer. Fitted equipment,
helmet hair, the full starter appearance counts and runtime migration remain
outstanding. The next generation batch is the modular blade kit (batch 3).

## Generation prompt contract

Every production request must include:

- Asset ID and exact component being produced.
- Approved style reference and relevant master pose/assembly reference.
- Required view, perspective, light direction and palette/material intent.
- Exact silhouette/connection/placement requirements; preserve all existing registration landmarks.
- What must be visible, separated or omitted; generate only requested components.
- Transparent background for usable layers; opaque neutral background only for design boards.
- Proposed canvas dimensions and padding, followed by measured alignment during preparation.

Example brief: “Create three alternative sword blade designs for the approved modular weapon kit, matching the original Prismatic painterly style. Blade only: no guard, grip, pommel, glow, text or background. Use the supplied blade template's view and blade-root position, consistent upper-left lighting, neutral steel surfaces, and clearly different silhouettes. Produce a design board first; export approved blades individually on transparent canvases during asset preparation.”

## Assembly and acceptance checklist

- [ ] Source PNGs retained; runtime exports are reproducible.
- [ ] Hero and gear alignment fixed against the approved master, with no body width/height variation.
- [ ] Alpha edges clean on light and dark backgrounds; no background-colored fringe.
- [ ] Metadata records anchors, layer order, visibility rules, allowed combinations, masks and inventory/worn representation mappings.
- [ ] Hero appearance and equipment recipes remain independent, deterministic and stable after save/reload.
- [ ] Missing assets have a usable fallback during migration.
- [ ] Contact sheets show variation across shapes AND materials, plus several heroes wearing the same outfit.
- [ ] Equipment checked at actual hero display size and roughly 64 px inventory size; map miniature checked around 32–36 px.
- [ ] Check representative combinations for clipping, disjointed lighting, mismatched seams and unreadable effects before generating more parts.

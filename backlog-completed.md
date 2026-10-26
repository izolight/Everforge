# Everforge — completed backlog

Completed task records and their implementation evidence. Test counts and simulator results below describe the revision at completion; they are not fresh verification of the current build. For open work and overall status, see [tasks.md](tasks.md).

## Monster coverage and tooling

- [x] **M-01 · Fill the missing body type in every biome** — `Status: Done` · `Size: S` · `js/monsters.js`
  Add `construct` to forest/fen, `undead` to tundra/astral/ash, `beast` to ember, `elemental` to bone, `humanoid` to deep.
  **Done:** all 8 `BIOMES` entries list 5 bodies; `node tools/map-check.js` and `node tools/smoke.js` pass; every body renders.

- [x] **M-02 · Remove the duplicate region name** — `Status: Done` · `Size: XS` · `js/monsters.js`
  `BIOMES.ash.n` ("The Cinder Wastes") duplicates a name in `BIOMES.ember.regions`. Rename one.
  **Done:** no duplicate across biome names and region-name lists.

- [x] **M-03 · Close authored element gaps** — `Status: Done` · `Size: M` · `js/data.js`, `js/art/`, `lang/`
  Woods lacked authored fire/poison/swift; Pass lacked arcane; Hollow lacked metal. Swap duplicates or add enemies, with art, drops, lore and translations.
  **Done (341e9bd):** the sim prints element coverage and exits 1 on a gap (seed 1: woods 5/5, pass 5/5, hollow 4/4, spire 4/4); `EL_EXCEPT` is empty; three new regulars (Kindle Fox, Cairn Seer, Anvil Crawler); `node tools/i18n-check.js` passes.

- [x] **M-04 · Add wild creatures and Rift masters to the simulator** — `Status: Done` · `Size: M` · `tools/sim.js`
  Add `--wild` (or include `w_*` automatically) and run all 40 wild creatures plus seeded Rift masters through normal/magic/rare and existing policies.
  **Done:** wild creatures appear in sim output; win rates reported per region/biome; README/sim docs updated.
  The regular tables hold the hand-made enemies only now (the `w_*` creatures have their own section, with native and forced rarity rows and a Δ against the regulars of the same zone); the Rift section rolls one seed per biome by default and shows the master with and without its affixes (the game gives bosses none). `--rarity` no longer includes `w_*`; `--wild` has their rarity rows. The forced `normal` row puts a wild creature back on its region band (its stored stats multiplied by its own rarity), so the forced rows compare like with like.

## Creature variety and readability

- [x] **V-01 · Expand biome part pools from 6 to 8–10** — `Status: Done` · `Size: S` · `js/monsters.js`
  6 parts give 41 distinct 1–3-part sets; 8 give 92, 10 give 175. Add thematic parts per biome.
  **Done:** every biome has 8+ parts; no duplicates; visual spot-check and `smoke` pass.
  **Done (V-01):** all 8 `BIOMES` pools hold 9 distinct parts (129 possible 1–3-part sets each); no pool pairs `hood` with `halo`; no new `tail`, `blade`, `axe`, `staff` or `tusks` were added.
  `node tools/part-check.js` renders every biome × body × part (360 renders, 0 problems), `node tools/map-check.js` passes, and the visual sheets (`node tools/parts-preview.js`, `node tools/parts-combos.js`) show the new parts on every body.
  `node tools/smoke.js` passes.
  **Note (seeded rosters):** M-01 and V-01 re-rolled every seeded wild creature and Rift region (the part loop draws a variable number of times). The M-04 numbers predate this; the seed-1 values in M-09 to M-12 are historical baselines; remeasure after subsequent generator changes.

- [x] **V-02 · Use the four orphan parts** — `Status: Done` · `Size: S` · `js/monsters.js` · `Depends: V-12`
  `blade`, `axe`, `staff`, `tusks` exist in `js/art/parts.js` but no wild pool uses them. Add them to appropriate biomes.
  **Done:** all four parts appear on generated creatures with sensible body gating.
  **Done (V-02):** data only. `tusks` added to forest, fen and tundra (beast); `blade` to ember and ash and astral (humanoid/construct); `axe` to ash and bone (humanoid/construct); `staff` to tundra, astral and deep (humanoid/construct). A headless check over 3,000 creatures per biome found each part on its allowed bodies only, no part drawing nothing, and no biome × body combo below 3 usable parts. `BODY_PARTS` and code unchanged.

- [x] **V-03 · More patterns per biome** — `Status: Done` · `Size: S` · `js/monsters.js`
  There are 9 patterns; each biome offers 4. Raise to 6–7 with thematic choices.
  **Done:** every biome has 6+ patterns; no biome uses all patterns identically.
  **Done (V-03):** PAT has 8 keys (not 9; `spots` was removed). Each of the 8 `BIOMES` lists now holds 6 distinct keys, all valid in PAT, and no two biomes share the same set. `node tools/sim.js --wild --seed 1` completes with exit 0.

- [x] **V-04 · Expand region-name pools** — `Status: Done` · `Size: XS` · `js/monsters.js`
  Increase each biome from 3 to 5–6 region names and avoid duplicates.
  **Done:** no duplicate names across all biomes; Rift name variety increases.
  **Done (V-04):** each of the 8 `BIOMES` lists now holds 6 region names (48 total, up from 24). No duplicates across biomes or with the 5 authored zone names in `js/data.js`, checked by a script outside the repo. `node tools/sim.js --wild --seed 1` completes with exit 0.

- [x] **V-12 · Make part pools body-aware** — `Status: Done` · `Size: S` · `js/monsters.js`, `js/art/`
  Add a body→allowed-parts table. Weapons on humanoid/construct, tusks/antlers on beasts, halo/wings on appropriate bodies. Also stop `tail` silently disappearing on bodies without a tail anchor.
  **Done:** every generated creature draws its intended part count; no missing-anchor no-ops. Headless verification is recorded below; screenshots were not taken for V-12.
  **Done (V-12):** `BODY_PARTS` in `js/monsters.js` lists the parts each body can wear (anchors from `js/art/bodies.js`); `genCreature` draws only from the biome's parts that its body allows, so `tail` is beast-only. A body with fewer than three usable parts draws what it can (no combo is short after the elemental list was widened). A headless check over 24,000 generated creatures (every biome × body) found no part without its anchor and no part outside the table; part counts are uniform over 1–3. Screenshots not taken.

- [x] **V-22 · Visual readability rules for enemies** — `Status: Done` · `Size: M` · `js/art/color.js`, `js/art/affixes.js`, `js/art/creature.js`, `js/monsters.js`, `js/data.js`, `js/render/battle-view.js`, `tools/color-check.js`
  One visual feature per meaning: body hue = element (`ELPAL` light/mid/dark, a creature rolls one), accent = biome (`BIOMES.acc`, two per biome, distinct between biomes), pattern and parts = biome variety, ring = rank, affix = fixed spot and shape, status = tint plus a fixed corner badge.
  Biome accents: forest `#b5b04a` `#6e8a3a`, tundra `#f4fbff` `#bfe0ea`, ember `#ff8a3d` `#ff5a1f`, astral `#f6d36b` `#fff3c4`, fen `#4d5a2a` `#2e3420`, ash `#4a4643` `#8a847c`, bone `#e4dccb` `#c9b48a`, deep `#3ff0ff` `#7fe8ff`.
  Affix spots: elemental affixes are one tattoo each on the flank or chest (fire flame, ice snowflake, poison skull-drop, holy sun, shadow crescent eye, arcane rune circle; about 30% of the body width, side by side for two (0.8 scale), a triangle for three (0.75 scale), in the element's light shade with a dark outline, a dark disc under them, and a soft glow ring that pulses behind each emblem (the emblem itself stays at full strength); `BODY` anchor `a.tt`); defence on the body (iron plates on the shoulders and upper back, ward hexagon, regen cross on the upper body, thorn spikes at the sides); aggression on the head (frenzy eyes and steam, vamp fangs and drip); on-death cracks (boom low on the body, split seam down the middle); movement behind or under (swift lines, swiftfoot dust at the feet, elusive afterimage).
  Statuses: stun (stars circle the head), weak (desaturated body, down-arrow badge; enemy weakness is `B.shred`, the armour break), bleed (red drops, drop badge), shield (solid bright ring; `B.wd`, the warded pool). Each status keeps its own badge slot in the bottom-right corner.
  **Tattoos and spots (later V-22 step):** body patterns are drawn at most at opacity .35 so they do not compete with the tattoos; the spots pattern is gone from `PAT` and from every biome and hand-made enemy (forest and fen now use bands and scales, the stag scales, the briarling stripes, the brimstone facets); the elemental particle marks are removed. `node tools/sim.js --wild --seed 1` gives the same numbers as before the change (the pattern lists change only which pattern a seeded creature rolls, not the random draws).
  **Done:** `node tools/color-check.js` passes (45 element pairs at dE 20 or more; 112 biome accent pairs at 10 or more; 701 generated and Rift creature accents plus the hand-made enemies at dE 25 or more). `node tools/run-checks.js` 14/14, including `affix-check` and `smoke`. `node tools/part-check.js` 360 renders, 0 problems. `node tools/parts-preview.js` and `parts-combos.js` render with no page errors. `node tools/sim.js --wild --seed 1` (wild rows) re-run: the seed-1 numbers are unchanged, see the note under M-12.
  **Deviations:** no water or steam element palette (neither is an enemy element; V-20 covers them). The shield status uses the enemy's ward pool, so a warded foe shows both the ward hexagon and the ring.

## UI

- [x] **U-02 · Keep the Forge result summary and action visible** — `Status: Done` · `Size: M` · `js/render/forge-view.js`, `css/styles.css`
  **Done:** Forge previews show a compact result name and useful stats, with detailed comparison, reactions and failure breakdown collapsed. Success odds and equipped-item fizzle warnings remain visible ahead of the enabled action. The workbench no longer traps content in its own scroll area. Browser checks cover known and new combinations, nonzero failure odds, blocked research requirements, equipped destruction warnings, and action visibility at 390×844, with reachability at 320px and overflow at desktop width. The action stays clear of mobile navigation at 390px.

- [x] **U-05 · Separate Inventory filters and explain empty results** — `Status: Done` · `Size: M` · `js/inventory.js`, `js/render/lists-view.js`, `js/events.js`, `js/state.js`
  **Done:** saved `inventory.gear` and `inventory.forge` objects each hold `category` and `filter`; shared layout and sort remain at the parent level. Forge defaults to Compatible, evaluates pattern slot fit and crucible action fit against available quantities, and omits Compatible during Refine. Choosing All explicitly reveals incompatible items with reasons. Empty filtered lists distinguish owned-but-filtered items from an empty bag and offer Clear filters. Legacy v18 `inventory.filter` and `S.tab` values initialize both contexts safely. Browser regressions cover cross-view preferences, pattern compatibility, empty recovery and legacy migration.

- [x] **U-03 · Use one contextual ingredient picker per Forge task** — `Status: Done` · `Size: L` · `js/render/forge-view.js`, `js/render/lists-view.js`, `js/events.js`, `js/crafting.js`, `css/styles.css`
  **Done:** Patterns and crucible actions now select ingredients from the same Forge Satchel, honoring available and reserved quantities and retaining slot removal and Fill. Forge offers compatible saved recipes and loads their matching action. Locked actions and their research requirements are grouped under a disclosure; Refine hides the unrelated Satchel and keeps its grade controls. Browser checks cover pattern compatibility, recipe loading, Infuse, Improve, Fuse, Cook, Brew, Alchemy, Refine, first-use locks and fully unlocked actions.

- [x] **U-04 · Make Inventory immediately accessible and readable** — `Status: Done` · `Size: M` · `index.html`, `js/render/lists-view.js`, `js/events.js`, `js/state.js`, `css/styles.css`
  Added an Inventory shortcut to the top of Gear and made named rows the fresh-save default. Rows show grade/type, stats or consumable effects, quantity, and equipped/locked/new state; grid mode remains available and saved grid choices survive load.
  **Done:** browser checks cover shortcut navigation, row content, locked state, two-slot equipment, German/Korean labels and 320/390/1200px widths. Existing category controls and salvage review remain in the Gear view. `node tools/usability-check.js`, `node tools/i18n-check.js`, and `npm test` (14/14) pass.

- [x] **U-08 · Explain crafting actions with consistent outcome language** — `Status: Done` · `Size: M` · `js/render/forge-view.js`, `js/render/gear-view.js`, `js/sheets.js`, `js/lang/`, `ui-terminology.md`
  Added short action captions and explicit Create gear, Modify gear and Process ingredients groups. Gear actions say Infuse gear and Improve gear; character-bound infusions are Personal Infusions. Recorded the terminology mapping, including Deconstruct/Salvage and Pattern/Blueprint/Recipe distinctions, in `ui-terminology.md`. German and Korean strings are translated; action IDs, mechanics, gates and save fields are unchanged.
  **Done:** `node tools/i18n-check.js`, `node tools/usability-check.js`, and `npm test` (14/14) pass. Playwright confirmed the group headings and no horizontal page overflow at 320, 390, 960 and 1200px.

- [x] **U-09 · Give item sheets a clear primary action** — `Status: Done` · `Size: M` · `js/sheets.js`, `css/styles.css`, `tools/usability-check.js` · `Depends: U-08`
  Item sheets place identity and comparison/effects before a prominent Equip or Use action. Two-slot weapons show the slot choice together. Crafting actions have their own group; lock, salvage/deconstruction and reforge live in a collapsed management area. Salvage's second-tap confirmation reopens that area automatically; formulas remain expandable.
  **Done:** visually inspected the 390×844 item sheet and populated Inventory, plus the 1200px Forge selector. Browser checks cover two-slot actions, management access, lock handling, bulk salvage review, Escape and focus behavior; `node tools/usability-check.js` and `npm test` (14/14) pass.

- [x] **U-01 · Grade pips and rarity frames** — `Status: Done` · `Size: S` · `js/art/items.js`, `js/helpers.js`, `js/render/`, `js/gear.js`, `js/hero.js`, `css/styles.css`, `js/lang/`
  Every essence and basic material shows its grade as five pips in the art (filled = grade; Plain is 3 and has no grade field, so `itemGrade` in `helpers.js` reads it as 3). The grade colour (new metal ramp: Faint, Lesser, Plain, Greater, Pure) is on the pips only; Pure's pips glow (off under reduced motion). The frame and stripe are rarity's, the name takes the rarity colour, and the grade ring and grade frame are gone. Removed the Roman-numeral grade badges in the satchel list and the forge tiles. Gear's grade row reads "Greater (4/5)" with `×1.4`; item lines read the same. Hero trim is rarity's (gear is never graded). Satchel help now says the pips show the grade (en, de, ko).
  **Done:** `node tools/i18n-check.js` and `node tools/run-checks.js` pass (13/13). Rendered each grade of `ess_Fire` and `golem_core` to SVG and a screenshot sheet: 1 to 5 pips read clearly on the satchel tile.

## Crafting rework

- [x] **C-01 · Data: techniques, salvage skill, denser maps, save v18** — `Status: Done` · `Size: L` · `js/data.js`, `js/state.js`, `js/crafting.js`
  The Binding, Layering, Compounding, Tempering and Alloying techniques are gone. A new game can only salvage (Salvaging levels output quality). Gear, forge-action and kitchen techniques replace them (`TECHS`, 25 nodes).
  **Done:** save v18; `POI_N` fights 10–13 and elites 2–3; `DENSITY_RW` and `SPAWN_NEW` in `data.js`.

- [x] **C-02 · Gating: `actionOk`** — `Status: Done` · `Size: M` · `js/research.js`
  `craftMiss` became `actionOk(items)`: patterns, blueprints, Recipes and the Gear-tab buttons check slot and kitchen techniques.

- [x] **C-03 · Crucible actions** — `Status: Done` · `Size: L` · `js/render/forge-view.js`
  Action tabs (Forge, Infuse, Improve, Fuse, Refine, plus Cook, Brew and Alchemy when known), a slot layout per action, bench filtering, and a locked tab that names its technique.

- [x] **C-04 · Input effects** — `Status: Done` · `Size: M` · `js/crafting.js`, `js/render/forge-view.js`
  `combine()` tracks a source per trait; the crucible shows the header, before and after, reactions and the risk breakdown.

- [x] **C-05 · Research view** — `Status: Done` · `Size: M` · `js/research.js`
  Branch columns (Gear, Forge actions, Kitchen) replace the fixed 4x4 grid. Intro cards for each technique.

- [x] **C-06 · Density** — `Status: Done` · `Size: M` · `js/data.js`, `js/map.js`, `js/battle.js`, `js/economy.js`
  Map fights pay `DENSITY_RW` (0.65) of the old embers and drop chance; bosses and mimics do not. Spawns favour unmastered kinds (`SPAWN_NEW`). The map grid is unchanged (no fights were dropped by placement). The roamer cap was not added: the sim showed no need (see `todo.md`).
  **Done:** `node tools/map-check.js` and `node tools/unlock-check.js` pass with the new counts. Sim (`--econ-only`, seed 7, 30 expeditions): embers within about 10% of the old values in every zone, materials within 10%.

- [x] **C-07 · Sim and tuning** — `Status: Done` · `Size: M` · `tools/sim.js`
  `--fresh` reports RP per expedition (fights included), and for each technique the first expedition its cumulative RP covers it with its prerequisites at the real cost (group discount and free pick). Tuning: Weaponcraft and Armorcraft 14, Infusing 8, so the first slot technique is affordable from expedition 2 or 3 (four seeds) and Infusing from expedition 2 to 5.

- [x] **C-08 · Text and docs** — `Status: Done` · `Size: S` · `js/lang/`, `README.md`, `todo.md`
  German and Korean entries for every new string (`node tools/i18n-check.js`). README describes the path: salvage, research, slot techniques, then Infuse, Improve, Fuse and Refine.


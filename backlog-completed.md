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

- [x] **M-09 · Rebalance affixed foes and staff kits** — `Status: Done` · `Size: M` · `js/data.js`, `js/affix.js`, `js/map.js`, `js/battle.js`, `js/monsters.js`, `tools/sim.js`, docs
  Refreshed the post-crafting baseline at `4b0ef66` (`--rarity --seed 1 --n 100`). Staff/pass rare at Heat 3 won 85%; staff/hollow magic/rare were 81%/56% and flagged `RARE_HARD`. Crafting now provides Iron Helmet and Stone Plate by Hollow, but the old Hollow Staff sim kit still used Leather Cap and Jerkin. Repaired it to `iron_helmet shroud` and `stone_plate shroud ess:Arcane`, retaining its Arcane staff build. Final tuning: rare HP 1.45x; Regenerating heals 3% per turn generally and 0.5% for rare foes at Heat 5+; self-healing authored species cannot roll Vampiric, Regenerating or Warded; regular rare foes gain their third affix at Heat 6. Wild roster pools and seeded draws remain unchanged.
  **Done:** final runs on revision `4b0ef66` plus M-09 changes: `--rarity --seed 7 --n 100` and `--rarity --seed 11 --n 100`, smart policy, nine stage kits, magic/rare at Heat 0/3/5. The weakest stage-kit magic/rare wins were 99% at Heat 0 and 88% at Heat 3 across the two seeds. Staff/pass rare at Heat 3 was 88% on both seeds; staff/hollow rare was 90% on both. Each run had 2 `RARE_HARD` rows, both starter/M-10, and no `SLOG`; kits had zero warnings. `defensive/woods` basic/rare at Heat 5 averaged 28.9 turns (seed 7) and 28.8 (seed 11), below the 30-turn SLOG limit.
  `tools/sim.js` shares the game affix-pool helper; `--rarity` excludes wild creatures through M-04. The affix check covers 4,000 healer rolls and verifies the Heat 5 rare regeneration amount and UI value. Validation passed: affix-check (`ALL OK`), smoke (`SMOKE OK`), i18n (`I18N CHECK OK`), unlock (`UNLOCK CHECK OK`) and `--econ-only --seed 7` (completed). The `--elite --seed 7` matrix had no SLOG and no additional TOO_HARD cells, but TOO_EASY counts rose from baseline 62→65 ARRIVAL and 272→285 ON-STAGE. Full logs are scratch files under `/tmp/m09/`; this summary records the durable measurements.

- [x] **M-10 · Tune the starter kit against magic/rare enemies** — `Status: Done` · `Size: S` · `tools/sim.js`, README/todo
  **Decision:** the tutorial-prepared Fire-infused sword and Weaponcraft are required progression before exploring. No raw starter-stat buff. `--fresh` now creates that prepared kit but keeps unlock gates active.
  **Baseline:** revision `f01d69c`, bare iron sword, smart policy, Heat 0, six Woods expeditions: seeds 1/7/11 won 0/6, 0/6 and 1/6.
  **Final:** tutorial Fire sword + Weaponcraft, smart policy, Heat 0, six expeditions: seeds 1/7/11 each won 6/6. Research RP per expedition was 17, 7, 3, 6, 3, 3 (mean 6.5) on seed 1. Kit is `starter/start`; the tutorial sword is crafted by the sim from its configured Fire recipe.
  **Rarity check:** `--rarity --kit starter --policy smart --seed 1 --n 100`, Heat 0/3/5: magic wins 99/91/72%; rare wins 96/79/58%. One Heat 3 rare row remains `RARE_HARD` (79%); the opening target is met at Heat 0 and the remaining boundary is explicit. No `SLOG` was reported.
  **Validation:** fresh runs used explicit seeds 1, 7, 11 on code based on `f01d69c`; `tools/smoke.js` (`SMOKE OK`), `tools/i18n-check.js` (`I18N CHECK OK`) and `tools/unlock-check.js` (`UNLOCK CHECK OK`) passed. `git diff --check` passed.

- [x] **M-08 · Add non-affix sources for Steam essence** — `Status: Done` · `js/encounters.js`
  The optional Cursed Altar now includes Steam in its five-result rotation. The small offering returns one essence for 1 HP; the larger offering returns three consecutive results for its existing HP cost. No reward slot, generic essence-pool entry, or random draw was added. This keeps the change localized and leaves the generic reward mix and seed stream intact.
  **Validation:** `node tools/steam-source-check.js` deterministically exercises the small offering and confirms exactly one Steam essence is granted. `node tools/smoke.js` (`SMOKE OK`) and `node tools/unlock-check.js` (`UNLOCK CHECK OK`) pass. Same-settings economy sims on revision `ddb9730` and after the altar change (`--econ-only --seed 7 --exped 30`, smart, Heat 0) matched exactly in all four regions, including direct/salvage essence, embers, drops, route metrics and shop price ranges; see [durable comparison](economy-evidence/m08-seed7-comparison.json) and [validation notes](economy-evidence/README.md).

## Rift difficulty

- [x] **M-11 · Fix the Rift master's affixes and stat band** — `Status: Done` · `js/battle.js`, `js/affix.js`, `js/monsters.js`, `tools/sim.js`, `tools/rift-boss-check.js`
  Generated Rift masters now apply their stored rare rarity and three compatible affixes exactly once in native combat; authored bosses keep their authored path. The 4.4× HP / 1.0× attack depth-1 profile tapers to 3.2× HP / 0.95× attack by depth 3, atop the region's own tier growth. Rift master rolls exclude Warded, Regenerating and Volatile, and avoid Frenzied with multi-hit/heavy specials. Native and forced rare use the same master roll and deterministic stream; forced magic remains a separate what-if.
  **Validation:** on revision `6f803be` plus the uncommitted M-11/V-14 working tree, `node -r /tmp/noFonts.js tools/sim.js --wild --enemy rift_boss --kit spire --policy smart --seed 1 --n 100 --rift-depth 1,3 --no-econ` ran 100 fights per cell for all four `/spire` kits, all eight deterministic biome seeds, Heat 0 and depths 1/3. Depth 1: 99.7% overall; kit means melee 100%, defensive 98.9%, staff 99.8%, stacked 100%; biome means deep 97.5%, fen 100%, astral 100%, forest 100%, ember 99.8%, tundra 100%, bone 100%, ash 100%. There were zero master `TOO_EASY`/`TOO_HARD` rows and three `SLOG` rows. Depth 3: 96.5% overall (deep 89%, ash 92.8%, other biomes 97.5–100%); defensive mean 90.9%, with three `SLOG` rows. Native and forced rare win/turn/HP results matched in all 64 master rows. `node tools/rift-boss-check.js`, `node tools/affix-check.js` (`ALL OK`) and `git diff --check` passed. Limitation: results use one explicit simulator seed and 100 fights per cell rather than a multi-seed sensitivity sweep.

## Creature art and readability

- [x] **A-01 · Give animal species distinct silhouettes** — `Status: Done` · `js/art/bodies.js`, `js/art/parts.js`, `js/data.js`, `js/monsters.js`
  Added canine, feline, bulky bear and low reptile silhouettes; mapped Kindle Fox, Astral Lynx, Rimehide Bear and Magma Salamander to them while retaining the boar. Added body anchors, compatible parts and head-part conflict gating. Authored combat attributes were not changed. Visual evidence: [creature families at battle and Codex sizes](art-evidence/creature-size-review.png). `part-check` (530 renders) and `color-check` (701 accents) passed.

- [x] **A-02 · Improve named item and equipment art** — `Status: Done` · `js/art/items.js`, `js/hero.js`
  Added distinct dagger, Voidweave Robe, Sprite Lantern, Witch Eye and Fang Charm glyphs, with matching equipped hero forms. The dagger and sword remain distinct at inventory scale. Evidence: [item and equipped hero review](art-evidence/item-size-review.png). `hero-check` passed for mobile equipment and weapon forms.

- [x] **A-03 · Add biome-specific Rift terrain motifs** — `Status: Done` · `js/art/map.js`
  Added saved-biome and saved-palette floor ambience plus obstacle and water motifs for all eight existing Rift biomes, without changing collision or map generation. Evidence: [tile motifs](art-evidence/rift-tile-review.png) and [seeded mobile Rift maps](art-evidence/rift-map-review.png). `map-check` passed for 240 seeded maps and map independence.

- [x] **A-04 · Make generated names match creature anatomy** — `Status: Done` · `js/monsters.js`, `tools/name-check.js`
  Added anatomy nouns for the new body families and deterministic body-aware generated names. The new check covers 144 forced biome/body samples with no failures. Since body pools, compatible names and attachment selection change seeded rosters, ran and archived `node tools/sim.js --wild --seed 1 --n 1 --rift-seeds 1 --rift-depth 1 --no-econ`; it covered 10 creatures in each authored region and one Rift depth/biome with zero kit warnings. The one-fight sample's flagged rows are smoke output, not a balance estimate; see [compact seeded sim summary](art-evidence/a04-seed1-sim-summary.json).

- [x] **A-05 · Review creature readability at actual UI sizes** — `Status: Done` · `js/art/`, `js/monsters.js`, `js/data.js`
  Reviewed normal and rare-framed families at 76px battle and 96px Codex sizes, including affix treatment and crowded status icons. Mutually exclusive major head shapes prevent stacked hood/horn/crown/halo combinations; adjusted bear-part selection and normalized 15 authored part opacity values above the 0.35 cap. Evidence: [creature size review](art-evidence/creature-size-review.png). `part-check`, `color-check`, `affix-check` and `name-check` passed.

  Art acceptance evidence and commands are indexed in [art-evidence/README.md](art-evidence/README.md).

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

## Biome gameplay and combat foundations

- [x] **V-14 · Add new enemy special kinds** — `Status: Done` · `Size: M` · `js/battle.js`, `js/data.js`, `js/render/battle-view.js`, `js/sheets.js`, `js/lang/`
  Five authored regular enemies now demonstrate the new kinds: Stone Golem guard, Woods Bandit guaranteed inflict, Rimehide Bear enrage, Mossback Stag burrow and Storm Harpy summon. Rules are explicit: guard absorbs 20% of max HP and lasts for two player actions; refreshing restores the cap, never stacks, and its pool is separate from affix ward. Inflict status applies only on a landed hit, is blocked by Guard and interrupted by a successful Parry; resistance shortens its duration rather than preventing the guaranteed effect. Enrage triggers once below half HP and permanently raises Attack 30%. Burrow avoids one full player action and surfaces before its next enemy action. Summon is a single 0.65× hit from the weaker Squall Spirit; no second combatant persists. Generated Rift specials and draw counts remain unchanged, and the Boar's opening charge is preserved for the Parry tutorial.
  **Validation:** `special-check.js` exercises each rule and Codex entry; five 390×844 intent captures are in [combat evidence](combat-evidence/v14-specials.md). `i18n-check.js`, `guard-check.js`, `unlock-check.js`, `smoke.js`, `sim.js` and the full `run-checks.js` suite cover the affected localization, combat, tutorial, game-flow and simulator paths.

- [x] **V-15 · Add biome modifiers to the map** — `js/map.js`, `js/battle.js`, `js/data.js`, `js/monsters.js`, `js/render/battle-view.js`, `js/sheets.js`, `js/lang/`
  **Done:** the eight seeded Rift biomes now select seven named passives and one neutral forest biome. Battle HUD and Codex expose the passive. Status modifiers merge with daily/status effects by taking the longer duration and stronger damage, while Poison obeys its existing stack cap; resistance shortens guaranteed status, Guard blocks statuses and Parry interrupts telegraphed specials. Cinder's daily twist strengthens the merged Burn once. Astral surges, Ash's every-third-turn strike penalty, Bone's recoverable fear, and Deep's pressure pulse use fixed turn cadence; Deep pressure still resolves after Stun and bypasses Guard/Parry.
  **Validation:** `node tools/biome-check.js` passes all seven passives, the neutral eighth biome, status/Guard/Parry and daily stacking behavior, save migration, seeded descent, HUD/Codex and mobile viewport checks. `node tools/map-check.js` passes 240 seeds and its persistence/touch/route checks. `node tools/run-checks.js` reports 22/22 passed; `node tools/i18n-check.js` and `git diff --check` pass.
  **Paired simulation evidence:** HEAD `2c9b1a0`, uncommitted M-12 review candidate, smart policy, Heat 0, seed 1, four `*/spire` kits, 100 fights per cell at Rift depths 1 and 3. Live command: `node tools/sim.js --wild --n 100 --seed 1 --heat 0 --policy smart --rift-seeds 1,7 --rift-depth 1,3 --jobs 2`; reference used the same command plus `--no-biome-mods`. Simulator labels 1/7 map to deep/ember seeds 3608050713/3641605951. Across four kits and two depths, native Rift-master mean wins were deep 83.5% live vs 93.3% reference, ember 95.2% vs 98.8%. Deep pressure is the largest measured difficulty change: defensive/spire wins were 55% vs 91% at depth 1 and 27% vs 64% at depth 3. The pair samples two of seven modifier biomes; `biome-check` exercises all seven, but this is not a complete balance sweep.

  **All-biome paired impact sample:** the automatic seeded Rift fixture set covered all eight biomes at depth 1; both runs used `--wild --n 25 --seed 1 --heat 0 --policy smart --rift-depth 1 --rift-wild --jobs 4`, with `--no-biome-mods` added for the reference. On HEAD `2c9b1a0` plus the uncommitted M-12 review candidate, native Rift-master rows averaged 97.5% wins live vs 99.9% reference (32 cells, 25 fights each); native Rift-wild rows averaged 99.7% vs 99.8% (320 cells, 25 fights each). This one-seed/depth sample is impact evidence, not a balance sweep. Exact JSON and console logs are in [V-15 evidence](rift-evidence/v15-biome-modifiers.md); the full suite output is [archived](rift-evidence/v15-full-checks.log). The M-12 candidate remains unaccepted and In Progress.

## UI

- [x] **U-06 · Open Codex on searchable creature knowledge** — `Status: Done` · `Size: M` · `Priority: High` · `index.html`, `js/render/lists-view.js`, `js/events.js`, `js/sheets.js`, `css/styles.css`
  Guide precedes the creature list and occupied about 2,230px when all introductions were unlocked. Give Codex explicit Creatures, Guide, Affixes and Records sections, opening on Creatures for a first visit. Place How to play within Guide. Add creature-name search, region selection and discovered/mastered filters. Show names and knowledge progress for discovered creatures; summarize unknown entries per region instead of rendering a long wall of silhouettes.
  **Acceptance:** the initial Codex viewport contains creature browsing controls and discovered entries, or an actionable first-encounter empty state. Search and filters combine predictably and provide resettable no-match results. Selecting a creature opens its existing knowledge page. Unknown names/facts remain concealed; creature, mastery and affix totals remain accurate. Guide introductions, Show me links, unlock requirements, How to play and lifetime stats remain reachable. Verify fresh, partially discovered and fully unlocked states.

- [x] **U-07 · Bound Codex card sizes on desktop** — `Status: Done` · `Size: S` · `Priority: Medium` · `css/styles.css`, `js/render/lists-view.js` · `Depends: U-06`
  The creature grid stays four columns wide with square tiles, so widening the page enlarges portraits instead of improving scan density. The review fixture's creature section grew from roughly 1,943px on mobile to 3,927px on desktop. Use bounded card sizes and additional columns, or a compact list beside a detail pane, within U-06's creature browser.
  **Acceptance:** at 1200px width the same creature results show at least as many entries per viewport as at 390px; desktop space does not merely enlarge four portraits. Names, region and knowledge state remain legible at actual card sizes. Verify 320px, 390px, 960px and 1200px widths with no horizontal page overflow and usable keyboard focus. Coordinate with A-05's creature readability pass.


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

## World and roster expansion

- [x] **M-06 · Promote Fen to a full region** — `Status: Done` · `js/data.js`, `js/monsters.js`, `js/state.js`, `js/events.js`, `js/art/map.js`, `css/styles.css`, `js/music.js`, `js/lang/`, `tools/fen-region-check.js`, `tools/sim.js`
  Added Fen after Spire with its unlock gate, six authored regular enemies and the Fen Matriarch boss, region palette/music, quest intro, translations, and Fen/Rift-aware save migration. The new enemies are authored rather than generated and use supported combat elements. Save shape and `everforge-v18` key are unchanged.
  **Validation:** the focused browser regression exercises Fen intro, boss victory and Rift unlock, then reloads a saved Rift run and verifies Fen/Rift Codex discoveries, wins, journal, depth and seed survive. `node tools/fen-region-check.js`, `node tools/smoke.js` (SMOKE OK), `node tools/map-check.js`, `node tools/audio-check.js`, `node tools/i18n-check.js`, syntax checks and `git diff --check` pass. The seed-1, Heat 0, smart-policy Spire-arrival sample ran 20 fights for each of six Fen regulars and the boss; all rows won 100%, with no TOO_HARD/SLOG flags. Reedstalker, Mire Witch and Murk Wisp each had a `TOO_EASY` flag in this sample; the result is recorded without obscuring it in [Fen simulator evidence](region-evidence/m06-fen-sim-seed1.json) and [console output](region-evidence/m06-fen-sim-seed1.txt). The full suite was not rerun after the parent’s V-14 assertion-only fix; its focused rerun passed.

- [x] **M-07 · Boss coverage for missing elements** — `Status: Done` · `js/data.js`, `js/lang/de-data.js`, `js/lang/ko-data.js`, `tools/boss-element-check.js` · `Depends: M-06`
  **Done:** Covered the six tracked missing elements with playable boss forms: Poison on the Fen Matriarch's first form; Stone on Gnarlhorn's phase; Shadow on Rimeclaw's phase; Holy on Phoenix's phase; Arcane on Archon's phase; and Metal on the Matriarch's phase. The Archon phase changed from Shadow to Arcane, with Shadow still available in Rimeclaw's real phase. All second forms set their own affinity, weaknesses/resistances, special and translated tell. The generic phase/Codex/save path is reused; unlock progression, save shape and seeded generation remain unchanged.
  **Validation:** focused browser coverage crosses each actual half-health turn transition, verifies form data and Codex learning, then reloads a saved second form. Fen victory/unlock/save regression and `node tools/i18n-check.js` pass. Seed-1, Heat 0, Smart, 20 fights per regional boss-stage cell all won 20/20; Gnarlhorn, Rimeclaw and Archon carry `TOO_EASY` flags on-stage. See [M-07 implementation and results](rift-evidence/m07-boss-elements.md), [raw simulation JSON](rift-evidence/m07-gnarlhorn-seed1.json), [Rimeclaw](rift-evidence/m07-rimeclaw-seed1.json), [Phoenix](rift-evidence/m07-phoenix-seed1.json), [Archon](rift-evidence/m07-archon-seed1.json), [Fen Matriarch](rift-evidence/m07-fen_matriarch-seed1.json), and [mobile phase rendering](rift-evidence/m07-boss-phase-mobile.png). The concurrent V-05 ninth biome is now covered by dynamic-count Rift regression checks; the integrated full suite passed 30/30.

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

## Monster coverage, balance and progression

- [x] **M-12 · Give the wild creatures a fight of their own** — `Status: Done` · `Size: M` · `js/monsters.js`, `js/battle.js`, `tools/sim.js`
  Restored generated nonboss foes to their rarity-normalized region tier and added a deterministic combat-only profile at the matching stage-kit Smith level: Woods HP 4.5×; Pass, Hollow, and Spire HP 2×; ATK unchanged. Smith Lv 1 tutorial fights remain at 1×. The band excludes Rift creatures and bosses, leaves seeded roster generation/RNG and drops unchanged, and preserves the M-11 master profile.
  **Validation:** modifier-free Heat 0, smart-policy samples with 100 fights per creature for seeds 1 and 7 show positive turn deltas and negative HP deltas for all 32 region/stage-kit native rows. All stage-kit native rows win 100% except staff/Spire (98% and 97%); the largest native `TOO_EASY` roster share is 1/10 in Pass stacked. Fresh six-expedition runs win 6/6 for seeds 1 and 7; seed 11 wins 5/6, with M-12 inactive at Smith Lv 1. A 30-expedition seed-1 economy comparison keeps 30/30 clears and 0 losses in each region; economy sources, prices, reward quantities, and drop pools are unchanged, while observed RNG-dependent loot totals vary slightly. The M-12 review, command lines, per-seed simulation JSON, and opening logs are in [balance evidence](balance-evidence/m12-review.md).
  `node tools/rift-boss-check.js`, `node tools/v14-special-check.js`, `node tools/special-check.js`, JS syntax checks, and `git diff --check` pass. Rift wild difficulty remains outside M-12's authored-region acceptance scope.

## Rift depth modifiers

- [x] **V-21 · Seeded Rift depth modifiers** — `Status: Done` · `Size: M` · `js/data.js`, `js/battle.js`, `js/render/battle-view.js`, `js/sheets.js`, `js/lang/de.js`, `js/lang/ko.js`, `tools/sim.js`
  Rift seed and depth choose one of three deterministic combat effects without changing generation draws or save shape. The modifier is visible in the battle HUD, Rift card, and Codex. `--no-depth-mods` provides an independent simulator reference path and does not disable V-15 biome passives.
  **Done:** `node tools/depth-check.js`, `node tools/biome-check.js`, `node tools/i18n-check.js`, and `node tools/run-checks.js` pass (23/23). Paired modifier-on/off simulator settings, results, screenshots, and the M-12 candidate state at the time of sampling are in [V-21 evidence](rift-evidence/v21-depth-modifiers.md). M-12 was later accepted; see [M-12 balance evidence](balance-evidence/m12-review.md).


## Biome special pools

- [x] **V-11 · Add per-biome special pools** — `Status: Done` · `js/monsters.js`, `js/lang/de.js`, `js/lang/ko.js`, `tools/biome-special-check.js`
  Each of eight biomes supplies three signature specials to ordinary wild creatures; missing keys and generated Rift masters use `GEN_SP`. The selection retains one RNG draw and preserves all other roster fields. German/Korean names and tells are included.
  **Validation:** full suite passed 24/24; the updated authored-roster assertion and i18n check also passed parent review. Paired seed-1/7 n=30, Heat 0, smart-policy reference samples at depths 1–3 preserve Rift-master results exactly. Live biome/depth integration and all measured effects are documented in [V-11 evidence](rift-evidence/v11-biome-specials.md).

## Rift identities and regional alphas

- [x] **M-05 · Give each Rift-only biome a signature identity** — `Status: Done` · `js/monsters.js`, `tools/rift-identity-check.js`
  Fen, ash, bone and deep favor distinct elements and existing drops and have signature hit statuses, retaining V-11 special pools. Paired simulator seeds 1/7 cover depths 1/3/9. Focused identity/alpha/i18n checks and the combined full suite (26/26) pass. Fen/ash master win rates decline in the sample; depth 9 remains difficult. See [implementation and measured limitations](rift-evidence/m05-identity.md).

- [x] **V-16 · Add one alpha wild creature per roster** — `Status: Done` · `js/monsters.js`, map/battle art, `tools/alpha-check.js`
  One existing entry in each authored region becomes a named, boosted rare alpha with three fixed compatible affixes and a mobile map marker. Rift wilds/masters are outside this task's approved scope. Seeded selection, non-alpha entries, regional drops/weights and no-affix-essence rewards are checked. Seeds 1/7, n=50, smart, Heat 0: all 16 regional stage-kit alpha cells win 100%; Hollow melee is SLOG at 33.94/34.28 turns. The generic economy-only smoke does not fight alphas; economy evidence establishes unchanged sources, not measured expedition parity. Full suite passed 26/26; parent focused checks pass. See [review and artifacts](art-evidence/v16-alpha-review.md).

## Biome element weights

- [x] **V-13 · Weight biome elements** — `Status: Done` · `js/monsters.js`, `tools/element-weight-check.js`
  Optional biome `elW` maps weight common and rare combat elements while retaining uniform fallback. The selector uses one existing RNG draw. M-05 Fen/Ash/Bone/Deep signature weights remain 2:1 (40% signature, 20% each alternative), without multiplying the signature bias twice; non-signature generated wild drops continue using the uniform element from that same roll.
  **Validation:** 20,000 deterministic draws per biome verify distributions, fallback, single-draw budget, repeated roster output, and daily pre-roll determinism. Focused element-weight, Rift-identity, V-11 biome-special, i18n, Fen-region, smoke, and diff checks pass. Paired seed-1/7, n=30, Heat 0, smart-policy simulations and source fingerprints are in [V-13 evidence](rift-evidence/v13-element-weights.md). The integrated suite reported 27/28 before the parent fixed `v14-special-check.js` to accept Fen guard enemies while checking original special assignments and unchanged Boar charge; the focused V14 rerun passed.
## Rift biome expansion

### V-05 · Add a Tidewrack coast biome

Added Tidewrack as the ninth selectable Rift biome using existing ice, poison,
shadow and swift elements, existing body families and attachable parts, a marine
palette, compatible coastal names/lore, a 3:1 common/rare element mix, and three
translated V-11-compatible specials (`drain`, `multi`, `heavy`). The existing
special-selection draw remains unchanged. This adds no Water/Steam family,
authored region, M-05 affinity, or roster-size change. M-06 Fen handling and
M-05's four biome identities remain intact.

Validation passed: the Tidewrack browser check verifies a deterministic generated
roster/master, names, attachments, specials/translations, and 390px map/battle
layout. Name, part, color, weighted-element, biome-special, biome-modifier,
Rift-master, map, i18n, and smoke checks passed; `node tools/run-checks.js`
passed **30/30**. Paired simulator runs used seed 1 and seed 7 separately, n=30,
Heat 0, smart policy, all kits, depth 1, with biome/depth modifiers disabled.
They cover all nine biomes and report 100% Tidewrack wins; the wider Rift-wild
means were 98% and 96%. `TOO_EASY` flags remain in the master's wild-foe rows;
the Tidewrack Drowned Wraith defensive/Spire row is `SLOG` at 59.6/59.4 turns
for seeds 1/7. Adding a biome changes the biome-selection denominator, so the
seeded samples do not establish exact per-roster parity or economy parity. See
[implementation, raw simulation evidence and screenshots](rift-evidence/v05-tidewrack.md).

### V-06 · Windcut Crags

Added Windcut as a generated Rift biome using existing stone/metal/swift/arcane elements, beast/humanoid/construct/elemental bodies, and armor/horns/chains/crystals/wings/tail parts. Its 3:3:3:1 element weighting is checked over 10,000 deterministic samples. Three translated V-11-compatible special entries use existing combat kinds. The addition keeps the generated roster size and family set unchanged.

Validation: the seeded generator check covers pool compatibility, deterministic roster/master generation, name uniqueness, specials and translations; mobile map and battle captures fit at 390×844. Integrated seed-1/7 smart-policy simulations used Heat 0, n=30 per stage-kit row, depths 1/3, and disabled biome/depth modifiers. Windcut master wins were 99%/98% across depths 1/3 for seeds 1/7; the selector now has eleven biomes including Windcut and Garden. Rift wild rows remain mostly `TOO_EASY`, with two `TOO_HARD` cells at depth 3 in each sample; these are recorded as limitations and no exact same-seed parity is claimed because the expanded selector remaps biome seeds. The full suite passed 32/32, including smoke. See [implementation, baselines, raw simulations and screenshots](rift-evidence/v06-windcut.md).
### V-07 · Radiant Garden

Added Radiant Garden as the eleventh selectable Rift biome using the specified holy/wood/poison/swift elements, beast/humanoid/elemental/undead bodies, and antlers/vines/halo/wings/crown/mane parts. Its common elements use 3:3 weights and poison/swift 1:1. It has a floral magenta/leaf-green palette, translated region names and lore, and three translated V-11-compatible specials using existing `multi`, `heavy`, and `heal` kinds. No new family, authored region or roster slot was added; element and special selection keep their existing one-draw RNG behavior.

Validation passed: `node tools/garden-biome-check.js` checks seeded generation, the exact pools and weights, translated specials, name uniqueness, body-part compatibility, and the 390×844 map/battle layout. Biome neutrality, i18n, color and integrated full checks passed; `node tools/run-checks.js` passed **32/32**, including smoke. Paired seed-1/7 smart Heat 0 n=30 samples cover depths 1/3 with biome/depth modifiers disabled. Garden master rows won 99% in both seeds; the broad Rift-wild rows had many `TOO_EASY` flags and a few `TOO_HARD` depth-3 cells. The selector now has eleven biomes, so seeded mappings differ from the earlier nine-biome baseline; samples do not establish exact parity. See [Garden screenshots, check output and measured limitations](rift-evidence/v07-garden.md) and [raw paired runs](rift-evidence/v06-integrated-seed1.json), [seed 7](rift-evidence/v06-integrated-seed7.json).

### V-08 · Geyser Field

Added Geyser Field as a generated Rift biome using existing fire/ice/stone/arcane elements; elemental/construct/beast/humanoid bodies; flames/frost/crystals/armor/horns/runes attachments; a 3:3:3:1 element mix; translated Geyser names/lore; and three translated V-11-compatible `multi`, `heavy`, and `heal` specials. It adds no family, authored region, element, or roster slot and leaves generated Rift masters on the shared special pool.

Validation: `node tools/geyser-biome-check.js` verifies the pool, 10,000 deterministic element samples, repeatable 10-wild roster/master, name and attachment compatibility, translations, and 390×844 mobile map/battle views. Name, part, color, map, biome, Rift-boss, affix, i18n, element-weight, Geyser, and Sporewood checks passed. `node tools/run-checks.js` passed **34/34**. Paired simulations used seed 1 and seed 7 separately, smart policy, Heat 0, n=30 per row, depths 1/3, and disabled biome/depth modifiers. All 13 biome IDs, including Geyser and Sporewood, appear in both outputs. Geyser master rows won 100% in both samples; ordinary-wild rows won 98% with 16 `TOO_EASY` cells in seed 1, and 98% with one `TOO_HARD` plus 13 `TOO_EASY` cells in seed 7. Sporewood rows and broader existing difficulty limitations are recorded with the raw outputs. The expanded selector remaps biome rolls, so the paired runs establish coverage rather than exact same-seed roster parity. See [V-08 baseline, integrated measurements, and limitations](rift-evidence/v08-baseline.md), [seed 1 JSON](rift-evidence/v08-v09-integrated-seed1.json), [seed 1 log](rift-evidence/v08-v09-integrated-seed1.txt), [seed 7 JSON](rift-evidence/v08-v09-integrated-seed7.json), and [seed 7 log](rift-evidence/v08-v09-integrated-seed7.txt).

### V-09 · Sporewood

Added the specified poison/wood/shadow/holy Rift biome, using existing bodies/parts, 3:3:1:1 weights, translated themed specials and compatible creature/region names. No new family, authored region or roster slot is introduced. Focused deterministic roster/attachment/translation/mobile checks pass; integrated suite passed 34/34 before screenshot-only refinement, whose focused rerun passed. Paired seed-1/7 n=30 smart Heat 0, depths 1/3 samples record 98% master and 99% wild wins, with four TOO_EASY cells per seed. The expanded selector remaps seeds; no exact parity or balanced difficulty claim is made. See [evidence and screenshots](rift-evidence/v09-sporewood.md).

### V-10 · Increase seeded roster size

Raised `GEN_N` from 10 to 12 for the four generator-backed authored zones, while keeping Fen authored-only and the Rift at `RIFT_N=10`. Each non-Rift generated foe now weighs `10/GEN_N`, holding each region's aggregate generated encounter weight at 10; the V-16 alpha keeps its pre-V10 seeded slot. The two added IDs per zone are ordinary, non-alpha wilds. No drop, combat, M12 stage-band or simulator-kit rules changed.

On accepted revision `074a700`, the baseline had 10 generated creatures per applicable region and weighted encounter shares 38.46% / 40% / 40% / 41.67% (Woods / Pass / Hollow / Spire); Fen had six authored regulars, zero generated, and Rift had 10. Candidate evidence checks deterministic 12-entry, unique-name rosters, exactly one three-affix alpha in its legacy slot, and the unchanged Rift roster. At 100,000 weighted picks per zone, candidate shares were 38.489% / 39.856% / 39.893% / 41.843%. In 500 seeded maps per zone, generated foe counts exactly matched baseline: 2,902 / 7,484, 3,035 / 7,484, 3,035 / 7,484 and 3,146 / 7,484; Fen remained zero generated foes.

Paired smart/native Heat 0 sim runs used seeds 1 and 7, 30 fights per cell, biome/depth modifiers off, and Rift seeds 1/7 at depths 1/3/9. The 16 same-region stage-kit rows averaged 99.62% wins / 9.02 turns / 80.0% HP left for seed 1 and 99.69% / 9.09 turns / 79.9% for seed 7. Existing flags remain: seed 1 has three TOO_EASY stage rows and one TOO_HARD (Spire staff); seed 7 has three TOO_EASY and no TOO_HARD. Rift master and wild outputs exactly match baseline at the sampled seeds/depths. Economy runs used 100 expeditions per zone for each seed on both versions; clears stayed identical or shifted down by at most one percentage point, while finite-sample item/essence yields moved modestly and are not claimed as exact parity. Full `node tools/run-checks.js` passed 36/36, including map-check and smoke. See [V-10 measurements and limits](balance-evidence/v10-roster.md), [baseline roster/map JSON](rift-evidence/v10-baseline-rosters.json), [candidate roster/map JSON](rift-evidence/v10-candidate-rosters.json), and the paired combat/economy raw files linked there.
### V-17 · Introduce enemy roles

Added Bruiser, Skirmisher, Caster, and Support mappings, deterministic role slots
for generated enemies, role-compatible special selection, and non-boss combat stat
biases. Authored bosses and Rift masters keep their authored stats. The translated
battle role chip and special/stat mapping are documented in [enemy-roles.md](docs/enemy-roles.md).

The full suite passed 38/38. Paired seed 1/7 smart Heat 0 samples (30 fights per
cell, biome/depth modifiers disabled) leave authored stage-kit wins at 99.6–99.7%;
the 100-expedition samples keep Woods/Pass at 100% clears, with Hollow at 93–95%
and Spire at 97–98%. Rift depth 9 still has TOO_HARD cells. Loot totals move with
combat outcomes, so economy parity is not claimed. Full settings, deltas, output
links, and frozen source fingerprints are in [V-17 review evidence](balance-evidence/v17-enemy-roles.md).

### V-19 · Add cross-biome factions

Added Raiders, Cultists, Cult of the Star, and Constructs across authored regions and generated rosters. Generated factions follow the V-17 role assignment; faction signature specials are intersected with role-compatible kinds, prefer biome specials, and fall back to shared compatible specials. This uses the existing special-selection draw. Battle and Codex show translated faction labels and readable marks. Factions do not add rewards or modify drops, map generation, save shape, authored boss phases, alpha count, V-10 encounter weights, or Rift master behavior.

The focused model and browser checks cover deterministic faction mapping, four multi-biome groups, compatible special choices across the current 13 biomes, and the 320px battle/Codex UI. Name, part, color, biome-special, i18n, and full integration checks passed; `node tools/run-checks.js` passed **40/40**, including smoke. Paired seed-1/7 n=30 smart Heat 0 combat samples (all simulator kits; Rift depths 1/3/9; biome/depth modifiers off) match the V-17 reference row metrics and flags. Existing wild flags remain: seed 1 has 57 `TOO_EASY`, 31 `SLOG`, 2 `TOO_HARD`; seed 7 has 54, 33, and 2. Matched 100-expedition economy outputs also match by zone in these finite samples; no generalized parity claim is made. See [V-19 implementation, frozen fingerprints, checks, and measurements](rift-evidence/v19-factions.md), [mobile review](combat-evidence/v19-faction-mobile.png), and paired raw combat/economy outputs linked there.

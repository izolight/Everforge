# Everforge — backlog and status

The status index for scoped work. Open tasks are below; implementation evidence for finished work is in [Completed backlog](backlog-completed.md). [Ideas and playtest watchlist](todo.md) holds undecided ideas and observations, not a second task queue.

## At a glance

**56 tasks · 34 Done · 1 In Progress · 0 Implement · 21 Planned · 22 open.**

| Workstream | Done | In Progress | Implement | Planned |
|---|---:|---:|---:|---:|
| Monster coverage, balance and progression (M) | 6 | 1 | 0 | 5 |
| Biome variety and mechanics (V) | 6 | 0 | 0 | 16 |
| Art identity and readability (A) | 5 | 0 | 0 | 0 |
| UI (U) | 9 | 0 | 0 | 0 |
| Crafting rework (C) | 8 | 0 | 0 | 0 |
| **Total** | **34** | **1** | **0** | **21** |

**Statuses:** `Planned` = scoped backlog, not started; `Implement` = detailed implementation plan exists; `In Progress` = actively underway; `Done` = completed, with evidence in the archive. Dependencies are stated on task cards; Planned does not necessarily mean ready to start.

**Sizes:** XS tiny · S small · M medium · L large · XL refactor/multi-day. Art priorities are review recommendations, not active assignments. Preserve task IDs when moving or closing work; update this overview when statuses change.

## Suggested next work

| Focus | Tasks | Next step |
|---|---|---|
| Balance with an existing plan | M-09 complete | See [completed evidence](backlog-completed.md#m-09). |
| Starter progression | M-10 complete | See [completed evidence](backlog-completed.md#m-10). |
| Creature art and readability | A-01–A-05 complete | See [completed evidence](backlog-completed.md#creature-art-and-readability) and [visual review sheets](art-evidence/README.md). |
| Rift difficulty | M-11 → M-12 → V-16 | Fix masters, remeasure wild bands, then add alphas. |
| Essence availability | M-08 | Decide and implement a non-affix Steam source, or document affix-only intent. |
| Later gameplay expansion | V-14 → V-15 → V-21; V-11 → M-05 | Build combat/modifier foundations, then biome-specific behavior. |

Navigation: [UI](#ui-simplification) · [Balance](#balance-and-progression) · [Art](#art-identity-and-readability) · [Biome gameplay](#biome-gameplay-and-combat-foundations) · [Expansion](#world-and-roster-expansion) · [Dependencies](#dependencies-and-coordination) · [Completed](backlog-completed.md).

## Measurement freshness

M-09's current seed-7/11 measurements are archived in [completed evidence](backlog-completed.md#m-09). Older M-10–M-12 measurements remain historical: V-12/V-02 changed generated rosters, and C-01–C-08 changed crafting, research and encounter density. Refresh relevant measurements before tuning; do not read “today” in older plans as the current build. Record seed, revision, kit, policy and Heat for new results.

## UI simplification

U-02–U-09 are complete. See [Completed UI tasks](backlog-completed.md#ui) for implementation and validation evidence.

## Balance and progression

- [ ] **M-08 · Add non-affix sources for Steam essence** — `Status: Planned` · `Size: M` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/encounters.js`
  Checked against `DECON` and the drop tables in `js/data.js`: Heavy (`boar_hide`, `golem_core`), Runic (`sentinel_plate`) and Light (`sprite_dust`) already come from deconstructing, so they are out of scope. Wood has no `DECON` item (`oak_bough` and `witchwood` carry Wood in their material, which `deconYield` skips); its only non-affix source is Gnarlhorn's guaranteed `gnarl_tusk`, a boss drop. Steam has no non-affix source at all: only the Volatile affix (`tr:"Steam"`) gives it.
  Add peddler stock, chest/shrine rewards, a `DECON` entry or a drop for Steam, or document affix-only intent. Wood's boss-only source is a note, not a blocker.
  **Acceptance:** Steam has at least one non-affix source or an explicit note; economy sim unchanged. When evaluating essence mix, account for M-09's reduced Nourishing, Wood and Runic affix drops from healing species.

- [x] **M-09 · Rebalance affixed foes and staff kits** — `Status: Done` · `Size: M` · `js/data.js`, `js/affix.js`, `js/map.js`, `js/battle.js`, `js/monsters.js`, `tools/sim.js` · see [completed evidence](backlog-completed.md#m-09)
  On the `4b0ef66` baseline plus M-09 changes, `--rarity --seed 7/11 --n 100` (smart, stage kits, Heat 0/3/5) had weakest wins of 99%/88% at Heat 0/3, 2 starter-only `RARE_HARD` rows and no `SLOG`. `defensive/woods` basic/rare at Heat 5 averaged 28.9/28.8 turns. Final tuning and elite-matrix tradeoff are recorded in the archive.

- [x] **M-10 · Tune the starter kit against magic/rare enemies** — `Status: Done` · `Size: S` · `tools/sim.js`, README/todo
  Decision: tutorial preparation is part of the intended starter progression. The player equips the Fire-infused sword and learns Weaponcraft before exploring. Keep base starter stats unchanged; make `--fresh` start from this tutorial-prepared state with unlock gates still active.
  **Done:** opening curve is intentional. Bare iron-sword baseline on `f01d69c` won 0/6, 0/6, 1/6 expeditions for seeds 1/7/11. With the tutorial Fire sword and Weaponcraft prepared, final code won 6/6 for each seed. Smart policy, Heat 0, six Woods expeditions per seed. Seed 1 `--rarity --kit starter --policy smart --n 100`: magic/rare wins 99%/96% at Heat 0, 91%/79% at Heat 3; one Heat 3 rare row remains `RARE_HARD`. README and todo record the decision and the limit.
  **Validation:** `node -r /tmp/noFonts.js tools/sim.js --fresh --exped 6 --seed 1/7/11`; `node -r /tmp/noFonts.js tools/sim.js --rarity --kit starter --policy smart --seed 1 --n 100`; smoke, i18n, unlock checks passed.

- [ ] **M-11 · Fix the Rift master's affixes and stat band** — `Status: In Progress` · `Size: S` · `js/battle.js`, `js/monsters.js`
  `startBattle` skips the affix block for every boss (`js/battle.js:17`), so the Rift master — rolled as a rare with three affixes and its stats already divided by the rare multiplier — fights with no affixes at about 1.2× the region's HP band.
  **Acceptance:** the master is a real fight (`node tools/sim.js --wild --seed 1`: no `TOO_EASY` at depth 1 with a `*/spire` kit, smart play wins over 90%); the master's stats and affixes match the roll it was built from; the sim's native row agrees with the forced rows. The historical seed-1 baseline fails the first clause (the melee, staff and stacked kits are `TOO_EASY` at depth 1).

  **Current implementation and gate status:** generated Rift masters now apply their generated rarity and compatible affixes in native combat; authored bosses retain the authored boss path. The forced simulator row reuses the master's stored rarity, stats and compatible affixes. `tools/rift-boss-check.js` asserts those native/forced values and authored-boss behavior. The current shared master band is 3.2× HP / 1.1× attack before rarity and affixes. This is still **In Progress** because the difficulty gate is not met: on the refreshed all-biome sample below, depth-1 native master wins were 93% overall, but 19 of the 32 biome/kit rows were tagged `TOO_EASY`. A 4.0× HP / 1.25× attack trial reduced tagged rows to 12/32 but lowered wins to 86%; a 3.8× HP / 1.0× attack trial produced 90% wins and 18/32 easy rows. These measured bands do not meet both gate clauses together. Do not archive as Done until both pass.

  **Refreshed sample:** base revision `1abbaf9` plus the uncommitted M-11 working tree; `node -r /tmp/noFonts.js tools/sim.js --wild --enemy rift_boss --kit spire --policy smart --seed 1 --n 100 --rift-depth 1 --no-econ`. This is 100 fights per row, smart policy, all four `/spire` kits, depth 1, Heat 0 (Rift does not use Heat), across the eight deterministic biome Rift seeds. Native master win rate by biome: deep 99%, fen 100%, astral 100%, forest 100%, ember 80%, tundra 100%, bone 75%, ash 92%; aggregate 93%. The forced rare row reuses each biome's stored master roll; exact native/forced combat stats and affix count are checked by `node tools/rift-boss-check.js` (deep seed roll: rare, 3 affixes). Sample limitations: this is one explicit fight seed and 100 trials per row, not a broad seed sweep; 19/32 rows remain `TOO_EASY`, and ember/bone win rates remain low, so the difficulty gate is unresolved.

  <details>
  <summary>Historical measurements — refresh before tuning</summary>

  Historical seed 1 (`node tools/sim.js --wild --seed 1`, Rift section, native master, smart, 8 seeds × 2 depths): every `*/spire` kit wins 100% in every biome and depth. Melee, staff and stacked kits take 3.4–11.9 turns and are `TOO_EASY` in 8/8 cells at depth 1 (7/8, 7/8, 8/8 at depth 3); the defensive kit takes 7.8–19.4 turns, `TOO_EASY` 4/8 at depth 1 and 0/8 at depth 3. The master's own affixes (the forced `passive` rows) make the defensive kit a real fight: its mean win falls to about 50% at depth 3 (the eight cells range from 0% to 100%). Either let a boss with `gen` apply its own affixes, or keep bosses affix-free and stop dividing their stats by the rare multiplier.

  </details>

- [ ] **M-12 · Give the wild creatures a fight of their own** — `Status: Planned` · `Size: M` · `js/monsters.js`
  The wild creatures are meant to be a fight, not a free win, but with their own region's kit every one of them still wins 100% at Heat 0.
  **Acceptance:** `node tools/sim.js --wild --seed 1` shows the wild creatures as a real fight with a stage kit: with a stage kit, the region's wild creatures take at least the regulars' mean turns and leave no more HP than the regulars (Δ turns ≥ 0, Δ HP ≤ 0, at Heat 0; met by the melee kits above, not by every stage kit: `defensive/pass` −0.7 turns, `staff/hollow` −0.3, `staff/spire` −0.4 turns and +1 HP); at most a third of a region's roster `TOO_EASY` (not met: woods 10 of 10, pass 4 of 10); no essence from wild affixes (holds: a wild creature's affixes drop no essence, `js/battle.js` `!B.intr`). The region's economy does not move.

  <details>
  <summary>Historical measurements — refresh before tuning</summary>

  Historical seed 1 (`node tools/sim.js --wild --seed 1`, smart, native, Heat 0; Δ is against the same zone's regulars, win points / turns / HP points): woods `melee/woods` 1.9 turns, 95% HP left, Δ +0.26 / −2, 10 of 10 creatures `TOO_EASY`; pass `melee/pass` 3.9 turns, 88%, Δ +0.18 / −6, 4 of 10 `TOO_EASY`; hollow `melee/hollow` 4.9 turns, 85%, Δ +0.56 / −3, 3 of 10; spire `melee/spire` 5.2 turns, 97%, Δ +1.29 / −3, 0 of 10. Against the spire's wild creatures, one stage behind (`melee/hollow`) costs −1 / −4 points at Heat 3 / 5. The wild creatures take more turns and leave less HP than the regulars, but the win rate stays at 100%. `GEN_T` and the 30% rare share leave a wild creature weaker than a regular of the same zone. Raise the band or the affix load, or give part of the roster a mini-boss profile (see V-16).

  The Rift's wild creatures need the same look (`--wild --seed 1`, Rift section, forced rows): `defensive/spire` is `TOO_HARD` in 53 of 160 cells (basic) and 55 of 160 (passive) with magic affixes, and in 99 of 160 and 107 of 160 with rare ones, at a mean win of 33–36% for the rare rows.

  **Note (V-22, colours):** the wild creatures' and Rift rolls' body and accent colours changed, but the generator still draws the same number of random values, so the rosters and the seed-1 numbers above are unchanged by it. Re-run after V-22 step 2 (`--wild --seed 1`, Heat 0, smart, native): woods `melee/woods` 1.9 turns / 95% (Δ +0.3 / −2), pass `melee/pass` 3.9 / 88% (Δ +0.2 / −6), hollow `melee/hollow` 4.9 / 85% (Δ +0.6 / −3), spire `melee/spire` 5.1 / 97% (Δ +1.3 / −3). The spire's 5.2 above predates V-22; the same code before V-22 gives 5.1 too. M-09 to M-11 were not re-measured for V-22 and the Rift summary numbers were not compared.

  </details>

## Art identity and readability

- [x] **A-01 · Give animal species distinct silhouettes** — `Status: Done` · `Size: L` · `Priority: High` · `js/art/bodies.js`, `js/art/parts.js`, `js/data.js`, `js/monsters.js` · see [completed evidence](backlog-completed.md#a-01)
  Review point 1. Add canine, feline, bulky bear and low reptile bodies or variants; update the Kindle Fox, Astral Lynx, Rimehide Bear and Magma Salamander, and review the stag's proportions. Retain the boar body for boar-like creatures. Supply compatible part and affix anchors and update `BODY_PARTS` for any new body keys.
  **Acceptance:** species are distinguishable by silhouette at the 76px mobile battle size and in the Codex, without relying on labels or hue; attached parts and affixes remain positioned correctly. Run part/color checks and visually inspect representative normal, elite and status-effect combinations. Keep combat data unchanged; remeasure seeded rosters if generator choices change.
  **Related:** V-12 is completed attachment gating, not species anatomy. Coordinate with A-04; V-16 can reuse the resulting bodies.

- [x] **A-02 · Give named equipment recognizable shapes** — `Status: Done` · `Size: M` · `Priority: High` · `js/art/items.js`, `js/hero.js` · see [completed evidence](backlog-completed.md#a-02)
  Review point 2. Add item-specific glyph overrides: shorten the dagger relative to the sword, distinguish the Void Robe from a shirt, and draw a lantern, fang and eye for Sprite Lantern, Fang Charm and Witch Eye. Preserve shared material gradients, trait overlays and rarity presentation; keep inventory and held/worn hero representations consistent.
  **Acceptance:** those named items are distinguishable at actual satchel/slot sizes; dagger and sword proportions also read correctly when held. Inspect item sheets and the equipped hero on mobile; run `hero-check`. Preserve U-01's grade pips and rarity ownership.
  **Related:** U-01 is complete; C-01–C-08 changed crafting behavior, not equipment silhouettes.

- [x] **A-03 · Give Rift biomes distinct terrain art** — `Status: Done` · `Size: M` · `Priority: High` · `js/art/map.js` · see [completed evidence](backlog-completed.md#a-03)
  Review point 3. Select obstacle, water and ambient terrain motifs from the saved Rift biome, retaining its palette: reeds/roots for fen, slag/ruins for ash, ribs/gravestones for bone and submerged/crystalline forms for deep. Give forest, tundra, ember and astral Rift rolls motifs consistent with their authored counterparts.
  **Acceptance:** all eight current Rift biomes have distinct environmental shapes, not only recolors; floor, obstacles, water, fog, POIs and enemy markers remain readable at mobile tile size. Inspect seeded examples of every biome and run `map-check`; do not change map generation, collision or combat rules.
  **Related:** complements M-05's gameplay identity and V-15's modifiers, but requires neither. Reuse it for M-06; apply the same standard to future V-05–V-09 biomes.

- [x] **A-04 · Match generated creature names to anatomy** — `Status: Done` · `Size: M` · `Priority: Medium` · `js/monsters.js`, `tools/name-check.js` · see [completed evidence](backlog-completed.md#a-04)
  Review point 4. Choose anatomy-specific nouns from compatible body/variant lists: hounds and lynxes need appropriate animals, constructs need construct bodies, and ambiguous nouns such as Watcher may span families. Apply the rules to wild creatures and Rift masters while preserving biome vocabulary, uniqueness and deterministic generation.
  **Acceptance:** inspect seeded samples of every biome and body; no humanoid or elemental is named Lynx/Hound and no skeleton is named Construct. Handle uniqueness fallback without breaking compatibility. Add a meaningful generator check, and rerun the seeded wild sim because changed random draws can alter rosters and stats.
  **Related:** V-12 already gates attachments; V-04 already expands region names. Neither solves anatomy-aware creature naming. Coordinate animal noun mappings with A-01; generic body-aware naming can start independently.

- [x] **A-05 · Verify creature visual hierarchy at gameplay sizes** — `Status: Done` · `Size: M` · `Priority: Medium` · `js/art/creature.js`, `js/art/parts.js`, `js/art/affixes.js`, `tools/` · see [completed evidence](backlog-completed.md#creature-art-and-readability)
  Review point 5. Follow up on completed V-22 with a visual acceptance pass: prioritize the face and one defining silhouette feature, reduce conflicting head/attachment combinations where necessary, and verify that patterns, rank, affixes and statuses remain legible. Inspect authored creatures, generated body families and crowded elite/status examples at 76px battle and actual Codex sizes.
  **Acceptance:** record representative screenshots and findings for each body family and biome; resolve collisions or unreadable marks found in that pass. Preserve V-22's body hue = element, accent = biome, ring = rank, fixed affix placement and status badges. Keep the intentional `.35` pattern-opacity cap; remove or document redundant higher authored opacity values rather than raising the cap. Run affected part/color/affix checks.
  **Related:** establish the review examples early and apply them during A-01–A-04; finish the pass after those changes. V-22 remains Done. Animation and a 3D conversion are outside these five follow-ups.

## Biome gameplay and combat foundations

- [ ] **M-05 · Give each Rift-only biome a signature identity** — `Status: Planned` · `Size: L` · `js/monsters.js`, `js/battle.js`, `js/data.js` · `Depends: V-11`
  Give fen/ash/bone/deep 2–3 thematic specials, an element/drop bias, and one signature trait each instead of only shared `GEN_SP` and Rift drops.
  **Acceptance:** each biome plays differently; all still work in Rift depths; sim covers them.

- [ ] **V-11 · Add per-biome special pools** — `Status: Planned` · `Size: M` · `js/monsters.js` · `Depends: V-14 (soft)`
  Add `B.sp` (or `BIOME_SP`) with 2–3 signature specials per biome, falling back to `GEN_SP`.
  **Acceptance:** no biome relies only on the shared six; names/tells translated; sim passes.

- [ ] **V-13 · Weight biome elements** — `Status: Planned` · `Size: S` · `js/monsters.js`
  Add optional `elW` so each biome has common and rare elements instead of uniform rolls.
  **Acceptance:** seeded output stays deterministic; daily pre-rolls unaffected; sim reflects intended element mix.

- [ ] **V-14 · Add new enemy special kinds** — `Status: Planned` · `Size: M` · `js/battle.js`, `js/monsters.js`, `js/data.js`, `lang/`
  Add `guard` (temporary ward), `inflict` (guaranteed status), `enrage` (Attack up below half HP), `burrow` (untargetable for one turn), and `summon` (calls a weaker wild creature).
  **Acceptance:** each kind resolves correctly against Guard/Parry/status; tells and Codex entries work; i18n and sim pass.

- [ ] **V-15 · Add biome modifiers to the map** — `Status: Planned` · `Size: L` · `js/map.js`, `js/battle.js`, `js/data.js` · `Depends: V-14`
  One passive per biome: poison fog (fen), chill (tundra), burn (ember), arcane surges (astral), sandstorm (ash), fear (bone), drowning pressure (deep).
  **Acceptance:** modifiers are visible in UI/Codex, seeded, and have documented stacking rules with daily twists.

- [ ] **V-21 · Add seeded Rift depth modifiers** — `Status: Planned` · `Size: M` · `js/monsters.js`, `js/battle.js` · `Depends: V-15`
  Each Rift depth rolls one modifier (e.g. burning air, thin wards, fast foes) from the seed.
  **Acceptance:** same seed shows the same modifier; HUD/Codex explains it; sim covers each modifier.

## World and roster expansion

- [ ] **M-06 · Promote `fen` or `bone` to a full region** — `Status: Planned` · `Size: XL` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/audio.js`, `lang/` · `Depends: M-04, M-05`
  Add a `ZONES` entry, unlock gate, six authored regulars, a boss, map palette, music, quest intro, and translations.
  **Acceptance:** region is playable end-to-end; boss/quest/unlocks work; `smoke`, `map-check`, `audio-check`, `i18n-check`, `sim` pass; save `KEY` bumped if the shape changed.

- [ ] **M-07 · Boss coverage for missing elements** — `Status: Planned` · `Size: L` · `js/data.js` · `Depends: M-06` (first boss)
  Poison, holy, shadow, metal, arcane and stone have no boss. Add bosses through new regions or variants; if deliberately excluded, document why.
  **Acceptance:** every element has a boss or a stated design exception.

- [ ] **V-05 · Add a Tidewrack coast biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements ice/poison/shadow/swift; bodies beast/undead/elemental/humanoid; parts shell/frost/tail/vines/hood/crystals; names such as "The Drowned Coast", "Saltwind Cliffs", "The Tidewrack".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-06 · Add a Windcut crags biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements stone/metal/swift/arcane; bodies beast/humanoid/construct/elemental; parts armor/horns/chains/crystals/wings/tail; names such as "The Windcut Crags", "The Iron Highlands", "The Skyward Pass".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-07 · Add a Radiant garden biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements holy/wood/poison/swift; bodies beast/humanoid/elemental/undead; parts antlers/vines/halo/wings/crown/mane; names such as "The Sunken Garden", "The Gilded Grove", "The Orchard of Bones".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-08 · Add a Geyser field biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements fire/ice/stone/arcane; bodies elemental/construct/beast/humanoid; parts flames/frost/crystals/armor/horns/runes; names such as "The Steam Vents", "The Boiling Shelf", "The White Caldera".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-09 · Add a Sporewood biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements poison/wood/shadow/holy; bodies undead/beast/elemental/humanoid; parts vines/hood/mane/tail/horns/crystals; names such as "The Sporewood", "The Hollow Bloom", "The Weeping Canopy".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-10 · Increase seeded roster size** — `Status: Planned` · `Size: S` · `js/monsters.js`
  Raise `GEN_N` from 10 to 12–14 and `RIFT_N` if needed; retune wild encounter weight so they stay ~40% of encounters.
  **Acceptance:** more variety per region without changing overall encounter mix; `sim` and `map-check` pass.

- [ ] **V-16 · Add one alpha wild creature per roster** — `Status: Planned` · `Size: M` · `js/monsters.js`, `js/art/`
  A deterministic mini-boss variant: three affixes, boosted stats, unique name, distinct map frame, defined rewards without shifting regional economy.
  **Acceptance:** exactly one per region; same every run; sim and economy checks pass.

- [ ] **V-17 · Introduce enemy roles** — `Status: Planned` · `Size: L` · `js/data.js`, `js/monsters.js`, `js/battle.js` · `Depends: V-14` (if roles use new kinds)
  Add roles such as bruiser, skirmisher, caster, support, with role-specific special pools and stat bias.
  **Acceptance:** roles documented; every role represented in sim; existing enemies mapped without breaking balance.

- [ ] **V-18 · Add multi-enemy encounters** — `Status: Planned` · `Size: XL` · `js/battle.js`, `js/render/`, `js/state.js`, `js/map.js` · `Depends: V-17`
  Support 2–3 foes with targeting, turn order, AoE abilities, pack-aware affixes and saves.
  **Acceptance:** packs work in normal/daily/Rift; UI and save shape updated; sim policies updated.

- [ ] **V-19 · Add cross-biome factions** — `Status: Planned` · `Size: L` · `js/data.js`, `js/monsters.js`
  Tag rosters into factions (raiders, cultists, constructs, cult of the star) that cross biomes with shared looks and rules.
  **Acceptance:** factions appear in multiple regions/biomes; faction tags drive specials or drops.

- [ ] **V-20 · Promote Water and Steam to full monster families** — `Status: Planned` · `Size: L` · `js/data.js`, `js/affix.js`, `js/monsters.js`
  Both exist as essences but not elements or `FAM` colours. Add family colour, `EL_NAT` weakness/resist/status, drops and at least one biome using each.
  **Acceptance:** Water/Steam creatures render and fight; affix and sim checks pass; translations added.

## Dependencies and coordination

These are sequencing notes, not agent assignments. Completed V-02/V-03/V-04/V-12 are prerequisites already satisfied and are no longer queued.

| Sequence | Reason |
|---|---|
| U-05 → U-03 (completed); U-06 → U-07; U-08 → U-09 | Contextual filtering now supports the shared Forge ingredient picker. Codex structure and terminology still precede their dependent interfaces; U-04 can proceed independently. |
| M-11 → M-12 → V-16 | Measure wild bands after master/rarity fixes; add alphas after the band is intentional. |
| V-14 → V-15 → V-21 | Map and depth modifiers build on the combat hooks. |
| V-11 → M-05 → M-06 → M-07 | Biome specials establish identity before promotion and new-region bosses. M-04 is already complete. |
| V-14 → V-11 or V-17, when needed | Soft dependency only: existing special kinds can support an earlier implementation. |
| V-17 → V-18 | Roles precede multi-enemy targeting and turn-order work. |
| A-01 ↔ A-04; A-01–A-04 → final A-05 pass | Keep anatomy and noun mappings consistent; apply readability criteria throughout. |
| A-03 → visual treatment for new biomes | Recommended sequencing for V-05–V-09 and M-06, not a combat prerequisite. |

- Coordinate all edits to `js/monsters.js`: art bodies/names, biome data, roster balance and new mechanics share the generator. Changes to pools or random draws can reroll names, parts, affixes and stats; palette-only edits need not do so. Re-run `node tools/sim.js --wild --seed 1` after generator changes and record the new baseline.
- Coordinate edits to `js/data.js` across balance, progression and authored creature art. A-02 equipment art and A-03 terrain art can otherwise be developed independently, with integration review for shared files.
- V-19 factions and V-20 Water/Steam families should follow the relevant generator/combat decisions. Reserve V-18 for a dedicated implementation effort because it changes battle and save structure.
- M-09's plan contains historical investigation; its context section identifies landed prerequisites. The [crafting plan](plan-crafting-rework.md) and [older review-fix plan](plan-review-fixes.md) are historical references, not active queues. Current statuses live here.

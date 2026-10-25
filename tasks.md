# Everforge — Monster & Biome Tasks

Backlog for monster coverage, biome variety and related balance/tooling work.

**Status values:** `Done` · `Implement` (specified, ready to implement) · `In Progress` · `Planned`
**Sizes:** `XS` tiny · `S` small · `M` medium · `L` large · `XL` refactor/multi-day

## Status snapshot

- **M-01** — `Done`
- **M-02** — `Done`
- **M-03** — `In Progress`
- **M-04** — `Done`
- **V-01** — `Done`
- Everything else — `Planned`

---

## Coverage fixes

- [x] **M-01 · Fill the missing body type in every biome** — `Status: Done` · `Size: S` · `js/monsters.js`
  Add `construct` to forest/fen, `undead` to tundra/astral/ash, `beast` to ember, `elemental` to bone, `humanoid` to deep.
  **Done:** all 8 `BIOMES` entries list 5 bodies; `node tools/map-check.js` and `node tools/smoke.js` pass; every body renders.

- [x] **M-02 · Remove the duplicate region name** — `Status: Done` · `Size: XS` · `js/monsters.js`
  `BIOMES.ash.n` ("The Cinder Wastes") duplicates a name in `BIOMES.ember.regions`. Rename one.
  **Done:** no duplicate across biome names and region-name lists.

- [ ] **M-03 · Close authored element gaps** — `Status: In Progress` · `Size: M` · `js/data.js`, `js/art/`, `lang/`
  Woods lacks authored fire/poison/swift; Pass lacks arcane; Hollow lacks metal. Swap duplicates or add enemies, with art, drops, lore and translations.
  **Done:** each campaign roster covers its biome element pool (or documents exceptions); `node tools/i18n-check.js` and `node tools/sim.js` pass.

- [x] **M-04 · Add wild creatures and Rift masters to the simulator** — `Status: Done` · `Size: M` · `tools/sim.js`
  Add `--wild` (or include `w_*` automatically) and run all 40 wild creatures plus seeded Rift masters through normal/magic/rare and existing policies.
  **Done:** wild creatures appear in sim output; win rates reported per region/biome; README/sim docs updated.
  The regular tables hold the hand-made enemies only now (the `w_*` creatures have their own section, with native and forced rarity rows and a Δ against the regulars of the same zone); the Rift section rolls one seed per biome by default and shows the master with and without its affixes (the game gives bosses none). `--rarity` no longer includes `w_*`; `--wild` has their rarity rows. The forced `normal` row puts a wild creature back on its region band (its stored stats multiplied by its own rarity), so the forced rows compare like with like.

- [ ] **M-05 · Give each Rift-only biome a signature identity** — `Status: Planned` · `Size: L` · `js/monsters.js`, `js/battle.js`, `js/data.js` · `Depends: V-11`
  Give fen/ash/bone/deep 2–3 thematic specials, an element/drop bias, and one signature trait each instead of only shared `GEN_SP` and Rift drops.
  **Done:** each biome plays differently; all still work in Rift depths; sim covers them.

- [ ] **M-06 · Promote `fen` or `bone` to a full region** — `Status: Planned` · `Size: XL` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/audio.js`, `lang/` · `Depends: M-04, M-05`
  Add a `ZONES` entry, unlock gate, six authored regulars, a boss, map palette, music, quest intro, and translations.
  **Done:** region is playable end-to-end; boss/quest/unlocks work; `smoke`, `map-check`, `audio-check`, `i18n-check`, `sim` pass; save version/fixture handled.

- [ ] **M-07 · Boss coverage for missing elements** — `Status: Planned` · `Size: L` · `js/data.js` · `Depends: M-06` (first boss)
  Poison, holy, shadow, metal, arcane and stone have no boss. Add bosses through new regions or variants; if deliberately excluded, document why.
  **Done:** every element has a boss or a stated design exception.

- [ ] **M-08 · Add non-affix sources for Wood/Heavy/Runic/Light/Steam essences** — `Status: Planned` · `Size: M` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/encounters.js`
  These five essences currently come only from affix drops/salvage. Add peddler stock, chest/shrine rewards, or document affix-only intent.
  **Done:** every essence has at least one non-affix source or an explicit note; economy sim unchanged.

- [ ] **M-09 · Rebalance affixed foes and staff kits** — `Status: Planned` · `Size: M` · `js/data.js`, `js/affix.js`
  Use `node tools/sim.js --rarity`. Staff kits are weakest against affixed foes; rare fights can slog past 30 turns.
  **Done:** stage kits beat rares >85% at Heat 0–3 with smart play; no `SLOG` above the stated turn limit; rarity table updated.
  Note: `--rarity` covers the hand-made regulars only since M-04; the wild creatures' rarity rows are in `node tools/sim.js --wild`.

- [ ] **M-10 · Tune the starter kit against magic/rare enemies** — `Status: Planned` · `Size: S` · `js/data.js`, tutorial/forge flow
  A starter without the tutorial Fire weapon wins ~8% vs Gnarlhorn and loses to magic/rare foes. Decide whether that is intended.
  **Done:** `node tools/sim.js --fresh --exped 6` shows an intentional win curve; README/todo notes the decision.
  Measured in M-04: the starter kit also loses more to the wild creatures than to the hand-made regulars of the woods (Δ −4 / −16 / −20 points at Heat 0 / 3 / 5, `node tools/sim.js --wild`); a wild creature is the starter's real first test.

- [ ] **M-11 · Fix the Rift master's affixes and stat band** — `Status: Planned` · `Size: S` · `js/battle.js`, `js/monsters.js`
  `startBattle` skips the affix block for every boss (`js/battle.js:17`), so the Rift master — rolled as a rare with three affixes and its stats already divided by the rare multiplier — fights with no affixes at about 1.2× the region's HP band. Measured in M-04 (`node tools/sim.js --wild`): a `*/spire` kit wins 100% in ~4 turns at every biome and both depths (`TOO_EASY`), while the master's own affixes (the forced rows) turn it into a real fight (a passive `defensive/spire` drops to 60% at depth 3). Either let a boss with `gen` apply its own affixes, or keep bosses affix-free and stop dividing their stats by the rare multiplier.
  **Done:** the master is a real fight (`node tools/sim.js --wild`: no `TOO_EASY` at depth 1 with a `*/spire` kit, smart play wins over 90%); the master's stats and affixes match the roll it was built from; the sim's native row agrees with the forced rows.

- [ ] **M-12 · Give the wild creatures a fight of their own** — `Status: Planned` · `Size: M` · `js/monsters.js`
  The wild creatures are meant to be a fight, not a free win, but they are not one: with their own region's kit every one of them wins 100% at Heat 0 (9 of the 10 in the woods are `TOO_EASY`, and the mean is exactly the hand-made regulars' — Δ 0 in every region), while against a kit one stage behind the spire's wild creatures cost −3 / −19 points at Heat 3 / 5. `GEN_T` and the 30% rare share leave a wild creature weaker than a regular of the same zone. Raise the band or the affix load, or give part of the roster a mini-boss profile (see V-16).
  **Done:** `node tools/sim.js --wild` shows the wild creatures as a real fight with a stage kit (at most a third of a region's roster `TOO_EASY`) and the Δ against the regulars is not 0; the region's economy does not move (a wild creature's affixes still drop no essence).

## Data-only variety

- [x] **V-01 · Expand biome part pools from 6 to 8–10** — `Status: Done` · `Size: S` · `js/monsters.js`
  6 parts give 41 distinct 1–3-part sets; 8 give 92, 10 give 175. Add thematic parts per biome.
  **Done:** every biome has 8+ parts; no duplicates; visual spot-check and `smoke` pass.
  **Done (V-01):** all 8 `BIOMES` pools hold 9 distinct parts (129 possible 1–3-part sets each); no pool pairs `hood` with `halo`; no new `tail`, `blade`, `axe`, `staff` or `tusks` were added.
  `node tools/part-check.js` renders every biome × body × part (360 renders, 0 problems), `node tools/map-check.js` passes, and the visual sheets (`node tools/parts-preview.js`, `node tools/parts-combos.js`) show the new parts on every body.
  `node tools/smoke.js` still reports the pre-existing `save-v14/15/16.json` migration failure ("missing rift pending"), which also fails on the base commit and is unrelated to the part pools.

- [ ] **V-02 · Use the four orphan parts** — `Status: Planned` · `Size: S` · `js/monsters.js` · `Depends: V-12`
  `blade`, `axe`, `staff`, `tusks` exist in `js/art/parts.js` but no wild pool uses them. Add them to appropriate biomes.
  **Done:** all four parts appear on generated creatures with sensible body gating.

- [ ] **V-03 · More patterns per biome** — `Status: Planned` · `Size: S` · `js/monsters.js`
  There are 9 patterns; each biome offers 4. Raise to 6–7 with thematic choices.
  **Done:** every biome has 6+ patterns; no biome uses all patterns identically.

- [ ] **V-04 · Expand region-name pools** — `Status: Planned` · `Size: XS` · `js/monsters.js`
  Increase each biome from 3 to 5–6 region names and avoid duplicates.
  **Done:** no duplicate names across all biomes; Rift name variety increases.

- [ ] **V-05 · Add a Tidewrack coast biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements ice/poison/shadow/swift; bodies beast/undead/elemental/humanoid; parts shell/frost/tail/vines/hood/crystals; names such as "The Drowned Coast", "Saltwind Cliffs", "The Tidewrack".
  **Done:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-06 · Add a Windcut crags biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements stone/metal/swift/arcane; bodies beast/humanoid/construct/elemental; parts armor/horns/chains/crystals/wings/tail; names such as "The Windcut Crags", "The Iron Highlands", "The Skyward Pass".
  **Done:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-07 · Add a Radiant garden biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements holy/wood/poison/swift; bodies beast/humanoid/elemental/undead; parts antlers/vines/halo/wings/crown/mane; names such as "The Sunken Garden", "The Gilded Grove", "The Orchard of Bones".
  **Done:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-08 · Add a Geyser field biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements fire/ice/stone/arcane; bodies elemental/construct/beast/humanoid; parts flames/frost/crystals/armor/horns/runes; names such as "The Steam Vents", "The Boiling Shelf", "The White Caldera".
  **Done:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-09 · Add a Sporewood biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements poison/wood/shadow/holy; bodies undead/beast/elemental/humanoid; parts vines/hood/mane/tail/horns/crystals; names such as "The Sporewood", "The Hollow Bloom", "The Weeping Canopy".
  **Done:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-10 · Increase seeded roster size** — `Status: Planned` · `Size: S` · `js/monsters.js`
  Raise `GEN_N` from 10 to 12–14 and `RIFT_N` if needed; retune wild encounter weight so they stay ~40% of encounters.
  **Done:** more variety per region without changing overall encounter mix; `sim` and `map-check` pass.

- [ ] **V-11 · Add per-biome special pools** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Add `B.sp` (or `BIOME_SP`) with 2–3 signature specials per biome, falling back to `GEN_SP`.
  **Done:** no biome relies only on the shared six; names/tells translated; sim passes.

## Code variety

- [ ] **V-12 · Make part pools body-aware** — `Status: Planned` · `Size: S` · `js/monsters.js`, `js/art/`
  Add a body→allowed-parts table. Weapons on humanoid/construct, tusks/antlers on beasts, halo/wings on appropriate bodies. Also stop `tail` silently disappearing on bodies without a tail anchor.
  **Done:** every generated creature draws its intended part count; no missing-anchor no-ops; screenshots checked.

- [ ] **V-13 · Weight biome elements** — `Status: Planned` · `Size: S` · `js/monsters.js`
  Add optional `elW` so each biome has common and rare elements instead of uniform rolls.
  **Done:** seeded output stays deterministic; daily pre-rolls unaffected; sim reflects intended element mix.

- [ ] **V-14 · Add new enemy special kinds** — `Status: Planned` · `Size: M` · `js/battle.js`, `js/monsters.js`, `js/data.js`, `lang/`
  Add `guard` (temporary ward), `inflict` (guaranteed status), `enrage` (Attack up below half HP), `burrow` (untargetable for one turn), and `summon` (calls a weaker wild creature).
  **Done:** each kind resolves correctly against Guard/Parry/status; tells and Codex entries work; i18n and sim pass.

- [ ] **V-15 · Add biome modifiers to the map** — `Status: Planned` · `Size: L` · `js/map.js`, `js/battle.js`, `js/data.js` · `Depends: V-14`
  One passive per biome: poison fog (fen), chill (tundra), burn (ember), arcane surges (astral), sandstorm (ash), fear (bone), drowning pressure (deep).
  **Done:** modifiers are visible in UI/Codex, seeded, and have documented stacking rules with daily twists.

- [ ] **V-16 · Add one alpha wild creature per roster** — `Status: Planned` · `Size: M` · `js/monsters.js`, `js/art/`
  A deterministic mini-boss variant: three affixes, boosted stats, unique name, distinct map frame, defined rewards without shifting regional economy.
  **Done:** exactly one per region; same every run; sim and economy checks pass.

- [ ] **V-17 · Introduce enemy roles** — `Status: Planned` · `Size: L` · `js/data.js`, `js/monsters.js`, `js/battle.js` · `Depends: V-14` (if roles use new kinds)
  Add roles such as bruiser, skirmisher, caster, support, with role-specific special pools and stat bias.
  **Done:** roles documented; every role represented in sim; existing enemies mapped without breaking balance.

- [ ] **V-18 · Add multi-enemy encounters** — `Status: Planned` · `Size: XL` · `js/battle.js`, `js/render.js`, `js/state.js`, `js/map.js` · `Depends: V-17`
  Support 2–3 foes with targeting, turn order, AoE abilities, pack-aware affixes and saves.
  **Done:** packs work in normal/daily/Rift; UI and save migration handled; sim policies updated.

- [ ] **V-19 · Add cross-biome factions** — `Status: Planned` · `Size: L` · `js/data.js`, `js/monsters.js`
  Tag rosters into factions (raiders, cultists, constructs, cult of the star) that cross biomes with shared looks and rules.
  **Done:** factions appear in multiple regions/biomes; faction tags drive specials or drops.

- [ ] **V-20 · Promote Water and Steam to full monster families** — `Status: Planned` · `Size: L` · `js/data.js`, `js/affix.js`, `js/monsters.js`
  Both exist as essences but not elements or `FAM` colours. Add family colour, `EL_NAT` weakness/resist/status, drops and at least one biome using each.
  **Done:** Water/Steam creatures render and fight; affix and sim checks pass; translations added.

- [ ] **V-21 · Add seeded Rift depth modifiers** — `Status: Planned` · `Size: M` · `js/monsters.js`, `js/battle.js` · `Depends: V-15`
  Each Rift depth rolls one modifier (e.g. burning air, thin wards, fast foes) from the seed.
  **Done:** same seed shows the same modifier; HUD/Codex explains it; sim covers each modifier.

---

## Parallelization

### Safe to run in parallel now

| Lane | Tasks | Owns |
|---|---|---|
| **World data** | M-01, M-02, V-01, V-03, V-04 | `js/monsters.js` |
| **Tooling** | M-04 | `tools/sim.js` |
| **Authored content** | M-03 | `js/data.js` (enemies only), `js/art/`, `lang/` |
| **Balance research** | M-09, M-10 (measure first; code changes touch `data.js`/`affix.js`) | `js/affix.js`, balance tables |
| **Rift master** | M-11 (the `js/battle.js` half only) | `js/battle.js` |

### Second wave

- **V-12 → V-02** — body-aware parts first, then use the orphan parts.
- **V-13, V-16, V-10** — all `js/monsters.js`, so serialize with the world-data lane.
- **V-05 … V-09** — five new biomes; same file, so one owner or one at a time.
- **V-14** — new special kinds; touches `battle.js`, `monsters.js`, `data.js`, `lang/`.
- **M-08** — essence sources; `data.js` + `map.js` + `encounters.js`.
- **M-12** — the wild creatures' band; `js/monsters.js`, so it rides with the world-data lane.

### Third wave / dependent

- **V-11 ← V-14** if the biome specials use new kinds; otherwise V-11 can go in wave two using existing kinds.
- **M-05 ← V-11** — Rift-biome identity needs the per-biome special pools.
- **M-06 ← M-05 + M-04** — promoting a biome needs its identity and simulator coverage.
- **M-07 ← M-06** for the first new boss; the remaining elements can be separate tasks later.
- **V-15 ← V-14** — biome modifiers reuse combat hooks.
- **V-21 ← V-15** — Rift depth modifiers should reuse the modifier framework.
- **V-17 ← V-14** if roles use the new special kinds.
- **V-18 ← V-17** — packs are much easier once roles exist.
- **V-19** — factions can start after roles; touches the same files as the world-data lane.
- **V-20** — wait until biome and data churn settles.

### Must be serialized

- **All `js/monsters.js` changes** — M-01, M-02, V-01/V-02/V-03/V-04, V-05–V-09, V-10–V-13, V-16, V-19, V-20, plus parts of M-05/M-06/M-08/M-11/M-12/V-14/V-17/V-21.
- **All `js/data.js` changes** — or assign one data steward and split by clearly separate sections (enemies vs balance vs biomes).
- **Save-version/fixture changes** — M-06 and V-18 (and V-20 if it adds save fields) must not run concurrently. Only one branch should run `node tools/smoke.js 400 --write-fixture`.
- **V-18 multi-enemy packs** — effectively a solo lane; it rewrites the core battle shape.

### Practical parallel plan

1. **Worker A:** M-01 → M-02 → V-01 → V-03 → V-04 → V-12 → V-02 (and M-12, once the monsters.js lane is free)
2. **Worker B:** M-04 → M-09 → M-10 → M-11 (the `js/battle.js` fix; the `js/monsters.js` half waits for the monsters.js lane)
3. **Worker C:** M-03 → M-08 (data content only)
4. **Worker D:** V-14 → V-15 → V-21 (combat mechanics)

Then serialize **V-05–V-09** under Worker A, **M-06/M-07** under Worker C, and **V-11/M-05/V-16/V-17/V-19/V-20** after the relevant prerequisites. Keep **V-18** for a dedicated branch.

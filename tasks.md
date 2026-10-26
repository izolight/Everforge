# Everforge — Monster & Biome Tasks

Backlog for monster coverage, biome variety and related balance/tooling work.

**Status values:** `Done` · `Implement` (specified, ready to implement) · `In Progress` · `Planned`
**Sizes:** `XS` tiny · `S` small · `M` medium · `L` large · `XL` refactor/multi-day

## Status snapshot

- **M-01** — `Done`
- **M-02** — `Done`
- **M-03** — `Done`
- **M-04** — `Done`
- **M-09** — `Implement` (see `plan-m-09.md`)
- **V-01** — `Done`
- **V-03** — `Done`
- **V-04** — `Done`
- **V-12** — `Done`
- Everything else — `Planned`

---

## Coverage fixes

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

- [ ] **M-05 · Give each Rift-only biome a signature identity** — `Status: Planned` · `Size: L` · `js/monsters.js`, `js/battle.js`, `js/data.js` · `Depends: V-11`
  Give fen/ash/bone/deep 2–3 thematic specials, an element/drop bias, and one signature trait each instead of only shared `GEN_SP` and Rift drops.
  **Done:** each biome plays differently; all still work in Rift depths; sim covers them.

- [ ] **M-06 · Promote `fen` or `bone` to a full region** — `Status: Planned` · `Size: XL` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/audio.js`, `lang/` · `Depends: M-04, M-05`
  Add a `ZONES` entry, unlock gate, six authored regulars, a boss, map palette, music, quest intro, and translations.
  **Done:** region is playable end-to-end; boss/quest/unlocks work; `smoke`, `map-check`, `audio-check`, `i18n-check`, `sim` pass; save `KEY` bumped if the shape changed.

- [ ] **M-07 · Boss coverage for missing elements** — `Status: Planned` · `Size: L` · `js/data.js` · `Depends: M-06` (first boss)
  Poison, holy, shadow, metal, arcane and stone have no boss. Add bosses through new regions or variants; if deliberately excluded, document why.
  **Done:** every element has a boss or a stated design exception.

- [ ] **M-08 · Add non-affix sources for Steam essence** — `Status: Planned` · `Size: M` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/encounters.js`
  Checked against `DECON` and the drop tables in `js/data.js`: Heavy (`boar_hide`, `golem_core`), Runic (`sentinel_plate`) and Light (`sprite_dust`) already come from deconstructing, so they are out of scope. Wood has no `DECON` item (`oak_bough` and `witchwood` carry Wood in their material, which `deconYield` skips); its only non-affix source is Gnarlhorn's guaranteed `gnarl_tusk`, a boss drop. Steam has no non-affix source at all: only the Volatile affix (`tr:"Steam"`) gives it.
  Add peddler stock, chest/shrine rewards, a `DECON` entry or a drop for Steam, or document affix-only intent. Wood's boss-only source is a note, not a blocker.
  **Done:** Steam has at least one non-affix source or an explicit note; economy sim unchanged.

- [ ] **M-09 · Rebalance affixed foes and staff kits** — `Status: Implement` · `Size: M` · `js/data.js`, `js/affix.js` · see `plan-m-09.md`
  Use `node tools/sim.js --rarity --seed 1`. Staff kits are weakest against affixed foes; rare fights can slog past 30 turns.
  **Done:** stage kits beat rares >85% at Heat 0–3 with smart play; no `SLOG` above the stated turn limit; rarity table updated.
  Seed 1 today: `staff/hollow` smart wins 59% vs rare and 81% vs magic at Heat 3 (`RARE_HARD`), so the Heat 0–3 criterion fails there; `defensive/woods` smart, basic and passive rare rows are `SLOG` at Heat 5 (30.8, 40.7 and 30.5 turns). The other stage kits clear 85% at Heat 0–3.
  Note: `--rarity` covers the hand-made regulars only since M-04; the wild creatures' rarity rows are in `node tools/sim.js --wild --seed 1`.

- [ ] **M-10 · Tune the starter kit against magic/rare enemies** — `Status: Planned` · `Size: S` · `js/data.js`, tutorial/forge flow
  A starter without the tutorial Fire weapon loses to magic/rare foes. Decide whether that is intended.
  **Done:** `node tools/sim.js --fresh --exped 6` shows an intentional win curve; README/todo notes the decision.
  Seed 1 (`node tools/sim.js --rarity --seed 1`, smart, Heat 0): the starter wins 84% vs magic and 61% vs rare regulars (both `RARE_HARD`). Its wild creatures are a harder first test: in the woods' own row (`--wild --seed 1`, smart, native) the starter wins 95% / 67% / 30% at Heat 0 / 3 / 5, Δ −5 / −23 / −31 points against the woods regulars. Seed 1 `--fresh --exped 6`: 2 of 6 expeditions won; the Gnarlhorn figure from the earlier note is not reproduced by the seed-1 runs, so it is dropped.

- [ ] **M-11 · Fix the Rift master's affixes and stat band** — `Status: Planned` · `Size: S` · `js/battle.js`, `js/monsters.js`
  `startBattle` skips the affix block for every boss (`js/battle.js:17`), so the Rift master — rolled as a rare with three affixes and its stats already divided by the rare multiplier — fights with no affixes at about 1.2× the region's HP band. Seed 1 (`node tools/sim.js --wild --seed 1`, Rift section, native master, smart, 8 seeds × 2 depths): every `*/spire` kit wins 100% in every biome and depth. Melee, staff and stacked kits take 3.4–11.9 turns and are `TOO_EASY` in 8/8 cells at depth 1 (7/8, 7/8, 8/8 at depth 3); the defensive kit takes 7.8–19.4 turns, `TOO_EASY` 4/8 at depth 1 and 0/8 at depth 3. The master's own affixes (the forced `passive` rows) make the defensive kit a real fight: its mean win falls to about 50% at depth 3 (the eight cells range from 0% to 100%). Either let a boss with `gen` apply its own affixes, or keep bosses affix-free and stop dividing their stats by the rare multiplier.
  **Done:** the master is a real fight (`node tools/sim.js --wild --seed 1`: no `TOO_EASY` at depth 1 with a `*/spire` kit, smart play wins over 90%); the master's stats and affixes match the roll it was built from; the sim's native row agrees with the forced rows. Seed 1 today fails the first clause (the melee, staff and stacked kits are `TOO_EASY` at depth 1).

- [ ] **M-12 · Give the wild creatures a fight of their own** — `Status: Planned` · `Size: M` · `js/monsters.js`
  The wild creatures are meant to be a fight, not a free win, but with their own region's kit every one of them still wins 100% at Heat 0. Seed 1 (`node tools/sim.js --wild --seed 1`, smart, native, Heat 0; Δ is against the same zone's regulars, win points / turns / HP points): woods `melee/woods` 1.9 turns, 95% HP left, Δ +0.26 / −2, 10 of 10 creatures `TOO_EASY`; pass `melee/pass` 3.9 turns, 88%, Δ +0.18 / −6, 4 of 10 `TOO_EASY`; hollow `melee/hollow` 4.9 turns, 85%, Δ +0.56 / −3, 3 of 10; spire `melee/spire` 5.2 turns, 97%, Δ +1.29 / −3, 0 of 10. Against the spire's wild creatures, one stage behind (`melee/hollow`) costs −1 / −4 points at Heat 3 / 5. The wild creatures take more turns and leave less HP than the regulars, but the win rate stays at 100%. `GEN_T` and the 30% rare share leave a wild creature weaker than a regular of the same zone. Raise the band or the affix load, or give part of the roster a mini-boss profile (see V-16).
  The Rift's wild creatures need the same look (`--wild --seed 1`, Rift section, forced rows): `defensive/spire` is `TOO_HARD` in 53 of 160 cells (basic) and 55 of 160 (passive) with magic affixes, and in 99 of 160 and 107 of 160 with rare ones, at a mean win of 33–36% for the rare rows.
  **Done:** `node tools/sim.js --wild --seed 1` shows the wild creatures as a real fight with a stage kit: with a stage kit, the region's wild creatures take at least the regulars' mean turns and leave no more HP than the regulars (Δ turns ≥ 0, Δ HP ≤ 0, at Heat 0; met by the melee kits above, not by every stage kit: `defensive/pass` −0.7 turns, `staff/hollow` −0.3, `staff/spire` −0.4 turns and +1 HP); at most a third of a region's roster `TOO_EASY` (not met: woods 10 of 10, pass 4 of 10); no essence from wild affixes (holds: a wild creature's affixes drop no essence, `js/battle.js` `!B.intr`). The region's economy does not move.
  **Note (V-22, colours):** the wild creatures' and Rift rolls' body and accent colours changed, but the generator still draws the same number of random values, so the rosters and the seed-1 numbers above are unchanged by it. Re-run after V-22 step 2 (`--wild --seed 1`, Heat 0, smart, native): woods `melee/woods` 1.9 turns / 95% (Δ +0.3 / −2), pass `melee/pass` 3.9 / 88% (Δ +0.2 / −6), hollow `melee/hollow` 4.9 / 85% (Δ +0.6 / −3), spire `melee/spire` 5.1 / 97% (Δ +1.3 / −3). The spire's 5.2 above predates V-22; the same code before V-22 gives 5.1 too. M-09 to M-11 were not re-measured for V-22 and the Rift summary numbers were not compared.

## Data-only variety

- [x] **V-01 · Expand biome part pools from 6 to 8–10** — `Status: Done` · `Size: S` · `js/monsters.js`
  6 parts give 41 distinct 1–3-part sets; 8 give 92, 10 give 175. Add thematic parts per biome.
  **Done:** every biome has 8+ parts; no duplicates; visual spot-check and `smoke` pass.
  **Done (V-01):** all 8 `BIOMES` pools hold 9 distinct parts (129 possible 1–3-part sets each); no pool pairs `hood` with `halo`; no new `tail`, `blade`, `axe`, `staff` or `tusks` were added.
  `node tools/part-check.js` renders every biome × body × part (360 renders, 0 problems), `node tools/map-check.js` passes, and the visual sheets (`node tools/parts-preview.js`, `node tools/parts-combos.js`) show the new parts on every body.
  `node tools/smoke.js` passes.
  **Note (seeded rosters):** M-01 and V-01 re-rolled every seeded wild creature and Rift region (the part loop draws a variable number of times). The M-04 numbers predate this; the seed-1 values in M-09 to M-12 are the current ones.

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

- [ ] **V-11 · Add per-biome special pools** — `Status: Planned` · `Size: M` · `js/monsters.js` · `Depends: V-14 (soft)`
  Add `B.sp` (or `BIOME_SP`) with 2–3 signature specials per biome, falling back to `GEN_SP`.
  **Done:** no biome relies only on the shared six; names/tells translated; sim passes.

## Code variety

- [x] **V-12 · Make part pools body-aware** — `Status: Done` · `Size: S` · `js/monsters.js`, `js/art/`
  Add a body→allowed-parts table. Weapons on humanoid/construct, tusks/antlers on beasts, halo/wings on appropriate bodies. Also stop `tail` silently disappearing on bodies without a tail anchor.
  **Done:** every generated creature draws its intended part count; no missing-anchor no-ops; screenshots checked.
  **Done (V-12):** `BODY_PARTS` in `js/monsters.js` lists the parts each body can wear (anchors from `js/art/bodies.js`); `genCreature` draws only from the biome's parts that its body allows, so `tail` is beast-only. A body with fewer than three usable parts draws what it can (no combo is short after the elemental list was widened). A headless check over 24,000 generated creatures (every biome × body) found no part without its anchor and no part outside the table; part counts are uniform over 1–3. Screenshots not taken.

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

- [ ] **V-18 · Add multi-enemy encounters** — `Status: Planned` · `Size: XL` · `js/battle.js`, `js/render/`, `js/state.js`, `js/map.js` · `Depends: V-17`
  Support 2–3 foes with targeting, turn order, AoE abilities, pack-aware affixes and saves.
  **Done:** packs work in normal/daily/Rift; UI and save shape updated; sim policies updated.

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

- [x] **V-22 · Visual readability rules for enemies** — `Status: Done` · `Size: M` · `js/art/color.js`, `js/art/affixes.js`, `js/art/creature.js`, `js/monsters.js`, `js/data.js`, `js/render/battle-view.js`, `tools/color-check.js`
  One visual feature per meaning: body hue = element (`ELPAL` light/mid/dark, a creature rolls one), accent = biome (`BIOMES.acc`, two per biome, distinct between biomes), pattern and parts = biome variety, ring = rank, affix = fixed spot and shape, status = tint plus a fixed corner badge.
  Biome accents: forest `#b5b04a` `#6e8a3a`, tundra `#f4fbff` `#bfe0ea`, ember `#ff8a3d` `#ff5a1f`, astral `#f6d36b` `#fff3c4`, fen `#4d5a2a` `#2e3420`, ash `#4a4643` `#8a847c`, bone `#e4dccb` `#c9b48a`, deep `#3ff0ff` `#7fe8ff`.
  Affix spots: elemental affixes are one tattoo each on the flank or chest (fire flame, ice snowflake, poison skull-drop, holy sun, shadow crescent eye, arcane rune circle; about 30% of the body width, side by side for two (0.8 scale), a triangle for three (0.75 scale), in the element's light shade with a dark outline, a dark disc under them, and a soft glow ring that pulses behind each emblem (the emblem itself stays at full strength); `BODY` anchor `a.tt`); defence on the body (iron plates on the shoulders and upper back, ward hexagon, regen cross on the upper body, thorn spikes at the sides); aggression on the head (frenzy eyes and steam, vamp fangs and drip); on-death cracks (boom low on the body, split seam down the middle); movement behind or under (swift lines, swiftfoot dust at the feet, elusive afterimage).
  Statuses: stun (stars circle the head), weak (desaturated body, down-arrow badge; enemy weakness is `B.shred`, the armour break), bleed (red drops, drop badge), shield (solid bright ring; `B.wd`, the warded pool). Each status keeps its own badge slot in the bottom-right corner.
  **Tattoos and spots (later V-22 step):** body patterns are drawn at most at opacity .35 so they do not compete with the tattoos; the spots pattern is gone from `PAT` and from every biome and hand-made enemy (forest and fen now use bands and scales, the stag scales, the briarling stripes, the brimstone facets); the elemental particle marks are removed. `node tools/sim.js --wild --seed 1` gives the same numbers as before the change (the pattern lists change only which pattern a seeded creature rolls, not the random draws).
  **Done:** `node tools/color-check.js` passes (45 element pairs at dE 20 or more; 112 biome accent pairs at 10 or more; 701 generated and Rift creature accents plus the hand-made enemies at dE 25 or more). `node tools/run-checks.js` 14/14, including `affix-check` and `smoke`. `node tools/part-check.js` 360 renders, 0 problems. `node tools/parts-preview.js` and `parts-combos.js` render with no page errors. `node tools/sim.js --wild --seed 1` (wild rows) re-run: the seed-1 numbers are unchanged, see the note under M-12.
  **Deviations:** no water or steam element palette (neither is an enemy element; V-20 covers them). The shield status uses the enemy's ward pool, so a warded foe shows both the ward hexagon and the ring.

## Parallelization

### Safe to run in parallel now

| Lane | Tasks | Owns |
|---|---|---|
| **World data** | V-03, V-04 (batch the data-only biome tasks, see the serialization rule) | `js/monsters.js` |
| **Balance research** | M-09, M-10 (measure first; code changes touch `data.js`/`affix.js`) | `js/affix.js`, balance tables |
| **Rift master and wild band** | M-11 → M-12 → V-16, one lane in that order (all three change the rarity/band/boss logic in `genCreature`; measure M-12 after M-11 lands) | `js/battle.js` (M-11), then `js/monsters.js` |

### Second wave

- **V-12 → V-02** — body-aware parts first, then use the orphan parts.
- **V-13, V-10** — all `js/monsters.js`, so serialize with the world-data lane.
- **V-05 … V-09** — five new biomes; same file, so one owner or one at a time.
- **V-14** — new special kinds; touches `battle.js`, `monsters.js`, `data.js`, `lang/`.
- **M-08** — Steam essence sources; `data.js` + `map.js` + `encounters.js`.

### Third wave / dependent

- **V-11 ← V-14 (soft)** if the biome specials use new kinds; otherwise V-11 can go in wave two using existing kinds.
- **M-05 ← V-11** — Rift-biome identity needs the per-biome special pools.
- **M-06 ← M-05 + M-04** — promoting a biome needs its identity and simulator coverage.
- **M-07 ← M-06** for the first new boss; the remaining elements can be separate tasks later.
- **V-15 ← V-14** — biome modifiers reuse combat hooks.
- **V-21 ← V-15** — Rift depth modifiers should reuse the modifier framework.
- **V-17 ← V-14 (soft)** if roles use the new special kinds.
- **V-18 ← V-17** — packs are much easier once roles exist.
- **V-19** — factions can start after roles; touches the same files as the world-data lane.
- **V-20** — wait until biome and data churn settles.

### Must be serialized

- **All `js/monsters.js` changes** — V-02/V-03/V-04, V-05–V-09, V-10–V-13, V-16, V-19, V-20, plus parts of M-05/M-06/M-08/M-11/M-12/V-14/V-17/V-21.
- **Every `BIOMES`, `GEN_*` or `RIFT_*` change re-rolls the seeded rosters.** Batch data-only biome tasks (V-03, V-04, V-13, V-02) where possible, and re-run `node tools/sim.js --wild --seed 1` after each merge.
- **All `js/data.js` changes** — or assign one data steward and split by clearly separate sections (enemies vs balance vs biomes).
- **V-18 multi-enemy packs** — effectively a solo lane; it rewrites the core battle shape.

### Practical parallel plan

1. **Worker A:** V-03 → V-04 → V-12 → V-02 (biome data first, then `sim.js --wild --seed 1` after each merge)
2. **Worker B:** M-09 → M-10 → M-11 → M-12 → V-16 (the Rift master and wild band lane; `js/battle.js` first, then `js/monsters.js`)
3. **Worker C:** M-08 (Steam essence sources, data content only)
4. **Worker D:** V-14 → V-15 → V-21 (combat mechanics)

Then serialize **V-05–V-09** under Worker A, **M-06/M-07** under Worker C, and **V-11/M-05/V-17/V-19/V-20** after the relevant prerequisites. Keep **V-18** for a dedicated branch.

---

## UI

- [x] **U-01 · Grade pips and rarity frames** — `Status: Done` · `Size: S` · `js/art/items.js`, `js/helpers.js`, `js/render/`, `js/gear.js`, `js/hero.js`, `css/styles.css`, `js/lang/`
  Every essence and basic material shows its grade as five pips in the art (filled = grade; Plain is 3 and has no grade field, so `itemGrade` in `helpers.js` reads it as 3). The grade colour (new metal ramp: Faint, Lesser, Plain, Greater, Pure) is on the pips only; Pure's pips glow (off under reduced motion). The frame and stripe are rarity's, the name takes the rarity colour, and the grade ring and grade frame are gone. Removed the Roman-numeral grade badges in the satchel list and the forge tiles. Gear's grade row reads "Greater (4/5)" with `×1.4`; item lines read the same. Hero trim is rarity's (gear is never graded). Satchel help now says the pips show the grade (en, de, ko).
  **Done:** `node tools/i18n-check.js` and `node tools/run-checks.js` pass (13/13). Rendered each grade of `ess_Fire` and `golem_core` to SVG and a screenshot sheet: 1 to 5 pips read clearly on the satchel tile.

## Crafting rework (`plan-crafting-rework.md`)

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

# Everforge — backlog and status

The status index for scoped work. Open tasks are below; implementation evidence for finished work is in [Completed backlog](backlog-completed.md). [Ideas and playtest watchlist](todo.md) holds undecided ideas and observations, not a second task queue.

## At a glance

**56 tasks · 49 Done · 1 In Progress · 0 Implement · 6 Planned · 7 open.**

| Workstream | Done | In Progress | Implement | Planned |
|---|---:|---:|---:|---:|
| Monster coverage, balance and progression (M) | 12 | 0 | 0 | 0 |
| Biome variety and mechanics (V) | 15 | 1 | 0 | 6 |
| Art identity and readability (A) | 5 | 0 | 0 | 0 |
| UI (U) | 9 | 0 | 0 | 0 |
| Crafting rework (C) | 8 | 0 | 0 | 0 |
| **Total** | **49** | **1** | **0** | **6** |

**Statuses:** `Planned` = scoped backlog, not started; `Implement` = detailed implementation plan exists; `In Progress` = actively underway; `Done` = completed, with evidence in the archive. Dependencies are stated on task cards; Planned does not necessarily mean ready to start.

**Sizes:** XS tiny · S small · M medium · L large · XL refactor/multi-day. Art priorities are review recommendations, not active assignments. Preserve task IDs when moving or closing work; update this overview when statuses change.

## Suggested next work

| Focus | Tasks | Next step |
|---|---|---|
| Balance with an existing plan | M-09 complete | See [completed evidence](backlog-completed.md#m-09). |
| Starter progression | M-10 complete | See [completed evidence](backlog-completed.md#m-10). |
| Creature art and readability | A-01–A-05 complete | See [completed evidence](backlog-completed.md#creature-art-and-readability) and [visual review sheets](art-evidence/README.md). |
| Regional wilds and alphas | M-12, V-16 complete | See completed evidence; Hollow melee alpha fights retain a SLOG limitation. |
| Essence availability | M-08 complete | The Cursed Altar can return Steam; see [completed evidence](backlog-completed.md#m-08). |
| Later gameplay expansion | V-06–V-10 | Add four more Rift biomes and increase generated roster size. |

Navigation: [UI](#ui-simplification) · [Balance](#balance-and-progression) · [Art](#art-identity-and-readability) · [Biome gameplay](#biome-gameplay-and-combat-foundations) · [Expansion](#world-and-roster-expansion) · [Dependencies](#dependencies-and-coordination) · [Completed](backlog-completed.md).

## Measurement freshness

M-09's current seed-7/11 measurements are archived in [completed evidence](backlog-completed.md#m-09). M-12's refreshed baseline and unaccepted candidate are in [balance review](balance-evidence/m12-review.md). Older M-10/M-11 plans and historical measurements may predate V-12/V-02 generated rosters and C-01–C-08 crafting, research and encounter density. Refresh relevant measurements before tuning; record seed, revision, kit, policy and Heat.

## UI simplification

U-02–U-09 are complete. See [Completed UI tasks](backlog-completed.md#ui) for implementation and validation evidence.

## Balance and progression

- [x] **M-08 · Add non-affix sources for Steam essence** — `Status: Done` · `Size: M` · `js/encounters.js` · see [completed evidence](backlog-completed.md#m-08)
  Steam previously came only from the Volatile affix. The existing optional Cursed Altar now includes Steam in its essence rotation: the small blood offering gives one essence for 1 HP, and the larger one gives three consecutive essences for its existing HP cost. The generic reward pool and reward quantity are unchanged.
  **Validation:** `node tools/steam-source-check.js` confirms the altar returns one Steam essence for the small offering. Economy sim before/after (`--econ-only --seed 7 --exped 30`, smart, Heat 0) matched exactly across all four zones for clear/loss, fights, direct and salvage essences, embers, item drops, shops, steps, torch use, XP, and displayed price ranges; see [comparison evidence](economy-evidence/m08-seed7-comparison.json). Smoke and unlock checks passed.

- [x] **M-09 · Rebalance affixed foes and staff kits** — `Status: Done` · `Size: M` · `js/data.js`, `js/affix.js`, `js/map.js`, `js/battle.js`, `js/monsters.js`, `tools/sim.js` · see [completed evidence](backlog-completed.md#m-09)
  On the `4b0ef66` baseline plus M-09 changes, `--rarity --seed 7/11 --n 100` (smart, stage kits, Heat 0/3/5) had weakest wins of 99%/88% at Heat 0/3, 2 starter-only `RARE_HARD` rows and no `SLOG`. `defensive/woods` basic/rare at Heat 5 averaged 28.9/28.8 turns. Final tuning and elite-matrix tradeoff are recorded in the archive.

- [x] **M-10 · Tune the starter kit against magic/rare enemies** — `Status: Done` · `Size: S` · `tools/sim.js`, README/todo
  Decision: tutorial preparation is part of the intended starter progression. The player equips the Fire-infused sword and learns Weaponcraft before exploring. Keep base starter stats unchanged; make `--fresh` start from this tutorial-prepared state with unlock gates still active.
  **Done:** opening curve is intentional. Bare iron-sword baseline on `f01d69c` won 0/6, 0/6, 1/6 expeditions for seeds 1/7/11. With the tutorial Fire sword and Weaponcraft prepared, final code won 6/6 for each seed. Smart policy, Heat 0, six Woods expeditions per seed. Seed 1 `--rarity --kit starter --policy smart --n 100`: magic/rare wins 99%/96% at Heat 0, 91%/79% at Heat 3; one Heat 3 rare row remains `RARE_HARD`. README and todo record the decision and the limit.
  **Validation:** `node -r /tmp/noFonts.js tools/sim.js --fresh --exped 6 --seed 1/7/11`; `node -r /tmp/noFonts.js tools/sim.js --rarity --kit starter --policy smart --seed 1 --n 100`; smoke, i18n, unlock checks passed.

- [x] **M-11 · Fix the Rift master's affixes and stat band** — `Status: Done` · `Size: S` · `js/battle.js`, `js/affix.js`, `js/monsters.js`, `tools/sim.js`, `tools/rift-boss-check.js`
  Generated Rift masters now apply their stored rare rarity and three compatible affixes once in native combat; authored bosses retain their authored behavior. Rift master affix rolls exclude recurring Warded/Regenerating sustain and max-HP Volatile bursts, and do not pair Frenzied with multi-hit or heavy specials. The simulator's forced rare row now uses the same master and deterministic fight stream as native, while forced magic remains a separate what-if.
  **Acceptance:** the master is a real fight (`node tools/sim.js --wild --seed 1`: no `TOO_EASY` at depth 1 with a `*/spire` kit, smart play wins over 90%); the master's stats and affixes match the roll it was built from; the sim's native row agrees with the forced rare row. The historical seed-1 baseline fails the first clause (the melee, staff and stacked kits are `TOO_EASY` at depth 1).

  **Done:** the depth-1 master band is 4.4× HP / 1.0× attack before rare and affix multipliers; the bonus tapers with depth to at least 3.2× HP / 0.95× attack, alongside the region's own tier growth. The four `/spire` kits are all above 90% win in the sample, every biome mean is above 90%, and no depth-1 master row is flagged `TOO_EASY`. Depth-1 kit means: melee 100%, defensive 98.9%, staff 99.8%, stacked 100%. Biome means: deep 97.5%, fen 100%, astral 100%, forest 100%, ember 99.8%, tundra 100%, bone 100%, ash 100%. Native and forced rare results match in all 64 master rows across depths 1 and 3. The regression also checks the exact generated rarity/affix stats and preserves authored boss behavior.

  **Validation evidence:** base revision `6f803be` plus the uncommitted M-11 and parallel V-14 working tree. `node -r /tmp/noFonts.js tools/sim.js --wild --enemy rift_boss --kit spire --policy smart --seed 1 --n 100 --rift-depth 1,3 --no-econ`: 100 fights per cell, smart policy, Heat 0, all four `/spire` kits, eight deterministic biome seeds, depths 1 and 3. Depth-1 master win was 99.7% overall; per-kit and per-biome means above. Depth 3 won 96.5% overall (deep 89%, ash 92.8%, other biomes 97.5–100%); defensive-kit mean was 90.9%. There were no depth-1 `TOO_EASY`/`TOO_HARD` master rows and three `SLOG` rows; depth 3 also had three `SLOG` rows. Native/forced rare displayed win, turn and HP metrics matched in 64/64 master rows. Rift biome seeds: deep 3608050713, fen 3574495475, astral 3675161189, forest 3624828332, ember 3641605951, tundra 3742271665, bone 3033363595, ash 3100474071. `node tools/rift-boss-check.js`, `node tools/affix-check.js`, and `git diff --check` pass. The sample is one explicit simulator seed with 100 fights per cell, not a broad seed sweep.

  <details>
  <summary>Historical measurements — refresh before tuning</summary>

  Historical seed 1 (`node tools/sim.js --wild --seed 1`, Rift section, native master, smart, 8 seeds × 2 depths): every `*/spire` kit wins 100% in every biome and depth. Melee, staff and stacked kits take 3.4–11.9 turns and are `TOO_EASY` in 8/8 cells at depth 1 (7/8, 7/8, 8/8 at depth 3); the defensive kit takes 7.8–19.4 turns, `TOO_EASY` 4/8 at depth 1 and 0/8 at depth 3. The master's own affixes (the forced `passive` rows) make the defensive kit a real fight: its mean win falls to about 50% at depth 3 (the eight cells range from 0% to 100%). Either let a boss with `gen` apply its own affixes, or keep bosses affix-free and stop dividing their stats by the rare multiplier.

  </details>

- [x] **M-12 · Give the wild creatures a fight of their own** — `Status: Done` · `Size: M` · `js/monsters.js`, `js/battle.js`, `tools/sim.js`
  Before M-12, the wild creatures were meant to be a fight, but with their own region's kit every one still won 100% at Heat 0.
  **Acceptance:** `node tools/sim.js --wild --seed 1` shows the wild creatures as a real fight with a stage kit: with a stage kit, the region's wild creatures take at least the regulars' mean turns and leave no more HP than the regulars (Δ turns ≥ 0, Δ HP ≤ 0, at Heat 0; met by the melee kits above, not by every stage kit: `defensive/pass` −0.7 turns, `staff/hollow` −0.3, `staff/spire` −0.4 turns and +1 HP); at most a third of a region's roster `TOO_EASY` (not met: woods 10 of 10, pass 4 of 10); no essence from wild affixes (holds: a wild creature's affixes drop no essence, `js/battle.js` `!B.intr`). The region's economy does not move.

  **Done:** rarity-normalized generator stats stay at the region tier. A combat-only profile strengthens generated nonboss regional wilds at the matching stage-kit Smith level (Woods HP 4.5×; Pass/Hollow/Spire HP 2×; ATK unchanged); the tutorial remains at 1× and Rift foes/M-11 masters are excluded. Two seeded n=100 smart-policy, Heat 0 stage-kit samples meet every turn/HP delta and roster `TOO_EASY` criterion. Results, economy comparison, opening-loop outcomes, and limitations are in [M-12 balance evidence](balance-evidence/m12-review.md).

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

- [x] **M-05 · Give each Rift-only biome a signature identity** — `Status: Done` · `Size: L` · `js/monsters.js`, `js/battle.js`, `js/data.js` · `Depends: V-11`
  Give fen/ash/bone/deep 2–3 thematic specials, an element/drop bias, and one signature trait each instead of only shared `GEN_SP` and Rift drops.
  **Done:** Fen/ash/bone/deep have weighted elements, favored existing drops and signature hit statuses, building on V-11 special pools. Paired seed-1/7 simulations cover depths 1/3/9; focused checks and full suite (26/26) pass. Fen/ash master difficulty changes and depth-9 limits are recorded in [M-05 evidence](rift-evidence/m05-identity.md).

- [x] **V-11 · Add per-biome special pools** — `Status: Done` · `Size: M` · `js/monsters.js`, `js/lang/`, `tools/biome-special-check.js` · `Depends: V-14 (soft)`
  All eight biomes have three translated signature specials for ordinary wild creatures, with `GEN_SP` fallback for unknown biomes and generated Rift masters. Selection consumes the existing single draw; all non-special roster fields and accepted master results remain unchanged.
  **Validation:** updated biome-special and i18n checks pass; full suite passed 24/24. Paired seed-1/7 n=30 reference samples and live modifier coverage are recorded in [V-11 evidence](rift-evidence/v11-biome-specials.md).

- [x] **V-13 · Weight biome elements** — `Status: Done` · `Size: S` · `js/monsters.js`, `tools/element-weight-check.js`
  Optional `elW` maps give each biome weighted common and rare creature elements with uniform fallback. The four M-05 signature Rift rates remain 40% without applying the signature bias twice; ordinary generated-creature drops retain the uniform element selected by the same roll.
  **Validation:** seeded weighted distributions, one-draw budget, uniform fallback, repeated rosters, and daily pre-roll determinism pass. Paired n=30 seeds 1/7, Heat 0, smart-policy simulator samples are archived in [V-13 evidence](rift-evidence/v13-element-weights.md). The integrated suite reported 27/28 before the parent fixed a V-14 assertion that rejected Fen additions; its focused rerun passed. The full suite was not rerun after that test-only fix.

- [x] **V-14 · Add new enemy special kinds** — `Status: Done` · `Size: M` · `js/battle.js`, `js/data.js`, `js/render/battle-view.js`, `js/sheets.js`, `js/lang/`
  Add `guard` (temporary ward), `inflict` (guaranteed status), `enrage` (Attack up below half HP), `burrow` (untargetable for one turn), and `summon` (calls a weaker wild creature).
  **Done:** Rune Aegis gives the Stone Golem a 20%-max-HP ward for two player actions; it refreshes to its cap, does not stack, and is separate from affix wards. Poisoned Edge guarantees poison after a landed Woods Bandit hit; Guard blocks it, Parry interrupts it, and status resistance shortens its duration. Rimehide Bear enrages once below half HP for a permanent +30% Attack. Mossback Stag burrows for one player action, cannot be hit, then surfaces at the start of its next enemy turn. Storm Harpy calls one weaker Squall Spirit for a single 0.65× strike. Added intent tells, active-state HUD chips, effect-specific Codex text and German/Korean strings. The generated Rift special pool is unchanged; the common opening Boar retains its original charge so the Parry lesson remains available.
  **Validation:** `node tools/special-check.js`, `node tools/guard-check.js`, `node tools/unlock-check.js`, `node tools/smoke.js`, `node tools/i18n-check.js`, `node tools/sim.js`, and `node tools/run-checks.js`; durable mobile captures, the focused regression output and full simulator output are archived in [combat evidence](combat-evidence/v14-specials.md).

- [x] **V-15 · Add biome modifiers to the map** — `Status: Done` · `Size: L` · `js/map.js`, `js/battle.js`, `js/data.js` · `Depends: V-14`
  One passive per biome: poison fog (fen), chill (tundra), burn (ember), arcane surges (astral), sandstorm (ash), fear (bone), drowning pressure (deep).
  **Done:** the Rift's seeded biome determines its passive; forest is the neutral eighth biome. Fen Poison adds one mild stack, Tundra Chill and Ember Burn last up to two turns, Astral adds 25% Arcane attack power every third enemy turn, Ash reduces player damage by 20% every third player turn, Bone causes one recoverable off-balance action after an unguarded hit, and Deep deals 4% max-HP pressure every third enemy turn even through Guard, Parry, or Stun. The active passive appears in the battle HUD and Codex. Biome statuses merge with daily/status effects by keeping the longer duration and strongest damage; Poison still respects its stack cap, resistance shortens guaranteed status, Guard blocks statuses, and successful Parry interrupts telegraphed special hits. Daily Cinder strengthens the single merged Burn instead of adding a duplicate.
  **Acceptance:** modifiers are visible in UI/Codex, seeded, and have documented stacking rules with daily twists.
  **Validation:** `node tools/biome-check.js`, `node tools/map-check.js` (240 seeds), `node tools/run-checks.js` (22/22), and `node tools/i18n-check.js` pass. Paired simulator runs used HEAD `2c9b1a0` with the uncommitted M-12 review candidate, `--wild --n 100 --seed 1 --heat 0 --policy smart --rift-seeds 1,7 --rift-depth 1,3 --jobs 2`, once live and once with `--no-biome-mods`. Seeds 1/7 map to deep/ember (Rift seeds 3608050713/3641605951); each of four spire kits was sampled at depths 1/3, 100 fights per cell. Native Rift-master mean wins: deep 83.5% live vs 93.3% reference; ember 95.2% vs 98.8%. The biome check covers every passive; the paired sim is a two-biome sample, not a full balance sweep. Deep pressure remains the largest measured difficulty change: defensive/spire wins 55% vs 91% at depth 1 and 27% vs 64% at depth 3.

  **All-biome impact sample:** the automatic seeded Rift fixture set covered all eight biomes at depth 1 (`--wild --n 25 --seed 1 --heat 0 --policy smart --rift-depth 1 --rift-wild --jobs 4`), live and again with `--no-biome-mods`. Under the same uncommitted M-12 review candidate, native Rift-master rows averaged 97.5% wins live vs 99.9% reference (32 cells, 25 fights each); native Rift-wild rows averaged 99.7% vs 99.8% (320 cells, 25 fights each). This is one seed/depth impact sample, not a balance sweep; JSON and logs are archived in [V-15 evidence](rift-evidence/v15-biome-modifiers.md). The M-12 candidate remains unaccepted and In Progress.

- [x] **V-21 · Add seeded Rift depth modifiers** — `Status: Done` · `Size: M` · `js/data.js`, `js/battle.js`, `js/render/battle-view.js`, `js/sheets.js`, `tools/sim.js` · `Depends: V-15`
  Rift seed and depth select Burning air, Thin wards, or Fast foes deterministically without consuming RNG draws. The selected effect appears in the battle HUD, Rift card, and Codex; V-15 biome passives remain independently active.
  **Done:** `node tools/depth-check.js`, `node tools/biome-check.js`, `node tools/i18n-check.js`, and `node tools/run-checks.js` pass (23/23). Paired modifier-on/off samples and their M-12 candidate caveat are recorded in [V-21 evidence](rift-evidence/v21-depth-modifiers.md).

## World and roster expansion

- [x] **M-06 · Promote Fen to a full region** — `Status: Done` · `Size: XL` · `js/data.js`, `js/monsters.js`, `js/map.js`, `js/audio.js`, `lang/` · `Depends: M-04, M-05`
  Add a `ZONES` entry, unlock gate, six authored regulars, a boss, map palette, music, quest intro, and translations.
  **Done:** Chose Fen, reusing the established Rift biome identity. Added the gated full-region progression, six authored regulars and the Fen Matriarch boss, dedicated palette and music, Fen quest intro, and English/German/Korean strings. Authored Fen enemies are not mislabeled as generated; the drowned guard uses the supported Shadow affinity. Old saves migrate safely without a schema change, retain the v18 save key, and prune Codex entries only after the roster exists. The Fen intro and boss victory unlock flow are covered end-to-end.
  **Validation:** `node tools/fen-region-check.js`, `node tools/smoke.js` (SMOKE OK), `node tools/map-check.js`, `node tools/audio-check.js`, `node tools/i18n-check.js`, syntax checks, and `git diff --check` pass. A scoped seed-1, Heat 0, smart-policy simulator sample at the Spire-stage kit ran 20 fights for each of six Fen regulars and the boss; all seven rows won 100%, with no TOO_HARD or SLOG flags. Three regulars (Reedstalker, Mire Witch, Murk Wisp) were flagged TOO_EASY in this arrival-kit sample; see JSON and console output in [Fen region evidence](region-evidence/m06-fen-sim-seed1.json). The focused check also verifies Fen and Rift Codex records, wins, journal, depth and seed survive a real save reload. No save shape changed, so no key bump was needed. The full suite was not rerun after the parent’s V-14 assertion fix; its focused rerun passed.

- [x] **M-07 · Boss coverage for missing elements** — `Status: Done` · `Size: L` · `js/data.js`, `js/lang/de-data.js`, `js/lang/ko-data.js`, `tools/boss-element-check.js` · `Depends: M-06`
  **Done:** Added six playable boss forms through five existing authored bosses: Fen Matriarch first form (Poison), Gnarlhorn phase (Stone), Rimeclaw phase (Shadow), Phoenix phase (Holy), Archon phase (Arcane), and Fen Matriarch phase (Metal). The Archon's former Shadow phase became Arcane; Shadow has a playable phase on Rimeclaw. Each second form has its own translated tell/special, affinity, weaknesses, and resistances. Existing phase, Codex, and save fields handle transitions; progression gates, save schema, and generation draws are unchanged.
  **Validation:** `node tools/boss-element-check.js`, `node tools/i18n-check.js`, and `node tools/fen-region-check.js` pass. The focused check drives each phase threshold, checks the phase affinity/special/Codex fact and regional boss mapping, and reloads a saved Rimeclaw second form. Seed-1, Heat 0, smart-policy simulations ran 20 fights per boss at each matching region-stage kit; all cells won 20/20. Gnarlhorn, Rimeclaw, and Archon have `TOO_EASY` on-stage flags in the sample; results and JSON/text logs are in [M-07 evidence](rift-evidence/m07-boss-elements.md). [Mobile phase screenshot](rift-evidence/m07-boss-phase-mobile.png). V-05 updated the Rift coverage check to derive the biome count; the integrated full suite subsequently passed 30/30.

- [x] **V-05 · Add a Tidewrack coast biome** — `Status: Done` · `Size: M` · `js/monsters.js`, `js/lang/de.js`, `js/lang/ko.js`, `tools/tidewrack-check.js`
  Elements ice/poison/shadow/swift; bodies beast/undead/elemental/humanoid; parts shell/frost/tail/vines/hood/crystals; names such as "The Drowned Coast", "Saltwind Cliffs", "The Tidewrack".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.
  **Done:** Added the ninth Rift biome, Tidewrack, with existing elements/bodies/parts, a marine palette, coast regions and compatible names/lore. Added 3:1 common/rare element weighting and three translated V-11-compatible specials while preserving the existing selection draw. No new element family, authored region, or roster-size change.
  **Validation:** Tidewrack generator/name/attachment/browser coverage and mobile screenshots, all-biome name/part/color/element/map checks, V-11 special, V-15 biome, Rift-master and i18n checks pass. The full suite passed 30/30, including smoke. Paired modifier-free seed-1/7 smart Heat 0 n=30 depth-1 Rift samples cover all nine biomes: Tidewrack wins 100% in both; broad Rift-wild means are 98% and 96%. Existing `TOO_EASY` flags remain in the Rift-masters' wild rows, and Tidewrack's Drowned Wraith defensive/Spire native row is `SLOG` at 59.6/59.4 turns. The added biome changes the seed-to-biome denominator, so these are coverage/balance samples rather than exact same-seed parity. Commands, source fingerprints, raw logs, and visual evidence are in [V-05 evidence](rift-evidence/v05-tidewrack.md).

- [x] **V-06 · Add a Windcut crags biome** — `Status: Done` · `Size: M` · `js/monsters.js` · see [completed evidence](backlog-completed.md#v-06--windcut-crags)
  Elements stone/metal/swift/arcane; bodies beast/humanoid/construct/elemental; parts armor/horns/chains/crystals/wings/tail; names such as "The Windcut Crags", "The Iron Highlands", "The Skyward Pass".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.
  **Done:** Added Windcut as a generated Rift biome with the specified existing elements, bodies and attachable parts; a weighted 3:3:3:1 element pool; themed translated regions/lore; and three translated V-11-compatible specials using existing combat kinds. No family, authored region or roster slot was added.
  **Validation:** deterministic pool/roster/name/special and 390×844 map/battle checks pass. Paired seed-1/7 smart Heat 0 n=30 stage-kit matrices cover depths 1 and 3 for all 11 current biomes, including Windcut and Garden. `node tools/run-checks.js` passed 32/32, including smoke. Raw outputs, baselines, screenshots and observed difficulty flags are in [V-06 evidence](rift-evidence/v06-windcut.md).

- [x] **V-07 · Add a Radiant garden biome** — `Status: Done` · `Size: M` · `js/monsters.js` · see [completed evidence](backlog-completed.md#v-07--radiant-garden)
  Elements holy/wood/poison/swift; bodies beast/humanoid/elemental/undead; parts antlers/vines/halo/wings/crown/mane; names such as "The Sunken Garden", "The Gilded Grove", "The Orchard of Bones".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.
  **Done:** Added Radiant Garden with the specified existing elements, bodies and attachable parts, 3:3:1:1 weighted elements, a floral palette, translated regions/lore, and three translated V-11-compatible specials. No new family, authored region or roster slot was added.
  **Validation:** Seeded roster, name/attachment, special translation and 390×844 map/battle checks pass. Color, biome-neutrality, i18n and focused Garden checks pass; `node tools/run-checks.js` passed 32/32 including smoke. Paired seed-1/7 smart Heat 0 n=30 samples cover depths 1/3 for all 11 biomes with modifiers disabled; Garden master rows won 99%. Broad Rift-wild matrices retain many `TOO_EASY` flags and a few `TOO_HARD` depth-3 cells. The expanded selector remaps seeds, so these are coverage samples, not exact same-seed parity. See [V-07 evidence](rift-evidence/v07-garden.md) and [raw integrated runs](rift-evidence/v06-integrated-seed1.json).

- [ ] **V-08 · Add a Geyser field biome** — `Status: In Progress` · `Size: M` · `js/monsters.js`
  Elements fire/ice/stone/arcane; bodies elemental/construct/beast/humanoid; parts flames/frost/crystals/armor/horns/runes; names such as "The Steam Vents", "The Boiling Shelf", "The White Caldera".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-09 · Add a Sporewood biome** — `Status: Planned` · `Size: M` · `js/monsters.js`
  Elements poison/wood/shadow/holy; bodies undead/beast/elemental/humanoid; parts vines/hood/mane/tail/horns/crystals; names such as "The Sporewood", "The Hollow Bloom", "The Weeping Canopy".
  **Acceptance:** biome appears in `RIFT_BIOMES`; generated creatures render; sim sample passes.

- [ ] **V-10 · Increase seeded roster size** — `Status: Planned` · `Size: S` · `js/monsters.js`
  Raise `GEN_N` from 10 to 12–14 and `RIFT_N` if needed; retune wild encounter weight so they stay ~40% of encounters.
  **Acceptance:** more variety per region without changing overall encounter mix; `sim` and `map-check` pass.

- [x] **V-16 · Add one alpha wild creature per roster** — `Status: Done` · `Size: M` · `js/monsters.js`, `js/art/`
  A deterministic mini-boss variant: three affixes, boosted stats, unique name, distinct map frame, defined rewards without shifting regional economy.
  **Done:** exactly one deterministic promoted alpha in each of four authored regions; Rift rosters are excluded. Fixed compatible affixes, boosts and mobile marker are verified. Reward tables/weight and intrinsic essence suppression stay unchanged; the generic economy sim does not exercise alphas. Stage kits win 100% on seeds 1/7; Hollow melee retains a 34-turn `SLOG`. See [V-16 evidence](art-evidence/v16-alpha-review.md).

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
| M-12 → V-16 | Measure wild bands after master/rarity fixes; add alphas after the band is intentional. |
| V-14 → V-15 → V-21 | Map and depth modifiers build on the combat hooks. |
| V-11 → M-05 → M-06 → M-07 | Biome specials establish identity before promotion and new-region bosses. M-04 is already complete. |
| V-14 → V-11 or V-17, when needed | Soft dependency only: existing special kinds can support an earlier implementation. |
| V-17 → V-18 | Roles precede multi-enemy targeting and turn-order work. |
| A-01 ↔ A-04; A-01–A-04 → final A-05 pass | Keep anatomy and noun mappings consistent; apply readability criteria throughout. |
| A-03 → visual treatment for new biomes | Recommended sequencing for V-05–V-09 and M-06, not a combat prerequisite. |

- Coordinate all edits to `js/monsters.js`: art bodies/names, biome data, roster balance and new mechanics share the generator. Changes to pools or random draws can reroll names, parts, affixes and stats; palette-only edits need not do so. Re-run `node tools/sim.js --wild --seed 1` after generator changes and record the new baseline.
- Coordinate edits to `js/data.js` across balance, progression and authored creature art. A-02 equipment art and A-03 terrain art can otherwise be developed independently, with integration review for shared files.
- V-19 factions and V-20 Water/Steam families should follow the relevant generator/combat decisions. Reserve V-18 for a dedicated implementation effort because it changes battle and save structure.
- M-09's plan contains historical investigation; its context section identifies landed prerequisites. Completed element coverage, biome parts and crafting work are recorded in [Completed backlog](backlog-completed.md); save validation and simulator behavior are documented in [README.md](README.md). Current statuses live here.

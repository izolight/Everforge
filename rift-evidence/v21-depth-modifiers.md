# V-21 · Seeded Rift depth modifiers

## Rules and interaction

A Rift battle derives one depth modifier from the saved Rift seed and one-based depth: `hash("rift-depth:" + seed + ":" + depth) % 3`. The same seed/depth pair always resolves to the same effect. Selection uses no `Math.random` draw and does not change region, roster, or combat RNG streams. The effect is stored on a new battle and can be re-derived for older active Rift saves; no save version or save shape change is needed. Non-Rift battles have no depth modifier. `startBattle(id, {depthMods:false})` disables only this layer for reference simulations; V-15 biome effects remain independently controlled.

- **Burning air:** Fire attacks deal 15% more damage after the existing attack modifiers. Elemental resistance, Defense, and Guard still apply.
- **Thin wards:** Rune ward absorbs at most half of each hit. Unabsorbed ward points remain available to later hits; damage not covered by the ward follows normal rules.
- **Fast foes:** Enemy special cadence advances by one turn, with a minimum interval of two turns. Existing special tells and Parry handling remain in use.

The depth effect and V-15 biome passive are independent and can both be active in a Rift battle. Each changes only its stated calculation: they do not add duplicate status stacks or overwrite one another. Existing daily twist logic continues through its own battle hooks; currently daily expeditions and the Rift are separate modes. If a future daily twist is applied to a Rift, its existing attack/turn effects compose with the depth rule at the relevant combat hook. The battle log, Rift card, and Codex identify the selected depth effect.

## Validation

- `node tools/depth-check.js`: all deterministic selection, zero-RNG-draw, damage/ward/cadence, independent opt-out, UI discovery, and 390×844 viewport checks pass.
- `node tools/biome-check.js`: V-15 baseline is explicitly run with `depthMods:false`, so its Parry and pressure fixtures stay isolated from V-21 cadence changes.
- `node tools/i18n-check.js`: German and Korean keys pass.
- `node tools/run-checks.js`: 23/23 checks pass; full output is recorded in `v21-full-checks.log`.
- Mobile evidence: `v21-battle-mobile.png`, `v21-rift-card-mobile.png`, `v21-codex-mobile.png`.

## Paired Rift simulation

Both runs used `node tools/sim.js --wild --n 10 --heat 0 --policy smart --seed 1 --rift-depth 1,2,3,4 --rift-wild --no-biome-mods --jobs 4`; the reference added `--no-depth-mods`. This leaves biome passives disabled in both rows to isolate V-21. The automatic fixture covered eight biome seeds and depths 1–4; all three depth effects appeared. Each output contains 32 seed/depth rows, 128 native master cells, and 1,280 native Rift-wild cells (10 repetitions per cell).

| Native sample average | Depth modifier on | Reference off |
|---|---:|---:|
| Rift masters: wins / turns / player HP remaining | 95.0% / 26.08 / 59.7% | 96.5% / 26.09 / 60.1% |
| Rift wilds: wins / turns / player HP remaining | 97.6% / 9.57 / 81.9% | 97.9% / 9.35 / 83.1% |

These are small paired diagnostic samples, not balance acceptance. Both runs used `fcdfaa1` plus the frozen but unaccepted M-12 candidate: 1.0× authored nonboss generator stats, with level-aware HP scaling (4.5× Woods / 2× Pass-Hollow-Spire) applied only to authored nonboss, non-Rift foes. The M-12 battle helper excludes Rift foes, so its candidate leaves this paired Rift sample unchanged. M-12 remains In Progress; these figures are not an accepted M-12 baseline. Raw outputs: `v21-sim-live.json` / `.txt` and `v21-sim-reference.json` / `.txt`.

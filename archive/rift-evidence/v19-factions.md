# V-19 · Cross-biome factions

## Implementation

Added four shared factions: Raiders, Cultists, Cult of the Star, and Constructs. Authored faction tags span multiple regions; generated enemies inherit the faction paired with their V-17 role. Each faction selects from its signature special kinds intersected with the role-compatible kinds, preferring the active biome pool and falling back to shared specials. Selection reuses the existing single special RNG draw. Faction names, descriptions, symbols, and colors appear in the battle HUD and Codex. The tag does not add drops or alter rewards, save shape, map generation, alpha count, Rift masters, or V-10 encounter weights.

The mobile browser check uses a 320px viewport and verifies the battle badge/mark and translated Codex row. The reviewed capture is [v19-faction-mobile.png](../combat-evidence/v19-faction-mobile.png). Authored and generated membership, role/special compatibility, multi-biome distribution, deterministic generation, and UI coverage are checked by `tools/faction-check.js`; the pure model invariants are in `tools/faction-model-check.js`. `tools/biome-special-check.js` permits the new metadata while retaining checks on the existing roster fields.

## Validation

- `node tools/faction-model-check.js` and `node tools/faction-check.js` passed.
- `node tools/biome-special-check.js`, `node tools/name-check.js`, `node tools/part-check.js`, `node tools/color-check.js`, and `node tools/i18n-check.js` passed.
- Final integrated `node tools/run-checks.js` passed **40/40**, including smoke.
- `git diff --check` passed.

The seeded faction check covers generated role-compatible special assignment and all 13 current Rift biomes. It verifies each faction appears in multiple biomes and the authored tags cross regions. Faction signature selection is additionally model-checked for every role, including themed selection, fallback, and one-draw consumption. No extra random draw is introduced.

## Paired measurements

Reference revision: V-17 commit `6cfdc0e90da79f45bd5016b0efb9cb9fcd4743e6`. Reference outputs are `balance-evidence/v17-role-seed1.json`, `balance-evidence/v17-role-seed7.json`, and the matching `v17-role-econ` files. The V-19 candidate was measured on that source base with the V-19 changes below; the working tree is intentionally uncommitted.

Combat command for each of seeds 1 and 7:

```sh
node tools/sim.js --wild --n 30 --heat 0 --policy smart --seed SEED --rift-seeds 1,7 --rift-depth 1,3,9 --no-biome-mods --no-depth-mods --jobs 4 --out rift-evidence/v19-factions-seedSEED.json
```

Each output contains 1,801 cells: all simulator kits and wild rarities, plus Rift master/wild rows at depths 1/3/9. Both seeds use smart policy and Heat 0; biome and depth modifiers are disabled for comparison. For both seeds, paired row combat metrics/flags and Rift results equal the V-17 references. Aggregate wild flags are seed 1: 57 `TOO_EASY`, 31 `SLOG`, 2 `TOO_HARD`; seed 7: 54 `TOO_EASY`, 33 `SLOG`, 2 `TOO_HARD`. These existing difficulty findings remain; faction work does not tune simulator flags or kits.

Economy used `node tools/sim.js --econ-only --exped 100 --seed SEED --out balance-evidence/v19-factions-econ-seedSEED.json`, for seeds 1 and 7. All four zone economy aggregates match the paired V-17 samples in these runs, including clears, fights, items, essence and ember yields. This is a finite matched sample, not a guarantee of population-level economy parity. No faction reward rule was introduced.

Raw candidate output: [seed 1 combat JSON](v19-factions-seed1.json), [seed 7 combat JSON](v19-factions-seed7.json), [seed 1 economy JSON](../balance-evidence/v19-factions-econ-seed1.json), and [seed 7 economy JSON](../balance-evidence/v19-factions-econ-seed7.json).

## Frozen candidate fingerprints

SHA-256 fingerprints at the measurement freeze (base revision above):

| File | SHA-256 |
| --- | --- |
| `js/factions.js` | `a00706303794e3cb7ba2352d5d39ab5733d517e348e3b7b95aaf042f90da833b` |
| `js/monsters.js` | `49c7e21fe017a392a97f3937c4e7c141c3d3bbbaef3e20a136348f947a312961` |
| `js/data.js` | `05e825bfdd6c5987f5a5ef53eb1c217ca4feac165bb254faf37768a45fac4b8a` |
| `js/battle.js` | `484d8c18705d1cbea159b933abe6e67208e725bd78fc68bbbdfc1161635c5e3c` |
| `js/render/battle-view.js` | `f85f7f5280bbdd7e68f867e56564acd89e47745855386f5fd209f39e90523249` |
| `js/sheets.js` | `e6c74aee3d9c03ea80124f173e77d37029f8ffcc46859a2367440d82c2ae59a2` |
| `index.html` | `88834b3ec260efceea7aa905b0a47c8101df4e8bf6ac521fd470a154f7e7d079` |

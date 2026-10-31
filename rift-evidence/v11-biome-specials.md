# V-11 · Per-biome special pools

## Rules

Each biome has three signature specials for ordinary wild creatures. All reuse the existing `heavy`, `multi`, `heal`, and `drain` handlers; this adds no special kinds or turn-resolution behavior. If a biome has no registered pool, selection falls back to `GEN_SP`. Generated Rift masters also stay on `GEN_SP` to preserve the accepted M-11 master profile and its compatible rare affixes. V-15 biome passives and V-21 depth modifiers remain active with the selected wild specials.

| Biome | Signature specials |
|---|---|
| Fen | Mire Leech (drain), Silt Snare (heavy), Reedstorm (multi) |
| Ash | Glassfall (heavy), Cinder Shards (multi), Cinder Mend (heal) |
| Bone | Grave Rattle (multi), Ossuary Crush (heavy), Marrow Knit (heal) |
| Deep | Undertow (drain), Pressure Wave (heavy), Rifted Wake (multi) |
| Forest | Briar Flurry (multi), Stag Crash (heavy), Barkskin Mend (heal) |
| Tundra | Rime Volley (multi), Glacier Drop (heavy), Snowdrift Mend (heal) |
| Ember | Kiln Flurry (multi), Foundry Blow (heavy), Coalheart Drain (drain) |
| Astral | Void Leech (drain), Starfall Burst (multi), Starless Crush (heavy) |

Every name and telegraph has German and Korean text. Pool lookup replaces the existing special selection at the same point in `genCreature` and consumes exactly one draw. A deterministic comparison against the shared-pool fallback confirms all other generated roster fields stay identical for the same seed. This keeps names, parts, elements, stats, drops, and affix draws stable while special assignments change.

## Validation

- `node tools/biome-special-check.js`: all eight pools have 2–3 entries; shared fallback works; all names/tells are translated; all four authored region rosters and seeded Rift rosters reproduce without ambient `Math.random`; the special field is the only roster field changed; Rift masters retain three rare affixes and `GEN_SP`; V-15 and V-21 modifiers remain active together.
- `node tools/i18n-check.js`, `node tools/affix-check.js`, `node tools/rift-boss-check.js`, `node tools/special-check.js`, `node tools/depth-check.js`, `node tools/biome-check.js`, and `git diff --check` pass.
- `node tools/run-checks.js`: **24/24**.

## Paired simulation

The pre-pool baseline and final candidate use the frozen M-12 commit `2113694`. Both used Heat 0, smart policy, 30 fights per cell, seeds 1 and 7, depths 1–3, and `--no-biome-mods --no-depth-mods` to isolate V-11. Commands and full JSON/text outputs are in `v11-baseline-seed{1,7}` and `v11-pools-seed{1,7}`.

| Sample | Seed 1 before → after | Seed 7 before → after |
|---|---|---|
| Authored-region native rows (29): win rate | 99.9% → 99.8% | 99.9% → 99.8% |
| Authored-region turns / HP left | 7.68 / 80.3% → 7.47 / 80.3% | 7.68 / 80.2% → 7.49 / 80.1% |
| Rift master native cells (96): win rate | 98.4% → 98.4% | 97.6% → 97.6% |
| Rift master turns / HP left | 25.38 / 62.9% → 25.38 / 62.9% | 25.21 / 63.3% → 25.21 / 63.3% |
| Rift wild native cells (960): win rate | 98.9% → 99.3% | 98.9% → 99.3% |
| Rift wild turns / HP left | 8.61 / 86.9% → 8.52 / 87.0% | 8.60 / 86.9% → 8.51 / 87.1% |

The generated Rift master rows match their pre-pool samples exactly because masters retain `GEN_SP`; ordinary Rift wilds use their biome pool. A separate live seed-1 sample used both V-15 and V-21 modifiers across all eight biomes and depths 1–3 (96 native master cells and 960 wild cells): master wins averaged 94.2%, wild wins 98.5%. This checks modifier/special integration and is not the paired balance comparison. Outputs are `v11-live-seed1.json` and `.txt`.

Two intermediate trials are retained for review: `v11-trial-two-pool-seed{1,7}` and `v11-trial-three-pool-masters-seed{1,7}`. The two-entry Ash pool regressed M-11 master wins; the three-entry pool trial also made masters too difficult in several biomes. Keeping generated masters on `GEN_SP` restored the accepted master profile while retaining three signature specials on every ordinary biome wild pool.
